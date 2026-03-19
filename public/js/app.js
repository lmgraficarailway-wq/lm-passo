
console.log('App.js initialized');

// State
const state = {
    token: null,
    user: null,
    currentView: 'kanban'
};

// Restore session from localStorage (persists across F5 / auto-refresh)
const savedToken = localStorage.getItem('token');
const savedUser  = localStorage.getItem('user');
if (savedToken && savedUser) {
    try {
        state.token = savedToken;
        state.user  = JSON.parse(savedUser);
        // Restore last visited view (or default by role)
        if (state.user.role === 'cliente') {
            state.currentView = 'client_financial';
        } else {
            state.currentView = localStorage.getItem('lastView') || 'kanban';
        }
    } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

// Simple Router
const render = () => {
    const app = document.getElementById('app');
    app.innerHTML = '';

    if (!state.token) {
        console.log('Loading Login View...');
        import('./components/login.js').then(module => {
            console.log('Login View Loaded');
            app.appendChild(module.render(loginHandler));
        }).catch(err => {
            console.error('Failed to load login:', err);
            app.innerHTML = `<div style="color:red; padding: 2rem;">Error loading login module: ${err.message}</div>`;
        });
        return;
    }

    // Main Layout
    import('./components/layout.js').then(module => {
        const layout = module.render(state.user, logoutHandler, navigate);
        app.appendChild(layout);

        // Mark correct nav link as active (especially on page refresh)
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.getElementById(`nav-${state.currentView}`);
        if (activeLink) activeLink.classList.add('active');

        // Load view into layout content
        const contentArea = document.getElementById('content-area');
        loadView(state.currentView, contentArea);
    });
};

const loadView = (view, container) => {
    container.innerHTML = 'Loading...';
    let modulePath = '';

    switch (view) {
        case 'kanban': modulePath = './components/kanban.js'; break;
        case 'clients': modulePath = './components/clients.js'; break;
        case 'products': modulePath = './components/products.js'; break;
        case 'estoque': modulePath = './components/estoque.js'; break;
        case 'financial': modulePath = './components/financial.js'; break;
        case 'fornecedores': modulePath = './components/fornecedores.js'; break;
        case 'compras': modulePath = './components/compras.js'; break;
        case 'admin': modulePath = './components/admin.js'; break;
        case 'client_portal': modulePath = './components/client_portal.js'; break;
        case 'client_financial': modulePath = './components/client_financial.js'; break;
        default: modulePath = './components/kanban.js';
    }

    import(modulePath).then(module => {
        container.innerHTML = '';
        // Pass user to financial view for role-based controls
        const viewArg = (view === 'financial') ? state.user : undefined;
        container.appendChild(module.render(viewArg));
    }).catch(err => {
        console.error("Error loading view:", err);
        container.innerHTML = `<div style="color:red">Error loading view: ${view}</div>`;
    });
};

// Handlers
const loginHandler = (data) => {
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    // Client role always goes to portal; others use last view or kanban
    if (data.user.role === 'cliente') {
        state.currentView = 'client_financial';
    } else {
        state.currentView = localStorage.getItem('lastView') || 'kanban';
    }
    render();
};

const logoutHandler = () => {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    render();
};

const navigate = (view) => {
    state.currentView = view;
    localStorage.setItem('lastView', view);
    // We don't verify permissions strictly here for UI, but the backend protects data.
    // Ideally we would check role vs view here too.
    const contentArea = document.getElementById('content-area');
    loadView(view, contentArea);

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(`nav-${view}`).classList.add('active');
};

// Init
render();
