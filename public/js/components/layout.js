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

    // Inline SVG icons — no external dependency, always visible
    const icons = {        kanban: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
        clients: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
        products: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
        catalogue: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 17.5h7M17.5 14v7"/></svg>`,
        estoque: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        compras: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path stroke-linecap="round" stroke-linejoin="round" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
        financial: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>`,
        demand: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        fornecedores: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="15" height="13" rx="1"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
        admin: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
        logout: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>`,
        cash: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>`,
    };


    let menuItems = '';

    if (user.role === 'cliente') {
        menuItems = `
            <li class="nav-item">
                <a class="nav-link active" id="nav-client_financial" data-view="client_financial" title="Meu Financeiro">
                    ${icons.cash} <span class="nav-text">Meu Financeiro</span>
                </a>
            </li>
        `;
    } else if (user.role === 'producao') {
        menuItems = `
            <li class="nav-item">
                <a class="nav-link active" id="nav-kanban" data-view="kanban" title="Quadro">
                    ${icons.kanban} <span class="nav-text">Quadro</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-products" data-view="products" title="Produtos">
                    ${icons.products} <span class="nav-text">Produtos</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-catalogue" data-view="catalogue" title="Catálogo">
                    ${icons.catalogue} <span class="nav-text">Catálogo</span>
                </a>
            </li>
        `;
    } else {
        menuItems = `
            <li class="nav-item">
                <a class="nav-link active" id="nav-kanban" data-view="kanban" title="Quadro">
                    ${icons.kanban} <span class="nav-text">Quadro</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-clients" data-view="clients" title="Clientes">
                    ${icons.clients} <span class="nav-text">Clientes</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-products" data-view="products" title="Produtos">
                    ${icons.products} <span class="nav-text">Produtos</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="nav-catalogue" data-view="catalogue" title="Catálogo">
                    ${icons.catalogue} <span class="nav-text">Catálogo</span>
                </a>
            </li>
        `;
    }

    const canSeeStock = ['master'].includes(user.role);

    if (canSeeStock) {
        menuItems += `
        <li class="nav-item">
            <a class="nav-link" id="nav-estoque" data-view="estoque" title="Estoque" style="position:relative;">
                ${icons.estoque} <span class="nav-text">Estoque</span>
                <span id="stock-alert-badge" style="display:none; position:absolute; top:10px; right:10px; background:#ef4444; color:white; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:10px; box-shadow:0 0 8px rgba(239, 68, 68, 0.8);"></span>
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="nav-compras" data-view="compras" title="Compras">
                ${icons.compras} <span class="nav-text">Compras</span>
            </a>
        </li>
        `;
    }

    if (canSeeFinance) {
        menuItems += `
        <li class="nav-item">
            <a class="nav-link" id="nav-financial" data-view="financial" title="Financeiro">
                ${icons.financial} <span class="nav-text">Financeiro</span>
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="nav-demand" data-view="demand" title="Demanda de Produtos">
                ${icons.demand} <span class="nav-text">Demanda</span>
            </a>
        </li>
        `;
    }

    if (user.role === 'master') {
        menuItems += `
        <li class="nav-item">
            <a class="nav-link" id="nav-fornecedores" data-view="fornecedores" title="Fornecedores">
                ${icons.fornecedores} <span class="nav-text">Fornecedores</span>
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="nav-admin" data-view="admin" title="Admin">
                ${icons.admin} <span class="nav-text">Admin</span>
            </a>
        </li>
        `;
    }

    container.innerHTML = `
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header" style="display:flex; align-items:center; gap:0.5rem; overflow:hidden; margin-bottom:2rem; padding:0.5rem; border-bottom:1px solid rgba(255,255,255,0.1);">
                <img src="/logo.png" alt="Logo" style="width:32px; height:32px; border-radius:6px; object-fit:contain; flex-shrink:0;">
                <span class="nav-text" style="white-space:nowrap; font-size:1.1rem; font-weight:800; letter-spacing:-0.02em;">LM | PASSO</span>
            </div>
            <ul class="nav-links">
                ${menuItems}
            </ul>
            <div class="user-info">
                <div class="nav-text" style="margin-bottom:0.5rem; font-size:0.72rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Olá, ${user.name}</div>
                <a class="nav-link" id="logout-btn" title="Sair" style="color:#ef4444;">
                    ${icons.logout} <span class="nav-text">Sair</span>
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

    // Sidebar Toggle Logic removed (now handled by CSS hover)

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
