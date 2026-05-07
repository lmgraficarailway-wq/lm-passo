require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const os = require('os');
const fs = require('fs');

const db = require('./server/database/db');

// Error Logging Function
const logError = (err) => {
    const msg = err && err.message ? err.message : String(err);
    const stack = err && err.stack ? err.stack : 'Sem stack trace';
    console.error('\n❌ CRITICAL ERROR:', msg);
    if (err && err.stack) console.error(stack);
    try {
        const errorLogPath = path.join(process.cwd(), 'error_log.txt');
        const errorMessage = `[${new Date().toISOString()}] ERROR: ${msg}\nSTACK: ${stack}\n\n`;
        fs.appendFileSync(errorLogPath, errorMessage);
    } catch(e) {}
};

// Global Error Handlers
process.on('uncaughtException', (err) => {
    logError(err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logError(reason);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações Globais
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(compression());

// Servir arquivos estáticos (Frontend)
const diskPublic = path.join(process.cwd(), 'public');
app.use(express.static(diskPublic));

// ── Rotas da API ─────────────────────────────────────────────────────────────
const apiRoutes = require('./server/routes/api.routes');
const authRoutes = require('./server/routes/auth.routes');

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Rota de saúde para o monitor de reinício
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Rota para o frontend (SPA Fallback)
app.get(/^(.*)$/, (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    res.sendFile(path.join(diskPublic, 'index.html'));
});

// Helper para pegar o IP da rede local
function getNetworkIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// ── Inicialização do Servidor ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    const localIp = getNetworkIP();
    console.log(`\n======================================================`);
    console.log(`✅ LM PASSO rodando em http://localhost:${PORT}`);
    console.log(`🌐 Rede local:       http://${localIp}:${PORT}`);
    console.log(`======================================================\n`);
    console.log('💡 Para acesso externo via ngrok: ngrok http ' + PORT);
    console.log('');
});

// ── Firebase Sync Worker (opcional - roda em background) ─────────────────────
try {
    const { startWorker } = require('./server/utils/firebaseSync');
    startWorker();
    console.log('🔥 Firebase Sync ativo (backup em tempo real)');
} catch (err) {
    console.log('ℹ️  Firebase Sync desativado (sem credenciais configuradas)');
}

// ── Keep-Alive: evita o "sleep" do Render free tier ──────────────────────────
// O Render dorme após 15 min sem tráfego. Este ping interno a cada 10 min
// mantém o servidor acordado 24h, eliminando o cold start de 1-2 minutos.
if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://lm-passo.onrender.com';
    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos

    const keepAlive = () => {
        const url = `${RENDER_URL}/api/health`;
        https.get(url, (res) => {
            console.log(`[Keep-Alive] Ping OK - ${new Date().toLocaleTimeString('pt-BR')} - Status: ${res.statusCode}`);
        }).on('error', (err) => {
            console.log(`[Keep-Alive] Ping falhou: ${err.message}`);
        });
    };

    // Aguarda 1 minuto após inicializar antes de começar os pings
    setTimeout(() => {
        keepAlive();
        setInterval(keepAlive, PING_INTERVAL);
        console.log('⏰ Keep-Alive ativado — ping a cada 10 min para manter o servidor acordado');
    }, 60 * 1000);
}
