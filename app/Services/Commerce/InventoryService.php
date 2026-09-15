<?php

namespace App\Services\Commerce;

use App\Models\Commerce\InventoryReservation;
use App\Models\Commerce\InventoryTransaction;
use App\Models\Commerce\ProductVariant;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class InventoryService
{
    public function stockIn(int $variantId, int $quantity, ?int $userId = null, ?string $notes = null, ?string $idempotencyKey = null): ProductVariant
    {
        return $this->adjustAvailable($variantId, $quantity, InventoryTransaction::TYPE_STOCK_IN, $userId, $notes, $idempotencyKey);
    }

    public function stockOut(int $variantId, int $quantity, ?int $userId = null, ?string $notes = null, ?string $idempotencyKey = null): ProductVariant
    {
        return $this->adjustAvailable($variantId, -$quantity, InventoryTransaction::TYPE_STOCK_OUT, $userId, $notes, $idempotencyKey);
    }

    public function adjust(int $variantId, int $newAvailable, ?int $userId = null, ?string $notes = null, ?string $idempotencyKey = null): ProductVariant
    {
        return DB::transaction(function () use ($variantId, $newAvailable, $userId, $notes, $idempotencyKey) {
            if ($idempotencyKey) {
                $existing = InventoryTransaction::where('idempotency_key', $idempotencyKey)->first();
                if ($existing) {
                    return ProductVariant::findOrFail($variantId);
                }
            }

            $variant = ProductVariant::whereKey($variantId)->lockForUpdate()->firstOrFail();
            if ($newAvailable < 0) {
                throw new RuntimeException('Available quantity cannot be negative.');
            }

            $delta = $newAvailable - (int) $variant->available_quantity;
            $beforeAvailable = (int) $variant->available_quantity;
            $beforeReserved = (int) $variant->reserved_quantity;

            $variant->available_quantity = $newAvailable;
            if ($newAvailable === 0 && $variant->status === ProductVariant::STATUS_ACTIVE) {
                $variant->status = ProductVariant::STATUS_OUT_OF_STOCK;
            } elseif ($newAvailable > 0 && $variant->status === ProductVariant::STATUS_OUT_OF_STOCK) {
                $variant->status = ProductVariant::STATUS_ACTIVE;
            }
            $variant->save();

            InventoryTransaction::create([
                'product_variant_id' => $variant->id,
                'type' => InventoryTransaction::TYPE_ADJUSTMENT,
                'quantity' => $delta,
                'available_before' => $beforeAvailable,
                'available_after' => (int) $variant->available_quantity,
                'reserved_before' => $beforeReserved,
                'reserved_after' => (int) $variant->reserved_quantity,
                'user_id' => $userId,
                'notes' => $notes,
                'idempotency_key' => $idempotencyKey,
            ]);

            Log::info('Inventory adjusted', [
                'variant_id' => $variant->id,
                'delta' => $delta,
                'available_after' => $variant->available_quantity,
            ]);

            return $variant->fresh();
        });
    }

    public function reserve(int $variantId, int $quantity, int $userId, ?int $orderId = null, ?string $idempotencyKey = null): InventoryReservation
    {
        if ($quantity <= 0) {
            throw new RuntimeException('Reservation quantity must be positive.');
        }

        return DB::transaction(function () use ($variantId, $quantity, $userId, $orderId, $idempotencyKey) {
            if ($idempotencyKey) {
                $existing = InventoryReservation::where('idempotency_key', $idempotencyKey)->first();
                if ($existing) {
                    return $existing;
                }
            }

            $this->expireReservationsForVariant($variantId);

            $variant = ProductVariant::whereKey($variantId)->lockForUpdate()->firstOrFail();
            if ($variant->status !== ProductVariant::STATUS_ACTIVE) {
                throw new RuntimeException('Variant is not available for sale.');
            }
            if ((int) $variant->available_quantity < $quantity) {
                throw new RuntimeException('Insufficient stock for reservation.');
            }

            $beforeAvailable = (int) $variant->available_quantity;
            $beforeReserved = (int) $variant->reserved_quantity;

            $variant->available_quantity = $beforeAvailable - $quantity;
            $variant->reserved_quantity = $beforeReserved + $quantity;
            if ($variant->available_quantity === 0) {
                $variant->status = ProductVariant::STATUS_OUT_OF_STOCK;
            }
            $variant->save();

            $reservation = InventoryReservation::create([
                'product_variant_id' => $variant->id,
                'user_id' => $userId,
                'order_id' => $orderId,
                'quantity' => $quantity,
                'status' => InventoryReservation::STATUS_ACTIVE,
                'expires_at' => now()->addMinutes(PlatformSetting::commerceReservationTtlMinutes()),
                'idempotency_key' => $idempotencyKey,
            ]);

            InventoryTransaction::create([
                'product_variant_id' => $variant->id,
                'type' => InventoryTransaction::TYPE_RESERVATION,
                'quantity' => -$quantity,
                'available_before' => $beforeAvailable,
                'available_after' => (int) $variant->available_quantity,
                'reserved_before' => $beforeReserved,
                'reserved_after' => (int) $variant->reserved_quantity,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $reservation->id,
                'user_id' => $userId,
                'idempotency_key' => $idempotencyKey ? $idempotencyKey . ':txn' : null,
            ]);

            Log::info('Inventory reserved', [
                'variant_id' => $variant->id,
                'quantity' => $quantity,
                'reservation_id' => $reservation->id,
                'order_id' => $orderId,
            ]);

            return $reservation;
        });
    }

    public function consumeReservation(InventoryReservation $reservation): void
    {
        DB::transaction(function () use ($reservation) {
            $reservation = InventoryReservation::whereKey($reservation->id)->lockForUpdate()->firstOrFail();
            if ($reservation->status !== InventoryReservation::STATUS_ACTIVE) {
                return;
            }

            $variant = ProductVariant::whereKey($reservation->product_variant_id)->lockForUpdate()->firstOrFail();
            $beforeAvailable = (int) $variant->available_quantity;
            $beforeReserved = (int) $variant->reserved_quantity;
            $qty = (int) $reservation->quantity;

            if ($beforeReserved < $qty) {
                throw new RuntimeException('Reserved quantity mismatch while consuming reservation.');
            }

            $variant->reserved_quantity = $beforeReserved - $qty;
            $variant->sold_quantity = (int) $variant->sold_quantity + $qty;
            $variant->save();

            $reservation->status = InventoryReservation::STATUS_CONSUMED;
            $reservation->save();

            InventoryTransaction::create([
                'product_variant_id' => $variant->id,
                'type' => InventoryTransaction::TYPE_SALE,
                'quantity' => -$qty,
                'available_before' => $beforeAvailable,
                'available_after' => $beforeAvailable,
                'reserved_before' => $beforeReserved,
                'reserved_after' => (int) $variant->reserved_quantity,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $reservation->id,
                'user_id' => $reservation->user_id,
            ]);
        });
    }

    public function releaseReservation(InventoryReservation $reservation, string $reason = 'released'): void
    {
        DB::transaction(function () use ($reservation, $reason) {
            $reservation = InventoryReservation::whereKey($reservation->id)->lockForUpdate()->firstOrFail();
            if ($reservation->status !== InventoryReservation::STATUS_ACTIVE) {
                return;
            }

            $variant = ProductVariant::whereKey($reservation->product_variant_id)->lockForUpdate()->firstOrFail();
            $beforeAvailable = (int) $variant->available_quantity;
            $beforeReserved = (int) $variant->reserved_quantity;
            $qty = (int) $reservation->quantity;

            $variant->reserved_quantity = max(0, $beforeReserved - $qty);
            $variant->available_quantity = $beforeAvailable + $qty;
            if ($variant->available_quantity > 0 && $variant->status === ProductVariant::STATUS_OUT_OF_STOCK) {
                $variant->status = ProductVariant::STATUS_ACTIVE;
            }
            $variant->save();

            $reservation->status = $reason === 'expired'
                ? InventoryReservation::STATUS_EXPIRED
                : InventoryReservation::STATUS_RELEASED;
            $reservation->save();

            InventoryTransaction::create([
                'product_variant_id' => $variant->id,
                'type' => InventoryTransaction::TYPE_RELEASE,
                'quantity' => $qty,
                'available_before' => $beforeAvailable,
                'available_after' => (int) $variant->available_quantity,
                'reserved_before' => $beforeReserved,
                'reserved_after' => (int) $variant->reserved_quantity,
                'reference_type' => InventoryReservation::class,
                'reference_id' => $reservation->id,
                'user_id' => $reservation->user_id,
                'notes' => $reason,
            ]);

            Log::info('Inventory reservation released', [
                'reservation_id' => $reservation->id,
                'reason' => $reason,
            ]);
        });
    }

    public function releaseOrderReservations(int $orderId, string $reason = 'order_cancelled'): void
    {
        $reservations = InventoryReservation::where('order_id', $orderId)
            ->where('status', InventoryReservation::STATUS_ACTIVE)
            ->get();

        foreach ($reservations as $reservation) {
            $this->releaseReservation($reservation, $reason);
        }
    }

    public function consumeOrderReservations(int $orderId): void
    {
        $reservations = InventoryReservation::where('order_id', $orderId)
            ->where('status', InventoryReservation::STATUS_ACTIVE)
            ->get();

        foreach ($reservations as $reservation) {
            $this->consumeReservation($reservation);
        }
    }

    public function returnStock(int $variantId, int $quantity, ?int $userId = null, ?string $notes = null): ProductVariant
    {
        return DB::transaction(function () use ($variantId, $quantity, $userId, $notes) {
            $variant = ProductVariant::whereKey($variantId)->lockForUpdate()->firstOrFail();
            $beforeAvailable = (int) $variant->available_quantity;
            $beforeReserved = (int) $variant->reserved_quantity;

            $variant->available_quantity = $beforeAvailable + $quantity;
            $variant->returned_quantity = (int) $variant->returned_quantity + $quantity;
            if ($variant->available_quantity > 0 && $variant->status === ProductVariant::STATUS_OUT_OF_STOCK) {
                $variant->status = ProductVariant::STATUS_ACTIVE;
            }
            $variant->save();

            InventoryTransaction::create([
                'product_variant_id' => $variant->id,
                'type' => InventoryTransaction::TYPE_RETURN,
                'quantity' => $quantity,
                'available_before' => $beforeAvailable,
                'available_after' => (int) $variant->available_quantity,
                'reserved_before' => $beforeReserved,
                'reserved_after' => $beforeReserved,
                'user_id' => $userId,
                'notes' => $notes,
            ]);

            return $variant->fresh();
        });
    }

    public function markDamaged(int $variantId, int $quantity, ?int $userId = null, ?string $notes = null): ProductVariant
    {
        return $this->adjustAvailable($variantId, -$quantity, InventoryTransaction::TYPE_DAMAGE, $userId, $notes, null, true);
    }

    public function expireDueReservations(): int
    {
        $count = 0;
        $due = InventoryReservation::where('status', InventoryReservation::STATUS_ACTIVE)
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($due as $reservation) {
            $this->releaseReservation($reservation, 'expired');
            $count++;
        }

        return $count;
    }

    protected function expireReservationsForVariant(int $variantId): void
    {
        $due = InventoryReservation::where('product_variant_id', $variantId)
            ->where('status', InventoryReservation::STATUS_ACTIVE)
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($due as $reservation) {
            $this->releaseReservation($reservation, 'expired');
        }
    }

    protected function adjustAvailable(
        int $variantId,
        int $delta,
        string $type,
        ?int $userId = null,
        ?string $notes = null,
        ?string $idempotencyKey = null,
        bool $trackDamaged = false
    ): ProductVariant {
        return DB::transaction(function () use ($variantId, $delta, $type, $userId, $notes, $idempotencyKey, $trackDamaged) {
            if ($idempotencyKey) {
                $existing = InventoryTransaction::where('idempotency_key', $idempotencyKey)->first();
                if ($existing) {
                    return ProductVariant::findOrFail($variantId);
                }
            }

            $variant = ProductVariant::whereKey($variantId)->lockForUpdate()->firstOrFail();
            $beforeAvailable = (int) $variant->available_quantity;
            $beforeReserved = (int) $variant->reserved_quantity;
            $after = $beforeAvailable + $delta;

            if ($after < 0) {
                throw new RuntimeException('Insufficient stock. Negative inventory is not allowed.');
            }

            $variant->available_quantity = $after;
            if ($trackDamaged && $delta < 0) {
                $variant->damaged_quantity = (int) $variant->damaged_quantity + abs($delta);
            }
            if ($after === 0 && $variant->status === ProductVariant::STATUS_ACTIVE) {
                $variant->status = ProductVariant::STATUS_OUT_OF_STOCK;
            } elseif ($after > 0 && $variant->status === ProductVariant::STATUS_OUT_OF_STOCK) {
                $variant->status = ProductVariant::STATUS_ACTIVE;
            }
            $variant->save();

            InventoryTransaction::create([
                'product_variant_id' => $variant->id,
                'type' => $type,
                'quantity' => $delta,
                'available_before' => $beforeAvailable,
                'available_after' => (int) $variant->available_quantity,
                'reserved_before' => $beforeReserved,
                'reserved_after' => $beforeReserved,
                'user_id' => $userId,
                'notes' => $notes,
                'idempotency_key' => $idempotencyKey,
            ]);

            return $variant->fresh();
        });
    }
}
