/* =================================================================
   BOURSE-50 — public/js/views/board.js  (#/board)
   Two tabs. Refreshes on the shared state poll — no extra timer.
   ================================================================= */
(function () {
  'use strict';
  var el = function (t, p, c) { return window.B50El(t, p, c); };
  var F = function () { return window.B50Format; };

  var tab = 'players';

  function view(host) {
    var store = window.B50Store;
    var session = store.getSession() || {};

    var tabs = el('div', { class: 'tabs' });
    [['players', 'Players'], ['teams', 'Teams']].forEach(function (t) {
      var b = el('button', { type: 'button', text: t[1], 'aria-pressed': String(tab === t[0]) });
      b.addEventListener('click', function () {
        tab = t[0];
        Array.prototype.forEach.call(tabs.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        render();
      });
      tabs.appendChild(b);
    });

    var box = el('div');
    host.appendChild(tabs);
    host.appendChild(el('div', { class: 'card' }, [box]));

    function render() {
      box.innerHTML = '';
      var lb = store.state.leaderboard;
      if (!lb) {
        for (var i = 0; i < 6; i++) box.appendChild(el('div', { class: 'sk sk-line', style: { height: '28px', margin: '12px 0' } }));
        return;
      }
      if (tab === 'players') renderPlayers(lb.individual || []);
      else renderTeams(lb.teams || []);
    }

    function renderPlayers(rows) {
      if (!rows.length) {
        box.appendChild(el('div', { class: 'empty', text: 'The leaderboard builds after the first trades.' }));
        return;
      }
      var table = el('table', { class: 'table' });
      table.appendChild(el('thead', {}, [el('tr', {}, [
        el('th', { text: '#' }), el('th', { text: 'PLAYER' }),
        el('th', { class: 'right', text: 'RETURN' }), el('th', { class: 'right', text: 'SCORE' })
      ])]));
      var tbody = el('tbody');
      rows.forEach(function (r) {
        var mine = r.playerId === session.playerId;
        tbody.appendChild(el('tr', { class: mine ? 'mine' : '' }, [
          el('td', { text: r.rank ? String(r.rank) : '—' }),
          el('td', {}, [
            el('div', { text: r.displayName + (mine ? ' (you)' : '') }),
            el('div', { style: { fontSize: '11.5px', color: 'var(--text-dim)' }, text: r.playerId + ' · ' + r.teamName })
          ]),
          el('td', { class: 'right ' + F().direction(r.returnPct), text: F().pct(r.returnPct) }),
          el('td', { class: 'right', text: F().num(r.score, 1) })
        ]));
      });
      table.appendChild(tbody);
      box.appendChild(table);
      box.appendChild(el('div', { class: 'form-hint', style: { marginTop: '10px' },
        text: 'Ranked from 5 fills across 3 different symbols.' }));
    }

    function renderTeams(rows) {
      if (!rows.length) {
        box.appendChild(el('div', { class: 'empty', text: 'Team standings appear once students sign in.' }));
        return;
      }
      var table = el('table', { class: 'table' });
      table.appendChild(el('thead', {}, [el('tr', {}, [
        el('th', { text: '#' }), el('th', { text: 'TEAM' }),
        el('th', { class: 'right', text: 'MEMBERS' }), el('th', { class: 'right', text: 'AVG RETURN' })
      ])]));
      var tbody = el('tbody');
      rows.forEach(function (t) {
        var mine = t.teamName === session.teamName;
        tbody.appendChild(el('tr', { class: mine ? 'mine' : '' }, [
          el('td', { text: String(t.rank) }),
          el('td', {}, [
            el('div', { text: t.teamName }),
            el('div', { style: { fontSize: '11.5px', color: 'var(--text-dim)' }, text: 'Top: ' + t.topPlayer })
          ]),
          el('td', { class: 'right', text: String(t.players) }),
          el('td', { class: 'right ' + F().direction(t.avgReturnPct), text: F().pct(t.avgReturnPct) })
        ]));
      });
      table.appendChild(tbody);
      box.appendChild(table);
    }

    render();
    var unsub = store.subscribe(function (s, keys) {
      if (keys.indexOf('leaderboard') >= 0) render();
    });
    window.B50App.onCleanup(unsub);
    window.B50App.refreshLeaderboard();
  }

  window.B50Views = window.B50Views || {};
  window.B50Views.board = view;
})();
