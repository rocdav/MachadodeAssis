(function () {
    const ENTER_LABEL = 'Tela cheia';
    const EXIT_LABEL = 'Sair';
    const ENTER_ICON = '⛶';
    const EXIT_ICON = '✕';

    function fsElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }
    function canRequestFullscreen() {
        const el = document.documentElement;
        return !!(el.requestFullscreen || el.webkitRequestFullscreen);
    }
    function requestFs() {
        const el = document.documentElement;
        const fn = el.requestFullscreen || el.webkitRequestFullscreen;
        try {
            const p = fn.call(el);
            return p && typeof p.then === 'function' ? p : Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }
    function exitFs() {
        const fn = document.exitFullscreen || document.webkitExitFullscreen;
        if (!fn) return Promise.resolve();
        try {
            const p = fn.call(document);
            return p && typeof p.then === 'function' ? p : Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }
    function inIframe() {
        try { return window.self !== window.top; } catch (e) { return true; }
    }
    function openInNewTab() {
        window.open(location.href, '_blank', 'noopener');
    }
    function setLabel(btn, isFs) {
        btn.querySelector('.gaz-fs-icon').textContent = isFs ? EXIT_ICON : ENTER_ICON;
        btn.querySelector('.gaz-fs-label').textContent = isFs ? EXIT_LABEL : ENTER_LABEL;
        btn.setAttribute('aria-label', isFs ? 'Sair da tela cheia' : 'Ver em tela cheia');
    }

    function init() {
        if (document.querySelector('.gaz-fs-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gaz-fs-btn';
        btn.innerHTML = '<span class="gaz-fs-icon" aria-hidden="true">' + ENTER_ICON + '</span><span class="gaz-fs-label">' + ENTER_LABEL + '</span>';
        btn.setAttribute('aria-label', 'Ver em tela cheia');
        document.body.appendChild(btn);

        btn.addEventListener('click', function () {
            if (fsElement()) {
                exitFs().catch(function () {});
                return;
            }
            if (!canRequestFullscreen()) {
                openInNewTab();
                return;
            }
            requestFs().catch(function () {
                openInNewTab();
            });
        });

        function onChange() {
            const isFs = !!fsElement();
            setLabel(btn, isFs);
            setTimeout(function () {
                window.dispatchEvent(new Event('resize'));
                if (window._gazMap && typeof window._gazMap.invalidateSize === 'function') {
                    window._gazMap.invalidateSize();
                }
                if (window._gazNetwork && typeof window._gazNetwork.redraw === 'function') {
                    window._gazNetwork.redraw();
                }
            }, 120);
        }
        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
