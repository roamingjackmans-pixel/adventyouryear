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
