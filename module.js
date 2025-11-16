document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
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
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

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
            event.preventDefault();
            const label = anchor.dataset.label
                || anchor.closest('.ra-card')?.querySelector('h3')?.textContent.trim()
                || anchor.textContent.trim();
            openExternal(href, label || 'Recurso');
        });
    });

    closeEmbed.addEventListener('click', hideEmbed);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && embedWrapper.classList.contains('active')) {
            hideEmbed();
        }
    });

    function setTheme(theme) {
        body.dataset.theme = theme;
        localStorage.setItem('preferred-theme', theme);
        themeToggle.textContent = theme === 'light' ? '\u263E' : '\u2600';
    }

    function openExternal(url, label) {
        embedLoader.hidden = false;
        embedFrame.src = 'about:blank';
        embedTitle.textContent = label;
        embedWrapper.classList.add('active');
        embedWrapper.setAttribute('aria-hidden', 'false');
        embedFrame.src = url;
        embedFrame.onload = () => {
            embedLoader.hidden = true;
        };
    }

    function hideEmbed() {
        embedWrapper.classList.remove('active');
        embedWrapper.setAttribute('aria-hidden', 'true');
        embedFrame.src = 'about:blank';
    }

    let toastTimeout;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2400);
    }
});
