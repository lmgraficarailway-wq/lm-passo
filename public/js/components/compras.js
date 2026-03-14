export const render = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.createElement('div');

    container.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem">
            <div class="view-title">Solicitações de Compra</div>
            <button class="btn btn-primary" id="new-purchase-btn" style="width:auto; display:flex; align-items:center; gap:0.4rem">
                <ion-icon name="add-circle-outline"></ion-icon> Nova Solicitação
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="stock-cards" id="purchase-cards">
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#f59e0b20; color:#f59e0b">
                    <ion-icon name="time-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="card-pendente">-</div>
                    <div class="stock-card-label">Pendentes</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#10b98120; color:#10b981">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="card-recebida">-</div>
                    <div class="stock-card-label">Recebidas</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#ef444420; color:#ef4444">
                    <ion-icon name="close-circle-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="card-cancelada">-</div>
                    <div class="stock-card-label">Canceladas</div>
                </div>
            </div>
            <div class="stock-card">
                <div class="stock-card-icon" style="background:#3b82f620; color:#3b82f6">
                    <ion-icon name="cart-outline"></ion-icon>
                </div>
                <div class="stock-card-info">
                    <div class="stock-card-value" id="card-total-purchase">-</div>
                    <div class="stock-card-label">Total</div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div style="display:flex; gap:0.75rem; margin-bottom:1rem; flex-wrap:wrap; align-items:center">
            <select id="filter-status" style="padding:0.45rem 0.75rem; border:1px solid var(--border); border-radius:8px; background:var(--card-bg); color:var(--text); font-size:0.9rem">
                <option value="">Todos os status</option>
                <option value="pendente">🟡 Pendente</option>
                <option value="recebida">🟢 Recebida</option>
                <option value="cancelada">🔴 Cancelada</option>
            </select>
        </div>

        <!-- Table -->
        <div style="overflow-x:auto">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Produto</th>
                        <th>Fornecedor</th>
                        <th>Qtd</th>
                        <th>Custo Unit.</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Solicitante</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="purchases-list">
                    <tr><td colspan="10" style="text-align:center">Carregando...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- ===================== MODAL: Nova Solicitação ===================== -->
        <div class="modal-overlay" id="new-purchase-modal">
            <div class="modal" style="max-width:520px">
                <div class="modal-header">
                    <h3>Nova Solicitação de Compra</h3>
                    <button class="modal-close" id="new-purchase-close">&times;</button>
                </div>
                <form id="new-purchase-form">
                    <div class="form-group">
                        <label>Produto *</label>
                        <select id="np-product" required>
                            <option value="">Selecione o produto...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Fornecedor</label>
                        <select id="np-supplier">
                            <option value="">— Sem fornecedor —</option>
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem">
                        <div class="form-group">
                            <label>Quantidade *</label>
                            <input type="number" id="np-quantity" min="1" value="1" required>
                        </div>
                        <div class="form-group">
                            <label>Custo Unitário (R$)</label>
                            <input type="number" id="np-unit-cost" min="0" step="0.01" value="0" placeholder="0,00">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Observações</label>
                        <textarea id="np-notes" rows="2" placeholder="Ex: Urgente, cor específica, link do produto..."></textarea>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem">
                        <button type="button" class="btn btn-secondary" id="new-purchase-cancel">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="width:auto">Criar Solicitação</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ===================== MODAL: Confirmar Recebimento ===================== -->
        <div class="modal-overlay" id="receive-modal">
            <div class="modal" style="max-width:480px">
                <div class="modal-header">
                    <h3>Confirmar Recebimento</h3>
                    <button class="modal-close" id="receive-close">&times;</button>
                </div>
                <div id="receive-details" style="margin-bottom:1.25rem; padding:1rem; background:var(--hover-bg, #f8fafc); border-radius:10px; border:1px solid var(--border)">
                </div>
                <p style="font-size:0.9rem; color:#64748b; margin-bottom:1rem">
                    Ao confirmar, o estoque do produto será atualizado automaticamente e uma movimentação <b>entrada_compra</b> será registrada.
                </p>
                <input type="hidden" id="receive-purchase-id">
                <div style="display:flex; justify-content:flex-end; gap:0.5rem">
                    <button type="button" class="btn btn-secondary" id="receive-cancel-btn">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="receive-confirm-btn" style="width:auto; background:#10b981; border-color:#10b981">
                        <ion-icon name="checkmark-outline"></ion-icon> Confirmar Recebimento
                    </button>
                </div>
            </div>
        </div>

        <!-- ===================== MODAL: Detalhes ===================== -->
        <div class="modal-overlay" id="details-modal">
            <div class="modal" style="max-width:480px">
                <div class="modal-header">
                    <h3>Detalhes da Solicitação</h3>
                    <button class="modal-close" id="details-close">&times;</button>
                </div>
                <div id="details-content"></div>
            </div>
        </div>
    `;

    // ── State ──────────────────────────────────────────────────────────────────
    let allPurchases = [];

    // ── Helpers ────────────────────────────────────────────────────────────────
    const statusBadge = (s) => {
        if (s === 'pendente') return '<span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:20px;font-size:0.78rem;font-weight:600">🟡 Pendente</span>';
        if (s === 'recebida') return '<span style="background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:20px;font-size:0.78rem;font-weight:600">🟢 Recebida</span>';
        return '<span style="background:#fee2e2;color:#991b1b;padding:2px 10px;border-radius:20px;font-size:0.78rem;font-weight:600">🔴 Cancelada</span>';
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
    const fmtCurrency = (v) => v != null ? `R$ ${parseFloat(v).toFixed(2).replace('.', ',')}` : '-';

    // ── Load Data ──────────────────────────────────────────────────────────────
    const loadPurchases = async () => {
        try {
            const res = await fetch('/api/purchases');
            const { data } = await res.json();
            allPurchases = data;
            renderTable(data);
            renderCards(data);
        } catch (e) {
            console.error('Erro ao carregar compras:', e);
        }
    };

    const renderCards = (data) => {
        container.querySelector('#card-pendente').textContent = data.filter(r => r.status === 'pendente').length;
        container.querySelector('#card-recebida').textContent = data.filter(r => r.status === 'recebida').length;
        container.querySelector('#card-cancelada').textContent = data.filter(r => r.status === 'cancelada').length;
        container.querySelector('#card-total-purchase').textContent = data.length;
    };

    const renderTable = (data) => {
        const tbody = container.querySelector('#purchases-list');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#64748b">Nenhuma solicitação encontrada</td></tr>';
            return;
        }

        const isMaster = user?.role === 'master';
        tbody.innerHTML = data.map(pr => {
            const total = (pr.unit_cost || 0) * (pr.quantity || 0);
            const deleteBtn = isMaster
                ? `<button class="btn btn-secondary btn-sm delete-purchase-btn" data-id="${pr.id}" title="Excluir" style="font-size:0.75rem;color:#ef4444;margin-left:0.25rem"><ion-icon name="trash-outline"></ion-icon></button>`
                : '';
            const actions = pr.status === 'pendente'
                ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center">
                        <button class="btn btn-primary btn-sm receive-btn" data-id="${pr.id}" style="background:#10b981;border-color:#10b981;font-size:0.75rem">Receber</button>
                        <button class="btn btn-secondary btn-sm cancel-btn" data-id="${pr.id}" style="font-size:0.75rem;color:#ef4444">Cancelar</button>
                        ${deleteBtn}
                   </div>`
                : `<div style="display:flex;gap:0.4rem;align-items:center">
                        <button class="btn btn-secondary btn-sm details-btn" data-id="${pr.id}" style="font-size:0.75rem">Detalhes</button>
                        ${deleteBtn}
                   </div>`;

            return `
                <tr>
                    <td style="color:#94a3b8;font-size:0.8rem">#${pr.id}</td>
                    <td><b>${pr.product_name || '-'}</b><br><span style="font-size:0.75rem;color:#64748b">${pr.product_type || ''}</span></td>
                    <td>${pr.supplier_name || '<span style="color:#94a3b8">—</span>'}</td>
                    <td style="text-align:center;font-weight:600">${pr.quantity}</td>
                    <td>${pr.unit_cost > 0 ? fmtCurrency(pr.unit_cost) : '<span style="color:#94a3b8">—</span>'}</td>
                    <td>${total > 0 ? fmtCurrency(total) : '<span style="color:#94a3b8">—</span>'}</td>
                    <td>${statusBadge(pr.status)}</td>
                    <td>${pr.requested_by_name || '-'}</td>
                    <td style="font-size:0.8rem">${fmtDate(pr.created_at)}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');

        // Bind action buttons
        tbody.querySelectorAll('.receive-btn').forEach(btn => {
            btn.onclick = () => openReceiveModal(btn.dataset.id);
        });
        tbody.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.onclick = () => doCancelPurchase(btn.dataset.id);
        });
        tbody.querySelectorAll('.details-btn').forEach(btn => {
            btn.onclick = () => openDetailsModal(btn.dataset.id);
        });
        tbody.querySelectorAll('.delete-purchase-btn').forEach(btn => {
            btn.onclick = () => doDeletePurchase(btn.dataset.id);
        });
    };

    // ── Filter ─────────────────────────────────────────────────────────────────
    container.querySelector('#filter-status').onchange = (e) => {
        const val = e.target.value;
        renderTable(val ? allPurchases.filter(p => p.status === val) : allPurchases);
    };

    // ── Load selects ───────────────────────────────────────────────────────────
    const loadSelects = async () => {
        try {
            const [prodRes, suppRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/suppliers')
            ]);
            const { data: products } = await prodRes.json();
            const { data: suppliers } = await suppRes.json();

            const prodSelect = container.querySelector('#np-product');
            products.filter(p => !p.terceirizado).forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name}${p.type ? ' — ' + p.type : ''}`;
                prodSelect.appendChild(opt);
            });

            const suppSelect = container.querySelector('#np-supplier');
            suppliers.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                suppSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Erro ao carregar selects:', e);
        }
    };

    // ── New Purchase Modal ─────────────────────────────────────────────────────
    const newModal = container.querySelector('#new-purchase-modal');
    const newForm = container.querySelector('#new-purchase-form');

    container.querySelector('#new-purchase-btn').onclick = () => {
        newForm.reset();
        newModal.classList.add('open');
    };
    container.querySelector('#new-purchase-close').onclick = () => newModal.classList.remove('open');
    container.querySelector('#new-purchase-cancel').onclick = () => newModal.classList.remove('open');

    newForm.onsubmit = async (e) => {
        e.preventDefault();
        const product_id = container.querySelector('#np-product').value;
        const supplier_id = container.querySelector('#np-supplier').value || null;
        const quantity = parseInt(container.querySelector('#np-quantity').value);
        const unit_cost = parseFloat(container.querySelector('#np-unit-cost').value) || 0;
        const notes = container.querySelector('#np-notes').value;

        if (!product_id || quantity < 1) {
            alert('Selecione o produto e informe uma quantidade válida.');
            return;
        }

        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id, supplier_id, quantity, unit_cost, notes, requested_by: user.id })
            });
            const result = await res.json();
            if (!res.ok) { alert(result.error || 'Erro ao criar solicitação'); return; }
            newModal.classList.remove('open');
            loadPurchases();
        } catch (err) {
            alert('Erro de conexão');
        }
    };

    // ── Receive Modal ──────────────────────────────────────────────────────────
    const receiveModal = container.querySelector('#receive-modal');
    container.querySelector('#receive-close').onclick = () => receiveModal.classList.remove('open');
    container.querySelector('#receive-cancel-btn').onclick = () => receiveModal.classList.remove('open');

    const openReceiveModal = (id) => {
        const pr = allPurchases.find(p => p.id == id);
        if (!pr) return;

        container.querySelector('#receive-purchase-id').value = id;
        const total = ((pr.unit_cost || 0) * (pr.quantity || 0)).toFixed(2).replace('.', ',');

        container.querySelector('#receive-details').innerHTML = `
            <div style="display:grid; gap:0.6rem">
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Produto</span>
                    <b>${pr.product_name}</b>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Fornecedor</span>
                    <span>${pr.supplier_name || '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Quantidade</span>
                    <b style="color:#10b981;font-size:1.1em">+${pr.quantity} unidades</b>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Custo Total</span>
                    <span>${pr.unit_cost > 0 ? 'R$ ' + total : '—'}</span>
                </div>
                ${pr.notes ? `<div style="border-top:1px solid var(--border);padding-top:0.5rem;font-size:0.85rem;color:#64748b">${pr.notes}</div>` : ''}
            </div>
        `;

        receiveModal.classList.add('open');
    };

    container.querySelector('#receive-confirm-btn').onclick = async () => {
        const id = container.querySelector('#receive-purchase-id').value;
        const btn = container.querySelector('#receive-confirm-btn');
        btn.disabled = true;
        btn.textContent = 'Processando...';

        try {
            const res = await fetch(`/api/purchases/${id}/receive`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ received_by: user.id })
            });
            const result = await res.json();
            if (!res.ok) { alert(result.error || 'Erro ao confirmar recebimento'); return; }
            receiveModal.classList.remove('open');
            loadPurchases();
        } catch (err) {
            alert('Erro de conexão');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Confirmar Recebimento';
        }
    };

    // ── Cancel Purchase ────────────────────────────────────────────────────────
    const doCancelPurchase = async (id) => {
        if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) return;
        try {
            const res = await fetch(`/api/purchases/${id}/cancel`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
            const result = await res.json();
            if (!res.ok) { alert(result.error || 'Erro ao cancelar'); return; }
            loadPurchases();
        } catch (err) {
            alert('Erro de conexão');
        }
    };

    // ── Delete Purchase (master only) ──────────────────────────────────────────
    const doDeletePurchase = async (id) => {
        const pr = allPurchases.find(p => p.id == id);
        const name = pr ? pr.product_name : `#${id}`;
        if (!confirm(`Excluir permanentemente a solicitação de "${name}"? Esta ação não pode ser desfeita.`)) return;
        try {
            const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok) { alert(result.error || 'Erro ao excluir'); return; }
            loadPurchases();
        } catch (err) {
            alert('Erro de conexão');
        }
    };

    // ── Details Modal ──────────────────────────────────────────────────────────
    const detailsModal = container.querySelector('#details-modal');
    container.querySelector('#details-close').onclick = () => detailsModal.classList.remove('open');

    const openDetailsModal = (id) => {
        const pr = allPurchases.find(p => p.id == id);
        if (!pr) return;
        const total = ((pr.unit_cost || 0) * (pr.quantity || 0)).toFixed(2).replace('.', ',');

        container.querySelector('#details-content').innerHTML = `
            <div style="display:grid; gap:0.7rem; padding-bottom:1rem">
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <span style="color:#64748b">Status</span>
                    ${statusBadge(pr.status)}
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Produto</span>
                    <b>${pr.product_name}</b>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Tipo</span>
                    <span>${pr.product_type || '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Fornecedor</span>
                    <span>${pr.supplier_name || '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Quantidade</span>
                    <b>${pr.quantity}</b>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Custo Unit.</span>
                    <span>${pr.unit_cost > 0 ? fmtCurrency(pr.unit_cost) : '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Custo Total</span>
                    <span>${pr.unit_cost > 0 ? 'R$ ' + total : '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Solicitante</span>
                    <span>${pr.requested_by_name || '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Data Solicitação</span>
                    <span>${fmtDate(pr.created_at)}</span>
                </div>
                ${pr.status === 'recebida' ? `
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Recebido Por</span>
                    <span>${pr.received_by_name || '—'}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                    <span style="color:#64748b">Data Recebimento</span>
                    <span>${fmtDate(pr.received_at)}</span>
                </div>` : ''}
                ${pr.notes ? `<div style="border-top:1px solid var(--border);padding-top:0.5rem;font-size:0.85rem;color:#64748b"><b>Obs:</b> ${pr.notes}</div>` : ''}
            </div>
        `;
        detailsModal.classList.add('open');
    };

    // ── Init ───────────────────────────────────────────────────────────────────
    loadSelects();
    loadPurchases();
    return container;
};
