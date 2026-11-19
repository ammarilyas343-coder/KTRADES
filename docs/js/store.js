/* =================================================================
   BOURSE-50 — public/js/store.js
   Tiny observable store. Session + masking flag in localStorage.
   ================================================================= */
(function () {
  'use strict';

  var SESSION_KEY = 'bourse50.session';
  var MASK_KEY = 'bourse50.masked';

  var state = {
    session: readJSON(SESSION_KEY),
    masked: readMask(),
    bootstrap: null,
    market: null,
    portfolio: null,
    leaderboard: null,
    trades: [],
    lastError: null,
    online: true
  };

  var subs = [];

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (e) { return null; }
  }
  function readMask() {
    var v = localStorage.getItem(MASK_KEY);
    return v === null ? true : v === '1';
  }

  function subscribe(fn) {
    subs.push(fn);
    return function () {
      var i = subs.indexOf(fn);
      if (i >= 0) subs.splice(i, 1);
    };
  }
  function emit(keys) {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](state, keys || Object.keys(state)); } catch (e) { console.error(e); }
    }
  }
  function set(next) {
    Object.assign(state, next);
    emit(Object.keys(next));
  }
  function patch(partial, keys) {
    Object.assign(state, partial);
    emit(keys || Object.keys(partial));
  }

  function setSession(session) {
    state.session = session;
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    emit(['session']);
  }
  function getSession() { return state.session; }
  function clearSession() { setSession(null); }

  function setMasked(on) {
    state.masked = !!on;
    try { localStorage.setItem(MASK_KEY, state.masked ? '1' : '0'); } catch (e) {}
    emit(['masked']);
  }

  window.B50Store = {
    state: state,
    subscribe: subscribe,
    set: set,
    patch: patch,
    setSession: setSession,
    getSession: getSession,
    clearSession: clearSession,
    setMasked: setMasked,
    toggleMasked: function () { setMasked(!state.masked); }
  };
})();
