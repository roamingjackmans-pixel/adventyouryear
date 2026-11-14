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
