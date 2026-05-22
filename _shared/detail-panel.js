(function () {
    function isDesktop() { return window.innerWidth >= 769; }

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function pageText(name, fallback) {
        return (document.body && document.body.dataset && document.body.dataset[name]) || fallback;
    }

    function shouldSkipSidebar(sidebar) {
        const parent = sidebar.parentNode;
        if (!parent) return true;
        return !!parent.querySelector(':scope > .content, :scope > main.content');
    }

    function ensureSidebarPanel(sidebar) {
        let panel = sidebar.querySelector(':scope > .detail-panel');
        if (panel) return panel;
        panel = document.createElement('div');
        panel.className = 'detail-panel';
        panel.innerHTML = '<div class="detail-empty">' + escapeHtml(pageText('detailEmpty', 'Selecione um lugar para ver o verbete.')) + '</div>';
        sidebar.appendChild(panel);
        return panel;
    }

    function ensureMapWrap(mapEl) {
        const parent = mapEl.parentNode;
        if (!parent) return null;
        if (parent.classList && parent.classList.contains('map-wrap')) return parent;
        const wrap = document.createElement('div');
        wrap.className = 'map-wrap';
        parent.insertBefore(wrap, mapEl);
        wrap.appendChild(mapEl);
        return wrap;
    }

    function ensureCitationBox(mapEl) {
        if (!mapEl) return null;
        const wrap = ensureMapWrap(mapEl);
        if (!wrap) return null;
        let box = wrap.querySelector(':scope > .citation-box');
        if (box) return box;
        box = document.createElement('aside');
        box.className = 'citation-box';
        box.innerHTML =
            '<header class="citation-box-header">' +
            '  <h3 class="citation-box-title">' + escapeHtml(pageText('citationTitle', 'Citações')) + '</h3>' +
            '  <button type="button" class="citation-box-close" aria-label="Fechar">×</button>' +
            '</header>' +
            '<div class="citation-box-meta"></div>' +
            '<div class="citation-box-body"></div>';
        wrap.appendChild(box);
        const closeBtn = box.querySelector('.citation-box-close');
        closeBtn.addEventListener('click', () => {
            box.classList.remove('open');
            document.body.classList.remove('cb-open');
            const map = window._gazMap;
            if (map && typeof map.closePopup === 'function') map.closePopup();
        });
        return box;
    }

    function ensurePanels() {
        const sidebar = document.querySelector('.sidebar');
        const layout = document.querySelector('.layout');
        const mapEl = document.getElementById('map');
        if (!layout) return { panel: null, box: null };

        let panel = null;
        if (sidebar && !shouldSkipSidebar(sidebar)) {
            panel = ensureSidebarPanel(sidebar);
        }
        const box = ensureCitationBox(mapEl);
        return { panel, box };
    }

    function renderSidebarVerbete(panel, content) {
        const h3 = content.querySelector('h3');
        const meta = content.querySelector('.popup-meta');
        const desc = content.querySelector('.popup-desc');
        const parts = [];
        if (h3) parts.push('<h3>' + h3.innerHTML + '</h3>');
        if (meta) parts.push('<p class="popup-meta">' + meta.innerHTML + '</p>');
        if (desc) parts.push('<div class="popup-desc">' + desc.innerHTML + '</div>');
        if (!parts.length) {
            panel.innerHTML = '<div class="detail-empty">' + escapeHtml(pageText('detailNone', '(Sem verbete para este lugar.)')) + '</div>';
            return;
        }
        panel.innerHTML = '<div class="popup-content">' + parts.join('') + '</div>';
        panel.scrollTop = 0;
    }

    function renderCitationBox(box, content) {
        const citationsRoot = content.querySelector('.slideshow, .popup-works');
        const h3 = content.querySelector('h3');
        const meta = content.querySelector('.popup-meta');
        const titleEl = box.querySelector('.citation-box-title');
        const metaEl = box.querySelector('.citation-box-meta');
        const bodyEl = box.querySelector('.citation-box-body');
        if (titleEl && h3) titleEl.textContent = (h3.textContent || '').trim() || pageText('citationTitle', 'Citações');
        if (metaEl) metaEl.innerHTML = meta ? meta.innerHTML : '';
        if (!citationsRoot) {
            bodyEl.innerHTML = '<div class="detail-empty">' + escapeHtml(pageText('citationNone', '(Sem citações associadas a este lugar.)')) + '</div>';
        } else {
            const cloned = citationsRoot.cloneNode(true);
            cloned.querySelectorAll('.slide').forEach(s => { s.style.display = 'block'; });
            const ctrls = cloned.querySelector('.slideshow-controls');
            if (ctrls) ctrls.remove();
            bodyEl.innerHTML = '';
            bodyEl.appendChild(cloned);
        }
        bodyEl.scrollTop = 0;
        box.classList.add('open');
        document.body.classList.add('cb-open');
    }

    function renderContent(content) {
        if (!isDesktop() || !content) return;
        const { panel, box } = ensurePanels();
        if (panel) renderSidebarVerbete(panel, content);
        if (box) renderCitationBox(box, content);
    }

    function renderHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const content = tmp.querySelector('.popup-content') || tmp.firstElementChild;
        renderContent(content);
    }

    function closeCitationBox() {
        const box = document.querySelector('.map-wrap > .citation-box');
        if (!box) return;
        box.classList.remove('open');
        document.body.classList.remove('cb-open');
    }

    window.GazDetailPanel = {
        ensure: ensurePanels,
        renderContent,
        renderHtml,
        close: closeCitationBox
    };

    function init() {
        if (!isDesktop()) return;
        const { panel, box } = ensurePanels();

        if (!panel && !box) return;

        let attempts = 0;
        function attach() {
            const map = window._gazMap;
            if (!map || typeof map.on !== 'function') {
                if (++attempts > 60) return;
                setTimeout(attach, 200);
                return;
            }
            map.on('popupopen', e => {
                if (!isDesktop()) return;
                const root = e.popup.getElement && e.popup.getElement();
                if (!root) return;
                const content = root.querySelector('.popup-content');
                if (!content) return;
                root.style.display = 'none';
                renderContent(content);
            });
            map.on('popupclose', () => {
                if (!isDesktop()) return;
                closeCitationBox();
            });
        }
        attach();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
