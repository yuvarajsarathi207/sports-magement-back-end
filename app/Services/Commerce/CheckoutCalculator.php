<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Coupon;
use App\Models\PlatformSetting;
use App\Models\User;
use RuntimeException;

class CheckoutCalculator
{
    public function __construct(
        protected CartService $cartService,
        protected DeliveryService $deliveryService
    ) {
    }

    public function validateAndQuote(User $user, ?string $couponCode = null, ?string $paymentMethod = null): array
    {
        if (!PlatformSetting::commerceEnabled()) {
            throw new RuntimeException('Commerce is currently disabled.');
        }

        $cart = $this->cartService->getCart($user);
        if (empty($cart['items'])) {
            throw new RuntimeException('Cart is empty.');
        }
        if (!empty($cart['issues'])) {
            throw new RuntimeException('Cart has invalid items. Please update your cart.');
        }

        $subtotal = 0.0;
        $taxAmount = 0.0;
        $discountAmount = 0.0;
        $lines = [];

        foreach ($cart['items'] as $item) {
            $unit = (float) $item['current_unit_price'];
            $qty = (int) $item['quantity'];
            $lineSubtotal = round($unit * $qty, 2);

            $variant = \App\Models\Commerce\ProductVariant::with('product')->find($item['product_variant_id']);
            $taxPercent = $variant ? $variant->effectiveTaxPercent() : 0;
            $lineTax = round($lineSubtotal * ($taxPercent / 100), 2);

            $lines[] = [
                'product_id' => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'],
                'product_name' => $item['product_name'],
                'variant_name' => $item['variant_name'],
                'sku' => $item['sku'],
                'size' => $variant?->size,
                'color' => $variant?->color,
                'quantity' => $qty,
                'unit_price' => $unit,
                'discount_amount' => 0,
                'tax_amount' => $lineTax,
                'line_total' => round($lineSubtotal + $lineTax, 2),
            ];

            $subtotal += $lineSubtotal;
            $taxAmount += $lineTax;
        }

        $coupon = null;
        $couponDiscount = 0.0;
        if ($couponCode) {
            $coupon = Coupon::whereRaw('LOWER(code) = ?', [strtolower(trim($couponCode))])->first();
            if (!$coupon || !$coupon->isCurrentlyValid()) {
                throw new RuntimeException('Invalid or expired coupon.');
            }
            $couponDiscount = $coupon->calculateDiscount($subtotal);
        }

        $afterDiscount = max(0, $subtotal - $discountAmount - $couponDiscount);
        $deliveryCharge = $this->deliveryService->calculateCharge($afterDiscount);
        $total = round($afterDiscount + $taxAmount + $deliveryCharge, 2);

        $paymentMethod = $paymentMethod ? strtolower($paymentMethod) : null;
        $paymentOptions = $this->availablePaymentMethods($total);
        if ($paymentMethod && !collect($paymentOptions)->contains(fn ($m) => $m['id'] === $paymentMethod && ($m['eligible'] ?? false))) {
            throw new RuntimeException('Selected payment method is not available.');
        }

        return [
            'items' => $lines,
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'discount_amount' => round($discountAmount, 2),
            'coupon_discount' => round($couponDiscount, 2),
            'coupon' => $coupon ? [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'name' => $coupon->name,
            ] : null,
            'delivery_charge' => round($deliveryCharge, 2),
            'total_amount' => $total,
            'estimated_delivery_days' => $this->deliveryService->estimateDeliveryDays(),
            'payment_methods' => $paymentOptions,
            'selected_payment_method' => $paymentMethod,
        ];
    }

    public function availablePaymentMethods(float $total): array
    {
        $methods = [];

        if (PlatformSetting::commerceCodEnabled()) {
            $min = PlatformSetting::commerceCodMinAmount();
            $max = PlatformSetting::commerceCodMaxAmount();
            $eligible = $total >= $min && ($max <= 0 || $total <= $max);
            $methods[] = [
                'id' => 'cod',
                'label' => 'Cash on Delivery',
                'eligible' => $eligible,
                'min_amount' => $min,
                'max_amount' => $max,
            ];
        }

        if (PlatformSetting::commerceOnlinePaymentEnabled()) {
            $methods[] = [
                'id' => 'phonepe',
                'label' => 'Online Payment (PhonePe)',
                'eligible' => true,
            ];
        }

        return $methods;
    }
}
