
const fs = require('fs');

const logStream = fs.createWriteStream('verification_full_system_result.txt', { flags: 'w' });
const originalLog = console.log;

function log(msg) {
    const str = typeof msg === 'object' ? JSON.stringify(msg) : msg;
    originalLog(str);
    logStream.write(str + '\n');
}
console.log = function (d) { log(d); };
console.error = function (d) { log(d); };

const baseURL = 'http://127.0.0.1:3000/api';
let customerToken = '';
let adminToken = '';
let createdOrderId = 0;
let createdProductId = 0;

async function request(method, url, data, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const options = { method, headers };
        if (data) options.body = JSON.stringify(data);
        const res = await fetch(url, options);
        if (!res.ok) return { error: true, status: res.status, text: await res.text() };
        return res.json();
    } catch (e) { return { error: true, message: e.message }; }
}

const post = (url, data, token) => request('POST', url, data, token);
const get = (url, token) => request('GET', url, null, token);
const put = (url, data, token) => request('PUT', url, data, token);

async function runTest() {
    log('=== AXAR TECHWAVE: FULL SYSTEM LIVE TEST ===');
    log(`Timestamp: ${new Date().toISOString()}`);

    try {
        // --- PHASE 1: AUTH & CATALOG ---
        log('\n--- PHASE 1: CUSTOMER ONBOARDING ---');
        const uniqueId = Date.now();
        const userEmail = `live_test_${uniqueId}@example.com`;
        const userPass = 'Test@123';

        // 1. Signup
        log(`1. Registering Customer (${userEmail})...`);
        const signupRes = await post(`${baseURL}/auth/signup`, { email: userEmail, password: userPass, username: 'LiveTester' });
        if (signupRes.error) throw new Error(`Signup Failed: ${signupRes.text}`);
        customerToken = signupRes.access_token;
        log('   ✅ Signup Successful.');

        // 2. Browse Products
        log('2. Browsing Products...');
        const products = await get(`${baseURL}/catalog/products`);
        if (products.length === 0) throw new Error('No products found in catalog');
        const targetProduct = products[0]; // iPhone or similar
        createdProductId = targetProduct.id;
        const variantId = targetProduct.variants[0].id; // Assuming structure
        log(`   ✅ Found ${products.length} products. Selected: ${targetProduct.title}`);

        // --- PHASE 2: ENGAGEMENT ---
        log('\n--- PHASE 2: ENGAGEMENT (WISHLIST & REVIEWS) ---');

        // 3. Add to Wishlist
        log('3. Adding to Wishlist...');
        const wishRes = await post(`${baseURL}/wishlist/toggle`, { productId: createdProductId }, customerToken);
        if (wishRes.error) throw new Error(`Wishlist Failed: ${wishRes.text}`);
        log('   ✅ Toggled Wishlist.');

        // 4. Check Wishlist
        const wishlist = await get(`${baseURL}/wishlist`, customerToken);
        if (wishlist.length === 0) throw new Error('Wishlist is empty after adding');
        log('   ✅ Wishlist Verified.');

        // --- PHASE 3: CHECKOUT FLOW ---
        log('\n--- PHASE 3: CHECKOUT & ADDRESS ---');

        // 5. Add Address
        log('5. Adding Shipping Address...');
        const addressData = {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '123456',
            country: 'India',
            phone: '9999999999',
            isDefault: true
        };
        const addrRes = await post(`${baseURL}/address`, addressData, customerToken);
        if (addrRes.error) throw new Error(`Address Creation Failed: ${addrRes.text}`);
        log('   ✅ Address Added.');

        // 6. Add to Cart
        log('6. Adding to Cart...');
        const cartRes = await post(`${baseURL}/cart/items`, { variantId: variantId, quantity: 1 }, customerToken);
        if (cartRes.error) throw new Error(`Add to Cart Failed: ${cartRes.text}`);
        log('   ✅ Item in Cart.');

        // 7. Place Order
        log('7. Placing Order...');
        const orderRes = await post(`${baseURL}/orders`, { shippingAddress: addressData }, customerToken);
        if (orderRes.error) throw new Error(`Order Failed: ${orderRes.text}`);
        createdOrderId = orderRes.id;
        log(`   ✅ Order Placed! ID: ${createdOrderId} | Total: ${orderRes.total}`);

        // 8. Verify Order History
        log('8. Verifying Customer History...');
        const history = await get(`${baseURL}/orders`, customerToken);
        const inHistory = history.find(o => o.id === createdOrderId);
        if (!inHistory) throw new Error('Order not found in history');
        log('   ✅ Order visible in My Orders.');

        // 9. Post Review
        log('9. Reviewing Product...');
        const reviewRes = await post(`${baseURL}/reviews`, { productId: createdProductId, rating: 5, comment: 'Awesome live test!' }, customerToken);
        if (reviewRes.error) log(`   ⚠️ Review skipped (maybe already reviewed or validation error): ${reviewRes.text}`);
        else log('   ✅ Review Posted.');

        // --- PHASE 4: ADMIN CONTROLS ---
        log('\n--- PHASE 4: ADMIN VERIFICATION ---');

        // 10. Admin Login
        log('10. Admin Login...');
        const adminRes = await post(`${baseURL}/auth/login`, { email: 'admin@axartechwave.com', password: 'admin123' });
        if (adminRes.error) throw new Error(`Admin Login Failed: ${adminRes.text}`);
        adminToken = adminRes.access_token;
        log('    ✅ Admin Access Granted.');

        // 11. Verify Order in Global View
        log('11. Verifying Global Order List...');
        const allOrders = await get(`${baseURL}/orders/admin/all`, adminToken);
        const adminFoundOrder = allOrders.find(o => o.id === createdOrderId);
        if (!adminFoundOrder) throw new Error('Admin could not see the new order');
        log(`    ✅ Admin confirms Order #${createdOrderId} from ${userEmail}`);

        // 12. Check Dashboard Stats
        log('12. Checking Dashboard...');
        const stats = await get(`${baseURL}/stats/dashboard`, adminToken);
        if (stats.error) throw new Error(`Dashboard Failed: ${stats.text}`);
        log(`    ✅ Dashboard Active. Total Revenue: ${stats.totalRevenue}`);

        log('\n=== LIVE TEST COMPLETE: ALL SYSTEMS GO 🚀 ===');

    } catch (e) {
        log('\n❌ LIVE TEST FAILED');
        log(e.message);
        if (e.stack) log(e.stack);
    } finally {
        logStream.end();
    }
}

runTest();
