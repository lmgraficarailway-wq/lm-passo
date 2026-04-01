export const initChatWidget = (user, parentContainer) => {
    // Se o usuário for cliente, não mostra o chat interno da equipe
    if (user.role === 'cliente') return;

    // Injetar estilos
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-widget-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            border: none;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            padding: 0;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2));
            color: #7c3aed;
            font-size: 60px;
            width: 60px;
            height: 60px;
        }
        .chat-widget-btn:hover { transform: scale(1.1); }
        .chat-badge {
            position: absolute;
            top: -5px; right: -5px;
            background: #ef4444; color: white;
            font-size: 12px; font-weight: bold;
            width: 24px; height: 24px;
            border-radius: 50%;
            display: none; align-items: center; justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .chat-window {
            position: fixed;
            bottom: 100px; right: 30px;
            width: 350px; height: 500px;
            max-height: calc(100vh - 120px);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.8);
            display: flex; flex-direction: column;
            z-index: 9998;
            opacity: 0; pointer-events: none;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chat-window.open {
            opacity: 1; pointer-events: auto;
            transform: translateY(0);
        }
        .chat-header {
            background: linear-gradient(135deg, var(--primary), var(--primary-hover));
            color: white; padding: 15px 20px;
            border-radius: 20px 20px 0 0;
            display: flex; justify-content: space-between; align-items: center;
            font-weight: 600; font-size: 1.1rem;
        }
        .chat-close-btn { background: none; border: none; font-size: 24px; color: white; cursor: pointer; transition: transform 0.2s;}
        .chat-close-btn:hover { transform: rotate(90deg); }
        .chat-body {
            flex: 1; padding: 15px; overflow-y: auto;
            display: flex; flex-direction: column; gap: 10px;
        }
        .chat-bubble {
            max-width: 80%; padding: 10px 14px;
            border-radius: 18px; font-size: 0.9rem;
            position: relative; line-height: 1.4;
            word-wrap: break-word;
        }
        .chat-bubble-mine {
            background: var(--primary); color: white;
            align-self: flex-end; border-bottom-right-radius: 4px;
        }
        .chat-bubble-other {
            background: #f1f5f9; color: #1e293b;
            align-self: flex-start; border-bottom-left-radius: 4px;
        }
        .chat-author { font-size: 0.7rem; opacity: 0.8; margin-bottom: 3px; font-weight: 600; display: block; }
        .chat-footer {
            padding: 15px; border-top: 1px solid rgba(0,0,0,0.05);
            display: flex; gap: 10px; flex-direction: column;
        }
        .chat-input-row { display: flex; gap: 10px; }
        .chat-input {
            flex: 1; padding: 10px 15px;
            border: 1px solid #e2e8f0; border-radius: 20px;
            outline: none; background: #f8fafc; transition: border 0.2s;
        }
        .chat-input:focus { border-color: var(--primary); }
        .chat-send-btn {
            background: transparent; color: #7c3aed; border: none;
            padding: 0 10px; font-size: 24px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s, color 0.2s;
        }
        .chat-send-btn:hover { transform: scale(1.1); color: #6d28d9; }
        .typing-indicator {
            font-size: 0.75rem; color: var(--text-secondary);
            height: 15px; font-style: italic; overflow: hidden;
            display: flex; align-items: center;
        }
        .dot { animation: blink 1.4s infinite; opacity: 0.2; margin: 0 1px; font-size: 1.2em; font-weight: bold;}
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 50% { opacity: 1; } }
        /* Toast Notification override if needed */
        .chat-toast {
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.9); color: white;
            padding: 12px 24px; border-radius: 30px; z-index: 10000;
            font-size: 0.9rem; display: flex; align-items: center; gap: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            animation: slideDownToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes slideDownToast {
            from { top: -50px; opacity: 0; }
            to { top: 20px; opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Estrutura HTML
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <button class="chat-widget-btn" id="team-chat-btn">
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 60px; height: 60px;">
                <ion-icon name="chatbox" style="font-size: 60px; color: #7c3aed; position: absolute; z-index: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));"></ion-icon>
                <img src="/logo.png" style="width: 26px; height: 26px; position: absolute; z-index: 2; margin-bottom: 5px; border-radius: 4px; object-fit: contain; filter: grayscale(100%) brightness(0) invert(1);">
            </div>
            <div class="chat-badge" id="chat-badge">0</div>
        </button>

        <div class="chat-window" id="team-chat-window">
            <div class="chat-header">
                <div>
                    <span style="display:block">Chat da Equipe</span>
                    <span style="font-size:0.7rem; font-weight:normal; opacity:0.8">Online</span>
                </div>
                <button class="chat-close-btn" id="team-chat-close"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <div class="chat-body" id="team-chat-body"></div>
            <div class="chat-footer">
                <div class="typing-indicator" id="team-chat-typing"></div>
                <form class="chat-input-row" id="team-chat-form">
                    <input type="text" class="chat-input" id="team-chat-input" placeholder="Nova mensagem..." autocomplete="off">
                    <button type="submit" class="chat-send-btn"><ion-icon name="send"></ion-icon></button>
                </form>
            </div>
        </div>
    `;
    parentContainer.appendChild(wrapper);

    // Referências DOM
    const btn = wrapper.querySelector('#team-chat-btn');
    const badge = wrapper.querySelector('#chat-badge');
    const windowEl = wrapper.querySelector('#team-chat-window');
    const closeBtn = wrapper.querySelector('#team-chat-close');
    const form = wrapper.querySelector('#team-chat-form');
    const input = wrapper.querySelector('#team-chat-input');
    const body = wrapper.querySelector('#team-chat-body');
    const typingIndicator = wrapper.querySelector('#team-chat-typing');

    let unreadCount = 0;
    let isOpen = false;
    let typingTimeout;
    let evtSource = null;
    
    // Funções UI
    const scrollToBottom = () => {
        body.scrollTop = body.scrollHeight;
    };

    const addMessage = (msgObj) => {
        const isMine = msgObj.user_id === user.id;
        const div = document.createElement('div');
        div.className = `chat-bubble ${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}`;
        
        let authorHtml = '';
        if (!isMine) {
            authorHtml = `<span class="chat-author">${msgObj.user_name} (${msgObj.user_role})</span>`;
        }
        
        div.innerHTML = `
            ${authorHtml}
            ${msgObj.message.replace(/\n/g, '<br>')}
        `;
        body.appendChild(div);
        scrollToBottom();
    };

    const showToast = (name, role, msg) => {
        const toast = document.createElement('div');
        toast.className = 'chat-toast';
        toast.innerHTML = `
            <ion-icon name="chatbubble-ellipses" style="color:var(--primary); font-size:1.2rem; margin-right: 8px;"></ion-icon>
            <div><strong>${name} (${role}):</strong> ${msg.substring(0, 40)}${msg.length > 40 ? '...' : ''}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    };

    // Toggle Window
    const toggleChat = () => {
        isOpen = !isOpen;
        if (isOpen) {
            windowEl.classList.add('open');
            unreadCount = 0;
            badge.style.display = 'none';
            badge.textContent = '0';
            setTimeout(() => input.focus(), 100);
            scrollToBottom();
        } else {
            windowEl.classList.remove('open');
        }
    };

    btn.onclick = toggleChat;
    closeBtn.onclick = toggleChat;

    // Carregar Histórico
    fetch('/api/chat/history', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        .then(r => r.json())
        .then(data => {
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(addMessage);
            }
        });

    // Enviar mensagem
    form.onsubmit = async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        // Clear typing status instantly
        fetch('/api/chat/typing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isTyping: false, user_id: user.id, user_name: user.name, user_role: user.role })
        });

        try {
            await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, user_id: user.id, user_name: user.name, user_role: user.role })
            });
        } catch(err) { console.error('Error sending message:', err); }
    };

    // Typing Event Emission
    input.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        fetch('/api/chat/typing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isTyping: true, user_id: user.id, user_name: user.name, user_role: user.role })
        }).catch(()=>{});

        typingTimeout = setTimeout(() => {
            fetch('/api/chat/typing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isTyping: false, user_id: user.id, user_name: user.name, user_role: user.role })
            }).catch(()=>{});
        }, 1500);
    });

    // SSE Connection Setup
    evtSource = new EventSource('/api/chat/stream');

    evtSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
            addMessage(data);
            if (!isOpen && data.user_id !== user.id) {
                unreadCount++;
                badge.style.display = 'flex';
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                showToast(data.user_name, data.user_role, data.message);
            }
        } else if (data.type === 'typing') {
            if (data.user_id === user.id) return;
            
            if (data.isTyping) {
                typingIndicator.innerHTML = `<span>${data.user_name} (${data.user_role}) está digitando</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>`;
            } else {
                typingIndicator.innerHTML = '';
            }
        }
    };
    
    evtSource.onerror = (e) => {
        console.warn('SSE connection error or closed');
    };
};
