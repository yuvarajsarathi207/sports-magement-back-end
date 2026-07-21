<?php

namespace App\Http\Controllers\Shop;

use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\OrderStatusHistory;
use App\Services\Payment\PaymentGatewayManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends ShopController
{
    public function __construct(private PaymentGatewayManager $payments)
    {
    }

    public function methods()
    {
        return response()->json([
            'methods' => $this->payments->available(),
            'default' => config('shop.default_payment'),
        ]);
    }

    public function confirm(Request $request, $orderId)
    {
        $user = $this->shopUser();
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $data = $request->validate([
            'transaction_id' => 'nullable|string|max:255',
            'gateway_payload' => 'nullable|array',
        ]);

        $order = Order::with('latestPayment')
            ->where('user_id', $user->id)
            ->findOrFail($orderId);

        $payment = $order->latestPayment;
        if (!$payment) {
            return response()->json(['message' => 'No payment found'], 404);
        }

        if ($payment->status === 'paid') {
            return response()->json($order->load(['items', 'latestPayment']));
        }

        $gateway = $this->payments->driver($payment->payment_method);
        $result = $gateway->verify($order, array_merge($data['gateway_payload'] ?? [], [
            'transaction_id' => $data['transaction_id'] ?? $payment->transaction_id,
        ]));

        DB::transaction(function () use ($payment, $result, $order, $user) {
            $payment->update([
                'status' => $result['status'],
                'transaction_id' => $result['transaction_id'] ?? $payment->transaction_id,
                'gateway_response' => $result['gateway_response'],
            ]);

            if ($result['status'] === 'paid' && $order->status === 'pending') {
                $order->update(['status' => 'confirmed']);
                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status' => 'confirmed',
                    'note' => 'Payment confirmed',
                    'changed_by' => $user->id,
                ]);
            }
        });

        return response()->json($order->fresh(['items', 'latestPayment', 'statusHistories']));
    }
}
