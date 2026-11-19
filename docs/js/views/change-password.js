/* =================================================================
   BOURSE-50 — public/js/views/change-password.js  (#/change-password)
   Forced on first login for every generated account (>= 8 chars,
   enforced client-side and server-side).
   ================================================================= */
(function () {
  'use strict';
  var el = function (t, p, c) { return window.B50El(t, p, c); };

  function view(host) {
    var session = window.B50Store.getSession();
    var error = el('div', { class: 'form-error', role: 'alert' });

    var oldPw = el('input', { class: 'input', type: 'password', id: 'old-pw', autocomplete: 'current-password', 'aria-label': 'Current password' });
    var newPw = el('input', { class: 'input', type: 'password', id: 'new-pw', autocomplete: 'new-password', 'aria-label': 'New password' });
    var confirm = el('input', { class: 'input', type: 'password', id: 'confirm-pw', autocomplete: 'new-password', 'aria-label': 'Confirm new password' });
    var submit = el('button', { class: 'btn', type: 'submit', text: 'Update password' });
    var hint = el('div', { class: 'form-hint', text: 'Minimum 8 characters.' });

    var form = el('form', {}, [
      error,
      el('div', { class: 'field' }, [el('label', { for: 'old-pw', text: 'CURRENT PASSWORD' }), oldPw]),
      el('div', { class: 'field' }, [el('label', { for: 'new-pw', text: 'NEW PASSWORD' }), newPw]),
      el('div', { class: 'field' }, [el('label', { for: 'confirm-pw', text: 'CONFIRM NEW PASSWORD' }), confirm]),
      submit,
      hint
    ]);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      error.classList.remove('show');
      if (!oldPw.value) { error.textContent = 'Enter your current password.'; error.classList.add('show'); return; }
      if (newPw.value.length < 8) { error.textContent = 'New password must be at least 8 characters.'; error.classList.add('show'); return; }
      if (newPw.value !== confirm.value) { error.textContent = 'The two new passwords do not match.'; error.classList.add('show'); return; }

      submit.disabled = true;
      submit.textContent = 'Updating…';
      window.B50Api.call('changePassword', {
        token: session && session.token,
        oldPassword: oldPw.value,
        newPassword: newPw.value
      }, { write: true }).then(function (res) {
        submit.disabled = false;
        submit.textContent = 'Update password';
        if (!res.ok) {
          error.textContent = res.error || 'Could not update the password.';
          error.classList.add('show');
          return;
        }
        var s = window.B50Store.getSession();
        if (s) { s.mustChangePassword = false; window.B50Store.setSession(s); }
        window.B50App.toast('Password updated — you can start trading.', 'ok');
        window.B50Router.go('/home');
      });
    });

    host.appendChild(el('div', { class: 'auth' }, [
      el('div', { class: 'auth-mark', html: window.B50Theme.glyph(28) + 'Bourse<em>50</em>' }),
      el('div', { class: 'auth-sub', text: 'First sign-in, ' + ((session && session.displayName) || 'student') + '. Set a password only you know.' }),
      el('div', { class: 'auth-card' }, [form])
    ]));
    newPw.focus();
  }

  window.B50Views = window.B50Views || {};
  window.B50Views.changePassword = view;
})();
