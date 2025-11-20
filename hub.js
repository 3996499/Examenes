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
    const stateStack = [];
    const storageKey = 'preferred-theme';

    const initialState = { type: 'home' };
    stateStack.push(initialState);
    renderState(initialState);
    updateBackButton();

    registerServiceWorker();

    const storedTheme = getStoredTheme();
    setTheme(storedTheme || window.__preferredTheme || 'dark');

    themeToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const next = body.dataset.theme === 'light' ? 'dark' : 'light';
            setTheme(next);
        });
    });

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
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

    function setTheme(theme) {
        body.dataset.theme = theme;
        root.classList.toggle('dark', theme === 'dark');
        body.classList.toggle('dark', theme === 'dark');
        persistTheme(theme);
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
                window.open('https://www.daypo.com/', '_blank');
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
                const href = anchor.getAttribute('href') || '';
                if (!href || href === '#') {
                    evt.preventDefault();
                    showToast('En construcción');
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

    function persistTheme(theme) {
        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            // Ignored: storage might be unavailable in some contexts.
        }
    }

    function getStoredTheme() {
        try {
            return localStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
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
