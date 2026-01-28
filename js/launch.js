document.addEventListener('DOMContentLoaded', () => {
    // 1. Elements
    const overlay = document.getElementById('launch-overlay');
    const transLogo = document.getElementById('launch-transition-logo');
    let isAnimating = false;

    // 2. Trigger Function
    window.launchWebsite = function () { // Expose globally if needed, or keep local
        if (isAnimating) return;
        isAnimating = true;
        console.log('[Launch] Starting Animation...');

        // Make visible
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.opacity = '1';
            overlay.style.backgroundColor = 'transparent';
            overlay.style.backdropFilter = 'none';
        }

        // Reset Logo
        if (transLogo) {
            transLogo.style.opacity = '0';
            transLogo.style.transition = 'none';
            transLogo.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(0deg)';
            transLogo.style.position = 'absolute';
            transLogo.style.top = '50%';
            transLogo.style.left = '50%';
            transLogo.style.width = '250px';
            transLogo.style.height = 'auto'; // Reset height

            // Force Reflow
            void transLogo.offsetWidth;

            // Phase 1: Zoom In
            transLogo.style.transition = 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            transLogo.style.opacity = '1';
            transLogo.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(0deg)';
        }

        // Phase 2: Spin
        setTimeout(() => {
            if (transLogo) {
                transLogo.style.transition = 'transform 2s linear';
                transLogo.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(360deg)';
            }
        }, 1500);

        // Phase 2b: Confetti
        if (typeof confetti === 'function') {
            const duration = 4000;
            const end = Date.now() + duration;
            const colors = ['#bb0000', '#ffffff', '#FFD700', '#FF4500'];

            (function frame() {
                confetti({ particleCount: 6, angle: 60, spread: 80, origin: { x: 0, y: 0.6 }, colors: colors });
                confetti({ particleCount: 6, angle: 120, spread: 80, origin: { x: 1, y: 0.6 }, colors: colors });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        }

        // Phase 3: Fly (End)
        setTimeout(() => {
            const headerLogo = document.querySelector('header img'); // Target logo
            if (headerLogo && transLogo) {
                const rect = headerLogo.getBoundingClientRect();
                transLogo.style.transition = 'all 1.5s ease-in-out';
                transLogo.style.width = rect.width + 'px';
                transLogo.style.height = rect.height + 'px'; // Correct height match
                transLogo.style.top = rect.top + 'px';
                transLogo.style.left = rect.left + 'px';
                transLogo.style.transform = 'translate(0, 0) scale(1) rotate(720deg)';
            }
        }, 4000);

        // Cleanup
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            isAnimating = false;
        }, 6000);
    };

    // 3. Event Listener (Admin Secret Trigger Only)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey && e.shiftKey) { // Require Ctrl+Shift+Enter to prevent accidents
            if (overlay) {
                launchWebsite();
            }
        }
    });

    console.log('[Launch] Script Loaded & Ready');
});
