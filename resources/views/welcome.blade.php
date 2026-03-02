<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournament Hub - Player & Tournament Management Platform</title>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <style>
        :root {
            --primary-color: #2563eb;
            --secondary-color: #1e40af;
            --accent-color: #3b82f6;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .navbar {
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .navbar.scrolled {
            background-color: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px);
        }

        .hero-section {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 120px 0 80px;
            min-height: 100vh;
            display: flex;
            align-items: center;
        }

        .section-padding {
            padding: 80px 0;
        }

        .service-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: none;
            border-radius: 15px;
            height: 100%;
        }

        .service-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }

        .service-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 2rem;
        }

        .btn-primary {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            border: none;
            padding: 12px 30px;
            border-radius: 50px;
            transition: transform 0.3s ease;
        }

        .btn-primary:hover {
            transform: scale(1.05);
            background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
        }

        .about-section {
            background-color: #f8f9fa;
        }

        .contact-section {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
        }

        .footer {
            background-color: #1a1a1a;
            color: #fff;
            padding: 40px 0 20px;
        }

        .social-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: rgba(255,255,255,0.1);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 0 10px;
            transition: all 0.3s ease;
            color: white;
            text-decoration: none;
        }

        .social-icon:hover {
            background-color: rgba(255,255,255,0.2);
            transform: translateY(-5px);
            color: white;
        }

        @media (max-width: 768px) {
            .hero-section {
                padding: 100px 0 60px;
                text-align: center;
            }

            .section-padding {
                padding: 60px 0;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light bg-white fixed-top">
        <div class="container">
            <a class="navbar-brand fw-bold" href="#home">
                <i class="bi bi-trophy"></i> Tournament Hub
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="#home">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#features">Features</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#about">About</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#contact">Contact</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero-section">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <h1 class="display-4 fw-bold mb-4">Tournament & Player Management Platform</h1>
                    <p class="lead mb-4">Manage tournaments, track players, view live scores, and stay updated with rankings. Join thousands of players competing in exciting tournaments.</p>
                    <div class="d-flex flex-wrap gap-3">
                        <a href="#contact" class="btn btn-primary btn-lg">
                            <i class="bi bi-person-plus me-2"></i>Register Now
                        </a>
                        <a href="#features" class="btn btn-outline-light btn-lg">
                            <i class="bi bi-info-circle me-2"></i>Learn More
                        </a>
                    </div>
                </div>
                <div class="col-lg-6 text-center mt-5 mt-lg-0">
                    <div class="p-5">
                        <i class="bi bi-trophy" style="font-size: 200px; opacity: 0.3;"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section-padding">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="display-5 fw-bold mb-3">Platform Features</h2>
                <p class="lead text-muted">Everything you need to manage tournaments and track players in one place</p>
            </div>
            <div class="row g-4">
                <div class="col-md-6 col-lg-4">
                    <div class="card service-card shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="service-icon">
                                <i class="bi bi-calendar-event"></i>
                            </div>
                            <h4 class="card-title fw-bold">Tournament Management</h4>
                            <p class="card-text text-muted">Create and manage tournaments with ease. Set schedules, brackets, and rules all in one place.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="card service-card shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="service-icon">
                                <i class="bi bi-person-badge"></i>
                            </div>
                            <h4 class="card-title fw-bold">Player Profiles</h4>
                            <p class="card-text text-muted">Comprehensive player profiles with stats, achievements, and tournament history.</p>
                        </div>
                    </div>
                </div>
                {{-- <div class="col-md-6 col-lg-4">
                    <div class="card service-card shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="service-icon">
                                <i class="bi bi-graph-up"></i>
                            </div>
                            <h4 class="card-title fw-bold">Live Scores</h4>
                            <p class="card-text text-muted">Real-time score updates and match results as they happen during tournaments.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-4">
                    <div class="card service-card shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="service-icon">
                                <i class="bi bi-trophy-fill"></i>
                            </div>
                            <h4 class="card-title fw-bold">Rankings & Leaderboards</h4>
                            <p class="card-text text-muted">Track player rankings and view leaderboards across different categories and sports.</p>
                        </div>
                    </div>
                </div> --}}
                <div class="col-md-6 col-lg-4">
                    <div class="card service-card shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="service-icon">
                                <i class="bi bi-clipboard-check"></i>
                            </div>
                            <h4 class="card-title fw-bold">Easy Registration</h4>
                            <p class="card-text text-muted">Simple and quick tournament registration process for players and teams.</p>
                        </div>
                    </div>
                </div>
                {{-- <div class="col-md-6 col-lg-4">
                    <div class="card service-card shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="service-icon">
                                <i class="bi bi-bell"></i>
                            </div>
                            <h4 class="card-title fw-bold">Notifications</h4>
                            <p class="card-text text-muted">Stay updated with match schedules, results, and important tournament announcements.</p>
                        </div>
                    </div>
                </div> --}}
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section-padding about-section">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6 mb-5 mb-lg-0">
                    <h2 class="display-5 fw-bold mb-4">About Tournament Hub</h2>
                    <p class="lead mb-4">We are the premier platform for tournament management and player tracking, connecting athletes and organizers worldwide.</p>
                    <p class="mb-4">Our platform makes it easy to organize tournaments, track player performance, and engage with the competitive sports community. Join thousands of players and organizers who trust us for their tournament needs.</p>
                    <div class="row g-4 mt-3">
                        <div class="col-6">
                            <div class="text-center">
                                <h3 class="fw-bold text-danger">500+</h3>
                                <p class="text-muted">Active Tournaments</p>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="text-center">
                                <h3 class="fw-bold text-danger">10K+</h3>
                                <p class="text-muted">Registered Players</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="p-4">
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body text-center p-4">
                                        <i class="bi bi-trophy text-danger" style="font-size: 3rem;"></i>
                                        <h5 class="mt-3 fw-bold">Multiple Sports</h5>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body text-center p-4">
                                        <i class="bi bi-people text-danger" style="font-size: 3rem;"></i>
                                        <h5 class="mt-3 fw-bold">Active Community</h5>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body text-center p-4">
                                        <i class="bi bi-clock-history text-danger" style="font-size: 3rem;"></i>
                                        <h5 class="mt-3 fw-bold">Real-Time Updates</h5>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body text-center p-4">
                                        <i class="bi bi-star text-danger" style="font-size: 3rem;"></i>
                                        <h5 class="mt-3 fw-bold">Top Rankings</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="section-padding contact-section">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="display-5 fw-bold mb-3">Get In Touch</h2>
                <p class="lead">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            </div>
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card shadow-lg border-0">
                        <div class="card-body p-5">
                            <form>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label for="name" class="form-label">Name</label>
                                        <input type="text" class="form-control" id="name" placeholder="Your Name" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="email" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="email" placeholder="your@email.com" required>
                                    </div>
                                    <div class="col-12">
                                        <label for="subject" class="form-label">Subject</label>
                                        <input type="text" class="form-control" id="subject" placeholder="Subject" required>
                                    </div>
                                    <div class="col-12">
                                        <label for="message" class="form-label">Message</label>
                                        <textarea class="form-control" id="message" rows="5" placeholder="Your Message" required></textarea>
                                    </div>
                                    <div class="col-12">
                                        <button type="submit" class="btn btn-primary btn-lg w-100">
                                            <i class="bi bi-send me-2"></i>Send Message
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-5 text-center">
                <div class="col-md-4 mb-4 mb-md-0">
                    <div class="p-4">
                        <i class="bi bi-geo-alt-fill" style="font-size: 2.5rem;"></i>
                        <h5 class="mt-3 fw-bold">Address</h5>
                        <p>123 Sports Avenue<br>City, State 12345</p>
                    </div>
                </div>
                <div class="col-md-4 mb-4 mb-md-0">
                    <div class="p-4">
                        <i class="bi bi-telephone-fill" style="font-size: 2.5rem;"></i>
                        <h5 class="mt-3 fw-bold">Phone</h5>
                        <p>+1 (555) 123-4567<br>+1 (555) 987-6543</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-4">
                        <i class="bi bi-envelope-fill" style="font-size: 2.5rem;"></i>
                        <h5 class="mt-3 fw-bold">Email</h5>
                        <p>info@tournamenthub.com<br>support@tournamenthub.com</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="row">
                <div class="col-lg-4 mb-4 mb-lg-0">
                    <h5 class="fw-bold mb-3">
                        <i class="bi bi-trophy me-2"></i>Tournament Hub
                    </h5>
                    <p class="text-muted">The premier platform for tournament management and player tracking. Connect, compete, and excel.</p>
                </div>
                <div class="col-lg-2 col-md-6 mb-4 mb-lg-0">
                    <h5 class="fw-bold mb-3">Quick Links</h5>
                    <ul class="list-unstyled">
                        <li><a href="#home" class="text-muted text-decoration-none">Home</a></li>
                        <li><a href="#features" class="text-muted text-decoration-none">Features</a></li>
                        <li><a href="#about" class="text-muted text-decoration-none">About</a></li>
                        <li><a href="#contact" class="text-muted text-decoration-none">Contact</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-6 mb-4 mb-lg-0">
                    <h5 class="fw-bold mb-3">Features</h5>
                    <ul class="list-unstyled">
                        <li><a href="#" class="text-muted text-decoration-none">Tournament Management</a></li>
                        <li><a href="#" class="text-muted text-decoration-none">Player Profiles</a></li>
                        <li><a href="#" class="text-muted text-decoration-none">Live Scores</a></li>
                        <li><a href="#" class="text-muted text-decoration-none">Rankings</a></li>
                    </ul>
                </div>
                <div class="col-lg-3">
                    <h5 class="fw-bold mb-3">Follow Us</h5>
                    <div class="d-flex justify-content-lg-start justify-content-center">
                        <a href="#" class="social-icon">
                            <i class="bi bi-facebook"></i>
                        </a>
                        <a href="#" class="social-icon">
                            <i class="bi bi-twitter"></i>
                        </a>
                        <a href="#" class="social-icon">
                            <i class="bi bi-linkedin"></i>
                        </a>
                        <a href="#" class="social-icon">
                            <i class="bi bi-instagram"></i>
                        </a>
                    </div>
                </div>
            </div>
            <hr class="my-4 bg-secondary">
            <div class="row">
                <div class="col-12 text-center">
                    <p class="text-muted mb-0">&copy; 2024 Tournament Hub. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Form submission (prevent default for demo)
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    </script>
</body>
</html>
