/* Design — "Snowman Family"
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

  /* ---------- snow people ---------- */
  const ball = (cx, cy, r) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#snowball)"/><path d="M${f(cx - r * 0.7)} ${f(cy - r * 0.45)} Q${f(cx - r * 0.2)} ${f(cy - r * 0.9)} ${f(cx + r * 0.4)} ${f(cy - r * 0.8)}" stroke="#fff" stroke-width="${f(r * 0.08)}" fill="none" opacity=".8" stroke-linecap="round"/>`;
  function coalSmile(cx, cy, r) {
    let s = '';
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.25 + i * 0.125); s += `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r * 0.75)}" r="${f(r * 0.12)}" fill="#1d1a1a"/>`; }
    return s;
  }
  function face(cx, cy, r, o = {}) {
    let s = `<ellipse cx="${f(cx - r * 0.34)}" cy="${f(cy - r * 0.18)}" rx="${f(r * 0.11)}" ry="${f(r * 0.13)}" fill="#1d1a1a"/><ellipse cx="${f(cx + r * 0.34)}" cy="${f(cy - r * 0.18)}" rx="${f(r * 0.11)}" ry="${f(r * 0.13)}" fill="#1d1a1a"/>`;
    s += `<circle cx="${f(cx - r * 0.37)}" cy="${f(cy - r * 0.23)}" r="${f(r * 0.04)}" fill="#fff"/><circle cx="${f(cx + r * 0.31)}" cy="${f(cy - r * 0.23)}" r="${f(r * 0.04)}" fill="#fff"/>`;
    s += `<circle cx="${f(cx - r * 0.55)}" cy="${f(cy + r * 0.15)}" r="${f(r * 0.16)}" fill="#ff8f9c" opacity=".45"/><circle cx="${f(cx + r * 0.55)}" cy="${f(cy + r * 0.15)}" r="${f(r * 0.16)}" fill="#ff8f9c" opacity=".45"/>`;
    const d = o.noseDir || 1;
    s += `<path d="M${f(cx)} ${f(cy - r * 0.04)} L${f(cx + d * r * (o.longNose ? 0.95 : 0.7))} ${f(cy + r * 0.1)} L${f(cx)} ${f(cy + r * 0.18)}Z" fill="#f07a1a"/><path d="M${f(cx + d * r * 0.2)} ${f(cy + r * 0.02)} l${f(d * r * 0.06)} ${f(r * 0.1)} M${f(cx + d * r * 0.4)} ${f(cy + r * 0.06)} l${f(d * r * 0.05)} ${f(r * 0.08)}" stroke="#b8501a" stroke-width="1.5"/>`;
    s += coalSmile(cx, cy + r * 0.12, r * 0.42);
    return s;
  }
  function scarf(cx, cy, w, c1, c2, tail = 1) {
    return `<path d="M${f(cx - w / 2)} ${f(cy - 6)} Q${f(cx)} ${f(cy + 10)} ${f(cx + w / 2)} ${f(cy - 6)} L${f(cx + w / 2)} ${f(cy + 8)} Q${f(cx)} ${f(cy + 26)} ${f(cx - w / 2)} ${f(cy + 8)}Z" fill="${c1}"/>
      <path d="M${f(cx + tail * w * 0.2)} ${f(cy + 8)} l${f(tail * 8)} ${f(w * 0.55)} l${f(tail * 20)} -4 l${f(-tail * 10)} ${f(-w * 0.5)}Z" fill="${c1}"/>
      <path d="M${f(cx - w / 2 + 6)} ${f(cy + 1)} Q${f(cx)} ${f(cy + 17)} ${f(cx + w / 2 - 6)} ${f(cy + 1)}" stroke="${c2}" stroke-width="4" fill="none" stroke-dasharray="8 8"/>
      <path d="M${f(cx + tail * w * 0.2 + tail * 6)} ${f(cy + w * 0.45)} l${f(tail * 22)} -3" stroke="${c2}" stroke-width="4"/>`;
  }
  function arm(x, y, dx, dy, mitten) {
    const ex = x + dx, ey = y + dy;
    let s = `<path d="M${x} ${y} L${ex} ${ey} M${f(x + dx * 0.6)} ${f(y + dy * 0.6)} l${f(dx * 0.25)} ${f(-Math.abs(dy) * 0.35 - 10)} M${f(x + dx * 0.8)} ${f(y + dy * 0.8)} l${f(dx * 0.2)} ${f(8)}" stroke="#5a3a22" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if (mitten) s += `<ellipse cx="${ex}" cy="${ey}" rx="11" ry="13" fill="${mitten}"/><ellipse cx="${ex + (dx > 0 ? -8 : 8)}" cy="${ey + 2}" rx="5" ry="7" fill="${mitten}"/><rect x="${ex - 11}" y="${ey + 8}" width="22" height="6" rx="3" fill="#fbf7f0"/>`;
    return s;
  }

  function build() {
    const R = A.util.rng(1225);
    const K = makeKit(R);
    const { rr } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a5a"/><stop offset=".5" stop-color="#4a5a9a"/><stop offset=".8" stop-color="#b48ab8"/><stop offset="1" stop-color="#f0b8a8"/></linearGradient>
      <radialGradient id="snowball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eef3fb"/><stop offset="1" stop-color="#b9c8e0"/></radialGradient>
      <linearGradient id="snowA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9ff"/><stop offset="1" stop-color="#d4e0f2"/></linearGradient>
      <linearGradient id="clap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9b28e"/><stop offset="1" stop-color="#a88e68"/></linearGradient>
      <pattern id="siding" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="40" height="22" fill="none"/><rect y="19" width="40" height="3" fill="#6b5236" opacity=".45"/></pattern>
      <radialGradient id="win" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#ffe9b0"/><stop offset=".7" stop-color="#f2a85a"/><stop offset="1" stop-color="#b8682a"/></radialGradient>
      <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3a5a"/><stop offset="1" stop-color="#2a2236"/></linearGradient>
      <pattern id="plaidR" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#c4222f"/><rect y="8" width="24" height="5" fill="#1b2a1e" opacity=".7"/><rect x="8" width="5" height="24" fill="#1b2a1e" opacity=".5"/></pattern>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0a22" stop-opacity=".5"/></radialGradient>
      <radialGradient id="porchGlow" cx="760" cy="560" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf80" stop-opacity=".35"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>
    </defs>`);

    /* dusk sky + hills */
    add(`<rect width="1600" height="1000" fill="url(#sky)"/>`);
    add(K.stars(0, 0, 1600, 300, 120));
    add(`<circle cx="1360" cy="110" r="34" fill="#fff6e0" opacity=".95"/><circle cx="1372" cy="102" r="30" fill="#33427a"/>`);
    add(`<path d="M0 520 Q240 450 520 500 Q820 556 1100 480 Q1360 420 1600 470 V700 H0Z" fill="#9aaed6"/>`);
    for (let x = -20; x < 1620; x += rr(18, 30)) add(K.pineTree(x, 540 + Math.sin(x / 120) * 26 + rr(-8, 8), rr(50, 90), '#3a4a7a', '#e6eeff'));

    /* the house */
    add(`<rect x="546" y="200" width="52" height="110" fill="#7a3a2a"/><path d="M546 214 h52 M546 236 h52 M546 258 h52 M570 200 v14 M560 214 v22 M584 236 v22" stroke="#5a2a1e" stroke-width="2"/><rect x="538" y="190" width="68" height="14" fill="#5a2a1e"/><path d="M538 192 q34 -16 68 0Z" fill="#fff"/>`);
    add(`<g filter="url(#shadow)"><rect x="440" y="330" width="640" height="320" fill="url(#clap)"/><rect x="440" y="330" width="640" height="320" fill="url(#siding)"/></g>`);
    add(`<path d="M400 344 L760 160 L1120 344Z" fill="url(#roof)"/><path d="M390 350 L760 150 L1130 350 L1110 356 L760 176 L410 356Z" fill="#fff"/><path d="M392 348 Q560 270 760 152 Q960 270 1128 348 Q1100 330 1060 334 Q900 240 760 186 Q620 240 460 334 Q420 330 392 348Z" fill="#f7fbff"/>`);
    // gable round window
    add(`<circle cx="760" cy="266" r="48" fill="#efe4cd"/><circle cx="760" cy="266" r="38" fill="url(#win)"/><path d="M722 266 h76 M760 228 v76" stroke="#efe4cd" stroke-width="6"/>`);
    // windows
    const win = (x, y) => `<rect x="${x - 6}" y="${y - 6}" width="112" height="132" fill="#efe4cd"/><rect x="${x}" y="${y}" width="100" height="120" fill="url(#win)"/><path d="M${x + 50} ${y} v120 M${x} ${y + 60} h100" stroke="#efe4cd" stroke-width="6"/><rect x="${x - 14}" y="${y + 120}" width="128" height="14" fill="#efe4cd"/><path d="M${x - 14} ${y + 120} q64 -14 128 0Z" fill="#fff"/>`;
    [[490, 420], [930, 420]].forEach(([x, y], i) => {
      add(win(x, y));
      K.lamp(x + 50, y + 60, '#ffd27a', 10);
      let w = '';
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; w += K.pine(x + 50 + Math.cos(a) * 22, y + 50 + Math.sin(a) * 22, 7); }
      add(w + K.bow(x + 50, y + 74, 0.45));
    });
    // front door + porch light
    add(`<rect x="700" y="470" width="120" height="180" fill="#efe4cd"/><rect x="712" y="482" width="96" height="168" fill="#1d6b43"/><circle cx="796" cy="566" r="5" fill="url(#gold)"/><rect x="726" y="496" width="68" height="40" fill="url(#win)"/>`);
    add(`<rect x="660" y="650" width="200" height="16" fill="#9a8a78"/><rect x="680" y="666" width="160" height="14" fill="#8a7a68"/>`);
    let dw = '';
    for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; dw += K.pine(760 + Math.cos(a) * 26, 560 + Math.sin(a) * 26, 8); }
    add(dw + K.berries(760, 534) + K.berries(740, 584) + K.berries(782, 580) + K.bow(760, 588, 0.5));
    add(`<rect width="1600" height="1000" fill="url(#porchGlow)"/>`);
    // roof lights + garland over the door
    add(K.lightString(410, 352, 585, 300, 760, 174, 14, 5) + K.lightString(760, 174, 935, 300, 1110, 352, 14, 5, K.BULB, 3));
    add(K.lightString(440, 336, 760, 346, 1080, 336, 26, 4.2, K.BULB, 5));
    add(K.swag(690, 474, 760, 492, 830, 474, { n: 10, r: 9, berries: true }));

    /* yard: picket fence, big pines, snow */
    add(`<path d="M0 640 Q400 610 800 650 Q1200 690 1600 630 V1000 H0Z" fill="url(#snowA)"/>`);
    for (let x = 0; x < 1600; x += 28) {
      if (x > 640 && x < 880) continue;
      const y = 700 + Math.sin(x / 260) * 8;
      add(`<path d="M${x} ${y} v-62 l10 -12 l10 12 v62Z" fill="#f3ead6"/><path d="M${x} ${y - 62} l10 -12 l10 12Z" fill="#fff"/>`);
    }
    add(`<path d="M0 668 Q400 652 640 670 M880 676 Q1200 690 1600 660" stroke="#e2d6bc" stroke-width="8" fill="none"/><path d="M0 690 Q400 674 640 692 M880 698 Q1200 712 1600 682" stroke="#e2d6bc" stroke-width="8" fill="none"/>`);
    add(K.swag(0, 650, 320, 690, 640, 662, { n: 24, r: 9, lights: true, every: 2, berries: true }) + K.swag(880, 670, 1240, 712, 1600, 650, { n: 26, r: 9, lights: true, every: 2, berries: true, off: 3 }));
    // red mittens drying on a fence post
    add(`<g transform="translate(150 640)"><ellipse cx="0" cy="0" rx="10" ry="13" fill="#c4222f"/><ellipse cx="-8" cy="2" rx="5" ry="7" fill="#c4222f"/><rect x="-10" y="9" width="20" height="5" fill="#fbf7f0"/></g><g transform="translate(176 644)"><ellipse cx="0" cy="0" rx="10" ry="13" fill="#c4222f"/><ellipse cx="8" cy="2" rx="5" ry="7" fill="#c4222f"/><rect x="-10" y="9" width="20" height="5" fill="#fbf7f0"/></g>`);
    // big decorated pines on both sides
    add(K.tree(170, 250, 700, 150, { ornaments: 0, lights: 46, canes: 0, beads: false, snow: true, star: false }));
    add(K.tree(1420, 230, 690, 160, { ornaments: 14, lights: 50, canes: 0, beads: false, snow: true }));
    add(`<path d="M0 820 Q300 780 640 806 Q1000 840 1300 800 Q1460 780 1600 800 V1000 H0Z" fill="#fff"/>`);
    for (let i = 0; i < 120; i++) add(`<circle cx="${f(rr(0, 1600))}" cy="${f(rr(700, 1000))}" r="${f(rr(0.8, 2.2))}" fill="#fff" opacity="${f(rr(0.6, 1))}"/>`);
    // shoveled path to the door
    add(`<path d="M700 680 L820 680 L900 1000 L620 1000Z" fill="#c9d6ea" opacity=".6"/><path d="M700 680 Q690 690 680 700 L600 1000 M820 680 L920 1000" stroke="#fff" stroke-width="10" fill="none"/>`);
    // snow angel + snowball pile
    add(`<g transform="translate(220 950) scale(.8)" opacity=".45"><ellipse cx="0" cy="0" rx="28" ry="40" fill="#c9d6ea"/><ellipse cx="0" cy="-52" rx="18" ry="16" fill="#c9d6ea"/><path d="M-20 -24 Q-70 -50 -60 -10 Q-50 10 -24 0Z M20 -24 Q70 -50 60 -10 Q50 10 24 0Z" fill="#c9d6ea"/></g>`);
    [[360, 960, 18], [384, 962, 18], [372, 942, 17], [398, 944, 15], [386, 926, 14]].forEach(([x, y, r]) => add(ball(x, y, r)));

    /* the snow family */
    // Dad: tall, top hat, plaid scarf, broom
    add(`<ellipse cx="520" cy="860" rx="100" ry="18" fill="#a9bad6" opacity=".7"/>`);
    add(`<path d="M610 600 L560 860" stroke="#8a5a30" stroke-width="7"/><path d="M594 594 l-12 -40 M606 596 l0 -44 M618 598 l10 -40 M600 594 l-6 -42 M612 596 l4 -44" stroke="#d9b45a" stroke-width="5" stroke-linecap="round"/><rect x="590" y="590" width="34" height="10" rx="3" fill="#c4222f" transform="rotate(12 607 595)"/>`);
    add(ball(520, 790, 82) + ball(520, 664, 62) + ball(520, 560, 48));
    add(`<circle cx="520" cy="640" r="7" fill="#1d1a1a"/><circle cx="520" cy="668" r="7" fill="#1d1a1a"/><circle cx="520" cy="696" r="7" fill="#1d1a1a"/>`);
    add(arm(468, 660, -80, -40, '#2a5aa8') + arm(572, 660, 40, -50, '#2a5aa8'));
    add(scarf(520, 602, 92, 'url(#plaidR)', '#f0c64a'));
    add(face(520, 556, 48, {}));
    add(`<rect x="470" y="512" width="100" height="12" rx="6" fill="#1b1b22"/><rect x="484" y="448" width="72" height="70" rx="6" fill="#1b1b22"/><rect x="484" y="500" width="72" height="12" fill="#c4222f"/>${K.berries(552, 504)}<path d="M538 500 q8 -10 18 -4 q-6 8 -18 4Z" fill="#2c6b40"/>`);
    // Mum: earmuffs, pink scarf, flower
    add(`<ellipse cx="760" cy="870" rx="90" ry="16" fill="#a9bad6" opacity=".7"/>`);
    add(ball(760, 806, 72) + ball(760, 696, 54) + ball(760, 604, 43));
    add(`<circle cx="760" cy="680" r="6" fill="#c4222f"/><circle cx="760" cy="704" r="6" fill="#c4222f"/><circle cx="760" cy="728" r="6" fill="#c4222f"/>`);
    add(arm(712, 690, -50, 30, '#e86a9a') + arm(808, 690, 70, -30, '#e86a9a'));
    add(scarf(760, 642, 84, '#e86a9a', '#fff', -1));
    add(face(760, 600, 43, { noseDir: -1 }));
    add(`<path d="M722 584 Q760 530 798 584" stroke="#7a2a5a" stroke-width="7" fill="none"/><circle cx="720" cy="594" r="15" fill="#f6d0e0"/><circle cx="800" cy="594" r="15" fill="#f6d0e0"/><circle cx="720" cy="594" r="15" fill="none" stroke="#e86a9a" stroke-width="3"/><circle cx="800" cy="594" r="15" fill="none" stroke="#e86a9a" stroke-width="3"/>`);
    add(`<g transform="translate(790 566)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-9" rx="6" ry="10" fill="#f0c64a" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#c4222f"/></g>`);
    // Kid: beanie with pompom, waving
    add(`<ellipse cx="985" cy="870" rx="70" ry="13" fill="#a9bad6" opacity=".7"/>`);
    add(ball(985, 820, 56) + ball(985, 732, 40));
    add(`<circle cx="985" cy="806" r="5" fill="#1d1a1a"/><circle cx="985" cy="826" r="5" fill="#1d1a1a"/>`);
    add(ball(985, 664, 34));
    add(arm(950, 760, -50, 10, '#1d6b43') + arm(1020, 752, 34, -70, '#1d6b43'));
    add(scarf(985, 696, 66, '#1d6b43', '#f0c64a'));
    add(face(985, 662, 34, {}));
    add(`<path d="M953 650 Q952 612 985 608 Q1018 612 1017 650Z" fill="#2a5aa8"/><rect x="950" y="642" width="70" height="12" rx="5" fill="#f0c64a"/><path d="M960 612 v30 M972 608 v34 M985 606 v36 M998 608 v34 M1010 612 v30" stroke="#1f4a8a" stroke-width="2"/><circle cx="985" cy="604" r="12" fill="#f0c64a"/>`);
    // Baby on the sled
    add(`<g filter="url(#shadow)"><path d="M1076 900 Q1060 900 1062 884 M1062 884 Q1070 906 1100 906 H1240 Q1268 906 1264 882" stroke="#5a3a22" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="1080" y="868" width="176" height="20" rx="5" fill="#b3172b"/><path d="M1084 872 h168 M1084 882 h168" stroke="#8a1422" stroke-width="2"/><path d="M1078 876 Q1030 880 1010 910 Q990 940 1040 950" stroke="#d9b48a" stroke-width="3" fill="none"/></g>`);
    add(ball(1170, 838, 36) + ball(1170, 786, 26));
    add(face(1170, 784, 26, { }));
    add(`<path d="M1145 780 Q1144 748 1170 746 Q1196 748 1195 780 Q1170 770 1145 780Z" fill="#f6d0e0"/><circle cx="1170" cy="744" r="7" fill="#fff"/><path d="M1146 778 q-4 14 -2 20 M1194 778 q4 14 2 20" stroke="#f6d0e0" stroke-width="4"/>`);
    add(`<path d="M1140 808 Q1170 826 1200 808 L1200 818 Q1170 836 1140 818Z" fill="#6cc8ff"/>`);
    // Snow dog
    add(`<ellipse cx="1340" cy="880" rx="80" ry="14" fill="#a9bad6" opacity=".7"/>`);
    add(`<path d="M1392 840 Q1430 810 1418 780" stroke="#5a3a22" stroke-width="6" fill="none" stroke-linecap="round"/>`);
    add(`<ellipse cx="1340" cy="836" rx="64" ry="42" fill="url(#snowball)"/>`);
    add(ball(1300, 868, 16) + ball(1330, 872, 16));
    add(ball(1290, 774, 38));
    add(`<ellipse cx="1262" cy="790" rx="14" ry="26" fill="#e3ebf7" transform="rotate(18 1262 790)"/><ellipse cx="1318" cy="790" rx="14" ry="26" fill="#e3ebf7" transform="rotate(-18 1318 790)"/>`);
    add(`<ellipse cx="1290" cy="790" rx="18" ry="13" fill="#f6f9ff"/><ellipse cx="1290" cy="784" rx="7" ry="5" fill="#1d1a1a"/><circle cx="1276" cy="766" r="4.5" fill="#1d1a1a"/><circle cx="1304" cy="766" r="4.5" fill="#1d1a1a"/><path d="M1282 796 q8 6 16 0" stroke="#1d1a1a" stroke-width="2" fill="none"/>`);
    add(`<path d="M1258 810 Q1290 826 1322 810 L1322 820 Q1290 838 1258 820Z" fill="#c4222f"/><circle cx="1290" cy="826" r="5" fill="url(#gold)"/>`);

    /* banner */
    add(K.ribbonBanner(800, 40, 300, { arch: 36, fill: 'url(#ribbon)' }));
    add(`<rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  A.designs.snowman = {
    id: 'snowman',
    name: 'Snowman Family',
    blurb: 'A whole snow family in scarves and button eyes, with the house lit up behind them.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M540 84 Q800 40 1060 84', size: 40, maxWidth: 470 },
    effects: [
      { type: 'smoke', x: 572, y: 186, rate: 1.6, rise: 14, size: 12, color: '235,238,248', a: 0.4 },
      { type: 'glow', x: 760, y: 560, r: 260, color: '255,200,120', a: 0.18, speed: 1.2 },
      { type: 'twinkle' },
      { type: 'star', x: 1420, y: 226, r: 60 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 140, a: 0.85 },
    ],
    layout: 'snowman',
    keepOut: [[420, 14, 760, 140], [524, 110, 100, 180], [460, 440, 130, 120], [710, 552, 100, 90]],
    day24: { x: 675, y: 202, w: 170, h: 150 },
  };
})();
