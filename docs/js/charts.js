/* =================================================================
   BOURSE-50 — public/js/charts.js
   Pure SVG construction. No chart library, no canvas, no CDN.
     sparkline(values, 72x32) · area(values, ~64) · donut(slices)
   ================================================================= */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }
  function scale(values, w, h, pad) {
    pad = pad === undefined ? 3 : pad;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    if (!isFinite(min) || !isFinite(max)) return function () { return h / 2; };
    var span = (max - min) || (Math.abs(max) * 0.001) || 1;
    return function (v) {
      var t = (v - min) / span;
      return h - pad - t * (h - pad * 2);
    };
  }
  function points(values, w, h, pad) {
    var y = scale(values, w, h, pad);
    var step = values.length > 1 ? w / (values.length - 1) : w;
    return values.map(function (v, i) {
      return (i * step).toFixed(2) + ',' + y(v).toFixed(2);
    }).join(' ');
  }

  /** 72x32, 1.5px stroke, no fill. */
  function sparkline(values, positive) {
    var w = 72, h = 32;
    var node = svg('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, 'aria-hidden': 'true' });
    if (!values || values.length < 2) return node;
    node.appendChild(svg('polyline', {
      points: points(values, w, h, 4),
      fill: 'none',
      stroke: positive ? 'var(--up)' : 'var(--down)',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));
    return node;
  }

  /** Line + gradient fill + end dot, ~64px tall, no axes, no gridlines. */
  function area(values, opts) {
    opts = opts || {};
    var w = 320, h = opts.height || 64;
    var color = opts.positive ? 'var(--up)' : 'var(--down)';
    var id = 'g' + Math.random().toString(36).slice(2, 9);
    var node = svg('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'none',
      width: '100%', height: h,
      'aria-hidden': 'true'
    });
    if (!values || values.length < 2) return node;

    var defs = svg('defs');
    var grad = svg('linearGradient', { id: id, x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.appendChild(svg('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': '0.34' }));
    grad.appendChild(svg('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': '0' }));
    defs.appendChild(grad);
    node.appendChild(defs);

    var y = scale(values, w, h, 7);
    var step = values.length > 1 ? w / (values.length - 1) : w;
    var coords = values.map(function (v, i) { return { x: i * step, y: y(v) }; });

    var lineD = coords.map(function (c, i) {
      return (i ? 'L' : 'M') + c.x.toFixed(2) + ' ' + c.y.toFixed(2);
    }).join(' ');
    var areaD = lineD + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';

    node.appendChild(svg('path', { d: areaD, fill: 'url(#' + id + ')', stroke: 'none' }));
    node.appendChild(svg('path', {
      d: lineD, fill: 'none', stroke: color, 'stroke-width': '2',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      vectorEffect: 'non-scaling-stroke'
    }));

    var last = coords[coords.length - 1];
    node.appendChild(svg('circle', { cx: last.x.toFixed(2), cy: last.y.toFixed(2), r: '3', fill: color }));
    return node;
  }

  /** Segments per holding plus a cash slice. */
  function donut(slices, opts) {
    opts = opts || {};
    var size = opts.size || 132;
    var stroke = opts.stroke || 15;
    var r = (size - stroke) / 2;
    var c = size / 2;
    var node = svg('svg', { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, 'aria-hidden': 'true' });
    var total = slices.reduce(function (a, s) { return a + Math.max(0, s.value); }, 0);
    var circ = 2 * Math.PI * r;

    var bg = svg('circle', {
      cx: c, cy: c, r: r, fill: 'none',
      stroke: 'var(--surface-2)', 'stroke-width': stroke
    });
    node.appendChild(bg);

    if (total <= 0) return node;

    var offset = 0;
    slices.forEach(function (s) {
      var frac = Math.max(0, s.value) / total;
      if (frac <= 0) return;
      var seg = svg('circle', {
        cx: c, cy: c, r: r, fill: 'none',
        stroke: s.color, 'stroke-width': stroke,
        'stroke-dasharray': (frac * circ - 1.6).toFixed(2) + ' ' + (circ - frac * circ + 1.6).toFixed(2),
        'stroke-dashoffset': (-offset).toFixed(2),
        transform: 'rotate(-90 ' + c + ' ' + c + ')',
        'stroke-linecap': 'butt'
      });
      node.appendChild(seg);
      offset += frac * circ;
    });
    return node;
  }

  window.B50Charts = { sparkline: sparkline, area: area, donut: donut, svg: svg };
})();
