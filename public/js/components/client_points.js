export const render = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const clientId = user.client_id;
    const container = document.createElement('div');

    container.innerHTML = `
        <style>
            .points-container { animation: fadeIn 0.4s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            
            .premium-card {
                background: white; border-radius: 20px; border: 1px solid rgba(255,255,255,0.8);
                padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;
            }
            .premium-card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.08); }
            
            .premium-card.dark {
                background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border: none;
            }
            .premium-card.dark::after {
                content: ''; position: absolute; top: -50%; right: -50%; width: 200%; height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
                opacity: 0.5; pointer-events: none;
            }
            
            .rule-row {
                display: flex; align-items: flex-start; gap: 1.25rem; padding: 1.5rem;
                border-radius: 16px; transition: all 0.2s;
            }
            .rule-row:hover { transform: scale(1.01); box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
        </style>
        <div class="points-container">
        <!-- Header -->
        <div style="margin-bottom:2rem;">
            <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
                <div id="cp-header-icon" style="width:52px; height:52px; background:linear-gradient(135deg,#b45309,#f59e0b); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow:0 6px 20px rgba(180,83,9,0.35); flex-shrink:0;">⭐</div>
                <div style="flex:1;">
                    <h2 style="font-size:1.75rem; font-weight:900; background:linear-gradient(135deg,#92400e,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin:0; letter-spacing:-0.03em;">Minha Pontuação (Últimos 90 dias)</h2>
                    <p style="color:#64748b; margin:0; font-size:0.9rem; font-weight:500;">Acompanhe seu progresso e suba de nível para obter mais descontos e benefícios.</p>
                </div>
            </div>
        </div>

        <div id="points-loading" style="padding: 2rem; text-align: center; color: #64748b;">Carregando sua pontuação...</div>
        
        <div id="points-content" style="display:none;">
            <!-- Points Card -->
            <div style="display:flex; gap:1.25rem; flex-wrap:wrap; margin-bottom:2.5rem;">
                <div class="premium-card dark" style="flex:1; min-width:200px; display:flex; flex-direction:column; justify-content:center;">
                    <div style="font-size:0.95rem; font-weight:800; color:#94a3b8; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Nível Atual</div>
                    <div id="cp-tier-name" style="font-size:2.8rem; font-weight:900; letter-spacing:-0.03em; line-height:1; background:linear-gradient(to right, #fcd34d, #f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">BRONZE</div>
                    <div id="cp-tier-desc" style="font-size:0.95rem; color:#cbd5e1; margin-top:0.75rem; line-height:1.4;">5% de desconto em todos os serviços.</div>
                </div>

                <div class="premium-card" style="flex:1; min-width:200px; display:flex; flex-direction:column; justify-content:center;">
                    <div style="font-size:0.9rem; font-weight:800; color:#64748b; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Valor Gasto (90d)</div>
                    <div id="cp-spent" style="font-size:2.8rem; font-weight:900; color:#b45309; letter-spacing:-0.03em; line-height:1;">R$ 0,00</div>
                    <div id="cp-spent-prog" style="margin-top:1rem;">
                        <div style="width:100%; height:10px; background:#f1f5f9; border-radius:5px; overflow:hidden; box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);">
                            <div id="cp-spent-bar" style="height:100%; background:linear-gradient(to right, #f59e0b, #d97706); width:0%; transition:width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);"></div>
                        </div>
                        <div id="cp-spent-meta" style="font-size:0.8rem; color:#64748b; margin-top:0.5rem; font-weight:700;">Faltam R$ 500,00 para o próximo nível</div>
                    </div>
                </div>

                <div class="premium-card" style="flex:1; min-width:200px; display:flex; flex-direction:column; justify-content:center;">
                    <div style="font-size:0.9rem; font-weight:800; color:#64748b; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">Pedidos (90d)</div>
                    <div id="cp-orders" style="font-size:2.8rem; font-weight:900; color:#b45309; letter-spacing:-0.03em; line-height:1;">0</div>
                    <div id="cp-orders-prog" style="margin-top:1rem;">
                        <div style="width:100%; height:10px; background:#f1f5f9; border-radius:5px; overflow:hidden; box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);">
                            <div id="cp-orders-bar" style="height:100%; background:linear-gradient(to right, #3b82f6, #2563eb); width:0%; transition:width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);"></div>
                        </div>
                        <div id="cp-orders-meta" style="font-size:0.8rem; color:#64748b; margin-top:0.5rem; font-weight:700;">Faltam 20 pedidos para o próximo nível</div>
                    </div>
                </div>
            </div>

            <!-- Como Funciona -->
            <div style="background:white; border-radius:24px; padding:2.5rem; box-shadow:0 10px 40px rgba(180,83,9,0.05); border:1px solid rgba(245,158,11,0.2);">
                <h3 style="margin:0 0 2rem 0; font-size:1.3rem; font-weight:900; color:#92400e; display:flex; align-items:center; gap:0.5rem;"><span style="font-size:1.8rem;">🏆</span> Regras e Benefícios de Níveis</h3>
                <div style="display:flex; flex-direction:column; gap:1.25rem;">
                    <div class="rule-row" style="background:linear-gradient(to right, rgba(255,247,237,0.5), transparent); border:1px solid #ffedd5;">
                        <div style="font-size:2.5rem; flex-shrink:0; filter:drop-shadow(0 4px 4px rgba(0,0,0,0.1));">🥉</div>
                        <div>
                            <div style="font-weight:900; color:#92400e; font-size:1.2rem; margin-bottom:0.25rem;">Bronze (Padrão)</div>
                            <div style="font-size:1rem; color:#b45309; font-weight:700; margin-bottom:0.25rem;">Benefícios: 5% de desconto.</div>
                            <div style="font-size:0.9rem; color:#78350f;">Todos os clientes fidelidade começam neste nível e já garantem economia.</div>
                        </div>
                    </div>

                    <div class="rule-row" style="background:linear-gradient(to right, rgba(248,250,252,0.5), transparent); border:1px solid #e2e8f0;">
                        <div style="font-size:2.5rem; flex-shrink:0; filter:drop-shadow(0 4px 4px rgba(0,0,0,0.1));">🥈</div>
                        <div>
                            <div style="font-weight:900; color:#334155; font-size:1.2rem; margin-bottom:0.25rem;">Prata</div>
                            <div style="font-size:1rem; color:#475569; font-weight:700; margin-bottom:0.25rem;">Requisitos: R$ 500 em compras OU 20 pedidos em 90 dias.</div>
                            <div style="font-size:0.9rem; color:#64748b;">Benefícios: 10% de desconto fixo e prazo de produção reduzido para 1 dia.</div>
                        </div>
                    </div>

                    <div class="rule-row" style="background:linear-gradient(135deg, rgba(255,251,235,0.8), rgba(254,243,199,0.5)); border:1px solid #fcd34d; box-shadow:0 8px 20px rgba(245, 158, 11, 0.15);">
                        <div style="font-size:2.5rem; flex-shrink:0; filter:drop-shadow(0 4px 4px rgba(0,0,0,0.15));">🏆</div>
                        <div>
                            <div style="font-weight:900; color:#b45309; font-size:1.2rem; margin-bottom:0.25rem;">VIP Ouro</div>
                            <div style="font-size:1rem; color:#d97706; font-weight:700; margin-bottom:0.25rem;">Requisitos: R$ 1.000 em compras OU 40 pedidos em 90 dias.</div>
                            <div style="font-size:0.9rem; color:#92400e;">Benefícios: 15% de desconto fixo e PRIORIDADE MÁXIMA na produção!</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div> <!-- end points-container -->
    `;

    const loadData = async () => {
        if (!clientId) {
            container.querySelector('#points-loading').innerHTML = '<span style="color:#ef4444;">Erro: Cliente não identificado.</span>';
            return;
        }

        try {
            const res = await fetch('/api/clients');
            const { data } = await res.json();
            const clientsData = data || [];
            const myClient = clientsData.find(c => c.id == clientId);

            if (!myClient) throw new Error('Cliente não encontrado.');

            const spent = parseFloat(myClient.L90_spent || 0);
            const orders = parseInt(myClient.L90_orders || 0, 10);
            const tier = myClient.loyalty_tier || 'bronze';

            // Tier UI
            const tName = container.querySelector('#cp-tier-name');
            const tDesc = container.querySelector('#cp-tier-desc');
            const hIcon = container.querySelector('#cp-header-icon');
            
            if (tier === 'ouro') {
                tName.innerHTML = 'VIP OURO 🏆';
                tDesc.innerHTML = '15% de desconto e Prioridade Máxima.';
                hIcon.innerHTML = '🏆';
                hIcon.style.background = 'linear-gradient(135deg, #f59e0b, #b45309)';
                hIcon.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
            } else if (tier === 'prata') {
                tName.innerHTML = 'PRATA 🥈';
                tName.style.background = 'linear-gradient(to right, #94a3b8, #64748b)';
                tDesc.innerHTML = '10% de desconto e Prazo de 1 Dia.';
                hIcon.innerHTML = '🥈';
                hIcon.style.background = 'linear-gradient(135deg, #94a3b8, #64748b)';
                hIcon.style.boxShadow = '0 6px 20px rgba(148, 163, 184, 0.4)';
            } else {
                tName.innerHTML = 'BRONZE 🥉';
                tName.style.background = 'linear-gradient(to right, #b45309, #92400e)';
                tDesc.innerHTML = '5% de desconto em todos os serviços.';
                hIcon.innerHTML = '🥉';
                hIcon.style.background = 'linear-gradient(135deg, #fff7ed, #fde68a)';
                hIcon.style.border = '1px solid #fcd34d';
                hIcon.style.boxShadow = 'none';
            }

            // Progress logic
            let nextSpentTarget = tier === 'bronze' ? 500 : (tier === 'prata' ? 1000 : 1000);
            let nextOrdersTarget = tier === 'bronze' ? 20 : (tier === 'prata' ? 40 : 40);

            let spentPct = Math.min(100, (spent / nextSpentTarget) * 100);
            let ordersPct = Math.min(100, (orders / nextOrdersTarget) * 100);

            if (tier === 'ouro') {
                spentPct = 100;
                ordersPct = 100;
            }

            container.querySelector('#cp-spent').textContent = `R$ ${spent.toFixed(2).replace('.', ',')}`;
            container.querySelector('#cp-orders').textContent = orders;

            setTimeout(() => {
                container.querySelector('#cp-spent-bar').style.width = `${spentPct}%`;
                container.querySelector('#cp-orders-bar').style.width = `${ordersPct}%`;
            }, 100);

            if (tier === 'ouro') {
                container.querySelector('#cp-spent-meta').textContent = 'Nível Máximo Alcançado!';
                container.querySelector('#cp-spent-meta').style.color = '#10b981';
                container.querySelector('#cp-orders-meta').textContent = 'Nível Máximo Alcançado!';
                container.querySelector('#cp-orders-meta').style.color = '#10b981';
            } else {
                let diffS = Math.max(0, nextSpentTarget - spent);
                let diffO = Math.max(0, nextOrdersTarget - orders);
                container.querySelector('#cp-spent-meta').textContent = `Faltam R$ ${diffS.toFixed(2).replace('.', ',')} para o próximo nível.`;
                container.querySelector('#cp-orders-meta').textContent = `Faltam ${diffO} pedidos para o próximo nível.`;
            }

            container.querySelector('#points-loading').style.display = 'none';
            container.querySelector('#points-content').style.display = 'block';

        } catch (e) {
            console.error(e);
            container.querySelector('#points-loading').innerHTML = '<span style="color:#ef4444;">Erro ao carregar os dados de pontuação.</span>';
        }
    };

    loadData();
    return container;
};
