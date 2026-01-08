document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const root = document.documentElement;
    const viewer = document.getElementById('viewer');
    const backButton = document.getElementById('backButton');
    const appbar = document.querySelector('.appbar');
    const themeToggleButtons = document.querySelectorAll('[data-role="theme-toggle"]');
    const themeStatusBadges = document.querySelectorAll('[data-role="theme-status"]');
    const toast = document.getElementById('toast');
    const embedWrapper = document.getElementById('embedWrapper');
    const embedFrame = document.getElementById('embedFrame');
    const embedTitle = document.getElementById('embedTitle');
    const embedLoader = document.getElementById('embedLoader');
    const closeEmbed = document.getElementById('closeEmbed');
    const appbarMenu = document.getElementById('appbarMenu');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const moduleLinks = document.querySelectorAll('.module-link');
    const notebookButtons = document.querySelectorAll('[data-action="open-notebooklm"]');
    const stateStack = [];

    const initialState = { type: 'home' };
    stateStack.push(initialState);
    renderState(initialState);
    updateBackButton();

    registerServiceWorker();

    const storedTheme = localStorage.getItem('preferred-theme');
    setTheme(storedTheme || 'dark');

    themeToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const next = body.dataset.theme === 'light' ? 'dark' : 'light';
            setTheme(next);
        });
    });

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            appbarMenu.classList.toggle('mb-4');
            const expanded = appbar?.dataset.expanded === 'true';
            expanded ? collapseAppbarMenu() : expandAppbarMenu();
        });
    }

    const lgMedia = window.matchMedia('(min-width: 1024px)');
    if (lgMedia.addEventListener) {
        lgMedia.addEventListener('change', event => {
            if (event.matches) {
                collapseAppbarMenu(true);
            }
        });
    } else if (lgMedia.addListener) {
        lgMedia.addListener(event => {
            if (event.matches) {
                collapseAppbarMenu(true);
            }
        });
    }

    backButton.addEventListener('click', () => {
        if (stateStack.length <= 1) return;
        stateStack.pop();
        renderState(stateStack[stateStack.length - 1]);
        updateBackButton();
    });

    closeEmbed.addEventListener('click', () => hideEmbed());

    moduleLinks.forEach(link => {
        link.addEventListener('click', event => {
            const href = link.getAttribute('href') || '#';
            const label = link.dataset.label || link.textContent.trim();

            // Si tiene data-open="direct", navegar directamente
            if (link.dataset.open === 'direct') {
                return; // Deja que el navegador haga la navegación normal
            }

            event.preventDefault();

            if (!href || href === '#') {
                showNotice(`${label} está en construcción.`, 'Estamos preparando los retos y materiales de este módulo.');
                return;
            }

            // Módulo DWEC especial con GitHub API
            if (label === 'DWEC' || href.includes('dwec')) {
                if (appbar?.dataset.expanded === 'true' && window.innerWidth < 1024) {
                    collapseAppbarMenu();
                }
                loadDWECModule();
                return;
            }

            // Módulo DWES especial con GitHub API
            if (label === 'DWES' || href.includes('dwes')) {
                if (appbar?.dataset.expanded === 'true' && window.innerWidth < 1024) {
                    collapseAppbarMenu();
                }
                loadDWESModule();
                return;
            }

            if (appbar?.dataset.expanded === 'true' && window.innerWidth < 1024) {
                collapseAppbarMenu();
            }
            loadModule(href, label);
        });
    });

    notebookButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            loadNotebookModule();
            if (appbar?.dataset.expanded === 'true' && window.innerWidth < 1024) {
                collapseAppbarMenu();
            }
        });
    });

    function setTheme(theme) {
        body.dataset.theme = theme;
        const isDark = theme === 'dark';
        root.classList.toggle('dark', isDark);
        body.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('preferred-theme', theme);
        themeToggleButtons.forEach(button => {
            button.textContent = theme === 'light' ? '\u2600' : '\u263E';
        });
        themeStatusBadges.forEach(badge => {
            badge.textContent = theme === 'light' ? 'Modo claro' : 'Modo oscuro';
        });
    }

    function renderState(state) {
        hideEmbed(true);
        if (state.type === 'home') {
            viewer.innerHTML = homeTemplate();
            attachHomeActions();
        } else if (state.type === 'module' || state.type === 'notice') {
            viewer.innerHTML = state.html;
            if (state.type === 'module') {
                hookInlineLinks();
            }
        }
    }

    function homeTemplate() {
        return `
            <section class="viewer-content flex flex-col gap-6">
                <!-- Hero Section Adaptable -->
                <div class="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all dark:bg-slate-900 dark:shadow-2xl">
                    
                    <!-- Efectos de fondo -->
                    <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-100 blur-3xl dark:bg-indigo-500/30"></div>
                    <div class="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-100 blur-3xl dark:bg-purple-500/30"></div>
                    
                    <div class="relative z-10 space-y-6">
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 border border-indigo-100 dark:bg-indigo-400/20 dark:text-indigo-200 dark:border-indigo-400/20 dark:backdrop-blur-md">
                                Hub interactivo
                            </span>
                        </div>

                        <div class="space-y-2">
                            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
                                Practica para tus exámenes
                            </h2>
                            <p class="max-w-xl text-lg text-slate-600 dark:text-indigo-100/80">
                                Recopilación de recursos, tests de Daypo y exámenes de años anteriores.
                            </p>
                        </div>

                        <!-- SECCIÓN DE NOVEDADES -->
                        <div class="rounded-xl bg-slate-50 p-5 border border-slate-200 dark:bg-slate-950/20 dark:border-white/10 dark:backdrop-blur-sm">
                            <h3 class="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide dark:text-white dark:opacity-90">
                                Últimas actualizaciones
                            </h3>
                            <ul class="space-y-3">
                                <!-- Noticia 1 -->
                                <li class="group flex items-center justify-between gap-4 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition border border-slate-200/60 cursor-pointer hover:border-indigo-300 dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:hover:border-white/20"
                                    data-action="nav-module" data-target="features/python/index.html" data-label="Python">
                                    <div class="flex items-center gap-4">
                                        <div>
                                            <p class="font-semibold text-slate-900 group-hover:text-indigo-600 transition dark:text-white dark:group-hover:text-indigo-200">Python - RA5</p>
                                            <p class="text-sm text-slate-500 dark:text-indigo-100/60">Añadidos tests de TDD, Unittest y Pytest.</p>
                                        </div>
                                    </div>
                                    <span class="text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-500 transition dark:text-white/40 dark:group-hover:text-white">→</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function attachHomeActions() {
        const scrollButton = viewer.querySelector('[data-action="scroll-nav"]');
        const daypoButton = viewer.querySelector('[data-action="visit-daypo"]');
        const navButtons = viewer.querySelectorAll('[data-action="nav-module"]');

        if (scrollButton) {
            scrollButton.addEventListener('click', () => {
                document.querySelector('.nav-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
        if (daypoButton) {
            daypoButton.addEventListener('click', () => {
                openExternal('https://www.daypo.com/', 'Daypo');
            });
        }
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                const label = btn.dataset.label;
                loadModule(target, label);
            });
        });
    }

    function updateBackButton() {
        backButton.disabled = stateStack.length <= 1;
    }

    function pushState(state, skipRender = false) {
        stateStack.push(state);
        if (!skipRender) {
            renderState(state);
        }
        updateBackButton();
    }

    async function loadModule(target, label) {
        viewer.innerHTML = loadingTemplate(label);
        try {
            const resolvedUrl = target instanceof URL ? target : new URL(target, window.location.href);
            const response = await fetch(resolvedUrl.href);
            if (!response.ok) throw new Error('No se pudo cargar el módulo');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const main = doc.querySelector('[data-part="module"]');
            // Si no hay data-part="module", usamos el contenido del body directamente
            const snippet = main ? main.innerHTML : doc.body.innerHTML;
            // Extraer título de la página cargada si existe
            const pageTitle = doc.querySelector('title')?.textContent || label;
            const template = moduleTemplate(pageTitle, snippet);
            viewer.innerHTML = template;
            hookInlineLinks();
            pushState({ type: 'module', title: pageTitle, html: template }, true);
        } catch (error) {
            const template = errorTemplate(label);
            viewer.innerHTML = template;
            pushState({ type: 'notice', html: template }, true);
            showToast('No se pudo cargar el módulo.');
        }
    }

    function loadNotebookModule() {
        const content = notebookTemplate();
        const template = moduleTemplate('NoteBookLM', content);
        viewer.innerHTML = template;
        hookInlineLinks();
        pushState({ type: 'module', title: 'NoteBookLM', html: template }, true);
    }

    // Módulo DWEC - Vista principal con RAs y acceso al repositorio
    function loadDWECModule() {
        const template = dwecMainTemplate();
        viewer.innerHTML = template;
        hookDWECMainActions();
        pushState({ type: 'module', title: 'DWEC', html: template }, true);
    }

    function dwecMainTemplate() {
        return `
            <article class="module-detail viewer-content flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Módulo</span>
                    <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">Desarrollo Web en Entorno Cliente</h2>
                    <p class="text-sm text-slate-600 dark:text-slate-300">JavaScript, DOM, eventos y programación asíncrona.</p>
                </div>

                <div class="space-y-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Resultados de aprendizaje</span>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="ra-card flex flex-col gap-3 rounded-[1.1rem] border border-dashed border-slate-300 bg-slate-50/50 p-5 dark:border-slate-600 dark:bg-slate-800/30">
                            <span class="text-sm text-slate-400 dark:text-slate-500">Próximamente...</span>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Los cuestionarios de RAs estarán disponibles aquí.</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Recursos de práctica</span>
                    <div class="grid gap-4">
                        <button data-action="open-arrays-repo"
                            class="tilt-card group flex items-center gap-4 rounded-[1.1rem] border border-slate-200/60 bg-white/80 p-5 text-left shadow-lg transition hover:border-indigo-400 dark:border-white/10 dark:bg-slate-900/70">
                            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-2xl">📦</div>
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Arrays JS Practice</h3>
                                <p class="text-sm text-slate-600 dark:text-slate-300">Repositorio con ejercicios de arrays en JavaScript - sincronizado con GitHub</p>
                            </div>
                            <span class="text-slate-400 group-hover:text-indigo-500 transition">→</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    function hookDWECMainActions() {
        const arraysBtn = viewer.querySelector('[data-action="open-arrays-repo"]');
        if (arraysBtn) {
            arraysBtn.addEventListener('click', () => {
                loadDWECArraysRepo();
            });
        }
        hookInlineLinks();
    }

    // Cache de datos de repos
    let reposData = null;

    async function loadReposData() {
        if (reposData) return reposData;
        try {
            const res = await fetch('data/repos.json');
            reposData = await res.json();
            return reposData;
        } catch (e) {
            console.error('Error cargando repos.json:', e);
            return null;
        }
    }

    // Convertir tree plano a estructura jerárquica para el nivel raíz
    function getTopLevelFiles(files) {
        const topLevel = [];
        const seen = new Set();

        for (const file of files) {
            const parts = file.path.split('/');
            const name = parts[0];

            if (seen.has(name)) continue;
            seen.add(name);

            if (parts.length === 1 && file.type === 'file') {
                topLevel.push({ name, path: file.path, type: 'file', size: file.size });
            } else if (parts.length > 1 || file.type === 'dir') {
                topLevel.push({ name, path: name, type: 'dir', size: 0 });
            }
        }

        return topLevel;
    }

    // Obtener contenido de una carpeta del tree
    function getFolderContents(files, folderPath) {
        const contents = [];
        const seen = new Set();
        const prefix = folderPath + '/';

        for (const file of files) {
            if (!file.path.startsWith(prefix)) continue;

            const relativePath = file.path.slice(prefix.length);
            const parts = relativePath.split('/');
            const name = parts[0];

            if (seen.has(name)) continue;
            seen.add(name);

            if (parts.length === 1 && file.type === 'file') {
                contents.push({ name, path: file.path, type: 'file', size: file.size });
            } else {
                contents.push({ name, path: folderPath + '/' + name, type: 'dir', size: 0 });
            }
        }

        return contents;
    }

    // Cargar repositorio de Arrays
    async function loadDWECArraysRepo() {
        const REPO_OWNER = 'DavidGom1';
        const REPO_NAME = 'Arrays-Js-Practice';

        viewer.innerHTML = loadingTemplate('Arrays JS Practice');

        try {
            const data = await loadReposData();
            const repo = data?.repos?.['dwec-arrays'];

            if (!repo || !repo.files || repo.files.length === 0) {
                throw new Error('Datos no disponibles');
            }

            const lastPush = new Date(repo.pushed_at);
            const lastUpdateText = lastPush.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const topLevelFiles = getTopLevelFiles(repo.files);

            // Guardar archivos completos para navegación de carpetas
            window.DWEC_FILES = repo.files;

            const template = dwecTemplate(lastUpdateText, topLevelFiles, REPO_OWNER, REPO_NAME);
            viewer.innerHTML = template;

            hookDWECActions();
            pushState({ type: 'module', title: 'DWEC - Arrays', html: template }, true);

        } catch (error) {
            console.error('Error al cargar DWEC:', error);
            viewer.innerHTML = repoErrorTemplate('DWEC - Arrays', REPO_OWNER, REPO_NAME, error.message);
            pushState({ type: 'module', title: 'DWEC - Arrays', html: viewer.innerHTML }, true);
        }
    }

    function dwecTemplate(lastUpdate, files, owner, repo) {
        const filesHtml = renderRepoFiles(files);
        return `
            <article class="module-detail viewer-content flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <button data-action="back-to-dwec" class="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 mb-2">
                        <span>←</span> Volver a DWEC
                    </button>
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Repositorio en vivo</span>
                    <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">Arrays JS Practice</h2>
                    <p class="text-sm text-slate-600 dark:text-slate-300">Contenido sincronizado con GitHub</p>
                </div>
                
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                        <span class="text-emerald-500">●</span> Última actualización: ${lastUpdate}
                    </span>
                    <div class="flex items-center gap-2">
                        <a href="https://github.com/${owner}/${repo}/archive/refs/heads/main.zip" 
                            class="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 no-underline transition hover:bg-emerald-500/20 dark:border-emerald-400/30 dark:text-emerald-300"
                            data-open="direct" download>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Descargar ZIP
                        </a>
                        <a href="https://github.com/${owner}/${repo}" target="_blank" rel="noopener"
                            class="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 no-underline transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            data-open="direct">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            Ver en GitHub
                        </a>
                    </div>
                </div>

                <div id="repoFiles" class="space-y-2">
                    ${filesHtml}
                </div>

                <div id="codeViewer" class="hidden rounded-xl border border-slate-200/60 bg-slate-900 p-4 dark:border-white/10">
                    <div class="flex items-center justify-between mb-3">
                        <span id="codeFileName" class="text-sm font-semibold text-white">archivo.js</span>
                        <button id="closeCodeViewer" class="text-slate-400 hover:text-white text-lg">&times;</button>
                    </div>
                    <pre id="codeContent" class="overflow-x-auto text-sm text-green-400 font-mono whitespace-pre-wrap"></pre>
                </div>
            </article>
        `;
    }

    function renderRepoFiles(files) {
        return files
            .sort((a, b) => {
                if (a.type === 'dir' && b.type !== 'dir') return -1;
                if (a.type !== 'dir' && b.type === 'dir') return 1;
                return a.name.localeCompare(b.name);
            })
            .map(file => {
                const icon = file.type === 'dir' ? '📁' : getFileIcon(file.name);
                const size = file.size ? formatFileSize(file.size) : '';

                if (file.type === 'dir') {
                    return `
                        <div class="file-item folder" data-path="${file.path}">
                            <button class="w-full flex items-center gap-3 rounded-lg border border-transparent bg-slate-50/80 px-4 py-3 text-left text-slate-900 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700/80"
                                data-action="toggle-folder" data-folder-path="${file.path}">
                                <span class="text-lg">${icon}</span>
                                <span class="font-medium">${file.name}</span>
                                <span class="ml-auto text-slate-400 folder-arrow">▶</span>
                            </button>
                            <div class="folder-contents hidden ml-4 mt-2 space-y-2"></div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="file-item">
                            <button class="w-full flex items-center gap-3 rounded-lg border border-transparent bg-slate-50/80 px-4 py-3 text-left text-slate-900 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700/80"
                                data-action="view-file" data-file-path="${file.path}" data-file-name="${file.name}">
                                <span class="text-lg">${icon}</span>
                                <span class="font-medium">${file.name}</span>
                                <span class="ml-auto text-xs text-slate-500">${size}</span>
                            </button>
                        </div>
                    `;
                }
            }).join('');
    }

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = { 'js': '📜', 'html': '🌐', 'css': '🎨', 'json': '📋', 'md': '📝', 'txt': '📄' };
        return icons[ext] || '📄';
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function hookDWECActions() {
        // Botón volver a DWEC
        const backToDwec = viewer.querySelector('[data-action="back-to-dwec"]');
        if (backToDwec) {
            backToDwec.addEventListener('click', () => {
                loadDWECModule();
            });
        }

        // Cerrar visor de código
        const closeBtn = document.getElementById('closeCodeViewer');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('codeViewer')?.classList.add('hidden');
            });
        }

        // Carpetas - usando datos locales
        viewer.querySelectorAll('[data-action="toggle-folder"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const path = btn.dataset.folderPath;
                const folderItem = btn.closest('.folder');
                const contents = folderItem.querySelector('.folder-contents');
                const arrow = btn.querySelector('.folder-arrow');

                if (contents.classList.contains('hidden')) {
                    const folderFiles = getFolderContents(window.DWEC_FILES || [], path);
                    contents.innerHTML = renderRepoFiles(folderFiles);
                    contents.classList.remove('hidden');
                    arrow.textContent = '▼';
                    hookDWECActions(); // Re-hook para nuevos elementos
                } else {
                    contents.classList.add('hidden');
                    arrow.textContent = '▶';
                }
            });
        });

        // Archivos - usando raw.githubusercontent.com
        viewer.querySelectorAll('[data-action="view-file"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const path = btn.dataset.filePath;
                const name = btn.dataset.fileName;
                const codeViewer = document.getElementById('codeViewer');
                const codeFileName = document.getElementById('codeFileName');
                const codeContent = document.getElementById('codeContent');

                codeFileName.textContent = name;
                codeContent.textContent = 'Cargando...';
                codeViewer.classList.remove('hidden');

                try {
                    // Usar raw.githubusercontent.com que no tiene rate limit
                    const rawUrl = `https://raw.githubusercontent.com/DavidGom1/Arrays-Js-Practice/main/${path}`;
                    const response = await fetch(rawUrl);
                    const content = await response.text();
                    codeContent.textContent = content;
                } catch (e) {
                    codeContent.textContent = 'Error al cargar el archivo';
                }
            });
        });
    }

    // ========== MÓDULO DWES ==========
    function loadDWESModule() {
        const template = dwesMainTemplate();
        viewer.innerHTML = template;
        hookDWESMainActions();
        pushState({ type: 'module', title: 'DWES', html: template }, true);
    }

    function dwesMainTemplate() {
        return `
            <article class="module-detail viewer-content flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Módulo</span>
                    <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">Desarrollo Web en Entorno Servidor</h2>
                    <p class="text-sm text-slate-600 dark:text-slate-300">PHP, bases de datos, MVC y APIs REST.</p>
                </div>

                <div class="space-y-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Resultados de aprendizaje</span>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="ra-card flex flex-col gap-3 rounded-[1.1rem] border border-dashed border-slate-300 bg-slate-50/50 p-5 dark:border-slate-600 dark:bg-slate-800/30">
                            <span class="text-sm text-slate-400 dark:text-slate-500">Próximamente...</span>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Los cuestionarios de RAs estarán disponibles aquí.</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Recursos de práctica</span>
                    <div class="grid gap-4">
                        <button data-action="open-dwes-examenes"
                            class="tilt-card group flex items-center gap-4 rounded-[1.1rem] border border-slate-200/60 bg-white/80 p-5 text-left shadow-lg transition hover:border-indigo-400 dark:border-white/10 dark:bg-slate-900/70">
                            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-2xl">📝</div>
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Exámenes de otros años</h3>
                                <p class="text-sm text-slate-600 dark:text-slate-300">Colección de exámenes anteriores para practicar - sincronizado con GitHub</p>
                            </div>
                            <span class="text-slate-400 group-hover:text-indigo-500 transition">→</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    function hookDWESMainActions() {
        const examenesBtn = viewer.querySelector('[data-action="open-dwes-examenes"]');
        if (examenesBtn) {
            examenesBtn.addEventListener('click', () => {
                loadDWESExamenesRepo();
            });
        }
        hookInlineLinks();
    }

    async function loadDWESExamenesRepo() {
        const REPO_OWNER = 'DavidGom1';
        const REPO_NAME = 'DWES-Examenes-otros-a-os';

        viewer.innerHTML = loadingTemplate('Exámenes DWES');

        try {
            const data = await loadReposData();
            const repo = data?.repos?.['dwes-examenes'];

            if (!repo || !repo.files || repo.files.length === 0) {
                throw new Error('Datos no disponibles');
            }

            const lastPush = new Date(repo.pushed_at);
            const lastUpdateText = lastPush.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const topLevelFiles = getTopLevelFiles(repo.files);

            // Guardar archivos completos para navegación de carpetas
            window.DWES_FILES = repo.files;

            const template = dwesRepoTemplate(lastUpdateText, topLevelFiles, REPO_OWNER, REPO_NAME);
            viewer.innerHTML = template;

            hookDWESActions();
            pushState({ type: 'module', title: 'DWES - Exámenes', html: template }, true);

        } catch (error) {
            console.error('Error al cargar DWES:', error);
            viewer.innerHTML = repoErrorTemplate('DWES - Exámenes', REPO_OWNER, REPO_NAME, error.message);
            pushState({ type: 'module', title: 'DWES - Exámenes', html: viewer.innerHTML }, true);
        }
    }

    function dwesRepoTemplate(lastUpdate, files, owner, repo) {
        const filesHtml = renderDWESRepoFiles(files);
        return `
            <article class="module-detail viewer-content flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <button data-action="back-to-dwes" class="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 mb-2">
                        <span>←</span> Volver a DWES
                    </button>
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Repositorio en vivo</span>
                    <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">Exámenes de otros años</h2>
                    <p class="text-sm text-slate-600 dark:text-slate-300">Contenido sincronizado con GitHub</p>
                </div>
                
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                        <span class="text-emerald-500">●</span> Última actualización: ${lastUpdate}
                    </span>
                    <div class="flex items-center gap-2">
                        <a href="https://github.com/${owner}/${repo}/archive/refs/heads/main.zip" 
                            class="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 no-underline transition hover:bg-emerald-500/20 dark:border-emerald-400/30 dark:text-emerald-300"
                            data-open="direct" download>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Descargar ZIP
                        </a>
                        <a href="https://github.com/${owner}/${repo}" target="_blank" rel="noopener"
                            class="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 no-underline transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            data-open="direct">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            Ver en GitHub
                        </a>
                    </div>
                </div>

                <div id="dwesRepoFiles" class="space-y-2">
                    ${filesHtml}
                </div>

                <div id="dwesCodeViewer" class="hidden rounded-xl border border-slate-200/60 bg-slate-900 p-4 dark:border-white/10">
                    <div class="flex items-center justify-between mb-3">
                        <span id="dwesCodeFileName" class="text-sm font-semibold text-white">archivo.php</span>
                        <button id="closeDwesCodeViewer" class="text-slate-400 hover:text-white text-lg">&times;</button>
                    </div>
                    <pre id="dwesCodeContent" class="overflow-x-auto text-sm text-green-400 font-mono whitespace-pre-wrap"></pre>
                </div>
            </article>
        `;
    }

    function renderDWESRepoFiles(files) {
        return files
            .sort((a, b) => {
                if (a.type === 'dir' && b.type !== 'dir') return -1;
                if (a.type !== 'dir' && b.type === 'dir') return 1;
                return a.name.localeCompare(b.name);
            })
            .map(file => {
                const icon = file.type === 'dir' ? '📁' : getDWESFileIcon(file.name);
                const size = file.size ? formatFileSize(file.size) : '';

                if (file.type === 'dir') {
                    return `
                        <div class="dwes-file-item folder" data-path="${file.path}">
                            <button class="w-full flex items-center gap-3 rounded-lg border border-transparent bg-slate-50/80 px-4 py-3 text-left text-slate-900 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700/80"
                                data-action="dwes-toggle-folder" data-folder-path="${file.path}">
                                <span class="text-lg">${icon}</span>
                                <span class="font-medium">${file.name}</span>
                                <span class="ml-auto text-slate-400 dwes-folder-arrow">▶</span>
                            </button>
                            <div class="dwes-folder-contents hidden ml-4 mt-2 space-y-2"></div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="dwes-file-item">
                            <button class="w-full flex items-center gap-3 rounded-lg border border-transparent bg-slate-50/80 px-4 py-3 text-left text-slate-900 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700/80"
                                data-action="dwes-view-file" data-file-path="${file.path}" data-file-name="${file.name}">
                                <span class="text-lg">${icon}</span>
                                <span class="font-medium">${file.name}</span>
                                <span class="ml-auto text-xs text-slate-500">${size}</span>
                            </button>
                        </div>
                    `;
                }
            }).join('');
    }

    function getDWESFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'php': '🐘', 'html': '🌐', 'css': '🎨', 'js': '📜',
            'json': '📋', 'md': '📝', 'txt': '📄', 'sql': '🗃️',
            'zip': '📦', 'pdf': '📕'
        };
        return icons[ext] || '📄';
    }

    function hookDWESActions() {
        // Botón volver a DWES
        const backToDwes = viewer.querySelector('[data-action="back-to-dwes"]');
        if (backToDwes) {
            backToDwes.addEventListener('click', () => {
                loadDWESModule();
            });
        }

        // Cerrar visor de código
        const closeBtn = document.getElementById('closeDwesCodeViewer');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('dwesCodeViewer')?.classList.add('hidden');
            });
        }

        // Carpetas - usando datos locales
        viewer.querySelectorAll('[data-action="dwes-toggle-folder"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const path = btn.dataset.folderPath;
                const folderItem = btn.closest('.folder');
                const contents = folderItem.querySelector('.dwes-folder-contents');
                const arrow = btn.querySelector('.dwes-folder-arrow');

                if (contents.classList.contains('hidden')) {
                    const folderFiles = getFolderContents(window.DWES_FILES || [], path);
                    contents.innerHTML = renderDWESRepoFiles(folderFiles);
                    contents.classList.remove('hidden');
                    arrow.textContent = '▼';
                    hookDWESActions();
                } else {
                    contents.classList.add('hidden');
                    arrow.textContent = '▶';
                }
            });
        });

        // Archivos - usando raw.githubusercontent.com
        viewer.querySelectorAll('[data-action="dwes-view-file"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const path = btn.dataset.filePath;
                const name = btn.dataset.fileName;
                const ext = name.split('.').pop().toLowerCase();

                // Si es ZIP o PDF, descargar directamente
                if (ext === 'zip' || ext === 'pdf') {
                    window.open(`https://raw.githubusercontent.com/DavidGom1/DWES-Examenes-otros-a-os/main/${path}`, '_blank');
                    return;
                }

                const codeViewer = document.getElementById('dwesCodeViewer');
                const codeFileName = document.getElementById('dwesCodeFileName');
                const codeContent = document.getElementById('dwesCodeContent');

                codeFileName.textContent = name;
                codeContent.textContent = 'Cargando...';
                codeViewer.classList.remove('hidden');

                try {
                    const rawUrl = `https://raw.githubusercontent.com/DavidGom1/DWES-Examenes-otros-a-os/main/${path}`;
                    const response = await fetch(rawUrl);
                    const content = await response.text();
                    codeContent.textContent = content;
                } catch (e) {
                    codeContent.textContent = 'Error al cargar el archivo';
                }
            });
        });
    }

    function loadingTemplate(label) {
        return `
            <div class="viewer-content grid min-h-[320px] place-items-center gap-4 text-slate-600 dark:text-slate-200" role="status">
                <div class="h-12 w-12 rounded-full border-4 border-indigo-200/70 border-t-indigo-500 animate-spin" aria-hidden="true"></div>
                <p class="text-sm font-medium">Cargando ${label}...</p>
            </div>
        `;
    }

    function moduleTemplate(title, content) {
        return `
            <article class="module-detail viewer-content flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Módulo</span>
                    <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">${title}</h2>
                </div>
                <div class="flex flex-col gap-5 text-slate-600 dark:text-slate-300">
                    ${content}
                </div>
            </article>
        `;
    }

    function notebookTemplate() {
        return `
            <p>
                Links a los cuadernos de las asignaturas.
            </p>
            <div class="grid gap-5 md:grid-cols-2">
                <!-- Cuadernos no disponibles actualmente -->
                <div class="col-span-full rounded-[1.1rem] border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <p>No hay cuadernos disponibles por el momento.</p>
                </div>
            </div>
        `;
    }

    function notebookEntry(name, description, key, link = '#') {
        return `
            <article class="tilt-card group flex flex-col gap-4 rounded-[1.2rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_38px_rgba(15,23,42,0.08)] transition duration-300 ease-out hover:border-indigo-300/80 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_18px_38px_rgba(0,0,0,0.45)]">
                <div class="space-y-1">
                    <span class="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400/80">Cuaderno</span>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${name}</h3>
                    <p class="text-sm text-slate-600 dark:text-slate-300">${description}</p>
                </div>
                <a class="inline-flex items-center justify-center rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-indigo-400/30 dark:text-indigo-100" href="${link}" target="_blank" rel="noopener" data-notebook="${key}" data-open="direct">Ir al cuaderno</a>
            </article>
        `;
    }

    function errorTemplate(label) {
        return `
            <article class="viewer-content rounded-[1.25rem] border border-dashed border-slate-300/80 bg-white/80 p-6 text-center text-slate-600 shadow-inner dark:border-white/30 dark:bg-slate-900/70 dark:text-slate-200">
                <h3 class="text-xl font-semibold text-slate-900 dark:text-white">No se pudo abrir ${label}</h3>
                <p class="mt-2">Revisa el archivo o inténtalo de nuevo más tarde.</p>
            </article>
        `;
    }

    function repoErrorTemplate(label, owner, repo, errorMsg) {
        const isRateLimit = errorMsg && errorMsg.includes('rate limit');
        const message = isRateLimit
            ? 'Se ha superado el límite de peticiones a GitHub. Puedes acceder directamente al repositorio o descargar el ZIP.'
            : 'No se pudo cargar el contenido del repositorio. Puedes acceder directamente a GitHub.';

        return `
            <article class="module-detail viewer-content flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Repositorio</span>
                    <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">${label}</h2>
                </div>
                
                <div class="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">⚠️</span>
                        <div>
                            <h3 class="font-semibold text-amber-700 dark:text-amber-300">No se pudo cargar</h3>
                            <p class="text-sm text-amber-600 dark:text-amber-200 mt-1">${message}</p>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3">
                    <a href="https://github.com/${owner}/${repo}/archive/refs/heads/main.zip" 
                        class="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-600 no-underline transition hover:bg-emerald-500/20 dark:border-emerald-400/30 dark:text-emerald-300"
                        data-open="direct" download>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Descargar ZIP
                    </a>
                    <a href="https://github.com/${owner}/${repo}" target="_blank" rel="noopener"
                        class="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-900 no-underline transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        data-open="direct">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        Ver en GitHub
                    </a>
                </div>
            </article>
        `;
    }

    function showNotice(title, message) {
        const template = `
            <article class="viewer-content rounded-[1.25rem] border border-dashed border-slate-300/80 bg-white/80 p-6 text-center text-slate-600 shadow-inner dark:border-white/30 dark:bg-slate-900/70 dark:text-slate-200">
                <h3 class="text-xl font-semibold text-slate-900 dark:text-white">${title}</h3>
                <p class="mt-2">${message}</p>
            </article>
        `;
        viewer.innerHTML = template;
        pushState({ type: 'notice', html: template }, true);
    }

    function hookInlineLinks() {
        viewer.querySelectorAll('a').forEach(anchor => {
            anchor.addEventListener('click', evt => {
                if (anchor.dataset.open === 'direct') {
                    return;
                }
                const href = anchor.getAttribute('href') || '';
                if (!href || href === '#') {
                    evt.preventDefault();
                    showToast('En construcción');
                    return;
                }
                if (isDaypoLink(href)) {
                    // Evita el iframe para Daypo, que prohíbe el embebido.
                    evt.preventDefault();
                    window.open(href, '_blank', 'noopener');
                    return;
                }
                const url = new URL(href, window.location.href);
                const isLocal = url.origin === window.location.origin;
                if (isLocal && url.pathname.endsWith('.html')) {
                    evt.preventDefault();
                    loadModule(url, anchor.textContent.trim() || 'Detalle');
                    return;
                }
                evt.preventDefault();
                const raTitle = anchor.closest('.ra-card')?.querySelector('h3')?.textContent.trim();
                const label = anchor.dataset.label || raTitle || anchor.textContent.trim() || 'Recurso';
                openExternal(url.href, label);
            });
        });

        // Setup acordeones después de cargar el módulo
        setupAccordions();
    }

    function setupAccordions() {
        // 1. Configurar acordeones de evaluaciones (comportamiento exclusivo)
        const evaluationDetails = viewer.querySelectorAll('details.group');

        evaluationDetails.forEach((details, idx) => {
            const summary = details.querySelector('summary');
            if (!summary) return;

            // Preparar wrapper de contenido
            let content = details.querySelector('.accordion-content');
            if (!content) {
                content = document.createElement('div');
                content.className = 'accordion-content';
                content.style.overflow = 'hidden';

                let nextNode = summary.nextSibling;
                while (nextNode) {
                    const nodeToMove = nextNode;
                    nextNode = nextNode.nextSibling;
                    content.appendChild(nodeToMove);
                }
                details.appendChild(content);
            }

            const newSummary = summary.cloneNode(true);
            summary.parentNode.replaceChild(newSummary, summary);

            newSummary.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = details.hasAttribute('open');

                if (isOpen) {
                    closeAccordion(details, content);
                } else {
                    // Cerrar otros acordeones de evaluación
                    evaluationDetails.forEach(other => {
                        if (other !== details && other.hasAttribute('open')) {
                            const otherContent = other.querySelector('.accordion-content');
                            if (otherContent) closeAccordion(other, otherContent);
                        }
                    });
                    openAccordion(details, content);
                }
            });
        });

        // 2. Configurar acordeones de versiones RA (comportamiento independiente)
        const raDetails = viewer.querySelectorAll('.ra-multi');
        ('📦 Configurando acordeones de versiones RA:', raDetails.length);

        raDetails.forEach((details, idx) => {
            const summary = details.querySelector('summary');
            if (!summary) return;

            let content = details.querySelector('.accordion-content');
            if (!content) {
                content = document.createElement('div');
                content.className = 'accordion-content';
                content.style.overflow = 'hidden';

                let nextNode = summary.nextSibling;
                while (nextNode) {
                    const nodeToMove = nextNode;
                    nextNode = nextNode.nextSibling;
                    content.appendChild(nodeToMove);
                }
                details.appendChild(content);
            }

            const newSummary = summary.cloneNode(true);
            summary.parentNode.replaceChild(newSummary, summary);

            newSummary.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = details.hasAttribute('open');

                if (isOpen) {
                    closeAccordion(details, content);
                } else {
                    openAccordion(details, content);
                }
            });
        });
    }

    function closeAccordion(details, content) {
        const startHeight = content.scrollHeight;

        content.style.height = `${startHeight}px`;
        content.style.transition = 'height 0.3s ease-out';

        requestAnimationFrame(() => {
            content.style.height = '0px';
        });

        const onEnd = () => {
            if (content.style.height === '0px') {
                details.removeAttribute('open');
            }
            content.style.removeProperty('height');
            content.style.removeProperty('transition');
            content.removeEventListener('transitionend', onEnd);
        };

        content.addEventListener('transitionend', onEnd);
    }

    function openAccordion(details, content) {
        details.setAttribute('open', '');

        const targetHeight = content.scrollHeight;

        content.style.height = '0px';
        content.style.transition = 'height 0.3s ease-out';

        requestAnimationFrame(() => {
            content.style.height = `${targetHeight}px`;
        });

        const onEnd = () => {
            if (content.style.height !== '0px') {
                content.style.removeProperty('height');
                content.style.removeProperty('transition');
            }
            content.removeEventListener('transitionend', onEnd);
        };

        content.addEventListener('transitionend', onEnd);
    }

    function openExternal(url, label) {
        if (isDaypoLink(url)) {
            window.open(url, '_blank', 'noopener');
            return;
        }
        embedLoader.hidden = false;
        embedFrame.src = 'about:blank';
        embedTitle.textContent = label;
        embedWrapper.setAttribute('aria-hidden', 'false');
        embedWrapper.classList.remove('hidden');
        embedWrapper.classList.add('flex');
        embedFrame.src = url;
        embedFrame.onload = () => {
            embedLoader.hidden = true;
        };
        pushState({ type: 'external', title: label, url }, true);
    }

    function hideEmbed(isPassive = false) {
        embedWrapper.classList.add('hidden');
        embedWrapper.classList.remove('flex');
        embedWrapper.setAttribute('aria-hidden', 'true');
        embedFrame.src = 'about:blank';
        if (!isPassive) {
            const lastState = stateStack[stateStack.length - 1];
            if (lastState && lastState.type === 'external') {
                stateStack.pop();
            }
            updateBackButton();
        }
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            if (!embedWrapper.classList.contains('hidden')) {
                hideEmbed();
                return;
            }
            if (appbar?.dataset.expanded === 'true') {
                collapseAppbarMenu();
            }
        }
    });

    document.addEventListener('click', event => {
        if (window.innerWidth >= 1024) return;
        if (appbar?.dataset.expanded !== 'true') return;
        if (!appbar.contains(event.target)) {
            collapseAppbarMenu();
        }
    });

    let toastTimeout;
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('translate-y-full');
        toast.classList.add('translate-y-0');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('translate-y-full');
            toast.classList.remove('translate-y-0');
        }, 2600);
    }

    function isDaypoLink(href) {
        if (!href) {
            return false;
        }
        try {
            const url = new URL(href, window.location.href);
            return url.hostname.endsWith('daypo.com');
        } catch (error) {
            return false;
        }
    }

    function expandAppbarMenu() {
        if (!appbar || !appbarMenu) return;
        appbar.dataset.expanded = 'true';
        appbarMenu.removeAttribute('hidden');
        mobileMenuToggle?.setAttribute('aria-expanded', 'true');
        mobileMenuToggle?.setAttribute('aria-label', 'Cerrar menú');
    }

    function collapseAppbarMenu(skipAnimation = false) {
        if (!appbar || !appbarMenu) return;
        if (skipAnimation) {
            const previousTransition = appbarMenu.style.transition;
            appbarMenu.style.transition = 'none';
            appbar.dataset.expanded = 'false';
            requestAnimationFrame(() => {
                appbarMenu.style.transition = previousTransition;
            });
        } else {
            appbar.dataset.expanded = 'false';
        }
        mobileMenuToggle?.setAttribute('aria-expanded', 'false');
        mobileMenuToggle?.setAttribute('aria-label', 'Abrir menú');
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            return;
        }
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('./sw.js')
                .catch(error => console.error('Fallo al registrar el service worker', error));
        });
    }
});
