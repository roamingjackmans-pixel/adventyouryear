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
