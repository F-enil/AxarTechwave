window.Checkout = {
    cartData: null,

    async init() {
        // 1. Auth Check
        if (!Auth.isLoggedIn()) {
            if (window.UI) UI.showToast('Please login to proceed to checkout', 'info');
            this.redirectToHome();
            return;
        }

        // 2. Sequential Data Load
        try {
            await this.loadCartAndRender();
            await this.prefillAddress();
            this.setupEventListeners();
        } catch (error) {
            console.error('[Checkout] Init failed:', error);
            if (window.UI) UI.showToast('Failed to load checkout data. Please refresh.', 'error');
        }
    },

    redirectToHome() {
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
            const fullName = defaultAddr.name || '';
            const spaceIdx = fullName.indexOf(' ');
            const fName = spaceIdx === -1 ? fullName : fullName.substring(0, spaceIdx);
            const lName = spaceIdx === -1 ? '' : fullName.substring(spaceIdx + 1);

            // Detailed input check
            this.setInputValue('firstName', fName);
            this.setInputValue('lastName', lName);

            const user = Auth.getUser();
            this.setInputValue('email', user?.email || '');

            this.setInputValue('phone', defaultAddr.phone);
            this.setInputValue('address', defaultAddr.line1);
            this.setInputValue('city', defaultAddr.city);
            this.setInputValue('state', defaultAddr.state);
            this.setInputValue('zip', defaultAddr.pincode);
            this.setInputValue('gstNumber', defaultAddr.gstNumber || '');

            if (defaultAddr.state) {
                setTimeout(() => this.renderOrderSummary(), 500);
            }

        } catch (e) {
            console.error('[Checkout] Address prefill error:', e);
        }
    },

    setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value || '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
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
            this.cartData = await Cart.getCart();

            if (!this.cartData) return;

            this.renderOrderSummary();
        } catch (e) {
            console.error('[Checkout] Cart load error:', e);
            if (e.message && (e.message.includes('Session expired') || e.message.includes('Unauthorized'))) {
                setTimeout(() => Auth.logout(), 1500);
            }
        }
    },

    renderOrderSummary() {
        const container = document.getElementById('checkout-items');
        if (!container) return;

        if (!this.cartData || !this.cartData.items || this.cartData.items.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        let subtotal = 0;

        // Tax Accumulators
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        // Determine State for Tax Logic
        const stateInput = document.getElementById('state');
        const stateVal = stateInput ? stateInput.value.trim().toLowerCase() : '';
        const isGujarat = stateVal.includes('gujarat');

        const itemsHtml = this.cartData.items.map(item => {
            if (!item.variant || !item.variant.product) return '';

            const product = item.variant.product;
            const price = item.variant.prices?.[0]?.basePrice || product.price || 0;
            const quantity = item.quantity;
            const itemTotal = price * quantity;

            subtotal += itemTotal;

            // Product Specific Tax Rates
            const cgstRate = product.cgst !== undefined ? product.cgst : 9;
            const sgstRate = product.sgst !== undefined ? product.sgst : 9;
            const igstRate = product.igst !== undefined ? product.igst : 18;

            if (isGujarat) {
                totalCGST += (itemTotal * cgstRate) / 100;
                totalSGST += (itemTotal * sgstRate) / 100;
            } else {
                totalIGST += (itemTotal * igstRate) / 100;
            }

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
                            <p class="text-xs text-gray-500">Qty: ${quantity} × ₹${price.toLocaleString()}</p>
                        </div>
                    </div>
                    <span class="font-medium text-sm text-gray-900">₹${itemTotal.toLocaleString()}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = itemsHtml;

        const shippingCost = 50;

        // Final Tax Sum
        const finalTax = isGujarat ? (totalCGST + totalSGST) : totalIGST;
        const finalTotal = subtotal + finalTax + shippingCost;

        this.setText('checkout-subtotal', `₹${subtotal.toLocaleString()}`);
        this.setText('checkout-shipping', `₹${shippingCost}`);

        // Tax Breakdown Render
        const taxEl = document.getElementById('checkout-tax-row');
        if (taxEl) {
            taxEl.className = "flex flex-col gap-1 text-base border-t border-dashed border-gray-200 pt-2 pb-2";
            if (isGujarat) {
                taxEl.innerHTML = `
                    <div class="flex justify-between text-gray-600 text-sm">
                        <span>CGST:</span>
                        <span>₹${totalCGST.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between text-gray-600 text-sm">
                        <span>SGST:</span>
                        <span>₹${totalSGST.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                `;
            } else {
                taxEl.innerHTML = `
                    <div class="flex justify-between text-gray-600 text-base">
                        <span>IGST:</span>
                        <span>₹${totalIGST.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                `;
            }
        }

        this.setText('checkout-total', `₹${Math.round(finalTotal).toLocaleString()}`);
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
        this.setText('checkout-subtotal', '₹0');
        this.setText('checkout-total', '₹0');
    },

    setupEventListeners() {
        const stateInput = document.getElementById('state');
        if (stateInput) {
            stateInput.addEventListener('input', () => {
                if (this._debounce) clearTimeout(this._debounce);
                this._debounce = setTimeout(() => {
                    this.renderOrderSummary();
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
            const selected = document.querySelector('input[name="payment"]:checked');
            if (!selected) {
                if (window.UI) UI.showToast('Select a payment method', 'error');
                return false;
            }
        }
        return true;
    },

    updateStepUI() {
        ['shipping-form', 'payment-form', 'order-review'].forEach((id, index) => {
            const el = document.getElementById(id);
            if (el) el.style.display = (index + 1) === this.currentStep ? 'block' : 'none';
        });

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

    async placeOrder() {
        const btn = document.querySelector('button[onclick="placeOrder()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Processing...';
        }

        try {
            const shippingAddress = {
                firstName: document.getElementById('firstName')?.value || '',
                lastName: document.getElementById('lastName')?.value || '',
                email: document.getElementById('email')?.value || '',
                phone: document.getElementById('phone')?.value || '',
                line1: document.getElementById('address')?.value || '',
                city: document.getElementById('city')?.value || '',
                state: document.getElementById('state')?.value || '',
                pincode: document.getElementById('zip')?.value || '',
                country: 'India'
            };

            shippingAddress.name = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
            const gstNumber = document.getElementById('gstNumber')?.value || '';
            const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;

            const order = await API.post('/orders', {
                shippingAddress,
                gstNumber,
                paymentMethod
            });

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

    async handleSuccess(order) {
        if (window.UI) UI.showToast('Order Placed! Downloading Invoice...', 'success');

        try {
            if (window.UI && UI.downloadInvoice) {
                // Wait for download to initiate/complete (it uses fetch so it waits for PDF generation)
                await UI.downloadInvoice(order.id);
            }
        } catch (e) {
            console.log('Invoice download failed:', e);
            if (window.UI) UI.showToast('Invoice download failed, but order is safe.', 'warning');
        }

        // Give a moment for the browser download prompt to register before redirecting
        setTimeout(() => {
            if (window.UI && UI.showPage) {
                UI.showPage('orders');
                // Refresh orders to show the new one
                if (UI.loadOrderHistory) UI.loadOrderHistory();
            } else {
                window.location.href = '/?page=orders';
            }
        }, 2000);
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
                    window.location.href = '/?page=orders';
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

window.placeOrder = () => Checkout.placeOrder();
window.renderCheckout = () => Checkout.init();
window.nextCheckoutStep = () => Checkout.nextStep();
window.prevCheckoutStep = () => Checkout.prevStep();
