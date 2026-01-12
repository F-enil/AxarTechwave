const fetch = require('node-fetch'); // Assuming node-fetch or native fetch in newer node

// Polyfill for Node < 18 if needed, but assuming modern environment given NestJS
// If node-fetch isn't there, we'll see an error and can switch to http module. 
// Actually, let's use standard 'http' to be dependency-free/safe or just assume native fetch if Node 18+.
// Let's try native fetch first.

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log('🚀 Starting System Health Check...');

    // 1. Admin Login
    console.log('\n[1/4] Testing Admin Login...');
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@axartechwave.com', password: 'admin123' })
    });

    if (!adminRes.ok) throw new Error(`Admin Login Failed: ${adminRes.status}`);
    const adminData = await adminRes.json();
    const adminToken = adminData.access_token;
    console.log('✅ Admin Logged In. Token received.');

    // 2. Create Product
    console.log('\n[2/4] Testing Admin Create Product...');
    const productSlug = `auto-test-${Date.now()}`;
    const productRes = await fetch(`${BASE_URL}/catalog/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            title: 'Automated Test Product',
            description: 'Created by e2e script',
            slug: productSlug,
            status: 'active',
            categoryId: 1,
            variants: [{
                sku: `SKU-${Date.now()}`,
                stock: 50,
                attributes: {},
                prices: [{ currency: 'INR', basePrice: 500, salePrice: 450 }]
            }]
        })
    });

    if (!productRes.ok) {
        const err = await productRes.text();
        throw new Error(`Create Product Failed: ${productRes.status} - ${err}`);
    }
    const product = await productRes.json();
    console.log(`✅ Product Created: ${product.title} (ID: ${product.id})`);

    // 3. Customer Signup
    console.log('\n[3/4] Testing Customer Signup...');
    const customerEmail = `testuser${Date.now()}@example.com`;
    // Note: Signup in auth controller typically returns tokens directly
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: customerEmail,
            password: 'password123',
            username: 'TestUser'
        })
    });

    if (!signupRes.ok) throw new Error(`Signup Failed: ${signupRes.status}`);
    const customerData = await signupRes.json();
    const customerToken = customerData.access_token;
    console.log(`✅ Customer Signed Up: ${customerEmail}`);

    // 4. Create Order
    console.log('\n[4/4] Testing Order Placement...');
    // First need to add to cart (backend logic depends on CartService looking up cart)
    // Actually OrdersService.createOrder takes items from CART. So we must add to cart first.

    // 4a. Add to Cart
    await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
            variantId: product.variants[0].id,
            quantity: 1
        })
    });

    // 4b. Place Order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
            shippingAddress: {
                firstName: 'Test',
                lastName: 'User',
                address: '123 Code Lane',
                city: 'Tech City',
                country: 'Internet'
            }
        })
    });

    if (!orderRes.ok) {
        const err = await orderRes.text();
        throw new Error(`Place Order Failed: ${orderRes.status} - ${err}`);
    }
    const order = await orderRes.json();
    console.log(`✅ Order Placed Successfully! ID: #${order.id}, Total: ${order.total}`);

    console.log('\n🎉 ALL SYSTEMS GO! The backend is fully functional.');
}

runTests().catch(err => console.error('\n❌ TEST FAILED:', err.message));
