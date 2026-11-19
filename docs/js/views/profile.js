/* =================================================================
   BOURSE-50 — public/js/views/profile.js  (#/profile)
   No polling on this screen.
   ================================================================= */
(function () {
  'use strict';
  var el = function (t, p, c) { return window.B50El(t, p, c); };
  var F = function () { return window.B50Format; };

  function view(host) {
    var store = window.B50Store;
    var session = store.getSession() || {};
    var boot = store.state.bootstrap;

    var card = el('div', { class: 'card' }, [el('div', { class: 'micro', text: 'ACCOUNT' })]);
    [
      ['Display name', session.displayName || '—'],
      ['Player ID', session.playerId || '—'],
      ['Team', session.teamName || '—'],
      ['Starting capital', F().money(boot ? boot.startingCapital : 100000, { decimals: 0 })],
      ['Event', (boot && boot.eventName) || 'Bourse50 Demo'],
      ['Status', (boot && boot.status) || 'SETUP']
    ].forEach(function (kv) {
      card.appendChild(el('div', { class: 'kv' }, [
        el('span', { class: 'k', text: kv[0] }),
        el('span', { class: 'v', text: kv[1] })
      ]));
    });

    var logout = el('button', { class: 'btn danger', type: 'button', text: 'Log out' });
    logout.addEventListener('click', function () {
      store.clearSession();
      window.B50App.toast('Signed out.', 'info');
      window.B50Router.go('/login');
    });

    // change password form
    var oldPw = el('input', { class: 'input', type: 'password', autocomplete: 'current-password', 'aria-label': 'Current password' });
    var newPw = el('input', { class: 'input', type: 'password', autocomplete: 'new-password', 'aria-label': 'New password' });
    var confirmPw = el('input', { class: 'input', type: 'password', autocomplete: 'new-password', 'aria-label': 'Confirm new password' });
    var err = el('div', { class: 'form-error', role: 'alert' });
    var submit = el('button', { class: 'btn ghost', type: 'submit', text: 'Change password' });

    var form = el('form', {}, [
      err,
      el('div', { class: 'field' }, [el('label', { text: 'CURRENT PASSWORD' }), oldPw]),
      el('div', { class: 'field' }, [el('label', { text: 'NEW PASSWORD' }), newPw]),
      el('div', { class: 'field' }, [el('label', { text: 'CONFIRM NEW PASSWORD' }), confirmPw]),
      submit,
      el('div', { class: 'form-hint', text: 'Minimum 8 characters.' })
    ]);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      err.classList.remove('show');
      if (newPw.value.length < 8) { err.textContent = 'New password must be at least 8 characters.'; err.classList.add('show'); return; }
      if (newPw.value !== confirmPw.value) { err.textContent = 'The two new passwords do not match.'; err.classList.add('show'); return; }
      submit.disabled = true;
      window.B50Api.call('changePassword', {
        token: session.token, oldPassword: oldPw.value, newPassword: newPw.value
      }, { write: true }).then(function (res) {
        submit.disabled = false;
        if (!res.ok) { err.textContent = res.error || 'Could not change the password.'; err.classList.add('show'); return; }
        oldPw.value = newPw.value = confirmPw.value = '';
        window.B50App.toast('Password changed.', 'ok');
      });
    });

    var pwCard = el('div', { class: 'card' }, [
      el('div', { class: 'micro', text: 'CHANGE PASSWORD' }), form
    ]);

    var actions = el('div', { class: 'card' }, [logout]);

    host.appendChild(card);
    host.appendChild(el('div', { class: 'screen-title', text: 'SECURITY' }));
    host.appendChild(pwCard);
    host.appendChild(el('div', { class: 'screen-title', text: 'SESSION' }));
    host.appendChild(actions);

    if (window.B50Api.isLive()) {
      host.appendChild(el('div', { class: 'demo-note', text:
        'Connected to the Apps Script web app. Every private request re-validates your session token before it touches a sheet.' }));
    } else {
      host.appendChild(el('div', { class: 'demo-note', html:
        '<b>Preview mode.</b> Data comes from the in-browser demo engine. Add the /exec URL to <b>js/config.js</b> to switch to the Google Sheet backend — no other file changes.' }));
    }
  }

  window.B50Views = window.B50Views || {};
  window.B50Views.profile = view;
})();
