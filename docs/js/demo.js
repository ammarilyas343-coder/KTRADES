/* =================================================================
   BOURSE-50 — public/js/demo.js
   In-browser demo engine. ONLY used when config.js leaves
   APPS_SCRIPT_URL empty, so a stakeholder review works before the
   Apps Script web app is deployed.

   It mirrors the server contract exactly: the same envelope, the same
   price formula (mulberry32 + Box-Muller + sector/market factor), the
   same slippage and commission maths, the same market-hours rule.
   Delete nothing — set APPS_SCRIPT_URL and this file is never called.
   ================================================================= */
(function () {
  'use strict';

  var CFG = window.BOURSE50_CONFIG || {};
  var KEY = 'bourse50.demo';
  var TICK_MS = 5000;
  var SPARK = 30;
  var BASE_SPREAD = 0.002;
  var COMMISSION = 0.001;
  var STARTING = 100000;
  var SCHEDULE = { monThu: [['09:30', '15:30']], friday: [['09:00', '12:30'], ['14:30', '16:30']] };

  /* [symbol, company, sector, logoText, logoColor, price, volatility, drift, shares] */
  var INSTRUMENTS = [
    ['TXLM', 'Techlima Systems', 'Technology', 'TX', '#3B82F6', 1284.50, 0.0026, 420, 250000],
    ['NEXA', 'Nexa Networks', 'Technology', 'NX', '#6366F1', 742.10, 0.0031, 380, 300000],
    ['ORBK', 'Orbik Cloud', 'Technology', 'OB', '#0EA5E9', 2156.75, 0.0029, 510, 180000],
    ['QNTM', 'Quantech Labs', 'Technology', 'QT', '#8B5CF6', 4890.00, 0.0035, 640, 90000],
    ['VLTR', 'Voltara Digital', 'Technology', 'VL', '#22D3EE', 356.20, 0.0038, 250, 420000],
    ['SYNX', 'Synapse X', 'Technology', 'SX', '#A78BFA', 1027.40, 0.0033, 300, 260000],
    ['CDRN', 'Cadron Softworks', 'Technology', 'CD', '#38BDF8', 612.85, 0.0028, 210, 340000],
    ['MEBK', 'Meadow Bank', 'Banks', 'MB', '#16A34A', 1876.30, 0.0019, 260, 300000],
    ['HBLX', 'Harborland Bank', 'Banks', 'HB', '#15803D', 945.60, 0.0021, 240, 360000],
    ['CRST', 'Crest Financial', 'Banks', 'CF', '#059669', 3210.90, 0.0018, 330, 150000],
    ['ZNTH', 'Zenith Bank', 'Banks', 'ZB', '#4ADE80', 612.45, 0.0020, 190, 400000],
    ['PVOT', 'Pivot Bank', 'Banks', 'PB', '#10B981', 1438.75, 0.0022, 280, 240000],
    ['LMEN', 'Lumen Credit', 'Banks', 'LC', '#F59E0B', 284.90, 0.0024, 150, 500000],
    ['ATLS', 'Atlas Trust', 'Banks', 'AT', '#FACC15', 2740.00, 0.0017, 350, 130000],
    ['SOLRX', 'Solrex Power', 'Energy', 'SP', '#F97316', 528.35, 0.0034, 180, 380000],
    ['PTLN', 'Petrolin Refining', 'Energy', 'PR', '#EA580C', 1692.20, 0.0027, 300, 220000],
    ['HYDR', 'Hydracore Energy', 'Energy', 'HE', '#FB923C', 874.60, 0.0030, 220, 310000],
    ['WNDX', 'Windex Renewables', 'Energy', 'WR', '#84CC16', 412.75, 0.0036, 260, 450000],
    ['GASO', 'Gasor Pipeline', 'Energy', 'GP', '#FBBF24', 1245.05, 0.0023, 200, 270000],
    ['THRM', 'Thermon Heavy Fuel', 'Energy', 'TH', '#DC2626', 368.40, 0.0032, 140, 470000],
    ['IRNW', 'Ironworks Heavy', 'Industrials', 'IH', '#64748B', 1563.80, 0.0024, 270, 240000],
    ['CRAN', 'Cranedyne', 'Industrials', 'CR', '#475569', 731.25, 0.0027, 210, 330000],
    ['MOTO', 'Motovance Auto', 'Industrials', 'MA', '#EF4444', 2984.60, 0.0029, 400, 160000],
    ['RAIL', 'Railcore Freight', 'Industrials', 'RF', '#0EA5E9', 486.90, 0.0022, 170, 430000],
    ['FRGE', 'Forge Industries', 'Industrials', 'FI', '#F59E0B', 1107.35, 0.0025, 230, 290000],
    ['AERO', 'Aerodyne Systems', 'Industrials', 'AS', '#6366F1', 4402.00, 0.0033, 560, 80000],
    ['PORT', 'Portguard Logistics', 'Industrials', 'PL', '#14B8A6', 659.15, 0.0026, 190, 350000],
    ['FRSH', 'Freshmart Retail', 'Consumer', 'FM', '#22C55E', 342.70, 0.0021, 160, 480000],
    ['BREW', 'Brewline Foods', 'Consumer', 'BF', '#A16207', 812.45, 0.0023, 200, 320000],
    ['SNAX', 'Snackwell Co.', 'Consumer', 'SC', '#FACC15', 128.60, 0.0028, 110, 600000],
    ['LOOM', 'Loomcraft Apparel', 'Consumer', 'LA', '#8B5CF6', 574.30, 0.0026, 175, 370000],
    ['HMST', 'Homestead Retail', 'Consumer', 'HR', '#0891B2', 1945.10, 0.0020, 310, 200000],
    ['TOYB', 'Toybox Holdings', 'Consumer', 'TH', '#EC4899', 267.85, 0.0030, 130, 520000],
    ['VITA', 'Vitality Drinks', 'Consumer', 'VD', '#16A34A', 693.55, 0.0025, 240, 340000],
    ['CURA', 'Curapharm', 'Pharma', 'CP', '#0EA5E9', 2318.40, 0.0027, 380, 170000],
    ['MEDX', 'Medixa Labs', 'Pharma', 'ML', '#0284C7', 1156.70, 0.0029, 290, 280000],
    ['BIOS', 'Biogenix Research', 'Pharma', 'BR', '#7C3AED', 3670.25, 0.0034, 520, 110000],
    ['IMMU', 'Immuna Health', 'Pharma', 'IH', '#2563EB', 428.95, 0.0031, 180, 460000],
    ['DENT', 'Dentaris Group', 'Pharma', 'DG', '#14B8A6', 769.30, 0.0024, 220, 300000],
    ['NVCR', 'Novacure Bio', 'Pharma', 'NB', '#DB2777', 5140.00, 0.0037, 690, 70000],
    ['STLN', 'Steelon Metals', 'Materials', 'SM', '#78716C', 906.55, 0.0025, 230, 310000],
    ['CEMT', 'Cementra', 'Materials', 'CT', '#A8A29E', 384.20, 0.0022, 140, 490000],
    ['COPR', 'Copperidge Mining', 'Materials', 'CM', '#EA580C', 1472.85, 0.0028, 300, 230000],
    ['AURM', 'Aurum Metals', 'Materials', 'AM', '#EAB308', 6218.40, 0.0032, 720, 60000],
    ['CHMX', 'Chemora', 'Materials', 'CH', '#65A30D', 547.65, 0.0026, 190, 400000],
    ['PPNT', 'Papernet Mills', 'Materials', 'PM', '#94A3B8', 219.40, 0.0023, 120, 560000],
    ['SGNL', 'Signl Communications', 'Telecom', 'SC', '#6366F1', 1084.25, 0.0024, 270, 290000],
    ['WAVX', 'Wavex Mobile', 'Telecom', 'WM', '#3B82F6', 631.90, 0.0026, 210, 360000],
    ['FIBR', 'Fibrelink', 'Telecom', 'FL', '#06B6D4', 442.35, 0.0027, 175, 440000],
    ['ORBT', 'Orbitel Group', 'Telecom', 'OG', '#8B5CF6', 2876.10, 0.0029, 430, 140000]
  ];

  var world = null;

  function now() { return Date.now(); }
  function r2(x) { return Math.round(Number(x) * 100) / 100; }
  function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

  function hashInt(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    var u = 1 - rng(), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function def(obj, sym) {
    var i = INSTRUMENTS.filter(function (x) { return x[0] === sym; })[0];
    return i || obj;
  }

  function seed() {
    var price = {}, prev = {}, avail = {}, spark = {};
    INSTRUMENTS.forEach(function (x) {
      price[x[0]] = x[5]; prev[x[0]] = x[5]; avail[x[0]] = x[8];
      spark[x[0]] = [];
      for (var i = 0; i < SPARK; i++) spark[x[0]].push(x[5]);
    });
    var players = [];
    var teams = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Hotel', 'India'];
    for (var n = 1; n <= 20; n++) {
      var id = 'B50-' + ('00' + n).slice(-3);
      players.push({
        playerId: id,
        displayName: 'Student ' + ('0' + n).slice(-2),
        teamName: teams[(n - 1) % 8] + ' ' + (Math.floor((n - 1) / 8) + 1),
        pw: 'DEMO' + ('0' + n).slice(-2),
        mustChange: true,
        cash: STARTING,
        starting: STARTING,
        history: []
      });
    }
    return {
      tick: 0, lastTickAt: 0, price: price, prev: prev, avail: avail, spark: spark,
      players: players, positions: [], orders: [], trades: [], seq: 1
    };
  }

  function load() {
    if (world) return world;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        world = JSON.parse(raw);
        if (world && world.players && world.price) return world;
      }
    } catch (e) {}
    world = seed();
    save();
    return world;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(world)); } catch (e) {}
  }
  function reset() {
    world = seed();
    save();
    return world;
  }

  function toMin(s) {
    var p = String(s).split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function scheduleWindows(date) {
    var dow = date.getDay();
    if (dow === 5) return SCHEDULE.friday;
    if (dow >= 1 && dow <= 4) return SCHEDULE.monThu;
    return SCHEDULE.weekend || [];
  }
  function inWindow(date) {
    var w = scheduleWindows(date), mins = date.getHours() * 60 + date.getMinutes();
    for (var i = 0; i < w.length; i++) if (mins >= toMin(w[i][0]) && mins < toMin(w[i][1])) return true;
    return false;
  }
  function marketOpen() {
    var mode = CFG.DEMO_MARKET_OPEN || 'always';
    if (mode === 'always') return true;
    return inWindow(new Date());
  }
  function openHint() {
    var d = new Date(), w = scheduleWindows(d), mins = d.getHours() * 60 + d.getMinutes();
    for (var i = 0; i < w.length; i++) if (toMin(w[i][0]) > mins) return w[i][0];
    return w.length ? w[0][0] : '09:30';
  }

  function advance() {
    var w = load();
    if (!marketOpen()) return w;
    var t = now();
    if (w.lastTickAt && t - w.lastTickAt < TICK_MS) return w;
    var steps = Math.min(Math.floor((t - (w.lastTickAt || t - TICK_MS)) / TICK_MS), 6);
    if (steps < 1) steps = 1;
    for (var s = 0; s < steps; s++) {
      w.tick++;
      var marketFx = gauss(mulberry32(hashInt('MARKET|' + w.tick)));
      var sectorFx = {};
      INSTRUMENTS.forEach(function (x) {
        var sym = x[0], sector = x[2], init = x[5];
        if (!(sector in sectorFx)) sectorFx[sector] = gauss(mulberry32(hashInt('SECTOR:' + sector + '|' + w.tick)));
        var rng = mulberry32(hashInt('demo|' + w.tick + '|' + sym));
        var shock = 0.72 * sectorFx[sector] + 0.28 * marketFx + 0.15 * gauss(rng);
        var ret = (x[7] / 1e6) + x[6] * shock;
        var p = w.prev[sym] * Math.exp(ret);
        p = p + 0.02 * (init - p);
        p = r2(clamp(p, 0.05 * init, 20 * init));
        w.price[sym] = p; w.prev[sym] = p;
        w.spark[sym].push(p);
        while (w.spark[sym].length > SPARK) w.spark[sym].shift();
      });
    }
    w.lastTickAt = t;
    evaluateOrders(w);
    save();
    return w;
  }

  function playerByToken(token) {
    if (!token) return null;
    var parts = String(token).split('.');
    if (parts[0] !== 'demo') return null;
    var w = load();
    if (Number(parts[2]) < now()) return null;
    var p = w.players.filter(function (x) { return x.playerId === parts[1]; })[0];
    return p || null;
  }

  function positionsOf(pid) {
    return load().positions.filter(function (p) { return p.playerId === pid; });
  }
  function instrument(sym) {
    return INSTRUMENTS.filter(function (x) { return x[0] === sym; })[0];
  }

  function netWorth(p) {
    var w = load(), inv = 0;
    positionsOf(p.playerId).forEach(function (pos) {
      if (pos.qty > 0) inv += pos.qty * (w.price[pos.symbol] || 0);
    });
    return p.cash + inv;
  }

  function execPrice(side, price, qty, avail) {
    var base = BASE_SPREAD / 2;
    var impact = avail > 0 ? (qty / avail) * 0.001 : 0.001;
    var slip = base + impact;
    return {
      price: r2(side === 'BUY' ? price * (1 + slip) : price * (1 - slip)),
      slippage: r2(price * slip)
    };
  }

  function fill(order, marketPrice) {
    var w = load();
    var ins = instrument(order.symbol);
    var avail = w.avail[order.symbol] || 0;
    var ex = execPrice(order.side, marketPrice, order.qty, avail);
    var value = ex.price * order.qty;
    var commission = r2(value * COMMISSION);
    var p = w.players.filter(function (x) { return x.playerId === order.playerId; })[0];
    if (!p) return null;

    var pos = w.positions.filter(function (x) { return x.playerId === order.playerId && x.symbol === order.symbol; })[0];
    if (order.side === 'BUY') {
      var total = value + commission;
      if (p.cash < total) throw new Error('INSUFFICIENT_CASH');
      p.cash = r2(p.cash - total);
      if (pos) { pos.qty += order.qty; pos.cost = r2(pos.cost + total); }
      else w.positions.push({ playerId: order.playerId, symbol: order.symbol, qty: order.qty, cost: total, updated: now() });
      w.avail[order.symbol] = avail - order.qty;
    } else {
      if (!pos || pos.qty < order.qty) throw new Error('INSUFFICIENT_SHARES');
      var used = order.qty >= pos.qty ? pos.cost : r2(pos.cost * (order.qty / pos.qty));
      pos.cost = r2(pos.cost - used);
      pos.qty -= order.qty;
      p.cash = r2(p.cash + value - commission);
      w.avail[order.symbol] = avail + order.qty;
    }

    var stamp = now();
    var tradeId = 'T' + stamp + '-' + (w.seq++);
    w.trades.push({
      tradeId: tradeId, orderId: order.orderId, playerId: order.playerId,
      teamName: p.teamName, symbol: order.symbol, side: order.side, qty: order.qty,
      price: ex.price, commission: commission, slippage: ex.slippage,
      tick: w.tick, createdAt: stamp
    });
    p.history.push(netWorth(p));
    if (p.history.length > 240) p.history.shift();
    save();
    return { orderId: order.orderId, tradeId: tradeId, symbol: order.symbol, side: order.side,
      qty: order.qty, fillPrice: ex.price, commission: commission, slippage: ex.slippage, status: 'FILLED' };
  }

  function evaluateOrders(w) {
    w.orders.slice().forEach(function (o) {
      if (o.status !== 'OPEN') return;
      var p = w.price[o.symbol];
      var crossed = o.side === 'BUY' ? (p <= o.limitPrice) : (p >= o.limitPrice);
      if (!crossed) return;
      try {
        var res = fill(o, p);
        if (res) o.status = 'FILLED';
      } catch (e) { o.status = 'REJECTED'; }
    });
  }

  /* ------------------------------ envelope ------------------------------ */
  function ok(data) { return { ok: true, data: data || {} }; }
  function fail(error, code) { return { ok: false, error: String(error), code: code || 'ERROR' }; }

  function statePayload() {
    var w = advance();
    var sectorAcc = {}, sectorN = {}, sum = 0, n = 0, list = [];
    INSTRUMENTS.forEach(function (x) {
      var sym = x[0], init = x[5], price = w.price[sym] || init;
      var changePct = ((price - init) / init) * 100;
      sectorAcc[x[2]] = (sectorAcc[x[2]] || 0) + price / init;
      sectorN[x[2]] = (sectorN[x[2]] || 0) + 1;
      sum += price / init; n++;
      list.push({
        symbol: sym, name: x[1], sector: x[2], logoText: x[3], logoColor: x[4],
        price: price, prevClose: init, changePct: r2(changePct),
        sharesAvailable: w.avail[sym] || 0,
        spark: (w.spark[sym] || [price]).slice()
      });
    });
    var sim = 1000 * (sum / n);
    var indices = [{ name: 'SIM100', value: r2(sim), changePct: r2(sim - 1000) }];
    Object.keys(sectorAcc).sort(function (a, b) { return sectorN[b] - sectorN[a]; }).slice(0, 4)
      .forEach(function (s) {
        var v = 1000 * (sectorAcc[s] / sectorN[s]);
        indices.push({ name: s.substring(0, 6).toUpperCase(), value: r2(v), changePct: r2(v - 1000) });
      });
    return { tick: w.tick, cachedAt: now(), sim100: r2(sim), indices: indices, instruments: list };
  }

  function leaderboard() {
    var w = load();
    var rows = w.players.map(function (p) {
      var nw = netWorth(p);
      var ret = ((nw - p.starting) / p.starting) * 100;
      var h = p.history && p.history.length ? p.history.slice() : [p.starting, nw];
      var peak = -Infinity, dd = 0;
      h.forEach(function (v) { if (v > peak) peak = v; if (peak > 0) dd = Math.max(dd, (peak - v) / peak * 100); });
      var mine = w.trades.filter(function (t) { return t.playerId === p.playerId; });
      var syms = {};
      mine.forEach(function (t) { syms[t.symbol] = 1; });
      var qualified = mine.length >= 5 && Object.keys(syms).length >= 3;
      var score = Math.round((0.6 * ret + 0.3 * (ret / 1.5) - 0.5 * dd) * 100) / 100;
      return {
        rank: 0, playerId: p.playerId, displayName: p.displayName, teamName: p.teamName,
        netWorth: r2(nw), returnPct: r2(ret), score: score, drawdownPct: r2(dd),
        fills: mine.length, qualified: qualified
      };
    });
    rows.sort(function (a, b) {
      if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
      return b.score - a.score;
    });
    rows.forEach(function (r, i) { r.rank = r.qualified ? i + 1 : 0; });

    var teams = {};
    rows.forEach(function (r) {
      var t = teams[r.teamName] || (teams[r.teamName] = { teamName: r.teamName, players: 0, net: 0, ret: 0, top: r.displayName, topScore: -1e9 });
      t.players++; t.net += r.netWorth; t.ret += r.returnPct;
      if (r.score > t.topScore) { t.topScore = r.score; t.top = r.displayName; }
    });
    var teamsArr = Object.keys(teams).map(function (k) {
      var t = teams[k];
      return { rank: 0, teamName: t.teamName, players: t.players,
        avgNetWorth: r2(t.net / t.players), avgReturnPct: r2(t.ret / t.players), topPlayer: t.top };
    }).sort(function (a, b) { return b.avgReturnPct - a.avgReturnPct; });
    teamsArr.forEach(function (t, i) { t.rank = i + 1; });

    return { individual: rows, teams: teamsArr };
  }

  function dispatch(action, payload) {
    payload = payload || {};
    try {
      switch (action) {
        case 'bootstrap':
          return ok({
            eventName: 'Bourse50 Demo', status: 'LIVE', tick: load().tick,
            tickIntervalMs: TICK_MS, marketOpen: marketOpen(), serverTime: now(),
            schedule: JSON.stringify(SCHEDULE), openTimeHint: openHint(), startingCapital: STARTING,
            demo: true
          });

        case 'state':
          return ok(statePayload());

        case 'login': {
          var w = load();
          var pid = String(payload.playerId || '').trim().toUpperCase();
          var p = w.players.filter(function (x) { return x.playerId.toUpperCase() === pid; })[0];
          if (!p || p.pw !== String(payload.password || '')) {
            return fail('Player ID or password is incorrect', 'BAD_CREDENTIALS');
          }
          return ok({
            playerId: p.playerId, displayName: p.displayName, teamName: p.teamName,
            token: 'demo.' + p.playerId + '.' + (now() + 12 * 3600 * 1000),
            mustChangePassword: !!p.mustChange
          });
        }

        case 'changePassword': {
          var cp = playerByToken(payload.token);
          if (!cp) return fail('Session expired, please sign in again', 'INVALID_SESSION');
          if (String(payload.newPassword || '').length < 8) return fail('New password must be at least 8 characters', 'WEAK_PASSWORD');
          if (cp.pw !== String(payload.oldPassword || '')) return fail('Current password is incorrect', 'BAD_CREDENTIALS');
          cp.pw = String(payload.newPassword);
          cp.mustChange = false;
          save();
          return ok({ ok: true });
        }

        case 'portfolio': {
          var pp = playerByToken(payload.token);
          if (!pp) return fail('Session expired, please sign in again', 'INVALID_SESSION');
          var st = advance();
          var pos = positionsOf(pp.playerId), invested = 0;
          var posOut = pos.filter(function (x) { return x.qty > 0; }).map(function (x) {
            var ins = instrument(x.symbol) || [];
            var ltp = st.price[x.symbol] || 0;
            var value = x.qty * ltp;
            invested += value;
            var pl = value - x.cost;
            return {
              symbol: x.symbol, name: ins[1] || x.symbol, logoText: ins[3] || x.symbol.substring(0, 3),
              logoColor: ins[4] || '#22C55E', sector: ins[2] || '', qty: x.qty,
              avgCost: x.qty ? x.cost / x.qty : 0, ltp: ltp, value: value, pl: pl,
              plPct: x.cost ? (pl / x.cost) * 100 : 0
            };
          });
          var nw = pp.cash + invested;
          var lb = leaderboard();
          var rank = 0;
          lb.individual.forEach(function (r, i) { if (r.playerId === pp.playerId) rank = i + 1; });
          var hist = (pp.history && pp.history.length ? pp.history.slice() : []).concat([nw]);
          while (hist.length < 8) hist.unshift(hist[0]);
          var peak = -Infinity, dd = 0;
          hist.forEach(function (v) { if (v > peak) peak = v; if (peak > 0) dd = Math.max(dd, (peak - v) / peak * 100); });
          var mine = lb.individual.filter(function (r) { return r.playerId === pp.playerId; })[0];
          var open = st.orders.filter(function (o) { return o.playerId === pp.playerId && o.status === 'OPEN'; })
            .map(function (o) {
              return { orderId: o.orderId, symbol: o.symbol, side: o.side, type: o.type,
                qty: o.qty, limitPrice: o.limitPrice, createdTick: o.createdTick };
            });
          return ok({
            cash: pp.cash, invested: invested, netWorth: nw,
            returnPct: ((nw - pp.starting) / pp.starting) * 100,
            drawdownPct: dd, volatilityPct: 1.2, score: mine ? mine.score : 0,
            rank: rank, rankTotal: lb.individual.length, startingCash: pp.starting,
            positions: posOut,
            history: hist.map(function (v, i) { return { t: now() - (hist.length - i) * 30000, netWorth: v }; }),
            openOrders: open
          });
        }

        case 'placeOrder': {
          var op = playerByToken(payload.token);
          if (!op) return fail('Session expired, please sign in again', 'INVALID_SESSION');
          var st2 = advance();
          if (!marketOpen()) return fail('Market closed — opens at ' + openHint(), 'MARKET_CLOSED');
          var sym = String(payload.symbol || '').toUpperCase();
          var side = String(payload.side || '').toUpperCase();
          var type = String(payload.type || 'MARKET').toUpperCase();
          var qty = Math.floor(Number(payload.qty));
          var limitPrice = Number(payload.limitPrice || 0);
          var coid = String(payload.clientOrderId || '');
          if (!instrument(sym)) return fail('Unknown instrument ' + sym, 'UNKNOWN_SYMBOL');
          if (!qty || qty < 1) return fail('Quantity must be at least 1', 'BAD_ORDER');
          if (type === 'LIMIT' && !(limitPrice > 0)) return fail('Limit price is required', 'BAD_ORDER');

          if (coid) {
            var dup = st2.orders.filter(function (o) {
              return o.playerId === op.playerId && o.clientOrderId === coid;
            })[0];
            if (dup) {
              return ok({ orderId: dup.orderId, symbol: dup.symbol, side: dup.side, type: dup.type,
                qty: dup.filledQty || dup.qty, fillPrice: dup.fillPrice || 0, commission: 0,
                status: dup.status, duplicate: true });
            }
          }

          var mkt = st2.price[sym];
          var orderId = 'O' + now() + '-' + (st2.seq++);
          var order = { orderId: orderId, playerId: op.playerId, symbol: sym, side: side, type: type,
            qty: qty, limitPrice: type === 'LIMIT' ? limitPrice : mkt, status: 'OPEN',
            filledQty: 0, fillPrice: 0, clientOrderId: coid, createdTick: st2.tick, createdAt: now() };

          if (type === 'LIMIT') {
            var crosses = side === 'BUY' ? mkt <= limitPrice : mkt >= limitPrice;
            if (!crosses) {
              st2.orders.push(order); save();
              return ok({ orderId: orderId, symbol: sym, side: side, type: type, qty: qty,
                limitPrice: limitPrice, fillPrice: 0, commission: 0, status: 'OPEN' });
            }
          }
          var res = fill(order, mkt);
          order.status = 'FILLED'; order.filledQty = qty; order.fillPrice = res.fillPrice;
          st2.orders.push(order); save();
          return ok(res);
        }

        case 'cancelOrder': {
          var cpl = playerByToken(payload.token);
          if (!cpl) return fail('Session expired, please sign in again', 'INVALID_SESSION');
          var w3 = load();
          var o3 = w3.orders.filter(function (x) { return x.orderId === String(payload.orderId); })[0];
          if (!o3) return fail('Order not found', 'ORDER_NOT_FOUND');
          if (o3.playerId !== cpl.playerId) return fail('That order belongs to another player', 'NOT_YOURS');
          if (o3.status !== 'OPEN') return fail('Order is already ' + o3.status, 'NOT_OPEN');
          o3.status = 'CANCELLED'; save();
          return ok({ ok: true, orderId: o3.orderId });
        }

        case 'leaderboard':
          return ok(leaderboard());

        case 'myTrades': {
          var tp = playerByToken(payload.token);
          if (!tp) return fail('Session expired, please sign in again', 'INVALID_SESSION');
          var mine = load().trades.filter(function (t) { return t.playerId === tp.playerId; });
          mine.sort(function (a, b) { return b.createdAt - a.createdAt; });
          return ok({ trades: mine.slice(0, 40) });
        }

        default:
          return fail('Unknown action: ' + action, 'UNKNOWN_ACTION');
      }
    } catch (err) {
      return fail(err && err.message ? err.message : 'Unexpected error', 'SERVER_ERROR');
    }
  }

  window.B50Demo = { dispatch: dispatch, reset: reset, isDemo: true };
})();
