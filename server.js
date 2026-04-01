const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const db = require('./server/database/db');
const fs = require('fs');

// Error Logging Function
const logError = (err) => {
    const errorLogPath = path.join(process.cwd(), 'error_log.txt');
    const errorMessage = `[${new Date().toISOString()}] ERROR: ${err.message}\nSTACK: ${err.stack}\n\n`;
    fs.appendFileSync(errorLogPath, errorMessage);
};

// Global Error Handlers
process.on('uncaughtException', (err) => {
    logError(err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(new Error(`Unhandled Rejection: ${reason}`));
});

// Ensure DB directory exists (for Railway persistent volume at /data)
if (process.env.DB_PATH) {
    try {
        const dbDir = path.dirname(process.env.DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
    } catch (err) { logError(err); }
}

// Ensure uploads directory exists in the real filesystem
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    logError(err);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression()); // gzip all responses
app.use(cors());
app.use(express.json());
// Force no-cache for JS and CSS so browser always fetches fresh versions after deploy
app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});
// Serve internal assets — prefer disk (allows live updates), fall back to embedded snapshot
const diskPublic = path.join(process.cwd(), 'public');
if (fs.existsSync(diskPublic)) {
    app.use(express.static(diskPublic, { acceptRanges: false }));  // ← uses real files from disk
} else {
    app.use(express.static(path.join(__dirname, 'public'), { acceptRanges: false })); // ← fallback: embedded
}
// Serve uploads with explicit headers — bypass compression and set correct cache headers
// This prevents content-type issues and SW cache conflicts
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Accept-Ranges', 'none');
    next();
}, express.static(path.join(process.cwd(), 'public', 'uploads'), { acceptRanges: false, etag: false }));

// Health check (Railway / Render)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
const authRoutes = require('./server/routes/auth.routes');
const apiRoutes = require('./server/routes/api.routes');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Public Catalogue Item Route
app.get('/c/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM catalogue_items WHERE id = ?', [id], (err, row) => {
        if (err || !row) return res.status(404).send('<!DOCTYPE html><html><head><title>Não Encontrado</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Produto não encontrado ou removido.</h2></body></html>');
        
        let images = [];
        try {
            images = JSON.parse(row.image_url);
            if (!Array.isArray(images)) images = [row.image_url];
        } catch(e) {
            images = [row.image_url];
        }
        
        const firstImage = images[0] || '';
        const title = row.title || 'Catálogo - LM Passo';
        const desc = row.description || '';
        
        // Build absolute URL for WhatsApp minified preview compatibility
        const protocol = req.protocol === 'http' && req.get('host').includes('railway') ? 'https' : req.protocol;
        const hostUrl = protocol + '://' + req.get('host');
        const imageUrl = firstImage.startsWith('http') ? firstImage : hostUrl + firstImage;
        const safeDescHTML = desc.replace(/\n/g, '<br>');

        const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title} | Catálogo LM Passo</title>
            
            <!-- Open Graph / WhatsApp / Facebook -->
            <meta property="og:title" content="${title.replace(/"/g, '&quot;')}">
            <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">
            <meta property="og:image" content="${imageUrl}">
            <meta property="og:type" content="product">
            <meta property="og:url" content="${hostUrl}/c/${id}">
            
            <!-- Twitter Card -->
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:image" content="${imageUrl}">
            
            <style>
                body {
                    margin: 0; padding: 0;
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    background-color: #f1f5f9;
                    display: flex; flex-direction: column; align-items: center;
                    min-height: 100vh;
                    color: #1e293b;
                }
                .container {
                    background: #fff;
                    width: 100%;
                    max-width: 500px;
                    border-radius: 0 0 16px 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    overflow: hidden;
                    margin-bottom: 2rem;
                }
                .gallery {
                    display: flex;
                    overflow-x: auto;
                    scroll-snap-type: x mandatory;
                    background: #f8fafc;
                    scrollbar-width: none; /* Firefox */
                }
                .gallery::-webkit-scrollbar { display: none; /* Chrome */ }
                .gallery img {
                    width: 100%;
                    flex: 0 0 100%;
                    object-fit: contain;
                    max-height: 400px;
                    scroll-snap-align: center;
                    background: #000;
                }
                .info { padding: 1.5rem; }
                h1 { margin: 0 0 0.75rem 0; font-size: 1.4rem; font-weight: 700; color: #0f172a; }
                .description { margin: 0 0 1.5rem 0; font-size: 0.95rem; line-height: 1.6; color: #475569; }
                .btn {
                    display: block; width: 100%; padding: 1rem;
                    background: linear-gradient(135deg, #7c3aed, #6d28d9);
                    color: #fff; text-align: center; text-decoration: none;
                    font-weight: 600; font-size: 1.05rem;
                    border-radius: 10px; transition: transform 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
                }
                .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4); }
                .header { padding: 1rem; text-align: center; background: #fff; width: 100%; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4c1d95; letter-spacing: 1px; }
            </style>
        </head>
        <body>
            <div class="header">LM | PASSO</div>
            <div class="container">
                <div class="gallery">
                    ${images.map(img => `<img src="${img}" alt="${title.replace(/"/g, '&quot;')}">`).join('')}
                </div>
                <div class="info">
                    <h1>${title}</h1>
                    <div class="description">${safeDescHTML}</div>
                    <a href="https://wa.me/?text=Olá, tenho interesse neste produto: *${title}*%0A%0AVeja aqui: ${hostUrl}/c/${id}" class="btn" target="_blank">Tenho Interesse</a>
                </div>
            </div>
            <p style="text-align:center; color:#94a3b8; font-size:0.8rem; margin-top:-0.5rem; padding-bottom:2rem;">&copy; LM Passo - Gestão de Pedidos</p>
        </body>
        </html>
        `;
        res.send(html);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const os = require('os');
app.listen(PORT, '0.0.0.0', () => {
    const nets = os.networkInterfaces();
    let localIp = 'localhost';
    for (const iface of Object.values(nets)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                localIp = alias.address;
                break;
            }
        }
    }
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Acesso em rede:  http://${localIp}:${PORT}`);
});
