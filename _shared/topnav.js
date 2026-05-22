(function () {
    const GROUPS = [
        {
            title: 'Mapas',
            items: [
                { slug: 'citacoes-por-local', label: 'Citações por local' },
                { slug: 'heatmap-geral', label: 'Heatmap geral' },
                { slug: 'citacoes-por-obra', label: 'Citações por obra' },
                { slug: 'heatmap-por-obra', label: 'Heatmap por obra' },
                { slug: 'rio-bairro-a-bairro', label: 'Rio bairro a bairro' },
                { slug: 'linha-do-tempo', label: 'Linha do tempo (1858–1908)' }
            ]
        },
        {
            title: 'Repertórios',
            items: [
                { slug: 'personagens', label: 'Personagens e referências' },
                { slug: 'instituicoes', label: 'Instituições' }
            ]
        },
        {
            title: 'Outros',
            items: [
                { slug: 'buscar-citacoes', label: 'Busca textual nas citações' },
                { slug: 'grafo-por-local', label: 'Grafo de relações por local' }
            ]
        }
    ];

    function inIframe() {
        try { return window.self !== window.top; } catch (e) { return true; }
    }
    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
    function shouldShow() {
        return !inIframe() || isFullscreen();
    }
    function currentSlug() {
        const m = location.pathname.match(/\/([^\/]+)\/?$/);
        return m ? m[1] : '';
    }

    function build() {
        const cur = currentSlug();
        const nav = document.createElement('nav');
        nav.className = 'gaz-nav';
        nav.setAttribute('aria-label', 'Navegação entre visualizações');

        const home = document.createElement('a');
        home.href = '../';
        home.className = 'gaz-nav-home';
        const logo = document.createElement('img');
        logo.src = '/logo.png';
        logo.alt = '';
        logo.className = 'gaz-nav-logo';
        logo.setAttribute('aria-hidden', 'true');
        home.appendChild(logo);
        const homeText = document.createElement('span');
        homeText.className = 'gaz-nav-home-text';
        homeText.textContent = 'Dicionário Geográfico de Machado de Assis';
        home.appendChild(homeText);
        nav.appendChild(home);

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'gaz-nav-trigger';
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.innerHTML = 'Visualizações <span aria-hidden="true">▾</span>';
        nav.appendChild(trigger);

        const dropdown = document.createElement('div');
        dropdown.className = 'gaz-nav-dropdown';
        dropdown.setAttribute('role', 'menu');
        GROUPS.forEach(g => {
            const groupEl = document.createElement('div');
            groupEl.className = 'gaz-nav-group';
            const title = document.createElement('div');
            title.className = 'gaz-nav-group-title';
            title.textContent = g.title;
            groupEl.appendChild(title);
            g.items.forEach(it => {
                const a = document.createElement('a');
                a.href = '../' + it.slug + '/';
                a.className = 'gaz-nav-item' + (cur === it.slug ? ' is-active' : '');
                a.textContent = it.label;
                a.setAttribute('role', 'menuitem');
                groupEl.appendChild(a);
            });
            dropdown.appendChild(groupEl);
        });
        nav.appendChild(dropdown);

        function close() {
            nav.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
        trigger.addEventListener('click', e => {
            e.stopPropagation();
            const open = !nav.classList.contains('open');
            nav.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('mousedown', e => {
            if (!nav.contains(e.target)) close();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') close();
        });

        document.body.appendChild(nav);
        return nav;
    }

    let nav = null;
    function syncVisibility() {
        if (shouldShow()) {
            if (!nav) nav = build();
            document.body.classList.add('gaz-nav-on');
        } else {
            document.body.classList.remove('gaz-nav-on');
        }
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (window._gazMap && typeof window._gazMap.invalidateSize === 'function') {
                window._gazMap.invalidateSize();
            }
            if (window._gazNetwork && typeof window._gazNetwork.redraw === 'function') {
                window._gazNetwork.redraw();
            }
        }, 120);
    }

    function init() {
        syncVisibility();
        document.addEventListener('fullscreenchange', syncVisibility);
        document.addEventListener('webkitfullscreenchange', syncVisibility);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
