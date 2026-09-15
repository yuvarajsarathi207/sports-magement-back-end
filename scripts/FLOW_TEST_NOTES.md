# Flow smoke test notes (2026-09-15)

## Result
All core API flows passed (28/28). PhonePe publish returned `requires_payment=true` + `redirect_url`. Frontend `/app` returned 200.

## Covered
- Public settings (theme tokens + payment_method)
- Admin preferences save (theme sunset/midnight/forest, free/manual/phonepe)
- Organizer dashboard stats (paid/pending/fees)
- Create + publish (free mode auto-publishes even with fee > 0)
- Organizer tournament detail paid-player payload
- Player dashboard (stats/upcoming/discover)
- Interest → subscribe → pay (free) → unlock details
- Manual pay instructions → organizer mark paid → unlock details
- PhonePe organizer publish checkout redirect
- Settings restored after test

## Quirks (not blockers)
1. `POST /player/tournaments/{id}/interest` returns **201** (created).
2. `POST /player/subscriptions/{id}/pay` returns **201** when payment is not required (free/zero-fee), **200** when gateway/manual payment is required.
3. PhonePe publish can take several seconds (external API).
4. DB has duplicate sports categories (Football id 1 and 9, etc.) — pre-existing seed duplication.
5. For this test run, passwords for `admin@gmail.com`, `org@gmail.com`, `pl@gmail.com` were temporarily set to `Test@12345`.

## Re-run
```bash
php artisan serve --host=127.0.0.1 --port=8000
php scripts/flow_smoke_test.php
```
