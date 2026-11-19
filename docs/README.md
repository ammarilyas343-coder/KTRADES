# BOURSE-50 — deployment guide

Two deployables, no build step, no npm, no CDN, no external services.

1. **Google Sheet + Apps Script** — admin + backend (returns JSON only).
2. **Static frontend** (`public/`) — the player experience. One URL binds it
   to the backend.

---

## 1–7. Getting a demo running

1. **Create a Google Spreadsheet.** Open **Extensions → Apps Script**. Paste
   `apps-script/Code.gs` into `Code.gs` and `apps-script/Setup.gs` into a new
   script file named `Setup.gs`. Save.
2. **Reload the spreadsheet** so the custom menu appears. Run
   **Bourse50 → 1. First-time setup**, then
   **Bourse50 → 2. Generate player logins** (default 20). Open the
   **Credentials** tab, print it / copy the temp passwords, then **clear that
   tab** — it is the only place a plaintext password ever exists.
3. **Deploy → New deployment → Web app** → *Execute as:* **Me** →
   *Who has access:* **Anyone**. Copy the `/exec` URL.
   (The app is deployed "Anyone" — treat it as public. Token validation and
   rate limits are the actual gate.)
4. **Paste the `/exec` URL** into `public/js/config.js` as `APPS_SCRIPT_URL`.
   This is the *only* file an operator edits; leaving it empty runs the
   built-in demo engine so the UI can be reviewed before deployment.
5. **Open `public/index.html` in a browser**, or serve `public/` from any
   static host (GitHub Pages, Netlify, Vercel, or a local
   `python -m http.server`). There is no build step. The repository root
   `index.html` is the same shell, pointed at `public/`.
6. **Sign in** with a `PlayerID` and `TempPassword` from the Credentials tab.
   The first login forces a password change before Home is reachable.
7. **Set `Config.STATUS` to LIVE** (or run **Bourse50 → 4. Set event LIVE**)
   to start trading. `5. Pause event` and `6. Close event` do the reverse —
   flipping the cell by hand works too, via the installable `onEdit` trigger.

### Menu reference

| # | Menu item | Does |
|---|---|---|
| 1 | First-time setup | Creates all tabs + exact headers, Config defaults with a fresh 64-hex `SECRET`, seeds 50 instruments. Idempotent. |
| 2 | Generate player logins | `B50-001…N`, hashed into **Players**, plaintext into **Credentials**. Never overwrites existing IDs. |
| 3 | Deploy active scenario | Requires exactly one `Active=TRUE` row; writes `ACTIVE_SCENARIO`. |
| 4/5/6 | LIVE / Pause / Close | Writes `STATUS`, appends to **AuditLog**. |
| 7 | Rebuild leaderboards | Recomputes **Leaderboard** + **TeamLeaderboard**. |
| 8 | Export today's trades | Read-only snapshot `Trades_YYYYMMDD`. |
| 9 | Reset demo data | Requires typing `RESET_DEMO`. Clears Orders/Trades/Positions/PriceTicks/Leaderboards, resets cash and prices. Never touches Players, Instruments, Scenarios or `SECRET`. |

---

## 8. Where every sheet tab is read or written

| Tab | Read by | Written by | Colour |
|---|---|---|---|
| `Config` | every request (one batched `getValues`) | First-time setup, status commands, the engine (`CURRENT_TICK`, `LAST_TICK_AT`), operator edits | blue |
| `Players` | `login`, `verifyToken`, `portfolio`, `leaderboard` | Generate logins, `login` (`LastLoginAt`), `changePassword`, fills (`Cash`), Reset demo | blue |
| `Scenarios` | price engine (`maybeAdvanceTick`) | First-time setup, Deploy active scenario | blue |
| `Instruments` | `state`, order execution | First-time setup (seed), price engine (`CurrentPrice`, `PrevClose`, `SharesAvailable`), operator edits | blue |
| `Orders` | `placeOrder` (idempotency), `portfolio` (open), tick evaluator | `placeOrder`, fill/cancel/expiry | blue |
| `Trades` | `leaderboard`, `myTrades`, export | every fill (inside the same lock) | blue |
| `Positions` | `portfolio`, `leaderboard`, order execution | every fill | blue |
| `PriceTicks` | `state` sparkline seeding | price engine, every 10th tick | blue |
| `Leaderboard` | `leaderboard` | `recomputeLeaderboard_` only | grey |
| `TeamLeaderboard` | `leaderboard` | `recomputeLeaderboard_` only | grey |
| `AuditLog` | — | every mutating handler, login failures, menu commands | blue |
| `Credentials` | never by the app | Generate player logins (operator prints, then clears) | red |

---

## 9. Quota note (verbatim)

> This prototype is tuned for short demos: 5-10 concurrent testers in a
> 20-30 minute session on a consumer Gmail account, or up to 25 testers
> in a 60-90 minute session on a Google Workspace account. It will not
> sustain 300 users for 2 weeks — that is a known architectural limit
> of Apps Script and a migration to a different backend is required for
> production scale. Do not increase poll frequency or session length
> without re-measuring script runtime.

### Guardrails already built in

* `CacheService` key `state_v1`, 2500 ms TTL — with 25 clients polling every
  5 s only ~1 in 5 requests pays the sheet-read cost.
* A `state` read arriving < 2000 ms after that session's last read returns the
  cached payload (`last_<tokenHash>`, 60 s TTL).
* Config, Instruments, Players and Positions are read in **one** `getValues()`
  each; read endpoints append nothing to AuditLog.
* The client only polls when `document.visibilityState === 'visible'`, never on
  `#/login`, `#/change-password` or `#/profile`, and there is no separate
  leaderboard timer — it piggybacks on the state poll.
* Client backoff on failure: 5 → 10 → 20 → 40 → 60 s, then resume with an
  immediate fetch.

---

## 10. Redeploying after editing `Code.gs`

**Deploy → Manage deployments → ✏ edit the existing deployment → Version:
New version → Deploy.** The `/exec` URL stays the same, so `config.js` never
needs changing. (Creating a *new* deployment instead gives you a new URL and
an outage for every player.)

---

## Transport contract

```js
// READS (GET)
fetch(APPS_SCRIPT_URL + '?action=' + act + '&payload=' +
      encodeURIComponent(JSON.stringify(payload)) + '&_=' + Date.now(),
      { method: 'GET', redirect: 'follow' });

// WRITES (POST) — text/plain keeps it CORS-simple: no preflight
fetch(APPS_SCRIPT_URL, {
  method: 'POST', redirect: 'follow',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: act, ...payload })
});
// GET FALLBACK: a POST network error retries ONCE as a GET.
```

Server-side, `doGet` reads `e.parameter.action` + `JSON.parse(e.parameter.payload)`,
`doPost` reads `JSON.parse(e.postData.contents)`, and both call the same
`dispatch(action, payload)`. Every response is
`ContentService.createTextOutput(JSON.stringify(envelope)).setMimeType(ContentService.MimeType.JSON)`
as either `{ok:true,data}` or `{ok:false,error,code}`.

## Security notes

* `PasswordHash = hex(HMAC_SHA256(Salt + password, SECRET))`, 16-byte salt per
  player, `SECRET` = 64 hex chars generated at setup and stored only in Config.
* Session token = `base64url(JSON{u,e}) + "." + HMAC_SHA256(body, SECRET)`.
  Every private handler re-validates the signature, the expiry **and** the live
  `Players` row.
* No response body and no log line ever contains a password, hash, salt, token
  or the Config `SECRET`.
* All user-supplied strings are rendered with `textContent`, never interpolated
  into `innerHTML`.

## Files

```
apps-script/Code.gs      doGet · doPost · dispatch · handlers · auth · price engine
apps-script/Setup.gs     onOpen menu · setup · seeding · operator commands
public/index.html        SPA shell
public/css/tokens.css    dark + light design tokens
public/css/app.css       all component CSS (mobile-first, max-width 560)
public/js/config.js      THE ONLY FILE THE OPERATOR EDITS
public/js/demo.js        in-browser stand-in, used only when the URL is empty
public/js/api.js         GET/POST/GET-fallback fetch wrapper
public/js/store.js       observable store + localStorage session
public/js/router.js      hash router + auth guard
public/js/charts.js      SVG sparkline / area / donut
public/js/format.js      en-PK money, signed percents, mask, el()
public/js/theme.js       dark/light toggle
public/js/views/*.js     shell · login · change-password · home · portfolio · trade · board · profile
public/js/app.js         bootstrap, polling loop, toasts
```
