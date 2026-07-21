<?php

namespace App\Http\Controllers\Shop;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Services\Payment\PaymentGatewayManager;
use App\Services\Shop\CartCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends ShopController
{
    public function __construct(
        private CartCalculator $calculator,
        private PaymentGatewayManager $payments,
    ) {
    }

    public function index(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $orders = Order::with(['items', 'latestPayment'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(20);

        return response()->json($orders);
    }

    public function show(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $order = Order::with(['items.product.images', 'latestPayment', 'statusHistories'])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json($order);
    }

    public function store(Request $request)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $data = $request->validate([
            'address_id' => 'required|exists:addresses,id',
            'payment_method' => 'required|in:razorpay,phonepe,cod',
        ]);

        $address = Address::where('user_id', $user->id)->findOrFail($data['address_id']);
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $summary = $this->calculator->summarize($cart);

        if (empty($summary['items'])) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        foreach ($summary['items'] as $line) {
            $product = Product::find($line['product_id']);
            if (!$product || $product->stock < $line['quantity']) {
                return response()->json([
                    'message' => "Insufficient stock for {$line['name']}",
                ], 422);
            }
        }

        $order = DB::transaction(function () use ($user, $address, $summary, $data) {
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'address_id' => $address->id,
                'shipping_address' => $address->toShippingArray(),
                'subtotal' => $summary['product_total'],
                'discount' => $summary['discount'],
                'tax' => $summary['tax'],
                'shipping' => $summary['shipping'],
                'grand_total' => $summary['grand_total'],
                'status' => 'pending',
            ]);

            foreach ($summary['items'] as $line) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $line['product_id'],
                    'product_name' => $line['name'],
                    'sku' => $line['sku'],
                    'unit_price' => $line['unit_price'],
                    'discount' => $line['line_discount'],
                    'quantity' => $line['quantity'],
                    'total' => $line['line_total'],
                ]);

                Product::where('id', $line['product_id'])->decrement('stock', $line['quantity']);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'pending',
                'note' => 'Order placed',
                'changed_by' => $user->id,
            ]);

            $gateway = $this->payments->driver($data['payment_method']);
            $result = $gateway->initiate($order);

            OrderPayment::create([
                'order_id' => $order->id,
                'payment_method' => $data['payment_method'],
                'status' => $result['status'],
                'transaction_id' => $result['transaction_id'],
                'amount' => $order->grand_total,
                'gateway_response' => $result['gateway_response'],
            ]);

            if ($data['payment_method'] === 'cod') {
                $order->update(['status' => 'confirmed']);
                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status' => 'confirmed',
                    'note' => 'Confirmed with Cash on Delivery',
                    'changed_by' => $user->id,
                ]);
            }

            $cart = Cart::where('user_id', $user->id)->first();
            if ($cart) {
                $cart->activeItems()->delete();
            }

            return $order->load(['items', 'latestPayment', 'statusHistories']);
        });

        return response()->json($order, 201);
    }

    public function cancel(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $data = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $order = Order::where('user_id', $user->id)->findOrFail($id);

        if (!in_array($order->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => 'Order cannot be cancelled at this stage'], 422);
        }

        DB::transaction(function () use ($order, $data, $user) {
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
            }

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => $data['reason'] ?? null,
                'cancelled_at' => now(),
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'cancelled',
                'note' => $data['reason'] ?? 'Cancelled by customer',
                'changed_by' => $user->id,
            ]);
        });

        return response()->json($order->fresh(['items', 'latestPayment', 'statusHistories']));
    }

    public function track(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $order = Order::with('statusHistories')
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'timeline' => $order->statusHistories,
        ]);
    }

    public function invoice(Request $request, $id)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $order = Order::with(['items', 'latestPayment', 'user'])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'invoice' => [
                'invoice_number' => 'INV-' . $order->order_number,
                'issued_at' => $order->created_at,
                'order' => $order,
                'seller' => [
                    'name' => 'Keep Playing',
                    'email' => 'support@keepplaying.app',
                ],
            ],
        ]);
    }
}
