/* Design — "Silent Night"
   A quiet stable on a hillside beneath one bright star. Shepherds keep watch by a small
   fire with their sheep, olive trees on the slopes, and the little town on the far hill.
   Deep indigo night, warm lantern light, a parchment scroll for the title. */
(function () {
  const A = (window.AYY = window.AYY || {});
  A.designs = A.designs || {};
  const W = 1600, H = 1000;
  const f = (n) => Math.round(n * 10) / 10;

  function build() {
    const R = A.util.rng(1225);
    const rr = (a, b) => a + R() * (b - a);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const lights = [], candles = [], out = [];
    const add = (s) => out.push(s);

    const sheep = (x, y, s = 1, flip = false) => {
      let g = `<g transform="translate(${f(x)} ${f(y)}) scale(${flip ? -s : s} ${s})"><ellipse cx="0" cy="18" rx="30" ry="5" fill="#000" opacity=".25"/>`;
      g += `<path d="M-16 8 v12 M-6 10 v12 M8 10 v12 M18 8 v12" stroke="#2a2430" stroke-width="4" stroke-linecap="round"/>`;
      for (let i = 0; i < 9; i++) g += `<circle cx="${f(-20 + (i % 5) * 10 + (i > 4 ? 5 : 0))}" cy="${f(i > 4 ? -6 : 4)}" r="${f(10 + (i % 3))}" fill="${i % 2 ? '#e9e2d4' : '#f4eee2'}"/>`;
      g += `<ellipse cx="28" cy="-4" rx="9" ry="11" fill="#2a2430"/><ellipse cx="22" cy="-12" rx="6" ry="3" fill="#2a2430" transform="rotate(-25 22 -12)"/><circle cx="31" cy="-6" r="1.4" fill="#e8e0d0"/>`;
      return g + '</g>';
    };
    const olive = (x, base, s = 1) => {
      let g = `<g transform="translate(${x} ${base}) scale(${s})">`;
      g += `<path d="M-8 0 C-14 -40 6 -60 -6 -100 C-2 -104 4 -104 6 -98 C2 -70 22 -50 10 0Z" fill="#3a2c2a"/><path d="M-4 -90 C-30 -110 -50 -100 -60 -110 M2 -96 C20 -120 40 -118 54 -128" stroke="#3a2c2a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 26; i++) g += `<ellipse cx="${f(rr(-80, 80))}" cy="${f(rr(-170, -95))}" rx="${f(rr(16, 30))}" ry="${f(rr(10, 18))}" fill="${pick(['#3e5a52', '#4a665c', '#566f66', '#344c46'])}" opacity=".95"/>`;
      for (let i = 0; i < 18; i++) g += `<ellipse cx="${f(rr(-70, 70))}" cy="${f(rr(-165, -100))}" rx="${f(rr(4, 9))}" ry="2" fill="#9ab8b0" opacity=".5" transform="rotate(${f(rr(-30, 30))})"/>`;
      return g + '</g>';
    };

    add(`<defs>
      <linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03061c"/><stop offset=".45" stop-color="#0d1442"/><stop offset=".75" stop-color="#232a66"/><stop offset="1" stop-color="#3e3a78"/></linearGradient>
      <radialGradient id="sn-starglow" cx="800" cy="120" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset=".25" stop-color="#ffe8b0" stop-opacity=".18"/><stop offset="1" stop-color="#ffe8b0" stop-opacity="0"/></radialGradient>
      <linearGradient id="sn-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c8" stop-opacity=".35"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></linearGradient>
      <radialGradient id="sn-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".85"/><stop offset=".5" stop-color="#ff9a40" stop-opacity=".25"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>
      <linearGradient id="sn-hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2c5c"/><stop offset="1" stop-color="#1a1c40"/></linearGradient>
      <linearGradient id="sn-hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3150"/><stop offset="1" stop-color="#151830"/></linearGradient>
      <linearGradient id="sn-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3348"/><stop offset="1" stop-color="#1c1826"/></linearGradient>
      <linearGradient id="sn-stable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd68a"/><stop offset=".6" stop-color="#e8903a"/><stop offset="1" stop-color="#8a4a1a"/></linearGradient>
      <linearGradient id="sn-scroll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ead0"/><stop offset=".5" stop-color="#ead8b0"/><stop offset="1" stop-color="#d4bb8a"/></linearGradient>
      <linearGradient id="sn-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset=".45" stop-color="#e2b04a"/><stop offset="1" stop-color="#9c6b1c"/></linearGradient>
      <filter id="sn-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
      <filter id="sn-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="sn-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".5"/></filter>
    </defs>`);

    /* night sky, milky way, stars */
    add(`<rect width="${W}" height="${H}" fill="url(#sn-sky)"/>`);
    add(`<ellipse cx="420" cy="200" rx="620" ry="70" fill="#8aa0d8" opacity=".14" transform="rotate(-18 420 200)" filter="url(#sn-blur)"/><ellipse cx="1240" cy="330" rx="420" ry="50" fill="#a08ad8" opacity=".1" transform="rotate(-18 1240 330)" filter="url(#sn-blur)"/>`);
    for (let i = 0; i < 260; i++) add(`<circle cx="${f(rr(0, W))}" cy="${f(rr(0, 560))}" r="${f(rr(0.4, 1.5))}" fill="${pick(['#ffffff', '#dfe8ff', '#fff2d8'])}" opacity="${f(rr(0.3, 0.95))}"/>`);
    for (let i = 0; i < 34; i++) {
      const x = rr(20, W - 20), y = rr(20, 520);
      if (Math.abs(x - 800) < 160 && y < 260) continue;
      lights.push({ x, y, c: pick(['#dfe8ff', '#fff2d8', '#ffffff']), r: rr(1.2, 2) });
      add(`<circle cx="${f(x)}" cy="${f(y)}" r="1.8" fill="#fff"/>`);
    }
    /* the star and its beam */
    add(`<rect width="${W}" height="${H}" fill="url(#sn-starglow)"/>`);
    add(`<path d="M790 140 L640 600 L960 600 L810 140Z" fill="url(#sn-beam)"/>`);
    const sp = (ro, ri, n) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(800 + Math.cos(a) * r) + ' ' + f(120 + Math.sin(a) * r); } return d + 'Z'; };
    add(`<path d="M800 20 L806 114 L900 120 L806 126 L800 300 L794 126 L700 120 L794 114Z" fill="#fff8e0"/><path d="${sp(34, 8, 4)}" fill="#fffbe8" transform="rotate(45 800 120)"/><circle cx="800" cy="120" r="12" fill="#fff"/>`);

    /* far hills and the little town */
    add(`<path d="M0 520 Q200 470 420 500 Q600 520 720 510 L760 560 H0Z" fill="url(#sn-hill1)"/>`);
    add(`<path d="M980 560 Q1080 440 1260 430 Q1440 420 1600 470 V620 H980Z" fill="url(#sn-hill1)"/>`);
    const town = [];
    for (let i = 0; i < 26; i++) { const x = rr(1060, 1580), top = 520 - Math.sin(((x - 980) / 620) * Math.PI) * 80 + rr(-10, 26); town.push([x, top, rr(34, 70), rr(24, 46)]); }
    town.sort((a, b) => a[1] - b[1]).forEach(([x, top, w, h]) => {
      add(`<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h + 60)}" fill="${pick(['#3a3a6a', '#34345e', '#40406e'])}"/><rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="4" fill="#5a5a8a"/>`);
      if (R() < 0.7) { const wx = x + rr(6, w - 16), wy = top + rr(8, h - 6); add(`<rect x="${f(wx)}" y="${f(wy)}" width="8" height="10" fill="#ffcf70"/><circle cx="${f(wx + 4)}" cy="${f(wy + 5)}" r="14" fill="#ffb84d" opacity=".18"/>`); lights.push({ x: wx + 4, y: wy + 5, c: '#ffcf70', r: 2.2 }); }
    });
    add(`<path d="M1300 440 a30 30 0 0 1 60 0Z" fill="#40406e"/><rect x="1296" y="440" width="68" height="40" fill="#40406e"/><path d="M1470 470 a22 22 0 0 1 44 0Z" fill="#3a3a6a"/><rect x="1466" y="470" width="52" height="40" fill="#3a3a6a"/>`);
    [[1110, 520], [1200, 480], [1560, 500]].forEach(([x, y]) => add(`<path d="M${x} ${y} q4 -40 -2 -70" stroke="#232246" stroke-width="5" fill="none"/>${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${x - 2} ${y - 70} q${(k - 2.5) * 12} -10 ${(k - 2.5) * 22} 8" stroke="#232246" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}`));

    /* the stable hill */
    add(`<path d="M0 640 Q300 590 560 640 Q700 600 820 590 Q980 590 1100 640 Q1350 660 1600 620 V1000 H0Z" fill="url(#sn-hill2)"/>`);
    add(olive(1080, 640, 0.9)); add(olive(520, 650, 0.8));

    /* stable */
    add(`<g filter="url(#sn-shadow)">
      <path d="M640 700 V520 H960 V700Z" fill="#4a3226"/>
      <path d="M660 700 V540 H940 V700Z" fill="url(#sn-stable)"/>
    </g>`);
    // planks on the back wall
    for (let x = 670; x < 940; x += 26) add(`<path d="M${x} 540 V700" stroke="#a35a24" stroke-width="2" opacity=".35"/>`);
    // ox and donkey behind, the holy family, the manger
    add(`<g fill="#3a2016" opacity=".85">
      <path d="M860 610 Q860 580 890 576 Q920 574 930 596 L930 640 H870Z"/><path d="M884 578 l-10 -14 l6 -2 l10 12 M912 576 l8 -14 l4 4 l-6 12" stroke="#3a2016" stroke-width="4"/>
      <path d="M690 620 Q690 596 712 594 L720 572 l6 2 l-2 22 Q742 600 742 630 L742 650 H690Z"/><path d="M712 574 l-6 -20 l5 -1 l5 18" />
    </g>`);
    add(`<path d="M730 700 Q726 640 748 618 Q764 604 778 618 Q790 640 786 700Z" fill="#2c3a6a"/><path d="M748 618 Q756 596 772 604 Q784 616 778 640 Q770 620 748 626Z" fill="#e8e0d0"/><circle cx="766" cy="626" r="9" fill="#e8c8a0"/>`);
    add(`<path d="M842 700 L846 610 Q856 592 870 600 L880 700Z" fill="#5a3a24"/><circle cx="862" cy="598" r="9" fill="#e0b890"/><path d="M852 594 Q862 582 872 594 L870 604 Q862 596 854 604Z" fill="#8a6a4a"/><path d="M888 700 L880 590 q4 -10 10 -4" stroke="#6b4a2a" stroke-width="4" fill="none"/>`);
    add(`<path d="M772 690 L780 666 H828 L836 690Z" fill="#6b3d1f"/><path d="M776 668 Q804 650 832 668" fill="#e8c46a"/><ellipse cx="804" cy="664" rx="22" ry="8" fill="#ffe7a8"/><circle cx="804" cy="660" r="40" fill="url(#sn-warm)"/>`);
    for (let i = 0; i < 18; i++) add(`<path d="M${f(rr(782, 828))} ${f(rr(662, 670))} l${f(rr(-8, 8))} ${f(rr(-10, -4))}" stroke="#f4d070" stroke-width="1.5"/>`);
    // hanging lantern
    add(`<path d="M800 540 v26" stroke="#2a1a10" stroke-width="2"/><rect x="792" y="566" width="16" height="22" rx="3" fill="#ffe7a8" stroke="#2a1a10" stroke-width="2"/>`);
    candles.push({ x: 800, y: 582, s: 0.5 });
    // posts and thatched roof
    add(`<rect x="634" y="510" width="16" height="200" fill="#5a3a26"/><rect x="950" y="510" width="16" height="200" fill="#5a3a26"/><rect x="792" y="490" width="14" height="40" fill="#5a3a26"/>`);
    add(`<path d="M600 540 L800 440 L1000 540 L986 556 L800 466 L614 556Z" fill="#c49a52"/>`);
    for (let i = 0; i < 70; i++) { const t = R(), side = R() < 0.5 ? -1 : 1; const x = 800 + side * t * 200, y = 440 + t * 100; add(`<path d="M${f(x)} ${f(y)} l${f(side * rr(2, 6))} ${f(rr(10, 18))}" stroke="${pick(['#a87a3a', '#d8b26a', '#8a6028'])}" stroke-width="2"/>`); }
    add(`<path d="M600 540 L800 440 L1000 540" stroke="#f0d890" stroke-width="3" fill="none" opacity=".6"/>`);
    // hay bales and straw spill
    add(`<rect x="960" y="676" width="54" height="32" rx="4" fill="#c49a52"/><rect x="584" y="680" width="50" height="28" rx="4" fill="#b88a42"/>`);
    add(`<path d="M640 704 Q800 690 960 704 L980 716 Q800 708 620 716Z" fill="#c49a52" opacity=".8"/>`);

    /* path up the hill */
    add(`<path d="M800 716 C780 780 640 800 600 860 C570 910 640 960 620 1000 L700 1000 C720 960 660 920 690 870 C730 820 830 790 840 716Z" fill="#4a4258" opacity=".7"/>`);

    /* shepherds' hill + fire */
    add(`<path d="M0 740 Q180 700 420 740 Q520 760 560 820 L560 1000 H0Z" fill="url(#sn-ground)"/>`);
    add(`<path d="M1060 760 Q1300 720 1600 740 V1000 H1040Z" fill="url(#sn-ground)"/>`);
    add(`<circle cx="330" cy="770" r="130" fill="url(#sn-warm)" opacity=".7"/>`);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI; add(`<ellipse cx="${f(330 + Math.cos(a) * 40)}" cy="${f(782 + Math.sin(a) * 8)}" rx="10" ry="7" fill="${pick(['#5a5060', '#6a6070', '#4a4250'])}"/>`); }
    add(`<path d="M300 784 L360 770 M304 770 L358 786" stroke="#3a2416" stroke-width="7" stroke-linecap="round"/>`);
    // shepherds
    add(`<g fill="#1e1828">
      <path d="M220 800 Q214 760 232 744 Q248 736 258 752 L270 800Z"/><circle cx="240" cy="732" r="12" fill="#c49a7a"/><path d="M226 730 Q240 712 254 730 L256 744 Q240 736 226 744Z" fill="#6b5a4a"/>
      <path d="M268 800 l10 -12" stroke="#1e1828" stroke-width="6"/>
    </g>`);
    add(`<g fill="#241c2e">
      <path d="M150 860 L156 750 Q168 728 184 740 L196 860Z"/><circle cx="172" cy="728" r="13" fill="#c49a7a"/><path d="M156 726 Q172 704 188 726 L190 744 Q172 734 156 744Z" fill="#7a6a54"/>
      <path d="M190 760 L250 650" stroke="#241c2e" stroke-width="7" stroke-linecap="round"/><path d="M128 850 L118 650 q2 -24 20 -18 q14 6 6 22" stroke="#5a3e28" stroke-width="5" fill="none"/>
    </g>`);
    add(`<g transform="translate(440 820)" fill="#2a2234"><path d="M-12 40 L-8 -30 Q4 -44 16 -32 L22 40Z"/><circle cx="4" cy="-42" r="12" fill="#c49a7a"/><path d="M-10 -44 Q4 -62 18 -44 L20 -30 Q4 -40 -12 -30Z" fill="#5a4a6a"/></g>`);
    // sheep
    [[80, 880, 1.1], [180, 920, 1.2, true], [380, 900, 1], [470, 960, 1.15, true], [60, 970, 1.25], [1150, 820, 0.9, true], [1260, 860, 1.05], [1400, 830, 0.95], [1500, 900, 1.2, true], [1330, 950, 1.15], [960, 760, 0.7], [1020, 770, 0.65, true], [600, 740, 0.7]].forEach(([x, y, s, fl]) => add(sheep(x, y, s, fl)));
    add(olive(1500, 760, 1.15)); add(olive(70, 720, 1));
    // grass tufts
    for (let i = 0; i < 60; i++) { const x = rr(0, W), y = rr(760, 1000); if (x > 560 && x < 1040 && y > 850) continue; add(`<path d="M${f(x)} ${f(y)} l-4 -12 M${f(x)} ${f(y)} l1 -15 M${f(x)} ${f(y)} l5 -11" stroke="#4a5a4a" stroke-width="2" opacity=".8"/>`); }

    /* parchment scroll (title) */
    add(`<g filter="url(#sn-shadow)">
      <path d="M500 880 Q800 860 1100 880 L1100 958 Q800 938 500 958Z" fill="url(#sn-scroll)"/>
      <path d="M500 880 Q800 860 1100 880 M500 958 Q800 938 1100 958" stroke="#b89a62" stroke-width="2" fill="none"/>
      <rect x="474" y="870" width="34" height="98" rx="17" fill="#e2cc9c"/><rect x="474" y="870" width="34" height="98" rx="17" fill="none" stroke="#a8884e" stroke-width="2"/><ellipse cx="491" cy="870" rx="17" ry="6" fill="#c8ac74"/>
      <rect x="1092" y="870" width="34" height="98" rx="17" fill="#e2cc9c"/><rect x="1092" y="870" width="34" height="98" rx="17" fill="none" stroke="#a8884e" stroke-width="2"/><ellipse cx="1109" cy="870" rx="17" ry="6" fill="#c8ac74"/>
      <path d="M530 890 Q800 872 1070 890 M530 948 Q800 930 1070 948" stroke="url(#sn-gold)" stroke-width="2" fill="none"/>
    </g>`);

    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`, lights, candles };
  }

  A.designs.silentnight = {
    id: 'silentnight',
    name: 'Silent Night',
    blurb: 'A quiet stable beneath one bright star.',
    width: W, height: H, build,
    title: { path: 'M540 922 Q800 900 1060 922', size: 42, maxWidth: 480, fill: '#5a2412', stroke: '#f2e4c4' },
    numStyles: ['n-gold', 'n-cream', 'n-gold', 'n-tag'],
    effects: [
      { type: 'glow', x: 800, y: 120, r: 260, color: '255,244,210', a: 0.28, speed: 0.6 },
      { type: 'star', x: 800, y: 120, r: 130 },
      { type: 'twinkle' },
      { type: 'glow', x: 800, y: 630, r: 200, color: '255,190,100', a: 0.16, speed: 1.1 },
      { type: 'candles' },
      { type: 'roomGlow', x: 330, y: 760, r: 260, color: '255,150,60', a: 0.12, flicker: 0.06 },
      { type: 'fire', arch: 'M290 790 V660 H370 V790Z', x0: 304, x1: 356, base: 778, height: 80 },
      {
        type: 'custom', // an occasional shooting star
        draw(ctx, t, dt, st) {
          if (st.next == null) st.next = t + 4;
          if (t > st.next && !st.s) { st.s = { x: 120 + Math.random() * 600, y: 40 + Math.random() * 160, life: 0 }; st.next = t + 9 + Math.random() * 8; }
          if (!st.s) return;
          const s = st.s; s.life += dt;
          const k = s.life / 1.1;
          if (k >= 1) { st.s = null; return; }
          const x = s.x + k * 380, y = s.y + k * 150;
          const g = ctx.createLinearGradient(x - 120, y - 47, x, y);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.9 * Math.sin(k * Math.PI)})`);
          ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - 120, y - 47); ctx.lineTo(x, y); ctx.stroke();
        },
      },
    ],
    layout: 'silentnight',
    keepOut: [[440, 852, 720, 126], [680, 28, 240, 220], [284, 690, 110, 110]],
    day24: { x: 715, y: 540, w: 170, h: 150 },
  };
})();
