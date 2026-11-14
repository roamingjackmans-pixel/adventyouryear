/* The advent calendar board: illustrated scene, animated effects, 24 opening doors,
   and the full-screen photo view that grows out of (and back into) each door. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const { esc, el, sleep, fmtDate, isUnlocked, daysUntil, MONTHS } = A.util;
  /** Which part of a photo shows through its door: day data `focus` = [x%, y%], default centred. */
  const focusCSS = (data) => { const f = (data && data.focus) || [50, 50]; return `${f[0]}% ${f[1]}%`; };

  /* ---------------- scene rasterising (cached per design) ---------------- */
  const sceneCache = {};
  function built(design) {
    if (!design._built) design._built = design.build();
    return design._built;
  }
  /** k = render scale: 2 for the board itself, ~0.3 for thumbnails. */
  function sceneURL(designId, k = 2) {
    const key = designId + '@' + k;
    if (sceneCache[key]) return sceneCache[key];
    const design = A.designs[designId] || A.designs.parlor;
    sceneCache[key] = (async () => {
      const { svg } = built(design);
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      try {
        const img = new Image();
        img.decoding = 'async';
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = svgUrl; });
        const c = document.createElement('canvas');
        c.width = design.width * k; c.height = design.height * k;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        // printed-paper grain
        const n = document.createElement('canvas'); n.width = n.height = 128;
        const nx = n.getContext('2d'), id = nx.createImageData(128, 128);
        for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; }
        nx.putImageData(id, 0, 0);
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = ctx.createPattern(n, 'repeat');
        ctx.fillRect(0, 0, c.width, c.height);
        const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
        if (!blob) return svgUrl;
        return URL.createObjectURL(blob);
      } catch (e) {
        return svgUrl;
      }
    })();
    return sceneCache[key];
  }

  /* ---------------- animated effects ---------------- */
  const spriteCache = {};
  function glowSprite(color) {
    if (spriteCache[color]) return spriteCache[color];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.15, color); g.addColorStop(0.45, color + '55'); g.addColorStop(1, color + '00');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (spriteCache[color] = c);
  }
  const wobble = (t, s) => (Math.sin(t * 1.7 + s) + Math.sin(t * 2.9 + s * 1.3) * 0.6 + Math.sin(t * 5.3 + s * 0.7) * 0.3) / 1.9;

  class Effects {
    constructor(design, fxCanvas, glitterCanvas) {
      this.d = design; this.c = fxCanvas; this.g = glitterCanvas;
      this.data = built(design);
      this.running = false; this.scale = 1;
      this.embers = []; this.sparkles = [];
      this.state = new Map();
      this.reduced = A.util.prefersReducedMotion();
      this.loop = this.loop.bind(this);
      this.archPaths = {};
    }
    newFlake(s, anywhere) {
      const [x, y, w, h] = s.rect;
      const big = s.size || 1;
      return { x: x + Math.random() * w, y: anywhere ? y + Math.random() * h : y - 6, r: (0.8 + Math.random() * 2.2) * big, vy: 14 + Math.random() * 26, ph: Math.random() * 6, sw: 6 + Math.random() * 12 };
    }
    resize(scale) {
      this.scale = scale;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      [this.c, this.g].forEach((cv) => {
        cv.width = Math.round(this.d.width * scale * dpr);
        cv.height = Math.round(this.d.height * scale * dpr);
        cv.getContext('2d').setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      });
      if (!this.running) this.draw(performance.now() / 1000, 0);
    }
    start() { if (this.running) return; this.running = true; this.last = performance.now(); requestAnimationFrame(this.loop); }
    stop() { this.running = false; }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (!document.hidden) this.draw(now / 1000, this.reduced ? 0 : dt);
      if (this.reduced) { this.running = false; return; }
      requestAnimationFrame(this.loop);
    }
    draw(t, dt) {
      const ctx = this.c.getContext('2d');
      ctx.clearRect(0, 0, this.d.width, this.d.height);
      for (const e of this.d.effects) this[e.type] && this[e.type](ctx, e, t, dt);
      this.glitter(t, dt);
    }
    st(e) { let s = this.state.get(e); if (!s) this.state.set(e, (s = {})); return s; }
    roomGlow(ctx, e, t) {
      const col = e.color || '255,150,60';
      const a = (e.a || 0.07) + (e.flicker == null ? 0.035 : e.flicker) * wobble(t * 2, 1);
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, this.d.width, this.d.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    /** Soft pulsing light: {x, y, r, color:'r,g,b', a, speed} */
    glow(ctx, e, t) {
      const a = (e.a || 0.3) * (0.7 + 0.3 * Math.sin(t * (e.speed || 1.5) + (e.x || 0)));
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      g.addColorStop(0, `rgba(${e.color || '255,220,150'},${a})`); g.addColorStop(1, `rgba(${e.color || '255,220,150'},0)`);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    /** Shimmering aurora curtains inside rect: {rect:[x,y,w,h], colors:['80,255,170', ...], a} */
    aurora(ctx, e, t) {
      const [x, y, w, h] = e.rect;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      (e.colors || ['80,255,170', '90,200,255', '190,110,255']).forEach((c, b) => {
        const base = y + h * (0.35 + b * 0.12);
        for (let px = x; px < x + w; px += 6) {
          const yy = base + Math.sin(px / 130 + t * 0.35 + b * 2) * h * 0.12 + Math.sin(px / 47 + t * 0.9 + b) * h * 0.04;
          const hh = h * (0.28 + 0.12 * Math.sin(px / 70 + t * 0.6 + b * 3));
          const a = (e.a || 0.22) * (0.6 + 0.4 * Math.sin(px / 33 + t * 1.3 + b));
          const g = ctx.createLinearGradient(0, yy - hh, 0, yy + 10);
          g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.8, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g; ctx.fillRect(px, yy - hh, 6, hh + 10);
        }
      });
      ctx.restore();
    }
    /** Chimney smoke / steam puffs: {x, y, rate, rise, size, color:'r,g,b', a} */
    smoke(ctx, e, t, dt) {
      const s = this.st(e);
      s.p = s.p || [];
      if (dt && Math.random() < dt * (e.rate || 2.2)) s.p.push({ x: e.x, y: e.y, life: 0, max: 3 + Math.random() * 2, r: (e.size || 10) * (0.7 + Math.random() * 0.5), dx: (Math.random() - 0.3) * 8 });
      s.p = s.p.filter((p) => (p.life += dt) < p.max);
      for (const p of s.p) {
        const k = p.life / p.max;
        p.y -= (e.rise || 22) * dt; p.x += (p.dx + Math.sin(t + p.max) * 4) * dt;
        ctx.globalAlpha = (e.a || 0.35) * Math.sin(k * Math.PI);
        ctx.fillStyle = `rgb(${e.color || '230,235,245'})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * 1.6), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    /** Design-specific animation: {draw(ctx, t, dt, state, design)} */
    custom(ctx, e, t, dt) {
      ctx.save();
      try { e.draw(ctx, t, dt, this.st(e), this.d, this.data); } catch (err) { /* keep the board alive */ }
      ctx.restore();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    fire(ctx, e, t, dt) {
      const path = this.archPaths[e.arch] || (this.archPaths[e.arch] = new Path2D(e.arch));
      ctx.save(); ctx.clip(path);
      ctx.globalCompositeOperation = 'lighter';
      const N = 9, span = e.x1 - e.x0;
      const layer = (scaleH, scaleW, c0, c1, alpha, seed) => {
        for (let i = 0; i < N; i++) {
          const center = 1 - Math.abs(i - (N - 1) / 2) / N;
          const bx = e.x0 + ((i + 0.5) * span) / N + Math.sin(t * 0.8 + i + seed) * 5;
          const h = e.height * scaleH * center * (0.62 + 0.38 * wobble(t * 1.6, i * 2.1 + seed));
          const w = (span / N) * 2 * scaleW;
          const sway = wobble(t * 2.2, i * 3.7 + seed) * w * 0.45;
          const g = ctx.createLinearGradient(0, e.base, 0, e.base - h);
          g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, 'rgba(160,30,0,0)');
          ctx.globalAlpha = alpha; ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(bx - w / 2, e.base);
          ctx.bezierCurveTo(bx - w * 0.6, e.base - h * 0.4, bx - w * 0.15 + sway * 0.5, e.base - h * 0.75, bx + sway, e.base - h);
          ctx.bezierCurveTo(bx + w * 0.15 + sway * 0.5, e.base - h * 0.75, bx + w * 0.6, e.base - h * 0.4, bx + w / 2, e.base);
          ctx.fill();
        }
      };
      const mid = (e.x0 + e.x1) / 2;
      const base = ctx.createRadialGradient(mid, e.base, 0, mid, e.base, 170);
      base.addColorStop(0, 'rgba(255,170,60,.55)'); base.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = base; ctx.globalAlpha = 0.8 + 0.2 * wobble(t * 3, 4); ctx.fillRect(e.x0 - 60, e.base - 170, span + 120, 200);
      layer(1, 1, 'rgba(255,120,30,.9)', 'rgba(230,60,10,.55)', 0.85, 0);
      layer(0.72, 0.7, 'rgba(255,220,120,.95)', 'rgba(255,140,40,.6)', 0.9, 11);
      layer(0.38, 0.45, 'rgba(255,255,220,1)', 'rgba(255,210,120,.7)', 0.85, 23);
      // embers
      if (dt && Math.random() < dt * 9) this.embers.push({ x: e.x0 + 40 + Math.random() * (span - 80), y: e.base - 10, vy: -40 - Math.random() * 60, vx: (Math.random() - 0.5) * 20, life: 0, max: 1.2 + Math.random() * 1.4 });
      ctx.globalAlpha = 1;
      this.embers = this.embers.filter((p) => (p.life += dt) < p.max);
      for (const p of this.embers) {
        p.y += p.vy * dt; p.x += (p.vx + Math.sin(t * 4 + p.max * 9) * 12) * dt;
        ctx.fillStyle = `rgba(255,${150 + Math.round(80 * (1 - p.life / p.max))},60,${1 - p.life / p.max})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 7); ctx.fill();
      }
      ctx.restore();
      // iron andirons in front of the flames
      ctx.globalCompositeOperation = 'source-over';
      (e.andirons || []).forEach(([x, y]) => {
        ctx.fillStyle = '#140a06';
        ctx.fillRect(x - 5, y - 52, 10, 52);
        ctx.beginPath(); ctx.arc(x, y - 58, 11, 0, 7); ctx.fill();
        ctx.fillRect(x - 22, y - 6, 44, 8);
        ctx.fillStyle = `rgba(255,140,50,${0.45 + 0.2 * wobble(t * 3, x)})`;
        ctx.beginPath(); ctx.arc(x - 3, y - 61, 3.5, 0, 7); ctx.fill();
        ctx.fillRect(x - 5, y - 46, 2.5, 40);
      });
      if (e.grate) { ctx.fillStyle = '#140a06'; ctx.fillRect(...e.grate); }
    }
    snow(ctx, e, t, dt) {
      const [x, y, w, h] = e.rect;
      const s = this.st(e);
      if (!s.flakes) s.flakes = Array.from({ length: e.count || 60 }, () => this.newFlake(e, true));
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = e.color || '#fff';
      for (let i = 0; i < s.flakes.length; i++) {
        const f = s.flakes[i];
        f.y += f.vy * dt * (e.speed || 1);
        if (f.y > y + h) s.flakes[i] = this.newFlake(e, false);
        ctx.globalAlpha = e.a || 0.85;
        ctx.beginPath(); ctx.arc(f.x + Math.sin(t * 0.9 + f.ph) * f.sw, f.y, f.r, 0, 7); ctx.fill();
      }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    twinkle(ctx, e, t) {
      ctx.globalCompositeOperation = 'lighter';
      const L = this.data.lights;
      for (let i = 0; i < L.length; i++) {
        const l = L[i];
        const p = 0.5 + 0.5 * Math.sin(t * (1.1 + (i % 7) * 0.23) + i * 2.4);
        ctx.globalAlpha = 0.18 + 0.82 * p * p;
        const s = l.r * 8;
        ctx.drawImage(glowSprite(l.c), l.x - s / 2, l.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    candles(ctx, e, t) {
      for (const [i, c] of this.data.candles.entries()) {
        const k = c.s || 1;
        const fl = wobble(t * 3, i * 5);
        const h = (17 + fl * 3) * k, sway = wobble(t * 2.4, i * 7) * 2.2 * k;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 + 0.15 * fl;
        ctx.drawImage(glowSprite('#ffb84d'), c.x - 36 * k, c.y - 46 * k, 72 * k, 72 * k);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        const g = ctx.createLinearGradient(0, c.y + 2, 0, c.y - h);
        g.addColorStop(0, '#ff8a1e'); g.addColorStop(0.35, '#ffd36b'); g.addColorStop(1, '#fffbe6');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y + 3);
        ctx.bezierCurveTo(c.x - 7 * k, c.y - 2 * k, c.x - 3 * k + sway, c.y - h * 0.7, c.x + sway, c.y - h);
        ctx.bezierCurveTo(c.x + 3 * k + sway, c.y - h * 0.7, c.x + 7 * k, c.y - 2 * k, c.x, c.y + 3 * k);
        ctx.fill();
        ctx.fillStyle = 'rgba(60,110,255,.55)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 2.4 * k, 3.5 * k, 0, 0, 7); ctx.fill();
      }
    }
    star(ctx, e, t) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(t * 0.12);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        const len = e.r * (i % 2 ? 0.7 : 1.15) * (0.85 + 0.15 * Math.sin(t * 2 + i));
        const g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, 'rgba(255,236,170,.55)'); g.addColorStop(1, 'rgba(255,236,170,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(len, 0); ctx.lineTo(0, 3); ctx.fill();
      }
      ctx.restore(); ctx.globalCompositeOperation = 'source-over';
    }
    glitter(t, dt) {
      const ctx = this.g.getContext('2d');
      ctx.clearRect(0, 0, this.d.width, this.d.height);
      if (this.reduced) return;
      if (Math.random() < dt * 14) this.sparkles.push({ x: Math.random() * this.d.width, y: Math.random() * this.d.height, life: 0, max: 0.9 + Math.random() * 0.9, s: 3 + Math.random() * 6, gold: Math.random() < 0.5 });
      this.sparkles = this.sparkles.filter((p) => (p.life += dt) < p.max);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of this.sparkles) {
        const a = Math.sin((p.life / p.max) * Math.PI);
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = p.gold ? '#ffe7a3' : '#ffffff';
        const s = p.s * (0.6 + a * 0.4);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
        ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ---------------- number styling ---------------- */
  const NUM_STYLES = ['n-gold', 'n-cream', 'n-tag', 'n-swash', 'n-gold', 'n-red'];
  const NUM_POS = ['c', 'c', 'tl', 'br', 'c', 'tr', 'bl'];

  /* ---------------- the board ---------------- */
  class Board {
    /**
     * opts: { calendar, days: {n: {caption, image_url}}, opened: Set, mode: 'live'|'preview'|'hero',
     *         onOpened(day), getImage(day) -> Promise<url>|url, onLocked(day) }
     */
    constructor(host, opts) {
      this.host = host; this.o = opts;
      this.cal = opts.calendar;
      this.design = A.designs[this.cal.design] || A.designs.parlor;
      this.layout = A.layouts[this.design.layout];
      this.opened = new Set(opts.opened || []);
      this.doors = {};
      this.uid = 'b' + Math.random().toString(36).slice(2, 8);
      this.render();
    }
    unlocked(day) {
      if (this.o.mode === 'preview') return true;
      if (this.o.mode === 'hero') return false;
      return isUnlocked(this.cal, day);
    }
    async render() {
      const d = this.design;
      const stage = el(`<div class="board-stage ${this.o.mode === 'hero' ? 'is-hero' : ''}">
        <div class="board-frame"><div class="board-mat">
          <div class="board" style="width:${d.width}px;height:${d.height}px">
            <div class="board-art"></div>
            <canvas class="board-fx" aria-hidden="true"></canvas>
            <svg class="board-title" viewBox="0 0 ${d.width} ${d.height}" aria-hidden="true">
              <path id="${this.uid}-tp" d="${d.title.path}" fill="none"/>
              <text class="board-title-text" font-size="${d.title.size}" style="${d.title.fill ? `fill:${d.title.fill};` : ''}${d.title.stroke ? `stroke:${d.title.stroke};` : ''}"><textPath href="#${this.uid}-tp" startOffset="50%" text-anchor="middle">${esc(this.cal.title || 'Merry Christmas')}</textPath></text>
            </svg>
            <div class="doors"></div>
            <canvas class="board-glitter" aria-hidden="true"></canvas>
          </div>
        </div></div>
        <div class="board-loading" aria-hidden="true"><span></span></div>
      </div>`);
      this.stage = stage;
      this.boardEl = stage.querySelector('.board');
      this.frameEl = stage.querySelector('.board-frame');
      this.host.appendChild(stage);
      this.fx = new Effects(d, stage.querySelector('.board-fx'), stage.querySelector('.board-glitter'));
      this.fit();
      this.ro = new ResizeObserver(() => this.fit());
      this.ro.observe(this.host);

      const url = await sceneURL(d.id);
      if (this.destroyed) return;
      this.art = url;
      stage.querySelector('.board-art').style.backgroundImage = `url("${url}")`;
      this.buildDoors();
      stage.classList.add('ready');
      this.scrollToToday();
      this.fx.start();
      this.fitTitle();
      this.onVis = () => (document.hidden ? this.fx.stop() : this.fx.start());
      document.addEventListener('visibilitychange', this.onVis);
    }
    fit() {
      const d = this.design;
      const hostW = this.host.clientWidth, hostH = this.host.clientHeight || window.innerHeight;
      const pad = this.o.mode === 'hero' ? 18 : 30; // frame + mat thickness in px (each side)
      let s = Math.min((hostW - pad * 2) / d.width, (hostH - pad * 2) / d.height);
      const minS = this.o.mode === 'hero' ? 0.12 : 0.46;
      this.scrolls = s < minS;
      if (s < minS) s = Math.max(minS, Math.min(0.95, (hostH - pad * 2 - 16) / d.height));
      s = Math.max(0.1, s);
      this.scale = s;
      this.boardEl.style.transform = `scale(${s})`;
      const mat = this.stage.querySelector('.board-mat');
      mat.style.width = d.width * s + 'px';
      mat.style.height = d.height * s + 'px';
      this.stage.classList.toggle('scrolls', this.scrolls);
      this.fx && this.fx.resize(s);
    }
    scrollToToday() {
      if (!this.scrolls) return;
      const t = this.layout.find((L) => this.doors[L.day] && this.doors[L.day].classList.contains('today')) || this.layout.find((L) => L.day === 1);
      const x = (t.x + t.w / 2) * this.scale - this.stage.clientWidth / 2;
      this.stage.scrollLeft = Math.max(0, x);
    }
    async fitTitle() {
      try { await document.fonts.ready; } catch (e) { /* ignore */ }
      const t = this.stage.querySelector('.board-title-text');
      if (!t) return;
      const max = this.design.title.maxWidth;
      let size = this.design.title.size;
      t.setAttribute('font-size', size);
      const len = t.getComputedTextLength();
      if (len > max) t.setAttribute('font-size', Math.max(22, Math.floor((size * max) / len)));
    }
    setTitle(text) {
      const tp = this.stage.querySelector('.board-title-text textPath');
      if (tp) { tp.textContent = text || 'Merry Christmas'; this.fitTitle(); }
    }

    buildDoors() {
      const wrap = this.stage.querySelector('.doors');
      const R = A.util.rng(this.cal.start_month * 31 + 7);
      const art = this.art, d = this.design;
      const face = (x, y) => `background-image:url('${art}');background-size:${d.width}px ${d.height}px;background-position:${-x}px ${-y}px`;
      for (const L of this.layout) {
        const day = L.day;
        const NS = d.numStyles || NUM_STYLES;
        const pickStyle = NS[Math.floor(R() * NS.length)];
        const style = day === 24 ? 'n-tag' : pickStyle; // the big day always gets the most legible number
        const pos = day === 24 ? 'c' : NUM_POS[Math.floor(R() * NUM_POS.length)];
        const numSize = Math.round(Math.min(L.w, L.h) * (day === 24 ? 0.46 : 0.46));
        const dateLabel = `${MONTHS[this.cal.start_month - 1].slice(0, 3)} ${day}`;
        const back = `<span class="flap-face flap-back"><span class="flap-note"><span class="flap-day">${dateLabel}</span><span class="flap-text"></span></span></span>`;
        const leaves = L.hinge === 'double'
          ? `<span class="leaf leaf-l"><span class="flap-face flap-front" style="${face(L.x, L.y)}"></span><span class="flap-face flap-back"><span class="flap-note"><span class="flap-day">${dateLabel}</span></span></span></span>
             <span class="leaf leaf-r"><span class="flap-face flap-front" style="${face(L.x + L.w / 2, L.y)}"></span><span class="flap-face flap-back"><span class="flap-note"><span class="flap-text"></span></span></span></span>
             <span class="door-num ${style} pos-c" style="font-size:${numSize}px">${day}</span>`
          : `<span class="flap-face flap-front" style="${face(L.x, L.y)}"><span class="door-num ${style} pos-${pos}" style="font-size:${numSize}px">${day}</span></span>${back}`;
        const door = el(`<div class="door hinge-${L.hinge}" data-day="${day}" style="left:${L.x}px;top:${L.y}px;width:${L.w}px;height:${L.h}px">
          <div class="door-shadow"></div>
          <div class="door-well"><img class="door-photo" alt="" decoding="async"><span class="door-well-shade"></span></div>
          <button class="door-flap" type="button">${leaves}</button>
        </div>`);
        wrap.appendChild(door);
        const btn = door.querySelector('.door-flap');
        btn.addEventListener('click', () => this.onDoor(day));
        // once a door is open, the photo in the opening brings up the big view too
        door.querySelector('.door-well').addEventListener('click', () => { if (door.classList.contains('open')) this.onDoor(day); });
        this.doors[day] = door;
        this.refreshDoor(day, true);
      }
    }
    dayData(day) { return (this.o.days && this.o.days[day]) || null; }
    async loadPhoto(day) {
      const door = this.doors[day];
      const img = door.querySelector('.door-photo');
      if (img.dataset.loaded) return img;
      const data = this.dayData(day);
      let src = data && data.image_url;
      if (!src && this.o.getImage) src = await this.o.getImage(day);
      if (!src) { door.classList.add('no-photo'); img.dataset.loaded = '1'; return img; }
      img.style.objectPosition = focusCSS(data);
      img.src = src;
      img.dataset.loaded = '1';
      try { await img.decode(); } catch (e) { /* ignore */ }
      return img;
    }
    refreshDoor(day, initial) {
      const door = this.doors[day];
      const unlocked = this.unlocked(day);
      const isOpen = this.opened.has(day) && unlocked;
      const data = this.dayData(day);
      door.classList.toggle('locked', !unlocked);
      door.classList.toggle('today', unlocked && !isOpen && this.o.mode !== 'preview' && daysUntil(this.cal, day) === 0);
      door.classList.toggle('ready-to-open', unlocked && !isOpen);
      door.classList.toggle('open', isOpen);
      door.classList.toggle('written', isOpen);
      if (initial) door.classList.add('no-anim');
      const caption = (data && data.caption) || '';
      door.querySelectorAll('.flap-text').forEach((t) => (t.textContent = caption));
      const label = unlocked
        ? `Day ${day}${isOpen ? ', opened' : ', ready to open'}`
        : `Day ${day}, opens ${fmtDate(this.cal.start_year, this.cal.start_month, day)}`;
      door.querySelector('.door-flap').setAttribute('aria-label', label);
      if (isOpen || (unlocked && this.o.mode !== 'hero')) this.loadPhoto(day);
      if (isOpen) requestAnimationFrame(() => this.fitNote(door));
      if (initial) setTimeout(() => door.classList.remove('no-anim'), 60);
    }
    fitNote(door) {
      door.querySelectorAll('.flap-note').forEach((note) => {
        const text = note.querySelector('.flap-text');
        if (!text) return;
        const h = door.clientHeight;
        let size = Math.max(10, Math.min(22, h * 0.15));
        text.style.fontSize = size + 'px';
        let guard = 30;
        while (note.scrollHeight > note.clientHeight + 1 && size > 9 && guard--) { size -= 1; text.style.fontSize = size + 'px'; }
        note.classList.toggle('clipped', note.scrollHeight > note.clientHeight + 1);
      });
    }

    async onDoor(day) {
      if (this.o.mode === 'hero' || this.busy) return;
      const door = this.doors[day];
      if (!this.unlocked(day)) {
        door.classList.remove('shake'); void door.offsetWidth; door.classList.add('shake');
        const n = daysUntil(this.cal, day);
        const when = fmtDate(this.cal.start_year, this.cal.start_month, day, true);
        this.o.onLocked ? this.o.onLocked(day, n, when) : A.util.toast(`Door ${day} opens ${when}. ${n === 1 ? 'Just one more sleep.' : `${n} sleeps to go.`}`);
        return;
      }
      this.busy = true;
      try {
        if (!this.opened.has(day)) {
          await this.loadPhoto(day);
          door.classList.add('open');
          door.classList.remove('ready-to-open', 'today');
          this.opened.add(day);
          if (this.o.onOpened) Promise.resolve(this.o.onOpened(day)).catch(() => {});
          await sleep(A.util.prefersReducedMotion() ? 50 : 900);
        }
        await this.showDay(day);
      } finally {
        this.busy = false;
      }
    }

    /* ---------------- the big view ---------------- */
    async showDay(day) {
      this.fx.stop();
      const lb = new Lightbox(this, day);
      const finalDay = await lb.run();
      // the note lands on the flap of whichever door we return to
      const door = this.doors[finalDay];
      if (!door.classList.contains('written')) {
        this.fitNote(door);
        door.classList.add('written', 'writing');
        setTimeout(() => door.classList.remove('writing'), 1600);
      }
      this.fx.start();
      door.querySelector('.door-flap').focus({ preventScroll: true });
    }
    openGallery() { return openGallery(this); }
    openedDays() {
      return [...this.opened].filter((d) => this.unlocked(d)).sort((a, b) => a - b);
    }
    setOpened(set) {
      this.opened = new Set(set);
      Object.keys(this.doors).forEach((d) => this.refreshDoor(Number(d), true));
    }
    destroy() {
      this.destroyed = true;
      this.fx && this.fx.stop();
      this.ro && this.ro.disconnect();
      document.removeEventListener('visibilitychange', this.onVis);
      this.stage && this.stage.remove();
    }
  }

  /** The written note for a day (shared by the big view and the gallery). */
  function noteHTML(board, day) {
    const cal = board.cal, data = board.dayData(day) || {};
    const caption = data.caption ? esc(data.caption) : '<span class="lb-empty">Nothing written behind this door yet.</span>';
    return `<p class="lb-eyebrow">Day ${day} of 24</p>
      <h2 class="lb-date">${fmtDate(cal.start_year, cal.start_month, day, true)}</h2>
      <div class="lb-rule" aria-hidden="true"></div>
      <p class="lb-text">${caption}</p>
      ${cal.from_name ? `<p class="lb-sign">${esc(cal.from_name)}</p>` : ''}`;
  }

  /** Every door opened so far, in one scrolling page: full-size photo and note, alternating sides. */
  async function openGallery(board) {
    const days = board.openedDays();
    if (!days.length) { A.util.toast('Open a door first. Every door you open shows up here.'); return; }
    if (document.querySelector('.gallery')) return;
    board.fx.stop();
    const cal = board.cal;
    const root = el(`<div class="gallery" role="dialog" aria-modal="true" aria-label="Gallery">
      <header class="gal-bar">
        <div class="gal-title">${esc(cal.title || 'Advent calendar')}<small>${days.length === 24 ? 'All 24 doors' : `${days.length} of 24 doors opened`}</small></div>
        <button class="lb-btn gal-close" type="button" aria-label="Close the gallery">&#215;</button>
      </header>
      <div class="gal-scroll"><div class="gal-list"></div><p class="gal-end">${days.length === 24 ? 'Merry Christmas' : 'More to come as each door opens'}</p></div>
    </div>`);
    const list = root.querySelector('.gal-list');
    for (const d of days) {
      const doorImg = await board.loadPhoto(d);
      const src = doorImg.getAttribute('src');
      list.appendChild(el(`<section class="gal-row" id="gal-day-${d}">
        <figure class="gal-photo">${src ? `<img alt="Day ${d}" src="${esc(src)}" decoding="async">` : '<div class="gal-photo-empty">No photo behind this door</div>'}</figure>
        <article class="gal-note">${noteHTML(board, d)}</article>
      </section>`));
    }
    document.body.appendChild(root);
    document.documentElement.classList.add('lb-lock');
    void root.offsetWidth; // commit the hidden state so the fade-in runs
    root.classList.add('in');
    // rows drift in as they scroll into view
    let io = null;
    if (!A.util.prefersReducedMotion() && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } }), { root: root.querySelector('.gal-scroll'), threshold: 0.12 });
      list.querySelectorAll('.gal-row').forEach((r) => io.observe(r));
      // safety net: if the browser never reports visibility, show everything rather than blank rows
      setTimeout(() => { if (!list.querySelector('.gal-row.shown')) list.querySelectorAll('.gal-row').forEach((r) => r.classList.add('shown')); }, 1500);
    } else list.querySelectorAll('.gal-row').forEach((r) => r.classList.add('shown'));
    const close = () => {
      window.removeEventListener('keydown', onKey);
      io && io.disconnect();
      root.classList.remove('in');
      setTimeout(() => { root.remove(); document.documentElement.classList.remove('lb-lock'); board.fx.start(); }, 300);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const btn = root.querySelector('.gal-close');
    btn.addEventListener('click', close);
    btn.focus({ preventScroll: true });
  }

  class Lightbox {
    constructor(board, day) { this.b = board; this.day = day; }
    wellRect(day) { return this.b.doors[day].querySelector('.door-well').getBoundingClientRect(); }
    layout(img) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const wide = vw >= 860;
      const ar = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 4 / 3;
      let box;
      if (wide) {
        const pad = Math.max(28, vw * 0.035);
        box = { x: pad, y: pad + 10, w: vw * 0.6 - pad * 1.5, h: vh - pad * 2 - 20 };
      } else {
        box = { x: 16, y: 64, w: vw - 32, h: vh * 0.5 - 64 };
      }
      let w = box.w, h = w / ar;
      if (h > box.h) { h = box.h; w = h * ar; }
      return { left: box.x + (box.w - w) / 2, top: box.y + (box.h - h) / 2, width: w, height: h, wide };
    }
    noteHTML(day) { return noteHTML(this.b, day); }
    async run() {
      const reduced = A.util.prefersReducedMotion();
      const dur = reduced ? 1 : 720;
      const root = el(`<div class="lightbox" role="dialog" aria-modal="true" aria-label="Day ${this.day}">
        <div class="lb-backdrop"></div>
        <div class="lb-photo"><img alt=""><div class="lb-photo-empty">No photo behind this door yet</div></div>
        <article class="lb-note"></article>
        <div class="lb-controls">
          <button class="lb-btn lb-prev" type="button" aria-label="Previous opened day">&#8249;</button>
          <button class="lb-btn lb-next" type="button" aria-label="Next opened day">&#8250;</button>
          <button class="lb-btn lb-close" type="button" aria-label="Close and return to the calendar">&#215;</button>
        </div>
      </div>`);
      document.body.appendChild(root);
      document.documentElement.classList.add('lb-lock');
      const photo = root.querySelector('.lb-photo'), img = photo.querySelector('img'), note = root.querySelector('.lb-note');
      const setContent = async (day) => {
        const doorImg = await this.b.loadPhoto(day);
        const has = !!doorImg.getAttribute('src');
        photo.classList.toggle('empty', !has);
        if (has) { img.style.objectPosition = doorImg.style.objectPosition; img.src = doorImg.src; try { await img.decode(); } catch (e) { /* ignore */ } }
        note.innerHTML = this.noteHTML(day);
        root.setAttribute('aria-label', `Day ${day}`);
        const days = this.b.openedDays();
        root.querySelector('.lb-prev').disabled = days.indexOf(day) <= 0;
        root.querySelector('.lb-next').disabled = days.indexOf(day) >= days.length - 1;
      };
      await setContent(this.day);
      const hideDoorPhoto = (day, hide) => this.b.doors[day].classList.toggle('lifted', hide);

      // fly out of the door
      const from = this.wellRect(this.day);
      let to = this.layout(photo.classList.contains('empty') ? null : img);
      root.classList.toggle('narrow', !to.wide);
      Object.assign(photo.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' });
      hideDoorPhoto(this.day, true);
      root.classList.add('in');
      await photo.animate([
        { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: '2px', boxShadow: '0 0 0 rgba(0,0,0,0)' },
        { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' },
      ], { duration: dur, easing: 'cubic-bezier(.2,.75,.12,1)' }).finished;
      root.classList.add('note-in');
      root.querySelector('.lb-close').focus({ preventScroll: true });

      return await new Promise((resolve) => {
        let closing = false;
        const relayout = () => {
          to = this.layout(photo.classList.contains('empty') ? null : img);
          root.classList.toggle('narrow', !to.wide);
          Object.assign(photo.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' });
        };
        const go = async (dir) => {
          const days = this.b.openedDays();
          const i = days.indexOf(this.day) + dir;
          if (i < 0 || i >= days.length) return;
          root.classList.add('swap');
          await sleep(reduced ? 1 : 220);
          hideDoorPhoto(this.day, false);
          this.day = days[i];
          hideDoorPhoto(this.day, true);
          await setContent(this.day);
          relayout();
          root.classList.remove('swap');
        };
        const close = async () => {
          if (closing) return; closing = true;
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('resize', relayout);
          root.classList.remove('note-in');
          root.classList.add('out');
          const back = this.wellRect(this.day);
          const cur = photo.getBoundingClientRect();
          await photo.animate([
            { left: cur.left + 'px', top: cur.top + 'px', width: cur.width + 'px', height: cur.height + 'px' },
            { left: back.left + 'px', top: back.top + 'px', width: back.width + 'px', height: back.height + 'px', borderRadius: '2px' },
          ], { duration: reduced ? 1 : 620, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
          hideDoorPhoto(this.day, false);
          root.remove();
          document.documentElement.classList.remove('lb-lock');
          resolve(this.day);
        };
        const onKey = (e) => {
          if (e.key === 'Escape') close();
          else if (e.key === 'ArrowRight') go(1);
          else if (e.key === 'ArrowLeft') go(-1);
          else if (e.key === 'Tab') {
            const f = [...root.querySelectorAll('button:not([disabled])')];
            const i = f.indexOf(document.activeElement);
            e.preventDefault();
            f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
          }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', relayout);
        root.querySelector('.lb-close').addEventListener('click', close);
        root.querySelector('.lb-backdrop').addEventListener('click', close);
        root.querySelector('.lb-prev').addEventListener('click', () => go(-1));
        root.querySelector('.lb-next').addEventListener('click', () => go(1));
      });
    }
  }

  A.Board = Board;
  A.sceneURL = sceneURL;
})();
