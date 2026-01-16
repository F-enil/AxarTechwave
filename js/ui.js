const UI = {
    async loadOrderHistory() {
        const container = document.getElementById('profile-orders-list');
        if (!container) return;

        container.innerHTML = '<p class="text-center text-gray-500 py-4">Loading orders...</p>';
        try {
            const orders = await API.get('/orders');
            // console.log('[UI] Fetched Orders:', orders);
            if (!orders || orders.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 py-4">No orders found.</p>';
                return;
            }

            container.innerHTML = orders.map(order => {
                const s = (order.status || '').toLowerCase();
                const isShipped = s === 'shipped' || s === 'delivered';
                // Always show shipment block but with status context
                const trackingHtml = `
                    <div class="mt-3 p-3 bg-gray-50 rounded border border-gray-100 text-sm">
                        <p class="font-bold text-gray-800 mb-1">🚚 Shipment Details</p>
                        <div class="grid grid-cols-1 gap-1">
                            <p class="text-gray-700">Courier: <span class="font-medium">${isShipped
                        ? (order.courierCompanyName || '<span class="text-gray-400 italic">Not Provided</span>')
                        : '<span class="text-gray-400 italic">Pending Shipment</span>'
                    }</span></p>
                            <p class="text-gray-700">Tracking ID: <span class="font-medium font-mono">${isShipped
                        ? (order.trackingId || '<span class="text-gray-400 italic">Pending</span>')
                        : '<span class="text-gray-400 italic">Pending Shipment</span>'
                    }</span></p>
                        </div>
                    </div>
                `;

                const itemsHtml = order.items.map(item => `
                    <div class="flex items-center gap-4 mt-4 bg-gray-50 p-3 rounded">
                        <img src="${item.variant.product.media?.[0]?.url || 'https://via.placeholder.com/80'}" class="w-16 h-16 object-cover rounded bg-white border">
                        <div class="flex-1">
                            <h5 class="font-bold text-gray-900">${item.title}</h5>
                            <p class="text-xs text-gray-500">Qty: ${item.quantity} | SKU: ${item.sku || 'N/A'}</p>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <div class="font-bold">₹${item.price * item.quantity}</div>
                            ${order.status === 'delivered'
                        ? `<button onclick="UI.openReturnModal(${order.id}, ${item.variantId})" class="text-xs text-red-600 hover:text-red-800 border border-red-200 bg-white px-2 py-1 rounded shadow-sm transition-colors">↩ Return</button>`
                        : ''}
                        </div>
                    </div>
                `).join('');

                return `
                    <div class="border rounded-lg p-4 bg-white shadow-sm">
                        <div class="flex justify-between items-start border-b pb-3 mb-3">
                            <div>
                                <div class="text-xs text-gray-500 uppercase font-semibold">Order Placed</div>
                                <div class="text-sm font-medium">${new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div class="text-xs text-gray-500 uppercase font-semibold">Total</div>
                                <div class="text-sm font-medium">₹${order.total}</div>
                            </div>
                            <div>
                                <div class="text-xs text-gray-500 uppercase font-semibold">Ship To</div>
                                <div class="text-sm font-medium capitalize max-w-[150px] truncate">${order.shippingAddress?.name || order.user?.name || 'Customer'}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-xs text-gray-500 uppercase font-semibold">Order #${order.customId || order.id}</div>
                                <div class="flex flex-col items-end gap-1">
                                    <span class="inline-block mt-1 px-2 py-1 text-xs font-bold rounded-full 
                                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'}">
                                        ${order.status.toUpperCase()}
                                    </span>
                                    <button onclick="UI.downloadInvoice(${order.id})" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded border border-gray-300 flex items-center justify-center gap-1 mt-1">
                                        📄 Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                         <div class="flex justify-end items-center mb-2">
                             <div class="flex space-x-2">
                                <!-- Order Actions -->
                             </div>
                         </div>

                         ${trackingHtml}
                         
                         <div class="mt-4 border-t pt-2 text-sm">
                            ${(() => {
                        if (order.taxDetails && (order.taxDetails.cgst > 0 || order.taxDetails.sgst > 0)) {
                            return `
                                    <div class="flex justify-between text-gray-500">
                                        <span>Tax (CGST: ₹${order.taxDetails.cgst}, SGST: ₹${order.taxDetails.sgst})</span>
                                        <span>₹${order.taxDetails.totalTax}</span>
                                    </div>`;
                        } else if (order.taxDetails && order.taxDetails.totalTax > 0) {
                            return `
                                    <div class="flex justify-between text-gray-500">
                                        <span>Tax (IGST)</span>
                                        <span>₹${order.taxDetails.totalTax}</span>
                                    </div>`;
                        }
                        return '';
                    })()}
                         </div>
                        ${itemsHtml}

                    </div>
                `;
            }).join('');

        } catch (e) {
            console.error(e);
            container.innerHTML = '<p class="text-center text-red-500 py-4">Failed to load orders.</p>';
        }
    },

    // --- Maintenance Mode Auto-Redirect (Added) ---
    setupMaintenanceCheck() {
        const checkMaintenance = async () => {
            try {
                // Determine API URL safely (handle production relative path if needed, or use CONFIG)
                const apiUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
                    ? CONFIG.API_URL
                    : '/api';

                const res = await fetch(`${apiUrl}/cms/settings?t=${new Date().getTime()}`);
                if (res.ok) {
                    const settings = await res.json();
                    if (settings.maintenanceMode === true) {
                        // If we are NOT already on maintenance page, redirect
                        if (!window.location.pathname.includes('maintenance.html')) {
                            console.log('Maintenance mode enabled. Redirecting...');
                            window.location.href = 'maintenance.html';
                        }
                    }
                }
            } catch (e) {
                // silent fail on network error, don't disrupt user
            }
        };

        // Check every 10 seconds
        setInterval(checkMaintenance, 10000);
        // Also check once on load
        checkMaintenance();
    },

    init() {
        this.setupAuthObserver();
        this.loadCart();
        this.setupGlobalHandlers();
        this.setupMaintenanceCheck(); // <--- Start polling

        // ... existing init code ...

        this.updateCartCount();
        this.loadSiteSettings();
    },

    setupGlobalHandlers() {
        window.addToCart = async (variantId, quantity = 1) => {
            if (!Auth.isLoggedIn()) {
                this.showToast('Please login to add items.', 'error');
                // Optional: Open login modal automatically
                const modal = document.getElementById('login-modal');
                if (modal) modal.classList.add('show');
                return;
            }

            try {
                // Direct add, no redundant fetch
                await Cart.add(variantId, quantity);
                this.showToast('Added to cart!', 'success');
                this.updateCartCount();
                // Update UI Cart Display immediately if function exists
                if (window.updateCartDisplay) window.updateCartDisplay();
            } catch (error) {
                console.error('Cart Error:', error);
                this.showToast(error.message || 'Failed to add to cart', 'error');
            }
        };

        window.updateCartCount = () => this.updateCartCount();

        // Filter Handlers
        const filterInputs = document.querySelectorAll('.filter-checkbox');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => this.filterProducts());
        });

        const applyBtn = document.getElementById('apply-filters-btn'); // If exists
        if (applyBtn) applyBtn.onclick = () => this.filterProducts();

        // Responsive Sidebar Reset
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) { // lg breakpoint
                const sidebar = document.querySelector('aside');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                    sidebar.classList.remove('fixed', 'inset-0', 'z-50', 'bg-white', 'p-6', 'w-full', 'h-full', 'overflow-y-auto');
                }
            }
        });
    },

    // Store products for filtering
    allProducts: [],

    async loadProducts() {
        const productContainer = document.getElementById('product-list');
        if (!productContainer) return;

        productContainer.innerHTML = '<div class="col-span-full text-center py-8"><div class="loading"></div></div>';

        try {
            const [products, wishlist] = await Promise.all([
                API.get('/catalog/products'),
                Auth.isLoggedIn() ? API.get('/wishlist').catch(() => []) : Promise.resolve([])
            ]);

            this.wishlistSet = new Set(wishlist.map(item => item.id));
            this.allProducts = products; // Save for filtering

            // Initialize State
            this.state.products = [...products];

            this.renderFilteredProducts();
            this.renderFeaturedProducts(products);

        } catch (error) {
            console.error('Failed to load products', error);
            productContainer.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load products.</p>';
        }
    },

    // State for Shop Page
    state: {
        products: [], // Filtered products
        filters: {
            categories: [],
            brands: [],
            priceRange: null, // { min, max }
        },
        sortBy: 'featured',
        view: 'grid', // 'grid' or 'list'
        currentPage: 1,
        itemsPerPage: 9
    },

    filterProducts() {
        // 1. Gather Filter Inputs
        const catCheckboxes = document.querySelectorAll('input[type="checkbox"][value="smartphones"], input[type="checkbox"][value="accessories"], input[type="checkbox"][value="gadgets"], input[type="checkbox"][value="cases"]');
        const brandCheckboxes = document.querySelectorAll('input[type="checkbox"][value="apple"], input[type="checkbox"][value="samsung"], input[type="checkbox"][value="oneplus"], input[type="checkbox"][value="xiaomi"]');

        this.state.filters.categories = Array.from(catCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
        this.state.filters.brands = Array.from(brandCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());

        const priceRadio = document.querySelector('input[name="price"]:checked');
        if (priceRadio && priceRadio.value !== 'all') {
            const [min, max] = priceRadio.value.split('-').map(v => v.replace('+', ''));
            this.state.filters.priceRange = {
                min: parseInt(min) || 0,
                max: max ? parseInt(max) : Infinity
            };
        } else {
            this.state.filters.priceRange = null;
        }

        this.applyLogic();
    },

    sortProducts(method) {
        this.state.sortBy = method;
        this.applyLogic();
    },

    setGridView(view) {
        this.state.view = view;
        this.renderFilteredProducts(); // Re-render with new view class
    },

    changePage(page) {
        this.state.currentPage = page;
        this.renderFilteredProducts();
        document.getElementById('product-list').scrollIntoView({ behavior: 'smooth' });
    },

    applyLogic() {
        let result = [...this.allProducts];

        // 1. Filter by Category
        if (this.state.filters.categories.length > 0) {
            result = result.filter(p => {
                const cat = p.category ? p.category.slug.toLowerCase() : '';
                return this.state.filters.categories.includes(cat);
            });
        }

        // 2. Filter by Brand
        if (this.state.filters.brands.length > 0) {
            result = result.filter(p => {
                const brand = p.brand ? p.brand.toLowerCase() : '';
                return this.state.filters.brands.includes(brand);
            });
        }

        // 3. Filter by Price
        if (this.state.filters.priceRange) {
            const { min, max } = this.state.filters.priceRange;
            result = result.filter(p => {
                const price = p.variants[0]?.prices[0]?.basePrice || 0;
                return price >= min && price <= max;
            });
        }

        // 4. Sort
        switch (this.state.sortBy) {
            case 'price-low':
                result.sort((a, b) => (a.variants[0]?.prices[0]?.basePrice || 0) - (b.variants[0]?.prices[0]?.basePrice || 0));
                break;
            case 'price-high':
                result.sort((a, b) => (b.variants[0]?.prices[0]?.basePrice || 0) - (a.variants[0]?.prices[0]?.basePrice || 0));
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'rating':
                // Mock rating sort (since we don't have agg ratings yet, use a mock or ID)
                result.sort((a, b) => b.id - a.id);
                break;
            default: // featured - shuffle or id
                result.sort((a, b) => a.id - b.id);
        }

        this.state.products = result;
        this.state.currentPage = 1; // Reset to page 1 on filter change
        this.renderFilteredProducts();
    },

    renderFilteredProducts() {
        const container = document.getElementById('product-list');
        const countEl = document.getElementById('product-count');

        if (!container) return;

        if (this.state.products.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">No products found matching your filters.</p>';
            if (countEl) countEl.innerText = 0;
            this.renderPagination(0);
            return;
        }

        // Update Count
        if (countEl) countEl.innerText = this.state.products.length;

        // Pagination Logic
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const end = start + this.state.itemsPerPage;
        const paginatedProducts = this.state.products.slice(start, end);

        // Grid vs List View Classes
        if (this.state.view === 'list') {
            container.className = 'grid grid-cols-1 gap-6'; // Force single column
        } else {
            container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'; // Default grid
        }

        container.innerHTML = paginatedProducts.map(product => {
            if (this.state.view === 'list') {
                return this.renderProductListItem(product);
            }
            return this.renderProductCard(product);
        }).join('');

        this.renderPagination(this.state.products.length);
    },

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.state.itemsPerPage);
        const container = document.querySelector('.flex.justify-center.mt-12');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="flex space-x-2">';

        // Prev
        html += `<button onclick="changePage(${this.state.currentPage - 1})" ${this.state.currentPage === 1 ? 'disabled class="px-3 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"' : 'class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"'}">Previous</button>`;

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.state.currentPage) {
                html += `<button class="px-3 py-2 bg-primary text-white rounded-lg">${i}</button>`;
            } else {
                html += `<button onclick="changePage(${i})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">${i}</button>`;
            }
        }

        // Next
        html += `<button onclick="changePage(${this.state.currentPage + 1})" ${this.state.currentPage === totalPages ? 'disabled class="px-3 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"' : 'class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"'}">Next</button>`;

        html += '</div>';
        container.innerHTML = html;
    },

    renderProductListItem(product) {
        const variant = product.variants[0];
        const price = variant.prices[0]?.basePrice || 'N/A';
        const image = product.media && product.media.length > 0 ? (product.media[0].url || product.media[0].s3Key) : 'https://via.placeholder.com/150';

        const stock = variant.stock !== undefined ? Number(variant.stock) : undefined;
        const isOutOfStock = product.status !== 'active' || variant.status !== 'active' || (stock !== undefined && stock <= 0);

        return `
            <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center relative ${isOutOfStock ? 'opacity-75' : ''}">
                ${isOutOfStock ? `
                <div class="absolute top-2 left-2 z-10">
                    <span class="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold transform -rotate-12 shadow-sm">OUT OF STOCK</span>
                </div>
                ` : ''}
                
                <div class="w-full sm:w-32 h-48 sm:h-32 flex-shrink-0">
                    <img src="${image}" alt="${product.title}" class="w-full h-full object-contain bg-white rounded-md">
                </div>
                <div class="flex-grow w-full">
                    <h3 class="font-heading font-bold text-lg sm:text-xl mb-1 sm:mb-2 text-primary">${product.title}</h3>
                    <p class="text-gray-600 text-sm mb-2 sm:mb-4 line-clamp-2">${product.description || 'No description'}</p>
                    <div class="flex items-center gap-2 mb-2 sm:mb-4">
                        <span class="text-yellow-400">★★★★☆</span>
                        <span class="text-xs text-gray-400">(24 reviews)</span>
                    </div>
                </div>
                <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 min-w-[120px]">
                     <span class="font-bold text-xl text-primary">₹${price.toLocaleString()}</span>
                     <div class="flex gap-2 sm:block w-full sm:w-auto">
                        <button onclick="UI.showProductDetail(${product.id})" class="text-sm text-primary hover:underline hidden sm:block mb-2 text-right w-full">View Details</button>
                        ${isOutOfStock ?
                `<button disabled class="w-full btn-primary px-4 py-2 rounded text-sm opacity-50 cursor-not-allowed bg-gray-400 border-none">Out of Stock</button>` :
                `<button onclick="window.addToCart(${variant.id})" class="w-full btn-primary px-4 py-2 rounded text-sm whitespace-nowrap">Add to Cart</button>`
            }
                     </div>
                </div>
            </div>
        `;
    },

    renderFeaturedProducts(products) {
        const container = document.getElementById('featured-products');
        if (!container) return;

        const featured = products.slice(0, 4);
        container.innerHTML = featured.map(product => this.renderProductCard(product)).join('');
    },

    renderProductCard(product) {
        const variant = product.variants[0];
        if (!variant) return ''; // Skip invalid products

        const price = variant.prices[0]?.basePrice || 'N/A';
        const image = product.media && product.media.length > 0
            ? (product.media[0].url || product.media[0].s3Key)
            : 'https://via.placeholder.com/300x300?text=No+Image';

        const stock = variant.stock !== undefined ? Number(variant.stock) : undefined;
        const isOutOfStock = product.status !== 'active' || variant.status !== 'active' || (stock !== undefined && stock <= 0);
        const isWishlisted = this.wishlistSet && this.wishlistSet.has(product.id);

        // Pass VARIANT ID to addToCart
        return `
            <div class="product-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md relative ${isOutOfStock ? 'opacity-75' : ''} transition-all duration-300 group">
                ${isOutOfStock ? `
                <div class="absolute inset-0 bg-white bg-opacity-50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                    <span class="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm transform -rotate-12 shadow-lg">OUT OF STOCK</span>
                </div>
                ` : ''}
                
                <button onclick="UI.toggleWishlist(event, ${product.id})" class="absolute top-3 right-3 z-30 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors ${isWishlisted ? 'text-red-500' : 'text-gray-400'}">
                    <svg class="w-5 h-5" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </button>

                <div class="relative overflow-hidden cursor-pointer" onclick="UI.showProductDetail(${product.id})">
                    <img src="${image}" alt="${product.title}" class="w-full h-64 object-contain bg-white transform group-hover:scale-105 transition-transform duration-500">
                    
                    ${!isOutOfStock ? `
                    <div class="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button onclick="event.stopPropagation(); window.addToCart(${variant.id})" class="bg-white text-primary px-6 py-2 rounded-full font-bold hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 shadow-lg">
                            Add to Cart
                        </button>
                    </div>
                    ` : ''}
                </div>

                <div class="p-4">
                    <h3 class="font-heading text-lg font-bold text-primary mb-1 truncate" title="${product.title}">${product.title}</h3>
                    
                    <div class="flex justify-between items-center text-sm mb-3">
                        <span class="text-gray-500">${product.brand || 'Axar Tech'}</span>
                        <div class="flex text-yellow-400" title="4.5/5 Rating">
                            ★★★★½ <span class="text-gray-400 text-xs ml-1">(4.5)</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center border-t pt-3">
                        <span class="text-xl font-bold text-secondary">₹${price}</span>
                        ${!isOutOfStock ? `
                        <button class="md:hidden text-primary hover:text-accent" onclick="window.addToCart(${variant.id})">
                           🛒 Add
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    async toggleWishlist(e, productId) {
        e.stopPropagation();
        if (!Auth.isLoggedIn()) {
            this.showToast('Please login to use Wishlist', 'info');
            return;
        }

        const btn = e.currentTarget;
        try {
            const pId = parseInt(productId, 10);
            const res = await API.post('/wishlist/toggle', { productId: pId });
            const icon = btn.querySelector('svg');

            // Initialize Set if missing
            if (!this.wishlistSet) this.wishlistSet = new Set();

            if (res.status === 'added') {
                if (icon) icon.setAttribute('fill', 'currentColor');
                btn.classList.add('text-red-500');
                btn.classList.remove('text-gray-400');
                this.wishlistSet.add(pId);
                this.showToast('Added to Wishlist', 'success');
            } else {
                if (icon) icon.setAttribute('fill', 'none');
                btn.classList.remove('text-red-500');
                btn.classList.add('text-gray-400');
                this.wishlistSet.delete(pId);
                this.showToast('Removed from Wishlist', 'info');
            }

            // If we are currently viewing the wishlist tab (profile), refresh it
            const wishlistTab = document.getElementById('tab-content-wishlist');
            if (wishlistTab && !wishlistTab.classList.contains('hidden')) {
                this.loadWishlist('profile-wishlist-list');
            }

            // If we are currently viewing the main wishlist page, refresh it
            const wishlistPage = document.getElementById('wishlist-page');
            if (wishlistPage && wishlistPage.classList.contains('active')) {
                this.loadWishlist('wishlist-grid');
            }

            // Also refresh main grid if visible, to update heart icons there
            this.renderFilteredProducts();

        } catch (err) {
            console.error(err);
            this.showToast('Failed to update Wishlist: ' + (err.message || 'Unknown error'), 'error');
        }
    },

    setRating(n) {
        document.getElementById('review-rating').value = n;
        const stars = document.querySelectorAll('.star-rating');
        stars.forEach((star, index) => {
            star.style.color = index < n ? '#FBBF24' : '#D1D5DB';
        });
    },

    async submitReview(e) {
        e.preventDefault();
        if (!Auth.isLoggedIn()) {
            this.showToast('Please login to review', 'error');
            return;
        }

        const form = e.target;
        const productId = form.querySelector('[name="productId"]').value;
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value;

        if (!rating) {
            this.showToast('Please select a rating', 'error');
            return;
        }

        try {
            await API.post('/reviews', {
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment
            });

            this.showToast('Review submitted successfully!', 'success');
            form.reset();
            this.setRating(0);
            this.loadReviews(productId); // Reload reviews
        } catch (error) {
            console.error('Review submission error:', error);
            this.showToast(error.message || 'Failed to submit review', 'error');
        }
    },

    async loadReviews(productId) {
        const container = document.getElementById('reviews-list');
        if (!container) return;

        container.innerHTML = '<div class="loading"></div>';

        try {
            const data = await API.get(`/reviews/product/${productId}`);
            // Backend returns { reviews: [], averageRating: number, totalReviews: number }

            if (!data.reviews || data.reviews.length === 0) {
                container.innerHTML = '<p class="text-gray-500">No reviews yet. Be the first to review!</p>';
                return;
            }

            container.innerHTML = data.reviews.map(review => `
                <div class="border-b pb-4 mb-4 last:border-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <span class="font-bold mr-2">${review.user?.username || 'User'}</span>
                            <div class="text-yellow-500 text-sm">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                            </div>
                        </div>
                        <span class="text-xs text-gray-400">
                             ${new Date(review.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p class="text-gray-600">${review.comment || ''}</p>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load reviews', error);
            container.innerHTML = '<p class="text-red-500">Failed to load reviews.</p>';
        }
    },

    showProductDetail(id) {
        const product = this.allProducts.find(p => p.id === id);
        if (!product) {
            console.warn('Product not found:', id);
            return;
        }

        const container = document.getElementById('product-detail');
        if (!container) return;

        // Dynamic Product Detail HTML
        const price = product.variants?.[0]?.prices?.[0]?.basePrice || product.price || 0;
        const comparePrice = product.variants?.[0]?.prices?.[0]?.compareAtPrice || 0;
        const description = product.description || 'No description available.';
        const rating = product.rating || 4.5;
        const stock = product.variants?.[0]?.stock !== undefined ? Number(product.variants[0].stock) : 0;

        // Media Logic with Swiper
        let slidesHtml = '';
        const media = (product.media && product.media.length > 0)
            ? product.media
            : [{ url: 'https://via.placeholder.com/600x600?text=No+Image', kind: 'image' }];

        media.forEach(m => {
            const src = m.url || m.s3Key; // Handle both full URL or key if signed elsewhere (assuming full url here)
            if (m.kind === 'video') {
                slidesHtml += `
                    <div class="swiper-slide flex items-center justify-center bg-black">
                        <video src="${src}" class="w-full h-full object-contain max-h-[500px]" controls muted playsinline></video>
                    </div>
                 `;
            } else {
                slidesHtml += `
                    <div class="swiper-slide flex items-center justify-center bg-gray-100">
                        <img src="${src}" class="w-full h-full object-contain max-h-[500px]" alt="${product.title}">
                    </div>
                 `;
            }
        });

        const swiperHtml = `
            <div class="swiper product-swiper w-full h-[500px] rounded-lg overflow-hidden border border-gray-200">
                <div class="swiper-wrapper">
                    ${slidesHtml}
                </div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        `;

        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                     ${swiperHtml}
                </div>
                
                <div>
                    <button onclick="showPage('shop')" class="text-sm text-gray-500 hover:text-primary mb-4">← Back to Shop</button>
                    
                    <h1 class="text-3xl font-bold text-primary mb-2">${product.title}</h1>
                    <p class="text-gray-500 mb-1">SKU: AXT-${product.id}</p>
                    <p class="text-gray-500 mb-4">Country of Origin: ${product.originCountry || 'India'}</p>
                    
                    <div class="flex items-center mb-4">
                        <span class="text-yellow-500 mr-2">★★★★★</span>
                        <span class="text-sm text-gray-600">(${rating})</span>
                    </div>
                    
                    <div class="flex items-center space-x-4 mb-6">
                        <span class="text-3xl font-bold text-primary">₹${price}</span>
                        ${comparePrice > price ? `<span class="text-xl text-gray-400 line-through">₹${comparePrice}</span>` : ''}
                    </div>
                    
                    <div class="mb-6">
                       <span class="text-sm font-bold ${stock > 0 ? 'text-green-600' : 'text-red-500'}">
                            ${stock > 0 ? 'In Stock' : 'Out of Stock'}
                       </span>
                    </div>
                    
                    <div class="flex items-center space-x-4 mb-6">
                         <div class="flex items-center border border-gray-300 rounded">
                            <button onclick="UI.changeQty(-1)" class="px-3 py-2">-</button>
                            <input type="number" id="detail-qty" value="1" min="1" max="${stock}" class="w-12 text-center border-0">
                            <button onclick="UI.changeQty(1)" class="px-3 py-2">+</button>
                         </div>
                         <button onclick="window.addToCart(${product.variants?.[0]?.id}, parseInt(document.getElementById('detail-qty').value))" class="bg-primary text-white px-8 py-3 rounded-lg flex-1 hover:bg-opacity-90 transition">
                            Add to Cart
                         </button>
                    </div>
                </div>
            </div>
            
            <div class="mt-12 border-t pt-8">
                <h3 class="text-xl font-bold mb-4">Description</h3>
                <p class="text-gray-600">${description}</p>
            </div>
        `;

        showPage('product');

        // Initializing Swiper
        const swiper = new Swiper('.product-swiper', {
            loop: media.length > 1,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            on: {
                slideChangeTransitionEnd: function () {
                    // Clean up videos in other slides
                    document.querySelectorAll('video').forEach(v => {
                        v.pause();
                        v.currentTime = 0;
                    });

                    // Check active slide for video
                    const activeSlide = this.slides[this.activeIndex];
                    const video = activeSlide.querySelector('video');
                    if (video) {
                        this.autoplay.stop();
                        video.play().catch(e => console.log('Auto-play blocked', e));
                        video.onended = () => {
                            this.slideNext();
                            this.autoplay.start();
                        };
                    } else {
                        // Ensure autoplay is running for images
                        if (!this.autoplay.running) this.autoplay.start();
                    }
                }
            }
        });

        // Load real reviews
        this.loadReviews(product.id);

        // Update hidden input for review submission
        const reviewInput = document.getElementById('review-product-id');
        if (reviewInput) reviewInput.value = product.id;
    },

    changeQty(delta) {
        const input = document.getElementById('detail-qty');
        let val = parseInt(input.value) + delta;
        if (val < 1) val = 1;
        input.value = val;
    },

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Show target page
        const target = document.getElementById(pageId + '-page');
        if (target) target.classList.add('active');

        // Update Nav
        document.querySelectorAll('.page-nav').forEach(nav => nav.classList.remove('active'));
        // Highlighting logic if needed

        window.scrollTo(0, 0);

        // Page specific loads
        if (pageId === 'shop') this.loadProducts();
        if (pageId === 'cart') this.updateCartDisplay();
        if (pageId === 'checkout') {
            if (window.Checkout) window.Checkout.init();
        }
        if (pageId === 'orders') this.loadOrderHistory();
        if (pageId === 'address-book') this.loadAddressBook();
        if (pageId === 'wishlist') this.loadWishlist();
    },

    async updateCartCount() {
        if (!Auth.isLoggedIn()) {
            const el = document.getElementById('cart-count');
            if (el) el.innerText = '0';
            return;
        }

        try {
            // const cart = await Cart.getCart(); // Cart not defined
            const cart = await API.get('/cart'); // Use API directly
            const count = cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
            const cartCountEl = document.getElementById('cart-count');
            if (cartCountEl) {
                cartCountEl.innerText = count;
                cartCountEl.classList.remove('animate-bounce');
                void cartCountEl.offsetWidth; // trigger reflow
                cartCountEl.classList.add('animate-bounce'); // Re-trigger animation
            }
        } catch (e) { console.error('Cart count error', e); }
    },

    async downloadInvoice(orderId) {
        try {
            // Using fetch directly to handle blob
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${CONFIG.API_URL}/orders/${orderId}/invoice`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to generate invoice');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error(error);
            this.showToast('Could not download invoice', 'error');
        }
    },

    async subscribeNewsletter() {
        const emailInput = document.getElementById('newsletter-email');
        if (!emailInput) return;

        const email = emailInput.value;
        if (!email || !email.includes('@')) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        const btn = emailInput.nextElementSibling;
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = '...';

        try {
            await API.post('/newsletter/subscribe', { email });
            this.showToast('Subscribed successfully! Thank you.', 'success');
            emailInput.value = '';
        } catch (error) {
            // Check for conflict (already subscribed)
            if (error.message && error.message.includes('Conflict')) {
                this.showToast('You are already subscribed!', 'info');
            } else {
                this.showToast(error.message || 'Subscription failed. Try again.', 'error');
            }
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    showToast(message, type = 'info') {
        // Create toast container if not exists
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-20 right-5 z-[2000] flex flex-col space-y-3';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-600' : 'bg-red-600';
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

        toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 translate-x-full opacity-0 flex items-center space-x-3 min-w-[300px]`;
        toast.innerHTML = `
            <span class="text-xl font-bold bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center">${icon}</span>
            <p class="font-medium">${message}</p>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        });

        // Remove after delay
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Address Book Management
    async loadAddressBook(containerId = 'address-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="col-span-full text-center py-8"><div class="loading"></div></div>';

        try {
            const addresses = await API.get('/address');
            if (!addresses || addresses.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p class="mb-4">No addresses saved yet.</p>
                        <button onclick="UI.showAddAddressModal()" class="text-primary hover:underline">Add your first address</button>
                    </div>`;
                return;
            }

            container.innerHTML = addresses.map(addr => `
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative group">
                    ${addr.isDefault ? '<span class="absolute top-4 right-4 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">DEFAULT</span>' : ''}
                    <h4 class="font-bold text-lg mb-2">${addr.name}</h4>
                    <p class="text-gray-600 mb-1">${addr.line1}</p>
                    <p class="text-gray-600 mb-1">${addr.city}, ${addr.state}</p>
                    <p class="text-gray-600 mb-3">${addr.country} - ${addr.pincode}</p>
                    <p class="text-gray-600 mb-4">📞 ${addr.phone}</p>
                    
                    <div class="flex space-x-3 pt-3 border-t">
                        <button onclick="UI.editAddress(${addr.id})" class="text-blue hover:text-blue-700 text-sm font-medium">Edit</button>
                        <button onclick="UI.deleteAddress(${addr.id})" class="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load addresses error', error);
            container.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load addresses.</p>';
        }
    },

    showAddAddressModal() {
        document.getElementById('address-form').reset();
        const idField = document.getElementById('address-form').querySelector('[name="id"]');
        if (idField) idField.value = '';
        document.getElementById('address-modal-title').innerText = 'Add New Address';
        document.getElementById('address-modal').classList.add('show');
    },

    closeAddressModal() {
        document.getElementById('address-modal').classList.remove('show');
    },

    async handleAddressSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.isDefault = form.querySelector('[name="isDefault"]').checked;
        const id = data.id;
        delete data.id; // remove id from payload

        try {
            if (id) {
                await API.put(`/address/${id}`, data);
                this.showToast('Address updated successfully', 'success');
            } else {
                await API.post('/address', data);
                this.showToast('Address added successfully', 'success');
            }
            this.closeAddressModal();
            this.loadAddressBook();
        } catch (error) {
            console.error(error);
            this.showToast('Failed to save address', 'error');
        }
    },

    async editAddress(id) {
        try {
            // Re-fetch to get details (simple approach) // TODO: Optimize with local cache if needed
            const addresses = await API.get('/address');
            const addr = addresses.find(a => a.id === id);
            if (!addr) return;

            const form = document.getElementById('address-form');
            const idField = form.querySelector('[name="id"]');
            if (idField) idField.value = addr.id;

            form.querySelector('[name="name"]').value = addr.name;
            form.querySelector('[name="phone"]').value = addr.phone;
            form.querySelector('[name="line1"]').value = addr.line1;
            form.querySelector('[name="city"]').value = addr.city;
            form.querySelector('[name="state"]').value = addr.state;
            form.querySelector('[name="country"]').value = addr.country;
            form.querySelector('[name="pincode"]').value = addr.pincode;
            form.querySelector('[name="isDefault"]').checked = addr.isDefault;

            document.getElementById('address-modal-title').innerText = 'Edit Address';
            document.getElementById('address-modal').classList.add('show');
        } catch (e) {
            this.showToast('Error loading address details', 'error');
        }
    },

    async deleteAddress(id) {
        if (!confirm('Are you sure you want to delete this address?')) return;
        try {
            await API.delete(`/address/${id}`);
            this.showToast('Address deleted', 'success');
            this.loadAddressBook();
        } catch (e) {
            this.showToast('Failed to delete address', 'error');
        }
    },



    async loadWishlist(containerId = 'wishlist-grid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="col-span-full text-center py-8"><div class="loading"></div></div>';

        try {
            const wishlist = await API.get('/wishlist');
            if (!wishlist || wishlist.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                        <p class="text-gray-500 mb-4">Your wishlist is empty.</p>
                        <button onclick="showPage('shop')" class="btn-primary px-6 py-2 rounded-lg">Start Shopping</button>
                    </div>`;
                return;
            }

            const items = Array.isArray(wishlist) ? wishlist : (wishlist.items || []);

            if (items.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center py-12 bg-gray-50 rounded-lg"><p>Your wishlist is empty.</p></div>`;
                return;
            }

            container.innerHTML = items.map(item => {
                // Backend returns flat structure: { id, title, price, image, variantId, addedAt }
                // So 'item' IS the product data we need.
                const product = item;
                if (!product) return '';

                const image = product.image || 'https://via.placeholder.com/150';
                const price = product.price || 0;

                return `
                <div class="product-card bg-white rounded-lg shadow-lg overflow-hidden relative group">
                    <button onclick="UI.toggleWishlist(event, ${product.id})" class="absolute top-2 right-2 z-10 p-2 bg-white rounded-full text-red-500 shadow hover:bg-gray-50">
                        ✕
                    </button>
                    <div class="cursor-pointer" onclick="showProductDetail(${product.id})">
                         <div class="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img src="${image}" alt="${product.title}" class="w-full h-full object-contain">
                         </div>
                         <div class="p-4">
                            <h4 class="font-bold text-primary mb-2 line-clamp-1">${product.title}</h4>
                            <p class="text-secondary font-bold">₹${price.toLocaleString()}</p>
                         </div>
                    </div>
                    <div class="p-4 pt-0">
                         <button onclick="window.addToCart(${product.variantId}, 1)" class="w-full btn-primary py-2 rounded text-sm">Add to Cart</button>
                    </div>
                </div>`;
            }).join('');

        } catch (error) {
            console.error('Load wishlist error', error);
            container.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load wishlist.</p>';
        }
    },

    async submitContactForm(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'Sending...';

        const formData = new FormData(form);
        const name = form.querySelector('input[placeholder="Name"]').value;
        const email = form.querySelector('input[placeholder="Email"]').value;
        const subject = form.querySelector('input[placeholder="Subject"]').value;
        const message = form.querySelector('textarea').value;

        try {
            await API.post('/contact', { name, email, subject, message });
            this.showToast('Message sent successfully!', 'success');
            form.reset();
        } catch (error) {
            console.error('Contact form error', error);
            this.showToast('Failed to send message', 'error');
        } finally {
        }
    },

    async toggleFilters() {
        const sidebar = document.querySelector('.filter-sidebar');
        if (!sidebar) return;

        // Toggle mobile drawer classes
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('fixed');
        sidebar.classList.toggle('inset-0');
        sidebar.classList.toggle('z-50');
        sidebar.classList.toggle('bg-white');
        sidebar.classList.toggle('p-6');
        sidebar.classList.toggle('overflow-y-auto');
        sidebar.classList.toggle('w-full'); // Ensure full width when active on mobile
        sidebar.classList.toggle('h-full');
    },

    async loadSiteSettings() {
        try {
            const settings = await API.get('/cms/settings');

            // Maintenance Mode Check
            if (settings.maintenanceMode === true) {
                const user = Auth.getUser();
                const isAdmin = user && (user.role === 'admin' || user.role === 'staff');

                // If not admin and not already on maintenance page
                if (!isAdmin && !window.location.href.includes('maintenance.html')) {
                    // Use replace to avoid history stack issues
                    window.location.replace('maintenance.html');
                    return; // Stop further execution
                }
            } else {
                // Maintenance is OFF
                // If we are on maintenance.html, go home
                if (window.location.href.includes('maintenance.html')) {
                    window.location.replace('axartechwavedemo.html');
                    return;
                }
            }

            if (settings.title) {
                document.title = settings.title;
                const brandEls = document.querySelectorAll('.font-heading.text-lg.font-bold');
                brandEls.forEach(el => el.textContent = settings.title);
            }

            if (settings.contact) {
                const footerPhone = document.getElementById('footer-phone');
                if (footerPhone && settings.contact.phone) footerPhone.innerHTML = `📞 ${settings.contact.phone}`;

                const footerEmail = document.getElementById('footer-email');
                if (footerEmail && settings.contact.email) footerEmail.innerHTML = `✉️ ${settings.contact.email}`;
            }

        } catch (error) {
            console.error('Failed to load site settings', error);
        }
    },

    async applyCoupon() {
        const input = document.getElementById('coupon-input');
        if (!input || !input.value) {
            this.showToast('Please enter a coupon code', 'error');
            return;
        }

        try {
            await API.post('/cart/coupon', { code: input.value });
            this.showToast('Coupon applied successfully!', 'success');
            // Refresh cart to show updated total
            this.updateCartModal();
        } catch (error) {
            console.error(error);
            this.showToast(error.message || 'Failed to apply coupon', 'error');
        }
    },

    openLoginModal() {
        if (Auth.isLoggedIn()) {
            this.openProfileModal();
        } else {
            document.getElementById('login-modal').classList.add('show');
        }
    },

    closeLoginModal() {
        document.getElementById('login-modal').classList.remove('show');
    },

    openProfileModal() {
        this.showProfileTab('profile'); // Default tab
        document.getElementById('profile-modal').classList.add('show');
        // Pre-fill profile form
        const user = Auth.getUser();
        if (user) {
            const form = document.getElementById('profile-form');
            form.querySelector('[name="username"]').value = user.username || '';
            form.querySelector('[name="email"]').value = user.email || '';
        }
    },

    closeProfileModal() {
        document.getElementById('profile-modal').classList.remove('show');
    },

    showProfileTab(tab) {
        // Tabs: profile, addresses, orders, wishlist
        ['profile', 'addresses', 'orders', 'wishlist'].forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const content = document.getElementById(`tab-content-${t}`);

            if (t === tab) {
                btn.classList.add('border-primary', 'text-primary');
                btn.classList.remove('border-transparent', 'text-gray-500');
                content.classList.remove('hidden');
            } else {
                btn.classList.remove('border-primary', 'text-primary');
                btn.classList.add('border-transparent', 'text-gray-500');
                content.classList.add('hidden');
            }
        });

        if (tab === 'addresses') {
            this.loadAddressBook('profile-address-list');
        } else if (tab === 'orders') {
            this.loadOrderHistory('profile-orders-list');
        } else if (tab === 'wishlist') {
            this.loadWishlist('profile-wishlist-list');
        }
    },



    async handleProfileUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const username = form.querySelector('[name="username"]').value;
        const email = form.querySelector('[name="email"]').value;

        try {
            const updatedUser = await API.put('/users/profile', { username, email });
            Auth.setUser(updatedUser); // Update local storage
            this.showToast('Profile updated successfully', 'success');
            this.checkAuth(); // Update Header UI
        } catch (error) {
            console.error(error);
            this.showToast('Failed to update profile', 'error');
        }
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const form = e.target;
        const password = form.querySelector('[name="password"]').value;

        try {
            await API.post('/auth/change-password', { password });
            this.showToast('Password changed successfully', 'success');
            form.reset();
        } catch (error) {
            this.showToast('Failed to change password', 'error');
        }
    },

    logout() {
        Auth.logout();
        this.closeProfileModal();
        this.checkAuth();
        this.updateCartCount();
        this.showToast('Logged out successfully', 'info');
        showPage('home');
    },

    showLoginTab(tab) {
        const loginForm = document.getElementById('login-form');
        // ... (rest of existing showLoginTab) is fine, but shorter replacement here for clarity
        const registerForm = document.getElementById('register-form');
        const tabs = document.getElementById('login-tabs').children;

        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            tabs[0].classList.add('border-primary', 'text-primary', 'font-medium');
            tabs[0].classList.remove('border-transparent', 'text-gray-500');
            tabs[1].classList.remove('border-primary', 'text-primary', 'font-medium');
            tabs[1].classList.add('border-transparent', 'text-gray-500');
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            tabs[0].classList.remove('border-primary', 'text-primary', 'font-medium');
            tabs[0].classList.add('border-transparent', 'text-gray-500');
            tabs[1].classList.add('border-primary', 'text-primary', 'font-medium');
            tabs[1].classList.remove('border-transparent', 'text-gray-500');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const inputs = e.target.querySelectorAll('input');
        const email = inputs[0].value;
        const password = inputs[1].value;

        if (await Auth.login(email, password)) {
            this.showToast('Logged in successfully!', 'success');
            document.getElementById('login-modal').classList.remove('show');

            const user = Auth.getUser();
            if (user && (user.role === 'admin' || user.role === 'staff')) {
                setTimeout(() => window.location.href = 'admin.html', 1000);
                return;
            }

            this.checkAuth();
            this.loadOrderHistory(); // Load user data
            this.loadAddressBook();
            this.updateCartCount();
        } else {
            this.showToast('Login failed. Check credentials.', 'error');
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const inputs = e.target.querySelectorAll('input');
        // Layout: First Name, Last Name (Grid), Email, Phone, Pass, Confirm
        const firstName = inputs[0].value;
        const lastName = inputs[1].value;
        const email = inputs[2].value;
        const phone = inputs[3].value; // Not used in simple signup yet, but good to have
        const password = inputs[4].value;
        const confirmPass = inputs[5].value;

        if (password !== confirmPass) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        const username = `${firstName} ${lastName}`;
        if (await Auth.signup(email, username, password)) {
            this.showToast('Registered successfully!', 'success');
            document.getElementById('login-modal').classList.remove('show');
            this.checkAuth();
        } else {
            this.showToast('Registration failed.', 'error');
        }
    },

    checkAuth() {
        const user = Auth.getUser();

        // Admin Dashboard Button Logic
        const adminBtn = document.getElementById('admin-dashboard-btn');
        if (adminBtn) {
            if (user && (user.role === 'admin' || user.role === 'staff')) {
                adminBtn.classList.remove('hidden');
            } else {
                adminBtn.classList.add('hidden');
            }
        }

        // Update header button to show USERNAME if logged in
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            const labelSpan = loginBtn.querySelector('span.text-\\[10px\\]');
            // Note: The selector above might be brittle if classes change. 
            // Using children index as previous code or a more robust selector is better.
            // Let's stick to the previous robust logic or improve it.
            // The HTML structure is: icon span, then text span (hidden md:block).

            if (user) {
                // Change text to user name
                if (loginBtn.children[1]) loginBtn.children[1].innerText = user.username || 'My Account';
            } else {
                if (loginBtn.children[1]) loginBtn.children[1].innerText = 'Account';
            }
        }
    },

    async updateCartDisplay() {
        const cart = await Cart.getCart();
        if (!cart) return;

        // Populate Cart Page Items
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            if (cart.items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty.</p>';
            } else {
                cartItemsContainer.innerHTML = cart.items.map(item => {
                    const image = item.variant.product.media?.[0]?.url
                        || item.variant.product.media?.[0]?.s3Key
                        || 'https://via.placeholder.com/150';

                    return `
                    <div class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                        <div class="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity" onclick="showProductDetail(${item.variant.product.id})">
                            <img src="${image}" alt="${item.variant.product.title}" class="w-20 h-20 object-contain rounded bg-gray-50">
                            <div>
                                <h4 class="font-bold text-gray-800">${item.variant.product.title}</h4>
                                <p class="text-gray-500 text-sm">₹${item.variant.prices[0].basePrice}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center border border-gray-300 rounded">
                                <button class="px-3 py-1 bg-gray-100 hover:bg-gray-200" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                                <span class="px-3 py-1">${item.quantity}</span>
                                <button class="px-3 py-1 bg-gray-100 hover:bg-gray-200" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                            <p class="font-bold">₹${item.variant.prices[0].basePrice * item.quantity}</p>
                            <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700">🗑️</button>
                        </div>
                    </div>
                `}).join('');
            }
        }

        // Populate Checkout Summary Items (Read-only) - Handled by Checkout.js now
        // const checkoutItemsContainer = document.getElementById('checkout-items');
        /* if (checkoutItemsContainer) { ... } */

        // Update Totals (Cart & Checkout Pages)
        const subtotal = cart.items.reduce((sum, item) => sum + (item.variant.prices[0].basePrice * item.quantity), 0);

        // Calculate Dynamic Tax
        let totalTax = 0;
        cart.items.forEach(item => {
            const price = item.variant.prices[0]?.basePrice || 0;
            const rate = item.variant.product.taxRate || 18;
            totalTax += (price * item.quantity * rate) / 100;
        });
        const tax = Math.round(totalTax);
        const shipping = 50;

        const total = subtotal + tax + shipping;

        ['cart-subtotal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `₹${subtotal.toLocaleString()}`;
        });
        ['cart-tax'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `₹${tax.toLocaleString()}`;
        });
        ['cart-shipping'].forEach(id => {
            const el = document.getElementById(id);
            // Assuming default 50 for Indian users as requested, until address is known
            if (el) el.innerText = `₹${shipping.toLocaleString()}`;
        });
        ['cart-total'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `₹${total.toLocaleString()}`;
        });
    },

    async submitContactForm(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;

        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';

        const inputs = form.querySelectorAll('input, select, textarea');
        const data = {
            firstName: inputs[0].value,
            lastName: inputs[1].value,
            email: inputs[2].value,
            phone: inputs[3].value,
            subject: inputs[4].value,
            message: inputs[5].value
        };

        try {
            await API.post('/contact', data);
            this.showToast('Message sent successfully!', 'success');
            form.reset();
        } catch (error) {
            console.error(error);
            this.showToast('Failed to send message.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    },

    openReturnModal(orderId, variantId) {
        document.getElementById('return-order-id').value = orderId;
        document.getElementById('return-variant-id').value = variantId;
        document.getElementById('return-modal').classList.add('show');
    },

    async submitReturnRequest(e) {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form).entries());
        // images logic: split by comma if basic input, else array
        const images = data.images ? data.images.split(',').map(s => s.trim()).filter(Boolean) : [];

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'Submitting...';

        try {
            await API.post('/rms/request', {
                orderId: parseInt(data.orderId),
                variantId: parseInt(data.variantId),
                reason: data.reason,
                type: data.type,
                images
            });
            this.showToast('Return request submitted!', 'success');
            document.getElementById('return-modal').classList.remove('show');
            form.reset();
        } catch (err) {
            this.showToast(err.message || 'Failed to request return', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }

};

// Expose Contact Form globally for HTML onclick
window.submitContactForm = (e) => UI.submitContactForm(e);
window.handleLogin = (e) => UI.handleLogin(e);
window.handleRegister = (e) => UI.handleRegister(e);
window.showPage = (id) => UI.showPage(id);
window.showProductDetail = (id) => UI.showProductDetail(id);
window.openLoginModal = () => UI.openLoginModal();
window.closeLoginModal = () => UI.closeLoginModal();
window.showLoginTab = (tab) => UI.showLoginTab(tab);
window.toggleFilters = () => UI.toggleFilters();

// Expose Shop Functions
window.sortProducts = (val) => UI.sortProducts(val);
window.setGridView = (val) => UI.setGridView(val);
window.applyFilters = () => UI.filterProducts();
window.toggleFilters = () => UI.toggleFilters();
window.changePage = (page) => UI.changePage(page);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

// Expose UI globally for cross-file access (e.g. from Checkout.js)
window.UI = UI;
