const express = require('express');
const cors = require('cors');
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
app.use(cors());
app.use(express.json());
// Serve internal assets — prefer disk (allows live updates), fall back to embedded snapshot
const diskPublic = path.join(process.cwd(), 'public');
if (fs.existsSync(diskPublic)) {
    app.use(express.static(diskPublic));           // ← uses real files from disk
} else {
    app.use(express.static(path.join(__dirname, 'public'))); // ← fallback: embedded
}
// Serve external uploads (user files) always from disk
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Health check (Railway / Render)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
const authRoutes = require('./server/routes/auth.routes');
const apiRoutes = require('./server/routes/api.routes');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Basic Route

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
