document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const viewer = document.getElementById('viewer');
    const backButton = document.getElementById('backButton');
    const themeToggle = document.getElementById('themeToggle');
    const themeStatus = document.getElementById('themeStatus');
    const toast = document.getElementById('toast');
    const embedWrapper = document.getElementById('embedWrapper');
    const embedFrame = document.getElementById('embedFrame');
    const embedTitle = document.getElementById('embedTitle');
    const embedLoader = document.getElementById('embedLoader');
    const closeEmbed = document.getElementById('closeEmbed');
    const moduleLinks = document.querySelectorAll('.module-link');
    const stateStack = [];

    const initialState = { type: 'home' };
    stateStack.push(initialState);
    renderState(initialState);
    updateBackButton();

    const storedTheme = localStorage.getItem('preferred-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

    themeToggle.addEventListener('click', () => {
        const next = body.dataset.theme === 'light' ? 'dark' : 'light';
        themeStatus.textContent = next === 'light' ? 'Modo claro' : 'Modo oscuro';
        setTheme(next);
    });

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
            loadModule(href, label);
        });
    });

    function setTheme(theme) {
        body.dataset.theme = theme;
        localStorage.setItem('preferred-theme', theme);
        themeToggle.textContent = theme === 'light' ? '\u263E' : '\u2600';
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
            <section class="hero viewer-content">
                <div>
                    <h2>Todo tu curso en una sola vista.</h2>
                    <p>Activa el modo oscuro, abre los tests Daypo dentro del hub y utiliza el botón volver para navegar rápido entre módulos.</p>
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

    async function loadModule(url, label) {
        viewer.innerHTML = loadingTemplate(label);
        try {
            const response = await fetch(url);
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
            <div class="loading viewer-content" role="status">
                <div class="spinner" aria-hidden="true"></div>
                <p>Cargando ${label}...</p>
            </div>
        `;
    }

    function moduleTemplate(title, content) {
        return `
            <article class="module-detail viewer-content">
                <div class="module-detail__header">
                    <span class="eyebrow">Módulo</span>
                    <h2>${title}</h2>
                </div>
                <div class="module-detail__body">
                    ${content}
                </div>
            </article>
        `;
    }

    function errorTemplate(label) {
        return `
            <article class="notice-card viewer-content">
                <h3>No se pudo abrir ${label}</h3>
                <p>Revisa el archivo o inténtalo de nuevo más tarde.</p>
            </article>
        `;
    }

    function showNotice(title, message) {
        const template = `
            <article class="notice-card viewer-content">
                <h3>${title}</h3>
                <p>${message}</p>
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
                    loadModule(url.pathname.replace(/^\//, ''), anchor.textContent.trim() || 'Detalle');
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
        embedWrapper.classList.add('active');
        embedFrame.src = url;
        embedFrame.onload = () => {
            embedLoader.hidden = true;
        };
        pushState({ type: 'external', title: label, url }, true);
    }

    function hideEmbed(isPassive = false) {
        embedWrapper.classList.remove('active');
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
        if (event.key === 'Escape' && embedWrapper.classList.contains('active')) {
            hideEmbed();
        }
    });

    let toastTimeout;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
    }
});
