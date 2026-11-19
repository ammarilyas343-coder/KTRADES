/* =================================================================
   BOURSE-50 — public/js/api.js
   Fetch wrapper for the Apps Script /exec endpoint.

     READS  : GET  ?action=&payload=&_=  (cache-busted, redirect:follow)
     WRITES : POST text/plain;charset=utf-8  (CORS-simple: no preflight)
     FALLBACK: a POST network error retries ONCE as a GET.

   Every response is an envelope: {ok:true,data} | {ok:false,error,code}.
   If APPS_SCRIPT_URL is empty we fall back to the in-browser demo engine
   so the prototype can be reviewed before the web app is deployed.
   ================================================================= */
(function () {
  'use strict';

  var cfg = window.BOURSE50_CONFIG || {};
  var BACKOFF = cfg.BACKOFF_MS || [5000, 10000, 20000, 40000, 60000];
  var backoffStep = 0;

  function live() { return String(cfg.APPS_SCRIPT_URL || '').indexOf('http') === 0; }
  function isWrite(action) {
    return ['login', 'changePassword', 'placeOrder', 'cancelOrder'].indexOf(action) >= 0;
  }

  function http(action, payload, write) {
    var url = String(cfg.APPS_SCRIPT_URL);
    if (write) {
      return fetch(url, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action: action }, payload || {}))
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).catch(function (err) {
        // GET FALLBACK — some networks drop the body on a cross-origin 302.
        console.warn('[bourse50] POST failed, retrying once as GET:', err && err.message);
        return getOnce(action, payload);
      });
    }
    return getOnce(action, payload);
  }

  function getOnce(action, payload) {
    var url = String(cfg.APPS_SCRIPT_URL) + '?action=' + encodeURIComponent(action) +
      '&payload=' + encodeURIComponent(JSON.stringify(payload || {})) +
      '&_=' + Date.now();
    return fetch(url, { method: 'GET', redirect: 'follow' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  function parse(text) {
    var envelope;
    try { envelope = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'Server sent a malformed response', code: 'BAD_ENVELOPE' }; }
    if (!envelope || typeof envelope.ok !== 'boolean') {
      return { ok: false, error: 'Server sent a malformed response', code: 'BAD_ENVELOPE' };
    }
    return envelope;
  }

  /**
   * @param {string} action  server action name
   * @param {object} payload request payload
   * @param {object} [opts]  { write:bool, retries:int }
   * @returns {Promise<{ok:boolean,data?:object,error?:string,code?:string}>}
   */
  function call(action, payload, opts) {
    opts = opts || {};
    var write = opts.write === undefined ? isWrite(action) : opts.write;

    if (!live()) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(window.B50Demo.dispatch(action, payload || {})); }, 90);
      });
    }

    var attempt = 0;
    var maxTries = (opts.retries === undefined ? 2 : opts.retries);

    function tryOnce() {
      return http(action, payload, write).then(function (text) {
        var env = parse(text);
        if (env.ok) { backoffStep = 0; }
        return env;
      });
    }

    function chain(p) {
      return p.catch(function (err) {
        attempt++;
        if (attempt < maxTries) {
          return new Promise(function (r) { setTimeout(r, 400 * attempt); }).then(chain).then(function (x) { return x; });
        }
        backoffStep = Math.min(backoffStep + 1, BACKOFF.length - 1);
        return {
          ok: false,
          error: 'Network unreachable — retrying in ' + Math.round(BACKOFF[backoffStep] / 1000) + 's',
          code: 'NETWORK',
          retryInMs: BACKOFF[backoffStep]
        };
      });
    }

    return chain(tryOnce());
  }

  window.B50Api = {
    call: call,
    isLive: live,
    url: function () { return cfg.APPS_SCRIPT_URL; },
    backoffMs: function () { return BACKOFF[backoffStep]; },
    resetBackoff: function () { backoffStep = 0; }
  };
})();
