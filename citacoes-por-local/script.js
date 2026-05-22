document.addEventListener('DOMContentLoaded', async () => {
    const ACCENT_GROUPS = {
        'a': '[aàáâãäAÀÁÂÃÄ]', 'e': '[eèéêëEÈÉÊË]', 'i': '[iìíîïIÌÍÎÏ]',
        'o': '[oòóôõöOÒÓÔÕÖ]', 'u': '[uùúûüUÙÚÛÜ]', 'c': '[cçCÇ]', 'n': '[nñNÑ]'
    };
    const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/;

    const searchInput = document.getElementById('search');
    const resultsList = document.getElementById('results');
    const statsEl = document.getElementById('stats');

    const map = L.map('map').setView([-15, -50], 3);
    window._gazMap = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);
    const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
    map.addLayer(cluster);

    let places = [];
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const raw = await resp.json();
        places = raw.map((p, idx) => {
            const lat = p.geo && parseFloat(p.geo.lat);
            const lon = p.geo && parseFloat(p.geo.long);
            if (!isFinite(lat) || !isFinite(lon)) return null;
            return Object.assign({}, p, { _lat: lat, _lon: lon, _key: `place-${idx}` });
        }).filter(Boolean);
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

    const popupId = p => `popup-${(p._key || p['@id'] || p.name).replace(/[^a-zA-Z0-9]/g, '_')}`;

    function buildPopup(p) {
        const works = p.subjectOf || [];
        const fc = (p.geo && p.geo['gn:featureCodeName']) || '';
        const id = popupId(p);
        let html = `<div class="popup-content" data-popup-id="${id}">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="popup-meta">${escapeHtml(fc)}${works.length ? ` · ${works.length} citaç${works.length === 1 ? 'ão' : 'ões'}` : ''}</p>`;
        if (p.description) {
            html += `<div class="popup-desc">${escapeHtml(p.description)}</div>`;
        }
        if (works.length) {
            html += `<div class="slideshow">`;
            works.forEach((w, i) => {
                const meta = [w.genre, w.datePublished].filter(Boolean).join(' · ');
                const link = w['@id'] ? `<a href="${escapeHtml(w['@id'])}" target="_blank" rel="noopener">Ver na UFSC ↗</a>` : '';
                html += `<div class="slide" data-idx="${i}" style="display:${i === 0 ? 'block' : 'none'}">
                    <div class="slide-text">${escapeHtml(w.text || '')}</div>
                    <div class="slide-meta">
                        <strong>${escapeHtml(w.headline || 'Sem título')}</strong>
                        <span class="slide-sub">${escapeHtml(meta)}</span>
                        ${link}
                    </div>
                </div>`;
            });
            html += `</div>`;
            if (works.length > 1) {
                html += `<div class="slideshow-controls">
                    <button class="ss-prev" data-popup="${id}" aria-label="Anterior">‹</button>
                    <span class="ss-counter" data-popup="${id}">1 / ${works.length}</span>
                    <button class="ss-next" data-popup="${id}" aria-label="Próxima">›</button>
                </div>`;
            }
        }
        html += `</div>`;
        return html;
    }

    const markersById = new Map();
    places.forEach(p => {
        const m = L.marker([p._lat, p._lon]);
        m.bindPopup(buildPopup(p), { maxWidth: 420, minWidth: 280 });
        markersById.set(p._key, { marker: m, place: p });
    });

    function showSlide(popupRoot, target) {
        const slides = popupRoot.querySelectorAll('.slide');
        const counter = popupRoot.parentElement.querySelector(`.ss-counter[data-popup="${popupRoot.dataset.popupId}"]`);
        const idx = ((target % slides.length) + slides.length) % slides.length;
        slides.forEach(s => s.style.display = 'none');
        slides[idx].style.display = 'block';
        slides[idx].dataset.current = '1';
        slides.forEach((s, i) => { if (i !== idx) delete s.dataset.current; });
        if (counter) counter.textContent = `${idx + 1} / ${slides.length}`;
    }

    map.on('popupopen', e => {
        const root = e.popup.getElement();
        if (!root) return;
        const content = root.querySelector('.popup-content');
        if (!content) return;
        const prev = root.querySelector('.ss-prev');
        const next = root.querySelector('.ss-next');
        if (prev) prev.addEventListener('click', () => {
            const cur = content.querySelector('.slide[data-current="1"]') || content.querySelector('.slide');
            showSlide(content, parseInt(cur.dataset.idx, 10) - 1);
        });
        if (next) next.addEventListener('click', () => {
            const cur = content.querySelector('.slide[data-current="1"]') || content.querySelector('.slide');
            showSlide(content, parseInt(cur.dataset.idx, 10) + 1);
        });
    });

    function update() {
        const q = searchInput.value.trim();
        let filtered = places;
        if (q) {
            const re = new RegExp(buildPattern(q), 'i');
            filtered = places.filter(p => re.test(p.name || ''));
        }
        const sorted = [...filtered].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'pt-BR'));

        const totalCit = filtered.reduce((s, p) => s + (p.subjectOf || []).length, 0);
        statsEl.innerHTML = `<strong>${filtered.length}</strong> lugares · <strong>${totalCit}</strong> citaç${totalCit === 1 ? 'ão' : 'ões'}`;

        cluster.clearLayers();
        filtered.forEach(p => {
            const entry = markersById.get(p._key);
            if (entry) cluster.addLayer(entry.marker);
        });

        resultsList.innerHTML = '';
        sorted.forEach(p => {
            const li = document.createElement('li');
            li.dataset.id = p._key;
            const fc = (p.geo && p.geo['gn:featureCodeName']) || '';
            const n = (p.subjectOf || []).length;
            li.innerHTML = `
                ${n ? `<span class="count-badge">${n}</span>` : ''}
                <div class="place-name">${escapeHtml(p.name)}</div>
                <div class="place-meta">${escapeHtml(fc)}</div>`;
            li.addEventListener('click', () => {
                document.querySelectorAll('.results li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                const entry = markersById.get(p._key);
                if (entry) {
                    map.setView([p._lat, p._lon], 8, { animate: true });
                    entry.marker.openPopup();
                }
            });
            resultsList.appendChild(li);
        });
    }

    let debounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(update, 150);
    });

    update();
});
