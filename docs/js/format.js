/* =================================================================
   BOURSE-50 — public/js/format.js
   en-PK money (Rs 1,24,850.00), signed percents, mask helper, el().
   ================================================================= */
(function () {
  'use strict';

  var MASK = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

  /** Indian/lakh grouping: 124850 -> "1,24,850" */
  function groupIndian(intPart) {
    if (intPart.length <= 3) return intPart;
    var last3 = intPart.slice(-3);
    var rest = intPart.slice(0, -3);
    var out = '';
    while (rest.length > 2) {
      out = ',' + rest.slice(-2) + out;
      rest = rest.slice(0, -2);
    }
    if (rest) out = rest + out;
    return out + ',' + last3;
  }

  function groupWestern(intPart) {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function parts(value) {
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    var neg = n < 0;
    var abs = Math.abs(n);
    var fixed = abs.toFixed(2);
    var bits = fixed.split('.');
    return { neg: neg, int: bits[0], dec: bits[1] };
  }

  function money(value, opts) {
    opts = opts || {};
    var p = parts(value);
    var grouped = opts.compact ? groupWestern(p.int) : groupIndian(p.int);
    var body = opts.decimals === 0 ? grouped : grouped + '.' + p.dec;
    return (p.neg ? '-' : '') + (opts.noSymbol ? '' : 'Rs ') + body;
  }

  function moneyRounded(value) {
    var p = parts(value);
    return (p.neg ? '-' : '') + 'Rs ' + groupIndian(String(Math.round(Math.abs(Number(value)))));
  }

  function pct(value, opts) {
    opts = opts || {};
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    var fixed = Math.abs(n).toFixed(2);
    var sign = opts.sign === false ? '' : (n > 0 ? '+' : (n < 0 ? '-' : ''));
    return sign + fixed + '%';
  }

  function num(value, dp) {
    dp = dp === undefined ? 2 : dp;
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    var p = { neg: n < 0, int: String(Math.abs(n).toFixed(dp)).split('.')[0], dec: (Math.abs(n).toFixed(dp).split('.')[1] || '') };
    var body = groupIndian(p.int) + (dp ? '.' + p.dec : '');
    return (p.neg ? '-' : '') + body;
  }

  function price(value) {
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    return n.toFixed(2);
  }

  function masked() { return window.B50Store && window.B50Store.state.masked; }

  /** Money that respects the eye toggle: 'Rs 1,24,850.00' or 'Rs ••••••'. */
  function moneyMasked(value, opts) {
    if (masked()) return 'Rs ' + MASK;
    return money(value, opts);
  }
  function dots(len) { return MASK.substring(0, len || 7); }

  function direction(value) {
    var n = Number(value);
    if (!isFinite(n) || n === 0) return 'flat';
    return n > 0 ? 'up' : 'down';
  }
  function arrow(value) {
    var d = direction(value);
    return d === 'up' ? '\u25B2' : (d === 'down' ? '\u25BC' : '');
  }

  function shortTime(ts) {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function dateTime(ts) {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ', ' + shortTime(ts);
  }

  /**
   * DOM builder. Children/strings are assigned with textContent, so no
   * user-supplied string is ever parsed as HTML.
   * el('div', {class:'x', onclick:fn, text:'hi'}, [child, ...])
   */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') { node.textContent = String(v); return; }
        if (k === 'html') { node.innerHTML = v; return; } // static markup only
        if (k === 'class') { node.className = v; return; }
        if (k === 'style' && typeof v === 'object') { Object.assign(node.style, v); return; }
        if (k.indexOf('on') === 0 && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
          return;
        }
        if (k === 'dataset') { Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; }); return; }
        node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        node.appendChild(typeof c === 'string' || typeof c === 'number'
          ? document.createTextNode(String(c)) : c);
      });
    }
    return node;
  }

  window.B50Format = {
    money: money,
    moneyRounded: moneyRounded,
    moneyMasked: moneyMasked,
    pct: pct,
    num: num,
    price: price,
    dots: dots,
    masked: masked,
    direction: direction,
    arrow: arrow,
    shortTime: shortTime,
    dateTime: dateTime,
    groupIndian: groupIndian,
    el: el
  };
  window.B50El = el;
})();
