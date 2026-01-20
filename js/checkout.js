const Checkout = {
    // Cache cart to prevent excessive API calls during state updates
    cartData: null,

    async init() {
        console.log('[Checkout] Initializing...');

        // 1. Auth Check
        if (!Auth.isLoggedIn()) {
            console.log('[Checkout] User not logged in, redirecting...');
            if (window.UI) UI.showToast('Please login to proceed to checkout', 'info');
            this.redirectToHome();
            return;
        }

        // 2. Initial Data Fetch (Parallel)
        try {
            await Promise.all([
                this.prefillAddress(),
                this.loadCartAndRender()
            ]);

            this.setupEventListeners();
            console.log('[Checkout] Ready.');

        } catch (error) {
            console.error('[Checkout] Init failed:', error);
            if (window.UI) UI.showToast('Failed to load checkout data. Please refresh.', 'error');
        }
    },

    redirectToHome() {
        // Simple redirect helper
        if (window.showPage) showPage('home');
        else window.location.href = '/';
    },

    // --- Address Logic ---
    async prefillAddress() {
        try {
            const addresses = await API.get('/address');
            if (!addresses || addresses.length === 0) return;

            // Find default or first address
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            if (!defaultAddr) return;

            // Fill Form Fields
            this.setInputValue('firstName', this.getFirstName(defaultAddr.name));
            this.setInputValue('lastName', this.getLastName(defaultAddr.name));
            this.setInputValue('email', Auth.getUser()?.email || '');
            this.setInputValue('phone', defaultAddr.phone);
            this.setInputValue('address', defaultAddr.line1);
            this.setInputValue('city', defaultAddr.city);
            this.setInputValue('state', defaultAddr.state);
            this.setInputValue('zip', defaultAddr.pincode);

            // Trigger tax recalculation if state is present
            if (defaultAddr.state) {
                this.renderOrderSummary(); // Re-render with new state
            }

        } catch (e) {
            console.warn('[Checkout] Failed to prefill address:', e);
            // Non-critical, continue
        }
    },

    setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    },

    getFirstName(fullName) {
        if (!fullName) return '';
        return fullName.split(' ')[0] || '';
    },

    getLastName(fullName) {
        if (!fullName) return '';
        return fullName.split(' ').slice(1).join(' ') || '';
    },

    // --- Cart & Order Summary Logic ---
    async loadCartAndRender() {
        try {
            // Fetch fresh cart data
            this.cartData = await Cart.getCart();
            this.renderOrderSummary();
        } catch (e) {
            console.error('[Checkout] Failed to load cart:', e);
            // Handle Session Expiry specifically
            if (e.message && (e.message.includes('Session expired') || e.message.includes('Unauthorized'))) {
                if (window.UI) UI.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => Auth.logout(), 1500);
            }
        }
    },

    renderOrderSummary() {
        const container = document.getElementById('checkout-items');
        if (!container) return; // Not on checkout page

        // 1. Check for Empty Cart
        if (!this.cartData || !this.cartData.items || this.cartData.items.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        // 2. Render Items
        let subtotal = 0;
        const itemsHtml = this.cartData.items.map(item => {
            // Safety Check for invalid items
            if (!item.variant || !item.variant.product) return '';

            const product = item.variant.product;
            const price = item.variant.prices?.[0]?.basePrice || 0;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            const imgUrl = product.media?.[0]?.url || product.media?.[0]?.s3Key || 'images/placeholder.jpg';
            const title = product.title || 'Unknown Product';

            return `
                <div class="flex justify-between items-center py-2">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gray-100 rounded overflow-hidden border">
                             <img src="${imgUrl}" alt="${title}" class="w-full h-full object-contain">
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-sm text-gray-800 line-clamp-1">${title}</p>
                            <p class="text-xs text-gray-500">Qty: ${item.quantity} × ₹${price.toLocaleString()}</p>
                        </div>
                    </div>
                    <span class="font-medium text-sm text-gray-900">₹${itemTotal.toLocaleString()}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = itemsHtml;

        // 3. Calculate Totals & Tax
        this.updateTotals(subtotal);
    },

    updateTotals(subtotal) {
        const shippingCost = 50; // Fixed shipping for now

        // Get State for Tax Calc
        const stateInput = document.getElementById('state');
        const stateConf = stateInput ? stateInput.value.trim().toLowerCase() : '';
        const isGujarat = stateConf.includes('gujarat');

        let totalTax = 0;
        let totalCGST = 0;
        let totalSGST = 0;

        // Calculate Tax based on Cart Items
        if (this.cartData && this.cartData.items) {
            this.cartData.items.forEach(item => {
                if (!item.variant || !item.variant.product) return;

                const p = item.variant.product;
                const price = item.variant.prices?.[0]?.basePrice || 0;
                const taxableAmount = price * item.quantity;

                if (stateConf && isGujarat) {
                    // Intra-State (CGST + SGST)
                    const cRate = p.cgst || 9;
                    const sRate = p.sgst || 9;
                    totalCGST += (taxableAmount * cRate) / 100;
                    totalSGST += (taxableAmount * sRate) / 100;
                } else {
                    // Inter-State (IGST) or Default (if state missing)
                    const iRate = p.igst || 18;
                    totalTax += (taxableAmount * iRate) / 100;
                }
            });
        }

        // Add up CGST+SGST to Total Tax if Gujarat
        if (isGujarat) {
            totalTax = totalCGST + totalSGST;
        }

        const finalTotal = subtotal + totalTax + shippingCost;

        // update DOM
        this.setText('checkout-subtotal', `₹${subtotal.toLocaleString()}`);
        this.setText('checkout-shipping', `₹${shippingCost}`);
        this.setText('checkout-total', `₹${Math.round(finalTotal).toLocaleString()}`);

        // Render Tax Breakdown
        const taxEl = document.getElementById('checkout-tax-row');
        if (taxEl) {
            if (isGujarat) {
                taxEl.className = "flex flex-col gap-1 mt-2 border-t border-dashed border-gray-200 pt-2 text-sm";
                taxEl.innerHTML = `
                    <div class="flex justify-between w-full">
                        <span class="text-gray-500">CGST</span>
                        <span>₹${totalCGST.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between w-full">
                        <span class="text-gray-500">SGST</span>
                        <span>₹${totalSGST.toFixed(2)}</span>
                    </div>
                `;
            } else {
                taxEl.className = "flex justify-between text-sm";
                taxEl.innerHTML = `
                    <span class="text-gray-500">Tax ${stateConf ? '(IGST)' : '(Est.)'}:</span>
                    <span>₹${Math.round(totalTax).toLocaleString()}</span>
                `;
            }
        }
    },

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    },

    renderEmptyState(container) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 mb-4">Your cart is empty.</p>
                <button onclick="showPage('shop')" class="text-primary hover:underline">Go to Shop</button>
            </div>
        `;
        // Hide Total Section safely if needed, or just zero it out
        this.setText('checkout-subtotal', '₹0');
        this.setText('checkout-total', '₹0');
    },

    setupEventListeners() {
        // Listen for State changes to update Tax
        const stateInput = document.getElementById('state');
        if (stateInput) {
            stateInput.addEventListener('input', () => {
                // Debounce slightly
                if (this._debounce) clearTimeout(this._debounce);
                this._debounce = setTimeout(() => {
                    this.renderOrderSummary(); // Recalculate tax using cached cart data
                }, 500);
            });
        }
    },

    // --- Step Navigation ---
    currentStep: 1,

    nextStep() {
        if (!this.validateStep(this.currentStep)) return;

        this.currentStep++;
        this.updateStepUI();
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
        }
    },

    validateStep(step) {
        if (step === 1) {
            // Shipping Validation
            const form = document.getElementById('shipping-form');
            if (!form) return true;
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let valid = true;
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.classList.add('border-red-500');
                    valid = false;
                } else {
                    input.classList.remove('border-red-500');
                }
            });
            if (!valid && window.UI) UI.showToast('Please fill all required fields', 'error');
            return valid;
        }
        if (step === 2) {
            // Payment Validation
            const selected = document.querySelector('input[name="payment"]:checked');
            if (!selected) {
                if (window.UI) UI.showToast('Select a payment method', 'error');
                return false;
            }
        }
        return true;
    },

    updateStepUI() {
        // 1. Sections
        ['shipping-form', 'payment-form', 'order-review'].forEach((id, index) => {
            const el = document.getElementById(id);
            if (el) el.style.display = (index + 1) === this.currentStep ? 'block' : 'none';
        });

        // 2. Stepper
        for (let i = 1; i <= 3; i++) {
            const circle = document.getElementById(`step-circle-${i}`);
            const label = document.getElementById(`step-label-${i}`);
            if (!circle || !label) continue;

            if (i <= this.currentStep) {
                circle.classList.remove('bg-gray-300', 'text-gray-600');
                circle.classList.add('bg-primary', 'text-white');
                label.classList.add('text-primary', 'font-bold');
                label.classList.remove('text-gray-600');
            } else {
                circle.classList.remove('bg-primary', 'text-white');
                circle.classList.add('bg-gray-300', 'text-gray-600');
                label.classList.remove('text-primary', 'font-bold');
                label.classList.add('text-gray-600');
            }
        }
    },

    // --- Order Placement ---
    async placeOrder() {
        const btn = document.querySelector('button[onclick="placeOrder()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Processing...';
        }

        try {
            // 1. Gather Data
            const shippingAddress = {
                firstName: document.getElementById('firstName')?.value || '',
                lastName: document.getElementById('lastName')?.value || '',
                email: document.getElementById('email')?.value || '',
                phone: document.getElementById('phone')?.value || '',
                line1: document.getElementById('address')?.value || '',
                city: document.getElementById('city')?.value || '',
                state: document.getElementById('state')?.value || '',
                pincode: document.getElementById('zip')?.value || '',
                country: 'India' // Default
            };

            // Construct full name
            shippingAddress.name = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
            const gstNumber = document.getElementById('gstNumber')?.value || '';
            const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;

            // 2. Submit Order
            const order = await API.post('/orders', {
                shippingAddress,
                gstNumber,
                paymentMethod
            });

            // 3. Handle Success / Payment
            if (paymentMethod === 'cod') {
                this.handleSuccess(order);
            } else {
                this.initiateRazorpay(order, shippingAddress);
            }

        } catch (error) {
            console.error('[Checkout] Order placement failed:', error);
            if (window.UI) UI.showToast(error.message || 'Failed to place order', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Place Order';
            }
        }
    },

    handleSuccess(order) {
        if (window.UI) UI.showToast('Order Placed! Redirecting...', 'success');

        // Try download invoice
        if (window.UI && UI.downloadInvoice) {
            UI.downloadInvoice(order.id).catch(e => console.log('Invoice download failed:', e));
        }

        setTimeout(() => {
            window.location.href = '?page=orders';
        }, 1500);
    },

    initiateRazorpay(order, userDetails) {
        if (!window.Razorpay) {
            alert('Payment gateway failed to load. Please try COD.');
            window.location.reload();
            return;
        }

        const options = {
            "key": window.CONFIG.RAZORPAY_KEY,
            "amount": Math.round(order.total * 100),
            "currency": "INR",
            "name": "Axar TechWave",
            "description": `Order #${order.customId || order.id}`,
            "image": "images/logo.png",
            "prefill": {
                "name": userDetails.name,
                "email": userDetails.email,
                "contact": userDetails.phone
            },
            "theme": { "color": "#3399cc" },
            "handler": async function (response) {
                try {
                    await API.post(`/orders/${order.id}/verify-payment`, {
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature
                    });
                    Checkout.handleSuccess(order);
                } catch (e) {
                    if (window.UI) UI.showToast('Payment Verification Failed', 'error');
                    window.location.href = '?page=orders';
                }
            },
            "modal": {
                "ondismiss": function () {
                    if (window.UI) UI.showToast('Payment Cancelled', 'info');
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    }
};

// --- Global Hooks for HTML Overrides ---
window.placeOrder = () => Checkout.placeOrder();
window.renderCheckout = () => Checkout.init();
window.nextCheckoutStep = () => Checkout.nextStep();
window.prevCheckoutStep = () => Checkout.prevStep();
