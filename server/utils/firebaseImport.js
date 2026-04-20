const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { getServiceAccount } = require('./firebaseAuth');

const DB_PATH = path.resolve(process.cwd(), 'database.sqlite');

/**
 * Função para importar as tabelas.
 * Retorna uma Promise.
 */
async function restoreFromFirebase() {
    return new Promise(async (resolve, reject) => {
        try {
            // Verifica se o banco existe e se possui dados na tabela clients (se tiver > 0, assume que tá intacto)
            if (fs.existsSync(DB_PATH)) {
                const checkDb = new sqlite3.Database(DB_PATH);
                const hasData = await new Promise((res) => {
                    checkDb.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='clients'", (err, row) => {
                        if (!row || row.count === 0) return res(false);
                        checkDb.get("SELECT COUNT(*) as count FROM clients", (err, row) => {
                            res(row && row.count > 0);
                        });
                    });
                });
                checkDb.close();

                if (hasData) {
                    console.log('✅ Banco de dados intacto (com dados). Pulando auto-restauração.');
                    return resolve(true);
                }
            }

            const serviceAccount = getServiceAccount();

            if (!serviceAccount) {
                console.log('⚠️ Credenciais do Firebase não encontradas. Ignorando auto-restauração.');
                return resolve(false);
            }

            console.log('\n======================================================');
            console.log('🔥 INICIANDO AUTO-RESTAURAÇÃO DO FIREBASE (Disco Vazio)');
            console.log('======================================================\n');

            if (!admin.apps.length) {
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            }
            const firestoreDb = admin.firestore();

            // Precisamos que o arquivo SQLite e a estrutura existam antes de inserir os dados.
            // O db.js principal faz isso via initDb(). Vamos assumir que initDb() já rodou no server.js
            const localDb = new sqlite3.Database(DB_PATH);

            const collections = {
                users:           ['id','username','password','role','name','client_id','plain_password'],
                clients:         ['id','name','phone','origin','created_at','core_discount','address','city','zip_code','cpf','state'],
                products:        ['id','name','type','production_time','price','stock','price_1_day','price_3_days','min_stock','terceirizado','cost_value','unit_cost'],
                orders:          ['id','client_id','product_id','description','total_value','payment_method','created_by','created_at','status','deadline_type','deadline_at','production_notes','rejection_reason','pickup_photo','checklist','group_id','quantity','products_summary','stock_used','loss_justification','moved_by','moved_at','launched_to_core','file_path','attachments','event_name','stock_reserved','payment_code','is_internal','is_terceirizado','discount_value'],
                order_items:     ['id','order_id','product_id','quantity','price','product_snapshot_name','color_variant_id','color_name'],
                catalogue_items: ['id','title','description','image_url','created_at'],
                suppliers:       ['id','name','phone','website','description','created_at'],
                dispatch_costs:  ['id','order_id','carrier','amount','created_at','launched_to_core'],
                team_chat:       ['id','user_id','user_name','user_role','message','created_at','is_edited','edited_at','reply_to_id','reply_to_author','reply_to_msg','attachment_url']
            };

            for (const [table, columns] of Object.entries(collections)) {
                console.log(`  ⬇️  Baixando ${table}...`);
                const snap = await firestoreDb.collection(table).get();
                if (snap.empty) {
                    console.log(`  ⚠️  ${table}: sem dados`);
                    continue;
                }
                const rows = snap.docs.map(doc => doc.data());
                
                await new Promise((resolveTable, rejectTable) => {
                    const placeholders = columns.map(() => '?').join(', ');
                    const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
                    let completed = 0;
                    
                    localDb.serialize(() => {
                        localDb.run('BEGIN TRANSACTION');
                        const stmt = localDb.prepare(sql);
                        
                        rows.forEach(row => {
                            const values = columns.map(c => {
                                const v = row[c];
                                return (v === '' || v === undefined) ? null : v;
                            });
                            stmt.run(values, (err) => {
                                completed++;
                                if (err) console.error('Erro na inserção de', table, err.message);
                                if (completed === rows.length) {
                                    stmt.finalize();
                                    localDb.run('COMMIT', resolveTable);
                                }
                            });
                        });
                    });
                });
                console.log(`  ✅ ${table}: ${rows.length} registros restaurados`);
            }

            localDb.close();
            console.log('\n======================================================');
            console.log('✅ AUTO-RESTAURAÇÃO CONCLUÍDA!');
            console.log('======================================================\n');
            resolve(true);

        } catch (error) {
            console.error('\n❌ Falha Crítica na Auto-restauração:', error);
            resolve(false); // Resolvemos com false em vez de reject para não travar o servidor se estiver sem internet
        }
    });
}

module.exports = { restoreFromFirebase };
