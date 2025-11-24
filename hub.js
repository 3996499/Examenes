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
            event.preventDefault();
            const href = link.getAttribute('href') || '#';
            const label = link.dataset.label || link.textContent.trim();
            if (!href || href === '#') {
                showNotice(`${label} está en construcción.`, 'Estamos preparando los retos y materiales de este módulo.');
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
                <div class="space-y-4">
                    <span class="inline-flex items-center rounded-full bg-indigo-500/10 px-4 py-1 text-sm font-semibold text-indigo-400 dark:text-indigo-200">Hub interactivo</span>
                    <h2 class="text-3xl font-semibold text-slate-900 dark:text-white">Practica para tus exámenes.</h2>
                    <p class="text-lg text-slate-600 dark:text-slate-300">Activa el modo oscuro, abre los tests Daypo dentro del hub y utiliza el botón volver para navegar rápido entre módulos.</p>
                </div>
                <div class="flex flex-wrap gap-3">
                    <button data-action="visit-daypo"
                        class="inline-flex items-center rounded-full border border-slate-300/70 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/20 dark:text-white">
                        Abrir Daypo
                    </button>
                </div>
            </section>
        `;
    }

    function attachHomeActions() {
        const scrollButton = viewer.querySelector('[data-action="scroll-nav"]');
        const daypoButton = viewer.querySelector('[data-action="visit-daypo"]');
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
            const snippet = main ? main.innerHTML : doc.body.innerHTML;
            const template = moduleTemplate(label, snippet);
            viewer.innerHTML = template;
            hookInlineLinks();
            pushState({ type: 'module', title: label, html: template }, true);
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
                ${notebookEntry('DWEC', 'Conceptos clave de JavaScript en entorno cliente.', 'dwec', 'https://notebooklm.google.com/notebook/d4ab9e00-b333-46c7-bd04-d07fddbc4ebc')}
                ${notebookEntry('DWES', 'Backend con PHP y servicios complementarios.', 'dwes', 'https://notebooklm.google.com/notebook/4e099eaf-b752-4229-8031-15249c1346f8')}
                ${notebookEntry('DAW', 'Despliegue y administración de aplicaciones web.', 'daw','https://notebooklm.google.com/notebook/b76c0e0a-97a3-4ca0-b860-6db1741c4e95')}
                ${notebookEntry('DIW', 'Interfaces web y diseño responsive.', 'diw', 'https://notebooklm.google.com/notebook/5f65dbcc-3ae9-46ad-84fa-d689cbf0714d')}
                ${notebookEntry('PYTHON', 'Automatizaciones y scripts para afrontar los retos.', 'python', 'https://notebooklm.google.com/notebook/5d6d7b9d-c296-4d4d-9232-8dc3bfb04a25')}
                ${notebookEntry('SASP', 'Sostenibilidad y proyectos sociales.', 'sasp', 'https://notebooklm.google.com/notebook/dd815534-2c57-499e-843d-34c83fb3e153')}
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
