document.addEventListener('DOMContentLoaded', async () => {
    const ACCENT_GROUPS = {
        'a': '[aàáâãäAÀÁÂÃÄ]',
        'e': '[eèéêëEÈÉÊË]',
        'i': '[iìíîïIÌÍÎÏ]',
        'o': '[oòóôõöOÒÓÔÕÖ]',
        'u': '[uùúûüUÙÚÛÜ]',
        'c': '[cçCÇ]',
        'n': '[nñNÑ]'
    };
    const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/;

    const searchInput = document.getElementById('search');
    const sortSelect = document.getElementById('sortSelect');
    const resultsList = document.getElementById('results');
    const statsEl = document.getElementById('stats');
    const contentEl = document.getElementById('content');
    const layoutEl = document.querySelector('.layout');

    function showDetailMobile() {
        if (window.matchMedia('(max-width: 768px)').matches) {
            layoutEl.classList.add('show-detail');
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }
    function hideDetailMobile() {
        layoutEl.classList.remove('show-detail');
    }

    let people = [];
    try {
        const resp = await fetch('../data/personagens.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        people = await resp.json();
    } catch (e) {
        statsEl.innerHTML = `<span style="color:#b00">Erro ao carregar dados: ${e.message}</span>`;
        return;
    }

    function buildPattern(query) {
        let pattern = '';
        for (const ch of query.toLowerCase()) {
            if (ACCENT_GROUPS[ch]) pattern += ACCENT_GROUPS[ch];
            else if (REGEX_SPECIALS.test(ch)) pattern += '\\' + ch;
            else if (/[a-z0-9]/i.test(ch)) pattern += `[${ch}${ch.toUpperCase()}]`;
            else pattern += ch;
        }
        return pattern;
    }

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    let activeId = null;

    function render() {
        const q = searchInput.value.trim();
        const sortBy = sortSelect.value;

        let filtered = people;
        if (q) {
            const re = new RegExp(buildPattern(q), 'i');
            filtered = people.filter(p => re.test(p.name || ''));
        }

        const sorted = [...filtered];
        if (sortBy === 'count') {
            sorted.sort((a, b) => (b.subjectOf || []).length - (a.subjectOf || []).length
                || (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        } else {
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        }

        const totalCitations = sorted.reduce((s, p) => s + (p.subjectOf || []).length, 0);
        statsEl.textContent = `${sorted.length} personage${sorted.length === 1 ? 'm' : 'ns'} · ${totalCitations} citaç${totalCitations === 1 ? 'ão' : 'ões'}`;

        resultsList.innerHTML = '';
        sorted.forEach(p => {
            const n = (p.subjectOf || []).length;
            const li = document.createElement('li');
            li.dataset.id = p['@id'];
            if (p['@id'] === activeId) li.classList.add('active');
            li.innerHTML = `
                <span class="person-name">${escapeHtml(p.name)}</span>
                <span class="count-badge">${n}</span>`;
            li.addEventListener('click', () => {
                activeId = p['@id'];
                document.querySelectorAll('.results li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                showEntry(p);
                showDetailMobile();
            });
            resultsList.appendChild(li);
        });
    }

    function showEntry(p) {
        const works = p.subjectOf || [];
        const obras = new Set(works.map(w => w.headline).filter(Boolean));
        const meta = `Citado em ${works.length} passage${works.length === 1 ? 'm' : 'ns'} de ${obras.size} obra${obras.size === 1 ? '' : 's'}`;

        let html = `<button class="back-btn" id="backBtn" type="button" aria-label="Voltar à lista">← Voltar à lista</button>
        <article class="entry">
            <h1>${escapeHtml(p.name)}</h1>
            <p class="meta">${meta}</p>`;
        if (p.description) {
            html += `<div class="description">${escapeHtml(p.description)}</div>`;
        }
        if (works.length) {
            html += `<h3>Citações</h3><ul class="citations">`;
            works.forEach(w => {
                const wmeta = [w.genre, w.datePublished].filter(Boolean).join(' · ');
                html += `<li class="citation">
                    <div class="work-title">${escapeHtml(w.headline || 'Sem título')}</div>
                    <div class="work-meta">${escapeHtml(wmeta)}</div>
                    <div class="work-text">${escapeHtml(w.text || '')}</div>
                </li>`;
            });
            html += `</ul>`;
        }
        html += `</article>`;
        contentEl.innerHTML = html;
        contentEl.scrollTop = 0;
        const backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.addEventListener('click', hideDetailMobile);
    }

    let debounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(render, 150);
    });
    sortSelect.addEventListener('change', render);

    render();
});
