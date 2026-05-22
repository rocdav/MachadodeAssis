document.addEventListener('DOMContentLoaded', async () => {
    const YEAR_MIN = 1858;
    const YEAR_MAX = 1908;
    const DECADES = [1850, 1860, 1870, 1880, 1890, 1900];
    const DECADE_COLORS = {
        1850: '#d2b48c',
        1860: '#bda77a',
        1870: '#a09147',
        1880: '#9e9d24',
        1890: '#7a7a18',
        1900: '#5d4037'
    };
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

    function classOfPlace(place) {
        const fc = (place.geo && place.geo['gn:featureCode']) || '';
        const c = fc[0] || '';
        return PLACE_CLASS_LABELS[c] ? c : 'OUTRO';
    }

    let genreFilter = 'all';
    let classFilter = 'all';

    const yearMinInput = document.getElementById('yearMin');
    const yearMaxInput = document.getElementById('yearMax');
    const yearMinLabel = document.getElementById('yearMinLabel');
    const yearMaxLabel = document.getElementById('yearMaxLabel');
    const rangeFill = document.getElementById('rangeFill');
    const statsEl = document.getElementById('stats');
    const decChartEl = document.getElementById('decChart');
    const resultsList = document.getElementById('results');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');
    const placeClassSelect = document.getElementById('placeClass');
    const genreBtns = document.querySelectorAll('.genre-btn');

    const PLAY_INTERVAL_MS = 400;
    let playTimer = null;

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
                const works = (p.subjectOf || []).map(w => {
                    const m = String(w.datePublished || '').match(/1[789]\d{2}/);
                    return m ? Object.assign({}, w, { _year: parseInt(m[0], 10) }) : null;
                }).filter(Boolean);
                if (!works.length) return null;
                const years = works.map(w => w._year);
                return Object.assign({}, p, {
                    _lat: lat, _lon: lon,
                    _works: works,
                    _firstYear: Math.min(...years),
                    _lastYear: Math.max(...years),
                    _class: classOfPlace(p),
                    _key: `place-${idx}`
                });
            })
            .filter(Boolean);
    } catch (e) {
        statsEl.innerHTML = `<span style="color:#b00">Erro ao carregar dados: ${e.message}</span>`;
        return;
    }

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function decadeOf(year) {
        return Math.floor(year / 10) * 10;
    }

    function colorForYear(year) {
        return DECADE_COLORS[decadeOf(year)] || '#9e9d24';
    }

    function buildPopup(place, worksInRange) {
        const fc = (place.geo && place.geo['gn:featureCodeName']) || '';
        let html = `<div class="popup-content">
            <h3>${escapeHtml(place.name)}</h3>
            <p class="popup-meta">${escapeHtml(fc)} · estréia em ${place._firstYear}</p>
            <div class="popup-works">`;
        worksInRange.forEach(w => {
            const meta = [w.genre, w._year].filter(Boolean).join(' · ');
            html += `<div class="work">
                <div class="work-title">${escapeHtml(w.headline || 'Sem título')}</div>
                <div class="work-meta">${escapeHtml(meta)}</div>
                <div class="work-text">${escapeHtml(w.text || '')}</div>
            </div>`;
        });
        html += `</div></div>`;
        return html;
    }

    function activeDecadeIdx(yMin, yMax) {
        const out = new Set();
        DECADES.forEach((d, i) => {
            if (d + 9 >= yMin && d <= yMax) out.add(i);
        });
        return out;
    }

    function passesPlaceFilter(p) {
        return classFilter === 'all' || p._class === classFilter;
    }

    function passesGenreFilter(w) {
        return genreFilter === 'all' || w.genre === genreFilter;
    }

    function renderChart(yMin, yMax) {
        const counts = {};
        DECADES.forEach(d => counts[d] = 0);
        allPlaces.forEach(p => {
            if (!passesPlaceFilter(p)) return;
            const works = p._works.filter(passesGenreFilter);
            if (!works.length) return;
            const firstYear = Math.min(...works.map(w => w._year));
            const d = decadeOf(firstYear);
            if (counts[d] !== undefined) counts[d]++;
        });
        const max = Math.max(...Object.values(counts));
        const active = activeDecadeIdx(yMin, yMax);
        decChartEl.innerHTML = '';
        DECADES.forEach((d, i) => {
            const h = max > 0 ? Math.max(2, Math.round(100 * counts[d] / max)) : 0;
            const isActive = active.has(i);
            const bar = document.createElement('div');
            bar.className = 'dec-bar' + (isActive ? ' active' : '');
            bar.title = `${counts[d]} lugares estreando nos anos ${d}s`;
            bar.innerHTML = `
                <div class="dec-bar-count">${counts[d]}</div>
                <div class="dec-bar-fill" style="height:${h}%"></div>
                <div class="dec-bar-label">${String(d).slice(2)}s</div>`;
            bar.addEventListener('click', () => {
                yearMinInput.value = d;
                yearMaxInput.value = Math.min(YEAR_MAX, d + 9);
                update();
            });
            decChartEl.appendChild(bar);
        });
    }

    function update() {
        let yMin = parseInt(yearMinInput.value, 10);
        let yMax = parseInt(yearMaxInput.value, 10);
        if (yMin > yMax) { yMin = yMax; yearMinInput.value = yMin; }

        yearMinLabel.textContent = yMin;
        yearMaxLabel.textContent = yMax;

        const span = YEAR_MAX - YEAR_MIN;
        const leftPct = ((yMin - YEAR_MIN) / span) * 100;
        const widthPct = ((yMax - yMin) / span) * 100;
        rangeFill.style.left = leftPct + '%';
        rangeFill.style.width = widthPct + '%';

        // Filtra lugares: classe + gênero + range de ano
        const visible = [];
        let totalCit = 0;
        allPlaces.forEach(p => {
            if (!passesPlaceFilter(p)) return;
            const inRange = p._works.filter(w =>
                w._year >= yMin && w._year <= yMax && passesGenreFilter(w));
            if (inRange.length) {
                visible.push({ place: p, worksInRange: inRange });
                totalCit += inRange.length;
            }
        });

        const filterTags = [];
        if (genreFilter !== 'all') filterTags.push(genreFilter.toLowerCase() + 's');
        if (classFilter !== 'all') filterTags.push((PLACE_CLASS_LABELS[classFilter] || '').toLowerCase());
        const filterStr = filterTags.length ? ` <span class="filter-hint">(${filterTags.join(' · ')})</span>` : '';
        statsEl.innerHTML = `<strong>${visible.length}</strong> lugares · <strong>${totalCit}</strong> citaç${totalCit === 1 ? 'ão' : 'ões'} entre <strong>${yMin}</strong> e <strong>${yMax}</strong>${filterStr}`;

        // Markers
        cluster.clearLayers();
        markers.clear();
        const bounds = [];
        visible.forEach(({ place, worksInRange }) => {
            const m = L.circleMarker([place._lat, place._lon], {
                radius: 7,
                color: '#fff',
                weight: 1.5,
                fillColor: colorForYear(place._firstYear),
                fillOpacity: 0.85
            });
            m.bindPopup(buildPopup(place, worksInRange), { maxWidth: 360, minWidth: 280 });
            cluster.addLayer(m);
            markers.set(place._key, m);
            bounds.push([place._lat, place._lon]);
        });

        if (bounds.length > 1 && !map._hasZoomedOnce) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5 });
            map._hasZoomedOnce = true;
        }

        // Lista
        const sorted = [...visible].sort((a, b) => a.place._firstYear - b.place._firstYear
            || (a.place.name || '').localeCompare(b.place.name || '', 'pt-BR'));
        resultsList.innerHTML = '';
        sorted.forEach(({ place, worksInRange }) => {
            const li = document.createElement('li');
            const fc = (place.geo && place.geo['gn:featureCodeName']) || '';
            li.innerHTML = `
                <span class="first-year" title="primeira citação">${place._firstYear}</span>
                <div class="place-name">${escapeHtml(place.name)}</div>
                <div class="place-meta">${escapeHtml(fc)} · ${worksInRange.length} obra${worksInRange.length === 1 ? '' : 's'} no período</div>`;
            li.addEventListener('click', () => {
                document.querySelectorAll('.results li').forEach(x => x.classList.remove('active'));
                li.classList.add('active');
                map.setView([place._lat, place._lon], 8, { animate: true });
                const marker = markers.get(place._key);
                if (marker) marker.openPopup();
            });
            resultsList.appendChild(li);
        });

        renderChart(yMin, yMax);
    }

    function clampInputs() {
        let yMin = parseInt(yearMinInput.value, 10);
        let yMax = parseInt(yearMaxInput.value, 10);
        if (yMin > yMax) {
            if (this === yearMinInput) yearMaxInput.value = yMin;
            else yearMinInput.value = yMax;
        }
    }

    yearMinInput.addEventListener('input', function () {
        if (parseInt(yearMinInput.value, 10) > parseInt(yearMaxInput.value, 10)) {
            yearMaxInput.value = yearMinInput.value;
        }
        update();
    });
    yearMaxInput.addEventListener('input', function () {
        if (parseInt(yearMaxInput.value, 10) < parseInt(yearMinInput.value, 10)) {
            yearMinInput.value = yearMaxInput.value;
        }
        update();
    });

    function setPlaying(on) {
        if (on) {
            playBtn.textContent = '⏸';
            playBtn.classList.add('playing');
            playBtn.title = 'Pausar';
            playBtn.setAttribute('aria-label', 'Pausar');
        } else {
            playBtn.textContent = '▶';
            playBtn.classList.remove('playing');
            playBtn.title = 'Tocar a evolução ano a ano';
            playBtn.setAttribute('aria-label', 'Tocar');
        }
    }

    function stopPlay() {
        if (playTimer) {
            clearInterval(playTimer);
            playTimer = null;
        }
        setPlaying(false);
    }

    function startPlay() {
        if (playTimer) return;
        const yMin = parseInt(yearMinInput.value, 10);
        let yMax = parseInt(yearMaxInput.value, 10);
        // Se o range já cobre tudo (1858–1908) ou já chegou no fim, reinicia do começo
        if (yMax >= YEAR_MAX) {
            yearMinInput.value = YEAR_MIN;
            yearMaxInput.value = YEAR_MIN;
            update();
        }
        setPlaying(true);
        playTimer = setInterval(() => {
            const curMax = parseInt(yearMaxInput.value, 10);
            if (curMax >= YEAR_MAX) {
                stopPlay();
                return;
            }
            yearMaxInput.value = curMax + 1;
            update();
        }, PLAY_INTERVAL_MS);
    }

    playBtn.addEventListener('click', () => {
        if (playTimer) stopPlay();
        else startPlay();
    });
    resetBtn.addEventListener('click', () => {
        stopPlay();
        yearMinInput.value = YEAR_MIN;
        yearMaxInput.value = YEAR_MAX;
        update();
    });

    // Pausa automaticamente se o usuário arrastar manualmente
    ['mousedown', 'touchstart', 'keydown'].forEach(ev => {
        yearMinInput.addEventListener(ev, stopPlay);
        yearMaxInput.addEventListener(ev, stopPlay);
    });

    function buildPlaceClassSelect() {
        const counts = {};
        PLACE_CLASS_ORDER.forEach(c => counts[c] = 0);
        let total = 0;
        allPlaces.forEach(p => {
            counts[p._class] = (counts[p._class] || 0) + 1;
            total++;
        });
        placeClassSelect.innerHTML = `<option value="all">Todos (${total})</option>`;
        PLACE_CLASS_ORDER.forEach(c => {
            if (!counts[c]) return;
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = `${PLACE_CLASS_LABELS[c]} (${counts[c]})`;
            placeClassSelect.appendChild(opt);
        });
    }

    genreBtns.forEach(b => b.addEventListener('click', () => {
        genreFilter = b.dataset.genre;
        genreBtns.forEach(x => x.classList.toggle('active', x.dataset.genre === genreFilter));
        update();
    }));

    placeClassSelect.addEventListener('change', () => {
        classFilter = placeClassSelect.value;
        update();
    });

    buildPlaceClassSelect();
    update();
});
