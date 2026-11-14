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
