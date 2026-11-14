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
