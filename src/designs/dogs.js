/* Design — "Pups & Presents"
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

  /* ---------- dogs ---------- */
  // p: { body, dark, chest, muzzle, ear:'flop'|'up'|'long', mask, eyeBrow, tongue }
  function dogHead(p, o = {}) {
    let s = '';
    if (p.ear === 'up') s += `<path d="M-30 -10 L-40 -56 L-6 -24Z M30 -10 L40 -56 L6 -24Z" fill="${p.earColor || p.body}"/><path d="M-28 -18 L-34 -46 L-14 -26Z M28 -18 L34 -46 L14 -26Z" fill="#f2b8a8"/>`;
    s += `<ellipse cx="0" cy="0" rx="35" ry="31" fill="${p.body}"/>`;
    if (p.blaze) s += `<path d="M-6 -30 Q0 -34 6 -30 L10 6 H-10Z" fill="${p.blaze}"/>`;
    if (p.wrinkle) s += `<path d="M-14 -18 q14 -8 28 0 M-10 -10 q10 -5 20 0" stroke="${p.dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="0" cy="13" rx="${p.ear === 'up' ? 17 : 19}" ry="14" fill="${p.mask || p.muzzle}"/>`;
    s += `<ellipse cx="0" cy="6" rx="7.5" ry="5.5" fill="#1d1614"/><ellipse cx="-2" cy="4.5" rx="2.4" ry="1.4" fill="#fff" opacity=".6"/>`;
    s += `<path d="M0 11 v6 M0 17 q-6 6 -11 1 M0 17 q6 6 11 1" stroke="#1d1614" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (o.tongue) s += `<path d="M-6 21 q6 16 12 0Z" fill="#e86a7a"/><path d="M0 22 v7" stroke="#c44a5a" stroke-width="1.2"/>`;
    s += `<circle cx="-14" cy="-8" r="6" fill="#241612"/><circle cx="14" cy="-8" r="6" fill="#241612"/><circle cx="-16" cy="-10" r="2.2" fill="#fff"/><circle cx="12" cy="-10" r="2.2" fill="#fff"/>`;
    if (p.brow) s += `<ellipse cx="-14" cy="-19" rx="5" ry="3" fill="${p.brow}"/><ellipse cx="14" cy="-19" rx="5" ry="3" fill="${p.brow}"/>`;
    s += `<circle cx="-22" cy="8" r="6" fill="#ff8f9c" opacity=".25"/><circle cx="22" cy="8" r="6" fill="#ff8f9c" opacity=".25"/>`;
    if (p.ear === 'flop') s += `<path d="M-28 -24 Q-50 -20 -46 14 Q-40 22 -30 12 Q-26 -6 -22 -18Z M28 -24 Q50 -20 46 14 Q40 22 30 12 Q26 -6 22 -18Z" fill="${p.earColor || p.dark}"/>`;
    if (p.ear === 'long') s += `<path d="M-26 -26 Q-52 -24 -48 30 Q-40 40 -30 30 Q-24 0 -20 -20Z M26 -26 Q52 -24 48 30 Q40 40 30 30 Q24 0 20 -20Z" fill="${p.earColor || p.dark}"/>`;
    if (p.ear === 'fold') s += `<path d="M-26 -26 Q-42 -30 -40 -10 Q-34 -6 -24 -16Z M26 -26 Q42 -30 40 -10 Q34 -6 24 -16Z" fill="${p.earColor || p.dark}"/>`;
    if (o.antlers) s += `<path d="M-30 -24 Q-36 -50 -26 -64 M-34 -44 l-14 -8 M-29 -56 l10 -10 M30 -24 Q36 -50 26 -64 M34 -44 l14 -8 M29 -56 l-10 -10" stroke="#8a5a30" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-32 -26 Q0 -40 32 -26" stroke="#c4222f" stroke-width="5" fill="none"/><circle cx="0" cy="-34" r="5" fill="#c4222f"/>`;
    if (o.hat) s += `<path d="M-30 -22 Q-8 -82 34 -60 Q40 -44 30 -22Z" fill="#c4222f"/><rect x="-36" y="-30" width="70" height="14" rx="7" fill="#fbf7f0"/><circle cx="38" cy="-60" r="9" fill="#fbf7f0"/>`;
    return s;
  }
  function dogSit(x, y, sc, p, o = {}) {
    let s = `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="2" rx="52" ry="10" fill="#000" opacity=".3"/>`;
    if (!o.noTail) s += p.curl ? `<path d="M34 -30 q26 -6 18 -22 q-8 -10 -16 0 q-4 8 6 8" stroke="${p.body}" stroke-width="9" fill="none" stroke-linecap="round"/>` : `<path d="M34 -8 Q66 -14 70 -46" stroke="${p.body}" stroke-width="11" fill="none" stroke-linecap="round"/>${p.tailTip ? `<circle cx="70" cy="-46" r="6" fill="${p.tailTip}"/>` : ''}`;
    s += `<path d="M-42 0 Q-50 -62 -24 -88 L24 -88 Q50 -62 42 0Z" fill="${p.body}"/>`;
    if (p.saddle) s += `<path d="M-40 -10 Q-48 -58 -20 -76 Q-4 -50 -30 -4Z M40 -10 Q48 -58 20 -76 Q4 -50 30 -4Z" fill="${p.saddle}"/>`;
    s += `<ellipse cx="0" cy="-40" rx="18" ry="34" fill="${p.chest}"/>`;
    s += `<rect x="-24" y="-46" width="16" height="44" rx="8" fill="${p.leg || p.body}"/><rect x="8" y="-46" width="16" height="44" rx="8" fill="${p.leg || p.body}"/>`;
    s += `<ellipse cx="-16" cy="-3" rx="12" ry="7" fill="${p.paw || p.chest}"/><ellipse cx="16" cy="-3" rx="12" ry="7" fill="${p.paw || p.chest}"/>`;
    if (o.scarf) s += `<path d="M-28 -86 Q0 -72 28 -86 L30 -76 Q0 -60 -30 -76Z" fill="${o.scarf}"/><path d="M14 -74 l8 36 l12 -4 l-8 -32Z" fill="${o.scarf}"/><path d="M-26 -80 Q0 -68 26 -80" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 5" fill="none" opacity=".7"/>`;
    if (o.collar) s += `<path d="M-26 -84 Q0 -72 26 -84" stroke="${o.collar}" stroke-width="7" fill="none"/><circle cx="0" cy="-74" r="6" fill="url(#gold)"/>`;
    s += `<g transform="translate(0 -114)">${dogHead(p, o)}</g>`;
    return s + '</g>';
  }
  function dachshund(x, y, sc) {
    const b = '#8a4a22', d = '#5a2c12';
    return `<g transform="translate(${x} ${y}) scale(${sc})">
      <ellipse cx="0" cy="4" rx="96" ry="10" fill="#000" opacity=".3"/>
      <path d="M-84 -36 Q-110 -40 -116 -60" stroke="${b}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <rect x="-70" y="-26" width="15" height="30" rx="7" fill="${d}"/><rect x="40" y="-26" width="15" height="30" rx="7" fill="${d}"/>
      <rect x="-90" y="-62" width="160" height="46" rx="23" fill="${b}"/>
      <path d="M-60 -62 h100 a8 8 0 0 1 0 0 v46 h-100Z" fill="#c4222f"/>
      <path d="M-60 -50 h100 M-60 -28 h100" stroke="#fbf7f0" stroke-width="6"/>
      <path d="M-60 -39 h100" stroke="#1d6b43" stroke-width="5" stroke-dasharray="8 6"/>
      <rect x="-56" y="-26" width="15" height="30" rx="7" fill="${b}"/><rect x="54" y="-26" width="15" height="30" rx="7" fill="${b}"/>
      <ellipse cx="-48" cy="2" rx="11" ry="5" fill="${d}"/><ellipse cx="62" cy="2" rx="11" ry="5" fill="${d}"/>
      <path d="M60 -56 Q76 -96 104 -92 Q128 -90 136 -70 Q150 -66 148 -56 Q140 -46 118 -50 Q90 -50 74 -40Z" fill="${b}"/>
      <ellipse cx="148" cy="-60" rx="7" ry="5" fill="#1d1614"/>
      <circle cx="112" cy="-78" r="5.5" fill="#241612"/><circle cx="110" cy="-80" r="2" fill="#fff"/>
      <path d="M92 -90 Q76 -86 78 -50 Q86 -42 96 -54 Q98 -76 100 -86Z" fill="${d}"/>
      <path d="M140 -52 q-6 6 -14 4" stroke="#1d1614" stroke-width="2" fill="none"/>
      <path d="M96 -90 Q90 -116 100 -126 M92 -108 l-12 -6 M110 -88 Q118 -114 130 -120 M116 -104 l12 -4" stroke="#8a5a30" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M90 -92 Q108 -100 124 -88" stroke="#c4222f" stroke-width="4" fill="none"/>
    </g>`;
  }
  function boneOrn(x, y, s = 1, c = '#f6efe2') {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -22 v-10" stroke="#c9a24a" stroke-width="1.5"/><path d="M-18 -6 a7 7 0 1 1 6 -10 h24 a7 7 0 1 1 6 10 a7 7 0 1 1 -6 10 h-24 a7 7 0 1 1 -6 -10Z" fill="${c}" stroke="#b89a6a" stroke-width="1.5"/><path d="M-10 -10 h20" stroke="#fff" stroke-width="2" opacity=".7"/></g>`;
  }
  function torn(x, y, w, h, fill, rot = 0) {
    let d = `M0 0 L${w} 0`;
    for (let i = 0; i <= 6; i++) d += ` L${w - (i % 2 ? 6 : 0)} ${(h / 6) * i}`;
    d += ` L0 ${h}`;
    for (let i = 6; i >= 0; i--) d += ` L${i % 2 ? 7 : 0} ${(h / 6) * i}`;
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${d}Z" fill="${fill}"/><path d="M4 4 L${w - 6} 6" stroke="#fff" stroke-width="2" opacity=".3"/></g>`;
  }
  function curl(x, y, c, n = 4, r = 10) {
    let d = `M${x} ${y}`;
    for (let i = 0; i < n; i++) d += ` q${r} ${-r * 0.8} ${r * 1.6} 0 q${-r * 0.6} ${r * 0.8} ${r * 0.2} ${r * 0.9}`;
    return `<path d="${d}" stroke="${c}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  }

  function build() {
    const R = A.util.rng(2512);
    const K = makeKit(R);
    const { rr, pick } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="siding" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5a4c"/><stop offset="1" stop-color="#58786a"/></linearGradient>
      <pattern id="boards" width="40" height="34" patternUnits="userSpaceOnUse"><rect width="40" height="34" fill="none"/><rect y="30" width="40" height="4" fill="#1e3329" opacity=".55"/><rect y="0" width="40" height="2" fill="#a9c4b4" opacity=".18"/></pattern>
      <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1840"/><stop offset="1" stop-color="#3b3a7a"/></linearGradient>
      <linearGradient id="porch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a32"/><stop offset="1" stop-color="#8a6242"/></linearGradient>
      <linearGradient id="snowG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4ff"/><stop offset="1" stop-color="#c9d8ee"/></linearGradient>
      <linearGradient id="doorG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a1424"/><stop offset=".5" stop-color="#a3182b"/><stop offset="1" stop-color="#6a1020"/></linearGradient>
      <radialGradient id="winGlow" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".7" stop-color="#f0a650"/><stop offset="1" stop-color="#b8622a"/></radialGradient>
      <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a06a3a"/><stop offset="1" stop-color="#6b4220"/></linearGradient>
      <pattern id="bonePaper" width="40" height="30" patternUnits="userSpaceOnUse"><rect width="40" height="30" fill="#2a5aa8"/><path d="M10 15 a3 3 0 1 1 3 -4 h12 a3 3 0 1 1 3 4 a3 3 0 1 1 -3 4 h-12 a3 3 0 1 1 -3 -4Z" fill="#f6efe2"/></pattern>
      <pattern id="pawPaper" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="#1d6b43"/><g fill="#f0d07a"><circle cx="17" cy="20" r="5"/><circle cx="10" cy="12" r="2.4"/><circle cx="15" cy="9" r="2.4"/><circle cx="20" cy="9" r="2.4"/><circle cx="25" cy="12" r="2.4"/></g></pattern>
      <pattern id="stripePaper" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#f4ede0"/><rect width="7" height="16" fill="#c4222f"/></pattern>
      <pattern id="dotPaper" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e0b24a"/><circle cx="8" cy="8" r="2.6" fill="#b3172b"/></pattern>
      <pattern id="plaid" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#a3172a"/><rect y="12" width="36" height="8" fill="#1b2a1e" opacity=".7"/><rect x="12" width="8" height="36" fill="#1b2a1e" opacity=".5"/></pattern>
      <radialGradient id="porchLight" cx="800" cy="420" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc56b" stop-opacity=".22"/><stop offset="1" stop-color="#ffc56b" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#060714" stop-opacity=".6"/></radialGradient>
    </defs>`);

    /* house front */
    add(`<rect width="1600" height="740" fill="url(#siding)"/><rect width="1600" height="740" fill="url(#boards)"/>`);
    // porch ceiling + beam
    add(`<rect width="1600" height="96" fill="#2a1d14"/><rect y="88" width="1600" height="16" fill="#e9e0cf"/><rect y="102" width="1600" height="5" fill="#9c8f78"/>`);
    for (let x = 0; x < 1600; x += 60) add(`<rect x="${x}" y="0" width="3" height="88" fill="#140d08" opacity=".7"/>`);
    // icicle lights + hanging bone ornaments along the beam
    for (let x = 12; x < 1600; x += 22) { const h = 6 + ((x * 7) % 5) * 3; add(`<path d="M${x} 106 v${h}" stroke="#2a2a2a" stroke-width="1.2"/>`); add(K.bulb(x, 110 + h, (x / 22) % 3 < 1 ? '#bfe3ff' : '#fff6d8', 3.2)); }
    [180, 1420].forEach((x, i) => add(boneOrn(x, 160, 1.1, i ? '#f0d07a' : '#f6efe2')));

    // windows
    const win = (x) => {
      let s = `<rect x="${x - 34}" y="236" width="30" height="320" fill="#1f3a2c"/><rect x="${x + 244}" y="236" width="30" height="320" fill="#1f3a2c"/>`;
      for (let i = 0; i < 9; i++) s += `<rect x="${x - 30}" y="${248 + i * 34}" width="22" height="4" fill="#0f2318"/><rect x="${x + 248}" y="${248 + i * 34}" width="22" height="4" fill="#0f2318"/>`;
      s += `<rect x="${x - 6}" y="230" width="250" height="330" fill="#f1e7d2"/><rect x="${x + 8}" y="244" width="222" height="302" fill="url(#winGlow)"/>`;
      return s;
    };
    add(win(220));
    add(win(1140));
    // inside left window: a lit tree silhouette
    add(`<g opacity=".9">${K.tree(330, 300, 548, 80, { ornaments: 10, lights: 26, canes: 0, beads: false, fill: '#2a3a20' })}</g>`);
    // inside right window: a fireplace glow and stockings
    add(`<rect x="1170" y="430" width="160" height="116" fill="#7a3a22"/><rect x="1200" y="470" width="100" height="76" fill="#2a0e06"/><ellipse cx="1250" cy="530" rx="44" ry="22" fill="#ff9a3a" opacity=".85"/><rect x="1160" y="420" width="180" height="14" fill="#5a2c14"/>`);
    [1192, 1236, 1280, 1316].forEach((x, i) => add(`<path d="M${x} 434 v26 q0 10 10 10 h10 v-8 h-6 v-28Z" fill="${i % 2 ? '#1d6b43' : '#c4222f'}"/><rect x="${x - 2}" y="432" width="16" height="7" fill="#fbf7f0"/>`));
    [220, 1140].forEach((x) => add(`<rect x="${x + 113}" y="244" width="12" height="302" fill="#efe4cd"/><rect x="${x + 8}" y="388" width="222" height="12" fill="#efe4cd"/>`));
    // window boxes with greenery
    [220, 1140].forEach((x, k) => {
      add(`<rect x="${x - 14}" y="560" width="266" height="40" rx="4" fill="#5a2c14"/><rect x="${x - 14}" y="560" width="266" height="6" fill="#8a5530"/>`);
      add(K.swag(x - 10, 560, x + 119, 572, x + 248, 560, { n: 18, r: 12, lights: true, every: 2, berries: true, off: k * 3 }));
    });
    // lanterns either side of the door
    [600, 1000].forEach((x) => add(`<path d="M${x} 330 v-20 h20" stroke="#1d1d1d" stroke-width="4" fill="none"/><path d="M${x - 22} 338 h44 l-6 -10 h-32Z" fill="#1d1d1d"/><rect x="${x - 18}" y="338" width="36" height="58" fill="#ffe9b8" opacity=".85"/><path d="M${x - 18} 338 v58 M${x + 18} 338 v58 M${x} 338 v58" stroke="#1d1d1d" stroke-width="3"/><path d="M${x - 22} 396 h44 l-8 10 h-28Z" fill="#1d1d1d"/>` + K.candle(x, 392, 26, '#f6efe2', 10)));

    /* front door */
    add(`<rect x="676" y="244" width="248" height="490" fill="#efe4cd"/><path d="M676 252 Q800 196 924 252" fill="#efe4cd"/><path d="M700 260 Q800 214 900 260Z" fill="url(#winGlow)"/>`);
    add(`<rect x="700" y="266" width="200" height="468" fill="url(#doorG)"/>`);
    [[716, 290, 76, 150], [808, 290, 76, 150], [716, 470, 76, 110], [808, 470, 76, 110], [716, 600, 76, 110], [808, 600, 76, 110]].forEach(([x, y, w, h]) => add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#5a0c18" stroke-width="5"/><rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="3" fill="none" stroke="#d9586a" stroke-opacity=".35" stroke-width="2"/>`));
    add(`<circle cx="884" cy="530" r="8" fill="url(#gold)"/>`);
    // door frame lights
    add(K.lightString(676, 250, 800, 180, 924, 250, 14, 4));
    // wreath with a bone ornament
    let wr = '';
    for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 24 + ring * 6; i++) { const a = (i / (24 + ring * 6)) * Math.PI * 2 + ring * 0.2; wr += K.pine(800 + Math.cos(a) * (46 + ring * 11), 392 + Math.sin(a) * (46 + ring * 11), 11 - ring); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; wr += K.berries(800 + Math.cos(a) * 58, 392 + Math.sin(a) * 58); }
    add(`<g filter="url(#shadow)">${wr}</g>` + K.bow(800, 456, 1) + boneOrn(800, 392, 1.2));

    // porch columns wrapped in ribbon
    [[40, 110], [1490, 110]].forEach(([x, w]) => {
      add(`<rect x="${x}" y="100" width="${w - 40}" height="640" fill="#f3ead6"/><rect x="${x}" y="100" width="12" height="640" fill="#d9ccb0"/><rect x="${x - 8}" y="100" width="${w - 24}" height="20" fill="#e9e0cf"/>`);
      for (let y = 120; y < 740; y += 60) add(`<path d="M${x} ${y} L${x + w - 40} ${y + 30} v14 L${x} ${y + 14}Z" fill="#c4222f"/>`);
      add(K.swag(x + 10, 130, x + 60, 400, x + 10, 700, { n: 30, r: 10, lights: true, every: 3 }));
    });

    /* porch floor + steps + snowy yard */
    add(`<rect y="734" width="1600" height="80" fill="url(#porch)"/>`);
    for (let x = -200; x < 1800; x += 70) add(`<path d="M${x} 814 L${800 + (x - 800) * 0.82} 734" stroke="#4a2e1a" stroke-width="2" opacity=".6"/>`);
    add(`<rect y="730" width="1600" height="8" fill="#3a2414"/>`);
    add(`<rect x="0" y="812" width="1600" height="188" fill="url(#snowG)"/>`);
    add(`<path d="M0 820 Q200 800 420 826 Q520 836 600 820 V1000 H0Z" fill="#fff" opacity=".8"/><path d="M1000 820 Q1100 836 1240 818 Q1420 800 1600 826 V1000 H1000Z" fill="#fff" opacity=".8"/>`);
    // steps
    [[560, 812, 480, 50], [530, 860, 540, 60], [500, 918, 600, 82]].forEach(([x, y, w, h], i) => add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${i % 2 ? '#7a5236' : '#8a6242'}"/><rect x="${x}" y="${y}" width="${w}" height="10" fill="#f4f8ff"/><path d="M${x} ${y + 10} Q${x + w / 2} ${y + 20} ${x + w} ${y + 10}" fill="#f4f8ff"/>`));
    // doormat
    add(`<rect x="720" y="754" width="160" height="42" rx="4" fill="url(#plaid)"/>`);
    // snowy shrubs with lights
    [[470, 786, 70], [1130, 786, 70], [140, 840, 90], [1460, 840, 90]].forEach(([x, y, r], k) => {
      add(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="#1d4d2f"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.4}" rx="${r * 0.55}" ry="${r * 0.22}" fill="#f4f8ff"/><ellipse cx="${x + r * 0.35}" cy="${y - r * 0.32}" rx="${r * 0.4}" ry="${r * 0.18}" fill="#f4f8ff"/>`);
      for (let i = 0; i < 9; i++) add(K.bulb(x + rr(-r * 0.8, r * 0.8), y + rr(-r * 0.2, r * 0.4), K.BULB[(i + k) % 7], 3.4));
    });

    /* gifts, torn paper and ribbon everywhere */
    add(K.gift(1010, 690, 110, 80, 'url(#bonePaper)', '#f0d07a'));
    add(K.gift(1130, 710, 86, 64, 'url(#stripePaper)', '#1d6b43'));
    add(K.gift(60, 870, 120, 84, 'url(#pawPaper)', '#c4222f'));
    // the torn one the beagle is investigating
    add(`<g filter="url(#shadow)"><rect x="330" y="880" width="120" height="80" fill="#a3172a"/><path d="M330 880 l14 -9 h120 l-14 9Z" fill="#c4222f"/><path d="M450 880 l14 -9 v80 l-14 9Z" fill="#7a0f1f"/><path d="M350 880 l24 26 l18 -20 l24 30 l18 -36 l16 0 v80 h-100Z" fill="#d9a83a"/></g>`);
    add(torn(300, 960, 70, 30, 'url(#stripePaper)', -12) + torn(470, 940, 60, 26, 'url(#dotPaper)', 20) + torn(1240, 900, 80, 30, 'url(#bonePaper)', -8) + torn(1360, 950, 66, 28, '#c4222f', 14) + torn(960, 760, 54, 22, 'url(#pawPaper)', 10) + torn(560, 760, 50, 22, '#e0b24a', -16));
    add(curl(250, 940, '#c4222f') + curl(1300, 880, '#f0d07a', 5, 9) + curl(620, 780, '#1d6b43', 3) + curl(1050, 960, '#c4222f', 4, 12) + curl(1420, 760, '#e0b24a', 3));

    /* the dogs */
    const LAB = { body: '#e9c27a', dark: '#c9964a', chest: '#f4dca8', muzzle: '#f4dca8', ear: 'flop', earColor: '#d9a85a' };
    const CORGI = { body: '#e08a3a', dark: '#b8622a', chest: '#fbf4ea', muzzle: '#fbf4ea', ear: 'up', blaze: '#fbf4ea', leg: '#fbf4ea', paw: '#fbf4ea' };
    const BEAGLE = { body: '#c98a4a', dark: '#7a4a22', chest: '#fbf4ea', muzzle: '#fbf4ea', ear: 'long', earColor: '#8a5226', saddle: '#2a1d16', blaze: '#fbf4ea', tailTip: '#fbf4ea', leg: '#fbf4ea' };
    const PUG = { body: '#e6c79a', dark: '#4a3a30', chest: '#f0d8b0', muzzle: '#2e2622', mask: '#2e2622', ear: 'fold', earColor: '#2e2622', wrinkle: true, curl: true };
    add(dogSit(510, 800, 1.25, LAB, { scarf: '#c4222f', tongue: true, noTail: true }));
    // pug sitting in an open gift box
    add(`<g filter="url(#shadow)"><path d="M1394 700 l14 -9 h120 l-14 9Z" fill="#1d6b43"/><path d="M1514 700 l14 -9 v80 l-14 9Z" fill="#0f3d24"/></g>`);
    add(dogSit(1454, 744, 0.95, PUG, { antlers: true, tongue: true }));
    add(`<rect x="1394" y="700" width="120" height="80" fill="#1d6b43"/><rect x="1446" y="700" width="16" height="80" fill="#f0d07a"/><rect x="1394" y="700" width="120" height="6" fill="#0f3d24"/>`);
    add(dogSit(800, 990, 1.15, CORGI, { hat: true, tongue: true, noTail: true, collar: '#1d6b43' }));
    add(dogSit(250, 930, 1.0, BEAGLE, { collar: '#c4222f' }));
    add(dachshund(1170, 972, 1.1));

    /* banner: a hanging wooden plank sign */
    add(`<path d="M580 104 L620 140 M1020 104 L980 140" stroke="#c9a24a" stroke-width="3"/>`);
    add(`<g filter="url(#shadow)"><rect x="560" y="132" width="480" height="84" rx="10" fill="url(#plank)"/><rect x="560" y="132" width="480" height="8" rx="4" fill="#c48a52"/><path d="M576 160 h448 M576 190 h448" stroke="#5a3418" stroke-width="1.5" opacity=".5"/><rect x="570" y="142" width="460" height="64" rx="7" fill="none" stroke="#f0d07a" stroke-width="2.4" stroke-dasharray="2 6"/></g>`);
    add(K.swag(552, 136, 800, 152, 1048, 136, { n: 26, r: 9, berries: true }));
    [580, 1020].forEach((x) => add(`<circle cx="${x}" cy="148" r="5" fill="url(#gold)"/>`));

    add(`<rect width="1600" height="1000" fill="url(#porchLight)"/><rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  // the lab's tail, wagging happily
  function wag(ctx, t) {
    const a = Math.sin(t * 9) * 0.5;
    ctx.translate(510 + 34 * 1.25, 800 - 10 * 1.25);
    ctx.rotate(a - 0.5);
    ctx.strokeStyle = '#e9c27a'; ctx.lineWidth = 13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(40, -6, 46, -44); ctx.stroke();
  }

  A.designs.dogs = {
    id: 'dogs',
    name: 'Pups & Presents',
    blurb: 'A snowy front porch full of dogs in scarves and antlers, and not one gift left unopened.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M600 182 Q800 178 1000 182', size: 40, maxWidth: 420, fill: '#fff3d6', stroke: '#3a1d0c' },
    effects: [
      { type: 'roomGlow', x: 800, y: 420, r: 800, color: '255,190,110', a: 0.05, flicker: 0.025 },
      { type: 'glow', x: 339, y: 395, r: 220, color: '255,200,120', a: 0.18, speed: 1.1 },
      { type: 'glow', x: 1259, y: 395, r: 220, color: '255,170,90', a: 0.2, speed: 2.3 },
      { type: 'custom', draw: wag },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'snow', rect: [0, 108, 1600, 892], count: 150, a: 0.8 },
    ],
    layout: 'dogs',
    keepOut: [[540, 96, 520, 130], [420, 610, 180, 200], [730, 840, 150, 160]],
    day24: { x: 715, y: 318, w: 170, h: 150 },
  };
})();
