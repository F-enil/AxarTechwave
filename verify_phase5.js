const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('--- Phase 5 Verification ---');

        // 1. Visit Home
        await page.goto('file:///f:/vs code/axartechwave1/axartechwavedemo.html', { waitUntil: 'networkidle0' });
        console.log('Loaded Homepage');

        // 2. Click Contact Link
        await page.evaluate(() => showPage('contact'));
        await new Promise(r => setTimeout(r, 500));

        // Check if Contact Form exists
        const contactForm = await page.$('#contact-page form');
        if (contactForm) console.log('PASS: Contact Form found');
        else console.error('FAIL: Contact Form not found');

        // 3. Fill Contact Form (if we have JS mock or backend running, this might fail without backend)
        // Since we are running file protocol, API calls will fail.
        // But we verified code changes.

        // 4. Check Wishlist Logic Existence
        const wishlistFn = await page.evaluate(() => typeof UI.loadWishlist);
        if (wishlistFn === 'function') console.log('PASS: UI.loadWishlist exists');
        else console.error('FAIL: UI.loadWishlist missing');

        // 5. Admin - Check showMessages existence
        // Admin object might not be in scope unless script loaded? 
        // It's loaded via <script src="js/admin.js">
        const adminFn = await page.evaluate(() => typeof Admin.showMessages);
        if (adminFn === 'function') console.log('PASS: Admin.showMessages exists');
        else console.error('FAIL: Admin.showMessages missing');

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await browser.close();
    }
})();
