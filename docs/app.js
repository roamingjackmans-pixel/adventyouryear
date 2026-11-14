/* ---- src/util.js ---- */
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

/* ---- src/designs/parlor.js ---- */
try {
/* Design 1 — "Christmas Eve Parlor"
   A fireside sitting room on Christmas Eve: decorated tree, stockings on the mantel,
   a snowy night through the window, a cat asleep in the wingback chair.
   The scene is drawn as SVG (static art), then animated layers (fire, twinkling
   lights, candles, falling snow) are painted on a canvas by the board. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};

  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1224);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [];   // twinkling bulbs  {x,y,c,r}
    const candles = [];  // candle flames    {x,y,s}
    const out = [];
    const add = (s) => out.push(s);

    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40', '#14361f'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];

    /* ---------- reusable drawing helpers ---------- */
    function pine(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rr(-0.3, 0.3);
        const l = r * rr(0.9, 1.5);
        s += `<path d="M${f(x)} ${f(y)}L${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return s;
    }
    function bulb(x, y, c, r = 4.2) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".22"/>` +
        `<rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/>` +
        `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/>` +
        `<ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".75"/>`;
    }
    function berries(x, y) {
      let s = '';
      for (let i = 0; i < 3; i++) {
        const bx = x + rr(-6, 6), by = y + rr(-5, 5);
        s += `<circle cx="${f(bx)}" cy="${f(by)}" r="4.2" fill="#b3122a"/><circle cx="${f(bx - 1.3)}" cy="${f(by - 1.4)}" r="1.3" fill="#ff8f9c"/>`;
      }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">` +
        `<path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/>` +
        `<path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/>` +
        `<path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/>` +
        `<path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/>` +
        `<path d="M-4 -2 C-14 -10 -24 -10 -24 -3" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none"/>` +
        `<ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/>` +
        `<ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    /** Garland along a quadratic swag; returns svg and places bulbs. */
    function swag(x0, y0, cx, cy, x1, y1, opts = {}) {
      const n = opts.n || 28;
      let s = '';
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        pts.push([x, y]);
      }
      const r = opts.r || 13;
      pts.forEach(([x, y]) => { s += pine(x + rr(-3, 3), y + rr(-3, 3), r * rr(0.8, 1.1)); });
      pts.forEach(([x, y], i) => {
        if (i % 2 === 0) s += pine(x + rr(-6, 6), y + rr(-2, 8), r * 0.75);
      });
      if (opts.berries) pts.forEach(([x, y], i) => { if (i % 5 === 2) s += berries(x, y + 4); });
      if (opts.lights) pts.forEach(([x, y], i) => { if (i % (opts.lightEvery || 3) === 1) s += bulb(x + rr(-4, 4), y + rr(0, 8), BULB[(i + (opts.off || 0)) % BULB.length], opts.bulb || 4); });
      return s;
    }

    /* ---------- defs ---------- */
    const ornColors = { red: ['#ff5a63', '#b0101f', '#5e0710'], gold: ['#ffe39a', '#cf9a2e', '#6a4410'], blue: ['#8fb8ff', '#2a56b0', '#0f2353'], silver: ['#ffffff', '#b9c3cc', '#5b6670'], green: ['#8fe0a0', '#1f7d45', '#0b3a1d'], plum: ['#e3a0f0', '#7a2f95', '#33103f'] };
    let ornDefs = '';
    Object.entries(ornColors).forEach(([k, [a, b, c]]) => {
      ornDefs += `<radialGradient id="orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
    });

    add(`<defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a0c16"/><stop offset=".55" stop-color="#7a1825"/><stop offset="1" stop-color="#5c111b"/></linearGradient>
      <pattern id="damask" width="96" height="128" patternUnits="userSpaceOnUse">
        <g id="dmk" fill="#c2414c" opacity=".2">
          <path d="M48 10 C64 30 66 50 48 70 C30 50 32 30 48 10Z"/>
          <path d="M48 70 C55 80 66 82 72 76 C66 92 55 94 48 86 C41 94 30 92 24 76 C30 82 41 80 48 70Z"/>
          <circle cx="48" cy="100" r="5"/><circle cx="48" cy="4" r="3"/>
          <path d="M36 40 C24 36 20 24 28 18 M60 40 C72 36 76 24 68 18" stroke="#c2414c" stroke-width="3" fill="none"/>
        </g>
        <use href="#dmk" x="-48" y="64"/><use href="#dmk" x="48" y="64"/><use href="#dmk" x="-48" y="-64"/><use href="#dmk" x="48" y="-64"/>
      </pattern>
      <pattern id="stripe" width="48" height="10" patternUnits="userSpaceOnUse"><rect width="48" height="10" fill="none"/><rect x="0" width="2" height="10" fill="#e5b866" opacity=".09"/></pattern>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3a1f"/><stop offset="1" stop-color="#3d1f0f"/></linearGradient>
      <linearGradient id="woodH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2814"/><stop offset=".5" stop-color="#6e3d20"/><stop offset="1" stop-color="#4a2814"/></linearGradient>
      <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ecdc"/><stop offset="1" stop-color="#d6c7ab"/></linearGradient>
      <linearGradient id="stoneDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9cbb0"/><stop offset="1" stop-color="#b9a685"/></linearGradient>
      <radialGradient id="firebox" cx=".5" cy=".95" r=".85"><stop offset="0" stop-color="#7a2e0e"/><stop offset=".45" stop-color="#3a140a"/><stop offset="1" stop-color="#110604"/></radialGradient>
      <pattern id="brick" width="44" height="22" patternUnits="userSpaceOnUse"><rect width="44" height="22" fill="#4a1b0e"/><path d="M0 0H44M0 11H44M22 0V11M0 11V22M44 11V22" stroke="#1e0905" stroke-width="2"/></pattern>
      <linearGradient id="treeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07142e"/><stop offset=".7" stop-color="#1c3a6e"/><stop offset="1" stop-color="#3f5f94"/></linearGradient>
      <radialGradient id="moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff9e0" stop-opacity=".9"/><stop offset=".25" stop-color="#fff2c0" stop-opacity=".35"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></radialGradient>
      <linearGradient id="velvet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0e3a26"/><stop offset=".3" stop-color="#1f6a45"/><stop offset=".55" stop-color="#14523a"/><stop offset=".8" stop-color="#227450"/><stop offset="1" stop-color="#0d3524"/></linearGradient>
      <linearGradient id="chair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7a55"/><stop offset="1" stop-color="#14462f"/></linearGradient>
      <pattern id="tartan" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#a3172a"/><rect y="14" width="40" height="10" fill="#1b4a2e" opacity=".8"/><rect x="14" width="10" height="40" fill="#1b4a2e" opacity=".6"/><rect y="30" width="40" height="2" fill="#f0c64a" opacity=".7"/><rect x="30" width="2" height="40" fill="#f0c64a" opacity=".7"/></pattern>
      <pattern id="stkStripe" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="20" height="20" fill="#c11d2f"/><rect width="20" height="7" fill="#f6efe2"/></pattern>
      <pattern id="stkArgyle" width="30" height="40" patternUnits="userSpaceOnUse"><rect width="30" height="40" fill="#b5162a"/><path d="M15 0L30 20L15 40L0 20Z" fill="#8a0f20"/><path d="M0 0L30 40M30 0L0 40" stroke="#f4d27a" stroke-width="1.2" opacity=".8"/></pattern>
      <pattern id="stkDots" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#1d6b43"/><circle cx="5" cy="5" r="3" fill="#f6efe2"/><circle cx="14" cy="14" r="3" fill="#f6efe2"/></pattern>
      <pattern id="giftDots" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#2a5aa8"/><circle cx="8" cy="8" r="2.4" fill="#e8f0ff"/></pattern>
      <pattern id="giftStripe" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#f4ede0"/><rect width="7" height="16" fill="#c4222f"/></pattern>
      <pattern id="giftStar" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#20553a"/><path d="M11 5l1.6 3.6 3.9.4-2.9 2.6.8 3.8L11 13.5 7.6 15.4l.8-3.8L5.5 9l3.9-.4Z" fill="#e9c060"/></pattern>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <linearGradient id="candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1f10"/><stop offset="1" stop-color="#5c331a"/></linearGradient>
      <radialGradient id="fireLight" cx="800" cy="660" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb066" stop-opacity=".30"/><stop offset=".45" stop-color="#ff9a4d" stop-opacity=".10"/><stop offset="1" stop-color="#ff9a4d" stop-opacity="0"/></radialGradient>
      <radialGradient id="vignette" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0204" stop-opacity=".6"/></radialGradient>
      <radialGradient id="candleGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="tabby" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f2a65a"/><stop offset="1" stop-color="#b8662a"/></radialGradient>
      <radialGradient id="pup" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#d9a066"/><stop offset="1" stop-color="#9a6234"/></radialGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>
      ${ornDefs}
    </defs>`);

    /* ---------- room: wall, molding, wainscot, floor ---------- */
    add(`<rect width="${W}" height="780" fill="url(#wall)"/><rect width="${W}" height="780" fill="url(#damask)"/><rect width="${W}" height="780" fill="url(#stripe)"/>`);
    add(`<rect y="0" width="${W}" height="26" fill="url(#woodH)"/><rect y="24" width="${W}" height="6" fill="#2b140a"/><rect y="3" width="${W}" height="3" fill="#c99a52" opacity=".55"/>`);
    // wainscot
    add(`<rect y="600" width="${W}" height="170" fill="url(#wood)"/><rect y="596" width="${W}" height="16" fill="#5a2e17"/><rect y="597" width="${W}" height="3" fill="#b07a42" opacity=".7"/>`);
    for (let x = 14; x < W; x += 176) {
      add(`<rect x="${x}" y="628" width="150" height="118" rx="3" fill="none" stroke="#2a1309" stroke-width="5"/><rect x="${x + 3}" y="631" width="150" height="118" rx="3" fill="none" stroke="#9b6436" stroke-opacity=".35" stroke-width="2"/>`);
    }
    // floor planks
    add(`<rect y="770" width="${W}" height="230" fill="url(#floor)"/>`);
    let py = 772, ph = 18, row = 0;
    while (py < H) {
      add(`<rect y="${py}" width="${W}" height="${ph}" fill="${row % 2 ? '#4f2c16' : '#5e351b'}"/><rect y="${py}" width="${W}" height="1.6" fill="#24110a" opacity=".8"/>`);
      for (let x = (row * 137) % 260; x < W; x += 260 + (row % 3) * 40) add(`<rect x="${x}" y="${py}" width="2" height="${ph}" fill="#24110a" opacity=".7"/>`);
      py += ph; ph = Math.round(ph * 1.18); row++;
    }
    add(`<rect y="762" width="${W}" height="14" fill="#2a1409"/><rect y="762" width="${W}" height="2" fill="#8a5a30" opacity=".6"/>`);

    // rug
    add(`<ellipse cx="800" cy="905" rx="420" ry="88" fill="#000" opacity=".35" filter="url(#soft)"/>
      <ellipse cx="800" cy="898" rx="410" ry="82" fill="#7d1520"/>
      <ellipse cx="800" cy="898" rx="388" ry="72" fill="none" stroke="#d9a84a" stroke-width="5"/>
      <ellipse cx="800" cy="898" rx="356" ry="60" fill="#163f2b"/>
      <ellipse cx="800" cy="898" rx="330" ry="50" fill="none" stroke="#d9a84a" stroke-width="2" stroke-dasharray="14 8"/>
      <ellipse cx="800" cy="898" rx="230" ry="32" fill="#8d1d27"/>
      <ellipse cx="800" cy="898" rx="120" ry="16" fill="#d9a84a" opacity=".8"/>`);

    /* ---------- top garland swags along the crown ---------- */
    const hooks = [0, 230, 460, 690, 910, 1140, 1370, 1600];
    for (let i = 0; i < hooks.length - 1; i++) {
      const a = hooks[i], b = hooks[i + 1];
      add(swag(a, 30, (a + b) / 2, 96, b, 30, { n: 16, r: 11, lights: true, lightEvery: 3, off: i, bulb: 3.6, berries: true }));
    }
    hooks.forEach((x) => add(bow(x, 36, 0.8)));

    /* ---------- window, curtains ---------- */
    add(`<rect x="1172" y="122" width="276" height="440" fill="#f1e7d2"/><rect x="1172" y="122" width="276" height="440" fill="none" stroke="#b8a37f" stroke-width="3"/>`);
    add(`<rect x="1186" y="136" width="248" height="410" fill="url(#night)"/>`);
    // stars
    for (let i = 0; i < 46; i++) {
      const sx = rr(1192, 1428), sy = rr(142, 400), sr = rr(0.6, 1.8);
      add(`<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(sr)}" fill="#fff" opacity="${f(rr(0.4, 1))}"/>`);
    }
    add(`<circle cx="1372" cy="196" r="90" fill="url(#moon)"/><circle cx="1372" cy="196" r="24" fill="#fff6d8"/><circle cx="1364" cy="190" r="5" fill="#e8dcb4" opacity=".6"/><circle cx="1380" cy="205" r="3.5" fill="#e8dcb4" opacity=".6"/>`);
    // hills + village
    add(`<path d="M1186 440 Q1250 400 1320 430 Q1380 452 1434 418 V546 H1186Z" fill="#c9d8ee"/>
      <path d="M1186 480 Q1270 440 1350 476 Q1400 496 1434 470 V546 H1186Z" fill="#e9f0fb"/>`);
    // little cottage
    add(`<g transform="translate(1238 452)"><path d="M0 22 L24 2 L48 22Z" fill="#f6f9ff"/><rect x="4" y="20" width="40" height="26" fill="#5a3324"/><rect x="11" y="27" width="9" height="9" fill="#ffcf70"/><rect x="28" y="27" width="9" height="9" fill="#ffcf70"/><rect x="32" y="4" width="6" height="12" fill="#5a3324"/><path d="M-2 22 L24 0 L50 22" stroke="#fff" stroke-width="4" fill="none"/></g>`);
    for (let i = 0; i < 9; i++) {
      const tx = 1196 + i * 28 + rr(-6, 6), ty = 470 + rr(-10, 22), ts = rr(0.6, 1.1);
      add(`<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(ts)})"><path d="M0 -46 L13 -18 L7 -18 L17 2 L-17 2 L-7 -18 L-13 -18Z" fill="#14324f"/><path d="M0 -46 L6 -33 L-6 -33Z M-9 -18 L9 -18 L5 -14 L-5 -14Z" fill="#eef4ff"/></g>`);
    }
    add(`<rect x="1186" y="526" width="248" height="20" fill="#f7fbff"/>`);
    // mullions
    add(`<rect x="1304" y="136" width="12" height="410" fill="#efe4cd"/><rect x="1186" y="334" width="248" height="12" fill="#efe4cd"/><path d="M1186 136h248" stroke="#c9b48e" stroke-width="2"/>`);
    // snow in pane corners
    add(`<path d="M1186 546 Q1210 528 1240 538 Q1268 526 1304 540 V546Z M1316 546 Q1350 530 1380 540 Q1410 528 1434 538 V546Z" fill="#fff"/>
      <path d="M1186 346 Q1220 352 1240 346 L1186 360Z M1316 346 Q1350 354 1380 346 L1316 358Z" fill="#fff" opacity=".85"/>`);
    // sill
    add(`<rect x="1158" y="556" width="304" height="20" rx="3" fill="#f3ead6"/><rect x="1158" y="572" width="304" height="7" fill="#b8a37f"/>`);
    // curtains
    add(`<path d="M1118 112 L1206 112 Q1196 300 1238 392 Q1196 420 1170 600 L1118 600Z" fill="url(#velvet)"/>
      <path d="M1502 112 L1414 112 Q1424 300 1382 392 Q1424 420 1450 600 L1502 600Z" fill="url(#velvet)"/>
      <path d="M1140 120 Q1150 300 1150 600 M1170 120 Q1178 300 1196 400 M1480 120 Q1470 300 1470 600 M1450 120 Q1442 300 1424 400" stroke="#0a2a1b" stroke-width="3" opacity=".55" fill="none"/>
      <path d="M1222 392 Q1196 382 1150 398 Q1170 410 1222 402Z M1398 392 Q1424 382 1470 398 Q1450 410 1398 402Z" fill="url(#gold)"/>
      <circle cx="1206" cy="398" r="8" fill="url(#gold)"/><circle cx="1414" cy="398" r="8" fill="url(#gold)"/>`);
    // valance
    add(`<rect x="1102" y="92" width="416" height="12" rx="6" fill="url(#gold)"/><circle cx="1100" cy="98" r="11" fill="url(#gold)"/><circle cx="1520" cy="98" r="11" fill="url(#gold)"/>`);
    let val = 'M1110 104 H1510 V140';
    for (let x = 1510; x > 1110; x -= 50) val += ` Q${x - 25} 168 ${x - 50} 140`;
    add(`<path d="${val} Z" fill="url(#velvet)"/>`);
    let fringe = '';
    for (let x = 1112; x < 1510; x += 7) {
      const t = ((x - 1110) % 50) / 50;
      const y = 140 + Math.sin(t * Math.PI) * 24;
      fringe += `M${x} ${f(y)}v10`;
    }
    add(`<path d="${fringe}" stroke="#d6a640" stroke-width="2.4"/>`);
    // little wreath on window
    add(`<g>${(() => { let s = ''; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; s += pine(1310 + Math.cos(a) * 26, 246 + Math.sin(a) * 26, 8); } return s; })()}</g>${bow(1310, 272, 0.55)}`);

    /* ---------- armchair with sleeping cat ---------- */
    add(`<g filter="url(#shadow)">
      <path d="M1196 610 Q1192 520 1236 506 Q1320 488 1404 506 Q1448 520 1444 610 L1444 760 L1196 760Z" fill="url(#chair)"/>
      <path d="M1236 520 Q1320 502 1404 520" stroke="#3f9a70" stroke-width="3" fill="none" opacity=".6"/>
      <path d="M1230 560 V720 M1320 540 V720 M1410 560 V720" stroke="#0e3a26" stroke-width="2" opacity=".5"/>
      <rect x="1190" y="700" width="260" height="60" rx="18" fill="#1f6a47"/>
      <path d="M1160 650 Q1160 620 1190 620 Q1222 620 1222 650 V800 H1160Z" fill="#23744e"/>
      <path d="M1418 650 Q1418 620 1450 620 Q1480 620 1480 650 V800 H1418Z" fill="#1d6644"/>
      <ellipse cx="1191" cy="636" rx="31" ry="14" fill="#2f8a5f"/><ellipse cx="1449" cy="636" rx="31" ry="14" fill="#2a8058"/>
      <rect x="1166" y="796" width="300" height="40" rx="6" fill="#185a3c"/>
      <path d="M1176 836 l-6 34 h12 l4 -34Z M1452 836 l6 34 h-12 l-4 -34Z" fill="#3d1f0f"/>
    </g>`);
    // tartan throw over the arm
    add(`<path d="M1408 612 Q1446 600 1484 620 L1490 760 Q1470 774 1452 762 L1446 690 Q1430 660 1410 660Z" fill="url(#tartan)"/><path d="M1452 762 l4 14 M1462 766 l3 14 M1472 768 l2 14 M1482 764 l2 14" stroke="#a3172a" stroke-width="3"/>`);
    // cat curled on the cushion
    add(`<g transform="translate(1300 716)">
      <ellipse cx="0" cy="6" rx="70" ry="10" fill="#000" opacity=".25"/>
      <path d="M-62 4 Q-66 -40 -10 -44 Q52 -46 62 -8 Q66 8 40 8 L-50 8 Q-62 8 -62 4Z" fill="url(#tabby)"/>
      <path d="M-40 -34 q8 10 2 22 M-18 -42 q8 12 2 26 M6 -44 q8 12 2 28 M28 -38 q8 10 4 24" stroke="#9a4f1c" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M60 -2 Q74 6 52 12 Q8 20 -40 12" stroke="#c9742f" stroke-width="13" fill="none" stroke-linecap="round"/>
      <path d="M44 9 q-6 0 -10 4" stroke="#9a4f1c" stroke-width="4" fill="none"/>
      <ellipse cx="-50" cy="-10" rx="27" ry="23" fill="url(#tabby)"/>
      <path d="M-70 -24 L-72 -50 L-54 -32Z M-44 -32 L-30 -52 L-28 -26Z" fill="#d9894a"/>
      <path d="M-68 -30 L-69 -44 L-59 -33Z M-41 -32 L-33 -45 L-32 -30Z" fill="#f5b9a8"/>
      <path d="M-64 -10 q5 4 10 0 M-46 -10 q5 4 10 0" stroke="#4a2410" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M-52 -2 l3 3 l3 -3Z" fill="#e37f86"/>
      <path d="M-58 0 h-18 M-58 3 l-16 5 M-44 0 h18 M-44 3 l16 5" stroke="#fff" stroke-width="1" opacity=".7"/>
      <ellipse cx="-30" cy="6" rx="14" ry="6" fill="#f7e4cf"/>
    </g>`);

    /* ---------- side table + cocoa ---------- */
    add(`<g>
      <ellipse cx="1546" cy="720" rx="54" ry="13" fill="#5a2f17"/><rect x="1492" y="718" width="108" height="10" fill="#3d1f0f"/>
      <rect x="1538" y="728" width="14" height="110" fill="#4a2614"/><ellipse cx="1546" cy="840" rx="40" ry="9" fill="#3d1f0f"/>
      <rect x="1506" y="694" width="50" height="10" rx="2" fill="#2f5d8a"/><rect x="1510" y="684" width="44" height="10" rx="2" fill="#9e2a2b"/><rect x="1504" y="674" width="48" height="10" rx="2" fill="#c9a24a"/>
      <path d="M1562 676 h28 v32 q0 8 -8 8 h-12 q-8 0 -8 -8Z" fill="#f2ede2"/><path d="M1590 684 q12 0 10 12 q-2 8 -10 8" stroke="#f2ede2" stroke-width="5" fill="none"/>
      <rect x="1562" y="688" width="28" height="7" fill="#b3172b"/>
      <ellipse cx="1576" cy="676" rx="14" ry="4" fill="#6b3b1d"/><circle cx="1571" cy="672" r="4" fill="#fff"/><circle cx="1580" cy="671" r="3.5" fill="#fff"/>
    </g>`);

    /* ---------- fireplace ---------- */
    add(`<rect x="520" y="744" width="560" height="40" rx="3" fill="url(#stoneDark)"/><rect x="520" y="744" width="560" height="5" fill="#f2e9d6"/>`);
    add(`<g filter="url(#shadow)"><rect x="580" y="356" width="440" height="392" fill="url(#stone)"/></g>`);
    // pilasters
    add(`<rect x="584" y="420" width="64" height="326" fill="#efe5d1"/><rect x="952" y="420" width="64" height="326" fill="#efe5d1"/>`);
    [598, 612, 626, 966, 980, 994].forEach((x) => add(`<rect x="${x}" y="440" width="6" height="286" rx="3" fill="#cdbb98" opacity=".75"/>`));
    add(`<rect x="578" y="728" width="74" height="20" fill="#e3d6bc"/><rect x="948" y="728" width="74" height="20" fill="#e3d6bc"/><rect x="578" y="412" width="74" height="14" fill="#e3d6bc"/><rect x="948" y="412" width="74" height="14" fill="#e3d6bc"/>`);
    // frieze + medallion
    add(`<rect x="580" y="356" width="440" height="58" fill="#efe4cf"/><rect x="580" y="408" width="440" height="6" fill="#cbb994"/>
      <ellipse cx="800" cy="386" rx="34" ry="20" fill="#e3d4b5" stroke="#bfa97f" stroke-width="2"/>
      <path d="M690 380 Q728 400 766 382 M834 382 Q872 400 910 380" stroke="#bfa97f" stroke-width="3" fill="none"/>
      <circle cx="680" cy="380" r="5" fill="#bfa97f"/><circle cx="920" cy="380" r="5" fill="#bfa97f"/>`);
    // firebox
    const arch = 'M660 766 V544 Q660 478 800 476 Q940 478 940 544 V766 Z';
    add(`<path d="M646 766 V540 Q646 462 800 460 Q954 462 954 540 V766 Z" fill="#cdbd9c"/>`);
    add(`<path d="${arch}" fill="url(#firebox)"/><path d="${arch}" fill="url(#brick)" opacity=".55"/><path d="${arch}" fill="url(#firebox)" opacity=".55"/>`);
    add(`<path d="M660 766 V544 Q660 478 800 476 Q940 478 940 544 V766" fill="none" stroke="#120604" stroke-width="10" opacity=".6"/>`);
    add(`<path d="M780 460 h40 l-6 22 h-28Z" fill="#e8dcc2" stroke="#bfa97f" stroke-width="2"/>`);
    // logs and coals
    add(`<ellipse cx="800" cy="748" rx="120" ry="12" fill="#ff7a2a" opacity=".55" filter="url(#soft)"/>
      <g transform="rotate(-6 800 720)"><rect x="700" y="706" width="200" height="30" rx="15" fill="#5a3218"/><rect x="700" y="706" width="200" height="8" rx="4" fill="#7d4a26"/><ellipse cx="896" cy="721" rx="11" ry="15" fill="#c79a62"/><ellipse cx="896" cy="721" rx="6" ry="9" fill="none" stroke="#8a5a2c" stroke-width="2"/></g>
      <g transform="rotate(8 800 730)"><rect x="716" y="722" width="170" height="26" rx="13" fill="#4a2812"/><ellipse cx="720" cy="735" rx="10" ry="13" fill="#b98a55"/><ellipse cx="720" cy="735" rx="5" ry="7" fill="none" stroke="#7d4f25" stroke-width="2"/></g>`);
    for (let i = 0; i < 14; i++) add(`<ellipse cx="${f(rr(712, 888))}" cy="${f(rr(748, 760))}" rx="${f(rr(5, 10))}" ry="${f(rr(3, 5))}" fill="${pick(['#ff8a2a', '#ffb347', '#d9481c'])}"/>`);

    /* ---------- mantel shelf ---------- */
    add(`<rect x="540" y="326" width="520" height="34" rx="3" fill="url(#woodH)"/><rect x="540" y="326" width="520" height="5" fill="#a86b3a"/><rect x="552" y="358" width="496" height="8" fill="#3a1c0c"/>`);
    // candles (left & right trios)
    const candleSet = (xs) => xs.forEach(([x, h, c]) => {
      const top = 326 - h;
      add(`<rect x="${x - 15}" y="318" width="30" height="9" rx="2" fill="url(#gold)"/>`);
      add(`<rect x="${x - 11}" y="${top}" width="22" height="${h - 8}" rx="3" fill="${c || 'url(#candle)'}"/>`);
      add(`<path d="M${x - 11} ${top + 4} q4 14 0 22 q5 -6 6 -18Z" fill="#fffaf0" opacity=".8"/>`);
      add(`<path d="M${x} ${top} v-8" stroke="#2a1a10" stroke-width="2"/>`);
      add(`<circle cx="${x}" cy="${top - 16}" r="34" fill="url(#candleGlow)"/>`);
      candles.push({ x, y: top - 10, s: 1 });
    });
    candleSet([[566, 70], [592, 102, '#a8192a'], [618, 56]]);
    candleSet([[982, 56], [1008, 102, '#a8192a'], [1034, 70]]);
    // mantel garland swags
    const mh = [540, 670, 800, 930, 1060];
    for (let i = 0; i < mh.length - 1; i++) add(swag(mh[i], 340, (mh[i] + mh[i + 1]) / 2, 396, mh[i + 1], 340, { n: 14, r: 13, lights: true, lightEvery: 2, off: i * 3, bulb: 4.4, berries: true }));
    add(swag(530, 336, 800, 344, 1070, 336, { n: 30, r: 12 }));
    mh.slice(1, 4).forEach((x) => add(bow(x, 340, 0.7)));

    // stockings
    function stocking(x, fill, toe, heel) {
      const d = toe > 0
        ? `M${x - 30} 396 V476 Q${x - 32} 526 ${x + 6} 530 L${x + 44} 530 Q${x + 70} 530 ${x + 68} 506 Q${x + 66} 486 ${x + 40} 484 L${x + 30} 482 V396Z`
        : `M${x + 30} 396 V476 Q${x + 32} 526 ${x - 6} 530 L${x - 44} 530 Q${x - 70} 530 ${x - 68} 506 Q${x - 66} 486 ${x - 40} 484 L${x - 30} 482 V396Z`;
      let s = `<g filter="url(#shadow)"><path d="${d}" fill="${fill}"/>`;
      const tx = x + toe * 52;
      s += `<path d="M${tx - 18 * toe} 530 L${x + toe * 44} 530 Q${x + toe * 70} 530 ${x + toe * 68} 506 Q${x + toe * 66} 492 ${x + toe * 54} 486 Q${x + toe * 50} 512 ${tx - 18 * toe} 530Z" fill="${heel}"/>`;
      s += `<path d="M${x - 30 * toe} 500 Q${x - 30 * toe} 528 ${x - 8 * toe} 530 Q${x - 20 * toe} 516 ${x - 30 * toe} 500Z" fill="${heel}" opacity=".9"/>`;
      s += `<rect x="${x - 38}" y="370" width="76" height="32" rx="10" fill="#fbf7f0"/>`;
      for (let i = 0; i < 8; i++) s += `<circle cx="${x - 34 + i * 9.7}" cy="${400 + (i % 2) * 2}" r="5.5" fill="#fbf7f0"/>`;
      s += `<path d="M${x - 30} 378 q20 -4 56 0" stroke="#e2d8c6" stroke-width="2" fill="none"/>`;
      s += `<path d="M${x} 356 v16" stroke="#c9a24a" stroke-width="3"/><circle cx="${x}" cy="370" r="4" fill="url(#gold)"/></g>`;
      return s;
    }
    add(stocking(624, 'url(#stkStripe)', 1, '#1d6b43'));
    add(stocking(728, 'url(#stkArgyle)', -1, '#f6efe2'));
    add(stocking(872, 'url(#stkDots)', 1, '#b5162a'));
    add(stocking(976, '#b5162a', -1, '#1d6b43'));
    // a candy cane and a little bear peeking from stockings
    add(`<path d="M700 372 V330 q0 -14 12 -14 q12 0 12 14" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M700 372 V330 q0 -14 12 -14 q12 0 12 14" stroke="#c4222f" stroke-width="7" fill="none" stroke-dasharray="6 6" stroke-linecap="round"/>`);
    add(`<g transform="translate(890 354)"><circle cx="-12" cy="-14" r="7" fill="#9a6234"/><circle cx="12" cy="-14" r="7" fill="#9a6234"/><circle cx="0" cy="0" r="17" fill="#b07a45"/><ellipse cx="0" cy="6" rx="8" ry="6" fill="#e8c9a0"/><circle cx="-6" cy="-3" r="2" fill="#2a160a"/><circle cx="6" cy="-3" r="2" fill="#2a160a"/><circle cx="0" cy="4" r="2.4" fill="#2a160a"/></g>`);

    /* ---------- wreath above mantel ---------- */
    add(`<path d="M800 160 V176" stroke="#b3172b" stroke-width="5"/>`);
    let wr = '';
    for (let ring = 0; ring < 3; ring++) {
      const rad = 50 + ring * 12, n = 22 + ring * 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.2;
        wr += pine(800 + Math.cos(a) * rad, 246 + Math.sin(a) * rad, 12 - ring);
      }
    }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; wr += berries(800 + Math.cos(a) * 62, 246 + Math.sin(a) * 62); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; wr += bulb(800 + Math.cos(a) * 74, 246 + Math.sin(a) * 74, BULB[i % BULB.length], 3.8); }
    add(`<g filter="url(#shadow)">${wr}</g>`);
    add(bow(800, 316, 1.1));

    /* ---------- christmas tree ---------- */
    const cx = 302;
    const tiers = [[540, 772, 236], [420, 652, 208], [300, 530, 172], [190, 405, 132], [96, 282, 90]];
    // skirt
    add(`<ellipse cx="${cx}" cy="804" rx="230" ry="40" fill="#000" opacity=".35" filter="url(#soft)"/><ellipse cx="${cx}" cy="796" rx="224" ry="36" fill="#a3172a"/><ellipse cx="${cx}" cy="792" rx="204" ry="28" fill="#f4eee2"/><ellipse cx="${cx}" cy="792" rx="190" ry="24" fill="none" stroke="#a3172a" stroke-width="3" stroke-dasharray="10 8"/>`);
    add(`<rect x="${cx - 18}" y="740" width="36" height="52" fill="#4a2614"/>`);
    function tierPath(y0, y1, hw) {
      let d = `M${cx} ${y0} Q${f(cx - hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx - hw} ${y1}`;
      const n = Math.round(hw / 26), step = (2 * hw) / n;
      for (let i = 0; i < n; i++) {
        const x1 = cx - hw + step * (i + 1);
        d += ` Q${f(cx - hw + step * (i + 0.5))} ${y1 + 16} ${f(x1)} ${i < n - 1 ? y1 - 3 : y1}`;
      }
      d += ` Q${f(cx + hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${y0}Z`;
      return d;
    }
    const inTier = (x, y, t) => {
      const [y0, y1, hw] = t;
      if (y < y0 + (y1 - y0) * 0.3 || y > y1 - 8) return false;
      return Math.abs(x - cx) < hw * ((y - y0) / (y1 - y0)) * 0.86;
    };
    tiers.forEach((t, i) => {
      const [y0, y1, hw] = t;
      if (i > 0) add(`<path d="${tierPath(y0 + 12, y1 + 12, hw)}" fill="#000" opacity=".3" filter="url(#soft)"/>`);
      add(`<path d="${tierPath(y0, y1, hw)}" fill="url(#treeG)"/>`);
      let needles = '';
      for (let k = 0; k < hw * 2.2; k++) {
        const y = rr(y0 + (y1 - y0) * 0.15, y1 + 6);
        const span = hw * ((y - y0) / (y1 - y0));
        const x = cx + rr(-span, span) * 0.98;
        const dir = x < cx ? -1 : 1;
        const len = rr(10, 22);
        needles += `<path d="M${f(x)} ${f(y)} l${f(dir * len * 0.7)} ${f(len * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="${f(rr(1.6, 2.8))}" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
      }
      add(needles);
      // bead garland across the tier
      if (i < 4) {
        const ya = y0 + (y1 - y0) * 0.55, yb = y0 + (y1 - y0) * 0.85;
        const xa = cx - hw * 0.5, xb = cx + hw * 0.8;
        add(`<path d="M${f(xa)} ${f(ya)} Q${cx} ${f(yb + 30)} ${f(xb)} ${f(yb - 10)}" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`);
      }
    });
    // ornaments & lights inside tree
    const placed = [];
    const tryPlace = (minD, cond) => {
      for (let k = 0; k < 400; k++) {
        const t = tiers[Math.floor(R() * tiers.length)];
        const x = rr(cx - t[2], cx + t[2]), y = rr(t[0], t[1]);
        if (!inTier(x, y, t)) continue;
        if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue;
        if (cond && !cond(x, y)) continue;
        return [x, y];
      }
      return null;
    };
    const ornKeys = Object.keys(ornColors);
    for (let i = 0; i < 44; i++) {
      const p = tryPlace(22);
      if (!p) continue;
      const r = rr(9, 15);
      placed.push([p[0], p[1], r]);
      const k = ornKeys[i % ornKeys.length];
      add(`<path d="M${f(p[0])} ${f(p[1] - r - 4)} v-8" stroke="#c9a24a" stroke-width="1"/><rect x="${f(p[0] - 3.5)}" y="${f(p[1] - r - 5)}" width="7" height="6" rx="1" fill="url(#gold)"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#orn-${k})"/>`);
      if (i % 4 === 0) add(`<path d="M${f(p[0] - r)} ${f(p[1])} Q${f(p[0])} ${f(p[1] + r * 0.5)} ${f(p[0] + r)} ${f(p[1])}" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>`);
    }
    for (let i = 0; i < 6; i++) {
      const p = tryPlace(20);
      if (!p) continue;
      placed.push([p[0], p[1], 12]);
      const [x, y] = p;
      const cane = `M${f(x)} ${f(y + 18)} V${f(y - 6)} q0 -10 9 -10 q9 0 9 10`;
      add(`<path d="${cane}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${cane}" stroke="#c4222f" stroke-width="5" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`);
    }
    for (let i = 0; i < 90; i++) {
      const p = tryPlace(8);
      if (!p) continue;
      placed.push([p[0], p[1], 5]);
      add(bulb(p[0], p[1], BULB[i % BULB.length], 4));
    }
    // star
    const star = (x, y, ro, ri) => {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? ri : ro;
        d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r);
      }
      return d + 'Z';
    };
    add(`<circle cx="${cx}" cy="86" r="60" fill="url(#candleGlow)"/><path d="${star(cx, 88, 38, 16)}" fill="url(#gold)" stroke="#8a5a14" stroke-width="2"/><path d="${star(cx, 88, 18, 8)}" fill="#fff6c8" opacity=".7"/>`);

    // presents
    function gift(x, y, w, h, fill, rib, d = 14) {
      return `<g filter="url(#shadow)">
        <path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".18"/>
        <path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".28"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>
        <rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="${rib}"/>
        <path d="M${x + w / 2 - 7} ${y} l${d} ${-d * 0.6} h14 l${-d} ${d * 0.6}Z" fill="${rib}"/>
        <rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${rib}" opacity=".95"/>
        <path d="M${x + w} ${y + h / 2 - 6} l${d} ${-d * 0.6} v12 l${-d} ${d * 0.6}Z" fill="${rib}" opacity=".7"/>
      </g>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.75, rib, '#00000055')}`;
    }
    add(gift(92, 712, 110, 84, 'url(#giftStar)', '#e0b24a'));
    add(gift(374, 700, 120, 96, 'url(#giftStripe)', '#1d6b43'));
    add(gift(170, 770, 120, 92, '#b3172b', '#f0d07a'));
    add(gift(312, 790, 90, 72, 'url(#giftDots)', '#f6efe2'));
    add(gift(30, 818, 120, 80, '#d9a83a', '#a3172a'));
    add(gift(430, 800, 86, 66, '#5a2b7a', '#e9c060'));

    /* ---------- sleeping pup on the rug ---------- */
    add(`<g transform="translate(1040 880)">
      <ellipse cx="0" cy="22" rx="78" ry="12" fill="#000" opacity=".3"/>
      <path d="M-70 14 Q-74 -30 -10 -34 Q60 -36 70 4 Q72 22 40 22 L-56 22 Q-70 22 -70 14Z" fill="url(#pup)"/>
      <path d="M-30 -30 Q0 -40 40 -20 Q20 -6 -10 -10Z" fill="#6b3d1c" opacity=".7"/>
      <path d="M66 6 Q86 -2 82 -18" stroke="#9a6234" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M78 -14 q4 -6 2 -10" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="-70" cy="0" rx="32" ry="26" fill="url(#pup)"/>
      <path d="M-92 4 Q-100 6 -102 16 Q-90 22 -80 14Z" fill="#f4ead8"/>
      <ellipse cx="-102" cy="12" rx="6" ry="4.5" fill="#2a160a"/>
      <path d="M-56 -20 Q-38 -16 -40 14 Q-46 26 -56 16 Q-60 -4 -62 -12Z" fill="#6b3d1c"/>
      <path d="M-84 -6 q6 4 12 0" stroke="#2a160a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M-50 22 q-20 2 -36 -2 M-30 22 q-14 4 -24 2" stroke="#f4ead8" stroke-width="10" stroke-linecap="round"/>
      <path d="M-48 -26 Q-60 -40 -78 -24" stroke="#c4222f" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g>`);

    /* ---------- the banner (title ribbon) ---------- */
    add(`<g filter="url(#shadow)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#ribbonDark)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#ribbonDark)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#4a0711"/>
      <path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#4a0711"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#ribbon)"/>
      <path d="M528 86 Q800 30 1072 86" stroke="url(#gold)" stroke-width="3" fill="none"/>
      <path d="M528 140 Q800 84 1072 140" stroke="url(#gold)" stroke-width="3" fill="none"/>
      <path d="M528 92 Q800 36 1072 92" stroke="#f0c86a" stroke-width="1" fill="none" stroke-dasharray="2 5" opacity=".7"/>
    </g>`);

    /* ---------- lighting ---------- */
    add(`<rect width="${W}" height="${H}" fill="url(#fireLight)"/><rect width="${W}" height="${H}" fill="url(#vignette)"/>`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  A.designs.parlor = {
    id: 'parlor',
    name: 'Christmas Eve Parlor',
    blurb: 'A fireside sitting room with stockings, a twinkling tree and snow at the window.',
    width: W,
    height: H,
    palette: { frame: 'gold', glow: '#ffcf70' },
    build,
    // The title is set along the ribbon's centre line.
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, color: '#fff3d6', maxWidth: 440 },
    effects: [
      { type: 'roomGlow', x: 800, y: 640, r: 760 },
      { type: 'fire', arch: 'M660 766 V544 Q660 478 800 476 Q940 478 940 544 V766 Z', x0: 676, x1: 924, base: 744, height: 200, andirons: [[708, 758], [892, 758]], grate: [700, 742, 200, 6] },
      { type: 'snow', rect: [1186, 136, 248, 410], count: 70 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'star', x: 302, y: 88, r: 70 },
    ],
    // Door layout: src/layouts/parlor.js, generated by tools/layout.mjs from these zones.
    layout: 'parlor',
    keepOut: [[440, 18, 720, 172], [650, 466, 300, 306], [1180, 128, 262, 424]],
    day24: { x: 715, y: 170, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/parlor.js', e); }
/* ---- src/layouts/parlor.js ---- */
try {
/* Door layout for "Christmas Eve Parlor" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["parlor"]=[{"day":1,"x":65,"y":343,"w":138,"h":150,"hinge":"right"},
{"day":2,"x":989,"y":228,"w":90,"h":108,"hinge":"right"},
{"day":3,"x":484,"y":205,"w":128,"h":150,"hinge":"left"},
{"day":4,"x":253,"y":520,"w":140,"h":150,"hinge":"right"},
{"day":5,"x":808,"y":886,"w":114,"h":88,"hinge":"top"},
{"day":6,"x":208,"y":703,"w":128,"h":150,"hinge":"right"},
{"day":7,"x":1339,"y":786,"w":120,"h":150,"hinge":"left"},
{"day":8,"x":1056,"y":651,"w":102,"h":98,"hinge":"left"},
{"day":9,"x":46,"y":662,"w":128,"h":150,"hinge":"top"},
{"day":10,"x":1480,"y":175,"w":90,"h":114,"hinge":"top"},
{"day":11,"x":994,"y":521,"w":150,"h":118,"hinge":"top"},
{"day":12,"x":182,"y":42,"w":146,"h":150,"hinge":"left"},
{"day":13,"x":478,"y":820,"w":150,"h":148,"hinge":"right"},
{"day":14,"x":812,"y":333,"w":138,"h":114,"hinge":"left"},
{"day":15,"x":160,"y":204,"w":120,"h":110,"hinge":"left"},
{"day":16,"x":154,"y":875,"w":120,"h":98,"hinge":"left"},
{"day":17,"x":956,"y":761,"w":116,"h":150,"hinge":"right"},
{"day":18,"x":1452,"y":416,"w":90,"h":114,"hinge":"top"},
{"day":19,"x":507,"y":380,"w":138,"h":124,"hinge":"left"},
{"day":20,"x":1478,"y":765,"w":92,"h":114,"hinge":"top"},
{"day":21,"x":1228,"y":35,"w":108,"h":82,"hinge":"right"},
{"day":22,"x":545,"y":671,"w":94,"h":126,"hinge":"top"},
{"day":23,"x":1204,"y":624,"w":130,"h":150,"hinge":"right"},
{"day":24,"x":715,"y":170,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/parlor.js', e); }
/* ---- src/designs/aurora.js ---- */
try {
/* Design — "Northern Lights"
   Ribbons of green and violet light over a frozen lake, snowy mountains, a log cabin
   with a glowing window, a lit pine, a fox watching the sky from the snowbank. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(6061);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8'];

    function bulb(x, y, c, r = 4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/><circle cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.3)}" fill="#fff" opacity=".7"/>`;
    }
    /** Snowy pine silhouette. lit: 0..1 how much aurora light catches the left edges */
    function pine(x, base, h, col, snow, opts = {}) {
      const tiers = opts.tiers || 5;
      let s = `<rect x="${f(x - h * 0.025)}" y="${f(base - h * 0.08)}" width="${f(h * 0.05)}" height="${f(h * 0.09)}" fill="#1a0f08"/>`;
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers;
        const top = base - h + t * h * 0.78;
        const bot = top + h * 0.34;
        const w = h * (0.12 + t * 0.2);
        s += `<path d="M${f(x)} ${f(top)} L${f(x - w)} ${f(bot)} Q${f(x)} ${f(bot + h * 0.04)} ${f(x + w)} ${f(bot)}Z" fill="${col}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(top + 2)} L${f(x - w * 0.82)} ${f(bot - 3)} Q${f(x - w * 0.3)} ${f(bot - h * 0.05)} ${f(x + w * 0.1)} ${f(bot - h * 0.09)} Q${f(x + w * 0.45)} ${f(bot - h * 0.02)} ${f(x + w * 0.8)} ${f(bot - 4)} L${f(x)} ${f(top + 2)}Z" fill="${snow}" opacity=".92"/>`;
      }
      return s;
    }

    /* ---------- defs ---------- */
    add(`<defs>
      <linearGradient id="au-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#01050d"/><stop offset=".4" stop-color="#05132a"/><stop offset=".75" stop-color="#0c2b45"/><stop offset="1" stop-color="#1f5664"/></linearGradient>
      <linearGradient id="au-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5dffb0" stop-opacity="0"/><stop offset=".78" stop-color="#5dffb0" stop-opacity=".55"/><stop offset="1" stop-color="#b8ffe0" stop-opacity="0"/></linearGradient>
      <linearGradient id="au-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fd8ff" stop-opacity="0"/><stop offset=".8" stop-color="#4fd8ff" stop-opacity=".4"/><stop offset="1" stop-color="#4fd8ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="au-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47cff" stop-opacity="0"/><stop offset=".5" stop-color="#b77cff" stop-opacity=".35"/><stop offset="1" stop-color="#5dffb0" stop-opacity="0"/></linearGradient>
      <linearGradient id="au-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18405a"/><stop offset=".5" stop-color="#0f2c44"/><stop offset="1" stop-color="#1d4660"/></linearGradient>
      <linearGradient id="au-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f2fb"/><stop offset=".55" stop-color="#bcd2e6"/><stop offset="1" stop-color="#8fa9c4"/></linearGradient>
      <linearGradient id="au-snowLit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6fbe9"/><stop offset="1" stop-color="#bfd6ea"/></linearGradient>
      <linearGradient id="au-mtnFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d6688"/><stop offset="1" stop-color="#173252"/></linearGradient>
      <linearGradient id="au-mtnNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22415f"/><stop offset="1" stop-color="#0c1d33"/></linearGradient>
      <linearGradient id="au-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a26"/><stop offset="1" stop-color="#4a2a14"/></linearGradient>
      <linearGradient id="au-plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d4c27"/><stop offset=".5" stop-color="#5e3519"/><stop offset="1" stop-color="#47270f"/></linearGradient>
      <radialGradient id="au-win" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffb04d" stop-opacity="0"/></radialGradient>
      <radialGradient id="au-fox" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f0893a"/><stop offset="1" stop-color="#a84a14"/></radialGradient>
      <radialGradient id="au-vig" cx="800" cy="480" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#00030a" stop-opacity=".6"/></radialGradient>
      <radialGradient id="au-horizon" cx="800" cy="600" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5dffb0" stop-opacity=".16"/><stop offset="1" stop-color="#5dffb0" stop-opacity="0"/></radialGradient>
      <filter id="au-blur" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="au-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="au-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
      <clipPath id="au-lake"><rect x="0" y="598" width="${W}" height="170"/></clipPath>
    </defs>`);

    /* ---------- sky, stars ---------- */
    add(`<rect width="${W}" height="620" fill="url(#au-sky)"/>`);
    let stars = '';
    for (let i = 0; i < 320; i++) stars += `<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 580))}" r="${f(rr(0.4, 1.5))}" fill="#fff" opacity="${f(rr(0.25, 0.9))}"/>`;
    // milky way haze
    for (let i = 0; i < 260; i++) { const t = R(); stars += `<circle cx="${f(t * W)}" cy="${f(60 + t * 300 + rr(-40, 40))}" r="${f(rr(0.3, 1))}" fill="#dfe9ff" opacity="${f(rr(0.2, 0.6))}"/>`; }
    add(stars);
    add(`<path d="M0 90 Q800 260 1600 420 L1600 470 Q800 320 0 150Z" fill="#9fb8ff" opacity=".05" filter="url(#au-blur)"/>`);
    for (let i = 0; i < 34; i++) {
      const x = rr(20, W - 20), y = rr(20, 520);
      add(`<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="#fff"/>`);
      lights.push({ x, y, c: '#e8f4ff', r: 1.7 });
    }

    /* ---------- static aurora (the board animates more on top) ---------- */
    function band(base, amp, height, grad, phase, step = 5) {
      let s = '';
      for (let x = -30; x < W + 30; x += step) {
        const y = base + Math.sin(x / 210 + phase) * amp + Math.sin(x / 77 + phase * 2) * amp * 0.3;
        const h = height * (0.65 + 0.35 * Math.sin(x / 95 + phase * 3));
        s += `<rect x="${x}" y="${f(y - h)}" width="${step + 1}" height="${f(h + 14)}" fill="url(#${grad})"/>`;
      }
      return s;
    }
    add(`<g filter="url(#au-blur)" id="au-curtains">
      ${band(330, 70, 230, 'au-g', 0.4)}
      ${band(260, 60, 170, 'au-t', 2.1, 6)}
      ${band(220, 80, 160, 'au-v', 4.2, 7)}
      ${band(400, 40, 120, 'au-g', 5.6, 6)}
    </g>`);
    add(`<rect width="${W}" height="620" fill="url(#au-horizon)"/>`);

    /* ---------- mountains ---------- */
    function range(baseY, peaks, fill, capFill, seedAmp) {
      let d = `M-20 ${baseY}`, caps = '';
      peaks.forEach(([x, y]) => {
        d += ` L${f(x - rr(40, 90))} ${f(y + rr(50, 90))} L${f(x)} ${f(y)} L${f(x + rr(40, 90))} ${f(y + rr(40, 90))}`;
        const cw = rr(28, 50) * seedAmp;
        caps += `<path d="M${f(x)} ${f(y)} L${f(x - cw)} ${f(y + cw * 0.9)} L${f(x - cw * 0.45)} ${f(y + cw * 0.7)} L${f(x - cw * 0.2)} ${f(y + cw * 1.05)} L${f(x + cw * 0.15)} ${f(y + cw * 0.7)} L${f(x + cw * 0.6)} ${f(y + cw * 0.95)}Z" fill="${capFill}"/>`;
      });
      d += ` L${W + 20} ${baseY} V620 H-20Z`;
      return `<path d="${d}" fill="${fill}"/>${caps}`;
    }
    add(range(600, [[90, 455], [300, 420], [520, 470], [700, 430], [940, 460], [1150, 410], [1380, 450], [1560, 430]], 'url(#au-mtnFar)', '#cfe6f7', 1.2));
    add(range(610, [[190, 505], [430, 520], [640, 500], [860, 530], [1060, 505], [1280, 525], [1470, 500]], 'url(#au-mtnNear)', '#9ec3dd', 0.8));
    // distant treeline
    let tl = '';
    for (let x = -10; x < W + 10; x += rr(10, 18)) tl += pine(x, 606, rr(18, 40), '#081626', null, { tiers: 3 });
    add(tl);
    add(`<rect y="598" width="${W}" height="8" fill="#cfe2f2" opacity=".7"/>`);

    /* ---------- frozen lake with reflections ---------- */
    add(`<rect y="602" width="${W}" height="170" fill="url(#au-ice)"/>`);
    add(`<g clip-path="url(#au-lake)" opacity=".38"><use href="#au-curtains" transform="translate(0 1205) scale(1 -1)"/></g>`);
    add(`<g clip-path="url(#au-lake)" opacity=".35" transform="translate(0 1210) scale(1 -1)">${range(600, [[90, 455], [300, 420], [520, 470], [700, 430], [940, 460], [1150, 410], [1380, 450], [1560, 430]], '#1a3654', '#6d8fae', 1.2)}</g>`);
    let glints = '';
    for (let i = 0; i < 60; i++) glints += `<rect x="${f(rr(0, W))}" y="${f(rr(610, 765))}" width="${f(rr(20, 140))}" height="${f(rr(0.8, 2))}" fill="#e3fff3" opacity="${f(rr(0.08, 0.3))}"/>`;
    for (let i = 0; i < 10; i++) { const x = rr(0, W), y = rr(640, 760); glints += `<path d="M${f(x)} ${f(y)} l${f(rr(20, 60))} ${f(rr(-6, 6))} l${f(rr(10, 40))} ${f(rr(-8, 8))}" stroke="#d9f0ff" stroke-width="1" opacity=".25" fill="none"/>`; }
    add(glints);
    // a reindeer on the far shore
    add(`<g transform="translate(1440 602)" fill="#07121f">
      <ellipse cx="0" cy="-16" rx="18" ry="8"/><rect x="-14" y="-12" width="3" height="14"/><rect x="-8" y="-12" width="3" height="14"/><rect x="8" y="-12" width="3" height="14"/><rect x="13" y="-12" width="3" height="14"/>
      <path d="M14 -20 L22 -34 L28 -32 L22 -18Z"/><ellipse cx="27" cy="-34" rx="6" ry="4"/>
      <path d="M24 -37 l-4 -10 l-4 2 M24 -38 l0 -12 M26 -38 l6 -9 l4 3 M28 -37 l7 -4" stroke="#07121f" stroke-width="1.6" fill="none"/>
    </g>`);
    add(`<g transform="translate(1440 604) scale(1 -1)" fill="#07121f" opacity=".3"><ellipse cx="0" cy="-16" rx="18" ry="8"/><path d="M14 -20 L22 -34 L28 -32 L22 -18Z"/></g>`);

    /* ---------- cabin ---------- */
    add(`<ellipse cx="1150" cy="752" rx="200" ry="34" fill="url(#au-win)" opacity=".8"/>`);
    add(`<g filter="url(#au-shadow)">
      <rect x="1068" y="652" width="170" height="96" fill="url(#au-log)"/>
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="1064" y="${656 + i * 13}" width="178" height="11" rx="5.5" fill="${i % 2 ? '#6b3f1f' : '#5c3518'}"/><circle cx="1066" cy="${661.5 + i * 13}" r="5" fill="#c48d55"/><circle cx="1240" cy="${661.5 + i * 13}" r="5" fill="#b07c48"/>`).join('')}
      <rect x="1196" y="586" width="20" height="50" fill="#4d3a33"/><rect x="1192" y="580" width="28" height="9" fill="#5a463e"/><path d="M1192 581 q14 -10 28 0Z" fill="#f2f8ff"/>
      <path d="M1046 660 L1153 590 L1260 660 L1250 668 L1153 604 L1056 668Z" fill="#3a2414"/>
      <path d="M1040 662 Q1050 650 1060 656 L1153 594 L1246 656 Q1258 650 1266 662 Q1258 672 1248 666 L1153 606 L1058 666 Q1046 672 1040 662Z" fill="#f4f9ff"/>
      <path d="M1060 664 q4 10 2 16 M1100 640 q4 10 2 14 M1210 642 q3 10 0 16 M1245 664 q3 8 0 14" stroke="#e8f2fb" stroke-width="4" stroke-linecap="round" fill="none"/>
      <rect x="1088" y="678" width="42" height="36" fill="#ffcf6e"/><path d="M1109 678 v36 M1088 696 h42" stroke="#5a3218" stroke-width="3"/><rect x="1085" y="675" width="48" height="42" fill="none" stroke="#3a2010" stroke-width="4"/>
      <path d="M1084 716 h50" stroke="#f4f9ff" stroke-width="5" stroke-linecap="round"/>
      <rect x="1166" y="680" width="34" height="68" fill="#4a2a14" stroke="#2a160a" stroke-width="3"/><circle cx="1192" cy="716" r="2.5" fill="#d9a83a"/>
      <circle cx="1183" cy="668" r="10" fill="none" stroke="#1d5a34" stroke-width="5"/><circle cx="1183" cy="678" r="3" fill="#b3172b"/>
    </g>`);
    lights.push({ x: 1109, y: 696, c: '#ffc46b', r: 6 });
    // string lights along the eaves
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = 1058 + t * 95, y = 668 - t * 64;
      add(bulb(x, y + 4, BULB[i % BULB.length], 3));
      const x2 = 1153 + t * 93, y2 = 604 + t * 62;
      add(bulb(x2, y2 + 8, BULB[(i + 3) % BULB.length], 3));
    }
    // woodpile + lantern
    add(`<g>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${1250 + c * 12 + r * 6}" cy="${742 - r * 11}" r="6" fill="#8a5a30" stroke="#5a3218" stroke-width="2"/>`).join('')).join('')}<path d="M1244 712 q30 -8 52 4" stroke="#f4f9ff" stroke-width="5" fill="none" stroke-linecap="round"/></g>`);

    /* ---------- the lit pine (day 24) ---------- */
    add(`<ellipse cx="860" cy="768" rx="90" ry="14" fill="#000" opacity=".25" filter="url(#au-soft)"/>`);
    add(`<g>${pine(860, 770, 210, '#123a26', '#e4f1fb', { tiers: 6 })}</g>`);
    for (let i = 0; i < 26; i++) {
      const t = rr(0.18, 0.95), y = 570 + t * 190, span = 12 + t * 72;
      add(bulb(860 + rr(-span, span), y, BULB[i % BULB.length], 3.6));
    }
    const star = (x, y, ro, ri) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); } return d + 'Z'; };
    add(`<path d="${star(860, 556, 20, 8)}" fill="#ffe08a" stroke="#a87a1c" stroke-width="1.5"/>`);

    /* ---------- foreground snow banks, big pines ---------- */
    add(`<path d="M0 772 Q200 740 420 770 Q620 796 800 776 Q1000 752 1220 774 Q1420 794 1600 762 V1000 H0Z" fill="url(#au-snow)"/>`);
    add(`<path d="M0 772 Q200 740 420 770 Q620 796 800 776 Q1000 752 1220 774 Q1420 794 1600 762" stroke="#f6fbff" stroke-width="5" fill="none" opacity=".9"/>`);
    add(`<path d="M0 860 Q260 820 520 856 Q760 890 1000 862 Q1260 832 1600 870 V1000 H0Z" fill="#d7e6f3"/><path d="M0 860 Q260 820 520 856 Q760 890 1000 862 Q1260 832 1600 870" stroke="#fff" stroke-width="4" fill="none" opacity=".8"/>`);
    // blue shadows + sparkle
    let sp = '';
    for (let i = 0; i < 18; i++) sp += `<ellipse cx="${f(rr(0, W))}" cy="${f(rr(800, 990))}" rx="${f(rr(40, 140))}" ry="${f(rr(4, 10))}" fill="#7f9cc0" opacity="${f(rr(0.12, 0.25))}"/>`;
    for (let i = 0; i < 90; i++) sp += `<circle cx="${f(rr(0, W))}" cy="${f(rr(780, 995))}" r="${f(rr(0.6, 1.6))}" fill="#fff" opacity="${f(rr(0.4, 1))}"/>`;
    add(sp);
    // footprints from cabin toward the fox
    let fp = '';
    for (let i = 0; i < 14; i++) { const t = i / 13; const x = 1150 - t * 680 + (i % 2 ? 8 : -8), y = 790 + Math.sin(t * 3) * 20 + t * 60; fp += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="5" ry="3" fill="#8ea8c6" opacity=".55"/>`; }
    add(fp);
    // big pines
    const bigL = [[70, 990, 430], [210, 1000, 360], [330, 990, 260], [20, 900, 300]];
    const bigR = [[1530, 990, 440], [1400, 1000, 350], [1290, 990, 250], [1590, 890, 280]];
    [...bigL, ...bigR].sort((a, b) => a[1] - b[1]).forEach(([x, base, h]) => add(pine(x, base, h, '#0c2a1c', '#e8f3fc', { tiers: 6 })));
    // aurora rim light on big pines
    add(`<rect width="${W}" height="${H}" fill="url(#au-horizon)" opacity=".5"/>`);

    /* ---------- fox ---------- */
    add(`<g transform="translate(470 846)" filter="url(#au-shadow)">
      <path d="M30 18 Q90 22 96 -6 Q100 -26 82 -24 Q90 -6 60 4 Q40 10 26 6Z" fill="url(#au-fox)"/>
      <path d="M86 -22 Q100 -26 96 -8 Q90 -14 86 -22Z" fill="#fff"/>
      <path d="M-20 18 Q-26 -24 0 -40 Q26 -46 34 -16 Q40 10 30 20Z" fill="url(#au-fox)"/>
      <path d="M-8 18 Q-10 -12 4 -22 Q12 -6 12 18Z" fill="#fbeee0"/>
      <path d="M-10 -36 Q-14 -60 6 -74 Q24 -78 28 -60 Q30 -44 14 -36Z" fill="url(#au-fox)"/>
      <path d="M-8 -64 L-12 -92 L4 -72Z M14 -74 L22 -100 L28 -70Z" fill="#c45a1c"/>
      <path d="M-6 -68 L-9 -86 L1 -72Z M16 -74 L21 -92 L24 -72Z" fill="#2a160a"/>
      <path d="M24 -60 Q44 -64 46 -54 Q40 -48 26 -48Z" fill="#fbeee0"/><circle cx="46" cy="-56" r="3" fill="#1a0c06"/>
      <path d="M12 -62 q5 -3 9 1" stroke="#1a0c06" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M-14 18 h14 M14 18 h14" stroke="#2a160a" stroke-width="5" stroke-linecap="round"/>
      <path d="M-12 -40 Q-16 -60 -2 -72" stroke="#ffd9b0" stroke-width="2" opacity=".5" fill="none"/>
    </g>`);

    /* ---------- the sign (title) ---------- */
    add(`<g filter="url(#au-shadow)">
      <rect x="592" y="900" width="16" height="96" fill="#4a2a14"/><rect x="992" y="900" width="16" height="96" fill="#4a2a14"/>
      <rect x="566" y="864" width="468" height="88" rx="10" fill="url(#au-plank)"/>
      <path d="M570 893 H1030 M570 922 H1030" stroke="#3a1f0c" stroke-width="2.5" opacity=".7"/>
      <rect x="576" y="874" width="448" height="68" rx="6" fill="none" stroke="#c9a24a" stroke-width="2.5" opacity=".75"/>
      <path d="M562 866 Q600 850 650 860 Q720 846 800 858 Q880 846 950 860 Q1000 850 1038 866 Q1040 874 1030 872 Q980 864 930 870 Q860 862 800 868 Q740 862 670 870 Q610 864 570 872 Q558 874 562 866Z" fill="#f6fbff"/>
    </g>`);
    [[572, 880], [1028, 880]].forEach(([x, y], k) => {
      let s = '';
      for (let i = 0; i < 9; i++) { const a = (k ? Math.PI : 0) + rr(-1.2, 1.2); s += `<path d="M${x} ${y} l${f(Math.cos(a) * rr(16, 30))} ${f(Math.sin(a) * rr(12, 24))}" stroke="${pick(['#2f7344', '#3d8a52', '#235c37'])}" stroke-width="4" stroke-linecap="round"/>`; }
      s += `<circle cx="${x}" cy="${y}" r="5" fill="#b3122a"/><circle cx="${x + (k ? -7 : 7)}" cy="${y + 4}" r="4.5" fill="#b3122a"/><circle cx="${x + (k ? -2 : 2)}" cy="${y - 6}" r="4" fill="#c4182f"/>`;
      add(s);
    });

    add(`<rect width="${W}" height="${H}" fill="url(#au-vig)"/>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  A.designs.aurora = {
    id: 'aurora',
    name: 'Northern Lights',
    blurb: 'Ribbons of green light over a frozen lake, a cabin and a fox watching the sky.',
    width: W,
    height: H,
    build,
    title: { path: 'M606 921 L994 921', size: 40, maxWidth: 400, fill: '#fff4dc', stroke: '#3a1f0e' },
    numStyles: ['n-cream', 'n-tag', 'n-swash', 'n-red', 'n-cream'],
    effects: [
      { type: 'aurora', rect: [0, 30, 1600, 570], colors: ['80,255,170', '90,210,255', '180,120,255'], a: 0.22 },
      { type: 'aurora', rect: [0, 604, 1600, 160], colors: ['80,255,170', '90,210,255'], a: 0.06 },
      { type: 'twinkle' },
      { type: 'glow', x: 1110, y: 700, r: 140, color: '255,190,100', a: 0.28, speed: 1.3 },
      { type: 'smoke', x: 1206, y: 578, rate: 2, rise: 16, size: 8, color: '205,215,235', a: 0.28 },
      { type: 'star', x: 860, y: 556, r: 46 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 70, a: 0.65 },
    ],
    layout: 'aurora',
    keepOut: [[440, 110, 720, 190], [556, 852, 488, 122], [1060, 576, 200, 176]],
    minDoor: 92,
    day24: { x: 775, y: 600, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/aurora.js', e); }
/* ---- src/layouts/aurora.js ---- */
try {
/* Door layout for "Northern Lights" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["aurora"]=[{"day":1,"x":1428,"y":548,"w":132,"h":150,"hinge":"top"},
{"day":2,"x":148,"y":886,"w":96,"h":88,"hinge":"left"},
{"day":3,"x":181,"y":511,"w":150,"h":126,"hinge":"left"},
{"day":4,"x":950,"y":438,"w":138,"h":124,"hinge":"top"},
{"day":5,"x":957,"y":27,"w":102,"h":78,"hinge":"right"},
{"day":6,"x":516,"y":530,"w":150,"h":132,"hinge":"left"},
{"day":7,"x":196,"y":330,"w":148,"h":150,"hinge":"right"},
{"day":8,"x":1274,"y":623,"w":118,"h":132,"hinge":"top"},
{"day":9,"x":1354,"y":777,"w":110,"h":132,"hinge":"right"},
{"day":10,"x":1092,"y":775,"w":122,"h":150,"hinge":"right"},
{"day":11,"x":67,"y":649,"w":108,"h":90,"hinge":"right"},
{"day":12,"x":1255,"y":331,"w":150,"h":134,"hinge":"left"},
{"day":13,"x":517,"y":426,"w":108,"h":84,"hinge":"top"},
{"day":14,"x":562,"y":681,"w":108,"h":126,"hinge":"left"},
{"day":15,"x":322,"y":37,"w":112,"h":150,"hinge":"left"},
{"day":16,"x":914,"y":763,"w":96,"h":84,"hinge":"left"},
{"day":17,"x":287,"y":754,"w":150,"h":116,"hinge":"left"},
{"day":18,"x":113,"y":41,"w":78,"h":102,"hinge":"left"},
{"day":19,"x":805,"y":342,"w":120,"h":150,"hinge":"left"},
{"day":20,"x":245,"y":201,"w":94,"h":114,"hinge":"right"},
{"day":21,"x":1175,"y":70,"w":150,"h":120,"hinge":"right"},
{"day":22,"x":1280,"y":202,"w":144,"h":114,"hinge":"right"},
{"day":23,"x":52,"y":354,"w":118,"h":144,"hinge":"top"},
{"day":24,"x":775,"y":600,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/aurora.js', e); }
/* ---- src/designs/cabin.js ---- */
try {
/* Design — "Cabin in the Pines"
   A log cabin deep in snowy pines on a moonlit night: glowing windows, a lantern on the
   porch, a red sled and boots by the door, a stacked woodpile, smoke from the stone
   chimney and a fox watching from the snow. The title hangs on a carved wooden sign. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  const CHIMNEY = [968, 352]; // top of the stone chimney (smoke source)

  function build() {
    const R = A.util.rng(2411);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff6b5a', '#7ad1ff', '#9dff8a', '#fff1b8', '#ff9be3'];

    const bulb = (x, y, c, r = 3.4) => {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".25"/><rect x="${f(x - 1.5)}" y="${f(y - r - 3)}" width="3" height="3" fill="#222"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/>`;
    };
    const pine = (x, base, h, dark, snow, lit) => {
      let s = `<rect x="${f(x - h * 0.025)}" y="${f(base - h * 0.08)}" width="${f(h * 0.05)}" height="${f(h * 0.1)}" fill="#24160f"/>`;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const ty = base - h + (i * h) / (n + 0.4), by = ty + h * 0.3, w = h * (0.1 + i * 0.065);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(by)} Q${f(x - w * 0.5)} ${f(by - h * 0.025)} ${f(x)} ${f(by + h * 0.01)} Q${f(x + w * 0.5)} ${f(by - h * 0.025)} ${f(x + w)} ${f(by)}Z" fill="${dark}"/>`;
        s += `<path d="M${f(x - w * 0.95)} ${f(by - 1)} Q${f(x - w * 0.55)} ${f(by - h * 0.05)} ${f(x - w * 0.1)} ${f(by - h * 0.02)} M${f(x + w * 0.2)} ${f(by - h * 0.02)} Q${f(x + w * 0.6)} ${f(by - h * 0.05)} ${f(x + w * 0.95)} ${f(by - 1)}" stroke="${snow}" stroke-width="${f(Math.max(2, h * 0.016))}" fill="none" stroke-linecap="round"/>`;
      }
      s += `<path d="M${f(x)} ${f(base - h)} l${f(-h * 0.03)} ${f(h * 0.06)} h${f(h * 0.06)}Z" fill="${snow}"/>`;
      if (lit) for (let k = 0; k < 14; k++) { const t = (k + 0.5) / 14, yy = base - h + t * h * 0.9, hw = h * (0.08 + t * 0.32); s += bulb(x + Math.sin(k * 2.4) * hw * 0.7, yy, BULB[k % BULB.length], 3); }
      return s;
    };

    add(`<defs>
      <linearGradient id="cb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040a1e"/><stop offset=".5" stop-color="#10234a"/><stop offset=".85" stop-color="#2a4676"/><stop offset="1" stop-color="#3e5a8a"/></linearGradient>
      <radialGradient id="cb-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8" stop-opacity=".6"/><stop offset=".35" stop-color="#dfe8ff" stop-opacity=".16"/><stop offset="1" stop-color="#dfe8ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="cb-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset=".5" stop-color="#6b4024"/><stop offset="1" stop-color="#4a2a16"/></linearGradient>
      <linearGradient id="cb-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset="1" stop-color="#ffa847"/></linearGradient>
      <radialGradient id="cb-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
      <linearGradient id="cb-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d8f2"/><stop offset="1" stop-color="#eef3ff"/></linearGradient>
      <linearGradient id="cb-plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a3c"/><stop offset=".5" stop-color="#7a4e2a"/><stop offset="1" stop-color="#5a3618"/></linearGradient>
      <pattern id="cb-stone" width="40" height="28" patternUnits="userSpaceOnUse"><rect width="40" height="28" fill="#4a4a56"/><rect x="2" y="2" width="20" height="11" rx="4" fill="#77778a"/><rect x="24" y="2" width="14" height="11" rx="4" fill="#6a6a7c"/><rect x="2" y="15" width="12" height="11" rx="4" fill="#6a6a7c"/><rect x="16" y="15" width="22" height="11" rx="4" fill="#808094"/></pattern>
      <radialGradient id="cb-vig" cx="800" cy="540" r="980" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#02050f" stop-opacity=".6"/></radialGradient>
      <filter id="cb-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
      <filter id="cb-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>`);

    /* sky, stars, moon, mountains */
    add(`<rect width="${W}" height="${H}" fill="url(#cb-sky)"/>`);
    for (let i = 0; i < 180; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 460))}" r="${f(rr(0.4, 1.6))}" fill="#fff" opacity="${f(rr(0.3, 0.95))}"/>`);
    for (let i = 0; i < 16; i++) { const x = rr(40, W - 40), y = rr(170, 420); lights.push({ x, y, c: '#e8f0ff', r: 1.4 }); }
    add(`<circle cx="1350" cy="160" r="170" fill="url(#cb-moon)"/><circle cx="1350" cy="160" r="54" fill="#fbf6e2"/><circle cx="1334" cy="146" r="10" fill="#e6dec4" opacity=".7"/><circle cx="1366" cy="176" r="7" fill="#e6dec4" opacity=".7"/><circle cx="1352" cy="134" r="5" fill="#e6dec4" opacity=".6"/>`);
    add(`<path d="M0 480 L140 400 L260 450 L400 360 L540 450 L660 400 L800 470 L940 380 L1080 450 L1220 390 L1360 460 L1480 410 L1600 450 V620 H0Z" fill="#3c5684"/>
      <path d="M140 400 L180 424 L150 420 L130 430 L110 418Z M400 360 L450 400 L410 392 L390 404 L360 392Z M940 380 L990 418 L950 410 L925 422 L900 410Z M1220 390 L1260 416 L1225 410 L1200 420Z" fill="#dfe8fb" opacity=".9"/>`);

    /* forest layers */
    for (let i = 0; i < 40; i++) add(pine(rr(-20, W + 20), rr(560, 600), rr(70, 120), '#1c3046', '#a9bde0'));
    add(`<path d="M0 590 Q400 560 800 586 Q1200 610 1600 580 V1000 H0Z" fill="url(#cb-snow)"/>`);
    for (let i = 0; i < 22; i++) { const x = rr(-20, W + 20); if (x > 520 && x < 1080) continue; add(pine(x, rr(620, 680), rr(150, 230), '#15283a', '#dfe8fb')); }

    /* the cabin */
    const cx = 800, wallTop = 520, ground = 770, left = 560, right = 1040;
    // stone chimney (behind the roof)
    add(`<rect x="940" y="${CHIMNEY[1]}" width="56" height="${ground - CHIMNEY[1]}" fill="url(#cb-stone)"/><rect x="934" y="${CHIMNEY[1] - 10}" width="68" height="16" rx="5" fill="#eef3ff"/>`);
    add(`<g filter="url(#cb-shadow)">`);
    // log wall
    for (let y = wallTop; y < ground; y += 26) {
      add(`<rect x="${left}" y="${y}" width="${right - left}" height="26" rx="12" fill="url(#cb-log)"/><path d="M${left + 10} ${y + 22} H${right - 10}" stroke="#3a2010" stroke-width="2" opacity=".6"/>`);
      [left - 8, right + 8].forEach((ex) => add(`<circle cx="${ex}" cy="${y + 13}" r="13" fill="#b07a48"/><circle cx="${ex}" cy="${y + 13}" r="8" fill="none" stroke="#7a4e2a" stroke-width="2"/><circle cx="${ex}" cy="${y + 13}" r="3" fill="#7a4e2a"/>`));
    }
    // gable logs
    for (let y = 520 - 26, k = 1; y > 400; y -= 26, k++) { const inset = k * 38; add(`<rect x="${left + inset}" y="${y}" width="${right - left - inset * 2}" height="26" rx="12" fill="url(#cb-log)"/>`); }
    add(`<circle cx="${cx}" cy="470" r="22" fill="url(#cb-win)" stroke="#3a2010" stroke-width="5"/><path d="M${cx} 448 v44 M${cx - 22} 470 h44" stroke="#3a2010" stroke-width="3"/>`);
    // roof + heavy snow + icicles
    add(`<path d="M500 540 L${cx} 360 L1100 540 L1086 556 L${cx} 386 L514 556Z" fill="#3a2a22"/>`);
    add(`<path d="M484 546 Q478 524 500 520 L${cx} 340 L1100 520 Q1122 524 1116 546 Q1100 556 1086 548 L${cx} 382 L514 548 Q500 556 484 546Z" fill="#f2f6ff"/>`);
    add(`<path d="M520 536 L${cx} 368" stroke="#c9d6f0" stroke-width="4" opacity=".8"/>`);
    for (let i = 0; i < 26; i++) { const t = i / 25, x = 510 + t * 580, y = 548 - (1 - Math.abs(t - 0.5) * 2) * 0 + 4; add(`<path d="M${f(x - 3)} ${f(y)} L${f(x)} ${f(y + rr(10, 30))} L${f(x + 3)} ${f(y)}Z" fill="#dff0ff" opacity=".9"/>`); }
    add(`</g>`);
    // windows with curtains and candles
    [[640, 600], [900, 600]].forEach(([wx, wy]) => {
      add(`<circle cx="${wx + 40}" cy="${wy + 45}" r="110" fill="url(#cb-warm)"/>`);
      add(`<rect x="${wx}" y="${wy}" width="80" height="90" fill="url(#cb-win)"/><path d="M${wx} ${wy} q14 40 4 90 h-4Z M${wx + 80} ${wy} q-14 40 -4 90 h4Z" fill="#a3172a"/>`);
      add(`<rect x="${wx}" y="${wy}" width="80" height="90" fill="none" stroke="#3a2010" stroke-width="7"/><path d="M${wx + 40} ${wy} v90 M${wx} ${wy + 45} h80" stroke="#3a2010" stroke-width="4"/>`);
      add(`<rect x="${wx - 8}" y="${wy + 90}" width="96" height="10" fill="#5a3618"/><path d="M${wx - 10} ${wy + 92} q48 -10 100 0" stroke="#f2f6ff" stroke-width="6" fill="none" stroke-linecap="round"/>`);
      add(`<rect x="${wx + 36}" y="${wy + 66}" width="8" height="20" rx="1" fill="#fbf4e2"/>`);
      candles.push({ x: wx + 40, y: wy + 64, s: 0.6 });
      // window-box greenery
      for (let k = 0; k < 8; k++) add(`<circle cx="${wx - 2 + k * 12}" cy="${wy + 100}" r="7" fill="${k % 2 ? '#1f4a2c' : '#2c6038'}"/>`);
      add(`<circle cx="${wx + 20}" cy="${wy + 100}" r="3" fill="#c4222f"/><circle cx="${wx + 58}" cy="${wy + 102}" r="3" fill="#c4222f"/>`);
    });
    // door + wreath
    add(`<rect x="${cx - 44}" y="610" width="88" height="160" fill="#4a2410"/><path d="M${cx - 44} 610 h88 v160 h-88Z M${cx} 610 v160 M${cx - 44} 660 h88 M${cx - 44} 715 h88" stroke="#2a1408" stroke-width="4" fill="none"/><circle cx="${cx + 30}" cy="700" r="4" fill="#d1a14a"/>`);
    let wr = ''; for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.28; wr += `<circle cx="${f(cx + Math.cos(a) * 20)}" cy="${f(648 + Math.sin(a) * 20)}" r="8" fill="${k % 2 ? '#1f4a2c' : '#2c6038'}"/>`; }
    add(wr + `<path d="M${cx - 8} 668 l8 -6 l8 6 l-4 14 h-8Z" fill="#b3172b"/><circle cx="${cx - 10}" cy="638" r="3" fill="#c4222f"/><circle cx="${cx + 14}" cy="644" r="3" fill="#c4222f"/>`);
    // porch roof, posts and steps
    add(`<g filter="url(#cb-shadow)"><path d="M680 582 H920 L944 604 H656Z" fill="#5a3618"/><path d="M672 580 Q800 566 928 580 L946 600 Q800 590 654 600Z" fill="#f2f6ff"/>
      <rect x="664" y="604" width="12" height="166" fill="#6b4024"/><rect x="924" y="604" width="12" height="166" fill="#6b4024"/>
      <rect x="700" y="770" width="200" height="14" fill="#7a4e2a"/><rect x="716" y="784" width="168" height="14" fill="#6b4024"/><path d="M698 768 Q800 760 902 768 M714 782 Q800 776 886 782" stroke="#f2f6ff" stroke-width="5" fill="none"/></g>`);
    for (let k = 0; k <= 12; k++) { const t = k / 12; add(bulb(664 + t * 272, 608 + Math.abs(Math.sin(t * Math.PI * 4)) * 8, BULB[k % BULB.length], 3)); }
    // porch lantern
    add(`<circle cx="692" cy="636" r="54" fill="url(#cb-warm)"/><path d="M692 604 v14" stroke="#1b1612" stroke-width="2"/><path d="M682 618 h20 l-3 28 h-14Z" fill="#ffe7a8" stroke="#1b1612" stroke-width="3"/><path d="M680 618 l12 -8 l12 8Z" fill="#1b1612"/>`);
    candles.push({ x: 692, y: 640, s: 0.5 });
    // snowshoes on the wall, boots by the door
    add(`<g transform="translate(1000 640) rotate(12)"><ellipse rx="14" ry="34" fill="none" stroke="#8a5a34" stroke-width="5"/><path d="M-12 -10 h24 M-12 6 h24 M0 -30 v60" stroke="#c9a070" stroke-width="2"/></g><g transform="translate(1022 646) rotate(-8)"><ellipse rx="14" ry="34" fill="none" stroke="#8a5a34" stroke-width="5"/><path d="M-12 -10 h24 M-12 6 h24 M0 -30 v60" stroke="#c9a070" stroke-width="2"/></g>`);
    add(`<path d="M862 768 v-30 h16 v22 h14 v8Z M884 768 v-28 h16 v20 h14 v8Z" fill="#2a1a12"/><path d="M862 740 h16 M884 742 h16" stroke="#c4222f" stroke-width="5"/>`);
    // red sled leaning by the door
    add(`<g transform="translate(600 770) rotate(-72)"><path d="M0 0 H150 q22 0 22 -22" stroke="#2a2a2a" stroke-width="5" fill="none"/><rect x="10" y="-30" width="140" height="22" rx="4" fill="#b3172b"/><path d="M40 -30 v22 M80 -30 v22 M120 -30 v22" stroke="#7d0d1c" stroke-width="3"/><path d="M20 -8 v8 M130 -8 v8" stroke="#2a2a2a" stroke-width="4"/></g>`);

    /* woodpile under the left eave + stump with axe */
    add(`<rect x="430" y="660" width="140" height="110" fill="#3a2414"/>`);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const x = 442 + c * 22 + (r % 2) * 11, y = 676 + r * 24; if (x > 560) continue; add(`<circle cx="${x}" cy="${y}" r="11" fill="#b07a48"/><circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#7a4e2a" stroke-width="1.6"/>`); }
    add(`<path d="M424 664 Q500 646 576 664 L576 656 Q500 638 424 656Z" fill="#f2f6ff"/>`);
    add(`<ellipse cx="380" cy="782" rx="34" ry="10" fill="#b07a48"/><rect x="346" y="782" width="68" height="34" fill="#6b4024"/><ellipse cx="380" cy="782" rx="34" ry="10" fill="none" stroke="#7a4e2a" stroke-width="2"/><path d="M372 784 L404 732" stroke="#7a4e2a" stroke-width="6" stroke-linecap="round"/><path d="M394 728 l22 -4 l-6 22Z" fill="#9aa2b0"/>`);

    /* decorated little pine beside the cabin */
    add(pine(1170, 790, 210, '#173a28', '#eef3ff', true));
    add(`<path d="M1170 572 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10Z" fill="#ffd36b"/>`);

    /* foreground snow, path, tracks, fox */
    add(`<path d="M0 780 Q300 750 640 790 Q800 806 960 790 Q1300 756 1600 790 V1000 H0Z" fill="#eef3ff"/>`);
    add(`<path d="M760 798 C740 860 660 900 650 1000 L760 1000 C760 920 820 880 840 798Z" fill="#d4e0f6"/>`);
    for (let i = 0; i < 12; i++) add(`<ellipse cx="${f(778 - i * 12 + (i % 2) * 14)}" cy="${f(812 + i * 16)}" rx="6" ry="3.5" fill="#a9b9da"/>`);
    for (let i = 0; i < 16; i++) add(`<circle cx="${f(1180 + i * 22)}" cy="${f(900 + Math.sin(i) * 10)}" r="2.6" fill="#a9b9da"/>`);
    add(`<g transform="translate(1440 900)">
      <ellipse cx="0" cy="14" rx="40" ry="6" fill="#9db0d6" opacity=".6"/>
      <path d="M30 10 Q70 4 76 -16 Q78 -28 66 -22 Q56 0 26 0Z" fill="#d8692a"/><path d="M72 -20 q6 -6 4 -10 q-6 2 -6 8Z" fill="#fff"/>
      <path d="M-18 12 Q-26 -26 -6 -40 Q12 -46 22 -28 Q30 -4 24 12Z" fill="#e0782e"/><path d="M-10 12 Q-12 -14 2 -20 Q10 -10 8 12Z" fill="#fbf2e6"/>
      <path d="M-2 -42 Q-6 -66 6 -72 Q22 -66 20 -44Z" fill="#e0782e"/><path d="M-2 -66 l-6 -18 l12 10Z M12 -68 l8 -16 l2 16Z" fill="#c45a1e"/><path d="M-2 -52 Q8 -44 18 -52 Q14 -40 8 -38 Q2 -40 -2 -52Z" fill="#fbf2e6"/><circle cx="2" cy="-56" r="2" fill="#1a1a1a"/><circle cx="14" cy="-56" r="2" fill="#1a1a1a"/><circle cx="8" cy="-46" r="2.4" fill="#1a1a1a"/>
      <path d="M-8 12 v-6 M16 12 v-6" stroke="#2a1a12" stroke-width="5" stroke-linecap="round"/>
    </g>`);
    // big foreground pines framing the scene
    add(pine(60, 1010, 470, '#0f2030', '#eef3ff')); add(pine(1560, 1020, 500, '#0f2030', '#eef3ff')); add(pine(250, 1040, 300, '#12263a', '#eef3ff'));

    /* the hanging wooden sign (title) */
    add(`<path d="M560 0 L580 60 M1040 0 L1020 60" stroke="#c9a070" stroke-width="4"/>`);
    add(`<g filter="url(#cb-shadow)"><path d="M486 60 Q800 48 1114 60 L1108 148 Q800 136 492 148Z" fill="url(#cb-plank)"/>
      <path d="M492 90 Q800 80 1110 90 M494 120 Q800 110 1108 120" stroke="#4a2a12" stroke-width="2" opacity=".5"/>
      <path d="M498 70 Q800 58 1102 70 L1098 138 Q800 126 502 138Z" fill="none" stroke="#3a1f0e" stroke-width="3" opacity=".7"/>
      <circle cx="510" cy="104" r="5" fill="#3a2a1a"/><circle cx="1090" cy="104" r="5" fill="#3a2a1a"/>
      <path d="M484 62 Q800 44 1116 62 Q1100 50 800 40 Q500 50 484 62Z" fill="#f2f6ff"/></g>`);
    // pine sprigs and a bow at the sign corners
    [[500, 70, -1], [1100, 70, 1]].forEach(([x, y, d]) => { for (let k = 0; k < 7; k++) add(`<path d="M${x} ${y} l${f(d * rr(10, 40))} ${f(rr(-20, 20))}" stroke="${pick(['#1f4a2c', '#2c6038'])}" stroke-width="5" stroke-linecap="round"/>`); add(`<circle cx="${x}" cy="${y}" r="5" fill="#c4222f"/><circle cx="${x + d * 6}" cy="${y + 5}" r="4" fill="#b3172b"/>`); });
    add(`<rect width="${W}" height="${H}" fill="url(#cb-vig)"/>`);

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  A.designs.cabin = {
    id: 'cabin',
    name: 'Cabin in the Pines',
    blurb: 'A log cabin, smoke from the chimney, boots by the door.',
    width: W, height: H, build,
    title: { path: 'M520 104 Q800 92 1080 104', size: 46, maxWidth: 520, fill: '#fbecd0', stroke: '#3a1f0e' },
    numStyles: ['n-cream', 'n-tag', 'n-gold', 'n-swash', 'n-red'],
    effects: [
      { type: 'glow', x: 1350, y: 160, r: 220, color: '220,232,255', a: 0.16, speed: 0.5 },
      { type: 'roomGlow', x: 800, y: 660, r: 520, color: '255,180,90', a: 0.06, flicker: 0.025 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'smoke', x: CHIMNEY[0], y: CHIMNEY[1] - 12, rate: 2.4, rise: 22, size: 12, a: 0.32, color: '215,224,244' },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 110 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 30, size: 1.9, speed: 1.3, a: 0.7 },
    ],
    layout: 'cabin',
    keepOut: [[470, 0, 660, 160], [1270, 84, 160, 156]],
    day24: { x: 715, y: 606, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/cabin.js', e); }
/* ---- src/layouts/cabin.js ---- */
try {
/* Door layout for "Cabin in the Pines" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["cabin"]=[{"day":1,"x":801,"y":164,"w":114,"h":100,"hinge":"right"},
{"day":2,"x":572,"y":440,"w":126,"h":106,"hinge":"left"},
{"day":3,"x":1026,"y":604,"w":118,"h":138,"hinge":"top"},
{"day":4,"x":33,"y":507,"w":110,"h":132,"hinge":"right"},
{"day":5,"x":858,"y":444,"w":138,"h":150,"hinge":"left"},
{"day":6,"x":1290,"y":475,"w":124,"h":150,"hinge":"left"},
{"day":7,"x":1166,"y":693,"w":150,"h":126,"hinge":"right"},
{"day":8,"x":1140,"y":856,"w":150,"h":118,"hinge":"left"},
{"day":9,"x":628,"y":164,"w":132,"h":100,"hinge":"left"},
{"day":10,"x":202,"y":877,"w":120,"h":94,"hinge":"top"},
{"day":11,"x":1329,"y":309,"w":116,"h":150,"hinge":"left"},
{"day":12,"x":779,"y":785,"w":150,"h":150,"hinge":"left"},
{"day":13,"x":1001,"y":281,"w":150,"h":150,"hinge":"left"},
{"day":14,"x":59,"y":174,"w":150,"h":134,"hinge":"top"},
{"day":15,"x":1459,"y":540,"w":106,"h":126,"hinge":"top"},
{"day":16,"x":241,"y":181,"w":150,"h":142,"hinge":"top"},
{"day":17,"x":1139,"y":149,"w":114,"h":98,"hinge":"top"},
{"day":18,"x":1306,"y":831,"w":132,"h":112,"hinge":"right"},
{"day":19,"x":300,"y":574,"w":116,"h":150,"hinge":"right"},
{"day":20,"x":35,"y":810,"w":150,"h":124,"hinge":"top"},
{"day":21,"x":556,"y":276,"w":144,"h":150,"hinge":"left"},
{"day":22,"x":72,"y":348,"w":150,"h":142,"hinge":"right"},
{"day":23,"x":339,"y":780,"w":130,"h":150,"hinge":"right"},
{"day":24,"x":715,"y":606,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/cabin.js', e); }
/* ---- src/designs/cats.js ---- */
try {
/* Design — "Meowy & Bright"
   Hand-built SVG scene + animated canvas effects. See src/designs/parlor.js for the design contract. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  /* ---------- shared drawing kit (inlined per design so each file stands alone) ---------- */
  const f = (n) => Math.round(n * 10) / 10;
  function makeKit(R) {
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [];
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40', '#14361f'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];
    function pine(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rr(-0.3, 0.3), l = r * rr(0.9, 1.5);
        s += `<path d="M${f(x)} ${f(y)}L${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return s;
    }
    function bulb(x, y, c, r = 4.2) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".22"/><rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".75"/>`;
    }
    function lamp(x, y, c, r) { lights.push({ x, y, c, r }); return ''; }
    function berries(x, y) {
      let s = '';
      for (let i = 0; i < 3; i++) { const bx = x + rr(-6, 6), by = y + rr(-5, 5); s += `<circle cx="${f(bx)}" cy="${f(by)}" r="4.2" fill="#b3122a"/><circle cx="${f(bx - 1.3)}" cy="${f(by - 1.4)}" r="1.3" fill="#ff8f9c"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><path d="M-4 -2 C-14 -10 -24 -10 -24 -3" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/><ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    function quad(x0, y0, cx, cy, x1, y1, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]); }
      return pts;
    }
    function swag(x0, y0, cx, cy, x1, y1, o = {}) {
      const pts = quad(x0, y0, cx, cy, x1, y1, o.n || 24), r = o.r || 12;
      let s = '';
      pts.forEach(([x, y]) => (s += pine(x + rr(-3, 3), y + rr(-3, 3), r * rr(0.8, 1.1))));
      pts.forEach(([x, y], i) => { if (i % 2 === 0) s += pine(x + rr(-6, 6), y + rr(-2, 8), r * 0.75); });
      if (o.berries) pts.forEach(([x, y], i) => { if (i % 5 === 2) s += berries(x, y + 4); });
      if (o.lights) pts.forEach(([x, y], i) => { if (i % (o.every || 3) === 1) s += bulb(x + rr(-4, 4), y + rr(0, 8), BULB[(i + (o.off || 0)) % BULB.length], o.bulb || 4); });
      return s;
    }
    function lightString(x0, y0, cx, cy, x1, y1, n, r = 5, colors = BULB, off = 0) {
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#1d2a1f" stroke-width="2.4" fill="none"/>`;
      quad(x0, y0, cx, cy, x1, y1, n).forEach(([x, y], i) => { if (i > 0 && i < n) s += bulb(x, y + r + 3, colors[(i + off) % colors.length], r); });
      return s;
    }
    function starPath(x, y, ro, ri, n = 5) {
      let d = '';
      for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); }
      return d + 'Z';
    }
    function gift(x, y, w, h, fill, rib, d = 14, bowColor) {
      return `<g filter="url(#shadow)"><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".18"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".28"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="${rib}"/><path d="M${x + w / 2 - 7} ${y} l${d} ${-d * 0.6} h14 l${-d} ${d * 0.6}Z" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${rib}" opacity=".95"/><path d="M${x + w} ${y + h / 2 - 6} l${d} ${-d * 0.6} v12 l${-d} ${d * 0.6}Z" fill="${rib}" opacity=".7"/></g>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.75, bowColor || rib, '#00000055')}`;
    }
    function candle(x, baseY, h, color, w = 22) {
      const top = baseY - h;
      candles.push({ x, y: top - 10, s: 1 });
      return `<rect x="${x - w / 2 - 4}" y="${baseY - 8}" width="${w + 8}" height="9" rx="2" fill="url(#gold)"/><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h - 8}" rx="3" fill="${color || 'url(#candle)'}"/><path d="M${x - w / 2} ${top + 4} q4 14 0 22 q5 -6 6 -18Z" fill="#fffaf0" opacity=".8"/><path d="M${x} ${top} v-8" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${top - 16}" r="34" fill="url(#candleGlow)"/>`;
    }
    function snowDots(x, y, w, h, n, rMax = 2.4, op = 0.85) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(0.6 + R() * rMax)}" fill="#fff" opacity="${f(rr(0.4, op))}"/>`;
      return s;
    }
    function stars(x, y, w, h, n) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(rr(0.5, 1.8))}" fill="#fff" opacity="${f(rr(0.35, 1))}"/>`;
      return s;
    }
    function pineTree(x, y, h, color, snow = '#f4f8ff') {
      let s = '';
      for (let i = 0; i < 4; i++) {
        const ty = y - h + (i * h) / 4.6, w = h * (0.17 + i * 0.09);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + h * 0.34)} Q${f(x)} ${f(ty + h * 0.3)} ${f(x + w)} ${f(ty + h * 0.34)}Z" fill="${color}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.55)} ${f(ty + h * 0.19)} Q${f(x - w * 0.1)} ${f(ty + h * 0.14)} ${f(x + w * 0.45)} ${f(ty + h * 0.17)}Z" fill="${snow}" opacity=".92"/>`;
      }
      return s + `<rect x="${f(x - h * 0.03)}" y="${f(y - h * 0.06)}" width="${f(h * 0.06)}" height="${f(h * 0.08)}" fill="#3a2414"/>`;
    }
    /** A decorated Christmas tree (tiers drawn bottom to top) */
    function tree(cx, top, base, hw, o = {}) {
      const span = base - top;
      const T = [[0.656, 1, 1], [0.479, 0.825, 0.88], [0.302, 0.645, 0.73], [0.139, 0.459, 0.56], [0, 0.275, 0.38]].map(([a, b, c]) => [top + a * span, top + b * span, hw * c]);
      let s = '';
      const tierPath = (y0, y1, w) => {
        let d = `M${cx} ${f(y0)} Q${f(cx - w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${f(cx - w)} ${f(y1)}`;
        const n = Math.max(3, Math.round(w / 26)), step = (2 * w) / n;
        for (let i = 0; i < n; i++) d += ` Q${f(cx - w + step * (i + 0.5))} ${f(y1 + 16)} ${f(cx - w + step * (i + 1))} ${f(i < n - 1 ? y1 - 3 : y1)}`;
        return d + ` Q${f(cx + w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${f(y0)}Z`;
      };
      const inTier = (x, y, t) => y > t[0] + (t[1] - t[0]) * 0.3 && y < t[1] - 8 && Math.abs(x - cx) < t[2] * ((y - t[0]) / (t[1] - t[0])) * 0.86;
      if (o.trunk !== false) s += `<rect x="${cx - hw * 0.08}" y="${f(base - 30)}" width="${f(hw * 0.16)}" height="${f(hw * 0.25)}" fill="#4a2614"/>`;
      T.forEach((t, i) => {
        const [y0, y1, w] = t;
        if (i > 0) s += `<path d="${tierPath(y0 + 12, y1 + 12, w)}" fill="#000" opacity=".3" filter="url(#soft)"/>`;
        s += `<path d="${tierPath(y0, y1, w)}" fill="${o.fill || 'url(#treeG)'}"/>`;
        let nd = '';
        for (let k = 0; k < w * 2.1; k++) {
          const y = rr(y0 + (y1 - y0) * 0.15, y1 + 6), sp = w * ((y - y0) / (y1 - y0)), x = cx + rr(-sp, sp) * 0.98, dir = x < cx ? -1 : 1, len = rr(10, 22);
          nd += `<path d="M${f(x)} ${f(y)} l${f(dir * len * 0.7)} ${f(len * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="${f(rr(1.6, 2.8))}" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
        }
        s += nd;
        if (o.snow) s += `<path d="${tierPath(y1 - 10, y1, w * 0.95)}" fill="#f4f8ff" opacity=".85"/>`;
        if (i < 4 && o.beads !== false) s += `<path d="M${f(cx - w * 0.5)} ${f(y0 + (y1 - y0) * 0.55)} Q${cx} ${f(y0 + (y1 - y0) * 0.85 + 30)} ${f(cx + w * 0.8)} ${f(y0 + (y1 - y0) * 0.85 - 10)}" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`;
      });
      const placed = [];
      const at = (minD) => {
        for (let k = 0; k < 400; k++) {
          const t = T[Math.floor(R() * T.length)], x = rr(cx - t[2], cx + t[2]), y = rr(t[0], t[1]);
          if (!inTier(x, y, t)) continue;
          if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue;
          return [x, y];
        }
        return null;
      };
      const ok = ['red', 'gold', 'blue', 'silver', 'green', 'plum'];
      const scale = hw / 236;
      for (let i = 0; i < (o.ornaments == null ? 40 : o.ornaments); i++) {
        const p = at(22 * scale); if (!p) continue;
        const r = rr(9, 15) * Math.max(0.6, scale); placed.push([p[0], p[1], r]);
        s += `<path d="M${f(p[0])} ${f(p[1] - r - 4)} v-8" stroke="#c9a24a" stroke-width="1"/><rect x="${f(p[0] - 3.5)}" y="${f(p[1] - r - 5)}" width="7" height="6" rx="1" fill="url(#gold)"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#orn-${(o.palette || ok)[i % (o.palette || ok).length]})"/>`;
      }
      for (let i = 0; i < (o.canes == null ? 5 : o.canes); i++) {
        const p = at(20 * scale); if (!p) continue; placed.push([p[0], p[1], 12]);
        const cane = `M${f(p[0])} ${f(p[1] + 18)} V${f(p[1] - 6)} q0 -10 9 -10 q9 0 9 10`;
        s += `<path d="${cane}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${cane}" stroke="#c4222f" stroke-width="5" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < (o.lights == null ? 80 : o.lights); i++) {
        const p = at(8 * scale); if (!p) continue; placed.push([p[0], p[1], 5]);
        s += bulb(p[0], p[1], (o.bulbs || BULB)[i % (o.bulbs || BULB).length], 4 * Math.max(0.7, scale));
      }
      if (o.star !== false) {
        const sr = 38 * Math.max(0.6, scale);
        s += `<circle cx="${cx}" cy="${f(top - 6)}" r="${f(sr * 1.6)}" fill="url(#candleGlow)"/><path d="${starPath(cx, top - 4, sr, sr * 0.42)}" fill="url(#gold)" stroke="#8a5a14" stroke-width="2"/><path d="${starPath(cx, top - 4, sr * 0.47, sr * 0.2)}" fill="#fff6c8" opacity=".7"/>`;
      }
      return s;
    }
    const ornColors = { red: ['#ff5a63', '#b0101f', '#5e0710'], gold: ['#ffe39a', '#cf9a2e', '#6a4410'], blue: ['#8fb8ff', '#2a56b0', '#0f2353'], silver: ['#ffffff', '#b9c3cc', '#5b6670'], green: ['#8fe0a0', '#1f7d45', '#0b3a1d'], plum: ['#e3a0f0', '#7a2f95', '#33103f'] };
    let defs = '';
    Object.entries(ornColors).forEach(([k, [a, b, c]]) => (defs += `<radialGradient id="orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`));
    defs += `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <radialGradient id="candleGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="warmGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
      <linearGradient id="treeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>`;
    /** Classic arched ribbon banner centred at cx; the title path runs along its middle. */
    function ribbonBanner(cx, y, halfW, o = {}) {
      const a = halfW, top = y, bot = y + 74, arch = o.arch == null ? 50 : o.arch;
      const fill = o.fill || 'url(#ribbon)', dark = o.dark || 'url(#ribbonDark)', deep = o.deep || '#4a0711';
      return `<g filter="url(#shadow)">
        <path d="M${cx - a + 28} ${top + 22} L${cx - a - 68} ${top + 16} L${cx - a - 40} ${top + 60} L${cx - a - 68} ${top + 106} L${cx - a + 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx + a - 28} ${top + 22} L${cx + a + 68} ${top + 16} L${cx + a + 40} ${top + 60} L${cx + a + 68} ${top + 106} L${cx + a - 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx - a} ${top} L${cx - a + 40} ${top + 28} L${cx - a + 40} ${top + 84} L${cx - a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx + a} ${top} L${cx + a - 40} ${top + 28} L${cx + a - 40} ${top + 84} L${cx + a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx - a} ${top} Q${cx} ${top - arch - 8} ${cx + a} ${top} L${cx + a} ${bot} Q${cx} ${bot - arch - 8} ${cx - a} ${bot}Z" fill="${fill}"/>
        <path d="M${cx - a + 8} ${top + 10} Q${cx} ${top - arch + 2} ${cx + a - 8} ${top + 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
        <path d="M${cx - a + 8} ${bot - 10} Q${cx} ${bot - arch - 18} ${cx + a - 8} ${bot - 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
      </g>`;
    }
    const ribbonPath = (cx, y, halfW, arch = 50) => `M${cx - halfW + 40} ${y + 44} Q${cx} ${y + 44 - arch - 8} ${cx + halfW - 40} ${y + 44}`;
    return { rr, pick, lights, candles, BULB, GREENS, NEEDLE, pine, bulb, lamp, berries, bow, quad, swag, lightString, starPath, gift, candle, snowDots, stars, pineTree, tree, defs, ribbonBanner, ribbonPath };
  }

  /* ---------- cats ---------- */
  const CAT = {
    ginger: { body: '#e8954a', dark: '#b8622a', belly: '#f8dcbc', eye: '#8fcf5a', stripes: true },
    gray: { body: '#8f98a6', dark: '#5f6876', belly: '#d9dde3', eye: '#e6b84a', stripes: true },
    tux: { body: '#24252b', dark: '#101115', belly: '#f4f1ea', eye: '#9fd46a', stripes: false },
    calico: { body: '#f6efe4', dark: '#b8622a', belly: '#ffffff', eye: '#6fb0d8', stripes: false, patches: ['#e8954a', '#2b2b30'] },
    white: { body: '#f7f4ee', dark: '#c9c2b6', belly: '#ffffff', eye: '#6fb0d8', stripes: false },
  };
  function catHead(p, o = {}) {
    // centred on (0,0), about 72 wide
    let s = `<path d="M-32 -12 L-30 -44 L-8 -26Z M32 -12 L30 -44 L8 -26Z" fill="${p.body}"/><path d="M-28 -17 L-27 -37 L-13 -26Z M28 -17 L27 -37 L13 -26Z" fill="#f2a7a7"/>`;
    s += `<ellipse cx="0" cy="0" rx="37" ry="31" fill="${p.body}"/>`;
    if (p.patches) s += `<path d="M-30 -14 Q-20 -30 -4 -28 Q-6 -10 -20 -2 Q-32 -2 -30 -14Z" fill="${p.patches[0]}"/><path d="M8 -28 Q26 -26 30 -10 Q20 -8 12 -16Z" fill="${p.patches[1]}"/>`;
    if (p.stripes) s += `<path d="M-8 -29 l3 10 M0 -31 v11 M8 -29 l-3 10 M-34 -2 h9 M-33 5 h8 M34 -2 h-9 M33 5 h-8" stroke="${p.dark}" stroke-width="3.2" stroke-linecap="round"/>`;
    if (p === CAT.tux) s += `<path d="M-14 31 Q-16 8 0 4 Q16 8 14 31Z" fill="#f4f1ea"/><path d="M0 -24 L-6 4 L6 4Z" fill="#f4f1ea"/>`;
    if (o.sleep) {
      s += `<path d="M-20 0 q7 6 14 0 M6 0 q7 6 14 0" stroke="#3a2414" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    } else {
      const lx = o.look || 0;
      s += `<ellipse cx="-14" cy="-2" rx="8.5" ry="10" fill="${p.eye}"/><ellipse cx="14" cy="-2" rx="8.5" ry="10" fill="${p.eye}"/>`;
      s += `<ellipse cx="${-14 + lx}" cy="-1" rx="4" ry="8" fill="#111"/><ellipse cx="${14 + lx}" cy="-1" rx="4" ry="8" fill="#111"/><circle cx="${-16 + lx}" cy="-5" r="2.6" fill="#fff"/><circle cx="${12 + lx}" cy="-5" r="2.6" fill="#fff"/>`;
    }
    s += `<path d="M-4 9 L4 9 L0 14Z" fill="#e8838a"/><path d="M0 14 q-5 6 -10 2 M0 14 q5 6 10 2" stroke="#3a2414" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    if (o.open) s += `<path d="M-5 17 q5 8 10 0Z" fill="#c2404d"/>`;
    s += `<circle cx="-22" cy="10" r="6" fill="#ff8f9c" opacity=".35"/><circle cx="22" cy="10" r="6" fill="#ff8f9c" opacity=".35"/>`;
    s += `<path d="M-12 12 l-26 -3 M-12 15 l-24 5 M12 12 l26 -3 M12 15 l24 5" stroke="#fff" stroke-width="1.1" opacity=".8"/>`;
    return s;
  }
  function sitCat(x, y, sc, p, o = {}) {
    let s = `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="2" rx="46" ry="9" fill="#000" opacity=".28"/>`;
    s += `<path d="M30 -6 Q72 -6 64 -44 Q60 -62 48 -56" stroke="${p.body}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    if (p.stripes) s += `<path d="M52 -10 l6 -6 M62 -28 l8 0" stroke="${p.dark}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M-38 0 Q-46 -58 -20 -80 L20 -80 Q46 -58 38 0Z" fill="${p.body}"/>`;
    if (p.patches) s += `<path d="M-38 -10 Q-40 -50 -18 -60 Q-10 -30 -30 -2Z" fill="${p.patches[0]}"/><path d="M20 -70 Q40 -50 36 -20 Q20 -30 18 -50Z" fill="${p.patches[1]}"/>`;
    s += `<ellipse cx="0" cy="-34" rx="17" ry="30" fill="${p.belly}"/>`;
    if (p.stripes) s += `<path d="M-36 -40 q10 0 14 6 M-38 -24 q10 0 14 6 M36 -40 q-10 0 -14 6 M38 -24 q-10 0 -14 6" stroke="${p.dark}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    const raise = o.paw;
    s += `<ellipse cx="-15" cy="-3" rx="11" ry="7" fill="${p.belly}"/>`;
    s += raise ? `<path d="M14 -50 Q30 -80 40 -104" stroke="${p.body}" stroke-width="15" stroke-linecap="round" fill="none"/><circle cx="41" cy="-106" r="9" fill="${p.belly}"/>` : `<ellipse cx="15" cy="-3" rx="11" ry="7" fill="${p.belly}"/>`;
    if (o.scarf) s += `<path d="M-26 -78 Q0 -66 26 -78 L28 -70 Q0 -56 -28 -70Z" fill="${o.scarf}"/><path d="M14 -70 l6 30 l10 -3 l-6 -28Z" fill="${o.scarf}"/>`;
    if (o.bell) s += `<path d="M-24 -76 Q0 -66 24 -76" stroke="#c4222f" stroke-width="6" fill="none"/><circle cx="0" cy="-68" r="6" fill="url(#gold)"/>`;
    s += `<g transform="translate(0 -104)">${catHead(p, o)}</g>`;
    if (o.hat) s += `<g transform="translate(0 -104)"><path d="M-30 -22 Q-6 -78 30 -54 Q34 -40 26 -22Z" fill="#c4222f"/><rect x="-36" y="-28" width="66" height="13" rx="6.5" fill="#fbf7f0"/><circle cx="34" cy="-54" r="9" fill="#fbf7f0"/></g>`;
    return s + '</g>';
  }
  function sleepCat(x, y, sc, p) {
    return `<g transform="translate(${x} ${y}) scale(${sc})">
      <ellipse cx="0" cy="6" rx="72" ry="10" fill="#000" opacity=".25"/>
      <path d="M-62 4 Q-66 -42 -10 -46 Q54 -48 64 -8 Q68 8 40 8 L-50 8 Q-62 8 -62 4Z" fill="${p.body}"/>
      ${p.stripes ? `<path d="M-38 -36 q8 10 2 22 M-16 -44 q8 12 2 26 M8 -46 q8 12 2 28 M30 -40 q8 10 4 24" stroke="${p.dark}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>` : ''}
      <path d="M60 -2 Q76 6 52 12 Q8 20 -40 12" stroke="${p.body}" stroke-width="13" fill="none" stroke-linecap="round"/>
      <g transform="translate(-48 -12) scale(.72) rotate(-12)">${catHead(p, { sleep: true })}</g>
      <ellipse cx="-26" cy="6" rx="14" ry="6" fill="${p.belly}"/>
    </g>`;
  }

  function build() {
    const R = A.util.rng(3141);
    const K = makeKit(R);
    const { rr, pick } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f3238"/><stop offset=".6" stop-color="#1b5157"/><stop offset="1" stop-color="#143f44"/></linearGradient>
      <pattern id="paper" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M40 22l3 7 7 .6-5.4 4.6 1.7 7L40 37.4 33.7 41l1.7-7L30 29.6l7-.6Z" fill="#e6c27a" opacity=".16"/><circle cx="0" cy="0" r="3" fill="#e6c27a" opacity=".14"/><circle cx="80" cy="80" r="3" fill="#e6c27a" opacity=".14"/><circle cx="0" cy="80" r="3" fill="#e6c27a" opacity=".14"/><circle cx="80" cy="0" r="3" fill="#e6c27a" opacity=".14"/></pattern>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3219"/><stop offset="1" stop-color="#7a4624"/></linearGradient>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081631"/><stop offset=".75" stop-color="#22457a"/><stop offset="1" stop-color="#46679c"/></linearGradient>
      <linearGradient id="iron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f8a80"/><stop offset=".5" stop-color="#e9e2d2"/><stop offset="1" stop-color="#8f8a80"/></linearGradient>
      <linearGradient id="woodH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5530"/><stop offset="1" stop-color="#4f2c16"/></linearGradient>
      <pattern id="gingham" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#f6eee0"/><rect width="10" height="20" fill="#c4222f" opacity=".55"/><rect width="20" height="10" fill="#c4222f" opacity=".55"/></pattern>
      <pattern id="plaid" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#2c5c8a"/><rect y="12" width="36" height="8" fill="#1a3a5c"/><rect x="12" width="8" height="36" fill="#1a3a5c" opacity=".7"/><rect y="28" width="36" height="2" fill="#f0c64a" opacity=".6"/></pattern>
      <pattern id="stkA" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="20" height="20" fill="#c11d2f"/><rect width="20" height="7" fill="#f6efe2"/></pattern>
      <pattern id="stkB" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#1d6b43"/><circle cx="5" cy="5" r="3" fill="#f6efe2"/><circle cx="14" cy="14" r="3" fill="#f6efe2"/></pattern>
      <pattern id="fishPaper" width="40" height="30" patternUnits="userSpaceOnUse"><rect width="40" height="30" fill="#2a5aa8"/><path d="M8 15 q8 -8 16 0 q-8 8 -16 0Z M24 15 l6 -5 v10Z" fill="#cfe0ff" opacity=".8"/></pattern>
      <pattern id="pawPaper" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="#b3172b"/><g fill="#ffd9a0" opacity=".85"><circle cx="17" cy="20" r="5"/><circle cx="10" cy="12" r="2.4"/><circle cx="15" cy="9" r="2.4"/><circle cx="20" cy="9" r="2.4"/><circle cx="25" cy="12" r="2.4"/></g></pattern>
      <radialGradient id="lampLight" cx="300" cy="420" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc56b" stop-opacity=".22"/><stop offset="1" stop-color="#ffc56b" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05121a" stop-opacity=".6"/></radialGradient>
    </defs>`);

    /* room */
    add(`<rect width="1600" height="770" fill="url(#wall)"/><rect width="1600" height="770" fill="url(#paper)"/>`);
    add(`<rect y="560" width="1600" height="210" fill="#e9dcc2"/>`);
    for (let x = 0; x < 1600; x += 22) add(`<rect x="${x}" y="560" width="2" height="210" fill="#c9b796"/>`);
    add(`<rect y="548" width="1600" height="16" fill="#7a4a26"/><rect y="549" width="1600" height="3" fill="#c48a52"/>`);
    add(`<rect y="770" width="1600" height="230" fill="url(#floor)"/>`);
    for (let y = 776, h = 18, row = 0; y < 1000; y += h, h = Math.round(h * 1.2), row++) {
      add(`<rect y="${y}" width="1600" height="1.6" fill="#2d160a" opacity=".7"/>`);
      for (let x = (row * 151) % 280; x < 1600; x += 280) add(`<rect x="${x}" y="${y}" width="2" height="${h}" fill="#2d160a" opacity=".6"/>`);
    }
    add(`<rect y="762" width="1600" height="12" fill="#3a1d0c"/>`);
    // braided rug
    ['#9c2430', '#f3e6cf', '#2f6b4a', '#c99a3e', '#9c2430', '#f3e6cf', '#2f6b4a'].forEach((c, i) => add(`<ellipse cx="820" cy="890" rx="${430 - i * 52}" ry="${88 - i * 11}" fill="${c}"/>`));
    add(`<ellipse cx="820" cy="890" rx="430" ry="88" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="8"/>`);

    /* window with snowy night */
    add(`<rect x="626" y="166" width="348" height="372" rx="4" fill="#f3ead8"/><rect x="643" y="183" width="314" height="336" fill="url(#night)"/>`);
    add(K.stars(645, 186, 310, 180, 40));
    add(`<circle cx="880" cy="240" r="70" fill="url(#candleGlow)"/><circle cx="880" cy="240" r="22" fill="#fff6d8"/>`);
    add(`<path d="M643 420 Q700 396 760 412 Q840 430 957 400 V519 H643Z" fill="#d7e3f4"/>`);
    // neighbour houses
    [[660, 410, 86, '#7a3a2a'], [770, 425, 100, '#3a4a6a'], [878, 405, 80, '#5a3a5a']].forEach(([x, y, w, c]) => {
      add(`<rect x="${x}" y="${y}" width="${w}" height="${519 - y}" fill="${c}"/><path d="M${x - 8} ${y + 2} L${x + w / 2} ${y - 34} L${x + w + 8} ${y + 2}Z" fill="#f4f8ff"/>`);
      for (let i = 0; i < 2; i++) { const wx = x + 14 + i * (w - 40); add(`<rect x="${wx}" y="${y + 22}" width="14" height="16" fill="#ffd27a"/>`); K.lamp(wx + 7, y + 30, '#ffd27a', 6); }
      add(K.lightString(x - 6, y + 4, x + w / 2, y + 14, x + w + 6, y + 4, 7, 2.4, K.BULB, x));
    });
    add(`<path d="M643 500 Q720 486 800 498 Q880 486 957 496 V519 H643Z" fill="#fff"/>`);
    add(`<rect x="794" y="183" width="12" height="336" fill="#efe4cd"/><rect x="643" y="345" width="314" height="12" fill="#efe4cd"/>`);
    add(`<path d="M643 519 Q700 506 794 514 V519Z M806 514 Q880 504 957 512 V519H806Z" fill="#fff"/>`);
    // cafe curtains + rod
    add(`<rect x="610" y="178" width="380" height="8" rx="4" fill="url(#gold)"/>`);
    add(`<path d="M612 186 H720 Q706 300 648 360 Q630 372 612 360Z" fill="url(#gingham)"/><path d="M988 186 H880 Q894 300 952 360 Q970 372 988 360Z" fill="url(#gingham)"/>`);
    add(`<path d="M612 186 H720 M880 186 H988" stroke="#c4222f" stroke-width="8"/>`);
    add(`<rect x="604" y="534" width="392" height="20" rx="3" fill="#f3ead6"/><rect x="604" y="550" width="392" height="6" fill="#b8a37f"/>`);
    // sill: poinsettia + window candle
    add(`<path d="M640 534 l6 -30 h36 l6 30Z" fill="#b3172b"/>`);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; add(`<ellipse cx="${f(664 + Math.cos(a) * 18)}" cy="${f(486 + Math.sin(a) * 12)}" rx="16" ry="7" transform="rotate(${f((a * 180) / Math.PI)} ${f(664 + Math.cos(a) * 18)} ${f(486 + Math.sin(a) * 12)})" fill="${i % 2 ? '#c4222f' : '#e0303f'}"/>`); }
    add(`<circle cx="664" cy="486" r="6" fill="#f0c64a"/>`);
    add(K.candle(940, 534, 46, '#f6efe2', 16));
    // string of lights over the window
    add(K.lightString(600, 150, 800, 210, 1000, 150, 14, 5));

    // small wreath on the wall
    {
      let w = '';
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 + ring * 0.2; w += K.pine(540 + Math.cos(a) * (34 + ring * 9), 330 + Math.sin(a) * (34 + ring * 9), 9); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3; w += K.berries(540 + Math.cos(a) * 40, 330 + Math.sin(a) * 40); }
      add(`<path d="M540 250 V292" stroke="#c4222f" stroke-width="4"/><g filter="url(#shadow)">${w}</g>` + K.bow(540, 376, 0.7));
    }
    // cat basket with a fish toy under the console
    add(`<g filter="url(#shadow)"><ellipse cx="1460" cy="736" rx="74" ry="24" fill="#b07a42"/><path d="M1386 736 Q1390 706 1460 702 Q1530 706 1534 736 Q1530 764 1460 766 Q1390 764 1386 736Z" fill="#c48a52"/><ellipse cx="1460" cy="728" rx="58" ry="14" fill="#c4222f"/></g>`);
    for (let i = 0; i < 9; i++) add(`<path d="M${1398 + i * 14} 742 q4 12 0 20" stroke="#8a5530" stroke-width="2" fill="none"/>`);
    add(`<g transform="translate(1462 724) rotate(-8)"><path d="M-22 0 q14 -12 30 0 q-16 12 -30 0Z M8 0 l10 -8 v16Z" fill="#6cc8ff"/><circle cx="-14" cy="-2" r="2" fill="#123"/></g>`);

    /* radiator with sleeping gray cat */
    add(`<g filter="url(#shadow)"><rect x="664" y="606" width="272" height="16" rx="6" fill="#d9d1bf"/>`);
    for (let i = 0; i < 12; i++) add(`<rect x="${672 + i * 22}" y="618" width="18" height="118" rx="9" fill="url(#iron)"/>`);
    add(`<rect x="664" y="728" width="272" height="10" rx="4" fill="#b9b0a0"/><rect x="676" y="738" width="10" height="22" fill="#8f8a80"/><rect x="914" y="738" width="10" height="22" fill="#8f8a80"/></g>`);
    add(`<path d="M684 606 Q690 586 720 584 H880 Q910 586 916 606Z" fill="url(#plaid)"/>`);
    add(sleepCat(800, 592, 1, CAT.gray));

    /* the tree, tilting, with a ginger cat climbing it */
    add(`<g transform="rotate(-3 270 780)">`);
    add(`<ellipse cx="270" cy="796" rx="220" ry="36" fill="#000" opacity=".3" filter="url(#soft)"/><ellipse cx="270" cy="790" rx="206" ry="30" fill="#a3172a"/><ellipse cx="270" cy="786" rx="186" ry="22" fill="#f4eee2"/>`);
    add(K.tree(270, 120, 770, 212, { ornaments: 34, lights: 74, canes: 5 }));
    add(`</g>`);
    // dangling ornament on a long thread and the cat reaching for it
    add(`<path d="M392 420 V488" stroke="#c9a24a" stroke-width="1.5"/><rect x="386" y="486" width="12" height="8" rx="2" fill="url(#gold)"/><circle cx="392" cy="508" r="17" fill="url(#orn-blue)"/>`);
    add(sitCat(300, 560, 0.82, CAT.ginger, { paw: true, look: 4, bell: true }));
    // ornaments knocked onto the floor
    add(`<circle cx="470" cy="880" r="15" fill="url(#orn-red)"/><rect x="462" y="862" width="10" height="7" rx="2" fill="url(#gold)" transform="rotate(30 467 865)"/>`);
    add(`<circle cx="120" cy="900" r="13" fill="url(#orn-gold)"/><circle cx="560" cy="930" r="12" fill="url(#orn-silver)"/>`);
    add(`<path d="M548 920 l-10 -12 M552 922 l4 -16 M556 926 l14 -8" stroke="#dfe6ec" stroke-width="2"/>`);
    add(K.gift(70, 742, 104, 74, 'url(#pawPaper)', '#f0d07a'));
    add(K.gift(380, 730, 96, 80, 'url(#fishPaper)', '#f6efe2'));
    add(K.gift(190, 800, 120, 82, '#1d6b43', '#c4222f'));

    /* right: console table, stockings with a kitten, a portrait of a very important cat */
    add(`<rect x="1218" y="160" width="204" height="176" rx="4" fill="url(#gold)" filter="url(#shadow)"/><rect x="1232" y="174" width="176" height="148" fill="#3a2a40"/>`);
    add(`<rect x="1232" y="174" width="176" height="148" fill="url(#warmGlow)" opacity=".5"/>`);
    add(`<g transform="translate(1320 262) scale(1.15)">${catHead(CAT.white, { look: -2 })}</g>`);
    add(`<path d="M1288 300 Q1320 330 1352 300 L1360 322 H1280Z" fill="#2c3f6a"/><circle cx="1336" cy="258" r="11" fill="none" stroke="#e6c27a" stroke-width="2.4"/><path d="M1347 262 q8 16 2 30" stroke="#e6c27a" stroke-width="1.5" fill="none"/>`);
    add(`<path d="M1294 228 h52 l-8 -22 h-36Z" fill="#1b1b22"/><rect x="1290" y="226" width="60" height="6" rx="3" fill="#1b1b22"/>`);
    // console
    add(`<g filter="url(#shadow)"><rect x="1110" y="380" width="460" height="26" rx="4" fill="url(#woodH)"/><rect x="1110" y="380" width="460" height="5" fill="#b07a42"/><rect x="1130" y="404" width="20" height="356" fill="#5a3219"/><rect x="1530" y="404" width="20" height="356" fill="#5a3219"/><rect x="1150" y="406" width="380" height="30" fill="#6b3d1f"/></g>`);
    add(K.swag(1110, 386, 1340, 420, 1570, 386, { n: 26, r: 11, lights: true, every: 2, berries: true }));
    add(K.candle(1124, 380, 44));
    add(K.candle(1148, 380, 64, '#a8192a'));
    add(K.candle(1530, 380, 58));
    // stockings
    const stocking = (x, fill, kitten) => {
      let s = `<g filter="url(#shadow)"><path d="M${x - 26} 436 V500 Q${x - 28} 540 ${x + 4} 544 L${x + 38} 544 Q${x + 60} 544 ${x + 58} 522 Q${x + 56} 506 ${x + 34} 504 L${x + 26} 502 V436Z" fill="${fill}"/>`;
      s += `<rect x="${x - 33}" y="416" width="66" height="26" rx="9" fill="#fbf7f0"/>`;
      for (let i = 0; i < 7; i++) s += `<circle cx="${x - 29 + i * 9.6}" cy="${441 + (i % 2) * 2}" r="5" fill="#fbf7f0"/>`;
      s += '</g>';
      if (kitten) s += `<g transform="translate(${x} 410) scale(.62)">${catHead(CAT.calico, { look: 2 })}</g><ellipse cx="${x - 14}" cy="424" rx="8" ry="6" fill="#fff"/><ellipse cx="${x + 14}" cy="424" rx="8" ry="6" fill="#fff"/>`;
      return s;
    };
    add(stocking(1260, 'url(#stkA)', false));
    add(stocking(1370, 'url(#stkB)', true));
    add(stocking(1480, '#b5162a', false));
    // tuxedo cat inside a gift box, lid on its head
    add(`<g filter="url(#shadow)"><rect x="1190" y="660" width="150" height="100" fill="#c4222f"/><rect x="1258" y="660" width="16" height="100" fill="#f0d07a"/><path d="M1190 660 l16 -10 h150 l-16 10Z" fill="#8a1422"/></g>`);
    add(sitCat(1265, 700, 0.8, CAT.tux, { look: -3 }));
    add(`<rect x="1190" y="690" width="150" height="70" fill="#c4222f"/><rect x="1258" y="690" width="16" height="70" fill="#f0d07a"/><rect x="1190" y="690" width="150" height="6" fill="#8a1422"/>`);
    add(`<g transform="rotate(-14 1262 594)"><rect x="1206" y="590" width="112" height="22" fill="#d4303f"/><rect x="1254" y="590" width="16" height="22" fill="#f0d07a"/></g>${K.bow(1258, 588, 0.7, '#f0d07a', '#b8862a')}`);
    // torn paper
    add(`<path d="M1352 760 l20 -26 l14 18 l18 -22 l6 30Z" fill="#c4222f" opacity=".9"/><path d="M1120 760 l16 -20 l10 12 l12 -16 l10 24Z" fill="#f0d07a"/>`);
    // calico tangled in tinsel on the floor, with a yarn ball
    add(sitCat(1460, 880, 0.9, CAT.calico, { look: -4, hat: true }));
    add(`<path d="M1390 820 Q1440 860 1500 830 Q1540 812 1520 860 Q1470 900 1420 870 Q1390 850 1430 800" stroke="url(#gold)" stroke-width="7" fill="none" stroke-dasharray="3 3" stroke-linecap="round"/>`);
    add(`<path d="M1330 900 Q1360 860 1400 896 Q1440 930 1490 900" stroke="#d6dbe3" stroke-width="6" fill="none" stroke-dasharray="2 3"/>`);
    add(`<circle cx="1010" cy="910" r="28" fill="#c4222f"/><path d="M986 900 q24 -12 48 4 M984 914 q26 -10 52 6 M992 928 q20 -8 40 2 M1000 886 q8 18 4 46" stroke="#8a1422" stroke-width="2.4" fill="none"/>`);
    add(`<path d="M1036 918 Q1120 960 1200 930 Q1290 900 1380 940" stroke="#c4222f" stroke-width="2.4" fill="none"/>`);
    // toy mouse
    add(`<g transform="translate(660 930)"><ellipse cx="0" cy="0" rx="22" ry="12" fill="#9aa1ab"/><circle cx="-18" cy="-8" r="7" fill="#b9c0c9"/><circle cx="-24" cy="0" r="2.4" fill="#e8838a"/><path d="M22 2 q20 6 30 -8" stroke="#e8838a" stroke-width="2.4" fill="none"/></g>`);

    /* banner: felt pennant banner hung on strings */
    add(`<path d="M520 0 L540 58 M1080 0 L1060 58" stroke="#c9a24a" stroke-width="2.4"/>`);
    add(`<g filter="url(#shadow)"><path d="M520 54 Q800 92 1080 54 L1080 134 Q800 172 520 134Z" fill="#f3e6cf"/>`);
    add(`<path d="M530 66 Q800 102 1070 66 M530 122 Q800 158 1070 122" stroke="#c4222f" stroke-width="2.4" stroke-dasharray="7 6" fill="none"/>`);
    const pts = K.quad(520, 134, 800, 172, 1080, 134, 14);
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; add(`<path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)} L${f((x0 + x1) / 2)} ${f((y0 + y1) / 2 + 26)}Z" fill="${i % 2 ? '#1d6b43' : '#c4222f'}"/>`); }
    add(`</g>`);
    add(`<circle cx="520" cy="56" r="6" fill="url(#gold)"/><circle cx="1080" cy="56" r="6" fill="url(#gold)"/>`);
    // twinkle lights along the top
    add(K.lightString(0, 18, 260, 70, 520, 24, 12, 5, K.BULB, 1));
    add(K.lightString(1080, 24, 1340, 70, 1600, 18, 12, 5, K.BULB, 4));

    add(`<rect width="1600" height="1000" fill="url(#lampLight)"/><rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  // little "z z z" drifting up from the cat asleep on the radiator
  function zzz(ctx, t) {
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.35 + i / 3) % 1);
      const x = 760 - k * 30 + Math.sin(t * 2 + i) * 4, y = 556 - k * 90, s = 6 + k * 8;
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
      ctx.strokeStyle = '#f3ead8'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); ctx.stroke();
    }
  }
  A.designs.cats = {
    id: 'cats',
    name: 'Meowy & Bright',
    blurb: 'Cats in full Christmas mischief: up the tree, in the gifts, tangled in tinsel.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M560 102 Q800 136 1040 102', size: 42, maxWidth: 440, fill: '#8f1d2b', stroke: '#f3e6cf' },
    effects: [
      { type: 'roomGlow', x: 300, y: 420, r: 700, color: '255,190,110', a: 0.05, flicker: 0.02 },
      { type: 'snow', rect: [643, 183, 314, 336], count: 60 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'star', x: 264, y: 112, r: 66 },
      { type: 'custom', draw: zzz },
    ],
    layout: 'cats',
    keepOut: [[470, 0, 660, 196], [640, 180, 320, 346], [680, 528, 240, 80], [1214, 156, 212, 184]],
    day24: { x: 1285, y: 398, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/cats.js', e); }
/* ---- src/layouts/cats.js ---- */
try {
/* Door layout for "Meowy & Bright" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["cats"]=[{"day":1,"x":1488,"y":705,"w":80,"h":102,"hinge":"left"},
{"day":2,"x":29,"y":544,"w":82,"h":96,"hinge":"right"},
{"day":3,"x":1005,"y":349,"w":150,"h":132,"hinge":"top"},
{"day":4,"x":141,"y":237,"w":106,"h":120,"hinge":"left"},
{"day":5,"x":1277,"y":819,"w":142,"h":150,"hinge":"right"},
{"day":6,"x":36,"y":818,"w":150,"h":136,"hinge":"top"},
{"day":7,"x":212,"y":718,"w":150,"h":144,"hinge":"top"},
{"day":8,"x":756,"y":613,"w":86,"h":102,"hinge":"right"},
{"day":9,"x":1425,"y":32,"w":138,"h":114,"hinge":"left"},
{"day":10,"x":1025,"y":538,"w":84,"h":108,"hinge":"left"},
{"day":11,"x":954,"y":806,"w":108,"h":138,"hinge":"top"},
{"day":12,"x":103,"y":54,"w":150,"h":134,"hinge":"right"},
{"day":13,"x":261,"y":224,"w":150,"h":118,"hinge":"right"},
{"day":14,"x":1447,"y":282,"w":120,"h":102,"hinge":"top"},
{"day":15,"x":376,"y":562,"w":150,"h":138,"hinge":"right"},
{"day":16,"x":494,"y":747,"w":112,"h":144,"hinge":"left"},
{"day":17,"x":296,"y":393,"w":126,"h":150,"hinge":"right"},
{"day":18,"x":730,"y":878,"w":102,"h":88,"hinge":"right"},
{"day":19,"x":787,"y":735,"w":150,"h":130,"hinge":"left"},
{"day":20,"x":152,"y":379,"w":126,"h":150,"hinge":"left"},
{"day":21,"x":1167,"y":872,"w":80,"h":102,"hinge":"left"},
{"day":22,"x":1299,"y":563,"w":144,"h":108,"hinge":"left"},
{"day":23,"x":1235,"y":689,"w":150,"h":118,"hinge":"left"},
{"day":24,"x":1285,"y":398,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/cats.js', e); }
/* ---- src/designs/dogs.js ---- */
try {
/* Design — "Pups & Presents"
   Hand-built SVG scene + animated canvas effects. See src/designs/parlor.js for the design contract. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  /* ---------- shared drawing kit (inlined per design so each file stands alone) ---------- */
  const f = (n) => Math.round(n * 10) / 10;
  function makeKit(R) {
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [];
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40', '#14361f'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];
    function pine(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rr(-0.3, 0.3), l = r * rr(0.9, 1.5);
        s += `<path d="M${f(x)} ${f(y)}L${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return s;
    }
    function bulb(x, y, c, r = 4.2) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".22"/><rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".75"/>`;
    }
    function lamp(x, y, c, r) { lights.push({ x, y, c, r }); return ''; }
    function berries(x, y) {
      let s = '';
      for (let i = 0; i < 3; i++) { const bx = x + rr(-6, 6), by = y + rr(-5, 5); s += `<circle cx="${f(bx)}" cy="${f(by)}" r="4.2" fill="#b3122a"/><circle cx="${f(bx - 1.3)}" cy="${f(by - 1.4)}" r="1.3" fill="#ff8f9c"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><path d="M-4 -2 C-14 -10 -24 -10 -24 -3" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/><ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    function quad(x0, y0, cx, cy, x1, y1, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]); }
      return pts;
    }
    function swag(x0, y0, cx, cy, x1, y1, o = {}) {
      const pts = quad(x0, y0, cx, cy, x1, y1, o.n || 24), r = o.r || 12;
      let s = '';
      pts.forEach(([x, y]) => (s += pine(x + rr(-3, 3), y + rr(-3, 3), r * rr(0.8, 1.1))));
      pts.forEach(([x, y], i) => { if (i % 2 === 0) s += pine(x + rr(-6, 6), y + rr(-2, 8), r * 0.75); });
      if (o.berries) pts.forEach(([x, y], i) => { if (i % 5 === 2) s += berries(x, y + 4); });
      if (o.lights) pts.forEach(([x, y], i) => { if (i % (o.every || 3) === 1) s += bulb(x + rr(-4, 4), y + rr(0, 8), BULB[(i + (o.off || 0)) % BULB.length], o.bulb || 4); });
      return s;
    }
    function lightString(x0, y0, cx, cy, x1, y1, n, r = 5, colors = BULB, off = 0) {
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#1d2a1f" stroke-width="2.4" fill="none"/>`;
      quad(x0, y0, cx, cy, x1, y1, n).forEach(([x, y], i) => { if (i > 0 && i < n) s += bulb(x, y + r + 3, colors[(i + off) % colors.length], r); });
      return s;
    }
    function starPath(x, y, ro, ri, n = 5) {
      let d = '';
      for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); }
      return d + 'Z';
    }
    function gift(x, y, w, h, fill, rib, d = 14, bowColor) {
      return `<g filter="url(#shadow)"><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".18"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".28"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="${rib}"/><path d="M${x + w / 2 - 7} ${y} l${d} ${-d * 0.6} h14 l${-d} ${d * 0.6}Z" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${rib}" opacity=".95"/><path d="M${x + w} ${y + h / 2 - 6} l${d} ${-d * 0.6} v12 l${-d} ${d * 0.6}Z" fill="${rib}" opacity=".7"/></g>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.75, bowColor || rib, '#00000055')}`;
    }
    function candle(x, baseY, h, color, w = 22) {
      const top = baseY - h;
      candles.push({ x, y: top - 10, s: 1 });
      return `<rect x="${x - w / 2 - 4}" y="${baseY - 8}" width="${w + 8}" height="9" rx="2" fill="url(#gold)"/><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h - 8}" rx="3" fill="${color || 'url(#candle)'}"/><path d="M${x - w / 2} ${top + 4} q4 14 0 22 q5 -6 6 -18Z" fill="#fffaf0" opacity=".8"/><path d="M${x} ${top} v-8" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${top - 16}" r="34" fill="url(#candleGlow)"/>`;
    }
    function snowDots(x, y, w, h, n, rMax = 2.4, op = 0.85) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(0.6 + R() * rMax)}" fill="#fff" opacity="${f(rr(0.4, op))}"/>`;
      return s;
    }
    function stars(x, y, w, h, n) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(rr(0.5, 1.8))}" fill="#fff" opacity="${f(rr(0.35, 1))}"/>`;
      return s;
    }
    function pineTree(x, y, h, color, snow = '#f4f8ff') {
      let s = '';
      for (let i = 0; i < 4; i++) {
        const ty = y - h + (i * h) / 4.6, w = h * (0.17 + i * 0.09);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + h * 0.34)} Q${f(x)} ${f(ty + h * 0.3)} ${f(x + w)} ${f(ty + h * 0.34)}Z" fill="${color}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.55)} ${f(ty + h * 0.19)} Q${f(x - w * 0.1)} ${f(ty + h * 0.14)} ${f(x + w * 0.45)} ${f(ty + h * 0.17)}Z" fill="${snow}" opacity=".92"/>`;
      }
      return s + `<rect x="${f(x - h * 0.03)}" y="${f(y - h * 0.06)}" width="${f(h * 0.06)}" height="${f(h * 0.08)}" fill="#3a2414"/>`;
    }
    /** A decorated Christmas tree (tiers drawn bottom to top) */
    function tree(cx, top, base, hw, o = {}) {
      const span = base - top;
      const T = [[0.656, 1, 1], [0.479, 0.825, 0.88], [0.302, 0.645, 0.73], [0.139, 0.459, 0.56], [0, 0.275, 0.38]].map(([a, b, c]) => [top + a * span, top + b * span, hw * c]);
      let s = '';
      const tierPath = (y0, y1, w) => {
        let d = `M${cx} ${f(y0)} Q${f(cx - w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${f(cx - w)} ${f(y1)}`;
        const n = Math.max(3, Math.round(w / 26)), step = (2 * w) / n;
        for (let i = 0; i < n; i++) d += ` Q${f(cx - w + step * (i + 0.5))} ${f(y1 + 16)} ${f(cx - w + step * (i + 1))} ${f(i < n - 1 ? y1 - 3 : y1)}`;
        return d + ` Q${f(cx + w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${f(y0)}Z`;
      };
      const inTier = (x, y, t) => y > t[0] + (t[1] - t[0]) * 0.3 && y < t[1] - 8 && Math.abs(x - cx) < t[2] * ((y - t[0]) / (t[1] - t[0])) * 0.86;
      if (o.trunk !== false) s += `<rect x="${cx - hw * 0.08}" y="${f(base - 30)}" width="${f(hw * 0.16)}" height="${f(hw * 0.25)}" fill="#4a2614"/>`;
      T.forEach((t, i) => {
        const [y0, y1, w] = t;
        if (i > 0) s += `<path d="${tierPath(y0 + 12, y1 + 12, w)}" fill="#000" opacity=".3" filter="url(#soft)"/>`;
        s += `<path d="${tierPath(y0, y1, w)}" fill="${o.fill || 'url(#treeG)'}"/>`;
        let nd = '';
        for (let k = 0; k < w * 2.1; k++) {
          const y = rr(y0 + (y1 - y0) * 0.15, y1 + 6), sp = w * ((y - y0) / (y1 - y0)), x = cx + rr(-sp, sp) * 0.98, dir = x < cx ? -1 : 1, len = rr(10, 22);
          nd += `<path d="M${f(x)} ${f(y)} l${f(dir * len * 0.7)} ${f(len * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="${f(rr(1.6, 2.8))}" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
        }
        s += nd;
        if (o.snow) s += `<path d="${tierPath(y1 - 10, y1, w * 0.95)}" fill="#f4f8ff" opacity=".85"/>`;
        if (i < 4 && o.beads !== false) s += `<path d="M${f(cx - w * 0.5)} ${f(y0 + (y1 - y0) * 0.55)} Q${cx} ${f(y0 + (y1 - y0) * 0.85 + 30)} ${f(cx + w * 0.8)} ${f(y0 + (y1 - y0) * 0.85 - 10)}" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`;
      });
      const placed = [];
      const at = (minD) => {
        for (let k = 0; k < 400; k++) {
          const t = T[Math.floor(R() * T.length)], x = rr(cx - t[2], cx + t[2]), y = rr(t[0], t[1]);
          if (!inTier(x, y, t)) continue;
          if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue;
          return [x, y];
        }
        return null;
      };
      const ok = ['red', 'gold', 'blue', 'silver', 'green', 'plum'];
      const scale = hw / 236;
      for (let i = 0; i < (o.ornaments == null ? 40 : o.ornaments); i++) {
        const p = at(22 * scale); if (!p) continue;
        const r = rr(9, 15) * Math.max(0.6, scale); placed.push([p[0], p[1], r]);
        s += `<path d="M${f(p[0])} ${f(p[1] - r - 4)} v-8" stroke="#c9a24a" stroke-width="1"/><rect x="${f(p[0] - 3.5)}" y="${f(p[1] - r - 5)}" width="7" height="6" rx="1" fill="url(#gold)"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#orn-${(o.palette || ok)[i % (o.palette || ok).length]})"/>`;
      }
      for (let i = 0; i < (o.canes == null ? 5 : o.canes); i++) {
        const p = at(20 * scale); if (!p) continue; placed.push([p[0], p[1], 12]);
        const cane = `M${f(p[0])} ${f(p[1] + 18)} V${f(p[1] - 6)} q0 -10 9 -10 q9 0 9 10`;
        s += `<path d="${cane}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${cane}" stroke="#c4222f" stroke-width="5" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < (o.lights == null ? 80 : o.lights); i++) {
        const p = at(8 * scale); if (!p) continue; placed.push([p[0], p[1], 5]);
        s += bulb(p[0], p[1], (o.bulbs || BULB)[i % (o.bulbs || BULB).length], 4 * Math.max(0.7, scale));
      }
      if (o.star !== false) {
        const sr = 38 * Math.max(0.6, scale);
        s += `<circle cx="${cx}" cy="${f(top - 6)}" r="${f(sr * 1.6)}" fill="url(#candleGlow)"/><path d="${starPath(cx, top - 4, sr, sr * 0.42)}" fill="url(#gold)" stroke="#8a5a14" stroke-width="2"/><path d="${starPath(cx, top - 4, sr * 0.47, sr * 0.2)}" fill="#fff6c8" opacity=".7"/>`;
      }
      return s;
    }
    const ornColors = { red: ['#ff5a63', '#b0101f', '#5e0710'], gold: ['#ffe39a', '#cf9a2e', '#6a4410'], blue: ['#8fb8ff', '#2a56b0', '#0f2353'], silver: ['#ffffff', '#b9c3cc', '#5b6670'], green: ['#8fe0a0', '#1f7d45', '#0b3a1d'], plum: ['#e3a0f0', '#7a2f95', '#33103f'] };
    let defs = '';
    Object.entries(ornColors).forEach(([k, [a, b, c]]) => (defs += `<radialGradient id="orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`));
    defs += `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <radialGradient id="candleGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="warmGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
      <linearGradient id="treeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>`;
    /** Classic arched ribbon banner centred at cx; the title path runs along its middle. */
    function ribbonBanner(cx, y, halfW, o = {}) {
      const a = halfW, top = y, bot = y + 74, arch = o.arch == null ? 50 : o.arch;
      const fill = o.fill || 'url(#ribbon)', dark = o.dark || 'url(#ribbonDark)', deep = o.deep || '#4a0711';
      return `<g filter="url(#shadow)">
        <path d="M${cx - a + 28} ${top + 22} L${cx - a - 68} ${top + 16} L${cx - a - 40} ${top + 60} L${cx - a - 68} ${top + 106} L${cx - a + 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx + a - 28} ${top + 22} L${cx + a + 68} ${top + 16} L${cx + a + 40} ${top + 60} L${cx + a + 68} ${top + 106} L${cx + a - 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx - a} ${top} L${cx - a + 40} ${top + 28} L${cx - a + 40} ${top + 84} L${cx - a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx + a} ${top} L${cx + a - 40} ${top + 28} L${cx + a - 40} ${top + 84} L${cx + a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx - a} ${top} Q${cx} ${top - arch - 8} ${cx + a} ${top} L${cx + a} ${bot} Q${cx} ${bot - arch - 8} ${cx - a} ${bot}Z" fill="${fill}"/>
        <path d="M${cx - a + 8} ${top + 10} Q${cx} ${top - arch + 2} ${cx + a - 8} ${top + 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
        <path d="M${cx - a + 8} ${bot - 10} Q${cx} ${bot - arch - 18} ${cx + a - 8} ${bot - 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
      </g>`;
    }
    const ribbonPath = (cx, y, halfW, arch = 50) => `M${cx - halfW + 40} ${y + 44} Q${cx} ${y + 44 - arch - 8} ${cx + halfW - 40} ${y + 44}`;
    return { rr, pick, lights, candles, BULB, GREENS, NEEDLE, pine, bulb, lamp, berries, bow, quad, swag, lightString, starPath, gift, candle, snowDots, stars, pineTree, tree, defs, ribbonBanner, ribbonPath };
  }

  /* ---------- dogs ---------- */
  // p: { body, dark, chest, muzzle, ear:'flop'|'up'|'long', mask, eyeBrow, tongue }
  function dogHead(p, o = {}) {
    let s = '';
    if (p.ear === 'up') s += `<path d="M-30 -10 L-40 -56 L-6 -24Z M30 -10 L40 -56 L6 -24Z" fill="${p.earColor || p.body}"/><path d="M-28 -18 L-34 -46 L-14 -26Z M28 -18 L34 -46 L14 -26Z" fill="#f2b8a8"/>`;
    s += `<ellipse cx="0" cy="0" rx="35" ry="31" fill="${p.body}"/>`;
    if (p.blaze) s += `<path d="M-6 -30 Q0 -34 6 -30 L10 6 H-10Z" fill="${p.blaze}"/>`;
    if (p.wrinkle) s += `<path d="M-14 -18 q14 -8 28 0 M-10 -10 q10 -5 20 0" stroke="${p.dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="0" cy="13" rx="${p.ear === 'up' ? 17 : 19}" ry="14" fill="${p.mask || p.muzzle}"/>`;
    s += `<ellipse cx="0" cy="6" rx="7.5" ry="5.5" fill="#1d1614"/><ellipse cx="-2" cy="4.5" rx="2.4" ry="1.4" fill="#fff" opacity=".6"/>`;
    s += `<path d="M0 11 v6 M0 17 q-6 6 -11 1 M0 17 q6 6 11 1" stroke="#1d1614" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (o.tongue) s += `<path d="M-6 21 q6 16 12 0Z" fill="#e86a7a"/><path d="M0 22 v7" stroke="#c44a5a" stroke-width="1.2"/>`;
    s += `<circle cx="-14" cy="-8" r="6" fill="#241612"/><circle cx="14" cy="-8" r="6" fill="#241612"/><circle cx="-16" cy="-10" r="2.2" fill="#fff"/><circle cx="12" cy="-10" r="2.2" fill="#fff"/>`;
    if (p.brow) s += `<ellipse cx="-14" cy="-19" rx="5" ry="3" fill="${p.brow}"/><ellipse cx="14" cy="-19" rx="5" ry="3" fill="${p.brow}"/>`;
    s += `<circle cx="-22" cy="8" r="6" fill="#ff8f9c" opacity=".25"/><circle cx="22" cy="8" r="6" fill="#ff8f9c" opacity=".25"/>`;
    if (p.ear === 'flop') s += `<path d="M-28 -24 Q-50 -20 -46 14 Q-40 22 -30 12 Q-26 -6 -22 -18Z M28 -24 Q50 -20 46 14 Q40 22 30 12 Q26 -6 22 -18Z" fill="${p.earColor || p.dark}"/>`;
    if (p.ear === 'long') s += `<path d="M-26 -26 Q-52 -24 -48 30 Q-40 40 -30 30 Q-24 0 -20 -20Z M26 -26 Q52 -24 48 30 Q40 40 30 30 Q24 0 20 -20Z" fill="${p.earColor || p.dark}"/>`;
    if (p.ear === 'fold') s += `<path d="M-26 -26 Q-42 -30 -40 -10 Q-34 -6 -24 -16Z M26 -26 Q42 -30 40 -10 Q34 -6 24 -16Z" fill="${p.earColor || p.dark}"/>`;
    if (o.antlers) s += `<path d="M-30 -24 Q-36 -50 -26 -64 M-34 -44 l-14 -8 M-29 -56 l10 -10 M30 -24 Q36 -50 26 -64 M34 -44 l14 -8 M29 -56 l-10 -10" stroke="#8a5a30" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-32 -26 Q0 -40 32 -26" stroke="#c4222f" stroke-width="5" fill="none"/><circle cx="0" cy="-34" r="5" fill="#c4222f"/>`;
    if (o.hat) s += `<path d="M-30 -22 Q-8 -82 34 -60 Q40 -44 30 -22Z" fill="#c4222f"/><rect x="-36" y="-30" width="70" height="14" rx="7" fill="#fbf7f0"/><circle cx="38" cy="-60" r="9" fill="#fbf7f0"/>`;
    return s;
  }
  function dogSit(x, y, sc, p, o = {}) {
    let s = `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="2" rx="52" ry="10" fill="#000" opacity=".3"/>`;
    if (!o.noTail) s += p.curl ? `<path d="M34 -30 q26 -6 18 -22 q-8 -10 -16 0 q-4 8 6 8" stroke="${p.body}" stroke-width="9" fill="none" stroke-linecap="round"/>` : `<path d="M34 -8 Q66 -14 70 -46" stroke="${p.body}" stroke-width="11" fill="none" stroke-linecap="round"/>${p.tailTip ? `<circle cx="70" cy="-46" r="6" fill="${p.tailTip}"/>` : ''}`;
    s += `<path d="M-42 0 Q-50 -62 -24 -88 L24 -88 Q50 -62 42 0Z" fill="${p.body}"/>`;
    if (p.saddle) s += `<path d="M-40 -10 Q-48 -58 -20 -76 Q-4 -50 -30 -4Z M40 -10 Q48 -58 20 -76 Q4 -50 30 -4Z" fill="${p.saddle}"/>`;
    s += `<ellipse cx="0" cy="-40" rx="18" ry="34" fill="${p.chest}"/>`;
    s += `<rect x="-24" y="-46" width="16" height="44" rx="8" fill="${p.leg || p.body}"/><rect x="8" y="-46" width="16" height="44" rx="8" fill="${p.leg || p.body}"/>`;
    s += `<ellipse cx="-16" cy="-3" rx="12" ry="7" fill="${p.paw || p.chest}"/><ellipse cx="16" cy="-3" rx="12" ry="7" fill="${p.paw || p.chest}"/>`;
    if (o.scarf) s += `<path d="M-28 -86 Q0 -72 28 -86 L30 -76 Q0 -60 -30 -76Z" fill="${o.scarf}"/><path d="M14 -74 l8 36 l12 -4 l-8 -32Z" fill="${o.scarf}"/><path d="M-26 -80 Q0 -68 26 -80" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 5" fill="none" opacity=".7"/>`;
    if (o.collar) s += `<path d="M-26 -84 Q0 -72 26 -84" stroke="${o.collar}" stroke-width="7" fill="none"/><circle cx="0" cy="-74" r="6" fill="url(#gold)"/>`;
    s += `<g transform="translate(0 -114)">${dogHead(p, o)}</g>`;
    return s + '</g>';
  }
  function dachshund(x, y, sc) {
    const b = '#8a4a22', d = '#5a2c12';
    return `<g transform="translate(${x} ${y}) scale(${sc})">
      <ellipse cx="0" cy="4" rx="96" ry="10" fill="#000" opacity=".3"/>
      <path d="M-84 -36 Q-110 -40 -116 -60" stroke="${b}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <rect x="-70" y="-26" width="15" height="30" rx="7" fill="${d}"/><rect x="40" y="-26" width="15" height="30" rx="7" fill="${d}"/>
      <rect x="-90" y="-62" width="160" height="46" rx="23" fill="${b}"/>
      <path d="M-60 -62 h100 a8 8 0 0 1 0 0 v46 h-100Z" fill="#c4222f"/>
      <path d="M-60 -50 h100 M-60 -28 h100" stroke="#fbf7f0" stroke-width="6"/>
      <path d="M-60 -39 h100" stroke="#1d6b43" stroke-width="5" stroke-dasharray="8 6"/>
      <rect x="-56" y="-26" width="15" height="30" rx="7" fill="${b}"/><rect x="54" y="-26" width="15" height="30" rx="7" fill="${b}"/>
      <ellipse cx="-48" cy="2" rx="11" ry="5" fill="${d}"/><ellipse cx="62" cy="2" rx="11" ry="5" fill="${d}"/>
      <path d="M60 -56 Q76 -96 104 -92 Q128 -90 136 -70 Q150 -66 148 -56 Q140 -46 118 -50 Q90 -50 74 -40Z" fill="${b}"/>
      <ellipse cx="148" cy="-60" rx="7" ry="5" fill="#1d1614"/>
      <circle cx="112" cy="-78" r="5.5" fill="#241612"/><circle cx="110" cy="-80" r="2" fill="#fff"/>
      <path d="M92 -90 Q76 -86 78 -50 Q86 -42 96 -54 Q98 -76 100 -86Z" fill="${d}"/>
      <path d="M140 -52 q-6 6 -14 4" stroke="#1d1614" stroke-width="2" fill="none"/>
      <path d="M96 -90 Q90 -116 100 -126 M92 -108 l-12 -6 M110 -88 Q118 -114 130 -120 M116 -104 l12 -4" stroke="#8a5a30" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M90 -92 Q108 -100 124 -88" stroke="#c4222f" stroke-width="4" fill="none"/>
    </g>`;
  }
  function boneOrn(x, y, s = 1, c = '#f6efe2') {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -22 v-10" stroke="#c9a24a" stroke-width="1.5"/><path d="M-18 -6 a7 7 0 1 1 6 -10 h24 a7 7 0 1 1 6 10 a7 7 0 1 1 -6 10 h-24 a7 7 0 1 1 -6 -10Z" fill="${c}" stroke="#b89a6a" stroke-width="1.5"/><path d="M-10 -10 h20" stroke="#fff" stroke-width="2" opacity=".7"/></g>`;
  }
  function torn(x, y, w, h, fill, rot = 0) {
    let d = `M0 0 L${w} 0`;
    for (let i = 0; i <= 6; i++) d += ` L${w - (i % 2 ? 6 : 0)} ${(h / 6) * i}`;
    d += ` L0 ${h}`;
    for (let i = 6; i >= 0; i--) d += ` L${i % 2 ? 7 : 0} ${(h / 6) * i}`;
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${d}Z" fill="${fill}"/><path d="M4 4 L${w - 6} 6" stroke="#fff" stroke-width="2" opacity=".3"/></g>`;
  }
  function curl(x, y, c, n = 4, r = 10) {
    let d = `M${x} ${y}`;
    for (let i = 0; i < n; i++) d += ` q${r} ${-r * 0.8} ${r * 1.6} 0 q${-r * 0.6} ${r * 0.8} ${r * 0.2} ${r * 0.9}`;
    return `<path d="${d}" stroke="${c}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  }

  function build() {
    const R = A.util.rng(2512);
    const K = makeKit(R);
    const { rr, pick } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="siding" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5a4c"/><stop offset="1" stop-color="#58786a"/></linearGradient>
      <pattern id="boards" width="40" height="34" patternUnits="userSpaceOnUse"><rect width="40" height="34" fill="none"/><rect y="30" width="40" height="4" fill="#1e3329" opacity=".55"/><rect y="0" width="40" height="2" fill="#a9c4b4" opacity=".18"/></pattern>
      <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1840"/><stop offset="1" stop-color="#3b3a7a"/></linearGradient>
      <linearGradient id="porch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a32"/><stop offset="1" stop-color="#8a6242"/></linearGradient>
      <linearGradient id="snowG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4ff"/><stop offset="1" stop-color="#c9d8ee"/></linearGradient>
      <linearGradient id="doorG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a1424"/><stop offset=".5" stop-color="#a3182b"/><stop offset="1" stop-color="#6a1020"/></linearGradient>
      <radialGradient id="winGlow" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".7" stop-color="#f0a650"/><stop offset="1" stop-color="#b8622a"/></radialGradient>
      <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a06a3a"/><stop offset="1" stop-color="#6b4220"/></linearGradient>
      <pattern id="bonePaper" width="40" height="30" patternUnits="userSpaceOnUse"><rect width="40" height="30" fill="#2a5aa8"/><path d="M10 15 a3 3 0 1 1 3 -4 h12 a3 3 0 1 1 3 4 a3 3 0 1 1 -3 4 h-12 a3 3 0 1 1 -3 -4Z" fill="#f6efe2"/></pattern>
      <pattern id="pawPaper" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="#1d6b43"/><g fill="#f0d07a"><circle cx="17" cy="20" r="5"/><circle cx="10" cy="12" r="2.4"/><circle cx="15" cy="9" r="2.4"/><circle cx="20" cy="9" r="2.4"/><circle cx="25" cy="12" r="2.4"/></g></pattern>
      <pattern id="stripePaper" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#f4ede0"/><rect width="7" height="16" fill="#c4222f"/></pattern>
      <pattern id="dotPaper" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e0b24a"/><circle cx="8" cy="8" r="2.6" fill="#b3172b"/></pattern>
      <pattern id="plaid" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#a3172a"/><rect y="12" width="36" height="8" fill="#1b2a1e" opacity=".7"/><rect x="12" width="8" height="36" fill="#1b2a1e" opacity=".5"/></pattern>
      <radialGradient id="porchLight" cx="800" cy="420" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc56b" stop-opacity=".22"/><stop offset="1" stop-color="#ffc56b" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#060714" stop-opacity=".6"/></radialGradient>
    </defs>`);

    /* house front */
    add(`<rect width="1600" height="740" fill="url(#siding)"/><rect width="1600" height="740" fill="url(#boards)"/>`);
    // porch ceiling + beam
    add(`<rect width="1600" height="96" fill="#2a1d14"/><rect y="88" width="1600" height="16" fill="#e9e0cf"/><rect y="102" width="1600" height="5" fill="#9c8f78"/>`);
    for (let x = 0; x < 1600; x += 60) add(`<rect x="${x}" y="0" width="3" height="88" fill="#140d08" opacity=".7"/>`);
    // icicle lights + hanging bone ornaments along the beam
    for (let x = 12; x < 1600; x += 22) { const h = 6 + ((x * 7) % 5) * 3; add(`<path d="M${x} 106 v${h}" stroke="#2a2a2a" stroke-width="1.2"/>`); add(K.bulb(x, 110 + h, (x / 22) % 3 < 1 ? '#bfe3ff' : '#fff6d8', 3.2)); }
    [180, 1420].forEach((x, i) => add(boneOrn(x, 160, 1.1, i ? '#f0d07a' : '#f6efe2')));

    // windows
    const win = (x) => {
      let s = `<rect x="${x - 34}" y="236" width="30" height="320" fill="#1f3a2c"/><rect x="${x + 244}" y="236" width="30" height="320" fill="#1f3a2c"/>`;
      for (let i = 0; i < 9; i++) s += `<rect x="${x - 30}" y="${248 + i * 34}" width="22" height="4" fill="#0f2318"/><rect x="${x + 248}" y="${248 + i * 34}" width="22" height="4" fill="#0f2318"/>`;
      s += `<rect x="${x - 6}" y="230" width="250" height="330" fill="#f1e7d2"/><rect x="${x + 8}" y="244" width="222" height="302" fill="url(#winGlow)"/>`;
      return s;
    };
    add(win(220));
    add(win(1140));
    // inside left window: a lit tree silhouette
    add(`<g opacity=".9">${K.tree(330, 300, 548, 80, { ornaments: 10, lights: 26, canes: 0, beads: false, fill: '#2a3a20' })}</g>`);
    // inside right window: a fireplace glow and stockings
    add(`<rect x="1170" y="430" width="160" height="116" fill="#7a3a22"/><rect x="1200" y="470" width="100" height="76" fill="#2a0e06"/><ellipse cx="1250" cy="530" rx="44" ry="22" fill="#ff9a3a" opacity=".85"/><rect x="1160" y="420" width="180" height="14" fill="#5a2c14"/>`);
    [1192, 1236, 1280, 1316].forEach((x, i) => add(`<path d="M${x} 434 v26 q0 10 10 10 h10 v-8 h-6 v-28Z" fill="${i % 2 ? '#1d6b43' : '#c4222f'}"/><rect x="${x - 2}" y="432" width="16" height="7" fill="#fbf7f0"/>`));
    [220, 1140].forEach((x) => add(`<rect x="${x + 113}" y="244" width="12" height="302" fill="#efe4cd"/><rect x="${x + 8}" y="388" width="222" height="12" fill="#efe4cd"/>`));
    // window boxes with greenery
    [220, 1140].forEach((x, k) => {
      add(`<rect x="${x - 14}" y="560" width="266" height="40" rx="4" fill="#5a2c14"/><rect x="${x - 14}" y="560" width="266" height="6" fill="#8a5530"/>`);
      add(K.swag(x - 10, 560, x + 119, 572, x + 248, 560, { n: 18, r: 12, lights: true, every: 2, berries: true, off: k * 3 }));
    });
    // lanterns either side of the door
    [600, 1000].forEach((x) => add(`<path d="M${x} 330 v-20 h20" stroke="#1d1d1d" stroke-width="4" fill="none"/><path d="M${x - 22} 338 h44 l-6 -10 h-32Z" fill="#1d1d1d"/><rect x="${x - 18}" y="338" width="36" height="58" fill="#ffe9b8" opacity=".85"/><path d="M${x - 18} 338 v58 M${x + 18} 338 v58 M${x} 338 v58" stroke="#1d1d1d" stroke-width="3"/><path d="M${x - 22} 396 h44 l-8 10 h-28Z" fill="#1d1d1d"/>` + K.candle(x, 392, 26, '#f6efe2', 10)));

    /* front door */
    add(`<rect x="676" y="244" width="248" height="490" fill="#efe4cd"/><path d="M676 252 Q800 196 924 252" fill="#efe4cd"/><path d="M700 260 Q800 214 900 260Z" fill="url(#winGlow)"/>`);
    add(`<rect x="700" y="266" width="200" height="468" fill="url(#doorG)"/>`);
    [[716, 290, 76, 150], [808, 290, 76, 150], [716, 470, 76, 110], [808, 470, 76, 110], [716, 600, 76, 110], [808, 600, 76, 110]].forEach(([x, y, w, h]) => add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#5a0c18" stroke-width="5"/><rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="3" fill="none" stroke="#d9586a" stroke-opacity=".35" stroke-width="2"/>`));
    add(`<circle cx="884" cy="530" r="8" fill="url(#gold)"/>`);
    // door frame lights
    add(K.lightString(676, 250, 800, 180, 924, 250, 14, 4));
    // wreath with a bone ornament
    let wr = '';
    for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 24 + ring * 6; i++) { const a = (i / (24 + ring * 6)) * Math.PI * 2 + ring * 0.2; wr += K.pine(800 + Math.cos(a) * (46 + ring * 11), 392 + Math.sin(a) * (46 + ring * 11), 11 - ring); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; wr += K.berries(800 + Math.cos(a) * 58, 392 + Math.sin(a) * 58); }
    add(`<g filter="url(#shadow)">${wr}</g>` + K.bow(800, 456, 1) + boneOrn(800, 392, 1.2));

    // porch columns wrapped in ribbon
    [[40, 110], [1490, 110]].forEach(([x, w]) => {
      add(`<rect x="${x}" y="100" width="${w - 40}" height="640" fill="#f3ead6"/><rect x="${x}" y="100" width="12" height="640" fill="#d9ccb0"/><rect x="${x - 8}" y="100" width="${w - 24}" height="20" fill="#e9e0cf"/>`);
      for (let y = 120; y < 740; y += 60) add(`<path d="M${x} ${y} L${x + w - 40} ${y + 30} v14 L${x} ${y + 14}Z" fill="#c4222f"/>`);
      add(K.swag(x + 10, 130, x + 60, 400, x + 10, 700, { n: 30, r: 10, lights: true, every: 3 }));
    });

    /* porch floor + steps + snowy yard */
    add(`<rect y="734" width="1600" height="80" fill="url(#porch)"/>`);
    for (let x = -200; x < 1800; x += 70) add(`<path d="M${x} 814 L${800 + (x - 800) * 0.82} 734" stroke="#4a2e1a" stroke-width="2" opacity=".6"/>`);
    add(`<rect y="730" width="1600" height="8" fill="#3a2414"/>`);
    add(`<rect x="0" y="812" width="1600" height="188" fill="url(#snowG)"/>`);
    add(`<path d="M0 820 Q200 800 420 826 Q520 836 600 820 V1000 H0Z" fill="#fff" opacity=".8"/><path d="M1000 820 Q1100 836 1240 818 Q1420 800 1600 826 V1000 H1000Z" fill="#fff" opacity=".8"/>`);
    // steps
    [[560, 812, 480, 50], [530, 860, 540, 60], [500, 918, 600, 82]].forEach(([x, y, w, h], i) => add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${i % 2 ? '#7a5236' : '#8a6242'}"/><rect x="${x}" y="${y}" width="${w}" height="10" fill="#f4f8ff"/><path d="M${x} ${y + 10} Q${x + w / 2} ${y + 20} ${x + w} ${y + 10}" fill="#f4f8ff"/>`));
    // doormat
    add(`<rect x="720" y="754" width="160" height="42" rx="4" fill="url(#plaid)"/>`);
    // snowy shrubs with lights
    [[470, 786, 70], [1130, 786, 70], [140, 840, 90], [1460, 840, 90]].forEach(([x, y, r], k) => {
      add(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="#1d4d2f"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.4}" rx="${r * 0.55}" ry="${r * 0.22}" fill="#f4f8ff"/><ellipse cx="${x + r * 0.35}" cy="${y - r * 0.32}" rx="${r * 0.4}" ry="${r * 0.18}" fill="#f4f8ff"/>`);
      for (let i = 0; i < 9; i++) add(K.bulb(x + rr(-r * 0.8, r * 0.8), y + rr(-r * 0.2, r * 0.4), K.BULB[(i + k) % 7], 3.4));
    });

    /* gifts, torn paper and ribbon everywhere */
    add(K.gift(1010, 690, 110, 80, 'url(#bonePaper)', '#f0d07a'));
    add(K.gift(1130, 710, 86, 64, 'url(#stripePaper)', '#1d6b43'));
    add(K.gift(60, 870, 120, 84, 'url(#pawPaper)', '#c4222f'));
    // the torn one the beagle is investigating
    add(`<g filter="url(#shadow)"><rect x="330" y="880" width="120" height="80" fill="#a3172a"/><path d="M330 880 l14 -9 h120 l-14 9Z" fill="#c4222f"/><path d="M450 880 l14 -9 v80 l-14 9Z" fill="#7a0f1f"/><path d="M350 880 l24 26 l18 -20 l24 30 l18 -36 l16 0 v80 h-100Z" fill="#d9a83a"/></g>`);
    add(torn(300, 960, 70, 30, 'url(#stripePaper)', -12) + torn(470, 940, 60, 26, 'url(#dotPaper)', 20) + torn(1240, 900, 80, 30, 'url(#bonePaper)', -8) + torn(1360, 950, 66, 28, '#c4222f', 14) + torn(960, 760, 54, 22, 'url(#pawPaper)', 10) + torn(560, 760, 50, 22, '#e0b24a', -16));
    add(curl(250, 940, '#c4222f') + curl(1300, 880, '#f0d07a', 5, 9) + curl(620, 780, '#1d6b43', 3) + curl(1050, 960, '#c4222f', 4, 12) + curl(1420, 760, '#e0b24a', 3));

    /* the dogs */
    const LAB = { body: '#e9c27a', dark: '#c9964a', chest: '#f4dca8', muzzle: '#f4dca8', ear: 'flop', earColor: '#d9a85a' };
    const CORGI = { body: '#e08a3a', dark: '#b8622a', chest: '#fbf4ea', muzzle: '#fbf4ea', ear: 'up', blaze: '#fbf4ea', leg: '#fbf4ea', paw: '#fbf4ea' };
    const BEAGLE = { body: '#c98a4a', dark: '#7a4a22', chest: '#fbf4ea', muzzle: '#fbf4ea', ear: 'long', earColor: '#8a5226', saddle: '#2a1d16', blaze: '#fbf4ea', tailTip: '#fbf4ea', leg: '#fbf4ea' };
    const PUG = { body: '#e6c79a', dark: '#4a3a30', chest: '#f0d8b0', muzzle: '#2e2622', mask: '#2e2622', ear: 'fold', earColor: '#2e2622', wrinkle: true, curl: true };
    add(dogSit(510, 800, 1.25, LAB, { scarf: '#c4222f', tongue: true, noTail: true }));
    // pug sitting in an open gift box
    add(`<g filter="url(#shadow)"><path d="M1394 700 l14 -9 h120 l-14 9Z" fill="#1d6b43"/><path d="M1514 700 l14 -9 v80 l-14 9Z" fill="#0f3d24"/></g>`);
    add(dogSit(1454, 744, 0.95, PUG, { antlers: true, tongue: true }));
    add(`<rect x="1394" y="700" width="120" height="80" fill="#1d6b43"/><rect x="1446" y="700" width="16" height="80" fill="#f0d07a"/><rect x="1394" y="700" width="120" height="6" fill="#0f3d24"/>`);
    add(dogSit(800, 990, 1.15, CORGI, { hat: true, tongue: true, noTail: true, collar: '#1d6b43' }));
    add(dogSit(250, 930, 1.0, BEAGLE, { collar: '#c4222f' }));
    add(dachshund(1170, 972, 1.1));

    /* banner: a hanging wooden plank sign */
    add(`<path d="M580 104 L620 140 M1020 104 L980 140" stroke="#c9a24a" stroke-width="3"/>`);
    add(`<g filter="url(#shadow)"><rect x="560" y="132" width="480" height="84" rx="10" fill="url(#plank)"/><rect x="560" y="132" width="480" height="8" rx="4" fill="#c48a52"/><path d="M576 160 h448 M576 190 h448" stroke="#5a3418" stroke-width="1.5" opacity=".5"/><rect x="570" y="142" width="460" height="64" rx="7" fill="none" stroke="#f0d07a" stroke-width="2.4" stroke-dasharray="2 6"/></g>`);
    add(K.swag(552, 136, 800, 152, 1048, 136, { n: 26, r: 9, berries: true }));
    [580, 1020].forEach((x) => add(`<circle cx="${x}" cy="148" r="5" fill="url(#gold)"/>`));

    add(`<rect width="1600" height="1000" fill="url(#porchLight)"/><rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  // the lab's tail, wagging happily
  function wag(ctx, t) {
    const a = Math.sin(t * 9) * 0.5;
    ctx.translate(510 + 34 * 1.25, 800 - 10 * 1.25);
    ctx.rotate(a - 0.5);
    ctx.strokeStyle = '#e9c27a'; ctx.lineWidth = 13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -6, 46, -44); ctx.stroke();
  }

  A.designs.dogs = {
    id: 'dogs',
    name: 'Pups & Presents',
    blurb: 'A snowy front porch full of dogs in scarves and antlers, and not one gift left unopened.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M600 182 Q800 178 1000 182', size: 40, maxWidth: 420, fill: '#fff3d6', stroke: '#3a1d0c' },
    effects: [
      { type: 'roomGlow', x: 800, y: 420, r: 800, color: '255,190,110', a: 0.05, flicker: 0.025 },
      { type: 'glow', x: 339, y: 395, r: 220, color: '255,200,120', a: 0.18, speed: 1.1 },
      { type: 'glow', x: 1259, y: 395, r: 220, color: '255,170,90', a: 0.2, speed: 2.3 },
      { type: 'custom', draw: wag },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'snow', rect: [0, 108, 1600, 892], count: 150, a: 0.8 },
    ],
    layout: 'dogs',
    keepOut: [[540, 96, 520, 130], [420, 610, 180, 200], [730, 840, 150, 160]],
    day24: { x: 715, y: 318, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/dogs.js', e); }
/* ---- src/layouts/dogs.js ---- */
try {
/* Door layout for "Pups & Presents" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["dogs"]=[{"day":1,"x":1412,"y":411,"w":150,"h":116,"hinge":"left"},
{"day":2,"x":769,"y":481,"w":124,"h":150,"hinge":"left"},
{"day":3,"x":908,"y":812,"w":122,"h":150,"hinge":"right"},
{"day":4,"x":156,"y":769,"w":116,"h":150,"hinge":"top"},
{"day":5,"x":726,"y":651,"w":114,"h":144,"hinge":"left"},
{"day":6,"x":431,"y":281,"w":92,"h":120,"hinge":"right"},
{"day":7,"x":459,"y":416,"w":126,"h":150,"hinge":"left"},
{"day":8,"x":30,"y":817,"w":114,"h":106,"hinge":"top"},
{"day":9,"x":1118,"y":317,"w":122,"h":144,"hinge":"left"},
{"day":10,"x":1182,"y":822,"w":150,"h":142,"hinge":"right"},
{"day":11,"x":1175,"y":30,"w":126,"h":106,"hinge":"right"},
{"day":12,"x":39,"y":330,"w":120,"h":104,"hinge":"right"},
{"day":13,"x":1236,"y":150,"w":138,"h":150,"hinge":"left"},
{"day":14,"x":1014,"y":658,"w":150,"h":120,"hinge":"left"},
{"day":15,"x":1053,"y":482,"w":146,"h":150,"hinge":"left"},
{"day":16,"x":1381,"y":539,"w":146,"h":150,"hinge":"left"},
{"day":17,"x":1451,"y":708,"w":108,"h":94,"hinge":"left"},
{"day":18,"x":162,"y":446,"w":122,"h":150,"hinge":"left"},
{"day":19,"x":497,"y":845,"w":150,"h":124,"hinge":"left"},
{"day":20,"x":1450,"y":228,"w":124,"h":150,"hinge":"top"},
{"day":21,"x":336,"y":29,"w":132,"h":122,"hinge":"left"},
{"day":22,"x":137,"y":163,"w":138,"h":150,"hinge":"right"},
{"day":23,"x":311,"y":704,"w":104,"h":120,"hinge":"top"},
{"day":24,"x":715,"y":318,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/dogs.js', e); }
/* ---- src/designs/gingerbread.js ---- */
try {
/* Design — "Gingerbread Lane"
   Hand-built SVG scene + animated canvas effects. See src/designs/parlor.js for the design contract. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  /* ---------- shared drawing kit (inlined per design so each file stands alone) ---------- */
  const f = (n) => Math.round(n * 10) / 10;
  function makeKit(R) {
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [];
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40', '#14361f'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];
    function pine(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rr(-0.3, 0.3), l = r * rr(0.9, 1.5);
        s += `<path d="M${f(x)} ${f(y)}L${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return s;
    }
    function bulb(x, y, c, r = 4.2) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".22"/><rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".75"/>`;
    }
    function lamp(x, y, c, r) { lights.push({ x, y, c, r }); return ''; }
    function berries(x, y) {
      let s = '';
      for (let i = 0; i < 3; i++) { const bx = x + rr(-6, 6), by = y + rr(-5, 5); s += `<circle cx="${f(bx)}" cy="${f(by)}" r="4.2" fill="#b3122a"/><circle cx="${f(bx - 1.3)}" cy="${f(by - 1.4)}" r="1.3" fill="#ff8f9c"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><path d="M-4 -2 C-14 -10 -24 -10 -24 -3" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/><ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    function quad(x0, y0, cx, cy, x1, y1, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]); }
      return pts;
    }
    function swag(x0, y0, cx, cy, x1, y1, o = {}) {
      const pts = quad(x0, y0, cx, cy, x1, y1, o.n || 24), r = o.r || 12;
      let s = '';
      pts.forEach(([x, y]) => (s += pine(x + rr(-3, 3), y + rr(-3, 3), r * rr(0.8, 1.1))));
      pts.forEach(([x, y], i) => { if (i % 2 === 0) s += pine(x + rr(-6, 6), y + rr(-2, 8), r * 0.75); });
      if (o.berries) pts.forEach(([x, y], i) => { if (i % 5 === 2) s += berries(x, y + 4); });
      if (o.lights) pts.forEach(([x, y], i) => { if (i % (o.every || 3) === 1) s += bulb(x + rr(-4, 4), y + rr(0, 8), BULB[(i + (o.off || 0)) % BULB.length], o.bulb || 4); });
      return s;
    }
    function lightString(x0, y0, cx, cy, x1, y1, n, r = 5, colors = BULB, off = 0) {
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#1d2a1f" stroke-width="2.4" fill="none"/>`;
      quad(x0, y0, cx, cy, x1, y1, n).forEach(([x, y], i) => { if (i > 0 && i < n) s += bulb(x, y + r + 3, colors[(i + off) % colors.length], r); });
      return s;
    }
    function starPath(x, y, ro, ri, n = 5) {
      let d = '';
      for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); }
      return d + 'Z';
    }
    function gift(x, y, w, h, fill, rib, d = 14, bowColor) {
      return `<g filter="url(#shadow)"><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".18"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".28"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="${rib}"/><path d="M${x + w / 2 - 7} ${y} l${d} ${-d * 0.6} h14 l${-d} ${d * 0.6}Z" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${rib}" opacity=".95"/><path d="M${x + w} ${y + h / 2 - 6} l${d} ${-d * 0.6} v12 l${-d} ${d * 0.6}Z" fill="${rib}" opacity=".7"/></g>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.75, bowColor || rib, '#00000055')}`;
    }
    function candle(x, baseY, h, color, w = 22) {
      const top = baseY - h;
      candles.push({ x, y: top - 10, s: 1 });
      return `<rect x="${x - w / 2 - 4}" y="${baseY - 8}" width="${w + 8}" height="9" rx="2" fill="url(#gold)"/><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h - 8}" rx="3" fill="${color || 'url(#candle)'}"/><path d="M${x - w / 2} ${top + 4} q4 14 0 22 q5 -6 6 -18Z" fill="#fffaf0" opacity=".8"/><path d="M${x} ${top} v-8" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${top - 16}" r="34" fill="url(#candleGlow)"/>`;
    }
    function snowDots(x, y, w, h, n, rMax = 2.4, op = 0.85) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(0.6 + R() * rMax)}" fill="#fff" opacity="${f(rr(0.4, op))}"/>`;
      return s;
    }
    function stars(x, y, w, h, n) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(rr(0.5, 1.8))}" fill="#fff" opacity="${f(rr(0.35, 1))}"/>`;
      return s;
    }
    function pineTree(x, y, h, color, snow = '#f4f8ff') {
      let s = '';
      for (let i = 0; i < 4; i++) {
        const ty = y - h + (i * h) / 4.6, w = h * (0.17 + i * 0.09);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + h * 0.34)} Q${f(x)} ${f(ty + h * 0.3)} ${f(x + w)} ${f(ty + h * 0.34)}Z" fill="${color}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.55)} ${f(ty + h * 0.19)} Q${f(x - w * 0.1)} ${f(ty + h * 0.14)} ${f(x + w * 0.45)} ${f(ty + h * 0.17)}Z" fill="${snow}" opacity=".92"/>`;
      }
      return s + `<rect x="${f(x - h * 0.03)}" y="${f(y - h * 0.06)}" width="${f(h * 0.06)}" height="${f(h * 0.08)}" fill="#3a2414"/>`;
    }
    /** A decorated Christmas tree (tiers drawn bottom to top) */
    function tree(cx, top, base, hw, o = {}) {
      const span = base - top;
      const T = [[0.656, 1, 1], [0.479, 0.825, 0.88], [0.302, 0.645, 0.73], [0.139, 0.459, 0.56], [0, 0.275, 0.38]].map(([a, b, c]) => [top + a * span, top + b * span, hw * c]);
      let s = '';
      const tierPath = (y0, y1, w) => {
        let d = `M${cx} ${f(y0)} Q${f(cx - w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${f(cx - w)} ${f(y1)}`;
        const n = Math.max(3, Math.round(w / 26)), step = (2 * w) / n;
        for (let i = 0; i < n; i++) d += ` Q${f(cx - w + step * (i + 0.5))} ${f(y1 + 16)} ${f(cx - w + step * (i + 1))} ${f(i < n - 1 ? y1 - 3 : y1)}`;
        return d + ` Q${f(cx + w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${f(y0)}Z`;
      };
      const inTier = (x, y, t) => y > t[0] + (t[1] - t[0]) * 0.3 && y < t[1] - 8 && Math.abs(x - cx) < t[2] * ((y - t[0]) / (t[1] - t[0])) * 0.86;
      if (o.trunk !== false) s += `<rect x="${cx - hw * 0.08}" y="${f(base - 30)}" width="${f(hw * 0.16)}" height="${f(hw * 0.25)}" fill="#4a2614"/>`;
      T.forEach((t, i) => {
        const [y0, y1, w] = t;
        if (i > 0) s += `<path d="${tierPath(y0 + 12, y1 + 12, w)}" fill="#000" opacity=".3" filter="url(#soft)"/>`;
        s += `<path d="${tierPath(y0, y1, w)}" fill="${o.fill || 'url(#treeG)'}"/>`;
        let nd = '';
        for (let k = 0; k < w * 2.1; k++) {
          const y = rr(y0 + (y1 - y0) * 0.15, y1 + 6), sp = w * ((y - y0) / (y1 - y0)), x = cx + rr(-sp, sp) * 0.98, dir = x < cx ? -1 : 1, len = rr(10, 22);
          nd += `<path d="M${f(x)} ${f(y)} l${f(dir * len * 0.7)} ${f(len * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="${f(rr(1.6, 2.8))}" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
        }
        s += nd;
        if (o.snow) s += `<path d="${tierPath(y1 - 10, y1, w * 0.95)}" fill="#f4f8ff" opacity=".85"/>`;
        if (i < 4 && o.beads !== false) s += `<path d="M${f(cx - w * 0.5)} ${f(y0 + (y1 - y0) * 0.55)} Q${cx} ${f(y0 + (y1 - y0) * 0.85 + 30)} ${f(cx + w * 0.8)} ${f(y0 + (y1 - y0) * 0.85 - 10)}" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`;
      });
      const placed = [];
      const at = (minD) => {
        for (let k = 0; k < 400; k++) {
          const t = T[Math.floor(R() * T.length)], x = rr(cx - t[2], cx + t[2]), y = rr(t[0], t[1]);
          if (!inTier(x, y, t)) continue;
          if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue;
          return [x, y];
        }
        return null;
      };
      const ok = ['red', 'gold', 'blue', 'silver', 'green', 'plum'];
      const scale = hw / 236;
      for (let i = 0; i < (o.ornaments == null ? 40 : o.ornaments); i++) {
        const p = at(22 * scale); if (!p) continue;
        const r = rr(9, 15) * Math.max(0.6, scale); placed.push([p[0], p[1], r]);
        s += `<path d="M${f(p[0])} ${f(p[1] - r - 4)} v-8" stroke="#c9a24a" stroke-width="1"/><rect x="${f(p[0] - 3.5)}" y="${f(p[1] - r - 5)}" width="7" height="6" rx="1" fill="url(#gold)"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#orn-${(o.palette || ok)[i % (o.palette || ok).length]})"/>`;
      }
      for (let i = 0; i < (o.canes == null ? 5 : o.canes); i++) {
        const p = at(20 * scale); if (!p) continue; placed.push([p[0], p[1], 12]);
        const cane = `M${f(p[0])} ${f(p[1] + 18)} V${f(p[1] - 6)} q0 -10 9 -10 q9 0 9 10`;
        s += `<path d="${cane}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${cane}" stroke="#c4222f" stroke-width="5" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < (o.lights == null ? 80 : o.lights); i++) {
        const p = at(8 * scale); if (!p) continue; placed.push([p[0], p[1], 5]);
        s += bulb(p[0], p[1], (o.bulbs || BULB)[i % (o.bulbs || BULB).length], 4 * Math.max(0.7, scale));
      }
      if (o.star !== false) {
        const sr = 38 * Math.max(0.6, scale);
        s += `<circle cx="${cx}" cy="${f(top - 6)}" r="${f(sr * 1.6)}" fill="url(#candleGlow)"/><path d="${starPath(cx, top - 4, sr, sr * 0.42)}" fill="url(#gold)" stroke="#8a5a14" stroke-width="2"/><path d="${starPath(cx, top - 4, sr * 0.47, sr * 0.2)}" fill="#fff6c8" opacity=".7"/>`;
      }
      return s;
    }
    const ornColors = { red: ['#ff5a63', '#b0101f', '#5e0710'], gold: ['#ffe39a', '#cf9a2e', '#6a4410'], blue: ['#8fb8ff', '#2a56b0', '#0f2353'], silver: ['#ffffff', '#b9c3cc', '#5b6670'], green: ['#8fe0a0', '#1f7d45', '#0b3a1d'], plum: ['#e3a0f0', '#7a2f95', '#33103f'] };
    let defs = '';
    Object.entries(ornColors).forEach(([k, [a, b, c]]) => (defs += `<radialGradient id="orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`));
    defs += `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <radialGradient id="candleGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="warmGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
      <linearGradient id="treeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>`;
    /** Classic arched ribbon banner centred at cx; the title path runs along its middle. */
    function ribbonBanner(cx, y, halfW, o = {}) {
      const a = halfW, top = y, bot = y + 74, arch = o.arch == null ? 50 : o.arch;
      const fill = o.fill || 'url(#ribbon)', dark = o.dark || 'url(#ribbonDark)', deep = o.deep || '#4a0711';
      return `<g filter="url(#shadow)">
        <path d="M${cx - a + 28} ${top + 22} L${cx - a - 68} ${top + 16} L${cx - a - 40} ${top + 60} L${cx - a - 68} ${top + 106} L${cx - a + 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx + a - 28} ${top + 22} L${cx + a + 68} ${top + 16} L${cx + a + 40} ${top + 60} L${cx + a + 68} ${top + 106} L${cx + a - 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx - a} ${top} L${cx - a + 40} ${top + 28} L${cx - a + 40} ${top + 84} L${cx - a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx + a} ${top} L${cx + a - 40} ${top + 28} L${cx + a - 40} ${top + 84} L${cx + a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx - a} ${top} Q${cx} ${top - arch - 8} ${cx + a} ${top} L${cx + a} ${bot} Q${cx} ${bot - arch - 8} ${cx - a} ${bot}Z" fill="${fill}"/>
        <path d="M${cx - a + 8} ${top + 10} Q${cx} ${top - arch + 2} ${cx + a - 8} ${top + 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
        <path d="M${cx - a + 8} ${bot - 10} Q${cx} ${bot - arch - 18} ${cx + a - 8} ${bot - 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
      </g>`;
    }
    const ribbonPath = (cx, y, halfW, arch = 50) => `M${cx - halfW + 40} ${y + 44} Q${cx} ${y + 44 - arch - 8} ${cx + halfW - 40} ${y + 44}`;
    return { rr, pick, lights, candles, BULB, GREENS, NEEDLE, pine, bulb, lamp, berries, bow, quad, swag, lightString, starPath, gift, candle, snowDots, stars, pineTree, tree, defs, ribbonBanner, ribbonPath };
  }

  /* ---------- candy shop ---------- */
  const CANDY = ['#e8456a', '#f2c94c', '#5ec27a', '#6aa8f0', '#b07ae0', '#ff8a3a', '#ff6fae'];
  function icingWave(x0, y, x1, r = 7, drip = false) {
    let d = `M${x0} ${y}`;
    for (let x = x0; x < x1; x += r * 2) d += ` q${r} ${r * 1.4} ${r * 2} 0`;
    let s = `<path d="${d}" stroke="#fffaf2" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if (drip) for (let x = x0 + r; x < x1; x += r * 5) s += `<path d="M${x - 3} ${y + 4} q3 ${10 + ((x * 7) % 9)} 6 0Z" fill="#fffaf2"/>`;
    return s;
  }
  function peppermint(x, y, r, rot = 0) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><circle r="${r}" fill="#fffaf2"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M0 0 L${f(Math.cos((i * Math.PI) / 3) * r)} ${f(Math.sin((i * Math.PI) / 3) * r)} A${r} ${r} 0 0 1 ${f(Math.cos((i * Math.PI) / 3 + 0.5) * r)} ${f(Math.sin((i * Math.PI) / 3 + 0.5) * r)}Z" fill="#e0263f"/>`;
    return s + `<circle r="${r}" fill="none" stroke="#c9b8a8" stroke-width="1.5"/><ellipse cx="${-r * 0.35}" cy="${-r * 0.4}" rx="${r * 0.3}" ry="${r * 0.14}" fill="#fff" opacity=".7"/></g>`;
  }
  function gumdrop(x, y, r, c) {
    return `<path d="M${f(x - r)} ${f(y)} Q${f(x - r)} ${f(y - r * 1.5)} ${f(x)} ${f(y - r * 1.5)} Q${f(x + r)} ${f(y - r * 1.5)} ${f(x + r)} ${f(y)}Z" fill="${c}"/><path d="M${f(x - r * 0.5)} ${f(y - r * 0.9)} q${f(r * 0.2)} ${f(-r * 0.4)} ${f(r * 0.6)} ${f(-r * 0.4)}" stroke="#fff" stroke-width="2" opacity=".6" fill="none"/>` +
      [0, 1, 2].map((i) => `<circle cx="${f(x - r * 0.5 + i * r * 0.5)}" cy="${f(y - r * (0.3 + (i % 2) * 0.5))}" r="1.3" fill="#fff" opacity=".7"/>`).join('');
  }
  function lolly(x, y, h, c) {
    let s = `<rect x="${x - 3}" y="${y - h}" width="6" height="${h}" fill="#fffaf2"/><circle cx="${x}" cy="${y - h - 26}" r="30" fill="${c}"/>`;
    let d = `M${x} ${y - h - 26}`;
    for (let a = 0; a < 14; a += 0.5) d += ` L${f(x + Math.cos(a) * a * 2)} ${f(y - h - 26 + Math.sin(a) * a * 2)}`;
    return s + `<path d="${d}" stroke="#fffaf2" stroke-width="5" fill="none"/><circle cx="${x}" cy="${y - h - 26}" r="30" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>`;
  }
  function gbPerson(x, y, sc, o = {}) {
    const c = '#b8743a';
    let s = `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="2" rx="40" ry="7" fill="#7a4a6a" opacity=".25"/>`;
    s += `<path d="M-12 -70 Q-46 -76 -50 -60 Q-52 -46 -20 -50 L-22 -30 L-36 -4 Q-38 6 -26 6 L-8 -14 L8 -14 L26 6 Q38 6 36 -4 L22 -30 L20 -50 Q52 -46 50 -60 Q46 -76 12 -70Z" fill="${c}"/>`;
    s += `<circle cx="0" cy="-92" r="26" fill="${c}"/>`;
    s += `<path d="M-46 -66 q4 6 0 12 M46 -66 q-4 6 0 12 M-34 -6 q8 -2 12 6 M34 -6 q-8 -2 -12 6" stroke="#fffaf2" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="3 3"/>`;
    s += `<circle cx="-9" cy="-96" r="3.6" fill="#3a1d0c"/><circle cx="9" cy="-96" r="3.6" fill="#3a1d0c"/><path d="M-10 -84 q10 9 20 0" stroke="#fffaf2" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="-16" cy="-86" r="4" fill="#ff8a9c" opacity=".5"/><circle cx="16" cy="-86" r="4" fill="#ff8a9c" opacity=".5"/>`;
    s += [-58, -44, -30].map((yy, i) => gumdrop(0, yy + 5, 5, CANDY[(i + (o.k || 0)) % CANDY.length])).join('');
    if (o.scarf) s += `<path d="M-18 -70 Q0 -62 18 -70 L18 -62 Q0 -54 -18 -62Z" fill="${o.scarf}"/><path d="M8 -62 l4 18 l8 -2 l-4 -16Z" fill="${o.scarf}"/>`;
    if (o.bow) s += `<path d="M0 -118 l-14 -8 v16Z M0 -118 l14 -8 v16Z" fill="${o.bow}"/><circle cx="0" cy="-118" r="4" fill="${o.bow}"/>`;
    if (o.hat) s += `<path d="M-22 -110 Q0 -150 26 -128 Q28 -118 22 -110Z" fill="#e0263f"/><rect x="-26" y="-114" width="52" height="9" rx="4" fill="#fffaf2"/><circle cx="26" cy="-128" r="6" fill="#fffaf2"/>`;
    if (o.lolly) s += `<g transform="translate(52 -58)"><rect x="-2" y="-40" width="4" height="44" fill="#fffaf2"/><circle cx="0" cy="-52" r="16" fill="${o.lolly}"/><path d="M0 -52 m-10 0 a10 10 0 1 0 10 -10 a6 6 0 1 0 6 6" stroke="#fffaf2" stroke-width="3" fill="none"/></g>`;
    if (o.cane) s += `<path d="M-50 -60 v66 M-50 -60 q0 -14 -12 -14 q-12 0 -12 12" stroke="#fffaf2" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-50 -60 v66 M-50 -60 q0 -14 -12 -14 q-12 0 -12 12" stroke="#e0263f" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="5 5"/>`;
    return s + '</g>';
  }

  function build() {
    const R = A.util.rng(1231);
    const K = makeKit(R);
    const { rr, pick } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f5a"/><stop offset=".55" stop-color="#7a4f9a"/><stop offset=".85" stop-color="#e48ab0"/><stop offset="1" stop-color="#ffc8b8"/></linearGradient>
      <linearGradient id="ginger" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c88444"/><stop offset="1" stop-color="#9a5a26"/></linearGradient>
      <linearGradient id="gingerDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8642e"/><stop offset="1" stop-color="#7a4418"/></linearGradient>
      <pattern id="crumb" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="6" cy="8" r="1.4" fill="#7a4418" opacity=".45"/><circle cx="20" cy="18" r="1.2" fill="#7a4418" opacity=".4"/><circle cx="12" cy="26" r="1" fill="#f0c088" opacity=".5"/><circle cx="26" cy="4" r="1" fill="#f0c088" opacity=".5"/></pattern>
      <pattern id="choc" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#5a2c14"/><rect x="2" y="2" width="22" height="22" rx="3" fill="#6e3a1c"/><path d="M3 3 h20" stroke="#8a5030" stroke-width="2"/></pattern>
      <radialGradient id="win" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff2b8"/><stop offset=".7" stop-color="#ffc060"/><stop offset="1" stop-color="#e08a2a"/></radialGradient>
      <linearGradient id="frost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf4"/><stop offset="1" stop-color="#f3dfe8"/></linearGradient>
      <pattern id="caneStripe" width="12" height="16" patternUnits="userSpaceOnUse" patternTransform="skewY(30)"><rect width="12" height="8" fill="#e0263f"/></pattern>
      <radialGradient id="lampGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff0b0" stop-opacity=".8"/><stop offset="1" stop-color="#fff0b0" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0a2a" stop-opacity=".5"/></radialGradient>
    </defs>`);

    /* sugar-plum sky */
    add(`<rect width="1600" height="1000" fill="url(#sky)"/>`);
    add(K.stars(0, 0, 1600, 360, 160));
    add(`<circle cx="1420" cy="120" r="46" fill="#fff4e0"/><circle cx="1420" cy="120" r="90" fill="url(#lampGlow)" opacity=".5"/>`);
    // frosted hills with tiny candy trees
    add(`<path d="M0 470 Q200 400 420 440 Q640 480 860 420 Q1100 360 1320 430 Q1480 470 1600 440 V700 H0Z" fill="#f3d6e6"/>`);
    for (let x = 10; x < 1600; x += rr(40, 70)) { const y = 470 + Math.sin(x / 150) * 20 + rr(0, 30), h = rr(30, 60); add(`<path d="M${f(x)} ${f(y - h)} L${f(x - h * 0.35)} ${f(y)} H${f(x + h * 0.35)}Z" fill="${pick(['#5ec27a', '#3a9a5a', '#7ad49a'])}"/><path d="M${f(x - h * 0.2)} ${f(y - h * 0.45)} l${f(h * 0.4)} ${f(h * 0.12)} M${f(x - h * 0.28)} ${f(y - h * 0.2)} l${f(h * 0.56)} ${f(h * 0.12)}" stroke="#fffaf2" stroke-width="2.4"/><circle cx="${f(x)}" cy="${f(y - h)}" r="3" fill="#f2c94c"/>`); }

    /* the houses */
    const house = (x, w, h, roofH, o) => {
      const base = 700, top = base - h;
      let s = `<g filter="url(#shadow)">`;
      if (o.chimney) s += `<rect x="${x + w * o.chimney}" y="${top - roofH * 0.9}" width="34" height="${roofH * 0.7}" fill="url(#gingerDark)"/><rect x="${x + w * o.chimney - 6}" y="${top - roofH * 0.9 - 8}" width="46" height="14" rx="6" fill="#fffaf2"/>`;
      s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="url(#ginger)"/><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="url(#crumb)"/>`;
      // roof: frosting slab with gumdrops / wafer shingles
      const L = x - 22, Rr = x + w + 22, cx = x + w / 2;
      s += `<path d="M${L} ${top + 6} L${cx} ${top - roofH} L${Rr} ${top + 6}Z" fill="${o.roof}"/>`;
      if (o.wafers) for (let r = 0; r < 5; r++) for (let k = 0; k < 12; k++) {
        const yy = top - roofH + (r + 0.8) * (roofH / 5.2), half = ((yy - (top - roofH)) / roofH) * (w / 2 + 22);
        const xx = cx - half + (k + 0.5) * ((half * 2) / 12);
        if (k < 12) s += `<circle cx="${f(xx)}" cy="${f(yy)}" r="${f(Math.max(4, half / 12))}" fill="${CANDY[(r + k) % CANDY.length]}" opacity=".9"/>`;
      }
      s += `<path d="M${L - 6} ${top + 10} L${cx} ${top - roofH - 6} L${Rr + 6} ${top + 10}" stroke="#fffaf2" stroke-width="14" fill="none" stroke-linejoin="round"/>`;
      for (let k = 0; k < 9; k++) { const t = k / 8; s += `<path d="M${f(L + (cx - L) * t - 3)} ${f(top + 12 - (roofH + 16) * t)} q3 ${12 + (k % 3) * 6} 6 0Z" fill="#fffaf2"/><path d="M${f(Rr - (Rr - cx) * t - 3)} ${f(top + 12 - (roofH + 16) * t)} q3 ${12 + ((k + 1) % 3) * 6} 6 0Z" fill="#fffaf2"/>`; }
      for (let k = 0; k <= 6; k++) { const t = k / 6; s += gumdrop(L + (cx - L) * t, top + 4 - (roofH + 10) * t, 9, CANDY[(k + o.k) % CANDY.length]) + gumdrop(Rr - (Rr - cx) * t, top + 4 - (roofH + 10) * t, 9, CANDY[(k + o.k + 3) % CANDY.length]); }
      s += peppermint(cx, top - roofH - 8, 16, o.k * 20);
      // icing trim
      s += icingWave(x, top + 8, x + w, 7, true) + `<path d="M${x + 4} ${top + 10} V${base - 4} M${x + w - 4} ${top + 10} V${base - 4}" stroke="#fffaf2" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/>`;
      // windows
      o.wins.forEach(([wx, wy, ww, wh]) => {
        s += `<rect x="${x + wx}" y="${top + wy}" width="${ww}" height="${wh}" rx="6" fill="url(#win)"/><rect x="${x + wx}" y="${top + wy}" width="${ww}" height="${wh}" rx="6" fill="none" stroke="#fffaf2" stroke-width="6"/><path d="M${x + wx + ww / 2} ${top + wy} v${wh} M${x + wx} ${top + wy + wh / 2} h${ww}" stroke="#fffaf2" stroke-width="4"/>`;
        s += `<rect x="${x + wx - 8}" y="${top + wy + wh}" width="${ww + 16}" height="10" rx="5" fill="#fffaf2"/>` + [0, 1, 2].map((i) => gumdrop(x + wx + ww * (0.2 + i * 0.3), top + wy + wh + 2, 6, CANDY[(i + o.k + 2) % CANDY.length])).join('');
        K.lamp(x + wx + ww / 2, top + wy + wh / 2, '#ffd27a', 8);
      });
      // chocolate door
      const dx = x + w / 2 - 34, dy = base - 108;
      s += `<path d="M${dx} ${base} V${dy + 30} Q${dx} ${dy} ${dx + 34} ${dy} Q${dx + 68} ${dy} ${dx + 68} ${dy + 30} V${base}Z" fill="url(#choc)"/><path d="M${dx} ${base} V${dy + 30} Q${dx} ${dy} ${dx + 34} ${dy} Q${dx + 68} ${dy} ${dx + 68} ${dy + 30} V${base}" stroke="#fffaf2" stroke-width="6" fill="none"/>`;
      s += peppermint(dx + 54, base - 50, 7);
      // candy cane posts at corners
      [x - 8, x + w - 8].forEach((px) => (s += `<rect x="${px}" y="${top + 20}" width="16" height="${h - 20}" rx="8" fill="#fffaf2"/><rect x="${px}" y="${top + 20}" width="16" height="${h - 20}" rx="8" fill="url(#caneStripe)"/>`));
      s += `</g>`;
      // little wreath on the door
      let wr = '';
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; wr += K.pine(x + w / 2 + Math.cos(a) * 16, dy + 36 + Math.sin(a) * 16, 6); }
      s += wr + K.berries(x + w / 2, dy + 52);
      // gumdrop hedge
      for (let k = 0; k < Math.floor(w / 26); k++) { if (Math.abs(x + 13 + k * 26 - (x + w / 2)) < 50) continue; s += gumdrop(x + 13 + k * 26, base + 8, 12, CANDY[(k + o.k) % CANDY.length]); }
      // roof lights
      s += K.lightString(L, top + 10, (L + cx) / 2 - 10, top - roofH / 2 + 20, cx, top - roofH + 4, 7, 3.6, K.BULB, o.k) + K.lightString(cx, top - roofH + 4, (cx + Rr) / 2 + 10, top - roofH / 2 + 20, Rr, top + 10, 7, 3.6, K.BULB, o.k + 2);
      return s;
    };
    add(house(46, 250, 230, 120, { roof: '#f3a0c0', wafers: true, k: 0, chimney: 0.68, wins: [[22, 50, 60, 64], [168, 50, 60, 64]] }));
    add(house(1300, 250, 220, 116, { roof: '#9ad8b0', wafers: true, k: 3, chimney: 0.2, wins: [[22, 46, 60, 64], [168, 46, 60, 64]] }));
    add(house(340, 270, 280, 140, { roof: '#a8d0f0', wafers: true, k: 1, chimney: 0.18, wins: [[26, 52, 66, 76], [178, 52, 66, 76]] }));
    add(house(990, 266, 264, 132, { roof: '#f6d38a', wafers: true, k: 5, chimney: 0.7, wins: [[24, 50, 66, 74], [176, 50, 66, 74]] }));
    add(house(664, 272, 330, 160, { roof: '#e0a0f0', wafers: true, k: 2, chimney: 0.86, wins: [[26, 70, 72, 84], [174, 70, 72, 84]] }));
    // round candy window in the centre gable
    add(`<circle cx="800" cy="300" r="40" fill="url(#win)"/><circle cx="800" cy="300" r="40" fill="none" stroke="#fffaf2" stroke-width="8"/><path d="M800 260 v80 M760 300 h80" stroke="#fffaf2" stroke-width="5"/>`);
    K.lamp(800, 300, '#ffd27a', 12);

    /* frosting snow street */
    add(`<path d="M0 690 Q400 676 800 694 Q1200 712 1600 686 V1000 H0Z" fill="url(#frost)"/>`);
    for (let x = 0; x < 1600; x += 46) add(`<path d="M${x} ${700 + Math.sin(x / 80) * 4} q23 22 46 0" fill="#fffaf4"/>`);
    // peppermint stepping-stone path
    for (let i = 0; i < 8; i++) { const t = i / 7; const x = 800 + Math.sin(t * 5.2 + 0.4) * 150 * (1 - t * 0.75), y = 975 - t * 262, r = 30 - t * 15; add(peppermint(x, y, r, i * 25)); }
    // candy-cane lamp posts
    [300, 640, 960, 1300].forEach((x, i) => {
      add(`<path d="M${x} 860 V700 q0 -40 34 -40 q34 0 34 30" stroke="#fffaf2" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M${x} 860 V700 q0 -40 34 -40 q34 0 34 30" stroke="#e0263f" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="10 10"/>`);
      add(`<circle cx="${x + 68}" cy="712" r="44" fill="url(#lampGlow)"/><path d="M${x + 56} 690 h24 l4 30 h-32Z" fill="#fff0b0"/><path d="M${x + 52} 690 h32 M${x + 52} 720 h32" stroke="#5a2c14" stroke-width="4"/>`);
      K.lamp(x + 68, 706, '#fff0b0', 14);
      add(`<ellipse cx="${x}" cy="862" rx="20" ry="6" fill="#d9b8c8"/>`);
      add(K.bow(x, 760, 0.55, CANDY[i], '#00000044'));
    });
    // lollipop trees
    add(lolly(1560, 900, 120, '#e8456a') + lolly(40, 920, 110, '#6aa8f0') + lolly(1180, 940, 80, '#f2c94c') + lolly(470, 950, 70, '#5ec27a'));
    // strolling gingerbread folk
    add(gbPerson(250, 930, 1.15, { scarf: '#5ec27a', hat: true, k: 0 }));
    add(gbPerson(560, 870, 0.9, { bow: '#ff6fae', lolly: '#6aa8f0', k: 2 }));
    add(gbPerson(1080, 880, 1.0, { scarf: '#e0263f', cane: true, k: 4 }));
    add(gbPerson(1380, 950, 0.75, { bow: '#f2c94c', k: 1 }));
    // sprinkles scattered on the snow
    for (let i = 0; i < 160; i++) { const x = rr(0, 1600), y = rr(720, 1000), a = rr(0, 180); add(`<rect x="${f(x)}" y="${f(y)}" width="8" height="2.6" rx="1.3" fill="${pick(CANDY)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`); }

    /* banner */
    add(K.ribbonBanner(800, 38, 320, { arch: 40, fill: '#e85a8a', dark: '#b8306a', deep: '#7a1a4a' }));
    add(`<path d="M${800 - 312} 48 Q800 6 ${800 + 312} 48 M${800 - 312} 104 Q800 62 ${800 + 312} 104" stroke="#fffaf2" stroke-width="4" stroke-dasharray="10 8" fill="none" opacity=".8"/>`);
    add(`<rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  A.designs.gingerbread = {
    id: 'gingerbread',
    name: 'Gingerbread Lane',
    blurb: 'A street of iced gingerbread houses, gumdrop roofs and candy-cane lamp posts.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M520 82 Q800 34 1080 82', size: 42, maxWidth: 500, fill: '#fffaf2', stroke: '#7a1a4a' },
    effects: [
      { type: 'twinkle' },
      { type: 'glow', x: 800, y: 300, r: 120, color: '255,210,120', a: 0.3, speed: 1.3 },
      { type: 'smoke', x: 915, y: 218, rate: 1.4, rise: 18, size: 10, color: '255,236,244', a: 0.45 },
      { type: 'smoke', x: 233, y: 354, rate: 1.2, rise: 18, size: 9, color: '255,236,244', a: 0.4 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 110, a: 0.85 },
    ],
    layout: 'gingerbread',
    keepOut: [[400, 10, 800, 130]],
    day24: { x: 715, y: 226, w: 170, h: 150 },
    numStyles: ['n-tag', 'n-cream', 'n-swash', 'n-red', 'n-gold'],
  };
})();

} catch (e) { console.error('Design file failed: src/designs/gingerbread.js', e); }
/* ---- src/layouts/gingerbread.js ---- */
try {
/* Door layout for "Gingerbread Lane" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["gingerbread"]=[{"day":1,"x":1461,"y":761,"w":106,"h":132,"hinge":"left"},
{"day":2,"x":1010,"y":859,"w":132,"h":106,"hinge":"right"},
{"day":3,"x":172,"y":28,"w":144,"h":116,"hinge":"left"},
{"day":4,"x":1191,"y":553,"w":150,"h":132,"hinge":"top"},
{"day":5,"x":1263,"y":29,"w":138,"h":110,"hinge":"right"},
{"day":6,"x":195,"y":498,"w":134,"h":150,"hinge":"right"},
{"day":7,"x":298,"y":156,"w":150,"h":138,"hinge":"right"},
{"day":8,"x":1166,"y":724,"w":150,"h":120,"hinge":"left"},
{"day":9,"x":696,"y":740,"w":138,"h":150,"hinge":"right"},
{"day":10,"x":1351,"y":155,"w":150,"h":132,"hinge":"left"},
{"day":11,"x":163,"y":172,"w":106,"h":132,"hinge":"left"},
{"day":12,"x":426,"y":838,"w":150,"h":114,"hinge":"left"},
{"day":13,"x":1007,"y":272,"w":120,"h":100,"hinge":"top"},
{"day":14,"x":1081,"y":570,"w":98,"h":126,"hinge":"left"},
{"day":15,"x":146,"y":815,"w":116,"h":144,"hinge":"left"},
{"day":16,"x":399,"y":671,"w":122,"h":138,"hinge":"right"},
{"day":17,"x":498,"y":462,"w":114,"h":150,"hinge":"top"},
{"day":18,"x":817,"y":572,"w":150,"h":124,"hinge":"left"},
{"day":19,"x":896,"y":397,"w":126,"h":150,"hinge":"right"},
{"day":20,"x":227,"y":665,"w":150,"h":122,"hinge":"left"},
{"day":21,"x":297,"y":319,"w":150,"h":122,"hinge":"left"},
{"day":22,"x":758,"y":407,"w":118,"h":150,"hinge":"left"},
{"day":23,"x":1415,"y":583,"w":126,"h":150,"hinge":"top"},
{"day":24,"x":715,"y":226,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/gingerbread.js', e); }
/* ---- src/designs/golf.js ---- */
try {
/* Design — "Fairway Frost"
   A snowy golf course at sunset: the clubhouse lit for Christmas, a flag with a wreath
   fluttering on the green, a golf-ball snowman, a cart hauling home the tree. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(4471);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];

    function bulb(x, y, c, r = 3.6) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/><circle cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.3)}" fill="#fff" opacity=".8"/>`;
    }
    function lightString(x0, y0, x1, y1, sag, n, off = 0, r = 3.4) {
      const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#2a2a22" stroke-width="1.6" fill="none"/>`;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        s += bulb(x, y + 4, BULB[(i + off) % BULB.length], r);
      }
      return s;
    }
    function pine(x, base, h, col = '#1d4a33', snow = '#f6f3fb', dark = '#13321f') {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.1)}" width="${f(h * 0.06)}" height="${f(h * 0.12)}" fill="#4a2c1a"/>`;
      for (let k = 0; k < 4; k++) {
        const ty = base - h + k * h * 0.2, w = h * (0.14 + k * 0.085), th = h * 0.32;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + th)} Q${f(x)} ${f(ty + th + h * 0.05)} ${f(x + w)} ${f(ty + th)}Z" fill="${col}"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x + w)} ${f(ty + th)} Q${f(x + w * 0.5)} ${f(ty + th + h * 0.03)} ${f(x + w * 0.1)} ${f(ty + th * 0.9)}Z" fill="${dark}" opacity=".55"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.62)} ${f(ty + th * 0.6)} Q${f(x - w * 0.35)} ${f(ty + th * 0.72)} ${f(x - w * 0.12)} ${f(ty + th * 0.55)} Q${f(x + w * 0.18)} ${f(ty + th * 0.7)} ${f(x + w * 0.5)} ${f(ty + th * 0.5)}Z" fill="${snow}"/>`;
      }
      return s;
    }
    function bow(x, y, s = 1, c = '#c4202f', d = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-3 3 L-12 28 L-6 25 L-2 31 L0 6Z M3 3 L12 28 L6 25 L2 31 L0 6Z" fill="${d}"/><path d="M0 0 C-9 -15 -26 -12 -23 -1 C-20 8 -9 6 0 0Z M0 0 C9 -15 26 -12 23 -1 C20 8 9 6 0 0Z" fill="${c}"/><ellipse cx="0" cy="1" rx="4.5" ry="5" fill="${d}"/></g>`;
    }
    function wreath(x, y, r) {
      let s = '';
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        s += `<circle cx="${f(x + Math.cos(a) * r)}" cy="${f(y + Math.sin(a) * r)}" r="${f(r * 0.42)}" fill="${pick(['#1d5a35', '#24683f', '#174a2b'])}"/>`;
      }
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.4; s += `<circle cx="${f(x + Math.cos(a) * r)}" cy="${f(y + Math.sin(a) * r)}" r="${f(r * 0.16)}" fill="#c4122a"/>`; }
      return s + bow(x, y + r, r / 22);
    }

    add(`<defs>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2b5e"/><stop offset=".42" stop-color="#6c4a85"/><stop offset=".72" stop-color="#df7489"/><stop offset="1" stop-color="#ffc27c"/></linearGradient>
      <radialGradient id="g-sun" cx="1180" cy="470" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2c8" stop-opacity=".95"/><stop offset=".12" stop-color="#ffd38a" stop-opacity=".6"/><stop offset=".5" stop-color="#ff9a7a" stop-opacity=".15"/><stop offset="1" stop-color="#ff9a7a" stop-opacity="0"/></radialGradient>
      <linearGradient id="g-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e6ec"/><stop offset=".5" stop-color="#eef0fa"/><stop offset="1" stop-color="#dfe3f4"/></linearGradient>
      <linearGradient id="g-fair" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9e6d6"/><stop offset="1" stop-color="#e8efe2"/></linearGradient>
      <radialGradient id="g-green" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#a9cf9b"/><stop offset=".7" stop-color="#cfe3c4"/><stop offset="1" stop-color="#e6efe0"/></radialGradient>
      <linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e7d2"/><stop offset="1" stop-color="#d9c6a6"/></linearGradient>
      <linearGradient id="g-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#355946"/><stop offset="1" stop-color="#1f3a2c"/></linearGradient>
      <linearGradient id="g-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a6"/><stop offset="1" stop-color="#ffb24d"/></linearGradient>
      <linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="g-rib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8a55"/><stop offset=".5" stop-color="#1d6a3e"/><stop offset="1" stop-color="#114a2a"/></linearGradient>
      <linearGradient id="g-ribd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#155632"/><stop offset="1" stop-color="#0b3520"/></linearGradient>
      <radialGradient id="g-ball" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef0f6"/><stop offset="1" stop-color="#c3c8d8"/></radialGradient>
      <pattern id="g-dimple" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#b9bfd0" opacity=".55"/><circle cx="9" cy="9" r="2.2" fill="#b9bfd0" opacity=".55"/></pattern>
      <pattern id="g-canopy" width="24" height="10" patternUnits="userSpaceOnUse"><rect width="24" height="10" fill="#f6efe2"/><rect width="12" height="10" fill="#c4202f"/></pattern>
      <pattern id="g-argyle" width="18" height="24" patternUnits="userSpaceOnUse"><rect width="18" height="24" fill="#b5162a"/><path d="M9 0L18 12L9 24L0 12Z" fill="#8a0f20"/><path d="M0 0L18 24M18 0L0 24" stroke="#f4d27a" stroke-width="1" opacity=".8"/></pattern>
      <pattern id="g-tartan" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#2a5a3a"/><rect y="7" width="20" height="5" fill="#a3172a" opacity=".85"/><rect x="7" width="5" height="20" fill="#a3172a" opacity=".6"/><rect y="15" width="20" height="1.5" fill="#f0c64a"/></pattern>
      <radialGradient id="g-vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#14081a" stop-opacity=".5"/></radialGradient>
      <filter id="g-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="g-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#1a1030" flood-opacity=".4"/></filter>
    </defs>`);

    /* sky */
    add(`<rect width="${W}" height="620" fill="url(#g-sky)"/>`);
    for (let i = 0; i < 70; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 200))}" r="${f(rr(0.6, 1.6))}" fill="#fff" opacity="${f(rr(0.3, 0.9))}"/>`);
    add(`<rect width="${W}" height="620" fill="url(#g-sun)"/><circle cx="1180" cy="470" r="46" fill="#fff4cf"/>`);
    // streaky clouds
    [[300, 250, 260], [700, 300, 200], [1400, 230, 240], [1000, 360, 300], [180, 380, 180]].forEach(([x, y, w]) => {
      add(`<ellipse cx="${x}" cy="${y}" rx="${w}" ry="10" fill="#ffd3c4" opacity=".35"/><ellipse cx="${x + 40}" cy="${y + 8}" rx="${w * 0.7}" ry="6" fill="#ffe7d6" opacity=".4"/>`);
    });
    /* distant hills + treelines */
    add(`<path d="M0 470 Q200 430 420 462 Q640 492 860 452 Q1080 418 1300 456 Q1460 482 1600 450 V620 H0Z" fill="#b8b2d8"/>`);
    for (let x = 0; x < W; x += 14) {
      const y = 470 + Math.sin(x / 180) * 14 + rr(-4, 4);
      add(`<path d="M${f(x)} ${f(y - rr(14, 26))} L${f(x + 7)} ${f(y + 6)} L${f(x - 7)} ${f(y + 6)}Z" fill="#7d77a8"/>`);
    }
    add(`<path d="M0 515 Q300 488 620 520 Q900 548 1200 512 Q1420 492 1600 520 V640 H0Z" fill="#e7dcec"/>`);
    /* main snowfield */
    add(`<path d="M0 560 Q380 530 760 568 Q1120 600 1600 548 V1000 H0Z" fill="url(#g-snow)"/>`);
    // fairway curling to the green
    add(`<path d="M120 572 Q520 560 780 640 Q900 680 980 700 L1040 760 Q900 770 740 720 Q440 640 40 610Z" fill="url(#g-fair)"/>`);
    for (let i = 0; i < 9; i++) add(`<path d="M${120 + i * 20} ${576 + i * 4} Q${520 + i * 6} ${566 + i * 6} ${790 - i * 4} ${646 + i * 8}" stroke="#c6d8c3" stroke-width="5" fill="none" opacity="${i % 2 ? 0.5 : 0.25}"/>`);
    // the green
    add(`<ellipse cx="1060" cy="716" rx="250" ry="62" fill="#d2e2cd"/><ellipse cx="1060" cy="712" rx="220" ry="52" fill="url(#g-green)"/>`);
    for (let i = 0; i < 16; i++) add(`<ellipse cx="${f(rr(880, 1230))}" cy="${f(rr(690, 735))}" rx="${f(rr(14, 40))}" ry="${f(rr(4, 9))}" fill="#ffffff" opacity=".75"/>`);
    add(`<ellipse cx="1094" cy="716" rx="9" ry="3.5" fill="#1d2a22"/><circle cx="1040" cy="722" r="5" fill="url(#g-ball)"/><ellipse cx="1040" cy="727" rx="5" ry="1.5" fill="#000" opacity=".2"/>`);
    // flagstick with a wreath (the flag itself waves in the animation layer)
    add(`<rect x="1092" y="514" width="5" height="203" fill="#f6efe2"/><rect x="1092" y="514" width="5" height="203" fill="url(#g-canopy)" opacity=".5"/><circle cx="1094.5" cy="512" r="4" fill="url(#g-gold)"/>`);
    add(wreath(1094.5, 612, 18));
    // bunker full of snow
    add(`<g transform="translate(110 10)"><ellipse cx="840" cy="796" rx="130" ry="34" fill="#d9bf8a"/><ellipse cx="842" cy="792" rx="116" ry="27" fill="#ffffff"/><path d="M736 790 Q800 778 880 786 Q930 792 950 800" stroke="#c9d3ec" stroke-width="6" fill="none" opacity=".7"/>
      <path d="M900 770 L960 740" stroke="#8a5a2c" stroke-width="4"/><path d="M952 732 l18 14" stroke="#555" stroke-width="5" stroke-linecap="round"/></g>`);

    /* distant pine belt behind the course */
    for (let x = 560; x < 1300; x += rr(22, 40)) add(pine(x, 562 + Math.sin(x / 90) * 6, rr(40, 70), '#3b5a52', '#f6eef4', '#2a4540'));
    /* frozen water hazard with a little footbridge */
    add(`<ellipse cx="610" cy="712" rx="170" ry="30" fill="#cfe0f0"/><ellipse cx="610" cy="708" rx="156" ry="24" fill="#a9c8e6"/>
      <path d="M480 704 Q560 696 640 704 M560 716 Q640 710 720 718" stroke="#fff" stroke-width="3" opacity=".7" fill="none"/>
      <path d="M520 690 Q610 650 700 690" stroke="#a3172a" stroke-width="10" fill="none"/><path d="M520 690 Q610 654 700 690" stroke="#c4202f" stroke-width="4" fill="none" transform="translate(0 -14)"/>
      <path d="M534 680 v-18 M560 670 v-18 M586 664 v-18 M612 662 v-18 M638 664 v-18 M664 670 v-18 M690 680 v-18" stroke="#a3172a" stroke-width="3"/>
      <path d="M516 686 Q610 644 704 686" stroke="#fff" stroke-width="5" fill="none" opacity=".9" transform="translate(0 -20)"/>`);
    for (let i = 0; i < 9; i++) { const x = 470 + i * 9 + rr(-3, 3); add(`<path d="M${f(x)} 712 q${f(rr(-4, 4))} -24 0 -${f(rr(26, 40))}" stroke="#6b5a3a" stroke-width="2" fill="none"/><ellipse cx="${f(x)}" cy="${f(684 - i % 3 * 4)}" rx="2.6" ry="7" fill="#5a3a20"/>`); }
    /* cart path lined with little lantern posts and lights */
    add(`<path d="M520 572 Q700 640 860 690 Q960 722 1010 770" stroke="#c7cbe3" stroke-width="22" fill="none" opacity=".55"/>`);
    {
      const posts = [[540, 590], [640, 626], [740, 662], [840, 694], [930, 726]];
      posts.forEach(([x, y]) => { add(`<rect x="${x - 2}" y="${y - 34}" width="4" height="36" fill="#2a2a2a"/><rect x="${x - 6}" y="${y - 44}" width="12" height="12" rx="2" fill="#ffe2a0" stroke="#2a2a2a" stroke-width="2"/>`); lights.push({ x, y: y - 38, c: '#ffd27a', r: 4.5 }); });
      for (let i = 0; i < posts.length - 1; i++) add(lightString(posts[i][0], posts[i][1] - 30, posts[i + 1][0], posts[i + 1][1] - 30, 12, 6, i * 2, 2.8));
    }
    /* bench by the green with a thermos and a wreath */
    add(`<g transform="translate(1270 790)"><rect x="-50" y="-30" width="100" height="8" rx="2" fill="#7a4a2c"/><rect x="-50" y="-48" width="100" height="7" rx="2" fill="#7a4a2c"/><rect x="-50" y="-60" width="100" height="7" rx="2" fill="#7a4a2c"/><path d="M-44 -22 v26 M44 -22 v26 M-44 -60 v40 M44 -60 v40" stroke="#2a2a2a" stroke-width="5"/><path d="M-52 -64 Q0 -74 52 -64" stroke="#fff" stroke-width="6" fill="none"/><rect x="18" y="-48" width="12" height="20" rx="3" fill="#c4202f"/><rect x="-20" y="-40" width="26" height="10" rx="3" fill="#2a56b0"/></g>`);
    /* framing pines in the foreground */
    add(pine(1572, 930, 330, '#1d4f33'));
    for (let i = 0; i < 22; i++) add(bulb(rr(1500, 1600), rr(660, 900), BULB[i % 7], 3.4));
    /* pines along the fairway */
    [[560, 560, 90], [610, 566, 120], [660, 562, 80], [1290, 580, 130], [1350, 576, 100], [1410, 588, 150], [1480, 584, 110], [1550, 596, 160], [1240, 586, 90]].forEach(([x, b, h]) => add(pine(x, b, h, '#24543a', '#fbf2f6')));

    /* clubhouse */
    add(`<g filter="url(#g-sh)">
      <rect x="96" y="420" width="430" height="150" fill="url(#g-wall)"/>
      <path d="M70 428 L170 340 L450 340 L552 428Z" fill="url(#g-roof)"/>
      <path d="M70 428 L170 340 L450 340 L552 428" stroke="#fff" stroke-width="9" fill="none" stroke-linejoin="round"/>
      <path d="M180 346 Q300 330 440 346 L436 352 Q300 340 184 352Z" fill="#fff"/>
      <path d="M220 430 L310 350 L400 430Z" fill="#2a4a39"/><path d="M210 434 L310 344 L410 434" stroke="#fff" stroke-width="8" fill="none" stroke-linejoin="round"/>
      <rect x="232" y="432" width="156" height="138" fill="#ead9bd"/>
      <path d="M96 470 H526 M96 520 H526" stroke="#6b4a2e" stroke-width="5" opacity=".7"/>
      <rect x="410" y="300" width="34" height="62" fill="#7a4a35"/><rect x="404" y="294" width="46" height="10" fill="#5a3324"/><path d="M404 296 q23 -10 46 0" stroke="#fff" stroke-width="6" fill="none"/>
    </g>`);
    // windows
    [[118, 452], [178, 452], [432, 452], [470, 452], [118, 512], [470, 512]].forEach(([x, y]) => add(`<rect x="${x}" y="${y}" width="40" height="40" rx="2" fill="url(#g-win)"/><path d="M${x + 20} ${y}v40M${x} ${y + 20}h40" stroke="#6b4a2e" stroke-width="3"/><rect x="${x - 3}" y="${y + 38}" width="46" height="6" fill="#fff"/>`));
    // arched entrance + big window
    add(`<path d="M276 570 V500 Q276 470 310 470 Q344 470 344 500 V570Z" fill="#5a3324"/><path d="M282 570 V502 Q282 478 310 478 Q338 478 338 502 V570Z" fill="#7a4a2c"/><rect x="290" y="490" width="40" height="22" rx="4" fill="url(#g-win)"/><circle cx="330" cy="534" r="3" fill="url(#g-gold)"/>`);
    add(wreath(310, 455, 14));
    add(`<path d="M246 540 h20 v30 h-20Z M354 540 h20 v30 h-20Z" fill="#2f5d3f"/>`);
    // eave lights
    add(lightString(76, 428, 214, 432, 10, 8, 0));
    add(lightString(406, 432, 548, 428, 10, 8, 3));
    add(lightString(214, 434, 310, 348, 4, 6, 1));
    add(lightString(310, 348, 406, 434, 4, 6, 5));
    // lamp posts
    [70, 556].forEach((x) => { add(`<rect x="${x - 3}" y="510" width="6" height="64" fill="#2a2a2a"/><rect x="${x - 9}" y="494" width="18" height="20" rx="3" fill="#2a2a2a"/><rect x="${x - 6}" y="497" width="12" height="14" fill="#ffe2a0"/>`); lights.push({ x, y: 504, c: '#ffd27a', r: 6 }); });
    // decorated tree by the clubhouse
    add(pine(30, 580, 150, '#1e5a35'));
    for (let i = 0; i < 14; i++) add(bulb(rr(10, 52), rr(460, 570), BULB[i % 7], 3));

    /* foreground snowbanks */
    add(`<path d="M0 860 Q240 820 520 852 Q760 878 1000 846 Q1300 812 1600 850 V1000 H0Z" fill="#f4f1fb"/>
      <path d="M0 860 Q240 820 520 852 Q760 878 1000 846 Q1300 812 1600 850" stroke="#d3d6ee" stroke-width="5" fill="none"/>`);
    for (let i = 0; i < 22; i++) add(`<ellipse cx="${f(rr(0, W))}" cy="${f(rr(880, 990))}" rx="${f(rr(20, 70))}" ry="${f(rr(3, 7))}" fill="#d9ddf2" opacity=".6"/>`);
    // footprints across the snow
    for (let i = 0; i < 12; i++) add(`<ellipse cx="${f(600 + i * 38)}" cy="${f(900 - i * 8 + (i % 2) * 10)}" rx="6" ry="3" fill="#cfd3ec"/>`);

    /* golf cart carrying the tree home */
    add(`<g transform="translate(590 905)" filter="url(#g-sh)">
      <path d="M-20 -150 L190 -150 L196 -138 L-26 -138Z" fill="url(#g-canopy)"/>
      <rect x="-14" y="-140" width="6" height="110" fill="#d9d9d9"/><rect x="176" y="-140" width="6" height="110" fill="#d9d9d9"/>
      <path d="M-30 -30 Q-30 -60 0 -60 L150 -60 Q200 -60 210 -20 L214 20 L-34 20Z" fill="#f2f2ec"/>
      <path d="M150 -60 Q200 -60 210 -20 L214 20 L170 20 L160 -40Z" fill="#c4202f"/>
      <rect x="10" y="-52" width="110" height="26" rx="8" fill="#2f5d8a"/><rect x="10" y="-30" width="110" height="10" fill="#244a6e"/>
      <rect x="-28" y="-110" width="40" height="80" rx="8" fill="url(#g-tartan)"/><path d="M-18 -110 l-6 -30 M-6 -110 l2 -34 M4 -110 l10 -28" stroke="#cfcfcf" stroke-width="3"/>
      <circle cx="10" cy="22" r="26" fill="#222"/><circle cx="10" cy="22" r="11" fill="#bbb"/><circle cx="175" cy="22" r="26" fill="#222"/><circle cx="175" cy="22" r="11" fill="#bbb"/>
      <rect x="196" y="-12" width="22" height="8" rx="3" fill="#ffe7a0"/>
    </g>`);
    lights.push({ x: 804, y: 897, c: '#fff1b8', r: 5 });
    // the tree strapped on the roof, lying on its side with the tip forward
    {
      let tr = `<rect x="430" y="606" width="22" height="10" fill="#5a3324"/>`;
      for (let k = 0; k < 5; k++) {
        const x0 = 448 + k * 38, hh = 34 - k * 5;
        tr += `<path d="M${x0} ${612 - hh} L${x0 + 60} 612 L${x0} ${612 + hh * 0.35}Z" fill="${k % 2 ? '#2c6f45' : '#1f5a35'}"/>`;
        tr += `<path d="M${x0} ${612 - hh} L${x0 + 40} ${612 - hh * 0.35} L${x0 + 6} ${612 - hh * 0.5}Z" fill="#fff" opacity=".85"/>`;
      }
      add(`<g transform="translate(120 135)">${tr}<path d="M496 590 v28 M590 594 v24" stroke="#c4202f" stroke-width="5"/>${bow(543, 588, 0.7)}</g>`);
    }

    /* golf-ball snowman */
    add(`<g transform="translate(176 880)">
      <ellipse cx="0" cy="62" rx="90" ry="14" fill="#c9cde6" opacity=".7"/>
      <circle cx="0" cy="0" r="70" fill="url(#g-ball)"/><circle cx="0" cy="0" r="70" fill="url(#g-dimple)"/>
      <circle cx="0" cy="-100" r="50" fill="url(#g-ball)"/><circle cx="0" cy="-100" r="50" fill="url(#g-dimple)"/>
      <circle cx="0" cy="-172" r="36" fill="url(#g-ball)"/><circle cx="0" cy="-172" r="36" fill="url(#g-dimple)"/>
      <path d="M-30 -138 Q0 -126 30 -138 L34 -126 Q0 -112 -34 -126Z" fill="#c4202f"/><path d="M20 -132 l12 40 l-14 0Z" fill="#a3172a"/>
      <path d="M-38 -196 Q-36 -224 0 -226 Q36 -224 38 -196Z" fill="url(#g-tartan)"/><path d="M-44 -196 Q0 -186 50 -198 L52 -190 Q0 -178 -44 -188Z" fill="#1f3b2a"/><circle cx="0" cy="-226" r="6" fill="#c4202f"/>
      <circle cx="-12" cy="-176" r="4" fill="#222"/><circle cx="12" cy="-176" r="4" fill="#222"/><path d="M0 -168 l22 6 l-22 4Z" fill="#f08a2a"/>
      <path d="M-12 -156 q12 8 24 0" stroke="#222" stroke-width="3" fill="none" stroke-dasharray="1 5" stroke-linecap="round"/>
      <circle cx="0" cy="-110" r="4.5" fill="#222"/><circle cx="0" cy="-90" r="4.5" fill="#222"/>
      <path d="M-46 -108 L-110 -150" stroke="#8a8f99" stroke-width="5" stroke-linecap="round"/><path d="M-110 -150 l-14 -2 l2 -12 l16 6Z" fill="#c6cbd6"/>
      <path d="M46 -108 L104 -160" stroke="#8a8f99" stroke-width="5" stroke-linecap="round"/><path d="M104 -160 l16 -6 l4 12 l-16 4Z" fill="#c6cbd6"/>
    </g>`);

    /* golfer in a Santa hat, mid follow-through */
    add(`<g transform="translate(1390 880) scale(1.25)" filter="url(#g-sh)">
      <ellipse cx="0" cy="8" rx="46" ry="8" fill="#c9cde6"/>
      <path d="M-14 4 L-8 -56 L8 -56 L16 4 L8 4 L2 -36 L-4 4Z" fill="#2f3e5c"/>
      <path d="M-22 4 h16 v6 h-18Z M6 4 h18 v6 h-18Z" fill="#fff"/>
      <path d="M-14 -56 Q-18 -96 2 -104 Q22 -100 16 -56Z" fill="url(#g-argyle)"/>
      <path d="M-6 -100 Q-30 -116 -40 -128" stroke="url(#g-argyle)" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="M10 -98 Q-12 -122 -36 -130" stroke="#b5162a" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="-38" cy="-130" r="7" fill="#fff"/>
      <path d="M-38 -130 L20 -160 L54 -142" stroke="#9aa0aa" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M50 -146 l14 2 l-2 10 l-14 -4Z" fill="#5a3a20"/>
      <circle cx="2" cy="-116" r="12" fill="#f1c9a5"/>
      <path d="M-10 -120 Q-4 -150 26 -146 Q14 -136 14 -122Z" fill="#c4202f"/><path d="M-12 -122 Q2 -128 16 -122 L16 -116 Q2 -122 -12 -116Z" fill="#fff"/><circle cx="27" cy="-146" r="5" fill="#fff"/>
      <path d="M-5 -114 h4" stroke="#3a2010" stroke-width="2"/>
    </g>
    <g transform="translate(1500 868)"><path d="M-14 0 L-20 -80 Q0 -92 20 -80 L14 0Z" fill="url(#g-tartan)"/><path d="M-12 -82 l-6 -28 M-2 -86 l-2 -34 M8 -84 l6 -26" stroke="#cfcfcf" stroke-width="3"/><circle cx="-16" cy="-112" r="5" fill="#c4202f"/><circle cx="-4" cy="-122" r="5" fill="#e2b04a"/><circle cx="14" cy="-112" r="5" fill="#2a56b0"/>${bow(0, -50, 0.6)}</g>`);
    // yardage marker
    add(`<rect x="1250" y="740" width="10" height="60" fill="#f6efe2"/><rect x="1246" y="732" width="18" height="16" rx="3" fill="#c4202f"/>`);

    /* the title ribbon */
    add(`<g filter="url(#g-sh)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#g-ribd)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#g-ribd)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#062614"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#062614"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#g-rib)"/>
      <path d="M528 86 Q800 30 1072 86 M528 140 Q800 84 1072 140" stroke="url(#g-gold)" stroke-width="3" fill="none"/>
    </g>`);
    add(`<rect width="${W}" height="${H}" fill="url(#g-vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  function flag(ctx, t) {
    const px = 1097, top = 518, len = 64, h = 36;
    const wave = (u) => Math.sin(t * 4.2 - u * 4.5) * u * 6;
    ctx.beginPath(); ctx.moveTo(px, top);
    for (let i = 0; i <= 12; i++) { const u = i / 12; ctx.lineTo(px + u * len * (0.96 + 0.04 * Math.cos(t * 4 - u * 4)), top + wave(u) + u * 3); }
    for (let i = 12; i >= 0; i--) { const u = i / 12; ctx.lineTo(px + u * len * (0.96 + 0.04 * Math.cos(t * 4 - u * 4)), top + h - u * 6 + wave(u)); }
    ctx.closePath();
    ctx.fillStyle = '#d3202f'; ctx.fill();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 12; i++) { const u = i / 12; ctx.fillStyle = `rgba(0,0,0,${0.12 + 0.12 * Math.sin(t * 4.2 - u * 4.5)})`; ctx.fillRect(px + u * len, top - 10, len / 12 + 1, h + 20); }
    ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(px + 30, top + 18 + Math.sin(t * 4.2 - 2) * 3, 7, 0, 7); ctx.fill();
    ctx.restore();
  }

  A.designs.golf = {
    id: 'golf',
    name: 'Fairway Frost',
    blurb: 'Snow on the greens, a flag with a wreath, the clubhouse lit for Christmas.',
    width: W, height: H, build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#fff6dc', stroke: '#0b3520' },
    numStyles: ['n-red', 'n-swash', 'n-gold', 'n-red', 'n-tag', 'n-swash'],
    effects: [
      { type: 'glow', x: 1180, y: 470, r: 280, color: '255,205,150', a: 0.22, speed: 0.6 },
      { type: 'twinkle' },
      { type: 'smoke', x: 427, y: 292, rate: 2, rise: 20, size: 9, color: '235,228,240', a: 0.45 },
      { type: 'custom', draw: flag },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 120 },
    ],
    layout: 'golf',
    keepOut: [[440, 18, 720, 172], [1036, 500, 140, 230]],
    day24: { x: 225, y: 410, w: 170, h: 140 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/golf.js', e); }
/* ---- src/layouts/golf.js ---- */
try {
/* Door layout for "Fairway Frost" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["golf"]=[{"day":1,"x":1019,"y":840,"w":150,"h":122,"hinge":"right"},
{"day":2,"x":322,"y":107,"w":90,"h":114,"hinge":"left"},
{"day":3,"x":160,"y":803,"w":150,"h":148,"hinge":"right"},
{"day":4,"x":437,"y":236,"w":118,"h":150,"hinge":"left"},
{"day":5,"x":1446,"y":839,"w":114,"h":104,"hinge":"left"},
{"day":6,"x":1256,"y":253,"w":150,"h":116,"hinge":"left"},
{"day":7,"x":1196,"y":60,"w":124,"h":150,"hinge":"right"},
{"day":8,"x":32,"y":870,"w":114,"h":104,"hinge":"top"},
{"day":9,"x":555,"y":602,"w":122,"h":150,"hinge":"left"},
{"day":10,"x":882,"y":662,"w":144,"h":130,"hinge":"top"},
{"day":11,"x":710,"y":649,"w":150,"h":132,"hinge":"top"},
{"day":12,"x":810,"y":807,"w":118,"h":150,"hinge":"left"},
{"day":13,"x":84,"y":601,"w":150,"h":148,"hinge":"right"},
{"day":14,"x":68,"y":172,"w":150,"h":122,"hinge":"top"},
{"day":15,"x":649,"y":390,"w":138,"h":114,"hinge":"right"},
{"day":16,"x":994,"y":325,"w":98,"h":126,"hinge":"top"},
{"day":17,"x":804,"y":235,"w":150,"h":140,"hinge":"left"},
{"day":18,"x":1107,"y":386,"w":144,"h":110,"hinge":"right"},
{"day":19,"x":1263,"y":671,"w":148,"h":150,"hinge":"right"},
{"day":20,"x":578,"y":802,"w":98,"h":120,"hinge":"left"},
{"day":21,"x":1180,"y":511,"w":108,"h":126,"hinge":"right"},
{"day":22,"x":1462,"y":178,"w":108,"h":96,"hinge":"top"},
{"day":23,"x":1420,"y":498,"w":120,"h":150,"hinge":"top"},
{"day":24,"x":225,"y":410,"w":170,"h":140,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/golf.js', e); }
/* ---- src/designs/nutcracker.js ---- */
try {
/* Design — "Nutcracker Night"
   A gilt theatre on Christmas Eve: red velvet curtains, footlights, a towering tree,
   a toy-soldier nutcracker, a sugar-plum dancer on pointe, two mice, snow falling on stage
   and the audience silhouetted in the stalls. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1712);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];

    function bulb(x, y, c, r = 4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.5)}" fill="${c}" opacity=".22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".7"/>`;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/></g>`;
    }
    function gift(x, y, w, h, fill, rib, d = 10) {
      return `<path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".2"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".3"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 5}" y="${y}" width="10" height="${h}" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 5}" width="${w}" height="10" fill="${rib}"/>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.55, rib, '#00000055')}`;
    }
    const star = (x, y, ro, ri) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); } return d + 'Z'; };

    add(`<defs>
      <linearGradient id="nc-gilt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5420"/><stop offset=".2" stop-color="#f3d98f"/><stop offset=".38" stop-color="#b8893a"/><stop offset=".55" stop-color="#fbe7ae"/><stop offset=".72" stop-color="#a57a30"/><stop offset=".88" stop-color="#f0d189"/><stop offset="1" stop-color="#6e4a1a"/></linearGradient>
      <linearGradient id="nc-giltV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#d9a84a"/><stop offset="1" stop-color="#8a5e18"/></linearGradient>
      <linearGradient id="nc-velvet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a0610"/><stop offset=".25" stop-color="#a0142a"/><stop offset=".5" stop-color="#6e0a18"/><stop offset=".75" stop-color="#b81c32"/><stop offset="1" stop-color="#4a0610"/></linearGradient>
      <linearGradient id="nc-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0710"/><stop offset="1" stop-color="#1e0408"/></linearGradient>
      <linearGradient id="nc-backdrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1838"/><stop offset=".6" stop-color="#284a86"/><stop offset="1" stop-color="#7a92c4"/></linearGradient>
      <linearGradient id="nc-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3420"/><stop offset="1" stop-color="#8a5634"/></linearGradient>
      <linearGradient id="nc-tree" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="nc-coat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d22a34"/><stop offset="1" stop-color="#8a0f1c"/></linearGradient>
      <linearGradient id="nc-tutu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd2e6"/><stop offset="1" stop-color="#f08ab8"/></linearGradient>
      <radialGradient id="nc-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff9e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></radialGradient>
      <radialGradient id="nc-foot" cx="800" cy="900" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd890" stop-opacity=".28"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient>
      <radialGradient id="nc-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4d0" stop-opacity=".45"/><stop offset="1" stop-color="#fff4d0" stop-opacity="0"/></radialGradient>
      <radialGradient id="nc-vig" cx="800" cy="480" r="1000" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0002" stop-opacity=".65"/></radialGradient>
      ${[['red', '#ff5a63', '#b0101f', '#5e0710'], ['gold', '#ffe39a', '#cf9a2e', '#6a4410'], ['blue', '#8fb8ff', '#2a56b0', '#0f2353'], ['silver', '#ffffff', '#b9c3cc', '#5b6670'], ['plum', '#e3a0f0', '#7a2f95', '#33103f']].map(([k, a, b, c]) => `<radialGradient id="nc-orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`).join('')}
      <pattern id="nc-damask" width="60" height="80" patternUnits="userSpaceOnUse"><path d="M30 8 C40 22 42 34 30 48 C18 34 20 22 30 8Z" fill="#c2414c" opacity=".14"/><circle cx="30" cy="62" r="4" fill="#c2414c" opacity=".14"/></pattern>
      <filter id="nc-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="nc-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".5"/></filter>
      <clipPath id="nc-stage"><path d="M180 870 V250 Q180 160 300 156 H1300 Q1420 160 1420 250 V870Z"/></clipPath>
    </defs>`);

    /* ---------- auditorium walls and boxes ---------- */
    add(`<rect width="${W}" height="${H}" fill="url(#nc-wall)"/><rect width="${W}" height="${H}" fill="url(#nc-damask)"/>`);
    [[0, 260], [0, 560], [1600, 260], [1600, 560]].forEach(([x, y]) => {
      const dir = x ? -1 : 1, bx = x ? 1460 : 10;
      add(`<g filter="url(#nc-shadow)"><path d="M${bx} ${y} h130 v90 q-65 40 -130 0Z" fill="#7a0f1c"/><path d="M${bx} ${y} h130" stroke="url(#nc-giltV)" stroke-width="8"/><path d="M${bx} ${y + 90} q65 40 130 0" stroke="url(#nc-giltV)" stroke-width="5" fill="none"/>
        <path d="M${bx + 10} ${y - 110} h110 v100 h-110Z" fill="#2a0408"/><path d="M${bx + 6} ${y - 116} q59 -40 118 0" stroke="url(#nc-giltV)" stroke-width="5" fill="none"/>
        <circle cx="${bx + 40}" cy="${y - 40}" r="10" fill="#14080a"/><path d="M${bx + 26} ${y - 2} q14 -26 28 0Z" fill="#14080a"/><circle cx="${bx + 86}" cy="${y - 44}" r="9" fill="#14080a"/><path d="M${bx + 72} ${y - 2} q14 -28 28 0Z" fill="#14080a"/></g>`);
      const lx = bx + (dir > 0 ? 140 : -10);
      add(`<rect x="${lx - 3}" y="${y - 70}" width="6" height="30" fill="url(#nc-giltV)"/><path d="M${lx - 9} ${y - 72} h18 l-4 -16 h-10Z" fill="#ffe6a0"/>`);
      lights.push({ x: lx, y: y - 80, c: '#ffd890', r: 4 });
    });

    /* ---------- the stage (inside the proscenium) ---------- */
    add(`<g clip-path="url(#nc-stage)">`);
    add(`<rect x="180" y="150" width="1240" height="720" fill="url(#nc-backdrop)"/>`);
    let st = '';
    for (let i = 0; i < 120; i++) st += `<circle cx="${f(rr(200, 1400))}" cy="${f(rr(170, 480))}" r="${f(rr(0.6, 2))}" fill="#fff" opacity="${f(rr(0.4, 1))}"/>`;
    add(st);
    add(`<circle cx="1120" cy="300" r="110" fill="url(#nc-moon)"/><circle cx="1120" cy="300" r="34" fill="#fff6d8"/>`);
    // painted backdrop hills & stylised trees
    add(`<path d="M180 560 Q360 470 560 530 Q760 590 980 510 Q1200 440 1420 540 V870 H180Z" fill="#a8bde0"/><path d="M180 620 Q420 560 700 610 Q980 660 1220 590 Q1340 560 1420 600 V870 H180Z" fill="#d7e3f4"/>`);
    let bt = '';
    for (let i = 0; i < 18; i++) {
      const x = rr(200, 1400), base = rr(560, 640), h = rr(60, 140);
      bt += `<path d="M${f(x)} ${f(base - h)} L${f(x - h * 0.3)} ${f(base)} H${f(x + h * 0.3)}Z" fill="${pick(['#1d4d6a', '#245a78', '#173f5a'])}"/><path d="M${f(x)} ${f(base - h)} L${f(x - h * 0.14)} ${f(base - h * 0.5)} L${f(x + h * 0.1)} ${f(base - h * 0.55)}Z" fill="#eef4ff" opacity=".8"/>`;
    }
    add(bt);
    // stage floor with perspective boards
    add(`<path d="M180 700 H1420 V870 H180Z" fill="url(#nc-floor)"/>`);
    let fb = '';
    for (let i = -14; i <= 14; i++) fb += `<path d="M${800 + i * 30} 700 L${800 + i * 70} 870" stroke="#3a1f10" stroke-width="2" opacity=".6"/>`;
    for (let y = 720; y < 870; y += 28) fb += `<path d="M180 ${y} H1420" stroke="#3a1f10" stroke-width="1.5" opacity=".35"/>`;
    add(fb);
    add(`<path d="M180 704 Q400 690 600 708 Q800 724 1000 706 Q1200 690 1420 706 V720 H180Z" fill="#eef4ff" opacity=".85"/>`);
    // spotlight pools
    add(`<ellipse cx="470" cy="790" rx="170" ry="40" fill="url(#nc-pool)"/><ellipse cx="1130" cy="790" rx="170" ry="40" fill="url(#nc-pool)"/><ellipse cx="800" cy="760" rx="260" ry="50" fill="url(#nc-pool)" opacity=".7"/>`);

    /* the grand tree */
    const cx = 800;
    const tiers = [[560, 740, 230], [450, 630, 196], [350, 520, 160], [262, 420, 120], [196, 320, 80]];
    const tierPath = (y0, y1, hw) => {
      let d = `M${cx} ${y0} Q${f(cx - hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx - hw} ${y1}`;
      const n = Math.round(hw / 26), step = (2 * hw) / n;
      for (let i = 0; i < n; i++) d += ` Q${f(cx - hw + step * (i + 0.5))} ${y1 + 14} ${f(cx - hw + step * (i + 1))} ${i < n - 1 ? y1 - 3 : y1}`;
      return d + ` Q${f(cx + hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${y0}Z`;
    };
    add(`<rect x="${cx - 20}" y="720" width="40" height="40" fill="#4a2614"/><ellipse cx="${cx}" cy="760" rx="210" ry="24" fill="#a3172a"/><ellipse cx="${cx}" cy="756" rx="190" ry="18" fill="#f4eee2"/>`);
    tiers.forEach(([y0, y1, hw], i) => {
      if (i) add(`<path d="${tierPath(y0 + 12, y1 + 12, hw)}" fill="#000" opacity=".3" filter="url(#nc-soft)"/>`);
      add(`<path d="${tierPath(y0, y1, hw)}" fill="url(#nc-tree)"/>`);
      let nd = '';
      for (let k = 0; k < hw * 2; k++) {
        const y = rr(y0 + (y1 - y0) * 0.15, y1 + 4), span = hw * ((y - y0) / (y1 - y0)), x = cx + rr(-span, span) * 0.97, dir = x < cx ? -1 : 1, l = rr(9, 20);
        nd += `<path d="M${f(x)} ${f(y)} l${f(dir * l * 0.7)} ${f(l * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
      }
      add(nd);
      if (i < 4) add(`<path d="M${f(cx - hw * 0.55)} ${f(y0 + (y1 - y0) * 0.55)} Q${cx} ${f(y1 + 20)} ${f(cx + hw * 0.8)} ${f(y0 + (y1 - y0) * 0.78)}" stroke="#f3d27a" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`);
    });
    const placed = [];
    const inTree = (x, y) => tiers.some(([y0, y1, hw]) => y > y0 + (y1 - y0) * 0.3 && y < y1 - 8 && Math.abs(x - cx) < hw * ((y - y0) / (y1 - y0)) * 0.85);
    const spot = (minD) => { for (let k = 0; k < 400; k++) { const x = rr(cx - 230, cx + 230), y = rr(200, 740); if (!inTree(x, y)) continue; if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue; return [x, y]; } return null; };
    const ok = ['red', 'gold', 'blue', 'silver', 'plum'];
    for (let i = 0; i < 40; i++) { const p = spot(20); if (!p) continue; const r = rr(8, 14); placed.push([p[0], p[1], r]); add(`<rect x="${f(p[0] - 3)}" y="${f(p[1] - r - 5)}" width="6" height="6" rx="1" fill="#e2b04a"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#nc-orn-${ok[i % ok.length]})"/>`); }
    for (let i = 0; i < 70; i++) { const p = spot(8); if (!p) continue; placed.push([p[0], p[1], 5]); add(bulb(p[0], p[1], BULB[i % BULB.length], 3.8)); }
    add(`<path d="${star(cx, 192, 34, 14)}" fill="#ffe08a" stroke="#a87a1c" stroke-width="2"/><path d="${star(cx, 192, 16, 7)}" fill="#fff6c8" opacity=".7"/>`);
    add(gift(640, 700, 70, 52, '#b3172b', '#f0d07a') + gift(880, 708, 80, 46, '#1f6b43', '#f0d07a') + gift(720, 724, 54, 34, '#2a5aa8', '#f4ede0') + gift(830, 728, 50, 30, '#e0b24a', '#b3172b'));

    /* nutcracker */
    add(`<g transform="translate(470 780)" filter="url(#nc-shadow)">
      <ellipse cx="0" cy="4" rx="70" ry="10" fill="#000" opacity=".35"/>
      <rect x="-50" y="-12" width="100" height="14" rx="3" fill="#2a8a4e"/><rect x="-50" y="-12" width="100" height="4" fill="#e2b04a"/>
      <rect x="-30" y="-110" width="24" height="98" fill="#1d3a8a"/><rect x="6" y="-110" width="24" height="98" fill="#1d3a8a"/>
      <rect x="-32" y="-44" width="28" height="34" rx="4" fill="#111"/><rect x="4" y="-44" width="28" height="34" rx="4" fill="#111"/><path d="M-30 -42 h24 M6 -42 h24" stroke="#e2b04a" stroke-width="2"/>
      <path d="M-44 -210 h88 l4 104 h-96Z" fill="url(#nc-coat)"/><path d="M-44 -200 L40 -114 M44 -200 L-40 -114" stroke="#f4eee2" stroke-width="10"/>
      ${[-180, -160, -140, -120].map((y) => `<circle cx="0" cy="${y}" r="4" fill="#ffe08a"/>`).join('')}
      <rect x="-46" y="-118" width="92" height="12" fill="#111"/><rect x="-8" y="-120" width="16" height="16" fill="#e2b04a"/>
      <path d="M-46 -210 l-22 6 v80 l18 4Z" fill="url(#nc-coat)"/><circle cx="-60" cy="-118" r="10" fill="#f4eee2"/>
      <path d="M46 -210 l26 10 l10 70 l-18 4Z" fill="url(#nc-coat)"/><circle cx="72" cy="-124" r="10" fill="#f4eee2"/>
      <path d="M76 -128 L120 -232" stroke="#d9dde6" stroke-width="5" stroke-linecap="round"/><rect x="64" y="-134" width="22" height="6" rx="2" fill="#e2b04a" transform="rotate(-24 75 -131)"/>
      <path d="M-56 -214 h112 l-8 -14 h-96Z" fill="#e2b04a"/>
      <rect x="-30" y="-288" width="60" height="70" rx="6" fill="#f2d1b0"/>
      <path d="M-34 -250 Q-40 -200 0 -196 Q40 -200 34 -250 L28 -232 Q0 -218 -28 -232Z" fill="#f4f4f4"/>
      <rect x="-20" y="-240" width="40" height="16" rx="3" fill="#fff"/><path d="M-20 -232 h40" stroke="#b03030" stroke-width="2"/>
      <path d="M-24 -254 q8 -6 16 0 M8 -254 q8 -6 16 0" stroke="#f4f4f4" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="-12" cy="-266" r="4" fill="#111"/><circle cx="12" cy="-266" r="4" fill="#111"/><circle cx="-11" cy="-267" r="1.3" fill="#fff"/><circle cx="13" cy="-267" r="1.3" fill="#fff"/>
      <circle cx="-20" cy="-250" r="6" fill="#f08a8a" opacity=".6"/><circle cx="20" cy="-250" r="6" fill="#f08a8a" opacity=".6"/>
      <path d="M0 -262 l6 12 h-12Z" fill="#e2a888"/>
      <path d="M-36 -280 h72 l-6 -84 h-60Z" fill="#111"/><rect x="-38" y="-292" width="76" height="14" rx="3" fill="#e2b04a"/>
      <path d="M-28 -320 h56 M-30 -340 h60" stroke="#e2b04a" stroke-width="3"/><path d="${star(0, -326, 10, 4)}" fill="#ffe08a"/>
      <path d="M18 -364 Q30 -410 48 -400 Q38 -388 28 -360Z" fill="#f4f4f4"/><path d="M24 -364 Q40 -396 54 -392" stroke="#b3172b" stroke-width="3" fill="none"/>
    </g>`);

    /* sugar-plum dancer */
    add(`<g transform="translate(1130 784)" filter="url(#nc-shadow)">
      <ellipse cx="0" cy="2" rx="60" ry="9" fill="#000" opacity=".3"/>
      <path d="M-4 0 L-10 -100 M6 0 L14 -100" stroke="#f9d8c8" stroke-width="9" stroke-linecap="round"/>
      <path d="M-6 -2 l2 -18 M6 -2 l-1 -18" stroke="#f6a8c8" stroke-width="7" stroke-linecap="round"/>
      <path d="M-12 -46 L-30 -90 M16 -46 L50 -84" stroke="#f9d8c8" stroke-width="9" stroke-linecap="round" opacity="0"/>
      <ellipse cx="0" cy="-104" rx="80" ry="16" fill="url(#nc-tutu)"/><ellipse cx="0" cy="-108" rx="72" ry="12" fill="#ffe4f0"/>
      ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 6.283; return `<circle cx="${f(Math.cos(a) * 66)}" cy="${f(-104 + Math.sin(a) * 12)}" r="3" fill="#fff" opacity=".7"/>`; }).join('')}
      <path d="M-18 -112 Q-22 -160 0 -168 Q22 -160 18 -112Z" fill="#f08ab8"/><path d="M-14 -150 h28" stroke="#ffe08a" stroke-width="2"/>
      <path d="M-14 -158 Q-50 -200 -30 -238" stroke="#f9d8c8" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M14 -158 Q50 -200 30 -238" stroke="#f9d8c8" stroke-width="8" fill="none" stroke-linecap="round"/>
      <rect x="-5" y="-180" width="10" height="14" fill="#f9d8c8"/>
      <circle cx="0" cy="-194" r="17" fill="#f9d8c8"/><path d="M-17 -196 Q-16 -214 0 -214 Q16 -214 17 -196 Q8 -206 0 -206 Q-8 -206 -17 -196Z" fill="#6b3a1c"/><circle cx="0" cy="-218" r="9" fill="#6b3a1c"/>
      <path d="M-10 -212 l4 -10 l6 6 l6 -6 l4 10Z" fill="#ffe08a"/>
      <path d="M-7 -192 q3 2 6 0 M2 -192 q3 2 6 0" stroke="#3a1a0a" stroke-width="1.6" fill="none"/><path d="M-4 -184 q4 3 8 0" stroke="#c4405a" stroke-width="2" fill="none"/>
      <circle cx="-10" cy="-186" r="3.5" fill="#f4a0b8" opacity=".6"/><circle cx="10" cy="-186" r="3.5" fill="#f4a0b8" opacity=".6"/>
    </g>`);
    // little sparkles around the dancer
    for (let i = 0; i < 10; i++) { const a = rr(0, 6.28), d = rr(80, 130); add(`<path d="${star(1130 + Math.cos(a) * d, 620 + Math.sin(a) * d * 0.7, 6, 2)}" fill="#fff6c8" opacity=".85"/>`); }

    /* mice */
    function mouse(x, y, s, flip, crown) {
      return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><path d="M22 -4 Q50 -2 52 -20" stroke="#8a8f9c" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-12" rx="24" ry="14" fill="#9aa0ad"/><ellipse cx="-22" cy="-18" rx="12" ry="10" fill="#9aa0ad"/><circle cx="-24" cy="-30" r="8" fill="#9aa0ad"/><circle cx="-24" cy="-30" r="4.5" fill="#f4b8c8"/><circle cx="-34" cy="-16" r="2.6" fill="#f08aa0"/><circle cx="-26" cy="-20" r="2" fill="#111"/>${crown ? '<path d="M-30 -30 l3 -10 l4 6 l4 -8 l3 12Z" fill="#ffe08a"/>' : ''}</g>`;
    }
    add(mouse(640, 846, 1, false, true) + mouse(980, 848, 0.9, true, false) + `<path d="M955 848 l20 -16 l10 16Z" fill="#f2c94c"/><circle cx="968" cy="842" r="2" fill="#d9a83a"/>`);
    add(`</g>`);

    /* ---------- curtains ---------- */
    add(`<path d="M180 150 H420 Q380 360 410 520 Q300 560 260 870 H180Z" fill="url(#nc-velvet)"/><path d="M1420 150 H1180 Q1220 360 1190 520 Q1300 560 1340 870 H1420Z" fill="url(#nc-velvet)"/>`);
    add(`<path d="M220 160 Q230 400 220 860 M260 160 Q290 360 300 520 M330 160 Q350 320 370 500 M1380 160 Q1370 400 1380 860 M1340 160 Q1310 360 1300 520 M1270 160 Q1250 320 1230 500" stroke="#3a0408" stroke-width="4" opacity=".55" fill="none"/>`);
    add(`<path d="M300 520 Q360 506 430 522 Q380 540 300 534Z M1300 520 Q1240 506 1170 522 Q1220 540 1300 534Z" fill="url(#nc-giltV)"/><circle cx="420" cy="528" r="10" fill="url(#nc-giltV)"/><circle cx="1180" cy="528" r="10" fill="url(#nc-giltV)"/><path d="M420 538 v40 M414 540 v34 M426 540 v34 M1180 538 v40 M1174 540 v34 M1186 540 v34" stroke="#e2b04a" stroke-width="3"/>`);
    // valance swags
    let val = '';
    for (let i = 0; i < 6; i++) {
      const a = 180 + i * 206.7, b = a + 206.7;
      val += `<path d="M${f(a)} 150 Q${f((a + b) / 2)} 260 ${f(b)} 150 V150Z" fill="url(#nc-velvet)"/><path d="M${f(a)} 150 Q${f((a + b) / 2)} 260 ${f(b)} 150" stroke="url(#nc-giltV)" stroke-width="5" fill="none"/>`;
      for (let k = 1; k < 14; k++) { const t = k / 14, x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * ((a + b) / 2) + t * t * b, y = (1 - t) * (1 - t) * 150 + 2 * (1 - t) * t * 260 + t * t * 150; val += `<path d="M${f(x)} ${f(y)} v12" stroke="#e2b04a" stroke-width="2.5"/>`; }
    }
    add(val);
    for (let i = 0; i <= 6; i++) add(`<path d="M${f(180 + i * 206.7)} 150 v40" stroke="url(#nc-giltV)" stroke-width="5"/><ellipse cx="${f(180 + i * 206.7)}" cy="196" rx="9" ry="14" fill="url(#nc-giltV)"/>`);

    /* ---------- gilt proscenium ---------- */
    add(`<path d="M0 0 H1600 V1000 H1420 V250 Q1420 160 1300 156 H300 Q180 160 180 250 V1000 H0Z" fill="none"/>`);
    add(`<g filter="url(#nc-shadow)">
      <path d="M150 1000 V250 Q150 130 300 126 H1300 Q1450 130 1450 250 V1000 H1420 V250 Q1420 160 1300 156 H300 Q180 160 180 250 V1000Z" fill="url(#nc-gilt)"/>
      <path d="M136 1000 V250 Q136 116 300 112 H1300 Q1464 116 1464 250 V1000" stroke="url(#nc-giltV)" stroke-width="6" fill="none"/>
      <path d="M186 1000 V252 Q186 166 300 162 H1300 Q1414 166 1414 252 V1000" stroke="#5a3a10" stroke-width="3" fill="none"/>
    </g>`);
    // columns ornaments
    for (let y = 300; y < 860; y += 70) add(`<circle cx="165" cy="${y}" r="5" fill="#fff1b0"/><circle cx="1435" cy="${y}" r="5" fill="#fff1b0"/>`);
    // cartouche plaque for the title
    add(`<g filter="url(#nc-shadow)">
      <path d="M520 60 Q520 30 560 30 H1040 Q1080 30 1080 60 V112 Q1080 140 1040 140 H560 Q520 140 520 112Z" fill="url(#nc-gilt)"/>
      <path d="M538 64 Q538 46 566 46 H1034 Q1062 46 1062 64 V108 Q1062 124 1034 124 H566 Q538 124 538 108Z" fill="#6e0a18"/>
      <path d="M546 68 Q546 54 570 54 H1030 Q1054 54 1054 68 V104 Q1054 116 1030 116 H570 Q546 116 546 104Z" fill="none" stroke="#e2b04a" stroke-width="1.5"/>
      <path d="M520 86 Q480 70 470 92 Q462 112 490 116 Q470 100 486 92 Q500 88 520 100Z M1080 86 Q1120 70 1130 92 Q1138 112 1110 116 Q1130 100 1114 92 Q1100 88 1080 100Z" fill="url(#nc-giltV)"/>
      <path d="M760 30 Q800 0 840 30Z" fill="url(#nc-giltV)"/><circle cx="800" cy="18" r="8" fill="#b3172b"/>
    </g>`);

    /* ---------- footlights, orchestra, audience ---------- */
    add(`<rect x="150" y="866" width="1300" height="20" fill="#2a1008"/><rect x="150" y="866" width="1300" height="4" fill="url(#nc-giltV)"/>`);
    for (let x = 220; x <= 1380; x += 58) {
      add(`<path d="M${x - 14} 870 Q${x} 852 ${x + 14} 870Z" fill="#c9a24a"/><ellipse cx="${x}" cy="866" rx="6" ry="4" fill="#fff4c8"/>`);
      lights.push({ x, y: 864, c: '#ffe8a8', r: 3.4 });
    }
    add(`<rect x="0" y="886" width="${W}" height="114" fill="#0c0204"/>`);
    let aud = '';
    for (let row = 0; row < 2; row++) for (let x = 20 + row * 30; x < W; x += rr(52, 70)) {
      const y = 940 + row * 40, r = rr(16, 22);
      aud += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${row ? '#050102' : '#14070a'}"/><rect x="${f(x - r * 1.3)}" y="${f(y + r * 0.6)}" width="${f(r * 2.6)}" height="40" rx="${f(r)}" fill="${row ? '#050102' : '#14070a'}"/>`;
      if (R() < 0.18) aud += `<path d="M${f(x - r)} ${f(y - r * 0.4)} q${f(r)} -${f(r * 1.2)} ${f(r * 2)} 0" fill="#14070a"/>`;
    }
    add(aud);
    // conductor with baton
    add(`<g transform="translate(800 920)" fill="#0a0203"><circle cx="0" cy="-16" r="16"/><path d="M-26 40 Q-28 0 0 -2 Q28 0 26 40Z"/><path d="M20 4 L50 -26" stroke="#0a0203" stroke-width="8" stroke-linecap="round"/><path d="M50 -26 L76 -54" stroke="#f4eee2" stroke-width="2.5"/></g>`);

    add(`<rect width="${W}" height="${H}" fill="url(#nc-foot)"/><rect width="${W}" height="${H}" fill="url(#nc-vig)"/>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  /** Two spotlight beams sweeping gently over the dancers. */
  function spotlights(ctx, t) {
    ctx.globalCompositeOperation = 'lighter';
    [[300, 160, 470, 780, 0], [1300, 160, 1130, 780, 2]].forEach(([sx, sy, tx, ty, ph]) => {
      const x = tx + Math.sin(t * 0.5 + ph) * 26;
      const g = ctx.createLinearGradient(sx, sy, x, ty);
      g.addColorStop(0, 'rgba(255,244,210,.2)'); g.addColorStop(1, 'rgba(255,244,210,.04)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(sx - 10, sy); ctx.lineTo(sx + 10, sy); ctx.lineTo(x + 130, ty); ctx.lineTo(x - 130, ty); ctx.closePath(); ctx.fill();
    });
  }

  A.designs.nutcracker = {
    id: 'nutcracker',
    name: 'Nutcracker Night',
    blurb: 'Velvet curtains, sugar plums and a toy soldier on stage.',
    width: W,
    height: H,
    build,
    title: { path: 'M570 100 L1030 100', size: 40, maxWidth: 440, fill: '#fff1c8', stroke: '#3a0408' },
    effects: [
      { type: 'custom', draw: spotlights },
      { type: 'snow', rect: [190, 160, 1220, 700], count: 90, a: 0.8 },
      { type: 'twinkle' },
      { type: 'star', x: 800, y: 192, r: 60 },
      { type: 'glow', x: 800, y: 870, r: 260, color: '255,226,160', a: 0.14, speed: 0.8 },
    ],
    layout: 'nutcracker',
    keepOut: [[500, 18, 600, 132]],
    day24: { x: 715, y: 390, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/nutcracker.js', e); }
/* ---- src/layouts/nutcracker.js ---- */
try {
/* Door layout for "Nutcracker Night" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["nutcracker"]=[{"day":1,"x":976,"y":163,"w":96,"h":120,"hinge":"right"},
{"day":2,"x":266,"y":478,"w":150,"h":130,"hinge":"left"},
{"day":3,"x":166,"y":635,"w":150,"h":136,"hinge":"right"},
{"day":4,"x":1332,"y":120,"w":150,"h":136,"hinge":"left"},
{"day":5,"x":1274,"y":311,"w":150,"h":126,"hinge":"right"},
{"day":6,"x":26,"y":798,"w":128,"h":150,"hinge":"top"},
{"day":7,"x":1397,"y":761,"w":144,"h":150,"hinge":"top"},
{"day":8,"x":680,"y":712,"w":150,"h":144,"hinge":"right"},
{"day":9,"x":1173,"y":493,"w":150,"h":126,"hinge":"left"},
{"day":10,"x":1100,"y":698,"w":140,"h":150,"hinge":"right"},
{"day":11,"x":440,"y":344,"w":132,"h":104,"hinge":"left"},
{"day":12,"x":847,"y":868,"w":126,"h":100,"hinge":"left"},
{"day":13,"x":167,"y":223,"w":120,"h":150,"hinge":"left"},
{"day":14,"x":640,"y":559,"w":150,"h":138,"hinge":"right"},
{"day":15,"x":1472,"y":462,"w":102,"h":126,"hinge":"left"},
{"day":16,"x":1128,"y":308,"w":118,"h":150,"hinge":"left"},
{"day":17,"x":486,"y":614,"w":132,"h":150,"hinge":"top"},
{"day":18,"x":806,"y":252,"w":150,"h":116,"hinge":"left"},
{"day":19,"x":561,"y":787,"w":102,"h":126,"hinge":"left"},
{"day":20,"x":1049,"y":864,"w":132,"h":110,"hinge":"right"},
{"day":21,"x":210,"y":30,"w":128,"h":150,"hinge":"left"},
{"day":22,"x":451,"y":192,"w":150,"h":136,"hinge":"left"},
{"day":23,"x":170,"y":811,"w":136,"h":150,"hinge":"right"},
{"day":24,"x":715,"y":390,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/nutcracker.js', e); }
/* ---- src/designs/pond.js ---- */
try {
/* Design — "Frozen Pond"
   Skaters circling a lantern-lit pond on a winter evening: birches and pines, a little
   footbridge over the inlet, a warming hut with the stove going, moonlight on the ice. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  const POND = { cx: 800, cy: 770, rx: 560, ry: 150 };
  const LOOP = { cx: 800, cy: 772, rx: 300, ry: 62 };
  const SKT = {
    leg: 'M-3 0 L-1 -30 L6 -30 L4 0Z',
    torso: 'M-9 -28 Q-7 -58 4 -60 Q15 -56 11 -28Z',
    skirt: 'M-12 -24 Q0 -38 14 -24 L18 -14 Q2 -10 -16 -14Z',
    hat: 'M-1 -72 Q0 -84 8 -84 Q16 -84 15 -72Z',
  };

  function build() {
    const R = A.util.rng(2611);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];

    function bulb(x, y, c, r = 3.4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".3"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function lightString(x0, y0, x1, y1, sag, n, off = 0, r = 3) {
      const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
      let s = `<path d="M${f(x0)} ${f(y0)} Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}" stroke="#141a2a" stroke-width="1.5" fill="none"/>`;
      for (let i = 1; i < n; i++) { const t = i / n; s += bulb((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 4, BULB[(i + off) % 7], r); }
      return s;
    }
    function pine(x, base, h, col = '#1d3b45', snow = '#eef3fb', dark = '#122630') {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.1)}" width="${f(h * 0.06)}" height="${f(h * 0.12)}" fill="#3a2418"/>`;
      for (let k = 0; k < 4; k++) {
        const ty = base - h + k * h * 0.2, w = h * (0.13 + k * 0.08), th = h * 0.32;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + th)} Q${f(x)} ${f(ty + th + h * 0.05)} ${f(x + w)} ${f(ty + th)}Z" fill="${col}"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x + w)} ${f(ty + th)} Q${f(x + w * 0.5)} ${f(ty + th + h * 0.03)} ${f(x + w * 0.1)} ${f(ty + th * 0.9)}Z" fill="${dark}" opacity=".6"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.62)} ${f(ty + th * 0.6)} Q${f(x - w * 0.35)} ${f(ty + th * 0.72)} ${f(x - w * 0.12)} ${f(ty + th * 0.55)} Q${f(x + w * 0.18)} ${f(ty + th * 0.7)} ${f(x + w * 0.5)} ${f(ty + th * 0.5)}Z" fill="${snow}"/>`;
      }
      return s;
    }
    function birch(x, base, h) {
      let s = `<path d="M${x - 7} ${base} L${x - 4} ${base - h} L${x + 4} ${base - h} L${x + 7} ${base}Z" fill="#f2f0ea"/>`;
      for (let i = 0; i < 9; i++) { const y = base - rr(10, h - 10); s += `<path d="M${f(x - 6)} ${f(y)} h${f(rr(4, 9))}" stroke="#2a2a2a" stroke-width="${f(rr(1.5, 3))}"/>`; }
      for (let i = 0; i < 7; i++) {
        const y = base - h * rr(0.35, 0.95), d = i % 2 ? 1 : -1, l = rr(30, 70);
        s += `<path d="M${x} ${f(y)} q${f(d * l * 0.5)} ${f(-l * 0.2)} ${f(d * l)} ${f(-l * 0.6)}" stroke="#e8e4dc" stroke-width="2.4" fill="none"/>`;
        s += `<path d="M${f(x + d * l * 0.6)} ${f(y - l * 0.3)} q${f(d * 10)} -4 ${f(d * 18)} -16" stroke="#e8e4dc" stroke-width="1.4" fill="none"/>`;
      }
      return s;
    }
    function lantern(x, y, s = 1) {
      lights.push({ x, y: y - 46 * s, c: '#ffcf6b', r: 7 * s });
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-3" y="-40" width="6" height="42" fill="#1a1a22"/><path d="M-10 -40 h20 l-3 -18 h-14Z" fill="#1a1a22"/><rect x="-7" y="-56" width="14" height="15" fill="#ffd77a"/><path d="M-11 -58 L0 -68 L11 -58Z" fill="#1a1a22"/><path d="M-12 -59 L0 -70 L12 -59" stroke="#fff" stroke-width="3" fill="none"/><circle cx="0" cy="-34" r="7" fill="none" stroke="#1d5a35" stroke-width="4"/><circle cx="0" cy="-28" r="2.5" fill="#c4202f"/></g>`;
    }
    function skater(x, y, s, dir, coat, hat, opts = {}) {
      const skirt = opts.skirt ? `<path d="${SKT.skirt}" fill="${opts.skirt}"/>` : '';
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * dir)} ${f(s)})">
        <ellipse cx="-6" cy="3" rx="22" ry="3" fill="#0e1a3e" opacity=".25"/>
        <path d="M2 -28 L-26 -12" stroke="#2b2b4a" stroke-width="7" stroke-linecap="round"/><path d="M-34 -10 L-20 -15" stroke="#c9ced8" stroke-width="2"/><rect x="-32" y="-16" width="9" height="6" rx="2" fill="#f6f2ea"/>
        <path d="${SKT.leg}" fill="#2b2b4a"/><rect x="-4" y="-6" width="10" height="6" rx="2" fill="#f6f2ea"/><path d="M-8 2 H12" stroke="#c9ced8" stroke-width="2"/>
        <path d="${SKT.torso}" fill="${coat}"/>${skirt}
        <path d="M6 -50 L26 ${opts.holdHand ? -36 : -44}" stroke="${coat}" stroke-width="6" stroke-linecap="round"/><path d="M-2 -50 L-22 -58" stroke="${coat}" stroke-width="6" stroke-linecap="round"/>
        <path d="M-4 -60 Q4 -54 12 -60 L12 -55 Q4 -49 -4 -55Z" fill="${hat}"/><path d="M-3 -57 q-14 2 -22 10" stroke="${hat}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="7" cy="-68" r="7.5" fill="#f1c9a5"/><path d="${SKT.hat}" fill="${hat}"/><circle cx="8" cy="-86" r="4" fill="#fff"/>
      </g>`;
    }

    add(`<defs>
      <linearGradient id="p-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1636"/><stop offset=".45" stop-color="#253a74"/><stop offset=".78" stop-color="#5f679f"/><stop offset="1" stop-color="#c495b4"/></linearGradient>
      <radialGradient id="p-moon" cx="1250" cy="150" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff7dc" stop-opacity=".55"/><stop offset=".2" stop-color="#fff2c8" stop-opacity=".15"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>
      <linearGradient id="p-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe4f4"/><stop offset="1" stop-color="#c3cae6"/></linearGradient>
      <radialGradient id="p-ice" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#d6e6f8"/><stop offset=".6" stop-color="#9fbde0"/><stop offset="1" stop-color="#6f8fc0"/></radialGradient>
      <linearGradient id="p-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5530"/><stop offset="1" stop-color="#5a3218"/></linearGradient>
      <linearGradient id="p-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a6"/><stop offset="1" stop-color="#ffaa45"/></linearGradient>
      <linearGradient id="p-rib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d63b0"/><stop offset=".5" stop-color="#284a8e"/><stop offset="1" stop-color="#1a3266"/></linearGradient>
      <linearGradient id="p-ribd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3870"/><stop offset="1" stop-color="#0f1f45"/></linearGradient>
      <linearGradient id="p-silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9d2e2"/><stop offset="1" stop-color="#8a96ad"/></linearGradient>
      <radialGradient id="p-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <filter id="p-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#060d24" flood-opacity=".45"/></filter>
      <filter id="p-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
      <radialGradient id="p-vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".58" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#040818" stop-opacity=".6"/></radialGradient>
    </defs>`);

    /* evening sky */
    add(`<rect width="${W}" height="620" fill="url(#p-sky)"/>`);
    for (let i = 0; i < 160; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 380))}" r="${f(rr(0.5, 1.8))}" fill="#fff" opacity="${f(rr(0.25, 1))}"/>`);
    add(`<rect width="${W}" height="620" fill="url(#p-moon)"/><circle cx="1250" cy="150" r="34" fill="#fff8e2"/><circle cx="1240" cy="142" r="6" fill="#ece2c2" opacity=".6"/><circle cx="1262" cy="160" r="4" fill="#ece2c2" opacity=".6"/>`);
    /* hills, far forest, a village on the far bank */
    add(`<path d="M0 470 Q260 400 520 440 Q800 480 1080 420 Q1340 380 1600 440 V640 H0Z" fill="#7c86b8"/>`);
    for (let x = 0; x < W; x += 12) { const y = 470 + Math.sin(x / 150) * 18 - (x > 900 && x < 1300 ? 30 : 0); add(`<path d="M${f(x)} ${f(y - rr(16, 34))} L${f(x + 8)} ${f(y + 6)} L${f(x - 8)} ${f(y + 6)}Z" fill="#3b4677"/>`); }
    add(`<path d="M0 520 Q300 490 640 520 Q1000 548 1300 512 Q1460 498 1600 520 V1000 H0Z" fill="url(#p-snow)"/>`);
    [[480, 520], [540, 524], [600, 528], [690, 530]].forEach(([x, y], i) => {
      add(`<rect x="${x}" y="${y - 26}" width="40" height="26" fill="${['#8a4a3a', '#4a5a8a', '#8a6a3a', '#5a7a6a'][i]}"/><path d="M${x - 5} ${y - 26} L${x + 20} ${y - 42} L${x + 45} ${y - 26}Z" fill="#eef3fb"/><rect x="${x + 14}" y="${y - 18}" width="9" height="9" fill="#ffd27a"/>`);
      lights.push({ x: x + 18.5, y: y - 13.5, c: '#ffd27a', r: 2.4 });
    });

    /* the pond */
    const { cx, cy, rx, ry } = POND;
    add(`<ellipse cx="${cx}" cy="${cy + 10}" rx="${rx + 40}" ry="${ry + 26}" fill="#eef2fb"/>`);
    add(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#p-ice)"/>`);
    // moon + lantern reflections
    add(`<ellipse cx="1150" cy="720" rx="30" ry="80" fill="#fff6d6" opacity=".25" filter="url(#p-soft)"/>`);
    // skate scratches
    for (let i = 0; i < 26; i++) {
      const a = rr(0, Math.PI * 2), r1 = rr(0.2, 0.85);
      const x = cx + Math.cos(a) * rx * r1, y = cy + Math.sin(a) * ry * r1;
      add(`<path d="M${f(x - rr(30, 80))} ${f(y + rr(-6, 6))} Q${f(x)} ${f(y + rr(-12, 12))} ${f(x + rr(30, 80))} ${f(y + rr(-6, 6))}" stroke="#fff" stroke-width="${f(rr(0.8, 2))}" fill="none" opacity="${f(rr(0.3, 0.7))}"/>`);
    }
    add(`<ellipse cx="${cx}" cy="${cy}" rx="${LOOP.rx}" ry="${LOOP.ry}" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>`);
    add(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#fff" stroke-width="7" opacity=".85"/>`);

    /* inlet stream + footbridge on the left */
    add(`<path d="M0 640 Q120 640 220 690 Q260 712 300 740 L270 760 Q220 730 170 712 Q90 680 0 676Z" fill="url(#p-ice)"/>`);
    add(`<g filter="url(#p-sh)"><path d="M110 700 Q190 640 280 690" stroke="#7a2c22" stroke-width="12" fill="none"/><path d="M104 690 Q190 626 288 680" stroke="#9a3a2a" stroke-width="5" fill="none" transform="translate(0 -26)"/>
      ${[118, 140, 162, 184, 206, 228, 250, 272].map((x) => `<path d="M${x} ${f(700 - Math.sin(((x - 110) / 170) * Math.PI) * 44)} v-26" stroke="#7a2c22" stroke-width="4"/>`).join('')}
      <path d="M100 666 Q190 600 292 656" stroke="#fff" stroke-width="6" fill="none"/></g>`);

    /* trees around the pond */
    [[40, 520, 150], [1560, 540, 180], [1500, 520, 130], [1420, 510, 110], [880, 520, 90], [960, 514, 120], [1040, 520, 100]].forEach(([x, b, h]) => add(pine(x, b, h)));
    [[300, 600, 260], [350, 620, 220], [410, 600, 280], [1130, 600, 240]].forEach(([x, b, h]) => add(birch(x, b, h)));
    for (let i = 0; i < 18; i++) add(bulb(rr(1510, 1600), rr(380, 520), BULB[i % 7], 3));

    /* warming hut on the right */
    add(`<g filter="url(#p-sh)">
      <rect x="1250" y="560" width="270" height="140" fill="url(#p-log)"/>
      ${Array.from({ length: 7 }, (_, i) => `<path d="M1250 ${580 + i * 18} H1520" stroke="#3e2210" stroke-width="2.5" opacity=".6"/>`).join('')}
      <path d="M1228 566 L1385 478 L1542 566Z" fill="#5a2a2a"/><path d="M1224 568 L1385 474 L1546 568" stroke="#fff" stroke-width="12" fill="none" stroke-linejoin="round"/>
      <rect x="1460" y="470" width="30" height="60" fill="#6a4a3a"/><path d="M1456 472 q19 -10 38 0" stroke="#fff" stroke-width="6" fill="none"/>
      <rect x="1350" y="610" width="70" height="90" fill="#3e2210"/><rect x="1358" y="618" width="54" height="40" fill="url(#p-win)"/>
      <rect x="1270" y="600" width="56" height="44" fill="url(#p-win)"/><path d="M1298 600 v44 M1270 622 h56" stroke="#3e2210" stroke-width="4"/>
      <rect x="1446" y="600" width="56" height="44" fill="url(#p-win)"/><path d="M1474 600 v44 M1446 622 h56" stroke="#3e2210" stroke-width="4"/>
      <path d="M1266 646 h64 M1442 646 h64" stroke="#fff" stroke-width="5"/>
    </g>`);
    add(lightString(1232, 566, 1385, 480, -6, 10, 0, 3.2) + lightString(1385, 480, 1538, 566, -6, 10, 4, 3.2));
    {
      let s = '';
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += `<circle cx="${f(1385 + Math.cos(a) * 15)}" cy="${f(520 + Math.sin(a) * 15)}" r="7" fill="${pick(['#1d5a35', '#24683f'])}"/>`; }
      add(s + `<circle cx="1385" cy="534" r="5" fill="#c4202f"/><path d="M1380 534 l-5 14 M1390 534 l5 14" stroke="#c4202f" stroke-width="4"/>`);
    }
    // skates hanging by the door
    add(`<path d="M1430 640 q6 20 0 34 M1438 640 q-6 20 0 34" stroke="#c4202f" stroke-width="2" fill="none"/><path d="M1422 674 h14 v8 h-18Z M1432 676 h14 v8 h-18Z" fill="#f6f2ea"/>`);

    /* lanterns ringing the pond, with lights strung between them */
    const posts = [];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.06 + (i / 8) * 0.88);
      posts.push([cx - Math.cos(a) * (rx + 22), cy + Math.sin(a) * (ry + 16)]);
    }
    const back = [[cx - rx * 0.7, cy - ry * 0.95], [cx - rx * 0.2, cy - ry - 8], [cx + rx * 0.3, cy - ry - 6], [cx + rx * 0.75, cy - ry * 0.9]];
    back.forEach(([x, y]) => add(lantern(x, y, 0.8)));
    for (let i = 0; i < back.length - 1; i++) add(lightString(back[i][0], back[i][1] - 44, back[i + 1][0], back[i + 1][1] - 44, 16, 9, i, 2.4));
    posts.forEach(([x, y]) => add(lantern(x, y, 1.15)));
    for (let i = 0; i < posts.length - 1; i++) add(lightString(posts[i][0], posts[i][1] - 60, posts[i + 1][0], posts[i + 1][1] - 60, 22, 8, i * 2, 3));

    /* skaters on the ice (more circle round in the animation layer) */
    add(skater(560, 700, 1.0, 1, '#c4202f', '#f6f2ea', { skirt: '#8a1020', holdHand: true }) + skater(600, 704, 1.05, 1, '#2a4a8a', '#c4202f', {}));
    add(skater(1060, 690, 0.95, -1, '#1f7a4a', '#f2a81d', {}));
    add(skater(420, 842, 1.25, 1, '#6b4bd6', '#ff9be3', { skirt: '#4a2fa8' }));
    // a little one with a skating helper
    add(`<g transform="translate(1180 860) scale(1.2)"><path d="M-30 0 v-26 h44 v26 M-30 -26 l-6 -6 M14 -26 l6 -6" stroke="#2a6fd6" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-12 -2 v-14 M-4 -2 v-14" stroke="#2b2b4a" stroke-width="5"/><ellipse cx="-8" cy="-28" rx="11" ry="14" fill="#f2a81d"/><circle cx="-8" cy="-48" r="8" fill="#f1c9a5"/><path d="M-16 -50 Q-8 -64 0 -50Z" fill="#c4202f"/><circle cx="-8" cy="-61" r="3.5" fill="#fff"/><path d="M-2 -32 L10 -24" stroke="#f2a81d" stroke-width="5" stroke-linecap="round"/></g>`);

    /* foreground: bench with skates, snowbank, little tree */
    add(`<path d="M0 940 Q400 905 800 930 Q1200 955 1600 920 V1000 H0Z" fill="#e6ebf8"/><path d="M0 940 Q400 905 800 930 Q1200 955 1600 920" stroke="#fff" stroke-width="6" fill="none"/>`);
    add(`<g transform="translate(200 930)" filter="url(#p-sh)"><rect x="-80" y="-40" width="160" height="10" rx="3" fill="#7a4a2c"/><rect x="-80" y="-62" width="160" height="9" rx="3" fill="#7a4a2c"/><rect x="-80" y="-78" width="160" height="9" rx="3" fill="#7a4a2c"/>
      <path d="M-70 -30 v34 M70 -30 v34 M-70 -80 v50 M70 -80 v50" stroke="#1a1a22" stroke-width="6"/><path d="M-84 -82 Q0 -94 84 -82 M-84 -44 Q0 -54 84 -44" stroke="#fff" stroke-width="7" fill="none"/>
      <path d="M-40 -40 l-2 -24 h22 l4 18 h14 v6Z" fill="#f6f2ea"/><path d="M-46 -38 h46" stroke="#c9ced8" stroke-width="2.5"/><path d="M10 -40 l-2 -24 h22 l4 18 h14 v6Z" fill="#c4202f"/><path d="M4 -38 h46" stroke="#c9ced8" stroke-width="2.5"/>
      <rect x="50" y="-62" width="16" height="22" rx="4" fill="#2a6fd6"/><path d="M-70 -62 q20 -10 40 4" stroke="#1f7a4a" stroke-width="8" fill="none" stroke-linecap="round"/></g>`);
    add(pine(1530, 960, 220, '#1e4f3a'));
    for (let i = 0; i < 18; i++) add(bulb(rr(1475, 1590), rr(780, 940), BULB[i % 7], 3));

    /* title ribbon */
    add(`<g filter="url(#p-sh)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#p-ribd)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#p-ribd)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#081530"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#081530"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#p-rib)"/>
      <path d="M528 86 Q800 30 1072 86 M528 140 Q800 84 1072 140" stroke="url(#p-silver)" stroke-width="3" fill="none"/>
      <path d="M520 78 Q800 20 1080 78" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/>
    </g>`);
    add(`<rect width="${W}" height="${H}" fill="url(#p-vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  /* ---------- animation: skaters gliding round the pond ---------- */
  const P = {};
  const path = (k) => P[k] || (P[k] = new Path2D(SKT[k]));
  const CREW = [
    { coat: '#c4202f', hat: '#f6f2ea', skirt: '#8a1020', ph: 0 },
    { coat: '#2a6fd6', hat: '#f2a81d', ph: 2.1 },
    { coat: '#1f7a4a', hat: '#c4202f', skirt: '#14583a', ph: 4.2 },
  ];
  function drawSkater(ctx, c, kick) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2b2b4a'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(2, -28); ctx.lineTo(-22 - kick * 6, -14 + kick * 4); ctx.stroke();
    ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30 - kick * 6, -10 + kick * 4); ctx.lineTo(-16 - kick * 6, -16 + kick * 4); ctx.stroke();
    ctx.fillStyle = '#2b2b4a'; ctx.fill(path('leg'));
    ctx.strokeStyle = '#c9ced8'; ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(12, 2); ctx.stroke();
    ctx.fillStyle = c.coat; ctx.fill(path('torso'));
    if (c.skirt) { ctx.fillStyle = c.skirt; ctx.fill(path('skirt')); }
    ctx.strokeStyle = c.coat; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(6, -50); ctx.lineTo(26, -44 + kick * 3); ctx.moveTo(-2, -50); ctx.lineTo(-22, -56 - kick * 3); ctx.stroke();
    ctx.strokeStyle = c.hat; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-3, -57); ctx.quadraticCurveTo(-14, -56 + kick * 4, -26, -48 + kick * 6); ctx.stroke();
    ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(7, -68, 7.5, 0, 7); ctx.fill();
    ctx.fillStyle = c.hat; ctx.fill(path('hat'));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(8, -86, 4, 0, 7); ctx.fill();
  }
  function skaters(ctx, t) {
    const list = CREW.map((c) => {
      const a = t * 0.32 + c.ph;
      return { c, a, x: LOOP.cx + Math.cos(a) * LOOP.rx, y: LOOP.cy + Math.sin(a) * LOOP.ry, dir: -Math.sin(a) >= 0 ? 1 : -1, s: 0.95 + 0.3 * ((Math.sin(a) + 1) / 2) };
    }).sort((p, q) => p.y - q.y);
    for (const p of list) {
      const kick = Math.sin(t * 3 + p.c.ph);
      // reflection on the ice
      ctx.save(); ctx.globalAlpha = 0.18; ctx.translate(p.x, p.y + 4); ctx.scale(p.s * p.dir, -p.s * 0.6); drawSkater(ctx, p.c, kick); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#0e1a3e'; ctx.beginPath(); ctx.ellipse(p.x - 6 * p.dir, p.y + 3, 22 * p.s, 3, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s * p.dir, p.s); drawSkater(ctx, p.c, kick); ctx.restore();
    }
  }

  A.designs.pond = {
    id: 'pond',
    name: 'Frozen Pond',
    blurb: 'Skaters circling a pond ringed with lanterns.',
    width: W, height: H, build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#f6f9ff', stroke: '#0f1f45' },
    effects: [
      { type: 'glow', x: 1250, y: 150, r: 200, color: '255,245,215', a: 0.2, speed: 0.4 },
      { type: 'glow', x: 1385, y: 640, r: 160, color: '255,180,90', a: 0.3, speed: 2 },
      { type: 'twinkle' },
      { type: 'smoke', x: 1475, y: 466, rate: 2, rise: 18, size: 8, color: '220,226,240', a: 0.4 },
      { type: 'custom', draw: skaters },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 120 },
    ],
    layout: 'pond',
    keepOut: [[440, 18, 720, 172], [470, 660, 660, 160]],
    day24: { x: 1300, y: 560, w: 170, h: 140 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/pond.js', e); }
/* ---- src/layouts/pond.js ---- */
try {
/* Door layout for "Frozen Pond" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["pond"]=[{"day":1,"x":674,"y":396,"w":108,"h":82,"hinge":"left"},
{"day":2,"x":455,"y":838,"w":82,"h":108,"hinge":"right"},
{"day":3,"x":771,"y":494,"w":150,"h":138,"hinge":"left"},
{"day":4,"x":1059,"y":853,"w":138,"h":116,"hinge":"left"},
{"day":5,"x":423,"y":385,"w":118,"h":150,"hinge":"left"},
{"day":6,"x":165,"y":91,"w":126,"h":150,"hinge":"left"},
{"day":7,"x":795,"y":325,"w":150,"h":130,"hinge":"right"},
{"day":8,"x":1284,"y":27,"w":132,"h":100,"hinge":"right"},
{"day":9,"x":1054,"y":467,"w":116,"h":150,"hinge":"left"},
{"day":10,"x":59,"y":270,"w":120,"h":98,"hinge":"right"},
{"day":11,"x":1254,"y":713,"w":150,"h":118,"hinge":"right"},
{"day":12,"x":324,"y":215,"w":148,"h":150,"hinge":"right"},
{"day":13,"x":277,"y":815,"w":136,"h":150,"hinge":"left"},
{"day":14,"x":1303,"y":445,"w":108,"h":90,"hinge":"left"},
{"day":15,"x":53,"y":402,"w":116,"h":150,"hinge":"right"},
{"day":16,"x":790,"y":194,"w":150,"h":118,"hinge":"left"},
{"day":17,"x":1408,"y":309,"w":150,"h":124,"hinge":"left"},
{"day":18,"x":955,"y":201,"w":132,"h":112,"hinge":"right"},
{"day":19,"x":1223,"y":850,"w":150,"h":124,"hinge":"right"},
{"day":20,"x":1284,"y":141,"w":142,"h":150,"hinge":"right"},
{"day":21,"x":519,"y":548,"w":88,"h":102,"hinge":"left"},
{"day":22,"x":761,"y":824,"w":122,"h":150,"hinge":"left"},
{"day":23,"x":238,"y":619,"w":150,"h":118,"hinge":"left"},
{"day":24,"x":1300,"y":560,"w":170,"h":140,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/pond.js', e); }
/* ---- src/designs/reindeer.js ---- */
try {
/* Design — "Reindeer Games"
   Hand-built SVG scene + animated canvas effects. See src/designs/parlor.js for the design contract. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  /* ---------- shared drawing kit (inlined per design so each file stands alone) ---------- */
  const f = (n) => Math.round(n * 10) / 10;
  function makeKit(R) {
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [];
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40', '#14361f'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];
    function pine(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rr(-0.3, 0.3), l = r * rr(0.9, 1.5);
        s += `<path d="M${f(x)} ${f(y)}L${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return s;
    }
    function bulb(x, y, c, r = 4.2) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".22"/><rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".75"/>`;
    }
    function lamp(x, y, c, r) { lights.push({ x, y, c, r }); return ''; }
    function berries(x, y) {
      let s = '';
      for (let i = 0; i < 3; i++) { const bx = x + rr(-6, 6), by = y + rr(-5, 5); s += `<circle cx="${f(bx)}" cy="${f(by)}" r="4.2" fill="#b3122a"/><circle cx="${f(bx - 1.3)}" cy="${f(by - 1.4)}" r="1.3" fill="#ff8f9c"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><path d="M-4 -2 C-14 -10 -24 -10 -24 -3" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/><ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    function quad(x0, y0, cx, cy, x1, y1, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]); }
      return pts;
    }
    function swag(x0, y0, cx, cy, x1, y1, o = {}) {
      const pts = quad(x0, y0, cx, cy, x1, y1, o.n || 24), r = o.r || 12;
      let s = '';
      pts.forEach(([x, y]) => (s += pine(x + rr(-3, 3), y + rr(-3, 3), r * rr(0.8, 1.1))));
      pts.forEach(([x, y], i) => { if (i % 2 === 0) s += pine(x + rr(-6, 6), y + rr(-2, 8), r * 0.75); });
      if (o.berries) pts.forEach(([x, y], i) => { if (i % 5 === 2) s += berries(x, y + 4); });
      if (o.lights) pts.forEach(([x, y], i) => { if (i % (o.every || 3) === 1) s += bulb(x + rr(-4, 4), y + rr(0, 8), BULB[(i + (o.off || 0)) % BULB.length], o.bulb || 4); });
      return s;
    }
    function lightString(x0, y0, cx, cy, x1, y1, n, r = 5, colors = BULB, off = 0) {
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#1d2a1f" stroke-width="2.4" fill="none"/>`;
      quad(x0, y0, cx, cy, x1, y1, n).forEach(([x, y], i) => { if (i > 0 && i < n) s += bulb(x, y + r + 3, colors[(i + off) % colors.length], r); });
      return s;
    }
    function starPath(x, y, ro, ri, n = 5) {
      let d = '';
      for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); }
      return d + 'Z';
    }
    function gift(x, y, w, h, fill, rib, d = 14, bowColor) {
      return `<g filter="url(#shadow)"><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".18"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".28"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="${rib}"/><path d="M${x + w / 2 - 7} ${y} l${d} ${-d * 0.6} h14 l${-d} ${d * 0.6}Z" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${rib}" opacity=".95"/><path d="M${x + w} ${y + h / 2 - 6} l${d} ${-d * 0.6} v12 l${-d} ${d * 0.6}Z" fill="${rib}" opacity=".7"/></g>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.75, bowColor || rib, '#00000055')}`;
    }
    function candle(x, baseY, h, color, w = 22) {
      const top = baseY - h;
      candles.push({ x, y: top - 10, s: 1 });
      return `<rect x="${x - w / 2 - 4}" y="${baseY - 8}" width="${w + 8}" height="9" rx="2" fill="url(#gold)"/><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h - 8}" rx="3" fill="${color || 'url(#candle)'}"/><path d="M${x - w / 2} ${top + 4} q4 14 0 22 q5 -6 6 -18Z" fill="#fffaf0" opacity=".8"/><path d="M${x} ${top} v-8" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${top - 16}" r="34" fill="url(#candleGlow)"/>`;
    }
    function snowDots(x, y, w, h, n, rMax = 2.4, op = 0.85) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(0.6 + R() * rMax)}" fill="#fff" opacity="${f(rr(0.4, op))}"/>`;
      return s;
    }
    function stars(x, y, w, h, n) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(rr(0.5, 1.8))}" fill="#fff" opacity="${f(rr(0.35, 1))}"/>`;
      return s;
    }
    function pineTree(x, y, h, color, snow = '#f4f8ff') {
      let s = '';
      for (let i = 0; i < 4; i++) {
        const ty = y - h + (i * h) / 4.6, w = h * (0.17 + i * 0.09);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + h * 0.34)} Q${f(x)} ${f(ty + h * 0.3)} ${f(x + w)} ${f(ty + h * 0.34)}Z" fill="${color}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.55)} ${f(ty + h * 0.19)} Q${f(x - w * 0.1)} ${f(ty + h * 0.14)} ${f(x + w * 0.45)} ${f(ty + h * 0.17)}Z" fill="${snow}" opacity=".92"/>`;
      }
      return s + `<rect x="${f(x - h * 0.03)}" y="${f(y - h * 0.06)}" width="${f(h * 0.06)}" height="${f(h * 0.08)}" fill="#3a2414"/>`;
    }
    /** A decorated Christmas tree (tiers drawn bottom to top) */
    function tree(cx, top, base, hw, o = {}) {
      const span = base - top;
      const T = [[0.656, 1, 1], [0.479, 0.825, 0.88], [0.302, 0.645, 0.73], [0.139, 0.459, 0.56], [0, 0.275, 0.38]].map(([a, b, c]) => [top + a * span, top + b * span, hw * c]);
      let s = '';
      const tierPath = (y0, y1, w) => {
        let d = `M${cx} ${f(y0)} Q${f(cx - w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${f(cx - w)} ${f(y1)}`;
        const n = Math.max(3, Math.round(w / 26)), step = (2 * w) / n;
        for (let i = 0; i < n; i++) d += ` Q${f(cx - w + step * (i + 0.5))} ${f(y1 + 16)} ${f(cx - w + step * (i + 1))} ${f(i < n - 1 ? y1 - 3 : y1)}`;
        return d + ` Q${f(cx + w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${f(y0)}Z`;
      };
      const inTier = (x, y, t) => y > t[0] + (t[1] - t[0]) * 0.3 && y < t[1] - 8 && Math.abs(x - cx) < t[2] * ((y - t[0]) / (t[1] - t[0])) * 0.86;
      if (o.trunk !== false) s += `<rect x="${cx - hw * 0.08}" y="${f(base - 30)}" width="${f(hw * 0.16)}" height="${f(hw * 0.25)}" fill="#4a2614"/>`;
      T.forEach((t, i) => {
        const [y0, y1, w] = t;
        if (i > 0) s += `<path d="${tierPath(y0 + 12, y1 + 12, w)}" fill="#000" opacity=".3" filter="url(#soft)"/>`;
        s += `<path d="${tierPath(y0, y1, w)}" fill="${o.fill || 'url(#treeG)'}"/>`;
        let nd = '';
        for (let k = 0; k < w * 2.1; k++) {
          const y = rr(y0 + (y1 - y0) * 0.15, y1 + 6), sp = w * ((y - y0) / (y1 - y0)), x = cx + rr(-sp, sp) * 0.98, dir = x < cx ? -1 : 1, len = rr(10, 22);
          nd += `<path d="M${f(x)} ${f(y)} l${f(dir * len * 0.7)} ${f(len * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="${f(rr(1.6, 2.8))}" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
        }
        s += nd;
        if (o.snow) s += `<path d="${tierPath(y1 - 10, y1, w * 0.95)}" fill="#f4f8ff" opacity=".85"/>`;
        if (i < 4 && o.beads !== false) s += `<path d="M${f(cx - w * 0.5)} ${f(y0 + (y1 - y0) * 0.55)} Q${cx} ${f(y0 + (y1 - y0) * 0.85 + 30)} ${f(cx + w * 0.8)} ${f(y0 + (y1 - y0) * 0.85 - 10)}" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`;
      });
      const placed = [];
      const at = (minD) => {
        for (let k = 0; k < 400; k++) {
          const t = T[Math.floor(R() * T.length)], x = rr(cx - t[2], cx + t[2]), y = rr(t[0], t[1]);
          if (!inTier(x, y, t)) continue;
          if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue;
          return [x, y];
        }
        return null;
      };
      const ok = ['red', 'gold', 'blue', 'silver', 'green', 'plum'];
      const scale = hw / 236;
      for (let i = 0; i < (o.ornaments == null ? 40 : o.ornaments); i++) {
        const p = at(22 * scale); if (!p) continue;
        const r = rr(9, 15) * Math.max(0.6, scale); placed.push([p[0], p[1], r]);
        s += `<path d="M${f(p[0])} ${f(p[1] - r - 4)} v-8" stroke="#c9a24a" stroke-width="1"/><rect x="${f(p[0] - 3.5)}" y="${f(p[1] - r - 5)}" width="7" height="6" rx="1" fill="url(#gold)"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#orn-${(o.palette || ok)[i % (o.palette || ok).length]})"/>`;
      }
      for (let i = 0; i < (o.canes == null ? 5 : o.canes); i++) {
        const p = at(20 * scale); if (!p) continue; placed.push([p[0], p[1], 12]);
        const cane = `M${f(p[0])} ${f(p[1] + 18)} V${f(p[1] - 6)} q0 -10 9 -10 q9 0 9 10`;
        s += `<path d="${cane}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${cane}" stroke="#c4222f" stroke-width="5" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < (o.lights == null ? 80 : o.lights); i++) {
        const p = at(8 * scale); if (!p) continue; placed.push([p[0], p[1], 5]);
        s += bulb(p[0], p[1], (o.bulbs || BULB)[i % (o.bulbs || BULB).length], 4 * Math.max(0.7, scale));
      }
      if (o.star !== false) {
        const sr = 38 * Math.max(0.6, scale);
        s += `<circle cx="${cx}" cy="${f(top - 6)}" r="${f(sr * 1.6)}" fill="url(#candleGlow)"/><path d="${starPath(cx, top - 4, sr, sr * 0.42)}" fill="url(#gold)" stroke="#8a5a14" stroke-width="2"/><path d="${starPath(cx, top - 4, sr * 0.47, sr * 0.2)}" fill="#fff6c8" opacity=".7"/>`;
      }
      return s;
    }
    const ornColors = { red: ['#ff5a63', '#b0101f', '#5e0710'], gold: ['#ffe39a', '#cf9a2e', '#6a4410'], blue: ['#8fb8ff', '#2a56b0', '#0f2353'], silver: ['#ffffff', '#b9c3cc', '#5b6670'], green: ['#8fe0a0', '#1f7d45', '#0b3a1d'], plum: ['#e3a0f0', '#7a2f95', '#33103f'] };
    let defs = '';
    Object.entries(ornColors).forEach(([k, [a, b, c]]) => (defs += `<radialGradient id="orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`));
    defs += `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <radialGradient id="candleGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="warmGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
      <linearGradient id="treeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>`;
    /** Classic arched ribbon banner centred at cx; the title path runs along its middle. */
    function ribbonBanner(cx, y, halfW, o = {}) {
      const a = halfW, top = y, bot = y + 74, arch = o.arch == null ? 50 : o.arch;
      const fill = o.fill || 'url(#ribbon)', dark = o.dark || 'url(#ribbonDark)', deep = o.deep || '#4a0711';
      return `<g filter="url(#shadow)">
        <path d="M${cx - a + 28} ${top + 22} L${cx - a - 68} ${top + 16} L${cx - a - 40} ${top + 60} L${cx - a - 68} ${top + 106} L${cx - a + 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx + a - 28} ${top + 22} L${cx + a + 68} ${top + 16} L${cx + a + 40} ${top + 60} L${cx + a + 68} ${top + 106} L${cx + a - 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx - a} ${top} L${cx - a + 40} ${top + 28} L${cx - a + 40} ${top + 84} L${cx - a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx + a} ${top} L${cx + a - 40} ${top + 28} L${cx + a - 40} ${top + 84} L${cx + a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx - a} ${top} Q${cx} ${top - arch - 8} ${cx + a} ${top} L${cx + a} ${bot} Q${cx} ${bot - arch - 8} ${cx - a} ${bot}Z" fill="${fill}"/>
        <path d="M${cx - a + 8} ${top + 10} Q${cx} ${top - arch + 2} ${cx + a - 8} ${top + 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
        <path d="M${cx - a + 8} ${bot - 10} Q${cx} ${bot - arch - 18} ${cx + a - 8} ${bot - 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
      </g>`;
    }
    const ribbonPath = (cx, y, halfW, arch = 50) => `M${cx - halfW + 40} ${y + 44} Q${cx} ${y + 44 - arch - 8} ${cx + halfW - 40} ${y + 44}`;
    return { rr, pick, lights, candles, BULB, GREENS, NEEDLE, pine, bulb, lamp, berries, bow, quad, swag, lightString, starPath, gift, candle, snowDots, stars, pineTree, tree, defs, ribbonBanner, ribbonPath };
  }

  /* ---------- reindeer ---------- */
  function deer(x, y, sc, o = {}) {
    const body = o.body || '#8a5a34', dark = o.dark || '#5e3a1e', belly = '#e8d6b8', ant = '#e6d3ac';
    const pose = o.pose || 'leap';
    const lift = pose === 'leap' ? -40 : 0;
    const legs = {
      leap: [`M48 -82 Q74 -70 78 -52 L66 -36`, `M36 -80 Q60 -62 60 -46 L48 -32`, `M-42 -88 Q-86 -70 -116 -62`, `M-50 -84 Q-90 -56 -122 -46`],
      run: [`M46 -80 Q70 -50 82 -14`, `M34 -78 L30 -40 L40 -6`, `M-40 -84 Q-70 -50 -96 -20`, `M-52 -82 L-46 -40 L-60 -4`],
      stand: [`M44 -80 L46 -40 L44 0`, `M32 -80 L30 -40 L34 0`, `M-40 -84 L-46 -44 L-40 0`, `M-52 -82 L-56 -42 L-52 0`],
    }[pose];
    let s = `<g transform="translate(${x} ${y}) scale(${o.flip ? -sc : sc} ${sc})">`;
    s += `<ellipse cx="${pose === 'leap' ? -10 : 0}" cy="4" rx="70" ry="9" fill="#0a1a33" opacity="${pose === 'leap' ? 0.16 : 0.3}"/>`;
    s += `<g transform="translate(0 ${lift})">`;
    s += `<path d="${legs[1]}" stroke="${dark}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${legs[3]}" stroke="${dark}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M-66 -104 Q-74 -118 -60 -122 Q-52 -112 -58 -100Z" fill="#fbf7f0"/>`;
    s += `<ellipse cx="0" cy="-100" rx="64" ry="30" fill="${body}"/>`;
    s += `<path d="M-50 -84 Q0 -66 50 -84 Q30 -74 0 -72 Q-30 -74 -50 -84Z" fill="${belly}" opacity=".8"/>`;
    s += `<path d="${legs[0]}" stroke="${body}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${legs[2]}" stroke="${body}" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    // hooves
    legs.forEach((l) => { const m = l.match(/(-?\d+) (-?\d+)$/); s += `<circle cx="${m[1]}" cy="${m[2]}" r="5.5" fill="#2a1a10"/>`; });
    s += `<path d="M38 -116 Q58 -150 72 -172 L96 -162 Q82 -130 60 -92Z" fill="${body}"/><path d="M58 -128 Q70 -144 80 -160" stroke="#fbf7f0" stroke-width="10" stroke-linecap="round" opacity=".85"/>`;
    s += `<path d="M68 -176 Q84 -192 104 -186 L134 -172 Q144 -166 134 -158 L104 -152 Q84 -150 72 -160Z" fill="${body}"/>`;
    s += `<ellipse cx="136" cy="-165" rx="7" ry="5.5" fill="#2a1a10"/><circle cx="99" cy="-175" r="4" fill="#1a0f08"/><circle cx="98" cy="-176.5" r="1.4" fill="#fff"/>`;
    s += `<path d="M84 -184 L70 -200 L92 -188Z" fill="${dark}"/>`;
    const antler = (dx, col) => `<path d="M${88 + dx} -188 Q${80 + dx} -228 ${60 + dx} -252 M${76 + dx} -222 l-20 -10 M${70 + dx} -238 l-8 -20 M${82 + dx} -208 l-22 4 M${86 + dx} -200 Q${104 + dx} -222 ${100 + dx} -246 M${98 + dx} -230 l14 -8" stroke="${col}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
    s += antler(12, '#c9b48a') + antler(0, ant);
    // harness with bells
    s += `<path d="M44 -118 Q58 -94 66 -96" stroke="#c4222f" stroke-width="8" fill="none"/><path d="M-6 -128 Q4 -100 -4 -72" stroke="#c4222f" stroke-width="7" fill="none"/>`;
    [[50, -106], [58, -98], [0, -110], [-2, -92]].forEach(([bx, by]) => (s += `<circle cx="${bx}" cy="${by}" r="5" fill="url(#gold)"/>`));
    if (o.bow) s += `<g transform="translate(76 -230) scale(.42)"><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${o.bow}"/><path d="M-4 4 L-14 34 M4 4 L14 34" stroke="${o.bow}" stroke-width="7"/><circle r="6" fill="${o.bow}"/></g>`;
    if (o.blanket) s += `<path d="M-30 -126 Q0 -134 30 -126 L34 -88 Q0 -80 -34 -88Z" fill="${o.blanket}"/><path d="M-34 -88 Q0 -80 34 -88" stroke="url(#gold)" stroke-width="4" fill="none"/>`;
    return s + '</g></g>';
  }

  function build() {
    const R = A.util.rng(1712);
    const K = makeKit(R);
    const { rr } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050d24"/><stop offset=".5" stop-color="#14306a"/><stop offset=".8" stop-color="#3a5c9a"/><stop offset="1" stop-color="#7e9cc8"/></linearGradient>
      <radialGradient id="moonGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8dc" stop-opacity=".85"/><stop offset=".25" stop-color="#e6edff" stop-opacity=".3"/><stop offset="1" stop-color="#e6edff" stop-opacity="0"/></radialGradient>
      <linearGradient id="snowA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f1fd"/><stop offset="1" stop-color="#b7c9e6"/></linearGradient>
      <linearGradient id="snowB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7fbff"/><stop offset="1" stop-color="#cfdcf0"/></linearGradient>
      <linearGradient id="barn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a1a22"/><stop offset=".6" stop-color="#a8222c"/><stop offset="1" stop-color="#701219"/></linearGradient>
      <radialGradient id="doorLight" cx=".5" cy=".8" r=".8"><stop offset="0" stop-color="#ffe7a8"/><stop offset=".6" stop-color="#f2a24e"/><stop offset="1" stop-color="#8a4a1e"/></radialGradient>
      <radialGradient id="spill" cx="1230" cy="640" r="320" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc870" stop-opacity=".45"/><stop offset="1" stop-color="#ffc870" stop-opacity="0"/></radialGradient>
      <pattern id="candyStripe" width="12" height="16" patternUnits="userSpaceOnUse" patternTransform="skewY(30)"><rect width="12" height="8" fill="#c4222f"/></pattern>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#020617" stop-opacity=".6"/></radialGradient>
    </defs>`);

    /* night sky */
    add(`<rect width="1600" height="1000" fill="url(#sky)"/>`);
    add(K.stars(0, 0, 1600, 460, 260));
    add(`<circle cx="1320" cy="170" r="200" fill="url(#moonGlow)"/><circle cx="1320" cy="170" r="62" fill="#fff8e2"/><circle cx="1300" cy="156" r="10" fill="#ebe0c0" opacity=".6"/><circle cx="1342" cy="186" r="14" fill="#ebe0c0" opacity=".5"/><circle cx="1330" cy="140" r="6" fill="#ebe0c0" opacity=".6"/>`);
    // a few brighter stars with spikes
    [[180, 120], [460, 220], [980, 90], [620, 300], [80, 330], [1540, 330]].forEach(([x, y]) => add(`<path d="${K.starPath(x, y, 7, 1.6, 4)}" fill="#fff"/><circle cx="${x}" cy="${y}" r="9" fill="#cfe0ff" opacity=".25"/>`));

    /* far mountains */
    add(`<path d="M0 470 L120 400 L210 440 L340 340 L470 430 L560 390 L700 470 L820 380 L940 450 L1060 360 L1190 440 L1330 370 L1460 450 L1600 400 V560 H0Z" fill="#4a6496"/>`);
    add(`<path d="M340 340 L300 372 L330 366 L350 382 L380 364 L405 380Z M820 380 L790 402 L815 400 L832 412 L850 398 L866 410Z M1060 360 L1022 390 L1050 386 L1070 400 L1090 384 L1112 396Z M1330 370 L1296 396 L1322 392 L1340 404 L1360 390 L1378 400Z M120 400 L96 416 L120 414 L140 424 L152 414Z" fill="#e8f0ff"/>`);
    add(`<path d="M0 520 Q200 470 420 500 Q640 530 860 486 Q1100 450 1320 500 Q1460 528 1600 492 V620 H0Z" fill="#7a94c0"/>`);
    // distant pine line
    for (let x = -10; x < 1620; x += rr(14, 26)) add(K.pineTree(x, 540 + Math.sin(x / 140) * 18 + rr(-6, 6), rr(40, 70), '#23385e', '#c9d8f0'));

    /* rolling snowy meadow */
    add(`<path d="M0 600 Q300 560 620 600 Q900 640 1200 590 Q1420 556 1600 590 V1000 H0Z" fill="url(#snowA)"/>`);
    add(`<path d="M0 760 Q260 700 560 740 Q860 784 1160 730 Q1400 690 1600 724 V1000 H0Z" fill="url(#snowB)"/>`);
    add(`<path d="M0 880 Q400 840 800 876 Q1200 910 1600 860 V1000 H0Z" fill="#ffffff"/>`);
    // sparkle on the snow
    for (let i = 0; i < 90; i++) add(`<circle cx="${f(rr(0, 1600))}" cy="${f(rr(620, 1000))}" r="${f(rr(0.8, 2))}" fill="#fff" opacity="${f(rr(0.5, 1))}"/>`);
    // hoofprint trails
    for (let i = 0; i < 26; i++) { const x = 140 + i * 38, y = 860 - i * 6 + Math.sin(i) * 6; add(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="5" ry="3" fill="#a9bddc"/><ellipse cx="${f(x + 10)}" cy="${f(y + 8)}" rx="5" ry="3" fill="#a9bddc"/>`); }

    /* forests framing the left and right */
    for (let i = 0; i < 9; i++) add(K.pineTree(rr(-30, 170), 640 + i * 30 + rr(-10, 10), rr(150, 230), i % 2 ? '#14304a' : '#1a3b58'));
    for (let i = 0; i < 6; i++) add(K.pineTree(rr(1460, 1640), 660 + i * 36, rr(150, 230), i % 2 ? '#14304a' : '#1a3b58'));

    /* the barn */
    add(`<rect x="1230" y="620" width="1" height="1" fill="none"/>`);
    add(`<g filter="url(#shadow)">
      <path d="M1060 640 V430 L1120 340 L1230 300 L1340 340 L1400 430 V640Z" fill="url(#barn)"/>
      <path d="M1046 438 L1120 334 L1230 290 L1340 334 L1414 438" stroke="#3a2a22" stroke-width="16" fill="none" stroke-linejoin="round"/>
      <path d="M1040 438 L1116 330 L1230 284 L1344 330 L1420 438 L1404 444 L1336 344 L1230 302 L1124 344 L1056 444Z" fill="#f7fbff"/>
    </g>`);
    for (let x = 1070; x < 1400; x += 22) add(`<rect x="${x}" y="430" width="2" height="210" fill="#5a0e14" opacity=".55"/>`);
    // hayloft door with wreath
    add(`<rect x="1186" y="356" width="88" height="80" fill="#f3ead6"/><rect x="1194" y="364" width="72" height="64" fill="#7a1219"/><path d="M1194 364 L1266 428 M1266 364 L1194 428" stroke="#f3ead6" stroke-width="6"/>`);
    let wr = '';
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; wr += K.pine(1230 + Math.cos(a) * 30, 396 + Math.sin(a) * 30, 9); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; wr += K.berries(1230 + Math.cos(a) * 32, 396 + Math.sin(a) * 32); }
    add(wr + K.bow(1230, 424, 0.6));
    // big open doors, warm light inside
    add(`<rect x="1160" y="490" width="140" height="150" fill="url(#doorLight)"/>`);
    add(`<path d="M1200 640 V560 Q1230 540 1260 560 V640Z" fill="#c9963a" opacity=".6"/><path d="M1176 640 l20 -40 l14 40Z M1250 640 l16 -30 l14 30Z" fill="#d9a83a" opacity=".85"/>`);
    add(`<path d="M1160 490 L1100 500 V650 L1160 640Z M1300 490 L1360 500 V650 L1300 640Z" fill="#8a1a22"/><path d="M1100 500 L1160 640 M1100 650 L1160 490 M1360 500 L1300 640 M1360 650 L1300 490" stroke="#f3ead6" stroke-width="5"/><path d="M1100 500 L1160 490 V640 L1100 650Z M1300 490 L1360 500 V650 L1300 640Z" fill="none" stroke="#f3ead6" stroke-width="5"/>`);
    add(`<rect x="1076" y="452" width="40" height="34" fill="#ffd27a"/><rect x="1344" y="452" width="40" height="34" fill="#ffd27a"/><path d="M1096 452 v34 M1076 469 h40 M1364 452 v34 M1344 469 h40" stroke="#f3ead6" stroke-width="3"/>`);
    K.lamp(1096, 469, '#ffd27a', 7); K.lamp(1364, 469, '#ffd27a', 7);
    add(`<rect width="1600" height="1000" fill="url(#spill)"/>`);
    add(`<path d="M1160 640 L1300 640 L1360 760 L1100 760Z" fill="#ffd890" opacity=".35"/>`);
    // lights along the roofline
    add(K.lightString(1050, 436, 1085, 380, 1120, 336, 6, 4.4) + K.lightString(1120, 336, 1175, 300, 1230, 296, 6, 4.4, K.BULB, 2) + K.lightString(1230, 296, 1285, 300, 1340, 336, 6, 4.4, K.BULB, 4) + K.lightString(1340, 336, 1375, 380, 1410, 436, 6, 4.4, K.BULB, 1));
    // lanterns on posts by the barn
    [1036, 1424].forEach((x) => add(`<rect x="${x - 4}" y="560" width="8" height="110" fill="#3a2a22"/><path d="M${x - 14} 548 h28 l-4 -10 h-20Z" fill="#1d1d1d"/><rect x="${x - 12}" y="548" width="24" height="30" fill="#ffe2a0"/><path d="M${x - 12} 548 v30 M${x + 12} 548 v30" stroke="#1d1d1d" stroke-width="2.4"/>` + K.candle(x, 576, 18, '#f6efe2', 8)));
    // a little sleigh with gifts by the barn
    add(`<g transform="translate(940 690)" filter="url(#shadow)">
      <path d="M-70 40 Q-90 40 -88 22 M-88 22 Q-80 46 -40 46 H70 Q100 46 96 20" stroke="url(#gold)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M-74 0 Q-76 -36 -50 -40 L-30 -40 Q-36 -10 -20 0 H60 Q80 -2 84 -30 L96 -26 Q96 20 60 30 H-60 Q-74 28 -74 0Z" fill="#b3172b"/>
      <path d="M-66 10 Q0 22 70 10" stroke="url(#gold)" stroke-width="4" fill="none"/>
      <rect x="-34" y="-34" width="34" height="34" fill="#1d6b43"/><rect x="-20" y="-34" width="6" height="34" fill="#f0d07a"/>
      <rect x="4" y="-48" width="40" height="48" fill="#2a5aa8"/><rect x="20" y="-48" width="8" height="48" fill="#f6efe2"/>
      <rect x="46" y="-26" width="28" height="26" fill="#d9a83a"/><rect x="56" y="-26" width="6" height="26" fill="#b3172b"/>
    </g>`);
    add(K.bow(964, 640, 0.5, '#f6efe2', '#c9c2b6'));
    // split rail fence along the hill
    for (let i = 0; i < 9; i++) { const x = 560 + i * 54, y = 612 + Math.sin(i * 0.7) * 6; add(`<rect x="${x}" y="${y - 40}" width="7" height="46" fill="#5a3a24"/><path d="M${x} ${y - 30} l54 4 M${x} ${y - 14} l54 4" stroke="#6b4a30" stroke-width="5"/><rect x="${x - 2}" y="${y - 44}" width="11" height="6" rx="3" fill="#fff"/>`); }

    /* the reindeer games */
    add(deer(380, 830, 1.15, { pose: 'leap', bow: '#c4222f', blanket: '#1d6b43' }));
    add(deer(690, 770, 0.95, { pose: 'run', bow: '#1d6b43', body: '#9a6a40' }));
    add(deer(180, 700, 0.8, { pose: 'leap', bow: '#d9a83a', body: '#7a4c2a' }));
    add(deer(870, 920, 0.95, { pose: 'leap', bow: '#c4222f', body: '#a07048', blanket: '#b3172b' }));
    add(deer(1150, 760, 0.7, { pose: 'stand', bow: '#c4222f', body: '#b07a4a', flip: true }));

    /* lights in the left pines */
    for (let i = 0; i < 40; i++) { const y = rr(560, 900), x = rr(10, 150 - (900 - y) * 0.08); add(K.bulb(x, y, K.BULB[i % 7], 3.6)); }
    for (let i = 0; i < 24; i++) { const y = rr(600, 920), x = rr(1480, 1590); add(K.bulb(x, y, K.BULB[(i + 3) % 7], 3.6)); }

    /* the race course: candy-striped poles with pennant bunting */
    const poles = [[90, 990, 150], [560, 1000, 130], [1060, 990, 140], [1530, 985, 150]];
    for (let i = 0; i < poles.length - 1; i++) {
      const [x0, y0, h0] = poles[i], [x1, y1, h1] = poles[i + 1];
      const a = [x0, y0 - h0 + 10], b = [x1, y1 - h1 + 10], c = [(x0 + x1) / 2, Math.max(a[1], b[1]) + 50];
      add(`<path d="M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}" stroke="#3a2a22" stroke-width="2" fill="none"/>`);
      const pts = K.quad(a[0], a[1], c[0], c[1], b[0], b[1], 14);
      for (let k = 0; k < pts.length - 1; k++) {
        const [px0, py0] = pts[k], [px1, py1] = pts[k + 1];
        if (k % 2 === 0) add(`<path d="M${f(px0)} ${f(py0)} L${f(px1)} ${f(py1)} L${f((px0 + px1) / 2)} ${f((py0 + py1) / 2 + 24)}Z" fill="${['#c4222f', '#1d6b43', '#d9a83a'][(k / 2 + i) % 3]}"/>`);
        else add(K.bulb((px0 + px1) / 2, (py0 + py1) / 2 + 6, K.BULB[(k + i) % 7], 3.4));
      }
    }
    poles.forEach(([x, y, h]) => add(`<rect x="${x - 6}" y="${y - h}" width="12" height="${h}" fill="#fff"/><rect x="${x - 6}" y="${y - h}" width="12" height="${h}" fill="url(#candyStripe)"/><circle cx="${x}" cy="${y - h - 6}" r="9" fill="url(#gold)"/><ellipse cx="${x}" cy="${y}" rx="22" ry="6" fill="#a9bddc"/>`));
    // holly bushes in the corners
    [[60, 980, 1], [1560, 990, -1], [330, 1000, 1]].forEach(([x, y, d]) => {
      let s = `<ellipse cx="${x}" cy="${y}" rx="90" ry="46" fill="#14361f"/>`;
      for (let i = 0; i < 26; i++) { const lx = x + rr(-80, 80), ly = y + rr(-40, 10), a = rr(-40, 40); s += `<path d="M0 0 q8 -6 16 0 q4 -6 10 -2 q-2 8 -10 10 q-8 2 -16 -8Z" transform="translate(${f(lx)} ${f(ly)}) rotate(${f(a)})" fill="${i % 2 ? '#2c6b40' : '#1f5a33'}"/>`; }
      for (let i = 0; i < 6; i++) s += K.berries(x + rr(-60, 60), y + rr(-34, 0));
      s += `<path d="M${x - 70} ${y - 30} Q${x} ${y - 60} ${x + 70} ${y - 30} Q${x} ${y - 44} ${x - 70} ${y - 30}Z" fill="#f7fbff" opacity=".9"/>`;
      add(s);
    });

    /* banner across the sky */
    add(K.ribbonBanner(700, 66, 330, { arch: 40 }));
    add(`<rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  // a sleigh and team silhouette drifting across the moon every so often
  function flyby(ctx, t) {
    const period = 22, k = (t % period) / period;
    if (k > 0.35) return;
    const p = k / 0.35;
    const x = 1060 + p * 560, y = 210 - Math.sin(p * Math.PI) * 70;
    ctx.globalAlpha = Math.sin(p * Math.PI);
    ctx.fillStyle = '#0b1530';
    ctx.translate(x, y); ctx.scale(0.5, 0.5);
    for (let i = 0; i < 4; i++) {
      const dx = 60 + i * 46, b = Math.sin(t * 8 + i) * 3;
      ctx.beginPath(); ctx.ellipse(dx, b, 16, 7, 0, 0, 7); ctx.fill();
      ctx.fillRect(dx + 10, b - 18, 5, 14); ctx.fillRect(dx + 12, b - 22, 12, 6);
      ctx.fillRect(dx - 12, b + 4, 3, 12); ctx.fillRect(dx + 10, b + 4, 3, 12);
      ctx.strokeStyle = '#0b1530'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx + 18, b - 22); ctx.lineTo(dx + 14, b - 32); ctx.lineTo(dx + 22, b - 36); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-30, -10); ctx.lineTo(30, -10); ctx.lineTo(40, -26); ctx.lineTo(44, 4); ctx.lineTo(-24, 4); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, -8); ctx.lineTo(200, -4); ctx.stroke();
  }

  A.designs.reindeer = {
    id: 'reindeer',
    name: 'Reindeer Games',
    blurb: 'Reindeer in ribbons leaping across a moonlit meadow toward a glowing red barn.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M410 110 Q700 62 990 110', size: 42, maxWidth: 520 },
    effects: [
      { type: 'glow', x: 1320, y: 170, r: 260, color: '220,230,255', a: 0.18, speed: 0.6 },
      { type: 'custom', draw: flyby },
      { type: 'glow', x: 1230, y: 570, r: 200, color: '255,200,110', a: 0.25, speed: 1.4 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 90, a: 0.75 },
    ],
    layout: 'reindeer',
    keepOut: [[300, 10, 800, 160], [1200, 70, 240, 200], [1150, 480, 160, 170]],
    day24: { x: 1145, y: 298, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/reindeer.js', e); }
/* ---- src/layouts/reindeer.js ---- */
try {
/* Door layout for "Reindeer Games" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["reindeer"]=[{"day":1,"x":160,"y":400,"w":114,"h":90,"hinge":"left"},
{"day":2,"x":971,"y":501,"w":150,"h":140,"hinge":"left"},
{"day":3,"x":1419,"y":518,"w":150,"h":142,"hinge":"top"},
{"day":4,"x":802,"y":673,"w":150,"h":122,"hinge":"right"},
{"day":5,"x":537,"y":186,"w":150,"h":120,"hinge":"right"},
{"day":6,"x":1138,"y":667,"w":126,"h":98,"hinge":"right"},
{"day":7,"x":926,"y":322,"w":110,"h":144,"hinge":"left"},
{"day":8,"x":208,"y":508,"w":146,"h":150,"hinge":"left"},
{"day":9,"x":364,"y":824,"w":134,"h":150,"hinge":"right"},
{"day":10,"x":1393,"y":778,"w":150,"h":128,"hinge":"left"},
{"day":11,"x":336,"y":174,"w":114,"h":90,"hinge":"left"},
{"day":12,"x":1450,"y":181,"w":116,"h":138,"hinge":"top"},
{"day":13,"x":48,"y":843,"w":150,"h":114,"hinge":"right"},
{"day":14,"x":149,"y":672,"w":118,"h":150,"hinge":"left"},
{"day":15,"x":160,"y":32,"w":102,"h":96,"hinge":"left"},
{"day":16,"x":289,"y":278,"w":114,"h":150,"hinge":"right"},
{"day":17,"x":1031,"y":837,"w":150,"h":116,"hinge":"left"},
{"day":18,"x":32,"y":263,"w":150,"h":118,"hinge":"top"},
{"day":19,"x":645,"y":845,"w":98,"h":126,"hinge":"right"},
{"day":20,"x":1043,"y":174,"w":138,"h":110,"hinge":"left"},
{"day":21,"x":532,"y":695,"w":132,"h":112,"hinge":"left"},
{"day":22,"x":595,"y":530,"w":148,"h":150,"hinge":"left"},
{"day":23,"x":665,"y":324,"w":122,"h":150,"hinge":"left"},
{"day":24,"x":1145,"y":298,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/reindeer.js', e); }
/* ---- src/designs/silentnight.js ---- */
try {
/* Design — "Silent Night"
   A quiet stable on a hillside beneath one bright star. Shepherds keep watch by a small
   fire with their sheep, olive trees on the slopes, and the little town on the far hill.
   Deep indigo night, warm lantern light, a parchment scroll for the title. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1225);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);

    const sheep = (x, y, s = 1, flip = false) => {
      let g = `<g transform="translate(${f(x)} ${f(y)}) scale(${flip ? -s : s} ${s})"><ellipse cx="0" cy="18" rx="30" ry="5" fill="#000" opacity=".25"/>`;
      g += `<path d="M-16 8 v12 M-6 10 v12 M8 10 v12 M18 8 v12" stroke="#2a2430" stroke-width="4" stroke-linecap="round"/>`;
      for (let i = 0; i < 9; i++) g += `<circle cx="${f(-20 + (i % 5) * 10 + (i > 4 ? 5 : 0))}" cy="${f(i > 4 ? -6 : 4)}" r="${f(10 + (i % 3))}" fill="${i % 2 ? '#e9e2d4' : '#f4eee2'}"/>`;
      g += `<ellipse cx="28" cy="-4" rx="9" ry="11" fill="#2a2430"/><ellipse cx="22" cy="-12" rx="6" ry="3" fill="#2a2430" transform="rotate(-25 22 -12)"/><circle cx="31" cy="-6" r="1.4" fill="#e8e0d0"/>`;
      return g + '</g>';
    };
    const olive = (x, base, s = 1) => {
      let g = `<g transform="translate(${x} ${base}) scale(${s})">`;
      g += `<path d="M-8 0 C-14 -40 6 -60 -6 -100 C-2 -104 4 -104 6 -98 C2 -70 22 -50 10 0Z" fill="#3a2c2a"/><path d="M-4 -90 C-30 -110 -50 -100 -60 -110 M2 -96 C20 -120 40 -118 54 -128" stroke="#3a2c2a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 26; i++) g += `<ellipse cx="${f(rr(-80, 80))}" cy="${f(rr(-170, -95))}" rx="${f(rr(16, 30))}" ry="${f(rr(10, 18))}" fill="${pick(['#3e5a52', '#4a665c', '#566f66', '#344c46'])}" opacity=".95"/>`;
      for (let i = 0; i < 18; i++) g += `<ellipse cx="${f(rr(-70, 70))}" cy="${f(rr(-165, -100))}" rx="${f(rr(4, 9))}" ry="2" fill="#9ab8b0" opacity=".5" transform="rotate(${f(rr(-30, 30))})"/>`;
      return g + '</g>';
    };

    add(`<defs>
      <linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03061c"/><stop offset=".45" stop-color="#0d1442"/><stop offset=".75" stop-color="#232a66"/><stop offset="1" stop-color="#3e3a78"/></linearGradient>
      <radialGradient id="sn-starglow" cx="800" cy="120" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset=".25" stop-color="#ffe8b0" stop-opacity=".18"/><stop offset="1" stop-color="#ffe8b0" stop-opacity="0"/></radialGradient>
      <linearGradient id="sn-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c8" stop-opacity=".35"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></linearGradient>
      <radialGradient id="sn-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".85"/><stop offset=".5" stop-color="#ff9a40" stop-opacity=".25"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>
      <linearGradient id="sn-hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2c5c"/><stop offset="1" stop-color="#1a1c40"/></linearGradient>
      <linearGradient id="sn-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3150"/><stop offset="1" stop-color="#151830"/></linearGradient>
      <linearGradient id="sn-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3348"/><stop offset="1" stop-color="#1c1826"/></linearGradient>
      <linearGradient id="sn-stable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd68a"/><stop offset=".6" stop-color="#e8903a"/><stop offset="1" stop-color="#8a4a1a"/></linearGradient>
      <linearGradient id="sn-scroll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ead0"/><stop offset=".5" stop-color="#ead8b0"/><stop offset="1" stop-color="#d4bb8a"/></linearGradient>
      <linearGradient id="sn-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <filter id="sn-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
      <filter id="sn-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="sn-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
    </defs>`);

    /* night sky, milky way, stars */
    add(`<rect width="${W}" height="${H}" fill="url(#sn-sky)"/>`);
    add(`<ellipse cx="420" cy="200" rx="620" ry="70" fill="#8aa0d8" opacity=".14" transform="rotate(-18 420 200)" filter="url(#sn-blur)"/><ellipse cx="1240" cy="330" rx="420" ry="50" fill="#a08ad8" opacity=".1" transform="rotate(-18 1240 330)" filter="url(#sn-blur)"/>`);
    for (let i = 0; i < 260; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 560))}" r="${f(rr(0.4, 1.5))}" fill="${pick(['#ffffff', '#dfe8ff', '#fff2d8'])}" opacity="${f(rr(0.3, 0.95))}"/>`);
    for (let i = 0; i < 34; i++) {
      const x = rr(20, W - 20), y = rr(20, 520);
      if (Math.abs(x - 800) < 160 && y < 260) continue;
      lights.push({ x, y, c: pick(['#dfe8ff', '#fff2d8', '#ffffff']), r: rr(1.2, 2) });
      add(`<circle cx="${f(x)}" cy="${f(y)}" r="1.8" fill="#fff"/>`);
    }
    /* the star and its beam */
    add(`<rect width="${W}" height="${H}" fill="url(#sn-starglow)"/>`);
    add(`<path d="M790 140 L640 600 L960 600 L810 140Z" fill="url(#sn-beam)"/>`);
    const sp = (ro, ri, n) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(800 + Math.cos(a) * r) + ' ' + f(120 + Math.sin(a) * r); } return d + 'Z'; };
    add(`<path d="M800 20 L806 114 L900 120 L806 126 L800 300 L794 126 L700 120 L794 114Z" fill="#fff8e0"/><path d="${sp(34, 8, 4)}" fill="#fffbe8" transform="rotate(45 800 120)"/><circle cx="800" cy="120" r="12" fill="#fff"/>`);

    /* far hills and the little town */
    add(`<path d="M0 520 Q200 470 420 500 Q600 520 720 510 L760 560 H0Z" fill="url(#sn-hill1)"/>`);
    add(`<path d="M980 560 Q1080 440 1260 430 Q1440 420 1600 470 V620 H980Z" fill="url(#sn-hill1)"/>`);
    const town = [];
    for (let i = 0; i < 26; i++) { const x = rr(1060, 1580), top = 520 - Math.sin(((x - 980) / 620) * Math.PI) * 80 + rr(-10, 26); town.push([x, top, rr(34, 70), rr(24, 46)]); }
    town.sort((a, b) => a[1] - b[1]).forEach(([x, top, w, h]) => {
      add(`<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h + 60)}" fill="${pick(['#3a3a6a', '#34345e', '#40406e'])}"/><rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="4" fill="#5a5a8a"/>`);
      if (R() < 0.7) { const wx = x + rr(6, w - 16), wy = top + rr(8, h - 6); add(`<rect x="${f(wx)}" y="${f(wy)}" width="8" height="10" fill="#ffcf70"/><circle cx="${f(wx + 4)}" cy="${f(wy + 5)}" r="14" fill="#ffb84d" opacity=".18"/>`); lights.push({ x: wx + 4, y: wy + 5, c: '#ffcf70', r: 2.2 }); }
    });
    add(`<path d="M1300 440 a30 30 0 0 1 60 0Z" fill="#40406e"/><rect x="1296" y="440" width="68" height="40" fill="#40406e"/><path d="M1470 470 a22 22 0 0 1 44 0Z" fill="#3a3a6a"/><rect x="1466" y="470" width="52" height="40" fill="#3a3a6a"/>`);
    [[1110, 520], [1200, 480], [1560, 500]].forEach(([x, y]) => add(`<path d="M${x} ${y} q4 -40 -2 -70" stroke="#232246" stroke-width="5" fill="none"/>${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${x - 2} ${y - 70} q${(k - 2.5) * 12} -10 ${(k - 2.5) * 22} 8" stroke="#232246" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}`));

    /* the stable hill */
    add(`<path d="M0 640 Q300 590 560 640 Q700 600 820 590 Q980 590 1100 640 Q1350 660 1600 620 V1000 H0Z" fill="url(#sn-hill2)"/>`);
    add(olive(1080, 640, 0.9)); add(olive(520, 650, 0.8));

    /* stable */
    add(`<g filter="url(#sn-shadow)">
      <path d="M640 700 V520 H960 V700Z" fill="#4a3226"/>
      <path d="M660 700 V540 H940 V700Z" fill="url(#sn-stable)"/>
    </g>`);
    // planks on the back wall
    for (let x = 670; x < 940; x += 26) add(`<path d="M${x} 540 V700" stroke="#a35a24" stroke-width="2" opacity=".35"/>`);
    // ox and donkey behind, the holy family, the manger
    add(`<g fill="#3a2016" opacity=".85">
      <path d="M860 610 Q860 580 890 576 Q920 574 930 596 L930 640 H870Z"/><path d="M884 578 l-10 -14 l6 -2 l10 12 M912 576 l8 -14 l4 4 l-6 12" stroke="#3a2016" stroke-width="4"/>
      <path d="M690 620 Q690 596 712 594 L720 572 l6 2 l-2 22 Q742 600 742 630 L742 650 H690Z"/><path d="M712 574 l-6 -20 l5 -1 l5 18" />
    </g>`);
    add(`<path d="M730 700 Q726 640 748 618 Q764 604 778 618 Q790 640 786 700Z" fill="#2c3a6a"/><path d="M748 618 Q756 596 772 604 Q784 616 778 640 Q770 620 748 626Z" fill="#e8e0d0"/><circle cx="766" cy="626" r="9" fill="#e8c8a0"/>`);
    add(`<path d="M842 700 L846 610 Q856 592 870 600 L880 700Z" fill="#5a3a24"/><circle cx="862" cy="598" r="9" fill="#e0b890"/><path d="M852 594 Q862 582 872 594 L870 604 Q862 596 854 604Z" fill="#8a6a4a"/><path d="M888 700 L880 590 q4 -10 10 -4" stroke="#6b4a2a" stroke-width="4" fill="none"/>`);
    add(`<path d="M772 690 L780 666 H828 L836 690Z" fill="#6b3d1f"/><path d="M776 668 Q804 650 832 668" fill="#e8c46a"/><ellipse cx="804" cy="664" rx="22" ry="8" fill="#ffe7a8"/><circle cx="804" cy="660" r="40" fill="url(#sn-warm)"/>`);
    for (let i = 0; i < 18; i++) add(`<path d="M${f(rr(782, 828))} ${f(rr(662, 670))} l${f(rr(-8, 8))} ${f(rr(-10, -4))}" stroke="#f4d070" stroke-width="1.5"/>`);
    // hanging lantern
    add(`<path d="M800 540 v26" stroke="#2a1a10" stroke-width="2"/><rect x="792" y="566" width="16" height="22" rx="3" fill="#ffe7a8" stroke="#2a1a10" stroke-width="2"/>`);
    candles.push({ x: 800, y: 582, s: 0.5 });
    // posts and thatched roof
    add(`<rect x="634" y="510" width="16" height="200" fill="#5a3a26"/><rect x="950" y="510" width="16" height="200" fill="#5a3a26"/><rect x="792" y="490" width="14" height="40" fill="#5a3a26"/>`);
    add(`<path d="M600 540 L800 440 L1000 540 L986 556 L800 466 L614 556Z" fill="#c49a52"/>`);
    for (let i = 0; i < 70; i++) { const t = R(), side = R() < 0.5 ? -1 : 1; const x = 800 + side * t * 200, y = 440 + t * 100; add(`<path d="M${f(x)} ${f(y)} l${f(side * rr(2, 6))} ${f(rr(10, 18))}" stroke="${pick(['#a87a3a', '#d8b26a', '#8a6028'])}" stroke-width="2"/>`); }
    add(`<path d="M600 540 L800 440 L1000 540" stroke="#f0d890" stroke-width="3" fill="none" opacity=".6"/>`);
    // hay bales and straw spill
    add(`<rect x="960" y="676" width="54" height="32" rx="4" fill="#c49a52"/><rect x="584" y="680" width="50" height="28" rx="4" fill="#b88a42"/>`);
    add(`<path d="M640 704 Q800 690 960 704 L980 716 Q800 708 620 716Z" fill="#c49a52" opacity=".8"/>`);

    /* path up the hill */
    add(`<path d="M800 716 C780 780 640 800 600 860 C570 910 640 960 620 1000 L700 1000 C720 960 660 920 690 870 C730 820 830 790 840 716Z" fill="#4a4258" opacity=".7"/>`);

    /* shepherds' hill + fire */
    add(`<path d="M0 740 Q180 700 420 740 Q520 760 560 820 L560 1000 H0Z" fill="url(#sn-ground)"/>`);
    add(`<path d="M1060 760 Q1300 720 1600 740 V1000 H1040Z" fill="url(#sn-ground)"/>`);
    add(`<circle cx="330" cy="770" r="130" fill="url(#sn-warm)" opacity=".7"/>`);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI; add(`<ellipse cx="${f(330 + Math.cos(a) * 40)}" cy="${f(782 + Math.sin(a) * 8)}" rx="10" ry="7" fill="${pick(['#5a5060', '#6a6070', '#4a4250'])}"/>`); }
    add(`<path d="M300 784 L360 770 M304 770 L358 786" stroke="#3a2416" stroke-width="7" stroke-linecap="round"/>`);
    // shepherds
    add(`<g fill="#1e1828">
      <path d="M220 800 Q214 760 232 744 Q248 736 258 752 L270 800Z"/><circle cx="240" cy="732" r="12" fill="#c49a7a"/><path d="M226 730 Q240 712 254 730 L256 744 Q240 736 226 744Z" fill="#6b5a4a"/>
      <path d="M268 800 l10 -12" stroke="#1e1828" stroke-width="6"/>
    </g>`);
    add(`<g fill="#241c2e">
      <path d="M150 860 L156 750 Q168 728 184 740 L196 860Z"/><circle cx="172" cy="728" r="13" fill="#c49a7a"/><path d="M156 726 Q172 704 188 726 L190 744 Q172 734 156 744Z" fill="#7a6a54"/>
      <path d="M190 760 L250 650" stroke="#241c2e" stroke-width="7" stroke-linecap="round"/><path d="M128 850 L118 650 q2 -24 20 -18 q14 6 6 22" stroke="#5a3e28" stroke-width="5" fill="none"/>
    </g>`);
    add(`<g transform="translate(440 820)" fill="#2a2234"><path d="M-12 40 L-8 -30 Q4 -44 16 -32 L22 40Z"/><circle cx="4" cy="-42" r="12" fill="#c49a7a"/><path d="M-10 -44 Q4 -62 18 -44 L20 -30 Q4 -40 -12 -30Z" fill="#5a4a6a"/></g>`);
    // sheep
    [[80, 880, 1.1], [180, 920, 1.2, true], [380, 900, 1], [470, 960, 1.15, true], [60, 970, 1.25], [1150, 820, 0.9, true], [1260, 860, 1.05], [1400, 830, 0.95], [1500, 900, 1.2, true], [1330, 950, 1.15], [960, 760, 0.7], [1020, 770, 0.65, true], [600, 740, 0.7]].forEach(([x, y, s, fl]) => add(sheep(x, y, s, fl)));
    add(olive(1500, 760, 1.15)); add(olive(70, 720, 1));
    // grass tufts
    for (let i = 0; i < 60; i++) { const x = rr(0, W), y = rr(760, 1000); if (x > 560 && x < 1040 && y > 850) continue; add(`<path d="M${f(x)} ${f(y)} l-4 -12 M${f(x)} ${f(y)} l1 -15 M${f(x)} ${f(y)} l5 -11" stroke="#4a5a4a" stroke-width="2" opacity=".8"/>`); }

    /* parchment scroll (title) */
    add(`<g filter="url(#sn-shadow)">
      <path d="M500 880 Q800 860 1100 880 L1100 958 Q800 938 500 958Z" fill="url(#sn-scroll)"/>
      <path d="M500 880 Q800 860 1100 880 M500 958 Q800 938 1100 958" stroke="#b89a62" stroke-width="2" fill="none"/>
      <rect x="474" y="870" width="34" height="98" rx="17" fill="#e2cc9c"/><rect x="474" y="870" width="34" height="98" rx="17" fill="none" stroke="#a8884e" stroke-width="2"/><ellipse cx="491" cy="870" rx="17" ry="6" fill="#c8ac74"/>
      <rect x="1092" y="870" width="34" height="98" rx="17" fill="#e2cc9c"/><rect x="1092" y="870" width="34" height="98" rx="17" fill="none" stroke="#a8884e" stroke-width="2"/><ellipse cx="1109" cy="870" rx="17" ry="6" fill="#c8ac74"/>
      <path d="M530 890 Q800 872 1070 890 M530 948 Q800 930 1070 948" stroke="url(#sn-gold)" stroke-width="2" fill="none"/>
    </g>`);

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  A.designs.silentnight = {
    id: 'silentnight',
    name: 'Silent Night',
    blurb: 'A quiet stable beneath one bright star.',
    width: W, height: H, build,
    title: { path: 'M540 922 Q800 900 1060 922', size: 42, maxWidth: 480, fill: '#5a2412', stroke: '#f2e4c4' },
    numStyles: ['n-gold', 'n-cream', 'n-gold', 'n-tag'],
    effects: [
      { type: 'glow', x: 800, y: 120, r: 260, color: '255,244,210', a: 0.28, speed: 0.6 },
      { type: 'star', x: 800, y: 120, r: 130 },
      { type: 'twinkle' },
      { type: 'glow', x: 800, y: 630, r: 200, color: '255,190,100', a: 0.16, speed: 1.1 },
      { type: 'candles' },
      { type: 'roomGlow', x: 330, y: 760, r: 260, color: '255,150,60', a: 0.12, flicker: 0.06 },
      { type: 'fire', arch: 'M290 790 V660 H370 V790Z', x0: 304, x1: 356, base: 778, height: 80 },
      {
        type: 'custom', // an occasional shooting star
        draw(ctx, t, dt, st) {
          if (st.next == null) st.next = t + 4;
          if (t > st.next && !st.s) { st.s = { x: 120 + Math.random() * 600, y: 40 + Math.random() * 160, life: 0 }; st.next = t + 9 + Math.random() * 8; }
          if (!st.s) return;
          const s = st.s; s.life += dt;
          const k = s.life / 1.1;
          if (k >= 1) { st.s = null; return; }
          const x = s.x + k * 380, y = s.y + k * 150;
          const g = ctx.createLinearGradient(x - 120, y - 47, x, y);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.9 * Math.sin(k * Math.PI)})`);
          ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - 120, y - 47); ctx.lineTo(x, y); ctx.stroke();
        },
      },
    ],
    layout: 'silentnight',
    keepOut: [[440, 852, 720, 126], [680, 28, 240, 220], [284, 690, 110, 110]],
    day24: { x: 715, y: 540, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/silentnight.js', e); }
/* ---- src/layouts/silentnight.js ---- */
try {
/* Door layout for "Silent Night" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["silentnight"]=[{"day":1,"x":1272,"y":671,"w":100,"h":120,"hinge":"left"},
{"day":2,"x":543,"y":61,"w":132,"h":110,"hinge":"left"},
{"day":3,"x":666,"y":720,"w":150,"h":120,"hinge":"left"},
{"day":4,"x":996,"y":354,"w":150,"h":124,"hinge":"right"},
{"day":5,"x":678,"y":422,"w":120,"h":104,"hinge":"right"},
{"day":6,"x":1254,"y":504,"w":122,"h":150,"hinge":"left"},
{"day":7,"x":81,"y":366,"w":150,"h":120,"hinge":"right"},
{"day":8,"x":229,"y":44,"w":142,"h":150,"hinge":"left"},
{"day":9,"x":728,"y":256,"w":138,"h":150,"hinge":"left"},
{"day":10,"x":1439,"y":156,"w":126,"h":150,"hinge":"left"},
{"day":11,"x":80,"y":663,"w":126,"h":144,"hinge":"top"},
{"day":12,"x":1279,"y":809,"w":130,"h":150,"hinge":"right"},
{"day":13,"x":1322,"y":37,"w":120,"h":94,"hinge":"right"},
{"day":14,"x":997,"y":602,"w":120,"h":92,"hinge":"top"},
{"day":15,"x":33,"y":212,"w":104,"h":138,"hinge":"right"},
{"day":16,"x":1171,"y":196,"w":128,"h":144,"hinge":"left"},
{"day":17,"x":199,"y":824,"w":118,"h":150,"hinge":"left"},
{"day":18,"x":402,"y":342,"w":150,"h":134,"hinge":"top"},
{"day":19,"x":1133,"y":64,"w":150,"h":118,"hinge":"left"},
{"day":20,"x":251,"y":522,"w":134,"h":150,"hinge":"right"},
{"day":21,"x":847,"y":716,"w":150,"h":114,"hinge":"right"},
{"day":22,"x":1406,"y":630,"w":150,"h":126,"hinge":"top"},
{"day":23,"x":1451,"y":323,"w":116,"h":150,"hinge":"left"},
{"day":24,"x":715,"y":540,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/silentnight.js', e); }
/* ---- src/designs/ski.js ---- */
try {
/* Design — "Bluebird Powder Day"
   A mountain resort under a clear blue sky: corduroy runs, carving skiers, a chairlift
   that really runs, a gondola, and a timber A-frame lodge with the fire going. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  const LIFT = { b: [236, 792], t: [990, 330] };
  const lerp = (u) => [LIFT.b[0] + (LIFT.t[0] - LIFT.b[0]) * u, LIFT.b[1] + (LIFT.t[1] - LIFT.b[1]) * u];

  // skier shapes (facing right, origin = under the boots); shared by the art and the animation
  const SK = {
    ski1: 'M-30 0 L28 0 Q36 0 38 -6',
    ski2: 'M-34 -5 L24 -5 Q32 -5 34 -11',
    legs: 'M-8 -4 L-2 -22 L10 -30 L16 -24 L6 -16 L4 -2Z',
    torso: 'M-4 -26 Q2 -50 14 -54 Q22 -52 22 -44 L12 -24Z',
    hat: 'M11 -62 Q12 -72 19 -71 Q27 -70 26 -62Z',
  };

  function build() {
    const R = A.util.rng(9123);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const JACKETS = ['#e0392f', '#f2a81d', '#2a6fd6', '#1fa37a', '#c23aa0', '#ff6a3d', '#2b2b6e'];

    function bulb(x, y, c, r = 3.4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function lightString(x0, y0, x1, y1, sag, n, off = 0, r = 3.2) {
      const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#2a2a22" stroke-width="1.5" fill="none"/>`;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        s += bulb((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 4, BULB[(i + off) % 7], r);
      }
      return s;
    }
    function pine(x, base, h, col = '#1f4a3a', snow = '#f4f8ff', dark = '#143428') {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.1)}" width="${f(h * 0.06)}" height="${f(h * 0.12)}" fill="#4a2c1a"/>`;
      for (let k = 0; k < 4; k++) {
        const ty = base - h + k * h * 0.2, w = h * (0.13 + k * 0.08), th = h * 0.32;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + th)} Q${f(x)} ${f(ty + th + h * 0.05)} ${f(x + w)} ${f(ty + th)}Z" fill="${col}"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x + w)} ${f(ty + th)} Q${f(x + w * 0.5)} ${f(ty + th + h * 0.03)} ${f(x + w * 0.1)} ${f(ty + th * 0.9)}Z" fill="${dark}" opacity=".6"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.62)} ${f(ty + th * 0.6)} Q${f(x - w * 0.35)} ${f(ty + th * 0.72)} ${f(x - w * 0.12)} ${f(ty + th * 0.55)} Q${f(x + w * 0.18)} ${f(ty + th * 0.7)} ${f(x + w * 0.5)} ${f(ty + th * 0.5)}Z" fill="${snow}"/>`;
      }
      return s;
    }
    function skier(x, y, s, dir, jacket, pants, hat) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * dir)} ${f(s)})">
        <ellipse cx="-30" cy="-2" rx="14" ry="6" fill="#fff" opacity=".85"/><circle cx="-44" cy="-8" r="5" fill="#fff" opacity=".7"/><circle cx="-36" cy="-14" r="3.5" fill="#fff" opacity=".6"/>
        <path d="${SK.ski1}" stroke="#1a1a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="${SK.ski2}" stroke="#333" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="${SK.legs}" fill="${pants}"/><path d="${SK.torso}" fill="${jacket}"/>
        <path d="M16 -46 L27 -34" stroke="${jacket}" stroke-width="6" stroke-linecap="round"/><path d="M27 -34 L2 2" stroke="#555" stroke-width="1.6"/>
        <circle cx="18" cy="-60" r="7" fill="#f1c9a5"/><path d="${SK.hat}" fill="${hat}"/><circle cx="18" cy="-72" r="3.2" fill="#fff"/><rect x="17" y="-63" width="10" height="4" rx="2" fill="#ffb84d"/>
      </g>`;
    }
    const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };

    add(`<defs>
      <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f4597"/><stop offset=".5" stop-color="#3f8ad8"/><stop offset="1" stop-color="#bfe2f8"/></linearGradient>
      <radialGradient id="s-sun" cx="1390" cy="120" r="360" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbe8" stop-opacity="1"/><stop offset=".08" stop-color="#fff6d0" stop-opacity=".8"/><stop offset=".35" stop-color="#d9ecff" stop-opacity=".25"/><stop offset="1" stop-color="#d9ecff" stop-opacity="0"/></radialGradient>
      <linearGradient id="s-slope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6faff"/><stop offset="1" stop-color="#dfeaf8"/></linearGradient>
      <pattern id="s-cord" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="10" height="10" fill="#fbfdff"/><rect width="10" height="2" fill="#dbe7f6"/></pattern>
      <linearGradient id="s-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5f34"/><stop offset="1" stop-color="#6a3c1e"/></linearGradient>
      <linearGradient id="s-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8a8"/><stop offset=".6" stop-color="#ffb04a"/><stop offset="1" stop-color="#e8762a"/></linearGradient>
      <linearGradient id="s-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8703f"/><stop offset=".5" stop-color="#8a5530"/><stop offset="1" stop-color="#5e3418"/></linearGradient>
      <linearGradient id="s-woodd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4020"/><stop offset="1" stop-color="#3e2210"/></linearGradient>
      <linearGradient id="s-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <filter id="s-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0c2a55" flood-opacity=".35"/></filter>
      <radialGradient id="s-vig" cx="800" cy="500" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#06173a" stop-opacity=".45"/></radialGradient>
    </defs>`);

    /* sky and sun */
    add(`<rect width="${W}" height="600" fill="url(#s-sky)"/><rect width="${W}" height="600" fill="url(#s-sun)"/><circle cx="1390" cy="120" r="34" fill="#fffdf2"/>`);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(`<path d="M${f(1390 + Math.cos(a) * 46)} ${f(120 + Math.sin(a) * 46)} L${f(1390 + Math.cos(a) * 96)} ${f(120 + Math.sin(a) * 96)}" stroke="#fffbe8" stroke-width="3" opacity=".35" stroke-linecap="round"/>`); }

    /* far range */
    const far = [[0, 430], [110, 340], [200, 386], [320, 262], [420, 316], [540, 176], [660, 300], [740, 262], [840, 340], [950, 236], [1060, 310], [1170, 214], [1280, 300], [1360, 262], [1470, 330], [1600, 290]];
    add(`<path d="M${far.map((p) => p.join(' ')).join(' L')} V560 H0Z" fill="#eef5fd"/>`);
    for (let i = 1; i < far.length - 1; i++) {
      const [px, py] = far[i], [vx, vy] = far[i + 1];
      if (py < far[i - 1][1] && py < vy) {
        add(`<path d="M${px} ${py} L${vx} ${vy} L${f(px + (vx - px) * 0.25)} ${vy + 110}Z" fill="#bdd0ea"/>`);
        add(`<path d="M${px} ${py} l-12 30 l8 -4 l-6 22 M${px + 6} ${py + 10} l10 26" stroke="#7d93b4" stroke-width="2.5" fill="none" opacity=".6"/>`);
      }
    }
    /* the home mountain */
    add(`<path d="M0 520 Q240 430 470 400 Q640 378 760 352 Q840 334 900 350 Q1050 390 1250 420 Q1450 446 1600 430 V1000 H0Z" fill="url(#s-slope)"/>`);
    add(`<path d="M760 352 Q840 334 900 350 Q1050 390 1250 420 L1250 470 Q1050 440 900 400Z" fill="#d6e3f4" opacity=".7"/>`);
    // groomed runs (corduroy)
    const runs = [
      [[600, 386], [700, 380], [720, 520], [640, 700], [600, 1000], [380, 1000], [470, 720], [560, 520]],
      [[880, 360], [960, 372], [990, 560], [1060, 760], [980, 760], [900, 560]],
      [[300, 470], [360, 450], [330, 640], [250, 820], [170, 820], [240, 640]],
    ];
    runs.forEach((p) => add(`<path d="M${p.map((q) => q.join(' ')).join(' L')}Z" fill="url(#s-cord)"/>`));
    // carving tracks on the runs
    add(`<path d="M640 420 Q600 470 650 520 Q700 570 640 620 Q590 680 630 740" stroke="#c9d9ee" stroke-width="3" fill="none"/><path d="M930 400 Q900 450 950 500 Q990 560 950 620" stroke="#c9d9ee" stroke-width="3" fill="none"/>`);
    // forests between the runs (more and bigger lower down)
    const trees = [];
    for (let k = 0; k < 900 && trees.length < 150; k++) {
      const x = rr(0, W), y = rr(420, 780);
      if (inPoly([x, y], runs[0]) || inPoly([x, y], runs[1]) || inPoly([x, y], runs[2])) continue;
      if (x > 1040 && y > 600) continue; // lodge clearing
      const topY = 520 - (x < 470 ? (470 - x) * -0.35 : 0);
      if (y < (x < 760 ? 520 - (x / 760) * 130 : 360 + (x - 760) * 0.12) + 20) continue;
      const h = 30 + (y - 420) * 0.22;
      if (trees.some((t) => Math.abs(t[0] - x) < h * 0.3 && Math.abs(t[1] - y) < h * 0.35)) continue;
      trees.push([x, y, h]);
    }
    trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => add(pine(x, y, h)));

    /* gondola line on the right */
    add(`<path d="M1230 640 L1560 250" stroke="#3a3a3a" stroke-width="2"/><path d="M1246 646 L1576 256" stroke="#3a3a3a" stroke-width="2"/>`);
    [[1300, 557], [1420, 415], [1520, 297]].forEach(([x, y], i) => add(`<g transform="translate(${x} ${y})"><path d="M0 0 v18" stroke="#333" stroke-width="2"/><rect x="-14" y="18" width="28" height="26" rx="5" fill="${['#d6312b', '#f2a81d', '#2a6fd6'][i]}"/><rect x="-10" y="22" width="20" height="10" rx="2" fill="#cfe6ff"/></g>`));
    // top station
    add(`<g transform="translate(990 330)"><rect x="-34" y="-30" width="68" height="40" fill="url(#s-log)"/><path d="M-42 -30 L0 -56 L42 -30Z" fill="#7a2c22"/><path d="M-44 -30 L0 -58 L44 -30" stroke="#fff" stroke-width="6" fill="none"/><rect x="-10" y="-20" width="20" height="16" fill="url(#s-glass)"/></g>`);

    /* chairlift cables + towers (the chairs ride in the animation layer) */
    const [bx, by] = LIFT.b, [tx, ty] = LIFT.t;
    add(`<path d="M${bx} ${by - 60} L${tx} ${ty - 60}" stroke="#2c2c2c" stroke-width="2"/><path d="M${bx + 14} ${by - 52} L${tx + 14} ${ty - 52}" stroke="#2c2c2c" stroke-width="2"/>`);
    [0.12, 0.3, 0.48, 0.66, 0.84].forEach((u) => {
      const [x, y] = lerp(u);
      const len = 64 + u * 10;
      add(`<rect x="${f(x + 3)}" y="${f(y - 60)}" width="6" height="${f(len)}" fill="#5c6670"/><rect x="${f(x - 8)}" y="${f(y - 64)}" width="34" height="5" fill="#3e464f"/><ellipse cx="${f(x + 6)}" cy="${f(y + 4)}" rx="12" ry="3" fill="#c4d4ea"/>`);
    });
    // bottom station
    add(`<g transform="translate(${bx} ${by})" filter="url(#s-sh)"><rect x="-50" y="-58" width="90" height="62" fill="url(#s-log)"/><path d="M-58 -58 L-5 -90 L48 -58Z" fill="#7a2c22"/><path d="M-60 -58 L-5 -92 L50 -58" stroke="#fff" stroke-width="7" fill="none"/><rect x="-36" y="-44" width="24" height="20" fill="url(#s-glass)"/><rect x="0" y="-44" width="24" height="20" fill="url(#s-glass)"/><circle cx="20" cy="-60" r="16" fill="none" stroke="#333" stroke-width="4"/></g>`);
    add(lightString(bx - 56, by - 58, bx - 5, by - 90, 2, 5, 0, 2.8) + lightString(bx - 5, by - 90, bx + 46, by - 58, 2, 5, 3, 2.8));

    /* skiers carving down the runs */
    [[620, 470, 0.7, 1], [690, 600, 0.95, -1], [560, 780, 1.25, 1], [470, 900, 1.5, -1], [935, 460, 0.75, -1], [1010, 640, 1.0, 1], [300, 560, 0.8, -1], [230, 740, 1.1, 1]].forEach(([x, y, s, d], i) => add(skier(x, y, s, d, JACKETS[i % 7], i % 2 ? '#24304a' : '#3a3a3a', JACKETS[(i + 3) % 7])));

    /* trail sign */
    add(`<g transform="translate(118 900)" filter="url(#s-sh)"><rect x="-5" y="-150" width="10" height="160" fill="#6a3c1e"/>
      <rect x="-70" y="-150" width="140" height="34" rx="4" fill="url(#s-wood)"/><circle cx="-46" cy="-133" r="10" fill="#1f9a4a"/><rect x="-28" y="-138" width="80" height="8" rx="3" fill="#f3e6cc" opacity=".8"/>
      <rect x="-70" y="-110" width="140" height="34" rx="4" fill="url(#s-wood)"/><rect x="-56" y="-103" width="20" height="20" fill="#1f5fc4"/><rect x="-28" y="-98" width="70" height="8" rx="3" fill="#f3e6cc" opacity=".8"/>
      <rect x="-70" y="-70" width="140" height="34" rx="4" fill="url(#s-wood)"/><path d="M-46 -66 l10 13 l-10 13 l-10 -13Z" fill="#111"/><path d="M-26 -66 l10 13 l-10 13 l-10 -13Z" fill="#111"/><rect x="-8" y="-58" width="60" height="8" rx="3" fill="#f3e6cc" opacity=".8"/>
      <path d="M-74 -152 Q0 -162 74 -152" stroke="#fff" stroke-width="7" fill="none"/><path d="M-60 -116 l120 0" stroke="#fff" stroke-width="3" opacity=".7"/>
    </g>`);

    /* the lodge */
    add(`<g filter="url(#s-sh)">
      <rect x="1040" y="748" width="440" height="100" fill="url(#s-woodd)"/>
      <path d="M1260 540 L1040 840 L1480 840Z" fill="url(#s-log)"/>
      ${Array.from({ length: 12 }, (_, i) => `<path d="M${1260 - i * 18.3} ${540 + i * 25} H${1260 + i * 18.3}" stroke="#5a3218" stroke-width="2" opacity=".55"/>`).join('')}
      <path d="M1260 600 L1170 790 L1350 790Z" fill="url(#s-glass)"/>
      <path d="M1260 600 V790 M1215 695 H1305 M1193 742 H1327" stroke="#5a3218" stroke-width="5"/>
      <path d="M1250 522 L1022 846 L1046 846 L1260 548 L1474 846 L1498 846 L1270 522Z" fill="#7a2c22"/>
      <path d="M1250 518 L1018 846 M1270 518 L1502 846" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
      <rect x="1380" y="560" width="36" height="110" fill="#8a8f99"/><rect x="1374" y="552" width="48" height="12" fill="#6a6f78"/><path d="M1374 554 q24 -10 48 0" stroke="#fff" stroke-width="6" fill="none"/>
      <rect x="1030" y="830" width="460" height="12" fill="#5a3218"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${1036 + i * 29}" y="842" width="6" height="34" fill="#5a3218"/>`).join('')}
      <rect x="1030" y="870" width="460" height="8" fill="#5a3218"/>
    </g>`);
    add(lightString(1050, 836, 1258, 548, -40, 14, 0, 3.2));
    add(lightString(1262, 548, 1470, 836, -40, 14, 4, 3.2));
    add(lightString(1036, 842, 1484, 842, 14, 18, 2, 3));
    // wreath on the gable
    {
      let s = '';
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += `<circle cx="${f(1260 + Math.cos(a) * 15)}" cy="${f(578 + Math.sin(a) * 15)}" r="7" fill="${pick(['#1d5a35', '#24683f'])}"/>`; }
      add(s + `<path d="M1252 590 l-6 16 M1268 590 l6 16" stroke="#c4202f" stroke-width="5"/><circle cx="1260" cy="592" r="5" fill="#c4202f"/>`);
    }
    // skis and boards racked by the deck
    [[1500, '#e0392f'], [1514, '#2a6fd6'], [1528, '#f2a81d'], [1546, '#1fa37a'], [1562, '#c23aa0']].forEach(([x, c], i) => add(`<rect x="${x}" y="${740 + (i % 2) * 8}" width="8" height="120" rx="4" fill="${c}" transform="rotate(${-4 + i * 2} ${x} 860)"/>`));
    add(`<rect x="1490" y="800" width="96" height="8" fill="#5a3218"/>`);
    // decorated tree by the lodge
    add(pine(1000, 890, 190, '#1e5a35'));
    for (let i = 0; i < 18; i++) add(bulb(rr(960, 1040), rr(730, 880), BULB[i % 7], 3));

    /* foreground snow + crossed skis */
    add(`<path d="M0 900 Q300 870 640 896 Q980 920 1300 892 Q1460 880 1600 900 V1000 H0Z" fill="#fbfdff"/><path d="M0 900 Q300 870 640 896 Q980 920 1300 892 Q1460 880 1600 900" stroke="#d6e3f4" stroke-width="5" fill="none"/>`);
    add(`<g transform="translate(330 940)"><rect x="-4" y="-110" width="9" height="120" rx="4" fill="#e0392f" transform="rotate(-14)"/><rect x="-4" y="-110" width="9" height="120" rx="4" fill="#2a6fd6" transform="rotate(14)"/><path d="M-50 -100 L-30 10 M50 -100 L30 10" stroke="#555" stroke-width="2.5"/><circle cx="-31" cy="-4" r="7" fill="none" stroke="#555" stroke-width="2"/><circle cx="31" cy="-4" r="7" fill="none" stroke="#555" stroke-width="2"/><ellipse cx="0" cy="12" rx="60" ry="8" fill="#dfe8f6"/></g>`);
    for (let i = 0; i < 18; i++) add(`<ellipse cx="${f(rr(0, W))}" cy="${f(rr(920, 990))}" rx="${f(rr(20, 70))}" ry="${f(rr(3, 6))}" fill="#dce6f5" opacity=".7"/>`);

    /* carved wooden title sign */
    add(`<g filter="url(#s-sh)">
      <path d="M560 30 V70 M1040 30 V70" stroke="#c9a46a" stroke-width="4"/>
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#s-woodd)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#s-woodd)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#2e180a"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#2e180a"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#s-wood)"/>
      <path d="M540 96 Q800 44 1060 96 M540 132 Q800 80 1060 132" stroke="#5a3218" stroke-width="1.5" fill="none" opacity=".5"/>
      <path d="M520 78 Q800 18 1080 78" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/>
      <circle cx="540" cy="110" r="4" fill="url(#s-gold)"/><circle cx="1060" cy="110" r="4" fill="url(#s-gold)"/>
    </g>`);
    add(`<rect width="${W}" height="${H}" fill="url(#s-vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  /* ---------- animation ---------- */
  const P = {};
  const path = (k) => P[k] || (P[k] = new Path2D(SK[k]));
  const COLORS = ['#e0392f', '#f2a81d', '#2a6fd6', '#1fa37a', '#c23aa0', '#ff6a3d'];
  function chairlift(ctx, t) {
    const [bx, by] = LIFT.b, [tx, ty] = LIFT.t;
    const N = 9;
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < N; i++) {
        let u = ((t * 0.012 + i / N) % 1);
        if (side) u = 1 - u;
        const x = bx + (tx - bx) * u + (side ? 14 : 0), y = by + (ty - by) * u - 60 + (side ? 8 : 0);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 30); ctx.stroke();
        ctx.fillStyle = '#3b4652'; ctx.fillRect(x - 13, y + 30, 26, 4); ctx.fillRect(x - 13, y + 18, 3, 14);
        if (!side) {
          for (let r = 0; r < 2; r++) {
            const cx = x - 7 + r * 12, c = COLORS[(i * 2 + r) % COLORS.length];
            ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, y + 24, 5, 8, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(cx, y + 13, 4, 0, 7); ctx.fill();
            ctx.fillStyle = COLORS[(i + r + 3) % COLORS.length]; ctx.beginPath(); ctx.arc(cx, y + 11, 4.2, Math.PI, 0); ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 6, y + 40 + r); ctx.lineTo(cx + 12, y + 44 + r); ctx.stroke();
          }
        }
      }
    }
  }
  function carver(ctx, t) {
    // a skier linking turns down the open run, looping every ~7s
    const k = (t / 7) % 1;
    const y = 510 + k * 190;
    const x = 700 + Math.sin(k * Math.PI * 5) * 90;
    const dir = Math.cos(k * Math.PI * 5) >= 0 ? 1 : -1;
    const s = 0.9 + k * 0.5;
    const lean = Math.sin(k * Math.PI * 5) * 0.25;
    ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 8);
    // spray trail
    for (let j = 1; j < 14; j++) {
      const kk = k - j * 0.004;
      if (kk < 0) break;
      ctx.fillStyle = `rgba(255,255,255,${0.5 - j * 0.03})`;
      ctx.beginPath(); ctx.arc(700 + Math.sin(kk * Math.PI * 5) * 90, 510 + kk * 190, 5 - j * 0.25, 0, 7); ctx.fill();
    }
    ctx.translate(x, y); ctx.rotate(lean); ctx.scale(s * dir, s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3.5; ctx.stroke(path('ski1'));
    ctx.strokeStyle = '#333'; ctx.stroke(path('ski2'));
    ctx.fillStyle = '#24304a'; ctx.fill(path('legs'));
    ctx.fillStyle = '#e0392f'; ctx.fill(path('torso'));
    ctx.strokeStyle = '#e0392f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(16, -46); ctx.lineTo(27, -34); ctx.stroke();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(27, -34); ctx.lineTo(2, 2); ctx.stroke();
    ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(18, -60, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fill(path('hat')); ctx.fillStyle = '#c4202f'; ctx.beginPath(); ctx.arc(18, -72, 3.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb84d'; ctx.fillRect(17, -63, 10, 4);
  }

  A.designs.ski = {
    id: 'ski',
    name: 'Bluebird Powder Day',
    blurb: 'Chairlifts, fresh tracks and a lodge with a roaring fire.',
    width: W, height: H, build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#fff6dc', stroke: '#3a1d0a' },
    numStyles: ['n-red', 'n-swash', 'n-gold', 'n-red', 'n-tag', 'n-swash'],
    effects: [
      { type: 'glow', x: 1390, y: 120, r: 220, color: '255,250,220', a: 0.25, speed: 0.5 },
      { type: 'glow', x: 1260, y: 720, r: 170, color: '255,170,80', a: 0.35, speed: 2.2 },
      { type: 'smoke', x: 1398, y: 548, rate: 2, rise: 22, size: 9, color: '240,244,252', a: 0.5 },
      { type: 'twinkle' },
      { type: 'custom', draw: chairlift },
      { type: 'custom', draw: carver },
    ],
    layout: 'ski',
    keepOut: [[440, 18, 720, 172], [586, 470, 236, 250]],
    day24: { x: 1175, y: 625, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/ski.js', e); }
/* ---- src/layouts/ski.js ---- */
try {
/* Door layout for "Bluebird Powder Day" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["ski"]=[{"day":1,"x":32,"y":463,"w":96,"h":108,"hinge":"top"},
{"day":2,"x":1472,"y":660,"w":102,"h":120,"hinge":"top"},
{"day":3,"x":1418,"y":188,"w":150,"h":120,"hinge":"left"},
{"day":4,"x":243,"y":793,"w":114,"h":150,"hinge":"left"},
{"day":5,"x":253,"y":677,"w":108,"h":100,"hinge":"left"},
{"day":6,"x":733,"y":315,"w":150,"h":142,"hinge":"left"},
{"day":7,"x":176,"y":513,"w":136,"h":150,"hinge":"right"},
{"day":8,"x":1069,"y":823,"w":148,"h":150,"hinge":"right"},
{"day":9,"x":729,"y":796,"w":118,"h":150,"hinge":"left"},
{"day":10,"x":907,"y":774,"w":150,"h":130,"hinge":"top"},
{"day":11,"x":733,"y":194,"w":132,"h":102,"hinge":"left"},
{"day":12,"x":1229,"y":45,"w":150,"h":128,"hinge":"right"},
{"day":13,"x":444,"y":401,"w":108,"h":94,"hinge":"left"},
{"day":14,"x":1475,"y":808,"w":96,"h":114,"hinge":"left"},
{"day":15,"x":477,"y":803,"w":108,"h":138,"hinge":"left"},
{"day":16,"x":1307,"y":485,"w":150,"h":126,"hinge":"left"},
{"day":17,"x":903,"y":438,"w":120,"h":150,"hinge":"right"},
{"day":18,"x":1383,"y":330,"w":150,"h":130,"hinge":"left"},
{"day":19,"x":145,"y":367,"w":150,"h":118,"hinge":"top"},
{"day":20,"x":130,"y":51,"w":148,"h":150,"hinge":"right"},
{"day":21,"x":431,"y":239,"w":124,"h":150,"hinge":"left"},
{"day":22,"x":464,"y":659,"w":106,"h":132,"hinge":"top"},
{"day":23,"x":917,"y":220,"w":150,"h":140,"hinge":"right"},
{"day":24,"x":1175,"y":625,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/ski.js', e); }
/* ---- src/designs/sledding.js ---- */
try {
/* Design — "Sledding Hill"
   The best hill in town on a pink winter afternoon: toboggans racing down, saucers spinning,
   a snow fort, a hot cocoa stand, and the town lighting up in the valley below. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  // the hill's surface (three quadratic segments) — shared by the art and the animation
  const HILL = [[[0, 300], [200, 250], [380, 290]], [[380, 290], [700, 380], [1000, 560]], [[1000, 560], [1200, 680], [1600, 740]]];
  const HILL_D = 'M0 300 Q200 250 380 290 Q700 380 1000 560 Q1200 680 1600 740';
  let table = null;
  function hillY(x) {
    if (!table) {
      table = [];
      HILL.forEach(([p0, c, p1]) => { for (let i = 0; i <= 60; i++) { const t = i / 60; table.push([(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]); } });
    }
    for (let i = 1; i < table.length; i++) if (table[i][0] >= x) { const [x0, y0] = table[i - 1], [x1, y1] = table[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1); }
    return 740;
  }
  const SLED = {
    body: 'M-52 0 L40 0 Q60 0 60 -16 Q60 -26 50 -24 Q48 -9 38 -9 L-52 -9Z',
    rail: 'M-56 4 L44 4 Q66 4 66 -16',
  };

  function build() {
    const R = A.util.rng(5150);
    const rr = (a, b) => a + R() * (b - a);
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const COATS = ['#e0392f', '#2a6fd6', '#f2a81d', '#1fa37a', '#c23aa0', '#ff6a3d', '#6b4bd6'];

    function bulb(x, y, c, r = 3.4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function lightString(x0, y0, x1, y1, sag, n, off = 0, r = 3.2) {
      const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#2a2a22" stroke-width="1.5" fill="none"/>`;
      for (let i = 1; i < n; i++) { const t = i / n; s += bulb((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 4, BULB[(i + off) % 7], r); }
      return s;
    }
    function pine(x, base, h, col = '#28503f', snow = '#fbeef2', dark = '#18352a') {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.1)}" width="${f(h * 0.06)}" height="${f(h * 0.12)}" fill="#4a2c1a"/>`;
      for (let k = 0; k < 4; k++) {
        const ty = base - h + k * h * 0.2, w = h * (0.13 + k * 0.08), th = h * 0.32;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + th)} Q${f(x)} ${f(ty + th + h * 0.05)} ${f(x + w)} ${f(ty + th)}Z" fill="${col}"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x + w)} ${f(ty + th)} Q${f(x + w * 0.5)} ${f(ty + th + h * 0.03)} ${f(x + w * 0.1)} ${f(ty + th * 0.9)}Z" fill="${dark}" opacity=".6"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.62)} ${f(ty + th * 0.6)} Q${f(x - w * 0.35)} ${f(ty + th * 0.72)} ${f(x - w * 0.12)} ${f(ty + th * 0.55)} Q${f(x + w * 0.18)} ${f(ty + th * 0.7)} ${f(x + w * 0.5)} ${f(ty + th * 0.5)}Z" fill="${snow}"/>`;
      }
      return s;
    }
    function kid(x, y, s, coat, hat, opts = {}) {
      const arm = opts.wave ? `<path d="M8 -34 L20 -54" stroke="${coat}" stroke-width="7" stroke-linecap="round"/><circle cx="21" cy="-56" r="4" fill="${hat}"/>`
        : opts.pull ? `<path d="M-8 -34 L-26 -24" stroke="${coat}" stroke-width="7" stroke-linecap="round"/>`
        : `<path d="M8 -34 L14 -16" stroke="${coat}" stroke-width="7" stroke-linecap="round"/>`;
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * (opts.flip ? -1 : 1))} ${f(s)})">
        <ellipse cx="0" cy="2" rx="16" ry="4" fill="#000" opacity=".12"/>
        <rect x="-8" y="-18" width="7" height="18" rx="3" fill="#2b2b4a"/><rect x="2" y="-18" width="7" height="18" rx="3" fill="#2b2b4a"/>
        <path d="M-12 -16 Q-13 -42 0 -44 Q13 -42 12 -16Z" fill="${coat}"/>
        <path d="M-9 -40 Q0 -34 9 -40 L9 -35 Q0 -29 -9 -35Z" fill="${hat}"/><path d="M5 -36 l3 12 l-5 0Z" fill="${hat}"/>
        ${arm}<path d="M-8 -34 L-14 -16" stroke="${coat}" stroke-width="7" stroke-linecap="round" opacity="${opts.pull ? 0 : 1}"/>
        <circle cx="0" cy="-52" r="9" fill="#f1c9a5"/><circle cx="-3" cy="-48" r="2" fill="#f2a0a0" opacity=".7"/>
        <path d="M-10 -53 Q-10 -66 0 -66 Q10 -66 10 -53Z" fill="${hat}"/><path d="M-10 -54 h20" stroke="#fff" stroke-width="3"/><circle cx="0" cy="-68" r="4" fill="#fff"/>
      </g>`;
    }
    function toboggan(x, y, s, rot, riders) {
      let r = '';
      riders.forEach(([coat, hat], i) => {
        const rx = 22 - i * 24;
        r += `<path d="M${rx - 10} -8 Q${rx - 11} -30 ${rx} -32 Q${rx + 11} -30 ${rx + 10} -8Z" fill="${coat}"/><circle cx="${rx}" cy="-40" r="8" fill="#f1c9a5"/><path d="M${rx - 8} -41 Q${rx - 8} -52 ${rx} -52 Q${rx + 8} -52 ${rx + 8} -41Z" fill="${hat}"/><circle cx="${rx}" cy="-54" r="3.4" fill="#fff"/>`;
        if (i === 0) r += `<path d="M${rx + 6} -26 L${rx + 22} -44" stroke="${coat}" stroke-width="5" stroke-linecap="round"/><path d="M${rx - 6} -26 L${rx - 18} -46" stroke="${coat}" stroke-width="5" stroke-linecap="round"/>`;
        else r += `<path d="M${rx + 6} -22 L${rx + 18} -20" stroke="${coat}" stroke-width="5" stroke-linecap="round"/>`;
        r += `<path d="M${rx - 18} -46 q-6 -10 -2 -16" stroke="#c4202f" stroke-width="4" fill="none" opacity="${i === riders.length - 1 ? 1 : 0}"/>`;
      });
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})">${r}<path d="${SLED.body}" fill="#c4202f"/><path d="M-52 -5 H40" stroke="#8a1020" stroke-width="2"/><path d="${SLED.rail}" stroke="#555" stroke-width="2.5" fill="none"/><ellipse cx="-62" cy="2" rx="12" ry="4" fill="#fff" opacity=".8"/></g>`;
    }
    function saucer(x, y, s, coat, hat, disc) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><ellipse cx="0" cy="0" rx="34" ry="10" fill="${disc}"/><ellipse cx="0" cy="-2" rx="26" ry="6" fill="#fff" opacity=".35"/>
        <path d="M-10 -4 Q-12 -28 0 -30 Q12 -28 10 -4Z" fill="${coat}"/><path d="M8 -20 L26 -30 M-8 -20 L-26 -30" stroke="${coat}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="0" cy="-38" r="8" fill="#f1c9a5"/><path d="M-8 -39 Q-8 -50 0 -50 Q8 -50 8 -39Z" fill="${hat}"/><circle cx="0" cy="-52" r="3.4" fill="#fff"/>
        <path d="M-40 4 q-10 0 -16 6 M40 -4 q12 -2 16 -8" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/></g>`;
    }

    add(`<defs>
      <linearGradient id="l-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f62a8"/><stop offset=".45" stop-color="#ad8cc4"/><stop offset=".78" stop-color="#f1a6b6"/><stop offset="1" stop-color="#ffd6b0"/></linearGradient>
      <radialGradient id="l-sun" cx="1250" cy="440" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff0c8" stop-opacity=".9"/><stop offset=".15" stop-color="#ffd1a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffb0a0" stop-opacity="0"/></radialGradient>
      <linearGradient id="l-hill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4f6"/><stop offset=".6" stop-color="#f3eaf6"/><stop offset="1" stop-color="#dcdcf2"/></linearGradient>
      <linearGradient id="l-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9c4e8" stop-opacity="0"/><stop offset="1" stop-color="#b9b4e0" stop-opacity=".7"/></linearGradient>
      <linearGradient id="l-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8703f"/><stop offset="1" stop-color="#6a3c1e"/></linearGradient>
      <pattern id="l-awning" width="36" height="10" patternUnits="userSpaceOnUse"><rect width="36" height="10" fill="#fbf4ea"/><rect width="18" height="10" fill="#c4202f"/></pattern>
      <linearGradient id="l-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="l-rib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="l-ribd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <filter id="l-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#3a2050" flood-opacity=".35"/></filter>
      <radialGradient id="l-vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a1030" stop-opacity=".45"/></radialGradient>
    </defs>`);

    /* sky */
    add(`<rect width="${W}" height="700" fill="url(#l-sky)"/><rect width="${W}" height="700" fill="url(#l-sun)"/><circle cx="1250" cy="440" r="40" fill="#fff4d8" opacity=".95"/>`);
    [[260, 140, 220], [700, 200, 260], [1150, 160, 300], [1450, 260, 200], [950, 300, 240]].forEach(([x, y, w]) => add(`<ellipse cx="${x}" cy="${y}" rx="${w}" ry="14" fill="#ffe0e6" opacity=".5"/><ellipse cx="${x - 40}" cy="${y - 10}" rx="${w * 0.5}" ry="12" fill="#fff0f2" opacity=".5"/>`));

    /* far hills and the town in the valley */
    add(`<path d="M600 470 Q900 400 1200 440 Q1420 470 1600 430 V1000 H600Z" fill="#c7b2d6"/>`);
    add(`<path d="M640 520 Q950 470 1250 500 Q1450 520 1600 500 V1000 H640Z" fill="#e9dcea"/>`);
    // houses
    const houses = [];
    for (let x = 860; x < 1600; x += rr(42, 62)) houses.push([x, 520 + Math.sin(x / 120) * 8 + rr(-6, 6)]);
    houses.forEach(([x, y], i) => {
      const w = rr(30, 44), h = rr(22, 32), c = ['#9a4a3a', '#5a6b9a', '#c98a4a', '#6a8a6a', '#8a5a8a'][i % 5];
      add(`<rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="${c}"/><path d="M${f(x - 4)} ${f(y - h)} L${f(x + w / 2)} ${f(y - h - 16)} L${f(x + w + 4)} ${f(y - h)}Z" fill="#fbf6fb"/>`);
      const wx = x + w * 0.3, wy = y - h * 0.55;
      add(`<rect x="${f(wx)}" y="${f(wy)}" width="7" height="7" fill="#ffd27a"/>`);
      if (i % 3 === 0) lights.push({ x: wx + 3.5, y: wy + 3.5, c: '#ffd27a', r: 2.2 });
      if (i % 4 === 1) add(`<rect x="${f(x + w * 0.7)}" y="${f(y - h - 20)}" width="6" height="12" fill="#5a3324"/>`);
    });
    // church
    add(`<g transform="translate(1180 530)"><rect x="-30" y="-50" width="60" height="50" fill="#e8dcc8"/><path d="M-36 -50 L0 -74 L36 -50Z" fill="#fbf6fb"/><rect x="-12" y="-120" width="24" height="70" fill="#e8dcc8"/><path d="M-16 -120 L0 -160 L16 -120Z" fill="#7a3a4a"/><rect x="-6" y="-108" width="12" height="16" rx="6" fill="#ffd27a"/><rect x="-8" y="-36" width="16" height="36" rx="8" fill="#ffd27a"/><path d="M0 -160 v-12 M-5 -167 h10" stroke="#e2b04a" stroke-width="2.5"/></g>`);
    lights.push({ x: 1180, y: -100 + 530, c: '#ffd27a', r: 3 });
    for (let x = 640; x < 1600; x += 11) { const y = 520 + Math.sin(x / 90) * 6; if (x > 840) continue; add(`<path d="M${f(x)} ${f(y - rr(12, 22))} L${f(x + 6)} ${f(y + 4)} L${f(x - 6)} ${f(y + 4)}Z" fill="#6e5a8a"/>`); }

    /* the hill */
    add(`<path d="${HILL_D} V1000 H0Z" fill="url(#l-hill)"/>`);
    add(`<path d="M380 290 Q700 380 1000 560 Q1200 680 1600 740 V1000 H1100 Q900 760 380 300Z" fill="url(#l-shade)" opacity=".45"/>`);
    add(`<path d="${HILL_D}" stroke="#fff" stroke-width="6" fill="none"/>`);
    // sled tracks
    for (let k = 0; k < 6; k++) {
      const x0 = 420 + k * 18, x1 = 1180 + k * 30;
      add(`<path d="M${x0} ${f(hillY(x0) + 6)} Q${f((x0 + x1) / 2 - 40)} ${f(hillY((x0 + x1) / 2) + 30 + k * 6)} ${x1} ${f(hillY(x1) + 50 + k * 10)}" stroke="#d9d3ee" stroke-width="3" fill="none" opacity=".8"/>`);
    }
    // trees along the crest and down the far side
    [[60, 305, 160], [130, 290, 120], [190, 286, 190], [262, 292, 140], [1380, 760, 120], [1460, 770, 170], [1540, 780, 140]].forEach(([x, b, h]) => add(pine(x, b, h)));
    for (let i = 0; i < 18; i++) add(bulb(rr(150, 230), rr(140, 280), BULB[i % 7], 3));
    // parents waving at the top
    add(kid(320, 300, 1.3, '#2a6fd6', '#c4202f', { wave: true }) + kid(350, 302, 1.35, '#6b4bd6', '#f2a81d'));

    /* sledders on the slope */
    add(toboggan(490, hillY(490) - 3, 1.15, 14, [['#2a6fd6', '#c4202f'], ['#f2a81d', '#1fa37a'], ['#c23aa0', '#fff']]));
    add(saucer(1180, hillY(1180) + 10, 1.4, '#1fa37a', '#c4202f', '#e0392f'));
    add(toboggan(1070, hillY(1070) + 4, 1.45, 18, [['#e0392f', '#fff'], ['#2a6fd6', '#f2a81d']]));
    add(saucer(560, hillY(560) + 70, 1.1, '#ff6a3d', '#2a6fd6', '#2a6fd6'));

    /* trees, fence and fun on the lower slope */
    [[40, 560, 150], [110, 540, 110], [530, 540, 120], [610, 580, 90], [900, 770, 110], [980, 810, 150]].forEach(([x, b, h]) => add(pine(x, b, h)));
    for (let i = 0; i < 14; i++) add(bulb(rr(10, 80), rr(430, 545), BULB[i % 7], 3));
    add(`<rect x="447" y="440" width="6" height="120" fill="#2a2a2a"/><path d="M440 440 h20 l-4 -24 h-12Z" fill="#2a2a2a"/><rect x="444" y="420" width="12" height="18" fill="#ffe2a0"/><circle cx="450" cy="470" r="12" fill="none" stroke="#1d5a35" stroke-width="7"/><circle cx="450" cy="482" r="4" fill="#c4202f"/>`);
    lights.push({ x: 450, y: 428, c: '#ffd27a', r: 6 });
    // split-rail fence at the run-out
    add(`<path d="M600 860 L1060 900 M600 884 L1060 924" stroke="#7a4a2c" stroke-width="7" stroke-linecap="round"/>` + [600, 715, 830, 945, 1060].map((x, i) => `<rect x="${x - 5}" y="${846 + i * 10}" width="10" height="60" fill="#5a3218"/><path d="M${x - 7} ${846 + i * 10} h14" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`).join(''));
    // a giant snowball being rolled
    add(`<path d="M640 790 Q690 800 716 800" stroke="#d6d1ea" stroke-width="14" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="760" cy="770" r="48" fill="#fdfbff"/><path d="M720 760 q30 20 70 -10" stroke="#d6d1ea" stroke-width="3" fill="none"/>`);
    add(kid(820, 806, 1.35, '#ff6a3d', '#2a6fd6', { flip: true }) + kid(700, 812, 1.3, '#6b4bd6', '#e0392f'));
    // a dog bounding after the sleds
    add(`<g transform="translate(930 650) rotate(20)"><ellipse cx="0" cy="0" rx="26" ry="12" fill="#a8703f"/><circle cx="24" cy="-10" r="10" fill="#a8703f"/><path d="M20 -16 q-6 -2 -6 10" stroke="#6a3c1e" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="33" cy="-10" r="2.5" fill="#222"/><path d="M-20 6 l-10 12 M-8 8 l-4 14 M12 8 l8 12 M20 6 l14 8" stroke="#a8703f" stroke-width="5" stroke-linecap="round"/><path d="M-26 -4 q-14 -10 -10 -20" stroke="#a8703f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 -4 q6 4 12 0" stroke="#c4202f" stroke-width="4" fill="none"/></g>`);
    // a kid towing a sled back up
    add(`<path d="M410 ${f(hillY(410) + 70)} L360 ${f(hillY(360) + 64)}" stroke="#8a5a2c" stroke-width="2"/>`);
    add(kid(410, hillY(410) + 74, 1.25, '#c23aa0', '#1fa37a', { pull: true, flip: true }));
    add(`<g transform="translate(330 ${f(hillY(330) + 66)}) rotate(-12) scale(0.9)"><path d="${SLED.body}" fill="#2a6fd6"/><path d="${SLED.rail}" stroke="#555" stroke-width="2.5" fill="none"/></g>`);

    /* snow fort, lower left */
    add(`<g filter="url(#l-sh)">
      <path d="M40 760 Q40 700 120 696 L330 696 Q360 700 360 760 L360 800 L40 800Z" fill="#fbf8fd"/>
      ${Array.from({ length: 12 }, (_, i) => `<path d="M${50 + (i % 6) * 52 + (i >= 6 ? 26 : 0)} ${i >= 6 ? 760 : 726} h48" stroke="#d6d1ea" stroke-width="2"/>`).join('')}
      <path d="M60 726 h290 M60 760 h290" stroke="#d6d1ea" stroke-width="2"/>
      ${[70, 140, 210, 280].map((x) => `<rect x="${x}" y="680" width="34" height="20" rx="4" fill="#fbf8fd"/>`).join('')}
    </g>`);
    add(kid(150, 700, 1.3, '#e0392f', '#2a6fd6', { wave: true }) + kid(250, 702, 1.25, '#1fa37a', '#f2a81d'));
    add(`<path d="M330 696 V600" stroke="#6b4a2e" stroke-width="4"/><path d="M332 602 l42 12 l-42 12Z" fill="#c4202f"/>`);
    for (let i = 0; i < 6; i++) add(`<circle cx="${380 + (i % 3) * 18 + (i > 2 ? 9 : 0)}" cy="${790 - (i > 2 ? 15 : 0)}" r="9" fill="#fff" stroke="#d6d1ea"/>`);
    add(kid(460, 860, 1.5, '#f2a81d', '#c23aa0', { wave: true, flip: true }));

    /* hot cocoa stand, lower right */
    add(`<g filter="url(#l-sh)">
      <rect x="1240" y="700" width="300" height="160" fill="url(#l-wood)"/>
      ${Array.from({ length: 10 }, (_, i) => `<path d="M${1240 + i * 30} 700 V860" stroke="#5a3218" stroke-width="2" opacity=".5"/>`).join('')}
      <rect x="1250" y="560" width="10" height="150" fill="#6a3c1e"/><rect x="1520" y="560" width="10" height="150" fill="#6a3c1e"/>
      <path d="M1220 560 L1560 560 L1580 610 L1200 610Z" fill="url(#l-awning)"/>
      <path d="M1200 610 ${Array.from({ length: 10 }, (_, i) => `Q${1219 + i * 38} 634 ${1238 + i * 38} 610`).join(' ')}" fill="url(#l-awning)"/>
      <path d="M1220 556 Q1390 540 1560 556" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>
      <rect x="1230" y="690" width="320" height="16" rx="3" fill="#7a4a2c"/>
      <rect x="1290" y="620" width="60" height="40" rx="3" fill="#2a3a2a"/><path d="M1298 632 h40 M1298 642 h30 M1298 652 h36" stroke="#f3e6cc" stroke-width="2.5" opacity=".8"/>
    </g>`);
    // the stand keeper
    add(kid(1430, 690, 1.5, '#c4202f', '#1fa37a', { wave: true }));
    // mugs + pot on the counter
    add(`<rect x="1470" y="652" width="44" height="40" rx="6" fill="#8a8f99"/><rect x="1466" y="648" width="52" height="8" rx="3" fill="#6a6f78"/>`);
    [[1264, '#f2ede2'], [1300, '#c4202f'], [1336, '#2a6fd6'], [1372, '#f2ede2']].forEach(([x, c]) => add(`<rect x="${x}" y="672" width="22" height="20" rx="3" fill="${c}"/><path d="M${x + 22} 676 q8 0 7 7 q-1 5 -7 5" stroke="${c}" stroke-width="3.5" fill="none"/><ellipse cx="${x + 11}" cy="672" rx="10" ry="3" fill="#6b3b1d"/>`));
    add(lightString(1210, 612, 1570, 612, 22, 16, 0, 3.2));
    // snowman by the stand
    add(`<g transform="translate(1120 900)"><ellipse cx="0" cy="40" rx="64" ry="9" fill="#d9d3ee"/><circle cx="0" cy="0" r="48" fill="#fdfbff"/><circle cx="0" cy="-70" r="34" fill="#fdfbff"/><circle cx="0" cy="-122" r="25" fill="#fdfbff"/>
      <rect x="-20" y="-168" width="40" height="30" rx="2" fill="#222"/><rect x="-28" y="-142" width="56" height="7" rx="3" fill="#222"/><rect x="-20" y="-150" width="40" height="7" fill="#c4202f"/>
      <circle cx="-8" cy="-126" r="3.5" fill="#222"/><circle cx="8" cy="-126" r="3.5" fill="#222"/><path d="M0 -118 l18 5 l-18 4Z" fill="#f08a2a"/>
      <path d="M-28 -98 Q0 -86 28 -98 L30 -88 Q0 -76 -30 -88Z" fill="#2a6fd6"/><path d="M14 -92 l8 32 l-12 0Z" fill="#2a6fd6"/>
      <path d="M-32 -76 L-74 -104 M32 -76 L70 -110" stroke="#6b4a2e" stroke-width="5" stroke-linecap="round"/></g>`);

    /* foreground */
    add(`<path d="M0 920 Q400 890 800 912 Q1200 934 1600 904 V1000 H0Z" fill="#fdf8fc"/><path d="M0 920 Q400 890 800 912 Q1200 934 1600 904" stroke="#e2dcf0" stroke-width="5" fill="none"/>`);
    for (let i = 0; i < 16; i++) add(`<ellipse cx="${f(rr(0, W))}" cy="${f(rr(935, 990))}" rx="${f(rr(20, 70))}" ry="${f(rr(3, 6))}" fill="#e8e1f2" opacity=".8"/>`);

    /* title ribbon */
    add(`<g filter="url(#l-sh)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#l-ribd)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#l-ribd)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#4a0711"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#4a0711"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#l-rib)"/>
      <path d="M528 86 Q800 30 1072 86 M528 140 Q800 84 1072 140" stroke="url(#l-gold)" stroke-width="3" fill="none"/>
      <path d="M520 78 Q800 20 1080 78" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>
    </g>`);
    add(`<rect width="${W}" height="${H}" fill="url(#l-vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  /* ---------- animation: a toboggan racing down the hill ---------- */
  const P = {};
  const path = (k) => P[k] || (P[k] = new Path2D(SLED[k]));
  function race(ctx, t) {
    const k = (t / 6) % 1;
    const e = k * k * (1.6 - 0.6 * k); // speeds up as it goes
    const x = 600 + e * 420;
    const y = hillY(x) - 3;
    const ang = Math.atan2(hillY(x + 6) - hillY(x - 6), 12);
    ctx.globalAlpha = Math.min(1, k * 10, (1 - k) * 10);
    for (let j = 1; j < 10; j++) {
      const px = x - j * 10;
      ctx.fillStyle = `rgba(255,255,255,${0.6 - j * 0.06})`;
      ctx.beginPath(); ctx.arc(px - 56 * Math.cos(ang), hillY(px) - 2, 5 - j * 0.4, 0, 7); ctx.fill();
    }
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1.2, 1.2);
    [['#1fa37a', '#c4202f'], ['#e0392f', '#fff']].forEach(([coat, hat], i) => {
      const rx = 22 - i * 24;
      ctx.fillStyle = coat; ctx.beginPath(); ctx.moveTo(rx - 10, -8); ctx.quadraticCurveTo(rx - 11, -30, rx, -32); ctx.quadraticCurveTo(rx + 11, -30, rx + 10, -8); ctx.fill();
      ctx.strokeStyle = coat; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(rx + 6, -26); ctx.lineTo(rx + 20, -46 + Math.sin(t * 8 + i) * 3); ctx.moveTo(rx - 6, -26); ctx.lineTo(rx - 18, -46 + Math.cos(t * 8 + i) * 3); ctx.stroke();
      ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(rx, -40, 8, 0, 7); ctx.fill();
      ctx.fillStyle = hat; ctx.beginPath(); ctx.moveTo(rx - 8, -41); ctx.quadraticCurveTo(rx - 8, -52, rx, -52); ctx.quadraticCurveTo(rx + 8, -52, rx + 8, -41); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rx, -54, 3.4, 0, 7); ctx.fill();
      // scarf streaming behind
      ctx.strokeStyle = '#f2a81d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rx - 4, -34); ctx.quadraticCurveTo(rx - 18, -36 + Math.sin(t * 10 + i) * 4, rx - 30, -32); ctx.stroke();
    });
    ctx.fillStyle = '#c4202f'; ctx.fill(path('body'));
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2.5; ctx.stroke(path('rail'));
  }

  A.designs.sledding = {
    id: 'sledding',
    name: 'Sledding Hill',
    blurb: 'Red toboggans, mittens and a long run to the bottom.',
    width: W, height: H, build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#fff6dc', stroke: '#4a0711' },
    numStyles: ['n-red', 'n-swash', 'n-gold', 'n-red', 'n-tag', 'n-swash'],
    effects: [
      { type: 'glow', x: 1250, y: 440, r: 260, color: '255,215,170', a: 0.25, speed: 0.5 },
      { type: 'twinkle' },
      { type: 'smoke', x: 1492, y: 646, rate: 2.4, rise: 18, size: 6, color: '255,255,255', a: 0.5 },
      { type: 'smoke', x: 1324, y: 668, rate: 1.4, rise: 16, size: 4, color: '255,255,255', a: 0.45 },
      { type: 'custom', draw: race },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 90 },
    ],
    layout: 'sledding',
    keepOut: [[440, 18, 720, 172], [600, 330, 450, 270]],
    day24: { x: 1305, y: 718, w: 170, h: 130 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/sledding.js', e); }
/* ---- src/layouts/sledding.js ---- */
try {
/* Door layout for "Sledding Hill" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["sledding"]=[{"day":1,"x":1018,"y":884,"w":108,"h":90,"hinge":"left"},
{"day":2,"x":1343,"y":40,"w":114,"h":88,"hinge":"right"},
{"day":3,"x":482,"y":531,"w":98,"h":120,"hinge":"left"},
{"day":4,"x":784,"y":609,"w":126,"h":98,"hinge":"right"},
{"day":5,"x":1023,"y":194,"w":144,"h":118,"hinge":"left"},
{"day":6,"x":507,"y":802,"w":150,"h":124,"hinge":"top"},
{"day":7,"x":75,"y":125,"w":150,"h":136,"hinge":"right"},
{"day":8,"x":1217,"y":860,"w":132,"h":102,"hinge":"right"},
{"day":9,"x":47,"y":379,"w":126,"h":100,"hinge":"top"},
{"day":10,"x":404,"y":279,"w":108,"h":88,"hinge":"left"},
{"day":11,"x":1071,"y":469,"w":150,"h":118,"hinge":"right"},
{"day":12,"x":964,"y":719,"w":150,"h":150,"hinge":"left"},
{"day":13,"x":1394,"y":576,"w":150,"h":128,"hinge":"top"},
{"day":14,"x":1456,"y":289,"w":118,"h":144,"hinge":"top"},
{"day":15,"x":1123,"y":601,"w":126,"h":102,"hinge":"right"},
{"day":16,"x":165,"y":698,"w":138,"h":106,"hinge":"right"},
{"day":17,"x":676,"y":736,"w":88,"h":114,"hinge":"top"},
{"day":18,"x":31,"y":861,"w":120,"h":94,"hinge":"top"},
{"day":19,"x":1215,"y":282,"w":150,"h":142,"hinge":"top"},
{"day":20,"x":539,"y":197,"w":150,"h":124,"hinge":"right"},
{"day":21,"x":341,"y":387,"w":150,"h":118,"hinge":"left"},
{"day":22,"x":119,"y":526,"w":126,"h":150,"hinge":"right"},
{"day":23,"x":339,"y":826,"w":150,"h":148,"hinge":"left"},
{"day":24,"x":1305,"y":718,"w":170,"h":130,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/sledding.js', e); }
/* ---- src/designs/snowboard.js ---- */
try {
/* Design — "Halfpipe Holiday"
   A terrain park at golden hour: a lit halfpipe with a rider in a Santa hat
   boosting out of it, rails and a kicker strung with lights, a DJ booth, a big tree. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  // halfpipe cross-section at depth d (0 = far end, 1 = bottom edge of the board)
  const sec = (d) => { const fy = 530 + d * 470; return { fy, fh: 40 + d * 190, ly: fy - (20 + d * 230), lh: 80 + d * 400 }; };
  const RD = {
    board: 'M-30 -3 Q-35 0 -30 3 L30 3 Q35 0 30 -3Z',
    legs: 'M-12 -2 L-8 -16 L4 -19 L12 -2 L5 -2 L0 -11 L-5 -2Z',
    torso: 'M-9 -16 Q-6 -37 5 -39 Q14 -35 10 -16Z',
    hat: 'M-5 -47 Q-2 -61 15 -59 Q7 -53 9 -46Z',
  };

  function build() {
    const R = A.util.rng(3307);
    const rr = (a, b) => a + R() * (b - a);
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];

    function bulb(x, y, c, r = 3.4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".28"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function lightString(x0, y0, x1, y1, sag, n, off = 0, r = 3.2) {
      const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag;
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#1d1424" stroke-width="1.5" fill="none"/>`;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        s += bulb((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 + 4, BULB[(i + off) % 7], r);
      }
      return s;
    }
    function pine(x, base, h, col = '#24414a', snow = '#f7e3ea', dark = '#182c34') {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.1)}" width="${f(h * 0.06)}" height="${f(h * 0.12)}" fill="#3a2418"/>`;
      for (let k = 0; k < 4; k++) {
        const ty = base - h + k * h * 0.2, w = h * (0.13 + k * 0.08), th = h * 0.32;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + th)} Q${f(x)} ${f(ty + th + h * 0.05)} ${f(x + w)} ${f(ty + th)}Z" fill="${col}"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x + w)} ${f(ty + th)} Q${f(x + w * 0.5)} ${f(ty + th + h * 0.03)} ${f(x + w * 0.1)} ${f(ty + th * 0.9)}Z" fill="${dark}" opacity=".6"/>`;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.62)} ${f(ty + th * 0.6)} Q${f(x - w * 0.35)} ${f(ty + th * 0.72)} ${f(x - w * 0.12)} ${f(ty + th * 0.55)} Q${f(x + w * 0.18)} ${f(ty + th * 0.7)} ${f(x + w * 0.5)} ${f(ty + th * 0.5)}Z" fill="${snow}"/>`;
      }
      return s;
    }
    function rider(x, y, s, rot, jacket, pants, hat, board) {
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
        <path d="${RD.board}" fill="${board}"/><path d="M-24 -3 H24" stroke="#fff" stroke-width="1.2" opacity=".6"/>
        <path d="${RD.legs}" fill="${pants}"/><path d="${RD.torso}" fill="${jacket}"/>
        <path d="M4 -30 L16 -6" stroke="${jacket}" stroke-width="5.5" stroke-linecap="round"/><path d="M-4 -30 L-20 -40" stroke="${jacket}" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="2" cy="-44" r="6.5" fill="#f1c9a5"/><path d="${RD.hat}" fill="${hat}"/><circle cx="15" cy="-59" r="3.4" fill="#fff"/><path d="M-5 -46 Q3 -49 10 -46" stroke="#fff" stroke-width="3" fill="none"/>
        <rect x="1" y="-47" width="9" height="4" rx="2" fill="#7fe0ff"/>
      </g>`;
    }

    add(`<defs>
      <linearGradient id="b-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1548"/><stop offset=".38" stop-color="#5a2a74"/><stop offset=".7" stop-color="#cf5878"/><stop offset="1" stop-color="#ffb35c"/></linearGradient>
      <linearGradient id="b-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d8e0"/><stop offset=".5" stop-color="#ece0f0"/><stop offset="1" stop-color="#d9d6ef"/></linearGradient>
      <linearGradient id="b-wallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fbe4e6"/><stop offset="1" stop-color="#e2cfe6"/></linearGradient>
      <linearGradient id="b-wallR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9b0d8"/><stop offset="1" stop-color="#8d84bb"/></linearGradient>
      <linearGradient id="b-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e1d4ea"/><stop offset="1" stop-color="#cfc6e6"/></linearGradient>
      <radialGradient id="b-sun" cx="800" cy="520" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset=".4" stop-color="#ff8a6a" stop-opacity=".15"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient>
      <linearGradient id="b-banner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2384a"/><stop offset=".5" stop-color="#b81d33"/><stop offset="1" stop-color="#8a1022"/></linearGradient>
      <linearGradient id="b-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="b-booth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a52"/><stop offset="1" stop-color="#1d1430"/></linearGradient>
      <radialGradient id="b-flood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <filter id="b-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#1a0a2a" flood-opacity=".45"/></filter>
      <radialGradient id="b-vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140820" stop-opacity=".55"/></radialGradient>
    </defs>`);

    /* sky */
    add(`<rect width="${W}" height="620" fill="url(#b-sky)"/>`);
    for (let i = 0; i < 90; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 260))}" r="${f(rr(0.6, 1.8))}" fill="#fff" opacity="${f(rr(0.3, 1))}"/>`);
    add(`<path d="M232 120 a34 34 0 1 0 30 52 a28 28 0 1 1 -30 -52Z" fill="#fff4d6"/><circle cx="240" cy="150" r="70" fill="#fff4d6" opacity=".08"/>`);
    add(`<rect width="${W}" height="620" fill="url(#b-sun)"/>`);
    /* mountains with alpenglow */
    const range = [[0, 470], [130, 360], [240, 410], [380, 280], [500, 350], [640, 250], [760, 330], [880, 290], [1000, 360], [1120, 260], [1260, 340], [1380, 300], [1500, 380], [1600, 340]];
    add(`<path d="M${range.map((p) => p.join(' ')).join(' L')} V600 H0Z" fill="#f2b9c8"/>`);
    for (let i = 1; i < range.length - 1; i++) {
      const [px, py] = range[i], [vx, vy] = range[i + 1];
      if (py < range[i - 1][1] && py < vy) add(`<path d="M${px} ${py} L${vx} ${vy} L${f(px + (vx - px) * 0.3)} ${vy + 140}Z" fill="#7d5c9c"/><path d="M${px} ${py} l-10 26 l6 -3 l-5 18" stroke="#5a3d78" stroke-width="2" fill="none" opacity=".6"/>`);
    }
    add(`<path d="M0 500 Q400 470 800 492 Q1200 514 1600 488 V600 H0Z" fill="#a98cc0"/>`);
    for (let x = 0; x < W; x += 13) { const y = 494 + Math.sin(x / 140) * 10; add(`<path d="M${f(x)} ${f(y - rr(12, 24))} L${f(x + 6)} ${f(y + 6)} L${f(x - 6)} ${f(y + 6)}Z" fill="#4e3a6e"/>`); }

    /* ground */
    add(`<path d="M0 520 Q400 506 800 516 Q1200 526 1600 512 V1000 H0Z" fill="url(#b-snow)"/>`);
    /* the halfpipe, dug into the slope and running toward us */
    const n = sec(0), m = sec(1);
    add(`<path d="M${800 - n.lh} ${n.ly} L${800 - n.fh} ${n.fy} L${800 - m.fh} ${m.fy} L${800 - m.lh} ${m.ly}Z" fill="url(#b-wallL)"/>`);
    add(`<path d="M${800 + n.lh} ${n.ly} L${800 + n.fh} ${n.fy} L${800 + m.fh} ${m.fy} L${800 + m.lh} ${m.ly}Z" fill="url(#b-wallR)"/>`);
    add(`<path d="M${800 - n.fh} ${n.fy} L${800 + n.fh} ${n.fy} L${800 + m.fh} ${m.fy} L${800 - m.fh} ${m.fy}Z" fill="url(#b-floor)"/>`);
    // carving lines on the walls and floor
    for (let k = 0; k < 7; k++) {
      const d0 = 0.1 + k * 0.12, a = sec(d0), b = sec(Math.min(1, d0 + 0.08));
      add(`<path d="M${f(800 - a.lh * 0.9)} ${f(a.ly + 8)} Q${f(800 - a.fh)} ${f(a.fy)} 800 ${f((a.fy + b.fy) / 2)} Q${f(800 + b.fh)} ${f(b.fy)} ${f(800 + b.lh * 0.9)} ${f(b.ly + 8)}" stroke="#ffffff" stroke-width="${f(1 + k * 0.4)}" fill="none" opacity=".55"/>`);
    }
    // blue coping along both lips, with lights
    add(`<path d="M${800 - n.lh} ${n.ly} L${800 - m.lh} ${m.ly}" stroke="#2a6fd6" stroke-width="5"/><path d="M${800 + n.lh} ${n.ly} L${800 + m.lh} ${m.ly}" stroke="#2a6fd6" stroke-width="5"/>`);
    for (let i = 0; i <= 16; i++) {
      const d = i / 16, s = sec(d), r = 2.4 + d * 3.4;
      add(bulb(800 - s.lh, s.ly - 6 - d * 6, BULB[i % 7], r) + bulb(800 + s.lh, s.ly - 6 - d * 6, BULB[(i + 3) % 7], r));
    }
    /* the big tree at the top of the pipe */
    add(pine(800, 516, 210, '#1d4f3a', '#fbe8ee', '#123326'));
    for (let i = 0; i < 26; i++) { const yy = rr(330, 500), half = (yy - 306) * 0.38; add(bulb(800 + rr(-half, half), yy, BULB[i % 7], 3)); }
    add(`<path d="M800 290 l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2Z" fill="url(#b-gold)"/>`);

    /* floodlight towers + the banner strung between them */
    [470, 1130].forEach((x) => {
      add(`<path d="M${x - 12} 540 L${x - 3} 60 L${x + 3} 60 L${x + 12} 540Z" fill="#3a3046"/><path d="M${x - 8} 520 L${x + 8} 470 M${x + 8} 520 L${x - 8} 470 M${x - 6} 420 L${x + 6} 370 M${x + 6} 420 L${x - 6} 370" stroke="#2a2236" stroke-width="2"/>`);
      add(`<rect x="${x - 30}" y="30" width="60" height="26" rx="4" fill="#2a2236"/><circle cx="${x - 14}" cy="43" r="9" fill="#fff6d8"/><circle cx="${x + 14}" cy="43" r="9" fill="#fff6d8"/><ellipse cx="${x}" cy="44" rx="90" ry="60" fill="url(#b-flood)" opacity=".5"/>`);
    });
    add(`<g filter="url(#b-sh)">
      <path d="M480 64 Q800 92 1120 64 L1120 140 Q800 168 480 140Z" fill="url(#b-banner)"/>
      <path d="M480 74 Q800 102 1120 74 M480 130 Q800 158 1120 130" stroke="url(#b-gold)" stroke-width="3" fill="none"/>
      <path d="M480 64 L500 64 L500 140 L480 140Z M1100 64 L1120 64 L1120 140 L1100 140Z" fill="#6a0c1a"/>
      ${Array.from({ length: 8 }, (_, i) => `<circle cx="${490}" cy="${72 + i * 9}" r="2" fill="#fff" opacity=".7"/><circle cx="${1110}" cy="${72 + i * 9}" r="2" fill="#fff" opacity=".7"/>`).join('')}
    </g>`);
    // festoon lights crossing the park
    add(lightString(0, 300, 470, 250, 70, 14, 0, 3.4));
    add(lightString(1130, 250, 1600, 300, 70, 14, 3, 3.4));

    /* left side: a kicker with a rider in the air, and a lit rail */
    add(`<path d="M80 760 Q200 744 290 690 L300 700 Q220 760 90 780Z" fill="#fff"/><path d="M290 690 L300 700 L300 780 L230 780Z" fill="#cfc6e6"/>`);
    add(lightString(90, 778, 300, 700, -14, 8, 2, 3));
    add(rider(250, 600, 1.3, -24, '#1fa37a', '#c4202f', '#c4202f', '#f2a81d'));
    add(`<path d="M80 900 L420 830" stroke="#d0d4dc" stroke-width="7" stroke-linecap="round"/><path d="M110 894 v30 M250 864 v30 M390 836 v30" stroke="#8a8f99" stroke-width="5"/>`);
    for (let i = 0; i < 12; i++) add(bulb(90 + i * 28, 896 - i * 5.9 + 10, BULB[i % 7], 2.8));
    add(rider(250, 858, 1.4, -12, '#2a6fd6', '#2b2b4a', '#c4202f', '#e0392f'));

    /* spectators along the right deck */
    for (let i = 0; i < 9; i++) {
      const x = 985 + i * 30 + rr(-5, 5), y = 552 + i * 9;
      const c = ['#e0392f', '#2a6fd6', '#f2a81d', '#1fa37a', '#c23aa0'][i % 5];
      add(`<g transform="translate(${f(x)} ${f(y)}) scale(${f(0.62 + i * 0.03)}) translate(${f(-x)} ${f(-y)})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="12" ry="20" fill="${c}"/><circle cx="${f(x)}" cy="${f(y - 26)}" r="8" fill="#f1c9a5"/><path d="M${f(x - 8)} ${f(y - 28)} Q${f(x)} ${f(y - 42)} ${f(x + 8)} ${f(y - 28)}Z" fill="${i % 2 ? '#c4202f' : '#2b2b4a'}"/>${i % 3 === 0 ? `<path d="M${f(x + 10)} ${f(y - 10)} l12 -26" stroke="${c}" stroke-width="5" stroke-linecap="round"/>` : ''}</g>`);
    }
    /* DJ booth / lodge on the right */
    add(`<g filter="url(#b-sh)">
      <rect x="1250" y="660" width="290" height="190" rx="6" fill="url(#b-booth)"/>
      <path d="M1236 664 L1395 600 L1554 664Z" fill="#c4202f"/><path d="M1232 666 L1395 598 L1558 666" stroke="#fff" stroke-width="9" fill="none" stroke-linejoin="round"/>
      <rect x="1280" y="700" width="230" height="70" rx="4" fill="#ffcf70" opacity=".9"/><rect x="1280" y="700" width="230" height="70" rx="4" fill="#ff7ad9" opacity=".25"/>
      <rect x="1270" y="770" width="250" height="40" fill="#2a1d3c"/><circle cx="1350" cy="790" r="12" fill="#111"/><circle cx="1440" cy="790" r="12" fill="#111"/><circle cx="1350" cy="790" r="4" fill="#ff5d4d"/><circle cx="1440" cy="790" r="4" fill="#6cc8ff"/>
      <rect x="1210" y="760" width="44" height="90" rx="4" fill="#1a1426"/><circle cx="1232" cy="786" r="13" fill="#2f2640"/><circle cx="1232" cy="826" r="10" fill="#2f2640"/>
      <rect x="1536" y="760" width="44" height="90" rx="4" fill="#1a1426"/><circle cx="1558" cy="786" r="13" fill="#2f2640"/><circle cx="1558" cy="826" r="10" fill="#2f2640"/>
    </g>`);
    add(lightString(1240, 664, 1395, 602, -10, 9, 1, 3.2) + lightString(1395, 602, 1550, 664, -10, 9, 5, 3.2));
    for (let i = 0; i < 10; i++) add(bulb(1262 + i * 28, 852, BULB[(i * 3) % 7], 3));

    /* snowman in goggles + boards stuck in the snow */
    add(`<g transform="translate(1100 900)"><ellipse cx="0" cy="40" rx="70" ry="10" fill="#cfc6e6"/><circle cx="0" cy="0" r="50" fill="#fbf7fb"/><circle cx="0" cy="-74" r="36" fill="#fbf7fb"/><circle cx="0" cy="-128" r="26" fill="#fbf7fb"/>
      <rect x="-24" y="-138" width="48" height="12" rx="6" fill="#2b2b4a"/><rect x="-18" y="-136" width="16" height="8" rx="4" fill="#7fe0ff"/><rect x="2" y="-136" width="16" height="8" rx="4" fill="#7fe0ff"/>
      <path d="M-24 -150 Q0 -180 24 -150Z" fill="#c4202f"/><path d="M-26 -150 h52" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="20" cy="-172" r="6" fill="#fff"/>
      <path d="M0 -120 l18 5 l-18 4Z" fill="#f08a2a"/><path d="M-30 -104 Q0 -92 30 -104 L32 -94 Q0 -82 -32 -94Z" fill="#1fa37a"/><circle cx="0" cy="-70" r="4" fill="#222"/><circle cx="0" cy="-52" r="4" fill="#222"/>
      <path d="M-34 -80 L-80 -110 M34 -80 L84 -100" stroke="#6b4a2e" stroke-width="5" stroke-linecap="round"/></g>`);
    [[960, '#e0392f', -8], [990, '#2a6fd6', 6], [1020, '#f2a81d', -2]].forEach(([x, c, r]) => add(`<rect x="${x}" y="810" width="22" height="130" rx="11" fill="${c}" transform="rotate(${r} ${x} 940)"/><rect x="${x + 4}" y="850" width="14" height="6" fill="#111" transform="rotate(${r} ${x} 940)"/>`));

    /* foreground + side pines */
    add(`<path d="M0 930 Q400 900 800 920 Q1200 940 1600 912 V1000 H0Z" fill="#efe6f4"/>`);
    [[30, 600, 220], [110, 560, 160], [1560, 610, 230], [1490, 560, 150]].forEach(([x, b, h]) => add(pine(x, b, h)));
    for (let i = 0; i < 16; i++) add(bulb(rr(0, 70), rr(420, 590), BULB[i % 7], 3) + bulb(rr(1520, 1600), rr(420, 600), BULB[(i + 2) % 7], 3));

    add(`<rect width="${W}" height="${H}" fill="url(#b-vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  /* ---------- animation: a rider swinging wall to wall, boosting out of each lip ---------- */
  const P = {};
  const path = (k) => P[k] || (P[k] = new Path2D(RD[k]));
  const D = 0.36;
  function boost(ctx, t) {
    const s = sec(D);
    const swing = Math.sin(t * 0.9) * 1.32; // |swing| > 1 = in the air above a lip
    const side = Math.sign(swing) || 1, a = Math.abs(swing);
    let x, y, rot;
    if (a <= 1) {
      x = 800 + swing * s.lh * 0.92;
      y = s.fy - Math.pow(a, 3) * (s.fy - s.ly) - 4;
      rot = side * Math.pow(a, 2) * 70;
    } else {
      const k = (a - 1) / 0.32; // 0 at the lip, 1 at the top of the air
      x = 800 + side * (s.lh * 0.92 + 18 * k);
      y = s.ly - 4 - Math.sin(k * Math.PI / 2) * 160;
      rot = side * (70 + k * 290); // a full spin at the top
    }
    // spray when on the wall
    if (a > 0.6 && a < 1.05) {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x - side * (8 + i * 6), y + 6 - i * 2, 4 - i * 0.5, 0, 7); ctx.fill(); }
    }
    ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180); ctx.scale(1.25, 1.25);
    ctx.fillStyle = '#7a2be2'; ctx.fill(path('board'));
    ctx.fillStyle = '#c4202f'; ctx.fill(path('legs'));
    ctx.fillStyle = '#1fa37a'; ctx.fill(path('torso'));
    ctx.strokeStyle = '#1fa37a'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, -30); ctx.lineTo(16, -6); ctx.moveTo(-4, -30); ctx.lineTo(-20, -40); ctx.stroke();
    ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(2, -44, 6.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#d3202f'; ctx.fill(path('hat'));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(15, -59, 3.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -46); ctx.quadraticCurveTo(3, -49, 10, -46); ctx.stroke();
  }
  function beams(ctx, t) {
    ctx.globalCompositeOperation = 'lighter';
    [['255,90,200', 0], ['90,200,255', 2.1], ['255,220,90', 4.2]].forEach(([c, ph], i) => {
      const a = -Math.PI / 2 + Math.sin(t * 0.7 + ph) * 0.75;
      const ox = 1330 + i * 60, oy = 700;
      const len = 520, spread = 0.09;
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * len, oy + Math.sin(a) * len);
      g.addColorStop(0, `rgba(${c},.35)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(a - spread) * len, oy + Math.sin(a - spread) * len);
      ctx.lineTo(ox + Math.cos(a + spread) * len, oy + Math.sin(a + spread) * len);
      ctx.closePath(); ctx.fill();
    });
  }

  A.designs.snowboard = {
    id: 'snowboard',
    name: 'Halfpipe Holiday',
    blurb: 'Snowboarders catching air over a festive terrain park.',
    width: W, height: H, build,
    title: { path: 'M500 104 Q800 132 1100 104', size: 44, maxWidth: 520, fill: '#fff4dc', stroke: '#5a0816' },
    effects: [
      { type: 'custom', draw: beams },
      { type: 'glow', x: 470, y: 44, r: 200, color: '255,240,200', a: 0.25, speed: 0.8 },
      { type: 'glow', x: 1130, y: 44, r: 200, color: '255,240,200', a: 0.25, speed: 0.9 },
      { type: 'star', x: 800, y: 305, r: 60 },
      { type: 'twinkle' },
      { type: 'custom', draw: boost },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 80 },
    ],
    layout: 'snowboard',
    keepOut: [[440, 24, 720, 156], [548, 420, 504, 290]],
    day24: { x: 1300, y: 690, w: 170, h: 140 },
    numStyles: ['n-red', 'n-tag', 'n-swash', 'n-gold', 'n-cream'],
  };
})();

} catch (e) { console.error('Design file failed: src/designs/snowboard.js', e); }
/* ---- src/layouts/snowboard.js ---- */
try {
/* Door layout for "Halfpipe Holiday" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["snowboard"]=[{"day":1,"x":1104,"y":526,"w":150,"h":132,"hinge":"right"},
{"day":2,"x":113,"y":409,"w":80,"h":102,"hinge":"left"},
{"day":3,"x":331,"y":233,"w":118,"h":150,"hinge":"left"},
{"day":4,"x":43,"y":766,"w":116,"h":150,"hinge":"top"},
{"day":5,"x":1166,"y":426,"w":108,"h":86,"hinge":"right"},
{"day":6,"x":1196,"y":272,"w":150,"h":136,"hinge":"right"},
{"day":7,"x":312,"y":759,"w":122,"h":150,"hinge":"right"},
{"day":8,"x":1231,"y":171,"w":102,"h":82,"hinge":"right"},
{"day":9,"x":1067,"y":261,"w":112,"h":144,"hinge":"left"},
{"day":10,"x":472,"y":312,"w":132,"h":104,"hinge":"top"},
{"day":11,"x":79,"y":209,"w":118,"h":150,"hinge":"top"},
{"day":12,"x":1204,"y":30,"w":150,"h":116,"hinge":"right"},
{"day":13,"x":763,"y":249,"w":146,"h":150,"hinge":"left"},
{"day":14,"x":1201,"y":842,"w":110,"h":132,"hinge":"right"},
{"day":15,"x":177,"y":769,"w":110,"h":138,"hinge":"top"},
{"day":16,"x":1086,"y":726,"w":92,"h":114,"hinge":"left"},
{"day":17,"x":696,"y":720,"w":140,"h":150,"hinge":"right"},
{"day":18,"x":216,"y":39,"w":110,"h":132,"hinge":"right"},
{"day":19,"x":303,"y":603,"w":120,"h":144,"hinge":"right"},
{"day":20,"x":790,"y":884,"w":114,"h":90,"hinge":"right"},
{"day":21,"x":1445,"y":564,"w":120,"h":110,"hinge":"top"},
{"day":22,"x":576,"y":891,"w":96,"h":80,"hinge":"top"},
{"day":23,"x":327,"y":441,"w":122,"h":150,"hinge":"left"},
{"day":24,"x":1300,"y":690,"w":170,"h":140,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/snowboard.js', e); }
/* ---- src/designs/snowman.js ---- */
try {
/* Design — "Snowman Family"
   Hand-built SVG scene + animated canvas effects. See src/designs/parlor.js for the design contract. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  /* ---------- shared drawing kit (inlined per design so each file stands alone) ---------- */
  const f = (n) => Math.round(n * 10) / 10;
  function makeKit(R) {
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [];
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40', '#14361f'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];
    function pine(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rr(-0.3, 0.3), l = r * rr(0.9, 1.5);
        s += `<path d="M${f(x)} ${f(y)}L${f(x + Math.cos(a) * l)} ${f(y + Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return s;
    }
    function bulb(x, y, c, r = 4.2) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".22"/><rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".75"/>`;
    }
    function lamp(x, y, c, r) { lights.push({ x, y, c, r }); return ''; }
    function berries(x, y) {
      let s = '';
      for (let i = 0; i < 3; i++) { const bx = x + rr(-6, 6), by = y + rr(-5, 5); s += `<circle cx="${f(bx)}" cy="${f(by)}" r="4.2" fill="#b3122a"/><circle cx="${f(bx - 1.3)}" cy="${f(by - 1.4)}" r="1.3" fill="#ff8f9c"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><path d="M-4 -2 C-14 -10 -24 -10 -24 -3" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/><ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    function quad(x0, y0, cx, cy, x1, y1, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]); }
      return pts;
    }
    function swag(x0, y0, cx, cy, x1, y1, o = {}) {
      const pts = quad(x0, y0, cx, cy, x1, y1, o.n || 24), r = o.r || 12;
      let s = '';
      pts.forEach(([x, y]) => (s += pine(x + rr(-3, 3), y + rr(-3, 3), r * rr(0.8, 1.1))));
      pts.forEach(([x, y], i) => { if (i % 2 === 0) s += pine(x + rr(-6, 6), y + rr(-2, 8), r * 0.75); });
      if (o.berries) pts.forEach(([x, y], i) => { if (i % 5 === 2) s += berries(x, y + 4); });
      if (o.lights) pts.forEach(([x, y], i) => { if (i % (o.every || 3) === 1) s += bulb(x + rr(-4, 4), y + rr(0, 8), BULB[(i + (o.off || 0)) % BULB.length], o.bulb || 4); });
      return s;
    }
    function lightString(x0, y0, cx, cy, x1, y1, n, r = 5, colors = BULB, off = 0) {
      let s = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="#1d2a1f" stroke-width="2.4" fill="none"/>`;
      quad(x0, y0, cx, cy, x1, y1, n).forEach(([x, y], i) => { if (i > 0 && i < n) s += bulb(x, y + r + 3, colors[(i + off) % colors.length], r); });
      return s;
    }
    function starPath(x, y, ro, ri, n = 5) {
      let d = '';
      for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); }
      return d + 'Z';
    }
    function gift(x, y, w, h, fill, rib, d = 14, bowColor) {
      return `<g filter="url(#shadow)"><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".18"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".28"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="${rib}"/><path d="M${x + w / 2 - 7} ${y} l${d} ${-d * 0.6} h14 l${-d} ${d * 0.6}Z" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${rib}" opacity=".95"/><path d="M${x + w} ${y + h / 2 - 6} l${d} ${-d * 0.6} v12 l${-d} ${d * 0.6}Z" fill="${rib}" opacity=".7"/></g>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.75, bowColor || rib, '#00000055')}`;
    }
    function candle(x, baseY, h, color, w = 22) {
      const top = baseY - h;
      candles.push({ x, y: top - 10, s: 1 });
      return `<rect x="${x - w / 2 - 4}" y="${baseY - 8}" width="${w + 8}" height="9" rx="2" fill="url(#gold)"/><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h - 8}" rx="3" fill="${color || 'url(#candle)'}"/><path d="M${x - w / 2} ${top + 4} q4 14 0 22 q5 -6 6 -18Z" fill="#fffaf0" opacity=".8"/><path d="M${x} ${top} v-8" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${top - 16}" r="34" fill="url(#candleGlow)"/>`;
    }
    function snowDots(x, y, w, h, n, rMax = 2.4, op = 0.85) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(0.6 + R() * rMax)}" fill="#fff" opacity="${f(rr(0.4, op))}"/>`;
      return s;
    }
    function stars(x, y, w, h, n) {
      let s = '';
      for (let i = 0; i < n; i++) s += `<circle cx="${f(x + R() * w)}" cy="${f(y + R() * h)}" r="${f(rr(0.5, 1.8))}" fill="#fff" opacity="${f(rr(0.35, 1))}"/>`;
      return s;
    }
    function pineTree(x, y, h, color, snow = '#f4f8ff') {
      let s = '';
      for (let i = 0; i < 4; i++) {
        const ty = y - h + (i * h) / 4.6, w = h * (0.17 + i * 0.09);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(ty + h * 0.34)} Q${f(x)} ${f(ty + h * 0.3)} ${f(x + w)} ${f(ty + h * 0.34)}Z" fill="${color}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.55)} ${f(ty + h * 0.19)} Q${f(x - w * 0.1)} ${f(ty + h * 0.14)} ${f(x + w * 0.45)} ${f(ty + h * 0.17)}Z" fill="${snow}" opacity=".92"/>`;
      }
      return s + `<rect x="${f(x - h * 0.03)}" y="${f(y - h * 0.06)}" width="${f(h * 0.06)}" height="${f(h * 0.08)}" fill="#3a2414"/>`;
    }
    /** A decorated Christmas tree (tiers drawn bottom to top) */
    function tree(cx, top, base, hw, o = {}) {
      const span = base - top;
      const T = [[0.656, 1, 1], [0.479, 0.825, 0.88], [0.302, 0.645, 0.73], [0.139, 0.459, 0.56], [0, 0.275, 0.38]].map(([a, b, c]) => [top + a * span, top + b * span, hw * c]);
      let s = '';
      const tierPath = (y0, y1, w) => {
        let d = `M${cx} ${f(y0)} Q${f(cx - w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${f(cx - w)} ${f(y1)}`;
        const n = Math.max(3, Math.round(w / 26)), step = (2 * w) / n;
        for (let i = 0; i < n; i++) d += ` Q${f(cx - w + step * (i + 0.5))} ${f(y1 + 16)} ${f(cx - w + step * (i + 1))} ${f(i < n - 1 ? y1 - 3 : y1)}`;
        return d + ` Q${f(cx + w * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${f(y0)}Z`;
      };
      const inTier = (x, y, t) => y > t[0] + (t[1] - t[0]) * 0.3 && y < t[1] - 8 && Math.abs(x - cx) < t[2] * ((y - t[0]) / (t[1] - t[0])) * 0.86;
      if (o.trunk !== false) s += `<rect x="${cx - hw * 0.08}" y="${f(base - 30)}" width="${f(hw * 0.16)}" height="${f(hw * 0.25)}" fill="#4a2614"/>`;
      T.forEach((t, i) => {
        const [y0, y1, w] = t;
        if (i > 0) s += `<path d="${tierPath(y0 + 12, y1 + 12, w)}" fill="#000" opacity=".3" filter="url(#soft)"/>`;
        s += `<path d="${tierPath(y0, y1, w)}" fill="${o.fill || 'url(#treeG)'}"/>`;
        let nd = '';
        for (let k = 0; k < w * 2.1; k++) {
          const y = rr(y0 + (y1 - y0) * 0.15, y1 + 6), sp = w * ((y - y0) / (y1 - y0)), x = cx + rr(-sp, sp) * 0.98, dir = x < cx ? -1 : 1, len = rr(10, 22);
          nd += `<path d="M${f(x)} ${f(y)} l${f(dir * len * 0.7)} ${f(len * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="${f(rr(1.6, 2.8))}" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
        }
        s += nd;
        if (o.snow) s += `<path d="${tierPath(y1 - 10, y1, w * 0.95)}" fill="#f4f8ff" opacity=".85"/>`;
        if (i < 4 && o.beads !== false) s += `<path d="M${f(cx - w * 0.5)} ${f(y0 + (y1 - y0) * 0.55)} Q${cx} ${f(y0 + (y1 - y0) * 0.85 + 30)} ${f(cx + w * 0.8)} ${f(y0 + (y1 - y0) * 0.85 - 10)}" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`;
      });
      const placed = [];
      const at = (minD) => {
        for (let k = 0; k < 400; k++) {
          const t = T[Math.floor(R() * T.length)], x = rr(cx - t[2], cx + t[2]), y = rr(t[0], t[1]);
          if (!inTier(x, y, t)) continue;
          if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue;
          return [x, y];
        }
        return null;
      };
      const ok = ['red', 'gold', 'blue', 'silver', 'green', 'plum'];
      const scale = hw / 236;
      for (let i = 0; i < (o.ornaments == null ? 40 : o.ornaments); i++) {
        const p = at(22 * scale); if (!p) continue;
        const r = rr(9, 15) * Math.max(0.6, scale); placed.push([p[0], p[1], r]);
        s += `<path d="M${f(p[0])} ${f(p[1] - r - 4)} v-8" stroke="#c9a24a" stroke-width="1"/><rect x="${f(p[0] - 3.5)}" y="${f(p[1] - r - 5)}" width="7" height="6" rx="1" fill="url(#gold)"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#orn-${(o.palette || ok)[i % (o.palette || ok).length]})"/>`;
      }
      for (let i = 0; i < (o.canes == null ? 5 : o.canes); i++) {
        const p = at(20 * scale); if (!p) continue; placed.push([p[0], p[1], 12]);
        const cane = `M${f(p[0])} ${f(p[1] + 18)} V${f(p[1] - 6)} q0 -10 9 -10 q9 0 9 10`;
        s += `<path d="${cane}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${cane}" stroke="#c4222f" stroke-width="5" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < (o.lights == null ? 80 : o.lights); i++) {
        const p = at(8 * scale); if (!p) continue; placed.push([p[0], p[1], 5]);
        s += bulb(p[0], p[1], (o.bulbs || BULB)[i % (o.bulbs || BULB).length], 4 * Math.max(0.7, scale));
      }
      if (o.star !== false) {
        const sr = 38 * Math.max(0.6, scale);
        s += `<circle cx="${cx}" cy="${f(top - 6)}" r="${f(sr * 1.6)}" fill="url(#candleGlow)"/><path d="${starPath(cx, top - 4, sr, sr * 0.42)}" fill="url(#gold)" stroke="#8a5a14" stroke-width="2"/><path d="${starPath(cx, top - 4, sr * 0.47, sr * 0.2)}" fill="#fff6c8" opacity=".7"/>`;
      }
      return s;
    }
    const ornColors = { red: ['#ff5a63', '#b0101f', '#5e0710'], gold: ['#ffe39a', '#cf9a2e', '#6a4410'], blue: ['#8fb8ff', '#2a56b0', '#0f2353'], silver: ['#ffffff', '#b9c3cc', '#5b6670'], green: ['#8fe0a0', '#1f7d45', '#0b3a1d'], plum: ['#e3a0f0', '#7a2f95', '#33103f'] };
    let defs = '';
    Object.entries(ornColors).forEach(([k, [a, b, c]]) => (defs += `<radialGradient id="orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`));
    defs += `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <radialGradient id="candleGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="warmGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
      <linearGradient id="treeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter>`;
    /** Classic arched ribbon banner centred at cx; the title path runs along its middle. */
    function ribbonBanner(cx, y, halfW, o = {}) {
      const a = halfW, top = y, bot = y + 74, arch = o.arch == null ? 50 : o.arch;
      const fill = o.fill || 'url(#ribbon)', dark = o.dark || 'url(#ribbonDark)', deep = o.deep || '#4a0711';
      return `<g filter="url(#shadow)">
        <path d="M${cx - a + 28} ${top + 22} L${cx - a - 68} ${top + 16} L${cx - a - 40} ${top + 60} L${cx - a - 68} ${top + 106} L${cx - a + 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx + a - 28} ${top + 22} L${cx + a + 68} ${top + 16} L${cx + a + 40} ${top + 60} L${cx + a + 68} ${top + 106} L${cx + a - 40} ${top + 94}Z" fill="${dark}"/>
        <path d="M${cx - a} ${top} L${cx - a + 40} ${top + 28} L${cx - a + 40} ${top + 84} L${cx - a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx + a} ${top} L${cx + a - 40} ${top + 28} L${cx + a - 40} ${top + 84} L${cx + a} ${top + 74}Z" fill="${deep}"/>
        <path d="M${cx - a} ${top} Q${cx} ${top - arch - 8} ${cx + a} ${top} L${cx + a} ${bot} Q${cx} ${bot - arch - 8} ${cx - a} ${bot}Z" fill="${fill}"/>
        <path d="M${cx - a + 8} ${top + 10} Q${cx} ${top - arch + 2} ${cx + a - 8} ${top + 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
        <path d="M${cx - a + 8} ${bot - 10} Q${cx} ${bot - arch - 18} ${cx + a - 8} ${bot - 10}" stroke="url(#gold)" stroke-width="3" fill="none"/>
      </g>`;
    }
    const ribbonPath = (cx, y, halfW, arch = 50) => `M${cx - halfW + 40} ${y + 44} Q${cx} ${y + 44 - arch - 8} ${cx + halfW - 40} ${y + 44}`;
    return { rr, pick, lights, candles, BULB, GREENS, NEEDLE, pine, bulb, lamp, berries, bow, quad, swag, lightString, starPath, gift, candle, snowDots, stars, pineTree, tree, defs, ribbonBanner, ribbonPath };
  }

  /* ---------- snow people ---------- */
  const ball = (cx, cy, r) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#snowball)"/><path d="M${f(cx - r * 0.7)} ${f(cy - r * 0.45)} Q${f(cx - r * 0.2)} ${f(cy - r * 0.9)} ${f(cx + r * 0.4)} ${f(cy - r * 0.8)}" stroke="#fff" stroke-width="${f(r * 0.08)}" fill="none" opacity=".8" stroke-linecap="round"/>`;
  function coalSmile(cx, cy, r) {
    let s = '';
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.25 + i * 0.125); s += `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r * 0.75)}" r="${f(r * 0.12)}" fill="#1d1a1a"/>`; }
    return s;
  }
  function face(cx, cy, r, o = {}) {
    let s = `<ellipse cx="${f(cx - r * 0.34)}" cy="${f(cy - r * 0.18)}" rx="${f(r * 0.11)}" ry="${f(r * 0.13)}" fill="#1d1a1a"/><ellipse cx="${f(cx + r * 0.34)}" cy="${f(cy - r * 0.18)}" rx="${f(r * 0.11)}" ry="${f(r * 0.13)}" fill="#1d1a1a"/>`;
    s += `<circle cx="${f(cx - r * 0.37)}" cy="${f(cy - r * 0.23)}" r="${f(r * 0.04)}" fill="#fff"/><circle cx="${f(cx + r * 0.31)}" cy="${f(cy - r * 0.23)}" r="${f(r * 0.04)}" fill="#fff"/>`;
    s += `<circle cx="${f(cx - r * 0.55)}" cy="${f(cy + r * 0.15)}" r="${f(r * 0.16)}" fill="#ff8f9c" opacity=".45"/><circle cx="${f(cx + r * 0.55)}" cy="${f(cy + r * 0.15)}" r="${f(r * 0.16)}" fill="#ff8f9c" opacity=".45"/>`;
    const d = o.noseDir || 1;
    s += `<path d="M${f(cx)} ${f(cy - r * 0.04)} L${f(cx + d * r * (o.longNose ? 0.95 : 0.7))} ${f(cy + r * 0.1)} L${f(cx)} ${f(cy + r * 0.18)}Z" fill="#f07a1a"/><path d="M${f(cx + d * r * 0.2)} ${f(cy + r * 0.02)} l${f(d * r * 0.06)} ${f(r * 0.1)} M${f(cx + d * r * 0.4)} ${f(cy + r * 0.06)} l${f(d * r * 0.05)} ${f(r * 0.08)}" stroke="#b8501a" stroke-width="1.5"/>`;
    s += coalSmile(cx, cy + r * 0.12, r * 0.42);
    return s;
  }
  function scarf(cx, cy, w, c1, c2, tail = 1) {
    return `<path d="M${f(cx - w / 2)} ${f(cy - 6)} Q${f(cx)} ${f(cy + 10)} ${f(cx + w / 2)} ${f(cy - 6)} L${f(cx + w / 2)} ${f(cy + 8)} Q${f(cx)} ${f(cy + 26)} ${f(cx - w / 2)} ${f(cy + 8)}Z" fill="${c1}"/>
      <path d="M${f(cx + tail * w * 0.2)} ${f(cy + 8)} l${f(tail * 8)} ${f(w * 0.55)} l${f(tail * 20)} -4 l${f(-tail * 10)} ${f(-w * 0.5)}Z" fill="${c1}"/>
      <path d="M${f(cx - w / 2 + 6)} ${f(cy + 1)} Q${f(cx)} ${f(cy + 17)} ${f(cx + w / 2 - 6)} ${f(cy + 1)}" stroke="${c2}" stroke-width="4" fill="none" stroke-dasharray="8 8"/>
      <path d="M${f(cx + tail * w * 0.2 + tail * 6)} ${f(cy + w * 0.45)} l${f(tail * 22)} -3" stroke="${c2}" stroke-width="4"/>`;
  }
  function arm(x, y, dx, dy, mitten) {
    const ex = x + dx, ey = y + dy;
    let s = `<path d="M${x} ${y} L${ex} ${ey} M${f(x + dx * 0.6)} ${f(y + dy * 0.6)} l${f(dx * 0.25)} ${f(-Math.abs(dy) * 0.35 - 10)} M${f(x + dx * 0.8)} ${f(y + dy * 0.8)} l${f(dx * 0.2)} ${f(8)}" stroke="#5a3a22" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if (mitten) s += `<ellipse cx="${ex}" cy="${ey}" rx="11" ry="13" fill="${mitten}"/><ellipse cx="${ex + (dx > 0 ? -8 : 8)}" cy="${ey + 2}" rx="5" ry="7" fill="${mitten}"/><rect x="${ex - 11}" y="${ey + 8}" width="22" height="6" rx="3" fill="#fbf7f0"/>`;
    return s;
  }

  function build() {
    const R = A.util.rng(1225);
    const K = makeKit(R);
    const { rr } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a5a"/><stop offset=".5" stop-color="#4a5a9a"/><stop offset=".8" stop-color="#b48ab8"/><stop offset="1" stop-color="#f0b8a8"/></linearGradient>
      <radialGradient id="snowball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eef3fb"/><stop offset="1" stop-color="#b9c8e0"/></radialGradient>
      <linearGradient id="snowA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9ff"/><stop offset="1" stop-color="#d4e0f2"/></linearGradient>
      <linearGradient id="clap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9b28e"/><stop offset="1" stop-color="#a88e68"/></linearGradient>
      <pattern id="siding" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="40" height="22" fill="none"/><rect y="19" width="40" height="3" fill="#6b5236" opacity=".45"/></pattern>
      <radialGradient id="win" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#ffe9b0"/><stop offset=".7" stop-color="#f2a85a"/><stop offset="1" stop-color="#b8682a"/></radialGradient>
      <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3a5a"/><stop offset="1" stop-color="#2a2236"/></linearGradient>
      <pattern id="plaidR" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#c4222f"/><rect y="8" width="24" height="5" fill="#1b2a1e" opacity=".7"/><rect x="8" width="5" height="24" fill="#1b2a1e" opacity=".5"/></pattern>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0a22" stop-opacity=".5"/></radialGradient>
      <radialGradient id="porchGlow" cx="760" cy="560" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf80" stop-opacity=".35"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>
    </defs>`);

    /* dusk sky + hills */
    add(`<rect width="1600" height="1000" fill="url(#sky)"/>`);
    add(K.stars(0, 0, 1600, 300, 120));
    add(`<circle cx="1360" cy="110" r="34" fill="#fff6e0" opacity=".95"/><circle cx="1372" cy="102" r="30" fill="#33427a"/>`);
    add(`<path d="M0 520 Q240 450 520 500 Q820 556 1100 480 Q1360 420 1600 470 V700 H0Z" fill="#9aaed6"/>`);
    for (let x = -20; x < 1620; x += rr(18, 30)) add(K.pineTree(x, 540 + Math.sin(x / 120) * 26 + rr(-8, 8), rr(50, 90), '#3a4a7a', '#e6eeff'));

    /* the house */
    add(`<rect x="546" y="200" width="52" height="110" fill="#7a3a2a"/><path d="M546 214 h52 M546 236 h52 M546 258 h52 M570 200 v14 M560 214 v22 M584 236 v22" stroke="#5a2a1e" stroke-width="2"/><rect x="538" y="190" width="68" height="14" fill="#5a2a1e"/><path d="M538 192 q34 -16 68 0Z" fill="#fff"/>`);
    add(`<g filter="url(#shadow)"><rect x="440" y="330" width="640" height="320" fill="url(#clap)"/><rect x="440" y="330" width="640" height="320" fill="url(#siding)"/></g>`);
    add(`<path d="M400 344 L760 160 L1120 344Z" fill="url(#roof)"/><path d="M390 350 L760 150 L1130 350 L1110 356 L760 176 L410 356Z" fill="#fff"/><path d="M392 348 Q560 270 760 152 Q960 270 1128 348 Q1100 330 1060 334 Q900 240 760 186 Q620 240 460 334 Q420 330 392 348Z" fill="#f7fbff"/>`);
    // gable round window
    add(`<circle cx="760" cy="266" r="48" fill="#efe4cd"/><circle cx="760" cy="266" r="38" fill="url(#win)"/><path d="M722 266 h76 M760 228 v76" stroke="#efe4cd" stroke-width="6"/>`);
    // windows
    const win = (x, y) => `<rect x="${x - 6}" y="${y - 6}" width="112" height="132" fill="#efe4cd"/><rect x="${x}" y="${y}" width="100" height="120" fill="url(#win)"/><path d="M${x + 50} ${y} v120 M${x} ${y + 60} h100" stroke="#efe4cd" stroke-width="6"/><rect x="${x - 14}" y="${y + 120}" width="128" height="14" fill="#efe4cd"/><path d="M${x - 14} ${y + 120} q64 -14 128 0Z" fill="#fff"/>`;
    [[490, 420], [930, 420]].forEach(([x, y], i) => {
      add(win(x, y));
      K.lamp(x + 50, y + 60, '#ffd27a', 10);
      let w = '';
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; w += K.pine(x + 50 + Math.cos(a) * 22, y + 50 + Math.sin(a) * 22, 7); }
      add(w + K.bow(x + 50, y + 74, 0.45));
    });
    // front door + porch light
    add(`<rect x="700" y="470" width="120" height="180" fill="#efe4cd"/><rect x="712" y="482" width="96" height="168" fill="#1d6b43"/><circle cx="796" cy="566" r="5" fill="url(#gold)"/><rect x="726" y="496" width="68" height="40" fill="url(#win)"/>`);
    add(`<rect x="660" y="650" width="200" height="16" fill="#9a8a78"/><rect x="680" y="666" width="160" height="14" fill="#8a7a68"/>`);
    let dw = '';
    for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; dw += K.pine(760 + Math.cos(a) * 26, 560 + Math.sin(a) * 26, 8); }
    add(dw + K.berries(760, 534) + K.berries(740, 584) + K.berries(782, 580) + K.bow(760, 588, 0.5));
    add(`<rect width="1600" height="1000" fill="url(#porchGlow)"/>`);
    // roof lights + garland over the door
    add(K.lightString(410, 352, 585, 300, 760, 174, 14, 5) + K.lightString(760, 174, 935, 300, 1110, 352, 14, 5, K.BULB, 3));
    add(K.lightString(440, 336, 760, 346, 1080, 336, 26, 4.2, K.BULB, 5));
    add(K.swag(690, 474, 760, 492, 830, 474, { n: 10, r: 9, berries: true }));

    /* yard: picket fence, big pines, snow */
    add(`<path d="M0 640 Q400 610 800 650 Q1200 690 1600 630 V1000 H0Z" fill="url(#snowA)"/>`);
    for (let x = 0; x < 1600; x += 28) {
      if (x > 640 && x < 880) continue;
      const y = 700 + Math.sin(x / 260) * 8;
      add(`<path d="M${x} ${y} v-62 l10 -12 l10 12 v62Z" fill="#f3ead6"/><path d="M${x} ${y - 62} l10 -12 l10 12Z" fill="#fff"/>`);
    }
    add(`<path d="M0 668 Q400 652 640 670 M880 676 Q1200 690 1600 660" stroke="#e2d6bc" stroke-width="8" fill="none"/><path d="M0 690 Q400 674 640 692 M880 698 Q1200 712 1600 682" stroke="#e2d6bc" stroke-width="8" fill="none"/>`);
    add(K.swag(0, 650, 320, 690, 640, 662, { n: 24, r: 9, lights: true, every: 2, berries: true }) + K.swag(880, 670, 1240, 712, 1600, 650, { n: 26, r: 9, lights: true, every: 2, berries: true, off: 3 }));
    // red mittens drying on a fence post
    add(`<g transform="translate(150 640)"><ellipse cx="0" cy="0" rx="10" ry="13" fill="#c4222f"/><ellipse cx="-8" cy="2" rx="5" ry="7" fill="#c4222f"/><rect x="-10" y="9" width="20" height="5" fill="#fbf7f0"/></g><g transform="translate(176 644)"><ellipse cx="0" cy="0" rx="10" ry="13" fill="#c4222f"/><ellipse cx="8" cy="2" rx="5" ry="7" fill="#c4222f"/><rect x="-10" y="9" width="20" height="5" fill="#fbf7f0"/></g>`);
    // big decorated pines on both sides
    add(K.tree(170, 250, 700, 150, { ornaments: 0, lights: 46, canes: 0, beads: false, snow: true, star: false }));
    add(K.tree(1420, 230, 690, 160, { ornaments: 14, lights: 50, canes: 0, beads: false, snow: true }));
    add(`<path d="M0 820 Q300 780 640 806 Q1000 840 1300 800 Q1460 780 1600 800 V1000 H0Z" fill="#fff"/>`);
    for (let i = 0; i < 120; i++) add(`<circle cx="${f(rr(0, 1600))}" cy="${f(rr(700, 1000))}" r="${f(rr(0.8, 2.2))}" fill="#fff" opacity="${f(rr(0.6, 1))}"/>`);
    // shoveled path to the door
    add(`<path d="M700 680 L820 680 L900 1000 L620 1000Z" fill="#c9d6ea" opacity=".6"/><path d="M700 680 Q690 690 680 700 L600 1000 M820 680 L920 1000" stroke="#fff" stroke-width="10" fill="none"/>`);
    // snow angel + snowball pile
    add(`<g transform="translate(220 950) scale(.8)" opacity=".45"><ellipse cx="0" cy="0" rx="28" ry="40" fill="#c9d6ea"/><ellipse cx="0" cy="-52" rx="18" ry="16" fill="#c9d6ea"/><path d="M-20 -24 Q-70 -50 -60 -10 Q-50 10 -24 0Z M20 -24 Q70 -50 60 -10 Q50 10 24 0Z" fill="#c9d6ea"/></g>`);
    [[360, 960, 18], [384, 962, 18], [372, 942, 17], [398, 944, 15], [386, 926, 14]].forEach(([x, y, r]) => add(ball(x, y, r)));

    /* the snow family */
    // Dad: tall, top hat, plaid scarf, broom
    add(`<ellipse cx="520" cy="860" rx="100" ry="18" fill="#a9bad6" opacity=".7"/>`);
    add(`<path d="M610 600 L560 860" stroke="#8a5a30" stroke-width="7"/><path d="M594 594 l-12 -40 M606 596 l0 -44 M618 598 l10 -40 M600 594 l-6 -42 M612 596 l4 -44" stroke="#d9b45a" stroke-width="5" stroke-linecap="round"/><rect x="590" y="590" width="34" height="10" rx="3" fill="#c4222f" transform="rotate(12 607 595)"/>`);
    add(ball(520, 790, 82) + ball(520, 664, 62) + ball(520, 560, 48));
    add(`<circle cx="520" cy="640" r="7" fill="#1d1a1a"/><circle cx="520" cy="668" r="7" fill="#1d1a1a"/><circle cx="520" cy="696" r="7" fill="#1d1a1a"/>`);
    add(arm(468, 660, -80, -40, '#2a5aa8') + arm(572, 660, 40, -50, '#2a5aa8'));
    add(scarf(520, 602, 92, 'url(#plaidR)', '#f0c64a'));
    add(face(520, 556, 48, {}));
    add(`<rect x="470" y="512" width="100" height="12" rx="6" fill="#1b1b22"/><rect x="484" y="448" width="72" height="70" rx="6" fill="#1b1b22"/><rect x="484" y="500" width="72" height="12" fill="#c4222f"/>${K.berries(552, 504)}<path d="M538 500 q8 -10 18 -4 q-6 8 -18 4Z" fill="#2c6b40"/>`);
    // Mum: earmuffs, pink scarf, flower
    add(`<ellipse cx="760" cy="870" rx="90" ry="16" fill="#a9bad6" opacity=".7"/>`);
    add(ball(760, 806, 72) + ball(760, 696, 54) + ball(760, 604, 43));
    add(`<circle cx="760" cy="680" r="6" fill="#c4222f"/><circle cx="760" cy="704" r="6" fill="#c4222f"/><circle cx="760" cy="728" r="6" fill="#c4222f"/>`);
    add(arm(712, 690, -50, 30, '#e86a9a') + arm(808, 690, 70, -30, '#e86a9a'));
    add(scarf(760, 642, 84, '#e86a9a', '#fff', -1));
    add(face(760, 600, 43, { noseDir: -1 }));
    add(`<path d="M722 584 Q760 530 798 584" stroke="#7a2a5a" stroke-width="7" fill="none"/><circle cx="720" cy="594" r="15" fill="#f6d0e0"/><circle cx="800" cy="594" r="15" fill="#f6d0e0"/><circle cx="720" cy="594" r="15" fill="none" stroke="#e86a9a" stroke-width="3"/><circle cx="800" cy="594" r="15" fill="none" stroke="#e86a9a" stroke-width="3"/>`);
    add(`<g transform="translate(790 566)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-9" rx="6" ry="10" fill="#f0c64a" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#c4222f"/></g>`);
    // Kid: beanie with pompom, waving
    add(`<ellipse cx="985" cy="870" rx="70" ry="13" fill="#a9bad6" opacity=".7"/>`);
    add(ball(985, 820, 56) + ball(985, 732, 40));
    add(`<circle cx="985" cy="806" r="5" fill="#1d1a1a"/><circle cx="985" cy="826" r="5" fill="#1d1a1a"/>`);
    add(ball(985, 664, 34));
    add(arm(950, 760, -50, 10, '#1d6b43') + arm(1020, 752, 34, -70, '#1d6b43'));
    add(scarf(985, 696, 66, '#1d6b43', '#f0c64a'));
    add(face(985, 662, 34, {}));
    add(`<path d="M953 650 Q952 612 985 608 Q1018 612 1017 650Z" fill="#2a5aa8"/><rect x="950" y="642" width="70" height="12" rx="5" fill="#f0c64a"/><path d="M960 612 v30 M972 608 v34 M985 606 v36 M998 608 v34 M1010 612 v30" stroke="#1f4a8a" stroke-width="2"/><circle cx="985" cy="604" r="12" fill="#f0c64a"/>`);
    // Baby on the sled
    add(`<g filter="url(#shadow)"><path d="M1076 900 Q1060 900 1062 884 M1062 884 Q1070 906 1100 906 H1240 Q1268 906 1264 882" stroke="#5a3a22" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="1080" y="868" width="176" height="20" rx="5" fill="#b3172b"/><path d="M1084 872 h168 M1084 882 h168" stroke="#8a1422" stroke-width="2"/><path d="M1078 876 Q1030 880 1010 910 Q990 940 1040 950" stroke="#d9b48a" stroke-width="3" fill="none"/></g>`);
    add(ball(1170, 838, 36) + ball(1170, 786, 26));
    add(face(1170, 784, 26, { }));
    add(`<path d="M1145 780 Q1144 748 1170 746 Q1196 748 1195 780 Q1170 770 1145 780Z" fill="#f6d0e0"/><circle cx="1170" cy="744" r="7" fill="#fff"/><path d="M1146 778 q-4 14 -2 20 M1194 778 q4 14 2 20" stroke="#f6d0e0" stroke-width="4"/>`);
    add(`<path d="M1140 808 Q1170 826 1200 808 L1200 818 Q1170 836 1140 818Z" fill="#6cc8ff"/>`);
    // Snow dog
    add(`<ellipse cx="1340" cy="880" rx="80" ry="14" fill="#a9bad6" opacity=".7"/>`);
    add(`<path d="M1392 840 Q1430 810 1418 780" stroke="#5a3a22" stroke-width="6" fill="none" stroke-linecap="round"/>`);
    add(`<ellipse cx="1340" cy="836" rx="64" ry="42" fill="url(#snowball)"/>`);
    add(ball(1300, 868, 16) + ball(1330, 872, 16));
    add(ball(1290, 774, 38));
    add(`<ellipse cx="1262" cy="790" rx="14" ry="26" fill="#e3ebf7" transform="rotate(18 1262 790)"/><ellipse cx="1318" cy="790" rx="14" ry="26" fill="#e3ebf7" transform="rotate(-18 1318 790)"/>`);
    add(`<ellipse cx="1290" cy="790" rx="18" ry="13" fill="#f6f9ff"/><ellipse cx="1290" cy="784" rx="7" ry="5" fill="#1d1a1a"/><circle cx="1276" cy="766" r="4.5" fill="#1d1a1a"/><circle cx="1304" cy="766" r="4.5" fill="#1d1a1a"/><path d="M1282 796 q8 6 16 0" stroke="#1d1a1a" stroke-width="2" fill="none"/>`);
    add(`<path d="M1258 810 Q1290 826 1322 810 L1322 820 Q1290 838 1258 820Z" fill="#c4222f"/><circle cx="1290" cy="826" r="5" fill="url(#gold)"/>`);

    /* banner */
    add(K.ribbonBanner(800, 40, 300, { arch: 36, fill: 'url(#ribbon)' }));
    add(`<rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  A.designs.snowman = {
    id: 'snowman',
    name: 'Snowman Family',
    blurb: 'A whole snow family in scarves and button eyes, with the house lit up behind them.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M540 84 Q800 40 1060 84', size: 40, maxWidth: 470 },
    effects: [
      { type: 'smoke', x: 572, y: 186, rate: 1.6, rise: 14, size: 12, color: '235,238,248', a: 0.4 },
      { type: 'glow', x: 760, y: 560, r: 260, color: '255,200,120', a: 0.18, speed: 1.2 },
      { type: 'twinkle' },
      { type: 'star', x: 1420, y: 226, r: 60 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 140, a: 0.85 },
    ],
    layout: 'snowman',
    keepOut: [[420, 14, 760, 140], [524, 110, 100, 180], [460, 440, 130, 120], [710, 552, 100, 90]],
    day24: { x: 675, y: 202, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/snowman.js', e); }
/* ---- src/layouts/snowman.js ---- */
try {
/* Door layout for "Snowman Family" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["snowman"]=[{"day":1,"x":303,"y":588,"w":126,"h":150,"hinge":"top"},
{"day":2,"x":946,"y":864,"w":138,"h":110,"hinge":"right"},
{"day":3,"x":1312,"y":185,"w":150,"h":142,"hinge":"left"},
{"day":4,"x":1293,"y":49,"w":138,"h":110,"hinge":"right"},
{"day":5,"x":916,"y":525,"w":98,"h":114,"hinge":"left"},
{"day":6,"x":1257,"y":695,"w":150,"h":128,"hinge":"right"},
{"day":7,"x":1034,"y":703,"w":150,"h":146,"hinge":"left"},
{"day":8,"x":37,"y":424,"w":126,"h":116,"hinge":"right"},
{"day":9,"x":675,"y":374,"w":150,"h":128,"hinge":"right"},
{"day":10,"x":126,"y":696,"w":150,"h":144,"hinge":"top"},
{"day":11,"x":174,"y":854,"w":126,"h":110,"hinge":"left"},
{"day":12,"x":1032,"y":513,"w":150,"h":142,"hinge":"top"},
{"day":13,"x":570,"y":568,"w":120,"h":94,"hinge":"left"},
{"day":14,"x":696,"y":829,"w":124,"h":144,"hinge":"top"},
{"day":15,"x":93,"y":212,"w":138,"h":150,"hinge":"right"},
{"day":16,"x":1054,"y":158,"w":92,"h":120,"hinge":"left"},
{"day":17,"x":450,"y":696,"w":116,"h":150,"hinge":"right"},
{"day":18,"x":391,"y":310,"w":120,"h":104,"hinge":"top"},
{"day":19,"x":1268,"y":351,"w":118,"h":150,"hinge":"right"},
{"day":20,"x":452,"y":858,"w":132,"h":106,"hinge":"left"},
{"day":21,"x":56,"y":44,"w":144,"h":150,"hinge":"right"},
{"day":22,"x":1413,"y":514,"w":150,"h":148,"hinge":"left"},
{"day":23,"x":1244,"y":857,"w":150,"h":116,"hinge":"right"},
{"day":24,"x":675,"y":202,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/snowman.js', e); }
/* ---- src/designs/tannenbaum.js ---- */
try {
/* Design — "O Tannenbaum"
   One grand, traditionally decorated tree (red and gold baubles, real candles, gold tinsel)
   in a snowy cobblestone town square at dusk, ringed by half-timbered shop fronts,
   gas lamps, a little Christmas market stall and a group of carolers. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  const houses = [
      [-20, 210, 440, '#efe2c4', '#7a2a22'], [190, 190, 500, '#e8c88f', '#40343e'], [380, 200, 460, '#d9b2a0', '#6b2b24'],
      [580, 170, 420, '#cfd6c4', '#41363f'], [750, 200, 470, '#efe2c4', '#6b2b24'], [950, 180, 440, '#e2c58f', '#40343e'],
      [1130, 200, 500, '#c9d2dc', '#7a2a22'], [1330, 190, 450, '#efd8b8', '#41363f'], [1520, 200, 480, '#d9b2a0', '#6b2b24'],
    ];
  // chimneys sit on the roof slope of these houses; smoke rises from their tops
  const CHIMNEY_HOUSES = [1, 3, 6, 8];
  const chimneyTop = (i) => { const [x, w, h] = houses[i]; const top = 720 - h, peak = top - w * 0.6; return [x + w * 0.74, peak + 0.48 * (top - peak) - 46]; };

  function build() {
    const R = A.util.rng(1712);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#fff1b8', '#ffb347', '#ffe9a8'];
    const GREENS = ['#163b25', '#1b4a2d', '#215636', '#123220'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a'];

    const bulb = (x, y, c, r = 4) => {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".25"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.35)}" fill="#fff" opacity=".8"/>`;
    };
    const pine = (x, y, r) => {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + rr(-0.3, 0.3), l = r * rr(0.9, 1.4); s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2" stroke-linecap="round"/>`; }
      return s;
    };
    const bow = (x, y, s = 1, c = '#b3172b', d = '#7d0d1c') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-14 36 L-8 32 L-4 40 L0 8Z M4 4 L14 36 L8 32 L4 40 L0 8Z" fill="${d}"/><path d="M0 0 C-12 -18 -32 -14 -28 -2 C-25 9 -12 7 0 0Z M0 0 C12 -18 32 -14 28 -2 C25 9 12 7 0 0Z" fill="${c}"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${d}"/></g>`;
    const starPath = (x, y, ro, ri) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); } return d + 'Z'; };

    add(`<defs>
      <linearGradient id="tb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1433"/><stop offset=".42" stop-color="#26306a"/><stop offset=".68" stop-color="#6b4a80"/><stop offset=".86" stop-color="#c77a7e"/><stop offset="1" stop-color="#f0b07c"/></linearGradient>
      <radialGradient id="tb-treeglow" cx="800" cy="480" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".45"/><stop offset=".5" stop-color="#ffa84d" stop-opacity=".12"/><stop offset="1" stop-color="#ffa84d" stop-opacity="0"/></radialGradient>
      <pattern id="tb-cobble" width="46" height="26" patternUnits="userSpaceOnUse"><rect width="46" height="26" fill="#2d2f43"/><ellipse cx="11" cy="7" rx="10" ry="5.5" fill="#575b74"/><ellipse cx="34" cy="7" rx="10" ry="5.5" fill="#4f536b"/><ellipse cx="0" cy="20" rx="10" ry="5.5" fill="#53576f"/><ellipse cx="23" cy="20" rx="10" ry="5.5" fill="#5d6179"/><ellipse cx="46" cy="20" rx="10" ry="5.5" fill="#53576f"/><ellipse cx="9" cy="5" rx="6" ry="2" fill="#8a8ea8" opacity=".5"/><ellipse cx="21" cy="18" rx="6" ry="2" fill="#8a8ea8" opacity=".5"/></pattern>
      <linearGradient id="tb-plazaShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151830" stop-opacity=".75"/><stop offset=".5" stop-color="#151830" stop-opacity=".25"/><stop offset="1" stop-color="#151830" stop-opacity="0"/></linearGradient>
      <linearGradient id="tb-tree" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c5634"/><stop offset=".5" stop-color="#134026"/><stop offset="1" stop-color="#0a2817"/></linearGradient>
      <linearGradient id="tb-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="tb-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="tb-ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <linearGradient id="tb-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset="1" stop-color="#ffb24d"/></linearGradient>
      <radialGradient id="tb-lampglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <radialGradient id="tb-red" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff6a70"/><stop offset=".45" stop-color="#b8101f"/><stop offset="1" stop-color="#5a0710"/></radialGradient>
      <radialGradient id="tb-goldball" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff0b0"/><stop offset=".45" stop-color="#d4a032"/><stop offset="1" stop-color="#6a4410"/></radialGradient>
      <radialGradient id="tb-silver" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#bcc6d0"/><stop offset="1" stop-color="#4f5a66"/></radialGradient>
      <radialGradient id="tb-vig" cx="800" cy="500" r="1000" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05040e" stop-opacity=".6"/></radialGradient>
      <filter id="tb-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="tb-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".45"/></filter>
    </defs>`);

    /* sky + early stars */
    add(`<rect width="${W}" height="760" fill="url(#tb-sky)"/>`);
    for (let i = 0; i < 70; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 260))}" r="${f(rr(0.5, 1.6))}" fill="#fff" opacity="${f(rr(0.3, 0.9))}"/>`);
    add(`<circle cx="1290" cy="120" r="70" fill="#fff4d0" opacity=".08"/><path d="M1290 98 a24 24 0 1 0 14 42 a19 19 0 1 1 -14 -42Z" fill="#fff4d6"/>`);

    /* distant spires */
    add(`<g fill="#33366a" opacity=".9">
      <path d="M210 520 V300 L235 230 L240 150 L245 230 L270 300 V520Z"/><rect x="180" y="380" width="120" height="160"/>
      <path d="M1360 520 V330 h60 V520Z"/><path d="M1352 330 L1390 250 L1428 330Z"/><circle cx="1390" cy="360" r="14" fill="#f3d58a" opacity=".85"/>
    </g>`);

    /* half-timbered houses */

    houses.forEach(([x, w, h, wall, roof], hi) => {
      const top = 720 - h, peak = top - w * 0.6;
      add(`<g>`);
      add(`<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${wall}"/>`);
      add(`<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="#1c1d3a" opacity=".22"/>`);
      // gable
      if (CHIMNEY_HOUSES.includes(hi)) { const [ccx, cty] = chimneyTop(hi); add(`<rect x="${f(ccx - 12)}" y="${f(cty)}" width="24" height="70" fill="#6b3a2a"/><path d="M${f(ccx - 12)} ${f(cty + 14)} h24 M${f(ccx - 12)} ${f(cty + 30)} h24" stroke="#4a2418" stroke-width="2"/><rect x="${f(ccx - 15)}" y="${f(cty - 6)}" width="30" height="9" rx="3" fill="#f4f7ff"/>`); }
      add(`<path d="M${x - 12} ${top + 4} L${x + w / 2} ${peak} L${x + w + 12} ${top + 4}Z" fill="${roof}"/>`);
      add(`<path d="M${x + 14} ${top} L${x + w / 2} ${peak + 24} L${x + w - 14} ${top}Z" fill="${wall}"/><path d="M${x + 14} ${top} L${x + w / 2} ${peak + 24} L${x + w - 14} ${top}Z" fill="#1c1d3a" opacity=".3"/>`);
      // snow on the gable edges
      add(`<path d="M${x - 16} ${top + 6} L${x + w / 2} ${peak - 4} L${x + w + 16} ${top + 6} L${x + w + 8} ${top + 14} L${x + w / 2} ${peak + 10} L${x - 8} ${top + 14}Z" fill="#f4f7ff"/>`);
      for (let k = 0; k < 6; k++) { const t = rr(0.05, 0.95); const ex = x - 12 + t * (w + 24); const ey = top + 12 - (1 - Math.abs(t - 0.5) * 2) * (top - peak - 10); add(`<path d="M${f(ex - 3)} ${f(ey)} q3 ${f(rr(6, 14))} 6 0Z" fill="#f4f7ff"/>`); }
      // timber frame
      const beam = '#4a2a17';
      let tf = `<g stroke="${beam}" stroke-width="7" fill="none" stroke-linecap="square">`;
      tf += `<path d="M${x + 3} ${top} V720 M${x + w - 3} ${top} V720"/>`;
      for (let y = top + 115; y < 610; y += 115) tf += `<path d="M${x} ${y} H${x + w}"/>`;
      for (let y = top; y < 600; y += 115) { const yb = Math.min(y + 115, 610); tf += `<path d="M${x + w / 2} ${y} V${yb} M${x + 6} ${yb - 6} L${x + w * 0.22} ${y + 6} M${x + w - 6} ${yb - 6} L${x + w * 0.78} ${y + 6}"/>`; }
      tf += `<path d="M${x + w / 2} ${peak + 26} V${top} M${x + w * 0.3} ${top - 6} L${x + w / 2} ${top - 40} L${x + w * 0.7} ${top - 6}"/></g>`;
      add(tf);
      // windows on upper floors
      for (let y = top + 30; y < 560; y += 115) {
        [x + w * 0.25, x + w * 0.75].forEach((wx) => {
          const lit = R() < 0.72;
          add(`<rect x="${f(wx - 22)}" y="${y}" width="44" height="56" fill="${lit ? 'url(#tb-win)' : '#2a3358'}" stroke="#3a2214" stroke-width="4"/><path d="M${f(wx)} ${y} v56 M${f(wx - 22)} ${y + 24} h44" stroke="#3a2214" stroke-width="3"/>`);
          if (lit) add(`<rect x="${f(wx - 30)}" y="${y - 8}" width="60" height="72" fill="#ffd27a" opacity=".12"/>`);
          add(`<rect x="${f(wx - 28)}" y="${y + 56}" width="56" height="9" fill="#5a3218"/><path d="M${f(wx - 30)} ${y + 56} q30 -6 60 0" stroke="#f4f7ff" stroke-width="4" fill="none"/>`);
          if (R() < 0.5) for (let k = 0; k < 5; k++) add(pine(wx - 22 + k * 11, y + 66, 6));
        });
      }
      // attic round window
      add(`<circle cx="${x + w / 2}" cy="${f(top - (top - peak) * 0.35)}" r="13" fill="${R() < 0.6 ? '#ffcf70' : '#2a3358'}" stroke="#3a2214" stroke-width="3"/>`);
      // ground floor shop
      const awn = hi % 3 === 0 ? ['#b3172b', '#f6efe2'] : hi % 3 === 1 ? ['#1d6b43', '#f6efe2'] : ['#2a4f8a', '#f6efe2'];
      add(`<rect x="${x + 16}" y="628" width="${w * 0.52}" height="80" fill="url(#tb-win)"/><rect x="${x + 16}" y="628" width="${w * 0.52}" height="80" fill="none" stroke="#3a2214" stroke-width="5"/>`);
      for (let k = 1; k < 3; k++) add(`<path d="M${f(x + 16 + (w * 0.52 * k) / 3)} 628 v80" stroke="#3a2214" stroke-width="3"/>`);
      // little shop goods in the window
      for (let k = 0; k < 4; k++) add(`<circle cx="${f(x + 30 + k * w * 0.12)}" cy="${f(rr(682, 698))}" r="${f(rr(5, 9))}" fill="${pick(['#b3172b', '#d9a83a', '#1d6b43', '#8a4a1f'])}"/>`);
      let aw = `M${x + 8} 604 H${x + 24 + w * 0.52} V622`;
      const sc = 6, sw = (w * 0.52 + 16) / sc;
      for (let k = sc; k > 0; k--) aw += ` Q${f(x + 8 + sw * (k - 0.5))} 638 ${f(x + 8 + sw * (k - 1))} 622`;
      add(`<path d="${aw}Z" fill="${awn[0]}"/>`);
      for (let k = 0; k < sc; k += 2) add(`<path d="M${f(x + 8 + sw * k)} 604 h${f(sw)} v18 q${f(-sw / 2)} 16 ${f(-sw)} 0Z" fill="${awn[1]}"/>`);
      add(`<path d="M${x + 6} 603 H${x + 26 + w * 0.52}" stroke="#f4f7ff" stroke-width="6" stroke-linecap="round"/>`);
      // door with wreath
      const dx = x + w * 0.74;
      add(`<path d="M${f(dx - 22)} 720 V650 q22 -22 44 0 V720Z" fill="#5a2a18" stroke="#3a2214" stroke-width="4"/>`);
      let wr = ''; for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28; wr += pine(dx + Math.cos(a) * 11, 672 + Math.sin(a) * 11, 5); }
      add(wr + `<circle cx="${f(dx)}" cy="684" r="3" fill="#b3172b"/>`);
      add(`<rect x="${x}" y="712" width="${w}" height="10" fill="#f4f7ff"/>`);
      add(`</g>`);
    });

    /* the plaza */
    add(`<rect y="720" width="${W}" height="280" fill="url(#tb-cobble)"/><rect y="720" width="${W}" height="280" fill="url(#tb-plazaShade)"/>`);
    add(`<path d="M0 724 H${W} V742 Q1300 736 1100 748 Q800 740 500 750 Q250 738 0 746Z" fill="#eef2ff"/>`);
    for (let i = 0; i < 22; i++) add(`<ellipse cx="${f(rr(0, W))}" cy="${f(rr(770, 990))}" rx="${f(rr(30, 110))}" ry="${f(rr(6, 16))}" fill="#eef2ff" opacity="${f(rr(0.55, 0.95))}"/>`);
    add(`<path d="M0 940 Q200 905 420 935 Q620 960 800 930 Q1000 905 1200 936 Q1420 965 1600 925 V1000 H0Z" fill="#f2f5ff"/><path d="M0 960 Q300 935 600 962 Q900 980 1200 955 Q1420 940 1600 960 V1000 H0Z" fill="#dfe6f7"/>`);
    // footprints
    for (let i = 0; i < 18; i++) add(`<ellipse cx="${f(560 + i * 26 + (i % 2) * 8)}" cy="${f(990 - i * 13)}" rx="5" ry="3" fill="#aeb8d4"/>`);

    /* tree glow */
    add(`<rect width="${W}" height="${H}" fill="url(#tb-treeglow)"/>`);

    /* the great tree */
    const cx = 800;
    const tiers = [[560, 770, 300], [440, 650, 262], [320, 530, 212], [210, 410, 160], [104, 292, 104]];
    add(`<ellipse cx="${cx}" cy="780" rx="320" ry="30" fill="#000" opacity=".4" filter="url(#tb-soft)"/>`);
    add(`<rect x="${cx - 22}" y="730" width="44" height="50" fill="#4a2614"/>`);
    const tierPath = (y0, y1, hw) => {
      let d = `M${cx} ${y0} Q${f(cx - hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx - hw} ${y1}`;
      const n = Math.round(hw / 26), step = (2 * hw) / n;
      for (let i = 0; i < n; i++) d += ` Q${f(cx - hw + step * (i + 0.5))} ${y1 + 16} ${f(cx - hw + step * (i + 1))} ${i < n - 1 ? y1 - 3 : y1}`;
      return d + ` Q${f(cx + hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${y0}Z`;
    };
    const inTier = (x, y, t) => { const [y0, y1, hw] = t; if (y < y0 + (y1 - y0) * 0.3 || y > y1 - 8) return false; return Math.abs(x - cx) < hw * ((y - y0) / (y1 - y0)) * 0.86; };
    tiers.forEach((t, i) => {
      const [y0, y1, hw] = t;
      if (i > 0) add(`<path d="${tierPath(y0 + 12, y1 + 12, hw)}" fill="#000" opacity=".3" filter="url(#tb-soft)"/>`);
      add(`<path d="${tierPath(y0, y1, hw)}" fill="url(#tb-tree)"/>`);
      let nd = '';
      for (let k = 0; k < hw * 2.2; k++) {
        const y = rr(y0 + (y1 - y0) * 0.15, y1 + 6), span = hw * ((y - y0) / (y1 - y0)), x = cx + rr(-span, span) * 0.98, dir = x < cx ? -1 : 1, len = rr(10, 22);
        nd += `<path d="M${f(x)} ${f(y)} l${f(dir * len * 0.7)} ${f(len * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="${f(rr(1.6, 2.8))}" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
      }
      add(nd);
      // snow resting on the branch tips
      add(`<path d="${tierPath(y1 - 10, y1 + 2, hw * 0.97).replace(/Z$/, '')}" stroke="#f2f6ff" stroke-width="5" fill="none" opacity=".75"/>`);
      if (i < 4) {
        const ya = y0 + (y1 - y0) * 0.5, yb = y0 + (y1 - y0) * 0.88;
        add(`<path d="M${f(cx - hw * 0.55)} ${f(ya)} Q${cx} ${f(yb + 40)} ${f(cx + hw * 0.85)} ${f(yb - 6)}" stroke="url(#tb-gold)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`);
        add(`<path d="M${f(cx + hw * 0.5)} ${f(ya + 10)} Q${cx} ${f(yb + 10)} ${f(cx - hw * 0.8)} ${f(yb + 4)}" stroke="#c0182c" stroke-width="7" fill="none" opacity=".85"/>`);
      }
    });
    const placed = [];
    const tryPlace = (minD) => {
      for (let k = 0; k < 400; k++) {
        const t = tiers[Math.floor(R() * tiers.length)];
        const x = rr(cx - t[2], cx + t[2]), y = rr(t[0], t[1]);
        if (!inTier(x, y, t)) continue;
        if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue;
        return [x, y];
      }
      return null;
    };
    const balls = ['tb-red', 'tb-goldball', 'tb-red', 'tb-silver', 'tb-goldball', 'tb-red'];
    for (let i = 0; i < 46; i++) {
      const p = tryPlace(24); if (!p) continue;
      const r = rr(10, 17); placed.push([p[0], p[1], r]);
      add(`<path d="M${f(p[0])} ${f(p[1] - r - 4)} v-8" stroke="#c9a24a" stroke-width="1"/><rect x="${f(p[0] - 4)}" y="${f(p[1] - r - 5)}" width="8" height="6" rx="1" fill="url(#tb-gold)"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#${balls[i % balls.length]})"/>`);
    }
    // straw stars
    for (let i = 0; i < 10; i++) {
      const p = tryPlace(20); if (!p) continue; placed.push([p[0], p[1], 12]);
      add(`<g stroke="#f1d58e" stroke-width="2.4" stroke-linecap="round">${[0, 45, 90, 135].map((a) => `<path d="M${f(p[0] - Math.cos((a * Math.PI) / 180) * 12)} ${f(p[1] - Math.sin((a * Math.PI) / 180) * 12)} L${f(p[0] + Math.cos((a * Math.PI) / 180) * 12)} ${f(p[1] + Math.sin((a * Math.PI) / 180) * 12)}"/>`).join('')}</g><circle cx="${f(p[0])}" cy="${f(p[1])}" r="2.5" fill="#c4222f"/>`);
    }
    // real candles on the branches
    for (let i = 0; i < 20; i++) {
      const p = tryPlace(26); if (!p) continue; placed.push([p[0], p[1], 10]);
      const [x, y] = p;
      add(`<rect x="${f(x - 3.5)}" y="${f(y - 22)}" width="7" height="22" rx="1.5" fill="#fbf4e2"/><path d="M${f(x - 7)} ${f(y)} h14 l-3 5 h-8Z" fill="url(#tb-gold)"/>`);
      candles.push({ x, y: y - 24, s: 0.6 });
    }
    for (let i = 0; i < 70; i++) { const p = tryPlace(9); if (!p) continue; placed.push([p[0], p[1], 5]); add(bulb(p[0], p[1], BULB[i % BULB.length], 3.4)); }
    add(`<circle cx="${cx}" cy="96" r="70" fill="url(#tb-lampglow)"/><path d="${starPath(cx, 98, 42, 17)}" fill="url(#tb-gold)" stroke="#8a5a14" stroke-width="2"/><path d="${starPath(cx, 98, 20, 8)}" fill="#fff6c8" opacity=".7"/>`);

    /* fence ring around the tree */
    add(`<path d="M470 790 Q800 840 1130 790" stroke="#5a3218" stroke-width="9" fill="none"/><path d="M470 770 Q800 820 1130 770" stroke="#6b3d1f" stroke-width="7" fill="none"/>`);
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, x = 470 + t * 660, y = 770 + Math.sin(t * Math.PI) * 25;
      add(`<rect x="${f(x - 6)}" y="${f(y - 18)}" width="12" height="44" fill="#6b3d1f"/><path d="M${f(x - 8)} ${f(y - 18)} q8 -9 16 0Z" fill="#f2f6ff"/>`);
    }
    add(`<path d="M466 768 Q800 816 1134 768" stroke="#f2f6ff" stroke-width="4" fill="none"/>`);
    // presents inside the ring
    [[640, 742, 60, 46, '#b3172b', '#e9c060'], [700, 760, 54, 40, '#1d6b43', '#f6efe2'], [880, 750, 66, 48, '#d9a83a', '#a3172a'], [945, 768, 50, 36, '#2a4f8a', '#f6efe2']].forEach(([x, y, w, h, c, r]) => {
      add(`<g filter="url(#tb-shadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x + w / 2 - 5}" y="${y}" width="10" height="${h}" fill="${r}"/><rect x="${x}" y="${y + h / 2 - 5}" width="${w}" height="10" fill="${r}"/><path d="M${x} ${y} h${w}" stroke="#f2f6ff" stroke-width="4"/></g>${bow(x + w / 2, y, 0.5, r, '#00000055')}`);
    });

    /* market stall (left) */
    add(`<g filter="url(#tb-shadow)">
      <rect x="70" y="690" width="300" height="150" fill="#6b3d1f"/><rect x="70" y="690" width="300" height="150" fill="url(#tb-win)" opacity=".18"/>
      <rect x="56" y="780" width="328" height="20" fill="#8a5228"/><rect x="62" y="800" width="316" height="70" fill="#5a3218"/>
      <path d="M40 700 L220 610 L400 700Z" fill="#7a2a22"/><path d="M34 704 L220 600 L406 704 L396 716 L220 620 L44 716Z" fill="#f4f7ff"/>
      <rect x="78" y="700" width="10" height="170" fill="#4a2614"/><rect x="352" y="700" width="10" height="170" fill="#4a2614"/>
    </g>`);
    for (let k = 0; k < 7; k++) {
      const hx = 104 + k * 38, hy = 724 + (k % 2) * 10;
      add(`<path d="M${hx} ${hy - 22} v10" stroke="#c4222f" stroke-width="1.5"/><path d="M${hx} ${hy + 14} C${hx - 20} ${hy} ${hx - 14} ${hy - 14} ${hx} ${hy - 6} C${hx + 14} ${hy - 14} ${hx + 20} ${hy} ${hx} ${hy + 14}Z" fill="#9a5a2a"/><path d="M${hx} ${hy + 8} C${hx - 12} ${hy - 1} ${hx - 9} ${hy - 9} ${hx} ${hy - 3} C${hx + 9} ${hy - 9} ${hx + 12} ${hy - 1} ${hx} ${hy + 8}Z" fill="none" stroke="#fff" stroke-width="1.6"/>`);
    }
    [[120, 770], [160, 772], [300, 770]].forEach(([mx, my]) => add(`<rect x="${mx - 9}" y="${my}" width="18" height="16" rx="2" fill="#b3172b"/><path d="M${mx + 9} ${my + 4} q7 0 6 6 q-1 4 -6 4" stroke="#b3172b" stroke-width="3" fill="none"/>`));
    for (let k = 0; k <= 12; k++) { const t = k / 12; add(bulb(52 + t * 336, 706 - Math.sin(t * Math.PI) * 0 + (k % 2) * 3, BULB[k % BULB.length], 3.2)); }

    /* gas lamps */
    const lamp = (x, base, top) => {
      lights.push({ x, y: top + 22, c: '#ffd98a', r: 7 });
      return `<g><circle cx="${x}" cy="${top + 22}" r="70" fill="url(#tb-lampglow)"/>
        <rect x="${x - 5}" y="${top + 40}" width="10" height="${base - top - 40}" fill="#1b1a26"/><rect x="${x - 12}" y="${base - 18}" width="24" height="18" rx="3" fill="#1b1a26"/>
        <path d="M${x - 9} ${top + 52} h18 M${x - 6} ${top + 70} h12" stroke="#2c2a3a" stroke-width="4"/>
        <path d="M${x - 18} ${top + 8} h36 l-5 32 h-26Z" fill="#ffe3a0"/><path d="M${x - 18} ${top + 8} h36 l-5 32 h-26Z M${x} ${top + 8} v32" fill="none" stroke="#1b1a26" stroke-width="3"/>
        <path d="M${x - 22} ${top + 8} L${x} ${top - 10} L${x + 22} ${top + 8}Z" fill="#1b1a26"/><path d="M${x - 22} ${top + 6} L${x} ${top - 12} L${x + 22} ${top + 6}" stroke="#f4f7ff" stroke-width="5" fill="none"/>
        <rect x="${x - 6}" y="${top + 40}" width="12" height="6" fill="#1b1a26"/>${bow(x, top + 90, 0.45)}</g>`;
    };
    add(lamp(470, 880, 600)); add(lamp(1130, 880, 600)); add(lamp(30, 960, 690)); add(lamp(1570, 960, 690));

    /* carolers (right) */
    const caroler = (x, y, s, coat, hat, scarf) => {
      let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
      g += `<ellipse cx="0" cy="2" rx="30" ry="6" fill="#000" opacity=".3"/>`;
      g += `<path d="M-22 0 L-16 -78 Q0 -90 16 -78 L22 0Z" fill="${coat}"/>`;
      g += `<path d="M-14 -78 Q0 -70 14 -78 L12 -66 Q0 -60 -12 -66Z" fill="${scarf}"/><path d="M8 -70 l4 26 l-8 -2Z" fill="${scarf}"/>`;
      g += `<circle cx="0" cy="-94" r="13" fill="#f0c8a8"/><path d="M-5 -92 a2 2 0 0 0 0 0" stroke="#3a2214" stroke-width="2"/>`;
      g += `<ellipse cx="-4" cy="-88" rx="4" ry="5" fill="#2a160a" opacity=".85"/>`;
      if (hat === 'top') g += `<rect x="-11" y="-132" width="22" height="30" fill="#14131c"/><rect x="-17" y="-104" width="34" height="5" rx="2" fill="#14131c"/><rect x="-11" y="-112" width="22" height="5" fill="#a3172a"/>`;
      else if (hat === 'bonnet') g += `<path d="M-17 -96 Q-18 -120 0 -118 Q18 -120 17 -96 Q10 -108 0 -108 Q-10 -108 -17 -96Z" fill="${scarf}"/><path d="M-12 -94 l-6 18 M12 -94 l6 18" stroke="${scarf}" stroke-width="3"/>`;
      else g += `<path d="M-14 -100 Q0 -126 14 -100Z" fill="${scarf}"/><circle cx="0" cy="-122" r="6" fill="#f4f7ff"/>`;
      g += `<rect x="-14" y="-62" width="22" height="16" rx="2" fill="#f4eee0" transform="rotate(-8)"/><path d="M-3 -62 v16" stroke="#b3172b" stroke-width="1.5" transform="rotate(-8)"/>`;
      return g + '</g>';
    };
    add(caroler(1250, 900, 1.05, '#2a2340', 'top', '#b3172b'));
    add(caroler(1305, 905, 0.95, '#5a2030', 'bonnet', '#1d6b43'));
    add(caroler(1360, 898, 1.1, '#1f3550', 'top', '#e0b24a'));
    add(caroler(1412, 908, 0.85, '#3a4a2a', 'knit', '#c4222f'));
    // lantern on a pole
    add(`<path d="M1460 910 L1440 760" stroke="#3a2214" stroke-width="5"/><path d="M1440 760 v12" stroke="#1b1a26" stroke-width="2"/><rect x="1430" y="772" width="20" height="26" rx="3" fill="#ffe3a0" stroke="#1b1a26" stroke-width="3"/><circle cx="1440" cy="785" r="40" fill="url(#tb-lampglow)"/>`);
    candles.push({ x: 1440, y: 788, s: 0.5 });

    /* bottom ribbon (title) */
    add(`<g filter="url(#tb-shadow)">
      <path d="M548 900 L452 894 L480 934 L452 972 L560 966Z" fill="url(#tb-ribbonDark)"/>
      <path d="M1052 900 L1148 894 L1120 934 L1148 972 L1040 966Z" fill="url(#tb-ribbonDark)"/>
      <path d="M520 884 L560 906 L560 958 L520 950Z" fill="#4a0711"/><path d="M1080 884 L1040 906 L1040 958 L1080 950Z" fill="#4a0711"/>
      <path d="M520 884 Q800 846 1080 884 L1080 950 Q800 912 520 950Z" fill="url(#tb-ribbon)"/>
      <path d="M528 893 Q800 856 1072 893 M528 941 Q800 904 1072 941" stroke="url(#tb-gold)" stroke-width="3" fill="none"/>
    </g>`);
    for (let i = 0; i < 9; i++) add(pine(470 + i * 8, 900 + (i % 3) * 6, 8));
    for (let i = 0; i < 9; i++) add(pine(1066 + i * 8, 900 + (i % 3) * 6, 8));
    add(`<rect width="${W}" height="${H}" fill="url(#tb-vig)"/>`);

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  A.designs.tannenbaum = {
    id: 'tannenbaum',
    name: 'O Tannenbaum',
    blurb: 'One grand traditional tree glowing in a snowy town square.',
    width: W, height: H, build,
    title: { path: 'M560 924 Q800 880 1040 924', size: 40, maxWidth: 440 },
    effects: [
      { type: 'roomGlow', x: 800, y: 470, r: 700, color: '255,190,110', a: 0.06, flicker: 0.02 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'star', x: 800, y: 98, r: 80 },
      { type: 'smoke', x: 120, y: 764, rate: 1.4, rise: 16, size: 5, a: 0.3 },
      ...CHIMNEY_HOUSES.map((i) => { const [x, y] = chimneyTop(i); return { type: 'smoke', x, y: y - 6, rate: 1.2, rise: 14, size: 9, a: 0.2, color: '205,205,228' }; }),
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 170 },
    ],
    layout: 'tannenbaum',
    keepOut: [[440, 846, 720, 140], [730, 44, 140, 124]],
    day24: { x: 715, y: 430, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/tannenbaum.js', e); }
/* ---- src/layouts/tannenbaum.js ---- */
try {
/* Door layout for "O Tannenbaum" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["tannenbaum"]=[{"day":1,"x":709,"y":292,"w":150,"h":116,"hinge":"left"},
{"day":2,"x":398,"y":719,"w":94,"h":120,"hinge":"right"},
{"day":3,"x":1213,"y":815,"w":150,"h":128,"hinge":"right"},
{"day":4,"x":180,"y":637,"w":150,"h":136,"hinge":"left"},
{"day":5,"x":571,"y":170,"w":114,"h":100,"hinge":"top"},
{"day":6,"x":220,"y":368,"w":150,"h":136,"hinge":"right"},
{"day":7,"x":893,"y":65,"w":150,"h":122,"hinge":"right"},
{"day":8,"x":996,"y":534,"w":126,"h":98,"hinge":"top"},
{"day":9,"x":47,"y":322,"w":134,"h":150,"hinge":"top"},
{"day":10,"x":871,"y":282,"w":106,"h":132,"hinge":"right"},
{"day":11,"x":229,"y":57,"w":150,"h":128,"hinge":"right"},
{"day":12,"x":726,"y":692,"w":128,"h":150,"hinge":"left"},
{"day":13,"x":353,"y":211,"w":150,"h":140,"hinge":"left"},
{"day":14,"x":236,"y":827,"w":150,"h":134,"hinge":"left"},
{"day":15,"x":1398,"y":47,"w":140,"h":150,"hinge":"left"},
{"day":16,"x":376,"y":531,"w":116,"h":144,"hinge":"right"},
{"day":17,"x":1142,"y":527,"w":150,"h":130,"hinge":"top"},
{"day":18,"x":1427,"y":493,"w":118,"h":150,"hinge":"left"},
{"day":19,"x":892,"y":706,"w":150,"h":120,"hinge":"right"},
{"day":20,"x":1259,"y":683,"w":132,"h":102,"hinge":"right"},
{"day":21,"x":26,"y":521,"w":126,"h":102,"hinge":"right"},
{"day":22,"x":1414,"y":327,"w":126,"h":106,"hinge":"top"},
{"day":23,"x":1251,"y":267,"w":150,"h":118,"hinge":"left"},
{"day":24,"x":715,"y":430,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/tannenbaum.js', e); }
/* ---- src/designs/train.js ---- */
try {
/* Design — "North Pole Express"
   A steam train crossing a timber trestle at night: lit carriage windows, a puffing
   locomotive, a little station with a clock and lamps, snowy pines and mountains. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1225 + 77);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a'];

    function bulb(x, y, c, r = 3.6) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function sprig(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + rr(-0.3, 0.3), l = r * rr(0.9, 1.4); s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2" stroke-linecap="round"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/></g>`;
    }
    function pine(x, base, h, col, snow, tiers = 5) {
      let s = '';
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers, top = base - h + t * h * 0.78, bot = top + h * 0.34, w = h * (0.12 + t * 0.2);
        s += `<path d="M${f(x)} ${f(top)} L${f(x - w)} ${f(bot)} Q${f(x)} ${f(bot + h * 0.04)} ${f(x + w)} ${f(bot)}Z" fill="${col}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(top + 2)} L${f(x - w * 0.8)} ${f(bot - 3)} Q${f(x - w * 0.3)} ${f(bot - h * 0.05)} ${f(x + w * 0.1)} ${f(bot - h * 0.09)} Q${f(x + w * 0.45)} ${f(bot - h * 0.02)} ${f(x + w * 0.78)} ${f(bot - 4)}Z" fill="${snow}" opacity=".9"/>`;
      }
      return s;
    }

    add(`<defs>
      <linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030820"/><stop offset=".45" stop-color="#0e1e46"/><stop offset=".8" stop-color="#2e3a6e"/><stop offset="1" stop-color="#5a4f80"/></linearGradient>
      <radialGradient id="tr-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8dc" stop-opacity=".85"/><stop offset=".3" stop-color="#fff0c0" stop-opacity=".25"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></radialGradient>
      <linearGradient id="tr-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6d9e"/><stop offset="1" stop-color="#28325c"/></linearGradient>
      <linearGradient id="tr-mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4778"/><stop offset="1" stop-color="#1a2246"/></linearGradient>
      <linearGradient id="tr-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f1fb"/><stop offset="1" stop-color="#9fb3d4"/></linearGradient>
      <linearGradient id="tr-cliff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2b2f4e"/><stop offset="1" stop-color="#1a1d36"/></linearGradient>
      <linearGradient id="tr-timber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3a26"/><stop offset="1" stop-color="#3a2416"/></linearGradient>
      <linearGradient id="tr-boiler" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4f5c"/><stop offset=".35" stop-color="#1c1f27"/><stop offset="1" stop-color="#0b0c10"/></linearGradient>
      <linearGradient id="tr-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c42a36"/><stop offset="1" stop-color="#7a1019"/></linearGradient>
      <linearGradient id="tr-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7a4e"/><stop offset="1" stop-color="#123f27"/></linearGradient>
      <linearGradient id="tr-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="tr-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset="1" stop-color="#ffb24d"/></linearGradient>
      <linearGradient id="tr-beam" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff2c0" stop-opacity=".55"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></linearGradient>
      <linearGradient id="tr-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c8a56"/><stop offset=".5" stop-color="#1b6a3e"/><stop offset="1" stop-color="#0f4527"/></linearGradient>
      <linearGradient id="tr-ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#155232"/><stop offset="1" stop-color="#0a2d1a"/></linearGradient>
      <linearGradient id="tr-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4f7e"/><stop offset="1" stop-color="#1f2b4f"/></linearGradient>
      <radialGradient id="tr-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="tr-vig" cx="800" cy="500" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#02030c" stop-opacity=".6"/></radialGradient>
      <filter id="tr-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="tr-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="tr-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
    </defs>`);

    /* ---------- sky, moon, stars ---------- */
    add(`<rect width="${W}" height="${H}" fill="url(#tr-sky)"/>`);
    let st = '';
    for (let i = 0; i < 300; i++) st += `<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 520))}" r="${f(rr(0.4, 1.5))}" fill="#fff" opacity="${f(rr(0.25, 0.95))}"/>`;
    add(st);
    for (let i = 0; i < 26; i++) { const x = rr(20, W - 20), y = rr(20, 420); add(`<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="#fff"/>`); lights.push({ x, y, c: '#eef4ff', r: 1.6 }); }
    add(`<circle cx="1340" cy="225" r="200" fill="url(#tr-moon)"/><circle cx="1340" cy="225" r="58" fill="#fff6d6"/><circle cx="1322" cy="210" r="11" fill="#ece0b8" opacity=".6"/><circle cx="1360" cy="244" r="8" fill="#ece0b8" opacity=".55"/><circle cx="1350" cy="200" r="5" fill="#ece0b8" opacity=".5"/>`);
    // drifting clouds
    add(`<g opacity=".35" filter="url(#tr-soft)"><ellipse cx="300" cy="230" rx="160" ry="16" fill="#8d97c8"/><ellipse cx="1080" cy="300" rx="200" ry="14" fill="#8d97c8"/><ellipse cx="1500" cy="330" rx="120" ry="12" fill="#a6aed8"/></g>`);

    /* ---------- mountains, forest ---------- */
    function range(base, peaks, fill, cap) {
      let d = `M-20 ${base}`, caps = '';
      peaks.forEach(([x, y]) => {
        d += ` L${f(x - rr(60, 110))} ${f(y + rr(60, 110))} L${x} ${y} L${f(x + rr(60, 110))} ${f(y + rr(60, 100))}`;
        const c = rr(30, 50);
        caps += `<path d="M${x} ${y} L${f(x - c)} ${f(y + c * 0.9)} L${f(x - c * 0.4)} ${f(y + c * 0.7)} L${f(x - c * 0.1)} ${f(y + c)} L${f(x + c * 0.25)} ${f(y + c * 0.72)} L${f(x + c * 0.7)} ${f(y + c * 0.95)}Z" fill="${cap}"/>`;
      });
      return `<path d="${d} L${W + 20} ${base} V${H} H-20Z" fill="${fill}"/>${caps}`;
    }
    add(range(560, [[120, 380], [380, 340], [640, 390], [900, 350], [1120, 395], [1420, 360], [1580, 400]], 'url(#tr-mtn)', '#dfe8f8'));
    add(range(600, [[250, 450], [520, 470], [780, 440], [1040, 480], [1300, 450], [1520, 470]], 'url(#tr-mtn2)', '#b7c6e4'));
    let forest = '';
    for (let x = -10; x < W + 10; x += rr(14, 26)) forest += pine(x, 640 + rr(-8, 8), rr(50, 90), '#0f1c33', '#c8d6ee', 4);
    add(forest);

    /* ---------- ravine, frozen river ---------- */
    add(`<path d="M0 640 H1600 V1000 H0Z" fill="#1c2340"/>`);
    add(`<path d="M260 900 Q800 870 1340 900 L1340 1000 L260 1000Z" fill="url(#tr-ice)"/>`);
    let gl = '';
    for (let i = 0; i < 30; i++) gl += `<rect x="${f(rr(300, 1300))}" y="${f(rr(890, 990))}" width="${f(rr(20, 90))}" height="1.5" fill="#cfe0ff" opacity="${f(rr(0.1, 0.3))}"/>`;
    add(gl);
    // ravine walls
    add(`<path d="M0 600 L300 606 Q330 700 300 780 Q280 860 330 1000 L0 1000Z" fill="url(#tr-cliff)"/>
      <path d="M1600 600 L1310 606 Q1280 700 1310 790 Q1330 860 1280 1000 L1600 1000Z" fill="url(#tr-cliff)"/>
      <path d="M0 596 L304 602 Q318 640 312 660 Q200 640 0 650Z" fill="url(#tr-snow)"/>
      <path d="M1600 596 L1306 602 Q1292 640 1300 660 Q1420 640 1600 650Z" fill="url(#tr-snow)"/>`);
    // snow ledges on cliffs
    for (let i = 0; i < 10; i++) { const left = i % 2 === 0, y = rr(700, 960); const x = left ? rr(220, 300) : rr(1300, 1380); add(`<path d="M${f(x - 30)} ${f(y)} q30 -10 60 0 q-30 6 -60 0Z" fill="#dfe8f8" opacity=".8"/>`); }

    // snowy hills and pines on the ravine floor, behind the trestle
    add(`<path d="M280 760 Q500 700 760 750 Q1000 800 1330 730 L1330 900 L280 900Z" fill="#2d3a64"/><path d="M280 760 Q500 700 760 750 Q1000 800 1330 730" stroke="#b9c8e6" stroke-width="4" fill="none" opacity=".7"/>`);
    let rp = '';
    for (let x = 300; x < 1320; x += rr(26, 44)) rp += pine(x, 770 + Math.sin(x / 140) * 26 + rr(0, 30), rr(60, 110), '#14213d', '#c8d6ee', 4);
    add(rp);
    add(`<path d="M280 850 Q520 800 800 840 Q1060 880 1330 830 L1330 905 L280 905Z" fill="#3d4c7a"/><path d="M280 850 Q520 800 800 840 Q1060 880 1330 830" stroke="#dfe8f8" stroke-width="4" fill="none" opacity=".8"/>`);
    /* ---------- trestle bridge ---------- */
    let tr = '';
    const deckY = 604;
    for (let x = 300; x <= 1300; x += 50) {
      tr += `<path d="M${x} ${deckY + 8} L${x - 10} 900" stroke="#4a2e1c" stroke-width="7"/>`;
    }
    for (let x = 300; x < 1300; x += 50) {
      for (let y = deckY + 20; y < 880; y += 70) tr += `<path d="M${x} ${y} L${x + 50} ${y + 70} M${x + 50} ${y} L${x} ${y + 70}" stroke="#3a2416" stroke-width="3.5"/>`;
    }
    for (let y = deckY + 20; y < 900; y += 70) tr += `<path d="M296 ${y} H1304" stroke="#5a3a26" stroke-width="5"/><path d="M296 ${y - 3} H1304" stroke="#e6eefa" stroke-width="2.5" stroke-dasharray="40 18 22 30" opacity=".85"/>`;
    add(`<g opacity=".95">${tr}</g>`);
    add(`<rect x="260" y="${deckY}" width="1090" height="16" fill="url(#tr-timber)"/><rect x="260" y="${deckY}" width="1090" height="3" fill="#8a6040"/><path d="M260 ${deckY - 2} H1350" stroke="#9aa3b5" stroke-width="3"/>`);
    add(`<path d="M260 ${deckY + 16} H1350" stroke="#e8f0fb" stroke-width="4" stroke-dasharray="30 14" opacity=".8"/>`);
    // bridge lamps along deck
    [420, 700, 980, 1240].forEach((x) => {
      add(`<path d="M${x} ${deckY} v-34" stroke="#22252e" stroke-width="3"/><rect x="${x - 5}" y="${deckY - 44}" width="10" height="12" rx="2" fill="#ffd27a"/>`);
    });

    /* ---------- the train (heading left) ---------- */
    const wy = deckY - 8;
    function wheels(x0, x1, r = 11) {
      let s = '';
      for (let x = x0; x <= x1; x += r * 2.6) s += `<circle cx="${f(x)}" cy="${wy}" r="${r}" fill="#1a1b22" stroke="#7a1019" stroke-width="3"/><circle cx="${f(x)}" cy="${wy}" r="3" fill="#c9a24a"/>`;
      return s;
    }
    function carriage(x, w, body, trim) {
      let s = `<g filter="url(#tr-shadow)">`;
      s += `<rect x="${x}" y="${wy - 22}" width="${w}" height="8" fill="#14151b"/>`;
      s += wheels(x + 18, x + w - 18, 10);
      s += `<rect x="${x}" y="${wy - 96}" width="${w}" height="78" rx="6" fill="${body}"/>`;
      s += `<rect x="${x + 4}" y="${wy - 92}" width="${w - 8}" height="4" fill="${trim}"/><rect x="${x + 4}" y="${wy - 30}" width="${w - 8}" height="4" fill="${trim}"/>`;
      s += `<path d="M${x - 6} ${wy - 96} Q${x + w / 2} ${wy - 122} ${x + w + 6} ${wy - 96}Z" fill="#2a2a30"/>`;
      s += `<path d="M${x - 8} ${wy - 97} Q${x + w / 2} ${wy - 126} ${x + w + 8} ${wy - 97} Q${x + w / 2} ${wy - 116} ${x - 8} ${wy - 97}Z" fill="#f4f8ff"/>`;
      const n = Math.floor((w - 20) / 30);
      for (let i = 0; i < n; i++) {
        const wx = x + 14 + i * ((w - 28) / n);
        s += `<rect x="${f(wx)}" y="${wy - 80}" width="${f((w - 28) / n - 8)}" height="34" rx="5" fill="url(#tr-win)"/>`;
        s += `<rect x="${f(wx)}" y="${wy - 80}" width="${f((w - 28) / n - 8)}" height="8" rx="3" fill="#b3172b" opacity=".75"/>`;
        lights.push({ x: wx + ((w - 28) / n - 8) / 2, y: wy - 62, c: '#ffcf70', r: 3.2 });
        // little silhouettes in some windows
        if (R() < 0.35) s += `<circle cx="${f(wx + 10)}" cy="${wy - 58}" r="6" fill="#5a3218" opacity=".7"/><rect x="${f(wx + 3)}" y="${wy - 52}" width="14" height="10" rx="4" fill="#5a3218" opacity=".7"/>`;
      }
      // wreath on the end
      s += `<circle cx="${x + w - 2}" cy="${wy - 60}" r="10" fill="none" stroke="#1d5a34" stroke-width="5"/><circle cx="${x + w - 2}" cy="${wy - 50}" r="3" fill="#c4182f"/>`;
      s += `</g>`;
      return s;
    }
    add(`<path d="M300 ${wy - 70} L40 ${wy - 140} L40 ${wy + 20} L300 ${wy - 40}Z" fill="url(#tr-beam)"/>`);
    add(carriage(1214, 116, 'url(#tr-red)', '#e2b04a'));
    add(carriage(1012, 190, 'url(#tr-green)', '#e2b04a'));
    add(carriage(808, 190, 'url(#tr-red)', '#e2b04a'));
    add(carriage(604, 190, 'url(#tr-green)', '#e2b04a'));
    // caboose cupola + lantern
    add(`<rect x="1246" y="${wy - 132}" width="50" height="22" rx="3" fill="#7a1019"/><rect x="1252" y="${wy - 128}" width="14" height="12" fill="url(#tr-win)"/><rect x="1274" y="${wy - 128}" width="14" height="12" fill="url(#tr-win)"/><path d="M1240 ${wy - 132} h62" stroke="#f4f8ff" stroke-width="5" stroke-linecap="round"/>`);
    lights.push({ x: 1336, y: wy - 70, c: '#ff4d4d', r: 4 });
    add(`<circle cx="1336" cy="${wy - 70}" r="5" fill="#ff4d4d"/>`);
    // tender with gifts
    add(`<g filter="url(#tr-shadow)"><rect x="508" y="${wy - 22}" width="86" height="8" fill="#14151b"/>${wheels(526, 580, 10)}<rect x="508" y="${wy - 78}" width="86" height="60" rx="4" fill="#1c1f27"/><rect x="512" y="${wy - 74}" width="78" height="4" fill="#c9a24a"/></g>`);
    [[516, 18, '#c42a36', '#e2b04a'], [540, 24, '#2a7a4e', '#f4f0e6'], [566, 20, '#e2b04a', '#c42a36'], [528, 14, '#3a5fb0', '#f4f0e6']].forEach(([x, s, c, rb], i) => {
      const y = wy - 78 - s - (i === 3 ? 18 : 0);
      add(`<rect x="${x}" y="${y}" width="${s + 6}" height="${s}" fill="${c}"/><rect x="${x + (s + 6) / 2 - 2}" y="${y}" width="4" height="${s}" fill="${rb}"/><rect x="${x}" y="${y + s / 2 - 2}" width="${s + 6}" height="4" fill="${rb}"/>`);
    });
    // locomotive
    add(`<g filter="url(#tr-shadow)">
      <rect x="300" y="${wy - 24}" width="200" height="10" fill="#14151b"/>
      <circle cx="352" cy="${wy - 2}" r="20" fill="#1a1b22" stroke="#7a1019" stroke-width="5"/><circle cx="352" cy="${wy - 2}" r="4" fill="#c9a24a"/>
      <circle cx="404" cy="${wy - 2}" r="20" fill="#1a1b22" stroke="#7a1019" stroke-width="5"/><circle cx="404" cy="${wy - 2}" r="4" fill="#c9a24a"/>
      <circle cx="456" cy="${wy - 2}" r="20" fill="#1a1b22" stroke="#7a1019" stroke-width="5"/><circle cx="456" cy="${wy - 2}" r="4" fill="#c9a24a"/>
      <circle cx="310" cy="${wy + 2}" r="11" fill="#1a1b22" stroke="#7a1019" stroke-width="3"/>
      <path d="M340 ${wy - 2} H466" stroke="#b9c0cc" stroke-width="4"/>
      <rect x="318" y="${wy - 80}" width="140" height="56" rx="26" fill="url(#tr-boiler)"/>
      <rect x="340" y="${wy - 82}" width="6" height="60" fill="url(#tr-gold)"/><rect x="390" y="${wy - 82}" width="6" height="60" fill="url(#tr-gold)"/><rect x="430" y="${wy - 82}" width="6" height="60" fill="url(#tr-gold)"/>
      <path d="M318 ${wy - 52} m-6 0 a10 26 0 1 0 0.1 0" fill="#2a2d36"/>
      <circle cx="312" cy="${wy - 52}" r="18" fill="#2a2d36" stroke="url(#tr-gold)" stroke-width="3"/>
      <circle cx="312" cy="${wy - 52}" r="8" fill="#b3172b"/>
      <path d="M326 ${wy - 80} l-6 -44 h34 l-6 44Z" fill="#1c1f27"/><rect x="316" y="${wy - 132}" width="42" height="10" rx="3" fill="url(#tr-gold)"/>
      <rect x="378" y="${wy - 98}" width="24" height="20" rx="10" fill="url(#tr-gold)"/>
      <rect x="296" y="${wy - 102}" width="20" height="18" rx="3" fill="#c9a24a"/><circle cx="296" cy="${wy - 93}" r="8" fill="#fff6c8"/>
      <rect x="452" y="${wy - 118}" width="62" height="96" rx="4" fill="url(#tr-red)"/>
      <rect x="446" y="${wy - 126}" width="74" height="10" rx="3" fill="#1c1f27"/><path d="M444 ${wy - 127} q38 -12 78 0" stroke="#f4f8ff" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="462" y="${wy - 108}" width="22" height="26" rx="3" fill="url(#tr-win)"/><rect x="488" y="${wy - 108}" width="18" height="26" rx="3" fill="url(#tr-win)"/>
      <rect x="452" y="${wy - 54}" width="62" height="4" fill="#e2b04a"/>
      <path d="M300 ${wy - 22} L276 ${wy + 8} H306Z" fill="#7a1019"/><path d="M282 ${wy} h22 M286 ${wy - 8} h18" stroke="#c9a24a" stroke-width="2"/>
      <circle cx="300" cy="${wy - 64}" r="16" fill="none" stroke="#1d5a34" stroke-width="7"/><circle cx="300" cy="${wy - 50}" r="4" fill="#c4182f"/><circle cx="294" cy="${wy - 52}" r="3" fill="#c4182f"/>
    </g>`);
    lights.push({ x: 474, y: wy - 95, c: '#ffcf70', r: 3.5 }, { x: 497, y: wy - 95, c: '#ffcf70', r: 3.5 });
    // garland with lights along the carriages
    for (let x = 610; x < 1325; x += 16) add(bulb(x, wy - 100 + Math.sin(x / 26) * 3, BULB[Math.round(x / 16) % BULB.length], 2.6));

    /* ---------- station on the left cliff ---------- */
    add(`<g filter="url(#tr-shadow)">
      <rect x="40" y="520" width="190" height="86" fill="#7a3a26"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="40" y="${524 + i * 14}" width="190" height="2" fill="#5a2818" opacity=".7"/>`).join('')}
      <path d="M22 524 L135 452 L248 524Z" fill="#2a2a34"/><path d="M14 528 Q20 516 30 520 L135 448 L240 520 Q250 516 256 528 Q248 538 238 532 L135 464 L32 532 Q20 538 14 528Z" fill="#f4f8ff"/>
      <circle cx="135" cy="496" r="20" fill="#f6efdc" stroke="url(#tr-gold)" stroke-width="5"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.283; return `<path d="M${f(135 + Math.cos(a) * 14)} ${f(496 + Math.sin(a) * 14)} L${f(135 + Math.cos(a) * 17)} ${f(496 + Math.sin(a) * 17)}" stroke="#2a1a10" stroke-width="2"/>`; }).join('')}
      <path d="M135 496 L135 484 M135 496 L144 500" stroke="#2a1a10" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="64" y="548" width="34" height="40" rx="3" fill="url(#tr-win)"/><rect x="172" y="548" width="34" height="40" rx="3" fill="url(#tr-win)"/>
      <path d="M81 548 v40 M64 568 h34 M189 548 v40 M172 568 h34" stroke="#5a2818" stroke-width="3"/>
      <rect x="116" y="540" width="38" height="66" fill="#4a2414"/><circle cx="146" cy="574" r="2.5" fill="#e2b04a"/>
      <circle cx="135" cy="530" r="9" fill="none" stroke="#1d5a34" stroke-width="5"/><circle cx="135" cy="539" r="3" fill="#c4182f"/>
      <rect x="20" y="600" width="250" height="10" fill="#4a3426"/>
    </g>`);
    lights.push({ x: 81, y: 568, c: '#ffcf70', r: 6 }, { x: 189, y: 568, c: '#ffcf70', r: 6 });
    for (let i = 0; i < 11; i++) add(bulb(32 + i * 20.6, 534 + Math.sin(i) * 2, BULB[i % BULB.length], 2.8));
    // platform lamps
    [[26, 600], [252, 600]].forEach(([x, y]) => {
      add(`<path d="M${x} ${y} v-86" stroke="#1c1f27" stroke-width="5"/><path d="M${x - 8} ${y - 86} h16 l-3 -16 h-10Z" fill="#1c1f27"/><rect x="${x - 6}" y="${y - 100}" width="12" height="13" fill="#ffe08a"/><circle cx="${x}" cy="${y - 94}" r="34" fill="url(#tr-lamp)"/>`);
      candles.push({ x, y: y - 92, s: 0.6 });
    });
    // bench + luggage
    add(`<rect x="200" y="584" width="40" height="5" fill="#5a3a26"/><path d="M204 589 v12 M236 589 v12" stroke="#2a1a10" stroke-width="3"/><rect x="170" y="584" width="24" height="18" rx="3" fill="#8a4a22"/><rect x="176" y="580" width="12" height="4" rx="2" fill="#2a1a10"/>`);

    /* ---------- foreground pines + snow ---------- */
    add(`<path d="M0 930 Q160 900 320 930 Q420 950 470 1000 H0Z" fill="url(#tr-snow)"/><path d="M1600 930 Q1440 900 1290 930 Q1180 950 1130 1000 H1600Z" fill="url(#tr-snow)"/>`);
    [[60, 1000, 300], [170, 1010, 230], [280, 1010, 170], [1540, 1000, 310], [1430, 1010, 230], [1330, 1010, 160]].forEach(([x, b, h]) => add(pine(x, b, h, '#0c2418', '#e6eefa', 6)));
    // a decorated pine on the right cliff
    add(pine(1450, 640, 140, '#123a26', '#e4f1fb', 5));
    for (let i = 0; i < 14; i++) { const t = rr(0.2, 0.95); add(bulb(1450 + rr(-1, 1) * (8 + t * 46), 500 + t * 136, BULB[i % BULB.length], 3)); }
    // snowman by the station
    add(`<g transform="translate(222 640) scale(.8)"><ellipse cx="0" cy="0" rx="26" ry="22" fill="#f4f8ff"/><circle cx="0" cy="-34" r="18" fill="#f4f8ff"/><circle cx="0" cy="-62" r="13" fill="#f4f8ff"/><rect x="-11" y="-88" width="22" height="16" fill="#1c1f27"/><rect x="-16" y="-74" width="32" height="4" fill="#1c1f27"/><path d="M0 -60 l14 3 l-14 2Z" fill="#f08a2a"/><circle cx="-5" cy="-65" r="2" fill="#111"/><circle cx="5" cy="-65" r="2" fill="#111"/><path d="M-14 -50 q14 8 28 0 l-2 8 q-12 6 -24 0Z" fill="#c4182f"/><path d="M8 -46 l6 18 l6 -2 l-6 -16Z" fill="#c4182f"/></g>`);

    /* ---------- ribbon banner ---------- */
    add(`<path d="M0 22 Q200 70 440 60 M1160 60 Q1400 70 1600 22" stroke="#2c6b40" stroke-width="10" fill="none"/>`);
    let gar = '';
    for (let i = 0; i <= 18; i++) { const t = i / 18; const x = t * 440, y = (1 - t) * (1 - t) * 22 + 2 * (1 - t) * t * 70 + t * t * 60; gar += sprig(x, y, 9); if (i % 3 === 1) gar += bulb(x, y + 6, BULB[i % BULB.length], 3); }
    for (let i = 0; i <= 18; i++) { const t = i / 18; const x = 1160 + t * 440, y = (1 - t) * (1 - t) * 60 + 2 * (1 - t) * t * 70 + t * t * 22; gar += sprig(x, y, 9); if (i % 3 === 1) gar += bulb(x, y + 6, BULB[(i + 2) % BULB.length], 3); }
    add(gar);
    add(`<g filter="url(#tr-shadow)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#tr-ribbonDark)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#tr-ribbonDark)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#082414"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#082414"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#tr-ribbon)"/>
      <path d="M528 86 Q800 30 1072 86" stroke="url(#tr-gold)" stroke-width="3" fill="none"/>
      <path d="M528 140 Q800 84 1072 140" stroke="url(#tr-gold)" stroke-width="3" fill="none"/>
    </g>`);
    add(bow(520, 92, 0.8) + bow(1080, 92, 0.8));

    add(`<rect width="${W}" height="${H}" fill="url(#tr-vig)"/>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  /** Steam that billows from the stack and trails back over the carriages. */
  function steam(ctx, t, dt, s) {
    s.p = s.p || [];
    if (dt && Math.random() < dt * 7) s.p.push({ x: 337, y: 462, life: 0, max: 3.4 + Math.random() * 1.6, r: 10 + Math.random() * 8, vy: -26 - Math.random() * 14, vx: 30 + Math.random() * 26 });
    s.p = s.p.filter((p) => (p.life += dt) < p.max);
    for (const p of s.p) {
      const k = p.life / p.max;
      p.x += p.vx * dt; p.y += p.vy * dt * (1 - k * 0.6);
      ctx.globalAlpha = 0.5 * Math.sin(Math.min(1, k * 1.3) * Math.PI) * (1 - k * 0.3);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (1 + k * 2.4));
      g.addColorStop(0, 'rgba(240,242,250,1)'); g.addColorStop(1, 'rgba(200,206,226,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * 2.4), 0, 7); ctx.fill();
    }
    // chuff of steam by the wheels
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6);
    const g2 = ctx.createRadialGradient(330, 598, 0, 330, 598, 40);
    g2.addColorStop(0, 'rgba(235,240,250,.9)'); g2.addColorStop(1, 'rgba(235,240,250,0)');
    ctx.fillStyle = g2; ctx.fillRect(280, 560, 100, 70);
    ctx.globalAlpha = 1;
  }

  A.designs.train = {
    id: 'train',
    name: 'North Pole Express',
    blurb: 'A steam train winding through snowy pines at night.',
    width: W,
    height: H,
    build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#fff6dc', stroke: '#0a2d1a' },
    numStyles: ['n-cream', 'n-tag', 'n-swash', 'n-red', 'n-cream'],
    effects: [
      { type: 'glow', x: 292, y: 504, r: 120, color: '255,236,170', a: 0.35, speed: 2.2 },
      { type: 'glow', x: 1340, y: 225, r: 170, color: '255,246,210', a: 0.12, speed: 0.6 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'custom', draw: steam },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 110, a: 0.75 },
    ],
    layout: 'train',
    keepOut: [[440, 18, 720, 172], [270, 400, 250, 210]],
    day24: { x: 1255, y: 150, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/train.js', e); }
/* ---- src/layouts/train.js ---- */
try {
/* Door layout for "North Pole Express" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["train"]=[{"day":1,"x":154,"y":384,"w":104,"h":138,"hinge":"left"},
{"day":2,"x":254,"y":229,"w":150,"h":126,"hinge":"top"},
{"day":3,"x":939,"y":569,"w":150,"h":118,"hinge":"left"},
{"day":4,"x":1202,"y":601,"w":94,"h":114,"hinge":"left"},
{"day":5,"x":732,"y":326,"w":138,"h":150,"hinge":"right"},
{"day":6,"x":35,"y":219,"w":150,"h":124,"hinge":"top"},
{"day":7,"x":960,"y":874,"w":126,"h":100,"hinge":"right"},
{"day":8,"x":1422,"y":487,"w":130,"h":132,"hinge":"top"},
{"day":9,"x":190,"y":851,"w":144,"h":122,"hinge":"right"},
{"day":10,"x":564,"y":598,"w":150,"h":126,"hinge":"top"},
{"day":11,"x":1085,"y":731,"w":150,"h":124,"hinge":"left"},
{"day":12,"x":1340,"y":28,"w":120,"h":92,"hinge":"left"},
{"day":13,"x":1263,"y":814,"w":132,"h":150,"hinge":"right"},
{"day":14,"x":51,"y":865,"w":108,"h":100,"hinge":"top"},
{"day":15,"x":1430,"y":642,"w":122,"h":150,"hinge":"left"},
{"day":16,"x":498,"y":780,"w":150,"h":122,"hinge":"right"},
{"day":17,"x":562,"y":222,"w":120,"h":150,"hinge":"left"},
{"day":18,"x":1169,"y":424,"w":116,"h":150,"hinge":"right"},
{"day":19,"x":173,"y":688,"w":150,"h":148,"hinge":"right"},
{"day":20,"x":1033,"y":347,"w":104,"h":138,"hinge":"top"},
{"day":21,"x":861,"y":195,"w":150,"h":116,"hinge":"left"},
{"day":22,"x":820,"y":834,"w":96,"h":120,"hinge":"top"},
{"day":23,"x":31,"y":648,"w":126,"h":102,"hinge":"top"},
{"day":24,"x":1255,"y":150,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/train.js', e); }
/* ---- src/designs/victorian.js ---- */
try {
/* Design — "Victorian Christmas"
   An antique-print street scene: a toy & sweet shop with a glowing bow window, gaslight,
   a lamplighter on his ladder, carolers in top hats and bonnets, holly in the corners.
   Palette: sepia paper, crimson, bottle green and gold. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1843);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const INK = '#2b1a12';

    const holly = (x, y, s = 1, rot = 0) => {
      const leaf = (a) => `<path transform="rotate(${a})" d="M0 0 C6 -4 8 -12 6 -18 C10 -20 12 -26 10 -30 C14 -32 16 -38 14 -42 C6 -40 2 -36 0 -30 C-4 -26 -6 -20 -4 -14 C-6 -10 -4 -4 0 0Z" fill="#1f4a2c" stroke="#13301c" stroke-width="1.2"/><path transform="rotate(${a})" d="M0 0 L8 -38" stroke="#4f8a5a" stroke-width="1.2"/>`;
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">${leaf(-50)}${leaf(10)}${leaf(60)}<circle cx="-3" cy="-4" r="6" fill="#b3122a"/><circle cx="6" cy="-2" r="6" fill="#c41a30"/><circle cx="1" cy="-11" r="6" fill="#a8102a"/><circle cx="-1" cy="-13" r="1.8" fill="#ffb3bd"/></g>`;
    };
    const bricks = (x, y, w, h, base = '#7a3a2c') => {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${base}"/>`;
      for (let yy = y; yy < y + h; yy += 18) {
        const off = ((yy - y) / 18) % 2 ? 22 : 0;
        s += `<path d="M${x} ${yy} H${x + w}" stroke="#4a2018" stroke-width="2" opacity=".55"/>`;
        for (let xx = x - off; xx < x + w; xx += 44) if (xx > x) s += `<path d="M${xx} ${yy} v18" stroke="#4a2018" stroke-width="2" opacity=".55"/>`;
      }
      for (let i = 0; i < (w * h) / 1800; i++) s += `<rect x="${f(rr(x, x + w - 40))}" y="${f(y + Math.floor(rr(0, h / 18)) * 18 + 2)}" width="40" height="14" fill="${pick(['#8d4634', '#6b2f24', '#94503a'])}" opacity=".5"/>`;
      return s;
    };
    const sash = (x, y, w, h, lit) => {
      let s = `<rect x="${x - 8}" y="${y - 10}" width="${w + 16}" height="${h + 22}" fill="#e7d9bc"/>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? 'url(#vc-win)' : '#2e2a36'}"/>`;
      s += `<path d="M${x + w / 2} ${y} v${h} M${x} ${y + h / 2} h${w} M${x} ${y + h / 4} h${w} M${x} ${y + (3 * h) / 4} h${w}" stroke="#e7d9bc" stroke-width="4"/>`;
      s += `<rect x="${x - 12}" y="${y + h + 8}" width="${w + 24}" height="8" fill="#d8c8a8"/><path d="M${x - 12} ${y + h + 8} q${(w + 24) / 2} -6 ${w + 24} 0" stroke="#fbf7ee" stroke-width="5" fill="none"/>`;
      if (lit) {
        s += `<rect x="${x + w / 2 - 4}" y="${y + h - 26}" width="8" height="22" rx="1" fill="#fbf4e2"/>`;
        candles.push({ x: x + w / 2, y: y + h - 28, s: 0.7 });
        s += `<rect x="${x - 30}" y="${y - 20}" width="${w + 60}" height="${h + 40}" fill="#ffd27a" opacity=".08"/>`;
      }
      // small wreath
      let wr = '';
      for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28; wr += `<circle cx="${f(x + w / 2 + Math.cos(a) * 13)}" cy="${f(y + h * 0.3 + Math.sin(a) * 13)}" r="6" fill="${k % 2 ? '#1f4a2c' : '#2c6038'}"/>`; }
      return s + wr + `<path d="M${x + w / 2 - 6} ${y + h * 0.3 + 14} l6 -4 l6 4 l-3 8 h-6Z" fill="#b3172b"/>`;
    };

    add(`<defs>
      <linearGradient id="vc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#231b26"/><stop offset=".6" stop-color="#3d3036"/><stop offset="1" stop-color="#5a463e"/></linearGradient>
      <linearGradient id="vc-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a8"/><stop offset="1" stop-color="#f0a54a"/></linearGradient>
      <radialGradient id="vc-shop" cx="800" cy="520" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff0c0"/><stop offset=".55" stop-color="#ffc870"/><stop offset="1" stop-color="#c47a32"/></radialGradient>
      <linearGradient id="vc-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe6a6"/><stop offset=".5" stop-color="#d1a14a"/><stop offset="1" stop-color="#8a6420"/></linearGradient>
      <linearGradient id="vc-green" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#16301f"/><stop offset=".5" stop-color="#244a32"/><stop offset="1" stop-color="#16301f"/></linearGradient>
      <linearGradient id="vc-fascia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1410"/><stop offset="1" stop-color="#2e2018"/></linearGradient>
      <pattern id="vc-cobble" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="40" height="22" fill="#4a3a30"/><ellipse cx="10" cy="6" rx="9" ry="5" fill="#76604e"/><ellipse cx="30" cy="6" rx="9" ry="5" fill="#6b5646"/><ellipse cx="0" cy="17" rx="9" ry="5" fill="#705a4a"/><ellipse cx="20" cy="17" rx="9" ry="5" fill="#7c6652"/><ellipse cx="40" cy="17" rx="9" ry="5" fill="#705a4a"/></pattern>
      <radialGradient id="vc-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></radialGradient>
      <radialGradient id="vc-vig" cx="800" cy="520" r="980" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#2a1608" stop-opacity="0"/><stop offset="1" stop-color="#2a1608" stop-opacity=".65"/></radialGradient>
      <radialGradient id="vc-orn" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".5" stop-color="#b3172b"/><stop offset="1" stop-color="#5a0710"/></radialGradient>
      <filter id="vc-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#1a0c04" flood-opacity=".5"/></filter>
      <filter id="vc-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
    </defs>`);

    /* sky + neighbouring buildings */
    add(`<rect width="${W}" height="${H}" fill="url(#vc-sky)"/>`);
    for (let i = 0; i < 40; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 120))}" r="${f(rr(0.5, 1.4))}" fill="#fff6e0" opacity="${f(rr(0.3, 0.8))}"/>`);
    add(bricks(0, 60, 380, 720, '#6e3428'));
    add(bricks(1220, 40, 380, 740, '#7a3a2c'));
    add(`<path d="M-10 70 H390 V40 H-10Z M1210 50 H1610 V20 H1210Z" fill="#3a2a26"/><path d="M-10 40 H390 M1210 20 H1610" stroke="#f7f2e6" stroke-width="10" stroke-linecap="round"/>`);
    add(sash(70, 130, 110, 150, true)); add(sash(230, 130, 110, 150, false)); add(sash(1280, 120, 110, 150, true)); add(sash(1440, 120, 110, 150, true));
    add(sash(70, 380, 110, 150, false)); add(sash(1440, 380, 110, 150, true));

    /* the shop: upper storey */
    add(bricks(380, 0, 840, 200, '#8a4232'));
    add(sash(470, 30, 120, 130, true)); add(sash(740, 30, 120, 130, true)); add(sash(1010, 30, 120, 130, true));
    /* shop front */
    add(`<g filter="url(#vc-shadow)">
      <rect x="380" y="190" width="840" height="590" fill="url(#vc-green)"/>
      <rect x="400" y="200" width="800" height="104" fill="url(#vc-gold)"/>
      <rect x="410" y="208" width="780" height="88" fill="url(#vc-fascia)"/>
      <rect x="420" y="216" width="760" height="72" fill="none" stroke="url(#vc-gold)" stroke-width="2"/>
      <rect x="372" y="300" width="856" height="16" fill="url(#vc-gold)"/>
      <rect x="388" y="316" width="40" height="460" fill="#1d3b28"/><rect x="1172" y="316" width="40" height="460" fill="#1d3b28"/>
      <rect x="384" y="316" width="48" height="18" fill="url(#vc-gold)"/><rect x="1168" y="316" width="48" height="18" fill="url(#vc-gold)"/>
      <rect x="384" y="756" width="48" height="24" fill="url(#vc-gold)"/><rect x="1168" y="756" width="48" height="24" fill="url(#vc-gold)"/>
    </g>`);
    // flourishes at the fascia ends
    [[432, 252, 1], [1168, 252, -1]].forEach(([x, y, d]) => add(`<path d="M${x} ${y} c${d * 12} -18 ${d * 30} -18 ${d * 30} 0 c0 12 ${-d * 14} 14 ${-d * 16} 4" stroke="url(#vc-gold)" stroke-width="3" fill="none"/>`));
    // snow on the cornice
    add(`<path d="M366 300 Q800 286 1234 300 L1234 292 Q800 280 366 292Z" fill="#f7f2e6"/><path d="M372 198 Q800 186 1228 198 L1228 190 Q800 178 372 190Z" fill="#f7f2e6"/>`);
    // holly garland swagging across the fascia bottom
    for (let i = 0; i < 4; i++) {
      const x0 = 420 + i * 190, x1 = x0 + 190;
      for (let k = 0; k <= 12; k++) {
        const t = k / 12, x = x0 + t * 190, y = 318 + Math.sin(t * Math.PI) * 30;
        add(`<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="${k % 2 ? '#1f4a2c' : '#2c6038'}"/>`);
        if (k % 4 === 2) add(`<circle cx="${f(x)}" cy="${f(y + 4)}" r="4" fill="#c41a30"/>`);
      }
      add(`<path d="M${x1 - 6} 314 l6 -4 l6 4 l-3 10 h-6Z" fill="#b3172b"/>`);
    }

    /* the bow window */
    add(`<path d="M450 330 H1090 V700 H450Z" fill="#1d3b28"/>`);
    add(`<path d="M470 700 V420 Q470 340 560 340 H980 Q1070 340 1070 420 V700Z" fill="url(#vc-shop)"/>`);
    // shelves of sweets
    const shelf = (y) => add(`<rect x="480" y="${y}" width="580" height="8" fill="#6b3d1f"/>`);
    shelf(470); shelf(590);
    for (let i = 0; i < 9; i++) {
      const x = 500 + i * 64, y = 470;
      const c = pick(['#e6475a', '#f2c14a', '#6fbf73', '#ef8fc0', '#7ab8e6']);
      add(`<rect x="${x}" y="${y - 52}" width="38" height="52" rx="6" fill="#fffaf0" opacity=".35" stroke="#f8efe0" stroke-width="2"/><rect x="${x + 4}" y="${y - 36}" width="30" height="34" rx="4" fill="${c}" opacity=".85"/>`);
      for (let k = 0; k < 5; k++) add(`<circle cx="${f(x + rr(8, 30))}" cy="${f(y - rr(8, 32))}" r="3.5" fill="#fff" opacity=".55"/>`);
      add(`<rect x="${x + 2}" y="${y - 58}" width="34" height="8" rx="2" fill="#8a6420"/>`);
    }
    // toys on the lower shelf: rocking horse, drum, soldier, doll, ball
    add(`<g transform="translate(540 590)">
      <path d="M-40 0 Q0 18 40 0" stroke="#8a4a1f" stroke-width="6" fill="none"/>
      <path d="M-28 -6 v-20 M24 -6 v-20" stroke="#8a4a1f" stroke-width="6"/>
      <path d="M-34 -26 Q0 -40 26 -28 L34 -54 Q40 -66 30 -70 L22 -62 Q14 -58 18 -44 L-30 -36Z" fill="#f2ead8" stroke="#5a3218" stroke-width="2"/>
      <path d="M30 -70 Q20 -74 14 -60" stroke="#5a3218" stroke-width="5" fill="none"/><path d="M-34 -30 q-14 2 -16 16" stroke="#5a3218" stroke-width="4" fill="none"/>
      <rect x="-12" y="-40" width="16" height="8" fill="#b3172b"/><circle cx="26" cy="-60" r="2" fill="#111"/>
    </g>`);
    add(`<g transform="translate(650 590)"><rect x="-26" y="-44" width="52" height="44" fill="#b3172b"/><ellipse cx="0" cy="-44" rx="26" ry="8" fill="#f6efe2"/><path d="M-26 -40 l13 36 l13 -36 l13 36 l13 -36" stroke="#e9c060" stroke-width="2.5" fill="none"/><ellipse cx="0" cy="0" rx="26" ry="6" fill="#8a1424"/><path d="M-6 -52 l-18 -22 M6 -52 l18 -22" stroke="#d9b07a" stroke-width="4" stroke-linecap="round"/></g>`);
    add(`<g transform="translate(940 590)"><rect x="-10" y="-30" width="8" height="30" fill="#14131c"/><rect x="2" y="-30" width="8" height="30" fill="#14131c"/><rect x="-14" y="-74" width="28" height="46" rx="3" fill="#b3172b"/><path d="M-14 -60 h28 M-14 -50 h28" stroke="#e9c060" stroke-width="2"/><circle cx="0" cy="-86" r="11" fill="#f0c8a8"/><rect x="-11" y="-118" width="22" height="30" rx="4" fill="#14131c"/><circle cx="-4" cy="-84" r="3" fill="#e46a6a"/><circle cx="4" cy="-84" r="3" fill="#e46a6a"/></g>`);
    add(`<g transform="translate(1010 590)"><path d="M-22 0 Q-24 -40 0 -48 Q24 -40 22 0Z" fill="#7a3a8a"/><path d="M-22 0 Q0 -10 22 0" stroke="#f6efe2" stroke-width="4" fill="none"/><circle cx="0" cy="-58" r="12" fill="#f6dcc8"/><path d="M-14 -60 Q-14 -76 0 -76 Q14 -76 14 -60 Q14 -50 18 -40 M-14 -60 Q-14 -50 -18 -40" stroke="#c48a3a" stroke-width="5" fill="none"/></g>`);
    add(`<g transform="translate(790 590)"><circle cx="0" cy="-26" r="26" fill="url(#vc-orn)"/><path d="M-26 -26 Q0 -10 26 -26 M0 -52 Q-14 -26 0 0" stroke="#f6efe2" stroke-width="3" fill="none"/></g>`);
    add(`<g transform="translate(860 590)"><rect x="-18" y="-34" width="36" height="34" fill="#2a5aa8"/><rect x="-3" y="-34" width="6" height="34" fill="#e9c060"/><rect x="-18" y="-20" width="36" height="6" fill="#e9c060"/><path d="M0 -34 q-14 -16 -18 -4 q4 8 18 4 q14 -16 18 -4 q-4 8 -18 4" fill="#e9c060"/></g>`);
    // toy train on the window floor
    add(`<path d="M480 676 H1060" stroke="#5a3218" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => `<rect x="${484 + i * 42}" y="674" width="6" height="8" fill="#5a3218"/>`).join('')}`);
    add(`<g transform="translate(560 672)"><rect x="0" y="-36" width="70" height="30" fill="#1f4a2c"/><rect x="50" y="-60" width="26" height="54" fill="#1f4a2c"/><rect x="10" y="-52" width="12" height="18" fill="#14131c"/><rect x="52" y="-56" width="20" height="16" fill="#ffd27a"/><rect x="-8" y="-12" width="90" height="6" fill="#d1a14a"/><circle cx="12" cy="-4" r="9" fill="#b3172b"/><circle cx="40" cy="-4" r="9" fill="#b3172b"/><circle cx="66" cy="-4" r="9" fill="#b3172b"/><path d="M0 -36 l-12 -6 v14Z" fill="#d1a14a"/></g>`);
    [[650, '#b3172b'], [740, '#2a5aa8'], [830, '#d1a14a']].forEach(([x, c]) => add(`<g transform="translate(${x} 672)"><rect x="0" y="-30" width="76" height="24" fill="${c}"/><rect x="0" y="-34" width="76" height="6" fill="#5a3218"/><circle cx="14" cy="-4" r="8" fill="#14131c"/><circle cx="62" cy="-4" r="8" fill="#14131c"/><rect x="-10" y="-14" width="10" height="4" fill="#5a3218"/></g>`));
    // little tree in the window corner with lights
    add(`<path d="M1010 676 L1050 676 L1030 600Z M1000 650 L1060 650 L1030 580Z M1006 620 L1054 620 L1030 560Z" fill="#1f4a2c"/>`);
    for (let k = 0; k < 9; k++) { const x = 1012 + (k * 37) % 40, y = 590 + k * 9; lights.push({ x, y, c: pick(['#ffd36b', '#ff6b5a', '#fff1b8']), r: 3 }); add(`<circle cx="${x}" cy="${y}" r="3" fill="#ffe7a0"/>`); }
    // window glazing bars (the curved bay)
    add(`<path d="M470 700 V420 Q470 340 560 340 H980 Q1070 340 1070 420 V700" stroke="#1d3b28" stroke-width="14" fill="none"/>`);
    [575, 680, 800, 920, 1025].forEach((x) => add(`<path d="M${x} 342 V700" stroke="#1d3b28" stroke-width="8"/>`));
    add(`<path d="M470 400 H1070" stroke="#1d3b28" stroke-width="6"/>`);
    [[470, 360], [575, 342], [680, 342], [800, 342], [920, 342], [1025, 342]].forEach(([x], i, arr) => { if (i < arr.length - 1) { const x2 = arr[i + 1][0]; add(`<path d="M${x + 6} 398 Q${(x + x2) / 2} 360 ${x2 - 6} 398" stroke="#1d3b28" stroke-width="3" fill="none"/>`); } });
    add(`<path d="M480 360 Q800 300 1060 360" stroke="#fffaf0" stroke-width="10" opacity=".08" fill="none"/>`);
    // stall riser under the window
    add(`<rect x="440" y="700" width="660" height="70" fill="#16301f"/><rect x="460" y="712" width="300" height="46" fill="none" stroke="url(#vc-gold)" stroke-width="2"/><rect x="780" y="712" width="300" height="46" fill="none" stroke="url(#vc-gold)" stroke-width="2"/><rect x="436" y="694" width="668" height="12" fill="url(#vc-gold)"/><path d="M436 692 Q770 682 1104 692" stroke="#f7f2e6" stroke-width="6" fill="none"/>`);

    /* the door */
    add(`<rect x="1094" y="380" width="74" height="400" fill="#16301f"/><rect x="1102" y="392" width="58" height="150" fill="url(#vc-win)"/><path d="M1131 392 v150 M1102 467 h58" stroke="#16301f" stroke-width="4"/><rect x="1104" y="560" width="54" height="80" fill="none" stroke="url(#vc-gold)" stroke-width="2"/><rect x="1104" y="656" width="54" height="80" fill="none" stroke="url(#vc-gold)" stroke-width="2"/><circle cx="1150" cy="650" r="4" fill="url(#vc-gold)"/>`);
    let dw = ''; for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.28; dw += `<circle cx="${f(1131 + Math.cos(a) * 18)}" cy="${f(600 + Math.sin(a) * 18)}" r="7" fill="${k % 2 ? '#1f4a2c' : '#2c6038'}"/>`; }
    add(dw + `<path d="M1124 618 l7 -5 l7 5 l-4 12 h-6Z" fill="#b3172b"/>`);
    add(`<path d="M1088 784 h86 v-8 h-86Z" fill="#7a6a5a"/>`);

    /* pavement + street */
    add(`<rect y="770" width="${W}" height="230" fill="url(#vc-cobble)"/><rect y="770" width="${W}" height="30" fill="#8a7a68"/>`);
    add(`<path d="M0 772 H${W} V792 Q1200 786 800 796 Q400 788 0 794Z" fill="#f7f2e6"/>`);
    for (let i = 0; i < 26; i++) add(`<ellipse cx="${f(rr(0, W))}" cy="${f(rr(810, 990))}" rx="${f(rr(30, 120))}" ry="${f(rr(6, 16))}" fill="#f7f2e6" opacity="${f(rr(0.6, 0.95))}"/>`);
    add(`<path d="M0 950 Q300 915 640 948 Q980 975 1300 940 Q1460 925 1600 945 V1000 H0Z" fill="#f7f2e6"/>`);
    // window light spilling onto the snow
    add(`<path d="M460 790 L1100 790 L1220 960 L340 960Z" fill="#ffd27a" opacity=".12"/>`);

    /* child at the window */
    add(`<g transform="translate(500 800)" fill="#241812"><path d="M-14 0 L-12 -40 Q0 -46 12 -40 L14 0Z"/><circle cx="2" cy="-54" r="11"/><path d="M-10 -60 Q2 -74 14 -60Z" fill="#b3172b"/><path d="M8 -40 l14 -26" stroke="#241812" stroke-width="6" stroke-linecap="round"/><path d="M-10 -36 h22 v6 h-22Z" fill="#b3172b"/></g>`);

    /* gas lamp + lamplighter */
    add(`<circle cx="270" cy="470" r="110" fill="url(#vc-lamp)"/>`);
    add(`<g filter="url(#vc-shadow)"><rect x="263" y="500" width="14" height="300" fill="#1b1612"/><rect x="252" y="780" width="36" height="22" rx="4" fill="#1b1612"/><path d="M258 520 h24 M260 560 h20" stroke="#2c2620" stroke-width="5"/>
      <path d="M244 448 h52 l-8 50 h-36Z" fill="#ffe7a8"/><path d="M244 448 h52 l-8 50 h-36Z M270 448 v50" fill="none" stroke="#1b1612" stroke-width="4"/>
      <path d="M238 450 L270 420 L302 450Z" fill="#1b1612"/><path d="M236 448 L270 416 L304 448" stroke="#f7f2e6" stroke-width="6" fill="none"/>
      <path d="M232 500 h76" stroke="#1b1612" stroke-width="5"/></g>`);
    lights.push({ x: 270, y: 474, c: '#ffe0a0', r: 9 });
    // ladder + lamplighter
    add(`<path d="M168 800 L238 500 M196 800 L262 508" stroke="#6b4a2a" stroke-width="6"/>`);
    for (let k = 1; k < 9; k++) { const t = k / 9; add(`<path d="M${f(168 + t * 70)} ${f(800 - t * 300)} L${f(196 + t * 66)} ${f(800 - t * 292)}" stroke="#6b4a2a" stroke-width="4"/>`); }
    add(`<g transform="translate(212 640)" fill="#1f1712">
      <path d="M-14 -70 Q-2 -78 12 -70 L18 -10 Q6 -2 -2 -6 L-8 4 L-18 -6Z"/><path d="M-4 -8 l-6 46 M8 -10 l4 44" stroke="#1f1712" stroke-width="9" stroke-linecap="round"/>
      <circle cx="2" cy="-84" r="11" fill="#e8c4a4"/><rect x="-10" y="-112" width="22" height="22" fill="#1f1712"/><rect x="-14" y="-94" width="30" height="5" fill="#1f1712"/>
      <path d="M10 -64 L58 -150" stroke="#3a2a1a" stroke-width="4"/><path d="M-2 -70 q-14 6 -18 24" stroke="#b3172b" stroke-width="5" fill="none"/>
    </g>`);
    candles.push({ x: 270, y: 466, s: 0.9 });

    /* carolers */
    const caroler = (x, y, s, coat, hat, accent) => {
      let g = `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="2" rx="32" ry="6" fill="#2a1608" opacity=".35"/>`;
      g += hat === 'bonnet'
        ? `<path d="M-30 0 Q-28 -60 -12 -78 Q0 -86 12 -78 Q28 -60 30 0Z" fill="${coat}"/><path d="M-30 0 Q0 -10 30 0" stroke="#f7f2e6" stroke-width="5" fill="none"/>`
        : `<path d="M-20 0 L-16 -78 Q0 -88 16 -78 L20 0Z" fill="${coat}"/><path d="M-20 0 L-6 -40 L-4 0Z" fill="#000" opacity=".2"/>`;
      g += `<path d="M-14 -78 Q0 -70 14 -78 L12 -68 Q0 -62 -12 -68Z" fill="${accent}"/>`;
      g += `<circle cx="0" cy="-92" r="13" fill="#eccaa8"/><ellipse cx="0" cy="-86" rx="4" ry="5" fill="#3a1a0a" opacity=".8"/>`;
      if (hat === 'top') g += `<rect x="-11" y="-136" width="22" height="34" fill="#14110e"/><rect x="-18" y="-104" width="36" height="5" rx="2" fill="#14110e"/>`;
      else if (hat === 'bonnet') g += `<path d="M-18 -92 Q-20 -120 0 -118 Q20 -120 18 -92 Q10 -104 0 -104 Q-10 -104 -18 -92Z" fill="${accent}"/><path d="M-14 -92 q14 20 28 0" stroke="${accent}" stroke-width="3" fill="none"/><ellipse cx="-20" cy="-52" rx="12" ry="9" fill="#e8dcc8"/>`;
      g += `<rect x="-12" y="-64" width="22" height="16" rx="2" fill="#f4eee0" transform="rotate(-6)"/>`;
      return g + '</g>';
    };
    add(caroler(1270, 900, 1.15, '#2a2026', 'top', '#b3172b'));
    add(caroler(1340, 910, 1.05, '#6b1a24', 'bonnet', '#1f4a2c'));
    add(caroler(1410, 896, 1.2, '#1f2a3a', 'top', '#d1a14a'));
    add(caroler(1478, 914, 0.95, '#2c4a32', 'bonnet', '#b3172b'));
    add(caroler(1536, 922, 0.75, '#5a3a2a', 'none', '#c41a30'));
    add(`<path d="M1580 930 L1560 760" stroke="#3a2214" stroke-width="5"/><rect x="1550" y="770" width="20" height="28" rx="3" fill="#ffe7a8" stroke="#1b1612" stroke-width="3"/><circle cx="1560" cy="784" r="44" fill="url(#vc-lamp)"/>`);
    candles.push({ x: 1560, y: 790, s: 0.5 });

    /* holly in the corners */
    add(holly(40, 990, 1.4, 20)); add(holly(110, 990, 1.1, -30)); add(holly(1560, 990, 1.4, -20)); add(holly(1490, 990, 1.1, 30));
    add(holly(30, 40, 1.2, 160)); add(holly(1570, 40, 1.2, -160));

    /* antique print finish: warm sepia wash, vignette and a plate border */
    add(`<rect width="${W}" height="${H}" fill="#b38a50" opacity=".1"/><rect width="${W}" height="${H}" fill="url(#vc-vig)"/>`);
    add(`<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="#e9dcc0" stroke-width="6" opacity=".7"/><rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="#8a1424" stroke-width="2" opacity=".8"/>`);

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  A.designs.victorian = {
    id: 'victorian',
    name: 'Victorian Christmas',
    blurb: 'Carolers in top hats outside a gaslit shop window.',
    width: W, height: H, build,
    // the shop's fascia board carries the title
    title: { path: 'M440 266 Q800 260 1160 266', size: 50, maxWidth: 700, fill: '#f3d892', stroke: '#1a1410' },
    numStyles: ['n-gold', 'n-tag', 'n-cream', 'n-red', 'n-gold'],
    effects: [
      { type: 'roomGlow', x: 770, y: 540, r: 620, color: '255,190,110', a: 0.07, flicker: 0.025 },
      { type: 'glow', x: 270, y: 474, r: 140, color: '255,220,150', a: 0.22, speed: 3.1 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 150, color: '#fff8ea' },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 40, size: 1.8, speed: 1.2, a: 0.7, color: '#fff8ea' },
    ],
    layout: 'victorian',
    keepOut: [[400, 196, 800, 112]],
    day24: { x: 715, y: 420, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/victorian.js', e); }
/* ---- src/layouts/victorian.js ---- */
try {
/* Door layout for "Victorian Christmas" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["victorian"]=[{"day":1,"x":1288,"y":586,"w":136,"h":150,"hinge":"top"},
{"day":2,"x":1010,"y":649,"w":132,"h":110,"hinge":"right"},
{"day":3,"x":1019,"y":796,"w":132,"h":150,"hinge":"right"},
{"day":4,"x":52,"y":516,"w":150,"h":116,"hinge":"right"},
{"day":5,"x":341,"y":30,"w":126,"h":102,"hinge":"left"},
{"day":6,"x":258,"y":347,"w":126,"h":150,"hinge":"left"},
{"day":7,"x":388,"y":751,"w":150,"h":118,"hinge":"top"},
{"day":8,"x":1440,"y":557,"w":122,"h":144,"hinge":"top"},
{"day":9,"x":502,"y":49,"w":150,"h":128,"hinge":"right"},
{"day":10,"x":42,"y":686,"w":124,"h":150,"hinge":"right"},
{"day":11,"x":67,"y":862,"w":144,"h":110,"hinge":"right"},
{"day":12,"x":770,"y":584,"w":150,"h":148,"hinge":"left"},
{"day":13,"x":1294,"y":280,"w":120,"h":112,"hinge":"right"},
{"day":14,"x":1129,"y":312,"w":144,"h":140,"hinge":"left"},
{"day":15,"x":999,"y":485,"w":128,"h":150,"hinge":"right"},
{"day":16,"x":556,"y":856,"w":114,"h":104,"hinge":"top"},
{"day":17,"x":694,"y":766,"w":150,"h":118,"hinge":"right"},
{"day":18,"x":30,"y":217,"w":108,"h":106,"hinge":"top"},
{"day":19,"x":1377,"y":116,"w":122,"h":150,"hinge":"left"},
{"day":20,"x":514,"y":416,"w":102,"h":132,"hinge":"left"},
{"day":21,"x":272,"y":144,"w":122,"h":150,"hinge":"left"},
{"day":22,"x":1439,"y":748,"w":124,"h":150,"hinge":"left"},
{"day":23,"x":871,"y":27,"w":150,"h":128,"hinge":"right"},
{"day":24,"x":715,"y":420,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/victorian.js', e); }
/* ---- src/designs/wonderland.js ---- */
try {
/* Design — "Winter Wonderland"
   A hushed village in deep snow at blue hour: a church on the rise, cottages with
   lamplit windows and chimney smoke, frosted pines, a frozen stream under a stone
   bridge, and snow coming down thick. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  // [x (centre), groundY, scale, wall, roof, flip]
  const COTTAGES = [
    [180, 560, 0.55, '#c9b49a', '#5a3a3a', 0], [360, 548, 0.5, '#b7c2cc', '#40343e', 1], [560, 566, 0.6, '#d8c4a4', '#6b2b24', 0],
    [1260, 556, 0.55, '#d8c4a4', '#40343e', 1], [1440, 566, 0.6, '#c9b49a', '#6b2b24', 0],
    [300, 690, 0.95, '#e0cfae', '#5a2e2a', 1], [640, 676, 0.85, '#c8b4a0', '#34303e', 0], [1260, 690, 0.95, '#d6c3a6', '#4a3234', 0],
    [130, 860, 1.3, '#ead9b8', '#6b2b24', 0], [1470, 870, 1.3, '#d9c6a8', '#3c3442', 1],
  ];
  const chimneyTop = ([x, gy, s, , , flip]) => [x + (flip ? -1 : 1) * 46 * s, gy - 150 * s];

  function build() {
    const R = A.util.rng(2512);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], glints = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff6b5a', '#7ad1ff', '#9dff8a', '#fff1b8'];

    const bulb = (x, y, c, r = 3.5) => {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`;
    };
    // a snow-laden pine: dark tiers with heavy snow on each shelf
    const frostedPine = (x, base, h, dark = '#183a30', mid = '#22503f', snow = '#f3f7ff') => {
      let s = `<rect x="${f(x - h * 0.03)}" y="${f(base - h * 0.08)}" width="${f(h * 0.06)}" height="${f(h * 0.1)}" fill="#3a2a22"/>`;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const ty = base - h + (i * h) / (n + 0.6), by = ty + h * 0.34, w = h * (0.13 + i * 0.075);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(by)} Q${f(x)} ${f(by + h * 0.04)} ${f(x + w)} ${f(by)}Z" fill="${i % 2 ? mid : dark}"/>`;
        const my = ty + (by - ty) * 0.45;
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w * 0.9)} ${f(by - h * 0.015)} Q${f(x - w * 0.62)} ${f(by - h * 0.05)} ${f(x - w * 0.42)} ${f(by - h * 0.03)} Q${f(x - w * 0.2)} ${f(my + h * 0.02)} ${f(x)} ${f(my)} Q${f(x + w * 0.22)} ${f(my + h * 0.04)} ${f(x + w * 0.5)} ${f(by - h * 0.04)} Q${f(x + w * 0.7)} ${f(by - h * 0.05)} ${f(x + w * 0.9)} ${f(by - h * 0.015)}Z" fill="${snow}"/>`;
        s += `<path d="M${f(x - w)} ${f(by)} Q${f(x)} ${f(by + h * 0.04)} ${f(x + w)} ${f(by)}" stroke="${snow}" stroke-width="${f(h * 0.012 + 1)}" fill="none" stroke-linecap="round"/>`;
      }
      return s;
    };
    const cottage = ([x, gy, s, wall, roof, flip]) => {
      const w = 150 * s, h = 90 * s, rx = x - w / 2, top = gy - h, peak = top - 70 * s;
      const [chx, chy] = chimneyTop([x, gy, s, wall, roof, flip]);
      let g = `<g>`;
      g += `<rect x="${f(chx - 9 * s)}" y="${f(chy)}" width="${f(18 * s)}" height="${f(70 * s)}" fill="#6a5550"/><rect x="${f(chx - 12 * s)}" y="${f(chy - 6 * s)}" width="${f(24 * s)}" height="${f(10 * s)}" rx="${f(4 * s)}" fill="#f3f7ff"/>`;
      g += `<rect x="${f(rx)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" fill="${wall}"/><rect x="${f(rx)}" y="${f(top)}" width="${f(w)}" height="${f(h)}" fill="#24305a" opacity=".28"/>`;
      g += `<path d="M${f(rx - 14 * s)} ${f(top + 6 * s)} L${f(x)} ${f(peak)} L${f(rx + w + 14 * s)} ${f(top + 6 * s)}Z" fill="${roof}"/>`;
      // thick pillowy snow on the roof
      g += `<path d="M${f(rx - 20 * s)} ${f(top + 8 * s)} Q${f(rx - 24 * s)} ${f(top - 6 * s)} ${f(rx - 4 * s)} ${f(top - 10 * s)} L${f(x)} ${f(peak - 16 * s)} L${f(rx + w + 4 * s)} ${f(top - 10 * s)} Q${f(rx + w + 24 * s)} ${f(top - 6 * s)} ${f(rx + w + 20 * s)} ${f(top + 8 * s)} Q${f(x)} ${f(top + 2 * s)} ${f(rx - 20 * s)} ${f(top + 8 * s)}Z" fill="#f3f7ff"/>`;
      g += `<path d="M${f(rx - 4 * s)} ${f(top - 2 * s)} L${f(x)} ${f(peak - 8 * s)}" stroke="#c9d6f0" stroke-width="${f(3 * s)}" opacity=".7"/>`;
      for (let k = 0; k < 4; k++) g += `<path d="M${f(rx + rr(0.1, 0.9) * w)} ${f(top + 6 * s)} q${f(3 * s)} ${f(rr(8, 16) * s)} ${f(6 * s)} 0Z" fill="#e8f0ff"/>`;
      // windows
      const wins = [rx + w * 0.22, rx + w * 0.78];
      wins.forEach((wx) => {
        g += `<rect x="${f(wx - 15 * s)}" y="${f(top + 22 * s)}" width="${f(30 * s)}" height="${f(30 * s)}" fill="#ffd27a"/>`;
        g += `<rect x="${f(wx - 15 * s)}" y="${f(top + 22 * s)}" width="${f(30 * s)}" height="${f(30 * s)}" fill="none" stroke="#3a2a22" stroke-width="${f(3 * s)}"/><path d="M${f(wx)} ${f(top + 22 * s)} v${f(30 * s)} M${f(wx - 15 * s)} ${f(top + 37 * s)} h${f(30 * s)}" stroke="#3a2a22" stroke-width="${f(2 * s)}"/>`;
        g += `<rect x="${f(wx - 24 * s)}" y="${f(top + 20 * s)}" width="${f(8 * s)}" height="${f(34 * s)}" fill="${roof}"/><rect x="${f(wx + 16 * s)}" y="${f(top + 20 * s)}" width="${f(8 * s)}" height="${f(34 * s)}" fill="${roof}"/>`;
        g += `<path d="M${f(wx - 18 * s)} ${f(top + 53 * s)} q${f(18 * s)} ${f(-5 * s)} ${f(36 * s)} 0" stroke="#f3f7ff" stroke-width="${f(5 * s)}" fill="none" stroke-linecap="round"/>`;
        g += `<circle cx="${f(wx)}" cy="${f(top + 37 * s)}" r="${f(40 * s)}" fill="#ffc861" opacity=".14"/>`;
      });
      // door + wreath
      g += `<path d="M${f(x - 12 * s)} ${f(gy)} V${f(top + 46 * s)} q${f(12 * s)} ${f(-12 * s)} ${f(24 * s)} 0 V${f(gy)}Z" fill="#5a2e22"/><circle cx="${f(x)}" cy="${f(top + 58 * s)}" r="${f(6 * s)}" fill="none" stroke="#2f6a3a" stroke-width="${f(3 * s)}"/><circle cx="${f(x)}" cy="${f(top + 64 * s)}" r="${f(1.6 * s)}" fill="#c4222f"/>`;
      // snow drift against the wall
      g += `<path d="M${f(rx - 30 * s)} ${f(gy + 4 * s)} Q${f(rx + w * 0.3)} ${f(gy - 14 * s)} ${f(x)} ${f(gy - 2 * s)} Q${f(rx + w * 0.8)} ${f(gy - 16 * s)} ${f(rx + w + 30 * s)} ${f(gy + 4 * s)}Z" fill="#eef4ff"/>`;
      if (s > 0.8) for (let k = 0; k <= 10; k++) { const t = k / 10; g += bulb(rx - 10 * s + t * (w + 20 * s), top + 10 * s + Math.abs(Math.sin(t * Math.PI * 5)) * 5 * s, BULB[k % BULB.length], 2.6 * s); }
      return g + '</g>';
    };

    add(`<defs>
      <linearGradient id="wl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a40"/><stop offset=".4" stop-color="#22417c"/><stop offset=".75" stop-color="#6383bd"/><stop offset="1" stop-color="#b6c9e8"/></linearGradient>
      <linearGradient id="wl-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe9fb"/><stop offset="1" stop-color="#f6f9ff"/></linearGradient>
      <linearGradient id="wl-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fc4e6"/><stop offset=".5" stop-color="#cfe5f7"/><stop offset="1" stop-color="#86b0d8"/></linearGradient>
      <linearGradient id="wl-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f5aa0"/><stop offset=".5" stop-color="#1f3f7a"/><stop offset="1" stop-color="#132a57"/></linearGradient>
      <linearGradient id="wl-ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18336a"/><stop offset="1" stop-color="#0c1d42"/></linearGradient>
      <linearGradient id="wl-silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c3d0e6"/><stop offset="1" stop-color="#7d8db0"/></linearGradient>
      <radialGradient id="wl-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8" stop-opacity=".7"/><stop offset="1" stop-color="#fffbe8" stop-opacity="0"/></radialGradient>
      <radialGradient id="wl-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="wl-vig" cx="800" cy="520" r="1000" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#050a1e" stop-opacity=".55"/></radialGradient>
      <filter id="wl-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="wl-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#081030" flood-opacity=".45"/></filter>
    </defs>`);

    add(`<rect width="${W}" height="${H}" fill="url(#wl-sky)"/>`);
    for (let i = 0; i < 90; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 330))}" r="${f(rr(0.5, 1.6))}" fill="#fff" opacity="${f(rr(0.3, 0.9))}"/>`);
    add(`<circle cx="230" cy="190" r="90" fill="url(#wl-moon)"/><path d="M230 158 a32 32 0 1 0 22 56 a26 26 0 1 1 -22 -56Z" fill="#fffbe6"/>`);

    // far mountains and hills
    add(`<path d="M0 470 L120 400 L210 440 L330 360 L460 450 L560 410 L700 470 L820 400 L960 460 L1100 380 L1240 450 L1360 400 L1480 450 L1600 410 V600 H0Z" fill="#8ea7d0"/>
      <path d="M120 400 L150 418 L170 412 L210 440 L180 436 L150 426Z M330 360 L370 395 L350 392 L330 380 L310 392 L290 395Z M820 400 L850 425 L820 418 L795 424Z M1100 380 L1140 410 L1110 404 L1080 412Z M1360 400 L1390 420 L1360 414 L1335 422Z" fill="#eef4ff"/>
      <path d="M0 540 Q200 490 420 530 Q640 570 860 520 Q1080 480 1300 525 Q1460 556 1600 520 V700 H0Z" fill="#c9d8f0"/>`);
    for (let i = 0; i < 46; i++) { const x = rr(0, W), y = rr(520, 560); add(`<path d="M${f(x)} ${f(y - 26)} l9 26 h-18Z" fill="#4c6a98" opacity=".8"/>`); }
    add(`<path d="M0 600 Q260 560 520 590 Q800 620 1060 585 Q1340 556 1600 596 V1000 H0Z" fill="url(#wl-snow)"/>`);

    // far cottages
    COTTAGES.slice(0, 5).forEach((c) => add(cottage(c)));

    // church on the rise
    add(`<path d="M820 610 Q1000 560 1180 612 Z" fill="#e6eefc"/>`);
    add(`<g filter="url(#wl-shadow)">
      <rect x="930" y="430" width="160" height="170" fill="#d9cfc0"/><rect x="930" y="430" width="160" height="170" fill="#26346a" opacity=".22"/>
      <path d="M912 438 L1010 360 L1108 438Z" fill="#4a3c4a"/><path d="M906 442 L1010 352 L1114 442 L1100 448 L1010 372 L920 448Z" fill="#f3f7ff"/>
      <rect x="980" y="250" width="60" height="190" fill="#e2d8c8"/><rect x="980" y="250" width="60" height="190" fill="#26346a" opacity=".18"/>
      <path d="M972 256 L1010 130 L1048 256Z" fill="#3c3446"/><path d="M1010 130 L1022 170 L1010 166Z" fill="#f3f7ff" opacity=".9"/><path d="M968 258 h84 l-6 -10 h-72Z" fill="#f3f7ff"/>
      <path d="M1010 112 v20 M1002 120 h16" stroke="#e2c46a" stroke-width="4"/>
      <circle cx="1010" cy="300" r="16" fill="#f6efe2" stroke="#3c3446" stroke-width="3"/><path d="M1010 300 v-10 M1010 300 l7 4" stroke="#3c3446" stroke-width="2"/>
      <path d="M996 340 v-14 q14 -16 28 0 v14Z" fill="#3a3044"/>
      <path d="M948 520 v-50 q16 -22 32 0 v50Z M1040 520 v-50 q16 -22 32 0 v50Z" fill="#ffcf70"/>
      <path d="M948 520 v-50 q16 -22 32 0 v50Z M1040 520 v-50 q16 -22 32 0 v50Z M964 450 v70 M1056 450 v70 M948 490 h32 M1040 490 h32" stroke="#4a3c4a" stroke-width="3" fill="none"/>
      <path d="M990 600 v-62 q20 -26 40 0 v62Z" fill="#5a2e22"/><path d="M990 600 v-62 q20 -26 40 0 v62Z" fill="none" stroke="#3a2a22" stroke-width="4"/>
    </g>`);
    add(`<circle cx="964" cy="490" r="60" fill="url(#wl-warm)"/><circle cx="1056" cy="490" r="60" fill="url(#wl-warm)"/>`);
    add(`<path d="M900 604 Q1010 586 1120 606 L1120 616 Q1010 600 900 616Z" fill="#f3f7ff"/>`);

    // village tree with lights by the church
    add(frostedPine(1180, 610, 130, '#1a4030', '#25553f'));
    for (let i = 0; i < 16; i++) { const t = i / 15, y = 495 + t * 100, hw = 6 + t * 42; add(bulb(1180 + Math.sin(i * 2.3) * hw * 0.8, y, BULB[i % BULB.length], 3)); }

    // frozen stream winding down
    const stream = 'M720 600 C760 640 640 680 700 730 C760 780 900 790 860 850 C820 910 700 940 760 1000 L980 1000 C900 950 1020 900 1010 850 C1000 790 840 760 800 730 C760 700 840 650 760 600Z';
    add(`<path d="${stream}" fill="url(#wl-ice)"/><path d="${stream}" fill="none" stroke="#f6f9ff" stroke-width="10" opacity=".9"/>`);
    for (let i = 0; i < 14; i++) add(`<path d="M${f(rr(700, 940))} ${f(rr(700, 990))} l${f(rr(20, 50))} ${f(rr(-6, 6))}" stroke="#ffffff" stroke-width="2" opacity=".7" stroke-linecap="round"/>`);
    [[730, 640], [720, 715], [820, 770], [880, 830], [800, 900], [860, 960], [770, 690], [940, 920]].forEach(([x, y]) => glints.push({ x, y }));

    // clusters of frosted pines through the village
    [[90, 600, 90], [140, 610, 70], [470, 600, 80], [760, 590, 70], [820, 600, 95], [1360, 590, 80], [1520, 600, 100], [1580, 596, 70], [440, 690, 110], [1110, 700, 120], [1060, 690, 80]].forEach(([x, b, h]) => add(frostedPine(x, b, h, '#1d4535', '#28594a')));
    // skaters on the ice
    const skater = (x, y, c, scarf, flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)"><ellipse cx="0" cy="2" rx="16" ry="3" fill="#5c7fae" opacity=".5"/><path d="M-3 0 l-6 -26 M3 0 l8 -24" stroke="#2a2238" stroke-width="5" stroke-linecap="round"/><path d="M-12 0 h10 M4 0 h12" stroke="#c9d2e0" stroke-width="2"/><path d="M-8 -24 Q-10 -50 2 -52 Q14 -50 10 -24Z" fill="${c}"/><path d="M-4 -50 L-26 -40 M6 -48 L24 -58" stroke="${c}" stroke-width="5" stroke-linecap="round"/><circle cx="2" cy="-60" r="8" fill="#f0c8a8"/><path d="M-6 -62 Q2 -76 10 -62Z" fill="${scarf}"/><circle cx="2" cy="-73" r="3" fill="#fff"/><path d="M-6 -50 h16 l-12 14" stroke="${scarf}" stroke-width="4" fill="none"/></g>`;
    add(skater(760, 905, '#b3172b', '#f6efe2', 0)); add(skater(830, 935, '#1f5fa8', '#e0b24a', 1));
    // snowman by the lane
    add(`<g transform="translate(565 860)"><ellipse cx="0" cy="6" rx="40" ry="8" fill="#9db3d8" opacity=".6"/><circle cx="0" cy="-18" r="30" fill="#fbfdff"/><circle cx="0" cy="-62" r="22" fill="#fbfdff"/><circle cx="0" cy="-96" r="16" fill="#fbfdff"/><circle cx="-5" cy="-100" r="2" fill="#222"/><circle cx="5" cy="-100" r="2" fill="#222"/><path d="M0 -95 l14 3 l-14 2Z" fill="#e8782a"/><circle cx="0" cy="-66" r="2.5" fill="#222"/><circle cx="0" cy="-56" r="2.5" fill="#222"/><path d="M-16 -82 Q0 -74 16 -82 L14 -76 Q0 -70 -14 -76Z M8 -78 l6 20 l-8 -2Z" fill="#c4222f"/><rect x="-14" y="-128" width="28" height="20" fill="#222"/><rect x="-20" y="-110" width="40" height="4" fill="#222"/><path d="M-20 -62 l-26 -18 M20 -62 l26 -16" stroke="#5a3a22" stroke-width="3" stroke-linecap="round"/></g>`);
    // a cardinal on the fence
    add(`<g transform="translate(388 744)"><path d="M-10 0 Q-12 -14 0 -16 Q8 -24 10 -14 Q16 -10 12 -6 Q8 2 -10 0Z" fill="#c4222f"/><path d="M-10 -2 l-10 -2 l2 6Z" fill="#8a1020"/><path d="M10 -14 l6 2 l-6 2Z" fill="#f0a030"/><circle cx="6" cy="-14" r="1.6" fill="#111"/></g>`);
    // second lamp
    add(`<circle cx="1090" cy="780" r="70" fill="url(#wl-warm)"/><rect x="1086" y="792" width="8" height="120" fill="#1b2034"/><path d="M1076 770 h28 l-4 24 h-20Z" fill="#ffe3a0" stroke="#1b2034" stroke-width="3"/><path d="M1072 770 L1090 756 L1108 770Z" fill="#1b2034"/><path d="M1070 768 L1090 752 L1110 768" stroke="#f3f7ff" stroke-width="4" fill="none"/>`);
    lights.push({ x: 1090, y: 782, c: '#ffd98a', r: 6 });
    // mid cottages
    COTTAGES.slice(5, 8).forEach((c) => add(cottage(c)));

    // stone bridge over the stream
    add(`<g filter="url(#wl-shadow)">
      <path d="M640 790 Q820 700 1000 790 L1000 830 L960 830 Q820 760 680 830 L640 830Z" fill="#8f8a92"/>
      <path d="M640 790 Q820 700 1000 790" stroke="#6b6670" stroke-width="3" fill="none"/>
      <path d="M680 830 Q820 760 960 830" stroke="#5a5560" stroke-width="4" fill="none"/>
      <path d="M632 788 Q820 690 1008 788 L1008 776 Q820 680 632 776Z" fill="#f3f7ff"/>
    </g>`);
    for (let i = 0; i < 8; i++) { const t = (i + 0.5) / 8, bx = 640 + t * 360, by = 790 - Math.sin(t * Math.PI) * 88 + 14; add(`<path d="M${f(bx - 14)} ${f(by)} h28" stroke="#6b6670" stroke-width="2"/>`); }

    // lamp post on the path
    add(`<circle cx="520" cy="700" r="70" fill="url(#wl-warm)"/><rect x="516" y="712" width="8" height="120" fill="#1b2034"/><path d="M506 690 h28 l-4 24 h-20Z" fill="#ffe3a0" stroke="#1b2034" stroke-width="3"/><path d="M502 690 L520 676 L538 690Z" fill="#1b2034"/><path d="M500 688 L520 672 L540 688" stroke="#f3f7ff" stroke-width="4" fill="none"/>`);
    lights.push({ x: 520, y: 702, c: '#ffd98a', r: 6 });

    // fence along the lane
    for (let i = 0; i < 9; i++) { const x = 240 + i * 46, y = 760 + i * 3; add(`<rect x="${x}" y="${y - 34}" width="8" height="40" fill="#5a4030"/><path d="M${x - 2} ${y - 34} q6 -8 12 0Z" fill="#f3f7ff"/>`); }
    add(`<path d="M240 742 L620 768 M240 756 L620 782" stroke="#5a4030" stroke-width="4"/><path d="M240 740 L620 766" stroke="#f3f7ff" stroke-width="3"/>`);

    // big frosted pines (sides) and near cottages
    add(frostedPine(1320, 1000, 420));
    add(frostedPine(1570, 820, 330));
    add(frostedPine(60, 760, 300));
    add(frostedPine(420, 1000, 260, '#1b4232', '#245440'));
    COTTAGES.slice(8).forEach((c) => add(cottage(c)));

    // foreground drifts
    add(`<path d="M0 930 Q240 880 520 930 Q760 970 1000 935 Q1240 900 1600 950 V1000 H0Z" fill="#f6f9ff"/><path d="M0 965 Q400 940 800 968 Q1200 990 1600 960 V1000 H0Z" fill="#e3ecfb"/>`);

    // ribbon banner (title) — frosty blue with silver trim
    add(`<g filter="url(#wl-shadow)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#wl-ribbonDark)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#wl-ribbonDark)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#08142e"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#08142e"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#wl-ribbon)"/>
      <path d="M528 86 Q800 30 1072 86 M528 140 Q800 84 1072 140" stroke="url(#wl-silver)" stroke-width="3" fill="none"/>
      <path d="M528 92 Q800 36 1072 92" stroke="#e8f0ff" stroke-width="1" fill="none" stroke-dasharray="2 5" opacity=".7"/>
    </g>`);
    // little snowflakes on the ribbon tails
    [[470, 120], [1130, 120]].forEach(([x, y]) => add(`<g stroke="#e8f0ff" stroke-width="2" stroke-linecap="round">${[0, 60, 120].map((a) => `<path d="M${f(x - Math.cos((a * Math.PI) / 180) * 9)} ${f(y - Math.sin((a * Math.PI) / 180) * 9)} L${f(x + Math.cos((a * Math.PI) / 180) * 9)} ${f(y + Math.sin((a * Math.PI) / 180) * 9)}"/>`).join('')}</g>`));
    add(`<rect width="${W}" height="${H}" fill="url(#wl-vig)"/>`);

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles, glints };
  }

  A.designs.wonderland = {
    id: 'wonderland',
    name: 'Winter Wonderland',
    blurb: 'A hushed village under deep snow and lamplight.',
    width: W, height: H, build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#f4f8ff', stroke: '#0c1d42' },
    numStyles: ['n-cream', 'n-tag', 'n-gold', 'n-swash', 'n-cream'],
    effects: [
      { type: 'twinkle' },
      { type: 'glow', x: 1010, y: 490, r: 120, color: '255,200,110', a: 0.18, speed: 0.8 },
      ...COTTAGES.map((c) => { const [x, y] = chimneyTop(c); return { type: 'smoke', x, y: y - 4, rate: 1.1, rise: 12 + c[2] * 6, size: 6 + c[2] * 6, a: 0.22, color: '215,224,244' }; }),
      {
        type: 'custom',
        draw(ctx, t, dt, st, d, data) {
          ctx.globalCompositeOperation = 'lighter';
          (data.glints || []).forEach((g, i) => {
            const a = Math.max(0, Math.sin(t * 1.3 + i * 1.9)) ** 6;
            if (a < 0.02) return;
            ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
            const s = 7;
            ctx.beginPath(); ctx.moveTo(g.x, g.y - s); ctx.lineTo(g.x + 1.4, g.y); ctx.lineTo(g.x, g.y + s); ctx.lineTo(g.x - 1.4, g.y); ctx.fill();
            ctx.beginPath(); ctx.moveTo(g.x - s, g.y); ctx.lineTo(g.x, g.y + 1.4); ctx.lineTo(g.x + s, g.y); ctx.lineTo(g.x, g.y - 1.4); ctx.fill();
          });
        },
      },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 200 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 50, size: 1.9, speed: 1.3, a: 0.75 },
    ],
    layout: 'wonderland',
    keepOut: [[440, 18, 720, 172]],
    day24: { x: 925, y: 440, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/wonderland.js', e); }
/* ---- src/layouts/wonderland.js ---- */
try {
/* Door layout for "Winter Wonderland" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["wonderland"]=[{"day":1,"x":57,"y":37,"w":150,"h":124,"hinge":"right"},
{"day":2,"x":1267,"y":482,"w":150,"h":144,"hinge":"right"},
{"day":3,"x":1168,"y":674,"w":126,"h":150,"hinge":"left"},
{"day":4,"x":291,"y":331,"w":104,"h":120,"hinge":"top"},
{"day":5,"x":1314,"y":55,"w":120,"h":150,"hinge":"left"},
{"day":6,"x":557,"y":220,"w":116,"h":150,"hinge":"left"},
{"day":7,"x":1160,"y":337,"w":114,"h":88,"hinge":"top"},
{"day":8,"x":1106,"y":852,"w":144,"h":116,"hinge":"left"},
{"day":9,"x":614,"y":832,"w":144,"h":140,"hinge":"right"},
{"day":10,"x":741,"y":666,"w":128,"h":150,"hinge":"right"},
{"day":11,"x":550,"y":628,"w":124,"h":150,"hinge":"left"},
{"day":12,"x":1310,"y":656,"w":98,"h":114,"hinge":"right"},
{"day":13,"x":302,"y":831,"w":150,"h":138,"hinge":"right"},
{"day":14,"x":1455,"y":174,"w":110,"h":114,"hinge":"top"},
{"day":15,"x":162,"y":197,"w":116,"h":150,"hinge":"left"},
{"day":16,"x":241,"y":466,"w":150,"h":140,"hinge":"right"},
{"day":17,"x":38,"y":622,"w":150,"h":116,"hinge":"top"},
{"day":18,"x":787,"y":250,"w":150,"h":128,"hinge":"right"},
{"day":19,"x":1425,"y":308,"w":126,"h":150,"hinge":"left"},
{"day":20,"x":45,"y":823,"w":106,"h":132,"hinge":"right"},
{"day":21,"x":1437,"y":793,"w":118,"h":150,"hinge":"left"},
{"day":22,"x":319,"y":623,"w":92,"h":114,"hinge":"left"},
{"day":23,"x":673,"y":428,"w":118,"h":150,"hinge":"left"},
{"day":24,"x":925,"y":440,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/wonderland.js', e); }
/* ---- src/designs/workshop.js ---- */
try {
/* Design — "Santa's Workshop"
   A warm timber workshop on Christmas Eve: elves at their benches, shelves of toys,
   a pot-bellied stove, a long list on a scroll, presents riding a conveyor belt and
   snow falling past the big arched window. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(31224);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a'];
    const TOY = ['#c4222f', '#2a5aa8', '#e0b24a', '#1f7d45', '#7a3fa0', '#f08a2a'];

    function bulb(x, y, c, r = 4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.5)}" fill="${c}" opacity=".22"/><rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".7"/>`;
    }
    function sprig(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + rr(-0.3, 0.3), l = r * rr(0.9, 1.4); s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/><ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    function gift(x, y, w, h, fill, rib, d = 10) {
      return `<g><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".2"/>
        <path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".3"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 4}" y="${y}" width="8" height="${h}" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 4}" width="${w}" height="8" fill="${rib}"/>
        <path d="M${x + w / 2 - 4} ${y} l${d} ${-d * 0.6} h8 l${-d} ${d * 0.6}Z" fill="${rib}"/></g>${bow(x + w / 2 + d / 2, y - d * 0.3, Math.min(0.5, w / 120), rib, '#00000055')}`;
    }

    /* ---------- toys ---------- */
    function teddy(x, y, s, c = '#a8682f') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><circle cx="-14" cy="-58" r="8" fill="${c}"/><circle cx="14" cy="-58" r="8" fill="${c}"/><circle cx="-14" cy="-58" r="4" fill="#e8c9a0"/><circle cx="14" cy="-58" r="4" fill="#e8c9a0"/>
        <ellipse cx="0" cy="-16" rx="20" ry="18" fill="${c}"/><ellipse cx="0" cy="-12" rx="11" ry="10" fill="#e8c9a0"/><circle cx="0" cy="-46" r="17" fill="${c}"/><ellipse cx="0" cy="-41" rx="8" ry="6" fill="#e8c9a0"/>
        <circle cx="-6" cy="-49" r="2" fill="#1a0c06"/><circle cx="6" cy="-49" r="2" fill="#1a0c06"/><circle cx="0" cy="-43" r="2.4" fill="#1a0c06"/>
        <ellipse cx="-18" cy="-2" rx="8" ry="6" fill="${c}"/><ellipse cx="18" cy="-2" rx="8" ry="6" fill="${c}"/><path d="M-8 -30 l8 5 l8 -5 l-2 8 h-12Z" fill="#c4222f"/></g>`;
    }
    function drum(x, y, s, c = '#c4222f') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-22" y="-34" width="44" height="34" fill="${c}"/><path d="M-22 -34 L-8 0 L4 -34 L16 0 L22 -20" stroke="#f0d07a" stroke-width="2.5" fill="none"/><ellipse cx="0" cy="-34" rx="22" ry="7" fill="#f4ecd8" stroke="#c9a24a" stroke-width="3"/><rect x="-22" y="-4" width="44" height="4" fill="#c9a24a"/><path d="M-6 -40 l-16 -16 M6 -40 l16 -16" stroke="#7a4a26" stroke-width="3" stroke-linecap="round"/></g>`;
    }
    function rockingHorse(x, y, s, c = '#f4ecd8') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-44 0 Q0 18 44 0" stroke="#7a2a1a" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M-28 4 L-22 -24 M-12 8 L-10 -24 M12 8 L10 -24 M28 4 L22 -24" stroke="${c}" stroke-width="5"/>
        <ellipse cx="0" cy="-30" rx="30" ry="12" fill="${c}"/><path d="M22 -36 L34 -60 Q40 -66 46 -60 L44 -48 Q34 -46 30 -32Z" fill="${c}"/>
        <path d="M24 -42 Q20 -58 30 -64" stroke="#c4222f" stroke-width="5" fill="none"/><circle cx="40" cy="-58" r="2" fill="#1a0c06"/>
        <path d="M-28 -32 q-14 4 -16 18" stroke="#c4222f" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="-10" y="-42" width="18" height="8" rx="3" fill="#c4222f"/></g>`;
    }
    function toyTrain(x, y, s) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-40" y="-26" width="34" height="18" fill="#2a5aa8"/><rect x="-38" y="-44" width="16" height="18" fill="#c4222f"/><rect x="-14" y="-40" width="6" height="14" fill="#1a1a22"/>
        <rect x="0" y="-24" width="30" height="16" fill="#e0b24a"/><rect x="-46" y="-12" width="80" height="4" fill="#1a1a22"/>
        <circle cx="-32" cy="-4" r="6" fill="#1a1a22"/><circle cx="-14" cy="-4" r="6" fill="#1a1a22"/><circle cx="8" cy="-4" r="6" fill="#1a1a22"/><circle cx="24" cy="-4" r="6" fill="#1a1a22"/></g>`;
    }
    function soldier(x, y, s) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-7" y="-20" width="5" height="20" fill="#1a1a22"/><rect x="2" y="-20" width="5" height="20" fill="#1a1a22"/><rect x="-9" y="-46" width="18" height="28" fill="#c4222f"/><path d="M-9 -40 h18 M-9 -30 h18" stroke="#e0b24a" stroke-width="2"/><circle cx="0" cy="-54" r="8" fill="#f2c9a0"/><rect x="-8" y="-76" width="16" height="18" rx="3" fill="#1a1a22"/><rect x="-9" y="-60" width="18" height="3" fill="#e0b24a"/></g>`;
    }
    function ball(x, y, r) {
      const a = pick(TOY), b = pick(TOY);
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${a}"/><path d="M${f(x - r)} ${f(y)} Q${f(x)} ${f(y - r * 0.6)} ${f(x + r)} ${f(y)} Q${f(x)} ${f(y + r * 0.6)} ${f(x - r)} ${f(y)}Z" fill="${b}"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.4)}" r="${f(r * 0.22)}" fill="#fff" opacity=".6"/>`;
    }
    function blocks(x, y, s) {
      let o = `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">`;
      [[-30, -20], [-8, -20], [14, -20], [-19, -42], [3, -42], [-8, -64]].forEach(([bx, by], i) => {
        o += `<rect x="${bx}" y="${by}" width="20" height="20" rx="2" fill="${TOY[i % TOY.length]}"/><rect x="${bx + 5}" y="${by + 5}" width="10" height="10" rx="1" fill="#fff" opacity=".35"/>`;
      });
      return o + '</g>';
    }
    function spinTop(x, y, s) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M0 0 L-20 -22 Q0 -40 20 -22Z" fill="${pick(TOY)}"/><path d="M-20 -22 Q0 -40 20 -22 Q0 -16 -20 -22Z" fill="${pick(TOY)}"/><rect x="-2" y="-44" width="4" height="12" fill="#7a4a26"/></g>`;
    }
    function doll(x, y, s) {
      const c = pick(['#c4222f', '#7a3fa0', '#2a5aa8']);
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-16 0 L-8 -34 H8 L16 0Z" fill="${c}"/><circle cx="0" cy="-44" r="11" fill="#f6d3b0"/><path d="M-12 -46 Q-12 -60 0 -60 Q12 -60 12 -46 Q10 -54 0 -54 Q-10 -54 -12 -46Z" fill="#e0a040"/><circle cx="-4" cy="-44" r="1.5" fill="#1a0c06"/><circle cx="4" cy="-44" r="1.5" fill="#1a0c06"/><circle cx="-6" cy="-40" r="2" fill="#f4a0a0" opacity=".7"/><circle cx="6" cy="-40" r="2" fill="#f4a0a0" opacity=".7"/></g>`;
    }

    /* ---------- an elf ---------- */
    function elf(x, y, s, flip, opts = {}) {
      const tunic = opts.tunic || '#1f7d45', hat = opts.hat || '#1f7d45';
      const sx = flip ? -s : s;
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sx)} ${f(s)})">
        <ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity=".25"/>
        <rect x="-14" y="-46" width="10" height="44" fill="#f4ecd8"/><rect x="4" y="-46" width="10" height="44" fill="#f4ecd8"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="-14" y="${-44 + i * 11}" width="10" height="5" fill="#c4222f"/><rect x="4" y="${-44 + i * 11}" width="10" height="5" fill="#c4222f"/>`).join('')}
        <path d="M-16 -4 h14 q-2 8 -18 6 q-8 -2 -10 -8 q6 2 14 2Z" fill="#6b3a1c"/><path d="M2 -4 h14 q10 0 14 -6 q-2 8 -12 12 h-16Z" fill="#6b3a1c"/>
        <path d="M-26 -44 L-20 -96 H20 L26 -44Z" fill="${tunic}"/><rect x="-24" y="-60" width="48" height="8" fill="#3a1f0c"/><rect x="-5" y="-62" width="10" height="12" fill="#e0b24a"/>
        <path d="M-22 -96 l-22 34 l8 4 l18 -26Z" fill="${tunic}"/><circle cx="-38" cy="-58" r="7" fill="#f2c9a0"/>
        <path d="M22 -96 l20 26 l-6 6 l-18 -18Z" fill="${tunic}"/><circle cx="40" cy="-66" r="7" fill="#f2c9a0"/>
        <path d="M-26 -98 ${[0, 1, 2, 3, 4].map((i) => `q${5.2} 10 ${10.4} 0`).join(' ')} v-6 h-52Z" fill="#c4222f"/>
        ${[-20, -10, 0, 10, 20].map((bx) => `<circle cx="${bx}" cy="-92" r="2.6" fill="#f0d07a"/>`).join('')}
        <path d="M-26 -126 l-12 -12 l10 20Z M26 -126 l12 -12 l-10 20Z" fill="#f2c9a0"/>
        <circle cx="0" cy="-122" r="24" fill="#f2c9a0"/>
        <path d="M-22 -128 Q-18 -146 0 -146 Q18 -146 22 -128 Q14 -136 0 -136 Q-14 -136 -22 -128Z" fill="#8a4a1c"/>
        <circle cx="-14" cy="-114" r="5" fill="#f08a8a" opacity=".55"/><circle cx="14" cy="-114" r="5" fill="#f08a8a" opacity=".55"/>
        <circle cx="-8" cy="-124" r="2.6" fill="#1a0c06"/><circle cx="8" cy="-124" r="2.6" fill="#1a0c06"/><path d="M-7 -112 q7 6 14 0" stroke="#7a2a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="0" cy="-118" r="3" fill="#e8a888"/>
        <path d="M-26 -136 Q-20 -176 10 -188 Q36 -196 52 -176 Q36 -182 24 -174 Q22 -150 26 -136Z" fill="${hat}"/>
        <rect x="-28" y="-142" width="56" height="10" rx="5" fill="#c4222f"/><circle cx="52" cy="-176" r="7" fill="#f0d07a"/><circle cx="50" cy="-178" r="2" fill="#fff"/>
      </g>`;
    }

    /* ---------- defs ---------- */
    add(`<defs>
      <linearGradient id="ws-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3016"/><stop offset=".6" stop-color="#7a4422"/><stop offset="1" stop-color="#5e3418"/></linearGradient>
      <linearGradient id="ws-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3c1e"/><stop offset="1" stop-color="#3a1f0c"/></linearGradient>
      <linearGradient id="ws-shelf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6234"/><stop offset="1" stop-color="#5e3418"/></linearGradient>
      <linearGradient id="ws-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2814"/><stop offset="1" stop-color="#6e3e1e"/></linearGradient>
      <linearGradient id="ws-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#091a3a"/><stop offset=".7" stop-color="#22457a"/><stop offset="1" stop-color="#4a6aa0"/></linearGradient>
      <linearGradient id="ws-iron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1a1f"/><stop offset=".4" stop-color="#3a3b44"/><stop offset="1" stop-color="#121216"/></linearGradient>
      <linearGradient id="ws-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="ws-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ws-ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <linearGradient id="ws-paper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcbc"/><stop offset=".5" stop-color="#fbf3df"/><stop offset="1" stop-color="#e2d2ae"/></linearGradient>
      <linearGradient id="ws-candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <radialGradient id="ws-fireLight" cx="170" cy="700" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffa050" stop-opacity=".3"/><stop offset="1" stop-color="#ffa050" stop-opacity="0"/></radialGradient>
      <radialGradient id="ws-warm" cx="800" cy="520" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd28a" stop-opacity=".18"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></radialGradient>
      <radialGradient id="ws-vig" cx="800" cy="500" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140602" stop-opacity=".62"/></radialGradient>
      <radialGradient id="ws-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff9e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></radialGradient>
      <radialGradient id="ws-cglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <pattern id="ws-gstripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#f4ede0"/><rect width="6" height="14" fill="#c4222f"/></pattern>
      <pattern id="ws-gdots" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#2a5aa8"/><circle cx="7" cy="7" r="2.2" fill="#e8f0ff"/></pattern>
      <pattern id="ws-gstar" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#20553a"/><circle cx="10" cy="10" r="2.6" fill="#e9c060"/></pattern>
      <filter id="ws-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="ws-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000" flood-opacity=".45"/></filter>
    </defs>`);

    /* ---------- walls, beams, floor ---------- */
    add(`<rect width="${W}" height="800" fill="url(#ws-wall)"/>`);
    let planks = '';
    for (let x = 0; x < W; x += 58) planks += `<rect x="${x}" y="0" width="2.5" height="800" fill="#2e1608" opacity=".6"/><rect x="${x + 3}" y="0" width="1.5" height="800" fill="#b07a46" opacity=".25"/>`;
    for (let i = 0; i < 40; i++) planks += `<ellipse cx="${f(rr(10, W))}" cy="${f(rr(20, 780))}" rx="${f(rr(4, 9))}" ry="${f(rr(2, 4))}" fill="#3a1d0b" opacity=".5"/>`;
    add(planks);
    add(`<rect y="0" width="${W}" height="30" fill="url(#ws-beam)"/><rect y="28" width="${W}" height="5" fill="#2a1408"/>`);
    [180, 820, 1420].forEach((x) => add(`<rect x="${x - 16}" y="0" width="32" height="800" fill="url(#ws-beam)" opacity=".9"/><rect x="${x - 16}" y="0" width="4" height="800" fill="#b07a46" opacity=".3"/>`));
    add(`<rect y="790" width="${W}" height="210" fill="url(#ws-floor)"/>`);
    let fl = '';
    for (let y = 792, h = 18, r = 0; y < H; y += h, h = Math.round(h * 1.16), r++) {
      fl += `<rect y="${y}" width="${W}" height="${h}" fill="${r % 2 ? '#4f2c16' : '#5e351b'}"/><rect y="${y}" width="${W}" height="1.6" fill="#24110a" opacity=".8"/>`;
      for (let x = (r * 151) % 240; x < W; x += 240 + (r % 3) * 50) fl += `<rect x="${x}" y="${y}" width="2" height="${h}" fill="#24110a" opacity=".7"/>`;
    }
    add(fl);
    add(`<rect y="782" width="${W}" height="14" fill="#2a1409"/>`);
    // wood shavings
    for (let i = 0; i < 26; i++) add(`<path d="M${f(rr(280, 1320))} ${f(rr(900, 990))} q6 -8 12 0 q-6 6 -12 0" stroke="#e0b07a" stroke-width="2" fill="none" opacity=".8"/>`);

    /* ---------- the window ---------- */
    add(`<path d="M630 528 V300 Q630 186 800 184 Q970 186 970 300 V528Z" fill="#7a4a26"/>`);
    add(`<path d="M648 516 V304 Q648 202 800 200 Q952 202 952 304 V516Z" fill="url(#ws-night)"/>`);
    let wst = '';
    for (let i = 0; i < 40; i++) wst += `<circle cx="${f(rr(656, 944))}" cy="${f(rr(210, 400))}" r="${f(rr(0.6, 1.6))}" fill="#fff" opacity="${f(rr(0.4, 1))}"/>`;
    add(wst);
    add(`<circle cx="880" cy="262" r="60" fill="url(#ws-moon)"/><circle cx="880" cy="262" r="18" fill="#fff6d8"/>`);
    // snowy village + north pole outside
    add(`<path d="M648 440 Q720 410 800 430 Q880 448 952 420 V516 H648Z" fill="#dce8f8"/>`);
    [[680, 450, '#7a3a26'], [740, 440, '#5a3a6a'], [860, 446, '#2f5a46'], [910, 452, '#7a3a26']].forEach(([x, y, c]) => add(`<rect x="${x - 18}" y="${y - 20}" width="36" height="26" fill="${c}"/><path d="M${x - 24} ${y - 18} L${x} ${y - 40} L${x + 24} ${y - 18}Z" fill="#f4f9ff"/><rect x="${x - 6}" y="${y - 12}" width="10" height="9" fill="#ffcf70"/>`));
    add(`<rect x="794" y="350" width="12" height="110" fill="#f4f4f4"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M794 ${356 + i * 16} l12 -8 v6 l-12 8Z" fill="#c4222f"/>`).join('')}<circle cx="800" cy="346" r="9" fill="url(#ws-gold)"/>`);
    add(`<path d="M648 486 Q720 466 800 480 Q880 494 952 474 V516 H648Z" fill="#f4f9ff"/>`);
    add(`<path d="M800 200 V516 M648 360 H952" stroke="#7a4a26" stroke-width="10"/><path d="M648 304 Q648 202 800 200 Q952 202 952 304" stroke="#5e3418" stroke-width="4" fill="none"/>`);
    add(`<rect x="616" y="520" width="368" height="20" rx="3" fill="#8a5a30"/><rect x="616" y="520" width="368" height="4" fill="#c48d55"/>`);
    // candles on the sill
    [[668, 46], [700, 64], [900, 64], [932, 46]].forEach(([x, h]) => {
      add(`<rect x="${x - 13}" y="512" width="26" height="8" rx="2" fill="url(#ws-gold)"/><rect x="${x - 9}" y="${520 - h}" width="18" height="${h - 8}" rx="3" fill="url(#ws-candle)"/><path d="M${x} ${520 - h} v-7" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${520 - h - 14}" r="30" fill="url(#ws-cglow)"/>`);
      candles.push({ x, y: 520 - h - 9, s: 1 });
    });
    // wreath on the window
    let wr = '';
    for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.283; wr += sprig(800 + Math.cos(a) * 32, 280 + Math.sin(a) * 32, 9); }
    add(wr + bow(800, 312, 0.6));

    /* ---------- shelves of toys ---------- */
    function shelves(x0, x1, rows, items) {
      let s = `<rect x="${x0 - 12}" y="${rows[0] - 130}" width="12" height="${rows[rows.length - 1] - rows[0] + 150}" fill="url(#ws-shelf)"/><rect x="${x1}" y="${rows[0] - 130}" width="12" height="${rows[rows.length - 1] - rows[0] + 150}" fill="url(#ws-shelf)"/>`;
      rows.forEach((y) => { s += `<rect x="${x0 - 14}" y="${y}" width="${x1 - x0 + 40}" height="14" fill="url(#ws-shelf)"/><rect x="${x0 - 14}" y="${y + 14}" width="${x1 - x0 + 40}" height="6" fill="#2a1408" opacity=".6"/>`; });
      return s + items;
    }
    add(`<g filter="url(#ws-shadow)">${shelves(40, 400, [300, 470, 640],
      teddy(80, 300, 1) + drum(150, 300, 1) + doll(205, 300, 1) + soldier(245, 300, 1) + soldier(272, 300, 1) + toyTrain(340, 300, 1.05)
      + rockingHorse(110, 470, 1.15) + ball(205, 452, 18) + blocks(275, 470, 0.95) + teddy(360, 470, 0.95, '#d9a066')
      + spinTop(70, 640, 1.2) + drum(130, 640, 1.2, '#2a5aa8') + doll(190, 640, 1.1) + ball(240, 622, 18) + toyTrain(320, 640, 1)
    )}</g>`);
    add(`<g filter="url(#ws-shadow)">${shelves(1200, 1560, [300, 470, 640],
      toyTrain(1250, 300, 1) + teddy(1330, 300, 1.05, '#d9a066') + ball(1385, 282, 18) + drum(1440, 300, 1) + doll(1500, 300, 1.05) + spinTop(1540, 300, 0.9)
      + blocks(1240, 470, 1) + soldier(1300, 470, 1.05) + soldier(1326, 470, 1.05) + rockingHorse(1420, 470, 1.15, '#d9a066') + spinTop(1520, 470, 1.1)
      + teddy(1240, 640, 1.05) + ball(1300, 622, 18) + toyTrain(1380, 640, 1) + drum(1460, 640, 1.1, '#1f7d45') + doll(1520, 640, 1)
    )}</g>`);

    /* ---------- clock (left of window) ---------- */
    add(`<g filter="url(#ws-shadow)" transform="translate(510 300)">
      <path d="M-50 -40 L0 -90 L50 -40 V60 H-50Z" fill="#6b3a1c"/><path d="M-58 -36 L0 -96 L58 -36" stroke="#3a1f0c" stroke-width="8" fill="none"/>
      <circle cx="0" cy="-12" r="34" fill="#f6efdc" stroke="url(#ws-gold)" stroke-width="5"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.283; return `<circle cx="${f(Math.cos(a) * 26)}" cy="${f(-12 + Math.sin(a) * 26)}" r="2.2" fill="#3a1f0c"/>`; }).join('')}
      <path d="M0 -12 L0 -34 M0 -12 L14 -2" stroke="#3a1f0c" stroke-width="3" stroke-linecap="round"/>
      <rect x="-18" y="30" width="36" height="24" rx="2" fill="#2a1408"/><path d="M0 60 V120" stroke="url(#ws-gold)" stroke-width="3"/><circle cx="0" cy="124" r="10" fill="url(#ws-gold)"/>
      <path d="M-20 64 V140 M20 64 V128" stroke="#2a1408" stroke-width="2"/><path d="M-20 140 l-6 10 h12Z M20 128 l-6 10 h12Z" fill="url(#ws-gold)"/>
      ${bow(0, -88, 0.5)}
    </g>`);

    /* ---------- naughty & nice scroll ---------- */
    add(`<g filter="url(#ws-shadow)">
      <rect x="1018" y="186" width="104" height="14" rx="7" fill="#7a4a26"/><circle cx="1018" cy="193" r="9" fill="url(#ws-gold)"/><circle cx="1122" cy="193" r="9" fill="url(#ws-gold)"/>
      <path d="M1026 196 H1114 V620 Q1114 650 1086 654 Q1100 640 1080 632 H1026Z" fill="url(#ws-paper)"/>
      <path d="M1080 632 Q1060 640 1066 660 Q1090 672 1112 660" fill="#e2d2ae"/>
      <ellipse cx="1092" cy="660" rx="22" ry="9" fill="#d9c79f"/><ellipse cx="1092" cy="660" rx="10" ry="4" fill="#bfa97f"/>
    </g>`);
    let lines = '';
    for (let y = 220; y < 620; y += 16) {
      const w = rr(30, 62);
      lines += `<path d="M1040 ${y} q${f(w / 4)} -3 ${f(w / 2)} 0 t${f(w / 2)} 0" stroke="#5a3a26" stroke-width="1.6" fill="none" opacity=".75"/>`;
      lines += R() < 0.82 ? `<path d="M1098 ${y - 2} l4 4 l7 -9" stroke="#1f7d45" stroke-width="2.2" fill="none" stroke-linecap="round"/>` : `<path d="M1098 ${y - 5} l8 8 M1106 ${y - 5} l-8 8" stroke="#c4222f" stroke-width="2" stroke-linecap="round"/>`;
    }
    add(lines);
    add(`<path d="M1038 204 h60" stroke="#8f1d2b" stroke-width="3" stroke-linecap="round"/>`);

    /* ---------- stove ---------- */
    add(`<rect x="152" y="40" width="22" height="520" fill="url(#ws-iron)"/><rect x="146" y="300" width="34" height="10" fill="#2a2a30"/>`);
    add(`<g filter="url(#ws-shadow)">
      <rect x="96" y="790" width="150" height="14" rx="4" fill="#2a2a30"/>
      <path d="M110 800 l-8 20 h14 l6 -20Z M232 800 l8 20 h-14 l-6 -20Z" fill="#1a1a1f"/>
      <path d="M130 560 h66 v20 Q246 610 246 690 Q246 780 196 800 H130 Q80 780 80 690 Q80 610 130 580Z" fill="url(#ws-iron)"/>
      <rect x="124" y="552" width="78" height="14" rx="4" fill="#2a2a30"/>
      <path d="M86 640 h154 M84 740 h158" stroke="#c9a24a" stroke-width="3" opacity=".7"/>
      <path d="M118 734 V680 Q118 650 163 648 Q208 650 208 680 V734Z" fill="#1a0a04"/>
      <path d="M118 734 V680 Q118 650 163 648 Q208 650 208 680 V734" stroke="#c9a24a" stroke-width="4" fill="none"/>
      <path d="M130 734 v-60 M146 734 v-74 M163 734 v-80 M180 734 v-74 M196 734 v-60" stroke="#2a2a30" stroke-width="3"/>
    </g>`);
    add(`<rect x="70" y="760" width="40" height="30" fill="#7a4a26"/>${[0, 1, 2].map((i) => `<circle cx="${74 + i * 12}" cy="772" r="6" fill="#a8682f" stroke="#5a3218" stroke-width="2"/>`).join('')}`);
    // kettle
    add(`<g transform="translate(163 552)"><path d="M-22 0 Q-24 -26 0 -28 Q24 -26 22 0Z" fill="#b3172b"/><path d="M18 -14 l18 -10" stroke="#b3172b" stroke-width="6" stroke-linecap="round"/><path d="M-14 -24 Q0 -44 14 -24" stroke="#2a2a30" stroke-width="3" fill="none"/></g>`);

    /* ---------- string lights along the ceiling ---------- */
    const hooks = [0, 200, 420, 640, 960, 1180, 1400, 1600];
    for (let i = 0; i < hooks.length - 1; i++) {
      const a = hooks[i], b = hooks[i + 1], cx = (a + b) / 2;
      add(`<path d="M${a} 34 Q${cx} 110 ${b} 34" stroke="#1a1a12" stroke-width="2" fill="none"/>`);
      for (let k = 1; k < 9; k++) {
        const t = k / 9, x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * cx + t * t * b, y = (1 - t) * (1 - t) * 34 + 2 * (1 - t) * t * 110 + t * t * 34;
        add(bulb(x, y + 6, BULB[(i * 3 + k) % BULB.length], 4.4));
      }
    }

    /* ---------- conveyor belt with presents ---------- */
    add(`<g filter="url(#ws-shadow)">
      <rect x="270" y="610" width="1060" height="26" rx="13" fill="#2a2a30"/><rect x="276" y="604" width="1048" height="10" rx="5" fill="#3a3b44"/>
      ${Array.from({ length: 22 }, (_, i) => `<circle cx="${290 + i * 49}" cy="623" r="8" fill="#5a5b66" stroke="#1a1a1f" stroke-width="2"/>`).join('')}
      <path d="M320 636 l-10 150 M560 636 l0 150 M1040 636 l0 150 M1280 636 l10 150" stroke="#3a3b44" stroke-width="10"/>
    </g>`);
    [[300, 'url(#ws-gstripe)', '#1f7d45', 54, 44], [372, '#2a5aa8', '#f0d07a', 44, 54], [440, 'url(#ws-gstar)', '#c4222f', 60, 40], [670, '#c4222f', '#f0d07a', 50, 48], [740, 'url(#ws-gdots)', '#f4ede0', 46, 38], [990, '#7a3fa0', '#e0b24a', 56, 46], [1062, 'url(#ws-gstripe)', '#2a5aa8', 44, 56], [1130, '#e0b24a', '#c4222f', 58, 42], [1210, 'url(#ws-gstar)', '#f0d07a', 48, 50]].forEach(([x, fill, rib, w, h]) => add(gift(x, 604 - h, w, h, fill, rib, 8)));
    add(`<g transform="translate(1330 623)"><circle r="34" fill="#c9a24a"/>${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.283; return `<rect x="-6" y="-44" width="12" height="14" fill="#c9a24a" transform="rotate(${f((a * 180) / Math.PI)})"/>`; }).join('')}<circle r="12" fill="#7a5a20"/></g>`);

    /* ---------- workbenches with elves ---------- */
    function bench(x, w) {
      return `<g filter="url(#ws-shadow)"><rect x="${x}" y="760" width="${w}" height="24" rx="3" fill="#a8682f"/><rect x="${x}" y="760" width="${w}" height="5" fill="#d49a5c"/><rect x="${x + 16}" y="784" width="16" height="140" fill="#7a4a26"/><rect x="${x + w - 32}" y="784" width="16" height="140" fill="#7a4a26"/><rect x="${x + 16}" y="880" width="${w - 32}" height="10" fill="#6b3a1c"/></g>`;
    }
    add(elf(470, 770, 1, false, { tunic: '#1f7d45', hat: '#c4222f' }));
    add(bench(300, 330));
    add(rockingHorse(380, 760, 1.1, '#e9d6b0') + `<path d="M440 760 l6 -26 l6 0 l-4 26Z" fill="#2a5aa8"/><rect x="438" y="726" width="18" height="8" fill="#7a4a26"/>` + drum(560, 760, 0.9, '#f08a2a'));
    add(`<path d="M520 760 v-14 h14 v14Z" fill="#c4222f"/><path d="M540 760 v-10 h12 v10Z" fill="#2a5aa8"/>`);
    add(elf(1130, 770, 1, true, { tunic: '#c4222f', hat: '#1f7d45' }));
    add(bench(990, 320));
    add(teddy(1050, 760, 1.05, '#d9a066') + toyTrain(1190, 760, 1.15) + `<path d="M1260 760 l20 -40" stroke="#7a4a26" stroke-width="5" stroke-linecap="round"/><rect x="1270" y="712" width="26" height="12" rx="2" fill="#5a5b66" transform="rotate(-25 1283 718)"/>`);
    // third elf carrying a gift by the stove
    add(elf(300, 960, 0.9, false, { tunic: '#2a5aa8', hat: '#c4222f' }));
    add(gift(318, 860, 46, 38, 'url(#ws-gstripe)', '#1f7d45', 7));
    // toy sack
    add(`<g filter="url(#ws-shadow)"><path d="M1380 960 Q1330 960 1336 890 Q1344 830 1400 816 Q1420 800 1440 816 Q1500 830 1506 890 Q1512 960 1460 960Z" fill="#b3172b"/><path d="M1400 816 Q1420 830 1440 816" stroke="#f0d07a" stroke-width="5" fill="none"/>${teddy(1390, 816, 0.7)}${ball(1450, 806, 14)}<path d="M1372 900 Q1420 920 1470 900" stroke="#8a0f1f" stroke-width="3" fill="none"/></g>`);

    /* ---------- the big Christmas Eve present (day 24) ---------- */
    add(`<ellipse cx="800" cy="944" rx="110" ry="14" fill="#000" opacity=".35" filter="url(#ws-soft)"/>`);
    add(`<g filter="url(#ws-shadow)"><rect x="720" y="922" width="160" height="16" rx="4" fill="#7a4a26"/><circle cx="740" cy="942" r="9" fill="#2a1408"/><circle cx="860" cy="942" r="9" fill="#2a1408"/></g>`);
    add(gift(728, 818, 138, 104, 'url(#ws-gold)', '#b3172b', 18));

    /* ---------- banner ---------- */
    add(`<g filter="url(#ws-shadow)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#ws-ribbonDark)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#ws-ribbonDark)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#4a0711"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#4a0711"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#ws-ribbon)"/>
      <path d="M528 86 Q800 30 1072 86" stroke="url(#ws-gold)" stroke-width="3" fill="none"/>
      <path d="M528 140 Q800 84 1072 140" stroke="url(#ws-gold)" stroke-width="3" fill="none"/>
      <path d="M528 92 Q800 36 1072 92" stroke="#f0c86a" stroke-width="1" fill="none" stroke-dasharray="2 5" opacity=".7"/>
    </g>`);
    let bg = '';
    for (let i = 0; i < 16; i++) { const t = i / 15; bg += sprig(470 + t * 660, 64 - Math.sin(t * Math.PI) * 30 + 4, 10); }
    add(bg);

    /* ---------- light ---------- */
    add(`<rect width="${W}" height="${H}" fill="url(#ws-fireLight)"/><rect width="${W}" height="${H}" fill="url(#ws-warm)"/><rect width="${W}" height="${H}" fill="url(#ws-vig)"/>`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  /** The conveyor belt creeps along and the big cog turns. */
  function machinery(ctx, t) {
    ctx.strokeStyle = 'rgba(255,220,150,.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 22]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.moveTo(282, 606); ctx.lineTo(1318, 606); ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(1330, 623); ctx.rotate(t * 0.9);
    ctx.fillStyle = 'rgba(255,240,200,.35)';
    for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.fillRect(-4, -42, 8, 10); }
  }

  A.designs.workshop = {
    id: 'workshop',
    name: 'Santa’s Workshop',
    blurb: 'Elves at their benches, toys stacked to the rafters.',
    width: W,
    height: H,
    build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440 },
    effects: [
      { type: 'roomGlow', x: 163, y: 700, r: 620, color: '255,140,60', a: 0.08 },
      { type: 'fire', arch: 'M118 734 V680 Q118 650 163 648 Q208 650 208 680 V734 Z', x0: 120, x1: 206, base: 732, height: 80 },
      { type: 'snow', rect: [648, 200, 304, 316], count: 60 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'custom', draw: machinery },
      { type: 'smoke', x: 197, y: 532, rate: 1.2, rise: 14, size: 5, color: '240,240,245', a: 0.3 },
    ],
    layout: 'workshop',
    keepOut: [[440, 18, 720, 172], [630, 184, 340, 350], [100, 640, 126, 100]],
    day24: { x: 715, y: 800, w: 170, h: 150 },
  };
})();

} catch (e) { console.error('Design file failed: src/designs/workshop.js', e); }
/* ---- src/layouts/workshop.js ---- */
try {
/* Door layout for "Santa’s Workshop" (board units). Generated by tools/layout.mjs; hinge = side the flap swings toward. */
(function(){const A=(window.AYY=window.AYY||{});A.layouts=A.layouts||{};
A.layouts["workshop"]=[{"day":1,"x":511,"y":876,"w":96,"h":86,"hinge":"top"},
{"day":2,"x":1381,"y":720,"w":82,"h":108,"hinge":"right"},
{"day":3,"x":1378,"y":843,"w":150,"h":122,"hinge":"left"},
{"day":4,"x":353,"y":458,"w":120,"h":96,"hinge":"left"},
{"day":5,"x":409,"y":571,"w":150,"h":136,"hinge":"left"},
{"day":6,"x":975,"y":338,"w":150,"h":124,"hinge":"top"},
{"day":7,"x":231,"y":742,"w":116,"h":150,"hinge":"right"},
{"day":8,"x":1100,"y":846,"w":112,"h":114,"hinge":"left"},
{"day":9,"x":864,"y":574,"w":114,"h":96,"hinge":"right"},
{"day":10,"x":62,"y":851,"w":108,"h":92,"hinge":"top"},
{"day":11,"x":1431,"y":562,"w":138,"h":144,"hinge":"top"},
{"day":12,"x":457,"y":307,"w":150,"h":136,"hinge":"left"},
{"day":13,"x":64,"y":151,"w":114,"h":150,"hinge":"right"},
{"day":14,"x":463,"y":210,"w":108,"h":84,"hinge":"left"},
{"day":15,"x":1364,"y":36,"w":134,"h":150,"hinge":"left"},
{"day":16,"x":33,"y":486,"w":142,"h":150,"hinge":"top"},
{"day":17,"x":728,"y":611,"w":124,"h":150,"hinge":"left"},
{"day":18,"x":292,"y":35,"w":132,"h":104,"hinge":"left"},
{"day":19,"x":1219,"y":691,"w":150,"h":134,"hinge":"left"},
{"day":20,"x":1302,"y":200,"w":128,"h":150,"hinge":"left"},
{"day":21,"x":1465,"y":312,"w":96,"h":94,"hinge":"top"},
{"day":22,"x":1111,"y":539,"w":144,"h":132,"hinge":"right"},
{"day":23,"x":1147,"y":375,"w":122,"h":150,"hinge":"right"},
{"day":24,"x":715,"y":800,"w":170,"h":150,"hinge":"double"}];
})();

} catch (e) { console.error('Design file failed: src/layouts/workshop.js', e); }
/* ---- src/samples.js ---- */
/* Sample calendar content: painted stand-in photos (generated on a canvas) and notes.
   Used by the "See a sample" calendar and the landing page. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const PW = 1200, PH = 900;

  function canvas() {
    const c = document.createElement('canvas');
    c.width = PW; c.height = PH;
    return [c, c.getContext('2d', { willReadFrequently: true })];
  }
  const lg = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function softDot(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(0.72, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  function ridge(ctx, R, y, amp, rough, color, snow) {
    const pts = [];
    let v = 0;
    for (let x = -20; x <= PW + 20; x += 20) { v += (R() - 0.5) * rough; v *= 0.92; pts.push([x, y + Math.sin(x / 210 + y) * amp + v * amp * 0.5]); }
    ctx.beginPath(); ctx.moveTo(-20, PH);
    pts.forEach(([x, yy]) => ctx.lineTo(x, yy));
    ctx.lineTo(PW + 20, PH); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    if (snow) {
      ctx.save(); ctx.clip();
      ctx.fillStyle = snow;
      ctx.beginPath(); ctx.moveTo(-20, PH);
      pts.forEach(([x, yy]) => ctx.lineTo(x, yy));
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 22 + Math.sin(i * 1.7) * 10);
      ctx.fill(); ctx.restore();
    }
    return pts;
  }
  function pineTree(ctx, x, y, h, color, snow) {
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
      const ty = y - h + (i * h) / 4.6, w = (h * (0.18 + i * 0.1));
      ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - w, ty + h * 0.34); ctx.lineTo(x + w, ty + h * 0.34); ctx.closePath(); ctx.fill();
      if (snow) { ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - w * 0.45, ty + h * 0.15); ctx.lineTo(x + w * 0.35, ty + h * 0.13); ctx.closePath(); ctx.fill(); ctx.fillStyle = color; }
    }
    ctx.fillRect(x - h * 0.03, y - h * 0.08, h * 0.06, h * 0.1);
  }
  function stars(ctx, R, n, maxY) {
    for (let i = 0; i < n; i++) { ctx.globalAlpha = 0.3 + R() * 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(R() * PW, R() * maxY, R() * 1.8 + 0.3, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function grain(ctx, R) {
    const id = ctx.getImageData(0, 0, PW, PH), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(id, 0, 0);
    const v = ctx.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PH * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, PW, PH);
  }

  const PAL = [
    { sky: ['#1b1036', '#5b2a6e', '#e2799a', '#ffc58f'], ridges: ['#7c5a8e', '#4d3a6b', '#2c2547', '#171329'], bokeh: ['#ffcf6b', '#ff7a59', '#ffe9b0'] },
    { sky: ['#061428', '#123a6b', '#3f78b0', '#a9d0f0'], ridges: ['#8fb0d0', '#5d7fa8', '#34507a', '#18294a'], bokeh: ['#8fd3ff', '#ffffff', '#ffd27a'] },
    { sky: ['#0a1f1a', '#173f35', '#3e7a5e', '#cfe6c8'], ridges: ['#8bb19a', '#5e8a73', '#335c4b', '#14302a'], bokeh: ['#ff5a5a', '#ffd36b', '#9dff8a'] },
    { sky: ['#2a0d12', '#6b1d2a', '#c4553a', '#ffd08a'], ridges: ['#b0706a', '#7c4148', '#4a2330', '#22101a'], bokeh: ['#ffb347', '#ff6b6b', '#fff1c9'] },
  ];

  const painters = {
    mountains(ctx, R, p) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, PH * 0.75, [[0, p.sky[0]], [0.45, p.sky[1]], [0.8, p.sky[2]], [1, p.sky[3]]]);
      ctx.fillRect(0, 0, PW, PH);
      stars(ctx, R, 140, PH * 0.4);
      softDot(ctx, PW * (0.2 + R() * 0.6), PH * 0.5, 220, 'rgba(255,220,170,.35)', 1);
      ridge(ctx, R, PH * 0.48, 50, 3, p.ridges[0], 'rgba(255,255,255,.75)');
      ridge(ctx, R, PH * 0.58, 40, 2.4, p.ridges[1], 'rgba(255,255,255,.55)');
      ridge(ctx, R, PH * 0.7, 28, 1.6, p.ridges[2]);
      const near = ridge(ctx, R, PH * 0.82, 18, 1.2, p.ridges[3]);
      near.forEach(([x, y], i) => { if (i % 2 === 0 && R() > 0.3) pineTree(ctx, x + R() * 10, y + 14, 60 + R() * 70, p.ridges[3]); });
    },
    forest(ctx, R, p) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, PH, [[0, '#0b1d36'], [0.6, '#2f5487'], [1, '#c7d8ef']]);
      ctx.fillRect(0, 0, PW, PH);
      stars(ctx, R, 80, PH * 0.35);
      ctx.fillStyle = '#e8f0fb'; ctx.fillRect(0, PH * 0.74, PW, PH);
      const rows = [[0.62, '#3c5f8a', 70], [0.7, '#284670', 110], [0.82, '#142a48', 170]];
      rows.forEach(([yy, col, h]) => {
        for (let x = -40; x < PW + 40; x += h * 0.45 + R() * h * 0.4) pineTree(ctx, x, PH * yy + R() * 30, h * (0.7 + R() * 0.6), col, 'rgba(240,246,255,.9)');
      });
      // cabin
      const cx = PW * (0.3 + R() * 0.4), cy = PH * 0.8;
      ctx.fillStyle = '#3a2418'; ctx.fillRect(cx - 70, cy - 60, 140, 70);
      ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.moveTo(cx - 90, cy - 56); ctx.lineTo(cx, cy - 120); ctx.lineTo(cx + 90, cy - 56); ctx.closePath(); ctx.fill();
      softDot(ctx, cx, cy - 26, 120, 'rgba(255,190,90,.5)', 1);
      ctx.fillStyle = '#ffcf70'; ctx.fillRect(cx - 50, cy - 40, 28, 26); ctx.fillRect(cx + 22, cy - 40, 28, 26);
      ctx.fillStyle = '#e8f0fb'; ctx.fillRect(0, PH * 0.82, PW, PH);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 260; i++) { ctx.globalAlpha = 0.4 + R() * 0.6; ctx.beginPath(); ctx.arc(R() * PW, R() * PH, R() * 3 + 0.6, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    },
    aurora(ctx, R) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, PH * 0.6, [[0, '#020812'], [1, '#0c2236']]);
      ctx.fillRect(0, 0, PW, PH);
      stars(ctx, R, 220, PH * 0.6);
      ctx.globalCompositeOperation = 'lighter';
      const bands = [['rgba(80,255,170,', 0.32], ['rgba(70,200,255,', 0.22], ['rgba(190,110,255,', 0.16]];
      bands.forEach(([c, a], b) => {
        const off = R() * 10, base = PH * (0.22 + b * 0.07);
        for (let x = 0; x < PW; x += 3) {
          const y = base + Math.sin(x / 160 + off) * 50 + Math.sin(x / 63 + off * 2) * 16;
          const h = 120 + Math.sin(x / 90 + off) * 60;
          const g = ctx.createLinearGradient(0, y - h, 0, y + 20);
          g.addColorStop(0, c + '0)'); g.addColorStop(0.75, c + a + ')'); g.addColorStop(1, c + '0)');
          ctx.fillStyle = g; ctx.fillRect(x, y - h, 3, h + 20);
        }
      });
      ctx.globalCompositeOperation = 'source-over';
      const hz = PH * 0.62;
      ridge(ctx, R, hz - 40, 30, 2.5, '#06101c');
      // lake reflection
      const img = ctx.getImageData(0, 0, PW, hz);
      const ref = ctx.createImageData(PW, PH - hz);
      for (let y = 0; y < PH - hz; y++) {
        const sy = Math.max(0, hz - 1 - y + Math.round(Math.sin(y * 0.6) * 2));
        for (let x = 0; x < PW; x++) {
          const si = (sy * PW + x) * 4, di = (y * PW + x) * 4;
          ref.data[di] = img.data[si] * 0.55; ref.data[di + 1] = img.data[si + 1] * 0.6; ref.data[di + 2] = img.data[si + 2] * 0.7; ref.data[di + 3] = 255;
        }
      }
      ctx.putImageData(ref, 0, hz);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 40; i++) ctx.fillRect(R() * PW, hz + R() * (PH - hz), 40 + R() * 120, 1.5);
    },
    bokeh(ctx, R, p) {
      ctx.fillStyle = lg(ctx, 0, 0, PW, PH, [[0, '#0d0a10'], [1, '#1d1210']]);
      ctx.fillRect(0, 0, PW, PH);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 90; i++) {
        const r = 14 + R() * R() * 120;
        softDot(ctx, R() * PW, R() * PH, r, p.bokeh[i % p.bokeh.length], 0.08 + R() * 0.35);
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    ornament(ctx, R, p) {
      painters.bokeh(ctx, R, p);
      const x = PW * (0.38 + R() * 0.24), y = PH * 0.56, r = 210;
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - r - 30); ctx.stroke();
      ctx.fillStyle = lg(ctx, x - 30, 0, x + 30, 0, [[0, '#8a6420'], [0.5, '#f3d27a'], [1, '#8a6420']]);
      ctx.fillRect(x - 32, y - r - 40, 64, 46);
      const col = ['#c0182c', '#1f5fa8', '#1f7d45', '#c9962f'][Math.floor(R() * 4)];
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 10, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.12, col); g.addColorStop(1, '#0a0406');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const a = R() * 7, d = R() * r * 0.8; softDot(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 6 + R() * 14, p.bokeh[i % 3], 0.35); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.98, r * 0.28, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    },
  };
  const ORDER = ['mountains', 'bokeh', 'forest', 'aurora', 'ornament', 'mountains', 'forest', 'bokeh'];

  const cache = {};
  function photo(day) {
    if (cache[day]) return cache[day];
    cache[day] = new Promise((resolve) => {
      const run = () => {
        const [c, ctx] = canvas();
        const R = A.util.rng(day * 7919);
        const kind = ORDER[(day - 1) % ORDER.length];
        painters[kind](ctx, R, PAL[(day - 1) % PAL.length]);
        grain(ctx, R);
        c.toBlob((b) => resolve(URL.createObjectURL(b)), 'image/jpeg', 0.88);
      };
      (window.requestIdleCallback || setTimeout)(run);
    });
    return cache[day];
  }

  const NOTES = [
    'Day one! Every morning this month you get to open one little door. Behind each one is a memory I wanted you to have again.',
    'Remember the first snow when the whole street came out with sleds and Dad tried to beat everyone down the hill?',
    'Thank you for every Saturday pancake breakfast. I still measure all pancakes against yours.',
    'The year the tree fell over and we decided it looked better leaning. It stayed that way until New Year.',
    'This one is for the long drives with the radio on and everyone singing badly. Best road trips there ever were.',
    'You taught me how to tie my skates, and then how to fall without crying. Mostly.',
    'Hot cocoa, too many marshmallows, and an old movie on a cold night. Still my favorite evening.',
    'For every school play you sat through, every game you cheered at, every time you showed up.',
    'The cookie baking marathon! Flour everywhere and half the dough eaten before it reached the oven.',
    'Somewhere there is still a photo of all of us in matching sweaters. I hope it never gets lost.',
    'Thank you for the porch light you always left on. It made coming home feel like coming home.',
    'Here is to the dog who stole the Christmas ham and was forgiven by dinner.',
    'You always said the best gifts are the ones you make. So I made you this.',
    'Remember counting down the days with the old paper calendar on the fridge? This is the new one.',
    'For all the quiet mornings with coffee and the newspaper and nowhere to be.',
    'Every ornament on our tree had a story, and you knew every one by heart.',
    'The night we stayed up too late playing cards and laughing until it hurt.',
    'Thank you for teaching me that a little kindness goes a very long way.',
    'Snowball fight rematch this year? I have been practicing.',
    'For the songs you sang while cooking and the ones you made up when you forgot the words.',
    'All those letters to the North Pole you somehow got answered. I see what you did there.',
    'Two more sleeps. I cannot wait to be home with you.',
    'Christmas Eve Eve. The best kind of waiting is the kind you do together.',
    'Merry Christmas! Thank you for every single year. I love you both more than twenty-four doors could hold.',
  ];

  A.samples = { photo, notes: NOTES };
})();

/* ---- src/board.js ---- */
/* The advent calendar board: illustrated scene, animated effects, 24 opening doors,
   and the full-screen photo view that grows out of (and back into) each door. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const { esc, el, sleep, fmtDate, isUnlocked, daysUntil, MONTHS } = A.util;
  /** Which part of a photo shows through its door: day data `focus` = [x%, y%], default centred. */
  const focusCSS = (data) => { const f = (data && data.focus) || [50, 50]; return `${f[0]}% ${f[1]}%`; };

  /* ---------------- scene rasterising (cached per design) ---------------- */
  const sceneCache = {};
  function built(design) {
    if (!design._built) design._built = design.build();
    return design._built;
  }
  /** k = render scale: 2 for the board itself, ~0.3 for thumbnails. */
  function sceneURL(designId, k = 2) {
    const key = designId + '@' + k;
    if (sceneCache[key]) return sceneCache[key];
    const design = A.designs[designId] || A.designs.parlor;
    sceneCache[key] = (async () => {
      const { svg } = built(design);
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      try {
        const img = new Image();
        img.decoding = 'async';
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = svgUrl; });
        const c = document.createElement('canvas');
        c.width = design.width * k; c.height = design.height * k;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        // printed-paper grain
        const n = document.createElement('canvas'); n.width = n.height = 128;
        const nx = n.getContext('2d'), id = nx.createImageData(128, 128);
        for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; }
        nx.putImageData(id, 0, 0);
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = ctx.createPattern(n, 'repeat');
        ctx.fillRect(0, 0, c.width, c.height);
        const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
        if (!blob) return svgUrl;
        return URL.createObjectURL(blob);
      } catch (e) {
        return svgUrl;
      }
    })();
    return sceneCache[key];
  }

  /* ---------------- animated effects ---------------- */
  const spriteCache = {};
  function glowSprite(color) {
    if (spriteCache[color]) return spriteCache[color];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.15, color); g.addColorStop(0.45, color + '55'); g.addColorStop(1, color + '00');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (spriteCache[color] = c);
  }
  const wobble = (t, s) => (Math.sin(t * 1.7 + s) + Math.sin(t * 2.9 + s * 1.3) * 0.6 + Math.sin(t * 5.3 + s * 0.7) * 0.3) / 1.9;

  class Effects {
    constructor(design, fxCanvas, glitterCanvas) {
      this.d = design; this.c = fxCanvas; this.g = glitterCanvas;
      this.data = built(design);
      this.running = false; this.scale = 1;
      this.embers = []; this.sparkles = [];
      this.state = new Map();
      this.reduced = A.util.prefersReducedMotion();
      this.loop = this.loop.bind(this);
      this.archPaths = {};
    }
    newFlake(s, anywhere) {
      const [x, y, w, h] = s.rect;
      const big = s.size || 1;
      return { x: x + Math.random() * w, y: anywhere ? y + Math.random() * h : y - 6, r: (0.8 + Math.random() * 2.2) * big, vy: 14 + Math.random() * 26, ph: Math.random() * 6, sw: 6 + Math.random() * 12 };
    }
    resize(scale) {
      this.scale = scale;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      [this.c, this.g].forEach((cv) => {
        cv.width = Math.round(this.d.width * scale * dpr);
        cv.height = Math.round(this.d.height * scale * dpr);
        cv.getContext('2d').setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      });
      if (!this.running) this.draw(performance.now() / 1000, 0);
    }
    start() { if (this.running) return; this.running = true; this.last = performance.now(); requestAnimationFrame(this.loop); }
    stop() { this.running = false; }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (!document.hidden) this.draw(now / 1000, this.reduced ? 0 : dt);
      if (this.reduced) { this.running = false; return; }
      requestAnimationFrame(this.loop);
    }
    draw(t, dt) {
      const ctx = this.c.getContext('2d');
      ctx.clearRect(0, 0, this.d.width, this.d.height);
      for (const e of this.d.effects) this[e.type] && this[e.type](ctx, e, t, dt);
      this.glitter(t, dt);
    }
    st(e) { let s = this.state.get(e); if (!s) this.state.set(e, (s = {})); return s; }
    roomGlow(ctx, e, t) {
      const col = e.color || '255,150,60';
      const a = (e.a || 0.07) + (e.flicker == null ? 0.035 : e.flicker) * wobble(t * 2, 1);
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, this.d.width, this.d.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    /** Soft pulsing light: {x, y, r, color:'r,g,b', a, speed} */
    glow(ctx, e, t) {
      const a = (e.a || 0.3) * (0.7 + 0.3 * Math.sin(t * (e.speed || 1.5) + (e.x || 0)));
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, `rgba(${e.color || '255,220,150'},${a})`); g.addColorStop(1, `rgba(${e.color || '255,220,150'},0)`);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    /** Shimmering aurora curtains inside rect: {rect:[x,y,w,h], colors:['80,255,170', ...], a} */
    aurora(ctx, e, t) {
      const [x, y, w, h] = e.rect;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      (e.colors || ['80,255,170', '90,200,255', '190,110,255']).forEach((c, b) => {
        const base = y + h * (0.35 + b * 0.12);
        for (let px = x; px < x + w; px += 6) {
          const yy = base + Math.sin(px / 130 + t * 0.35 + b * 2) * h * 0.12 + Math.sin(px / 47 + t * 0.9 + b) * h * 0.04;
          const hh = h * (0.28 + 0.12 * Math.sin(px / 70 + t * 0.6 + b * 3));
          const a = (e.a || 0.22) * (0.6 + 0.4 * Math.sin(px / 33 + t * 1.3 + b));
          const g = ctx.createLinearGradient(0, yy - hh, 0, yy + 10);
          g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.8, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g; ctx.fillRect(px, yy - hh, 6, hh + 10);
        }
      });
      ctx.restore();
    }
    /** Chimney smoke / steam puffs: {x, y, rate, rise, size, color:'r,g,b', a} */
    smoke(ctx, e, t, dt) {
      const s = this.st(e);
      s.p = s.p || [];
      if (dt && Math.random() < dt * (e.rate || 2.2)) s.p.push({ x: e.x, y: e.y, life: 0, max: 3 + Math.random() * 2, r: (e.size || 10) * (0.7 + Math.random() * 0.5), dx: (Math.random() - 0.3) * 8 });
      s.p = s.p.filter((p) => (p.life += dt) < p.max);
      for (const p of s.p) {
        const k = p.life / p.max;
        p.y -= (e.rise || 22) * dt; p.x += (p.dx + Math.sin(t + p.max) * 4) * dt;
        ctx.globalAlpha = (e.a || 0.35) * Math.sin(k * Math.PI);
        ctx.fillStyle = `rgb(${e.color || '230,235,245'})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * 1.6), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    /** Design-specific animation: {draw(ctx, t, dt, state, design)} */
    custom(ctx, e, t, dt) {
      ctx.save();
      try { e.draw(ctx, t, dt, this.st(e), this.d, this.data); } catch (err) { /* keep the board alive */ }
      ctx.restore();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    fire(ctx, e, t, dt) {
      const path = this.archPaths[e.arch] || (this.archPaths[e.arch] = new Path2D(e.arch));
      ctx.save(); ctx.clip(path);
      ctx.globalCompositeOperation = 'lighter';
      const N = 9, span = e.x1 - e.x0;
      const layer = (scaleH, scaleW, c0, c1, alpha, seed) => {
        for (let i = 0; i < N; i++) {
          const center = 1 - Math.abs(i - (N - 1) / 2) / N;
          const bx = e.x0 + ((i + 0.5) * span) / N + Math.sin(t * 0.8 + i + seed) * 5;
          const h = e.height * scaleH * center * (0.62 + 0.38 * wobble(t * 1.6, i * 2.1 + seed));
          const w = (span / N) * 2 * scaleW;
          const sway = wobble(t * 2.2, i * 3.7 + seed) * w * 0.45;
          const g = ctx.createLinearGradient(0, e.base, 0, e.base - h);
          g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, 'rgba(160,30,0,0)');
          ctx.globalAlpha = alpha; ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(bx - w / 2, e.base);
          ctx.bezierCurveTo(bx - w * 0.6, e.base - h * 0.4, bx - w * 0.15 + sway * 0.5, e.base - h * 0.75, bx + sway, e.base - h);
          ctx.bezierCurveTo(bx + w * 0.15 + sway * 0.5, e.base - h * 0.75, bx + w * 0.6, e.base - h * 0.4, bx + w / 2, e.base);
          ctx.fill();
        }
      };
      const mid = (e.x0 + e.x1) / 2;
      const base = ctx.createRadialGradient(mid, e.base, 0, mid, e.base, 170);
      base.addColorStop(0, 'rgba(255,170,60,.55)'); base.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = base; ctx.globalAlpha = 0.8 + 0.2 * wobble(t * 3, 4); ctx.fillRect(e.x0 - 60, e.base - 170, span + 120, 200);
      layer(1, 1, 'rgba(255,120,30,.9)', 'rgba(230,60,10,.55)', 0.85, 0);
      layer(0.72, 0.7, 'rgba(255,220,120,.95)', 'rgba(255,140,40,.6)', 0.9, 11);
      layer(0.38, 0.45, 'rgba(255,255,220,1)', 'rgba(255,210,120,.7)', 0.85, 23);
      // embers
      if (dt && Math.random() < dt * 9) this.embers.push({ x: e.x0 + 40 + Math.random() * (span - 80), y: e.base - 10, vy: -40 - Math.random() * 60, vx: (Math.random() - 0.5) * 20, life: 0, max: 1.2 + Math.random() * 1.4 });
      ctx.globalAlpha = 1;
      this.embers = this.embers.filter((p) => (p.life += dt) < p.max);
      for (const p of this.embers) {
        p.y += p.vy * dt; p.x += (p.vx + Math.sin(t * 4 + p.max * 9) * 12) * dt;
        ctx.fillStyle = `rgba(255,${150 + Math.round(80 * (1 - p.life / p.max))},60,${1 - p.life / p.max})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 7); ctx.fill();
      }
      ctx.restore();
      // iron andirons in front of the flames
      ctx.globalCompositeOperation = 'source-over';
      (e.andirons || []).forEach(([x, y]) => {
        ctx.fillStyle = '#140a06';
        ctx.fillRect(x - 5, y - 52, 10, 52);
        ctx.beginPath(); ctx.arc(x, y - 58, 11, 0, 7); ctx.fill();
        ctx.fillRect(x - 22, y - 6, 44, 8);
        ctx.fillStyle = `rgba(255,140,50,${0.45 + 0.2 * wobble(t * 3, x)})`;
        ctx.beginPath(); ctx.arc(x - 3, y - 61, 3.5, 0, 7); ctx.fill();
        ctx.fillRect(x - 5, y - 46, 2.5, 40);
      });
      if (e.grate) { ctx.fillStyle = '#140a06'; ctx.fillRect(...e.grate); }
    }
    snow(ctx, e, t, dt) {
      const [x, y, w, h] = e.rect;
      const s = this.st(e);
      if (!s.flakes) s.flakes = Array.from({ length: e.count || 60 }, () => this.newFlake(e, true));
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = e.color || '#fff';
      for (let i = 0; i < s.flakes.length; i++) {
        const f = s.flakes[i];
        f.y += f.vy * dt * (e.speed || 1);
        if (f.y > y + h) s.flakes[i] = this.newFlake(e, false);
        ctx.globalAlpha = e.a || 0.85;
        ctx.beginPath(); ctx.arc(f.x + Math.sin(t * 0.9 + f.ph) * f.sw, f.y, f.r, 0, 7); ctx.fill();
      }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    twinkle(ctx, e, t) {
      ctx.globalCompositeOperation = 'lighter';
      const L = this.data.lights;
      for (let i = 0; i < L.length; i++) {
        const l = L[i];
        const p = 0.5 + 0.5 * Math.sin(t * (1.1 + (i % 7) * 0.23) + i * 2.4);
        ctx.globalAlpha = 0.18 + 0.82 * p * p;
        const s = l.r * 8;
        ctx.drawImage(glowSprite(l.c), l.x - s / 2, l.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    candles(ctx, e, t) {
      for (const [i, c] of this.data.candles.entries()) {
        const k = c.s || 1;
        const fl = wobble(t * 3, i * 5);
        const h = (17 + fl * 3) * k, sway = wobble(t * 2.4, i * 7) * 2.2 * k;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 + 0.15 * fl;
        ctx.drawImage(glowSprite('#ffb84d'), c.x - 36 * k, c.y - 46 * k, 72 * k, 72 * k);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        const g = ctx.createLinearGradient(0, c.y + 2, 0, c.y - h);
        g.addColorStop(0, '#ff8a1e'); g.addColorStop(0.35, '#ffd36b'); g.addColorStop(1, '#fffbe6');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y + 3);
        ctx.bezierCurveTo(c.x - 7 * k, c.y - 2 * k, c.x - 3 * k + sway, c.y - h * 0.7, c.x + sway, c.y - h);
        ctx.bezierCurveTo(c.x + 3 * k + sway, c.y - h * 0.7, c.x + 7 * k, c.y - 2 * k, c.x, c.y + 3 * k);
        ctx.fill();
        ctx.fillStyle = 'rgba(60,110,255,.55)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 2.4 * k, 3.5 * k, 0, 0, 7); ctx.fill();
      }
    }
    star(ctx, e, t) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(t * 0.12);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        const len = e.r * (i % 2 ? 0.7 : 1.15) * (0.85 + 0.15 * Math.sin(t * 2 + i));
        const g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, 'rgba(255,236,170,.55)'); g.addColorStop(1, 'rgba(255,236,170,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(len, 0); ctx.lineTo(0, 3); ctx.fill();
      }
      ctx.restore(); ctx.globalCompositeOperation = 'source-over';
    }
    glitter(t, dt) {
      const ctx = this.g.getContext('2d');
      ctx.clearRect(0, 0, this.d.width, this.d.height);
      if (this.reduced) return;
      if (Math.random() < dt * 14) this.sparkles.push({ x: Math.random() * this.d.width, y: Math.random() * this.d.height, life: 0, max: 0.9 + Math.random() * 0.9, s: 3 + Math.random() * 6, gold: Math.random() < 0.5 });
      this.sparkles = this.sparkles.filter((p) => (p.life += dt) < p.max);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of this.sparkles) {
        const a = Math.sin((p.life / p.max) * Math.PI);
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = p.gold ? '#ffe7a3' : '#ffffff';
        const s = p.s * (0.6 + a * 0.4);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
        ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ---------------- number styling ---------------- */
  const NUM_STYLES = ['n-gold', 'n-cream', 'n-tag', 'n-swash', 'n-gold', 'n-red'];
  const NUM_POS = ['c', 'c', 'tl', 'br', 'c', 'tr', 'bl'];

  /* ---------------- the board ---------------- */
  class Board {
    /**
     * opts: { calendar, days: {n: {caption, image_url}}, opened: Set, mode: 'live'|'preview'|'hero',
     *         onOpened(day), getImage(day) -> Promise<url>|url, onLocked(day) }
     */
    constructor(host, opts) {
      this.host = host; this.o = opts;
      this.cal = opts.calendar;
      this.design = A.designs[this.cal.design] || A.designs.parlor;
      this.layout = A.layouts[this.design.layout];
      this.opened = new Set(opts.opened || []);
      this.doors = {};
      this.uid = 'b' + Math.random().toString(36).slice(2, 8);
      this.render();
    }
    unlocked(day) {
      if (this.o.mode === 'preview') return true;
      if (this.o.mode === 'hero') return false;
      return isUnlocked(this.cal, day);
    }
    async render() {
      const d = this.design;
      const stage = el(`<div class="board-stage ${this.o.mode === 'hero' ? 'is-hero' : ''}">
        <div class="board-frame"><div class="board-mat">
          <div class="board" style="width:${d.width}px;height:${d.height}px">
            <div class="board-art"></div>
            <canvas class="board-fx" aria-hidden="true"></canvas>
            <svg class="board-title" viewBox="0 0 ${d.width} ${d.height}" aria-hidden="true">
              <path id="${this.uid}-tp" d="${d.title.path}" fill="none"/>
              <text class="board-title-text" font-size="${d.title.size}" style="${d.title.fill ? `fill:${d.title.fill};` : ''}${d.title.stroke ? `stroke:${d.title.stroke};` : ''}"><textPath href="#${this.uid}-tp" startOffset="50%" text-anchor="middle">${esc(this.cal.title || 'Merry Christmas')}</textPath></text>
            </svg>
            <div class="doors"></div>
            <canvas class="board-glitter" aria-hidden="true"></canvas>
          </div>
        </div></div>
        <div class="board-loading" aria-hidden="true"><span></span></div>
      </div>`);
      this.stage = stage;
      this.boardEl = stage.querySelector('.board');
      this.frameEl = stage.querySelector('.board-frame');
      this.host.appendChild(stage);
      this.fx = new Effects(d, stage.querySelector('.board-fx'), stage.querySelector('.board-glitter'));
      this.fit();
      this.ro = new ResizeObserver(() => this.fit());
      this.ro.observe(this.host);

      const url = await sceneURL(d.id);
      if (this.destroyed) return;
      this.art = url;
      stage.querySelector('.board-art').style.backgroundImage = `url("${url}")`;
      this.buildDoors();
      stage.classList.add('ready');
      this.scrollToToday();
      this.fx.start();
      this.fitTitle();
      this.onVis = () => (document.hidden ? this.fx.stop() : this.fx.start());
      document.addEventListener('visibilitychange', this.onVis);
    }
    fit() {
      const d = this.design;
      const hostW = this.host.clientWidth, hostH = this.host.clientHeight || window.innerHeight;
      const pad = this.o.mode === 'hero' ? 18 : 30; // frame + mat thickness in px (each side)
      let s = Math.min((hostW - pad * 2) / d.width, (hostH - pad * 2) / d.height);
      const minS = this.o.mode === 'hero' ? 0.12 : 0.46;
      this.scrolls = s < minS;
      if (s < minS) s = Math.max(minS, Math.min(0.95, (hostH - pad * 2 - 16) / d.height));
      s = Math.max(0.1, s);
      this.scale = s;
      this.boardEl.style.transform = `scale(${s})`;
      const mat = this.stage.querySelector('.board-mat');
      mat.style.width = d.width * s + 'px';
      mat.style.height = d.height * s + 'px';
      this.stage.classList.toggle('scrolls', this.scrolls);
      this.fx && this.fx.resize(s);
    }
    /** On phones the board scrolls sideways; start in the middle of the scene, not at today's door,
        so finding it is still a hunt. */
    scrollToToday() {
      if (!this.scrolls) return;
      this.stage.scrollLeft = Math.max(0, (this.design.width * this.scale - this.stage.clientWidth) / 2);
    }
    async fitTitle() {
      try { await document.fonts.ready; } catch (e) { /* ignore */ }
      const t = this.stage.querySelector('.board-title-text');
      if (!t) return;
      const max = this.design.title.maxWidth;
      let size = this.design.title.size;
      t.setAttribute('font-size', size);
      const len = t.getComputedTextLength();
      if (len > max) t.setAttribute('font-size', Math.max(22, Math.floor((size * max) / len)));
    }
    setTitle(text) {
      const tp = this.stage.querySelector('.board-title-text textPath');
      if (tp) { tp.textContent = text || 'Merry Christmas'; this.fitTitle(); }
    }

    buildDoors() {
      const wrap = this.stage.querySelector('.doors');
      const R = A.util.rng(this.cal.start_month * 31 + 7);
      const art = this.art, d = this.design;
      const face = (x, y) => `background-image:url('${art}');background-size:${d.width}px ${d.height}px;background-position:${-x}px ${-y}px`;
      for (const L of this.layout) {
        const day = L.day;
        const NS = d.numStyles || NUM_STYLES;
        const pickStyle = NS[Math.floor(R() * NS.length)];
        const style = day === 24 ? 'n-tag' : pickStyle; // the big day always gets the most legible number
        const pos = day === 24 ? 'c' : NUM_POS[Math.floor(R() * NUM_POS.length)];
        const numSize = Math.round(Math.min(L.w, L.h) * (day === 24 ? 0.46 : 0.46));
        const dateLabel = `${MONTHS[this.cal.start_month - 1].slice(0, 3)} ${day}`;
        const back = `<span class="flap-face flap-back"><span class="flap-note"><span class="flap-day">${dateLabel}</span><span class="flap-text"></span></span></span>`;
        const leaves = L.hinge === 'double'
          ? `<span class="leaf leaf-l"><span class="flap-face flap-front" style="${face(L.x, L.y)}"></span><span class="flap-face flap-back"><span class="flap-note"><span class="flap-day">${dateLabel}</span></span></span></span>
             <span class="leaf leaf-r"><span class="flap-face flap-front" style="${face(L.x + L.w / 2, L.y)}"></span><span class="flap-face flap-back"><span class="flap-note"><span class="flap-text"></span></span></span></span>
             <span class="door-num ${style} pos-c" style="font-size:${numSize}px">${day}</span>`
          : `<span class="flap-face flap-front" style="${face(L.x, L.y)}"><span class="door-num ${style} pos-${pos}" style="font-size:${numSize}px">${day}</span></span>${back}`;
        const door = el(`<div class="door hinge-${L.hinge}" data-day="${day}" style="left:${L.x}px;top:${L.y}px;width:${L.w}px;height:${L.h}px">
          <div class="door-shadow"></div>
          <div class="door-well"><img class="door-photo" alt="" decoding="async"><span class="door-well-shade"></span></div>
          <button class="door-flap" type="button">${leaves}</button>
        </div>`);
        wrap.appendChild(door);
        const btn = door.querySelector('.door-flap');
        btn.addEventListener('click', () => this.onDoor(day));
        // once a door is open, the photo in the opening brings up the big view too
        door.querySelector('.door-well').addEventListener('click', () => { if (door.classList.contains('open')) this.onDoor(day); });
        this.doors[day] = door;
        this.refreshDoor(day, true);
      }
    }
    dayData(day) { return (this.o.days && this.o.days[day]) || null; }
    async loadPhoto(day) {
      const door = this.doors[day];
      const img = door.querySelector('.door-photo');
      if (img.dataset.loaded) return img;
      const data = this.dayData(day);
      let src = data && data.image_url;
      if (!src && this.o.getImage) src = await this.o.getImage(day);
      if (!src) { door.classList.add('no-photo'); img.dataset.loaded = '1'; return img; }
      img.style.objectPosition = focusCSS(data);
      img.src = src;
      img.dataset.loaded = '1';
      try { await img.decode(); } catch (e) { /* ignore */ }
      return img;
    }
    refreshDoor(day, initial) {
      const door = this.doors[day];
      const unlocked = this.unlocked(day);
      const isOpen = this.opened.has(day) && unlocked;
      const data = this.dayData(day);
      door.classList.toggle('locked', !unlocked);
      door.classList.toggle('ready-to-open', unlocked && !isOpen);
      door.classList.toggle('open', isOpen);
      door.classList.toggle('written', isOpen);
      if (initial) door.classList.add('no-anim');
      const caption = (data && data.caption) || '';
      door.querySelectorAll('.flap-text').forEach((t) => (t.textContent = caption));
      const label = unlocked
        ? `Day ${day}${isOpen ? ', opened' : ', ready to open'}`
        : `Day ${day}, opens ${fmtDate(this.cal.start_year, this.cal.start_month, day)}`;
      door.querySelector('.door-flap').setAttribute('aria-label', label);
      if (isOpen || (unlocked && this.o.mode !== 'hero')) this.loadPhoto(day);
      if (isOpen) requestAnimationFrame(() => this.fitNote(door));
      if (initial) setTimeout(() => door.classList.remove('no-anim'), 60);
    }
    fitNote(door) {
      door.querySelectorAll('.flap-note').forEach((note) => {
        const text = note.querySelector('.flap-text');
        if (!text) return;
        const h = door.clientHeight;
        let size = Math.max(10, Math.min(22, h * 0.15));
        text.style.fontSize = size + 'px';
        let guard = 30;
        while (note.scrollHeight > note.clientHeight + 1 && size > 9 && guard--) { size -= 1; text.style.fontSize = size + 'px'; }
        note.classList.toggle('clipped', note.scrollHeight > note.clientHeight + 1);
      });
    }

    async onDoor(day) {
      if (this.o.mode === 'hero' || this.busy) return;
      const door = this.doors[day];
      if (!this.unlocked(day)) {
        door.classList.remove('shake'); void door.offsetWidth; door.classList.add('shake');
        const n = daysUntil(this.cal, day);
        const when = fmtDate(this.cal.start_year, this.cal.start_month, day, true);
        this.o.onLocked ? this.o.onLocked(day, n, when) : A.util.toast(`Door ${day} opens ${when}. ${n === 1 ? 'Just one more sleep.' : `${n} sleeps to go.`}`);
        return;
      }
      this.busy = true;
      try {
        if (!this.opened.has(day)) {
          await this.loadPhoto(day);
          door.classList.add('open');
          door.classList.remove('ready-to-open');
          this.opened.add(day);
          if (this.o.onOpened) Promise.resolve(this.o.onOpened(day)).catch(() => {});
          await sleep(A.util.prefersReducedMotion() ? 50 : 900);
        }
        await this.showDay(day);
      } finally {
        this.busy = false;
      }
    }

    /* ---------------- the big view ---------------- */
    async showDay(day) {
      this.fx.stop();
      const lb = new Lightbox(this, day);
      const finalDay = await lb.run();
      // the note lands on the flap of whichever door we return to
      const door = this.doors[finalDay];
      if (!door.classList.contains('written')) {
        this.fitNote(door);
        door.classList.add('written', 'writing');
        setTimeout(() => door.classList.remove('writing'), 1600);
      }
      this.fx.start();
      door.querySelector('.door-flap').focus({ preventScroll: true });
    }
    openGallery() { return openGallery(this); }
    openedDays() {
      return [...this.opened].filter((d) => this.unlocked(d)).sort((a, b) => a - b);
    }
    setOpened(set) {
      this.opened = new Set(set);
      Object.keys(this.doors).forEach((d) => this.refreshDoor(Number(d), true));
    }
    destroy() {
      this.destroyed = true;
      this.fx && this.fx.stop();
      this.ro && this.ro.disconnect();
      document.removeEventListener('visibilitychange', this.onVis);
      this.stage && this.stage.remove();
    }
  }

  /** The written note for a day (shared by the big view and the gallery). */
  function noteHTML(board, day) {
    const cal = board.cal, data = board.dayData(day) || {};
    const caption = data.caption ? esc(data.caption) : '<span class="lb-empty">Nothing written behind this door yet.</span>';
    return `<p class="lb-eyebrow">Day ${day} of 24</p>
      <h2 class="lb-date">${fmtDate(cal.start_year, cal.start_month, day, true)}</h2>
      <div class="lb-rule" aria-hidden="true"></div>
      <p class="lb-text">${caption}</p>
      ${cal.from_name ? `<p class="lb-sign">${esc(cal.from_name)}</p>` : ''}`;
  }

  /** Every door opened so far, in one scrolling page: full-size photo and note, alternating sides. */
  async function openGallery(board) {
    const days = board.openedDays();
    if (!days.length) { A.util.toast('Open a door first. Every door you open shows up here.'); return; }
    if (document.querySelector('.gallery')) return;
    board.fx.stop();
    const cal = board.cal;
    const root = el(`<div class="gallery" role="dialog" aria-modal="true" aria-label="Gallery">
      <header class="gal-bar">
        <div class="gal-title">${esc(cal.title || 'Advent calendar')}<small>${days.length === 24 ? 'All 24 doors' : `${days.length} of 24 doors opened`}</small></div>
        <button class="lb-btn gal-close" type="button" aria-label="Close the gallery">&#215;</button>
      </header>
      <div class="gal-scroll"><div class="gal-list"></div><p class="gal-end">${days.length === 24 ? 'Merry Christmas' : 'More to come as each door opens'}</p></div>
    </div>`);
    const list = root.querySelector('.gal-list');
    for (const d of days) {
      const doorImg = await board.loadPhoto(d);
      const src = doorImg.getAttribute('src');
      list.appendChild(el(`<section class="gal-row" id="gal-day-${d}">
        <figure class="gal-photo">${src ? `<img alt="Day ${d}" src="${esc(src)}" decoding="async">` : '<div class="gal-photo-empty">No photo behind this door</div>'}</figure>
        <article class="gal-note">${noteHTML(board, d)}</article>
      </section>`));
    }
    document.body.appendChild(root);
    document.documentElement.classList.add('lb-lock');
    void root.offsetWidth; // commit the hidden state so the fade-in runs
    root.classList.add('in');
    // rows drift in as they scroll into view
    let io = null;
    if (!A.util.prefersReducedMotion() && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } }), { root: root.querySelector('.gal-scroll'), threshold: 0.12 });
      list.querySelectorAll('.gal-row').forEach((r) => io.observe(r));
      // safety net: if the browser never reports visibility, show everything rather than blank rows
      setTimeout(() => { if (!list.querySelector('.gal-row.shown')) list.querySelectorAll('.gal-row').forEach((r) => r.classList.add('shown')); }, 1500);
    } else list.querySelectorAll('.gal-row').forEach((r) => r.classList.add('shown'));
    const close = () => {
      window.removeEventListener('keydown', onKey);
      io && io.disconnect();
      root.classList.remove('in');
      setTimeout(() => { root.remove(); document.documentElement.classList.remove('lb-lock'); board.fx.start(); }, 300);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const btn = root.querySelector('.gal-close');
    btn.addEventListener('click', close);
    btn.focus({ preventScroll: true });
  }

  class Lightbox {
    constructor(board, day) { this.b = board; this.day = day; }
    wellRect(day) { return this.b.doors[day].querySelector('.door-well').getBoundingClientRect(); }
    layout(img) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const wide = vw >= 860;
      const ar = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 4 / 3;
      let box;
      if (wide) {
        const pad = Math.max(28, vw * 0.035);
        box = { x: pad, y: pad + 10, w: vw * 0.6 - pad * 1.5, h: vh - pad * 2 - 20 };
      } else {
        box = { x: 16, y: 64, w: vw - 32, h: vh * 0.5 - 64 };
      }
      let w = box.w, h = w / ar;
      if (h > box.h) { h = box.h; w = h * ar; }
      return { left: box.x + (box.w - w) / 2, top: box.y + (box.h - h) / 2, width: w, height: h, wide };
    }
    noteHTML(day) { return noteHTML(this.b, day); }
    async run() {
      const reduced = A.util.prefersReducedMotion();
      const dur = reduced ? 1 : 720;
      const root = el(`<div class="lightbox" role="dialog" aria-modal="true" aria-label="Day ${this.day}">
        <div class="lb-backdrop"></div>
        <div class="lb-photo"><img alt=""><div class="lb-photo-empty">No photo behind this door yet</div></div>
        <article class="lb-note"></article>
        <div class="lb-controls">
          <button class="lb-btn lb-prev" type="button" aria-label="Previous opened day">&#8249;</button>
          <button class="lb-btn lb-next" type="button" aria-label="Next opened day">&#8250;</button>
          <button class="lb-btn lb-close" type="button" aria-label="Close and return to the calendar">&#215;</button>
        </div>
      </div>`);
      document.body.appendChild(root);
      document.documentElement.classList.add('lb-lock');
      const photo = root.querySelector('.lb-photo'), img = photo.querySelector('img'), note = root.querySelector('.lb-note');
      const setContent = async (day) => {
        const doorImg = await this.b.loadPhoto(day);
        const has = !!doorImg.getAttribute('src');
        photo.classList.toggle('empty', !has);
        if (has) { img.style.objectPosition = doorImg.style.objectPosition; img.src = doorImg.src; try { await img.decode(); } catch (e) { /* ignore */ } }
        note.innerHTML = this.noteHTML(day);
        root.setAttribute('aria-label', `Day ${day}`);
        const days = this.b.openedDays();
        root.querySelector('.lb-prev').disabled = days.indexOf(day) <= 0;
        root.querySelector('.lb-next').disabled = days.indexOf(day) >= days.length - 1;
      };
      await setContent(this.day);
      const hideDoorPhoto = (day, hide) => this.b.doors[day].classList.toggle('lifted', hide);

      // fly out of the door
      const from = this.wellRect(this.day);
      let to = this.layout(photo.classList.contains('empty') ? null : img);
      root.classList.toggle('narrow', !to.wide);
      Object.assign(photo.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' });
      hideDoorPhoto(this.day, true);
      root.classList.add('in');
      await photo.animate([
        { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: '2px', boxShadow: '0 0 0 rgba(0,0,0,0)' },
        { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' },
      ], { duration: dur, easing: 'cubic-bezier(.2,.75,.12,1)' }).finished;
      root.classList.add('note-in');
      root.querySelector('.lb-close').focus({ preventScroll: true });

      return await new Promise((resolve) => {
        let closing = false;
        const relayout = () => {
          to = this.layout(photo.classList.contains('empty') ? null : img);
          root.classList.toggle('narrow', !to.wide);
          Object.assign(photo.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' });
        };
        const go = async (dir) => {
          const days = this.b.openedDays();
          const i = days.indexOf(this.day) + dir;
          if (i < 0 || i >= days.length) return;
          root.classList.add('swap');
          await sleep(reduced ? 1 : 220);
          hideDoorPhoto(this.day, false);
          this.day = days[i];
          hideDoorPhoto(this.day, true);
          await setContent(this.day);
          relayout();
          root.classList.remove('swap');
        };
        const close = async () => {
          if (closing) return; closing = true;
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('resize', relayout);
          root.classList.remove('note-in');
          root.classList.add('out');
          const back = this.wellRect(this.day);
          const cur = photo.getBoundingClientRect();
          await photo.animate([
            { left: cur.left + 'px', top: cur.top + 'px', width: cur.width + 'px', height: cur.height + 'px' },
            { left: back.left + 'px', top: back.top + 'px', width: back.width + 'px', height: back.height + 'px', borderRadius: '2px' },
          ], { duration: reduced ? 1 : 620, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
          hideDoorPhoto(this.day, false);
          root.remove();
          document.documentElement.classList.remove('lb-lock');
          resolve(this.day);
        };
        const onKey = (e) => {
          if (e.key === 'Escape') close();
          else if (e.key === 'ArrowRight') go(1);
          else if (e.key === 'ArrowLeft') go(-1);
          else if (e.key === 'Tab') {
            const f = [...root.querySelectorAll('button:not([disabled])')];
            const i = f.indexOf(document.activeElement);
            e.preventDefault();
            f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
          }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', relayout);
        root.querySelector('.lb-close').addEventListener('click', close);
        root.querySelector('.lb-backdrop').addEventListener('click', close);
        root.querySelector('.lb-prev').addEventListener('click', () => go(-1));
        root.querySelector('.lb-next').addEventListener('click', () => go(1));
      });
    }
  }

  A.Board = Board;
  A.sceneURL = sceneURL;
})();

/* ---- src/api-demo.js ---- */
/* Preview backend: everything lives in this browser (IndexedDB, falling back to memory).
   It behaves like the real service — accounts, email codes, date-locked doors — except
   that "emails" appear on screen instead of in an inbox. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const U = A.util;

  /* ---- tiny key/value store over IndexedDB with an in-memory fallback ---- */
  const STORES = ['users', 'calendars', 'days', 'invites', 'opens', 'blobs', 'meta'];
  let dbp = null;
  const mem = Object.fromEntries(STORES.map((s) => [s, new Map()]));
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open('advent-your-year-preview', 2);
        req.onupgradeneeded = () => STORES.forEach((s) => req.result.objectStoreNames.contains(s) || req.result.createObjectStore(s));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await db();
    if (!d) return fn(null, mem[store]);
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      Promise.resolve(fn(s, null)).then((v) => (out = v));
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
    });
  }
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const kv = {
    get: (st, k) => tx(st, 'readonly', (s, m) => (m ? m.get(k) : reqP(s.get(k)))),
    put: (st, k, v) => tx(st, 'readwrite', (s, m) => (m ? m.set(k, v) : reqP(s.put(v, k)))),
    del: (st, k) => tx(st, 'readwrite', (s, m) => (m ? m.delete(k) : reqP(s.delete(k)))),
    all: (st) => tx(st, 'readonly', async (s, m) => (m ? [...m.values()] : reqP(s.getAll()))),
  };

  /* ---- session ---- */
  const SKEY = 'ayy-preview-session';
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  let current = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((f) => f(current));

  async function hash(pw) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ayy:' + pw));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'plain:' + pw; }
  }
  const norm = (e) => String(e || '').trim().toLowerCase();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(10))).map((b) => b.toString(16).padStart(2, '0')).join('');
  const publicUser = (u) => u && { id: u.id, email: u.email, name: u.name };
  const fail = (msg, code) => { const e = new Error(msg); e.code = code; throw e; };

  function sendCode(email, purpose) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    kv.put('meta', 'code:' + purpose + ':' + email, { code, at: Date.now() });
    const subject = purpose === 'signup' ? 'Confirm your email' : 'Reset your password';
    U.toast(`<div class="mail-head">Preview inbox &middot; to ${U.esc(email)}</div><div>${subject}. Your code is</div><div class="mail-code">${code}</div>`, { html: true, kind: 'mail', ms: 30000 });
    return code;
  }
  async function checkCode(email, purpose, code) {
    const rec = await kv.get('meta', 'code:' + purpose + ':' + email);
    if (!rec || rec.code !== String(code).trim()) fail('That code doesn’t match. Check the most recent email and try again.', 'bad_code');
    if (Date.now() - rec.at > 60 * 60 * 1000) fail('That code has expired. Send a new one.', 'expired');
    await kv.del('meta', 'code:' + purpose + ':' + email);
  }

  const api = {
    mode: 'preview',
    async init() {
      const email = ls.get(SKEY);
      if (email) {
        const u = await kv.get('users', email);
        current = u && u.verified ? publicUser(u) : null;
      }
      return current;
    },
    user: () => current,
    onAuth(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async signUp({ name, email, password }) {
      email = norm(email);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('Enter a valid email address.');
      if ((password || '').length < 8) fail('Use at least 8 characters for your password.');
      const existing = await kv.get('users', email);
      if (existing && existing.verified) fail('An account with that email already exists. Sign in instead.', 'exists');
      await kv.put('users', email, { id: existing ? existing.id : uid(), email, name: name.trim(), pw: await hash(password), verified: false });
      sendCode(email, 'signup');
      return { needsCode: true };
    },
    async resendSignup(email) { sendCode(norm(email), 'signup'); },
    async verifySignup({ email, code }) {
      email = norm(email);
      await checkCode(email, 'signup', code);
      const u = await kv.get('users', email);
      if (!u) fail('We couldn’t find that account. Sign up again.');
      u.verified = true;
      await kv.put('users', email, u);
      current = publicUser(u); ls.set(SKEY, email); emit();
      return current;
    },
    async signIn({ email, password }) {
      email = norm(email);
      const u = await kv.get('users', email);
      if (!u || u.pw !== (await hash(password))) fail('That email and password don’t match.');
      if (!u.verified) { sendCode(email, 'signup'); fail('Please confirm your email first. We sent you a new code.', 'unverified'); }
      current = publicUser(u); ls.set(SKEY, email); emit();
      return current;
    },
    async requestReset(email) {
      email = norm(email);
      const u = await kv.get('users', email);
      if (u) sendCode(email, 'recovery');
      else U.toast('If an account exists for that email, a code is on its way.');
    },
    async resetPassword({ email, code, password }) {
      email = norm(email);
      if ((password || '').length < 8) fail('Use at least 8 characters for your new password.');
      await checkCode(email, 'recovery', code);
      const u = await kv.get('users', email);
      u.pw = await hash(password); u.verified = true;
      await kv.put('users', email, u);
      current = publicUser(u); ls.set(SKEY, email); emit();
      return current;
    },
    async signOut() { current = null; ls.set(SKEY, null); emit(); },

    /* ---- calendars ---- */
    async listMyCalendars() {
      const cals = (await kv.all('calendars')).filter((c) => c.owner_id === current.id);
      const days = await kv.all('days');
      const inv = await kv.all('invites');
      return cals.sort((a, b) => b.created_at - a.created_at).map((c) => ({ ...c, filled: days.filter((d) => d.calendar_id === c.id && (d.caption || d.blob_id)).length, shared: inv.filter((i) => i.calendar_id === c.id).length }));
    },
    async listReceived() {
      const recs = (await kv.all('invites')).filter((r) => r.email === current.email);
      const opens = (await kv.all('opens')).filter((o) => o.user_id === current.id);
      const out = [];
      for (const r of recs) {
        const c = await kv.get('calendars', r.calendar_id);
        if (c) out.push({ ...c, opened: opens.filter((o) => o.calendar_id === c.id).length });
      }
      return out;
    },
    async createCalendar(fields) {
      const c = { id: uid(), owner_id: current.id, share_token: token(), created_at: Date.now(), timezone: U.localTz(), design: 'parlor', ...fields };
      await kv.put('calendars', c.id, c);
      return c;
    },
    async updateCalendar(id, fields) {
      const c = await kv.get('calendars', id);
      if (!c || c.owner_id !== current.id) fail('Only the person who made this calendar can change it.');
      Object.assign(c, fields);
      await kv.put('calendars', id, c);
      return c;
    },
    async deleteCalendar(id) {
      const c = await kv.get('calendars', id);
      if (!c || c.owner_id !== current.id) fail('Only the person who made this calendar can delete it.');
      for (let d = 1; d <= 24; d++) {
        const row = await kv.get('days', id + ':' + d);
        if (row && row.blob_id) await kv.del('blobs', row.blob_id);
        await kv.del('days', id + ':' + d);
      }
      for (const i of (await kv.all('invites')).filter((x) => x.calendar_id === id)) await kv.del('invites', id + ':' + i.email);
      await kv.del('calendars', id);
    },
    async getCalendar(id) {
      const c = await kv.get('calendars', id);
      if (!c) fail('We couldn’t find that calendar.', 'not_found');
      const isOwner = current && c.owner_id === current.id;
      const rec = current && (await kv.get('invites', id + ':' + current.email));
      if (!isOwner && !rec) fail('This calendar was shared with a different email address. Sign in with the email it was sent to.', 'forbidden');
      const days = {};
      for (let d = 1; d <= 24; d++) {
        if (!isOwner && !U.isUnlocked(c, d)) continue; // same rule the real server enforces
        const row = await kv.get('days', id + ':' + d);
        if (!row) continue;
        let image_url = null;
        if (row.blob_id) { const b = await kv.get('blobs', row.blob_id); if (b) image_url = URL.createObjectURL(b); }
        days[d] = { caption: row.caption || '', image_url, focus: [row.focus_x ?? 50, row.focus_y ?? 50] };
      }
      const opened = new Set((await kv.all('opens')).filter((o) => o.calendar_id === id && current && o.user_id === current.id).map((o) => o.day));
      return { calendar: c, role: isOwner ? 'owner' : 'recipient', days, opened };
    },
    async saveCaption(id, day, caption) {
      await api.updateCalendar(id, {});
      const row = (await kv.get('days', id + ':' + day)) || { calendar_id: id, day };
      row.caption = caption;
      await kv.put('days', id + ':' + day, row);
    },
    async uploadPhoto(id, day, blob) {
      await api.updateCalendar(id, {});
      const row = (await kv.get('days', id + ':' + day)) || { calendar_id: id, day };
      if (row.blob_id) await kv.del('blobs', row.blob_id);
      row.blob_id = uid();
      row.focus_x = 50; row.focus_y = 50;
      await kv.put('blobs', row.blob_id, blob);
      await kv.put('days', id + ':' + day, row);
      return URL.createObjectURL(blob);
    },
    async saveFocus(id, day, x, y) {
      const row = (await kv.get('days', id + ':' + day)) || { calendar_id: id, day };
      row.focus_x = Math.round(x); row.focus_y = Math.round(y);
      await kv.put('days', id + ':' + day, row);
    },
    async removePhoto(id, day) {
      const row = await kv.get('days', id + ':' + day);
      if (row && row.blob_id) { await kv.del('blobs', row.blob_id); row.blob_id = null; await kv.put('days', id + ':' + day, row); }
    },
    async sharePreview(tok) {
      const c = (await kv.all('calendars')).find((x) => x.share_token === tok);
      if (!c) return null;
      const owner = (await kv.all('users')).find((u) => u.id === c.owner_id);
      return { id: c.id, title: c.title, to_name: c.to_name, from_name: c.from_name, design: c.design, start_year: c.start_year, start_month: c.start_month, owner_id: c.owner_id, owner_name: owner && owner.name };
    },
    async joinByToken(tok) {
      const c = (await kv.all('calendars')).find((x) => x.share_token === tok);
      if (!c) fail('That link doesn’t match a calendar. Ask the sender to share it again.');
      if (c.owner_id !== current.id && !(await kv.get('invites', c.id + ':' + current.email))) fail('This calendar was shared with a different email address. Sign in with the email it was sent to.', 'not_invited');
      return c.id;
    },
    async listInvites(id) {
      return (await kv.all('invites')).filter((i) => i.calendar_id === id).sort((a, b) => a.invited_at - b.invited_at).map((i) => i.email);
    },
    async addInvites(id, emails) {
      await api.updateCalendar(id, {});
      for (const e of emails) {
        const email = norm(e);
        if (!(await kv.get('invites', id + ':' + email))) await kv.put('invites', id + ':' + email, { calendar_id: id, email, invited_at: Date.now() });
      }
      return api.listInvites(id);
    },
    async removeInvite(id, email) {
      await api.updateCalendar(id, {});
      await kv.del('invites', id + ':' + norm(email));
      return api.listInvites(id);
    },
    async listInviteStatus(id) {
      return (await kv.all('invites')).filter((i) => i.calendar_id === id).sort((a, b) => a.invited_at - b.invited_at)
        .map((i) => ({ email: i.email, emailed_at: i.emailed_at ? new Date(i.emailed_at).toISOString() : null }));
    },
    /** Preview mode can't send real email; it records the send so the sharing screen behaves like the live one. */
    async sendInvites(id, emails) {
      let count = 0;
      for (const e of emails) {
        const rec = await kv.get('invites', id + ':' + norm(e));
        if (rec) { rec.emailed_at = Date.now(); await kv.put('invites', id + ':' + rec.email, rec); count++; }
      }
      return { sent: true, count, simulated: true };
    },
    async markOpened(id, day) {
      if (!current) return;
      await kv.put('opens', `${id}:${current.id}:${day}`, { calendar_id: id, user_id: current.id, day, opened_at: Date.now() });
    },
    async leaveCalendar(id) { await kv.del('invites', id + ':' + current.email); },
  };

  A.apiPreview = api;
})();

/* ---- src/api-supabase.js ---- */
/* Live backend: Supabase (Postgres + Auth + Storage).
   Day locking is enforced in the database (see supabase/schema.sql), so a recipient's
   browser never receives a photo or note before its day arrives. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const U = A.util;
  const BUCKET = 'advent-photos';

  function make(cfg) {
    const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    let current = null;
    const listeners = new Set();
    const toUser = (u) => u && { id: u.id, email: u.email, name: (u.user_metadata && u.user_metadata.display_name) || u.email.split('@')[0] };
    const check = ({ data, error }) => { if (error) throw friendly(error); return data; };
    function friendly(err) {
      const m = (err && err.message) || String(err);
      const e = new Error(
        /Invalid login credentials/i.test(m) ? 'That email and password don’t match.'
          : /Email not confirmed/i.test(m) ? 'Please confirm your email first. We sent you a new code.'
          : /expired|invalid.*(otp|token)/i.test(m) ? 'That code doesn’t match or has expired. Send a new one and try again.'
          : /already registered/i.test(m) ? 'An account with that email already exists. Sign in instead.'
          : /rate limit/i.test(m) ? 'Too many emails were sent just now. Wait a minute and try again.'
          : /Password should be/i.test(m) ? 'Use at least 8 characters for your password.'
          : m
      );
      if (/Email not confirmed/i.test(m)) e.code = 'unverified';
      if (/already registered/i.test(m)) e.code = 'exists';
      return e;
    }
    async function signedUrls(paths) {
      if (!paths.length) return {};
      const data = check(await sb.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6));
      const out = {};
      data.forEach((d) => { if (d.signedUrl) out[d.path] = d.signedUrl; });
      return out;
    }

    const api = {
      mode: 'live',
      async init() {
        const { data } = await sb.auth.getSession();
        current = toUser(data.session && data.session.user);
        sb.auth.onAuthStateChange((_ev, session) => {
          const next = toUser(session && session.user);
          if ((next && next.id) !== (current && current.id)) { current = next; listeners.forEach((f) => f(current)); }
          else current = next;
        });
        return current;
      },
      user: () => current,
      onAuth(fn) { listeners.add(fn); return () => listeners.delete(fn); },

      async signUp({ name, email, password }) {
        const data = check(await sb.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() } } }));
        // Supabase hides existing accounts by returning a user with no identities
        if (data.user && data.user.identities && data.user.identities.length === 0) { const e = new Error('An account with that email already exists. Sign in instead.'); e.code = 'exists'; throw e; }
        return { needsCode: !data.session };
      },
      async resendSignup(email) { check(await sb.auth.resend({ type: 'signup', email: email.trim() })); },
      async verifySignup({ email, code }) {
        const data = check(await sb.auth.verifyOtp({ email: email.trim(), token: String(code).trim(), type: 'signup' }));
        current = toUser(data.user);
        return current;
      },
      async signIn({ email, password }) {
        const res = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (res.error && /Email not confirmed/i.test(res.error.message)) { await sb.auth.resend({ type: 'signup', email: email.trim() }).catch(() => {}); }
        const data = check(res);
        current = toUser(data.user);
        return current;
      },
      async requestReset(email) { check(await sb.auth.resetPasswordForEmail(email.trim())); },
      async resetPassword({ email, code, password }) {
        check(await sb.auth.verifyOtp({ email: email.trim(), token: String(code).trim(), type: 'recovery' }));
        const data = check(await sb.auth.updateUser({ password }));
        current = toUser(data.user);
        return current;
      },
      async signOut() { await sb.auth.signOut(); current = null; listeners.forEach((f) => f(null)); },

      async listMyCalendars() {
        const cals = check(await sb.from('calendars').select('*').eq('owner_id', current.id).order('created_at', { ascending: false }));
        if (!cals.length) return [];
        const ids = cals.map((c) => c.id);
        const days = check(await sb.from('calendar_days').select('calendar_id, caption, image_path').in('calendar_id', ids));
        const inv = check(await sb.from('calendar_invites').select('calendar_id').in('calendar_id', ids));
        return cals.map((c) => ({ ...c, filled: days.filter((d) => d.calendar_id === c.id && (d.caption || d.image_path)).length, shared: inv.filter((i) => i.calendar_id === c.id).length }));
      },
      async listReceived() {
        const rows = check(await sb.from('calendar_invites').select('calendar_id, calendars(*)').eq('email', current.email.toLowerCase()));
        const opens = check(await sb.from('day_opens').select('calendar_id, day').eq('user_id', current.id));
        return rows.filter((r) => r.calendars).map((r) => ({ ...r.calendars, opened: opens.filter((o) => o.calendar_id === r.calendar_id).length }));
      },
      async createCalendar(fields) {
        return check(await sb.from('calendars').insert({ ...fields, owner_id: current.id, timezone: fields.timezone || U.localTz() }).select().single());
      },
      async updateCalendar(id, fields) {
        return check(await sb.from('calendars').update(fields).eq('id', id).select().single());
      },
      async deleteCalendar(id) {
        const files = check(await sb.storage.from(BUCKET).list(id));
        if (files.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`));
        check(await sb.from('calendars').delete().eq('id', id));
      },
      async getCalendar(id) {
        const cal = check(await sb.from('calendars').select('*').eq('id', id).maybeSingle());
        if (!cal) { const e = new Error('This calendar was shared with a different email address. Sign in with the email it was sent to.'); e.code = 'forbidden'; throw e; }
        const role = current && cal.owner_id === current.id ? 'owner' : 'recipient';
        const rows = check(await sb.from('calendar_days').select('day, caption, image_path, focus_x, focus_y').eq('calendar_id', id));
        const urls = await signedUrls(rows.filter((r) => r.image_path).map((r) => r.image_path));
        const days = {};
        rows.forEach((r) => { days[r.day] = { caption: r.caption || '', image_url: r.image_path ? urls[r.image_path] || null : null, focus: [r.focus_x ?? 50, r.focus_y ?? 50] }; });
        const opens = current ? check(await sb.from('day_opens').select('day').eq('calendar_id', id).eq('user_id', current.id)) : [];
        return { calendar: cal, role, days, opened: new Set(opens.map((o) => o.day)) };
      },
      async saveCaption(id, day, caption) {
        check(await sb.from('calendar_days').upsert({ calendar_id: id, day, caption }, { onConflict: 'calendar_id,day' }));
      },
      async uploadPhoto(id, day, blob) {
        const prev = check(await sb.from('calendar_days').select('image_path').eq('calendar_id', id).eq('day', day).maybeSingle());
        const path = `${id}/${day}-${Date.now().toString(36)}.jpg`;
        check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
        check(await sb.from('calendar_days').upsert({ calendar_id: id, day, image_path: path, focus_x: 50, focus_y: 50 }, { onConflict: 'calendar_id,day' }));
        if (prev && prev.image_path) await sb.storage.from(BUCKET).remove([prev.image_path]);
        const urls = await signedUrls([path]);
        return urls[path];
      },
      async saveFocus(id, day, x, y) {
        check(await sb.from('calendar_days').update({ focus_x: Math.round(x), focus_y: Math.round(y) }).eq('calendar_id', id).eq('day', day));
      },
      async removePhoto(id, day) {
        const prev = check(await sb.from('calendar_days').select('image_path').eq('calendar_id', id).eq('day', day).maybeSingle());
        if (prev && prev.image_path) {
          await sb.storage.from(BUCKET).remove([prev.image_path]);
          check(await sb.from('calendar_days').update({ image_path: null }).eq('calendar_id', id).eq('day', day));
        }
      },
      async sharePreview(token) {
        const rows = check(await sb.rpc('share_preview', { p_token: token }));
        return rows && rows[0] ? rows[0] : null;
      },
      async joinByToken(token) { return check(await sb.rpc('join_calendar', { p_token: token })); },
      async listInvites(id) {
        return check(await sb.from('calendar_invites').select('email, invited_at').eq('calendar_id', id).order('invited_at')).map((r) => r.email);
      },
      /** [{ email, emailed_at }] in the order people were added; emailed_at is null until the invitation goes out. */
      async listInviteStatus(id) {
        return check(await sb.from('calendar_invites').select('email, emailed_at').eq('calendar_id', id).order('invited_at'));
      },
      async addInvites(id, emails) {
        const rows = emails.map((e) => ({ calendar_id: id, email: e.trim().toLowerCase() }));
        check(await sb.from('calendar_invites').upsert(rows, { onConflict: 'calendar_id,email', ignoreDuplicates: true }));
        return api.listInvites(id);
      },
      async removeInvite(id, email) {
        check(await sb.from('calendar_invites').delete().eq('calendar_id', id).eq('email', email.trim().toLowerCase()));
        return api.listInvites(id);
      },
      /** Emails the invitation through the send-invite Edge Function (needs Resend set up). */
      async sendInvites(id, emails, link) {
        if (!cfg.inviteEmails) return { sent: false };
        const { data, error } = await sb.functions.invoke('send-invite', { body: { calendar_id: id, emails, link } });
        if (error) throw new Error('The invitation emails couldn’t be sent. Copy the link and send it yourself.');
        return { sent: true, count: (data && data.sent) || emails.length };
      },
      async markOpened(id, day) {
        if (!current) return;
        await sb.from('day_opens').upsert({ calendar_id: id, user_id: current.id, day }, { onConflict: 'calendar_id,user_id,day', ignoreDuplicates: true });
      },
      async leaveCalendar(id) { check(await sb.from('calendar_invites').delete().eq('calendar_id', id).eq('email', current.email.toLowerCase())); },
    };
    return api;
  }

  A.apiLive = make;
})();

/* ---- src/app.js ---- */
/* Advent Your Year — app shell, routing and views */
(function () {
  const A = window.AYY;
  const U = A.util;
  const { esc, el } = U;
  const cfg = window.AYY_CONFIG || {};
  const live = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const api = live ? A.apiLive(cfg) : A.apiPreview;
  const app = document.getElementById('app');
  let board = null;
  let cleanup = [];

  /* ---------------- catalog of designs ---------------- */
  const CATALOG = [
    ['parlor', 'Christmas Eve Parlor', 'Fireside sitting room, stockings, a twinkling tree and snow at the window.', '#5c111b', '#1d4d2f'],
    ['tannenbaum', 'O Tannenbaum', 'One grand traditional tree glowing in a snowy town square.', '#1d4d2f', '#0b2416'],
    ['wonderland', 'Winter Wonderland', 'A hushed village under deep snow and lamplight.', '#7fa8d6', '#2c4f7c'],
    ['cats', 'Meowy & Bright', 'A pile of cats in Santa hats, tangled in tinsel.', '#2b1d4a', '#c46a3a'],
    ['dogs', 'Pups & Presents', 'Dogs in scarves, ribbons everywhere, nobody is sorry.', '#7a3b1d', '#e0a35a'],
    ['golf', 'Fairway Frost', 'Snow on the greens, a flag with a wreath, the 19th hole lit up.', '#2f6b3a', '#a9cdb2'],
    ['ski', 'Bluebird Powder Day', 'Chairlifts, fresh tracks and a lodge with a roaring fire.', '#1f5fa8', '#bcd8f2'],
    ['snowboard', 'Halfpipe Holiday', 'Snowboarders catching air over a festive terrain park.', '#3a1f6b', '#e05a8a'],
    ['sledding', 'Sledding Hill', 'Red toboggans, mittens and a long run to the bottom.', '#b3172b', '#e6d8c4'],
    ['workshop', 'Santa’s Workshop', 'Elves at their benches, toys stacked to the rafters.', '#8a1c1c', '#d9a83a'],
    ['train', 'North Pole Express', 'A steam train winding through snowy pines at night.', '#0e2a4a', '#c9963a'],
    ['gingerbread', 'Gingerbread Lane', 'A street of iced houses, gumdrop roofs and candy canes.', '#8a4a1f', '#e9c49a'],
    ['nutcracker', 'Nutcracker Night', 'Velvet curtains, sugar plums and a toy soldier on stage.', '#4a0d2a', '#c9a24a'],
    ['pond', 'Frozen Pond', 'Skaters circling a pond ringed with lanterns.', '#7fb3d5', '#1c3b5a'],
    ['cabin', 'Cabin in the Pines', 'A log cabin, smoke from the chimney, boots by the door.', '#23402d', '#d9904a'],
    ['victorian', 'Victorian Christmas', 'Carolers in top hats outside a gaslit shop window.', '#5a2a3a', '#d9c39a'],
    ['aurora', 'Northern Lights', 'Ribbons of green light over a snowy lake.', '#04121f', '#2fbf8a'],
    ['silentnight', 'Silent Night', 'A quiet stable beneath one bright star.', '#0a1630', '#d9b45a'],
    ['reindeer', 'Reindeer Games', 'Reindeer racing across a frosty meadow.', '#5a3a1f', '#a9c9e0'],
    ['snowman', 'Snowman Family', 'A whole snow family in scarves and button eyes.', '#c9d9ea', '#2a5aa8'],
  ].map(([id, name, blurb, c1, c2]) => ({ id, name, blurb, c1, c2, available: !!(A.designs[id] && A.layouts && A.layouts[id]) }));
  const designName = (id) => (CATALOG.find((d) => d.id === id) || CATALOG[0]).name;

  /* ---------------- helpers ---------------- */
  const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe7ae"/><stop offset="1" stop-color="#b8893a"/></linearGradient></defs><path d="M6 30V12a10 10 0 0 1 20 0v18Z" fill="#7a1020" stroke="url(#lg)" stroke-width="2"/><path d="M16 9l1.6 3.9 4.2.3-3.2 2.7 1 4.1L16 17.8 12.4 20l1-4.1-3.2-2.7 4.2-.3Z" fill="url(#lg)"/><circle cx="21" cy="23" r="1.4" fill="url(#lg)"/></svg>`;
  const ICON_PHOTO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>`;

  function go(hash) { if (location.hash.slice(1) === hash) route(); else location.hash = hash; }
  function after(set) { try { if (set === undefined) { const v = sessionStorage.getItem('ayy-after'); sessionStorage.removeItem('ayy-after'); return v; } sessionStorage.setItem('ayy-after', set); } catch (e) { return null; } }
  function shareURL(token) {
    const base = cfg.publicUrl || (location.origin + location.pathname);
    return base.replace(/#.*$/, '') + '#share-' + token;
  }
  function defaultMonth() {
    const [y, m, d] = U.todayIn().split('-').map(Number);
    return m === 12 && d > 24 ? { y: y + 1, m: 12 } : { y, m: 12 };
  }
  function monthOptions(sel) {
    const [y, m] = U.todayIn().split('-').map(Number);
    let html = '', found = false;
    for (let i = 0; i < 14; i++) {
      const mm = ((m - 1 + i) % 12) + 1, yy = y + Math.floor((m - 1 + i) / 12);
      const v = `${yy}-${mm}`;
      if (v === sel) found = true;
      html += `<option value="${v}" ${v === sel ? 'selected' : ''}>${U.MONTHS[mm - 1]} ${yy}</option>`;
    }
    if (!found && sel) { const [sy, sm] = sel.split('-').map(Number); html = `<option value="${sel}" selected>${U.MONTHS[sm - 1]} ${sy}</option>` + html; }
    return html;
  }
  function setThumb(node, design) {
    A.sceneURL(design || 'parlor', 0.4).then((u) => { node.style.backgroundImage = `url("${u}")`; });
  }
  function formError(form, err) {
    let box = form.querySelector('.form-error');
    if (!box) { box = el('<div class="form-error" role="alert"></div>'); form.prepend(box); }
    box.textContent = err.message || String(err);
  }
  async function busy(btn, fn) {
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'One moment…';
    try { return await fn(); } finally { btn.disabled = false; btn.textContent = label; }
  }
  function teardown() {
    if (board) { board.destroy(); board = null; }
    cleanup.forEach((f) => f()); cleanup = [];
    document.querySelectorAll('.modal').forEach((m) => m.remove());
  }

  /* ---------------- shell ---------------- */
  function shell(inner) {
    const u = api.user();
    const nav = u
      ? `<span class="head-user">${esc(u.name)}</span><a class="btn ghost small" href="#dashboard">My calendars</a><button class="btn ghost small" data-act="signout" type="button">Sign out</button>`
      : `<a class="btn ghost small" href="#sample">See a sample</a><a class="btn ghost small" href="#signin">Sign in</a><a class="btn small" href="#signup">Create an account</a>`;
    app.innerHTML = `
      ${api.mode === 'preview' ? `<div class="demo-bar"><strong>Preview mode.</strong> Accounts and photos are saved only in this browser, and email codes appear on screen.</div>` : ''}
      <header class="site-head"><a class="logo" href="#home">${LOGO}<span>Advent <em>Your</em> Year</span></a><nav class="head-nav">${nav}</nav></header>
      <main>${inner}</main>
      <footer class="site-foot"><div class="wrap"><span>Advent Your Year &middot; photo advent calendars for the people you love</span><span>josephjackman.com</span></div></footer>`;
    const so = app.querySelector('[data-act="signout"]');
    if (so) so.addEventListener('click', async () => { await api.signOut(); go('home'); });
    window.scrollTo(0, 0);
  }

  /* ---------------- landing ---------------- */
  function sampleCalendar() {
    const [y, m] = U.todayIn().split('-').map(Number);
    return { id: 'sample', title: 'Merry Christmas, Mom & Dad', to_name: 'Mom & Dad', from_name: 'Joseph', design: 'parlor', start_year: y, start_month: m, timezone: U.localTz() };
  }
  function sampleDays() {
    const days = {};
    A.samples.notes.forEach((t, i) => (days[i + 1] = { caption: t, image_url: null }));
    return days;
  }

  function viewLanding() {
    shell(`
      <section class="wrap hero">
        <div>
          <p class="eyebrow">photo advent calendars</p>
          <h1>Twenty-four little doors, <em>a memory behind every one.</em></h1>
          <p class="lede">Choose a classic illustrated calendar, tuck a photo and a short note behind each door, then send it to someone you love. One door opens each day, and the whole calendar stays in their account to come back to.</p>
          <div class="hero-cta"><a class="btn gold" href="#signup">Make a calendar</a><a class="btn ghost" href="#sample">Open the sample calendar</a></div>
        </div>
        <div><div class="hero-board" id="hero-board"></div><p class="hero-caption">Christmas Eve Parlor, the first of twenty designs</p></div>
      </section>
      <section class="wrap steps">
        <div class="step"><b>step one</b><h3>Pick a design</h3><p>Traditional trees, snowy villages, cats, dogs, golf, skiing and more. Each one is a full illustrated scene with its own little doors.</p></div>
        <div class="step"><b>step two</b><h3>Fill the doors</h3><p>Add a photo and a few lines for each day. Choose the month, and each door unlocks on its own date.</p></div>
        <div class="step"><b>step three</b><h3>Send the link</h3><p>They make a free account and the calendar is saved there for good. When the 24th arrives, every photo is on display at once.</p></div>
      </section>`);
    board = new A.Board(document.getElementById('hero-board'), { calendar: sampleCalendar(), days: {}, mode: 'hero' });
  }

  /* ---------------- auth views ---------------- */
  function authCard(title, sub, body, alt) {
    shell(`<section class="wrap auth-wrap"><div class="paper auth-card"><h1>${title}</h1><p class="sub">${sub}</p>${body}${alt ? `<p class="alt">${alt}</p>` : ''}</div></section>`);
    return app.querySelector('form');
  }
  function afterAuth() {
    const next = after();
    go(next || 'dashboard');
  }

  function viewSignIn() {
    const f = authCard('Welcome back', 'Sign in to see your calendars.', `
      <form class="form" novalidate>
        <div class="field"><label for="si-email">Email</label><input class="input" id="si-email" type="email" autocomplete="email" required></div>
        <div class="field"><div class="row-between"><label for="si-pw">Password</label><a href="#forgot" style="font-size:14px;color:#7a1020">Forgot password?</a></div><input class="input" id="si-pw" type="password" autocomplete="current-password" required></div>
        <button class="btn" type="submit">Sign in</button>
      </form>`, `New here? <a href="#signup" style="color:#7a1020">Create an account</a>`);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = f.querySelector('#si-email').value, password = f.querySelector('#si-pw').value;
      busy(f.querySelector('button[type=submit]'), async () => {
        try { await api.signIn({ email, password }); afterAuth(); }
        catch (err) {
          if (err.code === 'unverified') { try { sessionStorage.setItem('ayy-verify', email); } catch (x) { /* ignore */ } go('verify'); return; }
          formError(f, err);
        }
      });
    });
  }

  function viewSignUp() {
    const f = authCard('Create your account', 'You’ll use it to make calendars and to keep the ones sent to you.', `
      <form class="form" novalidate>
        <div class="field"><label for="su-name">Your name</label><input class="input" id="su-name" autocomplete="name" required placeholder="How it appears on calendars you send"></div>
        <div class="field"><label for="su-email">Email</label><input class="input" id="su-email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="su-pw">Password</label><input class="input" id="su-pw" type="password" autocomplete="new-password" minlength="8" required><span class="hint">At least 8 characters.</span></div>
        <button class="btn" type="submit">Create account</button>
      </form>`, `Already have an account? <a href="#signin" style="color:#7a1020">Sign in</a>`);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = f.querySelector('#su-name').value, email = f.querySelector('#su-email').value, password = f.querySelector('#su-pw').value;
      if (!name.trim()) return formError(f, new Error('Add your name so people know who the calendar is from.'));
      busy(f.querySelector('button[type=submit]'), async () => {
        try {
          const r = await api.signUp({ name, email, password });
          if (r.needsCode) { try { sessionStorage.setItem('ayy-verify', email); } catch (x) { /* ignore */ } go('verify'); }
          else afterAuth();
        } catch (err) { formError(f, err); }
      });
    });
  }

  function viewVerify() {
    let email = '';
    try { email = sessionStorage.getItem('ayy-verify') || ''; } catch (e) { /* ignore */ }
    const f = authCard('Check your email', `We sent a 6-digit code to <b>${esc(email || 'your email')}</b>. Enter it here to confirm your account.`, `
      <form class="form" novalidate>
        ${email ? '' : '<div class="field"><label for="v-email">Email</label><input class="input" id="v-email" type="email" autocomplete="email" required></div>'}
        <div class="field"><label for="v-code">Verification code</label><input class="input code" id="v-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></div>
        <button class="btn" type="submit">Confirm email</button>
        <p class="form-note">Didn’t get it? Check spam, or <button class="linkish" type="button" data-act="resend">send a new code</button>.</p>
      </form>`, `<a href="#signin" style="color:#7a1020">Back to sign in</a>`);
    const getEmail = () => email || (f.querySelector('#v-email') || {}).value || '';
    f.querySelector('#v-code').focus();
    f.querySelector('[data-act="resend"]').addEventListener('click', async () => {
      try { await api.resendSignup(getEmail()); U.toast('A new code is on its way.'); } catch (err) { formError(f, err); }
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      busy(f.querySelector('button[type=submit]'), async () => {
        try { await api.verifySignup({ email: getEmail(), code: f.querySelector('#v-code').value }); U.clearToasts('mail'); U.toast('Email confirmed. Welcome!'); afterAuth(); }
        catch (err) { formError(f, err); }
      });
    });
  }

  function viewForgot() {
    const f = authCard('Reset your password', 'Enter your email and we’ll send you a code.', `
      <form class="form" novalidate data-step="1">
        <div class="field"><label for="fp-email">Email</label><input class="input" id="fp-email" type="email" autocomplete="email" required></div>
        <div class="fp-step2" hidden>
          <div class="form" style="gap:14px">
            <div class="field"><label for="fp-code">Code from the email</label><input class="input code" id="fp-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></div>
            <div class="field"><label for="fp-pw">New password</label><input class="input" id="fp-pw" type="password" autocomplete="new-password" minlength="8"><span class="hint">At least 8 characters.</span></div>
          </div>
        </div>
        <button class="btn" type="submit">Send code</button>
      </form>`, `<a href="#signin" style="color:#7a1020">Back to sign in</a>`);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = f.querySelector('button[type=submit]');
      const email = f.querySelector('#fp-email').value;
      if (f.dataset.step === '1') {
        busy(btn, async () => {
          try {
            await api.requestReset(email);
            f.dataset.step = '2';
            f.querySelector('.fp-step2').hidden = false;
            f.querySelector('#fp-code').focus();
            setTimeout(() => (btn.textContent = 'Set new password'), 0);
          } catch (err) { formError(f, err); }
        });
      } else {
        busy(btn, async () => {
          try { await api.resetPassword({ email, code: f.querySelector('#fp-code').value, password: f.querySelector('#fp-pw').value }); U.clearToasts('mail'); U.toast('Password updated. You’re signed in.'); afterAuth(); }
          catch (err) { formError(f, err); }
        }).then(() => { if (f.dataset.step === '2') btn.textContent = 'Set new password'; });
      }
    });
  }

  /* ---------------- dashboard ---------------- */
  async function viewDashboard() {
    const u = api.user();
    shell(`<div class="wrap dash"><div class="dash-head"><div><p class="eyebrow">your calendars</p><h1>Hello, ${esc(u.name)}</h1></div><a class="btn gold" href="#new">Make a new calendar</a></div>
      <section class="dash-section"><h2>Sent to you</h2><p>Calendars shared with your email address. They stay here for good.</p><div class="cards" id="recv"><div class="empty-note">Loading…</div></div></section>
      <section class="dash-section"><h2>Made by you</h2><p>Make as many as you like, one for each person or family. Fill the doors, then share each one with the emails it’s for.</p><div class="cards" id="mine"><div class="empty-note">Loading…</div></div></section></div>`);
    const [mine, recv] = await Promise.all([api.listMyCalendars().catch(() => []), api.listReceived().catch(() => [])]);
    const card = (c, kind) => {
      const range = `${U.MONTHS[c.start_month - 1]} 1–24, ${c.start_year}`;
      const pct = kind === 'mine' ? Math.round((c.filled / 24) * 100) : Math.round((c.opened / 24) * 100);
      const meta = kind === 'mine'
        ? `${range}${c.to_name ? ` &middot; for ${esc(c.to_name)}` : ''}<br>${c.filled} of 24 doors filled &middot; ${c.shared ? `shared with ${c.shared} ${c.shared === 1 ? 'person' : 'people'}` : 'not shared yet'}`
        : `${range}${c.from_name ? ` &middot; from ${esc(c.from_name)}` : ''}<br>${c.opened} of 24 doors opened`;
      const actions = kind === 'mine'
        ? `<a class="btn small" href="#edit-${c.id}">Edit doors</a><a class="btn ghost small" href="#preview-${c.id}">Preview</a><button class="btn ghost small" type="button" data-share="${c.id}">Share</button><button class="btn ghost small" type="button" data-download title="Save a copy of this calendar that opens on your computer, no internet needed">Download</button>`
        : `<a class="btn small" href="#view-${c.id}">Open calendar</a><button class="btn ghost small" type="button" data-download title="Save a copy of this calendar that opens on your computer, no internet needed">Download</button>`;
      const node = el(`<article class="cal-card"><div class="cal-thumb"></div><div class="cal-body"><h3>${esc(c.title || 'Untitled calendar')}</h3><div class="cal-meta">${meta}</div><div class="meter" aria-hidden="true"><i style="width:${pct}%"></i></div><div class="cal-actions">${actions}</div></div></article>`);
      setThumb(node.querySelector('.cal-thumb'), c.design);
      const sb = node.querySelector('[data-share]');
      if (sb) sb.addEventListener('click', () => shareModal(c, (l) => { c.shared = l.length; }));
      const dl = node.querySelector('[data-download]');
      dl.addEventListener('click', () => downloadCalendar(c.id, dl));
      return node;
    };
    const recvEl = document.getElementById('recv'), mineEl = document.getElementById('mine');
    if (!recvEl) return;
    recvEl.innerHTML = recv.length ? '' : `<div class="empty-note">Nothing yet. When someone shares a calendar with your email address, it will appear here.</div>`;
    recv.forEach((c) => recvEl.appendChild(card(c, 'recv')));
    mineEl.innerHTML = '';
    mine.forEach((c) => mineEl.appendChild(card(c, 'mine')));
    mineEl.appendChild(el(`<a class="new-card" href="#new"><div><span>Start a new calendar</span><br><small>Twenty designs to choose from</small></div></a>`));
  }

  /* ---------------- design picker ---------------- */
  function designTiles(selected) {
    return CATALOG.map((d) => `<button class="design-tile ${d.available ? 'available' : ''} ${d.id === selected ? 'selected' : ''}" type="button" data-design="${d.id}" ${d.available ? '' : 'disabled'}>
      <span class="swatch" ${d.available ? `data-thumb="${d.id}"` : `style="background:radial-gradient(circle at 20% 30%, rgba(255,255,255,.35) 0 2px, transparent 3px) 0 0/26px 26px, radial-gradient(circle at 70% 60%, rgba(255,255,255,.25) 0 1.5px, transparent 2.5px) 0 0/34px 34px, linear-gradient(135deg, ${d.c1}, ${d.c2})"`}>${d.available ? '' : `<span class="motif">${esc(d.name)}</span>`}</span>
      <span class="tag">${d.available ? 'Ready' : 'Coming soon'}</span>
      <span class="info"><b>${esc(d.name)}</b><small>${esc(d.blurb)}</small></span></button>`).join('');
  }
  function hydrateThumbs(root) { root.querySelectorAll('[data-thumb]').forEach((n) => setThumb(n, n.dataset.thumb)); }

  function viewNew() {
    shell(`<div class="wrap dash"><div class="dash-head"><div><p class="eyebrow">new calendar</p><h1>Choose a design</h1></div><a class="btn ghost" href="#dashboard">Back to my calendars</a></div>
      <div class="designs">${designTiles()}</div></div>`);
    hydrateThumbs(app);
    app.querySelectorAll('.design-tile.available').forEach((b) => b.addEventListener('click', async () => {
      const u = api.user();
      const { y, m } = defaultMonth();
      b.disabled = true;
      try {
        const c = await api.createCalendar({ title: 'Merry Christmas', to_name: '', from_name: u.name, design: b.dataset.design, start_year: y, start_month: m });
        go('edit-' + c.id);
      } catch (err) { U.toast(err.message, { kind: 'error' }); b.disabled = false; }
    }));
  }

  /* ---------------- editor ---------------- */
  async function viewEditor(id) {
    shell(`<div class="wrap"><p style="padding:40px 0;color:var(--muted)">Loading your calendar…</p></div>`);
    let data;
    try { data = await api.getCalendar(id); } catch (err) { return viewError(err.message); }
    if (data.role !== 'owner') return go('view-' + id);
    const c = data.calendar;
    const sel = `${c.start_year}-${c.start_month}`;
    shell(`<div class="wrap editor">
      <aside class="editor-side">
        <form class="paper form" id="settings" novalidate>
          <h2>Calendar details</h2>
          <div class="field"><label for="c-title">Title on the banner</label><input class="input" id="c-title" maxlength="40" value="${esc(c.title)}"></div>
          <div class="field"><label for="c-to">Who it’s for</label><input class="input" id="c-to" maxlength="60" value="${esc(c.to_name || '')}" placeholder="Mom & Dad"></div>
          <div class="field"><label for="c-from">Signed from</label><input class="input" id="c-from" maxlength="60" value="${esc(c.from_name || '')}"></div>
          <div class="field"><label for="c-month">Month the doors open</label><select class="select" id="c-month">${monthOptions(sel)}</select><span class="hint">Door 1 opens on the 1st, door 24 on the 24th.</span></div>
          <div class="field"><label>Design</label><div class="design-current"><span class="mini" data-thumb="${c.design}"></span><div><b>${esc(designName(c.design))}</b><button class="linkish" type="button" data-act="design">Change design</button></div></div></div>
          <div class="day-foot"><span></span><span id="settings-status"></span></div>
        </form>
        <div class="side-actions">
          <a class="btn gold" href="#preview-${c.id}">Preview the calendar</a>
          <button class="btn" type="button" data-act="share">Share the Calendar</button>
          <p class="shared-with" id="shared-with"></p>
          <button class="btn danger-text small" type="button" data-act="delete">Delete this calendar</button>
        </div>
      </aside>
      <section>
        <div class="days-head"><div><p class="eyebrow">behind the doors</p><h1>${esc(c.title || 'Your calendar')}</h1></div><span class="pill" id="fill-count"></span></div>
        <div class="days-grid" id="days"></div>
      </section>
    </div>`);
    hydrateThumbs(app);

    // settings autosave
    const form = document.getElementById('settings');
    const status = document.getElementById('settings-status');
    let st;
    const saveSettings = () => {
      clearTimeout(st);
      status.textContent = 'Saving…'; status.className = '';
      st = setTimeout(async () => {
        const [yy, mm] = form.querySelector('#c-month').value.split('-').map(Number);
        try {
          Object.assign(c, await api.updateCalendar(c.id, { title: form.querySelector('#c-title').value.trim() || 'Merry Christmas', to_name: form.querySelector('#c-to').value.trim(), from_name: form.querySelector('#c-from').value.trim(), start_year: yy, start_month: mm }));
          status.textContent = 'Saved'; status.className = 'saved';
          app.querySelector('.days-head h1').textContent = c.title;
          relabel();
        } catch (err) { status.textContent = err.message; }
      }, 500);
    };
    form.addEventListener('input', saveSettings);
    form.addEventListener('submit', (e) => e.preventDefault());
    form.querySelector('[data-act="design"]').addEventListener('click', () => designModal(c, (id2) => { api.updateCalendar(c.id, { design: id2 }).then(() => go('edit-' + c.id)); }));
    const sharedWith = document.getElementById('shared-with');
    const showShared = (l) => { sharedWith.textContent = l.length ? 'Shared with ' + l.join(', ') : 'Not shared with anyone yet.'; };
    api.listInvites(c.id).then(showShared).catch(() => {});
    app.querySelector('[data-act="share"]').addEventListener('click', () => shareModal(c, showShared));
    app.querySelector('[data-act="delete"]').addEventListener('click', () => confirmModal(`Delete “${c.title}”?`, 'This removes the calendar, its photos and notes, and it disappears for anyone you shared it with. This can’t be undone.', 'Delete calendar', async () => { await api.deleteCalendar(c.id); U.toast('Calendar deleted.'); go('dashboard'); }));

    // day cards
    const grid = document.getElementById('days');
    const counts = () => {
      let n = 0;
      grid.querySelectorAll('.day-card').forEach((d) => { if (d.dataset.filled === '1') n++; });
      document.getElementById('fill-count').textContent = `${n} of 24 doors filled`;
    };
    const relabel = () => grid.querySelectorAll('.day-card').forEach((card) => {
      const d = Number(card.dataset.day);
      card.querySelector('header span').textContent = 'Opens ' + U.fmtDate(c.start_year, c.start_month, d, true).replace(/^(\w{3})\w*/, '$1');
    });
    for (let d = 1; d <= 24; d++) {
      const day = data.days[d] || {};
      const card = el(`<article class="day-card" data-day="${d}">
        <header><b>${d}</b><span></span></header>
        <button class="day-photo" type="button" aria-label="Add a photo for day ${d}"><span class="ph-label">${ICON_PHOTO}<span>Add a photo</span></span></button>
        <input type="file" accept="image/*" hidden id="file-${d}">
        <div class="photo-tools" hidden><button type="button" data-act="focus">Adjust position</button><button type="button" data-act="replace">Replace</button><button type="button" data-act="remove">Remove</button></div>
        <label class="field" for="cap-${d}"><span class="hint" style="font-weight:600;color:var(--ink)">Note</span><textarea class="textarea" id="cap-${d}" maxlength="400" placeholder="A memory, a joke, a little message…">${esc(day.caption || '')}</textarea></label>
        <div class="day-foot"><span class="count"></span><span class="st"></span></div>
      </article>`);
      grid.appendChild(card);
      const photoBtn = card.querySelector('.day-photo'), file = card.querySelector('input[type=file]'), tools = card.querySelector('.photo-tools');
      const ta = card.querySelector('textarea'), st2 = card.querySelector('.st'), cnt = card.querySelector('.count');
      let hasPhoto = false, photoURL = null;
      let focus = day.focus || [50, 50];
      const setFilled = () => { card.dataset.filled = hasPhoto || ta.value.trim() ? '1' : '0'; counts(); };
      const showPhoto = (url) => {
        hasPhoto = !!url; photoURL = url || null;
        photoBtn.classList.toggle('has', hasPhoto);
        photoBtn.querySelector('img') && photoBtn.querySelector('img').remove();
        if (url) photoBtn.prepend(el(`<img alt="Photo for day ${d}" src="${esc(url)}" style="object-position:${focus[0]}% ${focus[1]}%">`));
        photoBtn.querySelector('.ph-label').hidden = hasPhoto;
        tools.hidden = !hasPhoto;
        setFilled();
      };
      showPhoto(day.image_url);
      const upload = async (f) => {
        if (!f || !/^image\//.test(f.type)) return U.toast('That file isn’t a photo. Choose a JPG, PNG or HEIC image.', { kind: 'error' });
        const ov = el('<span class="busy">Uploading…</span>'); photoBtn.appendChild(ov);
        try { const blob = await U.compressImage(f); focus = [50, 50]; showPhoto(await api.uploadPhoto(c.id, d, blob)); st2.textContent = 'Saved'; st2.className = 'st saved'; }
        catch (err) { U.toast(err.message || 'That photo couldn’t be uploaded. Try a different one.', { kind: 'error' }); }
        finally { ov.remove(); }
      };
      photoBtn.addEventListener('click', () => file.click());
      tools.querySelector('[data-act="replace"]').addEventListener('click', () => file.click());
      tools.querySelector('[data-act="focus"]').addEventListener('click', () => focusModal(c, d, photoURL, focus, async (f) => {
        focus = f;
        const im = photoBtn.querySelector('img'); if (im) im.style.objectPosition = `${f[0]}% ${f[1]}%`;
        st2.textContent = 'Saving…'; st2.className = 'st';
        try { await api.saveFocus(c.id, d, f[0], f[1]); st2.textContent = 'Saved'; st2.className = 'st saved'; }
        catch (err) { st2.textContent = 'Not saved'; U.toast(err.message, { kind: 'error' }); }
      }));
      tools.querySelector('[data-act="remove"]').addEventListener('click', async () => { await api.removePhoto(c.id, d); showPhoto(null); });
      file.addEventListener('change', () => { upload(file.files[0]); file.value = ''; });
      ['dragenter', 'dragover'].forEach((ev) => photoBtn.addEventListener(ev, (e) => { e.preventDefault(); photoBtn.classList.add('dragover'); }));
      ['dragleave', 'drop'].forEach((ev) => photoBtn.addEventListener(ev, () => photoBtn.classList.remove('dragover')));
      photoBtn.addEventListener('drop', (e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); });
      let t;
      const showCount = () => (cnt.textContent = ta.value.length ? `${ta.value.length}/400` : '');
      showCount();
      ta.addEventListener('input', () => {
        showCount(); setFilled();
        st2.textContent = 'Saving…'; st2.className = 'st';
        clearTimeout(t);
        t = setTimeout(async () => {
          try { await api.saveCaption(c.id, d, ta.value); st2.textContent = 'Saved'; st2.className = 'st saved'; }
          catch (err) { st2.textContent = 'Not saved'; U.toast(err.message, { kind: 'error' }); }
        }, 700);
      });
    }
    relabel(); counts();
  }

  /* ---------------- modals ---------------- */
  function modal(html, wide) {
    const m = el(`<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="paper">${html}</div></div>`);
    document.body.appendChild(m);
    const close = () => { m.remove(); window.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    const f = m.querySelector('input, button'); f && f.focus();
    return { m, close };
  }
  /** Choose which part of a photo shows through its little door (saved as object-position percentages). */
  function focusModal(c, d, url, start, onSave) {
    if (!url) return;
    const des = A.designs[c.design] || A.designs.parlor;
    const L = ((A.layouts && A.layouts[des.layout]) || []).find((l) => l.day === d);
    const a = L ? L.w / L.h : 1; // the door's shape for this day in this design
    const { m, close } = modal(`<h2>Day ${d}: what shows in the door</h2>
      <p style="color:var(--ink-soft)">Drag the bright frame over the part of the photo you want peeking out of door ${d}. The whole photo still shows when the door is opened up big.</p>
      <div class="focus-wrap">
        <div class="focus-stage"><div class="focus-pic"><img alt="Photo for day ${d}" src="${esc(url)}" draggable="false"><div class="focus-frame" tabindex="0" role="slider" aria-label="Photo position"></div></div></div>
        <figure class="focus-preview"><div class="focus-door" style="aspect-ratio:${a.toFixed(4)};width:${Math.round(Math.min(132, 180 * a))}px"><img alt="" src="${esc(url)}"></div><figcaption>How door ${d} will look</figcaption></figure>
      </div>
      <p class="focus-none hint" hidden>This photo is already the same shape as the door, so all of it shows.</p>
      <div class="modal-actions"><button class="btn ghost small" type="button" data-act="center" style="color:#6d0f1d;border-color:#c4a86e">Centre it</button><button class="btn ghost small" type="button" data-close style="color:#6d0f1d;border-color:#c4a86e">Cancel</button><button class="btn small" type="button" data-act="save">Save position</button></div>`);
    const stage = m.querySelector('.focus-pic'), img = stage.querySelector('img'), frame = m.querySelector('.focus-frame');
    const prev = m.querySelector('.focus-door img');
    let f = [start[0], start[1]], g = null; // g: rendered geometry
    const clamp = (v) => Math.max(0, Math.min(100, v));
    const measure = () => {
      const iw = img.clientWidth, ih = img.clientHeight;
      if (!iw || !ih) return null;
      const wide = iw / ih > a; // photo wider than the door: frame slides sideways, else up and down
      const fw = wide ? ih * a : iw, fh = wide ? ih : iw / a;
      return { iw, ih, fw, fh, slackX: iw - fw, slackY: ih - fh };
    };
    const draw = () => {
      g = measure(); if (!g) return;
      Object.assign(frame.style, { width: g.fw + 'px', height: g.fh + 'px', left: (g.slackX * f[0]) / 100 + 'px', top: (g.slackY * f[1]) / 100 + 'px' });
      prev.style.objectPosition = `${f[0]}% ${f[1]}%`;
      frame.setAttribute('aria-valuetext', `${Math.round(g.slackX > 1 ? f[0] : f[1])}%`);
      m.querySelector('.focus-none').hidden = g.slackX > 1 || g.slackY > 1;
    };
    const setFromCentre = (cx, cy) => {
      if (!g) return;
      if (g.slackX > 1) f[0] = clamp(((cx - g.fw / 2) / g.slackX) * 100);
      if (g.slackY > 1) f[1] = clamp(((cy - g.fh / 2) / g.slackY) * 100);
      draw();
    };
    let drag = null;
    stage.addEventListener('pointerdown', (e) => {
      if (!g) return;
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const fl = (g.slackX * f[0]) / 100, ft = (g.slackY * f[1]) / 100;
      const inside = px >= fl && px <= fl + g.fw && py >= ft && py <= ft + g.fh;
      if (!inside) setFromCentre(px, py);
      const fl2 = (g.slackX * f[0]) / 100, ft2 = (g.slackY * f[1]) / 100;
      drag = { dx: px - fl2 - g.fw / 2, dy: py - ft2 - g.fh / 2, r };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('dragging');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      setFromCentre(e.clientX - drag.r.left - drag.dx, e.clientY - drag.r.top - drag.dy);
    });
    const end = () => { drag = null; stage.classList.remove('dragging'); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    frame.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!k) return;
      e.preventDefault();
      f = [clamp(f[0] + k[0]), clamp(f[1] + k[1])];
      draw();
    });
    const ro = new ResizeObserver(draw); ro.observe(stage);
    img.addEventListener('load', draw);
    if (img.complete) draw();
    m.querySelector('[data-act="center"]').addEventListener('click', () => { f = [50, 50]; draw(); });
    m.querySelector('[data-act="save"]').addEventListener('click', () => { ro.disconnect(); close(); onSave([Math.round(f[0]), Math.round(f[1])]); });
    frame.focus();
  }

  function shareModal(c, onChange) {
    const url = shareURL(c.share_token);
    const { m } = modal(`<h2>Share “${esc(c.title)}”</h2>
      <p>Add the email address of each person this calendar is for. Only they can open it, after signing in with that email, and it appears in their account automatically. Each door unlocks on its date in ${U.MONTHS[c.start_month - 1]} ${c.start_year}.</p>
      <form class="invite-add" novalidate>
        <label class="sr" for="invite-input">Email addresses</label>
        <input class="input" id="invite-input" type="text" inputmode="email" autocomplete="off" placeholder="mom@example.com, dad@example.com">
        <button class="btn ink" type="submit">Add</button>
      </form>
      <div class="form-error" id="invite-err" role="alert" hidden></div>
      <ul class="invite-list" id="invite-list" aria-live="polite"><li class="invite-empty">Loading…</li></ul>
      <div class="share-send">
        <p class="share-label">Then send them the link</p>
        <div class="share-row"><input class="input" id="share-url" readonly value="${esc(url)}" aria-label="Calendar link"><button class="btn ink" type="button" data-act="copy">Copy link</button></div>
        <div class="share-actions" id="share-actions"></div>
      </div>
      ${api.mode === 'preview' ? `<p class="form-note" style="margin-top:14px">Preview mode keeps accounts in this browser only. To try the other side here: add an email, sign out, open the link, and sign up with that email.</p>` : ''}
      <div class="modal-actions">${api.mode === 'preview' ? `<button class="btn ghost small" type="button" data-act="try" style="color:#6d0f1d;border-color:#c4a86e">Open the link here</button>` : ''}<button class="btn small" type="button" data-close>Done</button></div>`);
    const list = m.querySelector('#invite-list'), err = m.querySelector('#invite-err'), input = m.querySelector('#invite-input');
    let people = []; // [{ email, emailed_at }]
    const emails = () => people.map((p) => p.email);
    const canSend = api.mode === 'preview' || (cfg.inviteEmails && api.mode === 'live');
    const showErr = (msg) => { err.textContent = msg || ''; err.hidden = !msg; };
    const mailto = (to) => {
      const subject = `${c.from_name || 'Someone'} made you an advent calendar`;
      const body = `I made you a photo advent calendar: "${c.title}". A new door opens each day from ${U.MONTHS[c.start_month - 1]} 1.\n\nOpen it here and sign up with this email address so it's saved to your account:\n${url}`;
      return `mailto:?bcc=${encodeURIComponent(to.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    const when = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const refresh = async () => { people = await api.listInviteStatus(c.id); render(); };
    // Email the invitation to just these people; everyone else on the list is left alone.
    const send = async (to, btn) => {
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…'; showErr('');
      try {
        const r = await api.sendInvites(c.id, to, url);
        const who = to.length === 1 ? to[0] : `${r.count} people`;
        U.toast(r.simulated ? `Preview mode: marked as sent to ${who} (no real email goes out).` : `Invitation sent to ${who}.`);
        await refresh();
      } catch (e2) { showErr(e2.message); btn.disabled = false; btn.textContent = label; }
    };
    const render = () => {
      list.innerHTML = people.length
        ? people.map((p) => `<li>
            <span class="inv-who"><span>${esc(p.email)}</span>${canSend ? `<small class="inv-status ${p.emailed_at ? '' : 'pending'}">${p.emailed_at ? 'Invitation emailed ' + esc(when(p.emailed_at)) : 'Not emailed yet'}</small>` : ''}</span>
            <span class="inv-acts">${canSend
              ? `<button class="linkish" type="button" data-send="${esc(p.email)}" aria-label="${p.emailed_at ? 'Send another invitation to' : 'Send the invitation to'} ${esc(p.email)}">${p.emailed_at ? 'Resend' : 'Send'}</button>`
              : `<a class="linkish" href="${esc(mailto([p.email]))}" target="_blank" rel="noopener">Email</a>`}
              <button class="linkish" type="button" data-remove="${esc(p.email)}" aria-label="Stop sharing with ${esc(p.email)}">Remove</button></span>
          </li>`).join('')
        : '<li class="invite-empty">Not shared with anyone yet.</li>';
      const actions = m.querySelector('#share-actions');
      const unsent = people.filter((p) => !p.emailed_at).map((p) => p.email);
      actions.innerHTML = !people.length ? ''
        : !canSend ? `<a class="btn small" href="${esc(mailto(emails()))}" target="_blank" rel="noopener">Write the email in my mail app</a>`
          : unsent.length ? `<button class="btn small" type="button" data-act="send">Email the invitation to ${unsent.length === 1 ? esc(unsent[0]) : unsent.length + ' new people'}</button>`
            : `<p class="share-note">Everyone here has been emailed. Use Resend to send someone another copy.</p>`;
      const bulk = actions.querySelector('[data-act="send"]');
      if (bulk) bulk.addEventListener('click', () => send(unsent, bulk));
      list.querySelectorAll('[data-send]').forEach((b) => b.addEventListener('click', () => send([b.dataset.send], b)));
      list.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
        try { await api.removeInvite(c.id, b.dataset.remove); await refresh(); if (onChange) onChange(emails()); }
        catch (e2) { showErr(e2.message); }
      }));
    };
    refresh().catch((e2) => showErr(e2.message));
    m.querySelector('.invite-add').addEventListener('submit', async (e) => {
      e.preventDefault();
      const parts = input.value.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!parts.length) return;
      const bad = parts.filter((p) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p));
      if (bad.length) return showErr(`“${bad[0]}” doesn’t look like an email address. Check it and try again.`);
      const mine = api.user() && api.user().email.toLowerCase();
      if (parts.includes(mine)) return showErr('That’s your own email. You can already see this calendar from Preview.');
      showErr('');
      try { await api.addInvites(c.id, parts); input.value = ''; await refresh(); if (onChange) onChange(emails()); }
      catch (e2) { showErr(e2.message); }
    });
    input.focus();
    m.querySelector('[data-act="copy"]').addEventListener('click', async (e) => {
      const ok = await U.copyText(url, m.querySelector('#share-url'));
      e.target.textContent = ok ? 'Copied' : 'Select & copy';
    });
    const tr = m.querySelector('[data-act="try"]');
    if (tr) tr.addEventListener('click', () => { m.remove(); go('share-' + c.share_token); });
  }
  /* ---------------- keepsake download ----------------
     One .html file holding the whole calendar: the design, the doors, the big view, the gallery, and
     every photo and note built in. It opens in any browser straight from the computer, with no
     website or account needed, so it lasts as long as the file does. */
  const blobToDataURL = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  async function fetchText(url) { try { const r = await fetch(url, { cache: 'no-cache' }); return r.ok ? await r.text() : null; } catch (e) { return null; } }
  /** This page's own code and styles, so the keepsake runs exactly what the site runs. */
  async function siteSource() {
    let js = await fetchText('app.js'), css = await fetchText('styles.css');
    if (!js || !/AYY/.test(js)) js = [...document.scripts].filter((s) => !s.src && s.textContent.includes('A.Board')).map((s) => s.textContent).join('\n');
    if (!css || !/\.door/.test(css)) css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    if (!js || !css) throw new Error('The download couldn’t be prepared. Reload the page and try again.');
    return { js, css };
  }
  /** The site's fonts, built in (Latin letters only) so the keepsake looks right offline. */
  async function embeddedFonts() {
    const link = document.querySelector('link[href*="fonts.googleapis.com/css"]');
    if (!link) return '';
    const css = await fetchText(link.href);
    if (!css) return `@import url("${link.href}");`;
    const blocks = css.split(/(?=\/\*\s*[\w-]+\s*\*\/)/).filter((b) => /\/\*\s*latin(-ext)?\s*\*\//.test(b) || !/\/\*/.test(b));
    let out = '';
    for (const b of blocks) {
      let block = b;
      for (const m of [...b.matchAll(/url\((https:[^)]+)\)/g)]) {
        try { const r = await fetch(m[1]); if (r.ok) block = block.replace(m[1], await blobToDataURL(await r.blob())); } catch (e) { /* keep the web address */ }
      }
      out += block;
    }
    return out;
  }
  async function downloadCalendar(id, btn) {
    const label = btn && btn.textContent;
    const say = (t) => { if (btn) btn.textContent = t; };
    if (btn) btn.disabled = true;
    say('Preparing…');
    try {
      const { calendar: c, days } = await api.getCalendar(id);
      const keepDays = {};
      let missing = 0, count = 0;
      for (let d = 1; d <= 24; d++) {
        const day = days[d];
        if (!day) continue;
        let image_url = null;
        if (day.image_url) {
          try { const r = await fetch(day.image_url); if (!r.ok) throw new Error(r.status); image_url = await blobToDataURL(await r.blob()); }
          catch (e) { missing++; }
        }
        if (image_url || day.caption) { keepDays[d] = { caption: day.caption || '', image_url, focus: day.focus || [50, 50] }; count++; }
        say(`Preparing… ${d}/24`);
      }
      say('Packing it up…');
      const [{ js, css }, fonts] = await Promise.all([siteSource(), embeddedFonts().catch(() => '')]);
      const pick = ({ id: cid, title, to_name, from_name, design, start_year, start_month, timezone }) => ({ id: cid, title, to_name, from_name, design, start_year, start_month, timezone });
      const data = { calendar: pick(c), days: keepDays, saved: new Date().toISOString() };
      const title = c.title || 'Advent calendar';
      const safeJSON = JSON.stringify(data).replace(/</g, '\\u003c');
      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<style>${fonts}</style>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script>window.AYY_KEEPSAKE = ${safeJSON};<\/script>
<script>${js.replace(/<\/script/gi, '<\\/script')}<\/script>
</body>
</html>
`;
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'advent-calendar'}-${c.start_year}.html`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      const mb = (blob.size / 1048576).toFixed(1);
      U.toast(missing ? `Saved, but ${missing} photo${missing === 1 ? '' : 's'} couldn’t be fetched. Try again later.`
        : `Saved (${mb} MB). Open the file to see the calendar, no internet needed.${count < 24 ? ` It has the ${count} day${count === 1 ? '' : 's'} you can see so far.` : ''}`);
    } catch (err) {
      U.toast(err.message || 'The download couldn’t be prepared. Try again.', { kind: 'error' });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }
  }

  /** The downloaded keepsake: just the calendar, with doors remembered in this browser. */
  function viewKeepsake(k) {
    const cal = k.calendar, key = 'ayy-keepsake-opened-' + cal.id;
    let opened = new Set();
    try { opened = new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch (e) { /* ignore */ }
    const save = () => { try { localStorage.setItem(key, JSON.stringify([...board.opened])); } catch (e) { /* ignore */ } };
    const extra = `<button class="btn ghost small" type="button" id="reset">Close all doors</button>`;
    const b = calendarPage({ cal, days: k.days, opened, mode: 'live', back: null, backLabel: '', extra, onOpened: save });
    document.getElementById('reset').addEventListener('click', () => { b.setOpened(new Set()); save(); });
  }

  function confirmModal(title, body, action, fn) {
    const { m, close } = modal(`<h2>${esc(title)}</h2><p>${esc(body)}</p><div class="modal-actions"><button class="btn ghost small" type="button" data-close style="color:#6d0f1d;border-color:#c4a86e">Keep it</button><button class="btn small" type="button" data-act="ok">${esc(action)}</button></div>`);
    m.querySelector('[data-act="ok"]').addEventListener('click', async (e) => { e.target.disabled = true; try { await fn(); close(); } catch (err) { U.toast(err.message, { kind: 'error' }); e.target.disabled = false; } });
  }
  function designModal(c, onPick) {
    const { m, close } = modal(`<h2>Choose a design</h2><p style="color:var(--muted)">More designs are on the way.</p><div class="designs">${designTiles(c.design)}</div><div class="modal-actions"><button class="btn ghost small" type="button" data-close>Close</button></div>`, true);
    hydrateThumbs(m);
    m.querySelectorAll('.design-tile.available').forEach((b) => b.addEventListener('click', () => { close(); onPick(b.dataset.design); }));
  }

  /* ---------------- calendar pages ---------------- */
  function statusText(cal, opened, mode) {
    if (mode === 'preview') return '';
    const [ty, tm, td] = U.todayIn(cal.timezone).split('-').map(Number);
    const before = U.daysUntil(cal, 1);
    if (before > 0) return `First door opens ${U.fmtDate(cal.start_year, cal.start_month, 1, true)}`;
    if (ty === cal.start_year && tm === cal.start_month && td <= 24) {
      if (!opened.has(td)) return `Door ${td} is ready to open`;
      return td < 24 ? `Door ${td + 1} opens tomorrow` : 'Merry Christmas! Every door is open';
    }
    const remaining = 24 - [...opened].length;
    return remaining > 0 ? `All doors unlocked · ${remaining} still closed` : 'All 24 doors opened';
  }

  function calendarPage({ cal, days, opened, mode, back, backLabel, extra, onOpened, getImage, sample }) {
    teardown();
    app.innerHTML = `<div class="cal-page">
      <div class="cal-bar">
        ${back ? `<a class="back" href="#${back}">&#8592; ${esc(backLabel)}</a>` : '<span class="back keepsake-mark">Advent Your Year</span>'}
        <div class="who">${esc(cal.title || 'Advent calendar')}<small>${[cal.to_name && 'For ' + esc(cal.to_name), cal.from_name && 'from ' + esc(cal.from_name)].filter(Boolean).join(' · ')}</small></div>
        <div class="status"><button class="btn small" type="button" id="gallery-btn" title="See every opened door in one scroll">Gallery</button>${extra || ''}<span class="pill" id="cal-status"></span></div>
      </div>
      <div class="cal-host" id="cal-host"></div>
    </div>`;
    const status = document.getElementById('cal-status');
    const refreshStatus = () => { const t = statusText(cal, board ? board.opened : opened, mode); status.textContent = t; status.hidden = !t; };
    board = new A.Board(document.getElementById('cal-host'), {
      calendar: cal, days, opened, mode, getImage,
      onOpened: async (d) => { if (onOpened) await onOpened(d); refreshStatus(); },
      onLocked: (d, n, when) => U.toast(`Door ${d} opens ${when}. ${n === 1 ? 'Just one more sleep!' : `${n} sleeps to go.`}`),
    });
    refreshStatus();
    const b0 = board;
    document.getElementById('gallery-btn').addEventListener('click', () => b0.openGallery());
    return board;
  }

  function viewSample(designId) {
    const cal = sampleCalendar();
    if (designId && A.designs[designId]) cal.design = designId;
    let opened = new Set();
    try { opened = new Set(JSON.parse(localStorage.getItem('ayy-sample-opened') || '[]')); } catch (e) { /* ignore */ }
    const save = () => { try { localStorage.setItem('ayy-sample-opened', JSON.stringify([...board.opened])); } catch (e) { /* ignore */ } };
    const picker = `<select class="select design-switch" id="design-switch" aria-label="Design">${CATALOG.filter((d) => d.available).map((d) => `<option value="${d.id}" ${d.id === cal.design ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>`;
    const extra = `${picker}<button class="btn ghost small" type="button" id="all-open">Jump to Christmas Eve</button><button class="btn ghost small" type="button" id="reset">Close all doors</button>`;
    const b = calendarPage({ cal, days: sampleDays(), opened, mode: 'live', back: api.user() ? 'dashboard' : 'home', backLabel: api.user() ? 'My calendars' : 'Home', extra, onOpened: save, getImage: (d) => A.samples.photo(d) });
    document.getElementById('design-switch').addEventListener('change', (e) => go('sample-' + e.target.value));
    let eve = false;
    document.getElementById('all-open').addEventListener('click', (e) => {
      eve = !eve;
      if (eve) {
        b.o.mode = 'preview'; // every door unlocked, as on the 24th
        b.setOpened(new Set(Array.from({ length: 24 }, (_, i) => i + 1)));
        e.target.textContent = 'Back to today';
      } else {
        b.o.mode = 'live';
        let o = new Set(); try { o = new Set(JSON.parse(localStorage.getItem('ayy-sample-opened') || '[]')); } catch (x) { /* ignore */ }
        b.setOpened(o);
        e.target.textContent = 'Jump to Christmas Eve';
      }
      const st = document.getElementById('cal-status');
      st.textContent = eve ? 'Christmas Eve: every door open' : statusText(cal, b.opened, 'live');
    });
    document.getElementById('reset').addEventListener('click', () => {
      try { localStorage.removeItem('ayy-sample-opened'); } catch (x) { /* ignore */ }
      b.setOpened(new Set());
      document.getElementById('cal-status').textContent = statusText(cal, b.opened, 'live');
    });
  }

  async function viewPreview(id) {
    let data;
    try { data = await api.getCalendar(id); } catch (err) { return viewError(err.message); }
    if (data.role !== 'owner') return go('view-' + id);
    const extra = `<span class="pill berry">Preview · every door unlocked</span><button class="btn ghost small" type="button" id="open-all">Open every door</button><button class="btn ghost small" type="button" id="reset">Close all doors</button><button class="btn ghost small" type="button" id="download">Download</button><a class="btn small" href="#edit-${id}">Edit doors</a>`;
    const b = calendarPage({ cal: data.calendar, days: data.days, opened: new Set(), mode: 'preview', back: 'edit-' + id, backLabel: 'Back to editing', extra });
    const dl = document.getElementById('download');
    dl.addEventListener('click', () => downloadCalendar(id, dl));
    document.getElementById('reset').addEventListener('click', () => b.setOpened(new Set()));
    document.getElementById('open-all').addEventListener('click', () => b.setOpened(new Set(Array.from({ length: 24 }, (_, i) => i + 1))));
  }

  async function viewCalendar(id) {
    let data;
    try { data = await api.getCalendar(id); } catch (err) { return viewError(err.message); }
    if (data.role === 'owner') return go('preview-' + id);
    const extra = `<button class="btn ghost small" type="button" id="download" title="Save a copy of this calendar that opens on your computer, no internet needed">Download</button>`;
    calendarPage({ cal: data.calendar, days: data.days, opened: data.opened, mode: 'live', back: 'dashboard', backLabel: 'My calendars', extra, onOpened: (d) => api.markOpened(id, d) });
    const dl = document.getElementById('download');
    dl.addEventListener('click', () => downloadCalendar(id, dl));
  }

  async function viewShare(token) {
    shell(`<div class="wrap"><p style="padding:40px 0;color:var(--muted)">Unwrapping…</p></div>`);
    let info;
    try { info = await api.sharePreview(token); } catch (err) { info = null; }
    if (!info) return viewError('That link doesn’t match a calendar. Ask the person who sent it to share it again.');
    const u = api.user();
    if (u) {
      if (info.owner_id === u.id) return go('preview-' + info.id);
      try { const id = await api.joinByToken(token); U.toast('Saved to your calendars.'); return go('view-' + id); }
      catch (err) { return viewError(err.message); }
    }
    after('share-' + token);
    const from = info.from_name || info.owner_name || 'Someone';
    shell(`<section class="wrap gift">
      <div class="gift-art" id="gift-art"></div>
      <div>
        <p class="eyebrow">a gift for ${esc(info.to_name || 'you')}</p>
        <h1>${esc(from)} made you an advent calendar</h1>
        <p>“${esc(info.title)}” has 24 doors, each with a photo and a note. The first one opens ${U.fmtDate(info.start_year, info.start_month, 1, true)}, ${info.start_year}.</p>
        <p>Create a free account <b>using the email address this link was sent to</b>. The calendar is saved there and will always be waiting when you sign in.</p>
        <div class="hero-cta"><a class="btn gold" href="#signup">Create an account</a><a class="btn ghost" href="#signin">I already have an account</a></div>
      </div></section>`);
    setThumb(document.getElementById('gift-art'), info.design);
  }

  function viewError(msg) {
    shell(`<section class="wrap auth-wrap"><div class="paper auth-card"><h1>Hmm.</h1><p class="sub">${esc(msg)}</p><a class="btn" href="#home">Go to the home page</a></div></section>`);
  }

  /* ---------------- router ---------------- */
  async function route() {
    teardown();
    const h = decodeURIComponent(location.hash.slice(1)) || 'home';
    const u = api.user();
    const needAuth = (fn) => (u ? fn() : (after(h), go('signin')));
    let m;
    if (h === 'home') return u ? viewDashboard() : viewLanding();
    if (h === 'signin') return u ? afterAuth() : viewSignIn();
    if (h === 'signup') return u ? afterAuth() : viewSignUp();
    if (h === 'verify') return viewVerify();
    if (h === 'forgot') return viewForgot();
    if (h === 'sample') return viewSample();
    if ((m = h.match(/^sample-([a-z0-9]+)$/))) return viewSample(m[1]);
    if (h === 'dashboard') return needAuth(viewDashboard);
    if (h === 'new') return needAuth(viewNew);
    if ((m = h.match(/^edit-([\w-]+)$/))) return needAuth(() => viewEditor(m[1]));
    if ((m = h.match(/^preview-([\w-]+)$/))) return needAuth(() => viewPreview(m[1]));
    if ((m = h.match(/^view-([\w-]+)$/))) return needAuth(() => viewCalendar(m[1]));
    if ((m = h.match(/^share-([\w-]+)$/))) return viewShare(m[1]);
    return u ? viewDashboard() : viewLanding();
  }

  /* ---------------- page snow ---------------- */
  function pageSnow() {
    if (U.prefersReducedMotion()) return;
    const c = el('<canvas class="page-snow" aria-hidden="true"></canvas>');
    document.body.prepend(c);
    const ctx = c.getContext('2d');
    let W, H, flakes;
    const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; flakes = Array.from({ length: Math.round((W * H) / 16000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.5 + 0.2, p: Math.random() * 6 })); };
    size(); addEventListener('resize', size);
    const tick = (t) => {
      if (!document.hidden && !document.querySelector('.cal-page')) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (const f of flakes) { f.y += f.v; if (f.y > H) { f.y = -4; f.x = Math.random() * W; } ctx.beginPath(); ctx.arc(f.x + Math.sin(t / 1600 + f.p) * 8, f.y, f.r, 0, 7); ctx.fill(); }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- boot ---------------- */
  (async function boot() {
    if (window.AYY_KEEPSAKE) { document.documentElement.classList.add('keepsake'); return viewKeepsake(window.AYY_KEEPSAKE); }
    await api.init();
    api.onAuth(() => { /* views re-render on next navigation */ });
    window.addEventListener('hashchange', route);
    pageSnow();
    route();
  })();
})();
