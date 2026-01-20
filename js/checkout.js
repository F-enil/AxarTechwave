const Checkout = {
    cartCache: null, // Store cart data to avoid re-fetching on every input

    init() {
        if (!Auth.isLoggedIn()) {
            // Check if on checkout page
            const checkoutPage = document.getElementById('checkout-page');
            if (checkoutPage && checkoutPage.classList.contains('active')) {
                if (window.UI) UI.showToast('Please login to proceed to checkout', 'info');
                else alert('Please login to proceed to checkout');
                showPage('home'); // Or open login modal
            }
        } else {
            // Try to prefill address if logged in
            this.prefillAddress();
        }

        // Clear cache and fetch fresh data on init
        this.cartCache = null;
        this.renderCheckoutItems();

        // Dynamic State Update Calculation (Debounced)
        const stateInput = document.getElementById('state');
        if (stateInput) {
            let debounceTimer;
            const updateHandler = () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.renderCheckoutItems();
                }, 500); // 500ms debounce
            };

            stateInput.addEventListener('input', updateHandler);
            // Remove 'change' listener safely or just overwrite if previously added (browsers handle multiple addEventListener mostly okay but best to be clean)
        }
    },

    async prefillAddress() {
        try {
            const addresses = await API.get('/address');
            if (addresses && addresses.length > 0) {
                const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

                // Name Splitting logic for Address Name
                let fName = '';
                let lName = '';
                if (defaultAddr.name) {
                    const parts = defaultAddr.name.trim().split(' ');
                    fName = parts[0];
                    lName = parts.slice(1).join(' ');
                }

                const mapping = {
                    'firstName': fName,
                    'lastName': lName,
                    'address': defaultAddr.line1,
                    'city': defaultAddr.city,
                    'state': defaultAddr.state,
                    'zip': defaultAddr.pincode,
                    'phone': defaultAddr.phone
                };

                const user = Auth.getUser();
                if (user) {
                    if (document.getElementById('email')) document.getElementById('email').value = user.email || '';

                    // Fallback to username if address name was empty
                    if (!fName && user.username) {
                        const parts = user.username.split(' ');
                        mapping['firstName'] = parts[0] || '';
                        mapping['lastName'] = parts.slice(1).join(' ') || '';
                    }
                }

                for (const [id, value] of Object.entries(mapping)) {
                    const el = document.getElementById(id);
                    if (el) el.value = value || '';
                }

                // If state prefills, trigger update immediately
                if (defaultAddr.state) this.renderCheckoutItems();
            }
        } catch (e) {
            console.log('No saved addresses to prefill', e);
        }
    },

    currentStep: 1,

    nextStep() {
        if (this.currentStep === 1) {
            // Validate Shipping
            const requiredFields = document.querySelectorAll('#shipping-form input[required], #shipping-form textarea[required]');
            let valid = true;
            requiredFields.forEach(field => {
                if (!field.value) {
                    field.classList.add('border-red-500');
                    valid = false;
                } else {
                    field.classList.remove('border-red-500');
                }
            });
            if (!valid) {
                if (window.UI) UI.showToast('Please fill in all required shipping fields.', 'error');
                else alert('Please fill in all required shipping fields.');
                return;
            }
        } else if (this.currentStep === 2) {
            // Validate Payment Selection
            const selectedPayment = document.querySelector('input[name="payment"]:checked');
            if (!selectedPayment) {
                if (window.UI) UI.showToast('Please select a payment method.', 'error');
                else alert('Please select a payment method.');
                return;
            }
        }

        this.currentStep++;
        this.updateStepVisibility();
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepVisibility();
        }
    },

    updateStepVisibility() {
        const steps = ['shipping-form', 'payment-form', 'order-review'];
        steps.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const currentId = steps[this.currentStep - 1];
        if (currentId) {
            const el = document.getElementById(currentId);
            if (el) el.style.display = 'block';
        }

        for (let i = 1; i <= 3; i++) {
            const circle = document.getElementById(`step-circle-${i}`);
            const label = document.getElementById(`step-label-${i}`);

            if (circle && label) {
                if (i <= this.currentStep) {
                    circle.classList.remove('bg-gray-300', 'text-gray-600');
                    circle.classList.add('bg-primary', 'text-white');
                    label.classList.remove('text-gray-600');
                    label.classList.add('font-bold', 'text-primary');
                } else {
                    circle.classList.remove('bg-primary', 'text-white');
                    circle.classList.add('bg-gray-300', 'text-gray-600');
                    label.classList.remove('font-bold', 'text-primary');
                    label.classList.add('text-gray-600');
                }
            }
        }
    },

    async renderCheckoutItems() {
        // Use cache if available, otherwise fetch
        if (!this.cartCache) {
            try {
                this.cartCache = await Cart.getCart();
            } catch (e) {
                console.error("Failed to load cart for checkout", e);
                if (e.message.includes('Session expired') || e.message.includes('Unauthorized')) {
                    if (window.UI) UI.showToast('Session expired. Please login again.', 'error');
                    setTimeout(() => Auth.logout(), 1500);
                }
                return;
            }
        }

        const cart = this.cartCache;
        const container = document.getElementById('checkout-items');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');
        const taxEl = document.getElementById('checkout-tax');

        if (!container || !cart || !cart.items || cart.items.length === 0) {
            // ... (Empty state logic kept largely same but using safe checks) ... 
            const html = `
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                         <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Your cart is empty</h3>
                    <p class="text-gray-500 mb-6">Looks like you haven't added any items to the cart yet.</p>
                    <button onclick="showPage('shop')" class="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors">Start Shopping</button>
                    <script>
                         document.getElementById('checkout-steps')?.classList.add('hidden');
                         document.getElementById('order-summary')?.classList.add('hidden');
                    </script>
                </div>
            `;
            if (container) container.innerHTML = html;
            if (subtotalEl) subtotalEl.innerText = '₹0';
            if (totalEl) totalEl.innerText = '₹0';
            const shippingRow = document.getElementById('checkout-shipping');
            if (shippingRow) shippingRow.innerText = '₹0';

            // Hide wrapper safely
            const checkoutWrapper = document.getElementById('checkout-main-grid');
            if (checkoutWrapper) checkoutWrapper.innerHTML = html;
            return;
        }

        let total = 0;
        const html = cart.items.map(item => {
            const price = item.variant.prices[0]?.basePrice || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            // Use safe optional chaining for media/url
            const imgUrl = item.variant.product.media?.[0]?.url || item.variant.product.media?.[0]?.s3Key || 'images/placeholder.jpg';

            return `
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gray-200 rounded overflow-hidden bg-white">
                             <img src="${imgUrl}" alt="${item.variant.product.title}" class="w-full h-full object-contain">
                        </div>
                        <div>
                            <p class="font-medium text-sm line-clamp-1">${item.variant.product.title}</p>
                            <p class="text-xs text-gray-500">Qty: ${item.quantity}</p>
                        </div>
                    </div>
                    <span class="font-medium text-sm flex-shrink-0">₹${itemTotal.toLocaleString()}</span>
                </div>
            `;
        }).join('');

        if (container) container.innerHTML = html;
        if (subtotalEl) subtotalEl.innerText = `₹${total.toLocaleString()}`;

        // Tax & Shipping Calculation
        const shippingCost = 50;
        const stateEl = document.getElementById('state');
        const state = stateEl ? stateEl.value.trim().toLowerCase() : '';
        const isGujarat = state.includes('gujarat');

        // Calculate Tax Components
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalTax = 0;

        cart.items.forEach(item => {
            const price = item.variant.prices[0]?.basePrice || 0;
            const p = item.variant.product;
            const quantity = item.quantity;
            const taxableAmount = price * quantity;

            if (state && isGujarat) {
                // Intro-state: CGST + SGST
                const cRate = p.cgst || 0; // e.g. 9
                const sRate = p.sgst || 0; // e.g. 9

                const cTax = (taxableAmount * cRate) / 100;
                const sTax = (taxableAmount * sRate) / 100;

                totalCGST += cTax;
                totalSGST += sTax;
                totalTax += (cTax + sTax);
            } else {
                // Inter-state: IGST
                const iRate = p.igst || (p.taxRate || 18); // e.g. 18
                const iTax = (taxableAmount * iRate) / 100;

                totalIGST += iTax;
                totalTax += iTax;
            }
        });

        const finalTax = Math.round(totalTax);
        const finalCGST = totalCGST; // Keep decimals for sub-components or round? usually tax is rounded at total
        const finalSGST = totalSGST;

        // Update Shipping
        const shippingRow = document.getElementById('checkout-shipping');
        if (shippingRow) shippingRow.innerText = `₹${shippingCost}`;

        // Update Tax Display
        const taxLabelRow = document.getElementById('checkout-tax-row');

        if (taxLabelRow) {
            if (state && isGujarat) {
                // Show CGST + SGST breakdown
                taxLabelRow.className = "flex flex-col gap-1 mt-2 border-t border-dashed border-gray-200 pt-2";
                taxLabelRow.innerHTML = `
                    <div class="flex justify-between items-center w-full">
                        <span class="text-gray-600 font-medium">CGST</span>
                        <span class="font-bold text-gray-900">₹${finalCGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="flex justify-between items-center w-full">
                        <span class="text-gray-600 font-medium">SGST</span>
                        <span class="font-bold text-gray-900">₹${finalSGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                `;
            } else {
                // Show IGST / Total Tax
                taxLabelRow.className = "flex justify-between";
                taxLabelRow.innerHTML = `
                    <span>Tax (${state ? 'IGST' : 'GST'}):</span>
                    <span id="checkout-tax">₹${finalTax.toLocaleString()}</span>
                 `;
            }
        }

        if (totalEl) totalEl.innerText = `₹${Math.round(total + totalTax + shippingCost).toLocaleString()}`;
    },

    async placeOrder() {
        // 1. Get Selected Payment
        const paymentRadio = document.querySelector('input[name="payment"]:checked');
        if (!paymentRadio) {
            if (window.UI) UI.showToast('Please select a payment method.', 'error');
            else alert('Please select a payment method.');
            return;
        }
        const paymentMethod = paymentRadio.value; // 'cod', 'upi', 'card'

        const btn = document.querySelector('button[onclick="placeOrder()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Processing...';
        }

        try {
            // Collect Form Data
            const shippingAddress = {
                firstName: document.getElementById('firstName')?.value,
                lastName: document.getElementById('lastName')?.value,
                name: (document.getElementById('firstName')?.value + ' ' + document.getElementById('lastName')?.value).trim(),
                email: document.getElementById('email')?.value,
                phone: document.getElementById('phone')?.value,
                line1: document.getElementById('address')?.value,
                city: document.getElementById('city')?.value,
                state: document.getElementById('state')?.value,
                pincode: document.getElementById('zip')?.value,
            };
            const gstNumber = document.getElementById('gstNumber')?.value;

            // 2. Call API
            const order = await API.post('/orders', {
                shippingAddress,
                gstNumber,
                paymentMethod // Pass 'cod', 'upi', or 'card'
            });

            // 3. Handle Payment Flow
            if (paymentMethod === 'cod') {
                if (window.UI) UI.showToast('Order Placed Successfully! (Cash on Delivery)', 'success');
                else alert('Order Placed Successfully! (Cash on Delivery)');

                // Auto-download Invoice
                if (window.UI && window.UI.downloadInvoice) {
                    await window.UI.downloadInvoice(order.id);
                }

                // Redirect
                setTimeout(() => {
                    window.location.href = '?page=orders';
                }, 1000);

            } else {
                // Online Payment (Razorpay)
                const options = {
                    "key": window.CONFIG.RAZORPAY_KEY,
                    "amount": Math.round(order.total * 100), // paise
                    "currency": "INR",
                    "name": "Axar TechWave",
                    "description": `Order #${order.customId || order.id}`,
                    "image": "images/logo.png",
                    "handler": async function (response) {
                        try {
                            await API.post(`/orders/${order.id}/verify-payment`, {
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature
                            });

                            if (window.UI) UI.showToast('Payment Successful! Downloading Invoice...', 'success');
                            else alert('Payment Successful! Downloading Invoice...');

                            if (window.UI && window.UI.downloadInvoice) {
                                await window.UI.downloadInvoice(order.id);
                            }

                            setTimeout(() => {
                                window.location.href = '?page=orders';
                            }, 2000);

                        } catch (e) {
                            console.error(e);
                            if (window.UI) UI.showToast('Payment Verification Failed. Order Created but Payment pending.', 'error');
                            else alert('Payment Verification Failed. Order Created but Payment pending.');
                            window.location.href = '?page=orders';
                        }
                    },
                    "prefill": {
                        "name": shippingAddress.name,
                        "email": shippingAddress.email,
                        "contact": shippingAddress.phone
                    },
                    "theme": {
                        "color": "#3399cc"
                    },
                    "modal": {
                        "ondismiss": function () {
                            if (window.UI) UI.showToast('Payment Cancelled. Order will not be processed.', 'info');
                            else alert('Payment Cancelled. Order will not be processed.');
                            window.location.href = '?page=orders'; // Redirect to Avoid re-adding
                        }
                    }
                };

                if (window.Razorpay) {
                    const rzp1 = new window.Razorpay(options);
                    rzp1.open();
                } else {
                    if (window.UI) UI.showToast('Payment Gateway Error. Order created.', 'error');
                    else alert('Payment Gateway Error. Order created.');
                    window.location.reload();
                }
            }

        } catch (error) {
            if (window.UI) UI.showToast('Failed to place order: ' + error.message, 'error');
            else alert('Failed to place order: ' + error.message);
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Place Order';
            }
        }
    }
};

// Hook into the global window for the HTML onclick handlers
window.placeOrder = () => Checkout.placeOrder();

// We need to hook into showPage to refresh checkout items when page is shown
// Or just listen for it. A simple way is to check periodically or expose render
window.renderCheckout = () => Checkout.init();
window.nextCheckoutStep = () => Checkout.nextStep();
window.prevCheckoutStep = () => Checkout.prevStep();
