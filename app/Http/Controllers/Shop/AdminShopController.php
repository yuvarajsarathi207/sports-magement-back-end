<?php

namespace App\Http\Controllers\Shop;

use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Tournament;
use App\Models\User;
use App\Services\Payment\PaymentGatewayManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminShopController extends ShopController
{
    public function __construct(private PaymentGatewayManager $payments)
    {
    }

    public function dashboard()
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $revenue = Order::whereNotIn('status', ['cancelled', 'refunded'])->sum('grand_total');

        return response()->json([
            'stats' => [
                'total_users' => User::count(),
                'total_orders' => Order::count(),
                'total_revenue' => round((float) $revenue, 2),
                'total_products' => Product::count(),
                'total_categories' => ProductCategory::count(),
                'active_tournaments' => Tournament::publishedForPlayers()->count(),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'blocked_users' => User::where('is_blocked', true)->count(),
            ],
            'sales_by_day' => Order::selectRaw('DATE(created_at) as day, COUNT(*) as orders, SUM(grand_total) as revenue')
                ->where('created_at', '>=', now()->subDays(14))
                ->whereNotIn('status', ['cancelled'])
                ->groupBy('day')
                ->orderBy('day')
                ->get(),
            'recent_orders' => Order::with('user:id,name,email')->latest()->limit(10)->get(),
        ]);
    }

    public function orders(Request $request)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $query = Order::with(['user:id,name,email,mobile', 'latestPayment'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(30));
    }

    public function showOrder($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        return response()->json(
            Order::with(['items.product', 'latestPayment', 'statusHistories.changedBy', 'user'])
                ->findOrFail($id)
        );
    }

    public function updateOrderStatus(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $data = $request->validate([
            'status' => 'required|in:' . implode(',', Order::STATUSES),
            'note' => 'nullable|string|max:500',
        ]);

        $order = Order::findOrFail($id);

        DB::transaction(function () use ($order, $data, $admin) {
            $order->update(['status' => $data['status']]);
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => $data['status'],
                'note' => $data['note'] ?? 'Status updated by admin',
                'changed_by' => $admin->id,
            ]);
        });

        return response()->json($order->fresh(['statusHistories', 'latestPayment']));
    }

    public function refundOrder(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $order = Order::with('latestPayment')->findOrFail($id);
        $payment = $order->latestPayment;

        if (!$payment || $payment->status !== 'paid') {
            return response()->json(['message' => 'No paid payment to refund'], 422);
        }

        $result = $this->payments->driver($payment->payment_method)->refund($order, [
            'transaction_id' => $payment->transaction_id,
        ]);

        DB::transaction(function () use ($order, $payment, $result, $admin) {
            $payment->update([
                'status' => 'refunded',
                'gateway_response' => array_merge($payment->gateway_response ?? [], $result['gateway_response']),
            ]);
            $order->update(['status' => 'refunded']);
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'refunded',
                'note' => 'Refund processed',
                'changed_by' => $admin->id,
            ]);

            foreach ($order->items as $item) {
                if ($item->product_id) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
            }
        });

        return response()->json($order->fresh(['latestPayment', 'statusHistories']));
    }

    public function customers(Request $request)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $query = User::query()->latest();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($builder) use ($q) {
                $builder->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('mobile', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate(30));
    }

    public function blockUser($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $user = User::findOrFail($id);
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot block admin users'], 422);
        }

        $user->update(['is_blocked' => true, 'blocked_at' => now()]);
        $user->tokens()->delete();

        return response()->json($user);
    }

    public function unblockUser($id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $user = User::findOrFail($id);
        $user->update(['is_blocked' => false, 'blocked_at' => null]);

        return response()->json($user);
    }

    public function resetPassword(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $data = $request->validate([
            'password' => 'nullable|string|min:8',
        ]);

        $user = User::findOrFail($id);
        $password = $data['password'] ?? Str::random(10);
        $user->update(['password' => Hash::make($password)]);
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password reset',
            'temporary_password' => $password,
            'user' => $user,
        ]);
    }

    public function featureTournament(Request $request, $id)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $tournament = Tournament::findOrFail($id);
        // Soft feature via banner type tournament using redirect to tournament detail
        return response()->json([
            'message' => 'Use Banner module with type=tournament and redirect_link pointing to the tournament',
            'tournament' => $tournament->only(['id', 'team_name', 'status']),
        ]);
    }

    public function reports(Request $request)
    {
        $admin = $this->adminUser();
        if ($admin instanceof \Illuminate\Http\JsonResponse) {
            return $admin;
        }

        $type = $request->get('type', 'sales');

        return response()->json(match ($type) {
            'revenue' => [
                'type' => 'revenue',
                'total' => Order::whereNotIn('status', ['cancelled', 'refunded'])->sum('grand_total'),
                'by_status' => Order::selectRaw('status, SUM(grand_total) as total, COUNT(*) as count')
                    ->groupBy('status')->get(),
            ],
            'products' => [
                'type' => 'products',
                'top_selling' => DB::table('order_items')
                    ->select('product_id', 'product_name', DB::raw('SUM(quantity) as sold'), DB::raw('SUM(total) as revenue'))
                    ->groupBy('product_id', 'product_name')
                    ->orderByDesc('sold')
                    ->limit(20)
                    ->get(),
            ],
            'users' => [
                'type' => 'users',
                'by_role' => User::selectRaw('role, COUNT(*) as count')->groupBy('role')->get(),
                'new_last_30_days' => User::where('created_at', '>=', now()->subDays(30))->count(),
            ],
            default => [
                'type' => 'sales',
                'orders' => Order::selectRaw('DATE(created_at) as day, COUNT(*) as orders, SUM(grand_total) as revenue')
                    ->where('created_at', '>=', now()->subDays(30))
                    ->groupBy('day')
                    ->orderBy('day')
                    ->get(),
            ],
        });
    }
}
