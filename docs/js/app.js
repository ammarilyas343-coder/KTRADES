/* =================================================================
   BOURSE-50 — public/js/app.js
   Bootstrap: read config, mount shell, start the router, start the
   polling loop, pause on visibilitychange, resume with an immediate
   fetch. Also owns the toast system and view cleanup.
   ================================================================= */
(function () {
  'use strict';

  var cfg = window.BOURSE50_CONFIG || {};
  var POLL = cfg.POLL_MS || 5000;
  var PF_POLL = cfg.PORTFOLIO_POLL_MS || 15000;
  var NO_POLL = ['/login', '/change-password', '/profile'];

  var stateTimer = null, pfTimer = null, retryTimer = null;
  var cleanups = [];
  var busyState = false, busyPf = false;
  var path = '/login';

  /* ------------------------------ toasts ------------------------------ */
  function toast(message, kind) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var node = window.B50El('div', { class: 'toast ' + (kind || 'info') }, [
      window.B50El('span', { class: 'bar' }),
      window.B50El('span', { text: String(message) })
    ]);
    host.appendChild(node);
    setTimeout(function () {
      node.style.transition = 'opacity .25s ease';
      node.style.opacity = '0';
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 260);
    }, kind === 'err' ? 5200 : 3400);
    while (host.children.length > 3) host.removeChild(host.firstChild);
  }

  /* --------------------------- view lifecycle ------------------------- */
  function onCleanup(fn) { cleanups.push(fn); }
  function cleanup() {
    cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
    cleanups = [];
  }

  /* ------------------------------ fetching ---------------------------- */
  function token() {
    var s = window.B50Store.getSession();
    return s ? s.token : null;
  }

  function refreshBootstrap() {
    return window.B50Api.call('bootstrap', {}).then(function (res) {
      if (res.ok) window.B50Store.patch({ bootstrap: res.data });
      else window.B50Store.patch({ lastError: res.error });
      return res;
    });
  }

  function refreshState() {
    if (busyState) return Promise.resolve();
    busyState = true;
    return window.B50Api.call('state', { token: token() }).then(function (res) {
      busyState = false;
      if (res.ok) {
        window.B50Store.patch({ market: res.data, online: true, lastError: null });
        if (path === '/board') refreshLeaderboard();
      } else {
        handleFailure(res);
      }
    }).catch(function () { busyState = false; });
  }

  function refreshPortfolio() {
    if (!token() || busyPf) return Promise.resolve();
    busyPf = true;
    return window.B50Api.call('portfolio', { token: token() }).then(function (res) {
      busyPf = false;
      if (res.ok) window.B50Store.patch({ portfolio: res.data, lastError: null });
      else if (res.code === 'INVALID_SESSION') {
        window.B50Store.clearSession();
        window.B50Router.go('/login');
        toast('Your session expired. Sign in again.', 'err');
      } else handleFailure(res);
    }).catch(function () { busyPf = false; });
  }

  function refreshLeaderboard() {
    return window.B50Api.call('leaderboard', { token: token() }).then(function (res) {
      if (res.ok) window.B50Store.patch({ leaderboard: res.data });
    });
  }

  function handleFailure(res) {
    window.B50Store.patch({ online: false, lastError: res.error });
    if (res.code === 'NETWORK') {
      stopTimers();
      var wait = res.retryInMs || window.B50Api.backoffMs();
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(function () {
        retryTimer = null;
        startTimers();
        refreshState();
        refreshBootstrap();
      }, wait);
    } else if (res.code === 'MARKET_CLOSED') {
      refreshBootstrap();
    }
  }

  /* ------------------------------ polling ----------------------------- */
  function pollingAllowed() {
    if (document.visibilityState !== 'visible') return false;
    if (NO_POLL.indexOf(path) >= 0) return false;
    if (!window.B50Store.getSession()) return false;
    return true;
  }

  function startTimers() {
    stopTimers();
    if (!pollingAllowed()) return;
    stateTimer = setInterval(function () {
      if (!pollingAllowed()) return;
      refreshState();
    }, POLL);
    pfTimer = setInterval(function () {
      if (!pollingAllowed()) return;
      refreshPortfolio();
    }, PF_POLL);
  }

  function stopTimers() {
    if (stateTimer) { clearInterval(stateTimer); stateTimer = null; }
    if (pfTimer) { clearInterval(pfTimer); pfTimer = null; }
  }

  function resume() {
    if (!pollingAllowed()) { stopTimers(); return; }
    window.B50Api.resetBackoff();
    refreshState();
    refreshPortfolio();
    startTimers();
  }

  function onRoute(nextPath) {
    var changed = nextPath !== path;
    path = nextPath;
    if (NO_POLL.indexOf(path) >= 0) { stopTimers(); return; }
    if (changed) {
      refreshPortfolio();
      if (path === '/board') refreshLeaderboard();
    }
    if (!stateTimer) startTimers();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') resume();
    else stopTimers();
  });

  /* ------------------------------- boot ------------------------------- */
  function boot() {
    window.B50Theme.init();
    window.B50App = {
      toast: toast,
      onCleanup: onCleanup,
      cleanup: cleanup,
      onRoute: onRoute,
      refreshState: refreshState,
      refreshPortfolio: refreshPortfolio,
      refreshLeaderboard: refreshLeaderboard,
      startTimers: startTimers,
      stopTimers: stopTimers
    };

    window.B50Views = window.B50Views || {};
    var routes = [
      ['/login', window.B50Views.login, true],
      ['/change-password', window.B50Views.changePassword, true],
      ['/home', window.B50Views.home, false],
      ['/portfolio', window.B50Views.portfolio, false],
      ['/trade', window.B50Views.trade, false],
      ['/board', window.B50Views.board, false],
      ['/profile', window.B50Views.profile, false]
    ];
    routes.forEach(function (r) {
      if (r[1]) window.B50Router.register(r[0], r[1], { bare: r[2] });
    });

    window.B50Shell.mount(document.getElementById('app'));
    window.B50Router.start();

    refreshBootstrap().then(function () {
      var session = window.B50Store.getSession();
      if (session && path !== '/change-password') refreshPortfolio();
      refreshState();
      startTimers();
    });

    if (!window.B50Api.isLive()) {
      console.info('[Bourse50] APPS_SCRIPT_URL is empty — running the built-in demo engine.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
