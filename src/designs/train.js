/* Design — "North Pole Express"
   A steam train crossing a timber trestle at night: lit carriage windows, a puffing
   locomotive, a little station with a clock and lamps, snowy pines and mountains. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1225 + 77);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a'];

    function bulb(x, y, c, r = 3.6) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${c}" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.15)}" fill="${c}"/>`;
    }
    function sprig(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + rr(-0.3, 0.3), l = r * rr(0.9, 1.4); s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2" stroke-linecap="round"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/></g>`;
    }
    function pine(x, base, h, col, snow, tiers = 5) {
      let s = '';
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers, top = base - h + t * h * 0.78, bot = top + h * 0.34, w = h * (0.12 + t * 0.2);
        s += `<path d="M${f(x)} ${f(top)} L${f(x - w)} ${f(bot)} Q${f(x)} ${f(bot + h * 0.04)} ${f(x + w)} ${f(bot)}Z" fill="${col}"/>`;
        if (snow) s += `<path d="M${f(x)} ${f(top + 2)} L${f(x - w * 0.8)} ${f(bot - 3)} Q${f(x - w * 0.3)} ${f(bot - h * 0.05)} ${f(x + w * 0.1)} ${f(bot - h * 0.09)} Q${f(x + w * 0.45)} ${f(bot - h * 0.02)} ${f(x + w * 0.78)} ${f(bot - 4)}Z" fill="${snow}" opacity=".9"/>`;
      }
      return s;
    }

    add(`<defs>
      <linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030820"/><stop offset=".45" stop-color="#0e1e46"/><stop offset=".8" stop-color="#2e3a6e"/><stop offset="1" stop-color="#5a4f80"/></linearGradient>
      <radialGradient id="tr-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8dc" stop-opacity=".85"/><stop offset=".3" stop-color="#fff0c0" stop-opacity=".25"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></radialGradient>
      <linearGradient id="tr-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6d9e"/><stop offset="1" stop-color="#28325c"/></linearGradient>
      <linearGradient id="tr-mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4778"/><stop offset="1" stop-color="#1a2246"/></linearGradient>
      <linearGradient id="tr-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f1fb"/><stop offset="1" stop-color="#9fb3d4"/></linearGradient>
      <linearGradient id="tr-cliff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2b2f4e"/><stop offset="1" stop-color="#1a1d36"/></linearGradient>
      <linearGradient id="tr-timber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3a26"/><stop offset="1" stop-color="#3a2416"/></linearGradient>
      <linearGradient id="tr-boiler" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4f5c"/><stop offset=".35" stop-color="#1c1f27"/><stop offset="1" stop-color="#0b0c10"/></linearGradient>
      <linearGradient id="tr-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c42a36"/><stop offset="1" stop-color="#7a1019"/></linearGradient>
      <linearGradient id="tr-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7a4e"/><stop offset="1" stop-color="#123f27"/></linearGradient>
      <linearGradient id="tr-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="tr-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset="1" stop-color="#ffb24d"/></linearGradient>
      <linearGradient id="tr-beam" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff2c0" stop-opacity=".55"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></linearGradient>
      <linearGradient id="tr-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c8a56"/><stop offset=".5" stop-color="#1b6a3e"/><stop offset="1" stop-color="#0f4527"/></linearGradient>
      <linearGradient id="tr-ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#155232"/><stop offset="1" stop-color="#0a2d1a"/></linearGradient>
      <linearGradient id="tr-ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4f7e"/><stop offset="1" stop-color="#1f2b4f"/></linearGradient>
      <radialGradient id="tr-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="tr-vig" cx="800" cy="500" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#02030c" stop-opacity=".6"/></radialGradient>
      <filter id="tr-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="tr-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="tr-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
    </defs>`);

    /* ---------- sky, moon, stars ---------- */
    add(`<rect width="${W}" height="${H}" fill="url(#tr-sky)"/>`);
    let st = '';
    for (let i = 0; i < 300; i++) st += `<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 520))}" r="${f(rr(0.4, 1.5))}" fill="#fff" opacity="${f(rr(0.25, 0.95))}"/>`;
    add(st);
    for (let i = 0; i < 26; i++) { const x = rr(20, W - 20), y = rr(20, 420); add(`<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="#fff"/>`); lights.push({ x, y, c: '#eef4ff', r: 1.6 }); }
    add(`<circle cx="1340" cy="225" r="200" fill="url(#tr-moon)"/><circle cx="1340" cy="225" r="58" fill="#fff6d6"/><circle cx="1322" cy="210" r="11" fill="#ece0b8" opacity=".6"/><circle cx="1360" cy="244" r="8" fill="#ece0b8" opacity=".55"/><circle cx="1350" cy="200" r="5" fill="#ece0b8" opacity=".5"/>`);
    // drifting clouds
    add(`<g opacity=".35" filter="url(#tr-soft)"><ellipse cx="300" cy="230" rx="160" ry="16" fill="#8d97c8"/><ellipse cx="1080" cy="300" rx="200" ry="14" fill="#8d97c8"/><ellipse cx="1500" cy="330" rx="120" ry="12" fill="#a6aed8"/></g>`);

    /* ---------- mountains, forest ---------- */
    function range(base, peaks, fill, cap) {
      let d = `M-20 ${base}`, caps = '';
      peaks.forEach(([x, y]) => {
        d += ` L${f(x - rr(60, 110))} ${f(y + rr(60, 110))} L${x} ${y} L${f(x + rr(60, 110))} ${f(y + rr(60, 100))}`;
        const c = rr(30, 50);
        caps += `<path d="M${x} ${y} L${f(x - c)} ${f(y + c * 0.9)} L${f(x - c * 0.4)} ${f(y + c * 0.7)} L${f(x - c * 0.1)} ${f(y + c)} L${f(x + c * 0.25)} ${f(y + c * 0.72)} L${f(x + c * 0.7)} ${f(y + c * 0.95)}Z" fill="${cap}"/>`;
      });
      return `<path d="${d} L${W + 20} ${base} V${H} H-20Z" fill="${fill}"/>${caps}`;
    }
    add(range(560, [[120, 380], [380, 340], [640, 390], [900, 350], [1120, 395], [1420, 360], [1580, 400]], 'url(#tr-mtn)', '#dfe8f8'));
    add(range(600, [[250, 450], [520, 470], [780, 440], [1040, 480], [1300, 450], [1520, 470]], 'url(#tr-mtn2)', '#b7c6e4'));
    let forest = '';
    for (let x = -10; x < W + 10; x += rr(14, 26)) forest += pine(x, 640 + rr(-8, 8), rr(50, 90), '#0f1c33', '#c8d6ee', 4);
    add(forest);

    /* ---------- ravine, frozen river ---------- */
    add(`<path d="M0 640 H1600 V1000 H0Z" fill="#1c2340"/>`);
    add(`<path d="M260 900 Q800 870 1340 900 L1340 1000 L260 1000Z" fill="url(#tr-ice)"/>`);
    let gl = '';
    for (let i = 0; i < 30; i++) gl += `<rect x="${f(rr(300, 1300))}" y="${f(rr(890, 990))}" width="${f(rr(20, 90))}" height="1.5" fill="#cfe0ff" opacity="${f(rr(0.1, 0.3))}"/>`;
    add(gl);
    // ravine walls
    add(`<path d="M0 600 L300 606 Q330 700 300 780 Q280 860 330 1000 L0 1000Z" fill="url(#tr-cliff)"/>
      <path d="M1600 600 L1310 606 Q1280 700 1310 790 Q1330 860 1280 1000 L1600 1000Z" fill="url(#tr-cliff)"/>
      <path d="M0 596 L304 602 Q318 640 312 660 Q200 640 0 650Z" fill="url(#tr-snow)"/>
      <path d="M1600 596 L1306 602 Q1292 640 1300 660 Q1420 640 1600 650Z" fill="url(#tr-snow)"/>`);
    // snow ledges on cliffs
    for (let i = 0; i < 10; i++) { const left = i % 2 === 0, y = rr(700, 960); const x = left ? rr(220, 300) : rr(1300, 1380); add(`<path d="M${f(x - 30)} ${f(y)} q30 -10 60 0 q-30 6 -60 0Z" fill="#dfe8f8" opacity=".8"/>`); }

    // snowy hills and pines on the ravine floor, behind the trestle
    add(`<path d="M280 760 Q500 700 760 750 Q1000 800 1330 730 L1330 900 L280 900Z" fill="#2d3a64"/><path d="M280 760 Q500 700 760 750 Q1000 800 1330 730" stroke="#b9c8e6" stroke-width="4" fill="none" opacity=".7"/>`);
    let rp = '';
    for (let x = 300; x < 1320; x += rr(26, 44)) rp += pine(x, 770 + Math.sin(x / 140) * 26 + rr(0, 30), rr(60, 110), '#14213d', '#c8d6ee', 4);
    add(rp);
    add(`<path d="M280 850 Q520 800 800 840 Q1060 880 1330 830 L1330 905 L280 905Z" fill="#3d4c7a"/><path d="M280 850 Q520 800 800 840 Q1060 880 1330 830" stroke="#dfe8f8" stroke-width="4" fill="none" opacity=".8"/>`);
    /* ---------- trestle bridge ---------- */
    let tr = '';
    const deckY = 604;
    for (let x = 300; x <= 1300; x += 50) {
      tr += `<path d="M${x} ${deckY + 8} L${x - 10} 900" stroke="#4a2e1c" stroke-width="7"/>`;
    }
    for (let x = 300; x < 1300; x += 50) {
      for (let y = deckY + 20; y < 880; y += 70) tr += `<path d="M${x} ${y} L${x + 50} ${y + 70} M${x + 50} ${y} L${x} ${y + 70}" stroke="#3a2416" stroke-width="3.5"/>`;
    }
    for (let y = deckY + 20; y < 900; y += 70) tr += `<path d="M296 ${y} H1304" stroke="#5a3a26" stroke-width="5"/><path d="M296 ${y - 3} H1304" stroke="#e6eefa" stroke-width="2.5" stroke-dasharray="40 18 22 30" opacity=".85"/>`;
    add(`<g opacity=".95">${tr}</g>`);
    add(`<rect x="260" y="${deckY}" width="1090" height="16" fill="url(#tr-timber)"/><rect x="260" y="${deckY}" width="1090" height="3" fill="#8a6040"/><path d="M260 ${deckY - 2} H1350" stroke="#9aa3b5" stroke-width="3"/>`);
    add(`<path d="M260 ${deckY + 16} H1350" stroke="#e8f0fb" stroke-width="4" stroke-dasharray="30 14" opacity=".8"/>`);
    // bridge lamps along deck
    [420, 700, 980, 1240].forEach((x) => {
      add(`<path d="M${x} ${deckY} v-34" stroke="#22252e" stroke-width="3"/><rect x="${x - 5}" y="${deckY - 44}" width="10" height="12" rx="2" fill="#ffd27a"/>`);
    });

    /* ---------- the train (heading left) ---------- */
    const wy = deckY - 8;
    function wheels(x0, x1, r = 11) {
      let s = '';
      for (let x = x0; x <= x1; x += r * 2.6) s += `<circle cx="${f(x)}" cy="${wy}" r="${r}" fill="#1a1b22" stroke="#7a1019" stroke-width="3"/><circle cx="${f(x)}" cy="${wy}" r="3" fill="#c9a24a"/>`;
      return s;
    }
    function carriage(x, w, body, trim) {
      let s = `<g filter="url(#tr-shadow)">`;
      s += `<rect x="${x}" y="${wy - 22}" width="${w}" height="8" fill="#14151b"/>`;
      s += wheels(x + 18, x + w - 18, 10);
      s += `<rect x="${x}" y="${wy - 96}" width="${w}" height="78" rx="6" fill="${body}"/>`;
      s += `<rect x="${x + 4}" y="${wy - 92}" width="${w - 8}" height="4" fill="${trim}"/><rect x="${x + 4}" y="${wy - 30}" width="${w - 8}" height="4" fill="${trim}"/>`;
      s += `<path d="M${x - 6} ${wy - 96} Q${x + w / 2} ${wy - 122} ${x + w + 6} ${wy - 96}Z" fill="#2a2a30"/>`;
      s += `<path d="M${x - 8} ${wy - 97} Q${x + w / 2} ${wy - 126} ${x + w + 8} ${wy - 97} Q${x + w / 2} ${wy - 116} ${x - 8} ${wy - 97}Z" fill="#f4f8ff"/>`;
      const n = Math.floor((w - 20) / 30);
      for (let i = 0; i < n; i++) {
        const wx = x + 14 + i * ((w - 28) / n);
        s += `<rect x="${f(wx)}" y="${wy - 80}" width="${f((w - 28) / n - 8)}" height="34" rx="5" fill="url(#tr-win)"/>`;
        s += `<rect x="${f(wx)}" y="${wy - 80}" width="${f((w - 28) / n - 8)}" height="8" rx="3" fill="#b3172b" opacity=".75"/>`;
        lights.push({ x: wx + ((w - 28) / n - 8) / 2, y: wy - 62, c: '#ffcf70', r: 3.2 });
        // little silhouettes in some windows
        if (R() < 0.35) s += `<circle cx="${f(wx + 10)}" cy="${wy - 58}" r="6" fill="#5a3218" opacity=".7"/><rect x="${f(wx + 3)}" y="${wy - 52}" width="14" height="10" rx="4" fill="#5a3218" opacity=".7"/>`;
      }
      // wreath on the end
      s += `<circle cx="${x + w - 2}" cy="${wy - 60}" r="10" fill="none" stroke="#1d5a34" stroke-width="5"/><circle cx="${x + w - 2}" cy="${wy - 50}" r="3" fill="#c4182f"/>`;
      s += `</g>`;
      return s;
    }
    add(`<path d="M300 ${wy - 70} L40 ${wy - 140} L40 ${wy + 20} L300 ${wy - 40}Z" fill="url(#tr-beam)"/>`);
    add(carriage(1214, 116, 'url(#tr-red)', '#e2b04a'));
    add(carriage(1012, 190, 'url(#tr-green)', '#e2b04a'));
    add(carriage(808, 190, 'url(#tr-red)', '#e2b04a'));
    add(carriage(604, 190, 'url(#tr-green)', '#e2b04a'));
    // caboose cupola + lantern
    add(`<rect x="1246" y="${wy - 132}" width="50" height="22" rx="3" fill="#7a1019"/><rect x="1252" y="${wy - 128}" width="14" height="12" fill="url(#tr-win)"/><rect x="1274" y="${wy - 128}" width="14" height="12" fill="url(#tr-win)"/><path d="M1240 ${wy - 132} h62" stroke="#f4f8ff" stroke-width="5" stroke-linecap="round"/>`);
    lights.push({ x: 1336, y: wy - 70, c: '#ff4d4d', r: 4 });
    add(`<circle cx="1336" cy="${wy - 70}" r="5" fill="#ff4d4d"/>`);
    // tender with gifts
    add(`<g filter="url(#tr-shadow)"><rect x="508" y="${wy - 22}" width="86" height="8" fill="#14151b"/>${wheels(526, 580, 10)}<rect x="508" y="${wy - 78}" width="86" height="60" rx="4" fill="#1c1f27"/><rect x="512" y="${wy - 74}" width="78" height="4" fill="#c9a24a"/></g>`);
    [[516, 18, '#c42a36', '#e2b04a'], [540, 24, '#2a7a4e', '#f4f0e6'], [566, 20, '#e2b04a', '#c42a36'], [528, 14, '#3a5fb0', '#f4f0e6']].forEach(([x, s, c, rb], i) => {
      const y = wy - 78 - s - (i === 3 ? 18 : 0);
      add(`<rect x="${x}" y="${y}" width="${s + 6}" height="${s}" fill="${c}"/><rect x="${x + (s + 6) / 2 - 2}" y="${y}" width="4" height="${s}" fill="${rb}"/><rect x="${x}" y="${y + s / 2 - 2}" width="${s + 6}" height="4" fill="${rb}"/>`);
    });
    // locomotive
    add(`<g filter="url(#tr-shadow)">
      <rect x="300" y="${wy - 24}" width="200" height="10" fill="#14151b"/>
      <circle cx="352" cy="${wy - 2}" r="20" fill="#1a1b22" stroke="#7a1019" stroke-width="5"/><circle cx="352" cy="${wy - 2}" r="4" fill="#c9a24a"/>
      <circle cx="404" cy="${wy - 2}" r="20" fill="#1a1b22" stroke="#7a1019" stroke-width="5"/><circle cx="404" cy="${wy - 2}" r="4" fill="#c9a24a"/>
      <circle cx="456" cy="${wy - 2}" r="20" fill="#1a1b22" stroke="#7a1019" stroke-width="5"/><circle cx="456" cy="${wy - 2}" r="4" fill="#c9a24a"/>
      <circle cx="310" cy="${wy + 2}" r="11" fill="#1a1b22" stroke="#7a1019" stroke-width="3"/>
      <path d="M340 ${wy - 2} H466" stroke="#b9c0cc" stroke-width="4"/>
      <rect x="318" y="${wy - 80}" width="140" height="56" rx="26" fill="url(#tr-boiler)"/>
      <rect x="340" y="${wy - 82}" width="6" height="60" fill="url(#tr-gold)"/><rect x="390" y="${wy - 82}" width="6" height="60" fill="url(#tr-gold)"/><rect x="430" y="${wy - 82}" width="6" height="60" fill="url(#tr-gold)"/>
      <path d="M318 ${wy - 52} m-6 0 a10 26 0 1 0 0.1 0" fill="#2a2d36"/>
      <circle cx="312" cy="${wy - 52}" r="18" fill="#2a2d36" stroke="url(#tr-gold)" stroke-width="3"/>
      <circle cx="312" cy="${wy - 52}" r="8" fill="#b3172b"/>
      <path d="M326 ${wy - 80} l-6 -44 h34 l-6 44Z" fill="#1c1f27"/><rect x="316" y="${wy - 132}" width="42" height="10" rx="3" fill="url(#tr-gold)"/>
      <rect x="378" y="${wy - 98}" width="24" height="20" rx="10" fill="url(#tr-gold)"/>
      <rect x="296" y="${wy - 102}" width="20" height="18" rx="3" fill="#c9a24a"/><circle cx="296" cy="${wy - 93}" r="8" fill="#fff6c8"/>
      <rect x="452" y="${wy - 118}" width="62" height="96" rx="4" fill="url(#tr-red)"/>
      <rect x="446" y="${wy - 126}" width="74" height="10" rx="3" fill="#1c1f27"/><path d="M444 ${wy - 127} q38 -12 78 0" stroke="#f4f8ff" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="462" y="${wy - 108}" width="22" height="26" rx="3" fill="url(#tr-win)"/><rect x="488" y="${wy - 108}" width="18" height="26" rx="3" fill="url(#tr-win)"/>
      <rect x="452" y="${wy - 54}" width="62" height="4" fill="#e2b04a"/>
      <path d="M300 ${wy - 22} L276 ${wy + 8} H306Z" fill="#7a1019"/><path d="M282 ${wy} h22 M286 ${wy - 8} h18" stroke="#c9a24a" stroke-width="2"/>
      <circle cx="300" cy="${wy - 64}" r="16" fill="none" stroke="#1d5a34" stroke-width="7"/><circle cx="300" cy="${wy - 50}" r="4" fill="#c4182f"/><circle cx="294" cy="${wy - 52}" r="3" fill="#c4182f"/>
    </g>`);
    lights.push({ x: 474, y: wy - 95, c: '#ffcf70', r: 3.5 }, { x: 497, y: wy - 95, c: '#ffcf70', r: 3.5 });
    // garland with lights along the carriages
    for (let x = 610; x < 1325; x += 16) add(bulb(x, wy - 100 + Math.sin(x / 26) * 3, BULB[Math.round(x / 16) % BULB.length], 2.6));

    /* ---------- station on the left cliff ---------- */
    add(`<g filter="url(#tr-shadow)">
      <rect x="40" y="520" width="190" height="86" fill="#7a3a26"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="40" y="${524 + i * 14}" width="190" height="2" fill="#5a2818" opacity=".7"/>`).join('')}
      <path d="M22 524 L135 452 L248 524Z" fill="#2a2a34"/><path d="M14 528 Q20 516 30 520 L135 448 L240 520 Q250 516 256 528 Q248 538 238 532 L135 464 L32 532 Q20 538 14 528Z" fill="#f4f8ff"/>
      <circle cx="135" cy="496" r="20" fill="#f6efdc" stroke="url(#tr-gold)" stroke-width="5"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.283; return `<path d="M${f(135 + Math.cos(a) * 14)} ${f(496 + Math.sin(a) * 14)} L${f(135 + Math.cos(a) * 17)} ${f(496 + Math.sin(a) * 17)}" stroke="#2a1a10" stroke-width="2"/>`; }).join('')}
      <path d="M135 496 L135 484 M135 496 L144 500" stroke="#2a1a10" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="64" y="548" width="34" height="40" rx="3" fill="url(#tr-win)"/><rect x="172" y="548" width="34" height="40" rx="3" fill="url(#tr-win)"/>
      <path d="M81 548 v40 M64 568 h34 M189 548 v40 M172 568 h34" stroke="#5a2818" stroke-width="3"/>
      <rect x="116" y="540" width="38" height="66" fill="#4a2414"/><circle cx="146" cy="574" r="2.5" fill="#e2b04a"/>
      <circle cx="135" cy="530" r="9" fill="none" stroke="#1d5a34" stroke-width="5"/><circle cx="135" cy="539" r="3" fill="#c4182f"/>
      <rect x="20" y="600" width="250" height="10" fill="#4a3426"/>
    </g>`);
    lights.push({ x: 81, y: 568, c: '#ffcf70', r: 6 }, { x: 189, y: 568, c: '#ffcf70', r: 6 });
    for (let i = 0; i < 11; i++) add(bulb(32 + i * 20.6, 534 + Math.sin(i) * 2, BULB[i % BULB.length], 2.8));
    // platform lamps
    [[26, 600], [252, 600]].forEach(([x, y]) => {
      add(`<path d="M${x} ${y} v-86" stroke="#1c1f27" stroke-width="5"/><path d="M${x - 8} ${y - 86} h16 l-3 -16 h-10Z" fill="#1c1f27"/><rect x="${x - 6}" y="${y - 100}" width="12" height="13" fill="#ffe08a"/><circle cx="${x}" cy="${y - 94}" r="34" fill="url(#tr-lamp)"/>`);
      candles.push({ x, y: y - 92, s: 0.6 });
    });
    // bench + luggage
    add(`<rect x="200" y="584" width="40" height="5" fill="#5a3a26"/><path d="M204 589 v12 M236 589 v12" stroke="#2a1a10" stroke-width="3"/><rect x="170" y="584" width="24" height="18" rx="3" fill="#8a4a22"/><rect x="176" y="580" width="12" height="4" rx="2" fill="#2a1a10"/>`);

    /* ---------- foreground pines + snow ---------- */
    add(`<path d="M0 930 Q160 900 320 930 Q420 950 470 1000 H0Z" fill="url(#tr-snow)"/><path d="M1600 930 Q1440 900 1290 930 Q1180 950 1130 1000 H1600Z" fill="url(#tr-snow)"/>`);
    [[60, 1000, 300], [170, 1010, 230], [280, 1010, 170], [1540, 1000, 310], [1430, 1010, 230], [1330, 1010, 160]].forEach(([x, b, h]) => add(pine(x, b, h, '#0c2418', '#e6eefa', 6)));
    // a decorated pine on the right cliff
    add(pine(1450, 640, 140, '#123a26', '#e4f1fb', 5));
    for (let i = 0; i < 14; i++) { const t = rr(0.2, 0.95); add(bulb(1450 + rr(-1, 1) * (8 + t * 46), 500 + t * 136, BULB[i % BULB.length], 3)); }
    // snowman by the station
    add(`<g transform="translate(222 640) scale(.8)"><ellipse cx="0" cy="0" rx="26" ry="22" fill="#f4f8ff"/><circle cx="0" cy="-34" r="18" fill="#f4f8ff"/><circle cx="0" cy="-62" r="13" fill="#f4f8ff"/><rect x="-11" y="-88" width="22" height="16" fill="#1c1f27"/><rect x="-16" y="-74" width="32" height="4" fill="#1c1f27"/><path d="M0 -60 l14 3 l-14 2Z" fill="#f08a2a"/><circle cx="-5" cy="-65" r="2" fill="#111"/><circle cx="5" cy="-65" r="2" fill="#111"/><path d="M-14 -50 q14 8 28 0 l-2 8 q-12 6 -24 0Z" fill="#c4182f"/><path d="M8 -46 l6 18 l6 -2 l-6 -16Z" fill="#c4182f"/></g>`);

    /* ---------- ribbon banner ---------- */
    add(`<path d="M0 22 Q200 70 440 60 M1160 60 Q1400 70 1600 22" stroke="#2c6b40" stroke-width="10" fill="none"/>`);
    let gar = '';
    for (let i = 0; i <= 18; i++) { const t = i / 18; const x = t * 440, y = (1 - t) * (1 - t) * 22 + 2 * (1 - t) * t * 70 + t * t * 60; gar += sprig(x, y, 9); if (i % 3 === 1) gar += bulb(x, y + 6, BULB[i % BULB.length], 3); }
    for (let i = 0; i <= 18; i++) { const t = i / 18; const x = 1160 + t * 440, y = (1 - t) * (1 - t) * 60 + 2 * (1 - t) * t * 70 + t * t * 22; gar += sprig(x, y, 9); if (i % 3 === 1) gar += bulb(x, y + 6, BULB[(i + 2) % BULB.length], 3); }
    add(gar);
    add(`<g filter="url(#tr-shadow)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#tr-ribbonDark)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#tr-ribbonDark)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#082414"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#082414"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#tr-ribbon)"/>
      <path d="M528 86 Q800 30 1072 86" stroke="url(#tr-gold)" stroke-width="3" fill="none"/>
      <path d="M528 140 Q800 84 1072 140" stroke="url(#tr-gold)" stroke-width="3" fill="none"/>
    </g>`);
    add(bow(520, 92, 0.8) + bow(1080, 92, 0.8));

    add(`<rect width="${W}" height="${H}" fill="url(#tr-vig)"/>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  /** Steam that billows from the stack and trails back over the carriages. */
  function steam(ctx, t, dt, s) {
    s.p = s.p || [];
    if (dt && Math.random() < dt * 7) s.p.push({ x: 337, y: 462, life: 0, max: 3.4 + Math.random() * 1.6, r: 10 + Math.random() * 8, vy: -26 - Math.random() * 14, vx: 30 + Math.random() * 26 });
    s.p = s.p.filter((p) => (p.life += dt) < p.max);
    for (const p of s.p) {
      const k = p.life / p.max;
      p.x += p.vx * dt; p.y += p.vy * dt * (1 - k * 0.6);
      ctx.globalAlpha = 0.5 * Math.sin(Math.min(1, k * 1.3) * Math.PI) * (1 - k * 0.3);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (1 + k * 2.4));
      g.addColorStop(0, 'rgba(240,242,250,1)'); g.addColorStop(1, 'rgba(200,206,226,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * 2.4), 0, 7); ctx.fill();
    }
    // chuff of steam by the wheels
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6);
    const g2 = ctx.createRadialGradient(330, 598, 0, 330, 598, 40);
    g2.addColorStop(0, 'rgba(235,240,250,.9)'); g2.addColorStop(1, 'rgba(235,240,250,0)');
    ctx.fillStyle = g2; ctx.fillRect(280, 560, 100, 70);
    ctx.globalAlpha = 1;
  }

  A.designs.train = {
    id: 'train',
    name: 'North Pole Express',
    blurb: 'A steam train winding through snowy pines at night.',
    width: W,
    height: H,
    build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440, fill: '#fff6dc', stroke: '#0a2d1a' },
    numStyles: ['n-cream', 'n-tag', 'n-swash', 'n-red', 'n-cream'],
    effects: [
      { type: 'glow', x: 292, y: 504, r: 120, color: '255,236,170', a: 0.35, speed: 2.2 },
      { type: 'glow', x: 1340, y: 225, r: 170, color: '255,246,210', a: 0.12, speed: 0.6 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'custom', draw: steam },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 110, a: 0.75 },
    ],
    layout: 'train',
    keepOut: [[440, 18, 720, 172], [270, 400, 250, 210]],
    day24: { x: 1255, y: 150, w: 170, h: 150 },
  };
})();
