/* Design — "Santa's Workshop"
   A warm timber workshop on Christmas Eve: elves at their benches, shelves of toys,
   a pot-bellied stove, a long list on a scroll, presents riding a conveyor belt and
   snow falling past the big arched window. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(31224);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff5d4d', '#6cc8ff', '#8ff07a', '#ff9be3', '#fff1b8', '#ffa94d'];
    const GREENS = ['#173f27', '#1d4d2f', '#235c37', '#2c6b40'];
    const NEEDLE = ['#3d8a52', '#4f9b5f', '#2f7344', '#5aa86a'];
    const TOY = ['#c4222f', '#2a5aa8', '#e0b24a', '#1f7d45', '#7a3fa0', '#f08a2a'];

    function bulb(x, y, c, r = 4) {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.5)}" fill="${c}" opacity=".22"/><rect x="${f(x - 2)}" y="${f(y - r - 4)}" width="4" height="4" rx="1" fill="#2a2a22"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.25)}" ry="${f(r * 0.45)}" fill="#fff" opacity=".7"/>`;
    }
    function sprig(x, y, r) {
      let s = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(GREENS)}"/>`;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + rr(-0.3, 0.3), l = r * rr(0.9, 1.4); s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="${pick(NEEDLE)}" stroke-width="2.2" stroke-linecap="round"/>`; }
      return s;
    }
    function bow(x, y, s = 1, color = '#b3172b', dark = '#7d0d1c') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-4 4 L-16 40 L-9 36 L-4 44 L0 8Z" fill="${dark}"/><path d="M4 4 L16 40 L9 36 L4 44 L0 8Z" fill="${dark}"/><path d="M0 0 C-12 -20 -34 -16 -30 -2 C-27 10 -12 8 0 0Z" fill="${color}"/><path d="M0 0 C12 -20 34 -16 30 -2 C27 10 12 8 0 0Z" fill="${color}"/><ellipse cx="0" cy="1" rx="6" ry="7" fill="${dark}"/><ellipse cx="-1" cy="-1" rx="3" ry="3" fill="${color}"/></g>`;
    }
    function gift(x, y, w, h, fill, rib, d = 10) {
      return `<g><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x} ${y} l${d} ${-d * 0.6} h${w} l${-d} ${d * 0.6}Z" fill="#fff" opacity=".2"/>
        <path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="${fill}"/><path d="M${x + w} ${y} l${d} ${-d * 0.6} v${h} l${-d} ${d * 0.6}Z" fill="#000" opacity=".3"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/><rect x="${x + w / 2 - 4}" y="${y}" width="8" height="${h}" fill="${rib}"/><rect x="${x}" y="${y + h / 2 - 4}" width="${w}" height="8" fill="${rib}"/>
        <path d="M${x + w / 2 - 4} ${y} l${d} ${-d * 0.6} h8 l${-d} ${d * 0.6}Z" fill="${rib}"/></g>${bow(x + w / 2 + d / 2, y - d * 0.3, Math.min(0.5, w / 120), rib, '#00000055')}`;
    }

    /* ---------- toys ---------- */
    function teddy(x, y, s, c = '#a8682f') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><circle cx="-14" cy="-58" r="8" fill="${c}"/><circle cx="14" cy="-58" r="8" fill="${c}"/><circle cx="-14" cy="-58" r="4" fill="#e8c9a0"/><circle cx="14" cy="-58" r="4" fill="#e8c9a0"/>
        <ellipse cx="0" cy="-16" rx="20" ry="18" fill="${c}"/><ellipse cx="0" cy="-12" rx="11" ry="10" fill="#e8c9a0"/><circle cx="0" cy="-46" r="17" fill="${c}"/><ellipse cx="0" cy="-41" rx="8" ry="6" fill="#e8c9a0"/>
        <circle cx="-6" cy="-49" r="2" fill="#1a0c06"/><circle cx="6" cy="-49" r="2" fill="#1a0c06"/><circle cx="0" cy="-43" r="2.4" fill="#1a0c06"/>
        <ellipse cx="-18" cy="-2" rx="8" ry="6" fill="${c}"/><ellipse cx="18" cy="-2" rx="8" ry="6" fill="${c}"/><path d="M-8 -30 l8 5 l8 -5 l-2 8 h-12Z" fill="#c4222f"/></g>`;
    }
    function drum(x, y, s, c = '#c4222f') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-22" y="-34" width="44" height="34" fill="${c}"/><path d="M-22 -34 L-8 0 L4 -34 L16 0 L22 -20" stroke="#f0d07a" stroke-width="2.5" fill="none"/><ellipse cx="0" cy="-34" rx="22" ry="7" fill="#f4ecd8" stroke="#c9a24a" stroke-width="3"/><rect x="-22" y="-4" width="44" height="4" fill="#c9a24a"/><path d="M-6 -40 l-16 -16 M6 -40 l16 -16" stroke="#7a4a26" stroke-width="3" stroke-linecap="round"/></g>`;
    }
    function rockingHorse(x, y, s, c = '#f4ecd8') {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-44 0 Q0 18 44 0" stroke="#7a2a1a" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M-28 4 L-22 -24 M-12 8 L-10 -24 M12 8 L10 -24 M28 4 L22 -24" stroke="${c}" stroke-width="5"/>
        <ellipse cx="0" cy="-30" rx="30" ry="12" fill="${c}"/><path d="M22 -36 L34 -60 Q40 -66 46 -60 L44 -48 Q34 -46 30 -32Z" fill="${c}"/>
        <path d="M24 -42 Q20 -58 30 -64" stroke="#c4222f" stroke-width="5" fill="none"/><circle cx="40" cy="-58" r="2" fill="#1a0c06"/>
        <path d="M-28 -32 q-14 4 -16 18" stroke="#c4222f" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="-10" y="-42" width="18" height="8" rx="3" fill="#c4222f"/></g>`;
    }
    function toyTrain(x, y, s) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-40" y="-26" width="34" height="18" fill="#2a5aa8"/><rect x="-38" y="-44" width="16" height="18" fill="#c4222f"/><rect x="-14" y="-40" width="6" height="14" fill="#1a1a22"/>
        <rect x="0" y="-24" width="30" height="16" fill="#e0b24a"/><rect x="-46" y="-12" width="80" height="4" fill="#1a1a22"/>
        <circle cx="-32" cy="-4" r="6" fill="#1a1a22"/><circle cx="-14" cy="-4" r="6" fill="#1a1a22"/><circle cx="8" cy="-4" r="6" fill="#1a1a22"/><circle cx="24" cy="-4" r="6" fill="#1a1a22"/></g>`;
    }
    function soldier(x, y, s) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-7" y="-20" width="5" height="20" fill="#1a1a22"/><rect x="2" y="-20" width="5" height="20" fill="#1a1a22"/><rect x="-9" y="-46" width="18" height="28" fill="#c4222f"/><path d="M-9 -40 h18 M-9 -30 h18" stroke="#e0b24a" stroke-width="2"/><circle cx="0" cy="-54" r="8" fill="#f2c9a0"/><rect x="-8" y="-76" width="16" height="18" rx="3" fill="#1a1a22"/><rect x="-9" y="-60" width="18" height="3" fill="#e0b24a"/></g>`;
    }
    function ball(x, y, r) {
      const a = pick(TOY), b = pick(TOY);
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${a}"/><path d="M${f(x - r)} ${f(y)} Q${f(x)} ${f(y - r * 0.6)} ${f(x + r)} ${f(y)} Q${f(x)} ${f(y + r * 0.6)} ${f(x - r)} ${f(y)}Z" fill="${b}"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.4)}" r="${f(r * 0.22)}" fill="#fff" opacity=".6"/>`;
    }
    function blocks(x, y, s) {
      let o = `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">`;
      [[-30, -20], [-8, -20], [14, -20], [-19, -42], [3, -42], [-8, -64]].forEach(([bx, by], i) => {
        o += `<rect x="${bx}" y="${by}" width="20" height="20" rx="2" fill="${TOY[i % TOY.length]}"/><rect x="${bx + 5}" y="${by + 5}" width="10" height="10" rx="1" fill="#fff" opacity=".35"/>`;
      });
      return o + '</g>';
    }
    function spinTop(x, y, s) {
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M0 0 L-20 -22 Q0 -40 20 -22Z" fill="${pick(TOY)}"/><path d="M-20 -22 Q0 -40 20 -22 Q0 -16 -20 -22Z" fill="${pick(TOY)}"/><rect x="-2" y="-44" width="4" height="12" fill="#7a4a26"/></g>`;
    }
    function doll(x, y, s) {
      const c = pick(['#c4222f', '#7a3fa0', '#2a5aa8']);
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-16 0 L-8 -34 H8 L16 0Z" fill="${c}"/><circle cx="0" cy="-44" r="11" fill="#f6d3b0"/><path d="M-12 -46 Q-12 -60 0 -60 Q12 -60 12 -46 Q10 -54 0 -54 Q-10 -54 -12 -46Z" fill="#e0a040"/><circle cx="-4" cy="-44" r="1.5" fill="#1a0c06"/><circle cx="4" cy="-44" r="1.5" fill="#1a0c06"/><circle cx="-6" cy="-40" r="2" fill="#f4a0a0" opacity=".7"/><circle cx="6" cy="-40" r="2" fill="#f4a0a0" opacity=".7"/></g>`;
    }

    /* ---------- an elf ---------- */
    function elf(x, y, s, flip, opts = {}) {
      const tunic = opts.tunic || '#1f7d45', hat = opts.hat || '#1f7d45';
      const sx = flip ? -s : s;
      return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sx)} ${f(s)})">
        <ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity=".25"/>
        <rect x="-14" y="-46" width="10" height="44" fill="#f4ecd8"/><rect x="4" y="-46" width="10" height="44" fill="#f4ecd8"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="-14" y="${-44 + i * 11}" width="10" height="5" fill="#c4222f"/><rect x="4" y="${-44 + i * 11}" width="10" height="5" fill="#c4222f"/>`).join('')}
        <path d="M-16 -4 h14 q-2 8 -18 6 q-8 -2 -10 -8 q6 2 14 2Z" fill="#6b3a1c"/><path d="M2 -4 h14 q10 0 14 -6 q-2 8 -12 12 h-16Z" fill="#6b3a1c"/>
        <path d="M-26 -44 L-20 -96 H20 L26 -44Z" fill="${tunic}"/><rect x="-24" y="-60" width="48" height="8" fill="#3a1f0c"/><rect x="-5" y="-62" width="10" height="12" fill="#e0b24a"/>
        <path d="M-22 -96 l-22 34 l8 4 l18 -26Z" fill="${tunic}"/><circle cx="-38" cy="-58" r="7" fill="#f2c9a0"/>
        <path d="M22 -96 l20 26 l-6 6 l-18 -18Z" fill="${tunic}"/><circle cx="40" cy="-66" r="7" fill="#f2c9a0"/>
        <path d="M-26 -98 ${[0, 1, 2, 3, 4].map((i) => `q${5.2} 10 ${10.4} 0`).join(' ')} v-6 h-52Z" fill="#c4222f"/>
        ${[-20, -10, 0, 10, 20].map((bx) => `<circle cx="${bx}" cy="-92" r="2.6" fill="#f0d07a"/>`).join('')}
        <path d="M-26 -126 l-12 -12 l10 20Z M26 -126 l12 -12 l-10 20Z" fill="#f2c9a0"/>
        <circle cx="0" cy="-122" r="24" fill="#f2c9a0"/>
        <path d="M-22 -128 Q-18 -146 0 -146 Q18 -146 22 -128 Q14 -136 0 -136 Q-14 -136 -22 -128Z" fill="#8a4a1c"/>
        <circle cx="-14" cy="-114" r="5" fill="#f08a8a" opacity=".55"/><circle cx="14" cy="-114" r="5" fill="#f08a8a" opacity=".55"/>
        <circle cx="-8" cy="-124" r="2.6" fill="#1a0c06"/><circle cx="8" cy="-124" r="2.6" fill="#1a0c06"/><path d="M-7 -112 q7 6 14 0" stroke="#7a2a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="0" cy="-118" r="3" fill="#e8a888"/>
        <path d="M-26 -136 Q-20 -176 10 -188 Q36 -196 52 -176 Q36 -182 24 -174 Q22 -150 26 -136Z" fill="${hat}"/>
        <rect x="-28" y="-142" width="56" height="10" rx="5" fill="#c4222f"/><circle cx="52" cy="-176" r="7" fill="#f0d07a"/><circle cx="50" cy="-178" r="2" fill="#fff"/>
      </g>`;
    }

    /* ---------- defs ---------- */
    add(`<defs>
      <linearGradient id="ws-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3016"/><stop offset=".6" stop-color="#7a4422"/><stop offset="1" stop-color="#5e3418"/></linearGradient>
      <linearGradient id="ws-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3c1e"/><stop offset="1" stop-color="#3a1f0c"/></linearGradient>
      <linearGradient id="ws-shelf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6234"/><stop offset="1" stop-color="#5e3418"/></linearGradient>
      <linearGradient id="ws-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2814"/><stop offset="1" stop-color="#6e3e1e"/></linearGradient>
      <linearGradient id="ws-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#091a3a"/><stop offset=".7" stop-color="#22457a"/><stop offset="1" stop-color="#4a6aa0"/></linearGradient>
      <linearGradient id="ws-iron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1a1f"/><stop offset=".4" stop-color="#3a3b44"/><stop offset="1" stop-color="#121216"/></linearGradient>
      <linearGradient id="ws-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".4" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <linearGradient id="ws-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23240"/><stop offset=".5" stop-color="#a8192a"/><stop offset="1" stop-color="#7c0f1e"/></linearGradient>
      <linearGradient id="ws-ribbonDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1422"/><stop offset="1" stop-color="#560a15"/></linearGradient>
      <linearGradient id="ws-paper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcbc"/><stop offset=".5" stop-color="#fbf3df"/><stop offset="1" stop-color="#e2d2ae"/></linearGradient>
      <linearGradient id="ws-candle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dcc0"/><stop offset=".4" stop-color="#fff8e8"/><stop offset="1" stop-color="#d6c4a0"/></linearGradient>
      <radialGradient id="ws-fireLight" cx="170" cy="700" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffa050" stop-opacity=".3"/><stop offset="1" stop-color="#ffa050" stop-opacity="0"/></radialGradient>
      <radialGradient id="ws-warm" cx="800" cy="520" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd28a" stop-opacity=".18"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></radialGradient>
      <radialGradient id="ws-vig" cx="800" cy="500" r="1050" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140602" stop-opacity=".62"/></radialGradient>
      <radialGradient id="ws-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff9e0" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></radialGradient>
      <radialGradient id="ws-cglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <pattern id="ws-gstripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#f4ede0"/><rect width="6" height="14" fill="#c4222f"/></pattern>
      <pattern id="ws-gdots" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#2a5aa8"/><circle cx="7" cy="7" r="2.2" fill="#e8f0ff"/></pattern>
      <pattern id="ws-gstar" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#20553a"/><circle cx="10" cy="10" r="2.6" fill="#e9c060"/></pattern>
      <filter id="ws-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="ws-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000" flood-opacity=".45"/></filter>
    </defs>`);

    /* ---------- walls, beams, floor ---------- */
    add(`<rect width="${W}" height="800" fill="url(#ws-wall)"/>`);
    let planks = '';
    for (let x = 0; x < W; x += 58) planks += `<rect x="${x}" y="0" width="2.5" height="800" fill="#2e1608" opacity=".6"/><rect x="${x + 3}" y="0" width="1.5" height="800" fill="#b07a46" opacity=".25"/>`;
    for (let i = 0; i < 40; i++) planks += `<ellipse cx="${f(rr(10, W))}" cy="${f(rr(20, 780))}" rx="${f(rr(4, 9))}" ry="${f(rr(2, 4))}" fill="#3a1d0b" opacity=".5"/>`;
    add(planks);
    add(`<rect y="0" width="${W}" height="30" fill="url(#ws-beam)"/><rect y="28" width="${W}" height="5" fill="#2a1408"/>`);
    [180, 820, 1420].forEach((x) => add(`<rect x="${x - 16}" y="0" width="32" height="800" fill="url(#ws-beam)" opacity=".9"/><rect x="${x - 16}" y="0" width="4" height="800" fill="#b07a46" opacity=".3"/>`));
    add(`<rect y="790" width="${W}" height="210" fill="url(#ws-floor)"/>`);
    let fl = '';
    for (let y = 792, h = 18, r = 0; y < H; y += h, h = Math.round(h * 1.16), r++) {
      fl += `<rect y="${y}" width="${W}" height="${h}" fill="${r % 2 ? '#4f2c16' : '#5e351b'}"/><rect y="${y}" width="${W}" height="1.6" fill="#24110a" opacity=".8"/>`;
      for (let x = (r * 151) % 240; x < W; x += 240 + (r % 3) * 50) fl += `<rect x="${x}" y="${y}" width="2" height="${h}" fill="#24110a" opacity=".7"/>`;
    }
    add(fl);
    add(`<rect y="782" width="${W}" height="14" fill="#2a1409"/>`);
    // wood shavings
    for (let i = 0; i < 26; i++) add(`<path d="M${f(rr(280, 1320))} ${f(rr(900, 990))} q6 -8 12 0 q-6 6 -12 0" stroke="#e0b07a" stroke-width="2" fill="none" opacity=".8"/>`);

    /* ---------- the window ---------- */
    add(`<path d="M630 528 V300 Q630 186 800 184 Q970 186 970 300 V528Z" fill="#7a4a26"/>`);
    add(`<path d="M648 516 V304 Q648 202 800 200 Q952 202 952 304 V516Z" fill="url(#ws-night)"/>`);
    let wst = '';
    for (let i = 0; i < 40; i++) wst += `<circle cx="${f(rr(656, 944))}" cy="${f(rr(210, 400))}" r="${f(rr(0.6, 1.6))}" fill="#fff" opacity="${f(rr(0.4, 1))}"/>`;
    add(wst);
    add(`<circle cx="880" cy="262" r="60" fill="url(#ws-moon)"/><circle cx="880" cy="262" r="18" fill="#fff6d8"/>`);
    // snowy village + north pole outside
    add(`<path d="M648 440 Q720 410 800 430 Q880 448 952 420 V516 H648Z" fill="#dce8f8"/>`);
    [[680, 450, '#7a3a26'], [740, 440, '#5a3a6a'], [860, 446, '#2f5a46'], [910, 452, '#7a3a26']].forEach(([x, y, c]) => add(`<rect x="${x - 18}" y="${y - 20}" width="36" height="26" fill="${c}"/><path d="M${x - 24} ${y - 18} L${x} ${y - 40} L${x + 24} ${y - 18}Z" fill="#f4f9ff"/><rect x="${x - 6}" y="${y - 12}" width="10" height="9" fill="#ffcf70"/>`));
    add(`<rect x="794" y="350" width="12" height="110" fill="#f4f4f4"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M794 ${356 + i * 16} l12 -8 v6 l-12 8Z" fill="#c4222f"/>`).join('')}<circle cx="800" cy="346" r="9" fill="url(#ws-gold)"/>`);
    add(`<path d="M648 486 Q720 466 800 480 Q880 494 952 474 V516 H648Z" fill="#f4f9ff"/>`);
    add(`<path d="M800 200 V516 M648 360 H952" stroke="#7a4a26" stroke-width="10"/><path d="M648 304 Q648 202 800 200 Q952 202 952 304" stroke="#5e3418" stroke-width="4" fill="none"/>`);
    add(`<rect x="616" y="520" width="368" height="20" rx="3" fill="#8a5a30"/><rect x="616" y="520" width="368" height="4" fill="#c48d55"/>`);
    // candles on the sill
    [[668, 46], [700, 64], [900, 64], [932, 46]].forEach(([x, h]) => {
      add(`<rect x="${x - 13}" y="512" width="26" height="8" rx="2" fill="url(#ws-gold)"/><rect x="${x - 9}" y="${520 - h}" width="18" height="${h - 8}" rx="3" fill="url(#ws-candle)"/><path d="M${x} ${520 - h} v-7" stroke="#2a1a10" stroke-width="2"/><circle cx="${x}" cy="${520 - h - 14}" r="30" fill="url(#ws-cglow)"/>`);
      candles.push({ x, y: 520 - h - 9, s: 1 });
    });
    // wreath on the window
    let wr = '';
    for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.283; wr += sprig(800 + Math.cos(a) * 32, 280 + Math.sin(a) * 32, 9); }
    add(wr + bow(800, 312, 0.6));

    /* ---------- shelves of toys ---------- */
    function shelves(x0, x1, rows, items) {
      let s = `<rect x="${x0 - 12}" y="${rows[0] - 130}" width="12" height="${rows[rows.length - 1] - rows[0] + 150}" fill="url(#ws-shelf)"/><rect x="${x1}" y="${rows[0] - 130}" width="12" height="${rows[rows.length - 1] - rows[0] + 150}" fill="url(#ws-shelf)"/>`;
      rows.forEach((y) => { s += `<rect x="${x0 - 14}" y="${y}" width="${x1 - x0 + 40}" height="14" fill="url(#ws-shelf)"/><rect x="${x0 - 14}" y="${y + 14}" width="${x1 - x0 + 40}" height="6" fill="#2a1408" opacity=".6"/>`; });
      return s + items;
    }
    add(`<g filter="url(#ws-shadow)">${shelves(40, 400, [300, 470, 640],
      teddy(80, 300, 1) + drum(150, 300, 1) + doll(205, 300, 1) + soldier(245, 300, 1) + soldier(272, 300, 1) + toyTrain(340, 300, 1.05)
      + rockingHorse(110, 470, 1.15) + ball(205, 452, 18) + blocks(275, 470, 0.95) + teddy(360, 470, 0.95, '#d9a066')
      + spinTop(70, 640, 1.2) + drum(130, 640, 1.2, '#2a5aa8') + doll(190, 640, 1.1) + ball(240, 622, 18) + toyTrain(320, 640, 1)
    )}</g>`);
    add(`<g filter="url(#ws-shadow)">${shelves(1200, 1560, [300, 470, 640],
      toyTrain(1250, 300, 1) + teddy(1330, 300, 1.05, '#d9a066') + ball(1385, 282, 18) + drum(1440, 300, 1) + doll(1500, 300, 1.05) + spinTop(1540, 300, 0.9)
      + blocks(1240, 470, 1) + soldier(1300, 470, 1.05) + soldier(1326, 470, 1.05) + rockingHorse(1420, 470, 1.15, '#d9a066') + spinTop(1520, 470, 1.1)
      + teddy(1240, 640, 1.05) + ball(1300, 622, 18) + toyTrain(1380, 640, 1) + drum(1460, 640, 1.1, '#1f7d45') + doll(1520, 640, 1)
    )}</g>`);

    /* ---------- clock (left of window) ---------- */
    add(`<g filter="url(#ws-shadow)" transform="translate(510 300)">
      <path d="M-50 -40 L0 -90 L50 -40 V60 H-50Z" fill="#6b3a1c"/><path d="M-58 -36 L0 -96 L58 -36" stroke="#3a1f0c" stroke-width="8" fill="none"/>
      <circle cx="0" cy="-12" r="34" fill="#f6efdc" stroke="url(#ws-gold)" stroke-width="5"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.283; return `<circle cx="${f(Math.cos(a) * 26)}" cy="${f(-12 + Math.sin(a) * 26)}" r="2.2" fill="#3a1f0c"/>`; }).join('')}
      <path d="M0 -12 L0 -34 M0 -12 L14 -2" stroke="#3a1f0c" stroke-width="3" stroke-linecap="round"/>
      <rect x="-18" y="30" width="36" height="24" rx="2" fill="#2a1408"/><path d="M0 60 V120" stroke="url(#ws-gold)" stroke-width="3"/><circle cx="0" cy="124" r="10" fill="url(#ws-gold)"/>
      <path d="M-20 64 V140 M20 64 V128" stroke="#2a1408" stroke-width="2"/><path d="M-20 140 l-6 10 h12Z M20 128 l-6 10 h12Z" fill="url(#ws-gold)"/>
      ${bow(0, -88, 0.5)}
    </g>`);

    /* ---------- naughty & nice scroll ---------- */
    add(`<g filter="url(#ws-shadow)">
      <rect x="1018" y="186" width="104" height="14" rx="7" fill="#7a4a26"/><circle cx="1018" cy="193" r="9" fill="url(#ws-gold)"/><circle cx="1122" cy="193" r="9" fill="url(#ws-gold)"/>
      <path d="M1026 196 H1114 V620 Q1114 650 1086 654 Q1100 640 1080 632 H1026Z" fill="url(#ws-paper)"/>
      <path d="M1080 632 Q1060 640 1066 660 Q1090 672 1112 660" fill="#e2d2ae"/>
      <ellipse cx="1092" cy="660" rx="22" ry="9" fill="#d9c79f"/><ellipse cx="1092" cy="660" rx="10" ry="4" fill="#bfa97f"/>
    </g>`);
    let lines = '';
    for (let y = 220; y < 620; y += 16) {
      const w = rr(30, 62);
      lines += `<path d="M1040 ${y} q${f(w / 4)} -3 ${f(w / 2)} 0 t${f(w / 2)} 0" stroke="#5a3a26" stroke-width="1.6" fill="none" opacity=".75"/>`;
      lines += R() < 0.82 ? `<path d="M1098 ${y - 2} l4 4 l7 -9" stroke="#1f7d45" stroke-width="2.2" fill="none" stroke-linecap="round"/>` : `<path d="M1098 ${y - 5} l8 8 M1106 ${y - 5} l-8 8" stroke="#c4222f" stroke-width="2" stroke-linecap="round"/>`;
    }
    add(lines);
    add(`<path d="M1038 204 h60" stroke="#8f1d2b" stroke-width="3" stroke-linecap="round"/>`);

    /* ---------- stove ---------- */
    add(`<rect x="152" y="40" width="22" height="520" fill="url(#ws-iron)"/><rect x="146" y="300" width="34" height="10" fill="#2a2a30"/>`);
    add(`<g filter="url(#ws-shadow)">
      <rect x="96" y="790" width="150" height="14" rx="4" fill="#2a2a30"/>
      <path d="M110 800 l-8 20 h14 l6 -20Z M232 800 l8 20 h-14 l-6 -20Z" fill="#1a1a1f"/>
      <path d="M130 560 h66 v20 Q246 610 246 690 Q246 780 196 800 H130 Q80 780 80 690 Q80 610 130 580Z" fill="url(#ws-iron)"/>
      <rect x="124" y="552" width="78" height="14" rx="4" fill="#2a2a30"/>
      <path d="M86 640 h154 M84 740 h158" stroke="#c9a24a" stroke-width="3" opacity=".7"/>
      <path d="M118 734 V680 Q118 650 163 648 Q208 650 208 680 V734Z" fill="#1a0a04"/>
      <path d="M118 734 V680 Q118 650 163 648 Q208 650 208 680 V734" stroke="#c9a24a" stroke-width="4" fill="none"/>
      <path d="M130 734 v-60 M146 734 v-74 M163 734 v-80 M180 734 v-74 M196 734 v-60" stroke="#2a2a30" stroke-width="3"/>
    </g>`);
    add(`<rect x="70" y="760" width="40" height="30" fill="#7a4a26"/>${[0, 1, 2].map((i) => `<circle cx="${74 + i * 12}" cy="772" r="6" fill="#a8682f" stroke="#5a3218" stroke-width="2"/>`).join('')}`);
    // kettle
    add(`<g transform="translate(163 552)"><path d="M-22 0 Q-24 -26 0 -28 Q24 -26 22 0Z" fill="#b3172b"/><path d="M18 -14 l18 -10" stroke="#b3172b" stroke-width="6" stroke-linecap="round"/><path d="M-14 -24 Q0 -44 14 -24" stroke="#2a2a30" stroke-width="3" fill="none"/></g>`);

    /* ---------- string lights along the ceiling ---------- */
    const hooks = [0, 200, 420, 640, 960, 1180, 1400, 1600];
    for (let i = 0; i < hooks.length - 1; i++) {
      const a = hooks[i], b = hooks[i + 1], cx = (a + b) / 2;
      add(`<path d="M${a} 34 Q${cx} 110 ${b} 34" stroke="#1a1a12" stroke-width="2" fill="none"/>`);
      for (let k = 1; k < 9; k++) {
        const t = k / 9, x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * cx + t * t * b, y = (1 - t) * (1 - t) * 34 + 2 * (1 - t) * t * 110 + t * t * 34;
        add(bulb(x, y + 6, BULB[(i * 3 + k) % BULB.length], 4.4));
      }
    }

    /* ---------- conveyor belt with presents ---------- */
    add(`<g filter="url(#ws-shadow)">
      <rect x="270" y="610" width="1060" height="26" rx="13" fill="#2a2a30"/><rect x="276" y="604" width="1048" height="10" rx="5" fill="#3a3b44"/>
      ${Array.from({ length: 22 }, (_, i) => `<circle cx="${290 + i * 49}" cy="623" r="8" fill="#5a5b66" stroke="#1a1a1f" stroke-width="2"/>`).join('')}
      <path d="M320 636 l-10 150 M560 636 l0 150 M1040 636 l0 150 M1280 636 l10 150" stroke="#3a3b44" stroke-width="10"/>
    </g>`);
    [[300, 'url(#ws-gstripe)', '#1f7d45', 54, 44], [372, '#2a5aa8', '#f0d07a', 44, 54], [440, 'url(#ws-gstar)', '#c4222f', 60, 40], [670, '#c4222f', '#f0d07a', 50, 48], [740, 'url(#ws-gdots)', '#f4ede0', 46, 38], [990, '#7a3fa0', '#e0b24a', 56, 46], [1062, 'url(#ws-gstripe)', '#2a5aa8', 44, 56], [1130, '#e0b24a', '#c4222f', 58, 42], [1210, 'url(#ws-gstar)', '#f0d07a', 48, 50]].forEach(([x, fill, rib, w, h]) => add(gift(x, 604 - h, w, h, fill, rib, 8)));
    add(`<g transform="translate(1330 623)"><circle r="34" fill="#c9a24a"/>${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.283; return `<rect x="-6" y="-44" width="12" height="14" fill="#c9a24a" transform="rotate(${f((a * 180) / Math.PI)})"/>`; }).join('')}<circle r="12" fill="#7a5a20"/></g>`);

    /* ---------- workbenches with elves ---------- */
    function bench(x, w) {
      return `<g filter="url(#ws-shadow)"><rect x="${x}" y="760" width="${w}" height="24" rx="3" fill="#a8682f"/><rect x="${x}" y="760" width="${w}" height="5" fill="#d49a5c"/><rect x="${x + 16}" y="784" width="16" height="140" fill="#7a4a26"/><rect x="${x + w - 32}" y="784" width="16" height="140" fill="#7a4a26"/><rect x="${x + 16}" y="880" width="${w - 32}" height="10" fill="#6b3a1c"/></g>`;
    }
    add(elf(470, 770, 1, false, { tunic: '#1f7d45', hat: '#c4222f' }));
    add(bench(300, 330));
    add(rockingHorse(380, 760, 1.1, '#e9d6b0') + `<path d="M440 760 l6 -26 l6 0 l-4 26Z" fill="#2a5aa8"/><rect x="438" y="726" width="18" height="8" fill="#7a4a26"/>` + drum(560, 760, 0.9, '#f08a2a'));
    add(`<path d="M520 760 v-14 h14 v14Z" fill="#c4222f"/><path d="M540 760 v-10 h12 v10Z" fill="#2a5aa8"/>`);
    add(elf(1130, 770, 1, true, { tunic: '#c4222f', hat: '#1f7d45' }));
    add(bench(990, 320));
    add(teddy(1050, 760, 1.05, '#d9a066') + toyTrain(1190, 760, 1.15) + `<path d="M1260 760 l20 -40" stroke="#7a4a26" stroke-width="5" stroke-linecap="round"/><rect x="1270" y="712" width="26" height="12" rx="2" fill="#5a5b66" transform="rotate(-25 1283 718)"/>`);
    // third elf carrying a gift by the stove
    add(elf(300, 960, 0.9, false, { tunic: '#2a5aa8', hat: '#c4222f' }));
    add(gift(318, 860, 46, 38, 'url(#ws-gstripe)', '#1f7d45', 7));
    // toy sack
    add(`<g filter="url(#ws-shadow)"><path d="M1380 960 Q1330 960 1336 890 Q1344 830 1400 816 Q1420 800 1440 816 Q1500 830 1506 890 Q1512 960 1460 960Z" fill="#b3172b"/><path d="M1400 816 Q1420 830 1440 816" stroke="#f0d07a" stroke-width="5" fill="none"/>${teddy(1390, 816, 0.7)}${ball(1450, 806, 14)}<path d="M1372 900 Q1420 920 1470 900" stroke="#8a0f1f" stroke-width="3" fill="none"/></g>`);

    /* ---------- the big Christmas Eve present (day 24) ---------- */
    add(`<ellipse cx="800" cy="944" rx="110" ry="14" fill="#000" opacity=".35" filter="url(#ws-soft)"/>`);
    add(`<g filter="url(#ws-shadow)"><rect x="720" y="922" width="160" height="16" rx="4" fill="#7a4a26"/><circle cx="740" cy="942" r="9" fill="#2a1408"/><circle cx="860" cy="942" r="9" fill="#2a1408"/></g>`);
    add(gift(728, 818, 138, 104, 'url(#ws-gold)', '#b3172b', 18));

    /* ---------- banner ---------- */
    add(`<g filter="url(#ws-shadow)">
      <path d="M548 98 L452 92 L480 136 L452 182 L560 170Z" fill="url(#ws-ribbonDark)"/>
      <path d="M1052 98 L1148 92 L1120 136 L1148 182 L1040 170Z" fill="url(#ws-ribbonDark)"/>
      <path d="M520 76 L560 104 L560 160 L520 150Z" fill="#4a0711"/><path d="M1080 76 L1040 104 L1040 160 L1080 150Z" fill="#4a0711"/>
      <path d="M520 76 Q800 18 1080 76 L1080 150 Q800 92 520 150Z" fill="url(#ws-ribbon)"/>
      <path d="M528 86 Q800 30 1072 86" stroke="url(#ws-gold)" stroke-width="3" fill="none"/>
      <path d="M528 140 Q800 84 1072 140" stroke="url(#ws-gold)" stroke-width="3" fill="none"/>
      <path d="M528 92 Q800 36 1072 92" stroke="#f0c86a" stroke-width="1" fill="none" stroke-dasharray="2 5" opacity=".7"/>
    </g>`);
    let bg = '';
    for (let i = 0; i < 16; i++) { const t = i / 15; bg += sprig(470 + t * 660, 64 - Math.sin(t * Math.PI) * 30 + 4, 10); }
    add(bg);

    /* ---------- light ---------- */
    add(`<rect width="${W}" height="${H}" fill="url(#ws-fireLight)"/><rect width="${W}" height="${H}" fill="url(#ws-warm)"/><rect width="${W}" height="${H}" fill="url(#ws-vig)"/>`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    return { svg, lights, candles };
  }

  /** The conveyor belt creeps along and the big cog turns. */
  function machinery(ctx, t) {
    ctx.strokeStyle = 'rgba(255,220,150,.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 22]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.moveTo(282, 606); ctx.lineTo(1318, 606); ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(1330, 623); ctx.rotate(t * 0.9);
    ctx.fillStyle = 'rgba(255,240,200,.35)';
    for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.fillRect(-4, -42, 8, 10); }
  }

  A.designs.workshop = {
    id: 'workshop',
    name: 'Santa’s Workshop',
    blurb: 'Elves at their benches, toys stacked to the rafters.',
    width: W,
    height: H,
    build,
    title: { path: 'M560 120 Q800 64 1040 120', size: 44, maxWidth: 440 },
    effects: [
      { type: 'roomGlow', x: 163, y: 700, r: 620, color: '255,140,60', a: 0.08 },
      { type: 'fire', arch: 'M118 734 V680 Q118 650 163 648 Q208 650 208 680 V734 Z', x0: 120, x1: 206, base: 732, height: 80 },
      { type: 'snow', rect: [648, 200, 304, 316], count: 60 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'custom', draw: machinery },
      { type: 'smoke', x: 197, y: 532, rate: 1.2, rise: 14, size: 5, color: '240,240,245', a: 0.3 },
    ],
    layout: 'workshop',
    keepOut: [[440, 18, 720, 172], [630, 184, 340, 350], [100, 640, 126, 100]],
    day24: { x: 715, y: 800, w: 170, h: 150 },
  };
})();
