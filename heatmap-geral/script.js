document.addEventListener('DOMContentLoaded', async () => {
    const RIO_BBOX = { minLat: -23.10, maxLat: -22.74, minLon: -43.80, maxLon: -43.10 };
    const BR_BBOX = { minLat: -34.0, maxLat: 6.0, minLon: -74.0, maxLon: -34.0 };

    function regionOf(lat, lon) {
        if (lat >= RIO_BBOX.minLat && lat <= RIO_BBOX.maxLat &&
            lon >= RIO_BBOX.minLon && lon <= RIO_BBOX.maxLon) return 'rio';
        if (lat >= BR_BBOX.minLat && lat <= BR_BBOX.maxLat &&
            lon >= BR_BBOX.minLon && lon <= BR_BBOX.maxLon) return 'brasil';
        return 'estrangeiro';
    }

    const regionSelect = document.getElementById('regionSelect');
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

    let places = [];
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const raw = await resp.json();
        places = raw.map(p => {
            const lat = p.geo && parseFloat(p.geo.lat);
            const lon = p.geo && parseFloat(p.geo.long);
            if (!isFinite(lat) || !isFinite(lon)) return null;
            return {
                name: p.name,
                lat, lon,
                count: (p.subjectOf || []).length,
                region: regionOf(lat, lon)
            };
        }).filter(Boolean);
    } catch (e) {
        statsEl.innerHTML = `<span style="color:#b00">Erro ao carregar dados: ${e.message}</span>`;
        return;
    }

    const REGION_VIEW = {
        all: { center: [-15, -50], zoom: 3 },
        rio: { center: [-22.91, -43.20], zoom: 11 },
        brasil: { center: [-15, -50], zoom: 4 },
        estrangeiro: { center: [30, 10], zoom: 2 }
    };

    function update() {
        const region = regionSelect.value;
        const filtered = region === 'all' ? places : places.filter(p => p.region === region);
        const totalCit = filtered.reduce((s, p) => s + p.count, 0);
        statsEl.innerHTML = `<strong>${filtered.length}</strong> ${filtered.length === 1 ? 'local' : 'locais'} · <strong>${totalCit}</strong> citaç${totalCit === 1 ? 'ão' : 'ões'}`;

        if (heatLayer) { heatLayer.remove(); heatLayer = null; }
        if (filtered.length === 0) {
            resultsList.innerHTML = '';
            return;
        }
        const maxN = Math.max(2, ...filtered.map(p => p.count));
        const heatData = filtered.filter(p => p.count > 0).map(p => [p.lat, p.lon, p.count]);
        heatLayer = L.heatLayer(heatData, {
            radius: 25,
            blur: 18,
            max: maxN,
            minOpacity: 0.4,
            gradient: { 0.2: '#3949ab', 0.4: '#43a047', 0.6: '#fdd835', 0.8: '#fb8c00', 1.0: '#c62828' }
        }).addTo(map);

        const view = REGION_VIEW[region];
        if (view) map.setView(view.center, view.zoom, { animate: true });

        const top = [...filtered].sort((a, b) => b.count - a.count).slice(0, 50);
        resultsList.innerHTML = '<li class="results-header">Top 50 locais mais citados</li>';
        top.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="count-badge">${p.count}</span>
                <div class="place-name">${escapeHtml(p.name)}</div>`;
            li.addEventListener('click', () => {
                document.querySelectorAll('.results li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                map.setView([p.lat, p.lon], 8, { animate: true });
            });
            resultsList.appendChild(li);
        });
    }

    regionSelect.addEventListener('change', update);
    update();
});
