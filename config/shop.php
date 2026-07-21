<?php

return [
    'tax_rate' => (float) env('SHOP_TAX_RATE', 0.05),
    'shipping_flat' => (float) env('SHOP_SHIPPING_FLAT', 49),
    'free_shipping_min' => (float) env('SHOP_FREE_SHIPPING_MIN', 999),
    'default_payment' => env('SHOP_DEFAULT_PAYMENT', 'razorpay'),
];
