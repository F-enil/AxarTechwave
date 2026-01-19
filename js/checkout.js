const Checkout = {
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
        this.renderCheckoutItems();

        // Dynamic State Update Calculation
        const stateInput = document.getElementById('state');
        if (stateInput) {
            stateInput.addEventListener('input', () => {
                this.renderCheckoutItems();
            });
        }
    },

    async prefillAddress() {
        try {
            const addresses = await API.get('/address');
            if (addresses && addresses.length > 0) {
                // Find default or use first
                const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

                // Form Fields
                const mapping = {
                    'firstName': defaultAddr.name ? defaultAddr.name.split(' ')[0] : '', // simplistic name split if name field exists, else relies on input
                    'address': defaultAddr.line1,
                    'city': defaultAddr.city,
                    'state': defaultAddr.state,
                    'zip': defaultAddr.pincode,
                    // Add other fields if available in address object or user profile
                };

                // If user profile has detailed name/email/phone, those might be better source for contact info
                const user = Auth.getUser();
                if (user) {
                    if (document.getElementById('email')) document.getElementById('email').value = user.email || '';
                    // If username has space, try to fallback split
                    if (user.username) {
                        const parts = user.username.split(' ');
                        if (document.getElementById('firstName')) document.getElementById('firstName').value = parts[0] || '';
                        if (document.getElementById('lastName')) document.getElementById('lastName').value = parts.slice(1).join(' ') || '';
                    }
                }

                // Fill address fields
                for (const [id, value] of Object.entries(mapping)) {
                    const el = document.getElementById(id);
                    if (el && value) el.value = value;
                }

                // Phone from address might be fresher
                if (defaultAddr.phone && document.getElementById('phone')) {
                    document.getElementById('phone').value = defaultAddr.phone;
                }
            }
        } catch (e) {
            console.log('No saved addresses to prefill');
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

        // Hide all forms
        steps.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Show current form
        const currentId = steps[this.currentStep - 1];
        if (currentId) {
            const el = document.getElementById(currentId);
            if (el) el.style.display = 'block';
        }

        // Update Step Indicators
        for (let i = 1; i <= 3; i++) {
            const circle = document.getElementById(`step-circle-${i}`);
            const label = document.getElementById(`step-label-${i}`);

            if (circle && label) {
                if (i <= this.currentStep) { // Mark current and previous as active/completed
                    // Active: Primary Color
                    circle.classList.remove('bg-gray-300', 'text-gray-600');
                    circle.classList.add('bg-primary', 'text-white');

                    label.classList.remove('text-gray-600');
                    label.classList.add('font-bold', 'text-primary');
                } else {
                    // Inactive: Gray Color
                    circle.classList.remove('bg-primary', 'text-white');
                    circle.classList.add('bg-gray-300', 'text-gray-600');

                    label.classList.remove('font-bold', 'text-primary');
                    label.classList.add('text-gray-600');
                }
            }
        }
    },

    async renderCheckoutItems() { // existing function continuation...
        const cart = await Cart.getCart();
        const container = document.getElementById('checkout-items');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');
        const taxEl = document.getElementById('checkout-tax');

        if (!container || !cart || !cart.items || cart.items.length === 0) {
            console.log('Checkout: Cart is empty or not loaded');
            if (container) container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500 mb-4">Your cart is empty.</p><a href="axartechwavedemo.html" class="bg-primary text-white px-6 py-2 rounded">Shop Now</a></div>';

            // Explicitly zero out summary to avoid confusion
            if (subtotalEl) subtotalEl.innerText = '₹0';
            if (totalEl) totalEl.innerText = '₹0';
            const shippingRow = document.getElementById('checkout-shipping');
            if (shippingRow) shippingRow.innerText = '₹0';

            return;
        }

        let total = 0;
        const html = cart.items.map(item => {
            const price = item.variant.prices[0]?.basePrice || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            return `
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gray-200 rounded overflow-hidden bg-white">
                             <img src="${item.variant.product.media?.[0]?.url || item.variant.product.media?.[0]?.s3Key || 'placeholder.jpg'}" alt="${item.variant.product.title}" class="w-full h-full object-contain">
                        </div>
                        <div>
                            <p class="font-medium text-sm">${item.variant.product.title}</p>
                            <p class="text-xs text-gray-500">Qty: ${item.quantity}</p>
                        </div>
                    </div>
                    <span class="font-medium text-sm">₹${itemTotal.toLocaleString()}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        subtotalEl.innerText = `₹${total.toLocaleString()}`;

        // Tax & Shipping Calculation
        const shippingCost = 50;
        const stateEl = document.getElementById('state');
        const state = stateEl ? stateEl.value.trim().toLowerCase() : '';
        const isGujarat = state.includes('gujarat');

        // Calculate Tax Per Item
        let totalTax = 0;
        cart.items.forEach(item => {
            const price = item.variant.prices[0]?.basePrice || 0;
            const p = item.variant.product;

            let itemTax = 0;
            if (state && isGujarat) {
                const cRate = p.cgst || 0;
                const sRate = p.sgst || 0;
                itemTax = (price * item.quantity * (cRate + sRate)) / 100;
            } else {
                const iRate = p.igst || (p.taxRate || 18);
                itemTax = (price * item.quantity * iRate) / 100;
            }
            totalTax += itemTax;
        });

        const finalTax = Math.round(totalTax);

        // Update Shipping Text
        const shippingRow = document.getElementById('checkout-shipping');
        if (shippingRow) {
            shippingRow.innerText = `₹${shippingCost}`;
        }

        // Update Tax Text
        const taxLabelRow = taxEl.parentElement;

        if (state && isGujarat) {
            const halfTax = (finalTax / 2).toFixed(2);
            if (taxLabelRow) {
                taxLabelRow.className = "flex flex-col gap-1 mt-2 border-t border-dashed border-gray-200 pt-2";
                taxLabelRow.innerHTML = `
                    <div class="flex justify-between items-center w-full">
                        <span class="text-gray-600 font-medium">CGST (Intra-state)</span>
                        <span class="font-bold text-gray-900">₹${halfTax}</span>
                    </div>
                    <div class="flex justify-between items-center w-full">
                        <span class="text-gray-600 font-medium">SGST (Intra-state)</span>
                        <span class="font-bold text-gray-900">₹${(finalTax - halfTax).toFixed(2)}</span>
                    </div>
                `;
            }
        } else {
            if (taxLabelRow) {
                taxLabelRow.innerHTML = `
                    <span class="text-gray-600">Tax (${state ? 'IGST' : 'GST'})</span>
                    <span class="font-medium" id="checkout-tax">₹${finalTax.toLocaleString()}</span>
                 `;
            }
        }

        totalEl.innerText = `₹${Math.round(total + totalTax + shippingCost).toLocaleString()}`;
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
                            if (window.UI) UI.showToast('Payment Cancelled. Order created as pending.', 'info');
                            else alert('Payment Cancelled. Order created as pending.');
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
