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
