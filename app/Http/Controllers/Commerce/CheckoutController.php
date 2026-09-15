<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\Order;
use App\Models\PlatformSetting;
use App\Services\Commerce\CheckoutCalculator;
use App\Services\Commerce\OrderService;
use App\Services\Commerce\Payments\CommercePaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutCalculator $checkoutCalculator,
        protected OrderService $orderService,
        protected CommercePaymentService $paymentService
    ) {
        $this->middleware('auth:sanctum')->except(['webhook']);
    }

    public function validateCheckout(Request $request)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'coupon_code' => 'nullable|string|max:50',
            'payment_method' => 'nullable|in:cod,phonepe',
        ]);

        try {
            $quote = $this->checkoutCalculator->validateAndQuote(
                Auth::user(),
                $data['coupon_code'] ?? null,
                $data['payment_method'] ?? null
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($quote);
    }

    public function checkout(Request $request)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'shipping_address_id' => 'required|integer|exists:user_addresses,id',
            'payment_method' => 'required|in:cod,phonepe',
            'coupon_code' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
            'idempotency_key' => 'nullable|string|max:100',
        ]);

        try {
            $result = $this->orderService->checkout(Auth::user(), $data);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($result, 201);
    }

    public function orders()
    {
        $this->ensureShopper();
        $orders = Order::with(['items', 'payments', 'shipments'])
            ->where('user_id', Auth::id())
            ->latest('id')
            ->paginate(20);

        return response()->json($orders);
    }

    public function showOrder(int $id)
    {
        $this->ensureShopper();
        $order = Order::with(['items', 'payments', 'shipments', 'returns'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json(['order' => $order]);
    }

    public function cancelOrder(Request $request, int $id)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $order = Order::where('user_id', Auth::id())->findOrFail($id);

        try {
            $order = $this->orderService->cancelByUser($order, Auth::user(), $data['reason'] ?? null);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['order' => $order]);
    }

    public function returnOrder(Request $request, int $id)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $order = Order::where('user_id', Auth::id())->findOrFail($id);

        try {
            $return = $this->orderService->requestReturn($order, Auth::user(), $data['reason'] ?? null);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['return' => $return, 'order' => $order->fresh()]);
    }

    public function verifyPayment(Request $request)
    {
        $this->ensureShopper();
        $data = $request->validate([
            'merchant_order_id' => 'required|string',
        ]);

        $payment = $this->paymentService->findByMerchantOrderId($data['merchant_order_id']);
        if (!$payment || $payment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        try {
            $payment = $this->paymentService->syncByMerchantOrderId($data['merchant_order_id'], $this->orderService);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json([
            'payment' => $payment->fresh(),
            'order' => $payment->order()->with(['items', 'payments', 'shipments'])->first(),
        ]);
    }

    public function webhook(Request $request)
    {
        $merchantOrderId = $request->input('merchantOrderId')
            ?? $request->input('merchant_order_id')
            ?? $request->query('merchantOrderId')
            ?? $request->query('merchant_order_id');

        if (!$merchantOrderId) {
            return response()->json(['message' => 'merchantOrderId is required'], 422);
        }

        $payment = $this->paymentService->findByMerchantOrderId($merchantOrderId);
        if (!$payment) {
            return response()->json(['message' => 'Commerce payment not found'], 404);
        }

        try {
            $payment = $this->paymentService->syncByMerchantOrderId($merchantOrderId, $this->orderService);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json([
            'message' => 'Commerce payment synced',
            'payment' => $payment,
        ]);
    }

    protected function ensureShopper(): void
    {
        if (!PlatformSetting::commerceEnabled()) {
            abort(503, 'Commerce is currently disabled.');
        }
        $user = Auth::user();
        if (!$user || (!$user->isPlayer() && !$user->isOrganizer())) {
            abort(403, 'Unauthorized');
        }
    }
}
