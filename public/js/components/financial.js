export const render = (user) => {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="view-header">
            <div class="view-title">Financeiro</div>
        </div>

        <!-- Summary Cards -->
        <div class="stock-cards" id="fin-cards" style="margin-bottom:1rem">
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#7c3aed20; color:#7c3aed">
                    <ion-icon name="receipt-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-total-orders">-</div>
                    <div class="stock-card-label">Total Transações</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#10b98120; color:#10b981">
                    <ion-icon name="cash-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-total-value">R$ 0</div>
                    <div class="stock-card-label">Valor Total</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#8b5cf620; color:#8b5cf6">
                    <ion-icon name="checkmark-done-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-launched">-</div>
                    <div class="stock-card-label">Lançados ao Core</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#f59e0b20; color:#f59e0b">
                    <ion-icon name="time-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-pending">-</div>
                    <div class="stock-card-label">Pendentes</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#f9731620; color:#f97316">
                    <ion-icon name="pricetag-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-total-discounts" style="color:#dc2626">R$ 0,00</div>
                    <div class="stock-card-label">Total Descontos</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#dc262620; color:#dc2626">
                    <ion-icon name="trending-down-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-material-costs" style="color:#dc2626">R$ 0</div>
                    <div class="stock-card-label">Custos Materiais</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#05966920; color:#059669">
                    <ion-icon name="analytics-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-resultado" style="color:#059669">R$ 0</div>
                    <div class="stock-card-label">Resultado</div>
                </div>
            </div>
            <div class="stock-card" style="border:2px solid #f59e0b; background:linear-gradient(135deg,#fffbeb,#fef3c7);">
                <div class="stock-card-icon" style="background:#f59e0b30; color:#d97706">
                    <ion-icon name="hourglass-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-a-receber" style="color:#d97706">R$ 0</div>
                    <div class="stock-card-label">&#128274; A Receber (Em Prod.)</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#7c3aed20; color:#7c3aed">
                    <ion-icon name="airplane-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="fin-dispatch-costs" style="color:#dc2626">R$ 0</div>
                    <div class="stock-card-label">Custos de Despacho</div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.75rem; background:white; border-radius:8px; border:1px solid var(--border);">
            <input type="text" id="filter-search" placeholder="🔍 Buscar produto, cliente..." style="flex:2; min-width:180px; padding:0.5rem 0.75rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
            <select id="filter-month" style="flex:1; min-width:130px; padding:0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
                <option value="">Todos os meses</option>
            </select>
            <input type="number" id="filter-min" placeholder="Valor mín" step="0.01" min="0" style="width:100px; padding:0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
            <input type="number" id="filter-max" placeholder="Valor máx" step="0.01" min="0" style="width:100px; padding:0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.9rem;">
            <button class="btn btn-secondary" id="btn-clear-filter" style="width:auto; padding:0.5rem 0.75rem; font-size:0.85rem;">Limpar</button>
        </div>

        <div id="fin-monthly-container"></div>
    `;

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    let allData = [];
    let allReserved = [];
    let allMaterialCosts = [];
    let allDispatchCosts = [];
    
    let globals = {
        totalGeral: 0,
        totalReserved: 0,
        totalMaterial: 0,
        totalDispatch: 0
    };

    const isAdmin = user && user.role === 'master';

    const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const applyFilters = () => {
        const search = removeAccents(container.querySelector('#filter-search').value.toLowerCase().trim());
        const monthFilter = container.querySelector('#filter-month').value;
        const minVal = parseFloat(container.querySelector('#filter-min').value) || 0;
        const maxVal = parseFloat(container.querySelector('#filter-max').value) || Infinity;

        const filteredSales = allData.filter(s => {
            if (search) {
                const haystack = removeAccents(`${s.client_name || ''} ${s.products_summary || ''} ${s.description || ''} ${s.payment_method || ''}`.toLowerCase());
                if (!haystack.includes(search)) return false;
            }
            if (monthFilter) {
                const d = new Date(s.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
                if (key !== monthFilter) return false;
            }
            const val = s.total_value || 0;
            if (val < minVal || val > maxVal) return false;

            return true;
        });

        // Aplicamos a renderização à visão unificada
        renderUnifiedData(filteredSales);
    };

    const renderUnifiedData = (sales) => {
        let launched = 0;
        let totalDescontos = 0;
        let totalGeralFiltered = 0;

        const months = {};

        const getOrCreateMonth = (dateStr) => {
            let d = new Date(dateStr);
            if (isNaN(d.valueOf())) d = new Date();
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
            if (!months[key]) {
                months[key] = {
                    key,
                    label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
                    year: d.getFullYear(),
                    month: d.getMonth(),
                    sales: [], salesTotal: 0, salesDiscount: 0,
                    reserved: [], reservedTotal: 0,
                    materials: [], materialsTotal: 0,
                    dispatch: [], dispatchTotal: 0
                };
            }
            return months[key];
        };

        sales.forEach(s => {
            const m = getOrCreateMonth(s.created_at);
            m.sales.push(s);
            m.salesTotal += (s.total_value || 0);
            m.salesDiscount += (s.discount_value || 0);
            totalGeralFiltered += (s.total_value || 0);
            totalDescontos += (s.discount_value || 0);
            if (s.launched_to_core) launched++;
        });

        allReserved.forEach(r => {
            const m = getOrCreateMonth(r.created_at);
            m.reserved.push(r);
            m.reservedTotal += (r.total_value || 0);
        });

        allMaterialCosts.forEach(c => {
            const m = getOrCreateMonth(c.created_at);
            m.materials.push(c);
            m.materialsTotal += (c.cost_amount || 0);
        });

        allDispatchCosts.forEach(d => {
            const m = getOrCreateMonth(d.created_at);
            m.dispatch.push(d);
            m.dispatchTotal += (d.amount || 0);
        });

        // Summary cards
        container.querySelector('#fin-total-orders').textContent = sales.length;
        container.querySelector('#fin-total-value').textContent = `R$ ${totalGeralFiltered.toFixed(2)}`;
        container.querySelector('#fin-launched').textContent = launched;
        container.querySelector('#fin-pending').textContent = sales.length - launched;
        
        const discountCardEl = container.querySelector('#fin-total-discounts');
        if (discountCardEl) discountCardEl.textContent = totalDescontos > 0 ? `- R$ ${totalDescontos.toFixed(2)}` : 'R$ 0,00';
        
        container.querySelector('#fin-material-costs').textContent = `R$ ${(globals.totalMaterial || 0).toFixed(2)}`;
        
        const resultado = totalGeralFiltered - (globals.totalMaterial || 0);
        const resEl = container.querySelector('#fin-resultado');
        resEl.textContent = `R$ ${resultado.toFixed(2)}`;
        resEl.style.color = resultado >= 0 ? '#059669' : '#dc2626';

        const aReceberEl = container.querySelector('#fin-a-receber');
        if (aReceberEl) aReceberEl.textContent = `R$ ${(globals.totalReserved || 0).toFixed(2)}`;

        const dispEl = container.querySelector('#fin-dispatch-costs');
        if (dispEl) dispEl.textContent = `R$ ${(globals.totalDispatch || 0).toFixed(2)}`;

        const sortedKeys = Object.keys(months).sort((a, b) => b.localeCompare(a));
        const monthlyContainer = container.querySelector('#fin-monthly-container');

        if (sortedKeys.length === 0) {
            monthlyContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:2rem;">Nenhum dado encontrado</p>';
        } else {
            monthlyContainer.innerHTML = sortedKeys.map(key => {
                const m = months[key];
                const now = new Date();
                const isCurrentMonth = m.year === now.getFullYear() && m.month === now.getMonth();

                // 1. Sales Rows
                const salesRows = m.sales.map(s => {
                    const isLaunched = s.launched_to_core ? true : false;
                    const badgeStyle = isLaunched
                        ? 'background:#d1fae5; color:#065f46; border:1px solid #6ee7b7;'
                        : 'background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1; cursor:pointer;';
                    const badgeText = isLaunched ? '✅ Lançado' : '⬜ Lançar';

                    return `
                    <tr style="${isLaunched ? '' : 'background:#fffbeb;'}">
                        <td>${new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
                        <td><b>${s.client_name || '-'}</b>${s.is_internal ? ' <span style="background:#dbeafe; color:#1d4ed8; padding:1px 6px; border-radius:10px; font-size:0.7rem; font-weight:600;">🏢 Interno</span>' : ''}</td>
                        <td>${s.client_phone || '-'}</td>
                        <td style="font-size:0.85rem">
                            ${s.products_summary || '-'}
                            ${s.products_summary ? `<button type="button" onclick="navigator.clipboard.writeText('LM | GRÁFICA - ${s.products_summary.replace(/'/g, "\\'")}')" title="Copiar para Financeiro" style="background:none; border:none; cursor:pointer; font-size:0.95rem; margin-left:4px; filter:grayscale(1) opacity(0.5); transition:all 0.2s;" onmouseover="this.style.filter='none'" onmouseout="this.style.filter='grayscale(1) opacity(0.5)'">📋</button>` : ''}
                        </td>
                        <td style="font-size:0.85rem; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${(s.description || '').replace(/"/g, '&quot;')}">${s.description || '-'}</td>
                        <td style="font-weight:bold; color:#7c3aed">R$ ${(s.total_value || 0).toFixed(2)}</td>
                        <td style="color:${(s.discount_value || 0) > 0 ? '#dc2626' : '#94a3b8'}; font-weight:${(s.discount_value || 0) > 0 ? '600' : 'normal'}">${(s.discount_value || 0) > 0 ? `- R$ ${(s.discount_value).toFixed(2)}` : '-'}</td>
                        <td>${s.payment_method || '-'}</td>
                        <td>
                            <button class="btn btn-sm launch-btn" data-id="${s.id}" data-launched="${isLaunched ? '1' : '0'}" style="${badgeStyle} padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600;">
                                ${badgeText}
                            </button>
                        </td>
                        ${isAdmin && s.is_internal ? `<td><button class="btn btn-sm btn-delete-internal" data-id="${s.id}" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600;">🗑️ Apagar</button></td>` : (isAdmin ? '<td></td>' : '')}
                    </tr>`;
                }).join('');

                const salesTable = m.sales.length > 0 ? `
                    <div style="margin-top:1rem; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                        <div style="background:#f1f5f9; padding:0.6rem 1rem; font-weight:600; color:#334155; display:flex; justify-content:space-between; align-items:center;">
                            <span>✅ Transações (Fechamento)</span>
                            <span style="color:#166534; font-size:1.05rem;">R$ ${m.salesTotal.toFixed(2)}</span>
                        </div>
                        <table class="data-table" style="margin:0; border-radius:0;">
                            <thead>
                                <tr>
                                    <th>Data</th><th>Cliente</th><th>Telefone</th><th>Produtos</th><th>Descrição</th>
                                    <th>Valor Pago</th><th>Desconto</th><th>Pagamento</th><th>Core</th>${isAdmin ? '<th>Ação</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>${salesRows}</tbody>
                        </table>
                    </div>
                ` : '';

                // 2. Reserved Rows
                const statusLabel = status => status === 'aguardando_aceite' ? '⏳ Aguardando' : '🔨 Produção';
                const reservedRows = m.reserved.map(s => `
                    <tr>
                        <td>${new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
                        <td><b>${s.client_name || '-'}</b></td>
                        <td style="font-size:0.85rem">${s.products_summary || '-'}</td>
                        <td style="font-weight:bold; color:#d97706">R$ ${(s.total_value || 0).toFixed(2)}</td>
                        <td>${s.payment_method || '-'}</td>
                        <td><span style="background:${s.status === 'aguardando_aceite' ? '#fef3c7' : '#dbeafe'}; color:${s.status === 'aguardando_aceite' ? '#92400e' : '#1e40af'}; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600;">${statusLabel(s.status)}</span></td>
                    </tr>`).join('');

                const reservedTable = m.reserved.length > 0 ? `
                    <div style="margin-top:1.5rem; border:1px solid #fef3c7; border-radius:8px; overflow:hidden;">
                        <div style="background:#fffbeb; padding:0.6rem 1rem; font-weight:600; color:#92400e; display:flex; justify-content:space-between; align-items:center;">
                            <span>⏳ Pedidos A Receber (Em Produção)</span>
                            <span style="color:#d97706; font-size:1.05rem;">R$ ${m.reservedTotal.toFixed(2)}</span>
                        </div>
                        <table class="data-table" style="margin:0; border-radius:0;">
                            <thead><tr><th>Data</th><th>Cliente</th><th>Produtos</th><th>Valor Reservado</th><th>Pagamento</th><th>Status</th></tr></thead>
                            <tbody>${reservedRows}</tbody>
                        </table>
                    </div>
                ` : '';

                // 3. Materials Rows
                const matRows = m.materials.map(c => `
                        <tr>
                            <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                            <td>
                                <b>${c.product_name || '-'}</b>
                                ${c.product_name ? `<button type="button" onclick="navigator.clipboard.writeText('LM | GRÁFICA - ${c.product_name.replace(/'/g, "\\'")}')" title="Copiar para Financeiro" style="background:none; border:none; cursor:pointer; font-size:0.95rem; margin-left:4px; filter:grayscale(1) opacity(0.5); transition:all 0.2s;" onmouseover="this.style.filter='none'" onmouseout="this.style.filter='grayscale(1) opacity(0.5)'">📋</button>` : ''}
                            </td>
                            <td>${c.product_type || '-'}</td>
                            <td style="font-size:0.85rem;">${c.description || '-'}</td>
                            <td style="text-align:center;">${c.quantity || 1}</td>
                            <td style="font-weight:bold; color:#dc2626;">R$ ${(c.cost_amount || 0).toFixed(2)}</td>
                            ${isAdmin ? `<td style="text-align:center;"><button class="btn-del-cost" data-id="${c.id}" title="Apagar" style="background:none; border:none; cursor:pointer; color:#dc2626; font-size:1.1rem; padding:2px 6px; border-radius:4px;">🗑️</button></td>` : ''}
                        </tr>`).join('');

                const matTable = m.materials.length > 0 ? `
                    <div style="margin-top:1.5rem; border:1px solid #fecaca; border-radius:8px; overflow:hidden;">
                        <div style="background:#fef2f2; padding:0.6rem 1rem; font-weight:600; color:#991b1b; display:flex; justify-content:space-between; align-items:center;">
                            <span>📦 Custos de Materiais (Despesas)</span>
                            <span style="color:#dc2626; font-size:1.05rem;">R$ ${m.materialsTotal.toFixed(2)}</span>
                        </div>
                        <table class="data-table" style="margin:0; border-radius:0;">
                            <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Descrição</th><th>Qtd</th><th>Custo</th>${isAdmin ? '<th style="width:40px"></th>' : ''}</tr></thead>
                            <tbody>${matRows}</tbody>
                        </table>
                    </div>
                ` : '';

                // 4. Dispatch Rows
                const dispRows = m.dispatch.map(d => `
                        <tr>
                            <td>${new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                            <td><b>${d.carrier || '-'}</b></td>
                            <td>${d.client_name || '-'}</td>
                            <td>Pedido #${d.order_id || '-'}</td>
                            <td style="font-weight:bold; color:#dc2626;">R$ ${(d.amount || 0).toFixed(2)}</td>
                            ${isAdmin ? `<td style="text-align:center; white-space:nowrap;">
                                <button class="btn-edit-dispatch" data-id="${d.id}" data-carrier="${(d.carrier||'').replace(/"/g,'&quot;')}" data-amount="${d.amount}" title="Editar" style="background:none;border:none;cursor:pointer;color:#7c3aed;font-size:1.1rem;padding:2px 5px;border-radius:4px;">✏️</button>
                                <button class="btn-del-dispatch" data-id="${d.id}" title="Apagar" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:1.1rem;padding:2px 5px;border-radius:4px;">🗑️</button>
                            </td>` : ''}
                        </tr>`).join('');

                const dispTable = m.dispatch.length > 0 ? `
                    <div style="margin-top:1.5rem; border:1px solid #e9d5ff; border-radius:8px; overflow:hidden;">
                        <div style="background:#faf5ff; padding:0.6rem 1rem; font-weight:600; color:#6b21a8; display:flex; justify-content:space-between; align-items:center;">
                            <span>🚚 Custos de Despacho</span>
                            <span style="color:#dc2626; font-size:1.05rem;">R$ ${m.dispatchTotal.toFixed(2)}</span>
                        </div>
                        <table class="data-table" style="margin:0; border-radius:0;">
                            <thead><tr><th>Data</th><th>Transportadora</th><th>Cliente</th><th>Pedido</th><th>Valor</th>${isAdmin ? '<th style="width:80px">Ações</th>' : ''}</tr></thead>
                            <tbody>${dispRows}</tbody>
                        </table>
                    </div>
                ` : '';

                return `
                <div style="margin-bottom:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; background:linear-gradient(135deg, #2e1065, #4c1d95); color:white; border-radius:8px; cursor:pointer; flex-wrap:wrap; gap:1rem;" onclick="const t = this.nextElementSibling; t.style.display = t.style.display === 'none' ? 'block' : 'none'">
                        
                        <div style="flex:1; min-width:200px;">
                            <h3 style="margin:0; font-size:1.2rem; font-weight:700;">📅 ${m.label}</h3>
                        </div>

                        <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
                            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; opacity:0.8;">A Receber</span>
                                <span style="font-size:1.05rem; font-weight:700; color:#fcd34d;">R$ ${m.reservedTotal.toFixed(2)}</span>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; opacity:0.8;">Despacho</span>
                                <span style="font-size:1.05rem; font-weight:700; color:#fca5a5;">R$ ${m.dispatchTotal.toFixed(2)}</span>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; opacity:0.8;">Despesas</span>
                                <span style="font-size:1.05rem; font-weight:700; color:#fca5a5;">R$ ${m.materialsTotal.toFixed(2)}</span>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; opacity:0.8;">Fechamento Base</span>
                                <span style="font-size:1.05rem; font-weight:700; color:#4ade80;">R$ ${m.salesTotal.toFixed(2)}</span>
                            </div>
                            
                            <div style="display:flex; flex-direction:column; align-items:flex-end; border-left:1px solid rgba(255,255,255,0.2); padding-left:1.5rem;">
                                <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Saldo em Caixa</span>
                                <span style="font-size:1.15rem; font-weight:800; color:${(m.salesTotal - m.dispatchTotal - m.materialsTotal) >= 0 ? '#86efac' : '#fca5a5'};">
                                    R$ ${(m.salesTotal - m.dispatchTotal - m.materialsTotal).toFixed(2)}
                                </span>
                            </div>
                        </div>

                    </div>
                    <div style="padding:0.5rem; display:${isCurrentMonth ? 'block' : 'none'};">
                        ${salesTable}
                        ${reservedTable}
                        ${dispTable}
                        ${matTable}
                        ${(!salesTable && !reservedTable && !dispTable && !matTable) ? '<p style="color:#94a3b8; text-align:center; padding:2rem;">Nenhum detalhe disponível</p>' : ''}
                    </div>
                </div>
                `;
            }).join('');
        }

        bindLaunchAndAdminButtons();
    };

    const bindLaunchAndAdminButtons = () => {
        // Bind launch buttons
        container.querySelectorAll('.launch-btn').forEach(btn => {
            btn.onclick = async () => {
                const isCurrentlyLaunched = btn.dataset.launched === '1';
                const newState = !isCurrentlyLaunched;
                await fetch(`/api/orders/${btn.dataset.id}/launch-core`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ launched: newState })
                });
                loadFinancial();
            };
        });

        // Bind delete buttons (internal orders - admin only)
        container.querySelectorAll('.btn-delete-internal').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('⚠️ Tem certeza que deseja APAGAR esta demanda de serviço interno?\nEsta ação também remove os lançamentos de custo de material.')) return;
                const res = await fetch(`/api/orders/${btn.dataset.id}`, { method: 'DELETE' });
                if (res.ok) {
                    loadFinancial();
                } else {
                    const json = await res.json().catch(() => ({}));
                    alert('Erro ao apagar: ' + (json.error || 'Falha desconhecida'));
                }
            };
        });

        if (isAdmin) {
             container.querySelectorAll('.btn-del-cost').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm('Apagar este lançamento de custo de material?')) return;
                    const res = await fetch(`/api/material-costs/${btn.dataset.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        loadFinancial();
                    } else {
                        const json = await res.json().catch(() => ({}));
                        alert('Erro: ' + (json.error || 'Falha ao apagar'));
                    }
                };
            });

            container.querySelectorAll('.btn-del-dispatch').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm('⚠️ Apagar este custo de despacho? Esta ação não pode ser desfeita.')) return;
                    const r = await fetch(`/api/dispatch-costs/${btn.dataset.id}`, { method: 'DELETE' });
                    if (r.ok) {
                        loadFinancial();
                    } else {
                        const j = await r.json().catch(() => ({}));
                        alert('Erro: ' + (j.error || 'Falha ao apagar'));
                    }
                };
            });

            container.querySelectorAll('.btn-edit-dispatch').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.dataset.id;
                    const currentCarrier = btn.dataset.carrier;
                    const currentAmount = parseFloat(btn.dataset.amount) || 0;

                    const old = document.getElementById('dispatch-edit-modal');
                    if (old) old.remove();

                    const modal = document.createElement('div');
                    modal.id = 'dispatch-edit-modal';
                    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
                    modal.innerHTML = \`
                        <div style="background:white;border-radius:12px;padding:2rem;min-width:320px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                            <h3 style="margin:0 0 1.25rem;color:#4c1d95;font-size:1.1rem;">✏️ Editar Custo de Despacho</h3>
                            <label style="display:block;margin-bottom:0.35rem;font-size:0.85rem;color:#475569;font-weight:600;">Transportadora</label>
                            <select id="edit-disp-carrier" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:1rem;font-size:0.95rem;">
                                <option value="UNIDA" \${currentCarrier==='UNIDA'?'selected':''}>UNIDA</option>
                                <option value="CORREIOS" \${currentCarrier==='CORREIOS'?'selected':''}>CORREIOS</option>
                            </select>
                            <label style="display:block;margin-bottom:0.35rem;font-size:0.85rem;color:#475569;font-weight:600;">Valor (R$)</label>
                            <input id="edit-disp-amount" type="number" step="0.01" min="0.01" value="\${currentAmount.toFixed(2)}"
                                style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:1.25rem;font-size:0.95rem;box-sizing:border-box;">
                            <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                                <button id="edit-disp-cancel" style="padding:0.5rem 1.25rem;border:1px solid #cbd5e1;background:white;border-radius:6px;cursor:pointer;font-size:0.9rem;">Cancelar</button>
                                <button id="edit-disp-save" style="padding:0.5rem 1.25rem;background:#7c3aed;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.9rem;font-weight:600;">Salvar</button>
                            </div>
                        </div>\`;
                    document.body.appendChild(modal);

                    modal.querySelector('#edit-disp-cancel').onclick = () => modal.remove();
                    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

                    modal.querySelector('#edit-disp-save').onclick = async () => {
                        const carrier = modal.querySelector('#edit-disp-carrier').value;
                        const amount = parseFloat(modal.querySelector('#edit-disp-amount').value);
                        if (!carrier || isNaN(amount) || amount <= 0) {
                            alert('Preencha todos os campos corretamente.');
                            return;
                        }
                        const saveBtn = modal.querySelector('#edit-disp-save');
                        saveBtn.disabled = true; saveBtn.textContent = 'Salvando...';
                        const r = await fetch(\`/api/dispatch-costs/\${id}\`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ carrier, amount })
                        });
                        if (r.ok) {
                            modal.remove();
                            loadFinancial();
                        } else {
                            const j = await r.json().catch(() => ({}));
                            alert('Erro: ' + (j.error || 'Falha ao salvar'));
                            saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
                        }
                    };
                };
            });
        }
    };

    const loadFinancial = async () => {
        try {
            const [salesRes, matRes, dispRes] = await Promise.all([
                fetch('/api/reports/sales'),
                fetch('/api/reports/material-costs'),
                fetch('/api/reports/dispatch-costs')
            ]);
            
            const [salesDataObj, matDataObj, dispDataObj] = await Promise.all([
                salesRes.json(),
                matRes.json(),
                dispRes.json()
            ]);

            allData = salesDataObj.data || [];
            allReserved = salesDataObj.reserved || [];
            allMaterialCosts = matDataObj.data || [];
            allDispatchCosts = dispDataObj.data || [];

            globals.totalReserved = salesDataObj.total_reservado || 0;
            globals.totalMaterial = matDataObj.total_cost || 0;
            globals.totalDispatch = dispDataObj.total || 0;

            // Populate month filter dropdown using ONLY allData dates (Sales)
            const monthSet = new Set();
            allData.forEach(s => {
                const d = new Date(s.created_at);
                const key = \`\${d.getFullYear()}-\${String(d.getMonth()).padStart(2, '0')}\`;
                monthSet.add(key);
            });
            const monthSelect = container.querySelector('#filter-month');
            const currentVal = monthSelect.value;
            monthSelect.innerHTML = '<option value="">Todos os meses</option>' +
                [...monthSet].sort((a, b) => b.localeCompare(a)).map(key => {
                    const [y, m] = key.split('-');
                    return \`<option value="\${key}" \${key === currentVal ? 'selected' : ''}>\${monthNames[parseInt(m)]} \${y}</option>\`;
                }).join('');

            applyFilters();
        } catch (e) {
            console.error('Erro ao carregar dados do financeiro reunificado:', e);
        }
    };

    // Filter event listeners
    container.querySelector('#filter-search').oninput = applyFilters;
    container.querySelector('#filter-month').onchange = applyFilters;
    container.querySelector('#filter-min').oninput = applyFilters;
    container.querySelector('#filter-max').oninput = applyFilters;
    container.querySelector('#btn-clear-filter').onclick = () => {
        container.querySelector('#filter-search').value = '';
        container.querySelector('#filter-month').value = '';
        container.querySelector('#filter-min').value = '';
        container.querySelector('#filter-max').value = '';
        applyFilters();
    };

    loadFinancial();
    return container;
};
