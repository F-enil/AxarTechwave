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

                // Decode using Base64
                const payload = JSON.parse(atob(token.split('.')[1]));
                const user = {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role || 'customer'
                };
                localStorage.setItem('user', JSON.stringify(user));

                // Redirect to Clean URL (This triggers a reload)
                // This is safer than replaceState because it forces UI (Cart/Wishlist) to re-init
                window.location.href = window.location.pathname;

            } catch (e) {
                console.error('Error processing google token', e);
                localStorage.removeItem('access_token');
                window.location.href = window.location.pathname;
            }
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
