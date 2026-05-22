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
    const resultsList = document.getElementById('results');
    const statsEl = document.getElementById('stats');
    const mapEl = document.getElementById('map');

    const map = L.map('map').setView([0, 0], 2);
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

    let allPlaces = [];
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        allPlaces = await resp.json();
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

    function buildRegex(query) {
        return new RegExp(buildPattern(query), 'g');
    }

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function highlight(text, re) {
        if (!text) return '';
        const escaped = escapeHtml(text);
        return escaped.replace(re, m => `<mark>${m}</mark>`);
    }

    function buildPopup(place, matchedWorks, re) {
        const fc = (place.geo && place.geo['gn:featureCodeName']) || '';
        let html = `<div class="popup-content">
            <h3>${escapeHtml(place.name)}</h3>
            <p class="popup-meta">${escapeHtml(fc)}</p>
            <div class="popup-works">`;
        matchedWorks.forEach(({ work }) => {
            const meta = [work.genre, work.datePublished].filter(Boolean).join(' · ');
            html += `<div class="work">
                <div class="work-title">${escapeHtml(work.headline || 'Sem título')}</div>
                <div class="work-meta">${escapeHtml(meta)}</div>
                <div class="work-text">${highlight(work.text, re)}</div>
            </div>`;
        });
        html += `</div></div>`;
        return html;
    }

    let currentQuery = '';
    let debounceTimer = null;

    function reset() {
        cluster.clearLayers();
        resultsList.innerHTML = '';
        map.setView([0, 0], 2);
    }

    function runSearch(query) {
        currentQuery = query.trim();
        if (!currentQuery) {
            statsEl.textContent = 'Digite acima para começar.';
            statsEl.classList.remove('no-results');
            reset();
            return;
        }

        const re = buildRegex(currentQuery);
        const matchedPlaces = [];
        let totalHits = 0;

        for (const place of allPlaces) {
            const g = place.geo;
            if (!g) continue;
            const lat = parseFloat(g.lat), lon = parseFloat(g.long);
            if (isNaN(lat) || isNaN(lon)) continue;

            const matchedWorks = [];
            for (const work of (place.subjectOf || [])) {
                if (!work.text) continue;
                const matches = work.text.match(re);
                if (matches && matches.length) {
                    matchedWorks.push({ work, count: matches.length });
                    totalHits += matches.length;
                }
            }
            if (matchedWorks.length) {
                matchedPlaces.push({ place, matchedWorks, lat, lon });
            }
        }

        cluster.clearLayers();
        resultsList.innerHTML = '';

        if (!matchedPlaces.length) {
            statsEl.textContent = `Nenhum resultado para "${currentQuery}".`;
            statsEl.classList.add('no-results');
            return;
        }
        statsEl.classList.remove('no-results');
        statsEl.textContent = `${totalHits} ocorrência${totalHits > 1 ? 's' : ''} em ${matchedPlaces.length} loca${matchedPlaces.length > 1 ? 'is' : 'l'}.`;

        const bounds = [];
        matchedPlaces
            .sort((a, b) => {
                const ha = a.matchedWorks.reduce((s, w) => s + w.count, 0);
                const hb = b.matchedWorks.reduce((s, w) => s + w.count, 0);
                return hb - ha;
            })
            .forEach(({ place, matchedWorks, lat, lon }) => {
                const reLocal = buildRegex(currentQuery);
                const marker = L.marker([lat, lon]);
                marker.bindPopup(buildPopup(place, matchedWorks, reLocal), {
                    maxWidth: 380, minWidth: 300
                });
                cluster.addLayer(marker);
                bounds.push([lat, lon]);

                const totalCount = matchedWorks.reduce((s, w) => s + w.count, 0);
                const fc = (place.geo && place.geo['gn:featureCodeName']) || '';
                const previewWork = matchedWorks[0].work;
                const previewRe = buildRegex(currentQuery);
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="hits-badge">${totalCount}</span>
                    <div class="place-name">${escapeHtml(place.name)}</div>
                    <div class="place-meta">${escapeHtml(fc)} · ${matchedWorks.length} obra${matchedWorks.length > 1 ? 's' : ''}</div>
                    <div class="work-preview"><em>${escapeHtml(previewWork.headline || '')}:</em> ${highlight(previewWork.text || '', previewRe)}</div>`;
                li.addEventListener('click', () => {
                    document.querySelectorAll('.results li').forEach(x => x.classList.remove('active'));
                    li.classList.add('active');
                    map.setView([lat, lon], 8, { animate: true });
                    marker.openPopup();
                });
                resultsList.appendChild(li);
            });

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
        } else if (bounds.length === 1) {
            map.setView(bounds[0], 6);
        }
    }

    searchInput.addEventListener('input', e => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => runSearch(e.target.value), 200);
    });

    document.querySelectorAll('.suggest').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const q = a.dataset.q;
            searchInput.value = q;
            runSearch(q);
        });
    });
});
