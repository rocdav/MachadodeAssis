document.addEventListener('DOMContentLoaded', async () => {
    const ACCENT_GROUPS = {
        'a': '[aàáâãäAÀÁÂÃÄ]', 'e': '[eèéêëEÈÉÊË]', 'i': '[iìíîïIÌÍÎÏ]',
        'o': '[oòóôõöOÒÓÔÕÖ]', 'u': '[uùúûüUÙÚÛÜ]', 'c': '[cçCÇ]', 'n': '[nñNÑ]'
    };
    const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/;

    const searchInput = document.getElementById('search');
    const workSelect = document.getElementById('workSelect');
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

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
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

    let citations = [];
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const raw = await resp.json();
        raw.forEach(p => {
            const lat = p.geo && parseFloat(p.geo.lat);
            const lon = p.geo && parseFloat(p.geo.long);
            if (!isFinite(lat) || !isFinite(lon)) return;
            (p.subjectOf || []).forEach(w => {
                citations.push({
                    place: p.name,
                    placeFc: (p.geo && p.geo['gn:featureCodeName']) || '',
                    lat, lon,
                    headline: w.headline || 'Sem título',
                    genre: w.genre || '',
                    datePublished: w.datePublished || '',
                    text: w.text || '',
                    workId: w['@id'] || ''
                });
            });
        });
    } catch (e) {
        statsEl.innerHTML = `<span style="color:#b00">Erro ao carregar dados: ${e.message}</span>`;
        return;
    }

    const works = new Map();
    citations.forEach(c => {
        const key = c.headline;
        if (!works.has(key)) {
            works.set(key, {
                headline: c.headline,
                genre: c.genre,
                datePublished: c.datePublished,
                citations: []
            });
        }
        works.get(key).citations.push(c);
    });

    function buildSelect(filteredKeys) {
        workSelect.innerHTML = '';
        const byGenre = new Map();
        filteredKeys.forEach(k => {
            const w = works.get(k);
            const g = w.genre || 'Sem gênero';
            if (!byGenre.has(g)) byGenre.set(g, []);
            byGenre.get(g).push(w);
        });
        const genreOrder = ['Romance', 'Conto', 'Crônica', 'Poesia', 'Teatro', 'Crítica'];
        const genres = [...byGenre.keys()].sort((a, b) => {
            const ia = genreOrder.indexOf(a), ib = genreOrder.indexOf(b);
            if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
            return a.localeCompare(b, 'pt-BR');
        });
        genres.forEach(g => {
            const og = document.createElement('optgroup');
            og.label = g;
            byGenre.get(g)
                .sort((a, b) => a.headline.localeCompare(b.headline, 'pt-BR'))
                .forEach(w => {
                    const opt = document.createElement('option');
                    opt.value = w.headline;
                    const yr = w.datePublished ? ` (${w.datePublished})` : '';
                    opt.textContent = `${w.headline}${yr} — ${w.citations.length}`;
                    og.appendChild(opt);
                });
            workSelect.appendChild(og);
        });
    }

    function update() {
        const q = searchInput.value.trim();
        let keys = [...works.keys()];
        if (q) {
            const re = new RegExp(buildPattern(q), 'i');
            keys = keys.filter(k => re.test(k));
        }
        if (keys.length === 0) {
            workSelect.innerHTML = '<option value="">— nenhuma obra —</option>';
            cluster.clearLayers();
            resultsList.innerHTML = '';
            statsEl.innerHTML = `<strong>0</strong> obras`;
            return;
        }
        const prev = workSelect.value;
        buildSelect(keys);
        if (keys.includes(prev)) workSelect.value = prev;
        renderWork(workSelect.value);
        statsEl.innerHTML = `<strong>${keys.length}</strong> obra${keys.length === 1 ? '' : 's'}`;
    }

    function renderWork(headline) {
        cluster.clearLayers();
        resultsList.innerHTML = '';
        if (!headline || !works.has(headline)) return;
        const w = works.get(headline);
        const bounds = [];
        const placeMap = new Map();
        w.citations.forEach(c => {
            const k = `${c.place}@${c.lat},${c.lon}`;
            if (!placeMap.has(k)) {
                placeMap.set(k, { place: c.place, placeFc: c.placeFc, lat: c.lat, lon: c.lon, items: [] });
            }
            placeMap.get(k).items.push(c);
        });
        const sorted = [...placeMap.values()].sort((a, b) => a.place.localeCompare(b.place, 'pt-BR'));
        sorted.forEach(group => {
            const popup = `
                <div class="popup-content">
                    <h3>${escapeHtml(group.place)}</h3>
                    <p class="popup-meta">${escapeHtml(group.placeFc)} · ${group.items.length} citaç${group.items.length === 1 ? 'ão' : 'ões'} em <em>${escapeHtml(headline)}</em></p>
                    ${group.items.map(c => `
                        <div class="popup-citation">
                            <div class="cit-text">${escapeHtml(c.text)}</div>
                            ${c.workId ? `<a href="${escapeHtml(c.workId)}" target="_blank" rel="noopener" class="cit-link">Ver na UFSC ↗</a>` : ''}
                        </div>
                    `).join('')}
                </div>`;
            const m = L.marker([group.lat, group.lon]).bindPopup(popup, { maxWidth: 420, minWidth: 280 });
            cluster.addLayer(m);
            bounds.push([group.lat, group.lon]);

            const li = document.createElement('li');
            li.innerHTML = `
                <span class="count-badge">${group.items.length}</span>
                <div class="place-name">${escapeHtml(group.place)}</div>
                <div class="place-meta">${escapeHtml(group.placeFc)}</div>`;
            li.addEventListener('click', () => {
                document.querySelectorAll('.results li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                map.setView([group.lat, group.lon], 8, { animate: true });
                m.openPopup();
            });
            resultsList.appendChild(li);
        });
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
        else if (bounds.length === 1) map.setView(bounds[0], 8);
    }

    workSelect.addEventListener('change', () => renderWork(workSelect.value));
    let debounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(update, 150);
    });

    update();
});
