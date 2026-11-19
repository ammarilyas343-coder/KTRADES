/* =================================================================
   BOURSE-50 — public/js/theme.js
   Dark/light toggle. Reads prefers-color-scheme on first load,
   persists to localStorage 'bourse50.theme', sets data-theme.
   ================================================================= */
(function () {
  'use strict';

  var KEY = 'bourse50.theme';
  var listeners = [];

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function system() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light' : 'dark';
  }
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? 'light dark' : 'dark light');
    listeners.forEach(function (fn) { try { fn(theme); } catch (e) {} });
  }
  function set(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    apply(theme);
  }
  function toggle() { set(current() === 'dark' ? 'light' : 'dark'); }
  function current() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  function init() {
    apply(read() || system());
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var handler = function () { if (!read()) apply(system()); };
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq.addListener) mq.addListener(handler);
    }
  }
  function onChange(fn) { listeners.push(fn); }

  /** 22px leaf/tick glyph used in the wordmark and auth screens. */
  function glyph(size) {
    var s = size || 22;
    return '<svg class="glyph" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" aria-hidden="true">' +
      '<rect x="1" y="1" width="30" height="30" rx="9" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width="1.6"/>' +
      '<path d="M7 21.5l5-7.5 4 4 4-7.5 5 4.5" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  window.B50Theme = { init: init, set: set, toggle: toggle, current: current, onChange: onChange, glyph: glyph };
})();
