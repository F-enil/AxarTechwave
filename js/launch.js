document.addEventListener('DOMContentLoaded', () => {
    const curtainLeft = document.getElementById('curtainLeft');
    const curtainRight = document.getElementById('curtainRight');
    const ribbonContainer = document.getElementById('ribbonContainer');
    const overlayInfo = document.getElementById('overlayInfo');
    const revealContent = document.querySelector('.reveal-content');

    let isLaunched = false;

    // Check if conflicting keys are pressed, but main trigger is Enter
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isLaunched) {
            launchWebsite();
        }
    });

    // Also allow click on ribbon to launch
    ribbonContainer.addEventListener('click', () => {
        if (!isLaunched) {
            launchWebsite();
        }
    });

    function launchWebsite() {
        isLaunched = true;

        // 1. Play Sound (Optional, if we had one)

        // 2. Animate Ribbon Cutting
        ribbonContainer.classList.add('cut');

        // 3. Fire Confetti
        fireConfetti();

        // 4. Fade out text overlay
        overlayInfo.classList.add('fade-out');

        // 5. Open Curtains (slight delay)
        setTimeout(() => {
            curtainLeft.classList.add('open');
            curtainRight.classList.add('open');
            revealContent.classList.add('show');
        }, 500);

        // 6. Redirect after animation
        // Curtain transition is 2.5s, plus 0.5s delay = 3s total roughly
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3500);
    }

    function fireConfetti() {
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        function random(min, max) {
            return Math.random() * (max - min) + min;
        }

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
});
