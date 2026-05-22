document.addEventListener('DOMContentLoaded', async () => {
    const select = document.getElementById('placeSelector');
    const container = document.getElementById('graph');
    const details = document.getElementById('details');

    let places;
    try {
        const resp = await fetch('../data/datafile.jsonld');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        places = await resp.json();
    } catch (e) {
        details.innerHTML = `<p style="color:#b00">Erro ao carregar dados: ${e.message}</p>`;
        select.innerHTML = '';
        return;
    }

    const sorted = [...places].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'pt-BR'));

    select.innerHTML = '';
    sorted.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p['@id'];
        opt.textContent = p.name;
        select.appendChild(opt);
    });

    let network = null;

    function truncate(str, n) {
        if (!str) return '';
        return str.length > n ? str.slice(0, n).trim() + '…' : str;
    }

    function render(placeId) {
        const place = sorted.find(p => p['@id'] === placeId);
        if (!place) return;

        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();

        nodes.add({
            id: 'place',
            label: `Place\n${place.name}`,
            title: place.description || place.name,
            color: { background: '#5d4037', border: '#3e2723' },
            shape: 'box',
            font: { color: '#fff', size: 14, face: 'Georgia' },
            margin: 10
        });

        if (place.geo) {
            const g = place.geo;
            const featureName = g['gn:featureCodeName'] || '';
            const geoLabel = `GeoCoordinates\nlat: ${g.lat}\nlong: ${g.long}` +
                (featureName ? `\n${featureName}` : '');
            nodes.add({
                id: 'geo',
                label: geoLabel,
                title: `${g['gn:name'] || place.name}\n${g['gn:featureCode'] || ''} — ${featureName}`,
                color: { background: '#9e9d24', border: '#827717' },
                shape: 'box',
                font: { color: '#fff', size: 11, face: 'Georgia' },
                margin: 8
            });
            edges.add({
                from: 'place', to: 'geo',
                label: 'schema:geo',
                font: { size: 10, color: '#666', background: '#faf6f1' },
                color: { color: '#999' },
                arrows: 'to'
            });
        }

        const works = place.subjectOf || [];
        works.forEach((w, i) => {
            const wid = `work-${i}`;
            const meta = `${w.genre || ''}${w.datePublished ? ` (${w.datePublished})` : ''}`;
            const label = `CreativeWork\n${w.headline || '?'}\n${meta}\n${truncate(w.text, 60)}`;
            nodes.add({
                id: wid,
                label: label,
                title: w.text || w.headline,
                color: { background: '#a1887f', border: '#6d4c41' },
                shape: 'box',
                font: { color: '#fff', size: 11, face: 'Georgia' },
                margin: 8
            });
            edges.add({
                from: 'place', to: wid,
                label: 'schema:subjectOf',
                font: { size: 10, color: '#666', background: '#faf6f1' },
                color: { color: '#999' },
                arrows: 'to'
            });
        });

        if (network) network.destroy();

        network = new vis.Network(container, { nodes, edges }, {
            physics: {
                solver: 'barnesHut',
                barnesHut: {
                    gravitationalConstant: -12000,
                    centralGravity: 0.2,
                    springLength: 180,
                    springConstant: 0.04
                },
                stabilization: { iterations: 250 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 150
            },
            edges: {
                smooth: { type: 'continuous' },
                arrows: { to: { scaleFactor: 0.5 } }
            }
        });
        window._gazNetwork = network;

        renderDetails(place);
    }

    function renderDetails(place) {
        const works = place.subjectOf || [];
        const featureName = place.geo && place.geo['gn:featureCodeName'];
        const lat = place.geo && place.geo.lat;
        const long = place.geo && place.geo.long;

        let html = `<h3>${place.name}</h3>`;
        if (featureName) {
            html += `<p class="feature">${featureName}`;
            if (lat && long) html += ` · ${lat}, ${long}`;
            html += `</p>`;
        }
        if (place.description) {
            html += `<p class="description">${place.description}</p>`;
        }

        if (works.length) {
            html += `<h4>Citado em ${works.length} obra${works.length > 1 ? 's' : ''}</h4><ul>`;
            works.forEach(w => {
                const meta = [w.genre, w.datePublished].filter(Boolean).join(' · ');
                html += `<li>
                    <div class="work-title">${w.headline || 'Sem título'}</div>
                    <div class="work-meta">${meta}</div>
                    <div class="work-text">${w.text || ''}</div>
                </li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p class="hint">Sem obras associadas a este local.</p>`;
        }
        details.innerHTML = html;
    }

    select.addEventListener('change', () => render(select.value));

    if (sorted.length) {
        select.value = sorted[0]['@id'];
        render(sorted[0]['@id']);
    }
});
