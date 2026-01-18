const Auth = {
    async login(email, password) {
        try {
            const response = await API.post('/auth/login', { email, password });
            if (response.access_token) {
                localStorage.setItem('access_token', response.access_token);
                // Decode token to get user info (simplified)
                const payload = JSON.parse(atob(response.access_token.split('.')[1]));
                localStorage.setItem('user', JSON.stringify(payload));
                return true;
            }
            return false;
        } catch (error) {
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

                // Decode token and save user
                const payload = JSON.parse(atob(token.split('.')[1]));
                const user = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role || 'customer'
                };
                localStorage.setItem('user', JSON.stringify(user));
                console.log('User saved:', user);

                // 1. Clean URL WITHOUT Reloading
                window.history.replaceState({}, document.title, window.location.pathname);

                // 2. Update UI Immediately (Header, Buttons)
                if (typeof UI !== 'undefined' && UI.checkAuth) {
                    UI.checkAuth();
                }

                // 3. Show Success Toast
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('Successfully logged in with Google!', 'success');
                }

                // Optional: Dispatch event for other listeners
                window.dispatchEvent(new Event('auth-change'));

            } catch (e) {
                console.error('Error processing google token', e);
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('Google Login Failed: Invalid Token', 'error');
                }
                // Clean URL even on error
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
