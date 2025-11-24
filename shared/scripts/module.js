document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeStatus = document.getElementById('themeStatus');
    const toast = document.getElementById('toast');
    const embedWrapper = document.getElementById('embedWrapper');
    const embedFrame = document.getElementById('embedFrame');
    const embedTitle = document.getElementById('embedTitle');
    const embedLoader = document.getElementById('embedLoader');
    const closeEmbed = document.getElementById('closeEmbed');

    if (!themeToggle || !toast || !embedWrapper || !embedFrame || !embedTitle || !embedLoader || !closeEmbed) {
        return;
    }

    const storedTheme = localStorage.getItem('preferred-theme');
    // Default to dark to match inline script and avoid flash
    setTheme(storedTheme || 'dark');

    themeToggle.addEventListener('click', () => {
        setTheme(body.dataset.theme === 'light' ? 'dark' : 'light');
    });

    document.querySelectorAll('.ra-card a').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const href = anchor.getAttribute('href') || '';
            if (!href || href === '#') {
                event.preventDefault();
                showToast('Este RA está en construcción');
                return;
            }

            if (isDaypoLink(href)) {
                // Daypo bloquea iframes, así que lo abrimos en nueva pestaña.
                event.preventDefault();
                window.open(href, '_blank', 'noopener');
                return;
            }

            event.preventDefault();
            const label = anchor.dataset.label
                || anchor.closest('.ra-card')?.querySelector('h3')?.textContent.trim()
                || anchor.textContent.trim();
            openExternal(href, label || 'Recurso');
        });
    });

    closeEmbed.addEventListener('click', hideEmbed);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !embedWrapper.classList.contains('hidden')) {
            hideEmbed();
        }
    });

    function setTheme(theme) {
        body.dataset.theme = theme;
        const isDark = theme === 'dark';
        root.classList.toggle('dark', isDark);
        body.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('preferred-theme', theme);
        themeToggle.textContent = theme === 'light' ? '\u2600' : '\u263E';
        if (themeStatus) {
            themeStatus.textContent = theme === 'light' ? 'Modo claro' : 'Modo oscuro';
        }
    }

    function openExternal(url, label) {
        embedLoader.hidden = false;
        embedFrame.src = 'about:blank';
        embedTitle.textContent = label;
        embedWrapper.classList.remove('hidden');
        embedWrapper.classList.add('flex');
        embedWrapper.setAttribute('aria-hidden', 'false');
        embedFrame.src = url;
        embedFrame.onload = () => {
            embedLoader.hidden = true;
        };
    }

    function hideEmbed() {
        embedWrapper.classList.add('hidden');
        embedWrapper.classList.remove('flex');
        embedWrapper.setAttribute('aria-hidden', 'true');
        embedFrame.src = 'about:blank';
    }

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
        }, 2400);
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
});
