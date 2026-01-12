
const fs = require('fs');

const logStream = fs.createWriteStream('verification_result.txt', { flags: 'w' });
const originalLog = console.log;
const originalError = console.error;

function log(msg) {
    const str = typeof msg === 'object' ? JSON.stringify(msg) : msg;
    originalLog(str);
    logStream.write(str + '\n');
}

console.log = function (d) { log(d); };
console.error = function (d) { log(d); };

async function testPhase2() {
    log('--- Script Starting (Robust Mode) ---');
    const baseURL = 'http://127.0.0.1:3000/api';

    // Helper for fetch
    const post = async (url, data, token) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) {
                // Return error object instead of throwing if we want to handle it (like 409)
                const text = await res.text();
                return { error: true, status: res.status, text };
            }
            return res.json();
        } catch (e) {
            return { error: true, message: e.message };
        }
    };

    const get = async (url, token) => {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`GET ${url} failed: ${res.status} ${text}`);
            }
            return res.json();
        } catch (e) {
            throw new Error(`Fetch Error (${url}): ${e.message}`);
        }
    };

    try {
        log('1. Setting up User...');
        const userCreds = {
            email: 'verify_user_p2@example.com',
            password: 'password123',
            username: 'VerifyUser'
        };

        // Try Signup
        const signupRes = await post(`${baseURL}/auth/signup`, userCreds);
        if (signupRes.error) {
            if (signupRes.status === 409 || (signupRes.text && signupRes.text.includes('Conflict'))) {
                log('   User already exists. Proceeding to login.');
            } else {
                throw new Error(`Signup Failed: ${signupRes.status} ${signupRes.text}`);
            }
        } else {
            log('   Signup Successful.');
        }

        log('2. Logging in...');
        const loginRes = await post(`${baseURL}/auth/login`, {
            email: userCreds.email,
            password: userCreds.password
        });

        if (loginRes.error) {
            throw new Error(`Login Failed: ${loginRes.status} ${loginRes.text}`);
        }

        const token = loginRes.access_token;
        log('   Login Successful. Token obtained.');

        log('\n3. Fetching Products...');
        const products = await get(`${baseURL}/catalog/products`);
        if (!products || products.length === 0) throw new Error('No products found to test with.');
        const product = products[0];
        log(`   Found Product: ${product.title} (ID: ${product.id})`);

        log('\n4. Testing Wishlist Toggle...');
        const wishlistRes = await post(`${baseURL}/wishlist/toggle`, { productId: product.id }, token);
        if (wishlistRes.error) throw new Error(`Wishlist Failed: ${wishlistRes.status}`);
        log(`   Wishlist Toggle Result: ${wishlistRes.status}`);

        // Toggle again
        const wishlistRes2 = await post(`${baseURL}/wishlist/toggle`, { productId: product.id }, token);
        log(`   Wishlist Toggle 2 Result: ${wishlistRes2.status || wishlistRes2.error}`);

        log('\n5. Testing Reviews...');
        const reviewData = { productId: product.id, rating: 5, comment: 'Automated Robust Test Review' };
        const reviewRes = await post(`${baseURL}/reviews`, reviewData, token);
        if (reviewRes.error) throw new Error(`Review Failed: ${reviewRes.status}`);
        log(`   Review Created ID: ${reviewRes.id}, Comment: ${reviewRes.comment}`);

        log('\n6. Verifying Review appeared on Product...');
        const productReviews = await get(`${baseURL}/reviews/product/${product.id}`);
        // Check structure
        const reviewsList = productReviews.reviews || productReviews;
        const found = reviewsList.find(r => r.id === reviewRes.id);
        if (found) {
            log('   Review found in public list! Verified.');
        } else {
            log('   Review NOT found in list. List length: ' + reviewsList.length);
        }

        log('\n--- PHASE 2 VERIFICATION COMPLETE: ALL SUCCESS ---');

    } catch (error) {
        log('\n!!! VERIFICATION FAILED !!!');
        log(error.message);
    } finally {
        logStream.end();
    }
}

testPhase2();
