<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PaymentCompletionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentCompletionService $completion
    ) {
    }

    public function phonepeCallback(Request $request)
    {
        $merchantOrderId = $request->input('merchantOrderId')
            ?? $request->input('merchant_order_id')
            ?? $request->query('merchantOrderId')
            ?? $request->query('merchant_order_id');

        if (!$merchantOrderId) {
            return response()->json(['message' => 'merchantOrderId is required'], 422);
        }

        $payment = Payment::where('merchant_order_id', $merchantOrderId)->first();
        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        try {
            $payment = $this->completion->syncFromGateway($payment);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'payment' => $payment,
            ], 502);
        }

        return response()->json([
            'message' => 'Payment status synced',
            'payment' => $payment,
        ]);
    }

    public function checkStatus(string $merchantOrderId)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payment = Payment::where('merchant_order_id', $merchantOrderId)->firstOrFail();

        $ownsPayment = ($payment->player_id && $payment->player_id === $user->id)
            || ($payment->organizer_id && $payment->organizer_id === $user->id)
            || $user->isAdmin();

        if (!$ownsPayment) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            if ($payment->status === 'pending' && $payment->merchant_order_id) {
                $payment = $this->completion->syncFromGateway($payment);
            }
        } catch (\Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'payment' => $payment,
            ], 502);
        }

        return response()->json([
            'payment' => $payment->load(['tournament', 'subscription']),
        ]);
    }
}
