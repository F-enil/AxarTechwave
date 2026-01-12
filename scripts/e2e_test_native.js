const http = require('http');

function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        if (body) options.headers['Content-Length'] = Buffer.byteLength(body);

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // Handle empty or non-json
                    }
                } else {
                    console.error(`Error details for ${path}: ${res.statusCode} ${data}`);
                    reject(new Error(`Request to ${path} failed: ${res.statusCode} ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            console.error('Request Error:', e);
            reject(e);
        });
        if (body) req.write(body);
        req.end();
    });
}

async function run() {
    try {
        console.log('--- STARTING E2E TEST ---');

        // 1. Login Admin
        console.log('1. Logging in Admin...');
        // Credentials must match backend/.env or seed.ts defaults
        // Saw in seed output: admin@example.com
        const admin = await request('/auth/login', 'POST', JSON.stringify({
            email: 'admin@example.com',
            password: 'adminpassword'
        }));
        const adminToken = admin.access_token;
        console.log('   Success! Token acquired.');

        // 2. Create Product
        console.log('2. Creating Product...');
        const slug = 'native-test-' + Date.now();
        const product = await request('/catalog/products', 'POST', JSON.stringify({
            title: 'Native HTTP Test Product',
            description: 'Verified via Node http',
            slug: slug,
            status: 'active',
            categoryId: 1,
            variants: [{
                sku: 'NAT-' + Date.now(),
                stock: 100,
                attributes: {},
                prices: [{ currency: 'INR', basePrice: 999 }]
            }]
        }), adminToken);
        console.log(`   Success! Product ID: ${product.id}`);

        // 3. Signup Customer
        console.log('3. Signing up Customer...');
        const email = `native${Date.now()}@test.com`;
        const customer = await request('/auth/signup', 'POST', JSON.stringify({
            email: email,
            username: 'NativeUser',
            password: 'password123'
        }));
        const userToken = customer.access_token;
        console.log('   Success! Customer registered.');

        // 4. Add to Cart
        console.log('4. Adding to Cart...');
        await request('/cart/items', 'POST', JSON.stringify({
            variantId: product.variants[0].id,
            quantity: 1
        }), userToken);
        console.log('   Success! Item added.');

        // 5. Place Order
        console.log('5. Placing Order...');
        const order = await request('/orders', 'POST', JSON.stringify({
            shippingAddress: { name: 'Native Tester', city: 'NodeLand' }
        }), userToken);
        console.log(`   Success! Order #${order.id} placed. Total: ${order.total}`);

        console.log('\n--- ALL TESTS PASSED ---');
    } catch (err) {
        console.error('\n!!! TEST FAILED !!!');
        console.error(err);
        if (err.stack) console.error(err.stack);
    }
}

run();
