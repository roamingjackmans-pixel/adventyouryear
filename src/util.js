/* Advent Your Year — shared helpers */
(function () {
  const A = (window.AYY = window.AYY || {});

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function localTz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
  }

  /** Today's date in a time zone as "YYYY-MM-DD". */
  function todayIn(tz) {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz || localTz(), year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }

  function dayKey(y, m, d) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function isUnlocked(cal, day) {
    return todayIn(cal.timezone) >= dayKey(cal.start_year, cal.start_month, day);
  }

  /** Whole days from today (in the calendar's zone) until a door opens. 0 = today. */
  function daysUntil(cal, day) {
    const [ty, tm, td] = todayIn(cal.timezone).split('-').map(Number);
    const a = Date.UTC(ty, tm - 1, td);
    const b = Date.UTC(cal.start_year, cal.start_month - 1, day);
    return Math.round((b - a) / 86400000);
  }

  function weekday(y, m, d) {
    return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  }

  function fmtDate(y, m, d, withWeekday) {
    return `${withWeekday ? weekday(y, m, d) + ', ' : ''}${MONTHS[m - 1]} ${d}`;
  }

  function toast(msg, opts = {}) {
    let host = document.querySelector('.toasts');
    if (!host) {
      host = el('<div class="toasts" role="status" aria-live="polite"></div>');
      document.body.appendChild(host);
    }
    const t = el(`<div class="toast ${opts.kind || ''}"></div>`);
    if (opts.html) t.innerHTML = msg; else t.textContent = msg;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    const ms = opts.ms || 4200;
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, ms);
    return t;
  }

  /** Shrink a picked photo to a sensible upload size (keeps EXIF rotation via createImageBitmap). */
  async function compressImage(file, max = 2000, quality = 0.86) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) {
      const url = URL.createObjectURL(file);
      bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    }
    const w = bmp.width, h = bmp.height;
    const s = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob(res, 'image/jpeg', quality));
  }

  function clearToasts(kind) { document.querySelectorAll('.toast' + (kind ? '.' + kind : '')).forEach((t) => t.remove()); }

  async function copyText(text, fallbackInput) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      if (fallbackInput) { fallbackInput.focus(); fallbackInput.select(); }
      return false;
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  A.util = { rng, esc, el, sleep, localTz, todayIn, dayKey, isUnlocked, daysUntil, weekday, fmtDate, toast, clearToasts, compressImage, copyText, prefersReducedMotion, MONTHS };
})();
