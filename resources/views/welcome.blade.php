<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keep Playing — Tournaments & Player Management</title>
    <link rel="icon" type="image/png" href="{{ asset('images/keep-playing-logo.png') }}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        :root {
            --primary: #1a9f4a;
            --primary-dark: #15803d;
            --primary-deep: #0a0a0a;
            --brand-green: #1db954;
            --text: #0f172a;
            --text-muted: #64748b;
            --surface: #ffffff;
            --bg: #f0f4f8;
            --border: #e2e8f0;
            --radius: 16px;
            --shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: var(--text);
            background: var(--bg);
        }

        .site-nav {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            padding: 0.75rem 0;
        }

        .site-nav .navbar-brand {
            font-weight: 700;
            color: var(--primary-deep);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .brand-logo {
            display: block;
            width: auto;
            object-fit: contain;
        }

        .brand-logo--nav {
            height: 44px;
        }

        .brand-logo--hero {
            width: 100%;
            max-width: 320px;
            height: auto;
            margin: 0 auto;
        }

        .brand-logo--footer {
            height: 52px;
            margin-bottom: 1rem;
        }

        .site-nav .nav-link {
            color: var(--text-muted);
            font-weight: 500;
            padding: 0.5rem 0.85rem !important;
            border-radius: 8px;
            transition: color 0.2s, background 0.2s;
        }

        .site-nav .nav-link:hover {
            color: var(--primary);
            background: rgba(26, 159, 74, 0.08);
        }

        .btn-brand {
            background: linear-gradient(135deg, var(--primary-deep) 0%, var(--primary) 100%);
            border: none;
            color: #fff;
            font-weight: 600;
            padding: 0.65rem 1.35rem;
            border-radius: 999px;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-brand:hover {
            color: #fff;
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(26, 159, 74, 0.35);
        }

        .btn-outline-brand {
            border: 2px solid rgba(255, 255, 255, 0.85);
            color: #fff;
            font-weight: 600;
            padding: 0.65rem 1.35rem;
            border-radius: 999px;
            background: transparent;
        }

        .btn-outline-brand:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            border-color: #fff;
        }

        .hero {
            background: linear-gradient(160deg, #000000 0%, #0d1f14 45%, #14532d 100%);
            color: #fff;
            padding: 7rem 0 5rem;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 45%),
                        radial-gradient(circle at 85% 20%, rgba(255,255,255,0.1) 0%, transparent 40%);
            pointer-events: none;
        }

        .hero-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.25);
            padding: 0.35rem 0.85rem;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.03em;
            margin-bottom: 1.25rem;
        }

        .hero h1 {
            font-size: clamp(1.85rem, 4vw, 2.75rem);
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 1rem;
        }

        .hero-lead {
            font-size: 1.05rem;
            opacity: 0.92;
            max-width: 32rem;
            line-height: 1.65;
        }

        .hero-visual {
            background: #000;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: var(--radius);
            padding: 2rem 1.5rem;
            text-align: center;
        }

        .section {
            padding: 4.5rem 0;
        }

        .section-label {
            color: var(--primary);
            font-weight: 700;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.5rem;
        }

        .section-title {
            font-weight: 800;
            font-size: clamp(1.5rem, 3vw, 2rem);
            margin-bottom: 0.75rem;
        }

        .feature-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            height: 100%;
            transition: box-shadow 0.2s, transform 0.2s;
        }

        .feature-card:hover {
            box-shadow: var(--shadow);
            transform: translateY(-4px);
        }

        .feature-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--primary-deep), var(--primary));
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }

        .contact-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.75rem;
            box-shadow: var(--shadow);
        }

        .contact-info-item {
            display: flex;
            gap: 1rem;
            align-items: flex-start;
            padding: 1rem 0;
            border-bottom: 1px solid var(--border);
        }

        .contact-info-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .contact-info-item i {
            width: 44px;
            height: 44px;
            flex-shrink: 0;
            border-radius: 12px;
            background: var(--bg);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
        }

        .contact-info-item a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
        }

        .contact-info-item a:hover {
            text-decoration: underline;
        }

        .form-control, .form-control:focus {
            border-color: var(--border);
            border-radius: 10px;
            padding: 0.65rem 0.85rem;
        }

        .form-control:focus {
            box-shadow: 0 0 0 3px rgba(26, 159, 74, 0.15);
            border-color: var(--primary);
        }

        .site-footer {
            background: var(--primary-deep);
            color: rgba(255, 255, 255, 0.85);
            padding: 3rem 0 1.5rem;
        }

        .site-footer h5 {
            color: #fff;
            font-weight: 700;
            font-size: 0.95rem;
            margin-bottom: 1rem;
        }

        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .footer-links li {
            margin-bottom: 0.5rem;
        }

        .footer-links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-size: 0.95rem;
            transition: color 0.2s;
        }

        .footer-links a:hover {
            color: #fff;
        }

        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            margin-top: 2rem;
            padding-top: 1.25rem;
            text-align: center;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.55);
        }

        @media (max-width: 991px) {
            .hero {
                padding: 6rem 0 4rem;
            }
            .hero-visual {
                margin-top: 2rem;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg site-nav fixed-top">
        <div class="container">
            <a class="navbar-brand" href="#home" aria-label="Keep Playing home">
                <img
                    src="{{ asset('images/keep-playing-logo.png') }}"
                    alt="Keep Playing"
                    class="brand-logo brand-logo--nav"
                    width="180"
                    height="44"
                >
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
                    <li class="nav-item"><a class="nav-link" href="#home">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="#contact">Contact</a></li>
                    <li class="nav-item ms-lg-2">
                        <a class="btn btn-brand btn-sm" href="/app">Open App</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="container position-relative">
            <div class="row align-items-center g-4">
                <div class="col-lg-7">
                    <span class="hero-badge">Tournament platform</span>
                    <h1>Run tournaments and manage players with ease</h1>
                    <p class="hero-lead mb-4">
                        Register for events, track schedules, and stay connected with your sports community — all from one place.
                    </p>
                    <div class="d-flex flex-wrap gap-3">
                        <a href="/app" class="btn btn-brand btn-lg">
                            <i class="bi bi-phone me-2"></i>Open App
                        </a>
                        <a href="/app/register" class="btn btn-outline-brand btn-lg">
                            <i class="bi bi-person-plus me-2"></i>Create account
                        </a>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="hero-visual">
                        <img
                            src="{{ asset('images/keep-playing-logo.png') }}"
                            alt="Keep Playing"
                            class="brand-logo brand-logo--hero"
                            width="320"
                            height="320"
                        >
                        <p class="mt-3 mb-0 small opacity-90">Players · Organizers · Live updates</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="about" class="section">
        <div class="container">
            <div class="row mb-4 mb-lg-5">
                <div class="col-lg-8">
                    <p class="section-label">About us</p>
                    <h2 class="section-title">Built for players and tournament organizers</h2>
                    <p class="text-muted mb-0">
                        We help you organize competitions, manage registrations, and keep everyone informed — whether you run local leagues or larger events.
                    </p>
                    <p class="text-muted mb-0">Our services starts from 5K - 1L as per client requirements</p>
                </div>
            </div>
            <div class="row g-3 g-lg-4">
                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="bi bi-calendar-event"></i></div>
                        <h3 class="h6 fw-bold mb-2">Tournaments</h3>
                        <p class="text-muted small mb-0">Create events and manage schedules in one workflow.</p>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="bi bi-person-badge"></i></div>
                        <h3 class="h6 fw-bold mb-2">Player profiles</h3>
                        <p class="text-muted small mb-0">Profiles and history for every participant.</p>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="bi bi-clipboard-check"></i></div>
                        <h3 class="h6 fw-bold mb-2">Easy signup</h3>
                        <p class="text-muted small mb-0">Quick registration for players and teams.</p>
                    </div>
                </div>
                <div class="col-md-6 col-lg-3">
                    <div class="feature-card">
                        <div class="feature-icon"><i class="bi bi-people"></i></div>
                        <h3 class="h6 fw-bold mb-2">Community</h3>
                        <p class="text-muted small mb-0">Connect athletes and organizers on one platform.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="section bg-white">
        <div class="container">
            <div class="row g-4 g-lg-5 align-items-start">
                <div class="col-lg-5">
                    <p class="section-label">Contact</p>
                    <h2 class="section-title">Get in touch</h2>
                    <p class="text-muted mb-4">Questions about tournaments or the platform? Reach us using the details below.</p>
                    <div class="contact-card">
                        <div class="contact-info-item">
                            <i class="bi bi-geo-alt-fill"></i>
                            <div>
                                <strong class="d-block mb-1">Address</strong>
                                <span class="text-muted">No 3 kanakar st<br>Katpadi<br>Vellore 632007</span>
                            </div>
                        </div>
                        <div class="contact-info-item">
                            <i class="bi bi-telephone-fill"></i>
                            <div>
                                <strong class="d-block mb-1">Phone</strong>
                                <a href="tel:9444200715">9444200715</a>
                            </div>
                        </div>
                        <div class="contact-info-item">
                            <i class="bi bi-envelope-fill"></i>
                            <div>
                                <strong class="d-block mb-1">Email</strong>
                                <a href="mailto:pavithravit2000@gmail.com">pavithravit2000@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-7">
                    <div class="contact-card">
                        <h3 class="h5 fw-bold mb-3">Send a message</h3>
                        <form id="contactForm">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label for="name" class="form-label small fw-semibold">Name</label>
                                    <input type="text" class="form-control" id="name" placeholder="Your name" required>
                                </div>
                                <div class="col-md-6">
                                    <label for="email" class="form-label small fw-semibold">Email</label>
                                    <input type="email" class="form-control" id="email" placeholder="you@email.com" required>
                                </div>
                                <div class="col-12">
                                    <label for="subject" class="form-label small fw-semibold">Subject</label>
                                    <input type="text" class="form-control" id="subject" placeholder="How can we help?" required>
                                </div>
                                <div class="col-12">
                                    <label for="message" class="form-label small fw-semibold">Message</label>
                                    <textarea class="form-control" id="message" rows="4" placeholder="Your message" required></textarea>
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-brand">
                                        <i class="bi bi-send me-2"></i>Send message
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="site-footer">
        <div class="container">
            <div class="row g-4">
                <div class="col-md-4">
                    <img
                        src="{{ asset('images/keep-playing-logo.png') }}"
                        alt="Keep Playing"
                        class="brand-logo brand-logo--footer"
                        width="200"
                        height="52"
                    >
                    <p class="small mb-0">Tournament and player management for your sports community.</p>
                </div>
                <div class="col-md-4">
                    <h5>Quick links</h5>
                    <ul class="footer-links">
                        <li><a href="#home">Home</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                        <li><a href="/app/terms">Terms &amp; Conditions</a></li>
                        <li><a href="/app/privacy">Privacy Policy</a></li>
                        <li><a href="/app/refund-policy">No Refund Policy</a></li>
                    </ul>
                </div>
                <div class="col-md-4">
                    <h5>Contact</h5>
                    <ul class="footer-links">
                        <li>No 3 kanakar st, Katpadi, Vellore 632007</li>
                        <li><a href="tel:9444200715">9444200715</a></li>
                        <li><a href="mailto:pavithravit2000@gmail.com">pavithravit2000@gmail.com</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; {{ date('Y') }} Keep Playing. All rights reserved.
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    const nav = document.getElementById('navbarNav');
                    if (nav.classList.contains('show')) {
                        bootstrap.Collapse.getOrCreateInstance(nav).hide();
                    }
                }
            });
        });

        document.getElementById('contactForm').addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Thank you! We will get back to you soon.');
            this.reset();
        });
    </script>
</body>
</html>
