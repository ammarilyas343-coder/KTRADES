/* =================================================================
   K TRADE — public/js/views/login.js  (#/login)
   Player ID + password. No self-registration, no Google sign-in.
   ================================================================= */
(function () {
  'use strict';
  var el = function (t, p, c) { return window.B50El(t, p, c); };

  function view(host) {
    var error = el('div', { class: 'form-error', role: 'alert' });
    var idInput = el('input', {
      class: 'input', type: 'text', id: 'player-id', name: 'playerId',
      autocomplete: 'username', autocapitalize: 'characters', spellcheck: 'false',
      placeholder: 'B50-001', 'aria-label': 'Player ID'
    });
    var pwInput = el('input', {
      class: 'input', type: 'password', id: 'player-pw', name: 'password',
      autocomplete: 'current-password', placeholder: '••••••', 'aria-label': 'Password'
    });
    var submit = el('button', { class: 'btn', type: 'submit', text: 'Sign in' });

    var form = el('form', { class: 'auth-form', novalidate: true }, [
      error,
      el('div', { class: 'field' }, [el('label', { for: 'player-id', text: 'PLAYER ID' }), idInput]),
      el('div', { class: 'field' }, [el('label', { for: 'player-pw', text: 'PASSWORD' }), pwInput]),
      submit
    ]);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      error.classList.remove('show');
      var pid = idInput.value.trim();
      var pw = pwInput.value;
      if (!pid || !pw) {
        error.textContent = 'Enter your Player ID and password.';
        error.classList.add('show');
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      window.B50Api.call('login', { playerId: pid, password: pw }, { write: true })
        .then(function (res) {
          submit.disabled = false;
          submit.textContent = 'Sign in';
          if (!res.ok) {
            error.textContent = res.error || 'Sign in failed.';
            error.classList.add('show');
            window.B50App.toast(res.error || 'Sign in failed', 'err');
            return;
          }
          window.B50Store.setSession({
            playerId: res.data.playerId,
            displayName: res.data.displayName,
            teamName: res.data.teamName,
            token: res.data.token,
            mustChangePassword: !!res.data.mustChangePassword
          });
          window.B50App.toast('Welcome, ' + res.data.displayName + '.', 'ok');
          window.B50Router.go(res.data.mustChangePassword ? '/change-password' : '/home');
        })
        .catch(function (e) {
          submit.disabled = false;
          submit.textContent = 'Sign in';
          error.textContent = 'Could not reach the server. Try again.';
          error.classList.add('show');
        });
    });

    var card = el('div', { class: 'auth-card' }, [form]);

    var children = [
      // K TRADE mark — logo image + accent-coloured "Trade"
      el('div', {
        class: 'auth-mark',
        html: '<img src="logo.png" alt="" style="width:28px;height:28px;display:block;border-radius:8px;">K<em>Trade</em>'
      }),
      el('div', { class: 'auth-sub', text: 'Classroom trading competition — sign in with the Player ID on your card.' }),
      card,
      el('div', { class: 'auth-foot', text: 'No self-registration. Your teacher issues your credentials.' })
    ];

    if (!window.B50Api.isLive()) {
      var cfg = window.BOURSE50_CONFIG || {};
      children.push(el('div', { class: 'demo-note', html:
        '<b>Preview mode.</b> No Apps Script URL is set in <b>js/config.js</b>, so the built-in demo engine is serving prices. ' +
        'Sign in as <b>' + (cfg.DEMO_PLAYER || 'B50-001') + '</b> with password <b>' + (cfg.DEMO_PASSWORD || 'DEMO01') + '</b>.'
      }));
    }

    host.appendChild(el('div', { class: 'auth' }, children));
    idInput.focus();
  }

  window.B50Views = window.B50Views || {};
  window.B50Views.login = view;
})();