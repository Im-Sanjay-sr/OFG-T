/**
 * OFG TECH Scrollytelling Logic
 */

/* Configuration */
const FRAME_COUNT = 40; // Total frames found
const IMAGE_PATH_PREFIX = 'assets/images/canvas/ezgif-frame-';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const CANVAS_ID = 'hero-canvas';

/* State */
const images = [];
let imagesLoaded = 0;
let currentFrameIndex = 0;

/* DOM Elements */
const canvas = document.getElementById(CANVAS_ID);
const context = canvas.getContext('2d');
const loader = document.getElementById('loader');
const progressText = document.getElementById('progress');
const stickyContainer = document.querySelector('.sticky-container');
const textSteps = document.querySelectorAll('.content-box');

/* Utils */
// Helper to scale canvas for high DPI and contain logic
const updateCanvasSize = () => {
    // Set internal resolution to match window size (or a fixed max for performance)
    // Here we match window size for sharpness
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Redraw current frame after resize
    if (images[currentFrameIndex]) {
        renderFrame(currentFrameIndex);
    }
};

/* 1. Preloading */
const preloadImages = () => {
    let criticalLoaded = false;
    const CRITICAL_FRAMES = 5; // Start as soon as first 5 frames are in

    for (let i = 1; i <= FRAME_COUNT; i++) {
        const paddedIndex = i.toString().padStart(3, '0');
        const img = new Image();

        const tryLoad = (extIndex = 0) => {
            if (extIndex >= IMAGE_EXTENSIONS.length) return;
            img.src = `${IMAGE_PATH_PREFIX}${paddedIndex}${IMAGE_EXTENSIONS[extIndex]}`;
        };

        img.onload = () => {
            imagesLoaded++;
            images[i - 1] = img;

            const percent = Math.floor((imagesLoaded / FRAME_COUNT) * 100);
            progressText.innerText = `${percent}%`;

            // Start experience as soon as first few frames are ready
            if (imagesLoaded >= CRITICAL_FRAMES && !criticalLoaded) {
                criticalLoaded = true;
                startExperience();
            }
        };

        img.onerror = () => {
            const currentExtIndex = IMAGE_EXTENSIONS.findIndex(ext => img.src.endsWith(ext));
            tryLoad(currentExtIndex + 1);
        };

        tryLoad();
    }
};


/* 2. Rendering */
const renderFrame = (index) => {
    const img = images[index];
    if (!img) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // "Object-fit: contain" logic for Canvas
    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = img.width / img.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imageRatio) {
        // Canvas is wider than image -> constrain by height
        drawHeight = canvas.height;
        drawWidth = img.width * (canvas.height / img.height);
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    } else {
        // Canvas is taller/narrower -> constrain by width
        drawWidth = canvas.width;
        drawHeight = img.height * (canvas.width / img.width);
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    }

    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
};

/* 3. Scroll Logic */
const handleScroll = () => {
    // Current scroll position relative to the top of the viewport
    const stickyTop = stickyContainer.getBoundingClientRect().top;

    // Total scrollable distance (Container height - 1 viewport height)
    // We want to map this range to our frame sequence
    const maxScroll = stickyContainer.offsetHeight - window.innerHeight;

    // Calculate scroll progress (0 to 1)
    // -stickyTop is how many pixels we've scrolled into the container
    // We clamp between 0 and 1
    let scrollFraction = -stickyTop / maxScroll;
    scrollFraction = Math.max(0, Math.min(1, scrollFraction));

    // Map to frame index
    const frameIndex = Math.floor(scrollFraction * (FRAME_COUNT - 1));

    // Use requestAnimationFrame for smooth drawing only if frame changes
    if (frameIndex !== currentFrameIndex) {
        currentFrameIndex = frameIndex;
        window.requestAnimationFrame(() => renderFrame(currentFrameIndex));
    }

    // Trigger Text Animations
    updateTextOverlays(scrollFraction);
};

const updateTextOverlays = (progress) => {
    // Simple logic:
    // 0.0 - 0.2: Intro
    // 0.25 - 0.5: Step 2
    // 0.55 - 0.8: Step 3
    // 0.85 - 1.0: Step 4

    // Reset all first
    textSteps.forEach(el => el.classList.remove('active'));

    if (progress < 0.2) {
        textSteps[0].classList.add('active');
    } else if (progress >= 0.25 && progress < 0.5) {
        textSteps[1].classList.add('active');
    } else if (progress >= 0.55 && progress < 0.8) {
        textSteps[2].classList.add('active');
    } else if (progress >= 0.85) {
        textSteps[3].classList.add('active');
    }
};

/* Initialization */
const startExperience = () => {
    // Hide loader
    loader.classList.add('hidden');

    // Initial draw
    updateCanvasSize();

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateCanvasSize);

    // Initial text state
    updateTextOverlays(0);
};

/* 7. Back to Top Logic */
const initBackToTop = () => {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

// Start
preloadImages();

// =========================================
// Trusted Clients Carousel & Reveal
// =========================================

const initTrustedSection = () => {
    const track = document.getElementById('logo-track');
    const section = document.querySelector('.trusted-section');

    if (!track || !section) return;

    // We use numbers 0 to 8 
    const logoIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const isLightDefault = document.body.classList.contains('light-theme');

    // Function to create logo elements
    const createLogos = (indices, isLight) => {
        indices.forEach(index => {
            const container = document.createElement('div');
            container.className = 'logo-item';

            const img = document.createElement('img');
            // Use logo-m# for light, logo# for dark
            const logoName = isLight ? `logo-m${index}.png` : `logo${index}.png`;
            img.src = `assets/images/clients/${logoName}`;
            img.alt = 'Client Logo';
            img.className = 'client-logo';
            img.loading = 'lazy';
            img.setAttribute('data-index', index); // Store index for easy updating

            container.appendChild(img);
            track.appendChild(container);
        });
    };

    // Initial load
    createLogos(logoIndices, isLightDefault);

    // Clone once for seamless infinite scroll
    createLogos(logoIndices, isLightDefault);

    // Add LTR class for left-to-right motion
    track.classList.add('ltr');

    // Reveal On Scroll logic
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.9;
        const sectionTop = section.getBoundingClientRect().top;

        if (sectionTop < triggerBottom) {
            section.classList.add('reveal');
        }
    };

    window.addEventListener('scroll', revealOnScroll, { passive: true });
    revealOnScroll(); // Check once on init
};

// Function to update client logos when theme changes
const updateClientLogos = (isLight) => {
    const logos = document.querySelectorAll('.client-logo');
    logos.forEach(img => {
        const index = img.getAttribute('data-index');
        if (index !== null) {
            const logoName = isLight ? `logo-m${index}.png` : `logo${index}.png`;
            img.src = `assets/images/clients/${logoName}`;
        }
    });
};

// Initialize newly added section
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initTrustedSection();
    initScrollReveal();
    initMagneticButtons();
    initHeroParallax();
    initSecurityFlow();
    initFAQ();
    initWhatsApp();
    initProjectsScroll();
    initContactForm();
    initBackToTop();
});

/* 6. Contact Form Logic */
const initContactForm = () => {
    const form = document.getElementById('project-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic feedback for the user
        const btn = form.querySelector('.btn-submit span');
        const originalText = btn.textContent;

        btn.textContent = 'SENDING...';
        btn.parentElement.classList.add('sending');

        // Simulate network delay
        setTimeout(() => {
            btn.textContent = 'MESSAGE SENT! ✓';
            btn.parentElement.style.background = '#00c853';
            btn.parentElement.style.boxShadow = '0 0 20px rgba(0, 200, 83, 0.4)';
            form.reset();

            setTimeout(() => {
                btn.textContent = originalText;
                btn.parentElement.style.background = '';
                btn.parentElement.style.boxShadow = '';
                btn.parentElement.classList.remove('sending');
            }, 3000);
        }, 1500);
    });
};

// =========================================
// OFG Tech Projects Horizontal Scroll
// =========================================

const initProjectsScroll = () => {
    const section = document.querySelector('.projects-section');
    const track = document.getElementById('projects-track');

    if (!section || !track) return;

    const handleProjectsScroll = () => {
        // Only run on desktop screens (width > 800px)
        if (window.innerWidth <= 800) {
            track.style.transform = 'none';
            return;
        }

        const sectionRect = section.getBoundingClientRect();
        const totalScrollable = section.offsetHeight - window.innerHeight;

        // Progress: 0 (start of section) to 1 (end of section)
        let progress = -sectionRect.top / totalScrollable;
        progress = Math.max(0, Math.min(1, progress));

        // Calculate maximum translation (total track width minus container width)
        const trackWidth = track.scrollWidth;
        const containerWidth = track.parentElement.clientWidth;
        const maxTranslate = trackWidth - containerWidth;

        // Apply translation
        const translateX = -progress * maxTranslate;

        window.requestAnimationFrame(() => {
            track.style.transform = `translateX(${translateX}px)`;
        });
    };

    window.addEventListener('scroll', handleProjectsScroll, { passive: true });
    window.addEventListener('resize', handleProjectsScroll);
    handleProjectsScroll(); // Initial check
};

// =========================================
// Security Flow Animation
// =========================================
const initSecurityFlow = () => {
    const canvas = document.getElementById('flow-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    // Config
    const particleCount = 8; // Exactly 5 particles total
    const speed = 0.003; // Slightly faster for fewer shapes
    let particles = [];

    // Theme colors
    let lineColor = 'rgba(255, 255, 255, 0.1)';
    let particleColor = '#ffffff';

    const resize = () => {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    };

    // Initialize particles
    const initParticles = () => {
        particles = [];
        const types = ['code', 'cloud', 'database', 'chip'];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                t: Math.random(), // Start position 0-1
                lineIndex: Math.floor(Math.random() * 6), // Random line
                type: types[Math.floor(Math.random() * types.length)],
                size: 12 + Math.random() * 8,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05
            });
        }
    };

    const drawLine = (p0, p1, p2, p3) => {
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.stroke();
    };

    // Calculate point on bezier cubic curve
    const getBezierPoint = (t, p0, p1, p2, p3) => {
        const cX = 3 * (p1.x - p0.x);
        const bX = 3 * (p2.x - p1.x) - cX;
        const aX = p3.x - p0.x - cX - bX;

        const cY = 3 * (p1.y - p0.y);
        const bY = 3 * (p2.y - p1.y) - cY;
        const aY = p3.y - p0.y - cY - bY;

        const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
        const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

        return { x, y };
    };

    const drawShape = (x, y, size, type, rotation) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        ctx.beginPath();
        const s = size;
        const h = size / 2;

        if (type === 'code') {
            // Angle brackets < >
            // Left bracket
            ctx.moveTo(-h, 0);
            ctx.lineTo(-h / 2, -h);
            ctx.moveTo(-h, 0);
            ctx.lineTo(-h / 2, h);

            // Right bracket
            ctx.moveTo(h, 0);
            ctx.lineTo(h / 2, -h);
            ctx.moveTo(h, 0);
            ctx.lineTo(h / 2, h);
            ctx.stroke();
        } else if (type === 'cloud') {
            // Simple cloud shape centered at (0,0)
            ctx.arc(-h / 2, 0, h / 2, Math.PI * 0.5, Math.PI * 1.5);
            ctx.arc(0, -h / 2, h / 2, Math.PI * 1, Math.PI * 2);
            ctx.arc(h / 2, 0, h / 2, Math.PI * 1.5, Math.PI * 0.5);
            ctx.lineTo(-h / 2, h / 4);
            ctx.stroke();
        } else if (type === 'database') {
            // Cylinder shape centered at (0,0)
            ctx.ellipse(0, -h / 2, h, h / 3, 0, 0, Math.PI * 2);
            ctx.moveTo(-h, -h / 2);
            ctx.lineTo(-h, h / 2);
            ctx.ellipse(0, h / 2, h, h / 3, 0, 0, Math.PI);
            ctx.moveTo(h, h / 2);
            ctx.lineTo(h, -h / 2);
            ctx.stroke();
        } else if (type === 'chip') {
            // Modern chip icon centered at (0,0)
            ctx.rect(-h, -h, s, s);
            // Internal nodes
            ctx.moveTo(-h, 0); ctx.lineTo(-h - 4, 0);
            ctx.moveTo(h, 0); ctx.lineTo(h + 4, 0);
            ctx.moveTo(0, -h); ctx.lineTo(0, -h - 4);
            ctx.moveTo(0, h); ctx.lineTo(0, h + 4);
            ctx.stroke();
        }
        ctx.restore();
    };

    const animate = () => {
        // Updated colors based on theme
        const isLight = document.body.classList.contains('light-theme');
        lineColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        particleColor = isLight ? '#0a0f1d' : '#ffffff';

        ctx.clearRect(0, 0, width, height);

        const isMobile = width < 768;
        const centerX = width / 2;
        const centerY = isMobile ? height * 0.88 : height / 2;
        const targetOffset = 40;

        let lines = [];
        if (isMobile) {
            // Mobile Vertical Paths (From top to bottom button)
            lines = [
                // Top-left arc
                { s: { x: width * 0.05, y: height * 0.1 }, c1: { x: width * 0.05, y: height * 0.5 }, c2: { x: centerX * 0.5, y: centerY }, e: { x: centerX, y: centerY - targetOffset } },
                // Top-right arc
                { s: { x: width * 0.95, y: height * 0.1 }, c1: { x: width * 0.95, y: height * 0.5 }, c2: { x: width - centerX * 0.5, y: centerY }, e: { x: centerX, y: centerY - targetOffset } },
                // Mid-left curve
                { s: { x: 0, y: height * 0.5 }, c1: { x: width * 0.2, y: height * 0.6 }, c2: { x: centerX * 0.8, y: height * 0.8 }, e: { x: centerX, y: centerY - targetOffset } },
                // Mid-right curve
                { s: { x: width, y: height * 0.5 }, c1: { x: width * 0.8, y: height * 0.6 }, c2: { x: width - centerX * 0.8, y: height * 0.8 }, e: { x: centerX, y: centerY - targetOffset } },
                // Direct Center Top
                { s: { x: centerX, y: height * 0.2 }, c1: { x: centerX, y: height * 0.4 }, c2: { x: centerX, y: height * 0.6 }, e: { x: centerX, y: centerY - targetOffset } }
            ];
        } else {
            // Desktop Horizontal Paths
            lines = [
                { s: { x: 0, y: height * 0.2 }, c1: { x: width * 0.2, y: height * 0.2 }, c2: { x: width * 0.3, y: centerY }, e: { x: centerX - 60, y: centerY } },
                { s: { x: 0, y: height * 0.5 }, c1: { x: width * 0.1, y: height * 0.5 }, c2: { x: width * 0.3, y: centerY }, e: { x: centerX - 60, y: centerY } },
                { s: { x: 0, y: height * 0.8 }, c1: { x: width * 0.2, y: height * 0.8 }, c2: { x: width * 0.3, y: centerY }, e: { x: centerX - 60, y: centerY } },
                { s: { x: width, y: height * 0.2 }, c1: { x: width * 0.8, y: height * 0.2 }, c2: { x: width * 0.7, y: centerY }, e: { x: centerX + 60, y: centerY } },
                { s: { x: width, y: height * 0.5 }, c1: { x: width * 0.9, y: height * 0.5 }, c2: { x: width * 0.7, y: centerY }, e: { x: centerX + 60, y: centerY } },
                { s: { x: width, y: height * 0.8 }, c1: { x: width * 0.8, y: height * 0.8 }, c2: { x: width * 0.7, y: centerY }, e: { x: centerX + 60, y: centerY } }
            ];
        }

        // Draw Lines
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        lines.forEach(l => drawLine(l.s, l.c1, l.c2, l.e));

        // Update and Draw Particles
        ctx.strokeStyle = particleColor;
        ctx.lineWidth = 1.5;

        particles.forEach(p => {
            // Loop adjustment in case lineIndex is out of bounds after switch
            if (p.lineIndex >= lines.length) p.lineIndex = Math.floor(Math.random() * lines.length);

            // Move particle
            p.t += speed;
            if (p.t > 1) {
                p.t = 0;
                p.lineIndex = Math.floor(Math.random() * lines.length);
            }

            // Update rotation
            p.rotation += p.rotationSpeed;

            const line = lines[p.lineIndex];
            const pos = getBezierPoint(p.t, line.s, line.c1, line.c2, line.e);

            // Determine opacity based on distance to center to fade out
            let alpha = 1;
            if (p.t > 0.8) alpha = 1 - (p.t - 0.8) * 5;
            if (p.t < 0.1) alpha = p.t * 10;

            ctx.globalAlpha = Math.max(0, alpha);
            drawShape(pos.x, pos.y, p.size, p.type, p.rotation);
            ctx.globalAlpha = 1;
        });

        requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', resize);
};

// =========================================
// Advanced Visual Effects
// =========================================

/* 1. Scroll Reveal Logic */
const initScrollReveal = () => {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .scale-in');

    revealElements.forEach(el => {
        // Assign stagger indices to children if they have stagger-item class
        const staggers = el.querySelectorAll('.stagger-item');
        staggers.forEach((item, index) => {
            item.style.setProperty('--stagger-index', index);
        });
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
};

/* 2. Magnetic Buttons Effect */
const initMagneticButtons = () => {
    const buttons = document.querySelectorAll('.btn-hero-primary, .btn-hero-secondary, .btn-primary, .btn-services, .btn-security, .social-icon');

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
        });
    });
};

/* 3. Subtle Hero Parallax */
const initHeroParallax = () => {
    const hero = document.querySelector('.hero-section');
    const mainImage = document.querySelector('.main-image');
    const statCards = document.querySelectorAll('.stat-card');

    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;

        // Parallax image
        if (mainImage) {
            mainImage.style.transform = `translateY(${scrolled * 0.1}px)`;
        }

        // Stats drift at different speeds
        statCards.forEach((card, i) => {
            const speed = (i + 1) * 0.15;
            card.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
};

// =========================================
// Theme Toggle Functionality
// =========================================

const initThemeToggle = () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const navLogo = document.querySelector('.nav-logo');
    const footerLogo = document.querySelector('.footer-logo');

    // Logo paths
    const DARK_LOGO = 'assets/images/logo.png';
    const LIGHT_LOGO = 'assets/images/logo-light.png';

    // Function to update logos
    const updateLogos = (isLight) => {
        const logoSrc = isLight ? LIGHT_LOGO : DARK_LOGO;
        if (navLogo) navLogo.src = logoSrc;
        if (footerLogo) footerLogo.src = logoSrc;
        updateClientLogos(isLight);
    };

    // Check for saved theme preference or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';

    // Apply saved theme on load
    if (currentTheme === 'light') {
        body.classList.add('light-theme');
        updateLogos(true);
    }

    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('light-theme');
            const isLight = body.classList.contains('light-theme');
            updateLogos(isLight);
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
};

/* 4. FAQ Accordion Logic */
const initFAQ = () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
};

/* 5. WhatsApp Widget Logic */
const initWhatsApp = () => {
    const trigger = document.getElementById('whatsapp-trigger');
    const close = document.getElementById('chat-close');
    const chatBox = document.getElementById('whatsapp-chat');

    if (!trigger || !chatBox) return;

    trigger.addEventListener('click', () => {
        chatBox.classList.toggle('active');
    });

    close.addEventListener('click', () => {
        chatBox.classList.remove('active');
    });

    // Close on outside click for better UX
    document.addEventListener('click', (e) => {
        if (!chatBox.contains(e.target) && !trigger.contains(e.target)) {
            chatBox.classList.remove('active');
        }
    });
};
