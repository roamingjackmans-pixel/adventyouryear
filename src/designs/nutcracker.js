/* Design — "Nutcracker Night"
   A gilt theatre on Christmas Eve: red velvet curtains, footlights, a towering tree,
   a toy-soldier nutcracker, a sugar-plum dancer on pointe, two mice, snow falling on stage
   and the audience silhouetted in the stalls. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1712);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a', '#28603a'];

    function bulb(x, y, c, r = 4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.5)}" fill="${c}" opacity=".22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".7"/>`;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/></g>`;
    }
    function gift(x, y, w, h, fill, rib, d = 10) {
      return `<path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".2"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".3"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 5}" y="${y}" width="10" height="${h}" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 5}" width="${w}" height="10" fill="${rib}"/>${bow(x + w / 2 + d / 2, y - d * 0.3, 0.55, rib, '#00000055')}`;
    }
    const star = (x, y, ro, ri) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); } return d + 'Z'; };

    add(`<defs>
      <linearGradient id="nc-gilt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5420"/><stop offset=".2" stop-color="#f3d98f"/><stop offset=".38" stop-color="#b8893a"/><stop offset=".55" stop-color="#fbe7ae"/><stop offset=".72" stop-color="#a57a30"/><stop offset=".88" stop-color="#f0d189"/><stop offset="1" stop-color="#6e4a1a"/></linearGradient>
      <linearGradient id="nc-giltV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#d9a84a"/><stop offset="1" stop-color="#8a5e18"/></linearGradient>
      <linearGradient id="nc-velvet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a0610"/><stop offset=".25" stop-color="#a0142a"/><stop offset=".5" stop-color="#6e0a18"/><stop offset=".75" stop-color="#b81c32"/><stop offset="1" stop-color="#4a0610"/></linearGradient>
      <linearGradient id="nc-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0710"/><stop offset="1" stop-color="#1e0408"/></linearGradient>
      <linearGradient id="nc-backdrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1838"/><stop offset=".6" stop-color="#284a86"/><stop offset="1" stop-color="#7a92c4"/></linearGradient>
      <linearGradient id="nc-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3420"/><stop offset="1" stop-color="#8a5634"/></linearGradient>
      <linearGradient id="nc-tree" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a5232"/><stop offset=".55" stop-color="#123e25"/><stop offset="1" stop-color="#0a2a18"/></linearGradient>
      <linearGradient id="nc-coat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d22a34"/><stop offset="1" stop-color="#8a0f1c"/></linearGradient>
      <linearGradient id="nc-tutu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd2e6"/><stop offset="1" stop-color="#f08ab8"/></linearGradient>
      <radialGradient id="nc-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff9e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></radialGradient>
      <radialGradient id="nc-foot" cx="800" cy="900" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd890" stop-opacity=".28"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient>
      <radialGradient id="nc-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4d0" stop-opacity=".45"/><stop offset="1" stop-color="#fff4d0" stop-opacity="0"/></radialGradient>
      <radialGradient id="nc-vig" cx="800" cy="480" r="1000" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0002" stop-opacity=".65"/></radialGradient>
      ${[['red', '#ff5a63', '#b0101f', '#5e0710'], ['gold', '#ffe39a', '#cf9a2e', '#6a4410'], ['blue', '#8fb8ff', '#2a56b0', '#0f2353'], ['silver', '#ffffff', '#b9c3cc', '#5b6670'], ['plum', '#e3a0f0', '#7a2f95', '#33103f']].map(([k, a, b, c]) => `<radialGradient id="nc-orn-${k}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`).join('')}
      <pattern id="nc-damask" width="60" height="80" patternUnits="userSpaceOnUse"><path d="M30 8 C40 22 42 34 30 48 C18 34 20 22 30 8Z" fill="#c2414c" opacity=".14"/><circle cx="30" cy="62" r="4" fill="#c2414c" opacity=".14"/></pattern>
      <filter id="nc-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="nc-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".5"/></filter>
      <clipPath id="nc-stage"><path d="M180 870 V250 Q180 160 300 156 H1300 Q1420 160 1420 250 V870Z"/></clipPath>
    </defs>`);

    /* ---------- auditorium walls and boxes ---------- */
    add(`<rect width="${W}" height="${H}" fill="url(#nc-wall)"/><rect width="${W}" height="${H}" fill="url(#nc-damask)"/>`);
    [[0, 260], [0, 560], [1600, 260], [1600, 560]].forEach(([x, y]) => {
      const dir = x ? -1 : 1, bx = x ? 1460 : 10;
      add(`<g filter="url(#nc-shadow)"><path d="M${bx} ${y} h130 v90 q-65 40 -130 0Z" fill="#7a0f1c"/><path d="M${bx} ${y} h130" stroke="url(#nc-giltV)" stroke-width="8"/><path d="M${bx} ${y + 90} q65 40 130 0" stroke="url(#nc-giltV)" stroke-width="5" fill="none"/>
        <path d="M${bx + 10} ${y - 110} h110 v100 h-110Z" fill="#2a0408"/><path d="M${bx + 6} ${y - 116} q59 -40 118 0" stroke="url(#nc-giltV)" stroke-width="5" fill="none"/>
        <circle cx="${bx + 40}" cy="${y - 40}" r="10" fill="#14080a"/><path d="M${bx + 26} ${y - 2} q14 -26 28 0Z" fill="#14080a"/><circle cx="${bx + 86}" cy="${y - 44}" r="9" fill="#14080a"/><path d="M${bx + 72} ${y - 2} q14 -28 28 0Z" fill="#14080a"/></g>`);
      const lx = bx + (dir > 0 ? 140 : -10);
      add(`<rect x="${lx - 3}" y="${y - 70}" width="6" height="30" fill="url(#nc-giltV)"/><path d="M${lx - 9} ${y - 72} h18 l-4 -16 h-10Z" fill="#ffe6a0"/>`);
      lights.push({ x: lx, y: y - 80, c: '#ffd890', r: 4 });
    });

    /* ---------- the stage (inside the proscenium) ---------- */
    add(`<g clip-path="url(#nc-stage)">`);
    add(`<rect x="180" y="150" width="1240" height="720" fill="url(#nc-backdrop)"/>`);
    let st = '';
    for (let i = 0; i < 120; i++) st += `<circle cx="${f(rr(200, 1400))}" cy="${f(rr(170, 480))}" r="${f(rr(0.6, 2))}" fill="#fff" opacity="${f(rr(0.4, 1))}"/>`;
    add(st);
    add(`<circle cx="1120" cy="300" r="110" fill="url(#nc-moon)"/><circle cx="1120" cy="300" r="34" fill="#fff6d8"/>`);
    // painted backdrop hills & stylised trees
    add(`<path d="M180 560 Q360 470 560 530 Q760 590 980 510 Q1200 440 1420 540 V870 H180Z" fill="#a8bde0"/><path d="M180 620 Q420 560 700 610 Q980 660 1220 590 Q1340 560 1420 600 V870 H180Z" fill="#d7e3f4"/>`);
    let bt = '';
    for (let i = 0; i < 18; i++) {
      const x = rr(200, 1400), base = rr(560, 640), h = rr(60, 140);
      bt += `<path d="M${f(x)} ${f(base - h)} L${f(x - h * 0.3)} ${f(base)} H${f(x + h * 0.3)}Z" fill="${pick(['#1d4d6a', '#245a78', '#173f5a'])}"/><path d="M${f(x)} ${f(base - h)} L${f(x - h * 0.14)} ${f(base - h * 0.5)} L${f(x + h * 0.1)} ${f(base - h * 0.55)}Z" fill="#eef4ff" opacity=".8"/>`;
    }
    add(bt);
    // stage floor with perspective boards
    add(`<path d="M180 700 H1420 V870 H180Z" fill="url(#nc-floor)"/>`);
    let fb = '';
    for (let i = -14; i <= 14; i++) fb += `<path d="M${800 + i * 30} 700 L${800 + i * 70} 870" stroke="#3a1f10" stroke-width="2" opacity=".6"/>`;
    for (let y = 720; y < 870; y += 28) fb += `<path d="M180 ${y} H1420" stroke="#3a1f10" stroke-width="1.5" opacity=".35"/>`;
    add(fb);
    add(`<path d="M180 704 Q400 690 600 708 Q800 724 1000 706 Q1200 690 1420 706 V720 H180Z" fill="#eef4ff" opacity=".85"/>`);
    // spotlight pools
    add(`<ellipse cx="470" cy="790" rx="170" ry="40" fill="url(#nc-pool)"/><ellipse cx="1130" cy="790" rx="170" ry="40" fill="url(#nc-pool)"/><ellipse cx="800" cy="760" rx="260" ry="50" fill="url(#nc-pool)" opacity=".7"/>`);

    /* the grand tree */
    const cx = 800;
    const tiers = [[560, 740, 230], [450, 630, 196], [350, 520, 160], [262, 420, 120], [196, 320, 80]];
    const tierPath = (y0, y1, hw) => {
      let d = `M${cx} ${y0} Q${f(cx - hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx - hw} ${y1}`;
      const n = Math.round(hw / 26), step = (2 * hw) / n;
      for (let i = 0; i < n; i++) d += ` Q${f(cx - hw + step * (i + 0.5))} ${y1 + 14} ${f(cx - hw + step * (i + 1))} ${i < n - 1 ? y1 - 3 : y1}`;
      return d + ` Q${f(cx + hw * 0.42)} ${f(y0 + (y1 - y0) * 0.6)} ${cx} ${y0}Z`;
    };
    add(`<rect x="${cx - 20}" y="720" width="40" height="40" fill="#4a2614"/><ellipse cx="${cx}" cy="760" rx="210" ry="24" fill="#a3172a"/><ellipse cx="${cx}" cy="756" rx="190" ry="18" fill="#f4eee2"/>`);
    tiers.forEach(([y0, y1, hw], i) => {
      if (i) add(`<path d="${tierPath(y0 + 12, y1 + 12, hw)}" fill="#000" opacity=".3" filter="url(#nc-soft)"/>`);
      add(`<path d="${tierPath(y0, y1, hw)}" fill="url(#nc-tree)"/>`);
      let nd = '';
      for (let k = 0; k < hw * 2; k++) {
        const y = rr(y0 + (y1 - y0) * 0.15, y1 + 4), span = hw * ((y - y0) / (y1 - y0)), x = cx + rr(-span, span) * 0.97, dir = x < cx ? -1 : 1, l = rr(9, 20);
        nd += `<path d="M${f(x)} ${f(y)} l${f(dir * l * 0.7)} ${f(l * 0.7)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round" opacity="${f(rr(0.5, 0.95))}"/>`;
      }
      add(nd);
      if (i < 4) add(`<path d="M${f(cx - hw * 0.55)} ${f(y0 + (y1 - y0) * 0.55)} Q${cx} ${f(y1 + 20)} ${f(cx + hw * 0.8)} ${f(y0 + (y1 - y0) * 0.78)}" stroke="#f3d27a" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 9"/>`);
    });
    const placed = [];
    const inTree = (x, y) => tiers.some(([y0, y1, hw]) => y > y0 + (y1 - y0) * 0.3 && y < y1 - 8 && Math.abs(x - cx) < hw * ((y - y0) / (y1 - y0)) * 0.85);
    const spot = (minD) => { for (let k = 0; k < 400; k++) { const x = rr(cx - 230, cx + 230), y = rr(200, 740); if (!inTree(x, y)) continue; if (placed.some((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < (minD + p[2]) ** 2)) continue; return [x, y]; } return null; };
    const ok = ['red', 'gold', 'blue', 'silver', 'plum'];
    for (let i = 0; i < 40; i++) { const p = spot(20); if (!p) continue; const r = rr(8, 14); placed.push([p[0], p[1], r]); add(`<rect x="${f(p[0] - 3)}" y="${f(p[1] - r - 5)}" width="6" height="6" rx="1" fill="#e2b04a"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r)}" fill="url(#nc-orn-${ok[i % ok.length]})"/>`); }
    for (let i = 0; i < 70; i++) { const p = spot(8); if (!p) continue; placed.push([p[0], p[1], 5]); add(bulb(p[0], p[1], BULB[i % BULB.length], 3.8)); }
    add(`<path d="${star(cx, 192, 34, 14)}" fill="#ffe08a" stroke="#a87a1c" stroke-width="2"/><path d="${star(cx, 192, 16, 7)}" fill="#fff6c8" opacity=".7"/>`);
    add(gift(640, 700, 70, 52, '#b3172b', '#f0d07a') + gift(880, 708, 80, 46, '#1f6b43', '#f0d07a') + gift(720, 724, 54, 34, '#2a5aa8', '#f4ede0') + gift(830, 728, 50, 30, '#e0b24a', '#b3172b'));

    /* nutcracker */
    add(`<g transform="translate(470 780)" filter="url(#nc-shadow)">
      <ellipse cx="0" cy="4" rx="70" ry="10" fill="#000" opacity=".35"/>
      <rect x="-50" y="-12" width="100" height="14" rx="3" fill="#2a8a4e"/><rect x="-50" y="-12" width="100" height="4" fill="#e2b04a"/>
      <rect x="-30" y="-110" width="24" height="98" fill="#1d3a8a"/><rect x="6" y="-110" width="24" height="98" fill="#1d3a8a"/>
      <rect x="-32" y="-44" width="28" height="34" rx="4" fill="#111"/><rect x="4" y="-44" width="28" height="34" rx="4" fill="#111"/><path d="M-30 -42 h24 M6 -42 h24" stroke="#e2b04a" stroke-width="2"/>
      <path d="M-44 -210 h88 l4 104 h-96Z" fill="url(#nc-coat)"/><path d="M-44 -200 L40 -114 M44 -200 L-40 -114" stroke="#f4eee2" stroke-width="10"/>
      ${[-180, -160, -140, -120].map((y) => `<circle cx="0" cy="${y}" r="4" fill="#ffe08a"/>`).join('')}
      <rect x="-46" y="-118" width="92" height="12" fill="#111"/><rect x="-8" y="-120" width="16" height="16" fill="#e2b04a"/>
      <path d="M-46 -210 l-22 6 v80 l18 4Z" fill="url(#nc-coat)"/><circle cx="-60" cy="-118" r="10" fill="#f4eee2"/>
      <path d="M46 -210 l26 10 l10 70 l-18 4Z" fill="url(#nc-coat)"/><circle cx="72" cy="-124" r="10" fill="#f4eee2"/>
      <path d="M76 -128 L120 -232" stroke="#d9dde6" stroke-width="5" stroke-linecap="round"/><rect x="64" y="-134" width="22" height="6" rx="2" fill="#e2b04a" transform="rotate(-24 75 -131)"/>
      <path d="M-56 -214 h112 l-8 -14 h-96Z" fill="#e2b04a"/>
      <rect x="-30" y="-288" width="60" height="70" rx="6" fill="#f2d1b0"/>
      <path d="M-34 -250 Q-40 -200 0 -196 Q40 -200 34 -250 L28 -232 Q0 -218 -28 -232Z" fill="#f4f4f4"/>
      <rect x="-20" y="-240" width="40" height="16" rx="3" fill="#fff"/><path d="M-20 -232 h40" stroke="#b03030" stroke-width="2"/>
      <path d="M-24 -254 q8 -6 16 0 M8 -254 q8 -6 16 0" stroke="#f4f4f4" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="-12" cy="-266" r="4" fill="#111"/><circle cx="12" cy="-266" r="4" fill="#111"/><circle cx="-11" cy="-267" r="1.3" fill="#fff"/><circle cx="13" cy="-267" r="1.3" fill="#fff"/>
      <circle cx="-20" cy="-250" r="6" fill="#f08a8a" opacity=".6"/><circle cx="20" cy="-250" r="6" fill="#f08a8a" opacity=".6"/>
      <path d="M0 -262 l6 12 h-12Z" fill="#e2a888"/>
      <path d="M-36 -280 h72 l-6 -84 h-60Z" fill="#111"/><rect x="-38" y="-292" width="76" height="14" rx="3" fill="#e2b04a"/>
      <path d="M-28 -320 h56 M-30 -340 h60" stroke="#e2b04a" stroke-width="3"/><path d="${star(0, -326, 10, 4)}" fill="#ffe08a"/>
      <path d="M18 -364 Q30 -410 48 -400 Q38 -388 28 -360Z" fill="#f4f4f4"/><path d="M24 -364 Q40 -396 54 -392" stroke="#b3172b" stroke-width="3" fill="none"/>
    </g>`);

    /* sugar-plum dancer */
    add(`<g transform="translate(1130 784)" filter="url(#nc-shadow)">
      <ellipse cx="0" cy="2" rx="60" ry="9" fill="#000" opacity=".3"/>
      <path d="M-4 0 L-10 -100 M6 0 L14 -100" stroke="#f9d8c8" stroke-width="9" stroke-linecap="round"/>
      <path d="M-6 -2 l2 -18 M6 -2 l-1 -18" stroke="#f6a8c8" stroke-width="7" stroke-linecap="round"/>
      <path d="M-12 -46 L-30 -90 M16 -46 L50 -84" stroke="#f9d8c8" stroke-width="9" stroke-linecap="round" opacity="0"/>
      <ellipse cx="0" cy="-104" rx="80" ry="16" fill="url(#nc-tutu)"/><ellipse cx="0" cy="-108" rx="72" ry="12" fill="#ffe4f0"/>
      ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 6.283; return `<circle cx="${f(Math.cos(a) * 66)}" cy="${f(-104 + Math.sin(a) * 12)}" r="3" fill="#fff" opacity=".7"/>`; }).join('')}
      <path d="M-18 -112 Q-22 -160 0 -168 Q22 -160 18 -112Z" fill="#f08ab8"/><path d="M-14 -150 h28" stroke="#ffe08a" stroke-width="2"/>
      <path d="M-14 -158 Q-50 -200 -30 -238" stroke="#f9d8c8" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M14 -158 Q50 -200 30 -238" stroke="#f9d8c8" stroke-width="8" fill="none" stroke-linecap="round"/>
      <rect x="-5" y="-180" width="10" height="14" fill="#f9d8c8"/>
      <circle cx="0" cy="-194" r="17" fill="#f9d8c8"/><path d="M-17 -196 Q-16 -214 0 -214 Q16 -214 17 -196 Q8 -206 0 -206 Q-8 -206 -17 -196Z" fill="#6b3a1c"/><circle cx="0" cy="-218" r="9" fill="#6b3a1c"/>
      <path d="M-10 -212 l4 -10 l6 6 l6 -6 l4 10Z" fill="#ffe08a"/>
      <path d="M-7 -192 q3 2 6 0 M2 -192 q3 2 6 0" stroke="#3a1a0a" stroke-width="1.6" fill="none"/><path d="M-4 -184 q4 3 8 0" stroke="#c4405a" stroke-width="2" fill="none"/>
      <circle cx="-10" cy="-186" r="3.5" fill="#f4a0b8" opacity=".6"/><circle cx="10" cy="-186" r="3.5" fill="#f4a0b8" opacity=".6"/>
    </g>`);
    // little sparkles around the dancer
    for (let i = 0; i < 10; i++) { const a = rr(0, 6.28), d = rr(80, 130); add(`<path d="${star(1130 + Math.cos(a) * d, 620 + Math.sin(a) * d * 0.7, 6, 2)}" fill="#fff6c8" opacity=".85"/>`); }

    /* mice */
    function mouse(x, y, s, flip, crown) {
      return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><path d="M22 -4 Q50 -2 52 -20" stroke="#8a8f9c" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-12" rx="24" ry="14" fill="#9aa0ad"/><ellipse cx="-22" cy="-18" rx="12" ry="10" fill="#9aa0ad"/><circle cx="-24" cy="-30" r="8" fill="#9aa0ad"/><circle cx="-24" cy="-30" r="4.5" fill="#f4b8c8"/><circle cx="-34" cy="-16" r="2.6" fill="#f08aa0"/><circle cx="-26" cy="-20" r="2" fill="#111"/>${crown ? '<path d="M-30 -30 l3 -10 l4 6 l4 -8 l3 12Z" fill="#ffe08a"/>' : ''}</g>`;
    }
    add(mouse(640, 846, 1, false, true) + mouse(980, 848, 0.9, true, false) + `<path d="M955 848 l20 -16 l10 16Z" fill="#f2c94c"/><circle cx="968" cy="842" r="2" fill="#d9a83a"/>`);
    add(`</g>`);

    /* ---------- curtains ---------- */
    add(`<path d="M180 150 H420 Q380 360 410 520 Q300 560 260 870 H180Z" fill="url(#nc-velvet)"/><path d="M1420 150 H1180 Q1220 360 1190 520 Q1300 560 1340 870 H1420Z" fill="url(#nc-velvet)"/>`);
    add(`<path d="M220 160 Q230 400 220 860 M260 160 Q290 360 300 520 M330 160 Q350 320 370 500 M1380 160 Q1370 400 1380 860 M1340 160 Q1310 360 1300 520 M1270 160 Q1250 320 1230 500" stroke="#3a0408" stroke-width="4" opacity=".55" fill="none"/>`);
    add(`<path d="M300 520 Q360 506 430 522 Q380 540 300 534Z M1300 520 Q1240 506 1170 522 Q1220 540 1300 534Z" fill="url(#nc-giltV)"/><circle cx="420" cy="528" r="10" fill="url(#nc-giltV)"/><circle cx="1180" cy="528" r="10" fill="url(#nc-giltV)"/><path d="M420 538 v40 M414 540 v34 M426 540 v34 M1180 538 v40 M1174 540 v34 M1186 540 v34" stroke="#e2b04a" stroke-width="3"/>`);
    // valance swags
    let val = '';
    for (let i = 0; i < 6; i++) {
      const a = 180 + i * 206.7, b = a + 206.7;
      val += `<path d="M${f(a)} 150 Q${f((a + b) / 2)} 260 ${f(b)} 150 V150Z" fill="url(#nc-velvet)"/><path d="M${f(a)} 150 Q${f((a + b) / 2)} 260 ${f(b)} 150" stroke="url(#nc-giltV)" stroke-width="5" fill="none"/>`;
      for (let k = 1; k < 14; k++) { const t = k / 14, x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * ((a + b) / 2) + t * t * b, y = (1 - t) * (1 - t) * 150 + 2 * (1 - t) * t * 260 + t * t * 150; val += `<path d="M${f(x)} ${f(y)} v12" stroke="#e2b04a" stroke-width="2.5"/>`; }
    }
    add(val);
    for (let i = 0; i <= 6; i++) add(`<path d="M${f(180 + i * 206.7)} 150 v40" stroke="url(#nc-giltV)" stroke-width="5"/><ellipse cx="${f(180 + i * 206.7)}" cy="196" rx="9" ry="14" fill="url(#nc-giltV)"/>`);

    /* ---------- gilt proscenium ---------- */
    add(`<path d="M0 0 H1600 V1000 H1420 V250 Q1420 160 1300 156 H300 Q180 160 180 250 V1000 H0Z" fill="none"/>`);
    add(`<g filter="url(#nc-shadow)">
      <path d="M150 1000 V250 Q150 130 300 126 H1300 Q1450 130 1450 250 V1000 H1420 V250 Q1420 160 1300 156 H300 Q180 160 180 250 V1000Z" fill="url(#nc-gilt)"/>
      <path d="M136 1000 V250 Q136 116 300 112 H1300 Q1464 116 1464 250 V1000" stroke="url(#nc-giltV)" stroke-width="6" fill="none"/>
      <path d="M186 1000 V252 Q186 166 300 162 H1300 Q1414 166 1414 252 V1000" stroke="#5a3a10" stroke-width="3" fill="none"/>
    </g>`);
    // columns ornaments
    for (let y = 300; y < 860; y += 70) add(`<circle cx="165" cy="${y}" r="5" fill="#fff1b0"/><circle cx="1435" cy="${y}" r="5" fill="#fff1b0"/>`);
    // cartouche plaque for the title
    add(`<g filter="url(#nc-shadow)">
      <path d="M520 60 Q520 30 560 30 H1040 Q1080 30 1080 60 V112 Q1080 140 1040 140 H560 Q520 140 520 112Z" fill="url(#nc-gilt)"/>
      <path d="M538 64 Q538 46 566 46 H1034 Q1062 46 1062 64 V108 Q1062 124 1034 124 H566 Q538 124 538 108Z" fill="#6e0a18"/>
      <path d="M546 68 Q546 54 570 54 H1030 Q1054 54 1054 68 V104 Q1054 116 1030 116 H570 Q546 116 546 104Z" fill="none" stroke="#e2b04a" stroke-width="1.5"/>
      <path d="M520 86 Q480 70 470 92 Q462 112 490 116 Q470 100 486 92 Q500 88 520 100Z M1080 86 Q1120 70 1130 92 Q1138 112 1110 116 Q1130 100 1114 92 Q1100 88 1080 100Z" fill="url(#nc-giltV)"/>
      <path d="M760 30 Q800 0 840 30Z" fill="url(#nc-giltV)"/><circle cx="800" cy="18" r="8" fill="#b3172b"/>
    </g>`);

    /* ---------- footlights, orchestra, audience ---------- */
    add(`<rect x="150" y="866" width="1300" height="20" fill="#2a1008"/><rect x="150" y="866" width="1300" height="4" fill="url(#nc-giltV)"/>`);
    for (let x = 220; x <= 1380; x += 58) {
      add(`<path d="M${x - 14} 870 Q${x} 852 ${x + 14} 870Z" fill="#c9a24a"/><ellipse cx="${x}" cy="866" rx="6" ry="4" fill="#fff4c8"/>`);
      lights.push({ x, y: 864, c: '#ffe8a8', r: 3.4 });
    }
    add(`<rect x="0" y="886" width="${W}" height="114" fill="#0c0204"/>`);
    let aud = '';
    for (let row = 0; row < 2; row++) for (let x = 20 + row * 30; x < W; x += rr(52, 70)) {
      const y = 940 + row * 40, r = rr(16, 22);
      aud += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${row ? '#050102' : '#14070a'}"/><rect x="${f(x - r * 1.3)}" y="${f(y + r * 0.6)}" width="${f(r * 2.6)}" height="40" rx="${f(r)}" fill="${row ? '#050102' : '#14070a'}"/>`;
      if (R() < 0.18) aud += `<path d="M${f(x - r)} ${f(y - r * 0.4)} q${f(r)} -${f(r * 1.2)} ${f(r * 2)} 0" fill="#14070a"/>`;
    }
    add(aud);
    // conductor with baton
    add(`<g transform="translate(800 920)" fill="#0a0203"><circle cx="0" cy="-16" r="16"/><path d="M-26 40 Q-28 0 0 -2 Q28 0 26 40Z"/><path d="M20 4 L50 -26" stroke="#0a0203" stroke-width="8" stroke-linecap="round"/><path d="M50 -26 L76 -54" stroke="#f4eee2" stroke-width="2.5"/></g>`);

    add(`<rect width="${W}" height="${H}" fill="url(#nc-foot)"/><rect width="${W}" height="${H}" fill="url(#nc-vig)"/>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  /** Two spotlight beams sweeping gently over the dancers. */
  function spotlights(ctx, t) {
    ctx.globalCompositeOperation = 'lighter';
    [[300, 160, 470, 780, 0], [1300, 160, 1130, 780, 2]].forEach(([sx, sy, tx, ty, ph]) => {
      const x = tx + Math.sin(t * 0.5 + ph) * 26;
      const g = ctx.createLinearGradient(sx, sy, x, ty);
      g.addColorStop(0, 'rgba(255,244,210,.2)'); g.addColorStop(1, 'rgba(255,244,210,.04)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(sx - 10, sy); ctx.lineTo(sx + 10, sy); ctx.lineTo(x + 130, ty); ctx.lineTo(x - 130, ty); ctx.closePath(); ctx.fill();
    });
  }

  A.designs.nutcracker = {
    id: 'nutcracker',
    name: 'Nutcracker Night',
    blurb: 'Velvet curtains, sugar plums and a toy soldier on stage.',
    width: W,
    height: H,
    build,
    title: { path: 'M570 100 L1030 100', size: 40, maxWidth: 440, fill: '#fff1c8', stroke: '#3a0408' },
    effects: [
      { type: 'custom', draw: spotlights },
      { type: 'snow', rect: [190, 160, 1220, 700], count: 90, a: 0.8 },
      { type: 'twinkle' },
      { type: 'star', x: 800, y: 192, r: 60 },
      { type: 'glow', x: 800, y: 870, r: 260, color: '255,226,160', a: 0.14, speed: 0.8 },
    ],
    layout: 'nutcracker',
    keepOut: [[500, 18, 600, 132]],
    day24: { x: 715, y: 390, w: 170, h: 150 },
  };
})();
