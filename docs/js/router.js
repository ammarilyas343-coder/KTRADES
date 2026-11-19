/* =================================================================
   BOURSE-50 — public/js/router.js
   Hash router. #/login #/change-password #/home #/portfolio #/trade
   #/board #/profile  — with auth guard.
   ================================================================= */
(function () {
  'use strict';

  var routes = [];
  var current = null;
  var started = false;

  function register(path, view, opts) {
    routes.push({ path: path, view: view, bare: !!(opts && opts.bare) });
  }

  function parse() {
    var raw = location.hash.replace(/^#/, '') || '/login';
    var qi = raw.indexOf('?');
    var path = qi >= 0 ? raw.substring(0, qi) : raw;
    var query = {};
    if (qi >= 0) {
      raw.substring(qi + 1).split('&').forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split('=');
        query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
    }
    if (path.charAt(0) !== '/') path = '/' + path;
    return { path: path, query: query };
  }

  function go(target) {
    if (location.hash === '#' + target) render();
    else location.hash = target;
  }

  function match(path) {
    for (var i = 0; i < routes.length; i++) if (routes[i].path === path) return routes[i];
    return null;
  }

  function render() {
    var loc = parse();
    var session = window.B50Store.getSession();
    var route = match(loc.path);

    // --- auth guard -------------------------------------------------
    if (!session && loc.path !== '/login') return go('/login');
    if (session && loc.path === '/login') return go(session.mustChangePassword ? '/change-password' : '/home');
    if (session && session.mustChangePassword && loc.path !== '/change-password') return go('/change-password');
    if (!session && loc.path === '/change-password') return go('/login');
    if (!route) return go(session ? '/home' : '/login');

    current = { route: route, loc: loc };
    if (window.B50Shell) window.B50Shell.show(route.bare);
    var host = window.B50Shell.hostFor(route.bare);
    host.innerHTML = '';
    try {
      route.view(host, loc.query, route);
    } catch (err) {
      console.error(err);
      host.innerHTML = '';
      var box = document.createElement('div');
      box.className = 'err';
      box.textContent = 'Something went wrong rendering this screen.';
      var btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Retry';
      btn.addEventListener('click', render);
      box.appendChild(btn);
      host.appendChild(box);
    }
    if (window.B50App && window.B50App.onRoute) window.B50App.onRoute(loc.path);
    window.scrollTo(0, 0);
  }

  function start() {
    if (started) return;
    started = true;
    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = '#/login';
    render();
  }

  window.B50Router = {
    register: register,
    start: start,
    render: render,
    go: go,
    current: function () { return current; }
  };
})();
