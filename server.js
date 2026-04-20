require('dotenv').config();
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
// Also forces correct Content-Type for lesser-known image formats like .jfif
app.use('/uploads', (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    // .jfif is a JPEG variant — must be served as image/jpeg or some browsers refuse it
    if (ext === '.jfif' || ext === '.jpe') {
        res.setHeader('Content-Type', 'image/jpeg');
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Accept-Ranges', 'none');
    next();
}, express.static(path.join(process.cwd(), 'public', 'uploads'), { acceptRanges: false, etag: false }));

// Health check (Railway / Render)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Public URL detection ────────────────────────────────────────────────────
// Returns the best public URL for catalogue links:
// 1. If ngrok is running locally, returns the ngrok https URL
// 2. Otherwise returns the request host (may be Railway/render domain)
app.get('/api/public-url', async (req, res) => {
    // First check: try ngrok local API
    try {
        const http = require('http');
        const ngrokData = await new Promise((resolve, reject) => {
            const req2 = http.get('http://127.0.0.1:4040/api/tunnels', (r) => {
                let data = '';
                r.on('data', chunk => data += chunk);
                r.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch { reject(new Error('parse fail')); }
                });
            });
            req2.on('error', reject);
            req2.setTimeout(1500, () => { req2.destroy(); reject(new Error('timeout')); });
        });
        const tunnels = ngrokData.tunnels || [];
        const httpsTunnel = tunnels.find(t => t.proto === 'https' && t.public_url);
        if (httpsTunnel) {
            return res.json({ url: httpsTunnel.public_url, source: 'ngrok' });
        }
    } catch (_) { /* ngrok not running */ }

    // Second check: use the request host (works for Railway/Render/public servers)
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const publicUrl = `${proto}://${host}`;
    res.json({ url: publicUrl, source: 'host' });
});

// Routes
const authRoutes = require('./server/routes/auth.routes');
const apiRoutes = require('./server/routes/api.routes');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// ── Menu Orders (Cardápios) — registered directly to guarantee availability ──
// This ensures the routes work even if the bundled api.routes.js is outdated.
try {
    const menuOrdersController = require('./server/controllers/menu_orders_controller');
    app.get('/api/menu-orders', menuOrdersController.getAll);
    app.post('/api/menu-orders', menuOrdersController.create);
    app.put('/api/menu-orders/:id', menuOrdersController.update);
    app.put('/api/menu-orders/:id/launch-core', menuOrdersController.launchToCore);
    app.delete('/api/menu-orders/:id', menuOrdersController.remove);
} catch (e) {
    // Routes already registered via api.routes.js — no action needed
}

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

        // Build image wrappers with zoom data attribute
        const imgWrappersHtml = images.map((img, gi) => {
            const absImg = img.startsWith('http') ? img : hostUrl + img;
            return `
            <div class="zoom-wrapper" data-src="${absImg}" data-idx="${gi}">
                <img src="${img}" alt="${title.replace(/"/g, '&quot;')}" class="gallery-img">
                <button class="expand-btn" data-idx="${gi}" title="Ampliar imagem" aria-label="Ampliar imagem">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
            </div>`;
        }).join('');

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
                * { box-sizing: border-box; }
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
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    overflow: hidden;
                    margin-bottom: 2rem;
                }

                /* ── Gallery ── */
                .gallery {
                    display: flex;
                    overflow-x: auto;
                    scroll-snap-type: x mandatory;
                    background: #0f172a;
                    scrollbar-width: none;
                }
                .gallery::-webkit-scrollbar { display: none; }

                /* ── Zoom Wrapper ── */
                .zoom-wrapper {
                    position: relative;
                    flex: 0 0 100%;
                    scroll-snap-align: center;
                    overflow: hidden;
                    cursor: pointer;
                    user-select: none;
                }
                .gallery-img {
                    width: 100%;
                    display: block;
                    object-fit: contain;
                    max-height: 420px;
                    background: #0f172a;
                    transition: opacity 0.15s;
                    pointer-events: none;
                }

                /* ── Expand button ── */
                .expand-btn {
                    position: absolute;
                    bottom: 10px; right: 10px;
                    background: rgba(0,0,0,0.55);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: #fff; border-radius: 10px;
                    width: 38px; height: 38px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s;
                    z-index: 5;
                }
                .expand-btn:hover { background: rgba(124,58,237,0.75); transform: scale(1.12); }
                .expand-btn svg  { pointer-events: none; }

                /* ═══════════════════════════════════
                   LIGHTBOX FULLSCREEN
                ═══════════════════════════════════ */
                #lightbox {
                    display: none;
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.96);
                    backdrop-filter: blur(20px);
                    z-index: 9999;
                    flex-direction: column;
                    align-items: center; justify-content: center;
                    animation: lbFadeIn 0.25s ease;
                }
                #lightbox.active { display: flex; }
                @keyframes lbFadeIn { from { opacity:0; } to { opacity:1; } }
                .lb-topbar {
                    position: absolute; top:0; left:0; right:0;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 14px 16px;
                    background: linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%);
                    z-index: 2;
                }
                .lb-counter { color:rgba(255,255,255,0.7); font-size:0.85rem; font-weight:600; letter-spacing:0.04em; }
                .lb-close {
                    background: rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
                    color:#fff; border-radius:10px; width:40px; height:40px;
                    display:flex; align-items:center; justify-content:center;
                    cursor:pointer; transition:background 0.2s, transform 0.2s; font-size:1.1rem;
                }
                .lb-close:hover { background:rgba(255,255,255,0.25); transform:rotate(90deg) scale(1.1); }
                .lb-img-area {
                    width:100%; height:100%;
                    display:flex; align-items:center; justify-content:center;
                    overflow:hidden; position:relative; touch-action:none;
                }
                #lb-img {
                    max-width:92%; max-height:82vh;
                    object-fit:contain; border-radius:4px;
                    transition: opacity 0.15s;
                    transform-origin:center center;
                    user-select:none; pointer-events:none; will-change:transform;
                }
                #lb-img.sliding { opacity:0; }
                .lb-arrow {
                    position:absolute; top:50%; transform:translateY(-50%);
                    background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);
                    color:#fff; width:44px; height:44px; border-radius:50%;
                    display:flex; align-items:center; justify-content:center;
                    cursor:pointer; transition:background 0.2s, transform 0.2s;
                    z-index:3; font-size:1.5rem; backdrop-filter:blur(6px);
                }
                .lb-arrow:hover { background:rgba(124,58,237,0.6); transform:translateY(-50%) scale(1.1); }
                .lb-arrow.left  { left:12px; }
                .lb-arrow.right { right:12px; }
                .lb-arrow.hidden { display:none; }
                .lb-dots {
                    position:absolute; bottom:22px; left:0; right:0;
                    display:flex; justify-content:center; gap:7px; z-index:2;
                }
                .lb-dot {
                    width:7px; height:7px; border-radius:50%;
                    background:rgba(255,255,255,0.3); cursor:pointer;
                    transition:background 0.2s, transform 0.2s;
                }
                .lb-dot.active { background:#a78bfa; transform:scale(1.4); }
                .lb-zoom-badge {
                    position:absolute; bottom:58px; left:50%; transform:translateX(-50%);
                    background:rgba(0,0,0,0.6); color:rgba(255,255,255,0.85);
                    font-size:0.75rem; font-weight:700; padding:4px 12px; border-radius:20px;
                    pointer-events:none; opacity:0; transition:opacity 0.3s;
                    z-index:3; letter-spacing:0.05em;
                }
                .lb-zoom-badge.visible { opacity:1; }
                .lb-reset-zoom {
                    position:absolute; bottom:58px; right:16px;
                    background:rgba(124,58,237,0.7); border:none; color:#fff;
                    font-size:0.75rem; font-weight:700; padding:6px 14px; border-radius:20px;
                    cursor:pointer; display:none; z-index:3; backdrop-filter:blur(6px);
                }
                .lb-reset-zoom.visible { display:block; }

                /* ── Dot indicator (scroll hint) ── */
                .dots {
                    display: flex;
                    justify-content: center;
                    gap: 6px;
                    padding: 0.6rem 0 0.3rem;
                    background: #0f172a;
                }
                .dot {
                    width: 7px; height: 7px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.3);
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s;
                }
                .dot.active { background: #a78bfa; transform: scale(1.3); }

                /* ── Info ── */
                .info { padding: 1.5rem; }
                h1 { margin: 0 0 0.75rem 0; font-size: 1.35rem; font-weight: 800; color: #0f172a; }
                .description { margin: 0 0 1.5rem 0; font-size: 0.95rem; line-height: 1.7; color: #475569; }
                .btn {
                    display: block; width: 100%; padding: 1rem;
                    background: linear-gradient(135deg, #7c3aed, #6d28d9);
                    color: #fff; text-align: center; text-decoration: none;
                    font-weight: 700; font-size: 1.05rem;
                    border-radius: 10px; transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
                }
                .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124, 58, 237, 0.5); }
                .header {
                    padding: 0.9rem 1rem; text-align: center; background: #fff;
                    width: 100%; border-bottom: 1px solid #e2e8f0;
                    font-weight: 800; color: #4c1d95; letter-spacing: 2px; font-size: 1rem;
                }
                .zoom-hint {
                    text-align: center;
                    font-size: 0.72rem;
                    color: rgba(255,255,255,0.4);
                    padding: 0.2rem 0 0.5rem;
                    background: #0f172a;
                    letter-spacing: 0.04em;
                }
            </style>
        </head>
        <body>
            <div class="header">LM | GRÁFICA</div>
            <div class="container">
                <div class="gallery" id="gallery">
                    ${imgWrappersHtml}
                </div>
                ${images.length > 1 ? `
                <div class="dots" id="dots">
                    ${images.map((_, i) => `<div class="dot${i === 0 ? ' active' : ''}" data-idx="${i}"></div>`).join('')}
                </div>` : ''}
                <div class="zoom-hint">🔲 Clique na imagem para ampliar em tela cheia</div>
                <div class="info">
                    <h1>${title}</h1>
                    <div class="description">${safeDescHTML}</div>
                    <a href="https://wa.me/?text=Olá, tenho interesse neste produto: *${title}*%0A%0AVeja aqui: ${hostUrl}/c/${id}" class="btn" target="_blank">💬 Tenho Interesse</a>
                </div>
            </div>
            <p style="text-align:center; color:#94a3b8; font-size:0.8rem; margin-top:-0.5rem; padding-bottom:2rem;">&copy; LM Passo - Gestão de Pedidos</p>

            <!-- ══ LIGHTBOX ══ -->
            <div id="lightbox" role="dialog" aria-modal="true" aria-label="Visualização ampliada">
                <div class="lb-topbar">
                    <span class="lb-counter" id="lb-counter">1 / ${images.length}</span>
                    <button class="lb-close" id="lb-close" aria-label="Fechar">✕</button>
                </div>
                <div class="lb-img-area" id="lb-img-area">
                    <button class="lb-arrow left" id="lb-prev" aria-label="Anterior">&#8249;</button>
                    <img id="lb-img" src="" alt="Imagem ampliada">
                    <button class="lb-arrow right" id="lb-next" aria-label="Próxima">&#8250;</button>
                </div>
                <div class="lb-dots">${images.map((_,i)=>`<div class="lb-dot${i===0?' active':''}" data-idx="${i}"></div>`).join('')}</div>
                <div class="lb-zoom-badge" id="lb-zoom-badge">100%</div>
                <button class="lb-reset-zoom" id="lb-reset-zoom">↺ Redefinir zoom</button>
            </div>

            <script>
            (function() {
                var IMAGES = ${JSON.stringify(images.map(img => img.startsWith('http') ? img : hostUrl + img))};

                // ── Gallery dots ──
                var gallery = document.getElementById('gallery');
                var dots = document.querySelectorAll('.dot');
                if (gallery && dots.length) {
                    gallery.addEventListener('scroll', function(){
                        var idx = Math.round(gallery.scrollLeft / gallery.offsetWidth);
                        dots.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
                    });
                    dots.forEach(function(dot){
                        dot.addEventListener('click', function(){
                            gallery.scrollTo({ left: parseInt(dot.dataset.idx)*gallery.offsetWidth, behavior:'smooth' });
                        });
                    });
                }

                // ══════════════════════════════════════
                // LIGHTBOX
                // ══════════════════════════════════════
                var lb = document.getElementById('lightbox');
                var lbImg = document.getElementById('lb-img');
                var lbCounter = document.getElementById('lb-counter');
                var lbClose = document.getElementById('lb-close');
                var lbPrev = document.getElementById('lb-prev');
                var lbNext = document.getElementById('lb-next');
                var lbImgArea = document.getElementById('lb-img-area');
                var lbDots = document.querySelectorAll('.lb-dot');
                var lbZoomBadge = document.getElementById('lb-zoom-badge');
                var lbResetZoom = document.getElementById('lb-reset-zoom');

                var cur=0, sc=1, tx=0, ty=0;
                var MIN_SC=1, MAX_SC=5;

                function applyT() { lbImg.style.transform = 'translate('+tx+'px,'+ty+'px) scale('+sc+')'; }
                function updateZUI() {
                    lbZoomBadge.textContent = Math.round(sc*100)+'%';
                    if (sc>1.01) {
                        lbZoomBadge.classList.add('visible'); lbResetZoom.classList.add('visible');
                        clearTimeout(lbZoomBadge._t);
                        lbZoomBadge._t = setTimeout(function(){ lbZoomBadge.classList.remove('visible'); }, 1500);
                    } else { lbZoomBadge.classList.remove('visible'); lbResetZoom.classList.remove('visible'); }
                }
                function resetZoom() { sc=1; tx=0; ty=0; applyT(); updateZUI(); }

                function updateState() {
                    lbCounter.textContent = (cur+1)+' / '+IMAGES.length;
                    lbPrev.classList.toggle('hidden', IMAGES.length<=1||cur===0);
                    lbNext.classList.toggle('hidden', IMAGES.length<=1||cur===IMAGES.length-1);
                    lbDots.forEach(function(d,i){ d.classList.toggle('active', i===cur); });
                }

                function open(idx) {
                    cur=idx; lbImg.src=IMAGES[cur]; updateState(); resetZoom();
                    lb.classList.add('active'); document.body.style.overflow='hidden';
                }
                function close() { lb.classList.remove('active'); document.body.style.overflow=''; resetZoom(); }
                function goTo(idx) {
                    if (idx<0||idx>=IMAGES.length) return;
                    resetZoom(); lbImg.classList.add('sliding');
                    setTimeout(function(){ cur=idx; lbImg.src=IMAGES[cur]; updateState(); lbImg.classList.remove('sliding'); }, 140);
                }

                // Open triggers
                document.querySelectorAll('.expand-btn').forEach(function(btn){
                    btn.addEventListener('click', function(e){ e.stopPropagation(); open(parseInt(btn.dataset.idx)); });
                });
                document.querySelectorAll('.zoom-wrapper').forEach(function(w){
                    w.addEventListener('click', function(e){
                        // only open if not clicking the expand-btn itself
                        if (!e.target.closest('.expand-btn')) open(parseInt(w.dataset.idx));
                    });
                });

                lbClose.addEventListener('click', close);
                lb.addEventListener('click', function(e){ if(e.target===lb||e.target===lbImgArea||e.target===document.getElementById('lb-img').parentNode) close(); });
                lbPrev.addEventListener('click', function(e){ e.stopPropagation(); goTo(cur-1); });
                lbNext.addEventListener('click', function(e){ e.stopPropagation(); goTo(cur+1); });
                lbDots.forEach(function(d){ d.addEventListener('click', function(e){ e.stopPropagation(); goTo(parseInt(d.dataset.idx)); }); });
                lbResetZoom.addEventListener('click', function(e){ e.stopPropagation(); resetZoom(); });

                document.addEventListener('keydown', function(e){
                    if (!lb.classList.contains('active')) return;
                    if (e.key==='Escape') close();
                    if (e.key==='ArrowLeft')  goTo(cur-1);
                    if (e.key==='ArrowRight') goTo(cur+1);
                });

                // Wheel zoom
                lbImgArea.addEventListener('wheel', function(e){
                    e.preventDefault();
                    sc = Math.max(MIN_SC, Math.min(MAX_SC, sc+(e.deltaY>0?-0.25:0.25)));
                    if(sc===MIN_SC){tx=0;ty=0;} applyT(); updateZUI();
                }, { passive:false });

                // Mouse drag (pan when zoomed)
                var drag=false, dsx,dsy,dtx,dty;
                lbImgArea.addEventListener('mousedown', function(e){
                    if(sc<=1) return; drag=true; dsx=e.clientX; dsy=e.clientY; dtx=tx; dty=ty; lbImg.style.cursor='grabbing';
                });
                window.addEventListener('mousemove', function(e){
                    if(!drag) return; tx=dtx+(e.clientX-dsx); ty=dty+(e.clientY-dsy); applyT();
                });
                window.addEventListener('mouseup', function(){ drag=false; lbImg.style.cursor=''; });

                // Touch gestures
                var tsx=0,tsy=0, pinchD=0, pinchSc=1, pinching=false, lastTap=0;
                function dist(t){ var dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY; return Math.sqrt(dx*dx+dy*dy); }

                lbImgArea.addEventListener('touchstart', function(e){
                    if(e.touches.length===2){ pinching=true; pinchD=dist(e.touches); pinchSc=sc; }
                    else { pinching=false; tsx=e.touches[0].clientX; tsy=e.touches[0].clientY; }
                }, { passive:true });

                lbImgArea.addEventListener('touchmove', function(e){
                    e.preventDefault();
                    if(e.touches.length===2&&pinching){
                        sc=Math.max(MIN_SC,Math.min(MAX_SC,pinchSc*(dist(e.touches)/pinchD)));
                        if(sc===MIN_SC){tx=0;ty=0;} applyT(); updateZUI();
                    }
                }, { passive:false });

                lbImgArea.addEventListener('touchend', function(e){
                    if(pinching){ pinching=false; return; }
                    // double-tap zoom
                    var now=Date.now();
                    if(now-lastTap<300){ if(sc>1) resetZoom(); else{ sc=2.5; applyT(); updateZUI(); } }
                    lastTap=now;
                    // swipe
                    if(sc>1) return;
                    var dx=e.changedTouches[0].clientX-tsx, dy=e.changedTouches[0].clientY-tsy;
                    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50){ if(dx<0) goTo(cur+1); else goTo(cur-1); }
                }, { passive:true });

            })();
            </script>
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
const { restoreFromFirebase } = require('./server/utils/firebaseImport');

async function startServer() {
    // 1. Garante que o banco de dados tem dados (Restaura do Firebase se for um servidor temporário recém-ligado)
    await restoreFromFirebase();

    // 2. Só depois de confirmar os dados, liberamos as portas para acesso
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

        // ── Auto-Backup Firebase em Tempo Real (Sync Queue) ──────────────────────
        try {
            const { startWorker } = require('./server/utils/firebaseSync');
            startWorker();
        } catch (err) {
            console.error('Falha ao iniciar o worker do Firebase:', err.message);
        }

        // Salva antes de fechar o servidor pela janela do terminal (X ou Ctrl+C)
        process.on('SIGINT', () => {
            console.log('\n[Sistema] Encerrando servidor...');
            process.exit(0);
        });
        // ───────────────────────────────────────────────────────────────────────────
    });
}

startServer();

