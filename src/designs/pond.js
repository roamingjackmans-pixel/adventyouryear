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
