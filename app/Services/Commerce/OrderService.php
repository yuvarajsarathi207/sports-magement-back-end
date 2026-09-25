<?php

namespace App\Services\Commerce;

use App\Models\Commerce\CommercePayment;
use App\Models\Commerce\Coupon;
use App\Models\Commerce\CouponUsage;
use App\Models\Commerce\Order;
use App\Models\Commerce\OrderItem;
use App\Models\Commerce\OrderReturn;
use App\Models\Commerce\Refund;
use App\Models\Commerce\Shipment;
use App\Models\Commerce\UserAddress;
use App\Models\User;
use App\Services\Commerce\Payments\CommercePaymentService;
use App\Services\Platform\PaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    public function __construct(
        protected CheckoutCalculator $checkoutCalculator,
        protected CartService $cartService,
        protected InventoryService $inventoryService,
        protected CommercePaymentService $paymentService,
        protected DeliveryService $deliveryService,
        protected PaymentService $platformPayments
    ) {
    }

    public function checkout(User $user, array $payload): array
    {
        $paymentMethod = strtolower((string) ($payload['payment_method'] ?? ''));
        $addressId = (int) ($payload['shipping_address_id'] ?? 0);
        $couponCode = $payload['coupon_code'] ?? null;
        $idempotencyKey = $payload['idempotency_key'] ?? null;
        $notes = $payload['notes'] ?? null;

        if ($idempotencyKey) {
            $existing = Order::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $this->orderPayload($existing->fresh(['items', 'payments', 'shipments']));
            }
        }

        $address = UserAddress::where('user_id', $user->id)->whereKey($addressId)->firstOrFail();
        $quote = $this->checkoutCalculator->validateAndQuote($user, $couponCode, $paymentMethod);

        return DB::transaction(function () use ($user, $quote, $paymentMethod, $address, $idempotencyKey, $notes, $couponCode) {
            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $user->id,
                'status' => $paymentMethod === Order::METHOD_COD
                    ? Order::STATUS_CONFIRMED
                    : Order::STATUS_PAYMENT_PENDING,
                'payment_status' => $paymentMethod === Order::METHOD_COD
                    ? Order::PAYMENT_PENDING
                    : Order::PAYMENT_PENDING,
                'payment_method' => $paymentMethod,
                'subtotal' => $quote['subtotal'],
                'tax_amount' => $quote['tax_amount'],
                'discount_amount' => $quote['discount_amount'],
                'coupon_discount' => $quote['coupon_discount'],
                'delivery_charge' => $quote['delivery_charge'],
                'total_amount' => $quote['total_amount'],
                'coupon_id' => $quote['coupon']['id'] ?? null,
                'coupon_code' => $quote['coupon']['code'] ?? $couponCode,
                'shipping_address' => $address->toSnapshot(),
                'billing_address' => $address->toSnapshot(),
                'shipping_address_id' => $address->id,
                'notes' => $notes,
                'idempotency_key' => $idempotencyKey,
            ]);

            foreach ($quote['items'] as $line) {
                OrderItem::create(array_merge($line, ['order_id' => $order->id]));
                $this->inventoryService->reserve(
                    $line['product_variant_id'],
                    $line['quantity'],
                    $user->id,
                    $order->id,
                    ($idempotencyKey ?: $order->order_number) . ':var:' . $line['product_variant_id']
                );
            }

            if (!empty($quote['coupon']['id'])) {
                Coupon::whereKey($quote['coupon']['id'])->increment('used_count');
                CouponUsage::create([
                    'coupon_id' => $quote['coupon']['id'],
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'discount_amount' => $quote['coupon_discount'],
                ]);
            }

            Shipment::create([
                'order_id' => $order->id,
                'provider' => 'manual',
                'status' => Shipment::STATUS_PENDING,
                'delivery_charge' => $quote['delivery_charge'],
                'estimated_delivery_at' => now()->addDays($quote['estimated_delivery_days']),
            ]);

            $paymentResult = $this->paymentService->initiate($order, $user, $paymentMethod);

            $this->platformPayments->createIntent(
                $order,
                $user,
                'shop',
                (float) $order->total_amount,
                $paymentMethod,
                'order_' . $order->order_number,
                ['order_number' => $order->order_number]
            );

            if ($paymentMethod === Order::METHOD_COD) {
                $this->inventoryService->consumeOrderReservations($order->id);
            }

            $this->cartService->clear($user);

            Log::info('Commerce order created', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'payment_method' => $paymentMethod,
                'total' => $order->total_amount,
            ]);

            return array_merge(
                $this->orderPayload($order->fresh(['items', 'payments', 'shipments'])),
                ['payment' => $paymentResult]
            );
        });
    }

    public function transition(Order $order, string $newStatus, ?int $adminId = null): Order
    {
        if (!$order->canTransitionTo($newStatus)) {
            throw new RuntimeException("Cannot transition order from {$order->status} to {$newStatus}.");
        }

        $order->status = $newStatus;

        if ($newStatus === Order::STATUS_CANCELLED) {
            $order->cancelled_at = now();
            $this->inventoryService->releaseOrderReservations($order->id, 'order_cancelled');
            if ($order->payment_method === Order::METHOD_COD
                && in_array($order->getOriginal('status'), [Order::STATUS_CONFIRMED, Order::STATUS_PROCESSING, Order::STATUS_PACKED], true)) {
                // COD already consumed stock — restock
                foreach ($order->items as $item) {
                    $this->inventoryService->returnStock(
                        $item->product_variant_id,
                        $item->quantity,
                        $adminId,
                        'Order cancelled restock'
                    );
                }
            }
        }

        if ($newStatus === Order::STATUS_SHIPPED) {
            $shipment = $order->shipments()->latest('id')->first();
            if ($shipment) {
                $shipment->update([
                    'status' => Shipment::STATUS_SHIPPED,
                    'shipped_at' => now(),
                ]);
            }
        }

        if ($newStatus === Order::STATUS_DELIVERED) {
            $shipment = $order->shipments()->latest('id')->first();
            if ($shipment) {
                $shipment->update([
                    'status' => Shipment::STATUS_DELIVERED,
                    'delivered_at' => now(),
                ]);
            }
            if ($order->payment_method === Order::METHOD_COD) {
                $order->payment_status = Order::PAYMENT_SUCCESS;
                $order->payments()->where('provider', CommercePayment::PROVIDER_COD)->update([
                    'status' => CommercePayment::STATUS_SUCCESS,
                    'paid_at' => now(),
                ]);
            }
        }

        $order->save();

        return $order->fresh(['items', 'payments', 'shipments']);
    }

    public function cancelByUser(Order $order, User $user, ?string $reason = null): Order
    {
        if ($order->user_id !== $user->id) {
            throw new RuntimeException('Unauthorized.');
        }

        $cancellable = [Order::STATUS_CREATED, Order::STATUS_PAYMENT_PENDING, Order::STATUS_CONFIRMED];
        if (!in_array($order->status, $cancellable, true)) {
            throw new RuntimeException('Order cannot be cancelled at this stage.');
        }

        $order->cancellation_reason = $reason;
        $order->save();

        return $this->transition($order, Order::STATUS_CANCELLED, $user->id);
    }

    public function requestReturn(Order $order, User $user, ?string $reason = null): OrderReturn
    {
        if ($order->user_id !== $user->id) {
            throw new RuntimeException('Unauthorized.');
        }
        if ($order->status !== Order::STATUS_DELIVERED) {
            throw new RuntimeException('Only delivered orders can be returned.');
        }

        $return = OrderReturn::create([
            'order_id' => $order->id,
            'user_id' => $user->id,
            'status' => OrderReturn::STATUS_REQUESTED,
            'reason' => $reason,
            'items' => $order->items->map(fn ($i) => [
                'order_item_id' => $i->id,
                'sku' => $i->sku,
                'quantity' => $i->quantity,
            ])->all(),
        ]);

        $this->transition($order, Order::STATUS_RETURN_REQUESTED, $user->id);

        return $return;
    }

    public function markPaymentSuccess(Order $order, CommercePayment $payment): Order
    {
        return DB::transaction(function () use ($order, $payment) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($order->payment_status === Order::PAYMENT_SUCCESS
                && $order->status === Order::STATUS_CONFIRMED) {
                return $order;
            }

            $payment->status = CommercePayment::STATUS_SUCCESS;
            $payment->paid_at = $payment->paid_at ?: now();
            $payment->save();

            $order->payment_status = Order::PAYMENT_SUCCESS;
            $order->status = Order::STATUS_CONFIRMED;
            $order->save();

            $this->inventoryService->consumeOrderReservations($order->id);

            Log::info('Commerce payment success', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
            ]);

            return $order->fresh(['items', 'payments', 'shipments']);
        });
    }

    public function markPaymentFailed(Order $order, CommercePayment $payment): Order
    {
        return DB::transaction(function () use ($order, $payment) {
            $order = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($order->payment_status === Order::PAYMENT_SUCCESS) {
                return $order;
            }

            $payment->status = CommercePayment::STATUS_FAILED;
            $payment->save();

            $order->payment_status = Order::PAYMENT_FAILED;
            $order->save();

            return $order->fresh(['items', 'payments']);
        });
    }

    public function createRefund(Order $order, float $amount, ?int $returnId = null, ?string $notes = null): Refund
    {
        $payment = $order->payments()->where('status', CommercePayment::STATUS_SUCCESS)->latest('id')->first();

        $refund = Refund::create([
            'order_id' => $order->id,
            'commerce_payment_id' => $payment?->id,
            'order_return_id' => $returnId,
            'amount' => $amount,
            'status' => Refund::STATUS_INITIATED,
            'notes' => $notes,
        ]);

        if ($order->canTransitionTo(Order::STATUS_REFUND_PENDING)) {
            $order->status = Order::STATUS_REFUND_PENDING;
            $order->save();
        }

        // MVP: mark completed for COD / manual; PhonePe refund stub
        $refund->status = Refund::STATUS_COMPLETED;
        $refund->save();

        $order->payment_status = Order::PAYMENT_REFUNDED;
        if ($order->canTransitionTo(Order::STATUS_REFUNDED)) {
            $order->status = Order::STATUS_REFUNDED;
        }
        $order->save();

        if ($payment) {
            $payment->status = CommercePayment::STATUS_REFUNDED;
            $payment->save();
        }

        foreach ($order->items as $item) {
            $this->inventoryService->returnStock($item->product_variant_id, $item->quantity, null, 'Refund restock');
        }

        return $refund;
    }

    public function orderPayload(Order $order): array
    {
        return [
            'order' => $order,
        ];
    }

    protected function generateOrderNumber(): string
    {
        return 'KP-C-' . now()->format('Ymd') . '-' . Str::upper(Str::random(8));
    }
}
