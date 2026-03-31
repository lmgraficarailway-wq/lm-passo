export const render = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.createElement('div');
    container.className = 'catalogue-view';

    const isAdmin = user && user.role === 'master';

    let html = `
        <div class="view-header" style="margin-bottom: 1.5rem;">
            <div>
                <div class="view-title">Catálogo Digital</div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">
                    Inspirações, modelos e peças prontas para compartilhar com seus clientes.
                </p>
            </div>
            ${isAdmin ? `
                <button class="btn btn-primary" id="add-catalogue-btn" style="width:auto;">
                    <ion-icon name="add-outline"></ion-icon> Adicionar Novo Item
                </button>
            ` : ''}
        </div>

        <div id="catalogue-grid" class="catalogue-grid">
            <p style="color:#64748b; padding:2rem;">Carregando catálogo...</p>
        </div>

        <!-- Modal para Adicionar/Editar Item (Somente Admin) -->
        ${isAdmin ? `
        <div class="modal-overlay" id="catalogue-modal">
            <div class="modal" style="max-width: 500px">
                <div class="modal-header">
                    <h3 id="cat-modal-title">Novo Item</h3>
                    <button class="modal-close" id="cat-close">&times;</button>
                </div>
                <form id="catalogue-form">
                    <div class="form-group" id="file-group">
                        <label>Upload de Arte / Foto</label>
                        <input type="file" id="cat-file" accept="image/*" style="padding: 0.5rem">
                    </div>
                    <div class="form-group">
                        <label>Título / Nome Interno</label>
                        <input type="text" id="cat-title" placeholder="Ex: Copo Twister Degrade" required>
                    </div>
                    <div class="form-group">
                        <label>Descrição Promocional (Texto para Copiar)</label>
                        <textarea id="cat-desc" rows="5" placeholder="Digite o texto de venda que acompanhará a imagem..." required></textarea>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cat-cancel" style="width:auto">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="width:auto">Salvar Item</button>
                    </div>
                </form>
            </div>
        </div>
        ` : ''}
    `;

    container.innerHTML = html;

    const loadItems = async () => {
        try {
            const grid = container.querySelector('#catalogue-grid');
            const res = await fetch('/api/catalogue');
            const { data } = await res.json();

            if (data.length === 0) {
                grid.innerHTML = '<p style="color:#64748b; padding:2rem; width:100%; text-align:center;">O catálogo está vazio no momento.</p>';
                return;
            }

            grid.innerHTML = data.map(item => `
                <div class="catalogue-card">
                    <div class="catalogue-image-wrapper">
                        <img src="${item.image_url}" alt="${item.title}" class="catalogue-image">
                        ${isAdmin ? `
                            <button class="cat-delete-btn" data-id="${item.id}" title="Excluir">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        ` : ''}
                    </div>
                    <div class="catalogue-content">
                        <h4 class="catalogue-title">${item.title}</h4>
                        <p class="catalogue-desc">${item.description.replace(/\\n/g, '<br>')}</p>
                    </div>
                    <div class="catalogue-actions">
                        <button class="btn btn-secondary cat-copy-btn" data-img="${item.image_url}" data-desc="${encodeURIComponent(item.description)}">
                            <ion-icon name="copy-outline"></ion-icon> Copiar
                        </button>
                        <button class="btn btn-primary cat-share-btn" data-img="${item.image_url}" data-desc="${encodeURIComponent(item.description)}">
                            <ion-icon name="logo-whatsapp"></ion-icon> Partilhar
                        </button>
                    </div>
                </div>
            `).join('');

            // Attach listeners to items
            attachItemEvents();

        } catch (err) {
            console.error('Erro ao carregar catálogo:', err);
        }
    };

    const attachItemEvents = () => {
        // Admin Delete
        if (isAdmin) {
            container.querySelectorAll('.cat-delete-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    const id = e.currentTarget.dataset.id;
                    if (confirm('Tem certeza que deseja excluir esta arte do catálogo?')) {
                        try {
                            const res = await fetch(`/api/catalogue/${id}`, { method: 'DELETE' });
                            if (res.ok) {
                                loadItems();
                                if(window.showToastAlert) window.showToastAlert('Item excluído', 'green');
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                };
            });
        }

        // Helper function to reliably copy image + text
        const copyToClipboard = async (imgUrl, textDesc) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = imgUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

            if (navigator.clipboard && window.ClipboardItem) {
                const item = new ClipboardItem({
                    'image/png': pngBlob,
                    'text/plain': new Blob([textDesc], { type: 'text/plain' })
                });
                await navigator.clipboard.write([item]);
                return true;
            } else {
                throw new Error('Clipboard API avançada ausente no navegador.');
            }
        };

        // Copy
        container.querySelectorAll('.cat-copy-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const imgUrl = e.currentTarget.dataset.img;
                const desc = decodeURIComponent(e.currentTarget.dataset.desc);
                const originalText = btn.innerHTML;
                
                btn.innerHTML = '<ion-icon name="sync-outline"></ion-icon> Copiando...';
                
                try {
                    await copyToClipboard(imgUrl, desc);
                    btn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Copiado!';
                    if (window.showToastAlert) window.showToastAlert('Imagem copiada! Ao colar (CTRL+V) nos chats que suportam, o texto pode ir junto.', 'green');
                } catch (err) {
                    console.warn('Fallback copy error:', err);
                    if (navigator.clipboard) navigator.clipboard.writeText(desc);
                    btn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Texto Copiado';
                    if (window.showToastAlert) window.showToastAlert('Erro ao copiar imagem pelo navegador. Apenas o texto foi copiado.', 'orange');
                }

                setTimeout(() => { btn.innerHTML = originalText; }, 3000);
            };
        });

        // Share
        container.querySelectorAll('.cat-share-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const imgUrl = e.currentTarget.dataset.img;
                const desc = decodeURIComponent(e.currentTarget.dataset.desc);
                
                // Web Share API if on mobile
                if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
                    try {
                        const r = await fetch(imgUrl);
                        const blob = await r.blob();
                        const file = new File([blob], 'catalogo_lm_passo.png', { type: blob.type });
                        await navigator.share({
                            title: 'LM PASSO',
                            text: desc,
                            files: [file]
                        });
                        return;
                    } catch (err) {} // ignore aborts or fallback
                }

                // Fallback Window Open WhatsApp Link
                const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(desc)}`;
                window.open(waLink, '_blank');
            };
        });
    };

    // Admin Add Logic
    if (isAdmin) {
        const modal = container.querySelector('#catalogue-modal');
        const openBtn = container.querySelector('#add-catalogue-btn');
        const closeBtn = container.querySelector('#cat-close');
        const cancelBtn = container.querySelector('#cat-cancel');
        const form = container.querySelector('#catalogue-form');

        const closeModal = () => {
            modal.classList.remove('open');
            form.reset();
        };

        openBtn.onclick = () => modal.classList.add('open');
        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;

        form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const formData = new FormData();
            const fileInput = container.querySelector('#cat-file');
            
            if (fileInput.files.length === 0) {
                alert('Anexe uma imagem!');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Salvar Item';
                return;
            }

            formData.append('image', fileInput.files[0]);
            formData.append('title', container.querySelector('#cat-title').value);
            formData.append('description', container.querySelector('#cat-desc').value);

            try {
                const res = await fetch('/api/catalogue', {
                    method: 'POST',
                    body: formData
                });
                
                if (res.ok) {
                    if(window.showToastAlert) window.showToastAlert('Item salvo com sucesso', 'green');
                    closeModal();
                    loadItems();
                } else {
                    const fail = await res.json();
                    alert(fail.error || 'Erro ao enviar foto');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão ao salvar.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Salvar Item';
            }
        };
    }

    loadItems();

    return container;
};
