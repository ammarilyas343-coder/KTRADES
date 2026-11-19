/* =================================================================
   BOURSE-50 — public/js/views/home.js  (#/home)
   KTrade-style layout: hero net worth card, filter rail, instrument
   rows with a 72x32 sparkline as the fulcrum.
   ================================================================= */
(function () {
  'use strict';
  var el = function (t, p, c) { return window.B50El(t, p, c); };
  var F = function () { return window.B50Format; };
  var C = function () { return window.B50Charts; };

  var WATCHLIST_KEY = 'bourse50.watchlist';
  var DEFAULT_WATCH = ['TXLM', 'MEBK', 'SOLRX', 'CURA', 'MOTO', 'SGNL', 'AURM'];

  function watchlist() {
    try {
      var raw = localStorage.getItem(WATCHLIST_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_WATCH.slice();
  }

  var filter = 'watchlist';
  var sortDir = 'desc';

  function sortAndFilter(instruments) {
    var list = instruments.slice();
    if (filter === 'watchlist') {
      var w = watchlist();
      list = list.filter(function (i) { return w.indexOf(i.symbol) >= 0; });
    } else if (filter === 'gainers') {
      list = list.filter(function (i) { return i.changePct > 0; });
    } else if (filter === 'losers') {
      list = list.filter(function (i) { return i.changePct < 0; });
    } else if (filter === 'volume') {
      list = list.slice().sort(function (a, b) { return a.sharesAvailable - b.sharesAvailable; });
      return list.slice(0, 12);
    }
    list.sort(function (a, b) {
      return sortDir === 'desc' ? b.changePct - a.changePct : a.changePct - b.changePct;
    });
    return list;
  }

  function instrumentRow(item) {
    var dir = F().direction(item.changePct);
    var abs = Math.abs(item.changePct);
    var pts = (item.price - item.prevClose);
    var chg = el('div', { class: 'row-chg ' + dir });
    if (dir === 'flat') {
      chg.textContent = '0.00 (0.00%)';
    } else {
      chg.appendChild(el('span', { text: dir === 'up' ? '\u25B2' : '\u25BC' }));
      chg.appendChild(el('span', { text: F().num(Math.abs(pts), 2) + ' (' + abs.toFixed(2) + '%)' }));
    }

    var tile = el('div', { class: 'tile' }, [el('span', { text: item.logoText })]);
    tile.style.background = hexA(item.logoColor, 0.12);
    tile.style.color = item.logoColor;

    var row = el('a', {
      class: 'row', href: '#/trade?symbol=' + encodeURIComponent(item.symbol),
      'aria-label': item.symbol + ' ' + item.name
    }, [
      tile,
      el('div', { class: 'row-id' }, [
        el('div', { class: 'row-sym', text: item.symbol }),
        el('div', { class: 'row-name', text: item.name }),
        el('span', { class: 'chip', text: item.sector })
      ]),
      el('div', { class: 'row-spark' }),
      el('div', { class: 'row-nums' }, [
        el('div', { class: 'row-price', text: F().price(item.price) }),
        chg
      ])
    ]);
    row.querySelector('.row-spark').appendChild(C().sparkline(item.spark, item.changePct >= 0));
    row.dataset.price = String(item.price);
    return row;
  }

  function hexA(hex, a) {
    var h = String(hex || '#22C55E').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    if (isNaN(r)) { r = 34; g = 197; b = 94; }
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function view(host) {
    var store = window.B50Store;
    var period = 'all';

    var heroValue = el('div', { class: 'hero-value' });
    var heroChart = el('div', { class: 'hero-chart' });
    var investedEl = el('div', { class: 'value' });
    var cashEl = el('div', { class: 'value' });
    var seg = el('div', { class: 'seg' });
    var listEl = el('div', { class: 'list' });
    var railEl = el('div', { class: 'rail' });

    var eyeBtn = el('button', {
      class: 'eye-btn', type: 'button',
      'aria-label': store.state.masked ? 'Show amounts' : 'Hide amounts'
    });
    eyeBtn.innerHTML = window.B50Shell.icon(store.state.masked ? 'eyeOff' : 'eye', 18);
    eyeBtn.addEventListener('click', function () {
      store.toggleMasked();
      renderHero();
    });

    ['All Time', 'Today'].forEach(function (p) {
      var key = p === 'All Time' ? 'all' : 'today';
      var b = el('button', { type: 'button', text: p, 'aria-pressed': String(period === key) });
      b.addEventListener('click', function () {
        period = key;
        Array.prototype.forEach.call(seg.children, function (c) {
          c.setAttribute('aria-pressed', String(c.textContent === p));
        });
        renderHero();
      });
      seg.appendChild(b);
    });

    var hero = el('section', { class: 'hero', 'aria-label': 'Net worth' }, [
      el('div', { class: 'hero-glow up' }),
      el('div', { class: 'hero-glow down' }),
      el('div', { class: 'hero-top' }, [
        el('div', {}, [el('span', { class: 'micro', text: 'NET WORTH' }), eyeBtn]),
        seg
      ]),
      heroValue,
      heroChart,
      el('div', { class: 'hero-split' }, [
        el('div', {}, [el('div', { class: 'label', text: 'Invested' }), investedEl]),
        el('div', {}, [el('div', { class: 'label', text: 'Cash Balance' }), cashEl])
      ])
    ]);

    var FILTERS = [
      { key: 'watchlist', label: 'Watchlist', icon: 'bookmark' },
      { key: 'volume', label: 'Top Volume', icon: 'flame' },
      { key: 'gainers', label: 'Gainers', icon: 'up' },
      { key: 'losers', label: 'Losers', icon: 'down' }
    ];
    var scroll = el('div', { class: 'rail-scroll' });
    FILTERS.forEach(function (f) {
      var b = el('button', { class: 'pill', type: 'button', 'aria-pressed': String(filter === f.key) });
      b.innerHTML = window.B50Shell.icon(f.icon, 14) + '<span></span>';
      b.querySelector('span').textContent = f.label;
      b.addEventListener('click', function () {
        filter = f.key;
        Array.prototype.forEach.call(scroll.children, function (c) {
          c.setAttribute('aria-pressed', String(c === b));
        });
        renderList(true);
      });
      scroll.appendChild(b);
    });
    var sortBtn = el('button', { class: 'sort-btn', type: 'button', 'aria-label': 'Toggle sort direction' });
    sortBtn.innerHTML = window.B50Shell.icon('sort', 15);
    sortBtn.addEventListener('click', function () {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
      renderList(true);
    });
    railEl.appendChild(scroll);
    railEl.appendChild(sortBtn);

    host.appendChild(hero);
    host.appendChild(railEl);
    host.appendChild(listEl);

    function renderHero() {
      var pf = store.state.portfolio;
      var maskedNow = F().masked();
      if (!pf) {
        heroValue.className = 'hero-value sk';
        heroValue.style.width = '190px';
        heroValue.textContent = '';
        investedEl.textContent = F().dots();
        cashEl.textContent = F().dots();
        heroChart.innerHTML = '';
        return;
      }
      heroValue.className = 'hero-value' + (maskedNow ? ' masked' : '');
      heroValue.style.width = '';
      heroValue.textContent = maskedNow
        ? 'Rs ' + F().dots(6)
        : F().moneyRounded(pf.netWorth);

      investedEl.textContent = maskedNow ? F().dots(6) : F().money(pf.invested, { decimals: 0 });
      cashEl.textContent = maskedNow ? F().dots(6) : F().money(pf.cash, { decimals: 0 });

      var hist = (pf.history || []).map(function (h) { return h.netWorth; });
      if (period === 'today' && hist.length > 6) hist = hist.slice(Math.floor(hist.length * 0.6));
      if (hist.length < 2) hist = [pf.netWorth, pf.netWorth];
      var change = hist[hist.length - 1] - hist[0];
      heroChart.innerHTML = '';
      heroChart.appendChild(C().area(hist, { positive: change >= 0, height: 64 }));
      eyeBtn.innerHTML = window.B50Shell.icon(maskedNow ? 'eyeOff' : 'eye', 18);
      eyeBtn.setAttribute('aria-label', maskedNow ? 'Show amounts' : 'Hide amounts');
    }

    function renderList(animate) {
      var market = store.state.market;
      listEl.innerHTML = '';
      if (!market) {
        for (var i = 0; i < 6; i++) listEl.appendChild(el('div', { class: 'sk sk-row' }));
        return;
      }
      var items = sortAndFilter(market.instruments || []);
      if (!items.length) {
        listEl.appendChild(el('div', { class: 'empty' }, [
          el('div', { html: window.B50Shell.icon('search', 30) }),
          el('div', { text: 'Nothing in this filter right now.' })
        ]));
        return;
      }
      items.forEach(function (it) { listEl.appendChild(instrumentRow(it)); });
      if (animate) {
        listEl.classList.remove('fade');
        void listEl.offsetWidth;
        listEl.classList.add('fade');
      }
    }

    renderHero();
    renderList(false);

    var unsub = store.subscribe(function (s, keys) {
      if (keys.indexOf('portfolio') >= 0 || keys.indexOf('masked') >= 0) renderHero();
      if (keys.indexOf('market') >= 0) renderList(false);
    });
    window.B50App.onCleanup(unsub);
  }

  window.B50Views = window.B50Views || {};
  window.B50Views.home = view;
})();
