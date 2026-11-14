/* Design — "Cabin in the Pines"
   A log cabin deep in snowy pines on a moonlit night: glowing windows, a lantern on the
   porch, a red sled and boots by the door, a stacked woodpile, smoke from the stone
   chimney and a fox watching from the snow. The title hangs on a carved wooden sign. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;
  const CHIMNEY = [968, 352]; // top of the stone chimney (smoke source)

  function build() {
    const R = A.util.rng(2411);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);
    const BULB = ['#ffd36b', '#ff6b5a', '#7ad1ff', '#9dff8a', '#fff1b8', '#ff9be3'];

    const bulb = (x, y, c, r = 3.4) => {
      lights.push({ x, y, c, r });
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.6)}" fill="${c}" opacity=".25"/><rect x="${f(x - 1.5)}" y="${f(y - r - 3)}" width="3" height="3" fill="#222"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r * 1.2)}" fill="${c}"/>`;
    };
    const pine = (x, base, h, dark, snow, lit) => {
      let s = `<rect x="${f(x - h * 0.025)}" y="${f(base - h * 0.08)}" width="${f(h * 0.05)}" height="${f(h * 0.1)}" fill="#24160f"/>`;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const ty = base - h + (i * h) / (n + 0.4), by = ty + h * 0.3, w = h * (0.1 + i * 0.065);
        s += `<path d="M${f(x)} ${f(ty)} L${f(x - w)} ${f(by)} Q${f(x - w * 0.5)} ${f(by - h * 0.025)} ${f(x)} ${f(by + h * 0.01)} Q${f(x + w * 0.5)} ${f(by - h * 0.025)} ${f(x + w)} ${f(by)}Z" fill="${dark}"/>`;
        s += `<path d="M${f(x - w * 0.95)} ${f(by - 1)} Q${f(x - w * 0.55)} ${f(by - h * 0.05)} ${f(x - w * 0.1)} ${f(by - h * 0.02)} M${f(x + w * 0.2)} ${f(by - h * 0.02)} Q${f(x + w * 0.6)} ${f(by - h * 0.05)} ${f(x + w * 0.95)} ${f(by - 1)}" stroke="${snow}" stroke-width="${f(Math.max(2, h * 0.016))}" fill="none" stroke-linecap="round"/>`;
      }
      s += `<path d="M${f(x)} ${f(base - h)} l${f(-h * 0.03)} ${f(h * 0.06)} h${f(h * 0.06)}Z" fill="${snow}"/>`;
      if (lit) for (let k = 0; k < 14; k++) { const t = (k + 0.5) / 14, yy = base - h + t * h * 0.9, hw = h * (0.08 + t * 0.32); s += bulb(x + Math.sin(k * 2.4) * hw * 0.7, yy, BULB[k % BULB.length], 3); }
      return s;
    };

    add(`<defs>
      <linearGradient id="cb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040a1e"/><stop offset=".5" stop-color="#10234a"/><stop offset=".85" stop-color="#2a4676"/><stop offset="1" stop-color="#3e5a8a"/></linearGradient>
      <radialGradient id="cb-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8" stop-opacity=".6"/><stop offset=".35" stop-color="#dfe8ff" stop-opacity=".16"/><stop offset="1" stop-color="#dfe8ff" stop-opacity="0"/></radialGradient>
      <linearGradient id="cb-log" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset=".5" stop-color="#6b4024"/><stop offset="1" stop-color="#4a2a16"/></linearGradient>
      <linearGradient id="cb-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset="1" stop-color="#ffa847"/></linearGradient>
      <radialGradient id="cb-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>
      <linearGradient id="cb-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d8f2"/><stop offset="1" stop-color="#eef3ff"/></linearGradient>
      <linearGradient id="cb-plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a3c"/><stop offset=".5" stop-color="#7a4e2a"/><stop offset="1" stop-color="#5a3618"/></linearGradient>
      <pattern id="cb-stone" width="40" height="28" patternUnits="userSpaceOnUse"><rect width="40" height="28" fill="#4a4a56"/><rect x="2" y="2" width="20" height="11" rx="4" fill="#77778a"/><rect x="24" y="2" width="14" height="11" rx="4" fill="#6a6a7c"/><rect x="2" y="15" width="12" height="11" rx="4" fill="#6a6a7c"/><rect x="16" y="15" width="22" height="11" rx="4" fill="#808094"/></pattern>
      <radialGradient id="cb-vig" cx="800" cy="540" r="980" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#02050f" stop-opacity=".6"/></radialGradient>
      <filter id="cb-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
      <filter id="cb-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>`);

    /* sky, stars, moon, mountains */
    add(`<rect width="${W}" height="${H}" fill="url(#cb-sky)"/>`);
    for (let i = 0; i < 180; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 460))}" r="${f(rr(0.4, 1.6))}" fill="#fff" opacity="${f(rr(0.3, 0.95))}"/>`);
    for (let i = 0; i < 16; i++) { const x = rr(40, W - 40), y = rr(170, 420); lights.push({ x, y, c: '#e8f0ff', r: 1.4 }); }
    add(`<circle cx="1350" cy="160" r="170" fill="url(#cb-moon)"/><circle cx="1350" cy="160" r="54" fill="#fbf6e2"/><circle cx="1334" cy="146" r="10" fill="#e6dec4" opacity=".7"/><circle cx="1366" cy="176" r="7" fill="#e6dec4" opacity=".7"/><circle cx="1352" cy="134" r="5" fill="#e6dec4" opacity=".6"/>`);
    add(`<path d="M0 480 L140 400 L260 450 L400 360 L540 450 L660 400 L800 470 L940 380 L1080 450 L1220 390 L1360 460 L1480 410 L1600 450 V620 H0Z" fill="#3c5684"/>
      <path d="M140 400 L180 424 L150 420 L130 430 L110 418Z M400 360 L450 400 L410 392 L390 404 L360 392Z M940 380 L990 418 L950 410 L925 422 L900 410Z M1220 390 L1260 416 L1225 410 L1200 420Z" fill="#dfe8fb" opacity=".9"/>`);

    /* forest layers */
    for (let i = 0; i < 40; i++) add(pine(rr(-20, W + 20), rr(560, 600), rr(70, 120), '#1c3046', '#a9bde0'));
    add(`<path d="M0 590 Q400 560 800 586 Q1200 610 1600 580 V1000 H0Z" fill="url(#cb-snow)"/>`);
    for (let i = 0; i < 22; i++) { const x = rr(-20, W + 20); if (x > 520 && x < 1080) continue; add(pine(x, rr(620, 680), rr(150, 230), '#15283a', '#dfe8fb')); }

    /* the cabin */
    const cx = 800, wallTop = 520, ground = 770, left = 560, right = 1040;
    // stone chimney (behind the roof)
    add(`<rect x="940" y="${CHIMNEY[1]}" width="56" height="${ground - CHIMNEY[1]}" fill="url(#cb-stone)"/><rect x="934" y="${CHIMNEY[1] - 10}" width="68" height="16" rx="5" fill="#eef3ff"/>`);
    add(`<g filter="url(#cb-shadow)">`);
    // log wall
    for (let y = wallTop; y < ground; y += 26) {
      add(`<rect x="${left}" y="${y}" width="${right - left}" height="26" rx="12" fill="url(#cb-log)"/><path d="M${left + 10} ${y + 22} H${right - 10}" stroke="#3a2010" stroke-width="2" opacity=".6"/>`);
      [left - 8, right + 8].forEach((ex) => add(`<circle cx="${ex}" cy="${y + 13}" r="13" fill="#b07a48"/><circle cx="${ex}" cy="${y + 13}" r="8" fill="none" stroke="#7a4e2a" stroke-width="2"/><circle cx="${ex}" cy="${y + 13}" r="3" fill="#7a4e2a"/>`));
    }
    // gable logs
    for (let y = 520 - 26, k = 1; y > 400; y -= 26, k++) { const inset = k * 38; add(`<rect x="${left + inset}" y="${y}" width="${right - left - inset * 2}" height="26" rx="12" fill="url(#cb-log)"/>`); }
    add(`<circle cx="${cx}" cy="470" r="22" fill="url(#cb-win)" stroke="#3a2010" stroke-width="5"/><path d="M${cx} 448 v44 M${cx - 22} 470 h44" stroke="#3a2010" stroke-width="3"/>`);
    // roof + heavy snow + icicles
    add(`<path d="M500 540 L${cx} 360 L1100 540 L1086 556 L${cx} 386 L514 556Z" fill="#3a2a22"/>`);
    add(`<path d="M484 546 Q478 524 500 520 L${cx} 340 L1100 520 Q1122 524 1116 546 Q1100 556 1086 548 L${cx} 382 L514 548 Q500 556 484 546Z" fill="#f2f6ff"/>`);
    add(`<path d="M520 536 L${cx} 368" stroke="#c9d6f0" stroke-width="4" opacity=".8"/>`);
    for (let i = 0; i < 26; i++) { const t = i / 25, x = 510 + t * 580, y = 548 - (1 - Math.abs(t - 0.5) * 2) * 0 + 4; add(`<path d="M${f(x - 3)} ${f(y)} L${f(x)} ${f(y + rr(10, 30))} L${f(x + 3)} ${f(y)}Z" fill="#dff0ff" opacity=".9"/>`); }
    add(`</g>`);
    // windows with curtains and candles
    [[640, 600], [900, 600]].forEach(([wx, wy]) => {
      add(`<circle cx="${wx + 40}" cy="${wy + 45}" r="110" fill="url(#cb-warm)"/>`);
      add(`<rect x="${wx}" y="${wy}" width="80" height="90" fill="url(#cb-win)"/><path d="M${wx} ${wy} q14 40 4 90 h-4Z M${wx + 80} ${wy} q-14 40 -4 90 h4Z" fill="#a3172a"/>`);
      add(`<rect x="${wx}" y="${wy}" width="80" height="90" fill="none" stroke="#3a2010" stroke-width="7"/><path d="M${wx + 40} ${wy} v90 M${wx} ${wy + 45} h80" stroke="#3a2010" stroke-width="4"/>`);
      add(`<rect x="${wx - 8}" y="${wy + 90}" width="96" height="10" fill="#5a3618"/><path d="M${wx - 10} ${wy + 92} q48 -10 100 0" stroke="#f2f6ff" stroke-width="6" fill="none" stroke-linecap="round"/>`);
      add(`<rect x="${wx + 36}" y="${wy + 66}" width="8" height="20" rx="1" fill="#fbf4e2"/>`);
      candles.push({ x: wx + 40, y: wy + 64, s: 0.6 });
      // window-box greenery
      for (let k = 0; k < 8; k++) add(`<circle cx="${wx - 2 + k * 12}" cy="${wy + 100}" r="7" fill="${k % 2 ? '#1f4a2c' : '#2c6038'}"/>`);
      add(`<circle cx="${wx + 20}" cy="${wy + 100}" r="3" fill="#c4222f"/><circle cx="${wx + 58}" cy="${wy + 102}" r="3" fill="#c4222f"/>`);
    });
    // door + wreath
    add(`<rect x="${cx - 44}" y="610" width="88" height="160" fill="#4a2410"/><path d="M${cx - 44} 610 h88 v160 h-88Z M${cx} 610 v160 M${cx - 44} 660 h88 M${cx - 44} 715 h88" stroke="#2a1408" stroke-width="4" fill="none"/><circle cx="${cx + 30}" cy="700" r="4" fill="#d1a14a"/>`);
    let wr = ''; for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.28; wr += `<circle cx="${f(cx + Math.cos(a) * 20)}" cy="${f(648 + Math.sin(a) * 20)}" r="8" fill="${k % 2 ? '#1f4a2c' : '#2c6038'}"/>`; }
    add(wr + `<path d="M${cx - 8} 668 l8 -6 l8 6 l-4 14 h-8Z" fill="#b3172b"/><circle cx="${cx - 10}" cy="638" r="3" fill="#c4222f"/><circle cx="${cx + 14}" cy="644" r="3" fill="#c4222f"/>`);
    // porch roof, posts and steps
    add(`<g filter="url(#cb-shadow)"><path d="M680 582 H920 L944 604 H656Z" fill="#5a3618"/><path d="M672 580 Q800 566 928 580 L946 600 Q800 590 654 600Z" fill="#f2f6ff"/>
      <rect x="664" y="604" width="12" height="166" fill="#6b4024"/><rect x="924" y="604" width="12" height="166" fill="#6b4024"/>
      <rect x="700" y="770" width="200" height="14" fill="#7a4e2a"/><rect x="716" y="784" width="168" height="14" fill="#6b4024"/><path d="M698 768 Q800 760 902 768 M714 782 Q800 776 886 782" stroke="#f2f6ff" stroke-width="5" fill="none"/></g>`);
    for (let k = 0; k <= 12; k++) { const t = k / 12; add(bulb(664 + t * 272, 608 + Math.abs(Math.sin(t * Math.PI * 4)) * 8, BULB[k % BULB.length], 3)); }
    // porch lantern
    add(`<circle cx="692" cy="636" r="54" fill="url(#cb-warm)"/><path d="M692 604 v14" stroke="#1b1612" stroke-width="2"/><path d="M682 618 h20 l-3 28 h-14Z" fill="#ffe7a8" stroke="#1b1612" stroke-width="3"/><path d="M680 618 l12 -8 l12 8Z" fill="#1b1612"/>`);
    candles.push({ x: 692, y: 640, s: 0.5 });
    // snowshoes on the wall, boots by the door
    add(`<g transform="translate(1000 640) rotate(12)"><ellipse rx="14" ry="34" fill="none" stroke="#8a5a34" stroke-width="5"/><path d="M-12 -10 h24 M-12 6 h24 M0 -30 v60" stroke="#c9a070" stroke-width="2"/></g><g transform="translate(1022 646) rotate(-8)"><ellipse rx="14" ry="34" fill="none" stroke="#8a5a34" stroke-width="5"/><path d="M-12 -10 h24 M-12 6 h24 M0 -30 v60" stroke="#c9a070" stroke-width="2"/></g>`);
    add(`<path d="M862 768 v-30 h16 v22 h14 v8Z M884 768 v-28 h16 v20 h14 v8Z" fill="#2a1a12"/><path d="M862 740 h16 M884 742 h16" stroke="#c4222f" stroke-width="5"/>`);
    // red sled leaning by the door
    add(`<g transform="translate(600 770) rotate(-72)"><path d="M0 0 H150 q22 0 22 -22" stroke="#2a2a2a" stroke-width="5" fill="none"/><rect x="10" y="-30" width="140" height="22" rx="4" fill="#b3172b"/><path d="M40 -30 v22 M80 -30 v22 M120 -30 v22" stroke="#7d0d1c" stroke-width="3"/><path d="M20 -8 v8 M130 -8 v8" stroke="#2a2a2a" stroke-width="4"/></g>`);

    /* woodpile under the left eave + stump with axe */
    add(`<rect x="430" y="660" width="140" height="110" fill="#3a2414"/>`);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const x = 442 + c * 22 + (r % 2) * 11, y = 676 + r * 24; if (x > 560) continue; add(`<circle cx="${x}" cy="${y}" r="11" fill="#b07a48"/><circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#7a4e2a" stroke-width="1.6"/>`); }
    add(`<path d="M424 664 Q500 646 576 664 L576 656 Q500 638 424 656Z" fill="#f2f6ff"/>`);
    add(`<ellipse cx="380" cy="782" rx="34" ry="10" fill="#b07a48"/><rect x="346" y="782" width="68" height="34" fill="#6b4024"/><ellipse cx="380" cy="782" rx="34" ry="10" fill="none" stroke="#7a4e2a" stroke-width="2"/><path d="M372 784 L404 732" stroke="#7a4e2a" stroke-width="6" stroke-linecap="round"/><path d="M394 728 l22 -4 l-6 22Z" fill="#9aa2b0"/>`);

    /* decorated little pine beside the cabin */
    add(pine(1170, 790, 210, '#173a28', '#eef3ff', true));
    add(`<path d="M1170 572 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10Z" fill="#ffd36b"/>`);

    /* foreground snow, path, tracks, fox */
    add(`<path d="M0 780 Q300 750 640 790 Q800 806 960 790 Q1300 756 1600 790 V1000 H0Z" fill="#eef3ff"/>`);
    add(`<path d="M760 798 C740 860 660 900 650 1000 L760 1000 C760 920 820 880 840 798Z" fill="#d4e0f6"/>`);
    for (let i = 0; i < 12; i++) add(`<ellipse cx="${f(778 - i * 12 + (i % 2) * 14)}" cy="${f(812 + i * 16)}" rx="6" ry="3.5" fill="#a9b9da"/>`);
    for (let i = 0; i < 16; i++) add(`<circle cx="${f(1180 + i * 22)}" cy="${f(900 + Math.sin(i) * 10)}" r="2.6" fill="#a9b9da"/>`);
    add(`<g transform="translate(1440 900)">
      <ellipse cx="0" cy="14" rx="40" ry="6" fill="#9db0d6" opacity=".6"/>
      <path d="M30 10 Q70 4 76 -16 Q78 -28 66 -22 Q56 0 26 0Z" fill="#d8692a"/><path d="M72 -20 q6 -6 4 -10 q-6 2 -6 8Z" fill="#fff"/>
      <path d="M-18 12 Q-26 -26 -6 -40 Q12 -46 22 -28 Q30 -4 24 12Z" fill="#e0782e"/><path d="M-10 12 Q-12 -14 2 -20 Q10 -10 8 12Z" fill="#fbf2e6"/>
      <path d="M-2 -42 Q-6 -66 6 -72 Q22 -66 20 -44Z" fill="#e0782e"/><path d="M-2 -66 l-6 -18 l12 10Z M12 -68 l8 -16 l2 16Z" fill="#c45a1e"/><path d="M-2 -52 Q8 -44 18 -52 Q14 -40 8 -38 Q2 -40 -2 -52Z" fill="#fbf2e6"/><circle cx="2" cy="-56" r="2" fill="#1a1a1a"/><circle cx="14" cy="-56" r="2" fill="#1a1a1a"/><circle cx="8" cy="-46" r="2.4" fill="#1a1a1a"/>
      <path d="M-8 12 v-6 M16 12 v-6" stroke="#2a1a12" stroke-width="5" stroke-linecap="round"/>
    </g>`);
    // big foreground pines framing the scene
    add(pine(60, 1010, 470, '#0f2030', '#eef3ff')); add(pine(1560, 1020, 500, '#0f2030', '#eef3ff')); add(pine(250, 1040, 300, '#12263a', '#eef3ff'));

    /* the hanging wooden sign (title) */
    add(`<path d="M560 0 L580 60 M1040 0 L1020 60" stroke="#c9a070" stroke-width="4"/>`);
    add(`<g filter="url(#cb-shadow)"><path d="M486 60 Q800 48 1114 60 L1108 148 Q800 136 492 148Z" fill="url(#cb-plank)"/>
      <path d="M492 90 Q800 80 1110 90 M494 120 Q800 110 1108 120" stroke="#4a2a12" stroke-width="2" opacity=".5"/>
      <path d="M498 70 Q800 58 1102 70 L1098 138 Q800 126 502 138Z" fill="none" stroke="#3a1f0e" stroke-width="3" opacity=".7"/>
      <circle cx="510" cy="104" r="5" fill="#3a2a1a"/><circle cx="1090" cy="104" r="5" fill="#3a2a1a"/>
      <path d="M484 62 Q800 44 1116 62 Q1100 50 800 40 Q500 50 484 62Z" fill="#f2f6ff"/></g>`);
    // pine sprigs and a bow at the sign corners
    [[500, 70, -1], [1100, 70, 1]].forEach(([x, y, d]) => { for (let k = 0; k < 7; k++) add(`<path d="M${x} ${y} l${f(d * rr(10, 40))} ${f(rr(-20, 20))}" stroke="${pick(['#1f4a2c', '#2c6038'])}" stroke-width="5" stroke-linecap="round"/>`); add(`<circle cx="${x}" cy="${y}" r="5" fill="#c4222f"/><circle cx="${x + d * 6}" cy="${y + 5}" r="4" fill="#b3172b"/>`); });
    add(`<rect width="${W}" height="${H}" fill="url(#cb-vig)"/>`);

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  A.designs.cabin = {
    id: 'cabin',
    name: 'Cabin in the Pines',
    blurb: 'A log cabin, smoke from the chimney, boots by the door.',
    width: W, height: H, build,
    title: { path: 'M520 104 Q800 92 1080 104', size: 46, maxWidth: 520, fill: '#fbecd0', stroke: '#3a1f0e' },
    numStyles: ['n-cream', 'n-tag', 'n-gold', 'n-swash', 'n-red'],
    effects: [
      { type: 'glow', x: 1350, y: 160, r: 220, color: '220,232,255', a: 0.16, speed: 0.5 },
      { type: 'roomGlow', x: 800, y: 660, r: 520, color: '255,180,90', a: 0.06, flicker: 0.025 },
      { type: 'twinkle' },
      { type: 'candles' },
      { type: 'smoke', x: CHIMNEY[0], y: CHIMNEY[1] - 12, rate: 2.4, rise: 22, size: 12, a: 0.32, color: '215,224,244' },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 110 },
      { type: 'snow', rect: [0, 0, 1600, 1000], count: 30, size: 1.9, speed: 1.3, a: 0.7 },
    ],
    layout: 'cabin',
    keepOut: [[470, 0, 660, 160], [1270, 84, 160, 156]],
    day24: { x: 715, y: 606, w: 170, h: 150 },
  };
})();
