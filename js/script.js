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

    // List of images from /image/Client/
    const clientLogos = [
        'logo0.png', 'logo1.png', 'logo2.png', 'logo3.png',
        'logo4.png', 'logo5.png', 'logo6.png', 'logo7.png', 'logo8.png'
    ];

    // Function to create logo elements
    const createLogos = (logos) => {
        logos.forEach(logo => {
            const container = document.createElement('div');
            container.className = 'logo-item';

            const img = document.createElement('img');
            img.src = `assets/images/clients/${logo}`;
            img.alt = 'Client Logo';
            img.className = 'client-logo';
            img.loading = 'lazy';

            container.appendChild(img);
            track.appendChild(container);
        });
    };

    // Initial load
    createLogos(clientLogos);

    // Clone once for seamless infinite scroll
    createLogos(clientLogos);

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

// Initialize newly added section
document.addEventListener('DOMContentLoaded', () => {
    initTrustedSection();
});

