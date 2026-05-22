document.addEventListener('DOMContentLoaded', async () => {
    const RIO_BBOX = { minLat: -23.10, maxLat: -22.74, minLon: -43.80, maxLon: -43.10 };
    const RIO_CENTER = [-22.9068, -43.1729];
    const INITIAL_ZOOM = 12;

    const statsEl = document.getElementById('stats');
    const listEl = document.getElementById('placeList');
    const filterEl = document.getElementById('kindFilter');

    const map = L.map('map').setView(RIO_CENTER, INITIAL_ZOOM);
    window._gazMap = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);

    const cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 50
    });
    map.addLayer(cluster);

    let allPlaces = [];
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        allPlaces = await resp.json();
    } catch (e) {
        statsEl.innerHTML = `<span style="color:#b00">Erro: ${e.message}</span>`;
        return;
    }

    function inRio(p) {
        const g = p.geo || {};
        const lat = parseFloat(g.lat), lon = parseFloat(g.long);
        if (isNaN(lat) || isNaN(lon)) return false;
        return lat >= RIO_BBOX.minLat && lat <= RIO_BBOX.maxLat &&
               lon >= RIO_BBOX.minLon && lon <= RIO_BBOX.maxLon;
    }

    const rioPlaces = allPlaces.filter(inRio).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'pt-BR'));

    function classify(featureCodeName) {
        const fc = (featureCodeName || '').toLowerCase();
        if (fc.includes('populated place') || fc.includes('political entity') ||
            fc.includes('administrative')) return 'bairros';
        if (fc.includes('road') || fc.includes('street') || fc.includes('caminho') ||
            fc.includes('square') || fc.includes('praça')) return 'vias';
        if (fc.includes('hill') || fc.includes('mountain') || fc.includes('montanha') ||
            fc.includes('beach') || fc.includes('cape') || fc.includes('lake') ||
            fc.includes('swamp') || fc.includes('park') || fc.includes('parque')) return 'natural';
        return 'marcos';
    }

    rioPlaces.forEach((p, i) => {
        p._kind = classify(p.geo && p.geo['gn:featureCodeName']);
        p._key = `rio-place-${i}`;
    });

    const totalWorks = rioPlaces.reduce((s, p) => s + ((p.subjectOf || []).length), 0);
    statsEl.textContent = `${rioPlaces.length} locais · ${totalWorks} citações`;

    function buildPopup(p) {
        const works = p.subjectOf || [];
        const fc = (p.geo && p.geo['gn:featureCodeName']) || '';
        let html = `<div class="popup-content">
            <h3>${p.name}</h3>
            <p class="popup-meta">${fc}</p>`;
        if (p.description) {
            html += `<p class="popup-desc">${p.description}</p>`;
        }
        if (works.length) {
            html += `<div class="popup-works">`;
            works.forEach(w => {
                const meta = [w.genre, w.datePublished].filter(Boolean).join(' · ');
                html += `<div class="work">
                    <div class="work-title">${w.headline || 'Sem título'}</div>
                    <div class="work-meta">${meta}</div>
                    <div class="work-text">${w.text || ''}</div>
                </div>`;
            });
            html += `</div>`;
        }
        html += `</div>`;
        return html;
    }

    const markers = new Map();
    rioPlaces.forEach(p => {
        const lat = parseFloat(p.geo.lat), lon = parseFloat(p.geo.long);
        const m = L.marker([lat, lon]);
        m.bindPopup(buildPopup(p), { maxWidth: 360, minWidth: 280 });
        markers.set(p._key, { marker: m, place: p });
    });

    function applyFilter() {
        const kind = filterEl.value;
        cluster.clearLayers();
        listEl.innerHTML = '';
        let visible = 0, citations = 0;

        rioPlaces.forEach(p => {
            if (kind !== 'all' && p._kind !== kind) return;
            const entry = markers.get(p._key);
            cluster.addLayer(entry.marker);
            visible++;
            citations += (p.subjectOf || []).length;

            const li = document.createElement('li');
            li.dataset.id = p._key;
            const works = (p.subjectOf || []).length;
            const fc = (p.geo && p.geo['gn:featureCodeName']) || '';
            li.innerHTML = `
                ${works > 0 ? `<span class="place-count">${works}</span>` : ''}
                <div class="place-name">${p.name}</div>
                <div class="place-meta">${fc}</div>`;
            li.addEventListener('click', () => {
                document.querySelectorAll('.place-list li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                const popupHtml = buildPopup(p);
                const openedMobile = window.GazMobileSheet && window.GazMobileSheet.openHtml(popupHtml);
                if (!openedMobile && window.GazDetailPanel) window.GazDetailPanel.renderHtml(popupHtml);
                if (window.GazSelectedMarker) window.GazSelectedMarker.set(entry.marker);
                map.setView([parseFloat(p.geo.lat), parseFloat(p.geo.long)], 16, { animate: true });
                entry.marker.openPopup();
            });
            listEl.appendChild(li);
        });

        statsEl.textContent = `${visible} locais · ${citations} citações`;
    }

    filterEl.addEventListener('change', applyFilter);
    applyFilter();
});
