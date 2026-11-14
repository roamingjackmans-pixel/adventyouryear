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
