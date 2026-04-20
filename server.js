require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const db = require('./server/database/db');
const fs = require('fs');

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

process.on('unhandledRejection', (reason, promise) => {
    logError(reason);
    process.exit(1);
});

// Ensure DB directory exists (for Railway persistent volume at /data)
const dbDir = path.dirname(process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite'));
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

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
const diagRoutes = require('./server/routes/diag.routes');

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/diag', diagRoutes);

// Rota para o frontend (SPA Fallback)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    res.sendFile(path.join(diskPublic, 'index.html'));
});

// Helper para pegar o IP da rede local
function getNetworkIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// ── Inicialização com Restauração do Firebase ────────────────────────────────
const { restoreFromFirebase } = require('./server/utils/firebaseImport');

async function startServer() {
    try {
        console.log('🚀 Iniciando sistema...');
        
        // 1. Garante que o banco de dados tem dados (Restaura do Firebase se for um servidor temporário recém-ligado)
        await restoreFromFirebase();

        // 2. Inicia o servidor Express
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n======================================================`);
            console.log(`✅ Servidor em execução em http://localhost:${PORT}`);
            console.log(`🌐 Acesso na rede: http://${getNetworkIP()}:${PORT}`);
            console.log(`======================================================\n`);
        });

        // ── Auto-Backup Firebase em Tempo Real (Sync Queue) ──────────────────────
        try {
            const { startWorker } = require('./server/utils/firebaseSync');
            startWorker();
        } catch (err) {
            console.error('Falha ao iniciar o worker do Firebase:', err.message);
        }

    } catch (err) {
        logError(err);
        process.exit(1);
    }
}

startServer();
