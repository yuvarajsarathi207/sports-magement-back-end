<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tournament Pending Approval</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
    <h2>Tournament pending your approval</h2>

    <p>An organizer has submitted a tournament for review.</p>

    <ul>
        <li><strong>Tournament:</strong> {{ $tournament->team_name }}</li>
        <li><strong>Sport:</strong> {{ $tournament->sportsCategory?->name }}</li>
        <li><strong>Organizer:</strong> {{ $tournament->organizer?->name }} ({{ $tournament->organizer?->email }})</li>
        <li><strong>Location:</strong> {{ $tournament->city }}, {{ $tournament->district }}, {{ $tournament->state }} - {{ $tournament->pincode }}</li>
        <li><strong>Start date:</strong> {{ $tournament->start_date?->format('d M Y') }}</li>
        <li><strong>Entry fee:</strong> ₹{{ $tournament->entry_fee }}</li>
    </ul>

    <p>
        <a href="{{ config('app.url') }}/app/admin/tournaments/{{ $tournament->id }}"
           style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
            Review in Admin Panel
        </a>
    </p>

    <p style="color:#64748b;font-size:13px;">Log in with your admin account to approve or reject this tournament.</p>
</body>
</html>
