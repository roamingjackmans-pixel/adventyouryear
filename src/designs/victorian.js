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
