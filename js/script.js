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
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const paddedIndex = i.toString().padStart(3, '0');
        const img = new Image();

        const tryLoad = (extIndex = 0) => {
            if (extIndex >= IMAGE_EXTENSIONS.length) {
                console.error(`Frame ${paddedIndex} not found in any supported format`);
                return;
            }

            img.src = `${IMAGE_PATH_PREFIX}${paddedIndex}${IMAGE_EXTENSIONS[extIndex]}`;
        };

        img.onload = () => {
            imagesLoaded++;
            images[i - 1] = img;

            const percent = Math.floor((imagesLoaded / FRAME_COUNT) * 100);
            progressText.innerText = `${percent}%`;

            if (imagesLoaded === FRAME_COUNT) {
                startExperience();
            }
        };

        img.onerror = () => {
            // Try next extension if current fails
            const currentExtIndex = IMAGE_EXTENSIONS.findIndex(ext =>
                img.src.endsWith(ext)
            );
            tryLoad(currentExtIndex + 1);
        };

        // Start trying extensions
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
});

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
    const buttons = document.querySelectorAll('.btn-hero-primary, .btn-hero-secondary, .btn-primary, .btn-services');

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
