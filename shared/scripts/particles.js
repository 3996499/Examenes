document.addEventListener('DOMContentLoaded', () => {
    const plasmaWrapper = injectPlasmaBackdrop();
    setupMotionControls(plasmaWrapper);
});

function injectPlasmaBackdrop() {
    let wrapper = document.querySelector('.plasma-wrapper');
    if (wrapper) {
        return wrapper;
    }

    wrapper = document.createElement('div');
    wrapper.className = 'plasma-wrapper';
    wrapper.setAttribute('aria-hidden', 'true');

    for (let i = 1; i <= 2; i++) {
        const gradient = document.createElement('div');
        gradient.className = `plasma-gradient plasma-gradient-${i}`;
        wrapper.appendChild(gradient);
    }

    document.body.prepend(wrapper);
    return wrapper;
}

function setupMotionControls(plasmaWrapper) {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const applyPreference = () => {
        const shouldReduce = shouldReduceMotion(motionQuery.matches);
        document.documentElement.classList.toggle('reduced-motion', shouldReduce);
        plasmaWrapper?.classList.toggle('plasma-wrapper--reduced', shouldReduce);
    };

    applyPreference();
    addChangeListener(motionQuery, applyPreference);
    connection?.addEventListener?.('change', applyPreference);
}

function shouldReduceMotion(prefersReduced) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection?.saveData);
    const slowNetwork = connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType);
    const lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;

    return Boolean(prefersReduced || saveData || slowNetwork || lowCpu || lowMemory);
}

function addChangeListener(mediaQueryList, callback) {
    if (!mediaQueryList || typeof callback !== 'function') {
        return;
    }

    if (typeof mediaQueryList.addEventListener === 'function') {
        mediaQueryList.addEventListener('change', callback);
    } else if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(callback);
    }
}
