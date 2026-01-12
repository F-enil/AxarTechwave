const Cart = {
    async getCart() {
        if (!Auth.isLoggedIn()) return null;
        return await API.get('/cart');
    },

    async add(variantId, quantity = 1) {
        if (!Auth.isLoggedIn()) throw new Error('Please login to add items');
        return await API.post('/cart/items', { variantId, quantity });
    },

    async addToCart(variantId, quantity = 1) {
        try {
            await this.add(variantId, quantity);
            UI.updateCartCount();
            if (window.UI && UI.showToast) UI.showToast('Item added to cart!', 'success');
            else alert('Item added to cart!');
        } catch (e) {
            if (window.UI && UI.showToast) UI.showToast(e.message, 'error');
            else alert(e.message);
        }
    },

    async updateItem(itemId, quantity) {
        if (!Auth.isLoggedIn()) return;
        if (quantity < 1) return; // Prevent invalid quantity

        await API.patch(`/cart/items/${itemId}`, { quantity });
        UI.updateCartCount();
        if (UI.updateCartDisplay) UI.updateCartDisplay();
    },

    async removeItem(itemId) {
        if (!Auth.isLoggedIn()) return;
        await API.delete(`/cart/items/${itemId}`);
        UI.updateCartCount();
        if (UI.updateCartDisplay) UI.updateCartDisplay();
    }
};

// Expose Cart methods globally for UI onclick handlers
window.addToCart = (variantId, quantity) => Cart.addToCart(variantId, quantity);
window.removeFromCart = (itemId) => Cart.removeItem(itemId);
window.updateCartItem = (itemId, quantity) => Cart.updateItem(itemId, quantity);
