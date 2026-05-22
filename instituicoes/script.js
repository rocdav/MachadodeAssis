document.addEventListener('DOMContentLoaded', async () => {
    const ACCENT_GROUPS = {
        'a': '[aàáâãäAÀÁÂÃÄ]', 'e': '[eèéêëEÈÉÊË]', 'i': '[iìíîïIÌÍÎÏ]',
        'o': '[oòóôõöOÒÓÔÕÖ]', 'u': '[uùúûüUÙÚÛÜ]', 'c': '[cçCÇ]', 'n': '[nñNÑ]'
    };
    const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/;

    const RIO_CENTER = [-22.9068, -43.1789];
    const INITIAL_ZOOM = 12;

    const TIPO_LABELS = {
        cafe: 'Cafés e confeitarias',
        hotel: 'Hotéis e hospedarias',
        teatro: 'Teatros',
        escola: 'Escolas e academias',
        hospital: 'Hospitais',
        cemiterio: 'Cemitérios',
        prisao: 'Cadeias e prisões',
        governo: 'Governo, câmaras, ministérios',
        militar: 'Militar (arsenais, quartéis)',
        banco: 'Bancos',
        clube: 'Clubes e cassinos',
        imprensa: 'Imprensa, livrarias, bibliotecas',
        igreja: 'Igrejas e conventos',
        transporte: 'Transporte (barcas, estações)',
        comercio: 'Comércio e lojas',
        praca: 'Praças, largos, jardins',
        outro: 'Outros'
    };

    const searchInput = document.getElementById('search');
    const sortSelect = document.getElementById('sortSelect');
    const tipoSelect = document.getElementById('tipoSelect');
    const resultsList = document.getElementById('results');
    const statsEl = document.getElementById('stats');
    const isDesktop = () => window.matchMedia('(min-width: 769px)').matches;

    let activeId = null;
    let orgs = [];

    try {
        const resp = await fetch('../data/instituicoes.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        orgs = (await resp.json()).map((o, idx) => Object.assign({}, o, { _key: `org-${idx}` }));
    } catch (e) {
        statsEl.innerHTML = `<span style="color:#b00">Erro ao carregar dados: ${e.message}</span>`;
        return;
    }

    const map = L.map('map', { preferCanvas: true }).setView(RIO_CENTER, INITIAL_ZOOM);
    window._gazMap = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);
    const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
    map.addLayer(cluster);
    const markers = new Map();

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

    const popupId = o => `popup-${(o._key || o['@id'] || o.name).replace(/[^a-zA-Z0-9]/g, '_')}`;

    function buildPopup(o) {
        const works = o.subjectOf || [];
        const tipoLabel = TIPO_LABELS[o.tipo || 'outro'] || o.tipo;
        const id = popupId(o);
        const obras = new Set(works.map(w => w.headline).filter(Boolean));
        const metaBits = [tipoLabel];
        if (works.length) {
            metaBits.push(`${works.length} citaç${works.length === 1 ? 'ão' : 'ões'} em ${obras.size} obra${obras.size === 1 ? '' : 's'}`);
        }

        let html = `<div class="popup-content" data-popup-id="${id}">
            <h3>${escapeHtml(o.name)}</h3>
            <p class="popup-meta">${escapeHtml(metaBits.join(' · '))}</p>`;

        const descBits = [];
        if (o.description) descBits.push(escapeHtml(o.description));
        const extras = [];
        if (o.geo && o.confianca) {
            extras.push(`<span class="geo-tag ${escapeHtml(o.confianca)}" title="${escapeHtml(o.nota || '')}">📍 ${escapeHtml(o.confianca)} confiança</span>`);
        }
        if (!o.geo) {
            extras.push(`<span class="geo-tag baixa" title="Sem coordenadas mapeadas">📍 sem localização</span>`);
        }
        if (o.url) {
            extras.push(`<a class="source-link" href="${escapeHtml(o.url)}" target="_blank" rel="noopener">Ver na enciclopédia →</a>`);
        }
        if (descBits.length || extras.length) {
            html += `<div class="popup-desc">`;
            if (descBits.length) html += descBits.join('');
            if (extras.length) html += `<div class="popup-extras">${extras.join('')}</div>`;
            html += `</div>`;
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

    function showSlide(popupRoot, target) {
        const slides = popupRoot.querySelectorAll('.slide');
        if (!slides.length) return;
        const idx = ((target % slides.length) + slides.length) % slides.length;
        slides.forEach((s, i) => {
            s.style.display = i === idx ? 'block' : 'none';
            if (i === idx) s.dataset.current = '1'; else delete s.dataset.current;
        });
        const ctrlsParent = popupRoot.parentElement || popupRoot;
        const counter = ctrlsParent.querySelector(`.ss-counter[data-popup="${popupRoot.dataset.popupId}"]`);
        if (counter) counter.textContent = `${idx + 1} / ${slides.length}`;
    }

    function wireSlideshowControls(scope) {
        const content = scope.querySelector('.popup-content');
        if (!content) return;
        const prev = scope.querySelector('.ss-prev');
        const next = scope.querySelector('.ss-next');
        if (prev) prev.addEventListener('click', () => {
            const cur = content.querySelector('.slide[data-current="1"]') || content.querySelector('.slide');
            if (cur) showSlide(content, parseInt(cur.dataset.idx, 10) - 1);
        });
        if (next) next.addEventListener('click', () => {
            const cur = content.querySelector('.slide[data-current="1"]') || content.querySelector('.slide');
            if (cur) showSlide(content, parseInt(cur.dataset.idx, 10) + 1);
        });
    }

    map.on('popupopen', e => {
        const root = e.popup.getElement && e.popup.getElement();
        if (!root) return;
        wireSlideshowControls(root);
    });

    function renderPanelsForNoGeo(o) {
        if (isDesktop() && window.GazDetailPanel && typeof window.GazDetailPanel.renderHtml === 'function') {
            window.GazDetailPanel.renderHtml(buildPopup(o));
            return;
        }
        if (window.GazMobileSheet && typeof window.GazMobileSheet.openHtml === 'function') {
            window.GazMobileSheet.openHtml(buildPopup(o));
        }
    }

    function getFiltered() {
        const q = searchInput.value.trim();
        const tipo = tipoSelect.value;
        let filtered = orgs;
        if (q) {
            const re = new RegExp(buildPattern(q), 'i');
            filtered = filtered.filter(o => re.test(o.name || ''));
        }
        if (tipo && tipo !== 'all') {
            filtered = filtered.filter(o => (o.tipo || 'outro') === tipo);
        }
        return filtered;
    }

    function buildTipoSelect() {
        const counts = {};
        orgs.forEach(o => {
            const t = o.tipo || 'outro';
            counts[t] = (counts[t] || 0) + 1;
        });
        const tipos = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        tipoSelect.innerHTML = `<option value="all">Todos (${orgs.length})</option>`;
        tipos.forEach(t => {
            const label = TIPO_LABELS[t] || t;
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = `${label} (${counts[t]})`;
            tipoSelect.appendChild(opt);
        });
    }

    function renderSidebar() {
        const filtered = getFiltered();
        const sortBy = sortSelect.value;
        const sorted = [...filtered];
        if (sortBy === 'count') {
            sorted.sort((a, b) => (b.subjectOf || []).length - (a.subjectOf || []).length
                || (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        } else {
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        }

        const totalCit = sorted.reduce((s, o) => s + (o.subjectOf || []).length, 0);
        const geoCount = sorted.filter(o => o.geo).length;
        statsEl.innerHTML = `<strong>${sorted.length}</strong> instituiç${sorted.length === 1 ? 'ão' : 'ões'} · <strong>${geoCount}</strong> mapeada${geoCount === 1 ? '' : 's'} · <strong>${totalCit}</strong> citaç${totalCit === 1 ? 'ão' : 'ões'}`;

        resultsList.innerHTML = '';
        sorted.forEach(o => {
            const n = (o.subjectOf || []).length;
            const li = document.createElement('li');
            li.dataset.id = o._key;
            if (o._key === activeId) li.classList.add('active');
            if (!o.geo) li.classList.add('no-geo');
            const pin = o.geo ? '<span class="pin-icon" title="No mapa">●</span>' : '';
            const tipoLabel = TIPO_LABELS[o.tipo || 'outro'] || o.tipo;
            li.innerHTML = `
                <div>
                    <span class="org-name">${pin}${escapeHtml(o.name)}</span>
                    <span class="tipo-tag">${escapeHtml(tipoLabel)}</span>
                </div>
                <span class="count-badge">${n}</span>`;
            li.addEventListener('click', () => activate(o));
            resultsList.appendChild(li);
        });
    }

    function activate(o) {
        activeId = o._key;
        document.querySelectorAll('.results li').forEach(x => {
            x.classList.toggle('active', x.dataset.id === activeId);
        });
        const m = markers.get(o._key);
        if (o.geo && m) {
            map.setView([o.geo.lat, o.geo.long], 16, { animate: true });
            if (cluster && typeof cluster.zoomToShowLayer === 'function') {
                cluster.zoomToShowLayer(m, () => m.openPopup());
            } else {
                m.openPopup();
            }
        } else {
            map.closePopup();
            renderPanelsForNoGeo(o);
        }
    }

    function rebuildMarkers() {
        cluster.clearLayers();
        markers.clear();
        const filtered = getFiltered();
        filtered.forEach(o => {
            if (!o.geo) return;
            const m = L.marker([o.geo.lat, o.geo.long]);
            m.bindPopup(buildPopup(o), { maxWidth: 420, minWidth: 280 });
            m.on('click', () => {
                activeId = o._key;
                document.querySelectorAll('.results li').forEach(x => {
                    x.classList.toggle('active', x.dataset.id === activeId);
                });
                const li = resultsList.querySelector(`[data-id="${o._key}"]`);
                if (li) li.scrollIntoView({ block: 'nearest' });
            });
            cluster.addLayer(m);
            markers.set(o._key, m);
        });

        if (markers.size > 0) {
            const bounds = [];
            markers.forEach(m => bounds.push(m.getLatLng()));
            if (bounds.length > 1) {
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            }
        }
    }

    let debounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            renderSidebar();
            rebuildMarkers();
        }, 150);
    });
    sortSelect.addEventListener('change', renderSidebar);
    tipoSelect.addEventListener('change', () => {
        renderSidebar();
        rebuildMarkers();
    });

    buildTipoSelect();
    renderSidebar();
    rebuildMarkers();
});
