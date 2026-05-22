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
    let heatLayer = null;

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

    const works = new Map();
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const raw = await resp.json();
        raw.forEach(p => {
            const lat = p.geo && parseFloat(p.geo.lat);
            const lon = p.geo && parseFloat(p.geo.long);
            if (!isFinite(lat) || !isFinite(lon)) return;
            (p.subjectOf || []).forEach(w => {
                const key = w.headline || 'Sem título';
                if (!works.has(key)) {
                    works.set(key, {
                        headline: key,
                        genre: w.genre || '',
                        datePublished: w.datePublished || '',
                        points: [],
                        places: new Map()
                    });
                }
                const wk = works.get(key);
                wk.points.push([lat, lon, 1]);
                const pk = `${p.name}@${lat},${lon}`;
                wk.places.set(pk, (wk.places.get(pk) || 0) + 1);
                wk._placeMeta = wk._placeMeta || new Map();
                if (!wk._placeMeta.has(pk)) wk._placeMeta.set(pk, { name: p.name, lat, lon });
            });
        });
    } catch (e) {
        statsEl.innerHTML = `<span style="color:#b00">Erro ao carregar dados: ${e.message}</span>`;
        return;
    }

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
                    opt.textContent = `${w.headline}${yr} — ${w.points.length}`;
                    og.appendChild(opt);
                });
            workSelect.appendChild(og);
        });
    }

    function renderHeatmap(headline) {
        if (heatLayer) { heatLayer.remove(); heatLayer = null; }
        resultsList.innerHTML = '';
        if (!headline || !works.has(headline)) return;
        const w = works.get(headline);
        const bounds = [];
        const counts = new Map();
        w.points.forEach(([lat, lon]) => {
            const k = `${lat},${lon}`;
            counts.set(k, (counts.get(k) || 0) + 1);
        });
        const data = [...counts.entries()].map(([k, n]) => {
            const [lat, lon] = k.split(',').map(parseFloat);
            bounds.push([lat, lon]);
            return [lat, lon, n];
        });
        const maxN = Math.max(2, ...data.map(d => d[2]));
        heatLayer = L.heatLayer(data, {
            radius: 25,
            blur: 18,
            max: maxN,
            minOpacity: 0.4,
            gradient: { 0.2: '#3949ab', 0.4: '#43a047', 0.6: '#fdd835', 0.8: '#fb8c00', 1.0: '#c62828' }
        }).addTo(map);

        const places = [...w._placeMeta.values()]
            .map(pm => ({ ...pm, count: w.places.get(`${pm.name}@${pm.lat},${pm.lon}`) || 0 }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
        places.forEach(pm => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="count-badge">${pm.count}</span>
                <div class="place-name">${escapeHtml(pm.name)}</div>`;
            li.addEventListener('click', () => {
                document.querySelectorAll('.results li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                map.setView([pm.lat, pm.lon], 8, { animate: true });
            });
            resultsList.appendChild(li);
        });

        if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
        else if (bounds.length === 1) map.setView(bounds[0], 8);

        const totalCit = w.points.length;
        const uniqLocais = w._placeMeta.size;
        statsEl.innerHTML = `<strong>${totalCit}</strong> citaç${totalCit === 1 ? 'ão' : 'ões'} · <strong>${uniqLocais}</strong> ${uniqLocais === 1 ? 'local' : 'locais'} únicos`;
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
            if (heatLayer) { heatLayer.remove(); heatLayer = null; }
            resultsList.innerHTML = '';
            statsEl.innerHTML = `<strong>0</strong> obras`;
            return;
        }
        const prev = workSelect.value;
        buildSelect(keys);
        if (keys.includes(prev)) workSelect.value = prev;
        renderHeatmap(workSelect.value);
    }

    workSelect.addEventListener('change', () => renderHeatmap(workSelect.value));
    let debounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(update, 150);
    });

    update();
});
