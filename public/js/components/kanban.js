export const render = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.createElement('div');
    const isClient = user.role === 'cliente';
    const isProducao = user.role === 'producao';
    const clientId = user.client_id;

    container.innerHTML = `
        <div class="view-header">
            <div class="view-title">${isClient ? '📋 Meus Pedidos' : 'Quadro de Produção'}</div>
            ${(isClient || isProducao) ? '' : `<div style="display:flex; gap:0.5rem">
                <button class="btn btn-secondary" style="width:auto;" id="btn-archived">📁 Pedidos Arquivados</button>
                <button class="btn btn-primary" style="width: auto;" id="btn-new-order">Novo Pedido</button>
            </div>`}
        </div>
        <div class="kanban-board">
            ${isClient ? '' : `<div class="kanban-column" id="col-aguardando_aceite">
                <div class="column-header">
                    Aguardando Aceite
                    <span class="column-count">0</span>
                    <div class="column-stats" style="font-size: 0.8em; color: #555; margin-top: 4px; font-weight: normal;"></div>
                </div>
                <div class="column-content"></div>
            </div>`}
            <div class="kanban-column" id="col-producao">
                <div class="column-header">
                    Em Produção
                    <span class="column-count">0</span>
                    <div class="column-stats" style="font-size: 0.8em; color: #555; margin-top: 4px; font-weight: normal;"></div>
                </div>
                <div class="column-content"></div>
            </div>
             <div class="kanban-column" id="col-em_balcao">
                <div class="column-header">
                    ${isClient ? 'Retirada' : 'Em Balcão'}
                    <span class="column-count">0</span>
                </div>
                <div class="column-content"></div>
            </div>
            ${isClient ? '' : `<div class="kanban-column" id="col-finalizado">
                <div class="column-header">
                    Finalizado
                    <span class="column-count">0</span>
                </div>
                <div class="column-content"></div>
            </div>`}
        </div>

        <!-- Archived Orders Section (Hidden) -->
        <div id="archived-section" style="display:none; margin-top:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0; color:#64748b;">📁 Pedidos Arquivados</h3>
                <button class="btn btn-secondary btn-sm" id="btn-close-archived">✕ Fechar</button>
            </div>
            <div id="archived-list" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;"></div>
        </div>

        <!-- New Order Modal (Harmonized) -->
        <div class="modal-overlay" id="order-modal">
            <div class="modal" style="max-width: 700px; width: 95%;">
                <div class="modal-header" style="border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem;">
                    <h3 style="margin:0; font-size: 1.5rem; color: #333;">Novo Pedido</h3>
                    <button class="modal-close" data-target="order-modal" style="font-size: 1.5rem;">&times;</button>
                </div>
                
                <div id="order-step-1">
                    <!-- Internal Service Toggle -->
                    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; padding:0.6rem 1rem; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; cursor:pointer;" id="internal-toggle-container">
                        <input type="checkbox" id="internal-toggle" style="width:18px; height:18px; cursor:pointer;">
                        <label for="internal-toggle" style="margin:0; cursor:pointer; font-weight:600; color:#1d4ed8; font-size:0.95rem;">🏢 Serviço Interno</label>
                        <span style="font-size:0.8rem; color:#64748b;">(uso interno da empresa)</span>
                    </div>
                    <!-- Top Row: Client and Deadline -->
                    <div id="client-row" style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                        <div class="form-group" style="margin:0">
                             <label style="font-weight: 600; color: #555; margin-bottom: 0.5rem; display: block;">Cliente</label>
                             <div style="display:flex; gap:0.5rem; position:relative;" id="client-autocomplete-wrap">
                                 <div style="flex:1; position:relative;">
                                     <input type="text" id="client-search" placeholder="Buscar cliente..." autocomplete="off"
                                         style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                                     <!-- Hidden field that stores the selected client ID -->
                                     <input type="hidden" id="client-select">
                                     <div id="client-suggestions" style="display:none; position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #ccc; border-top:none; border-radius:0 0 6px 6px; max-height:200px; overflow-y:auto; z-index:1000; box-shadow:0 4px 12px rgba(0,0,0,0.1);"></div>
                                 </div>
                                 <button class="btn btn-secondary" id="btn-quick-client" title="Novo Cliente" style="width: 40px; padding: 0; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">+</button>
                             </div>
                         </div>
                        
                        <div class="form-group" style="margin:0">
                            <label style="font-weight: 600; color: #555; margin-bottom: 0.5rem; display: block;">Prazo</label>
                            <div style="display:flex; gap:0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;">
                                <label style="cursor:pointer; display:flex; align-items:center; gap:0.3rem; font-size: 0.9rem;">
                                    <input type="radio" name="deadline_option" value="3D" checked> 
                                    3 Dias
                                </label>
                                <label style="cursor:pointer; display:flex; align-items:center; gap:0.3rem; color:#dc2626; font-weight:bold; font-size: 0.9rem;">
                                    <input type="radio" name="deadline_option" value="1D"> 
                                    1 Dia
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Cart Section -->
                    <div style="background:#f0fdf4; border:2px solid #86efac; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                        <label style="font-weight:700; font-size:0.95rem; margin-bottom: 0.75rem; display: flex; align-items:center; gap:0.4rem; color: #166534;">🛒 Produtos do Pedido</label>
                        
                        <div style="margin-bottom:0.5rem;">
                            <small style="display:block; margin-bottom:2px; color:#666">Filtrar por Tipo</small>
                            <select id="product-type-filter" class="form-control" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;">
                                <option value="">Todos os tipos</option>
                            </select>
                        </div>
                        <div style="margin-bottom:0.5rem;">
                            <small style="display:block; margin-bottom:2px; color:#666">Buscar por Nome</small>
                            <input type="text" id="product-name-search" placeholder="Digite para filtrar..." style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                        </div>
                        <div style="display: grid; grid-template-columns: 3fr 1fr auto; gap: 0.5rem; align-items: end; margin-bottom:0.5rem;">
                            <div>
                                <small style="display:block; margin-bottom:2px; color:#666">Produto</small>
                                <select id="product-select" class="form-control" style="width:100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"><option value="">Selecione...</option></select>
                            </div>
                            <div>
                                <small style="display:block; margin-bottom:2px; color:#666">Qtd</small>
                                <input type="number" id="item-qty" value="1" min="1" class="form-control" style="width:100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <button class="btn" id="btn-add-item" type="button" style="height: 38px; line-height: 1; background:#16a34a; color:white; border:none; border-radius:6px; padding:0 1rem; font-weight:600;">+ Adicionar</button>
                        </div>
                        <!-- Color selector for pulseiras -->
                        <div id="color-select-container" style="display:none; margin-bottom:0.5rem; background:#fefce8; border:1px solid #fde68a; border-radius:6px; padding:8px 10px;">
                            <small style="display:block; margin-bottom:4px; color:#92400e; font-weight:600;">🎨 Selecione a cor da pulseira:</small>
                            <select id="color-select" class="form-control" style="width:100%; padding:0.4rem; border:1px solid #fcd34d; border-radius:4px;">
                                <option value="">Carregando cores...</option>
                            </select>
                        </div>
                        <div id="stock-warning" style="font-size:0.8rem; color:red; margin-top:0.25rem; min-height: 1.2em;"></div>

                        <!-- Cart List -->
                        <div class="cart-list" style="margin-top:0.5rem; max-height:180px; overflow-y:auto; background: #fff; border:1px solid #bbf7d0; border-radius: 6px;">
                             <table style="width:100%; font-size:0.9rem; border-collapse:collapse">
                                 <thead style="background:#dcfce7; color: #166534;">
                                     <tr>
                                         <th style="padding:8px; text-align:left; font-weight: 600;">Produto</th>
                                         <th style="padding:8px; text-align:center; font-weight: 600;">Qtd</th>
                                         <th style="padding:8px; text-align:right; font-weight: 600;">Subtotal</th>
                                         <th style="width:30px"></th>
                                     </tr>
                                 </thead>
                                 <tbody id="cart-tbody">
                                     <tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#94a3b8">Nenhum item adicionado</td></tr>
                                 </tbody>
                             </table>
                        </div>
                    </div>

                    <form id="order-form">
                        <div class="form-group">
                            <label style="font-weight: 600; color: #555;">Descrição Geral / Observações</label>
                            <textarea name="description" rows="2" placeholder="Detalhes do pedido..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"></textarea>
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; color: #555;">📎 Anexos (imagens / PDF / CDR)</label>
                            <input type="file" id="order-attachments" multiple accept="image/*,.pdf,.cdr" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px; font-size:0.9rem;">
                            <div id="attachment-preview" style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;"></div>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eee;">
                             <div class="form-group" style="margin-bottom:0; width: 45%;">
                                <label style="font-weight: 600; color: #555;">Forma de Pagamento</label>
                                <select name="payment_method" id="order-payment-method" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                                    <option value="Pix">Pix</option>
                                    <option value="Cartão">Cartão</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Boleto">Boleto</option>
                                    <option value="CORE">CORE</option>
                                </select>
                                <div id="core-auto-info" style="display:none; margin-top:4px; font-size:0.75rem; color:#7c3aed; font-weight:600;"></div>
                            </div>
                            <div style="text-align:right">
                                <label style="display:block; font-size: 0.9rem; color: #666;">Valor a Cobrar (R$)</label>
                                <input type="number" step="0.01" min="0" id="cart-total-input" name="total_value" value="0" style="font-size:1.5rem; font-weight:bold; color:#2563eb; width:150px; text-align:right; border:1px solid #ccc; border-radius:4px; padding:0.3rem 0.5rem;">
                                <div style="font-size:0.75rem; color:#999; margin-top:2px;" id="cart-total-auto"></div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary" style="width:100%; padding: 0.8rem; font-size: 1.1rem;" id="btn-create-order" disabled>Criar Pedido</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Quick Client Modal -->
        <div class="modal-overlay" id="quick-client-modal">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Novo Cliente Rápido</h3>
                    <button class="modal-close" data-target="quick-client-modal">&times;</button>
                </div>
                <form id="quick-client-form">
                    <div class="form-group">
                        <label>Nome</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Telefone <span style="color:#ef4444">*</span></label>
                        <input type="text" name="phone" placeholder="(XX) XXXXX-XXXX" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%">Salvar Cliente</button>
                </form>
            </div>
        </div>

        <!-- Finalize Modal -->
        <div class="modal-overlay" id="finalize-modal">
             <div class="modal" style="max-width:550px">
                <div class="modal-header">
                    <h3>Enviar para Balcão</h3>
                    <button class="modal-close" data-target="finalize-modal">&times;</button>
                </div>
                <form id="finalize-form">
                    <p style="margin-bottom:1rem">Confirme o consumo de estoque para cada item:</p>
                    <div id="finalize-items-list" style="margin-bottom:1rem"></div>
                    <div class="form-group" id="loss-group" style="display:none; background:#fef2f2; border:1px solid #fca5a5; border-radius:6px; padding:0.75rem;">
                        <label style="color:#b91c1c; font-weight:bold;">⚠️ Perda detectada — Justificativa</label>
                        <textarea name="loss_justification" id="finalize-loss-justification" rows="2" placeholder="Explique por que gastou mais material..." style="margin-top:0.5rem"></textarea>
                    </div>
                    <button type="submit" class="btn btn-success" style="width:100%">Enviar para Balcão e Imprimir</button>
                </form>
             </div>
        </div>



        <!-- Detail Modal -->
        <div class="modal-overlay" id="detail-modal">
            <div class="modal">
                <div class="modal-header">
                    <h3 id="detail-title">Detalhes do Pedido</h3>
                    <button class="modal-close" data-target="detail-modal">&times;</button>
                </div>
                <div id="detail-content"></div>
                
                 <!-- Comments Section -->
                <div class="comments-section">
                    <h4>Comentários</h4>
                    <div id="comments-list" style="max-height: 150px; overflow-y: auto; margin-bottom: 1rem;"></div>
                    <form id="comment-form" style="display: flex; gap: 0.5rem;">
                        <input type="text" id="comment-input" placeholder="Escreva um comentário..." style="flex:1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" required>
                        <button type="submit" class="btn btn-secondary" style="width: auto;">Enviar</button>
                    </form>
                </div>
            </div>
        </div>
        </div>
    `;

    // Helper: order number = last 4 digits of client phone
    const getOrderNum = (order) => {
        if (order.client_phone) {
            const digits = order.client_phone.replace(/\D/g, '');
            return digits.slice(-4);
        }
        return String(order.id);
    };

    const printLabel = (order) => {
        const printWindow = window.open('', '', 'width=250,height=500');
        printWindow.document.write(`
            <html>
                <head>
                    <style>
                        @page { size: portrait; margin: 0; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { width: 57mm; padding: 2mm; font-family: 'Arial', sans-serif; font-size: 10px; }
                        .header { text-align: center; margin-bottom: 2mm; }
                        .header h2 { font-size: 14px; margin: 0; }
                        .header small { font-size: 8px; color: #555; }
                        .line { border-bottom: 1px dashed #000; margin: 2mm 0; }
                        .info p { margin: 1mm 0; font-size: 10px; line-height: 1.4; }
                        .info p b { display: inline; }
                        .products { margin: 1mm 0; font-size: 10px; white-space: pre-line; line-height: 1.4; }
                        .total { text-align: center; font-size: 13px; font-weight: bold; margin: 2mm 0; }
                        .signature { margin-top: 6mm; border-top: 1px solid #000; text-align: center; padding-top: 2mm; font-size: 9px; }
                        .footer { text-align: center; font-size: 8px; color: #777; margin-top: 3mm; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>PEDIDO #${getOrderNum(order)}</h2>
                        <small>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <div class="line"></div>
                    <div class="info">
                        <p style="font-size:14px;"><b>Cliente:</b> ${order.client_name}</p>
                        ${order.client_phone ? `<p><b>Tel:</b> ${order.client_phone}</p>` : ''}
                    </div>
                    <div class="line"></div>
                    <div class="info">
                        <p><b>Produtos:</b></p>
                        <div class="products">${order.product_name}</div>
                    </div>
                    <div class="line"></div>
                    <div class="signature">
                        Retirado por: ___________________
                    </div>
                    <div class="footer">LM Passo</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        // Close only after print dialog is dismissed (prevents crash)
        printWindow.onafterprint = () => {
            printWindow.close();
        };
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    // Fetch Helpers
    let loadedProducts = []; // To check stock

    const fetchSelectData = async () => {
        const [clientsRes, productsRes] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/products')
        ]);
        const clients = (await clientsRes.json()).data;
        const products = (await productsRes.json()).data;
        loadedProducts = products; // Store for valid.

        const clientSearch = container.querySelector('#client-search');
        const clientIdInput = container.querySelector('#client-select'); // hidden input
        const suggestions   = container.querySelector('#client-suggestions');

        // Auto-apply CORE / discount on client change
        const paymentSelect = container.querySelector('#order-payment-method');
        const coreInfo = container.querySelector('#core-auto-info');

        // Restrict payment options for vendedor
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (['vendedor', 'producao'].includes(currentUser.role)) {
            const allowed = ['Pix', 'Cartão'];
            [...paymentSelect.options].forEach(opt => {
                if (!allowed.includes(opt.value)) opt.remove();
            });
        }

        const applyClientDefaults = (client) => {
            if (!client) return;
            if (client.origin === 'CORE') {
                paymentSelect.value = 'CORE';
                paymentSelect.disabled = true;
                coreInfo.style.display = 'block';
                coreInfo.textContent = '🔒 Cliente CORE — pagamento travado em CORE' + (client.core_discount ? ' | 15% desconto aplicado' : '');
            } else {
                paymentSelect.disabled = false;
                if (client.core_discount) {
                    coreInfo.style.display = 'block';
                    coreInfo.textContent = '🏷️ 15% desconto aplicado automaticamente';
                } else {
                    coreInfo.style.display = 'none';
                    coreInfo.textContent = '';
                }
            }
        };

        const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const selectClient = (client) => {
            clientIdInput.value = client.id;
            clientSearch.value = client.name;
            clientSearch.style.borderColor = '#22c55e';
            suggestions.style.display = 'none';
            applyClientDefaults(client);
        };

        const showSuggestions = (term) => {
            const t = removeAccents(term.toLowerCase().trim());
            if (!t) { suggestions.style.display = 'none'; return; }
            const filtered = clients.filter(c => removeAccents(c.name.toLowerCase()).includes(t));
            if (!filtered.length) { suggestions.style.display = 'none'; return; }
            suggestions.innerHTML = filtered.slice(0, 12).map(c => `
                <div class="client-suggestion-item" data-id="${c.id}"
                    style="padding:0.5rem 0.75rem; cursor:pointer; font-size:0.95rem; border-bottom:1px solid #f1f5f9;"
                    onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background=''"
                >${c.name}${c.phone ? `<span style="color:#94a3b8; font-size:0.8rem; margin-left:0.5rem;">${c.phone}</span>` : ''}</div>
            `).join('');
            suggestions.style.display = 'block';
            suggestions.querySelectorAll('.client-suggestion-item').forEach(item => {
                item.onmousedown = (e) => {
                    e.preventDefault();
                    const client = clients.find(c => c.id == item.dataset.id);
                    if (client) selectClient(client);
                };
            });
        };

        clientSearch.addEventListener('input', () => {
            clientIdInput.value = '';
            clientSearch.style.borderColor = '#ccc';
            showSuggestions(clientSearch.value);
        });
        clientSearch.addEventListener('blur', () => {
            setTimeout(() => { suggestions.style.display = 'none'; }, 150);
        });
        clientSearch.addEventListener('focus', () => {
            if (clientSearch.value) showSuggestions(clientSearch.value);
        });

        // Expose for use after quick-client creation
        window._kanbanClientsRef = clients;
        window._kanbanSelectClientById = (id) => {
            const client = clients.find(c => c.id === id);
            if (client) selectClient(client);
        };

        const productSelect = container.querySelector('#product-select');
        const typeFilter = container.querySelector('#product-type-filter');
        const nameSearch = container.querySelector('#product-name-search');

        // Populate type filter
        const types = [...new Set(products.map(p => p.type || '').filter(t => t))];
        typeFilter.innerHTML = '<option value="">Todos os tipos</option>' + types.sort().map(t => `<option value="${t}">${t}</option>`).join('');


        const filterProducts = () => {
            const selectedType = typeFilter.value;
            const searchTerm = removeAccents((nameSearch ? nameSearch.value : '').toLowerCase().trim());
            const filtered = products.filter(p => {
                const matchType = !selectedType || p.type === selectedType;
                const matchName = !searchTerm || removeAccents(p.name.toLowerCase()).includes(searchTerm);
                return matchType && matchName;
            });
            productSelect.innerHTML = filtered.length
                ? '<option value="">Selecione...</option>' + filtered.map(p => `<option value="${p.id}">${p.name}</option>`).join('')
                : '<option value="">Nenhum produto encontrado</option>';
        };

        typeFilter.addEventListener('change', filterProducts);
        if (nameSearch) nameSearch.addEventListener('input', filterProducts);
        filterProducts(); // Initial load
    };

    const loadOrders = async () => {
        // Client role: fetch only their orders; others: fetch all
        const url = isClient && clientId ? `/api/reports/client-orders/${clientId}` : '/api/orders';
        const res = await fetch(url);
        const { data } = await res.json();

        // For client/producao, show only relevant columns
        const visibleStatuses = isClient ? ['producao', 'em_balcao']
            : isProducao ? ['aguardando_aceite', 'producao', 'em_balcao', 'finalizado']
            : ['aguardando_aceite', 'producao', 'em_balcao', 'finalizado'];

        // Clear Cols
        const columnTimes = { aguardando_aceite: 0, producao: 0, em_balcao: 0, finalizado: 0 };

        visibleStatuses.forEach(status => {
            const col = container.querySelector(`#col-${status} .column-content`);
            if (col) col.innerHTML = '';
            const counter = container.querySelector(`#col-${status} .column-count`);
            if (counter) counter.textContent = '0';
            const stats = container.querySelector(`#col-${status} .column-stats`);
            if (stats) stats.textContent = '';
        });

        const formatDuration = (min) => {
            if (!min) return '';
            const h = Math.floor(min / 60);
            const m = min % 60;
            if (h > 0) return `${h}h${m > 0 ? ' ' + m + 'm' : ''}`;
            return `${m}m`;
        };


        data.forEach(order => {
            // Skip orders not in visible statuses for client
            if (isClient && !visibleStatuses.includes(order.status)) return;

            // Accumulate Time
            if (order.total_estimated_time && columnTimes[order.status] !== undefined) {
                columnTimes[order.status] += order.total_estimated_time;
            }

            const col = container.querySelector(`#col-${order.status} .column-content`);
            if (col) {
                const card = document.createElement('div');
                card.className = `card status-${order.status}`;
                card.dataset.orderId = order.id;

                // Enable drag-and-drop only for producao role on producao/finalizado columns
                const isDraggableCol = (order.status === 'producao' || order.status === 'finalizado');
                if (isProducao && isDraggableCol) {
                    card.draggable = true;
                    card.style.cursor = 'grab';
                    card.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('order-id', order.id);
                        e.dataTransfer.setData('order-status', order.status);
                        card.classList.add('dragging');
                    });
                    card.addEventListener('dragend', () => {
                        card.classList.remove('dragging');
                    });
                    card.onclick = () => openDetail(order);
                } else {
                    card.onclick = () => openDetail(order);
                }

                // Formatting date and status specific UI
                let badge = '';
                if (order.status === 'producao' && order.deadline_at) {
                    const deadline = new Date(order.deadline_at);
                    const now = new Date();
                    const diff = deadline - now;
                    const isUrgent = diff < 86400000; // 24h
                    if (isUrgent && diff > 0) card.classList.add('deadline-urgent');
                    if (diff < 0) {
                        card.style.borderLeftColor = 'red';
                        badge = `<span class="card-badge" style="background:#fecaca; color:#b91c1c">Atrasado</span>`;
                    } else {
                        badge = `<span class="card-badge">${order.deadline_type || ''}</span>`;
                    }
                } else if (order.status === 'em_balcao') {
                    badge = `<span class="card-badge" style="background:#ffedd5; color:#c2410c">Em Balcão</span>`;
                }

                // Pie chart for orders with checklist data
                let pieHtml = '';
                const clData = order.checklist || {};
                const checklistItems = ['arte', 'impressao', 'corte', 'embalagem'];
                const doneItems = checklistItems.filter(i => clData[i]).length;
                if (doneItems > 0 || order.status === 'producao') {
                    const total = 4;
                    const pct = Math.round((doneItems / total) * 100);
                    const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                    pieHtml = `<div class="card-pie-wrap" style="display:flex; align-items:center; gap:6px; margin-top:6px;">
                        <div class="card-pie-circle" style="width:28px; height:28px; border-radius:50%; background:conic-gradient(${color} ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg); flex-shrink:0;"></div>
                        <span class="card-pie-text" style="font-size:0.78rem; font-weight:600; color:${color};">${doneItems}/${total} (${pct}%)</span>
                    </div>`;
                }

                card.innerHTML = `
                    <div class="card-header">#${getOrderNum(order)} - ${new Date(order.created_at).toLocaleDateString()}</div>
                    <div class="card-title">${order.client_name || 'Cliente?'} ${order.is_internal ? '<span style="background:#dbeafe; color:#1d4ed8; padding:1px 6px; border-radius:10px; font-size:0.7rem; font-weight:600; margin-left:4px;">🏢 Interno</span>' : ''}</div>
                    <div class="card-detail" style="font-size:0.85rem; color:#555; white-space:pre-wrap;">${order.product_name || 'Produto?'}</div>
                    ${order.status === 'producao' && order.total_estimated_time ? (order.has_terceirizado ? `<div style="font-size:0.8rem; color:#1d4ed8; margin-top:4px; font-weight:600;">📅 ${order.total_estimated_time} dia${order.total_estimated_time == 1 ? '' : 's'} úteis</div>` : `<div style="font-size:0.8rem; color:#7c3aed; margin-top:4px; font-weight:600;">⏱️ ${formatDuration(order.total_estimated_time)}</div>`) : ''}
                    ${pieHtml}
                    <div class="card-footer">
                        <span>${order.created_by_name?.split(' ')[0]}</span>
                        ${badge}
                    </div>
                    ${order.moved_by_name ? `<div class="card-moved-by" style="font-size:0.75rem; color:#6b7280; padding:3px 6px; background:#f8fafc; border-top:1px solid #e5e7eb; border-radius:0 0 6px 6px; margin-top:2px;">📦 Movido por: <b>${order.moved_by_name.split(' ')[0]}</b></div>` : ''}
                `;
                col.appendChild(card);

                // Update Count
                const counter = container.querySelector(`#col-${order.status} .column-count`);
                if (counter) counter.textContent = parseInt(counter.textContent) + 1;
            }
        });

        // Update Stats Display

        ['aguardando_aceite', 'producao'].forEach(status => {
            const statsEl = container.querySelector(`#col-${status} .column-stats`);
            const totalMin = columnTimes[status];
            if (statsEl && totalMin > 0) {
                statsEl.textContent = `⏱️ ${formatDuration(totalMin)}`;
            }
        });
    };

    const openDetail = async (order) => {
        const modal = container.querySelector('#detail-modal');
        const content = container.querySelector('#detail-content');
        const currentUserRole = JSON.parse(localStorage.getItem('user') || '{}').role;
        const isVendedor = currentUserRole === 'vendedor';

        // Action Buttons Logic
        let actions = '';
        let checklistHtml = '';

        // Client role: show read-only view only
        if (isClient) {
            const items = ['arte', 'impressao', 'corte', 'embalagem'];
            const itemLabels = { arte: 'Arte', impressao: 'Impressão', corte: 'Corte', embalagem: 'Embalagem' };
            const checklist = order.checklist || {};
            const doneCount = items.filter(i => checklist[i]).length;
            const pctDone = Math.round((doneCount / items.length) * 100);
            const pieColor = pctDone === 100 ? '#22c55e' : pctDone >= 50 ? '#f59e0b' : '#ef4444';

            const formatCheckDate = (val) => {
                if (!val || val === true) return '';
                try {
                    const d = new Date(val);
                    return `<span style="font-size:0.75rem; color:#6b7280; margin-left:auto;">✅ ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
                } catch { return ''; }
            };

            let statusBadge = '';
            if (order.status === 'em_balcao') {
                statusBadge = `<div style="text-align:center; padding:1.5rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; margin-top:1rem;">
                    <div style="font-size:2rem; margin-bottom:0.5rem;">📦</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#166534;">Pronto para Retirada!</div>
                    <div style="font-size:0.85rem; color:#059669; margin-top:0.25rem;">Seu pedido está disponível para retirada.</div>
                </div>`;
            }

            content.innerHTML = `
                <div class="form-group"><label>Produtos:</label>
                    <div style="white-space:pre-line; background:#f0fdf4; padding:0.5rem; border:1px solid #bbf7d0; border-radius:4px;">${order.product_name || order.products_summary || '-'}</div>
                </div>
                ${order.description ? `<div class="form-group"><label>Descrição:</label> <div style="background:#f8fafc; padding:0.5rem; border-radius:4px; white-space:pre-wrap;">${order.description}</div></div>` : ''}
                <div class="form-group" style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center">
                    <span style="padding:4px 12px; border-radius:12px; font-size:0.9rem; font-weight:600; background:#eff6ff; color:#1d4ed8;">💳 ${order.payment_method || '-'}</span>
                    <span style="font-weight:bold; color:#7c3aed; font-size:1.1rem;">R$ ${(order.total_value || 0).toFixed(2)}</span>
                </div>
                ${order.status === 'producao' ? `
                    <div style="margin-top:1rem; padding:0.75rem; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb">
                        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                            <div style="width:48px; height:48px; border-radius:50%; background:conic-gradient(${pieColor} ${pctDone * 3.6}deg, #e5e7eb ${pctDone * 3.6}deg); flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                                <div style="width:30px; height:30px; border-radius:50%; background:#f9fafb; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; color:${pieColor};">${pctDone}%</div>
                            </div>
                            <div>
                                <h4 style="margin:0; font-size:14px;">Progresso da Produção</h4>
                                <small style="color:#666;">${doneCount}/${items.length} etapas concluídas</small>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:0.4rem">
                            ${items.map(item => `
                                <div style="display:flex; align-items:center; gap:0.5rem; font-size:14px; padding:0.3rem 0.4rem; border-radius:6px; background:${checklist[item] ? '#f0fdf4' : '#fff'}; border:1px solid ${checklist[item] ? '#bbf7d0' : '#e5e7eb'};">
                                    <span style="${checklist[item] ? 'color:#22c55e;' : 'color:#d1d5db;'}">${checklist[item] ? '✅' : '⏳'}</span>
                                    <span style="${checklist[item] ? 'text-decoration:line-through; color:#6b7280;' : ''}">${itemLabels[item]}</span>
                                    ${formatCheckDate(checklist[item])}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${statusBadge}
            `;

            modal.classList.add('open');
            modal.querySelector('.modal-close').onclick = () => modal.classList.remove('open');
            return;
        }

        if (order.status === 'aguardando_aceite') {
            const deadlineDate = order.deadline_at ? new Date(order.deadline_at) : null;
            const now = new Date();
            const isExpired = deadlineDate && now > deadlineDate;
            const deadlineLabel = deadlineDate ? deadlineDate.toLocaleDateString() + ' ' + deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

            if (isVendedor) {
                // Vendedor: read-only, just show status
                actions = `
                    <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                        <div style="padding:0.75rem; border-radius:8px; background:#fefce8; border:1px solid #fde68a; text-align:center;">
                            <span style="font-size:1.2rem;">⏳</span>
                            <p style="margin:0.25rem 0 0; font-weight:600; color:#92400e;">Aguardando a produção aceitar o pedido</p>
                        </div>
                    </div>
                `;
            } else {
                actions = `
                    <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                        <p style="margin-bottom:0.5rem; font-weight:600">Produção - Aceitar Pedido:</p>
                        <div style="margin-bottom:0.5rem; padding:0.5rem; border-radius:6px; font-size:0.9rem; ${isExpired ? 'background:#fef2f2; border:1px solid #fecaca; color:#b91c1c;' : 'background:#f0fdf4; border:1px solid #bbf7d0; color:#166534;'}">
                            📅 Prazo do vendedor: <b>${deadlineLabel}</b> (${order.deadline_type || 'N/A'})
                            ${isExpired ? '<br><span style="font-weight:700;">⚠️ PRAZO EXPIRADO — não é possível aceitar</span>' : ''}
                        </div>
                        <button class="btn btn-primary btn-accept" ${isExpired ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>✅ Aceitar Pedido</button>
                    </div>
                `;
            }
        } else if (order.status === 'producao') {
            const items = ['arte', 'impressao', 'corte', 'embalagem'];
            const itemLabels = { arte: 'Arte', impressao: 'Impressão', corte: 'Corte', embalagem: 'Embalagem' };
            const checklist = order.checklist || {};
            const allChecked = items.every(i => checklist[i]);
            const doneCount = items.filter(i => checklist[i]).length;
            const pctDone = Math.round((doneCount / items.length) * 100);
            const pieColor = pctDone === 100 ? '#22c55e' : pctDone >= 50 ? '#f59e0b' : '#ef4444';

            const formatCheckDate = (val) => {
                if (!val || val === true) return '';
                try {
                    const d = new Date(val);
                    return `<span style="font-size:0.75rem; color:#6b7280; margin-left:auto;">✅ ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
                } catch { return ''; }
            };

            checklistHtml = `
               <div class="checklist-section" style="margin-top:1rem; padding:0.75rem; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb">
                   <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                       <div id="checklist-pie" style="width:48px; height:48px; border-radius:50%; background:conic-gradient(${pieColor} ${pctDone * 3.6}deg, #e5e7eb ${pctDone * 3.6}deg); flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                           <div style="width:30px; height:30px; border-radius:50%; background:#f9fafb; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; color:${pieColor};">${pctDone}%</div>
                       </div>
                       <div>
                           <h4 style="margin:0; font-size:14px;">Checklist de Produção</h4>
                           <small style="color:#666;">${doneCount}/${items.length} etapas concluídas</small>
                       </div>
                   </div>
                   <div style="display:flex; flex-direction:column; gap:0.4rem">
                       ${items.map(item => `
                           <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:14px; padding:0.3rem 0.4rem; border-radius:6px; background:${checklist[item] ? '#f0fdf4' : '#fff'}; border:1px solid ${checklist[item] ? '#bbf7d0' : '#e5e7eb'};">
                               <input type="checkbox" class="checklist-item" data-item="${item}" ${checklist[item] ? 'checked' : ''}>
                               <span style="${checklist[item] ? 'text-decoration:line-through; color:#6b7280;' : ''}">${itemLabels[item]}</span>
                               ${formatCheckDate(checklist[item])}
                           </label>
                       `).join('')}
                   </div>
               </div>
            `;

            if (isVendedor) {
                // Vendedor: read-only checklist progress
                actions = `
                    ${checklistHtml}
                    <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                        <div style="padding:0.75rem; border-radius:8px; background:#eff6ff; border:1px solid #bfdbfe; text-align:center;">
                            <span style="font-size:1.2rem;">🔧</span>
                            <p style="margin:0.25rem 0 0; font-weight:600; color:#1d4ed8;">Pedido em produção</p>
                        </div>
                    </div>
                `;
            } else {
                actions = `
                    ${checklistHtml}
                    <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                        <button class="btn btn-success btn-finalize" ${allChecked ? '' : 'disabled title="Conclua o checklist antes"'}>✅ Enviar para Balcão</button>
                    </div>
                `;
            }
        } else if (order.status === 'em_balcao') {
            const _clEb = order.checklist || {};
            const _itemsEb = ['arte', 'impressao', 'corte', 'embalagem'];
            const _itemLabelsEb = { arte: 'Arte', impressao: 'Impressão', corte: 'Corte', embalagem: 'Embalagem' };
            const _doneEb = _itemsEb.filter(i => _clEb[i]).length;
            const _pctEb = Math.round((_doneEb / _itemsEb.length) * 100);
            const _colorEb = _pctEb === 100 ? '#22c55e' : _pctEb >= 50 ? '#f59e0b' : '#ef4444';
            const _fmtEb = (val) => {
                if (!val || val === true) return '';
                try { const d = new Date(val); return `<span style="font-size:0.75rem;color:#6b7280;margin-left:auto;">✅ ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>`; } catch { return ''; }
            };
            actions = `
               <div style="margin-top:1rem; padding:0.75rem; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb">
                   <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                       <div style="width:48px;height:48px;border-radius:50%;background:conic-gradient(${_colorEb} ${_pctEb*3.6}deg,#e5e7eb ${_pctEb*3.6}deg);flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                           <div style="width:30px;height:30px;border-radius:50%;background:#f9fafb;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:${_colorEb};">${_pctEb}%</div>
                       </div>
                       <div><h4 style="margin:0;font-size:14px;">Checklist de Produção</h4><small style="color:#666;">${_doneEb}/${_itemsEb.length} etapas concluídas</small></div>
                   </div>
                   <div style="display:flex;flex-direction:column;gap:0.4rem">
                       ${_itemsEb.map(item => `<label style="display:flex;align-items:center;gap:0.5rem;font-size:14px;padding:0.3rem 0.4rem;border-radius:6px;background:${_clEb[item]?'#f0fdf4':'#fff'};border:1px solid ${_clEb[item]?'#bbf7d0':'#e5e7eb'};pointer-events:none;"><input type="checkbox" ${_clEb[item]?'checked':''} disabled><span style="${_clEb[item]?'text-decoration:line-through;color:#6b7280;':''}">${_itemLabelsEb[item]}</span>${_fmtEb(_clEb[item])}</label>`).join('')}
                   </div>
               </div>
               <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                   <p style="margin-bottom:0.5rem"><b>Entrega:</b> Colete a assinatura e anexe a foto.</p>
                   <form id="conclude-form" style="display:flex; gap:0.5rem; flex-direction:column">
                        <input type="file" id="pickup-photo" accept="image/*" required>
                        <button type="submit" class="btn btn-success">📦 Finalizar Pedido</button>
                   </form>
               </div>
            `;
        } else if (order.status === 'finalizado' && order.pickup_photo) {
            const _clFin = order.checklist || {};
            const _itemsFin = ['arte', 'impressao', 'corte', 'embalagem'];
            const _labelsFin = { arte: 'Arte', impressao: 'Impressão', corte: 'Corte', embalagem: 'Embalagem' };
            const _doneFin = _itemsFin.filter(i => _clFin[i]).length;
            const _pctFin = Math.round((_doneFin / _itemsFin.length) * 100);
            const _colorFin = _pctFin === 100 ? '#22c55e' : _pctFin >= 50 ? '#f59e0b' : '#ef4444';
            const _fmtFin = (val) => {
                if (!val || val === true) return '';
                try { const d = new Date(val); return `<span style="font-size:0.75rem;color:#6b7280;margin-left:auto;">✅ ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>`; } catch { return ''; }
            };
            actions = `
               <div style="margin-top:1rem; padding:0.75rem; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb">
                   <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                       <div style="width:48px;height:48px;border-radius:50%;background:conic-gradient(${_colorFin} ${_pctFin*3.6}deg,#e5e7eb ${_pctFin*3.6}deg);flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                           <div style="width:30px;height:30px;border-radius:50%;background:#f9fafb;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:${_colorFin};">${_pctFin}%</div>
                       </div>
                       <div><h4 style="margin:0;font-size:14px;">Checklist de Produção</h4><small style="color:#666;">${_doneFin}/${_itemsFin.length} etapas concluídas</small></div>
                   </div>
                   <div style="display:flex;flex-direction:column;gap:0.4rem">
                       ${_itemsFin.map(item => `<label style="display:flex;align-items:center;gap:0.5rem;font-size:14px;padding:0.3rem 0.4rem;border-radius:6px;background:${_clFin[item]?'#f0fdf4':'#fff'};border:1px solid ${_clFin[item]?'#bbf7d0':'#e5e7eb'};pointer-events:none;"><input type="checkbox" ${_clFin[item]?'checked':''} disabled><span style="${_clFin[item]?'text-decoration:line-through;color:#6b7280;':''}">${_labelsFin[item]}</span>${_fmtFin(_clFin[item])}</label>`).join('')}
                   </div>
               </div>
               <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                   <p><b>Entregue.</b> <a href="/uploads/${order.pickup_photo}" target="_blank">Ver comprovante</a></p>
                   ${currentUserRole === 'master' ? '<button class="btn btn-archive" style="margin-top:0.5rem;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;width:100%;">📁 Arquivar Pedido</button>' : ''}
               </div>
            `;
        } else if (order.status === 'finalizado') {
            const _clFin2 = order.checklist || {};
            const _itemsFin2 = ['arte', 'impressao', 'corte', 'embalagem'];
            const _labelsFin2 = { arte: 'Arte', impressao: 'Impressão', corte: 'Corte', embalagem: 'Embalagem' };
            const _doneFin2 = _itemsFin2.filter(i => _clFin2[i]).length;
            const _pctFin2 = Math.round((_doneFin2 / _itemsFin2.length) * 100);
            const _colorFin2 = _pctFin2 === 100 ? '#22c55e' : _pctFin2 >= 50 ? '#f59e0b' : '#ef4444';
            const _fmtFin2 = (val) => {
                if (!val || val === true) return '';
                try { const d = new Date(val); return `<span style="font-size:0.75rem;color:#6b7280;margin-left:auto;">✅ ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>`; } catch { return ''; }
            };
            actions = `
               <div style="margin-top:1rem; padding:0.75rem; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb">
                   <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                       <div style="width:48px;height:48px;border-radius:50%;background:conic-gradient(${_colorFin2} ${_pctFin2*3.6}deg,#e5e7eb ${_pctFin2*3.6}deg);flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                           <div style="width:30px;height:30px;border-radius:50%;background:#f9fafb;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:${_colorFin2};">${_pctFin2}%</div>
                       </div>
                       <div><h4 style="margin:0;font-size:14px;">Checklist de Produção</h4><small style="color:#666;">${_doneFin2}/${_itemsFin2.length} etapas concluídas</small></div>
                   </div>
                   <div style="display:flex;flex-direction:column;gap:0.4rem">
                       ${_itemsFin2.map(item => `<label style="display:flex;align-items:center;gap:0.5rem;font-size:14px;padding:0.3rem 0.4rem;border-radius:6px;background:${_clFin2[item]?'#f0fdf4':'#fff'};border:1px solid ${_clFin2[item]?'#bbf7d0':'#e5e7eb'};pointer-events:none;"><input type="checkbox" ${_clFin2[item]?'checked':''} disabled><span style="${_clFin2[item]?'text-decoration:line-through;color:#6b7280;':''}">${_labelsFin2[item]}</span>${_fmtFin2(_clFin2[item])}</label>`).join('')}
                   </div>
               </div>
            `;
        }

        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start">
                <div>
                     <div class="form-group"><label>Cliente:</label> <div>${order.client_name}${order.client_phone ? ` <span style="color:#64748b; font-size:0.9em;">— 📞 ${order.client_phone}</span>` : ''}</div></div>

                     <div class="form-group">
                        <label>Produtos:</label> 
                        <div style="white-space: pre-line; background: #f0fdf4; padding: 0.5rem; border: 1px solid #bbf7d0; border-radius: 4px;">${order.product_name}</div>
                     </div>
                </div>
                <button class="btn btn-sm btn-secondary btn-whatsapp" title="Copiar para WhatsApp" style="height:fit-content">
                    📱 Copiar
                </button>
            </div>
            <div class="form-group"><label>Descrição:</label> <div style="background:#f8fafc; padding:0.5rem; border-radius:4px; white-space:pre-wrap;">${order.description}</div></div>
            ${order.attachments ? `<div class="form-group"><label>📎 Anexos:</label>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.25rem;">
                    ${order.attachments.split(',').filter(f => f).map(f => {
            const ext = f.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
                return `<a href="/uploads/${f}" target="_blank"><img src="/uploads/${f}" style="width:70px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #ccc;cursor:pointer;" title="${f}"></a>`;
            } else {
                return `<a href="/uploads/${f}" target="_blank" style="background:#eff6ff;color:#2563eb;border-radius:6px;padding:4px 10px;font-size:0.8rem;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">📄 PDF</a>`;
            }
        }).join('')}
                </div>
            </div>` : ''}
            <div class="form-group" style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center">
                <div><label>Valor:</label> <b>R$ ${order.total_value}</b></div>
                <div><label>Pagamento:</label> ${order.payment_method}</div>
                ${order.has_terceirizado && order.total_estimated_time ? `<div><label>Prazo de Entrega:</label> <span style="display:inline-block; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:2px 10px; font-size:0.85em; color:#1d4ed8; font-weight:600;">📅 ${order.total_estimated_time} dia${order.total_estimated_time == 1 ? '' : 's'} úteis</span></div>` : ''}
            </div>
            ${actions}
            <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                <label style="font-weight:600; color:#555; display:block; margin-bottom:0.4rem;">📂 Caminho do Pedido</label>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <input type="text" id="order-file-path" value="${(order.file_path || '').replace(/"/g, '&quot;')}" placeholder="Ex: C:\\Clientes\\João\\Pedido123" style="flex:1; padding:0.5rem; border:1px solid #ccc; border-radius:4px; font-size:0.9rem;">
                    <button class="btn btn-secondary btn-save-path" style="width:auto; padding:0.5rem 0.75rem; font-size:0.85rem;" title="Salvar caminho">💾</button>
                    <button class="btn btn-primary btn-open-folder" style="width:auto; padding:0.5rem 0.75rem; font-size:0.85rem;" ${order.file_path ? '' : 'disabled'} title="Abrir pasta">📁 Abrir</button>
                </div>
            </div>
            ${currentUserRole === 'master' ? `<div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                <button class="btn btn-delete-order" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; padding:0.4rem 1rem; border-radius:4px; cursor:pointer; font-size:0.85rem;">🗑️ Excluir Pedido</button>
            </div>` : ''}
        `;

        // Save file path
        content.querySelector('.btn-save-path').onclick = async () => {
            const pathInput = content.querySelector('#order-file-path');
            const filePath = pathInput.value.trim();
            await fetch(`/api/orders/${order.id}/file-path`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_path: filePath })
            });
            order.file_path = filePath;
            content.querySelector('.btn-open-folder').disabled = !filePath;
            content.querySelector('.btn-save-path').textContent = '✅';
            setTimeout(() => content.querySelector('.btn-save-path').textContent = '💾', 1500);
        };

        // Open folder in Explorer
        content.querySelector('.btn-open-folder').onclick = async () => {
            const filePath = content.querySelector('#order-file-path').value.trim();
            if (!filePath) return;
            await fetch('/api/orders/open-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_path: filePath })
            });
        };

        // Delete Order
        const deleteBtn = content.querySelector('.btn-delete-order');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) return;
                try {
                    const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        modal.classList.remove('open');
                        loadOrders();
                    } else {
                        alert('Erro ao excluir pedido');
                    }
                } catch (err) {
                    alert('Erro de conexão: ' + err.message);
                }
            };
        }

        // WhatsApp Copy
        content.querySelector('.btn-whatsapp').onclick = () => {
            // Transform summary comma separated to new lines for whatsapp
            const itemsFormatted = order.product_name.replace(/, /g, '\n- ');

            const text = `* Pedido #${getOrderNum(order)} *\n` +
                `* Data:* ${new Date(order.created_at).toLocaleString()}\n` +
                `* Cliente:* ${order.client_name}\n` +
                `* Itens:*\n - ${itemsFormatted}\n` +
                `* Valor:* R$ ${order.total_value}\n` +
                `* Status:* ${order.status.replace('_', ' ').toUpperCase()}\n` +
                `* Pagamento:* ${order.payment_method}`;

            navigator.clipboard.writeText(text).then(() => {
                alert('Copiado para o WhatsApp!');
            });
        };

        // Attach Action Events
        if (order.status === 'aguardando_aceite') {
            const acceptBtn = content.querySelector('.btn-accept');
            if (acceptBtn && !acceptBtn.disabled) {
                acceptBtn.onclick = async () => {
                    try {
                        const res = await fetch(`/api/orders/${order.id}/accept`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        });
                        if (!res.ok) {
                            const err = await res.json();
                            alert(err.error || 'Erro ao aceitar pedido');
                            return;
                        }
                        modal.classList.remove('open');
                        loadOrders();
                    } catch (err) {
                        alert('Erro de conexão: ' + err.message);
                    }
                };
            }
        } else if (order.status === 'producao') {
            // Checklist Logic with timestamp tracking
            const checklistItems = ['arte', 'impressao', 'corte', 'embalagem'];
            const itemLabelsMap = { arte: 'Arte', impressao: 'Impressão', corte: 'Corte', embalagem: 'Embalagem' };

            if (isVendedor) {
                // Vendedor sees read-only checklist: disable all checkboxes
                content.querySelectorAll('.checklist-item').forEach(chk => {
                    chk.disabled = true;
                    chk.style.pointerEvents = 'none';
                });
            } else {
            const updatePieChart = () => {
                const cl = order.checklist || {};
                const done = checklistItems.filter(i => cl[i]).length;
                const pct = Math.round((done / checklistItems.length) * 100);
                const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
                const pie = content.querySelector('#checklist-pie');
                if (pie) {
                    pie.style.background = `conic-gradient(${color} ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)`;
                    pie.querySelector('div').textContent = pct + '%';
                    pie.querySelector('div').style.color = color;
                }
                const countEl = content.querySelector('.checklist-section small');
                if (countEl) countEl.textContent = `${done}/${checklistItems.length} etapas concluídas`;
            };

            content.querySelectorAll('.checklist-item').forEach(chk => {
                chk.onchange = async () => {
                    if (!order.checklist) order.checklist = {};
                    // Store timestamp when checked, false when unchecked
                    order.checklist[chk.dataset.item] = chk.checked ? new Date().toISOString() : false;

                    // Update label styling and date
                    const label = chk.closest('label');
                    const nameSpan = label.querySelector('span');
                    const existingDate = label.querySelector('.check-date');
                    if (existingDate) existingDate.remove();

                    if (chk.checked) {
                        label.style.background = '#f0fdf4';
                        label.style.borderColor = '#bbf7d0';
                        nameSpan.style.textDecoration = 'line-through';
                        nameSpan.style.color = '#6b7280';
                        const d = new Date();
                        const dateSpan = document.createElement('span');
                        dateSpan.className = 'check-date';
                        dateSpan.style.cssText = 'font-size:0.75rem; color:#6b7280; margin-left:auto;';
                        dateSpan.textContent = `✅ ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        label.appendChild(dateSpan);
                    } else {
                        label.style.background = '#fff';
                        label.style.borderColor = '#e5e7eb';
                        nameSpan.style.textDecoration = 'none';
                        nameSpan.style.color = '';
                    }

                    // Update pie chart
                    updatePieChart();

                    // Check all
                    const allChecked = checklistItems.every(i => order.checklist[i]);
                    const btn = content.querySelector('.btn-finalize');
                    btn.disabled = !allChecked;
                    if (!allChecked) btn.title = "Conclua o checklist antes";
                    else btn.title = "";

                    await fetch(`/api/orders/${order.id}/checklist`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ checklist: order.checklist })
                    });

                    // Update pie chart on the kanban card (live, no reload)
                    const cardEl = container.querySelector(`.card[data-order-id="${order.id}"]`);
                    if (cardEl) {
                        const cl2 = order.checklist || {};
                        const done2 = checklistItems.filter(i => cl2[i]).length;
                        const pct2 = Math.round((done2 / checklistItems.length) * 100);
                        const color2 = pct2 === 100 ? '#22c55e' : pct2 >= 50 ? '#f59e0b' : '#ef4444';
                        // Find or create pie element on the card
                        let cardPieWrap = cardEl.querySelector('.card-pie-wrap');
                        if (!cardPieWrap) {
                            cardPieWrap = document.createElement('div');
                            cardPieWrap.className = 'card-pie-wrap';
                            cardPieWrap.style.cssText = 'display:flex; align-items:center; gap:6px; margin-top:6px;';
                            cardPieWrap.innerHTML = `<div class="card-pie-circle" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;"></div><span class="card-pie-text" style="font-size:0.78rem;font-weight:600;"></span>`;
                            // Insert before card-footer
                            const footer = cardEl.querySelector('.card-footer');
                            if (footer) cardEl.insertBefore(cardPieWrap, footer);
                            else cardEl.appendChild(cardPieWrap);
                        }
                        const circle = cardPieWrap.querySelector('.card-pie-circle');
                        const text = cardPieWrap.querySelector('.card-pie-text');
                        circle.style.background = `conic-gradient(${color2} ${pct2 * 3.6}deg, #e5e7eb ${pct2 * 3.6}deg)`;
                        text.style.color = color2;
                        text.textContent = `${done2}/${checklistItems.length} (${pct2}%)`;
                    }
                };
            });

            content.querySelector('.btn-finalize').onclick = async () => {
                currentFinalizeOrder = order;
                modal.classList.remove('open');

                // Fetch order items
                const itemsRes = await fetch(`/api/orders/${order.id}/items`);
                const { data: items } = await itemsRes.json();

                const listDiv = container.querySelector('#finalize-items-list');
                listDiv.innerHTML = `
                    <table style="width:100%; border-collapse:collapse; font-size:0.9rem">
                        <thead style="background:#f1f5f9">
                            <tr>
                                <th style="padding:6px; text-align:left">Produto</th>
                                <th style="padding:6px; text-align:center">Qtd Pedida</th>
                                <th style="padding:6px; text-align:center">Qtd Gasta</th>
                                <th style="padding:6px; text-align:center">Perda</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, i) => `
                                <tr>
                                    <td style="padding:6px"><b>${item.product_name}</b>${item.color_name ? `<br><small style="color:#92400e;background:#fef3c7;padding:1px 6px;border-radius:10px;font-size:0.75rem;">🎨 ${item.color_name}</small>` : ''}</td>
                                    <td style="padding:6px; text-align:center; background:#f0fdf4">${item.quantity}</td>
                                    <td style="padding:6px; text-align:center">
                                        <input type="number" class="finalize-used-input" data-index="${i}" data-ordered="${item.quantity}" data-product-id="${item.product_id}" data-color-variant-id="${item.color_variant_id || ''}" data-color-name="${item.color_name || ''}" value="${item.quantity}" min="${item.quantity}" style="width:70px; text-align:center; padding:4px; border:1px solid #ccc; border-radius:4px;">
                                    </td>
                                    <td style="padding:6px; text-align:center; font-weight:bold" class="loss-cell" data-index="${i}">0</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;

                // Bind loss detection
                const lossGroup = container.querySelector('#loss-group');
                listDiv.querySelectorAll('.finalize-used-input').forEach(input => {
                    input.oninput = () => {
                        const ordered = parseInt(input.dataset.ordered);
                        const used = parseInt(input.value) || ordered;
                        const loss = Math.max(0, used - ordered);
                        const cell = listDiv.querySelector(`.loss-cell[data-index="${input.dataset.index}"]`);
                        cell.textContent = loss;
                        cell.style.color = loss > 0 ? '#b91c1c' : '#888';

                        // Show/hide loss justification
                        const anyLoss = [...listDiv.querySelectorAll('.finalize-used-input')].some(inp => {
                            return (parseInt(inp.value) || 0) > parseInt(inp.dataset.ordered);
                        });
                        lossGroup.style.display = anyLoss ? 'block' : 'none';
                    };
                });

                lossGroup.style.display = 'none';
                container.querySelector('#finalize-loss-justification').value = '';
                finalizeModal.classList.add('open');
            };
            } // end else (!isVendedor) for producao
        } else if (order.status === 'em_balcao') {
            content.querySelector('#conclude-form').onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData();
                const fileField = content.querySelector('#pickup-photo');
                formData.append('pickup_photo', fileField.files[0]);

                await fetch(`/api/orders/${order.id}/conclude`, {
                    method: 'POST',
                    body: formData
                });
                modal.classList.remove('open');
                loadOrders();
            };
        }

        // Archive button (for finalized orders)
        const archiveBtn = content.querySelector('.btn-archive');
        if (archiveBtn) {
            archiveBtn.onclick = async () => {
                if (!confirm('Arquivar este pedido?')) return;
                await fetch(`/api/orders/${order.id}/archive`, { method: 'PUT' });
                modal.classList.remove('open');
                loadOrders();
            };
        }

        // Load Comments
        loadComments(order.id);

        // Setup Comment Form
        const commentForm = container.querySelector('#comment-form');
        commentForm.onsubmit = async (e) => {
            e.preventDefault();
            const msg = container.querySelector('#comment-input').value;
            await fetch(`/api/orders/${order.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, message: msg })
            });
            container.querySelector('#comment-input').value = '';
            loadComments(order.id);
        };

        modal.classList.add('open');
    };

    const loadComments = async (orderId) => {
        const res = await fetch(`/api/orders/${orderId}/comments`);
        const { data } = await res.json();
        const list = container.querySelector('#comments-list');
        list.innerHTML = data.map(c => `
            <div class="comment">
                <span class="comment-author">${c.user_name}</span>
                <span class="comment-time">${new Date(c.created_at).toLocaleString()}</span>
                <div class="comment-text">${c.message}</div>
            </div>
        `).join('');
    };

    // CART SYSTEM — only for users who can create orders
    let cart = [];
    const cartTbody = container.querySelector('#cart-tbody');
    const totalInput = container.querySelector('#cart-total-input');
    const totalAutoLabel = container.querySelector('#cart-total-auto');
    const createBtn = container.querySelector('#btn-create-order');
    const hasOrderForm = !!cartTbody;

    const getDeadline = () => {
        const checked = container.querySelector('input[name="deadline_option"]:checked');
        return checked ? checked.value : '3D';
    };

    const getProductPrice = (product) => {
        const type = getDeadline();
        const p1 = parseFloat(product.price_1_day) || 0;
        const p3 = parseFloat(product.price_3_days) || parseFloat(product.price) || 0;
        const finalP1 = p1 > 0 ? p1 : (p3 * 1.5); // Fallback
        return type === '1D' ? finalP1 : p3;
    };

    const renderCart = () => {
        if (!hasOrderForm) return;
        cartTbody.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#999">Nenhum item adicionado</td></tr>';
            createBtn.disabled = true;
        } else {
            createBtn.disabled = false;
            cart.forEach((item, index) => {
                const price = getProductPrice(item.product);
                const subtotal = price * item.qty;
                total += subtotal;

                cartTbody.innerHTML += `
                    <tr>
                         <td style="padding:4px">${item.product.name}${item.color_name ? `<br><small style="color:#92400e;background:#fef3c7;padding:1px 6px;border-radius:10px;font-size:0.75rem;">🎨 ${item.color_name}</small>` : ''}</td>
                         <td style="padding:4px; text-align:center">${item.qty}</td>
                         <td style="padding:4px; text-align:right">R$ ${subtotal.toFixed(2)}</td>
                         <td style="padding:4px; text-align:center">
                            <button type="button" class="btn btn-sm btn-secondary remove-item" data-index="${index}" style="padding:0 4px; background:#fee2e2; color:#b91c1c; border:none">&times;</button>
                         </td>
                    </tr>
                `;
            });

            // Remove handlers
            cartTbody.querySelectorAll('.remove-item').forEach(btn => {
                btn.onclick = () => {
                    cart.splice(parseInt(btn.dataset.index), 1);
                    renderCart();
                };
            });
        }

        totalInput.value = total.toFixed(2);
        totalAutoLabel.textContent = total > 0 ? `Sugestão: R$ ${total.toFixed(2)}` : '';
    };

    // Deadline Toggle -> Recalculate
    container.querySelectorAll('input[name="deadline_option"]').forEach(radio => {
        radio.onchange = renderCart;
    });

    // === COLOR SELECTOR FOR PULSEIRAS ===
    const colorSelectContainer = container.querySelector('#color-select-container');
    const colorSelect = container.querySelector('#color-select');

    const isPulseiraProd = (product) => product && (product.type || '').toLowerCase().includes('pulseira');

    const productSelectEl = container.querySelector('#product-select');
    if (productSelectEl) productSelectEl.addEventListener('change', async (e) => {
        const pid = e.target.value;
        if (!pid) {
            colorSelectContainer.style.display = 'none';
            return;
        }
        const product = loadedProducts.find(p => p.id == pid);
        if (!product || !isPulseiraProd(product)) {
            colorSelectContainer.style.display = 'none';
            return;
        }
        // It's a pulseira — load colors
        colorSelectContainer.style.display = 'block';
        colorSelect.innerHTML = '<option value="">Carregando...</option>';
        try {
            const res = await fetch(`/api/products/${pid}/colors`);
            const { data } = await res.json();
            if (data.length === 0) {
                colorSelect.innerHTML = '<option value="">Nenhuma cor cadastrada</option>';
            } else {
                colorSelect.innerHTML = data.map(v =>
                    `<option value="${v.id}" data-color="${v.color}" data-qty="${v.quantity}">${v.color} (estoque: ${v.quantity})</option>`
                ).join('');
            }
        } catch {
            colorSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    });

    // Add Item Logic
    const btnAddItem = container.querySelector('#btn-add-item');
    if (btnAddItem) btnAddItem.onclick = () => {
        const productSelect = container.querySelector('#product-select');
        const qtyInput = container.querySelector('#item-qty');
        const warning = container.querySelector('#stock-warning');

        const pid = productSelect.value;
        const qty = parseInt(qtyInput.value) || 1;

        if (!pid) return;

        const product = loadedProducts.find(p => p.id == pid);
        if (!product) return;

        let color_variant_id = null;
        let color_name = null;

        if (isPulseiraProd(product)) {
            const selectedColorOpt = colorSelect.options[colorSelect.selectedIndex];
            if (!selectedColorOpt || !selectedColorOpt.value) {
                alert('Selecione a cor da pulseira antes de adicionar.');
                return;
            }
            color_variant_id = parseInt(selectedColorOpt.value);
            color_name = selectedColorOpt.dataset.color;
        }

        cart.push({ product, qty, color_variant_id, color_name });
        renderCart();

        qtyInput.value = 1;
        warning.innerText = '';
    };


    const finalizeModal = container.querySelector('#finalize-modal');
    const finalizeForm = container.querySelector('#finalize-form');
    let currentFinalizeOrder = null;

    if (finalizeForm) finalizeForm.onsubmit = async (e) => {
        e.preventDefault();
        const inputs = container.querySelectorAll('.finalize-used-input');
        const items = [...inputs].map(inp => ({
            product_id: parseInt(inp.dataset.productId),
            ordered: parseInt(inp.dataset.ordered),
            used: parseInt(inp.value) || parseInt(inp.dataset.ordered),
            color_variant_id: inp.dataset.colorVariantId ? parseInt(inp.dataset.colorVariantId) : null,
            color_name: inp.dataset.colorName || null
        }));

        const loss_justification = container.querySelector('#finalize-loss-justification').value;

        const body = { items, loss_justification };

        try {
            const res = await fetch(`/api/orders/${currentFinalizeOrder.id}/finalize`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                alert('Erro ao enviar para balcão');
                return;
            }

            finalizeModal.classList.remove('open');
            printLabel(currentFinalizeOrder);
            loadOrders();
        } catch (err) {
            alert('Erro de conexão: ' + err.message);
        }
    };


    // Quick Client Logic — only for order-creating users
    const quickClientModal = container.querySelector('#quick-client-modal');
    const btnQuickClient = container.querySelector('#btn-quick-client');
    if (btnQuickClient) {
        btnQuickClient.onclick = () => {
            quickClientModal.classList.add('open');
        };
    }

    const quickClientFormEl = container.querySelector('#quick-client-form');
    if (quickClientFormEl) quickClientFormEl.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData);
        body.origin = 'Balcao'; // Default

        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const json = await res.json();

        if (json.id) {
            // Success — reload client list and auto-select the new client
            await fetchSelectData();
            if (window._kanbanSelectClientById) window._kanbanSelectClientById(json.id);
            quickClientModal.classList.remove('open');
            e.target.reset();
        } else {
            alert('Erro ao criar cliente: ' + (json.error || 'Desconhecido'));
        }
    };

    // === Accumulated attachment list ===
    let attachedFiles = [];

    const renderAttachmentPreview = () => {
        const preview = container.querySelector('#attachment-preview');
        if (!preview) return;
        preview.innerHTML = '';
        attachedFiles.forEach((file, idx) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:4px; width:90px; position:relative;';

            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '✕';
            removeBtn.style.cssText = 'position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:50%; background:#ef4444; color:white; border:none; cursor:pointer; font-size:10px; line-height:1; display:flex; align-items:center; justify-content:center; z-index:1;';
            removeBtn.onclick = () => { attachedFiles.splice(idx, 1); renderAttachmentPreview(); };
            wrapper.appendChild(removeBtn);

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.cssText = 'width:70px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #ccc;';
                wrapper.appendChild(img);
            } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                // PDF: show real first-page preview via iframe
                const iframeWrap = document.createElement('div');
                iframeWrap.style.cssText = 'width:70px; height:70px; border-radius:6px; overflow:hidden; border:1px solid #ccc; background:#fff; position:relative;';
                const iframe = document.createElement('iframe');
                iframe.src = URL.createObjectURL(file) + '#toolbar=0&navpanes=0&scrollbar=0&page=1&zoom=35';
                iframe.style.cssText = 'width:200px; height:200px; border:none; transform:scale(0.35); transform-origin:top left; pointer-events:none;';
                iframeWrap.appendChild(iframe);
                const pdfLabel = document.createElement('div');
                pdfLabel.style.cssText = 'position:absolute; bottom:2px; left:0; right:0; text-align:center; font-size:9px; font-weight:700; color:#dc2626; background:rgba(255,255,255,0.85);';
                pdfLabel.textContent = 'PDF';
                iframeWrap.appendChild(pdfLabel);
                wrapper.appendChild(iframeWrap);
            } else if (file.name.toLowerCase().endsWith('.cdr')) {
                // CDR: CorelDRAW styled badge
                const badge = document.createElement('div');
                badge.style.cssText = 'width:70px; height:70px; background:#00b388; border-radius:6px; border:1px solid #009970; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; overflow:hidden;';
                badge.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="46" height="46">
                      <!-- CorelDRAW X ribbon logo approximation -->
                      <g fill="black">
                        <!-- Left ribbon arm -->
                        <path d="M8 10 Q20 10 28 32 Q20 54 8 54 Q14 54 20 48 Q26 42 26 32 Q26 22 20 16 Z"/>
                        <!-- Right ribbon arm -->
                        <path d="M56 10 Q44 10 36 32 Q44 54 56 54 Q50 54 44 48 Q38 42 38 32 Q38 22 44 16 Z"/>
                        <!-- Center cross piece top-left to bottom-right -->
                        <path d="M20 10 Q32 10 44 10 Q38 16 32 24 Q26 16 20 10Z"/>
                        <!-- Center cross piece top-right to bottom-left -->
                        <path d="M20 54 Q32 54 44 54 Q38 48 32 40 Q26 48 20 54Z"/>
                      </g>
                    </svg>
                    <span style="color:white; font-size:9px; font-weight:800; letter-spacing:0.5px;">CDR</span>`;
                wrapper.appendChild(badge);

            } else {
                const badge = document.createElement('div');
                const ext = file.name.split('.').pop().toUpperCase();
                badge.style.cssText = 'width:70px; height:70px; background:#eff6ff; color:#2563eb; border-radius:6px; border:1px solid #bfdbfe; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; gap:4px;';
                badge.innerHTML = `<span style="font-size:1.5rem;">📄</span>${ext}`;
                wrapper.appendChild(badge);
            }

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = file.name.replace(/\.[^/.]+$/, '');
            nameInput.placeholder = 'Nome';
            nameInput.style.cssText = 'width:90px; font-size:0.72rem; padding:2px 4px; border:1px solid #ccc; border-radius:4px; text-align:center; color:#334155;';
            wrapper.appendChild(nameInput);

            preview.appendChild(wrapper);
        });
    };

    // Events
    const orderModal = container.querySelector('#order-modal');
    const btnNewOrder = container.querySelector('#btn-new-order');
    if (btnNewOrder) {
        btnNewOrder.onclick = () => {
            fetchSelectData();
            cart = [];
            renderCart();
            // Clear attachments
            attachedFiles = [];
            const fileInput = container.querySelector('#order-attachments');
            if (fileInput) { fileInput.value = ''; }
            renderAttachmentPreview();
            console.log('Opening Order Modal');
            const internalToggle = container.querySelector('#internal-toggle');
            if (internalToggle) internalToggle.checked = false;
            // Reset internal toggle UI
            const clientRow = container.querySelector('#client-row');
            if (clientRow) clientRow.style.display = '';
            orderModal.classList.add('open');
        };
    }

    // Attachment input — accumulate files
    const orderAttachments = container.querySelector('#order-attachments');
    if (orderAttachments) {
        orderAttachments.addEventListener('change', function () {
            for (const file of this.files) {
                attachedFiles.push(file);
            }
            this.value = ''; // reset so same file can be added again if needed
            renderAttachmentPreview();
        });
    }

    container.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = () => container.querySelector(`#${btn.getAttribute('data-target')}`).classList.remove('open');
    });

    // Internal Service Toggle Logic
    const internalToggleEl = container.querySelector('#internal-toggle');
    if (internalToggleEl) {
    internalToggleEl.onchange = async function () {
        const clientRow = container.querySelector('#client-row');
        const clientIdInput = container.querySelector('#client-select'); // hidden input
        const paymentGroup = container.querySelector('#order-payment-method').closest('.form-group');
        const totalInput = container.querySelector('#cart-total-input');
        if (this.checked) {
            clientRow.style.display = 'none';
            if (paymentGroup) paymentGroup.style.display = 'none';
            totalInput.value = '0';
            totalInput.disabled = true;
            // Find or create INTERNO client
            let internoClient = (window._kanbanClientsRef || []).find(c => c.name.trim().toUpperCase() === 'INTERNO');
            if (!internoClient) {
                const res = await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'INTERNO', phone: '0000000000', origin: 'Interno' })
                });
                const json = await res.json();
                if (json.id) {
                    await fetchSelectData();
                    internoClient = (window._kanbanClientsRef || []).find(c => c.name.trim().toUpperCase() === 'INTERNO');
                }
            }
            if (internoClient) {
                clientIdInput.value = internoClient.id;
            }
        } else {
            clientRow.style.display = '';
            if (paymentGroup) paymentGroup.style.display = '';
            totalInput.disabled = false;
        }
    }; // end internalToggle.onchange
    } // end if (internalToggleEl)

    const orderFormEl = container.querySelector('#order-form');
    if (orderFormEl) orderFormEl.onsubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting Order...');
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData);

        const clientSelect = container.querySelector('#client-select');
        if (!clientSelect.value || clientSelect.value === 'Carregando...') {
            alert('Selecione um cliente');
            return;
        }

        if (cart.length === 0) {
            alert('Adicione pelo menos um item.');
            return;
        }

        const payload = {
            client_id: clientSelect.value,
            description: body.description,
            payment_method: container.querySelector('#internal-toggle').checked ? 'Interno' : container.querySelector('#order-payment-method').value,
            total_value: parseFloat(container.querySelector('#cart-total-input').value) || 0,
            created_by: user.id || 1,
            deadline_option: getDeadline(),
            items: cart.map(i => ({
                product_id: i.product.id,
                quantity: i.qty,
                color_variant_id: i.color_variant_id || null,
                color_name: i.color_name || null
            })),
            is_internal: container.querySelector('#internal-toggle').checked ? 1 : 0
        };

        // Apply 15% discount if client has core_discount
        const selectedClientData = (window._kanbanClientsRef || []).find(c => c.id == clientSelect.value);
        if (selectedClientData && selectedClientData.core_discount) {
            const originalValue = payload.total_value;
            payload.total_value = parseFloat((originalValue * 0.85).toFixed(2));
            payload.discount_value = parseFloat((originalValue - payload.total_value).toFixed(2));
        } else {
            payload.discount_value = 0;
        }

        console.log('Order Payload:', payload);

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            console.log('Order Response:', json);

            if (json.message) {
                // Upload accumulated attachments if any
                if (attachedFiles.length > 0) {
                    const uploadData = new FormData();
                    for (const file of attachedFiles) {
                        uploadData.append('files', file);
                    }
                    await fetch(`/api/orders/${json.group_id}/attachments`, {
                        method: 'POST',
                        body: uploadData
                    });
                    attachedFiles = [];
                }

                orderModal.classList.remove('open');
                e.target.reset();

                // Auto Copy Summary
                const clientName = container.querySelector('#client-search')?.value || 'Cliente';
                const payment = payload.payment_method;
                const total = `R$ ${parseFloat(container.querySelector('#cart-total-input').value || 0).toFixed(2)}`;
                const deadline = payload.deadline_option === '1D' ? '1 Dia (Urgente)' : '3 Dias';

                let summary = `*NOVO PEDIDO - ${clientName}*\n` +
                    `*Prazo:* ${deadline}\n\n` +
                    `*Itens:*\n`;

                cart.forEach(i => {
                    summary += `- ${i.product.name} (${i.qty}x)\n`;
                });

                summary += `\n*Total:* ${total}\n` +
                    `*Pagamento:* ${payment}`;

                navigator.clipboard.writeText(summary).then(() => {
                    alert(`Pedido criado! Resumo copiado para a área de transferência.\nID Grupo: ${json.group_id}`);
                }).catch(err => {
                    console.error('Auto-copy failed', err);
                    alert(`Pedido criado! (Cópia automática falhou: ${err})\nID Grupo: ${json.group_id}`);
                });

                cart = [];
                loadOrders();
            } else {
                console.error('Order Error:', json.error);
                alert('Erro ao criar pedido: ' + json.error);
            }
        } catch (err) {
            console.error('Network Error:', err);
            alert('Erro de conexão: ' + err.message);
        }
    };

    // --- Archived Orders ---
    const archivedSection = container.querySelector('#archived-section');
    const archivedList = container.querySelector('#archived-list');

    const btnArchived = container.querySelector('#btn-archived');
    if (btnArchived) {
        btnArchived.onclick = () => {
            archivedSection.style.display = archivedSection.style.display === 'none' ? 'block' : 'none';
            if (archivedSection.style.display === 'block') loadArchived();
        };
    }
    const btnCloseArchived = container.querySelector('#btn-close-archived');
    if (btnCloseArchived) {
        btnCloseArchived.onclick = () => {
            archivedSection.style.display = 'none';
        };
    }

    const loadArchived = async () => {
        try {
            const res = await fetch('/api/orders/archived');
            const { data } = await res.json();
            if (!data || data.length === 0) {
                archivedList.innerHTML = '<p style="color:#94a3b8; text-align:center;">Nenhum pedido arquivado.</p>';
                return;
            }
            archivedList.innerHTML = data.map(o => `
                <div class="card" style="border-left: 4px solid #94a3b8; opacity:0.85;">
                    <div class="card-header">#${getOrderNum(o)} - ${new Date(o.created_at).toLocaleDateString('pt-BR')}</div>
                    <div class="card-title">${o.client_name || 'Cliente?'}</div>
                    <div class="card-detail" style="font-size:0.85rem; color:#555;">${o.product_name || o.products_summary || '-'}</div>
                    <div class="card-footer">
                        <span>R$ ${(o.total_value || 0).toFixed(2)}</span>
                        <span class="card-badge" style="background:#f1f5f9; color:#64748b">Arquivado</span>
                    </div>
                    <button class="btn btn-delete-archived" data-id="${o.id}" style="margin-top:0.5rem; width:100%; padding:6px; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600;">🗑️ Excluir Pedido</button>
                </div>
            `).join('');

            archivedList.querySelectorAll('.btn-delete-archived').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!confirm('Tem certeza que deseja EXCLUIR este pedido? Esta ação não pode ser desfeita.')) return;
                    try {
                        await fetch(`/api/orders/${btn.dataset.id}`, { method: 'DELETE' });
                        loadArchived();
                    } catch (err) {
                        alert('Erro: ' + err.message);
                    }
                };
            });
        } catch (e) {
            console.error(e);
        }
    };

    // === DRAG-AND-DROP SETUP (producao role only) ===
    const setupDragDrop = () => {
        if (!isProducao) return;
        const draggableColumns = ['col-producao', 'col-finalizado'];
        const statusMap = { 'col-producao': 'producao', 'col-finalizado': 'finalizado' };

        draggableColumns.forEach(colId => {
            const colEl = container.querySelector(`#${colId}`);
            if (!colEl) return;

            colEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                colEl.classList.add('drag-over');
            });
            colEl.addEventListener('dragleave', () => {
                colEl.classList.remove('drag-over');
            });
            colEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                colEl.classList.remove('drag-over');

                const orderId = e.dataTransfer.getData('order-id');
                const fromStatus = e.dataTransfer.getData('order-status');
                const toStatus = statusMap[colId];

                if (!orderId || fromStatus === toStatus) return;

                // Confirm move from finalizado back to producao
                if (toStatus === 'producao' && fromStatus === 'finalizado') {
                    if (!confirm('Deseja mover este pedido de volta para Produção?')) return;
                }

                try {
                    const res = await fetch(`/api/orders/${orderId}/move-status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ new_status: toStatus, user_id: user.id })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const cardEl = container.querySelector(`.card[data-order-id="${orderId}"]`);
                        if (cardEl) {
                            // Move card to target column
                            const targetCol = container.querySelector(`#col-${toStatus} .column-content`);
                            if (targetCol) targetCol.appendChild(cardEl);

                            // Update card CSS class
                            cardEl.className = cardEl.className.replace(/status-\w+/, `status-${toStatus}`);

                            // Update draggability based on new status
                            const isDraggable = (toStatus === 'producao' || toStatus === 'finalizado');
                            cardEl.draggable = isDraggable;
                            cardEl.style.cursor = isDraggable ? 'grab' : 'default';

                            // Update card dragstart data
                            cardEl.replaceWith(cardEl); // force event listener refresh via clone
                            const newCardEl = container.querySelector(`.card[data-order-id="${orderId}"]`);
                            if (newCardEl && isDraggable) {
                                newCardEl.addEventListener('dragstart', (ev) => {
                                    ev.dataTransfer.setData('order-id', orderId);
                                    ev.dataTransfer.setData('order-status', toStatus);
                                    newCardEl.classList.add('dragging');
                                });
                                newCardEl.addEventListener('dragend', () => newCardEl.classList.remove('dragging'));
                            }

                            // Update badge in card footer
                            const badge = container.querySelector(`.card[data-order-id="${orderId}"] .card-badge`);
                            if (badge) {
                                if (toStatus === 'em_balcao') {
                                    badge.textContent = 'Em Balcão';
                                    badge.style.background = '#ffedd5';
                                    badge.style.color = '#c2410c';
                                } else if (toStatus === 'finalizado') {
                                    badge.textContent = 'Finalizado';
                                    badge.style.background = '#f0fdf4';
                                    badge.style.color = '#16a34a';
                                } else if (toStatus === 'producao') {
                                    badge.textContent = '';
                                }
                            }

                            // Update "Movido por" label
                            if (data.moved_by_name) {
                                const movedEl = container.querySelector(`.card[data-order-id="${orderId}"] .card-moved-by`);
                                const label = movedEl || document.createElement('div');
                                if (!movedEl) {
                                    label.className = 'card-moved-by';
                                    label.style.cssText = 'font-size:0.75rem; color:#6b7280; padding:3px 6px; background:#f8fafc; border-top:1px solid #e5e7eb; border-radius:0 0 6px 6px; margin-top:2px;';
                                    const finalCard = container.querySelector(`.card[data-order-id="${orderId}"]`);
                                    if (finalCard) finalCard.appendChild(label);
                                }
                                label.innerHTML = `📦 Movido por: <b>${data.moved_by_name.split(' ')[0]}</b>`;
                            }
                        }

                        // Update column counters
                        const fromCounter = container.querySelector(`#col-${fromStatus} .column-count`);
                        const toCounter = container.querySelector(`#col-${toStatus} .column-count`);
                        if (fromCounter) fromCounter.textContent = Math.max(0, parseInt(fromCounter.textContent || 0) - 1);
                        if (toCounter) toCounter.textContent = parseInt(toCounter.textContent || 0) + 1;

                    } else {
                        const err = await res.json();
                        alert('Erro ao mover pedido: ' + (err.error || 'Desconhecido'));
                    }
                } catch (err) {
                    alert('Erro de conexão: ' + err.message);
                }
            });
        });
    };

    setupDragDrop();
    loadOrders();

    // Auto-refresh: atualiza o quadro a cada 20 segundos
    // Não recarrega se houver um modal aberto (para não interromper o usuário)
    const autoRefreshInterval = setInterval(() => {
        const anyModalOpen = container.querySelector('.modal-overlay.open');
        if (!anyModalOpen) {
            loadOrders();
        }
    }, 20000);

    // Cancela o intervalo quando o container é removido do DOM (troca de tela)
    const stopObserver = new MutationObserver(() => {
        if (!document.body.contains(container)) {
            clearInterval(autoRefreshInterval);
            stopObserver.disconnect();
        }
    });
    stopObserver.observe(document.body, { childList: true, subtree: true });

    return container;
};
