// ==UserScript==
// @name         Website Path Scanner
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Lightweight web path scanner with remote and on-the-fly dictionary modes
// @author       FengPwner
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

(function () {
    'use strict';

    const errorKeywords = ['not found', '404', "doesn't exist", 'page cannot be found', 'page not found', 'error', 'not exist', 'forbidden'];
    const loginKeywords = ['login', 'sign in', 'username', 'password', 'log in', 'signin', 'authenticate'];

    const seedWords = ['admin', 'api', 'app', 'backup', 'config', 'console', 'dashboard', 'data', 'db', 'dev', 'files', 'home', 'login', 'manage', 'panel', 'public', 'server', 'setup', 'static', 'status', 'system', 'test', 'tmp', 'upload', 'user', 'users'];
    const extensions = ['', '.php', '.html', '.json', '.txt', '.bak', '.old', '.zip', '.sql'];
    const hiddenPaths = ['.env', '.env.local', '.git/HEAD', '.git/config', '.svn/entries', '.htaccess', '.htpasswd', '.DS_Store', 'web.config', 'backup.sql', 'phpinfo.php', 'robots.txt'];

    let isScanning = false;
    let scannedCount = 0;
    let dispatchedCount = 0;
    let foundPaths = [];
    let scanTimer = null;
    let isUIVisible = false;
    let dictMode = 'generator';
    let remoteDict = [];
    let pathGenerator = null;

    const stats = { success: 0, warning: 0, info: 0, error: 0, redirect: 0 };

    GM_addStyle(`
        #ps-root{position:fixed;top:0;right:0;z-index:2147483000;font-family:'Segoe UI',Roboto,-apple-system,Arial,sans-serif;}
        #ps-toggle{position:fixed;top:24px;right:24px;width:48px;height:48px;border:none;border-radius:14px;cursor:pointer;z-index:2147483001;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(99,102,241,.45);transition:transform .2s,box-shadow .2s;}
        #ps-toggle:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(99,102,241,.6);}
        #ps-panel{position:fixed;top:88px;right:24px;width:440px;max-height:82vh;display:none;flex-direction:column;overflow:hidden;background:#0f172a;color:#e2e8f0;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.45);border:1px solid rgba(148,163,184,.15);}
        #ps-panel.visible{display:flex;}
        .ps-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:linear-gradient(135deg,rgba(99,102,241,.22),rgba(139,92,246,.12));border-bottom:1px solid rgba(148,163,184,.12);}
        .ps-title{font-size:15px;font-weight:700;letter-spacing:.3px;display:flex;align-items:center;gap:8px;}
        .ps-close{background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1;padding:0 4px;transition:color .2s;}
        .ps-close:hover{color:#f8fafc;}
        .ps-body{padding:16px 18px;overflow-y:auto;}
        .ps-target{font-size:11px;color:#94a3b8;margin-bottom:14px;padding:8px 10px;background:rgba(148,163,184,.08);border-radius:8px;word-break:break-all;}
        .ps-target b{color:#a5b4fc;font-weight:600;}
        .ps-group{margin-bottom:14px;}
        .ps-label{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#64748b;margin-bottom:6px;font-weight:600;}
        .ps-seg{display:flex;background:rgba(148,163,184,.1);border-radius:10px;padding:4px;gap:4px;}
        .ps-seg button{flex:1;border:none;background:transparent;color:#94a3b8;padding:8px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;transition:all .2s;}
        .ps-seg button.active{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 12px rgba(99,102,241,.4);}
        .ps-row{display:flex;gap:8px;}
        .ps-input{flex:1;background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.15);border-radius:9px;color:#e2e8f0;padding:9px 11px;font-size:12px;outline:none;transition:border .2s;}
        .ps-input:focus{border-color:#6366f1;}
        .ps-btn{border:none;border-radius:9px;padding:9px 14px;cursor:pointer;font-size:12px;font-weight:600;transition:all .2s;color:#fff;}
        .ps-btn:disabled{opacity:.4;cursor:not-allowed;}
        .ps-btn-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);}
        .ps-btn-primary:hover:not(:disabled){filter:brightness(1.1);}
        .ps-btn-danger{background:#ef4444;}
        .ps-btn-danger:hover:not(:disabled){filter:brightness(1.1);}
        .ps-btn-ghost{background:rgba(148,163,184,.14);color:#cbd5e1;}
        .ps-btn-ghost:hover{background:rgba(148,163,184,.24);}
        .ps-meta{font-size:11px;color:#64748b;margin:4px 0 10px;}
        .ps-meta b{color:#a5b4fc;}
        .ps-progress{height:6px;background:rgba(148,163,184,.14);border-radius:3px;overflow:hidden;margin:6px 0 12px;}
        .ps-progress-fill{height:100%;width:0%;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width .25s;}
        .ps-status{font-size:12px;color:#cbd5e1;margin-bottom:4px;}
        .ps-stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
        .ps-chip{display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 9px;border-radius:20px;background:rgba(148,163,184,.08);}
        .ps-dot{width:8px;height:8px;border-radius:50%;}
        .ps-chip-success .ps-dot{background:#22c55e;}
        .ps-chip-warning .ps-dot{background:#f59e0b;}
        .ps-chip-info .ps-dot{background:#0ea5e9;}
        .ps-chip-error .ps-dot{background:#ef4444;}
        .ps-chip-redirect .ps-dot{background:#8b5cf6;}
        .ps-results-title{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#64748b;margin-bottom:8px;font-weight:600;}
        .ps-results{max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;}
        .ps-result{padding:9px 11px;border-radius:9px;background:rgba(148,163,184,.07);border-left:3px solid #22c55e;cursor:pointer;transition:background .15s;}
        .ps-result:hover{background:rgba(148,163,184,.14);}
        .ps-result.warning{border-left-color:#f59e0b;}
        .ps-result.info{border-left-color:#0ea5e9;}
        .ps-result.error{border-left-color:#ef4444;}
        .ps-result.redirect{border-left-color:#8b5cf6;}
        .ps-result-status{font-size:12px;font-weight:600;margin-bottom:2px;}
        .ps-result-url{font-size:11px;color:#a5b4fc;word-break:break-all;font-family:'Consolas',monospace;}
    `);

    function getBasePath() {
        const u = new URL(window.location.href);
        return u.origin + u.pathname;
    }

    function buildUrl(base, path) {
        if (path === '') return base;
        return base.endsWith('/') ? base + path : base + '/' + path;
    }

    function* generatePaths() {
        for (const h of hiddenPaths) yield h;
        for (let n = 0; n <= 9; n++) yield String(n);
        for (const w of seedWords) {
            for (const e of extensions) yield w + e;
        }
        for (const a of seedWords) {
            for (const b of seedWords) {
                if (a !== b) yield a + '/' + b;
            }
        }
    }

    function activeDictionarySize() {
        return dictMode === 'remote' ? remoteDict.length : Infinity;
    }

    function nextPath() {
        if (dictMode === 'remote') return null;
        const r = pathGenerator.next();
        return r.done ? null : r.value;
    }

    function createUI() {
        const panel = document.createElement('div');
        panel.id = 'ps-panel';
        panel.innerHTML = `
            <div class="ps-head">
                <span class="ps-title">&#128269; Path Scanner</span>
                <button class="ps-close" id="ps-close">&times;</button>
            </div>
            <div class="ps-body">
                <div class="ps-target">Target: <b id="ps-target"></b></div>
                <div class="ps-group">
                    <div class="ps-label">Dictionary Mode</div>
                    <div class="ps-seg">
                        <button id="ps-mode-gen" class="active">Generator</button>
                        <button id="ps-mode-url">Remote URL</button>
                    </div>
                </div>
                <div class="ps-group" id="ps-url-group" style="display:none;">
                    <div class="ps-label">Dictionary URL (one path per line)</div>
                    <div class="ps-row">
                        <input class="ps-input" id="ps-url-input" placeholder="https://example.com/wordlist.txt">
                        <button class="ps-btn ps-btn-primary" id="ps-load">Load</button>
                    </div>
                </div>
                <div class="ps-meta" id="ps-meta"></div>
                <div class="ps-row" style="margin-bottom:12px;">
                    <button class="ps-btn ps-btn-primary" id="ps-start" style="flex:1;">Start Scan</button>
                    <button class="ps-btn ps-btn-danger" id="ps-stop" style="flex:1;" disabled>Stop</button>
                    <button class="ps-btn ps-btn-ghost" id="ps-reset">Reset</button>
                </div>
                <div class="ps-status" id="ps-status">Ready</div>
                <div class="ps-progress"><div class="ps-progress-fill" id="ps-fill"></div></div>
                <div class="ps-stats">
                    <span class="ps-chip ps-chip-success"><span class="ps-dot"></span>Live <span id="ps-c-success">0</span></span>
                    <span class="ps-chip ps-chip-warning"><span class="ps-dot"></span>Pseudo <span id="ps-c-warning">0</span></span>
                    <span class="ps-chip ps-chip-info"><span class="ps-dot"></span>Login <span id="ps-c-info">0</span></span>
                    <span class="ps-chip ps-chip-error"><span class="ps-dot"></span>Blocked <span id="ps-c-error">0</span></span>
                    <span class="ps-chip ps-chip-redirect"><span class="ps-dot"></span>Redirect <span id="ps-c-redirect">0</span></span>
                </div>
                <div class="ps-results-title">Results (click to open)</div>
                <div class="ps-results" id="ps-results"></div>
            </div>
        `;

        const toggle = document.createElement('button');
        toggle.id = 'ps-toggle';
        toggle.textContent = '\u{1F50D}';
        toggle.title = 'Show scanner';

        document.body.appendChild(panel);
        document.body.appendChild(toggle);

        document.getElementById('ps-target').textContent = getBasePath() + '/';
        updateMeta();

        document.getElementById('ps-close').addEventListener('click', hideUI);
        toggle.addEventListener('click', toggleUI);
        document.getElementById('ps-mode-gen').addEventListener('click', () => setMode('generator'));
        document.getElementById('ps-mode-url').addEventListener('click', () => setMode('remote'));
        document.getElementById('ps-load').addEventListener('click', loadRemoteDict);
        document.getElementById('ps-start').addEventListener('click', startScan);
        document.getElementById('ps-stop').addEventListener('click', stopScan);
        document.getElementById('ps-reset').addEventListener('click', resetResults);

        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                const el = document.getElementById('ps-target');
                if (el) el.textContent = getBasePath() + '/';
            }
        }).observe(document, { subtree: true, childList: true });
    }

    function setMode(mode) {
        if (isScanning) return;
        dictMode = mode;
        document.getElementById('ps-mode-gen').classList.toggle('active', mode === 'generator');
        document.getElementById('ps-mode-url').classList.toggle('active', mode === 'remote');
        document.getElementById('ps-url-group').style.display = mode === 'remote' ? 'block' : 'none';
        updateMeta();
    }

    function updateMeta() {
        const meta = document.getElementById('ps-meta');
        if (dictMode === 'remote') {
            meta.innerHTML = `Remote dictionary: <b>${remoteDict.length}</b> path(s) loaded`;
        } else {
            meta.innerHTML = 'On-the-fly generator: produces candidates as it scans';
        }
    }

    function loadRemoteDict() {
        const url = document.getElementById('ps-url-input').value.trim();
        if (!url) return;
        const loadBtn = document.getElementById('ps-load');
        loadBtn.disabled = true;
        loadBtn.textContent = '...';
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 15000,
            onload: function (resp) {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load';
                if (resp.status >= 200 && resp.status < 400) {
                    remoteDict = resp.responseText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                    updateMeta();
                } else {
                    setStatus('Failed to load dictionary (HTTP ' + resp.status + ')');
                }
            },
            onerror: function () {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Load';
                setStatus('Failed to load dictionary (network error)');
            }
        });
    }

    function hideUI() {
        document.getElementById('ps-panel').classList.remove('visible');
        document.getElementById('ps-toggle').style.display = 'flex';
        isUIVisible = false;
    }

    function toggleUI() {
        isUIVisible = !isUIVisible;
        document.getElementById('ps-panel').classList.toggle('visible', isUIVisible);
        document.getElementById('ps-toggle').style.display = isUIVisible ? 'none' : 'flex';
    }

    function setStatus(msg) { document.getElementById('ps-status').textContent = msg; }

    function setProgress(pct) { document.getElementById('ps-fill').style.width = Math.min(100, pct) + '%'; }

    function resetResults() {
        stopScan();
        scannedCount = 0; dispatchedCount = 0; foundPaths = [];
        Object.keys(stats).forEach(k => stats[k] = 0);
        document.getElementById('ps-results').innerHTML = '';
        updateStats();
        setProgress(0);
        setStatus('Ready');
    }

    function startScan() {
        if (isScanning) return;
        if (dictMode === 'remote' && remoteDict.length === 0) {
            setStatus('Load a remote dictionary first');
            return;
        }
        resetResults();
        isScanning = true;
        document.getElementById('ps-start').disabled = true;
        document.getElementById('ps-stop').disabled = false;

        const base = getBasePath();
        if (dictMode === 'generator') {
            pathGenerator = generatePaths();
            setStatus('Scanning (generator)... 0 / ?');
        } else {
            pathGenerator = remoteDict[Symbol.iterator]();
            setStatus('Scanning 0 / ' + remoteDict.length);
        }

        let index = 0;
        const total = dictMode === 'remote' ? remoteDict.length : 0;
        const step = () => {
            if (!isScanning) return;
            let path;
            if (dictMode === 'remote') {
                if (index >= remoteDict.length) { finishDispatch(); return; }
                path = remoteDict[index];
            } else {
                const r = pathGenerator.next();
                if (r.done) { finishDispatch(); return; }
                path = r.value;
            }
            index++;
            dispatchedCount++;
            scanSinglePath(buildUrl(base, path), total);
            scanTimer = setTimeout(step, 80);
        };
        step();
    }

    function finishDispatch() {
        if (dispatchedCount > 0 && scannedCount >= dispatchedCount) finishScan();
    }

    function stopScan() {
        isScanning = false;
        if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
        const s = document.getElementById('ps-start');
        const t = document.getElementById('ps-stop');
        if (s) s.disabled = false;
        if (t) t.disabled = true;
    }

    function scanSinglePath(url, total) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 8000,
            onload: function (response) {
                if (!isScanning) return;
                progressTick(total);
                const body = (response.responseText || '').toLowerCase();
                const isError = errorKeywords.some(k => body.includes(k));
                const isLogin = loginKeywords.some(k => body.includes(k));
                let type = '', reason = '';
                if (response.status === 200) {
                    if (isError) { type = 'warning'; reason = 'Possibly virtual'; }
                    else if (isLogin) { type = 'info'; reason = 'Login required'; }
                    else { type = 'success'; reason = 'Live page'; }
                } else if (response.status === 401 || response.status === 403) {
                    type = 'error'; reason = 'Access denied';
                } else if (response.status === 301 || response.status === 302) {
                    type = 'redirect'; reason = 'Redirect';
                }
                if (type) {
                    foundPaths.push({ url, status: response.status, type });
                    stats[type]++;
                    addResult(url, response.status, type, reason);
                    updateStats();
                }
                checkFinish(total);
            },
            onerror: () => { if (isScanning) { progressTick(total); checkFinish(total); } },
            ontimeout: () => { if (isScanning) { progressTick(total); checkFinish(total); } }
        });
    }

    function progressTick(total) {
        scannedCount++;
        if (dictMode === 'remote' && total > 0) {
            setProgress((scannedCount / total) * 100);
            setStatus('Scanning ' + scannedCount + ' / ' + total + ' - Found ' + foundPaths.length);
        } else {
            setProgress(100);
            setStatus('Scanning ' + scannedCount + ' dispatched - Found ' + foundPaths.length);
        }
    }

    function checkFinish(total) {
        if (dictMode === 'remote' && total > 0) {
            if (scannedCount >= total) finishScan();
        } else {
            if (scannedCount >= dispatchedCount) finishScan();
        }
    }

    function addResult(url, status, type, reason) {
        const box = document.getElementById('ps-results');
        const item = document.createElement('div');
        item.className = 'ps-result ' + type;
        item.innerHTML = `<div class="ps-result-status">[${status}] ${reason}</div><div class="ps-result-url">${url}</div>`;
        item.addEventListener('click', () => window.open(url, '_blank'));
        box.appendChild(item);
        box.scrollTop = box.scrollHeight;
    }

    function updateStats() {
        document.getElementById('ps-c-success').textContent = stats.success;
        document.getElementById('ps-c-warning').textContent = stats.warning;
        document.getElementById('ps-c-info').textContent = stats.info;
        document.getElementById('ps-c-error').textContent = stats.error;
        document.getElementById('ps-c-redirect').textContent = stats.redirect;
    }

    function finishScan() {
        isScanning = false;
        if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
        document.getElementById('ps-start').disabled = false;
        document.getElementById('ps-stop').disabled = true;
        setProgress(100);
        setStatus('Done. ' + foundPaths.length + ' path(s) found');
        if (foundPaths.length > 0) {
            GM_notification({ title: 'Path Scanner', text: foundPaths.length + ' path(s) found', timeout: 3000 });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();
