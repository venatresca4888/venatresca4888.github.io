require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' } });

        let editor, activeTab = null, tabs = [], tabCount = 0;
        let saveTimeout = null;
        let savedScripts = [];
        let scriptResults = [];
        let searchTerm = '';
        let lastSearchQuery = '';
        const defaultSettings = {
            alwaysOnTop: true,
            autoAttach: false,
            showTerminal: true,
            fontSize: 15,
            minimap: false,
            autocomplete: true,
            scriptSearch: true,
            loadImages: true,
            allowExecute: true,
            allowCopy: true
        };
        let appSettings = loadSettings();

        function getNextTabNumber() {
            let usedNumbers = tabs.map(t => {
                let match = t.name.match(/Tab (\d+)/);
                return match ? parseInt(match[1]) : 0;
            }).filter(n => n > 0);
            
            usedNumbers.sort((a, b) => a - b);
            
            for (let i = 1; i <= usedNumbers.length + 1; i++) {
                if (!usedNumbers.includes(i)) {
                    return i;
                }
            }
            return usedNumbers.length + 1;
        }

const settings = {
    alwaysOnTop: true,
    autoAttach: false,
    showTerminal: true,
    minimap: false,
    autocomplete: true,
    scriptSearch: true,
    loadImages: true,
    allowExecute: true,
    allowCopy: true
};

function loadSettings() {
    const saved = localStorage.getItem("executor_settings");

    if (saved) {
        Object.assign(settings, JSON.parse(saved));
    }

    document.querySelectorAll("[data-setting]").forEach(el => {
        const key = el.dataset.setting;

        if (settings[key] !== undefined) {
            el.checked = settings[key];
        }

        el.addEventListener("change", () => {
            settings[key] = el.checked;

            saveSettings();

            sendSettingToCSharp(key, el.checked);
        });
    });
}

function saveSettings() {
    localStorage.setItem(
        "executor_settings",
        JSON.stringify(settings)
    );
}

function sendSettingToCSharp(name, value) {
    if (window.chrome?.webview) {
        window.chrome.webview.postMessage({
            type: "setting",
            name,
            value
        });
    }
}

loadSettings();

        function updateMonacoTheme() {
            if (typeof monaco === 'undefined' || typeof monaco.editor === 'undefined') return;

            const computedStyle = getComputedStyle(document.documentElement);
            const bgColor = computedStyle.getPropertyValue('--bg-color').trim();
            const textColor = computedStyle.getPropertyValue('--text-color').trim();
            const secondaryText = computedStyle.getPropertyValue('--secondary-text').trim();
            const secondaryBg = computedStyle.getPropertyValue('--secondary-bg').trim();
            const borderColor = computedStyle.getPropertyValue('--border-color').trim();
            const hoverColor = computedStyle.getPropertyValue('--hover-color').trim();
            const accentColor = computedStyle.getPropertyValue('--accent-color').trim();
            const pressedColor = computedStyle.getPropertyValue('--pressed-color').trim();
            
            monaco.editor.defineTheme('CustomTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: '', foreground: textColor.substring(1) },
                    { token: 'keyword', foreground: '#569cd6', fontStyle: 'bold' },
                    { token: 'keyword.control', foreground: '#569cd6', fontStyle: 'bold' },
                    { token: 'keyword.operator', foreground: '#569cd6' },
                    { token: 'function', foreground: '#dcdcaa' },
                    { token: 'support.function', foreground: '#dcdcaa' },
                    { token: 'entity.name.function', foreground: '#dcdcaa' },
                    { token: 'function.print', foreground: '#dcdcaa', fontStyle: 'bold' },
                    { token: 'string', foreground: '#ce9178' },
                    { token: 'string.quoted', foreground: '#ce9178' },
                    { token: 'comment', foreground: '#6a9955', fontStyle: 'italic' },
                    { token: 'number', foreground: '#b5cea8' },
                    { token: 'operator', foreground: '#d4d4d4' },
                    { token: 'delimiter', foreground: '#d4d4d4' },
                    { token: 'punctuation', foreground: '#d4d4d4' },
                    { token: 'type', foreground: '#4ec9b0' },
                    { token: 'constant', foreground: '#b5cea8' },
                    { token: 'constant.language', foreground: '#d8a0df' },
                    { token: 'library', foreground: '#4ec9b0' },
                    { token: 'variable', foreground: textColor.substring(1) },
                    { token: 'variable.parameter', foreground: '#9cdcfc' },
                    { token: 'identifier', foreground: textColor.substring(1) }
                ],
                colors: {
                    'editor.background': bgColor, 
                    'editor.foreground': textColor,
                    'editorLineNumber.foreground': secondaryText,
                    'editorLineNumber.activeForeground': textColor,
                    'editorIndentGuide.background': hoverColor,
                    'editorIndentGuide.activeBackground': accentColor,
                    'editorSuggestWidget.background': secondaryBg,
                    'editorSuggestWidget.border': borderColor,
                    'editorSuggestWidget.foreground': textColor,
                    'editorSuggestWidget.selectedBackground': hoverColor,
                    'editorSuggestWidget.highlightForeground': accentColor,
                    'editor.selectionBackground': '#264f78',
                    'editor.selectionHighlightBackground': pressedColor,
                    'scrollbarSlider.background': secondaryBg,
                    'scrollbarSlider.hoverBackground': hoverColor,
                    'scrollbarSlider.activeBackground': pressedColor,
                    'editorCursor.foreground': accentColor
                }
            });

            if (editor) {
                monaco.editor.setTheme('CustomTheme');
            }
        }

        function applyTheme(themeData) {
            console.log('Applying theme data:', themeData);
            const html = document.documentElement;
            html.className = '';
            html.style.cssText = '';
            if (typeof themeData === 'string') {
                if (themeData !== 'default') {
                    html.classList.add(`theme-${themeData}`);
                }
            }
            else if (typeof themeData === 'object' && themeData.type === 'custom' && themeData.colors) {
                for (const [key, value] of Object.entries(themeData.colors)) {
                    html.style.setProperty(key, value);
                }
            }
            updateMonacoTheme();
        }

        window.applyTheme = applyTheme;

        function showToast(message, type) {
            const container = document.querySelector('.toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);
            toast.offsetHeight;
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.add('hide');
                setTimeout(() => container.removeChild(toast), 400);
            }, 3000);
        }

        function switchPage(pageId) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.toggle('active', page.id === pageId);
            });

            document.querySelectorAll('.page-tab').forEach(tab => {
                const isActive = tab.dataset.page === pageId;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
            });

            if (pageId === 'code-page' && editor) {
                setTimeout(() => editor.layout(), 0);
            }
        }

        function setupPageTabs() {
            document.querySelectorAll('.page-tab').forEach(tab => {
                tab.addEventListener('click', () => switchPage(tab.dataset.page));
            });
        }

        function loadSettings() {
            try {
                return { ...defaultSettings, ...JSON.parse(localStorage.getItem('appSettings') || '{}') };
            } catch (error) {
                console.error('Failed to load settings:', error);
                return { ...defaultSettings };
            }
        }

        function saveSettings() {
            localStorage.setItem('appSettings', JSON.stringify(appSettings));
        }

        function postHostMessage(type, payload = {}) {
            const message = { type, ...payload };
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage(message);
            }
        }

        function applySettings() {
            if (editor) {
                editor.updateOptions({
                    fontSize: appSettings.fontSize,
                    minimap: { enabled: appSettings.minimap },
                    quickSuggestions: appSettings.autocomplete,
                    suggestOnTriggerCharacters: appSettings.autocomplete
                });
                editor.layout();
            }

            postHostMessage('settingsChange', appSettings);
            renderScriptsList();
        }

        function syncSettingsControls() {
            document.querySelectorAll('[data-setting]').forEach(input => {
                const key = input.dataset.setting;
                if (input.type === 'checkbox') {
                    input.checked = Boolean(appSettings[key]);
                }
            });

            const fontSlider = document.querySelector('#settings-page input[aria-label="Font size"]');
            const fontValue = fontSlider ? fontSlider.nextElementSibling : null;
            if (fontSlider && fontValue) {
                fontSlider.value = appSettings.fontSize;
                fontValue.textContent = `${appSettings.fontSize}px`;
            }
        }

        function setupSettingsControls() {
            document.querySelectorAll('[data-setting]').forEach(input => {
                const key = input.dataset.setting;
                if (input.type === 'checkbox') {
                    input.addEventListener('change', () => {
                        appSettings[key] = input.checked;
                        saveSettings();
                        applySettings();
                    });
                }
            });

            const fontSlider = document.querySelector('#settings-page input[aria-label="Font size"]');
            const fontValue = fontSlider ? fontSlider.nextElementSibling : null;
            if (fontSlider && fontValue) {
                fontSlider.addEventListener('input', () => {
                    appSettings.fontSize = Number(fontSlider.value);
                    fontValue.textContent = `${appSettings.fontSize}px`;
                    saveSettings();
                    applySettings();
                });
            }

            const resetButton = document.querySelector('.settings-reset');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    appSettings = { ...defaultSettings };
                    saveSettings();
                    syncSettingsControls();
                    applySettings();
                    showToast('Settings reset', 'success');
                });
            }

            syncSettingsControls();
        }

        function escapeHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[character]));
        }

        function getScriptImage(script) {
            if (!appSettings.loadImages) return '';
            return script.game?.imageUrl || script.image || '';
        }

        function getScriptContent(script) {
            return script.script || script.code || script.source || '';
        }

        async function SearchScripts(searchQuery) {
            const listElement = document.getElementById('scripts-list');
            const query = searchQuery.trim();
            if (!listElement) return;

            if (!appSettings.scriptSearch) {
                listElement.innerHTML = '<div id="no-scripts-message">Script search is disabled in Settings.</div>';
                return;
            }

            if (!query) {
                scriptResults = [];
                lastSearchQuery = '';
                renderScriptsList();
                return;
            }

            lastSearchQuery = query;
            listElement.innerHTML = '<div id="no-scripts-message">Searching ScriptBlox...</div>';

            try {
                const apiUrl = `https://scriptblox.com/api/script/search?q=${encodeURIComponent(query)}&mode=free&max=20`;
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }

                const jsonResponse = await response.json();
                scriptResults = jsonResponse?.result?.scripts || [];
                renderScriptsList();

                if (scriptResults.length === 0) {
                    showToast('No scripts found', 'error');
                }
            } catch (error) {
                console.error('ScriptBlox API error:', error);
                listElement.innerHTML = '<div id="no-scripts-message">Could not load ScriptBlox results.</div>';
                showToast('ScriptBlox API error', 'error');
            }
        }

        function renderScriptsList() {
            const listElement = document.getElementById('scripts-list');
            if (!listElement) return;

            if (!appSettings.scriptSearch) {
                listElement.innerHTML = '<div id="no-scripts-message">Script search is disabled in Settings.</div>';
                return;
            }

            if (scriptResults.length === 0) {
                listElement.innerHTML = `<div id="no-scripts-message">${lastSearchQuery ? 'No scripts found.' : 'Search for scripts to begin.'}</div>`;
                return;
            }

            listElement.innerHTML = scriptResults.map((script, index) => {
                const title = escapeHtml(script.title || 'Untitled Script');
                const gameName = escapeHtml(script.game?.name || script.game?.title || 'Universal');
                const verified = Boolean(script.verified);
                const imageUrl = getScriptImage(script);
                const imageMarkup = imageUrl
                    ? `<img class="script-image" src="${escapeHtml(imageUrl)}" alt="">`
                    : '<div class="script-image" aria-hidden="true"></div>';

                return `
                    <article class="script-item" data-index="${index}" style="animation: tabEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1);">
                        ${imageMarkup}
                        <div class="script-name">${title}</div>
                        <div class="script-meta">
                            <span class="script-badge ${verified ? 'verified' : ''}">${verified ? 'Verified' : 'Unverified'}</span>
                            <span class="script-game">${gameName}</span>
                        </div>
                        <div class="script-actions">
                            <button class="script-action-btn load-script" type="button" title="Load into editor" aria-label="Load into editor">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3h2ZM5 19h14v2H5v-2Z"/></svg>
                                Load
                            </button>
                            <button class="script-action-btn execute-script" type="button" title="Execute script" aria-label="Execute script" ${appSettings.allowExecute ? '' : 'disabled'}>
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z"/></svg>
                                Run
                            </button>
                            <button class="script-action-btn copy-script" type="button" title="Copy script" aria-label="Copy script" ${appSettings.allowCopy ? '' : 'disabled'}>
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>
                                Copy
                            </button>
                        </div>
                    </article>
                `;
            }).join('');

            document.querySelectorAll('.script-item').forEach(item => {
                const index = Number(item.dataset.index);
                item.querySelector('.load-script')?.addEventListener('click', () => loadScriptIntoEditor(index));
                item.querySelector('.execute-script')?.addEventListener('click', () => executeScript(index));
                item.querySelector('.copy-script')?.addEventListener('click', () => copyScript(index));
            });

            document.querySelectorAll('img.script-image').forEach(image => {
                image.addEventListener('error', () => {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'script-image script-placeholder';
                    placeholder.textContent = 'No image';
                    image.replaceWith(placeholder);
                }, { once: true });
            });
        }

        function createEditorTab(content, name) {
            const tab = new Tab(content, name);
            tabs.push(tab);
            const tabBar = document.getElementById('tab-bar');
            const newTabBtn = document.getElementById('new-tab-btn');
            tabBar.insertBefore(tab.element, newTabBtn);
            activateTab(tab);
            tabBar.scrollLeft = tabBar.scrollWidth;
            switchPage('code-page');
            return tab;
        }

        function loadScriptIntoEditor(index) {
            const script = scriptResults[index];
            if (!script) return;
            createEditorTab(getScriptContent(script), script.title || 'ScriptBlox Script');
            showToast(`Loaded: ${script.title || 'Script'}`, 'success');
        }

        function executeScript(index) {
            if (!appSettings.allowExecute) {
                showToast('Execute is disabled', 'error');
                return;
            }
            const script = scriptResults[index];
            const scriptContent = script ? getScriptContent(script) : '';
            if (!scriptContent) {
                showToast('No script content found', 'error');
                return;
            }
            postHostMessage('executeScript', { script: scriptContent });
            if (window.CzkAPI?.CzkFUNC?.ExecuteScript) {
                window.CzkAPI.CzkFUNC.ExecuteScript(scriptContent);
            }
            showToast('Execute request sent', 'success');
        }

        async function copyScript(index) {
            if (!appSettings.allowCopy) {
                showToast('Copy is disabled', 'error');
                return;
            }
            const script = scriptResults[index];
            const scriptContent = script ? getScriptContent(script) : '';
            if (!scriptContent) {
                showToast('No script content found', 'error');
                return;
            }
            try {
                await navigator.clipboard.writeText(scriptContent);
                showToast('Script copied', 'success');
            } catch (error) {
                console.error('Clipboard error:', error);
                showToast('Could not copy script', 'error');
            }
        }

        function saveSavedScripts() {
            localStorage.setItem('savedScripts', JSON.stringify(savedScripts));
        }

        function saveCurrentScript(scriptName) {
            if (!activeTab) {
                showToast('No active tab to save', 'error');
                return;
            }
            
            const content = editor.getValue();
            const name = scriptName || activeTab.name;
            
            if (name.trim() === '') {
                showToast('Script name cannot be empty', 'error');
                return;
            }
            
            const existingIndex = savedScripts.findIndex(s => s.name === name);
            
            if (existingIndex >= 0) {
                if (confirm(`Script "${name}" already exists. Overwrite?`)) {
                    savedScripts[existingIndex] = { name, content };
                    showToast(`Updated: ${name}`, 'success');
                } else {
                    return;
                }
            } else {
                savedScripts.push({ name, content });
                showToast(`Saved: ${name}`, 'success');
            }
            
            saveSavedScripts();
            renderScriptsList();
        }

        function deleteScript(index) {
            if (confirm(`Delete "${savedScripts[index].name}"?`)) {
                savedScripts.splice(index, 1);
                saveSavedScripts();
                renderScriptsList();
                showToast('Script deleted', 'success');
            }
        }

        class Tab {
            constructor(content = ``, name = `Tab ${getNextTabNumber()}`, id = `tab-${Date.now()}`) {
                this.id = id;
                this.name = name;
                this.content = content;
                this.element = this.createTabElement();
            }

            createTabElement() {
                const tabElement = document.createElement('div');
                tabElement.className = 'tab tab-enter-animate';
                tabElement.innerHTML = `<span class="tab-name">${this.name}</span><span class="tab-close"></span>`;
                setTimeout(() => {
                    tabElement.classList.remove('tab-enter-animate');
                }, 300);

                const attachEventListeners = () => {
                    const nameElement = tabElement.querySelector('.tab-name');
                    const closeElement = tabElement.querySelector('.tab-close');
                    tabElement.removeEventListener('click', this.tabClickHandler);
                    tabElement.removeEventListener('contextmenu', this.contextMenuHandler);
                    nameElement.removeEventListener('dblclick', this.renameHandler);
                    closeElement.removeEventListener('click', this.closeHandler);

                    this.tabClickHandler = (e) => {
                        if (!e.target.classList.contains('tab-close')) {
                            activateTab(this);
                        }
                    };
                    this.contextMenuHandler = (event) => {
                        event.preventDefault();
                        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
                        const contextMenu = document.createElement('div');
                        contextMenu.className = 'context-menu';
                        contextMenu.innerHTML = `
                                    <div class="menu-item rename-item">Rename</div>
                                    <div class="menu-item close-item">Close</div>
                                `;
                        contextMenu.style.position = 'fixed';
                        contextMenu.style.left = `${event.clientX}px`;
                        contextMenu.style.top = `${event.clientY}px`;
                        document.body.appendChild(contextMenu);

                        contextMenu.querySelector('.rename-item').addEventListener('click', (e) => {
                            e.stopPropagation();
                            startRenameProcess();
                            contextMenu.remove();
                        }, { once: true });

                        contextMenu.querySelector('.close-item').addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (tabs.length > 1) {
                                closeTab(this);
                            }
                            contextMenu.remove();
                        }, { once: true });

                        document.addEventListener('click', () => contextMenu.remove(), { once: true });
                    };
                    this.renameHandler = () => startRenameProcess();
                    this.closeHandler = (event) => {
                        event.stopPropagation();
                        if (tabs.length > 1) {
                            closeTab(this);
                        }
                    };

                    nameElement.addEventListener('dblclick', this.renameHandler, { once: false });
                    tabElement.addEventListener('click', this.tabClickHandler, { once: false });
                    closeElement.addEventListener('click', this.closeHandler, { once: false });
                    tabElement.addEventListener('contextmenu', this.contextMenuHandler, { once: false });
                };

                let renameTimeout = null;
                const startRenameProcess = () => {
                    if (renameTimeout) clearTimeout(renameTimeout);
                    renameTimeout = setTimeout(() => {
                        const nameElement = tabElement.querySelector('.tab-name');
                        if (nameElement.tagName === 'INPUT') return;
                        const inputElement = document.createElement('input');
                        inputElement.value = this.name;
                        inputElement.style.cssText = 'width:80px;background:transparent;border:none;color:var(--text-color);outline:none;font-family:"Tilt Neon",Consolas,"Courier New",monospace;font-size:14.5px;padding:0;box-sizing:border-box;';
                        nameElement.replaceWith(inputElement);
                        inputElement.focus();
                        inputElement.select();

                        const finishRenaming = () => {
                            this.name = inputElement.value || 'Untitled';
                            const newNameElement = document.createElement('span');
                            newNameElement.className = 'tab-name';
                            newNameElement.textContent = this.name;
                            inputElement.replaceWith(newNameElement);
                            tabElement.style.cssText = '';
                            attachEventListeners();
                        };

                        inputElement.addEventListener('blur', finishRenaming, { once: true });
                        inputElement.addEventListener('keydown', (event) => {
                            if (event.key === 'Enter') finishRenaming();
                            if (event.key === 'Escape') {
                                inputElement.value = this.name;
                                finishRenaming();
                            }
                        }, { once: true });
                    }, 200);
                };

                attachEventListeners();
                return tabElement;
            }
        }

        function createNewTab() {
            const tab = new Tab();
            tabs.push(tab);
            const tabBar = document.getElementById('tab-bar');
            const newTabBtn = document.getElementById('new-tab-btn');
            tabBar.insertBefore(tab.element, newTabBtn);
            activateTab(tab);
            tabBar.scrollLeft = tabBar.scrollWidth;
        }

        function closeTab(tab) {
            if (tabs.length <= 1) {
                showToast('Cannot close the last tab!', 'error');
                return;
            }
            tab.element.classList.add('tab-fade-out');
            setTimeout(() => {
                if (!tabs.includes(tab)) return;
                const tabIndex = tabs.indexOf(tab);
                if (tabIndex > -1) {
                    tabs.splice(tabIndex, 1);
                    tab.element.remove();
                    if (tab === activeTab) {
                        activeTab = null;
                        if (tabs.length > 0) {
                            const nextTab = tabs[Math.max(0, tabIndex - 1)];
                            activateTab(nextTab);
                        } else {
                            editor.setValue('');
                        }
                    }
                    saveTabsToLocalStorage();
                }
            }, 150);
        }

        let transitionTimeout = null;

        function activateTab(tab) {
            if (activeTab === tab) return;
            const editorContainer = document.getElementById('container');
            if (activeTab) {
                activeTab.element.classList.remove('active');
                activeTab.content = editor.getValue();
            }
            if (transitionTimeout) clearTimeout(transitionTimeout);
            transitionTimeout = setTimeout(() => {
                activeTab = tab;
                tab.element.classList.add('active');
                editor.setValue(tab.content);
                setTimeout(() => editorContainer.classList.remove('tab-transition-in'), 0);
            }, 50);
        }

        function saveTabsToLocalStorage() {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const tabData = tabs.map(tab => ({
                    id: tab.id,
                    name: tab.name,
                    content: tab.content
                }));
                localStorage.setItem('editorTabs', JSON.stringify(tabData));
            }, 200);
        }

        function loadTabsFromLocalStorage() {
            try {
                localStorage.removeItem('editorTabs');
                createNewTab();
            } catch (e) {
                console.error('Failed to load tabs:', e);
                createNewTab();
            }
        }

        function handleMessage(data) {
             if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error('Failed to parse message:', e);
                    return;
                }
            }
            if (data.type === "themeChange" && typeof data.theme === "string") {
                applyTheme(data.theme);
            }
        }

        function setupMessageHandlers() {
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.addEventListener('message', event => handleMessage(event.data));
            }
            window.addEventListener('message', event => handleMessage(event.data));
        }
        
        require(['vs/editor/editor.main'], function () {
            
            updateMonacoTheme();

            monaco.languages.register({ id: 'lua' });

            monaco.languages.setMonarchTokensProvider('lua', {
                defaultToken: '',
                tokenPostfix: '.lua',
                
                keywords: [
                    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 
                    'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 
                    'true', 'until', 'while', 'goto'
                ],
                
                builtinFunctions: [
                    'print', 'printidentity', 'printidentify', 'executor', 'assert', 'dofile',
                    'getmetatable', 'pairs', 'ipairs', 'tonumber', 'tostring', 'type',
                    'hookfunction', 'getgenv', 'getrenv', 'isexecutorclosure', 'setclipboard',
                    'loadstring', 'game', 'HttpGet', 'warn', 'error', 'require', 'pcall', 
                    'xpcall', 'rawget', 'rawset', 'rawlen', 'next', 'select', 'setmetatable'
                ],
                
                operators: [
                    '+', '-', '*', '/', '%', '^', '#', '==', '~=', '<=', '>=', '<', '>', '=',
                    ';', ':', ',', '.', '..', '...'
                ],
                
                symbols: /[=><!~?:&|+\-*\/\^%#]+/,
                
                escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
                
                tokenizer: {
                    root: [
                        [/[a-zA-Z_][\w]*/, { 
                            cases: { 
                                '@keywords': 'keyword',
                                '@builtinFunctions': 'function',
                                '@default': 'identifier' 
                            } 
                        }],
                        { include: '@whitespace' },
                        [/(--)(?:\s+(.*))?$/, 'comment'],
                        [/[{}()\[\]]/, '@brackets'],
                        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
                        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                        [/0[xX][0-9a-fA-F_]*[0-9a-fA-F]/, 'number.hex'],
                        [/\d+/, 'number'],
                        [/"([^"\\]|\\.)*$/, 'string.invalid'],
                        [/'([^'\\]|\\.)*$/, 'string.invalid'],
                        [/"/, { token: 'string.quote', bracket: '@open', next: '@string_double' }],
                        [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }],
                    ],
                    
                    string_double: [
                        [/[^\\"]+/, 'string'],
                        [/@escapes/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                    ],
                    
                    string_single: [
                        [/[^\\']+/, 'string'],
                        [/@escapes/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                    ],
                    
                    whitespace: [
                        [/[ \t\r\n]+/, 'white'],
                    ],
                },
            });

            require(['vs/basic-languages/lua/lua'], function () {
                monaco.languages.registerCompletionItemProvider('lua', {
                    provideCompletionItems: function (model, position) {
                        const word = model.getWordUntilPosition(position);
                        const prefix = word.word.toLowerCase();
                        const suggestions = [
                            { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1})', documentation: 'Outputs a message to the console' },
                            { label: 'printidentity', kind: monaco.languages.CompletionItemKind.Function, insertText: 'printidentity(${1})', documentation: 'Prints identity information' },
                            { label: 'printidentify', kind: monaco.languages.CompletionItemKind.Function, insertText: 'printidentify(${1})', documentation: 'Identifies and prints details' },
                            { label: 'executor', kind: monaco.languages.CompletionItemKind.Function, insertText: 'executor(${1})', documentation: 'Executes a command or script' },
                            { label: 'local', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'local ${1}', documentation: 'Declares a local variable' },
                            { label: 'function', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'function ${1}()\n\t${2}\nend', documentation: 'Defines a function' },
                            { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1} then\n\t${2}\nend', documentation: 'Conditional statement' },
                            { label: 'else', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'else\n\t${1}', documentation: 'Alternative condition' },
                            { label: 'elseif', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'elseif ${1} then\n\t${2}', documentation: 'Additional condition' },
                            { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1} = ${2}, ${3} do\n\t${4}\nend', documentation: 'Loop over a range' },
                            { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while ${1} do\n\t${2}\nend', documentation: 'Loop while condition is true' },
                            { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ${1}', documentation: 'Returns a value' },
                            { label: 'assert', kind: monaco.languages.CompletionItemKind.Function, insertText: 'assert(${1})', documentation: 'Asserts a condition' },
                            { label: 'dofile', kind: monaco.languages.CompletionItemKind.Function, insertText: 'dofile(${1})', documentation: 'Executes a file' },
                            { label: 'getmetatable', kind: monaco.languages.CompletionItemKind.Function, insertText: 'getmetatable(${1})', documentation: 'Gets the metatable of an object' },
                            { label: 'pairs', kind: monaco.languages.CompletionItemKind.Function, insertText: 'pairs(${1})', documentation: 'Iterates over table key-value pairs' },
                            { label: 'ipairs', kind: monaco.languages.CompletionItemKind.Function, insertText: 'ipairs(${1})', documentation: 'Iterates over table indices' },
                            { label: 'tonumber', kind: monaco.languages.CompletionItemKind.Function, insertText: 'tonumber(${1})', documentation: 'Converts to a number' },
                            { label: 'tostring', kind: monaco.languages.CompletionItemKind.Function, insertText: 'tostring(${1})', documentation: 'Converts to a string' },
                            { label: 'type', kind: monaco.languages.CompletionItemKind.Function, insertText: 'type(${1})', documentation: 'Returns the type of a value' },
                            { label: 'hookfunction', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hookfunction(${1}, ${2})', documentation: 'Hooks a function' },
                            { label: 'getgenv', kind: monaco.languages.CompletionItemKind.Function, insertText: 'getgenv()', documentation: 'Gets global environment' },
                            { label: 'getrenv', kind: monaco.languages.CompletionItemKind.Function, insertText: 'getrenv()', documentation: 'Gets Roblox environment' },
                            { label: 'isexecutorclosure', kind: monaco.languages.CompletionItemKind.Function, insertText: 'isexecutorclosure(${1})', documentation: 'Checks if a function is an executor closure' },
                            { label: 'setclipboard', kind: monaco.languages.CompletionItemKind.Function, insertText: 'setclipboard(${1})', documentation: 'Sets clipboard content' }
                        ].filter(s => s.label.toLowerCase().startsWith(prefix));
                        return { suggestions };
                    },
                    triggerCharacters: ['.', ':', '"', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
                });

                editor = monaco.editor.create(document.getElementById('container'), {
                    value: '',
                    language: 'lua',
                    theme: 'CustomTheme',
                    fontSize: appSettings.fontSize,
                    fontFamily: "'Tilt Neon', Consolas, 'Courier New', monospace",
                    folding: true,
                    dragAndDrop: true,
                    links: true,
                    minimap: { enabled: appSettings.minimap },
                    showFoldingControls: 'always',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    foldingHighlight: true,
                    fontLigatures: true,
                    formatOnPaste: true,
                    showDeprecated: true,
                    quickSuggestions: appSettings.autocomplete,
                    suggestOnTriggerCharacters: appSettings.autocomplete,
                    suggest: { snippetsPreventQuickSuggestions: false },
                    padding: { top: 5, left: 0 },
                    lineNumbers: 'on',
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false
                });

                window.editor = editor;

                editor.getModel().updateOptions({ insertSpaces: false });
                editor.onDidChangeModelContent(() => {
                    if (activeTab) {
                        activeTab.content = editor.getValue();
                        saveTabsToLocalStorage();
                    }
                });

                document.getElementById('new-tab-btn').addEventListener('click', createNewTab);
                setupPageTabs();
                setupSettingsControls();
                
                const searchInput = document.getElementById('script-search');
                if (searchInput) {
                    searchInput.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            SearchScripts(searchInput.value);
                        }
                    });
                }

                document.getElementById('refresh-scripts-btn')?.addEventListener('click', () => {
                    SearchScripts(searchInput ? searchInput.value || lastSearchQuery : lastSearchQuery);
                });
                
                loadTabsFromLocalStorage();
                try {
                    savedScripts = JSON.parse(localStorage.getItem('savedScripts') || '[]');
                } catch (error) {
                    savedScripts = [];
                }
                renderScriptsList();
                applySettings();

                window.onresize = function () {
                    editor.layout();
                };

                window.GetText = function () {
                    return editor.getValue();
                };

                window.SetText = function (x) {
                    editor.setValue(String(x));
                    if (activeTab) {
                        activeTab.content = editor.getValue();
                        saveTabsToLocalStorage();
                    }
                };

                window.saveCurrentScript = saveCurrentScript;
            });

            window.addEventListener('load', () => {
                setupMessageHandlers();
            });
        });
    
