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
