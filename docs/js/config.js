/* =================================================================
   BOURSE-50 — public/js/config.js
   THE ONLY FILE THE OPERATOR EDITS.
   Everything else reads from window.BOURSE50_CONFIG.
   ================================================================= */

window.BOURSE50_CONFIG = {

  /* Paste the Apps Script Web App /exec URL here, e.g.
     "https://script.google.com/macros/s/AKfy.../exec"
     Leave EMPTY ('') to run the built-in demo engine (no backend).
     Swapping this URL is the ONLY change needed to point at another
     deployment.                                                    */
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwcaLNzF-T6N1RvvwDgZsFlYtk32jant_Mq-2HYO_anZ8oxaWmhrVys52XzEue639F7/exec',

  /* Polling cadence (ms). state = market data, portfolio = your book. */
  POLL_MS: 5000,
  PORTFOLIO_POLL_MS: 15000,

  /* How long a failed poll waits before retrying (ms), backoff ladder. */
  BACKOFF_MS: [5000, 10000, 20000, 40000, 60000],

  /* Demo engine only (ignored once APPS_SCRIPT_URL is set):
     'auto'     -> market shown as open during scheduled hours, closed outside
     'always'   -> demo market always open (default, keeps a review session alive)
     'schedule' -> demo obeys SCHEDULE_JSON exactly                      */
  DEMO_MARKET_OPEN: 'always',

  /* Demo credentials shown on the login screen when running without a backend. */
  DEMO_PLAYER: 'B50-001',
  DEMO_PASSWORD: 'DEMO01'
};