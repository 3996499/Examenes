document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const root = document.documentElement;
    const backgroundLayer = document.createElement('div');
    backgroundLayer.id = 'interactiveBackground';
    backgroundLayer.setAttribute('aria-hidden', 'true');
    document.body.prepend(backgroundLayer);

    let pointerX = window.innerWidth * 0.5;
    let pointerY = window.innerHeight * 0.4;
    let rafId = null;

    const applyPointerPosition = () => {
        const xPercent = (pointerX / window.innerWidth) * 100;
        const yPercent = (pointerY / window.innerHeight) * 100;
        const tiltX = (xPercent - 50) / 50;
        const tiltY = (yPercent - 50) / 50;

        root.style.setProperty('--cursor-x', `${xPercent}%`);
        root.style.setProperty('--cursor-y', `${yPercent}%`);
        root.style.setProperty('--cursor-tilt-x', tiltX.toFixed(4));
        root.style.setProperty('--cursor-tilt-y', tiltY.toFixed(4));
        rafId = null;
    };

    const queueUpdate = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(applyPointerPosition);
    };

    const handlePointerMove = event => {
        const point = event.touches ? event.touches[0] : event;
        pointerX = point.clientX;
        pointerY = point.clientY;
        queueUpdate();
    };

    const resetPointer = () => {
        pointerX = window.innerWidth * 0.5;
        pointerY = window.innerHeight * 0.4;
        queueUpdate();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', resetPointer);
    window.addEventListener('resize', resetPointer);

    applyPointerPosition();
});
