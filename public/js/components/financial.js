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

        <!-- Material Costs Section -->
        <div id="fin-costs-container" style="margin-top:2rem;"></div>


    `;

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    let allData = [];
    const isAdmin = user && user.role === 'master';

    const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const applyFilters = () => {
        const search = removeAccents(container.querySelector('#filter-search').value.toLowerCase().trim());
        const monthFilter = container.querySelector('#filter-month').value;
        const minVal = parseFloat(container.querySelector('#filter-min').value) || 0;
        const maxVal = parseFloat(container.querySelector('#filter-max').value) || Infinity;

        const filtered = allData.filter(s => {
            // Text search
            if (search) {
                const haystack = removeAccents(`${s.client_name || ''} ${s.products_summary || ''} ${s.description || ''} ${s.payment_method || ''}`.toLowerCase());
                if (!haystack.includes(search)) return false;
            }
            // Month filter
            if (monthFilter) {
                const d = new Date(s.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
                if (key !== monthFilter) return false;
            }
            // Value range
            const val = s.total_value || 0;
            if (val < minVal || val > maxVal) return false;

            return true;
        });

        renderData(filtered);
    };

    const renderData = (data) => {
        let totalGeral = 0;
        let launched = 0;

        const months = {};
        data.forEach(s => {
            const d = new Date(s.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
            if (!months[key]) {
                months[key] = {
                    label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
                    year: d.getFullYear(),
                    month: d.getMonth(),
                    items: [],
                    total: 0
                };
            }
            months[key].items.push(s);
            months[key].total += (s.total_value || 0);
            totalGeral += (s.total_value || 0);
            if (s.launched_to_core) launched++;
        });

        const sortedKeys = Object.keys(months).sort((a, b) => b.localeCompare(a));
        const monthlyContainer = container.querySelector('#fin-monthly-container');

        if (sortedKeys.length === 0) {
            monthlyContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:2rem;">Nenhuma transação encontrada</p>';
        } else {
            monthlyContainer.innerHTML = sortedKeys.map(key => {
                const m = months[key];
                const rows = m.items.map(s => {
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
                        <td style="font-size:0.85rem">${s.products_summary || '-'}</td>
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

                return `
                <div style="margin-bottom:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:linear-gradient(135deg, #2e1065, #4c1d95); color:white; border-radius:8px 8px 0 0;">
                        <h3 style="margin:0; font-size:1.1rem;">📅 ${m.label}</h3>
                        <span style="font-size:0.9rem; opacity:0.9;">${m.items.length} transações</span>
                    </div>
                    <table class="data-table" style="border-radius:0 0 8px 8px; margin-top:0;">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Telefone</th>
                                <th>Produtos</th>
                                <th>Descrição</th>
                                <th>Valor Pago</th>
                                <th>Desconto</th>
                                <th>Pagamento</th>
                                <th>Core</th>
                                ${isAdmin ? '<th>Ação</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                        ${(() => {
                        // Payment method breakdown
                        const byMethod = {};
                        m.items.forEach(s => {
                            const pm = s.payment_method || 'Outros';
                            if (!byMethod[pm]) byMethod[pm] = { count: 0, total: 0 };
                            byMethod[pm].count++;
                            byMethod[pm].total += (s.total_value || 0);
                        });
                        const methodKeys = Object.keys(byMethod).sort();
                        const methodRows = methodKeys.map(pm => `
                            <tr style="background:#f8f9fa;">
                                <td colspan="6" style="text-align:right; font-size:0.9rem; color:#475569; padding:6px 12px;">
                                    💳 <b>${pm}</b> <span style="color:#94a3b8">(${byMethod[pm].count} pedido${byMethod[pm].count > 1 ? 's' : ''})</span>
                                </td>
                                <td style="font-weight:bold; color:#7c3aed; font-size:0.95rem;">R$ ${byMethod[pm].total.toFixed(2)}</td>
                                <td colspan="${isAdmin ? 3 : 2}"></td>
                            </tr>
                        `).join('');

                        const now = new Date();
                        const isCurrentMonth = m.year === now.getFullYear() && m.month === now.getMonth();
                        const closingLabel = isCurrentMonth ? '📊 Parcial' : '📊 Fechamento';

                        return `<tfoot>
                            <tr><td colspan="${isAdmin ? 10 : 9}" style="padding:0"><hr style="border:none; border-top:2px dashed #e0d4f5; margin:0;"></td></tr>
                            ${methodRows}
                            <tr style="background:linear-gradient(135deg, #f0fdf4, #dcfce7); font-weight:bold;">
                                <td colspan="6" style="text-align:right; font-size:1.05rem; color:#166534; padding:10px 12px;">${closingLabel} ${m.label}:</td>
                                <td style="font-size:1.15rem; color:#166534;">R$ ${m.total.toFixed(2)}</td>
                                <td colspan="${isAdmin ? 3 : 2}"></td>
                            </tr>
                        </tfoot>`;
                    })()}
                    </table>
                </div>`;
            }).join('');
        }

        // Summary cards
        container.querySelector('#fin-total-orders').textContent = data.length;
        container.querySelector('#fin-total-value').textContent = `R$ ${totalGeral.toFixed(2)}`;
        container.querySelector('#fin-launched').textContent = launched;
        container.querySelector('#fin-pending').textContent = data.length - launched;

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

    };

    // Load and render material costs
    const loadMaterialCosts = async () => {
        try {
            const res = await fetch('/api/reports/material-costs');
            const { data, total_cost } = await res.json();

            // Update cards
            container.querySelector('#fin-material-costs').textContent = `R$ ${(total_cost || 0).toFixed(2)}`;

            // Calculate resultado
            const totalRevenue = allData.reduce((sum, s) => sum + (s.total_value || 0), 0);
            const resultado = totalRevenue - (total_cost || 0);
            const resEl = container.querySelector('#fin-resultado');
            resEl.textContent = `R$ ${resultado.toFixed(2)}`;
            resEl.style.color = resultado >= 0 ? '#059669' : '#dc2626';

            // Render costs section
            const costsContainer = container.querySelector('#fin-costs-container');
            if (!data || data.length === 0) {
                costsContainer.innerHTML = '';
                return;
            }

            // Group costs by month
            const costsByMonth = {};
            data.forEach(c => {
                const d = new Date(c.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
                if (!costsByMonth[key]) {
                    costsByMonth[key] = {
                        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
                        items: [],
                        total: 0
                    };
                }
                costsByMonth[key].items.push(c);
                costsByMonth[key].total += (c.cost_amount || 0);
            });

            const sortedKeys = Object.keys(costsByMonth).sort((a, b) => b.localeCompare(a));

            costsContainer.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3 style="margin:0; font-size:1.15rem; color:#1e293b;">💰 Custos de Materiais (Pedidos Internos)</h3>
                    <span style="font-size:0.9rem; color:#dc2626; font-weight:700;">Total: R$ ${(total_cost || 0).toFixed(2)}</span>
                </div>
                ${sortedKeys.map(key => {
                const m = costsByMonth[key];
                const rows = m.items.map(c => `
                        <tr>
                            <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                            <td><b>${c.product_name || '-'}</b></td>
                            <td>${c.product_type || '-'}</td>
                            <td style="font-size:0.85rem;">${c.description || '-'}</td>
                            <td style="text-align:center;">${c.quantity || 1}</td>
                            <td style="font-weight:bold; color:#dc2626;">R$ ${(c.cost_amount || 0).toFixed(2)}</td>
                            ${isAdmin ? `<td style="text-align:center;"><button class="btn-del-cost" data-id="${c.id}" title="Apagar este lançamento" style="background:none; border:none; cursor:pointer; color:#dc2626; font-size:1.1rem; padding:2px 6px; border-radius:4px; transition:background 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='none'">🗑️</button></td>` : ''}
                        </tr>
                    `).join('');

                return `
                    <div style="margin-bottom:1.5rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 1rem; background:linear-gradient(135deg, #7f1d1d, #991b1b); color:white; border-radius:8px 8px 0 0;">
                            <h4 style="margin:0; font-size:1rem;">📅 ${m.label}</h4>
                            <span style="font-size:0.85rem; opacity:0.9;">${m.items.length} lançamento${m.items.length > 1 ? 's' : ''}</span>
                        </div>
                        <table class="data-table" style="border-radius:0 0 8px 8px; margin-top:0;">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Qtd</th>
                                    <th>Custo</th>
                                    ${isAdmin ? '<th style="width:40px"></th>' : ''}
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                            <tfoot>
                                <tr style="background:#fef2f2; font-weight:bold;">
                                    <td colspan="${isAdmin ? 6 : 5}" style="text-align:right; color:#991b1b; padding:8px 12px;">Total ${m.label}:</td>
                                    <td style="color:#dc2626; font-size:1.05rem;">R$ ${m.total.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>`;
            }).join('')}
            `;

            // Bind delete cost buttons (admin only)
            if (isAdmin) {
                costsContainer.querySelectorAll('.btn-del-cost').forEach(btn => {
                    btn.onclick = async () => {
                        if (!confirm('Apagar este lançamento de custo de material?')) return;
                        const res = await fetch(`/api/material-costs/${btn.dataset.id}`, { method: 'DELETE' });
                        if (res.ok) {
                            loadMaterialCosts();
                        } else {
                            const json = await res.json().catch(() => ({}));
                            alert('Erro: ' + (json.error || 'Falha ao apagar'));
                        }
                    };
                });
            }
        } catch (e) {
            console.error('Error loading material costs:', e);
        }
    };

    const loadFinancial = async () => {
        try {
            const res = await fetch('/api/reports/sales');
            const { data } = await res.json();
            allData = data || [];

            // Populate month filter dropdown
            const monthSet = new Set();
            allData.forEach(s => {
                const d = new Date(s.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
                monthSet.add(key);
            });
            const monthSelect = container.querySelector('#filter-month');
            const currentVal = monthSelect.value;
            monthSelect.innerHTML = '<option value="">Todos os meses</option>' +
                [...monthSet].sort((a, b) => b.localeCompare(a)).map(key => {
                    const [y, m] = key.split('-');
                    return `<option value="${key}" ${key === currentVal ? 'selected' : ''}>${monthNames[parseInt(m)]} ${y}</option>`;
                }).join('');

            applyFilters();
            // Also load material costs
            loadMaterialCosts();
        } catch (e) {
            console.error('Erro ao carregar financeiro:', e);
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
