/* =================================================================
   BOURSE-50 — public/js/views/portfolio.js  (#/portfolio)
   ================================================================= */
(function () {
  'use strict';
  var el = function (t, p, c) { return window.B50El(t, p, c); };
  var F = function () { return window.B50Format; };
  var C = function () { return window.B50Charts; };

  function view(host) {
    var store = window.B50Store;
    var summary = el('section', { class: 'hero', 'aria-label': 'Portfolio summary' }, [
      el('div', { class: 'hero-glow up' }),
      el('div', { class: 'hero-glow down' })
    ]);
    var chartCard = el('div', { class: 'card' }, [el('div', { class: 'micro', text: 'NET WORTH OVER THE EVENT' }), el('div', { class: 'hero-chart', style: { marginTop: '10px' } })]);
    var allocCard = el('div', { class: 'card' }, [el('div', { class: 'micro', text: 'ALLOCATION' }), el('div', { class: 'donut-wrap' })]);
    var holdingsCard = el('div', { class: 'card' }, [el('div', { class: 'micro', text: 'HOLDINGS' })]);
    var tradesCard = el('div', { class: 'card' }, [el('div', { class: 'micro', text: 'RECENT TRADES' })]);

    host.appendChild(summary);
    host.appendChild(chartCard);
    host.appendChild(allocCard);
    host.appendChild(holdingsCard);
    host.appendChild(tradesCard);

    var eyeBtn = el('button', { class: 'eye-btn', type: 'button', 'aria-label': 'Toggle amounts' });
    eyeBtn.addEventListener('click', function () { store.toggleMasked(); render(); });

    function skeleton() {
      summary.innerHTML = '';
      summary.appendChild(el('div', { class: 'sk sk-line', style: { width: '40%' } }));
      summary.appendChild(el('div', { class: 'sk', style: { width: '65%', height: '30px', margin: '14px 0' } }));
      summary.appendChild(el('div', { class: 'sk', style: { width: '100%', height: '64px' } }));
    }

    function render() {
      var pf = store.state.portfolio;
      if (!pf) { skeleton(); return; }
      var masked = F().masked();
      var dir = F().direction(pf.returnPct);

      summary.innerHTML = '';
      summary.appendChild(el('div', { class: 'hero-glow up' }));
      summary.appendChild(el('div', { class: 'hero-glow down' }));

      var top = el('div', { class: 'hero-top' }, [
        el('div', {}, [el('span', { class: 'micro', text: 'NET WORTH' }), eyeBtn])
      ]);
      eyeBtn.innerHTML = window.B50Shell.icon(masked ? 'eyeOff' : 'eye', 18);
      top.appendChild(el('div', { class: 'chips', style: { marginTop: '0' } }, [
        el('span', { class: 'rank-chip', text: pf.rank ? 'Rank ' + pf.rank + ' of ' + (pf.rankTotal || '—') : 'Unranked' }),
        el('span', { class: 'rank-chip neutral', text: 'Score ' + F().num(pf.score || 0, 1) })
      ]));
      summary.appendChild(top);

      summary.appendChild(el('div', { class: 'hero-value' + (masked ? ' masked' : ''),
        text: masked ? 'Rs ' + F().dots(6) : F().moneyRounded(pf.netWorth) }));

      var hist = (pf.history || []).map(function (h) { return h.netWorth; });
      if (hist.length < 2) hist = [pf.netWorth, pf.netWorth];
      var chartBox = chartCard.querySelector('.hero-chart');
      chartBox.innerHTML = '';
      chartBox.appendChild(C().area(hist, { positive: hist[hist.length - 1] >= hist[0], height: 64 }));

      summary.appendChild(el('div', { class: 'stat-row' }, [
        el('div', { class: 'stat' }, [
          el('div', { class: 'label', text: 'RETURN' }),
          el('div', { class: 'value ' + dir, text: F().pct(pf.returnPct) })
        ]),
        el('div', { class: 'stat' }, [
          el('div', { class: 'label', text: 'CASH' }),
          el('div', { class: 'value', text: masked ? F().dots() : F().money(pf.cash, { decimals: 0 }) })
        ]),
        el('div', { class: 'stat' }, [
          el('div', { class: 'label', text: 'INVESTED' }),
          el('div', { class: 'value', text: masked ? F().dots() : F().money(pf.invested, { decimals: 0 }) })
        ])
      ]));

      summary.appendChild(el('div', { class: 'hero-split', style: { marginTop: '14px' } }, [
        el('div', {}, [el('div', { class: 'label', text: 'Max drawdown' }),
          el('div', { class: 'value', text: F().pct(pf.drawdownPct || 0, { sign: false }) }]),
        el('div', {}, [el('div', { class: 'label', text: 'Starting capital' }),
          el('div', { class: 'value', text: masked ? F().dots() : F().money(pf.startingCash || 0, { decimals: 0 }) })])
      ]));

      // --- allocation donut ---
      var wrap = allocCard.querySelector('.donut-wrap');
      wrap.innerHTML = '';
      var slices = (pf.positions || []).filter(function (p) { return p.qty > 0; })
        .map(function (p) { return { label: p.symbol, value: p.value, color: p.logoColor || '#22C55E' }; });
      slices.push({ label: 'Cash', value: pf.cash, color: '#64748B' });
      wrap.appendChild(C().donut(slices, { size: 128, stroke: 15 }));
      var legend = el('div', { class: 'legend' });
      slices.sort(function (a, b) { return b.value - a.value; }).forEach(function (s) {
        var dot = el('span', { class: 'legend-dot' });
        dot.style.background = s.color;
        var total = pf.netWorth || 1;
        legend.appendChild(el('div', { class: 'legend-item' }, [
          dot,
          el('span', { class: 'legend-name', text: s.label }),
          el('span', { class: 'legend-val', text: Math.round((s.value / total) * 100) + '%' })
        ]));
      });
      wrap.appendChild(legend);

      // --- holdings ---
      holdingsCard.innerHTML = '';
      holdingsCard.appendChild(el('div', { class: 'micro', text: 'HOLDINGS' }));
      if (!(pf.positions || []).length || pf.positions.every(function (p) { return !p.qty; })) {
        holdingsCard.appendChild(el('div', { class: 'empty' }, [
          el('div', { html: window.B50Shell.icon('pie', 30) }),
          el('div', { text: 'No positions yet — start trading.' })
        ]));
        var goBtn = el('a', { class: 'btn sm', href: '#/trade', text: 'Open the trade screen' });
        holdingsCard.appendChild(goBtn);
      } else {
        var list = el('div', { class: 'list', style: { marginTop: '10px' } });
        pf.positions.filter(function (p) { return p.qty > 0; }).forEach(function (p) {
          var tile = el('div', { class: 'tile' }, [el('span', { text: p.logoText })]);
          tile.style.background = 'rgba(0,0,0,0)'; tile.style.background = hexA(p.logoColor, 0.12);
          tile.style.color = p.logoColor;
          var plDir = F().direction(p.pl);
          list.appendChild(el('a', { class: 'row', href: '#/trade?symbol=' + encodeURIComponent(p.symbol) }, [
            tile,
            el('div', { class: 'row-id' }, [
              el('div', { class: 'row-sym', text: p.symbol }),
              el('div', { class: 'row-name', text: p.qty + ' @ ' + (masked ? F().dots(5) : F().money(p.avgCost)) })
            ]),
            el('div', { class: 'row-nums', style: { minWidth: '140px' } }, [
              el('div', { class: 'row-price', text: masked ? F().dots(5) : F().price(p.ltp) }),
              el('div', { class: 'row-chg ' + plDir, text: masked
                ? F().dots(5)
                : (p.pl >= 0 ? '+' : '-') + 'Rs ' + F().num(Math.abs(p.pl), 0) + ' (' + Math.abs(p.plPct).toFixed(1) + '%)' })
            ])
          ]));
        });
        holdingsCard.appendChild(list);
      }

      // --- recent trades ---
      tradesCard.innerHTML = '';
      tradesCard.appendChild(el('div', { class: 'micro', text: 'RECENT TRADES' }));
      var trades = store.state.trades || [];
      if (!trades.length) {
        tradesCard.appendChild(el('div', { class: 'empty', text: 'No fills yet. Your trades will appear here.' }));
      } else {
        var table = el('table', { class: 'table' });
        var thead = el('thead', {}, [el('tr', {}, [
          el('th', { text: 'TIME' }), el('th', { text: 'SYMBOL' }),
          el('th', { text: 'SIDE' }), el('th', { class: 'right', text: 'QTY' }),
          el('th', { class: 'right', text: 'PRICE' })
        ])]);
        var tbody = el('tbody');
        trades.slice(0, 10).forEach(function (t) {
          tbody.appendChild(el('tr', {}, [
            el('td', { text: F().shortTime(t.createdAt) }),
            el('td', { text: t.symbol }),
            el('td', { class: t.side === 'BUY' ? 'up' : 'down', text: t.side }),
            el('td', { class: 'right', text: String(t.qty) }),
            el('td', { class: 'right', text: F().price(t.price) })
          ]));
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        tradesCard.appendChild(table);
      }
    }

    function hexA(hex, a) {
      var h = String(hex || '#22C55E').replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
      if (isNaN(r)) { r = 34; g = 197; b = 94; }
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    skeleton();
    render();

    var unsub = store.subscribe(function (s, keys) {
      if (keys.indexOf('portfolio') >= 0 || keys.indexOf('masked') >= 0 || keys.indexOf('trades') >= 0) render();
    });
    window.B50App.onCleanup(unsub);

    window.B50Api.call('myTrades', { token: (store.getSession() || {}).token }).then(function (res) {
      if (res.ok) store.patch({ trades: res.data.trades || [] });
    });
  }

  window.B50Views = window.B50Views || {};
  window.B50Views.portfolio = view;
})();
