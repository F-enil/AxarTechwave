const API = {
    async request(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
            // DEBUG: Log the exact string being sent
            // console.log(`[API REQUEST] ${method} ${endpoint}`);
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}${endpoint}`, config);

            if (response.status === 401) {
                // Token expired or invalid
                console.warn('Unauthorized access, logging out...');
                alert('Session Error: Server rejected your login (401). Please try again.'); // DEBUG
                // Stop clearing token for a moment to let user report it
                // localStorage.removeItem('access_token');
                // window.location.reload();
                return; // Return null/undefined instead of throwing to prevent crash loop
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            return data;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    post(endpoint, body) {
        return this.request(endpoint, 'POST', body);
    },

    put(endpoint, body) {
        return this.request(endpoint, 'PUT', body);
    },

    patch(endpoint, body) {
        return this.request(endpoint, 'PATCH', body);
    },

    delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    }
};
