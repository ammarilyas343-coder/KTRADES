/* =================================================================
   BOURSE-50 — public/js/views/trade.js  (#/trade?symbol=XYZ)
   ================================================================= */
(function () {
  'use strict';
  var el = function (t, p, c) { return window.B50El(t, p, c); };
  var F = function () { return window.B50Format; };

  var BASE_SPREAD = 0.002;   // mirrors Config BASE_SPREAD_PCT
  var COMMISSION = 0.001;    // mirrors Config COMMISSION_PCT

  function view(host, query) {
    var store = window.B50Store;
    var session = store.getSession() || {};
    var symbol = (query && query.symbol) || '';
    var side = 'BUY';
    var type = 'MARKET';

    var errorBox = el('div', { class: 'form-error', role: 'alert' });
    var search = el('input', { class: 'input', type: 'search', placeholder: 'Search symbol or company', 'aria-label': 'Search instruments' });
    var picker = el('div', { class: 'picker-list' });
    var pickerCard = el('div', { class: 'card' }, [el('div', { class: 'micro', text: 'INSTRUMENT' }), search, picker]);

    var chosen = el('div', { class: 'row', style: { marginBottom: '12px' } });
    var sideSeg = el('div', { class: 'seg', style: { flex: '1 1 0' } });
    var typeSeg = el('div', { class: 'seg', style: { flex: '1 1 0' } });

    [['BUY', 'Buy'], ['SELL', 'Sell']].forEach(function (s) {
      var b = el('button', { type: 'button', text: s[1], 'aria-pressed': String(side === s[0]) });
      b.addEventListener('click', function () {
        side = s[0];
        Array.prototype.forEach.call(sideSeg.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        update();
      });
      sideSeg.appendChild(b);
    });
    [['MARKET', 'Market'], ['LIMIT', 'Limit']].forEach(function (s) {
      var b = el('button', { type: 'button', text: s[1], 'aria-pressed': String(type === s[0]) });
      b.addEventListener('click', function () {
        type = s[0];
        Array.prototype.forEach.call(typeSeg.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        limitField.hidden = type !== 'LIMIT';
        update();
      });
      typeSeg.appendChild(b);
    });

    var qtyInput = el('input', { class: 'input', type: 'number', min: '1', step: '1', inputmode: 'numeric', placeholder: '0', 'aria-label': 'Quantity' });
    var limitInput = el('input', { class: 'input', type: 'number', min: '0.05', step: '0.05', inputmode: 'decimal', placeholder: '0.00', 'aria-label': 'Limit price' });
    var limitField = el('div', { class: 'field', hidden: true }, [el('label', { for: 'limit-px', text: 'LIMIT PRICE' }), limitInput]);

    var preview = el('div', { class: 'preview' });
    var submit = el('button', { class: 'btn', type: 'submit', text: 'Place order' });
    var closedNote = el('div', { class: 'closed-note', hidden: true });

    var form = el('form', {}, [
      errorBox,
      el('div', { class: 'ticket-side' }, [sideSeg, typeSeg]),
      el('div', { class: 'field' }, [el('label', { for: 'qty', text: 'QUANTITY' }), qtyInput]),
      limitField,
      preview,
      submit,
      closedNote
    ]);
    var ticket = el('div', { class: 'card' }, [form]);

    var ordersCard = el('div', { class: 'card' }, [el('div', { class: 'micro', text: 'OPEN ORDERS' })]);
    var orderBox = el('div');
    ordersCard.appendChild(orderBox);

    host.appendChild(pickerCard);
    host.appendChild(el('div', { class: 'screen-title', text: 'ORDER TICKET' }));
    host.appendChild(ticket);
    host.appendChild(el('div', { class: 'screen-title', text: 'OPEN ORDERS' }));
    host.appendChild(ordersCard);

    /* ---------- helpers ---------- */
    function market() { return store.state.market; }
    function instrumentData(sym) {
      var m = market();
      if (!m) return null;
      return (m.instruments || []).filter(function (i) { return i.symbol === sym; })[0] || null;
    }

    function renderChosen() {
      var ins = instrumentData(symbol);
      chosen.innerHTML = '';
      if (!ins) {
        chosen.appendChild(el('div', { class: 'row-id' }, [
          el('div', { class: 'row-sym', text: symbol || '—' }),
          el('div', { class: 'row-name', text: 'Pick an instrument above.' })
        ]));
        return;
      }
      var tile = el('div', { class: 'tile' }, [el('span', { text: ins.logoText })]);
      tile.style.background = hexA(ins.logoColor, 0.12);
      tile.style.color = ins.logoColor;
      chosen.appendChild(tile);
      chosen.appendChild(el('div', { class: 'row-id' }, [
        el('div', { class: 'row-sym', text: ins.symbol }),
        el('div', { class: 'row-name', text: ins.name })
      ]));
      chosen.appendChild(el('div', { class: 'row-nums' }, [
        el('div', { class: 'row-price', text: F().price(ins.price) }),
        el('div', { class: 'row-chg ' + F().direction(ins.changePct), text: F().pct(ins.changePct) })
      ]));
    }

    function renderPicker() {
      var q = (search.value || '').toLowerCase();
      var m = market();
      picker.innerHTML = '';
      if (!m) {
        for (var s = 0; s < 4; s++) picker.appendChild(el('div', { class: 'sk sk-line', style: { height: '40px', margin: '6px 0' } }));
        return;
      }
      var items = (m.instruments || []).filter(function (i) {
        if (!q) return true;
        return i.symbol.toLowerCase().indexOf(q) >= 0 || i.name.toLowerCase().indexOf(q) >= 0;
      });
      if (!items.length) {
        picker.appendChild(el('div', { class: 'empty', text: 'No instrument matches “' + search.value + '”.' }));
        return;
      }
      items.slice(0, 30).forEach(function (i) {
        var tile = el('div', { class: 'tile' }, [el('span', { text: i.logoText })]);
        tile.style.background = hexA(i.logoColor, 0.12);
        tile.style.color = i.logoColor;
        var b = el('button', {
          class: 'picker-item', type: 'button',
          'aria-selected': String(i.symbol === symbol)
        }, [
          tile,
          el('div', { style: { minWidth: '0' } }, [
            el('div', { class: 'sym', text: i.symbol }),
            el('div', { class: 'nm', text: i.name })
          ]),
          el('span', { class: 'px', text: F().price(i.price) })
        ]);
        b.addEventListener('click', function () {
          symbol = i.symbol;
          history.replaceState(null, '', '#/trade?symbol=' + encodeURIComponent(symbol));
          renderChosen();
          renderPicker();
          update();
        });
        picker.appendChild(b);
      });
    }

    function estimate() {
      var ins = instrumentData(symbol);
      var qty = Math.floor(Number(qtyInput.value));
      if (!ins || !qty || qty < 1) return null;
      var impact = ins.sharesAvailable > 0 ? (qty / ins.sharesAvailable) * 0.001 : 0.001;
      var slip = BASE_SPREAD / 2 + impact;
      var px = type === 'LIMIT' && Number(limitInput.value) > 0 ? Number(limitInput.value) : ins.price;
      var fill = side === 'BUY' ? px * (1 + slip) : px * (1 - slip);
      var value = fill * qty;
      var commission = value * COMMISSION;
      return {
        qty: qty,
        fill: fill,
        marketPrice: ins.price,
        commission: commission,
        value: value,
        total: side === 'BUY' ? value + commission : value - commission
      };
    }

    function update() {
      var est = estimate();
      preview.innerHTML = '';
      if (!est) {
        preview.appendChild(el('div', { class: 'preview-row' }, [
          el('span', { text: 'Enter a quantity to see the estimate.' }),
          el('span', { text: '' })
        ]));
      } else {
        var rows = [
          ['Market price', F().price(est.marketPrice)],
          ['Est. fill price', F().price(est.fill)],
          ['Quantity', String(est.qty)],
          ['Commission', F().money(est.commission)]
        ];
        rows.forEach(function (r) {
          preview.appendChild(el('div', { class: 'preview-row' }, [
            el('span', { text: r[0] }), el('span', { text: r[1] })
          ]));
        });
        preview.appendChild(el('div', { class: 'preview-row total' }, [
          el('span', { text: side === 'BUY' ? 'Total debit' : 'Total credit' }),
          el('span', { text: F().money(est.total) })
        ]));
      }

      var boot = store.state.bootstrap;
      var open = boot ? !!boot.marketOpen : false;
      submit.disabled = !open || !est || !symbol;
      closedNote.hidden = open;
      if (!open) {
        closedNote.textContent = 'Market closed — opens at ' + ((boot && boot.openTimeHint) || '09:30');
      }
      renderOrders();
    }

    function renderOrders() {
      var pf = store.state.portfolio;
      var open = (pf && pf.openOrders) || [];
      orderBox.innerHTML = '';
      if (!open.length) {
        orderBox.appendChild(el('div', { class: 'empty', text: 'No open orders.' }));
        return;
      }
      open.forEach(function (o) {
        var cancel = el('button', { class: 'btn sm danger', type: 'button', text: 'Cancel' });
        cancel.addEventListener('click', function () {
          cancel.disabled = true;
          window.B50Api.call('cancelOrder', { token: session.token, orderId: o.orderId }, { write: true })
            .then(function (res) {
              if (!res.ok) {
                cancel.disabled = false;
                window.B50App.toast(res.error || 'Could not cancel', 'err');
                return;
              }
              window.B50App.toast('Order ' + o.symbol + ' cancelled.', 'ok');
              window.B50App.refreshPortfolio();
            });
        });
        orderBox.appendChild(el('div', { class: 'order-item' }, [
          el('div', { class: 'meta' }, [
            el('div', { text: o.side + ' ' + o.qty + ' ' + o.symbol + (o.type === 'LIMIT' ? ' @ ' + F().price(o.limitPrice) : ' · Market') }),
            el('div', { class: 'sub', text: o.type + ' · tick ' + o.createdTick })
          ]),
          cancel
        ]));
      });
    }

    function hexA(hex, a) {
      var h = String(hex || '#22C55E').replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
      if (isNaN(r)) { r = 34; g = 197; b = 94; }
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    /* ---------- submit ---------- */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      errorBox.classList.remove('show');
      var est = estimate();
      if (!est) {
        errorBox.textContent = 'Enter a valid quantity.';
        errorBox.classList.add('show');
        return;
      }
      if (type === 'LIMIT' && !(Number(limitInput.value) > 0)) {
        errorBox.textContent = 'Enter a limit price.';
        errorBox.classList.add('show');
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Submitting…';
      var clientOrderId = 'c' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      window.B50Api.call('placeOrder', {
        token: session.token,
        symbol: symbol, side: side, type: type, qty: est.qty,
        limitPrice: type === 'LIMIT' ? Number(limitInput.value) : 0,
        clientOrderId: clientOrderId
      }, { write: true }).then(function (res) {
        submit.textContent = 'Place order';
        if (!res.ok) {
          errorBox.textContent = res.error || 'Order rejected.';
          errorBox.classList.add('show');
          window.B50App.toast(res.error || 'Order rejected', 'err');
          update();
          return;
        }
        var d = res.data;
        if (d.status === 'OPEN') {
          window.B50App.toast('Limit order queued: ' + d.side + ' ' + d.qty + ' ' + d.symbol + ' @ ' + F().price(d.limitPrice), 'info');
        } else {
          window.B50App.toast('Filled: ' + d.qty + ' ' + d.symbol + ' @ ' + F().price(d.fillPrice) +
            ' · fee ' + F().money(d.commission), 'ok');
        }
        qtyInput.value = '';
        window.B50App.refreshPortfolio();
        update();
      });
    });

    search.addEventListener('input', renderPicker);
    qtyInput.addEventListener('input', update);
    limitInput.addEventListener('input', update);

    if (symbol) renderChosen();
    renderPicker();
    update();

    var unsub = store.subscribe(function (s, keys) {
      if (keys.indexOf('market') >= 0) { renderPicker(); renderChosen(); }
      if (keys.indexOf('market') >= 0 || keys.indexOf('bootstrap') >= 0 || keys.indexOf('portfolio') >= 0) update();
    });
    window.B50App.onCleanup(unsub);
  }

  window.B50Views = window.B50Views || {};
  window.B50Views.trade = view;
})();
