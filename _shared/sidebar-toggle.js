(function () {
    var MOBILE_QUERY = '(max-width: 768px)';

    function isMobile() {
        return window.matchMedia(MOBILE_QUERY).matches;
    }

    function setExpanded(sidebar, btn, expanded) {
        var collapsed = !expanded;
        sidebar.classList.toggle('collapsed', collapsed);
        btn.setAttribute('aria-expanded', String(expanded));
        btn.innerHTML = collapsed
            ? '<span aria-hidden="true">&#9662;</span>'
            : '<span aria-hidden="true">&#8645;</span>';
        btn.setAttribute(
            'aria-label',
            collapsed ? 'Mostrar a lista e filtros' : 'Ocultar a lista e filtros'
        );

        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
            if (window._gazMap && typeof window._gazMap.invalidateSize === 'function') {
                window._gazMap.invalidateSize();
            }
            if (window._gazNetwork && typeof window._gazNetwork.redraw === 'function') {
                window._gazNetwork.redraw();
            }
        }, 280);
    }

    function init() {
        var sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        if (sidebar.querySelector('.sidebar-toggle')) return;

        var header = sidebar.querySelector('.sidebar-header');
        if (!header) return;

        var btn = document.createElement('button');
        btn.className = 'sidebar-toggle';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Mostrar ou ocultar a lista');
        btn.setAttribute('aria-expanded', 'true');
        btn.innerHTML = '<span aria-hidden="true">&#8645;</span>';
        header.appendChild(btn);

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasCollapsed = sidebar.classList.contains('collapsed');
            setExpanded(sidebar, btn, wasCollapsed);
        });

        header.addEventListener('click', function (e) {
            if (!isMobile()) return;
            if (!sidebar.classList.contains('collapsed')) return;
            var interactive = e.target.closest(
                'input, select, textarea, button, a, label'
            );
            if (interactive && interactive !== header) return;
            setExpanded(sidebar, btn, true);
        });

        var lastMobile = isMobile();
        window.addEventListener('resize', function () {
            var nowMobile = isMobile();
            if (nowMobile === lastMobile) return;
            lastMobile = nowMobile;
            setExpanded(sidebar, btn, !nowMobile);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
