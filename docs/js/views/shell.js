/* =================================================================
   BOURSE-50 — public/js/views/shell.js
   Sticky header (wordmark · status pill · theme · bell), the index
   tape (SIM100 + sector indices) and the 5-tab bottom nav.
   Every authenticated screen renders inside this shell.
   ================================================================= */
(function () {
  'use strict';

  var el = function (t, p, c) { return window.B50El(t, p, c); };

  var ICONS = {
    home: '<path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
    pie: '<path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5z"/><path d="M14 3.5a7 7 0 0 1 6.5 6.5H14z"/>',
    trade: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5.5H4.5V7A3.5 3.5 0 0 0 7.6 10.5M17 5.5h2.5V7A3.5 3.5 0 0 1 16.4 10.5"/><path d="M12 14v3m-3.5 3h7l-.7-3h-5.6z"/>',
    person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>',
    bell: '<path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    moon: '<path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
    eye: '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.6"/>',
    eyeOff: '<path d="M4 4l16 16"/><path d="M9.5 9.6A2.6 2.6 0 0 0 12 14.6M6.2 6.7C3.9 8.3 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.4 4.2-1M17.7 15A12 12 0 0 0 21.5 12S18 6 12 6c-.7 0-1.3.1-1.9.2"/>',
    bookmark: '<path d="M6.5 4.5h11v15l-5.5-4-5.5 4z"/>',
    flame: '<path d="M12 3.5s5 4 5 8.5a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5s.5 1.5 2 1.5c0-3 2-6.5 2-6.5z"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    sort: '<path d="M7 4.5v15M7 19.5 4 16.5M7 19.5l3-3M17 19.5v-15M17 4.5l-3 3M17 4.5l3 3"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 20 20"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5"/>',
    wallet: '<rect x="3.5" y="6.5" width="17" height="12" rx="2.5"/><path d="M16 12.5h2.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8.2v.2"/>'
  };

  function icon(name, size) {
    var s = size || 22;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  var TABS = [
    { path: '/home', label: 'Home', icon: 'home' },
    { path: '/portfolio', label: 'Portfolio', icon: 'pie' },
    { path: '/trade', label: 'Trade', icon: 'trade' },
    { path: '/board', label: 'Board', icon: 'trophy' },
    { path: '/profile', label: 'Profile', icon: 'person' }
  ];

  var root = null, shellEl = null, bareEl = null, screenEl = null, tapeEl = null, pillEl = null, navEl = null, errorEl = null;
  var lastIndices = null;

  function mount(appRoot) {
    if (shellEl) return;
    shellEl = el('div', { class: 'shell' });

    var hdr = el('header', { class: 'hdr' });
    hdr.appendChild(el('div', { class: 'wordmark', html: '<img class="glyph" src="logo.png" alt="" width="22" height="22">K<em>Trade</em>' }));
    hdr.appendChild(el('div', { class: 'hdr-spacer' }));
    pillEl = el('span', { class: 'status-pill', dataset: { status: 'SETUP' } },
      [el('span', { class: 'dot' }), el('span', { text: 'SETUP' })]);
    hdr.appendChild(pillEl);

    var themeBtn = el('button', {
      class: 'icon-btn', type: 'button', 'aria-label': 'Toggle colour theme',
      onclick: function () { window.B50Theme.toggle(); }
    });
    themeBtn.innerHTML = icon(window.B50Theme.current() === 'dark' ? 'sun' : 'moon', 20);
    window.B50Theme.onChange(function (theme) {
      themeBtn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon', 20);
    });
    hdr.appendChild(themeBtn);

    var bell = el('button', { class: 'icon-btn has-dot', type: 'button', 'aria-label': 'Notifications' });
    bell.innerHTML = icon('bell', 20);
    bell.addEventListener('click', function () {
      var b = window.B50Store.state.bootstrap;
      window.B50App.toast(b && b.status === 'LIVE'
        ? 'Market is LIVE — prices move every ' + Math.round((b.tickIntervalMs || 5000) / 1000) + 's.'
        : 'The event is not LIVE yet. An operator must set Config STATUS to LIVE.', 'info');
    });
    hdr.appendChild(bell);
    shellEl.appendChild(hdr);

    tapeEl = el('div', { class: 'tape', 'aria-label': 'Market index tape' });
    shellEl.appendChild(tapeEl);

    // inline error state with Retry — shown whenever a fetch fails
    var retryBtn = el('button', { class: 'btn sm', type: 'button', text: 'Retry' });
    retryBtn.addEventListener('click', function () {
      retryBtn.disabled = true;
      retryBtn.textContent = 'Retrying…';
      window.B50App.refreshBootstrap().then(function () {
        window.B50App.refreshState();
        window.B50App.refreshPortfolio();
        window.B50App.startTimers();
        setTimeout(function () { retryBtn.disabled = false; retryBtn.textContent = 'Retry'; }, 1200);
      });
    });
    errorEl = el('div', { class: 'net-error', role: 'alert', hidden: true }, [
      el('span', { class: 'net-error-text', text: 'Connection problem.' }),
      retryBtn
    ]);
    shellEl.appendChild(errorEl);

    screenEl = el('main', { class: 'screen', id: 'screen' });
    shellEl.appendChild(screenEl);

    navEl = el('nav', { class: 'tabbar', 'aria-label': 'Primary' });
    var inner = el('div', { class: 'tabbar-inner' });
    TABS.forEach(function (t) {
      var a = el('a', { class: 'tab', href: '#' + t.path, dataset: { path: t.path } });
      a.innerHTML = icon(t.icon, 22) + '<span></span>';
      a.querySelector('span').textContent = t.label;
      inner.appendChild(a);
    });
    navEl.appendChild(inner);
    shellEl.appendChild(navEl);

    bareEl = el('div', { class: 'shell-bare', id: 'bare', hidden: true });

    root = appRoot;
    root.innerHTML = '';
    root.appendChild(shellEl);
    root.appendChild(bareEl);
    renderTape(lastIndices);
    updateNav(location.hash);
    window.addEventListener('hashchange', function () { updateNav(location.hash); });
    window.B50Store.subscribe(function (s, keys) {
      if (keys.indexOf('market') >= 0) renderTape(s.market && s.market.indices);
      if (keys.indexOf('bootstrap') >= 0) {
        renderStatus(s.bootstrap);
        if (keys.indexOf('market') < 0) renderTape(s.market && s.market.indices);
      }
      if (keys.indexOf('online') >= 0 || keys.indexOf('lastError') >= 0) {
        var broken = s.online === false;
        errorEl.hidden = !broken;
        if (broken) errorEl.querySelector('.net-error-text').textContent =
          s.lastError || 'Could not reach the server.';
      }
    });
    renderStatus(window.B50Store.state.bootstrap);
  }

  function renderStatus(bootstrap) {
    if (!pillEl) return;
    var status = (bootstrap && bootstrap.status) || 'SETUP';
    pillEl.setAttribute('data-status', status);
    pillEl.lastChild.textContent = status;
  }

  function renderTape(indices) {
    if (!tapeEl) return;
    if (!indices || !indices.length) {
      if (lastIndices) indices = lastIndices;
      else {
        tapeEl.innerHTML = '';
        ['SIM100', 'BANKS', 'TECH', 'ENERGY', 'PHARMA'].forEach(function (n) {
          tapeEl.appendChild(el('div', { class: 'tape-chip' }, [
            el('span', { class: 'tape-name', text: n }),
            el('span', { class: 'tape-val', text: '—' }),
            el('span', { class: 'change-pill flat', text: '0.00%' })
          ]));
        });
        return;
      }
    }
    lastIndices = indices;
    tapeEl.innerHTML = '';
    indices.forEach(function (ix) {
      var dir = window.B50Format.direction(ix.changePct);
      var chip = el('div', { class: 'tape-chip' }, [
        el('span', { class: 'tape-name', text: ix.name }),
        el('span', { class: 'tape-val', text: window.B50Format.num(ix.value, 2) }),
        el('span', { class: 'change-pill ' + dir, text: window.B50Format.pct(ix.changePct) })
      ]);
      tapeEl.appendChild(chip);
    });
  }

  function updateNav(hash) {
    if (!navEl) return;
    var path = (hash || '').replace(/^#/, '').split('?')[0];
    Array.prototype.forEach.call(navEl.querySelectorAll('.tab'), function (a) {
      if (a.dataset.path === path) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function show(bare) {
    if (window.B50App && window.B50App.cleanup) window.B50App.cleanup();
    if (bare) {
      shellEl.hidden = true;
      bareEl.hidden = false;
    } else {
      shellEl.hidden = false;
      bareEl.hidden = true;
      updateNav(location.hash);
      renderStatus(window.B50Store.state.bootstrap);
      renderTape(window.B50Store.state.market && window.B50Store.state.market.indices);
    }
  }

  function hostFor(bare) {
    if (!shellEl) mount(document.getElementById('app'));
    return bare ? bareEl : screenEl;
  }

  window.B50Shell = { mount: mount, show: show, hostFor: hostFor, icon: icon, renderTape: renderTape };
})();
