// ==UserScript==
// @name         网站路径扫描器
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  修复已知问题
// @author       FengPwner
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    const pathDictionary = [".DS_Store", ".env", ".env.development", ".env.example", ".env.local", ".env.production", ".env.test", ".git", ".git/HEAD", ".git/config", ".git/index", ".git/logs/HEAD", ".git/refs/heads/master", ".gitattributes", ".gitignore", ".hg", ".hg/store/00manifest.i", ".htaccess", ".htpasswd", ".idea", ".npmrc", ".prettierrc", ".settings", ".ssh", ".svn", ".svn/entries", ".vscode", ".well-known", ".yarnrc", "_vti_bin", "_vti_cnf", "_vti_log", "_vti_pvt", "_vti_txt", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "about", "access", "account", "accounts", "action", "admin", "admin.php", "admin/account", "admin/admin", "admin/console", "admin/control", "admin/dashboard", "admin/home", "admin/login", "admin/panel", "admin_area", "admin_area/admin", "admin_area/login", "admincp", "administrator", "ajax", "alpha", "api", "api/v1", "api/v2", "api/v3", "api/v4", "api/v5", "app", "app.php", "apps", "archive", "archives", "article", "articles", "asset", "assets", "auth", "authentication", "backup", "backup.sql", "backup.tar.gz", "backup.zip", "backups", "base", "beta", "bin", "blog", "blogs", "boot", "brand", "brands", "browse", "buffer", "buffers", "cgi", "cgi-bin", "change-password", "chat", "chats", "checkout", "client", "clients", "cluster", "clusters", "code", "comment", "comments", "community", "communities", "config", "config.bak", "config.inc.php", "config.ini", "config.json", "config.php", "config.txt", "config.yml", "configuration", "connect", "console", "contact", "content", "contents", "control", "controlpanel", "cookie", "cookies", "cp", "cron", "crossdomain.xml", "css", "customer", "customers", "data", "database", "database/backup", "database/export", "database/import", "db", "db/backup", "db/export", "db/import", "dbadmin", "dba", "debug", "default", "demo", "deploy", "dev", "developer", "developers", "development", "discussion", "discussions", "doc", "docs", "document", "documents", "download", "downloads", "dump.sql", "e", "efi", "email", "env", "error", "error.log", "example", "examples", "export", "faq", "faqs", "favicon.ico", "file", "files", "filter", "filters", "find", "firewall", "firewalls", "forgot-password", "forum", "forums", "friend", "friends", "front", "frontend", "ftp", "function", "functions", "gate", "gateway", "gateways", "git", "global", "goods", "graphql", "group", "groups", "guest", "guests", "guide", "guides", "help", "hidden", "home", "host", "hosts", "howto", "html", "icon", "image", "images", "img", "import", "include", "includes", "index", "index.php", "info", "info.php", "init", "install", "installation", "interface", "interfaces", "internal", "invoice", "invoices", "item", "items", "java", "javascript", "js", "json", "jsp", "kb", "knowledgebase", "lib", "lib64", "like", "likes", "live", "loadbalancer", "local", "log", "login", "logs", "m", "main", "maintenance", "manage", "manager", "manifest.json", "market", "markets", "media", "member", "members", "memcached", "message", "messages", "metrics", "mongo", "mongodb", "monitor", "monitoring", "mysql", "myadmin", "n", "network", "networks", "new", "news", "node", "nodes", "oauth", "oauth2", "old", "openid", "operator", "opt", "option", "options", "order", "orders", "p", "package.json", "package-lock.json", "page", "pages", "panel", "password", "passwd", "payment", "payments", "perf", "performance", "permission", "permissions", "person", "photo", "photos", "php", "phpinfo.php", "phpmyadmin", "picture", "pictures", "pma", "plugin", "plugins", "portal", "portals", "post", "posts", "preference", "preferences", "preprod", "proc", "prod", "production", "profile", "profiles", "protected", "proxy", "proxies", "public", "purchase", "purchases", "py", "python", "qa", "query", "queries", "r", "rating", "ratings", "rb", "recover", "redis", "register", "registration", "report", "reports", "repository", "repositories", "reset-password", "resource", "resources", "rest", "review", "reviews", "robots.txt", "root", "s", "sample", "samples", "sandbox", "search", "secure", "security", "security.txt", "server", "servers", "service", "services", "session", "sessions", "setting", "settings", "setup", "share", "shared", "shield", "shipping", "shop", "shops", "signin", "signup", "soap", "social", "software", "source", "sql", "sso", "stage", "staging", "start", "stat", "static", "stats", "status", "store", "stores", "story", "stories", "superadmin", "superuser", "support", "svn", "sys", "sysadmin", "system", "systems", "tag", "tags", "talk", "talks", "team", "teams", "temp", "test", "testing", "tmp", "token", "tokens", "tool", "tools", "topic", "topics", "trace", "tutorial", "tutorials", "upload", "uploads", "url", "user", "user/account", "user/dashboard", "user/home", "user/profile", "user/settings", "users", "usr", "utility", "utilities", "var", "vendor", "version", "video", "videos", "visitor", "visitors", "volatile", "w", "webadmin", "webapp", "webapps", "webconfig", "webmaster", "webhook", "webhooks", "welcome", "widget", "widgets", "wp-admin", "wp-config.php", "wp-content", "wp-includes", "wp-login.php", "wp-settings.php", "xml", "xmlrpc.php", "yarn.lock", "z"].sort();
    const errorKeywords = ['not found', '404', 'doesn\'t exist', 'page cannot be found', 'page not found', 'error', '找不到', '页面不存在', '無法找到', '404 error', '未找到'];
    const loginKeywords = ['login', 'sign in', 'username', 'password', 'log in', 'signin', 'authenticate', '登录', '帳號', '密码', '密碼', '登陆', '账号'];
    let isScanning = false;
    let scannedCount = 0;
    let foundPaths = [];
    let currentTimeoutIds = [];
    let isUIVisible = false;
    GM_addStyle(`
        #path-scanner-ui {
            position: fixed;
            top: 60px;
            right: 20px;
            background: white;
            padding: 15px;
            border: 2px solid #007bff;
            border-radius: 8px;
            z-index: 10000;
            width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: Arial, sans-serif;
            font-size: 12px;
            display: none;
        }
        #path-scanner-ui.visible {
            display: block;
        }
        #scanner-toggle-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 9999;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        #scanner-toggle-btn:hover {
            background: #0056b3;
        }
        #scanner-header {
            margin: 0 0 10px 0;
            color: #007bff;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        #scan-controls {
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
        }
        #scan-button, #stop-button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            flex: 1;
        }
        #scan-button {
            background: #007bff;
            color: white;
        }
        #scan-button:disabled {
            background: #6c757d;
        }
        #stop-button {
            background: #dc3545;
            color: white;
        }
        #stop-button:disabled {
            background: #6c757d;
        }
        #refresh-target, #hide-scanner {
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: #28a745;
            color: white;
        }
        #hide-scanner {
            background: #6c757d;
        }
        #scan-progress {
            margin: 10px 0;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 11px;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            margin-top: 5px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: #28a745;
            width: 0%;
        }
        #scan-results {
            border-top: 1px solid #eee;
            padding-top: 10px;
            max-height: 300px;
            overflow-y: auto;
        }
        .result-item {
            margin: 5px 0;
            padding: 8px;
            border-left: 4px solid #28a745;
            background: #f8f9fa;
            font-size: 11px;
            word-break: break-all;
            border-radius: 3px;
            cursor: pointer;
        }
        .result-item:hover {
            background: #e9ecef;
        }
        .result-item.error { border-left-color: #dc3545; }
        .result-item.warning { border-left-color: #ffc107; }
        .result-item.info { border-left-color: #17a2b8; }
        .result-item.redirect { border-left-color: #6f42c1; }
        .result-status {
            font-weight: bold;
            margin-bottom: 3px;
        }
        .result-url {
            color: #0056b3;
        }
        .stats {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 11px;
            flex-wrap: wrap;
            gap: 5px;
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .stat-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        .stat-success { background: #28a745; }
        .stat-warning { background: #ffc107; }
        .stat-error { background: #dc3545; }
        .stat-info { background: #17a2b8; }
        .stat-redirect { background: #6f42c1; }
        .current-url {
            margin: 5px 0;
            padding: 5px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 3px;
            font-size: 11px;
        }
    `);
    function getCurrentBasePath() {
        const currentUrl = new URL(window.location.href);
        return currentUrl.origin + currentUrl.pathname;
    }
    function createScannerUI() {
        const currentPath = getCurrentBasePath();
        const scannerUI = document.createElement('div');
        scannerUI.id = 'path-scanner-ui';
        scannerUI.innerHTML = `
            <div id="scanner-header">🛠️ 路径扫描器 (当前路径)<button id="hide-scanner">隐藏</button></div>
            <div class="current-url">扫描路径: <strong>${currentPath}/</strong></div>
            <div style="margin:5px 0;font-size:11px;color:#007bff;font-weight:bold">路径字典: ${pathDictionary.length} 个路径</div>
            <div style="margin:5px 0;font-size:11px;color:#666">正在扫描当前路径下的子路径和文件</div>
            <div id="scan-controls">
                <button id="scan-button">开始扫描</button>
                <button id="stop-button" disabled>停止</button>
                <button id="refresh-target">🔄 刷新</button>
            </div>
            <div id="scan-progress">
                <div>就绪 - 共 ${pathDictionary.length} 个路径待扫描</div>
                <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
            </div>
            <div class="stats">
                <div class="stat-item"><span class="stat-dot stat-success"></span> 真实页面: 0</div>
                <div class="stat-item"><span class="stat-dot stat-warning"></span> 虚拟路径: 0</div>
                <div class="stat-item"><span class="stat-dot stat-info"></span> 需要登录: 0</div>
                <div class="stat-item"><span class="stat-dot stat-error"></span> 无权限: 0</div>
                <div class="stat-item"><span class="stat-dot stat-redirect"></span> 重定向: 0</div>
            </div>
            <div id="scan-results">
                <strong>扫描结果 (点击路径可访问):</strong>
                <div id="results-container"></div>
            </div>
        `;
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'scanner-toggle-btn';        
        toggleBtn.title = '显示扫描器';
        document.body.appendChild(scannerUI);
        document.body.appendChild(toggleBtn);        document.getElementById('scan-button').addEventListener('click', startScan);        document.getElementById('stop-button').addEventListener('click', stopScan);        document.getElementById('hide-scanner').addEventListener('click', hideScanner);        document.getElementById('refresh-target').addEventListener('click', refreshTarget);
        toggleBtn.addEventListener('click', toggleScannerUI);
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                updateCurrentPathDisplay();
            }
        }).observe(document, {subtree: true, childList: true});
    }
    function updateCurrentPathDisplay() {
        const currentPath = getCurrentBasePath();
        const displayElement = document.querySelector('.current-url');
        if (displayElement) {
            displayElement.innerHTML = `扫描路径: <strong>${currentPath}/</strong>`;
        }
    }
    function refreshTarget() {
        if (isScanning && !confirm('扫描正在进行中，确定要停止并刷新吗？')) return;
        stopScan();        document.getElementById('results-container').innerHTML = '';
        updateProgressBar(0);
        updateProgress(`已刷新 - 共 ${pathDictionary.length} 个路径待扫描`, 0);
        updateStats();
    }
    function hideScanner() {
        const scannerUI = document.getElementById('path-scanner-ui');
        const toggleBtn = document.getElementById('scanner-toggle-btn');
        scannerUI.classList.remove('visible');
        toggleBtn.style.display = 'flex';
        isUIVisible = false;
    }
    function toggleScannerUI() {
        const scannerUI = document.getElementById('path-scanner-ui');
        const toggleBtn = document.getElementById('scanner-toggle-btn');
        isUIVisible = !isUIVisible;
        if (isUIVisible) {
            scannerUI.classList.add('visible');
            toggleBtn.style.display = 'none';
        } else {
            scannerUI.classList.remove('visible');
            toggleBtn.style.display = 'flex';
        }
    }
    function startScan() {
        if (isScanning) return;
        isScanning = true;
        scannedCount = 0;
        foundPaths = [];
        currentTimeoutIds = [];        document.getElementById('results-container').innerHTML = '';
        document.getElementById('scan-button').disabled = true;
        document.getElementById('stop-button').disabled = false;
        updateProgressBar(0);
        const currentPath = getCurrentBasePath();
        updateProgress(`开始扫描: ${currentPath}/`, 0);
        pathDictionary.forEach((path, index) => {
            const timeoutId = setTimeout(() => {
                if (!isScanning) return;
                const testUrl = path === '' ? currentPath :
                    currentPath.endsWith('/') ? `${currentPath}${path}` : `${currentPath}/${path}`;
                scanSinglePath(testUrl);
            }, index * 80);
            currentTimeoutIds.push(timeoutId);
        });
    }
    function stopScan() {
        isScanning = false;
        currentTimeoutIds.forEach(id => clearTimeout(id));
        currentTimeoutIds = [];
        document.getElementById('scan-button').disabled = false;
        document.getElementById('stop-button').disabled = true;
        updateProgress(`扫描已停止 - 已完成 ${scannedCount}/${pathDictionary.length}`, scannedCount);
        updateStats();
    }
    function scanSinglePath(url) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 8000,
            onload: function(response) {
                if (!isScanning) return;
                scannedCount++;
                const responseText = response.responseText.toLowerCase();
                const isErrorPage = errorKeywords.some(keyword => responseText.includes(keyword));
                const isLoginPage = loginKeywords.some(keyword => responseText.includes(keyword));
                let resultType = '', reason = '', statusEmoji = '';
                if (response.status === 200) {
                    if (isErrorPage) {
                        resultType = 'warning'; reason = '可能是虚拟路径'; statusEmoji = '⚠️';
                    } else if (isLoginPage) {
                        resultType = 'info'; reason = '需要登录'; statusEmoji = '🔐';
                    } else {
                        resultType = 'success'; reason = '真实页面'; statusEmoji = '✅';
                    }
                } else if (response.status === 403 || response.status === 401) {
                    resultType = 'error'; reason = '无权限访问'; statusEmoji = '🚫';
                } else if (response.status === 301 || response.status === 302) {
                    resultType = 'redirect'; reason = '重定向'; statusEmoji = '↪️';
                }
                if (resultType) {
                    foundPaths.push({url: url, status: response.status, type: resultType, reason: reason});
                    addResult(url, response.status, resultType, reason, statusEmoji);
                }
                const progress = (scannedCount / pathDictionary.length) * 100;
                updateProgress(`扫描中... ${scannedCount}/${pathDictionary.length} - 找到 ${foundPaths.length} 个路径`, progress);
                updateStats();
                if (scannedCount === pathDictionary.length) finishScan();
            },
            onerror: () => handleScanProgress(),
            ontimeout: () => handleScanProgress()
        });
    }
    function handleScanProgress() {
        if (!isScanning) return;
        scannedCount++;
        const progress = (scannedCount / pathDictionary.length) * 100;
        updateProgress(`扫描中... ${scannedCount}/${pathDictionary.length} - 找到 ${foundPaths.length} 个路径`, progress);
        if (scannedCount === pathDictionary.length) finishScan();
    }
    function addResult(url, status, type, reason, emoji) {
        const resultsContainer = document.getElementById('results-container');
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${type}`;
        resultItem.innerHTML = `<div class="result-status">${emoji} [${status}] ${reason}</div><div class="result-url">${url}</div>`;
        resultItem.addEventListener('click', () => window.open(url, '_blank'));
        resultsContainer.appendChild(resultItem);
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }
    function updateProgress(message, progress) {
        const progressElement = document.getElementById('scan-progress').firstChild;
        progressElement.textContent = message;
        updateProgressBar(progress);
    }
    function updateProgressBar(progress) {
    document.getElementById('progress-fill').style.width = progress + '%';
    }
    function updateStats() {
        const stats = {
            success: foundPaths.filter(p => p.type === 'success').length,
            warning: foundPaths.filter(p => p.type === 'warning').length,
            info: foundPaths.filter(p => p.type === 'info').length,
            error: foundPaths.filter(p => p.type === 'error').length,
            redirect: foundPaths.filter(p => p.type === 'redirect').length
        };
        const statElements = document.querySelectorAll('.stat-item');
        statElements[0].innerHTML = `<span class="stat-dot stat-success"></span> 真实页面: ${stats.success}`;
        statElements[1].innerHTML = `<span class="stat-dot stat-warning"></span> 虚拟路径: ${stats.warning}`;
        statElements[2].innerHTML = `<span class="stat-dot stat-info"></span> 需要登录: ${stats.info}`;
        statElements[3].innerHTML = `<span class="stat-dot stat-error"></span> 无权限: ${stats.error}`;
        statElements[4].innerHTML = `<span class="stat-dot stat-redirect"></span> 重定向: ${stats.redirect}`;
    }
    function finishScan() {
        isScanning = false;
        document.getElementById('scan-button').disabled = false;
        document.getElementById('stop-button').disabled = true;
        updateProgress(`扫描完成! 共找到 ${foundPaths.length} 个有效路径`, 100);
        if (foundPaths.length > 0) {
            GM_notification({
                text: `扫描完成！找到 ${foundPaths.length} 个路径`,
                title: '路径扫描器',
                timeout: 3000
            });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createScannerUI);
    } else {
        createScannerUI();
    }
})();
