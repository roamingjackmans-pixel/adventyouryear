/* Sample calendar content: painted stand-in photos (generated on a canvas) and notes.
   Used by the "See a sample" calendar and the landing page. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const PW = 1200, PH = 900;

  function canvas() {
    const c = document.createElement('canvas');
    c.width = PW; c.height = PH;
    return [c, c.getContext('2d', { willReadFrequently: true })];
  }
  const lg = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function softDot(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(0.72, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  function ridge(ctx, R, y, amp, rough, color, snow) {
    const pts = [];
    let v = 0;
    for (let x = -20; x <= PW + 20; x += 20) { v += (R() - 0.5) * rough; v *= 0.92; pts.push([x, y + Math.sin(x / 210 + y) * amp + v * amp * 0.5]); }
    ctx.beginPath(); ctx.moveTo(-20, PH);
    pts.forEach(([x, yy]) => ctx.lineTo(x, yy));
    ctx.lineTo(PW + 20, PH); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    if (snow) {
      ctx.save(); ctx.clip();
      ctx.fillStyle = snow;
      ctx.beginPath(); ctx.moveTo(-20, PH);
      pts.forEach(([x, yy]) => ctx.lineTo(x, yy));
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 22 + Math.sin(i * 1.7) * 10);
      ctx.fill(); ctx.restore();
    }
    return pts;
  }
  function pineTree(ctx, x, y, h, color, snow) {
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
      const ty = y - h + (i * h) / 4.6, w = (h * (0.18 + i * 0.1));
      ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - w, ty + h * 0.34); ctx.lineTo(x + w, ty + h * 0.34); ctx.closePath(); ctx.fill();
      if (snow) { ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - w * 0.45, ty + h * 0.15); ctx.lineTo(x + w * 0.35, ty + h * 0.13); ctx.closePath(); ctx.fill(); ctx.fillStyle = color; }
    }
    ctx.fillRect(x - h * 0.03, y - h * 0.08, h * 0.06, h * 0.1);
  }
  function stars(ctx, R, n, maxY) {
    for (let i = 0; i < n; i++) { ctx.globalAlpha = 0.3 + R() * 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(R() * PW, R() * maxY, R() * 1.8 + 0.3, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function grain(ctx, R) {
    const id = ctx.getImageData(0, 0, PW, PH), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(id, 0, 0);
    const v = ctx.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PH * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, PW, PH);
  }

  const PAL = [
    { sky: ['#1b1036', '#5b2a6e', '#e2799a', '#ffc58f'], ridges: ['#7c5a8e', '#4d3a6b', '#2c2547', '#171329'], bokeh: ['#ffcf6b', '#ff7a59', '#ffe9b0'] },
    { sky: ['#061428', '#123a6b', '#3f78b0', '#a9d0f0'], ridges: ['#8fb0d0', '#5d7fa8', '#34507a', '#18294a'], bokeh: ['#8fd3ff', '#ffffff', '#ffd27a'] },
    { sky: ['#0a1f1a', '#173f35', '#3e7a5e', '#cfe6c8'], ridges: ['#8bb19a', '#5e8a73', '#335c4b', '#14302a'], bokeh: ['#ff5a5a', '#ffd36b', '#9dff8a'] },
    { sky: ['#2a0d12', '#6b1d2a', '#c4553a', '#ffd08a'], ridges: ['#b0706a', '#7c4148', '#4a2330', '#22101a'], bokeh: ['#ffb347', '#ff6b6b', '#fff1c9'] },
  ];

  const painters = {
    mountains(ctx, R, p) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, PH * 0.75, [[0, p.sky[0]], [0.45, p.sky[1]], [0.8, p.sky[2]], [1, p.sky[3]]]);
      ctx.fillRect(0, 0, PW, PH);
      stars(ctx, R, 140, PH * 0.4);
      softDot(ctx, PW * (0.2 + R() * 0.6), PH * 0.5, 220, 'rgba(255,220,170,.35)', 1);
      ridge(ctx, R, PH * 0.48, 50, 3, p.ridges[0], 'rgba(255,255,255,.75)');
      ridge(ctx, R, PH * 0.58, 40, 2.4, p.ridges[1], 'rgba(255,255,255,.55)');
      ridge(ctx, R, PH * 0.7, 28, 1.6, p.ridges[2]);
      const near = ridge(ctx, R, PH * 0.82, 18, 1.2, p.ridges[3]);
      near.forEach(([x, y], i) => { if (i % 2 === 0 && R() > 0.3) pineTree(ctx, x + R() * 10, y + 14, 60 + R() * 70, p.ridges[3]); });
    },
    forest(ctx, R, p) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, PH, [[0, '#0b1d36'], [0.6, '#2f5487'], [1, '#c7d8ef']]);
      ctx.fillRect(0, 0, PW, PH);
      stars(ctx, R, 80, PH * 0.35);
      ctx.fillStyle = '#e8f0fb'; ctx.fillRect(0, PH * 0.74, PW, PH);
      const rows = [[0.62, '#3c5f8a', 70], [0.7, '#284670', 110], [0.82, '#142a48', 170]];
      rows.forEach(([yy, col, h]) => {
        for (let x = -40; x < PW + 40; x += h * 0.45 + R() * h * 0.4) pineTree(ctx, x, PH * yy + R() * 30, h * (0.7 + R() * 0.6), col, 'rgba(240,246,255,.9)');
      });
      // cabin
      const cx = PW * (0.3 + R() * 0.4), cy = PH * 0.8;
      ctx.fillStyle = '#3a2418'; ctx.fillRect(cx - 70, cy - 60, 140, 70);
      ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.moveTo(cx - 90, cy - 56); ctx.lineTo(cx, cy - 120); ctx.lineTo(cx + 90, cy - 56); ctx.closePath(); ctx.fill();
      softDot(ctx, cx, cy - 26, 120, 'rgba(255,190,90,.5)', 1);
      ctx.fillStyle = '#ffcf70'; ctx.fillRect(cx - 50, cy - 40, 28, 26); ctx.fillRect(cx + 22, cy - 40, 28, 26);
      ctx.fillStyle = '#e8f0fb'; ctx.fillRect(0, PH * 0.82, PW, PH);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 260; i++) { ctx.globalAlpha = 0.4 + R() * 0.6; ctx.beginPath(); ctx.arc(R() * PW, R() * PH, R() * 3 + 0.6, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    },
    aurora(ctx, R) {
      ctx.fillStyle = lg(ctx, 0, 0, 0, PH * 0.6, [[0, '#020812'], [1, '#0c2236']]);
      ctx.fillRect(0, 0, PW, PH);
      stars(ctx, R, 220, PH * 0.6);
      ctx.globalCompositeOperation = 'lighter';
      const bands = [['rgba(80,255,170,', 0.32], ['rgba(70,200,255,', 0.22], ['rgba(190,110,255,', 0.16]];
      bands.forEach(([c, a], b) => {
        const off = R() * 10, base = PH * (0.22 + b * 0.07);
        for (let x = 0; x < PW; x += 3) {
          const y = base + Math.sin(x / 160 + off) * 50 + Math.sin(x / 63 + off * 2) * 16;
          const h = 120 + Math.sin(x / 90 + off) * 60;
          const g = ctx.createLinearGradient(0, y - h, 0, y + 20);
          g.addColorStop(0, c + '0)'); g.addColorStop(0.75, c + a + ')'); g.addColorStop(1, c + '0)');
          ctx.fillStyle = g; ctx.fillRect(x, y - h, 3, h + 20);
        }
      });
      ctx.globalCompositeOperation = 'source-over';
      const hz = PH * 0.62;
      ridge(ctx, R, hz - 40, 30, 2.5, '#06101c');
      // lake reflection
      const img = ctx.getImageData(0, 0, PW, hz);
      const ref = ctx.createImageData(PW, PH - hz);
      for (let y = 0; y < PH - hz; y++) {
        const sy = Math.max(0, hz - 1 - y + Math.round(Math.sin(y * 0.6) * 2));
        for (let x = 0; x < PW; x++) {
          const si = (sy * PW + x) * 4, di = (y * PW + x) * 4;
          ref.data[di] = img.data[si] * 0.55; ref.data[di + 1] = img.data[si + 1] * 0.6; ref.data[di + 2] = img.data[si + 2] * 0.7; ref.data[di + 3] = 255;
        }
      }
      ctx.putImageData(ref, 0, hz);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 40; i++) ctx.fillRect(R() * PW, hz + R() * (PH - hz), 40 + R() * 120, 1.5);
    },
    bokeh(ctx, R, p) {
      ctx.fillStyle = lg(ctx, 0, 0, PW, PH, [[0, '#0d0a10'], [1, '#1d1210']]);
      ctx.fillRect(0, 0, PW, PH);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 90; i++) {
        const r = 14 + R() * R() * 120;
        softDot(ctx, R() * PW, R() * PH, r, p.bokeh[i % p.bokeh.length], 0.08 + R() * 0.35);
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    ornament(ctx, R, p) {
      painters.bokeh(ctx, R, p);
      const x = PW * (0.38 + R() * 0.24), y = PH * 0.56, r = 210;
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - r - 30); ctx.stroke();
      ctx.fillStyle = lg(ctx, x - 30, 0, x + 30, 0, [[0, '#8a6420'], [0.5, '#f3d27a'], [1, '#8a6420']]);
      ctx.fillRect(x - 32, y - r - 40, 64, 46);
      const col = ['#c0182c', '#1f5fa8', '#1f7d45', '#c9962f'][Math.floor(R() * 4)];
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 10, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.12, col); g.addColorStop(1, '#0a0406');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const a = R() * 7, d = R() * r * 0.8; softDot(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 6 + R() * 14, p.bokeh[i % 3], 0.35); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.98, r * 0.28, 0, 0.1, Math.PI - 0.1); ctx.stroke();
    },
  };
  const ORDER = ['mountains', 'bokeh', 'forest', 'aurora', 'ornament', 'mountains', 'forest', 'bokeh'];

  const cache = {};
  function photo(day) {
    if (cache[day]) return cache[day];
    cache[day] = new Promise((resolve) => {
      const run = () => {
        const [c, ctx] = canvas();
        const R = A.util.rng(day * 7919);
        const kind = ORDER[(day - 1) % ORDER.length];
        painters[kind](ctx, R, PAL[(day - 1) % PAL.length]);
        grain(ctx, R);
        c.toBlob((b) => resolve(URL.createObjectURL(b)), 'image/jpeg', 0.88);
      };
      (window.requestIdleCallback || setTimeout)(run);
    });
    return cache[day];
  }

  const NOTES = [
    'Day one! Every morning this month you get to open one little door. Behind each one is a memory I wanted you to have again.',
    'Remember the first snow when the whole street came out with sleds and Dad tried to beat everyone down the hill?',
    'Thank you for every Saturday pancake breakfast. I still measure all pancakes against yours.',
    'The year the tree fell over and we decided it looked better leaning. It stayed that way until New Year.',
    'This one is for the long drives with the radio on and everyone singing badly. Best road trips there ever were.',
    'You taught me how to tie my skates, and then how to fall without crying. Mostly.',
    'Hot cocoa, too many marshmallows, and an old movie on a cold night. Still my favorite evening.',
    'For every school play you sat through, every game you cheered at, every time you showed up.',
    'The cookie baking marathon! Flour everywhere and half the dough eaten before it reached the oven.',
    'Somewhere there is still a photo of all of us in matching sweaters. I hope it never gets lost.',
    'Thank you for the porch light you always left on. It made coming home feel like coming home.',
    'Here is to the dog who stole the Christmas ham and was forgiven by dinner.',
    'You always said the best gifts are the ones you make. So I made you this.',
    'Remember counting down the days with the old paper calendar on the fridge? This is the new one.',
    'For all the quiet mornings with coffee and the newspaper and nowhere to be.',
    'Every ornament on our tree had a story, and you knew every one by heart.',
    'The night we stayed up too late playing cards and laughing until it hurt.',
    'Thank you for teaching me that a little kindness goes a very long way.',
    'Snowball fight rematch this year? I have been practicing.',
    'For the songs you sang while cooking and the ones you made up when you forgot the words.',
    'All those letters to the North Pole you somehow got answered. I see what you did there.',
    'Two more sleeps. I cannot wait to be home with you.',
    'Christmas Eve Eve. The best kind of waiting is the kind you do together.',
    'Merry Christmas! Thank you for every single year. I love you both more than twenty-four doors could hold.',
  ];

  A.samples = { photo, notes: NOTES };
})();
