
const fs = require('fs');

const logStream = fs.createWriteStream('verification_phase3_result.txt', { flags: 'w' });
const originalLog = console.log;
const originalError = console.error;

function log(msg) {
    const str = typeof msg === 'object' ? JSON.stringify(msg) : msg;
    originalLog(str);
    logStream.write(str + '\n');
}

console.log = function (d) { log(d); };
console.error = function (d) { log(d); };

async function testPhase3() {
    log('--- Phase 3 Verification: Address & Orders ---');
    const baseURL = 'http://127.0.0.1:3000/api';

    const post = async (url, data, token) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) return { error: true, status: res.status, text: await res.text() };
            return res.json();
        } catch (e) { return { error: true, message: e.message }; }
    };

    const get = async (url, token) => {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) return { error: true, status: res.status, text: await res.text() };
            return res.json();
        } catch (e) { return { error: true, message: e.message }; }
    };

    try {
        // 1. Setup User
        log('1. Setting up User...');
        const userCreds = { email: 'phase3_user@example.com', password: 'password123', username: 'Phase3User' };
        await post(`${baseURL}/auth/signup`, userCreds); // Ignore fail if exists

        const loginRes = await post(`${baseURL}/auth/login`, { email: userCreds.email, password: userCreds.password });
        if (loginRes.error) throw new Error(`Login Failed: ${loginRes.status} ${loginRes.text}`);
        const token = loginRes.access_token;
        log('   Login Successful.');

        // 2. Address Book
        log('\n2. Testing Address Book...');
        const addressData = {
            name: "Test User",
            phone: "9876543210",
            line1: "123 Test St",
            city: "Test City",
            state: "Test State",
            country: "India",
            pincode: "394210",
            isDefault: true
        };
        const createAddrRes = await post(`${baseURL}/address`, addressData, token);
        if (createAddrRes.error) throw new Error(`Create Address Failed: ${createAddrRes.status} ${createAddrRes.text}`);
        log(`   Address Created ID: ${createAddrRes.id}`);

        const addresses = await get(`${baseURL}/address`, token);
        if (addresses.error) throw new Error('Get Addresses Failed');
        log(`   Addresses Found: ${addresses.length}`);
        if (!addresses.find(a => a.id === createAddrRes.id)) throw new Error('Created address not found in list');
        log('   Address Verified.');

        // 3. Order History (Pre-check)
        log('\n3. Checking Order History (Empty)...');
        const ordersEmpty = await get(`${baseURL}/orders`, token);
        log(`   Orders Found: ${ordersEmpty.length}`);

        // 4. Create Order Flow
        log('\n4. Creating Order...');
        // a. Get Product
        const products = await get(`${baseURL}/catalog/products`);
        const product = products[0];
        const variantId = product.variants[0].id; // Assuming structure
        log(`   Adding Product: ${product.title} (Variant: ${variantId}) to cart`);

        // b. Add to Cart
        const cartRes = await post(`${baseURL}/cart/items`, { variantId: variantId, quantity: 1 }, token);
        if (cartRes.error) throw new Error(`Add to Cart Failed: ${cartRes.status} ${cartRes.text}`);
        log('   Added to Cart.');

        // c. Checkout
        const orderRes = await post(`${baseURL}/orders`, { shippingAddress: addressData }, token);
        if (orderRes.error) throw new Error(`Create Order Failed: ${orderRes.status} ${orderRes.text}`);
        log(`   Order Created ID: ${orderRes.id}, Total: ${orderRes.total}`);

        // 5. Verify Order History
        log('\n5. Verifying Order Logic...');
        const ordersFinal = await get(`${baseURL}/orders`, token);
        const orderFound = ordersFinal.find(o => o.id === orderRes.id);
        if (orderFound) {
            log(`   Order found in history! Status: ${orderFound.status}`);
            log(`   Items: ${orderFound.items.length}`);
        } else {
            throw new Error('New order not found in history');
        }

        log('\n--- PHASE 3 VERIFICATION COMPLETE: ALL SUCCESS ---');

    } catch (error) {
        log('\n!!! VERIFICATION FAILED !!!');
        log(error.message);
    } finally {
        logStream.end();
    }
}

testPhase3();
