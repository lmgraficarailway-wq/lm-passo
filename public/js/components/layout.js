export const render = (user, onLogout, onNavigate) => {
    const container = document.createElement('div');
    container.className = 'layout';

    // Apply role-based theme
    if (user.role === 'producao') {
        document.documentElement.style.setProperty('--sidebar-bg', '#1e3a5f');
        document.documentElement.style.setProperty('--primary', '#3b82f6');
        document.documentElement.style.setProperty('--primary-hover', '#2563eb');
        document.documentElement.style.setProperty('--bg-color', '#f0f4f8');
        document.documentElement.style.setProperty('--border', '#c7d8e8');
    } else if (user.role === 'vendedor') {
        document.documentElement.style.setProperty('--sidebar-bg', '#7c3aed');
        document.documentElement.style.setProperty('--primary', '#a78bfa');
        document.documentElement.style.setProperty('--primary-hover', '#8b5cf6');
        document.documentElement.style.setProperty('--bg-color', '#faf5ff');
        document.documentElement.style.setProperty('--border', '#ddd6fe');
    } else if (user.role === 'cliente') {
        document.documentElement.style.setProperty('--sidebar-bg', '#065f46');
        document.documentElement.style.setProperty('--primary', '#10b981');
        document.documentElement.style.setProperty('--primary-hover', '#059669');
        document.documentElement.style.setProperty('--bg-color', '#f0fdf4');
        document.documentElement.style.setProperty('--border', '#a7f3d0');
    } else {
        document.documentElement.style.setProperty('--sidebar-bg', '#2e1065');
        document.documentElement.style.setProperty('--primary', '#7c3aed');
        document.documentElement.style.setProperty('--primary-hover', '#6d28d9');
        document.documentElement.style.setProperty('--bg-color', '#f5f3ff');
        document.documentElement.style.setProperty('--border', '#e0d4f5');
    }

    // Determine Menu Items based on Role
    const canSeeFinance = ['master', 'financeiro'].includes(user.role);

    let menuItems = '';

    if (user.role === 'cliente') {
        // Client only sees their financial view
        menuItems = `
            <li class="nav-item">
                <a class="nav-link active" id="nav-client_financial" data-view="client_financial">
                    <ion-icon name="cash-outline"></ion-icon> Meu Financeiro
                </a>
            </li>
        `;
    } else if (user.role === 'producao') {
        // Producao only sees Quadro and Produtos
        menuItems = `
            <li class="nav-item">
                <a class="nav-link active" id="nav-kanban" data-view="kanban">
                    <ion-icon name="clipboard-outline"></ion-icon> Quadro
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-products" data-view="products">
                    <ion-icon name="pricetags-outline"></ion-icon> Produtos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-catalogue" data-view="catalogue">
                    <ion-icon name="book-outline"></ion-icon> Catálogo
                </a>
            </li>
        `;
    } else {
        menuItems = `
            <li class="nav-item">
                <a class="nav-link active" id="nav-kanban" data-view="kanban">
                    <ion-icon name="clipboard-outline"></ion-icon> Quadro
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-clients" data-view="clients">
                    <ion-icon name="people-outline"></ion-icon> Clientes
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-products" data-view="products">
                    <ion-icon name="pricetags-outline"></ion-icon> Produtos
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-catalogue" data-view="catalogue">
                    <ion-icon name="book-outline"></ion-icon> Catálogo
                </a>
            </li>
        `;
    }

    const canSeeStock = ['master'].includes(user.role);

    if (canSeeStock) {
        menuItems += `
        <li class="nav-item">
            <a class="nav-link" id="nav-estoque" data-view="estoque" style="position:relative;">
                <ion-icon name="cube-outline"></ion-icon> Estoque
                <span id="stock-alert-badge" style="display:none; position:absolute; top:12px; right:15px; background:#ef4444; color:white; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:10px; box-shadow:0 0 8px rgba(239, 68, 68, 0.8);"></span>
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="nav-compras" data-view="compras">
                <ion-icon name="cart-outline"></ion-icon> Compras
            </a>
        </li>
        `;
    }

    if (canSeeFinance) {
        menuItems += `
        <li class="nav-item">
            <a class="nav-link" id="nav-financial" data-view="financial">
                <ion-icon name="cash-outline"></ion-icon> Financeiro
            </a>
        </li>
        `;
    }

    if (user.role === 'master') {
        menuItems += `
        <li class="nav-item">
            <a class="nav-link" id="nav-fornecedores" data-view="fornecedores">
                <ion-icon name="receipt-outline"></ion-icon> Fornecedores
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="nav-admin" data-view="admin">
                <ion-icon name="settings-outline"></ion-icon> Admin
            </a>
        </li>
        `;
    }

    container.innerHTML = `
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header" style="display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:0.5rem">
                    <img src="/logo.png" alt="Logo" style="width:32px; height:32px; border-radius:6px; object-fit:contain;">
                    <span>LM | PASSO</span>
                </div>
                <button id="toggle-sidebar" style="background:none; border:none; color:white; cursor:pointer"><ion-icon name="menu-outline"></ion-icon></button>
            </div>
            <ul class="nav-links">
                ${menuItems}
            </ul>
            <div class="user-info">
                <div style="margin-bottom: 0.5rem">Ola, ${user.name} (${user.role})</div>
                <a class="nav-link" id="logout-btn" style="padding-left: 0; color: #ef4444;">
                    <ion-icon name="log-out-outline"></ion-icon> Sair
                </a>
            </div>
        </div>
        <div class="main-content" id="content-area"></div>
    `;

    // Navigation Events
    container.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            // e.preventDefault();
            const view = link.getAttribute('data-view');
            onNavigate(view);
        });
    });

    container.querySelector('#logout-btn').addEventListener('click', onLogout);

    // Sidebar Toggle
    container.querySelector('#toggle-sidebar').addEventListener('click', () => {
        const sidebar = container.querySelector('#sidebar');
        if (sidebar.style.width === '60px') {
            sidebar.style.width = '250px';
            sidebar.querySelectorAll('.nav-link span, .sidebar-header span, .user-info div').forEach(el => el.style.display = 'block');
        } else {
            sidebar.style.width = '60px';
            sidebar.querySelectorAll('.nav-link span, .sidebar-header span, .user-info div').forEach(el => el.style.display = 'none');
        }
    });

    // Check low stock and alert visually
    if (canSeeStock) {
        setTimeout(async () => {
            try {
                const res = await fetch('/api/stock');
                const { data } = await res.json();
                const isKit = (p) => (p.name || '').toUpperCase().includes('KIT');
                const filtered = data.filter(p => !isKit(p));
                
                let lowCount = 0;
                filtered.forEach(p => {
                    if (p.stock_status === 'baixo' || p.stock_status === 'zerado') lowCount++;
                });

                if (lowCount > 0) {
                    const badge = container.querySelector('#stock-alert-badge');
                    if (badge) {
                        badge.style.display = 'inline-block';
                        badge.textContent = lowCount > 99 ? '+99' : lowCount;
                    }
                }
            } catch (err) {
                console.error('Stock alert check failed:', err);
            }
        }, 800);
    }

    // Initialize Global Team Chat
    import('./chatWidget.js?v=' + Date.now()).then(module => {
        module.initChatWidget(user, container);
    }).catch(err => console.error('Failed to load chat widget:', err));

    return container;
};
