(function () {
    const LIST_SELECTOR = '.sidebar .results, .sidebar .place-list, aside.sidebar .results, aside.sidebar .place-list';
    const PLACEHOLDER = 'Selecione um lugar…';
    const PLACEHOLDER_BY_VIEW = {
        'citacoes-por-obra': 'Selecione um local…',
        'heatmap-por-obra': 'Selecione um local…',
        'personagens': 'Selecione um nome…',
        'instituicoes': 'Selecione uma instituição…',
        'buscar-citacoes': 'Ver citações encontradas…',
    };

    function detectPlaceholder() {
        const m = location.pathname.match(/\/([^\/]+)\/?$/);
        if (m && PLACEHOLDER_BY_VIEW[m[1]]) return PLACEHOLDER_BY_VIEW[m[1]];
        return PLACEHOLDER;
    }

    function getDisplayText(li) {
        const name = li.querySelector(
            '.place-name, .work-name, .person-name, .inst-name, .org-name, .name, .title, h3, strong'
        );
        if (name && name.textContent) {
            const t = name.textContent.trim();
            if (t) return t;
        }
        const txt = (li.textContent || '').trim();
        const firstLine = txt.split('\n').map(s => s.trim()).filter(Boolean)[0] || txt;
        return firstLine.length > 80 ? firstLine.slice(0, 78) + '…' : firstLine;
    }

    function init() {
        const list = document.querySelector(LIST_SELECTOR);
        if (!list) return;
        if (list.dataset.comboInit === '1') return;

        const sidebar = list.closest('.sidebar') || list.parentNode;
        if (!sidebar) return;
        const layout = list.closest('.layout');

        list.dataset.comboInit = '1';

        const wrap = document.createElement('div');
        wrap.className = 'combo-wrap';
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'combo-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        const placeholder = detectPlaceholder();
        trigger.innerHTML =
            '<span class="combo-trigger-label">' + placeholder + '</span>' +
            '<span class="combo-trigger-chevron" aria-hidden="true">▾</span>';

        const panel = document.createElement('div');
        panel.className = 'combo-panel';
        panel.setAttribute('role', 'listbox');

        const parent = list.parentNode;
        parent.insertBefore(wrap, list);
        wrap.appendChild(trigger);
        wrap.appendChild(panel);
        panel.appendChild(list);
        if (layout) layout.classList.add('combo-active');

        const labelEl = trigger.querySelector('.combo-trigger-label');

        function isMobile() { return window.innerWidth <= 768; }
        function open() {
            wrap.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
            if (isMobile()) document.body.classList.add('combo-mobile-open');
        }
        function close() {
            wrap.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('combo-mobile-open');
        }
        function toggle() {
            if (wrap.classList.contains('open')) close(); else open();
        }

        trigger.addEventListener('click', e => {
            e.stopPropagation();
            toggle();
        });

        list.addEventListener('click', e => {
            const li = e.target.closest('li');
            if (!li || !list.contains(li)) return;
            const text = getDisplayText(li);
            if (text) {
                labelEl.textContent = text;
                labelEl.classList.add('combo-has-selection');
            }
            setTimeout(close, 60);
        });

        document.addEventListener('mousedown', e => {
            if (!wrap.contains(e.target)) close();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && wrap.classList.contains('open')) close();
        });

        const searchInput = sidebar.querySelector('input[type="search"], #search');
        if (searchInput) {
            searchInput.addEventListener('focus', () => open());
            searchInput.addEventListener('input', () => {
                if (searchInput.value.trim()) open();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
