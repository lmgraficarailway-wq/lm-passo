/**
 * db.js — Ponto de entrada do banco de dados
 *
 * LOCAL  (USE_SQLITE=true no .env): usa SQLite — funciona sem internet e sem cota
 * RENDER (FIREBASE_CREDENTIALS set): usa Firestore — modo 24h online
 */

const useLocal = process.env.USE_SQLITE === 'true';

if (useLocal) {
    console.log('🗄️  Modo LOCAL: usando SQLite (database.sqlite)');
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.resolve(process.cwd(), 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    module.exports = db;
} else {
    module.exports = require('./firestore');
}
