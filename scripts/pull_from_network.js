/**
 * pull_from_network.js — Puxa dados do servidor Railway para o banco local
 * Uso: node scripts/pull_from_network.js
 *
 * Após rodar, execute: node scripts/restore_local.js
 * (ou use o PUXAR_DADOS_REDE.bat que faz tudo automaticamente)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const RAILWAY_URL = 'https://lm-passo-production.up.railway.app';
const EXPORT_SECRET = 'lmpasso-migrate-2026';
const OUT_PATH = path.resolve(process.cwd(), 'scripts', 'db_export.json');

console.log('\n🌐 Conectando ao servidor Railway...');
console.log('   URL:', RAILWAY_URL + '/api/export-data');
console.log('');

const url = new URL(`/api/export-data?secret=${EXPORT_SECRET}`, RAILWAY_URL);

const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
    },
};

const req = https.request(options, (res) => {
    if (res.statusCode !== 200) {
        console.error(`❌ Servidor retornou status ${res.statusCode}`);
        if (res.statusCode === 403) {
            console.error('   Verifique se o secret está correto.');
        }
        process.exit(1);
    }

    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        let parsed;
        try {
            parsed = JSON.parse(body);
        } catch (e) {
            console.error('❌ Resposta inválida do servidor (não é JSON válido):');
            console.error(body.substring(0, 500));
            process.exit(1);
        }

        if (!parsed.success || !parsed.data) {
            console.error('❌ Erro na exportação:', parsed.error || 'resposta inesperada');
            process.exit(1);
        }

        const data = parsed.data;

        // Resumo do que foi puxado
        console.log('📦 Dados recebidos:');
        let totalRecords = 0;
        for (const [table, rows] of Object.entries(data)) {
            if (rows.length > 0) {
                console.log(`   ✓ ${table}: ${rows.length} registros`);
                totalRecords += rows.length;
            }
        }
        console.log(`\n   Total: ${totalRecords} registros em ${Object.keys(data).length} tabelas`);

        // Salvar db_export.json
        fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`\n✅ Salvo em: ${OUT_PATH}`);
        console.log('   Próximo passo: node scripts/restore_local.js\n');
    });
});

req.on('error', (e) => {
    console.error('❌ Erro de conexão:', e.message);
    console.error('   Verifique se o servidor Railway está online.');
    process.exit(1);
});

req.setTimeout(30000, () => {
    console.error('❌ Timeout: servidor não respondeu em 30 segundos.');
    req.destroy();
    process.exit(1);
});

req.end();
