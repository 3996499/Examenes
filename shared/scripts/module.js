('🎬 MODULE.JS LOADED - VERSION 3.0');

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const root = document.documentElement;

    // ========================================
    // SETUP ACCORDIONS (must run always)
    // ========================================
    setupAccordions();

    function setupAccordions() {
        // 1. Acordeones de evaluación
        const evaluationDetails = document.querySelectorAll('details.group');

        evaluationDetails.forEach((details) => {
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

            summary.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = details.hasAttribute('open');

                if (isOpen) {
                    closeAccordion(details, content);
                } else {
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

        // 2. Acordeones de versiones RA
        const raDetails = document.querySelectorAll('.ra-multi');

        raDetails.forEach((details) => {
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

            summary.addEventListener('click', (e) => {
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

    // ========================================
    // THEME & EMBED SETUP
    // ========================================
    const themeToggle = document.getElementById('themeToggle');
    const themeStatus = document.getElementById('themeStatus');
    const toast = document.getElementById('toast');
    const embedWrapper = document.getElementById('embedWrapper');
    const embedFrame = document.getElementById('embedFrame');
    const embedTitle = document.getElementById('embedTitle');
    const embedLoader = document.getElementById('embedLoader');
    const closeEmbed = document.getElementById('closeEmbed');

    if (!themeToggle || !toast || !embedWrapper || !embedFrame || !embedTitle || !embedLoader || !closeEmbed) {
        console.warn('Some theme/embed elements missing, skipping those features');
        return;
    }

    const storedTheme = localStorage.getItem('preferred-theme');
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
                event.preventDefault();
                window.open(href, '_blank', 'noopener');
                return;
            }

            if (isLocalHtmlLink(href)) {
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
        if (!href) return false;
        try {
            const url = new URL(href, window.location.href);
            return url.hostname.endsWith('daypo.com');
        } catch (error) {
            return false;
        }
    }

    function isLocalHtmlLink(href) {
        if (!href) return false;
        try {
            const url = new URL(href, window.location.href);
            const sameOrigin = url.origin === window.location.origin;
            const isHtml = url.pathname.endsWith('.html');
            return sameOrigin && isHtml;
        } catch (error) {
            return href.endsWith('.html');
        }
    }
});
