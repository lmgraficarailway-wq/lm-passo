const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Use DB_PATH env var (Railway persistent volume) or fallback to local
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            name TEXT,
            avatar TEXT
        )`);

        // Clients Table
        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            origin TEXT,
            core_discount INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Products Table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT,
            production_time TEXT,
            price REAL,
            stock INTEGER DEFAULT 0
        )`);

        // Migration for existing tables (safe to run always)
        db.run("ALTER TABLE products ADD COLUMN price REAL", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE orders ADD COLUMN rejection_reason TEXT", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE orders ADD COLUMN pickup_photo TEXT", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE orders ADD COLUMN checklist TEXT", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE products ADD COLUMN price_1_day REAL", (err) => {
            // Ignore
        });
        db.run("ALTER TABLE products ADD COLUMN price_3_days REAL", (err) => {
            // Ignore
        });
        db.run("ALTER TABLE orders ADD COLUMN group_id TEXT", (err) => {
            // Ignore
        });
        db.run("ALTER TABLE orders ADD COLUMN quantity INTEGER DEFAULT 1", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE orders ADD COLUMN products_summary TEXT", (err) => {
            // Ignore
        });
        db.run("ALTER TABLE orders ADD COLUMN stock_used INTEGER", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE orders ADD COLUMN loss_justification TEXT", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE orders ADD COLUMN moved_by INTEGER REFERENCES users(id)", (err) => {
            // Ignore error if column exists
        });
        db.run("ALTER TABLE orders ADD COLUMN moved_at DATETIME", (err) => {
            // Ignore error if column exists
        });

        // Stock Movements Table
        db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            quantity_change INTEGER,
            type TEXT,
            reason TEXT,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(product_id) REFERENCES products(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
        db.run("ALTER TABLE clients ADD COLUMN active INTEGER DEFAULT 1", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN loyalty_status INTEGER DEFAULT 0", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN credit_limit REAL DEFAULT 0", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN credit_balance REAL DEFAULT 0", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN billing_date INTEGER", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN cpf TEXT", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN address TEXT", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN city TEXT", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN state TEXT", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE clients ADD COLUMN zip_code TEXT", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE orders ADD COLUMN is_priority INTEGER DEFAULT 0", (err) => {
            // Ignore if exists
        });
        db.run("ALTER TABLE orders ADD COLUMN loyalty_discount REAL DEFAULT 0", (err) => {
            // Ignore if exists
        });

        db.run("ALTER TABLE clients ADD COLUMN loyalty_tier TEXT DEFAULT 'bronze'", (err) => { /* ignore if exists */ });
    db.run("ALTER TABLE clients ADD COLUMN loyalty_tier_notified INTEGER DEFAULT 1", (err) => { /* ignore if exists */ });
    db.run("ALTER TABLE clients ADD COLUMN points_reset_at DATETIME DEFAULT NULL", (err) => { /* ignore if exists */ });

    // Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            product_id INTEGER,
            description TEXT,
            total_value REAL,
            payment_method TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'aguardando_aceite',
            deadline_type TEXT,
            deadline_at DATETIME,
            production_notes TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(id),
            FOREIGN KEY(product_id) REFERENCES products(id),
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);

        // Order Items Table (New)
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price REAL,
            product_snapshot_name TEXT,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`);

        // Kit Templates Table
        db.run(`CREATE TABLE IF NOT EXISTS product_kit_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            name TEXT,
            base_price REAL,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`);

        // Kit Template Items Table
        db.run(`CREATE TABLE IF NOT EXISTS product_kit_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_id INTEGER,
            child_product_id INTEGER,
            quantity INTEGER,
            FOREIGN KEY(template_id) REFERENCES product_kit_templates(id),
            FOREIGN KEY(child_product_id) REFERENCES products(id)
        )`);

        // Comments Table
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            user_id INTEGER,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Catalogue Items Table
        db.run(`CREATE TABLE IF NOT EXISTS catalogue_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Team Chat
        db.run(`CREATE TABLE IF NOT EXISTS team_chat (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_name TEXT,
            user_role TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        const bcrypt = require('bcryptjs');

        // ... (existing imports, but bcrypt needs to be top)

        // Seed Default Users if not exist
        const defaultUsers = [
            { username: 'master',     password: 'master123',  role: 'master',     name: 'Master' },
            { username: 'gerente',    password: 'gerente123', role: 'master',     name: 'Gerente' },
            { username: 'vendedor',   password: '123456',     role: 'vendedor',   name: 'Vendedor' },
            { username: 'financeiro', password: '123456',     role: 'financeiro', name: 'Financeiro' },
            { username: 'producao',   password: '123456',     role: 'producao',   name: 'Produção' },
            { username: 'interno',    password: '123456',     role: 'interno',    name: 'Interno' }
        ];

        defaultUsers.forEach(user => {
            db.get("SELECT id FROM users WHERE username = ?", [user.username], (err, row) => {
                if (!row) {
                    const hash = bcrypt.hashSync(user.password, 10);
                    db.run("INSERT INTO users (username, password, role, name, plain_password) VALUES (?, ?, ?, ?, ?)",
                        [user.username, hash, user.role, user.name, user.password],
                        (err) => {
                            if (!err) console.log(`Created default user: ${user.username}`);
                        }
                    );
                }
            });
        });
    });

    // Migration: add launched_to_core column if missing
    db.run("ALTER TABLE orders ADD COLUMN launched_to_core INTEGER DEFAULT 0", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add core_discount column to clients if missing
    db.run("ALTER TABLE clients ADD COLUMN core_discount INTEGER DEFAULT 0", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add file_path column to orders if missing
    db.run("ALTER TABLE orders ADD COLUMN file_path TEXT DEFAULT ''", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add attachments column to orders if missing
    db.run("ALTER TABLE orders ADD COLUMN attachments TEXT DEFAULT ''", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add terceirizado column to products if missing
    db.run("ALTER TABLE products ADD COLUMN terceirizado INTEGER DEFAULT 0", (err) => {
        // Ignore error if column already exists
    });

    // Suppliers Table
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        website TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration: add description column to suppliers if missing
    db.run("ALTER TABLE suppliers ADD COLUMN description TEXT", (err) => { /* ignore */ });

    // Product Color Variants Table (for Pulseiras)
    db.run(`CREATE TABLE IF NOT EXISTS product_color_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        color TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id)
    )`);

    // Migration: add color tracking columns to order_items
    db.run("ALTER TABLE order_items ADD COLUMN color_variant_id INTEGER", () => { });
    db.run("ALTER TABLE order_items ADD COLUMN color_name TEXT", () => { });

    // Migration: add discount_value column to orders
    db.run("ALTER TABLE orders ADD COLUMN discount_value REAL DEFAULT 0", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add is_internal column to orders
    db.run("ALTER TABLE orders ADD COLUMN is_internal INTEGER DEFAULT 0", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add cost_value column to products
    db.run("ALTER TABLE products ADD COLUMN cost_value REAL DEFAULT 0", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add unit_cost column to products (manual cost per unit)
    db.run("ALTER TABLE products ADD COLUMN unit_cost REAL DEFAULT 0", (err) => {
        // Ignore error if column already exists
    });

    // Migration: add extended client data columns
    db.run("ALTER TABLE clients ADD COLUMN cpf TEXT DEFAULT ''", (err) => { });
    db.run("ALTER TABLE clients ADD COLUMN address TEXT DEFAULT ''", (err) => { });
    db.run("ALTER TABLE clients ADD COLUMN city TEXT DEFAULT ''", (err) => { });
    db.run("ALTER TABLE clients ADD COLUMN state TEXT DEFAULT ''", (err) => { });
    db.run("ALTER TABLE clients ADD COLUMN zip_code TEXT DEFAULT ''", (err) => { });

    // Migration: Loyalty and Credit system for clients
    db.run("ALTER TABLE clients ADD COLUMN loyalty_status INTEGER DEFAULT 0", (err) => { });
    db.run("ALTER TABLE clients ADD COLUMN credit_balance REAL DEFAULT 0", (err) => { });
    db.run("ALTER TABLE clients ADD COLUMN credit_limit REAL DEFAULT 0", (err) => { });
    db.run("ALTER TABLE clients ADD COLUMN billing_date INTEGER DEFAULT NULL", (err) => { });

    // Client Credit Movements Table
    db.run(`CREATE TABLE IF NOT EXISTS client_credit_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        order_id INTEGER,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(client_id) REFERENCES clients(id),
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(created_by) REFERENCES users(id)
    )`);

    // Migration: add client_id to users (links user account to a client for client portal)
    db.run("ALTER TABLE users ADD COLUMN client_id INTEGER DEFAULT NULL", (err) => { });

    // Migration: add plain_password to users (for admin visibility in settings)
    db.run("ALTER TABLE users ADD COLUMN plain_password TEXT DEFAULT ''", (err) => { });

    // Migration: add moved_by / moved_at to track who moved a card between columns
    db.run("ALTER TABLE orders ADD COLUMN moved_by INTEGER DEFAULT NULL", () => {});
    db.run("ALTER TABLE orders ADD COLUMN moved_at DATETIME DEFAULT NULL", () => {});

    // Migration: add is_terceirizado to flag orders with outsourced products
    db.run("ALTER TABLE orders ADD COLUMN is_terceirizado INTEGER DEFAULT 0", () => {});

    // Material Cost Movements Table (tracks costs from internal orders)
    db.run(`CREATE TABLE IF NOT EXISTS material_cost_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        order_id INTEGER,
        cost_amount REAL DEFAULT 0,
        quantity INTEGER DEFAULT 1,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(order_id) REFERENCES orders(id)
    )`);

    // Purchase Requests Table
    db.run(`CREATE TABLE IF NOT EXISTS purchase_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        custom_product_name TEXT,
        supplier_id INTEGER,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_cost REAL DEFAULT 0,
        notes TEXT,
        status TEXT DEFAULT 'pendente',
        requested_by INTEGER,
        received_by INTEGER,
        received_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY(requested_by) REFERENCES users(id),
        FOREIGN KEY(received_by) REFERENCES users(id)
    )`);

    // Migration: add custom_product_name to purchase_requests if missing
    db.run("ALTER TABLE purchase_requests ADD COLUMN custom_product_name TEXT", (err) => { /* ignore if exists */ });
    // Migration: add event_name for CORE orders
    db.run("ALTER TABLE orders ADD COLUMN event_name TEXT DEFAULT ''", (err) => { /* ignore if exists */ });
    // Migration: flag indicating stock was reserved at order creation
    db.run("ALTER TABLE orders ADD COLUMN stock_reserved INTEGER DEFAULT 0", (err) => { /* ignore if exists */ });
    // Migration: add payment_code for Cartão orders
    db.run("ALTER TABLE orders ADD COLUMN payment_code TEXT DEFAULT ''", (err) => { /* ignore if exists */ });

    // Dispatch Costs Table (tracks despacho expenses per order)
    db.run(`CREATE TABLE IF NOT EXISTS dispatch_costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        carrier TEXT,
        amount REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES orders(id)
    )`);

    // Migration: add launched_to_core to dispatch_costs
    db.run("ALTER TABLE dispatch_costs ADD COLUMN launched_to_core INTEGER DEFAULT 0", (err) => { /* ignore if exists */ });
    // Reminders Table (pedidos / lembretes da equipe)
    db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pendente',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        concluded_at DATETIME,
        FOREIGN KEY(created_by) REFERENCES users(id)
    )`);
    db.run("ALTER TABLE reminders ADD COLUMN position INTEGER DEFAULT 0", (err) => { /* ignore */ });

    // Menu Orders Table (cardápios para lançar no CORE)
    db.run(`CREATE TABLE IF NOT EXISTS menu_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        quantity INTEGER NOT NULL DEFAULT 1,
        event_name TEXT NOT NULL,
        producer_name TEXT NOT NULL,
        print_type TEXT NOT NULL DEFAULT 'frente',
        status TEXT DEFAULT 'pendente',
        launched_to_core INTEGER DEFAULT 0,
        order_id INTEGER,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
    )`);
    db.run("ALTER TABLE menu_orders ADD COLUMN client_id INTEGER", (err) => { /* ignore */ });
    db.run("ALTER TABLE menu_orders ADD COLUMN order_id INTEGER", (err) => { /* ignore */ });
    db.run("ALTER TABLE menu_orders ADD COLUMN position INTEGER DEFAULT 0", (err) => { /* ignore */ });

    // Migration: team_chat additions
    db.run("ALTER TABLE team_chat ADD COLUMN is_edited INTEGER DEFAULT 0", (err) => { /* ignore */ });
    db.run("ALTER TABLE team_chat ADD COLUMN edited_at DATETIME", (err) => { /* ignore */ });
    db.run("ALTER TABLE team_chat ADD COLUMN reply_to_id INTEGER", (err) => { /* ignore */ });
    db.run("ALTER TABLE team_chat ADD COLUMN reply_to_author TEXT", (err) => { /* ignore */ });
    db.run("ALTER TABLE team_chat ADD COLUMN reply_to_msg TEXT", (err) => { /* ignore */ });
    db.run("ALTER TABLE team_chat ADD COLUMN attachment_url TEXT", (err) => { /* ignore */ });

    // ── FIREBASE SYNC QUEUE ────────────────────────────────
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS firebase_sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        const syncTables = [
            'clients', 'products', 'orders', 'order_items', 'catalogue_items', 
            'suppliers', 'dispatch_costs', 'users', 'team_chat', 'stock_movements',
            'reminders', 'menu_orders', 'client_credit_movements'
        ];

        syncTables.forEach(table => {
            db.run(`CREATE TRIGGER IF NOT EXISTS trg_${table}_insert_sync AFTER INSERT ON ${table}
            BEGIN INSERT INTO firebase_sync_queue (table_name, record_id, action) VALUES ('${table}', NEW.id, 'INSERT'); END;`);
            
            db.run(`CREATE TRIGGER IF NOT EXISTS trg_${table}_update_sync AFTER UPDATE ON ${table}
            BEGIN INSERT INTO firebase_sync_queue (table_name, record_id, action) VALUES ('${table}', NEW.id, 'UPDATE'); END;`);

            db.run(`CREATE TRIGGER IF NOT EXISTS trg_${table}_delete_sync AFTER DELETE ON ${table}
            BEGIN INSERT INTO firebase_sync_queue (table_name, record_id, action) VALUES ('${table}', OLD.id, 'DELETE'); END;`);
        });
    });
}

module.exports = db;
