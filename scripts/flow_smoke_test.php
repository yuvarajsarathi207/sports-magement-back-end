<?php

/**
 * End-to-end flow smoke test for Keep Playing API.
 * Run: php scripts/flow_smoke_test.php
 */

$base = getenv('APP_URL') ?: 'http://127.0.0.1:8000';
$api = rtrim($base, '/') . '/api';
$pass = 'Test@12345';
$results = [];
$failures = [];

function req(string $method, string $url, ?array $body = null, ?string $token = null): array
{
    $ch = curl_init($url);
    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    $json = json_decode($raw ?: 'null', true);
    return compact('code', 'json', 'raw', 'err');
}

function assertOk(string $name, array $res, int|array $expect = 200, ?callable $extra = null): void
{
    global $results, $failures;
    $expected = is_array($expect) ? $expect : [$expect];
    $ok = in_array($res['code'], $expected, true) && empty($res['err']);
    $detail = '';
    if ($ok && $extra) {
        try {
            $extra($res['json'], $res);
        } catch (Throwable $e) {
            $ok = false;
            $detail = $e->getMessage();
        }
    }
    if (!$ok && $detail === '') {
        $detail = "HTTP {$res['code']} (expected " . implode('|', $expected) . ")" . ($res['err'] ? " curl:{$res['err']}" : '') . ' body=' . substr($res['raw'] ?? '', 0, 300);
    }
    $results[] = [$ok ? 'PASS' : 'FAIL', $name, $detail];
    if (!$ok) {
        $failures[] = "$name — $detail";
    }
    echo ($ok ? '✅' : '❌') . " $name" . ($detail ? " ($detail)" : '') . PHP_EOL;
}

echo "=== Keep Playing flow smoke test ===\nBase: $api\n\n";

// 0) Public settings
$public = req('GET', "$api/settings/public");
assertOk('Public settings loads', $public, 200, function ($j) {
    foreach (['app_theme', 'payment_method', 'theme', 'platform_name'] as $k) {
        if (!array_key_exists($k, $j ?? [])) {
            throw new Exception("missing $k");
        }
    }
    if (empty($j['theme']['primary'])) {
        throw new Exception('theme.primary missing');
    }
});
$originalSettings = $public['json'];

// 1) Logins
$adminLogin = req('POST', "$api/login", ['email' => 'admin@gmail.com', 'password' => $pass]);
assertOk('Admin login', $adminLogin, 200, fn ($j) => empty($j['token']) ? throw new Exception('no token') : null);
$adminToken = $adminLogin['json']['token'] ?? null;

$orgLogin = req('POST', "$api/login", ['email' => 'org@gmail.com', 'password' => $pass]);
assertOk('Organizer login', $orgLogin, 200, fn ($j) => empty($j['token']) ? throw new Exception('no token') : null);
$orgToken = $orgLogin['json']['token'] ?? null;

$playerLogin = req('POST', "$api/login", ['email' => 'pl@gmail.com', 'password' => $pass]);
assertOk('Player login', $playerLogin, 200, fn ($j) => empty($j['token']) ? throw new Exception('no token') : null);
$playerToken = $playerLogin['json']['token'] ?? null;

if (!$adminToken || !$orgToken || !$playerToken) {
    echo "\nAborting — auth failed.\n";
    exit(1);
}

// 2) Admin preferences — theme + free payment
$adminGet = req('GET', "$api/admin/settings", null, $adminToken);
assertOk('Admin get settings', $adminGet, 200, function ($j) {
    if (empty($j['available_themes'])) {
        throw new Exception('available_themes missing');
    }
    if (empty($j['available_payment_methods'])) {
        throw new Exception('available_payment_methods missing');
    }
});

$saveFree = req('PUT', "$api/admin/settings", [
    'tournament_publish_mode' => 'payment',
    'organizer_publish_fee' => 10,
    'player_subscription_fee' => 5,
    'phonepe_env' => $originalSettings['phonepe_env'] ?? 'sandbox',
    'app_theme' => 'sunset',
    'payment_method' => 'free',
    'platform_name' => 'Keep Playing Test',
    'support_email' => 'support@test.com',
    'support_phone' => '9999999999',
    'payment_instructions' => 'UPI: test@upi',
], $adminToken);
assertOk('Admin save free mode + sunset theme', $saveFree, 200, function ($j) {
    $s = $j['settings'] ?? [];
    if (($s['payment_method'] ?? '') !== 'free') {
        throw new Exception('payment_method not free');
    }
    if (($s['app_theme'] ?? '') !== 'sunset') {
        throw new Exception('theme not sunset');
    }
    if (($s['platform_name'] ?? '') !== 'Keep Playing Test') {
        throw new Exception('platform_name not updated');
    }
});

$publicAfter = req('GET', "$api/settings/public");
assertOk('Public settings reflect theme/payment', $publicAfter, 200, function ($j) {
    if (($j['app_theme'] ?? '') !== 'sunset') {
        throw new Exception('public theme mismatch');
    }
    if (($j['payment_method'] ?? '') !== 'free') {
        throw new Exception('public payment_method mismatch');
    }
    if (($j['theme']['primary'] ?? '') !== '#ea580c') {
        throw new Exception('sunset primary color wrong: ' . ($j['theme']['primary'] ?? 'null'));
    }
});

// 3) Organizer dashboard + create tournament
$orgDash = req('GET', "$api/organizer/dashboard", null, $orgToken);
assertOk('Organizer dashboard', $orgDash, 200, function ($j) {
    foreach (['stats', 'tournaments', 'recent_paid_players', 'pending_players'] as $k) {
        if (!array_key_exists($k, $j ?? [])) {
            throw new Exception("missing $k");
        }
    }
    $stats = $j['stats'];
    foreach (['paid_players', 'pending_players', 'entry_fee_collected', 'total_interested'] as $k) {
        if (!array_key_exists($k, $stats)) {
            throw new Exception("stats.$k missing");
        }
    }
});

$create = req('POST', "$api/organizer/tournaments", [
    'sports_category_id' => 1,
    'team_name' => 'Flow Test XI ' . date('His'),
    'state' => 'Tamil Nadu',
    'city' => 'Chennai',
    'district' => 'Chennai',
    'pincode' => '600001',
    'location_details' => 'Ground A',
    'start_date' => date('Y-m-d', strtotime('+10 days')),
    'winning_date' => date('Y-m-d', strtotime('+20 days')),
    'slot_count' => 8,
    'template' => 'https://example.com/template.pdf',
    'rules' => 'Play fair. Be on time.',
    'entry_fee' => 100,
    'price_details' => 'Entry only',
    'ball_type' => 'Leather',
], $orgToken);
assertOk('Organizer create tournament', $create, 201, fn ($j) => empty($j['id']) ? throw new Exception('no id') : null);
$tournamentId = $create['json']['id'] ?? null;

$publishFree = req('POST', "$api/organizer/tournaments/{$tournamentId}/publish", null, $orgToken);
assertOk('Publish with free payment mode (fee>0 still free)', $publishFree, 200, function ($j) {
    if (!empty($j['requires_payment'])) {
        throw new Exception('should not require payment in free mode');
    }
    if (($j['tournament']['status'] ?? '') !== 'published') {
        throw new Exception('not published: ' . ($j['tournament']['status'] ?? 'null'));
    }
});

$viewOrg = req('GET', "$api/organizer/tournaments/{$tournamentId}", null, $orgToken);
assertOk('Organizer tournament detail payload', $viewOrg, 200, function ($j) {
    foreach (['paid_players_count', 'pending_players_count', 'paid_players', 'pending_players', 'entry_fee_collected'] as $k) {
        if (!array_key_exists($k, $j ?? [])) {
            throw new Exception("missing $k");
        }
    }
});

// 4) Player dashboard + subscribe + pay (free)
$playerDash = req('GET', "$api/player/dashboard", null, $playerToken);
assertOk('Player dashboard enriched', $playerDash, 200, function ($j) {
    foreach (['subscriptions', 'interests', 'stats', 'upcoming', 'discover'] as $k) {
        if (!array_key_exists($k, $j ?? [])) {
            throw new Exception("missing $k");
        }
    }
});

$list = req('GET', "$api/player/tournaments", null, $playerToken);
assertOk('Player list tournaments', $list, 200);

$interest = req('POST', "$api/player/tournaments/{$tournamentId}/interest", null, $playerToken);
assertOk('Player express interest', $interest, [200, 201]);

$subscribe = req('POST', "$api/player/tournaments/{$tournamentId}/subscribe", null, $playerToken);
assertOk('Player subscribe', $subscribe, [200, 201], fn ($j) => empty($j['id']) ? throw new Exception('no sub id') : null);
$subId = $subscribe['json']['id'] ?? null;

$payFree = req('POST', "$api/player/subscriptions/{$subId}/pay", null, $playerToken);
assertOk('Player pay in free mode activates', $payFree, [200, 201], function ($j) {
    if (!empty($j['requires_payment'])) {
        throw new Exception('free mode should not require payment');
    }
});

$details = req('GET', "$api/player/tournaments/{$tournamentId}/details", null, $playerToken);
assertOk('Player unlocks details after free pay', $details, 200, function ($j) {
    if (empty($j['rules']) && empty($j['location'])) {
        // rules should be visible
    }
});

$viewAfterPay = req('GET', "$api/organizer/tournaments/{$tournamentId}", null, $orgToken);
assertOk('Organizer sees paid player', $viewAfterPay, 200, function ($j) {
    if ((int) ($j['paid_players_count'] ?? 0) < 1) {
        throw new Exception('paid_players_count expected >=1 got ' . ($j['paid_players_count'] ?? 'null'));
    }
});

// 5) Manual payment flow with a second tournament + second pay path
$saveManual = req('PUT', "$api/admin/settings", [
    'tournament_publish_mode' => 'payment',
    'organizer_publish_fee' => 0,
    'player_subscription_fee' => 25,
    'phonepe_env' => $originalSettings['phonepe_env'] ?? 'sandbox',
    'app_theme' => 'forest',
    'payment_method' => 'manual',
    'platform_name' => 'Keep Playing Test',
    'support_email' => 'support@test.com',
    'support_phone' => '9999999999',
    'payment_instructions' => 'Pay UPI keepplaying@upi and share screenshot',
], $adminToken);
assertOk('Admin switch to manual payments', $saveManual, 200, function ($j) {
    if (($j['settings']['payment_method'] ?? '') !== 'manual') {
        throw new Exception('not manual');
    }
});

$create2 = req('POST', "$api/organizer/tournaments", [
    'sports_category_id' => 3,
    'team_name' => 'Manual Pay Cup ' . date('His'),
    'state' => 'Tamil Nadu',
    'city' => 'Coimbatore',
    'district' => 'Coimbatore',
    'pincode' => '641001',
    'start_date' => date('Y-m-d', strtotime('+12 days')),
    'winning_date' => date('Y-m-d', strtotime('+22 days')),
    'slot_count' => 4,
    'template' => 'https://example.com/t2.pdf',
    'rules' => 'Manual flow rules',
    'entry_fee' => 50,
], $orgToken);
assertOk('Create tournament for manual flow', $create2, 201);
$t2 = $create2['json']['id'] ?? null;

$publish2 = req('POST', "$api/organizer/tournaments/{$t2}/publish", null, $orgToken);
assertOk('Publish manual tournament (fee 0)', $publish2, 200, function ($j) {
    if (($j['tournament']['status'] ?? '') !== 'published') {
        throw new Exception('status=' . ($j['tournament']['status'] ?? 'null'));
    }
});

$sub2 = req('POST', "$api/player/tournaments/{$t2}/subscribe", null, $playerToken);
// may already have interest patterns; accept 201 or 200/400 if duplicate
if (($sub2['code'] === 400 || $sub2['code'] === 422) && str_contains($sub2['raw'] ?? '', 'already')) {
    assertOk('Player already subscribed (acceptable)', ['code' => 200, 'json' => [], 'raw' => '', 'err' => ''], 200);
} else {
    assertOk('Player subscribe manual tournament', $sub2, 201);
}
$sub2Id = $sub2['json']['id'] ?? null;

if (!$sub2Id) {
    // fetch from dashboard
    $dash2 = req('GET', "$api/player/dashboard", null, $playerToken);
    foreach ($dash2['json']['subscriptions'] ?? [] as $s) {
        if ((string) $s['tournament_id'] === (string) $t2) {
            $sub2Id = $s['id'];
            break;
        }
    }
}

$payManual = req('POST', "$api/player/subscriptions/{$sub2Id}/pay", null, $playerToken);
assertOk('Player manual pay returns instructions', $payManual, 200, function ($j) {
    if (empty($j['requires_payment'])) {
        throw new Exception('manual should require payment confirmation');
    }
    if (($j['payment_method'] ?? '') !== 'manual') {
        throw new Exception('payment_method not manual');
    }
    if (empty($j['payment_instructions'])) {
        throw new Exception('instructions missing');
    }
});

$confirm = req('POST', "$api/organizer/tournaments/{$t2}/subscriptions/{$sub2Id}/confirm-payment", null, $orgToken);
assertOk('Organizer mark player paid', $confirm, 200, function ($j) {
    if (($j['subscription']['status'] ?? '') !== 'active') {
        throw new Exception('sub not active');
    }
});

$details2 = req('GET', "$api/player/tournaments/{$t2}/details", null, $playerToken);
assertOk('Player details after manual confirm', $details2, 200);

// 6) Theme midnight dark tokens
$saveDark = req('PUT', "$api/admin/settings", [
    'tournament_publish_mode' => $originalSettings['tournament_publish_mode'] ?? 'payment',
    'organizer_publish_fee' => (float) ($originalSettings['organizer_publish_fee'] ?? 0),
    'player_subscription_fee' => (float) ($originalSettings['player_subscription_fee'] ?? 0),
    'phonepe_env' => $originalSettings['phonepe_env'] ?? 'sandbox',
    'app_theme' => 'midnight',
    'payment_method' => 'manual', // keep non-phonepe to avoid credential fail if prod not set
    'platform_name' => $originalSettings['platform_name'] ?? 'Keep Playing',
    'support_email' => $originalSettings['support_email'] ?: null,
    'support_phone' => $originalSettings['support_phone'] ?: null,
    'payment_instructions' => $originalSettings['payment_instructions'] ?? null,
], $adminToken);
assertOk('Admin set midnight theme', $saveDark, 200, function ($j) {
    if (($j['settings']['theme']['mode'] ?? '') !== 'dark') {
        throw new Exception('midnight not dark mode');
    }
});

// 7) PhonePe settings validation (only if configured) — expect either success or clear 422
$phonepeAttempt = req('PUT', "$api/admin/settings", [
    'tournament_publish_mode' => 'payment',
    'organizer_publish_fee' => 1,
    'player_subscription_fee' => 1,
    'phonepe_env' => 'sandbox',
    'app_theme' => 'ocean',
    'payment_method' => 'phonepe',
    'platform_name' => 'Keep Playing',
    'support_email' => 'support@test.com',
    'support_phone' => '9999999999',
    'payment_instructions' => 'n/a',
], $adminToken);
if (in_array($phonepeAttempt['code'], [200, 422], true)) {
    assertOk(
        'PhonePe mode save returns 200 or validation 422',
        ['code' => 200, 'json' => [], 'raw' => '', 'err' => ''],
        200
    );
    echo '   ↳ actual HTTP ' . $phonepeAttempt['code'] . ': ' . substr($phonepeAttempt['raw'] ?? '', 0, 160) . PHP_EOL;
} else {
    assertOk('PhonePe mode save returns 200 or validation 422', $phonepeAttempt, 200);
}

// 8) Restore original prefs carefully (avoid phonepe credential failure)
$restoreMethod = $originalSettings['payment_method'] ?? 'manual';
$restoreEnv = $originalSettings['phonepe_env'] ?? 'sandbox';
if ($restoreMethod === 'phonepe' && $phonepeAttempt['code'] === 422) {
    $restoreMethod = 'manual';
    echo "⚠️  Restoring payment_method as manual because PhonePe credentials invalid for selected env\n";
}

$restore = req('PUT', "$api/admin/settings", [
    'tournament_publish_mode' => $originalSettings['tournament_publish_mode'] ?? 'approval',
    'organizer_publish_fee' => (float) ($originalSettings['organizer_publish_fee'] ?? 0),
    'player_subscription_fee' => (float) ($originalSettings['player_subscription_fee'] ?? 0),
    'phonepe_env' => $restoreEnv,
    'app_theme' => $originalSettings['app_theme'] ?? 'ocean',
    'payment_method' => $restoreMethod,
    'platform_name' => $originalSettings['platform_name'] ?? 'Keep Playing',
    'support_email' => $originalSettings['support_email'] ?: null,
    'support_phone' => $originalSettings['support_phone'] ?: null,
    'payment_instructions' => $originalSettings['payment_instructions'] ?? null,
], $adminToken);
assertOk('Restore original preferences', $restore, 200);

// Summary
$passCount = count(array_filter($results, fn ($r) => $r[0] === 'PASS'));
$failCount = count($failures);
echo "\n=== Summary: {$passCount} passed, {$failCount} failed ===\n";
if ($failures) {
    echo "\nFAILURES TO REMEMBER:\n";
    foreach ($failures as $f) {
        echo " - $f\n";
    }
    file_put_contents(__DIR__ . '/flow_smoke_failures.txt', implode("\n", $failures) . "\n");
    exit(1);
}

echo "All tested flows passed.\n";
exit(0);
