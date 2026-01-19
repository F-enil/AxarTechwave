window.Admin = {
    // Admin Panel Logic
    updateOrderStatus: async (orderId, status) => {
        try {
            await API.put(`/orders/${orderId}`, { status });
            Admin.showToast('Order status updated', 'success');
            // Refresh
            const orderIndex = Admin.ordersCache.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) Admin.ordersCache[orderIndex].status = status;

            // Re-render modal if open? Or just close it?
            // Re-rendering is better but simpler: close and refresh list
            document.getElementById('order-modal').remove();
            Admin.showOrderList();
        } catch (error) {
            console.error(error);
            Admin.showToast('Failed to update status', 'error');
        }
    },
    showToast(message, type = 'success') {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(message, type);
        } else {
            console.log(`[Toast ${type}]: ${message}`);
            // Fallback for independent admin page if native UI not present
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 text-white px-6 py-3 rounded shadow-lg transition-opacity duration-300 z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
            toast.innerText = message;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    },
    init() {
        console.log('[Admin] init() TRIGGERED');
        if (!Auth.isLoggedIn()) {
            this.showLoginForm();
            return;
        }
        const user = Auth.getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
            Auth.logout();
            this.showLoginForm();
            return;
        }
        this.user = user;

        // 1. Toggle Layout
        document.getElementById('shop-app').classList.add('hidden');
        document.getElementById('admin-app').classList.remove('hidden');

        // 2. Render & Load
        this.renderLayout(user);
        this.loadDashboard();
    },

    exitAdmin() {
        // Simple reload to return to shop state clean
        window.location.reload();
    },

    currentView: 'dashboard',

    renderLayout(user) {
        const app = document.getElementById('admin-app');
        app.innerHTML = `
            <div class="flex h-screen bg-gray-50 overflow-hidden font-body">
                <!-- Mobile Sidebar Overlay -->
                <div id="sidebar-overlay" onclick="Admin.toggleSidebar()" class="fixed inset-0 bg-black bg-opacity-50 z-20 hidden lg:hidden backdrop-blur-sm transition-opacity"></div>

                <!-- Sidebar -->
                <aside id="admin-sidebar" class="fixed lg:static inset-y-0 left-0 z-30 w-64 bg-primary text-white transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl">
                    <!-- Brand -->
                    <div class="p-6 border-b border-gray-700 flex items-center justify-between bg-secondary bg-opacity-30">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg">
                                <img src="images/logo.png" class="w-full h-full object-contain" alt="Logo">
                            </div>
                            <div>
                                <h1 class="font-heading font-bold text-lg leading-none tracking-wide">Axar<br>TechWave</h1>
                            </div>
                        </div>
                        <button onclick="Admin.toggleSidebar()" class="lg:hidden text-gray-300 hover:text-white">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <!-- Navigation -->
                    <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        <div class="px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Main</div>
                        <a href="#" onclick="Admin.switchView('dashboard')" id="nav-dashboard" class="nav-item flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all group">
                            <span class="text-xl group-hover:scale-110 transition-transform">📊</span>
                            <span class="font-medium">Dashboard</span>
                        </a>
                        <a href="#" onclick="Admin.switchView('products')" id="nav-products" class="nav-item flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all group">
                            <span class="text-xl group-hover:scale-110 transition-transform">📦</span>
                            <span class="font-medium">Products</span>
                        </a>
                        <a href="#" onclick="Admin.switchView('orders')" id="nav-orders" class="nav-item flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all group">
                            <span class="text-xl group-hover:scale-110 transition-transform">🛍️</span>
                            <span class="font-medium">Orders</span>
                        </a>

                        <div class="px-3 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Management</div>
                        <a href="#" onclick="Admin.switchView('returns')" id="nav-returns" class="nav-item flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all group">
                            <span class="text-xl group-hover:scale-110 transition-transform">🔄</span>
                            <span class="font-medium">Returns</span>
                        </a>
                        <a href="#" onclick="Admin.switchView('messages')" id="nav-messages" class="nav-item flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all group">
                            <span class="text-xl group-hover:scale-110 transition-transform">✉️</span>
                            <span class="font-medium">Messages</span>
                        </a>
                        <a href="#" onclick="Admin.switchView('newsletter')" id="nav-newsletter" class="nav-item flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all group">
                            <span class="text-xl group-hover:scale-110 transition-transform">📰</span>
                            <span class="font-medium">Newsletter</span>
                        </a>

                        <div class="px-3 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">System</div>
                        <a href="#" onclick="Admin.switchView('settings')" id="nav-settings" class="nav-item flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all group">
                            <span class="text-xl group-hover:scale-110 transition-transform">⚙️</span>
                            <span class="font-medium">Settings</span>
                        </a>
                    </nav>

                    <!-- User Footer -->
                    <div class="p-4 bg-black bg-opacity-30 border-t border-gray-700">
                        <button onclick="Admin.exitAdmin()" class="w-full mb-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2">
                             <span>⬅️</span> <span>Back to Shop</span>
                        </button>
                        <div class="flex items-center space-x-3 mb-4 px-2">
                            <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white border-opacity-20">
                                ${(user.username || 'Admin').charAt(0).toUpperCase()}
                            </div>
                            <div class="overflow-hidden">
                                <p class="text-sm font-bold truncate text-white leading-tight">${user.username || 'Administrator'}</p>
                                <p class="text-xs text-gray-400 truncate">${user.email}</p>
                            </div>
                        </div>
                        <button onclick="Auth.logout()" class="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-lg">
                            <span>🏃</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                <!-- Content Area -->
                <div class="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-50">
                    <!-- Mobile Header -->
                    <header class="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:hidden z-10 sticky top-0">
                        <button onclick="Admin.toggleSidebar()" class="text-gray-600 hover:text-primary p-2 rounded-md hover:bg-gray-100">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <span class="font-heading font-bold text-primary text-lg">Admin Panel</span>
                        <div class="w-10"></div> <!-- Spacer -->
                    </header>
                    
                    <!-- Desktop Header / Breadcrumbs (Optional, for now just space) -->
                    <!-- <header class="hidden lg:flex h-16 bg-white shadow-sm items-center px-8 border-b border-gray-200 justify-between">...</header> -->

                    <!-- Scrollable Main Content -->
                    <main id="admin-content" class="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                        <!-- Content Injected Here -->
                    </main>
                </div>
            </div>
        `;

        this.updateActiveNav();
    },

    toggleSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    },

    switchView(viewName) {
        this.currentView = viewName;
        this.updateActiveNav();
        // Close sidebar on mobile
        const sidebar = document.getElementById('admin-sidebar');
        if (window.innerWidth < 1024 && !sidebar.classList.contains('-translate-x-full')) {
            this.toggleSidebar();
        }

        switch (viewName) {
            case 'dashboard': this.loadDashboard(); break;
            case 'products': this.showProductList(); break;
            case 'orders': this.showOrderList(); break;
            case 'returns': this.showReturns(); break;
            case 'messages': this.showMessages(); break;
            case 'newsletter': this.showNewsletter(); break;
            case 'settings': this.showSettings(); break;
        }
    },

    updateActiveNav() {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('bg-white', 'bg-opacity-10', 'text-white', 'border-l-4', 'border-accent');
            el.classList.add('text-gray-300');
        });
        const active = document.getElementById(`nav-${this.currentView}`);
        if (active) {
            active.classList.add('bg-white', 'bg-opacity-10', 'text-white');
            active.classList.remove('text-gray-300');
        }
    },

    showLoginForm() {
        const app = document.getElementById('admin-app');
        if (!app) return;

        // Ensure Visibility
        const shopApp = document.getElementById('shop-app');
        if (shopApp) shopApp.classList.add('hidden');
        app.classList.remove('hidden');

        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-100 font-body">
                <div class="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                    <div class="text-center mb-8">
                        <img src="images/logo.png" class="w-16 h-16 mx-auto mb-4 object-contain">
                        <h2 class="text-3xl font-heading font-bold text-primary">Admin Access</h2>
                        <p class="text-gray-500 text-sm mt-2">Sign in to manage your store</p>
                    </div>
                    <form onsubmit="Admin.handleLogin(event)" class="space-y-6">
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                            <input type="email" name="email" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="admin@axar.com" required>
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <input type="password" name="password" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="w-full bg-primary text-white p-3 rounded-lg font-bold hover:bg-secondary transform hover:scale-[1.02] transition-all shadow-lg">Login</button>
                    </form>
                    <p class="mt-6 text-center text-sm"><a href="#" onclick="Admin.exitAdmin()" class="text-blue-600 hover:text-blue-800 font-medium">← Back to Store</a></p>
                </div>
            </div>
        `;
    },

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const btn = e.target.querySelector('button');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'Verifying...';

        try {
            const success = await Auth.login(email, password);
            if (success) {
                const user = Auth.getUser();
                if (user && (user.role === 'admin' || user.role === 'staff')) {
                    // Success - Reload to trigger proper Init
                    window.location.reload();
                } else {
                    Admin.showToast('Access Denied: Not an admin account', 'error');
                    Auth.logout();
                }
            }
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    async loadDashboard() {
        const app = document.getElementById('admin-content');
        if (!app) {
            // Should not happen if layout is rendered, but safety check
            return this.init();
        }

        app.innerHTML = `
            <div class="animate-pulse space-y-8">
                <div class="flex space-x-4">
                    <div class="h-32 bg-gray-200 rounded-xl w-1/4"></div>
                    <div class="h-32 bg-gray-200 rounded-xl w-1/4"></div>
                    <div class="h-32 bg-gray-200 rounded-xl w-1/4"></div>
                    <div class="h-32 bg-gray-200 rounded-xl w-1/4"></div>
                </div>
                <div class="h-64 bg-gray-200 rounded-xl"></div>
            </div>
        `;

        try {
            const stats = await API.get('/stats/dashboard');
            // Assuming we might not have 'products' readily available here without another call,
            // but the old dashboard called it. Let's keep it efficient.
            const products = await API.get('/catalog/products');
            const lowStock = products.flatMap(p =>
                p.variants
                    .filter(v => (v.stock !== undefined ? v.stock : 0) <= 5)
                    .map(v => ({ product: p.title, sku: v.sku, stock: v.stock }))
            );

            // ANALYTICS HELPERS
            const getTop = (obj) => Object.entries(obj || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

            const topCities = getTop(stats.analytics?.salesByCity);
            const topStates = getTop(stats.analytics?.salesByState);

            // Modern Dashboard UI
            app.innerHTML = `
                <div class="max-w-7xl mx-auto space-y-8">
                    <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h1 class="text-3xl font-heading font-bold text-gray-800">Dashboard</h1>
                            <p class="text-gray-500 mt-1"> Overview of your store's performance.</p>
                        </div>
                        <div class="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                             <span>📅</span>
                             <span>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                    
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Sales (Blue) -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Sales</p>
                                    <h3 class="text-2xl font-bold text-primary">₹${stats.totalRevenue || 0}</h3>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-blue text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💰</div>
                            </div>
                        </div>
                        <!-- Orders (Accent/Green) -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Orders</p>
                                    <h3 class="text-2xl font-bold text-primary">${stats.totalOrders || 0}</h3>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📦</div>
                            </div>
                        </div>
                        <!-- Products (Secondary/Dark Teal) -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Products</p>
                                    <h3 class="text-2xl font-bold text-primary">${stats.totalProducts || 0}</h3>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-secondary text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🏷️</div>
                            </div>
                        </div>
                        <!-- Customers (Primary/Dark Blue) -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Customers</p>
                                    <h3 class="text-2xl font-bold text-primary">${stats.totalUsers || 0}</h3>
                                </div>
                                <div class="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">👥</div>
                            </div>
                        </div>
                    </div>

                    <!-- Geographic Analytics -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span>🏙️</span> Top Cities
                            </h3>
                            <div class="space-y-3">
                                ${topCities.length > 0 ? topCities.map(([city, count], i) => `
                                    <div class="flex justify-between items-center text-sm">
                                        <div class="flex items-center gap-3">
                                            <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">${i + 1}</span>
                                            <span class="font-medium text-gray-700 capitalize">${city}</span>
                                        </div>
                                        <div class="font-bold text-primary">${count} orders</div>
                                    </div>
                                    <div class="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                        <div class="bg-primary h-1.5 rounded-full" style="width: ${(count / topCities[0][1]) * 100}%"></div>
                                    </div>
                                `).join('') : '<p class="text-gray-500 text-sm">No location data yet.</p>'}
                            </div>
                        </div>
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span>🗺️</span> Top States
                            </h3>
                            <div class="space-y-3">
                                ${topStates.length > 0 ? topStates.map(([state, count], i) => `
                                    <div class="flex justify-between items-center text-sm">
                                        <div class="flex items-center gap-3">
                                            <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">${i + 1}</span>
                                            <span class="font-medium text-gray-700 capitalize">${state}</span>
                                        </div>
                                        <div class="font-bold text-secondary">${count} orders</div>
                                    </div>
                                    <div class="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                        <div class="bg-secondary h-1.5 rounded-full" style="width: ${(count / topStates[0][1]) * 100}%"></div>
                                    </div>
                                `).join('') : '<p class="text-gray-500 text-sm">No location data yet.</p>'}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <!-- Recent Orders -->
                        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 class="text-lg font-bold text-gray-800">Recent Orders</h2>
                                <button onclick="Admin.switchView('orders')" class="text-primary text-sm font-bold hover:underline">View All &rarr;</button>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead class="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider">
                                        <tr>
                                            <th class="px-6 py-4">ID</th>
                                            <th class="px-6 py-4">User</th>
                                            <th class="px-6 py-4">Total</th>
                                            <th class="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100">
                                        ${stats.recentOrders.map(o => `
                                            <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="Admin.showOrderDetail(${o.id})">
                                                <td class="px-6 py-4 font-mono font-medium text-primary">#${o.customId || o.id}</td>
                                                <td class="px-6 py-4">
                                                    <div class="font-medium text-gray-900">${o.user?.username || 'Guest'}</div>
                                                </td>
                                                <td class="px-6 py-4 font-bold">₹${o.total}</td>
                                                <td class="px-6 py-4">
                                                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                }">${o.status}</span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                        ${stats.recentOrders.length === 0 ? '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No recent orders.</td></tr>' : ''}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Low Stock & Alerts -->
                        <div class="space-y-6">
                            ${lowStock.length > 0 ? `
                            <div class="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
                                <div class="flex items-center space-x-2 mb-4">
                                    <span class="relative flex h-3 w-3">
                                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <h2 class="text-lg font-bold text-red-800">Low Stock Alerts</h2>
                                </div>
                                <div class="space-y-3">
                                    ${lowStock.slice(0, 5).map(item => `
                                        <div class="flex justify-between items-center bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                            <div>
                                                <div class="font-medium text-gray-800 text-sm truncate max-w-[120px]">${item.product}</div>
                                                <div class="text-xs text-gray-500 font-mono">${item.sku}</div>
                                            </div>
                                            <div class="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs">${item.stock} left</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : `
                            <div class="bg-green-50 border border-green-100 rounded-2xl p-6 shadow-sm flex items-center justify-center flex-col text-center">
                                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-3">✅</div>
                                <h3 class="font-bold text-green-800">Inventory Healthy</h3>
                                <p class="text-sm text-green-600">All products are well stocked.</p>
                            </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(error);
            app.innerHTML = `<div class="p-8 text-red-600 bg-red-50 rounded-lg border border-red-200 m-8">Failed to load dashboard: ${error.message}</div>`;
        }
    },

    async showNewsletter() {
        const content = document.getElementById('admin-content');
        content.innerHTML = '<p>Loading subscribers...</p>';
        try {
            const subscribers = await API.get('/newsletter');
            if (!subscribers || subscribers.length === 0) {
                content.innerHTML = '<p class="text-gray-500">No subscribers yet.</p>';
                return;
            }
            let html = `
                <div class="flex justify-between mb-4">
                    <h2 class="text-2xl font-bold">Newsletter Subscribers</h2>
                </div>
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 text-gray-700 uppercase">
                            <tr>
                                <th class="px-6 py-3">ID</th>
                                <th class="px-6 py-3">Email</th>
                                <th class="px-6 py-3">Status</th>
                                <th class="px-6 py-3">Subscribed At</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
            `;
            subscribers.forEach(sub => {
                html += `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4">${sub.id}</td>
                        <td class="px-6 py-4 font-medium text-gray-900">${sub.email}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${sub.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${sub.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-gray-500">${new Date(sub.createdAt).toLocaleString()}</td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
            content.innerHTML = html;
        } catch (e) {
            console.error(e);
            content.innerHTML = `<p class="text-red-600">Error loading subscribers: ${e.message}</p>`;
        }
    },

    async showProductList() {
        const content = document.getElementById('admin-content');
        // Skeleton loader
        content.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div class="h-64 bg-gray-200 rounded"></div>
            </div>
        `;

        try {
            const products = await API.get('/catalog/products');
            this.productsCache = products; // Cache for edit

            let html = `
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-heading font-bold text-gray-800">Products</h2>
                        <p class="text-sm text-gray-500">Manage your product catalog</p>
                    </div>
                    <button onclick="Admin.showProductForm()" class="bg-primary text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition-all shadow-sm">
                        <span>+</span>
                        <span>Add Product</span>
                    </button>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th class="p-4 w-16">ID</th>
                                    <th class="p-4">Product Details</th>
                                    <th class="p-4">SKU / Stock</th>
                                    <th class="p-4 text-right">Price</th>
                                    <th class="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
            `;

            if (products.length === 0) {
                html += '<tr><td colspan="5" class="p-8 text-center text-gray-500">No products found. Add one to get started!</td></tr>';
            }

            products.forEach(p => {
                const variant = p.variants[0];
                const price = variant?.prices[0]?.basePrice || 0;
                const stock = variant?.stock || 0; // Check logic from dashboard loop? v.inventory probably
                // Actually in getProducts listing, we might not have full inventory structure if not populated?
                // Assuming standard structure.

                // Let's get stock safely. Dashboard used v.stock.
                const stockDisplay = stock <= 5
                    ? `<span class="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-xs ">${stock} Low</span>`
                    : `<span class="text-accent bg-accent bg-opacity-10 px-2 py-0.5 rounded text-xs font-medium">${stock} In Stock</span>`;

                html += `
                    <tr class="hover:bg-gray-50 transition-colors group">
                        <td class="p-4 text-gray-500 font-mono text-sm">#${p.id}</td>
                        <td class="p-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                    ${p.media && p.media.length > 0
                        ? `<img src="${p.media[0].url}" class="w-full h-full object-cover">`
                        : '<span class="text-xs text-gray-400">No Img</span>'}
                                </div>
                                <div>
                                    <div class="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">${p.title}</div>
                                    <div class="text-xs text-gray-500">${p.category?.name || 'Uncategorized'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="p-4">
                            <div class="text-sm font-mono text-gray-600">${variant?.sku || 'N/A'}</div>
                            <div class="mt-1">${stockDisplay}</div>
                        </td>
                        <td class="p-4 text-right font-medium text-gray-900">₹${price}</td>
                        <td class="p-4">
                            <div class="flex justify-center space-x-2">
                                <button onclick="Admin.editProduct(${p.id})" class="p-1.5 text-blue hover:bg-blue hover:bg-opacity-10 rounded transition-colors" title="Edit">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button onclick="Admin.deleteProduct(${p.id})" class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table></div></div>';
            content.innerHTML = html;
        } catch (e) {
            content.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Error!</strong>
                    <span class="block sm:inline">${e.message}</span>
                </div>`;
        }
    },

    async showProductForm(product = null) {
        this.pendingFiles = []; // Reset queue
        const content = document.getElementById('admin-content');
        content.innerHTML = '<p>Loading form...</p>';

        try {
            const categories = await API.get('/catalog/categories');
            let stock = 0;
            if (product && product.variants && product.variants[0]) {
                const fresh = await API.get(`/catalog/products/${product.slug}`);
                product = fresh;
                stock = product.variants[0]?.inventory?.reduce((acc, item) => acc + item.quantity, 0) || 0;
            }

            // Prepare existing media HTML
            let mediaHtml = '';
            if (product && product.media && product.media.length > 0) {
                mediaHtml = `
                    <div class="grid grid-cols-3 gap-2 mt-2 mb-4">
                        ${product.media.map((m, index) => `
                            <div class="relative group border rounded p-1" id="media-item-${index}">
                                ${m.kind === 'video'
                        ? `<video src="${m.url}" class="w-full h-24 object-cover" controls></video>`
                        : `<img src="${m.url}" class="w-full h-24 object-cover">`
                    }
                                <button type="button" onclick="Admin.removeMedia(${index})" class="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-75 hover:opacity-100">&times;</button>
                                <input type="hidden" name="existingMedia" value='${JSON.stringify(m)}'>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            content.innerHTML = `
                <h2 class="text-2xl font-bold mb-4">${product ? 'Edit' : 'Add'} Product</h2>
                <form onsubmit="Admin.saveProduct(event)" class="max-w-lg space-y-4">
                    <input type="hidden" id="product-id" value="${product ? product.id : ''}">
                    <input type="text" name="title" placeholder="Title" value="${product ? product.title : ''}" class="w-full p-2 border rounded" required>
                    <textarea name="description" placeholder="Description" class="w-full p-2 border rounded">${product ? product.description : ''}</textarea>
                    <input type="text" name="slug" placeholder="Slug (unique-url-id)" value="${product ? product.slug : ''}" class="w-full p-2 border rounded" required>

                     <div class="grid grid-cols-2 gap-4">
                        <input type="number" name="price" placeholder="Base Price" value="${product ? product.variants[0]?.prices[0]?.basePrice : ''}" class="w-full p-2 border rounded" required>
                        <input type="number" name="stock" placeholder="Stock Quantity" value="${stock}" class="w-full p-2 border rounded" required>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Country of Origin</label>
                            <input type="text" name="originCountry" list="country_list" placeholder="Search or Select Country" value="${product ? product.originCountry || '' : ''}" class="w-full p-2 border rounded" autocomplete="off">
                            <datalist id="country_list">
                                ${this.getCountries().map(c => `<option value="${c}">`).join('')}
                            </datalist>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">HSN Code</label>
                             <input type="text" name="hsnSac" placeholder="HSN/SAC Code" value="${product ? product.hsnSac || '' : ''}" class="w-full p-2 border rounded">
                        </div>
                    </div>

                    <!-- Tax Settings -->
                    <div class="border rounded p-4 bg-gray-50 mt-4">
                        <h3 class="font-bold text-gray-700 mb-2">Tax Settings</h3>
                        <div class="mb-4">
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Total Tax Rate (%)</label>
                            <input type="number" name="taxRate" id="tax_rate_total" value="${product ? product.taxRate || 18 : 18}" class="w-full p-2 border rounded font-bold text-gray-700 bg-white" oninput="Admin.updateTaxBreakdown(true)">
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Gujarat (Intra-State) -->
                            <div class="bg-white p-3 rounded border border-blue-100">
                                <h4 class="font-bold text-sm text-blue-800 mb-2">Gujarat (Intra-State)</h4>
                                <div class="grid grid-cols-2 gap-2">
                                     <div>
                                        <label class="block text-xs text-gray-500">CGST (%)</label>
                                        <input type="number" name="cgst" id="tax_cgst" step="0.01" value="${product ? product.cgst || 0 : 0}" class="w-full p-2 border rounded">
                                     </div>
                                     <div>
                                        <label class="block text-xs text-gray-500">SGST (%)</label>
                                        <input type="number" name="sgst" id="tax_sgst" step="0.01" value="${product ? product.sgst || 0 : 0}" class="w-full p-2 border rounded">
                                     </div>
                                </div>
                            </div>

                            <!-- Other State (Inter-State) -->
                            <div class="bg-white p-3 rounded border border-gray-200">
                                <h4 class="font-bold text-sm text-gray-700 mb-2">Other State (Inter-State)</h4>
                                <div>
                                    <label class="block text-xs text-gray-500">IGST (%)</label>
                                    <input type="number" name="igst" id="tax_igst" step="0.01" value="${product ? product.igst || 0 : 0}" class="w-full p-2 border rounded">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Initialize Tax UI -->
                         <img src="" onerror="setTimeout(() => Admin.updateTaxBreakdown(true), 100)" class="hidden">
                    </div>

                    <div class="border rounded p-2">
                        <label class="block text-sm text-gray-600 mb-1">Category</label>
                         <select name="categoryId" class="w-full p-2 border rounded" required>
                            <option value="">Select Category</option>
                            ${categories.map(c => `<option value="${c.id}" ${product && product.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="border rounded p-2">
                        <label class="block text-sm text-gray-600 mb-1">Product Media (Images & Videos)</label>
                        <div id="existing-media-container">
                            ${mediaHtml}
                        <input type="file" name="newMedia" multiple accept="image/*,video/*" class="w-full" onchange="Admin.handleFileSelect(this)">
                        <p class="text-xs text-gray-500 mt-1">Select multiple files. You can add them one by one.</p>
                        <div id="pending-media-container" class="mt-2"></div>
                    </div>

                    <div class="flex space-x-4">
                        <button type="submit" class="bg-primary text-white px-6 py-2 rounded shadow hover:bg-opacity-90">Save Product</button>
                        <button type="button" onclick="Admin.showProductList()" class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-opacity-90">Cancel</button>
                    </div>
                </form>
            `;
        } catch (e) {
            console.error(e);
            content.innerHTML = `<p class="text-red-500">Error loading form: ${e.message}</p>`;
        }
    },

    removeMedia(index) {
        const item = document.getElementById(`media-item-${index}`);
        if (item) item.remove();
    },

    // State for pending uploads
    pendingFiles: [],

    handleFileSelect(input) {
        if (input.files && input.files.length > 0) {
            Array.from(input.files).forEach(file => {
                // Avoid duplicates based on name-size-lastModified
                const isDuplicate = this.pendingFiles.some(f =>
                    f.name === file.name &&
                    f.size === file.size &&
                    f.lastModified === file.lastModified
                );
                if (!isDuplicate) {
                    this.pendingFiles.push(file);
                }
            });
            this.renderPendingFiles();
            input.value = ''; // Reset input to allow selecting the same file again if needed
        }
    },

    renderPendingFiles() {
        const container = document.getElementById('pending-media-container');
        if (!container) return;

        if (this.pendingFiles.length === 0) {
            container.innerHTML = '<p class="text-xs text-gray-500 italic">No new files selected.</p>';
            return;
        }

        container.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                ${this.pendingFiles.map((file, index) => `
                    <div class="relative border rounded p-2 bg-gray-50 flex flex-col items-center">
                        <div class="text-xs font-bold truncate w-full text-center mb-1">${file.name}</div>
                        <div class="text-xs text-gray-500 mb-1">${(file.size / 1024).toFixed(1)} KB</div>
                        <button type="button" onclick="Admin.removePendingFile(${index})" class="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-2 py-1 rounded bg-white">Remove</button>
                    </div>
                `).join('')}
            </div>
            <p class="text-sm font-bold text-primary mt-2">${this.pendingFiles.length} new file(s) ready to upload.</p>
        `;
    },

    removePendingFile(index) {
        this.pendingFiles.splice(index, 1);
        this.renderPendingFiles();
    },

    async uploadSingleFile(file) {
        // 1. Get Pre-Signed URL
        const uniqueName = `products/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const res = await API.post('/media/upload-url', { filename: uniqueName });
        if (!res || !res.url) throw new Error('Failed to get upload URL');

        // 2. Upload to S3
        const uploadRes = await fetch(res.url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });
        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);

        // 3. Return Key
        return {
            s3Key: res.key,
            kind: file.type.startsWith('video') ? 'video' : 'image',
            alt: file.name
        };
    },

    updateTaxBreakdown(init = false) {
        // Disabled auto-fill to respect independent stored values
        // Only total is updated for reference if needed, but sub-fields are now independent
    },

    syncTaxTotal(mode) {
        const totalEl = document.getElementById('tax_rate_total');
        const cgstEl = document.getElementById('tax_cgst');
        const sgstEl = document.getElementById('tax_sgst');
        const igstEl = document.getElementById('tax_igst');

        let newTotal = 0;

        if (mode === 'split') {
            const c = parseFloat(cgstEl.value) || 0;
            const s = parseFloat(sgstEl.value) || 0;
            // Symmetric update: if user updates CGST, auto-update SGST to match?
            // Usually GST is symmetric. Let's not enforce strictly but updating total is key.
            // If strict symmetry is desired:
            // if (document.activeElement === cgstEl) sgstEl.value = c;
            // if (document.activeElement === sgstEl) cgstEl.value = s;

            newTotal = parseFloat(cgstEl.value || 0) + parseFloat(sgstEl.value || 0);

            // Update IGST to match new total
            if (igstEl) igstEl.value = newTotal;

        } else if (mode === 'single') {
            const i = parseFloat(igstEl.value) || 0;
            newTotal = i;

            // Update CGST/SGST to match new total (50/50 split)
            const half = newTotal / 2;
            if (cgstEl) cgstEl.value = half;
            if (sgstEl) sgstEl.value = half;
        }

        if (totalEl) totalEl.value = newTotal;
    },



    async saveProduct(event) {
        event.preventDefault();
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        try {
            const id = document.getElementById('product-id').value;
            const formData = new FormData(event.target);

            // --- STEP 1: UPLOAD FILES ---
            let finalMedia = [];

            // A. Keep existing files (logic simplified: if we have tracking for them)
            // Ideally, we should read "existing-media" elements if we allow deleting old ones.
            // For now, if we are EDITING, we might want to Fetch current media or rely on what's kept.
            // But strict "Replace" logic (as per backend) means we must send ALL media we want to keep.
            // TO DO: If user deletes an existing image in UI, we shouldn't send it.
            // Current simple version: We will only append NEW files to the list. 
            // WAIT. The backend `updateProduct` does `deleteMany` then `create`. 
            // This means we MUST send OLD + NEW media combined.

            // Let's grab existing media keys from the DOM if we rendered them with data attributes
            // (Assuming renderMediaGallery adds data-key)
            // If strict rewrite: Let's assume for this moment we only support ADDING. 
            // BUT to be robust, let's collect everything.

            // Collecting Logic:
            // 1. Gather all existing media from the UI (we need to ensure they have data-key)
            // 2. Upload all NEW pending files.
            // 3. Combine.

            // Since we didn't add data-key to UI yet, let's fetch the CURRENT product first to get its media? 
            // No, that's slow. 
            // Let's assume the user wants to ADD to existing (Backend logic I wrote: "DeleteMany" then "CreateMany").
            // WARNING: If I send only NEW files, the OLD ones are wiped.
            // FIX: I need to fetch the current product state OR trust the UI.
            // Let's Trust the UI.
            // I will add a quick UI update in `renderMediaGallery` in next step to ensure we have `data-key`.
            // For now, let's focus on the Upload Pipe.

            // Upload Pending Files
            if (this.pendingFiles.length > 0) {
                console.log(`Uploading ${this.pendingFiles.length} files...`);
                // Parallel Uploads
                const uploadPromises = this.pendingFiles.map(file => this.uploadSingleFile(file));
                const newMediaItems = await Promise.all(uploadPromises);
                finalMedia = [...newMediaItems];
                console.log('Uploads complete:', finalMedia);
            }

            // Collecting Existing Media
            // Strategy: Read from DOM inputs (input[name="existingMedia"]) because the user might have removed some.
            // Using `this.currentProductMedia` is WRONG because it ignores deletions.
            const existingMediaInputs = event.target.querySelectorAll('input[name="existingMedia"]');
            if (existingMediaInputs.length > 0) {
                existingMediaInputs.forEach(input => {
                    try {
                        const m = JSON.parse(input.value);
                        // Push to finalMedia (order matters: existing first? or new first? Backend replaces all)
                        // Let's put existing first.
                        finalMedia.unshift({
                            s3Key: m.s3Key,
                            kind: m.kind,
                            alt: m.alt || formData.get('title')
                        });
                    } catch (e) {
                        console.warn('Failed to parse existing media input', e);
                    }
                });
            }

            // --- STEP 2: SAVE PRODUCT ---
            const data = {
                title: formData.get('title'),
                description: formData.get('description'),
                slug: formData.get('slug'),
                categoryId: parseInt(formData.get('categoryId')),
                status: 'active',
                variants: [
                    {
                        sku: (formData.get('slug') || 'PROD').toUpperCase() + '-STD',
                        prices: [{
                            currency: 'INR',
                            basePrice: Number(formData.get('price')),
                            salePrice: Number(formData.get('price'))
                        }],
                        stock: Number(formData.get('stock') || 0)
                    }
                ],
                originCountry: formData.get('originCountry'),
                hsnSac: formData.get('hsnSac'), // ADDED HSN
                taxRate: Number(formData.get('taxRate')) || 18,
            };

            // Add Independent Tax Fields
            data.cgst = parseFloat(formData.get('cgst')) || 0;
            data.sgst = parseFloat(formData.get('sgst')) || 0;
            data.igst = parseFloat(formData.get('igst')) || 0;
            data.taxRate = parseFloat(formData.get('taxRate')) || 18;

            // Add Media
            if (finalMedia.length > 0) {
                data.media = finalMedia;
                productMedia: finalMedia // DUAL SEND STRATEGY restored to bypass potential filtering
            };

            // DEBUG: Log the full payload
            console.log('Sending Payload:', data);

            if (id) {
                await API.put(`/catalog/products/${id}`, data);
                Admin.showToast('Product updated successfully!', 'success');
            } else {
                await API.post('/catalog/products', data);
                Admin.showToast('Product created successfully!', 'success');
            }

            // Cleanup
            this.pendingFiles = [];
            this.showProductList();

        } catch (err) {
            console.error(err);
            Admin.showToast(`Failed to save: ${err.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Save Product';
        }
    },

    async showOrderList() {
        const content = document.getElementById('admin-content');
        content.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div class="h-64 bg-gray-200 rounded"></div>
            </div>
        `;
        try {
            const orders = await API.get('/orders/admin/all');

            let html = `
                 <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-heading font-bold text-gray-800">Orders</h2>
                        <p class="text-sm text-gray-500">Track and manage customer orders</p>
                    </div>
                    <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div class="relative">
                            <input type="text" placeholder="Search ID, Customer, City..." 
                                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none w-full md:w-64"
                                oninput="Admin.handleOrderSearch(this.value)">
                            <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
                        </div>
                        <button onclick="Admin.downloadCsvV3()" class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-all shadow-sm font-medium whitespace-nowrap">
                            <span>📊</span>
                            <span>Export Excel (V3)</span>
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th class="p-4">Order ID</th>
                                    <th class="p-4">Customer</th>
                                    <th class="p-4">City / State</th>
                                    <th class="p-4">Items</th>
                                    <th class="p-4">Total</th>
                                    <th class="p-4">Status</th>
                                    <th class="p-4">Date</th>
                                    <th class="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100" id="order-table-body">
            `;

            this.ordersCache = orders;
            html += this.renderOrderRows(orders);
            html += '</tbody></table></div></div>';

            content.innerHTML = html;
        } catch (e) {
            content.innerHTML = `<div class="bg-red-50 p-4 text-red-600 rounded">Error: ${e.message}</div>`;
        }
    },

    handleOrderSearch(query) {
        if (!this.ordersCache) return;

        const term = query.toLowerCase().trim();
        const filtered = this.ordersCache.filter(o => {
            // Fields to search
            const id = (o.customId || o.id).toString().toLowerCase();
            const customerName = (o.user?.username || '').toLowerCase();
            const customerEmail = (o.user?.email || '').toLowerCase();

            let addressText = '';
            if (o.shippingAddress) {
                try {
                    const addr = typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : o.shippingAddress;
                    addressText = `${addr.city || ''} ${addr.state || ''} ${addr.country || ''} ${addr.firstName || ''} ${addr.lastName || ''}`.toLowerCase();
                } catch (e) { }
            }

            return id.includes(term) || customerName.includes(term) || customerEmail.includes(term) || addressText.includes(term);
        });

        const tbody = document.getElementById('order-table-body');
        if (tbody) {
            tbody.innerHTML = this.renderOrderRows(filtered);
        }
    },

    renderOrderRows(orders) {
        if (!orders || orders.length === 0) {
            return '<tr><td colspan="8" class="p-8 text-center text-gray-500">No orders found matching your search.</td></tr>';
        }

        return orders.map(o => {
            const customer = o.user
                ? `<div class="font-medium text-gray-900">${o.user.username}</div><div class="text-xs text-gray-500">${o.user.email}</div>`
                : '<div class="text-gray-500 italic">Guest User</div>';
            const itemCount = o.items ? o.items.length : 0;

            const statusClass =
                o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800';

            // Parse Address
            let city = 'N/A';
            let state = '-';
            if (o.shippingAddress) {
                try {
                    const addr = typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : o.shippingAddress;
                    if (addr.city) city = addr.city;
                    if (addr.state) state = addr.state;
                } catch (e) {
                    console.error('Addr parse error', e);
                }
            }

            return `
                <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="Admin.viewOrder(${o.id})">
                    <td class="p-4 font-mono text-sm text-primary font-medium">#${o.customId || o.id}</td>
                    <td class="p-4">${customer}</td>
                    <td class="p-4">
                        <div class="font-medium text-gray-900 capitalize">${city}</div>
                        <div class="text-xs text-gray-500 capitalize">${state}</div>
                    </td>
                    <td class="p-4 text-sm text-gray-600">${itemCount} items</td>
                    <td class="p-4 font-bold text-gray-900">₹${o.total}</td>
                    <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}">${o.status}</span></td>
                    <td class="p-4 text-sm text-gray-500">${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td class="p-4 text-center">
                        <button onclick="event.stopPropagation(); Admin.viewOrder(${o.id})" class="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showOrderDetail(orderId) {
        const order = this.ordersCache.find(o => o.id === orderId);
        if (!order) return;

        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" id="order-modal">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div class="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full">
                            <h3 class="text-xl font-bold break-all">Order #${order.customId || order.id}</h3>
                            <button onclick="Admin.downloadInvoice(${order.id})" class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-2">
                                <span>📄</span> Invoice
                            </button>
                        </div>
                        <button onclick="document.getElementById('order-modal').remove()" class="text-gray-500 hover:text-gray-700 text-2xl absolute top-4 right-4 md:static">&times;</button>
                    </div>
                    <div class="p-6 space-y-6">
                        <!-- Status & Meta -->
                        <!-- Status & Meta -->
                        <div class="flex justify-between items-center bg-gray-50 p-4 rounded">
                            <div>
                                <p class="text-sm text-gray-500">Status</p>
                                <select onchange="Admin.updateOrderStatus(${order.id}, this.value)" class="font-bold uppercase text-primary border rounded p-1 bg-white">
                                    <option value="created" ${order.status === 'created' ? 'selected' : ''}>Created</option>
                                    <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                                    <option value="packed" ${order.status === 'packed' ? 'selected' : ''}>Packed</option>
                                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Date</p>
                                <p class="font-bold">${new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Total</p>
                                <p class="font-bold text-xl text-green-600">₹${order.total}</p>
                            </div>
                        </div>

                        <!-- Customer Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-bold text-gray-700 mb-2 border-b pb-1">Customer Info</h4>
                                <p><strong>Name:</strong> ${order.user?.username || 'Guest'}</p>
                                <p><strong>Email:</strong> ${order.user?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-700 mb-2 border-b pb-1">Shipping Address</h4>
                                ${this.renderAddress(order.shippingAddress)}
                            </div>
                        </div>

                        <!-- Items -->
                        <div>
                            <h4 class="font-bold text-gray-700 mb-2 border-b pb-1">Order Items (${order.items.length})</h4>
                            <div class="space-y-2">
                                ${order.items.map(item => `
                                    <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded border">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-lg">📦</div>
                                            <div>
                                                <p class="font-medium">${item.title}</p>
                                                <p class="text-xs text-gray-500">Variant ID: ${item.variantId || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p>Qty: ${item.quantity}</p>
                                            <p class="font-bold">₹${item.price}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="p-6 border-t bg-gray-50 flex justify-end">
                        <button onclick="document.getElementById('order-modal').remove()" class="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },



    renderAddress(addr) {
        if (!addr) return '<p class="text-red-500">No address provided</p>';
        // Handle both stringified JSON or object
        let a = addr;
        if (typeof addr === 'string') {
            try { a = JSON.parse(addr); } catch (e) { return `<p>${addr}</p>`; }
        }

        const name = a.fullName || a.name || (a.firstName ? `${a.firstName} ${a.lastName || ''} ` : 'N/A');
        const line1 = a.addressLine1 || a.line1 || a.address || '';
        const zip = a.postalCode || a.pincode || a.zip || '';
        const country = a.country || 'India'; // Default context

        return `
            <p><strong>${name}</strong></p>
            <p>${line1}</p>
            <p>${a.city || ''}, ${a.state || ''} ${zip}</p>
            <p>${country}</p>
            <p class="mt-1">📞 ${a.phone || 'N/A'}</p>
`;
    },

    async deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await API.delete(`/catalog/products/${id}`);
            Admin.showToast('Product deleted.', 'success');
            this.showProductList();
        } catch (e) {
            console.error(e);
            Admin.showToast(`Failed to delete product: ${e.message || 'Unknown error'}`, 'error');
            // Admin.showToast('Failed to delete product', 'error');
        }
    },

    async editProduct(id) {
        // Just find it in list if possible, or we could fetch it. 
        // Our showProductForm now creates a fetch if product incomplete, 
        // But we need initial object. Let's rely on finding it in a cache?
        // Simpler: Just Fetch It by ID if we had an endpoint for ID. 
        // We only have slug endpoint.
        // So finding in current list is easiest for now.
        // Or wait, showProductForm handles the "full fetch" via slug itself if we pass object with slug.

        // Wait, showProductList endpoint returns array.
        // Let's refactor showProductList to store cache.
        // But for now, let's just GET the list again quickly internally or find from DOM? No.

        // Let's implement robust: Get list, store in Admin.productsCache
        const product = Admin.productsCache ? Admin.productsCache.find(p => p.id === id) : null;
        if (product) {
            this.showProductForm(product);
        } else {
            // Fallback reload list?
            alert('Error: Product not found in cache. Reloading list.');
            this.showProductList();
        }
    },

    async showSettings() {
        const content = document.getElementById('admin-content');
        content.innerHTML = '<p>Loading settings...</p>';

        try {
            const settings = await API.get('/cms/settings');

            content.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Change Password -->
                    <div class="bg-white p-6 rounded shadow h-fit">
                        <h2 class="text-xl font-bold mb-4">Security</h2>
                        <h3 class="text-lg font-semibold mb-4 text-gray-600">Change Password</h3>
                        <form onsubmit="Admin.updatePassword(event)" class="space-y-4">
                            <div>
                                <label class="block text-gray-700 mb-1">Current Password</label>
                                <input type="password" name="oldPassword" class="w-full p-2 border rounded" required>
                            </div>
                            <div>
                                <label class="block text-gray-700 mb-1">New Password</label>
                                <input type="password" name="newPassword" class="w-full p-2 border rounded" required>
                            </div>
                            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Update Password</button>
                        </form>
                    </div>

                    <!-- Site Configuration -->
                    <div class="bg-white p-6 rounded shadow h-fit">
                        <h2 class="text-xl font-bold mb-4">Site Configuration</h2>
                        <form onsubmit="Admin.saveSiteConfig(event)" class="space-y-4">
                            <div>
                                <label class="block text-gray-700 mb-1">Site Title</label>
                                <input type="text" name="title" value="${settings.title || ''}" class="w-full p-2 border rounded">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-gray-700 mb-1">Phone</label>
                                    <input type="text" name="phone" value="${settings.contact?.phone || ''}" class="w-full p-2 border rounded">
                                </div>
                                <div>
                                    <label class="block text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" value="${settings.contact?.email || ''}" class="w-full p-2 border rounded">
                                </div>
                            </div>
                            <div>
                                <label class="block text-gray-700 mb-1">Address</label>
                                <input type="text" name="address" value="${settings.contact?.address || ''}" class="w-full p-2 border rounded">
                            </div>

                            <div class="flex items-center space-x-3 p-4 bg-gray-50 rounded border">
                                <input type="checkbox" id="maintMode" name="maintenanceMode" class="w-5 h-5 text-red-600" ${settings.maintenanceMode ? 'checked' : ''}>
                                <label for="maintMode" class="font-bold text-gray-700">Enable Maintenance Mode</label>
                            </div>
                            <p class="text-xs text-gray-500 mb-4">When enabled, only admins can access the site.</p>

                            <button type="submit" class="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90">Save Configuration</button>
                        </form>
                    </div>
                </div>
            `;
        } catch (e) {
            content.innerHTML = `<p class="text-red-500">Error loading settings: ${e.message}</p>`;
        }
    },

    async saveSiteConfig(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerText = 'Saving...';

        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            contact: {
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address')
            },
            maintenanceMode: form.querySelector('[name="maintenanceMode"]').checked === true
        };

        try {
            await API.put('/cms/settings', data);
            Admin.showToast('Site settings updated!', 'success');
        } catch (err) {
            console.error(err);
            Admin.showToast('Failed to save settings', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Save Configuration';
        }
    },

    async updatePassword(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        const btn = e.target.querySelector('button');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'Updating...';

        try {
            await API.post('/auth/change-password', data);
            Admin.showToast('Password updated successfully. Please login again.', 'success');
            Auth.logout();
            this.showLoginForm();
        } catch (error) {
            console.error(error);
            Admin.showToast('Failed to update password: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    async showMessages() {
        const content = document.getElementById('admin-content');
        content.innerHTML = '<div class="text-center p-8"><div class="loading"></div></div>';

        try {
            // Admin endpoint to get all messages
            const messages = await API.get('/contact/admin/all');

            content.innerHTML = `
                <div class="bg-white rounded-lg shadow overflow-hidden">
                     <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Messages & Inquiries</h2>
                        <div class="flex gap-2">
                             <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">${messages.length} Messages</span>
                             <button onclick="Admin.exportMessages()" class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2">
                                📄 Export CSV
                            </button>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 text-gray-600 text-sm uppercase">
                                    <th class="p-4 border-b">Date</th>
                                    <th class="p-4 border-b">Name</th>
                                    <th class="p-4 border-b">Contact</th>
                                    <th class="p-4 border-b">Subject</th>
                                    <th class="p-4 border-b">Message</th>
                                    <th class="p-4 border-b">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${messages.length === 0 ? '<tr><td colspan="6" class="p-4 text-center text-gray-500">No messages found.</td></tr>' : ''}
                                ${messages.map(msg => `
                                    <tr class="hover:bg-gray-50 transition-colors">
                                        <td class="p-4 text-sm text-gray-500 whitespace-nowrap">
                                            ${new Date(msg.createdAt).toLocaleDateString()}
                                            <div class="text-xs text-gray-400">${new Date(msg.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td class="p-4 font-medium text-gray-900">
                                            ${msg.firstName} ${msg.lastName}
                                        </td>
                                        <td class="p-4 text-sm">
                                            <div class="text-gray-900">${msg.email}</div>
                                            <div class="text-gray-500 text-xs">${msg.phone || '-'}</div>
                                        </td>
                                        <td class="p-4 text-sm text-gray-600">
                                            <span class="bg-gray-100 px-2 py-1 rounded text-xs font-medium border border-gray-200">${msg.subject}</span>
                                        </td>
                                        <td class="p-4 text-sm text-gray-600 max-w-xs break-words">
                                            ${msg.message}
                                        </td>
                                        <td class="p-4">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${msg.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                                ${msg.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div >
    `;
        } catch (error) {
            console.error(error);
            content.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Error!</strong>
                    <span class="block sm:inline">Failed to load messages. ${error.message || ''}</span>
                </div>
            `;
        }
    },

    async downloadInvoice(orderId) {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${CONFIG.API_URL}/orders/${orderId}/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Invoice generation failed');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_Order_${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error(e);
            Admin.showToast('Failed to download invoice: ' + e.message, 'error');
        }
    },

    async showReturns() {
        const content = document.getElementById('admin-content');
        content.innerHTML = '<p>Loading returns...</p>';
        try {
            const returns = await API.get('/rms/admin/all');

            let html = `
                <h2 class="text-2xl font-bold mb-4">Return Requests</h2>
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300 min-w-full">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border p-2">ID</th>
                                <th class="border p-2">Order</th>
                                <th class="border p-2">User</th>
                                <th class="border p-2">Type</th>
                                <th class="border p-2">Reason</th>
                                <th class="border p-2">Status</th>
                                <th class="border p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (!returns || returns.length === 0) {
                html += '<tr><td colspan="7" class="p-4 text-center">No return requests found.</td></tr>';
            } else {
                returns.forEach(r => {
                    html += `
                        <tr class="border-b">
                            <td class="border p-2">#${r.id}</td>
                            <td class="border p-2">#${r.order?.customId || r.orderId} (Item: ${r.variantId})</td>
                            <td class="border p-2">${r.user?.email}</td>
                            <td class="border p-2 capitalize">${r.type || 'N/A'}</td>
                            <td class="border p-2">${r.reason}</td>
                            <td class="border p-2"><span class="font-bold uppercase text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">${r.status}</span></td>
                            <td class="border p-2">
                                <select onchange="Admin.updateReturnStatus(${r.id}, this.value)" class="border rounded p-1 text-sm">
                                    <option value="" disabled selected>Update Status</option>
                                    <option value="approved">Approve</option>
                                    <option value="rejected">Reject</option>
                                    <option value="pickup_scheduled">Schedule Pickup</option>
                                    <option value="received">Received</option>
                                    <option value="refunded">Refunded</option>
                                    <option value="replaced">Replaced</option>
                                </select>
                                ${r.status === 'approved' ? `<button onclick="Admin.schedulePickupModal(${r.id})" class="text-blue-600 text-sm ml-2 underline">Pickup Details</button>` : ''}
                            </td>
                        </tr>
                    `;
                });
            }
            html += '</tbody></table></div>';
            content.innerHTML = html;
        } catch (e) {
            content.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`;
        }
    },

    async updateReturnStatus(id, status) {
        if (!confirm(`Update status to ${status}?`)) return;
        try {
            await API.put(`/rms/admin/${id}/status`, { status });
            Admin.showToast('Return status updated', 'success');
            this.showReturns();
        } catch (e) {
            console.error(e);
            alert('Failed to update status');
        }
    },

    schedulePickupModal(id) {
        // Simple prompt for now
        const courier = prompt('Enter Courier Name:');
        if (!courier) return;
        const tracking = prompt('Enter Tracking Number:');
        if (!tracking) return;

        API.post(`/rms/admin/${id}/pickup`, { courierName: courier, trackingNumber: tracking })
            .then(() => {
                alert('Pickup scheduled!');
                Admin.showReturns();
            })
            .catch(e => alert(e.message));
    },

    async viewOrder(id) {
        const content = document.getElementById('admin-content');
        content.innerHTML = '<p>Loading order details...</p>';
        try {
            const order = await API.get(`/orders/admin/${id}`); // Assuming this endpoint exists or similar
            // Wait, we saw getOrderById in controller is @Get(':id/invoice')?? No that's invoice.
            // Let's check controller... @Get(':id/invoice') is invoice.
            // Is there a generic GET /orders/:id?
            // Controller has @Get('admin/all') and @Get() for user.
            // It lacks a specific Admin Get Order By ID!
            // BUT: loadDashboard uses API.get('/orders/admin/all').
            // Let's rely on filtering from 'all' OR finding it from the list if we cache it?
            // No, that's bad.
            // Let's check if the generic @Get(':id') exists...
            // Controller:
            // @Get(':id/invoice')
            // @Post(':id/verify-payment')
            // It seems MISSING a generic 'get by id' for admin!
            // WAIT. The controller I saw earlier had:
            // @Get() getOrders (User)
            // @Get('admin/all') getAllOrders
            // I need to add @Get('admin/:id') to backend first?
            // OR I can use the list and filter client side for now if list is loaded?
            // No, I should fix the backend to have @Get('admin/:id') or similar.
            // Actually, let's look at `orders.service.ts` again. `getOrderById` exists.
            // I will assume I need to ADD the endpoint to controller `admin/:id`.
            // FOR NOW: To avoid another backend roundtrip if I can help it...
            // I can fetch ALL and find. It's safe for now as I just fixed the list.
            // BETTER: Add the endpoint. It's quick.

            // Let's SKIP adding endpoint to keep this atomic and fetch ALL for now? 
            // NO, "fetch all" is inefficient.
            // I will add the endpoint in the next step.
            // For now, I will write this function assuming `/orders/admin/${id}` exists.

            // Re-reading controller...
            // There IS NO get-by-id for admin. 
            // I will add it in the same turn or next.
            // Let's write the code assuming it is there.

            const renderStatusOption = (current, value, label) =>
                `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`;

            content.innerHTML = `
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                             <div class="flex items-center gap-3 mb-1">
                                <h2 class="text-2xl font-bold text-gray-800">Order #${order.customId || order.id}</h2>
                                <button onclick="Admin.downloadInvoice(${order.id})" class="bg-teal-600 text-white text-xs px-2 py-1.5 rounded hover:bg-teal-700 flex items-center gap-1 shadow-sm transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Invoice
                                </button>
                             </div>
                             <p class="text-sm text-gray-500">Placed on ${new Date(order.createdAt).toLocaleString()}</p>
                             <p class="text-sm text-gray-500">User: ${order.user?.email || 'Guest'}</p>
                        </div>
                        <div class="text-right">
                             <div class="text-3xl font-bold text-gray-900">₹${order.total}</div>
                             <span class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100">${order.status.toUpperCase()}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h3 class="font-bold text-lg mb-2">Shipping Address</h3>
                            <div class="text-gray-600 bg-gray-50 p-4 rounded">
                                <p class="font-medium">${order.shippingAddress?.name || 'N/A'}</p>
                                <p>${order.shippingAddress?.line1 || ''}</p>
                                <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}</p>
                                <p>${order.shippingAddress?.country || ''} - ${order.shippingAddress?.pincode || ''}</p>
                                <p>Phone: ${order.shippingAddress?.phone || 'N/A'}</p>
                            </div>
                        </div>
                        
                         <!-- Tax Breakdown Summary -->
                        <div class="mt-4 border-t pt-4">
                            <h4 class="font-bold text-sm text-gray-700 mb-2">Tax Breakdown</h4>
                            ${(() => {
                    const t = order.taxDetails;
                    if (!t) return '<p class="text-sm text-gray-500">No tax details available.</p>';
                    if (t.cgst > 0 || t.sgst > 0) {
                        return `
                                        <div class="flex gap-4 text-sm">
                                            <div class="bg-blue-50 px-3 py-2 rounded">
                                                <span class="block text-xs text-gray-500 uppercase">CGST (Intra)</span>
                                                <span class="font-bold text-blue-800">₹${t.cgst}</span>
                                            </div>
                                            <div class="bg-blue-50 px-3 py-2 rounded">
                                                <span class="block text-xs text-gray-500 uppercase">SGST (Intra)</span>
                                                <span class="font-bold text-blue-800">₹${t.sgst}</span>
                                            </div>
                                             <div class="bg-gray-100 px-3 py-2 rounded">
                                                <span class="block text-xs text-gray-500 uppercase">Total Tax</span>
                                                <span class="font-bold text-gray-800">₹${t.totalTax}</span>
                                            </div>
                                        </div>
                                    `;
                    } else {
                        return `
                                        <div class="flex gap-4 text-sm">
                                            <div class="bg-gray-100 px-3 py-2 rounded">
                                                <span class="block text-xs text-gray-500 uppercase">IGST (Inter)</span>
                                                <span class="font-bold text-gray-800">₹${t.totalTax || 0}</span>
                                            </div>
                                        </div>
                                    `;
                    }
                })()}
                        </div>
                        <div>
                            <h3 class="font-bold text-lg mb-2">Order Action & Tracking</h3>
                            <div class="bg-blue-50 p-4 rounded border border-blue-100">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                                <div class="flex gap-2 mb-4">
                                    <select id="order-status-select" class="flex-1 border-gray-300 rounded text-sm px-2 py-1">
                                        ${renderStatusOption(order.status, 'created', 'Created')}
                                        ${renderStatusOption(order.status, 'paid', 'Paid')}
                                        ${renderStatusOption(order.status, 'packed', 'Packed')}
                                        ${renderStatusOption(order.status, 'shipped', 'Shipped')}
                                        ${renderStatusOption(order.status, 'delivered', 'Delivered')}
                                        ${renderStatusOption(order.status, 'cancelled', 'Cancelled')}
                                    </select>
                                    <button onclick="Admin.updateOrderStatus(${order.id})" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Update</button>
                                </div>

                                <hr class="border-blue-200 my-3">
                                
                                <label class="block text-sm font-medium text-gray-700 mb-1">Shipment Details</label>
                                <div class="grid grid-cols-2 gap-2 mb-2">
                                    <input type="text" id="courier-name-${order.id}" placeholder="Courier Company Name" value="${order.courierCompanyName || ''}" class="border-gray-300 rounded text-sm w-full px-2 py-1">
                                    <input type="text" id="tracking-id-${order.id}" placeholder="Tracking ID" value="${order.trackingId || ''}" class="border-gray-300 rounded text-sm w-full px-2 py-1">
                                </div>
                                <button onclick="Admin.updateOrderTracking(${order.id})" class="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 font-medium flex justify-center items-center gap-2">
                                    🚀 Send / Update Tracking
                                </button>
                                <p class="text-xs text-gray-500 mt-2">Clicking "Send" will set status to 'Shipped' and save details.</p>
                            </div>
                        </div>
                    </div>

                    <div class="mb-8">
                         <h3 class="font-bold text-lg mb-4">Items Order</h3>
                         <div class="overflow-x-auto border rounded-lg">
                            <table class="w-full text-left">
                                <thead class="bg-gray-50 border-b">
                                    <tr>
                                        <th class="p-3 text-sm font-medium text-gray-500">Product</th>
                                        <th class="p-3 text-sm font-medium text-gray-500">Price</th>
                                        <th class="p-3 text-sm font-medium text-gray-500">Qty</th>
                                        <th class="p-3 text-sm font-medium text-gray-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y">
                                    ${order.items.map(item => `
                                        <tr>
                                            <td class="p-3">
                                                <div class="font-medium text-gray-900">${item.title}</div>
                                                <div class="text-xs text-gray-500">SKU: ${item.sku}</div>
                                            </td>
                                            <td class="p-3 text-gray-600">₹${item.price}</td>
                                            <td class="p-3 text-gray-600">${item.quantity}</td>
                                            <td class="p-3 font-medium text-gray-900">₹${item.price * item.quantity}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                         </div>
                    </div>
                    
                    <button onclick="Admin.showOrderList()" class="text-gray-600 hover:text-gray-900 font-medium">← Back to Orders</button>
                </div>
            `;
        } catch (error) {
            console.error(error);
            content.innerHTML = `<p class="text-red-500">Failed to load order details: ${error.message}</p>`;
        }
    },

    async updateOrderStatus(id) {
        const select = document.getElementById('order-status-select');
        const status = select.value;
        if (!confirm(`Are you sure you want to update status to ${status}?`)) return;

        try {
            await API.post(`/orders/${id}/status`, { status });
            alert('Status updated successfully');
            this.viewOrder(id); // Reload
        } catch (e) {
            alert('Failed: ' + e.message);
        }
    },

    async updateOrderTracking(id) {
        const courierCompanyName = document.getElementById(`courier-name-${id}`).value;
        const trackingId = document.getElementById(`tracking-id-${id}`).value;
        const statusSelect = document.getElementById('order-status-select');
        const status = statusSelect ? statusSelect.value : null;

        if (!courierCompanyName || !trackingId) {
            Admin.showToast('Please enter both Courier Name and Tracking ID', 'error');
            return;
        }

        try {
            await API.post(`/orders/${id}/tracking`, { trackingId, courierCompanyName, status });
            // Admin.showToast('Tracking updated and status set to Shipped!', 'success');
            // Show dynamic message
            const statusMsg = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Shipped';
            Admin.showToast(`Tracking updated and status set to ${statusMsg}!`, 'success');

            this.viewOrder(id); // Reload
        } catch (e) {
            alert('Failed: ' + e.message);
        }
    },
    async showOrderList_OLD() {
        const content = document.getElementById('admin-content');
        content.innerHTML = '<p>Loading orders...</p>';
        try {
            const orders = await API.get('/orders/admin/all');

            content.innerHTML = `
            <div class="bg-white rounded-lg shadow overflow-hidden">
                     <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">All Orders</h2>
                            <span class="bg-blue bg-opacity-10 text-blue text-xs font-semibold px-2.5 py-0.5 rounded">${orders.length} Orders</span>
                        </div>
                        <button onclick="Admin.exportOrders()" class="bg-accent text-white px-4 py-2 rounded text-sm hover:bg-opacity-90 flex items-center gap-2">
                            📄 Export CSV
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 text-gray-600 text-sm uppercase">
                                    <th class="p-4 border-b">Order ID</th>
                                    <th class="p-4 border-b">User</th>
                                    <th class="p-4 border-b">Total</th>
                                    <th class="p-4 border-b">Status</th>
                                    <th class="p-4 border-b">Date</th>
                                    <th class="p-4 border-b">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${orders.length === 0 ? '<tr><td colspan="6" class="p-4 text-center text-gray-500">No orders found.</td></tr>' : ''}
                                ${orders.map(o => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="p-4 font-medium text-gray-900">#${o.customId || o.id}</td>
                                        <td class="p-4 text-sm text-gray-500">${o.user?.email || 'Guest'}</td>
                                        <td class="p-4 font-bold text-gray-800">₹${o.total}</td>
                                        <td class="p-4">
                                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                ${o.status}
                                            </span>
                                        </td>
                                        <td class="p-4 text-sm text-gray-500">${new Date(o.createdAt).toLocaleDateString()}</td>
                                        <td class="p-4">
                                             <button onclick="Admin.viewOrder(${o.id})" class="text-blue hover:text-secondary text-sm font-medium">View Details</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div >
    `;
        } catch (error) {
            console.error(error);
            content.innerHTML = `< p class="text-red-500" > Failed to load orders: ${error.message}</p > `;
        }
    },

    async showNewsletter() {
        const content = document.getElementById('admin-content');
        content.innerHTML = '<p>Loading subscribers...</p>';
        try {
            const subs = await API.get('/newsletter');

            content.innerHTML = `
    <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Newsletter Subscribers</h2>
                            <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">${subs.length} Subscribers</span>
                        </div>
                        <button onclick="Admin.exportNewsletter()" class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-2">
                            📄 Export CSV
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 text-gray-600 text-sm uppercase">
                                    <th class="p-4 border-b">ID</th>
                                    <th class="p-4 border-b">Email</th>
                                    <th class="p-4 border-b">Status</th>
                                    <th class="p-4 border-b">Subscribed At</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${subs.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-gray-500">No subscribers found.</td></tr>' : ''}
                                ${subs.map(s => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="p-4 text-sm text-gray-500">${s.id}</td>
                                        <td class="p-4 font-medium text-gray-900">${s.email}</td>
                                        <td class="p-4">
                                            <span class="px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                                ${s.isActive ? 'Active' : 'Unsubscribed'}
                                            </span>
                                        </td>
                                        <td class="p-4 text-sm text-gray-500">${new Date(s.createdAt).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
    `;
        } catch (error) {
            console.error(error);
            content.innerHTML = `<p class="text-red-500">Failed to load newsletter subscribers: ${error.message}</p>`;
        }
    },

    getCountries() {
        return [
            "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
            "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
            "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
            "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
            "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
            "Fiji", "Finland", "France",
            "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
            "Haiti", "Holy See", "Honduras", "Hungary",
            "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
            "Jamaica", "Japan", "Jordan",
            "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
            "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
            "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
            "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
            "Oman",
            "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
            "Qatar",
            "Romania", "Russia", "Rwanda",
            "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
            "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
            "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
            "Vanuatu", "Venezuela", "Vietnam",
            "Yemen",
            "Zambia", "Zimbabwe"
        ];
    },

    // --- Export Functions ---

    async exportMessages() {
        try {
            const messages = await API.get('/contact/admin/all');
            if (!messages || messages.length === 0) {
                alert('No messages to export');
                return;
            }

            // Define headers
            const headers = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status'];

            // Map data
            const rows = messages.map(m => [
                m.id,
                new Date(m.createdAt).toISOString(),
                `"${m.firstName} ${m.lastName}"`,
                m.email,
                m.phone || '',
                `"${m.subject}"`,
                `"${(m.message || '').replace(/"/g, '""')}"`, // Escape quotes
                m.status
            ]);

            this.downloadCSV('messages_export.csv', headers, rows);

        } catch (e) {
            console.error(e);
            alert('Export failed: ' + e.message);
        }
    },

    async downloadCsvV3() {
        console.log("Initiating V3 Authenticated Export...");
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${CONFIG.API_URL}/orders/admin/download-csv-v3?t=${Date.now()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Export Failed: ${response.status} - ${text}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders_v3_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            console.log("Export V3 Success");
        } catch (error) {
            console.error("Export V3 Error:", error);
            Admin.showToast("Failed to download CSV: " + error.message, 'error');
        }
    },

    async exportOrders() {
        // Use backend endpoint if available for streaming/efficiency
        // Since we saw OrdersController has @Get('admin/export'), let's try to use it directly
        // However, API.get() returns JSON. We need a blob download.

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${CONFIG.API_URL}/orders/admin/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server export failed: ${response.status} ${errorText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            console.error('Server export failed, falling back to client-side:', e);
            // Fallback to client-side if backend endpoint fails
            this.exportOrdersClientSide();
        }
    },

    async exportOrdersClientSide() {
        try {
            const orders = await API.get('/orders/admin/all');
            if (!orders || orders.length === 0) {
                alert('No orders to export');
                return;
            }

            const headers = [
                'Order ID', 'Custom ID', 'Date', 'Status',
                'User Name', 'User Email',
                'Shipping Name', 'Address Line 1', 'City', 'State', 'Pincode', 'Country', 'Phone',
                'Payment Method', 'Transaction ID', 'GST Number',
                'Total Amount', 'Tax Amount',
                'Courier', 'Tracking ID',
                'Items (Title x Qty)', 'HSN Codes', 'Invoice No'
            ];

            const rows = orders.map(o => {
                // 1. Address Parsing
                let addr = {};
                try {
                    addr = typeof o.shippingAddress === 'string'
                        ? JSON.parse(o.shippingAddress)
                        : (o.shippingAddress || {});
                } catch (e) {
                    addr = {};
                }

                // 2. Payment Info
                const payment = o.payments && o.payments.length > 0 ? o.payments[0] : null;
                const paymentMethod = payment ? payment.provider : 'N/A';
                const transactionId = payment ? payment.transactionId : 'N/A';

                // 3. Tax & Items
                const tax = o.taxDetails ? (o.taxDetails.totalTax || 0) : 0;
                const items = o.items ? o.items.map(i => `${i.title} (x${i.quantity})`).join('; ') : '';
                const hsnCodes = o.items ? o.items.map(i => i.variant?.product?.hsnSac || 'N/A').join('; ') : '';
                const invoiceNo = o.invoices && o.invoices.length > 0 ? o.invoices[0].invoiceNo : 'N/A';

                // 4. Address Fields
                const shipName = addr.fullName || addr.name || `${addr.firstName || ''} ${addr.lastName || ''}`.trim();

                return [
                    o.id,
                    o.customId || '',
                    new Date(o.createdAt).toISOString(),
                    o.status,
                    o.user?.username || 'Guest',
                    o.user?.email || '',
                    `"${shipName}"`,
                    `"${addr.addressLine1 || addr.line1 || addr.address || ''}"`,
                    `"${addr.city || ''}"`,
                    `"${addr.state || ''}"`,
                    `"${addr.postalCode || addr.pincode || addr.zip || ''}"`,
                    `"${addr.country || 'India'}"`,
                    `"${addr.phone || ''}"`,
                    paymentMethod,
                    transactionId,
                    o.gstNumber || '',
                    o.total,
                    tax,
                    o.courierCompanyName || '',
                    o.trackingId || '',
                    o.trackingId || '',
                    `"${items.replace(/"/g, '""')}"`,
                    `"${hsnCodes}"`,
                    invoiceNo
                ];
            });

            this.downloadCSV('orders_export_client.csv', headers, rows);
        } catch (e) {
            console.error(e);
            alert('Client-side export failed: ' + e.message);
        }
    },

    async exportNewsletter() {
        try {
            // Confirmed backend endpoint is @Get() on @Controller('newsletter')
            const subs = await API.get('/newsletter');
            if (!subs || subs.length === 0) {
                alert('No subscribers to export');
                return;
            }

            const headers = ['ID', 'Email', 'Subscribed At', 'Status'];
            const rows = subs.map(s => [
                s.id,
                s.email,
                new Date(s.createdAt).toISOString(),
                s.isActive ? 'Active' : 'Unsubscribed'
            ]);

            this.downloadCSV('newsletter_subscribers.csv', headers, rows);
        } catch (e) {
            console.error(e);
            alert('Failed to export newsletter. Ensure backend endpoint exists.');
        }
    },

    downloadCSV(filename, headers, rows) {
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    async uploadSingleFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('access_token') || localStorage.getItem('token'); // Support both
        const response = await fetch(`${CONFIG.API_URL}/media/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Upload failed');
        }

        const data = await response.json();
        return {
            s3Key: data.key,
            kind: file.type.startsWith('video') ? 'video' : 'image',
            url: data.url // Frontend might use this for preview immediately
        };
    }
};

// Manual Init required via Dashboard Button
