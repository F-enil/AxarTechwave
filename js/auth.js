const Auth = {
    async login(email, password) {
        console.log('[Auth] Attempting login for:', email);
        try {
            const response = await API.post('/auth/login', { email, password });
            console.log('[Auth] Login API Response:', response);

            if (response.access_token) {
                console.log('[Auth] Token received. Saving...');
                localStorage.setItem('access_token', response.access_token);

                const parts = response.access_token.split('.');
                const payload = JSON.parse(atob(parts[1]));
                console.log('[Auth] Token Payload:', payload);

                localStorage.setItem('user', JSON.stringify(payload));
                console.log('[Auth] User saved to localStorage');

                return true;
            } else {
                console.warn('[Auth] No access_token in response');
            }
            return false;
        } catch (error) {
            console.error('[Auth] Login Error:', error);
            if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(error.message, 'error');
            else alert(error.message);
            return false;
        }
    },

    async signup(email, username, password) {
        try {
            await API.post('/auth/signup', { email, username, password });
            return await this.login(email, password);
        } catch (error) {
            if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(error.message, 'error');
            else alert(error.message);
            return false;
        }
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.reload();
    },

    isLoggedIn() {
        return !!localStorage.getItem('access_token');
    },

    getUser() {
        return JSON.parse(localStorage.getItem('user'));
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            console.log('Google Auth Token detected');
            try {
                localStorage.setItem('access_token', token);

                const payload = JSON.parse(atob(token.split('.')[1]));
                const user = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role || 'customer'
                };
                localStorage.setItem('user', JSON.stringify(user));

                // 1. Clean URL (No Reload) to prevent loops
                window.history.replaceState({}, document.title, window.location.pathname);

                // 2. Trigger UI Updates Logic
                // We use a small timeout to ensure UI/Cart logic is ready
                setTimeout(async () => {
                    // Update Header User Icon
                    if (window.UI && UI.checkAuth) UI.checkAuth();

                    // Update Cart Badge
                    if (window.Cart) {
                        try {
                            const cart = await Cart.getCart();
                            const count = cart ? cart.items.length : 0;
                            const badge = document.getElementById('cart-count');
                            if (badge) badge.innerText = count;
                            // Also update cart display if we are on cart page
                            if (window.UI && UI.updateCartDisplay) UI.updateCartDisplay();
                        } catch (err) {
                            console.error('Cart update failed', err);
                        }
                    }

                    // Show Success Message
                    if (window.UI && UI.showToast) {
                        UI.showToast('Login Successful!', 'success');
                    }
                }, 100);

            } catch (e) {
                console.error('Error processing google token', e);
                // DEBUG: Tell user why it failed
                alert('Login Failed: ' + e.message);

                localStorage.removeItem('access_token');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
