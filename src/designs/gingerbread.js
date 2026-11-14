/* Design — "Gingerbread Lane"
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

  /* ---------- candy shop ---------- */
  const CANDY = ['#e8456a', '#f2c94c', '#5ec27a', '#6aa8f0', '#b07ae0', '#ff8a3a', '#ff6fae'];
  function icingWave(x0, y, x1, r = 7, drip = false) {
    let d = `M${x0} ${y}`;
    for (let x = x0; x < x1; x += r * 2) d += ` q${r} ${r * 1.4} ${r * 2} 0`;
    let s = `<path d="${d}" stroke="#fffaf2" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if (drip) for (let x = x0 + r; x < x1; x += r * 5) s += `<path d="M${x - 3} ${y + 4} q3 ${10 + ((x * 7) % 9)} 6 0Z" fill="#fffaf2"/>`;
    return s;
  }
  function peppermint(x, y, r, rot = 0) {
    let s = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><circle r="${r}" fill="#fffaf2"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M0 0 L${f(Math.cos((i * Math.PI) / 3) * r)} ${f(Math.sin((i * Math.PI) / 3) * r)} A${r} ${r} 0 0 1 ${f(Math.cos((i * Math.PI) / 3 + 0.5) * r)} ${f(Math.sin((i * Math.PI) / 3 + 0.5) * r)}Z" fill="#e0263f"/>`;
    return s + `<circle r="${r}" fill="none" stroke="#c9b8a8" stroke-width="1.5"/><ellipse cx="${-r * 0.35}" cy="${-r * 0.4}" rx="${r * 0.3}" ry="${r * 0.14}" fill="#fff" opacity=".7"/></g>`;
  }
  function gumdrop(x, y, r, c) {
    return `<path d="M${f(x - r)} ${f(y)} Q${f(x - r)} ${f(y - r * 1.5)} ${f(x)} ${f(y - r * 1.5)} Q${f(x + r)} ${f(y - r * 1.5)} ${f(x + r)} ${f(y)}Z" fill="${c}"/><path d="M${f(x - r * 0.5)} ${f(y - r * 0.9)} q${f(r * 0.2)} ${f(-r * 0.4)} ${f(r * 0.6)} ${f(-r * 0.4)}" stroke="#fff" stroke-width="2" opacity=".6" fill="none"/>` +
      [0, 1, 2].map((i) => `<circle cx="${f(x - r * 0.5 + i * r * 0.5)}" cy="${f(y - r * (0.3 + (i % 2) * 0.5))}" r="1.3" fill="#fff" opacity=".7"/>`).join('');
  }
  function lolly(x, y, h, c) {
    let s = `<rect x="${x - 3}" y="${y - h}" width="6" height="${h}" fill="#fffaf2"/><circle cx="${x}" cy="${y - h - 26}" r="30" fill="${c}"/>`;
    let d = `M${x} ${y - h - 26}`;
    for (let a = 0; a < 14; a += 0.5) d += ` L${f(x + Math.cos(a) * a * 2)} ${f(y - h - 26 + Math.sin(a) * a * 2)}`;
    return s + `<path d="${d}" stroke="#fffaf2" stroke-width="5" fill="none"/><circle cx="${x}" cy="${y - h - 26}" r="30" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>`;
  }
  function gbPerson(x, y, sc, o = {}) {
    const c = '#b8743a';
    let s = `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="2" rx="40" ry="7" fill="#7a4a6a" opacity=".25"/>`;
    s += `<path d="M-12 -70 Q-46 -76 -50 -60 Q-52 -46 -20 -50 L-22 -30 L-36 -4 Q-38 6 -26 6 L-8 -14 L8 -14 L26 6 Q38 6 36 -4 L22 -30 L20 -50 Q52 -46 50 -60 Q46 -76 12 -70Z" fill="${c}"/>`;
    s += `<circle cx="0" cy="-92" r="26" fill="${c}"/>`;
    s += `<path d="M-46 -66 q4 6 0 12 M46 -66 q-4 6 0 12 M-34 -6 q8 -2 12 6 M34 -6 q-8 -2 -12 6" stroke="#fffaf2" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="3 3"/>`;
    s += `<circle cx="-9" cy="-96" r="3.6" fill="#3a1d0c"/><circle cx="9" cy="-96" r="3.6" fill="#3a1d0c"/><path d="M-10 -84 q10 9 20 0" stroke="#fffaf2" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="-16" cy="-86" r="4" fill="#ff8a9c" opacity=".5"/><circle cx="16" cy="-86" r="4" fill="#ff8a9c" opacity=".5"/>`;
    s += [-58, -44, -30].map((yy, i) => gumdrop(0, yy + 5, 5, CANDY[(i + (o.k || 0)) % CANDY.length])).join('');
    if (o.scarf) s += `<path d="M-18 -70 Q0 -62 18 -70 L18 -62 Q0 -54 -18 -62Z" fill="${o.scarf}"/><path d="M8 -62 l4 18 l8 -2 l-4 -16Z" fill="${o.scarf}"/>`;
    if (o.bow) s += `<path d="M0 -118 l-14 -8 v16Z M0 -118 l14 -8 v16Z" fill="${o.bow}"/><circle cx="0" cy="-118" r="4" fill="${o.bow}"/>`;
    if (o.hat) s += `<path d="M-22 -110 Q0 -150 26 -128 Q28 -118 22 -110Z" fill="#e0263f"/><rect x="-26" y="-114" width="52" height="9" rx="4" fill="#fffaf2"/><circle cx="26" cy="-128" r="6" fill="#fffaf2"/>`;
    if (o.lolly) s += `<g transform="translate(52 -58)"><rect x="-2" y="-40" width="4" height="44" fill="#fffaf2"/><circle cx="0" cy="-52" r="16" fill="${o.lolly}"/><path d="M0 -52 m-10 0 a10 10 0 1 0 10 -10 a6 6 0 1 0 6 6" stroke="#fffaf2" stroke-width="3" fill="none"/></g>`;
    if (o.cane) s += `<path d="M-50 -60 v66 M-50 -60 q0 -14 -12 -14 q-12 0 -12 12" stroke="#fffaf2" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-50 -60 v66 M-50 -60 q0 -14 -12 -14 q-12 0 -12 12" stroke="#e0263f" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="5 5"/>`;
    return s + '</g>';
  }

  function build() {
    const R = A.util.rng(1231);
    const K = makeKit(R);
    const { rr, pick } = K;
    const out = [];
    const add = (s) => out.push(s);
    add(`<defs>${K.defs}
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f5a"/><stop offset=".55" stop-color="#7a4f9a"/><stop offset=".85" stop-color="#e48ab0"/><stop offset="1" stop-color="#ffc8b8"/></linearGradient>
      <linearGradient id="ginger" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c88444"/><stop offset="1" stop-color="#9a5a26"/></linearGradient>
      <linearGradient id="gingerDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8642e"/><stop offset="1" stop-color="#7a4418"/></linearGradient>
      <pattern id="crumb" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="6" cy="8" r="1.4" fill="#7a4418" opacity=".45"/><circle cx="20" cy="18" r="1.2" fill="#7a4418" opacity=".4"/><circle cx="12" cy="26" r="1" fill="#f0c088" opacity=".5"/><circle cx="26" cy="4" r="1" fill="#f0c088" opacity=".5"/></pattern>
      <pattern id="choc" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#5a2c14"/><rect x="2" y="2" width="22" height="22" rx="3" fill="#6e3a1c"/><path d="M3 3 h20" stroke="#8a5030" stroke-width="2"/></pattern>
      <radialGradient id="win" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff2b8"/><stop offset=".7" stop-color="#ffc060"/><stop offset="1" stop-color="#e08a2a"/></radialGradient>
      <linearGradient id="frost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf4"/><stop offset="1" stop-color="#f3dfe8"/></linearGradient>
      <pattern id="caneStripe" width="12" height="16" patternUnits="userSpaceOnUse" patternTransform="skewY(30)"><rect width="12" height="8" fill="#e0263f"/></pattern>
      <radialGradient id="lampGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff0b0" stop-opacity=".8"/><stop offset="1" stop-color="#fff0b0" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx="800" cy="520" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0a2a" stop-opacity=".5"/></radialGradient>
    </defs>`);

    /* sugar-plum sky */
    add(`<rect width="1600" height="1000" fill="url(#sky)"/>`);
    add(K.stars(0, 0, 1600, 360, 160));
    add(`<circle cx="1420" cy="120" r="46" fill="#fff4e0"/><circle cx="1420" cy="120" r="90" fill="url(#lampGlow)" opacity=".5"/>`);
    // frosted hills with tiny candy trees
    add(`<path d="M0 470 Q200 400 420 440 Q640 480 860 420 Q1100 360 1320 430 Q1480 470 1600 440 V700 H0Z" fill="#f3d6e6"/>`);
    for (let x = 10; x < 1600; x += rr(40, 70)) { const y = 470 + Math.sin(x / 150) * 20 + rr(0, 30), h = rr(30, 60); add(`<path d="M${f(x)} ${f(y - h)} L${f(x - h * 0.35)} ${f(y)} H${f(x + h * 0.35)}Z" fill="${pick(['#5ec27a', '#3a9a5a', '#7ad49a'])}"/><path d="M${f(x - h * 0.2)} ${f(y - h * 0.45)} l${f(h * 0.4)} ${f(h * 0.12)} M${f(x - h * 0.28)} ${f(y - h * 0.2)} l${f(h * 0.56)} ${f(h * 0.12)}" stroke="#fffaf2" stroke-width="2.4"/><circle cx="${f(x)}" cy="${f(y - h)}" r="3" fill="#f2c94c"/>`); }

    /* the houses */
    const house = (x, w, h, roofH, o) => {
      const base = 700, top = base - h;
      let s = `<g filter="url(#shadow)">`;
      if (o.chimney) s += `<rect x="${x + w * o.chimney}" y="${top - roofH * 0.9}" width="34" height="${roofH * 0.7}" fill="url(#gingerDark)"/><rect x="${x + w * o.chimney - 6}" y="${top - roofH * 0.9 - 8}" width="46" height="14" rx="6" fill="#fffaf2"/>`;
      s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="url(#ginger)"/><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="url(#crumb)"/>`;
      // roof: frosting slab with gumdrops / wafer shingles
      const L = x - 22, Rr = x + w + 22, cx = x + w / 2;
      s += `<path d="M${L} ${top + 6} L${cx} ${top - roofH} L${Rr} ${top + 6}Z" fill="${o.roof}"/>`;
      if (o.wafers) for (let r = 0; r < 5; r++) for (let k = 0; k < 12; k++) {
        const yy = top - roofH + (r + 0.8) * (roofH / 5.2), half = ((yy - (top - roofH)) / roofH) * (w / 2 + 22);
        const xx = cx - half + (k + 0.5) * ((half * 2) / 12);
        if (k < 12) s += `<circle cx="${f(xx)}" cy="${f(yy)}" r="${f(Math.max(4, half / 12))}" fill="${CANDY[(r + k) % CANDY.length]}" opacity=".9"/>`;
      }
      s += `<path d="M${L - 6} ${top + 10} L${cx} ${top - roofH - 6} L${Rr + 6} ${top + 10}" stroke="#fffaf2" stroke-width="14" fill="none" stroke-linejoin="round"/>`;
      for (let k = 0; k < 9; k++) { const t = k / 8; s += `<path d="M${f(L + (cx - L) * t - 3)} ${f(top + 12 - (roofH + 16) * t)} q3 ${12 + (k % 3) * 6} 6 0Z" fill="#fffaf2"/><path d="M${f(Rr - (Rr - cx) * t - 3)} ${f(top + 12 - (roofH + 16) * t)} q3 ${12 + ((k + 1) % 3) * 6} 6 0Z" fill="#fffaf2"/>`; }
      for (let k = 0; k <= 6; k++) { const t = k / 6; s += gumdrop(L + (cx - L) * t, top + 4 - (roofH + 10) * t, 9, CANDY[(k + o.k) % CANDY.length]) + gumdrop(Rr - (Rr - cx) * t, top + 4 - (roofH + 10) * t, 9, CANDY[(k + o.k + 3) % CANDY.length]); }
      s += peppermint(cx, top - roofH - 8, 16, o.k * 20);
      // icing trim
      s += icingWave(x, top + 8, x + w, 7, true) + `<path d="M${x + 4} ${top + 10} V${base - 4} M${x + w - 4} ${top + 10} V${base - 4}" stroke="#fffaf2" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/>`;
      // windows
      o.wins.forEach(([wx, wy, ww, wh]) => {
        s += `<rect x="${x + wx}" y="${top + wy}" width="${ww}" height="${wh}" rx="6" fill="url(#win)"/><rect x="${x + wx}" y="${top + wy}" width="${ww}" height="${wh}" rx="6" fill="none" stroke="#fffaf2" stroke-width="6"/><path d="M${x + wx + ww / 2} ${top + wy} v${wh} M${x + wx} ${top + wy + wh / 2} h${ww}" stroke="#fffaf2" stroke-width="4"/>`;
        s += `<rect x="${x + wx - 8}" y="${top + wy + wh}" width="${ww + 16}" height="10" rx="5" fill="#fffaf2"/>` + [0, 1, 2].map((i) => gumdrop(x + wx + ww * (0.2 + i * 0.3), top + wy + wh + 2, 6, CANDY[(i + o.k + 2) % CANDY.length])).join('');
        K.lamp(x + wx + ww / 2, top + wy + wh / 2, '#ffd27a', 8);
      });
      // chocolate door
      const dx = x + w / 2 - 34, dy = base - 108;
      s += `<path d="M${dx} ${base} V${dy + 30} Q${dx} ${dy} ${dx + 34} ${dy} Q${dx + 68} ${dy} ${dx + 68} ${dy + 30} V${base}Z" fill="url(#choc)"/><path d="M${dx} ${base} V${dy + 30} Q${dx} ${dy} ${dx + 34} ${dy} Q${dx + 68} ${dy} ${dx + 68} ${dy + 30} V${base}" stroke="#fffaf2" stroke-width="6" fill="none"/>`;
      s += peppermint(dx + 54, base - 50, 7);
      // candy cane posts at corners
      [x - 8, x + w - 8].forEach((px) => (s += `<rect x="${px}" y="${top + 20}" width="16" height="${h - 20}" rx="8" fill="#fffaf2"/><rect x="${px}" y="${top + 20}" width="16" height="${h - 20}" rx="8" fill="url(#caneStripe)"/>`));
      s += `</g>`;
      // little wreath on the door
      let wr = '';
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; wr += K.pine(x + w / 2 + Math.cos(a) * 16, dy + 36 + Math.sin(a) * 16, 6); }
      s += wr + K.berries(x + w / 2, dy + 52);
      // gumdrop hedge
      for (let k = 0; k < Math.floor(w / 26); k++) { if (Math.abs(x + 13 + k * 26 - (x + w / 2)) < 50) continue; s += gumdrop(x + 13 + k * 26, base + 8, 12, CANDY[(k + o.k) % CANDY.length]); }
      // roof lights
      s += K.lightString(L, top + 10, (L + cx) / 2 - 10, top - roofH / 2 + 20, cx, top - roofH + 4, 7, 3.6, K.BULB, o.k) + K.lightString(cx, top - roofH + 4, (cx + Rr) / 2 + 10, top - roofH / 2 + 20, Rr, top + 10, 7, 3.6, K.BULB, o.k + 2);
      return s;
    };
    add(house(46, 250, 230, 120, { roof: '#f3a0c0', wafers: true, k: 0, chimney: 0.68, wins: [[22, 50, 60, 64], [168, 50, 60, 64]] }));
    add(house(1300, 250, 220, 116, { roof: '#9ad8b0', wafers: true, k: 3, chimney: 0.2, wins: [[22, 46, 60, 64], [168, 46, 60, 64]] }));
    add(house(340, 270, 280, 140, { roof: '#a8d0f0', wafers: true, k: 1, chimney: 0.18, wins: [[26, 52, 66, 76], [178, 52, 66, 76]] }));
    add(house(990, 266, 264, 132, { roof: '#f6d38a', wafers: true, k: 5, chimney: 0.7, wins: [[24, 50, 66, 74], [176, 50, 66, 74]] }));
    add(house(664, 272, 330, 160, { roof: '#e0a0f0', wafers: true, k: 2, chimney: 0.86, wins: [[26, 70, 72, 84], [174, 70, 72, 84]] }));
    // round candy window in the centre gable
    add(`<circle cx="800" cy="300" r="40" fill="url(#win)"/><circle cx="800" cy="300" r="40" fill="none" stroke="#fffaf2" stroke-width="8"/><path d="M800 260 v80 M760 300 h80" stroke="#fffaf2" stroke-width="5"/>`);
    K.lamp(800, 300, '#ffd27a', 12);

    /* frosting snow street */
    add(`<path d="M0 690 Q400 676 800 694 Q1200 712 1600 686 V1000 H0Z" fill="url(#frost)"/>`);
    for (let x = 0; x < 1600; x += 46) add(`<path d="M${x} ${700 + Math.sin(x / 80) * 4} q23 22 46 0" fill="#fffaf4"/>`);
    // peppermint stepping-stone path
    for (let i = 0; i < 8; i++) { const t = i / 7; const x = 800 + Math.sin(t * 5.2 + 0.4) * 150 * (1 - t * 0.75), y = 975 - t * 262, r = 30 - t * 15; add(peppermint(x, y, r, i * 25)); }
    // candy-cane lamp posts
    [300, 640, 960, 1300].forEach((x, i) => {
      add(`<path d="M${x} 860 V700 q0 -40 34 -40 q34 0 34 30" stroke="#fffaf2" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M${x} 860 V700 q0 -40 34 -40 q34 0 34 30" stroke="#e0263f" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="10 10"/>`);
      add(`<circle cx="${x + 68}" cy="712" r="44" fill="url(#lampGlow)"/><path d="M${x + 56} 690 h24 l4 30 h-32Z" fill="#fff0b0"/><path d="M${x + 52} 690 h32 M${x + 52} 720 h32" stroke="#5a2c14" stroke-width="4"/>`);
      K.lamp(x + 68, 706, '#fff0b0', 14);
      add(`<ellipse cx="${x}" cy="862" rx="20" ry="6" fill="#d9b8c8"/>`);
      add(K.bow(x, 760, 0.55, CANDY[i], '#00000044'));
    });
    // lollipop trees
    add(lolly(1560, 900, 120, '#e8456a') + lolly(40, 920, 110, '#6aa8f0') + lolly(1180, 940, 80, '#f2c94c') + lolly(470, 950, 70, '#5ec27a'));
    // strolling gingerbread folk
    add(gbPerson(250, 930, 1.15, { scarf: '#5ec27a', hat: true, k: 0 }));
    add(gbPerson(560, 870, 0.9, { bow: '#ff6fae', lolly: '#6aa8f0', k: 2 }));
    add(gbPerson(1080, 880, 1.0, { scarf: '#e0263f', cane: true, k: 4 }));
    add(gbPerson(1380, 950, 0.75, { bow: '#f2c94c', k: 1 }));
    // sprinkles scattered on the snow
    for (let i = 0; i < 160; i++) { const x = rr(0, 1600), y = rr(720, 1000), a = rr(0, 180); add(`<rect x="${f(x)}" y="${f(y)}" width="8" height="2.6" rx="1.3" fill="${pick(CANDY)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})"/>`); }

    /* banner */
    add(K.ribbonBanner(800, 38, 320, { arch: 40, fill: '#e85a8a', dark: '#b8306a', deep: '#7a1a4a' }));
    add(`<path d="M${800 - 312} 48 Q800 6 ${800 + 312} 48 M${800 - 312} 104 Q800 62 ${800 + 312} 104" stroke="#fffaf2" stroke-width="4" stroke-dasharray="10 8" fill="none" opacity=".8"/>`);
    add(`<rect width="1600" height="1000" fill="url(#vig)"/>`);
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">${out.join('')}</svg>`, lights: K.lights, candles: K.candles };
  }

  A.designs.gingerbread = {
    id: 'gingerbread',
    name: 'Gingerbread Lane',
    blurb: 'A street of iced gingerbread houses, gumdrop roofs and candy-cane lamp posts.',
    width: 1600, height: 1000,
    build,
    title: { path: 'M520 82 Q800 34 1080 82', size: 42, maxWidth: 500, fill: '#fffaf2', stroke: '#7a1a4a' },
    effects: [
      { type: 'twinkle' },
      { type: 'glow', x: 800, y: 300, r: 120, color: '255,210,120', a: 0.3, speed: 1.3 },
      { type: 'smoke', x: 915, y: 218, rate: 1.4, rise: 18, size: 10, color: '255,236,244', a: 0.45 },
      { type: 'smoke', x: 233, y: 354, rate: 1.2, rise: 18, size: 9, color: '255,236,244', a: 0.4 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 110, a: 0.85 },
    ],
    layout: 'gingerbread',
    keepOut: [[400, 10, 800, 130]],
    day24: { x: 715, y: 226, w: 170, h: 150 },
    numStyles: ['n-tag', 'n-cream', 'n-swash', 'n-red', 'n-gold'],
  };
})();
