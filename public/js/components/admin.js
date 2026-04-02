export const render = () => {
    const container = document.createElement('div');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const ROLES = [
        { value: 'master',     label: '🔑 Master' },
        { value: 'financeiro', label: '💰 Financeiro' },
        { value: 'producao',   label: '🏭 Produção' },
        { value: 'vendedor',   label: '🛒 Vendedor' },
        { value: 'interno',    label: '📋 Interno' },
    ];

    const roleLabel = (role) => {
        const r = ROLES.find(r => r.value === role);
        return r ? r.label : role;
    };

    const roleOptions = (selected = '') =>
        ROLES.map(r => `<option value="${r.value}" ${selected === r.value ? 'selected' : ''}>${r.label}</option>`).join('');

    container.innerHTML = `
        <div class="view-header">
            <div class="view-title">⚙️ Configurações (Admin)</div>
        </div>

        <div style="max-width:700px">

            <!-- Backup Card -->
            <div style="background:linear-gradient(135deg,#1e3a5f,#1e40af); color:white; border-radius:10px; padding:1.25rem 1.5rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:1.05rem; font-weight:700; margin-bottom:0.25rem;">🛡️ Backup do Banco de Dados</div>
                    <div style="font-size:0.85rem; opacity:0.85;">Faça o download do arquivo SQLite com todos os dados do sistema.</div>
                </div>
                <button id="btn-backup-db" style="background:white; color:#1e40af; border:none; padding:0.55rem 1.1rem; border-radius:7px; font-weight:700; cursor:pointer; font-size:0.9rem; white-space:nowrap;">⬇️ Baixar Backup</button>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0; color:#334155">👥 Usuários do Sistema</h3>
                <button class="btn btn-primary" id="btn-new-user" style="width:auto;">+ Novo Usuário</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Usuário</th>
                        <th>Nome</th>
                        <th>Perfil</th>
                        <th>Senha</th>
                        <th style="text-align:right">Ações</th>
                    </tr>
                </thead>
                <tbody id="users-list">
                    <tr><td colspan="5">Carregando...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal: Novo Usuário -->
        <div class="modal-overlay" id="new-user-modal">
            <div class="modal" style="max-width:420px">
                <div class="modal-header">
                    <h3>Novo Usuário</h3>
                    <button class="modal-close" id="new-user-close">&times;</button>
                </div>
                <form id="new-user-form">
                    <div class="form-group">
                        <label>Nome completo</label>
                        <input type="text" id="nu-name" required placeholder="Ex: João Silva">
                    </div>
                    <div class="form-group">
                        <label>Username (login)</label>
                        <input type="text" id="nu-username" required placeholder="Ex: joao" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Perfil</label>
                        <select id="nu-role" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;">
                            ${roleOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Senha</label>
                        <input type="password" id="nu-password" required minlength="4" placeholder="Mínimo 4 caracteres" autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label>Confirmar Senha</label>
                        <input type="password" id="nu-confirm" required minlength="4" placeholder="Repita a senha">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%">Criar Usuário</button>
                </form>
            </div>
        </div>

        <!-- Modal: Editar Perfil -->
        <div class="modal-overlay" id="role-modal">
            <div class="modal" style="max-width:360px">
                <div class="modal-header">
                    <h3>Editar Perfil</h3>
                    <button class="modal-close" id="role-close">&times;</button>
                </div>
                <form id="role-form">
                    <input type="hidden" id="role-user-id">
                    <p style="margin-bottom:1rem" id="role-user-label"></p>
                    <div class="form-group">
                        <label>Perfil</label>
                        <select id="role-select" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;">
                            ${roleOptions()}
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%">Salvar Perfil</button>
                </form>
            </div>
        </div>

        <!-- Modal: Trocar Senha -->
        <div class="modal-overlay" id="pw-modal">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <h3>Trocar Senha</h3>
                    <button class="modal-close" id="pw-close">&times;</button>
                </div>
                <form id="pw-form">
                    <input type="hidden" id="pw-user-id">
                    <p style="margin-bottom:1rem" id="pw-user-label"></p>
                    <div class="form-group">
                        <label>Nova Senha</label>
                        <input type="password" id="pw-new" required minlength="4" placeholder="Mínimo 4 caracteres">
                    </div>
                    <div class="form-group">
                        <label>Confirmar Nova Senha</label>
                        <input type="password" id="pw-confirm" required minlength="4" placeholder="Repita a senha">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%">Salvar Nova Senha</button>
                </form>
            </div>
        </div>
    `;

    const newUserModal = container.querySelector('#new-user-modal');
    const roleModal    = container.querySelector('#role-modal');
    const pwModal      = container.querySelector('#pw-modal');

    // ── Close Buttons ──────────────────────────────────────────────────────────
    container.querySelector('#new-user-close').onclick = () => newUserModal.classList.remove('open');
    container.querySelector('#role-close').onclick     = () => roleModal.classList.remove('open');
    container.querySelector('#pw-close').onclick       = () => pwModal.classList.remove('open');

    // ── Load Users ─────────────────────────────────────────────────────────────
    const loadUsers = async () => {
        try {
            const res = await fetch('/api/auth/users');
            const { data } = await res.json();
            const tbody = container.querySelector('#users-list');

            // Fetch passwords (master only)
            let passwordMap = {};
            try {
                const pwRes = await fetch('/api/auth/users/passwords');
                if (pwRes.ok) {
                    const pwData = await pwRes.json();
                    (pwData.data || []).forEach(u => { passwordMap[u.id] = u.plain_password || ''; });
                }
            } catch(e) {}

            tbody.innerHTML = data.map(u => {
                const pw = passwordMap[u.id] || '';
                const hasPw = pw.length > 0;
                return `
                <tr>
                    <td><b>${u.username}</b></td>
                    <td>${u.name}</td>
                    <td>${roleLabel(u.role)}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.35rem;">
                            <span class="pw-mask" data-id="${u.id}" style="
                                font-family:monospace;
                                font-size:0.82rem;
                                background:#f1f5f9;
                                border:1px solid #cbd5e1;
                                border-radius:5px;
                                padding:2px 8px;
                                letter-spacing:2px;
                                color:#475569;
                                min-width:60px;
                                display:inline-block;
                            ">${hasPw ? '••••••' : '—'}</span>
                            ${hasPw ? `<button class="btn-eye" data-id="${u.id}" data-pw="${pw.replace(/"/g,'&quot;')}" title="Ver senha" style="
                                background:none;
                                border:none;
                                cursor:pointer;
                                font-size:1rem;
                                padding:2px 4px;
                                color:#64748b;
                                border-radius:4px;
                                transition:color 0.2s;
                            ">👁️</button>` : ''}
                        </div>
                    </td>
                    <td style="text-align:right">
                        <div style="display:flex; gap:0.4rem; justify-content:flex-end; flex-wrap:wrap;">
                            <button class="btn btn-secondary btn-sm btn-edit-role"
                                data-id="${u.id}" data-name="${u.name}" data-username="${u.username}" data-role="${u.role}"
                                style="padding:4px 10px; font-size:0.8rem;">
                                ✏️ Perfil
                            </button>
                            <button class="btn btn-secondary btn-sm btn-change-pw"
                                data-id="${u.id}" data-name="${u.name}" data-username="${u.username}"
                                style="padding:4px 10px; font-size:0.8rem;">
                                🔒 Senha
                            </button>
                            ${u.id !== currentUser.id ? `
                            <button class="btn btn-sm btn-delete-user"
                                data-id="${u.id}" data-name="${u.name}"
                                style="padding:4px 10px; font-size:0.8rem; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; border-radius:6px;">
                                🗑️
                            </button>` : ''}
                        </div>
                    </td>
                </tr>
                `;
            }).join('');

            // Eye toggle buttons
            tbody.querySelectorAll('.btn-eye').forEach(btn => {
                let visible = false;
                btn.onclick = () => {
                    visible = !visible;
                    const mask = tbody.querySelector(`.pw-mask[data-id="${btn.dataset.id}"]`);
                    if (mask) {
                        mask.textContent = visible ? btn.dataset.pw : '••••••';
                        mask.style.letterSpacing = visible ? '0' : '2px';
                        mask.style.color = visible ? '#0f172a' : '#475569';
                        mask.style.fontWeight = visible ? '700' : 'normal';
                    }
                    btn.textContent = visible ? '🙈' : '👁️';
                };
            });

            // Edit Role
            tbody.querySelectorAll('.btn-edit-role').forEach(btn => {
                btn.onclick = () => {
                    container.querySelector('#role-user-id').value = btn.dataset.id;
                    container.querySelector('#role-user-label').innerHTML = `Usuário: <b>${btn.dataset.name}</b> (${btn.dataset.username})`;
                    container.querySelector('#role-select').value = btn.dataset.role;
                    roleModal.classList.add('open');
                };
            });

            // Change Password
            tbody.querySelectorAll('.btn-change-pw').forEach(btn => {
                btn.onclick = () => {
                    container.querySelector('#pw-user-id').value = btn.dataset.id;
                    container.querySelector('#pw-user-label').innerHTML = `Usuário: <b>${btn.dataset.name}</b> (${btn.dataset.username})`;
                    container.querySelector('#pw-new').value = '';
                    container.querySelector('#pw-confirm').value = '';
                    pwModal.classList.add('open');
                };
            });

            // Delete User
            tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm(`Excluir o usuário "${btn.dataset.name}"? Esta ação não pode ser desfeita.`)) return;
                    try {
                        const res = await fetch(`/api/auth/users/${btn.dataset.id}`, { method: 'DELETE' });
                        const json = await res.json();
                        if (res.ok) {
                            alert('✅ Usuário excluído.');
                            loadUsers();
                        } else {
                            alert('Erro: ' + (json.error || 'Falha ao excluir'));
                        }
                    } catch (err) {
                        alert('Erro de conexão: ' + err.message);
                    }
                };
            });

        } catch (e) {
            console.error(e);
        }
    };

    // ── Novo Usuário ───────────────────────────────────────────────────────────
    container.querySelector('#btn-new-user').onclick = () => {
        container.querySelector('#new-user-form').reset();
        newUserModal.classList.add('open');
    };

    container.querySelector('#new-user-form').onsubmit = async (e) => {
        e.preventDefault();
        const name     = container.querySelector('#nu-name').value.trim();
        const username = container.querySelector('#nu-username').value.trim();
        const role     = container.querySelector('#nu-role').value;
        const password = container.querySelector('#nu-password').value;
        const confirm  = container.querySelector('#nu-confirm').value;

        if (password !== confirm) { alert('As senhas não coincidem!'); return; }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, role, password })
            });
            const json = await res.json();
            if (res.ok) {
                alert('✅ Usuário criado com sucesso!');
                newUserModal.classList.remove('open');
                loadUsers();
            } else {
                alert('Erro: ' + (json.error || 'Falha ao criar usuário'));
            }
        } catch (err) {
            alert('Erro de conexão: ' + err.message);
        }
    };

    // ── Editar Perfil ──────────────────────────────────────────────────────────
    container.querySelector('#role-form').onsubmit = async (e) => {
        e.preventDefault();
        const id   = container.querySelector('#role-user-id').value;
        const role = container.querySelector('#role-select').value;
        try {
            const res = await fetch(`/api/auth/users/${id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });
            const json = await res.json();
            if (res.ok) {
                alert('✅ Perfil atualizado!');
                roleModal.classList.remove('open');
                loadUsers();
            } else {
                alert('Erro: ' + (json.error || 'Falha ao atualizar perfil'));
            }
        } catch (err) {
            alert('Erro de conexão: ' + err.message);
        }
    };

    // ── Trocar Senha ───────────────────────────────────────────────────────────
    container.querySelector('#pw-form').onsubmit = async (e) => {
        e.preventDefault();
        const newPw    = container.querySelector('#pw-new').value;
        const confirmPw = container.querySelector('#pw-confirm').value;

        if (newPw !== confirmPw) { alert('As senhas não coincidem!'); return; }

        const userId = container.querySelector('#pw-user-id').value;
        try {
            const res = await fetch(`/api/auth/users/${userId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_password: newPw })
            });
            const json = await res.json();
            if (res.ok) {
                alert('✅ Senha alterada com sucesso!');
                pwModal.classList.remove('open');
            } else {
                alert('Erro: ' + (json.error || 'Falha ao alterar senha'));
            }
        } catch (err) {
            alert('Erro de conexão: ' + err.message);
        }
    };

    // Backup Handler
    const btnBackup = container.querySelector('#btn-backup-db');
    if (btnBackup) {
        btnBackup.onclick = () => {
            const token = localStorage.getItem('token');
            if (!token) { alert('Sessão expirada. Faça login novamente.'); return; }
            const url = `/api/backup/db?token=${encodeURIComponent(token)}`;
            const a = document.createElement('a');
            a.href = url;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    }

    loadUsers();
    return container;
};
