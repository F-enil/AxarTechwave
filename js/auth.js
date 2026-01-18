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
            console.log('[Auth] Google Auth Token detected');
            try {
                localStorage.setItem('access_token', token);

                const parts = token.split('.');
                const payload = JSON.parse(atob(parts[1]));
                console.log('[Auth] Token Payload:', payload);

                // Use payload username or fallback to email part
                const user = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role || 'customer',
                    username: payload.username || payload.name || payload.email.split('@')[0]
                };

                localStorage.setItem('user', JSON.stringify(user));
                console.log('[Auth] User saved to localStorage');

                // 1. Clean URL (No Reload) to prevent loops
                window.history.replaceState({}, document.title, window.location.pathname);

                // 2. Trigger UI Update (No Reload)
                if (window.UI && UI.onLoginSuccess) {
                    console.log('[Auth] Calling UI.onLoginSuccess()...');
                    UI.onLoginSuccess();
                } else {
                    console.warn('[Auth] UI.onLoginSuccess not found!');
                    // Fallback just in case
                    if (window.UI && UI.checkAuth) UI.checkAuth();
                }

            } catch (e) {
                console.error('[Auth] Error processing google token', e);
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
