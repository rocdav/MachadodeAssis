(function () {
    if (typeof L === 'undefined' || !L.Layer) return;

    function targetMax() {
        const w = window.innerWidth || 1024;
        const sidebarW = 380;
        const padding = 80;
        const avail = Math.max(0, w - sidebarW - padding);
        if (w >= 1500) return Math.min(avail, 920);
        if (w >= 1200) return Math.min(avail, 780);
        if (w >= 980) return Math.min(avail, 640);
        if (w >= 768) return Math.min(avail, 540);
        return 0;
    }

    const orig = L.Layer.prototype.bindPopup;
    L.Layer.prototype.bindPopup = function (content, options) {
        options = Object.assign({}, options || {});
        const t = targetMax();
        if (t > (options.maxWidth || 0)) options.maxWidth = t;
        if (!options.minWidth || options.minWidth < 320) options.minWidth = 320;
        return orig.call(this, content, options);
    };
})();
