/**
 * FocusTimer - Floating Testimonial Stream v4
 * Slide-in from right, dynamic height, no overlap
 */

(function () {
    'use strict';

    // ============================================
    // Testimonial Data (40 entries)
    // ============================================
    const TESTIMONIALS = [
        // Original 20
        { name: "Sarah L.", text: "Cleanest event timer we've ever used." },
        { name: "Michael O.", text: "Our church finally stopped waving signs at speakers." },
        { name: "Amina K.", text: "Simple, calm, and professional." },
        { name: "Daniel A.", text: "Exactly what live events need." },
        { name: "Rebecca T.", text: "No distractions. Just clarity." },
        { name: "John M.", text: "Works perfectly with our projector." },
        { name: "Grace P.", text: "Setup took less than a minute." },
        { name: "Leo R.", text: "This should be standard at conferences." },
        { name: "Esther N.", text: "The calm warnings are genius." },
        { name: "Victor S.", text: "Finally, a timer that respects speakers." },
        { name: "Naomi D.", text: "Saved our service flow." },
        { name: "Ahmed Y.", text: "No panic, no flashing, just time." },
        { name: "Paul B.", text: "Our AV team loves this." },
        { name: "Hannah C.", text: "It just works." },
        { name: "Samuel I.", text: "FocusTimer feels professional." },
        { name: "Linda W.", text: "Exactly what we needed." },
        { name: "Carlos M.", text: "Simple but powerful." },
        { name: "Joy A.", text: "Clean UI, zero stress." },
        { name: "Kevin F.", text: "The best free timer I've seen." },
        { name: "Ruth O.", text: "Built for real events." },
        // Additional 20
        { name: "James T.", text: "Replaced our clunky stopwatch system." },
        { name: "Elena S.", text: "Our speakers love the gentle warnings." },
        { name: "Marcus J.", text: "Perfect for our Sunday services." },
        { name: "Priya R.", text: "So much better than hand signals." },
        { name: "David K.", text: "Finally, a timer that stays out of the way." },
        { name: "Sofia M.", text: "Elegant and functional." },
        { name: "Thomas H.", text: "Our conference runs smoother now." },
        { name: "Aisha B.", text: "The dark mode is perfect for our venue." },
        { name: "Robert L.", text: "Worth every minute of setup time." },
        { name: "Maya P.", text: "Exactly the professionalism we needed." },
        { name: "Chris W.", text: "No more awkward time signals." },
        { name: "Fatima Z.", text: "Clean, simple, effective." },
        { name: "Andrew G.", text: "Works flawlessly with our stream." },
        { name: "Jessica N.", text: "Our worship team recommends this." },
        { name: "Emmanuel O.", text: "Best investment for our events." },
        { name: "Catherine L.", text: "Looks great on our projection screen." },
        { name: "Patrick S.", text: "Reliable and distraction-free." },
        { name: "Michelle D.", text: "The calm design reduces speaker anxiety." },
        { name: "Benjamin F.", text: "Professional grade, free price." },
        { name: "Lily C.", text: "Our production team can't live without it." }
    ];

    // ============================================
    // Configuration
    // ============================================
    const CONFIG = {
        spawnInterval: 3500,      // New card every 3.5 seconds
        cardGap: 12,              // Gap between cards
        topOffset: 24,            // Space from top edge
        fadeStartThreshold: 0.4,  // Start subtle fade at 40% from top
        fadeEndThreshold: 0.98,   // Fully faded near bottom (98%)
        maxCardsOnScreen: 8,      // Allow more cards to fill screen
        recentQueueSize: 15,      // Prevent repeats
        containerSelector: '#testimonial-container'
    };

    // ============================================
    // State
    // ============================================
    let recentlyShown = [];
    let activeCards = [];
    let container = null;
    let prefersReducedMotion = false;

    // ============================================
    // Utility Functions
    // ============================================

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getNextTestimonial() {
        const available = TESTIMONIALS.filter((t, idx) => !recentlyShown.includes(idx));

        if (available.length === 0) {
            recentlyShown = [];
            return getNextTestimonial();
        }

        const randomIndex = randomInt(0, available.length - 1);
        const testimonial = available[randomIndex];
        const originalIndex = TESTIMONIALS.indexOf(testimonial);

        recentlyShown.push(originalIndex);
        if (recentlyShown.length > CONFIG.recentQueueSize) {
            recentlyShown.shift();
        }

        return testimonial;
    }

    function getInitials(name) {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0][0] + parts[1][0];
        }
        return name[0];
    }

    // ============================================
    // Card Management
    // ============================================

    function createCard(testimonial) {
        const card = document.createElement('div');
        card.className = 'testimonial-card';

        if (prefersReducedMotion) {
            card.classList.add('reduced-motion');
        }

        card.innerHTML = `
            <div class="testimonial-avatar">${getInitials(testimonial.name)}</div>
            <div class="testimonial-content">
                <span class="testimonial-name">${testimonial.name}</span>
                <p class="testimonial-text">"${testimonial.text}"</p>
            </div>
        `;

        return card;
    }

    function calculatePositions() {
        const viewportHeight = window.innerHeight;
        const fadeStartY = viewportHeight * CONFIG.fadeStartThreshold;
        const fadeEndY = viewportHeight * CONFIG.fadeEndThreshold;

        let currentY = CONFIG.topOffset;

        activeCards.forEach((card) => {
            // Get actual card height
            const cardHeight = card.offsetHeight || 80;

            // Set position
            card.style.transform = `translateX(0) translateY(${currentY}px)`;

            // Apply gradual fade based on position
            if (currentY > fadeStartY) {
                const fadeProgress = (currentY - fadeStartY) / (fadeEndY - fadeStartY);
                card.style.opacity = Math.max(0, 1 - Math.min(1, fadeProgress));
            } else {
                card.style.opacity = 1;
            }

            // Move to next position
            currentY += cardHeight + CONFIG.cardGap;
        });

        // Remove cards that are fully faded
        activeCards = activeCards.filter((card) => {
            const opacity = parseFloat(card.style.opacity);
            if (opacity <= 0.05) {
                card.classList.add('exiting');
                setTimeout(() => card.remove(), 300);
                return false;
            }
            return true;
        });
    }

    function spawnCard() {
        if (!container) return;

        // Remove oldest if at max
        if (activeCards.length >= CONFIG.maxCardsOnScreen) {
            const oldest = activeCards.pop();
            if (oldest) {
                oldest.classList.add('exiting');
                setTimeout(() => oldest.remove(), 300);
            }
        }

        const testimonial = getNextTestimonial();
        const card = createCard(testimonial);

        // Set initial position (off screen to the right)
        card.style.transform = `translateX(120%) translateY(${CONFIG.topOffset}px)`;
        card.style.opacity = '0';

        // Add to container
        container.appendChild(card);

        // Insert at beginning of array (newest on top)
        activeCards.unshift(card);

        // Trigger slide-in animation after a frame (to get accurate height)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.classList.add('visible');
                calculatePositions();
            });
        });

        // Schedule next card
        setTimeout(spawnCard, CONFIG.spawnInterval);
    }

    function isMobile() {
        return window.innerWidth < 768;
    }

    function init() {
        if (isMobile()) return;

        container = document.querySelector(CONFIG.containerSelector);
        if (!container) {
            console.warn('Testimonial container not found');
            return;
        }

        prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Start after initial delay
        setTimeout(spawnCard, 2000);
    }

    // ============================================
    // Start on DOM Ready
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
