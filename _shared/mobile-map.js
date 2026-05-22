(function () {
    const QUERY = '(max-width: 768px)';
    const mq = window.matchMedia(QUERY);

    function isMobile() {
        return mq.matches;
    }

    function patchLeafletPopupOptions() {
        if (!window.L || !L.Layer || L.Layer.prototype._gazMobilePopupPatched) return;

        const originalBindPopup = L.Layer.prototype.bindPopup;
        L.Layer.prototype.bindPopup = function (content, options) {
            let nextOptions = options;
            if (isMobile()) {
                const width = Math.max(240, Math.min(window.innerWidth - 48, 420));
                nextOptions = Object.assign({}, options || {}, {
                    minWidth: 0,
                    maxWidth: width,
                    autoPan: true,
                    autoPanPaddingTopLeft: [16, 88],
                    autoPanPaddingBottomRight: [16, 190]
                });
            }
            return originalBindPopup.call(this, content, nextOptions);
        };
        L.Layer.prototype._gazMobilePopupPatched = true;
    }

    function patchClusteredOpenPopup() {
        if (!window.L || !L.Layer) return;

        if (L.MarkerClusterGroup && L.MarkerClusterGroup.prototype) {
            const groupProto = L.MarkerClusterGroup.prototype;

            if (!groupProto._gazClusterAddLayerPatched) {
                const originalAddLayer = groupProto.addLayer;
                groupProto.addLayer = function (layer) {
                    if (layer) layer._gazClusterGroup = this;
                    return originalAddLayer.call(this, layer);
                };

                if (groupProto.addLayers) {
                    const originalAddLayers = groupProto.addLayers;
                    groupProto.addLayers = function (layers) {
                        if (Array.isArray(layers)) {
                            layers.forEach(layer => { if (layer) layer._gazClusterGroup = this; });
                        }
                        return originalAddLayers.call(this, layers);
                    };
                }

                groupProto._gazClusterAddLayerPatched = true;
            }
        }

        function patchOpenPopup(proto) {
            if (
                !proto ||
                Object.prototype.hasOwnProperty.call(proto, '_gazClusterPopupPatched') ||
                typeof proto.openPopup !== 'function'
            ) return;

            const originalOpenPopup = proto.openPopup;
            proto.openPopup = function () {
                const cluster = this._gazClusterGroup;
                if (
                    cluster &&
                    cluster._map &&
                    typeof cluster.zoomToShowLayer === 'function' &&
                    !this._gazOpeningPopupViaCluster
                ) {
                    const args = arguments;
                    this._gazOpeningPopupViaCluster = true;
                    cluster.zoomToShowLayer(this, () => {
                        try {
                            originalOpenPopup.apply(this, args);
                        } finally {
                            this._gazOpeningPopupViaCluster = false;
                        }
                    });
                    return this;
                }
                return originalOpenPopup.apply(this, arguments);
            };
            proto._gazClusterPopupPatched = true;
        }

        patchOpenPopup(L.Layer.prototype);
        if (L.Marker) patchOpenPopup(L.Marker.prototype);
        if (L.Path) patchOpenPopup(L.Path.prototype);
        if (L.CircleMarker) patchOpenPopup(L.CircleMarker.prototype);
        if (L.Circle) patchOpenPopup(L.Circle.prototype);
    }

    function openPopupThroughCluster(layer) {
        if (!layer || typeof layer.openPopup !== 'function') return false;
        layer.openPopup();
        return true;
    }

    window.GazOpenPopup = openPopupThroughCluster;

    let selectedLayer = null;
    let selectedHalo = null;

    function clearSelectedHalo() {
        if (!selectedHalo) return;
        selectedHalo.remove();
        selectedHalo = null;
    }

    function showSelectedHalo(layer) {
        if (!window.L || !layer || typeof layer.getLatLng !== 'function') return;
        const map = layer._map || (layer._gazClusterGroup && layer._gazClusterGroup._map) || window._gazMap;
        if (!map || typeof map.addLayer !== 'function') return;

        clearSelectedHalo();
        selectedHalo = L.circleMarker(layer.getLatLng(), {
            radius: 15,
            color: '#c62828',
            weight: 4,
            opacity: 0.95,
            fillColor: '#ffeb3b',
            fillOpacity: 0.26,
            interactive: false
        });
        selectedHalo.addTo(map);
        if (selectedHalo._path) selectedHalo._path.classList.add('gaz-selected-halo');
        if (typeof selectedHalo.bringToFront === 'function') selectedHalo.bringToFront();
    }

    function setSelectedMarker(layer) {
        if (!layer || layer === selectedLayer) return;
        clearSelectedMarker();
        selectedLayer = layer;
        showSelectedHalo(layer);

        if (typeof layer.setZIndexOffset === 'function') {
            layer._gazPreviousZIndexOffset = layer.options ? layer.options.zIndexOffset || 0 : 0;
            layer.setZIndexOffset(1000);
        }
        if (layer._icon) layer._icon.classList.add('gaz-selected-marker');
        if (layer._shadow) layer._shadow.classList.add('gaz-selected-marker-shadow');
        if (layer._path) layer._path.classList.add('gaz-selected-marker');
        if (typeof layer.bringToFront === 'function') layer.bringToFront();
    }

    function clearSelectedMarker() {
        const layer = selectedLayer;
        if (!layer) return;

        if (layer._icon) layer._icon.classList.remove('gaz-selected-marker');
        if (layer._shadow) layer._shadow.classList.remove('gaz-selected-marker-shadow');
        if (layer._path) layer._path.classList.remove('gaz-selected-marker');
        clearSelectedHalo();
        if (typeof layer.setZIndexOffset === 'function' && layer._gazPreviousZIndexOffset !== undefined) {
            layer.setZIndexOffset(layer._gazPreviousZIndexOffset);
            delete layer._gazPreviousZIndexOffset;
        }
        selectedLayer = null;
    }

    function initSelectedMarker() {
        const map = window._gazMap;
        if (!map || typeof map.on !== 'function') {
            window.setTimeout(initSelectedMarker, 80);
            return;
        }
        if (map._gazSelectedMarkerInit) return;
        map._gazSelectedMarkerInit = true;

        map.on('popupopen', function (event) {
            const source = event.popup && event.popup._source;
            setSelectedMarker(source);
        });

        map.on('popupclose', function () {
            if (document.body.classList.contains('gaz-mobile-sheet-open')) return;
            clearSelectedMarker();
        });

        window.GazSelectedMarker = {
            set: setSelectedMarker,
            clear: clearSelectedMarker
        };
    }

    function ensureSheet() {
        let sheet = document.querySelector('.gaz-mobile-sheet');
        if (sheet) return sheet;

        sheet = document.createElement('section');
        sheet.className = 'gaz-mobile-sheet';
        sheet.setAttribute('aria-live', 'polite');
        sheet.innerHTML = [
            '<div class="gaz-mobile-sheet__bar" aria-hidden="true"></div>',
            '<button class="gaz-mobile-sheet__close" type="button" aria-label="Fechar">×</button>',
            '<div class="gaz-mobile-sheet__body"></div>'
        ].join('');
        document.body.appendChild(sheet);

        sheet.querySelector('.gaz-mobile-sheet__close').addEventListener('click', closeSheet);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeSheet();
        });
        return sheet;
    }

    function closeSheet() {
        const sheet = document.querySelector('.gaz-mobile-sheet');
        if (!sheet) return;
        sheet.classList.remove('is-open');
        document.body.classList.remove('gaz-mobile-sheet-open');
        clearSelectedMarker();
    }

    function collapseSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || sidebar.classList.contains('collapsed')) return;
        sidebar.classList.add('collapsed');

        const toggle = sidebar.querySelector('.sidebar-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '<span aria-hidden="true">▾</span>';
        }
    }

    function showSlide(root, target) {
        const slides = root.querySelectorAll('.slide');
        if (!slides.length) return;

        const idx = ((target % slides.length) + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.style.display = i === idx ? 'block' : 'none';
            if (i === idx) slide.dataset.current = '1';
            else delete slide.dataset.current;
        });

        const counter = root.querySelector('.ss-counter');
        if (counter) counter.textContent = `${idx + 1} / ${slides.length}`;
    }

    function wireSheetControls(sheet) {
        const content = sheet.querySelector('.popup-content');
        if (!content) return;

        const slides = content.querySelectorAll('.slide');
        if (slides.length) showSlide(content, 0);

        sheet.querySelectorAll('.ss-prev').forEach(function (button) {
            button.addEventListener('click', function () {
                const current = content.querySelector('.slide[data-current="1"]') || content.querySelector('.slide');
                showSlide(content, parseInt(current.dataset.idx || '0', 10) - 1);
            });
        });

        sheet.querySelectorAll('.ss-next').forEach(function (button) {
            button.addEventListener('click', function () {
                const current = content.querySelector('.slide[data-current="1"]') || content.querySelector('.slide');
                showSlide(content, parseInt(current.dataset.idx || '0', 10) + 1);
            });
        });
    }

    function openHtml(html) {
        if (!isMobile()) return false;

        const sheet = ensureSheet();
        const body = sheet.querySelector('.gaz-mobile-sheet__body');
        body.innerHTML = html;
        sheet.classList.add('is-open');
        document.body.classList.add('gaz-mobile-sheet-open');
        collapseSidebar();
        wireSheetControls(sheet);
        return true;
    }

    window.GazMobileSheet = {
        openHtml,
        close: closeSheet,
        isMobile
    };

    function initSheet() {
        const map = window._gazMap;
        if (!map || typeof map.on !== 'function') {
            window.setTimeout(initSheet, 80);
            return;
        }

        ensureSheet();

        map.on('popupopen', function (event) {
            if (!isMobile()) return;

            const popupElement = event.popup && event.popup.getElement && event.popup.getElement();
            const popupContent = popupElement && popupElement.querySelector('.leaflet-popup-content');
            if (!popupContent) return;

            openHtml(popupContent.innerHTML);

            window.setTimeout(function () {
                map.closePopup(event.popup);
                if (typeof map.invalidateSize === 'function') map.invalidateSize();
            }, 0);
        });

        map.on('dragstart zoomstart', function () {
            if (isMobile()) closeSheet();
        });
    }

    patchLeafletPopupOptions();
    patchClusteredOpenPopup();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initSheet();
            initSelectedMarker();
        });
    } else {
        initSheet();
        initSelectedMarker();
    }
})();
