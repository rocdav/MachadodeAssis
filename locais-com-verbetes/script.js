document.addEventListener('DOMContentLoaded', async () => {
    const ACCENT_GROUPS = {
        'a': '[aàáâãäAÀÁÂÃÄ]', 'e': '[eèéêëEÈÉÊË]', 'i': '[iìíîïIÌÍÎÏ]',
        'o': '[oòóôõöOÒÓÔÕÖ]', 'u': '[uùúûüUÙÚÛÜ]', 'c': '[cçCÇ]', 'n': '[nñNÑ]'
    };
    const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/;

    const RIO_BBOX = { minLat: -23.10, maxLat: -22.74, minLon: -43.80, maxLon: -43.10 };
    const BR_BBOX = { minLat: -34.0, maxLat: 6.0, minLon: -74.0, maxLon: -34.0 };

    const PLACE_CLASS_LABELS = {
        P: 'Cidades, bairros e vilas',
        S: 'Construções e marcos',
        H: 'Hidrografia',
        A: 'Países e regiões',
        R: 'Vias e transporte',
        T: 'Relevo',
        OUTRO: 'Outros'
    };
    const PLACE_CLASS_ORDER = ['P', 'S', 'H', 'A', 'R', 'T', 'OUTRO'];

    function classOfPlace(p) {
        const fc = (p.geo && p.geo['gn:featureCode']) || '';
        const c = fc[0] || '';
        return PLACE_CLASS_LABELS[c] ? c : 'OUTRO';
    }

    function regionOf(lat, lon) {
        if (lat >= RIO_BBOX.minLat && lat <= RIO_BBOX.maxLat &&
            lon >= RIO_BBOX.minLon && lon <= RIO_BBOX.maxLon) return 'rio';
        if (lat >= BR_BBOX.minLat && lat <= BR_BBOX.maxLat &&
            lon >= BR_BBOX.minLon && lon <= BR_BBOX.maxLon) return 'brasil';
        return 'estrangeiro';
    }

    const searchInput = document.getElementById('search');
    const regionSelect = document.getElementById('regionSelect');
    const classSelect = document.getElementById('classSelect');
    const resultsList = document.getElementById('results');
    const statsEl = document.getElementById('stats');

    const map = L.map('map').setView([-15, -50], 3);
    window._gazMap = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);
    const cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50
    });
    map.addLayer(cluster);
    const markers = new Map();

    let allPlaces = [];
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const raw = await resp.json();
        allPlaces = raw
            .map((p, idx) => {
                const lat = p.geo && parseFloat(p.geo.lat);
                const lon = p.geo && parseFloat(p.geo.long);
                if (!isFinite(lat) || !isFinite(lon)) return null;
                return Object.assign({}, p, {
                    _lat: lat, _lon: lon,
                    _region: regionOf(lat, lon),
                    _class: classOfPlace(p),
                    _key: `place-${idx}`
                });
            })
            .filter(Boolean);
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

    function buildPopup(p) {
        const works = p.subjectOf || [];
        const fc = (p.geo && p.geo['gn:featureCodeName']) || '';
        let html = `<div class="popup-content">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="popup-meta">${escapeHtml(fc)}${works.length ? ` · ${works.length} citaç${works.length === 1 ? 'ão' : 'ões'}` : ''}</p>`;
        if (p.description) {
            html += `<div class="popup-desc">${escapeHtml(p.description)}</div>`;
        }
        if (works.length) {
            html += `<div class="popup-works">`;
            works.forEach(w => {
                const meta = [w.genre, w.datePublished].filter(Boolean).join(' · ');
                html += `<div class="work">
                    <div class="work-title">${escapeHtml(w.headline || 'Sem título')}</div>
                    <div class="work-meta">${escapeHtml(meta)}</div>
                    <div class="work-text">${escapeHtml(w.text || '')}</div>
                </div>`;
            });
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    }

    allPlaces.forEach(p => {
        const m = L.marker([p._lat, p._lon]);
        m.bindPopup(buildPopup(p), { maxWidth: 400, minWidth: 280 });
        markers.set(p._key, { marker: m, place: p });
    });

    function buildClassSelect() {
        const counts = {};
        PLACE_CLASS_ORDER.forEach(c => counts[c] = 0);
        let total = 0;
        allPlaces.forEach(p => {
            counts[p._class] = (counts[p._class] || 0) + 1;
            total++;
        });
        classSelect.innerHTML = `<option value="all">Todos (${total})</option>`;
        PLACE_CLASS_ORDER.forEach(c => {
            if (!counts[c]) return;
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = `${PLACE_CLASS_LABELS[c]} (${counts[c]})`;
            classSelect.appendChild(opt);
        });
    }

    function getFiltered() {
        const q = searchInput.value.trim();
        const region = regionSelect.value;
        const cls = classSelect.value;
        let filtered = allPlaces;
        if (q) {
            const re = new RegExp(buildPattern(q), 'i');
            filtered = filtered.filter(p => re.test(p.name || ''));
        }
        if (region !== 'all') filtered = filtered.filter(p => p._region === region);
        if (cls !== 'all') filtered = filtered.filter(p => p._class === cls);
        return filtered;
    }

    function update() {
        const filtered = getFiltered();
        const sorted = [...filtered].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'pt-BR'));

        const totalCit = filtered.reduce((s, p) => s + ((p.subjectOf || []).length), 0);
        statsEl.innerHTML = `<strong>${filtered.length}</strong> lugares · <strong>${totalCit}</strong> citaç${totalCit === 1 ? 'ão' : 'ões'}`;

        cluster.clearLayers();
        const bounds = [];
        filtered.forEach(p => {
            const entry = markers.get(p._key);
            if (entry) {
                cluster.addLayer(entry.marker);
                bounds.push([p._lat, p._lon]);
            }
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
                map.setView([p._lat, p._lon], 12, { animate: true });
                const entry = markers.get(p._key);
                if (entry) entry.marker.openPopup();
            });
            resultsList.appendChild(li);
        });

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
        } else if (bounds.length === 1) {
            map.setView(bounds[0], 10);
        }
    }

    let debounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(update, 150);
    });
    regionSelect.addEventListener('change', update);
    classSelect.addEventListener('change', update);

    buildClassSelect();
    update();
});
