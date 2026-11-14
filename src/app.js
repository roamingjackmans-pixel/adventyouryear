/* Advent Your Year — app shell, routing and views */
(function () {
  const A = window.AYY;
  const U = A.util;
  const { esc, el } = U;
  const cfg = window.AYY_CONFIG || {};
  const live = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const api = live ? A.apiLive(cfg) : A.apiPreview;
  const app = document.getElementById('app');
  let board = null;
  let cleanup = [];

  /* ---------------- catalog of designs ---------------- */
  const CATALOG = [
    ['parlor', 'Christmas Eve Parlor', 'Fireside sitting room, stockings, a twinkling tree and snow at the window.', '#5c111b', '#1d4d2f'],
    ['tannenbaum', 'O Tannenbaum', 'One grand traditional tree glowing in a snowy town square.', '#1d4d2f', '#0b2416'],
    ['wonderland', 'Winter Wonderland', 'A hushed village under deep snow and lamplight.', '#7fa8d6', '#2c4f7c'],
    ['cats', 'Meowy & Bright', 'A pile of cats in Santa hats, tangled in tinsel.', '#2b1d4a', '#c46a3a'],
    ['dogs', 'Pups & Presents', 'Dogs in scarves, ribbons everywhere, nobody is sorry.', '#7a3b1d', '#e0a35a'],
    ['golf', 'Fairway Frost', 'Snow on the greens, a flag with a wreath, the 19th hole lit up.', '#2f6b3a', '#a9cdb2'],
    ['ski', 'Bluebird Powder Day', 'Chairlifts, fresh tracks and a lodge with a roaring fire.', '#1f5fa8', '#bcd8f2'],
    ['snowboard', 'Halfpipe Holiday', 'Snowboarders catching air over a festive terrain park.', '#3a1f6b', '#e05a8a'],
    ['sledding', 'Sledding Hill', 'Red toboggans, mittens and a long run to the bottom.', '#b3172b', '#e6d8c4'],
    ['workshop', 'Santa’s Workshop', 'Elves at their benches, toys stacked to the rafters.', '#8a1c1c', '#d9a83a'],
    ['train', 'North Pole Express', 'A steam train winding through snowy pines at night.', '#0e2a4a', '#c9963a'],
    ['gingerbread', 'Gingerbread Lane', 'A street of iced houses, gumdrop roofs and candy canes.', '#8a4a1f', '#e9c49a'],
    ['nutcracker', 'Nutcracker Night', 'Velvet curtains, sugar plums and a toy soldier on stage.', '#4a0d2a', '#c9a24a'],
    ['pond', 'Frozen Pond', 'Skaters circling a pond ringed with lanterns.', '#7fb3d5', '#1c3b5a'],
    ['cabin', 'Cabin in the Pines', 'A log cabin, smoke from the chimney, boots by the door.', '#23402d', '#d9904a'],
    ['victorian', 'Victorian Christmas', 'Carolers in top hats outside a gaslit shop window.', '#5a2a3a', '#d9c39a'],
    ['aurora', 'Northern Lights', 'Ribbons of green light over a snowy lake.', '#04121f', '#2fbf8a'],
    ['silentnight', 'Silent Night', 'A quiet stable beneath one bright star.', '#0a1630', '#d9b45a'],
    ['reindeer', 'Reindeer Games', 'Reindeer racing across a frosty meadow.', '#5a3a1f', '#a9c9e0'],
    ['snowman', 'Snowman Family', 'A whole snow family in scarves and button eyes.', '#c9d9ea', '#2a5aa8'],
  ].map(([id, name, blurb, c1, c2]) => ({ id, name, blurb, c1, c2, available: !!(A.designs[id] && A.layouts && A.layouts[id]) }));
  const designName = (id) => (CATALOG.find((d) => d.id === id) || CATALOG[0]).name;

  /* ---------------- helpers ---------------- */
  const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe7ae"/><stop offset="1" stop-color="#b8893a"/></linearGradient></defs><path d="M6 30V12a10 10 0 0 1 20 0v18Z" fill="#7a1020" stroke="url(#lg)" stroke-width="2"/><path d="M16 9l1.6 3.9 4.2.3-3.2 2.7 1 4.1L16 17.8 12.4 20l1-4.1-3.2-2.7 4.2-.3Z" fill="url(#lg)"/><circle cx="21" cy="23" r="1.4" fill="url(#lg)"/></svg>`;
  const ICON_PHOTO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>`;

  function go(hash) { if (location.hash.slice(1) === hash) route(); else location.hash = hash; }
  function after(set) { try { if (set === undefined) { const v = sessionStorage.getItem('ayy-after'); sessionStorage.removeItem('ayy-after'); return v; } sessionStorage.setItem('ayy-after', set); } catch (e) { return null; } }
  function shareURL(token) {
    const base = cfg.publicUrl || (location.origin + location.pathname);
    return base.replace(/#.*$/, '') + '#share-' + token;
  }
  function defaultMonth() {
    const [y, m, d] = U.todayIn().split('-').map(Number);
    return m === 12 && d > 24 ? { y: y + 1, m: 12 } : { y, m: 12 };
  }
  function monthOptions(sel) {
    const [y, m] = U.todayIn().split('-').map(Number);
    let html = '', found = false;
    for (let i = 0; i < 14; i++) {
      const mm = ((m - 1 + i) % 12) + 1, yy = y + Math.floor((m - 1 + i) / 12);
      const v = `${yy}-${mm}`;
      if (v === sel) found = true;
      html += `<option value="${v}" ${v === sel ? 'selected' : ''}>${U.MONTHS[mm - 1]} ${yy}</option>`;
    }
    if (!found && sel) { const [sy, sm] = sel.split('-').map(Number); html = `<option value="${sel}" selected>${U.MONTHS[sm - 1]} ${sy}</option>` + html; }
    return html;
  }
  function setThumb(node, design) {
    A.sceneURL(design || 'parlor', 0.4).then((u) => { node.style.backgroundImage = `url("${u}")`; });
  }
  function formError(form, err) {
    let box = form.querySelector('.form-error');
    if (!box) { box = el('<div class="form-error" role="alert"></div>'); form.prepend(box); }
    box.textContent = err.message || String(err);
  }
  async function busy(btn, fn) {
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'One moment…';
    try { return await fn(); } finally { btn.disabled = false; btn.textContent = label; }
  }
  function teardown() {
    if (board) { board.destroy(); board = null; }
    cleanup.forEach((f) => f()); cleanup = [];
    document.querySelectorAll('.modal').forEach((m) => m.remove());
  }

  /* ---------------- shell ---------------- */
  function shell(inner) {
    const u = api.user();
    const nav = u
      ? `<span class="head-user">${esc(u.name)}</span><a class="btn ghost small" href="#dashboard">My calendars</a><button class="btn ghost small" data-act="signout" type="button">Sign out</button>`
      : `<a class="btn ghost small" href="#sample">See a sample</a><a class="btn ghost small" href="#signin">Sign in</a><a class="btn small" href="#signup">Create an account</a>`;
    app.innerHTML = `
      ${api.mode === 'preview' ? `<div class="demo-bar"><strong>Preview mode.</strong> Accounts and photos are saved only in this browser, and email codes appear on screen.</div>` : ''}
      <header class="site-head"><a class="logo" href="#home">${LOGO}<span>Advent <em>Your</em> Year</span></a><nav class="head-nav">${nav}</nav></header>
      <main>${inner}</main>
      <footer class="site-foot"><div class="wrap"><span>Advent Your Year &middot; photo advent calendars for the people you love</span><span>josephjackman.com</span></div></footer>`;
    const so = app.querySelector('[data-act="signout"]');
    if (so) so.addEventListener('click', async () => { await api.signOut(); go('home'); });
    window.scrollTo(0, 0);
  }

  /* ---------------- landing ---------------- */
  function sampleCalendar() {
    const [y, m] = U.todayIn().split('-').map(Number);
    return { id: 'sample', title: 'Merry Christmas, Mom & Dad', to_name: 'Mom & Dad', from_name: 'Joseph', design: 'parlor', start_year: y, start_month: m, timezone: U.localTz() };
  }
  function sampleDays() {
    const days = {};
    A.samples.notes.forEach((t, i) => (days[i + 1] = { caption: t, image_url: null }));
    return days;
  }

  function viewLanding() {
    shell(`
      <section class="wrap hero">
        <div>
          <p class="eyebrow">photo advent calendars</p>
          <h1>Twenty-four little doors, <em>a memory behind every one.</em></h1>
          <p class="lede">Choose a classic illustrated calendar, tuck a photo and a short note behind each door, then send it to someone you love. One door opens each day, and the whole calendar stays in their account to come back to.</p>
          <div class="hero-cta"><a class="btn gold" href="#signup">Make a calendar</a><a class="btn ghost" href="#sample">Open the sample calendar</a></div>
        </div>
        <div><div class="hero-board" id="hero-board"></div><p class="hero-caption">Christmas Eve Parlor, the first of twenty designs</p></div>
      </section>
      <section class="wrap steps">
        <div class="step"><b>step one</b><h3>Pick a design</h3><p>Traditional trees, snowy villages, cats, dogs, golf, skiing and more. Each one is a full illustrated scene with its own little doors.</p></div>
        <div class="step"><b>step two</b><h3>Fill the doors</h3><p>Add a photo and a few lines for each day. Choose the month, and each door unlocks on its own date.</p></div>
        <div class="step"><b>step three</b><h3>Send the link</h3><p>They make a free account and the calendar is saved there for good. When the 24th arrives, every photo is on display at once.</p></div>
      </section>`);
    board = new A.Board(document.getElementById('hero-board'), { calendar: sampleCalendar(), days: {}, mode: 'hero' });
  }

  /* ---------------- auth views ---------------- */
  function authCard(title, sub, body, alt) {
    shell(`<section class="wrap auth-wrap"><div class="paper auth-card"><h1>${title}</h1><p class="sub">${sub}</p>${body}${alt ? `<p class="alt">${alt}</p>` : ''}</div></section>`);
    return app.querySelector('form');
  }
  function afterAuth() {
    const next = after();
    go(next || 'dashboard');
  }

  function viewSignIn() {
    const f = authCard('Welcome back', 'Sign in to see your calendars.', `
      <form class="form" novalidate>
        <div class="field"><label for="si-email">Email</label><input class="input" id="si-email" type="email" autocomplete="email" required></div>
        <div class="field"><div class="row-between"><label for="si-pw">Password</label><a href="#forgot" style="font-size:14px;color:#7a1020">Forgot password?</a></div><input class="input" id="si-pw" type="password" autocomplete="current-password" required></div>
        <button class="btn" type="submit">Sign in</button>
      </form>`, `New here? <a href="#signup" style="color:#7a1020">Create an account</a>`);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = f.querySelector('#si-email').value, password = f.querySelector('#si-pw').value;
      busy(f.querySelector('button[type=submit]'), async () => {
        try { await api.signIn({ email, password }); afterAuth(); }
        catch (err) {
          if (err.code === 'unverified') { try { sessionStorage.setItem('ayy-verify', email); } catch (x) { /* ignore */ } go('verify'); return; }
          formError(f, err);
        }
      });
    });
  }

  function viewSignUp() {
    const f = authCard('Create your account', 'You’ll use it to make calendars and to keep the ones sent to you.', `
      <form class="form" novalidate>
        <div class="field"><label for="su-name">Your name</label><input class="input" id="su-name" autocomplete="name" required placeholder="How it appears on calendars you send"></div>
        <div class="field"><label for="su-email">Email</label><input class="input" id="su-email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="su-pw">Password</label><input class="input" id="su-pw" type="password" autocomplete="new-password" minlength="8" required><span class="hint">At least 8 characters.</span></div>
        <button class="btn" type="submit">Create account</button>
      </form>`, `Already have an account? <a href="#signin" style="color:#7a1020">Sign in</a>`);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = f.querySelector('#su-name').value, email = f.querySelector('#su-email').value, password = f.querySelector('#su-pw').value;
      if (!name.trim()) return formError(f, new Error('Add your name so people know who the calendar is from.'));
      busy(f.querySelector('button[type=submit]'), async () => {
        try {
          const r = await api.signUp({ name, email, password });
          if (r.needsCode) { try { sessionStorage.setItem('ayy-verify', email); } catch (x) { /* ignore */ } go('verify'); }
          else afterAuth();
        } catch (err) { formError(f, err); }
      });
    });
  }

  function viewVerify() {
    let email = '';
    try { email = sessionStorage.getItem('ayy-verify') || ''; } catch (e) { /* ignore */ }
    const f = authCard('Check your email', `We sent a 6-digit code to <b>${esc(email || 'your email')}</b>. Enter it here to confirm your account.`, `
      <form class="form" novalidate>
        ${email ? '' : '<div class="field"><label for="v-email">Email</label><input class="input" id="v-email" type="email" autocomplete="email" required></div>'}
        <div class="field"><label for="v-code">Verification code</label><input class="input code" id="v-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></div>
        <button class="btn" type="submit">Confirm email</button>
        <p class="form-note">Didn’t get it? Check spam, or <button class="linkish" type="button" data-act="resend">send a new code</button>.</p>
      </form>`, `<a href="#signin" style="color:#7a1020">Back to sign in</a>`);
    const getEmail = () => email || (f.querySelector('#v-email') || {}).value || '';
    f.querySelector('#v-code').focus();
    f.querySelector('[data-act="resend"]').addEventListener('click', async () => {
      try { await api.resendSignup(getEmail()); U.toast('A new code is on its way.'); } catch (err) { formError(f, err); }
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      busy(f.querySelector('button[type=submit]'), async () => {
        try { await api.verifySignup({ email: getEmail(), code: f.querySelector('#v-code').value }); U.clearToasts('mail'); U.toast('Email confirmed. Welcome!'); afterAuth(); }
        catch (err) { formError(f, err); }
      });
    });
  }

  function viewForgot() {
    const f = authCard('Reset your password', 'Enter your email and we’ll send you a code.', `
      <form class="form" novalidate data-step="1">
        <div class="field"><label for="fp-email">Email</label><input class="input" id="fp-email" type="email" autocomplete="email" required></div>
        <div class="fp-step2" hidden>
          <div class="form" style="gap:14px">
            <div class="field"><label for="fp-code">Code from the email</label><input class="input code" id="fp-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></div>
            <div class="field"><label for="fp-pw">New password</label><input class="input" id="fp-pw" type="password" autocomplete="new-password" minlength="8"><span class="hint">At least 8 characters.</span></div>
          </div>
        </div>
        <button class="btn" type="submit">Send code</button>
      </form>`, `<a href="#signin" style="color:#7a1020">Back to sign in</a>`);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = f.querySelector('button[type=submit]');
      const email = f.querySelector('#fp-email').value;
      if (f.dataset.step === '1') {
        busy(btn, async () => {
          try {
            await api.requestReset(email);
            f.dataset.step = '2';
            f.querySelector('.fp-step2').hidden = false;
            f.querySelector('#fp-code').focus();
            setTimeout(() => (btn.textContent = 'Set new password'), 0);
          } catch (err) { formError(f, err); }
        });
      } else {
        busy(btn, async () => {
          try { await api.resetPassword({ email, code: f.querySelector('#fp-code').value, password: f.querySelector('#fp-pw').value }); U.clearToasts('mail'); U.toast('Password updated. You’re signed in.'); afterAuth(); }
          catch (err) { formError(f, err); }
        }).then(() => { if (f.dataset.step === '2') btn.textContent = 'Set new password'; });
      }
    });
  }

  /* ---------------- dashboard ---------------- */
  async function viewDashboard() {
    const u = api.user();
    shell(`<div class="wrap dash"><div class="dash-head"><div><p class="eyebrow">your calendars</p><h1>Hello, ${esc(u.name)}</h1></div><a class="btn gold" href="#new">Make a new calendar</a></div>
      <section class="dash-section"><h2>Sent to you</h2><p>Calendars shared with your email address. They stay here for good.</p><div class="cards" id="recv"><div class="empty-note">Loading…</div></div></section>
      <section class="dash-section"><h2>Made by you</h2><p>Make as many as you like, one for each person or family. Fill the doors, then share each one with the emails it’s for.</p><div class="cards" id="mine"><div class="empty-note">Loading…</div></div></section></div>`);
    const [mine, recv] = await Promise.all([api.listMyCalendars().catch(() => []), api.listReceived().catch(() => [])]);
    const card = (c, kind) => {
      const range = `${U.MONTHS[c.start_month - 1]} 1–24, ${c.start_year}`;
      const pct = kind === 'mine' ? Math.round((c.filled / 24) * 100) : Math.round((c.opened / 24) * 100);
      const meta = kind === 'mine'
        ? `${range}${c.to_name ? ` &middot; for ${esc(c.to_name)}` : ''}<br>${c.filled} of 24 doors filled &middot; ${c.shared ? `shared with ${c.shared} ${c.shared === 1 ? 'person' : 'people'}` : 'not shared yet'}`
        : `${range}${c.from_name ? ` &middot; from ${esc(c.from_name)}` : ''}<br>${c.opened} of 24 doors opened`;
      const actions = kind === 'mine'
        ? `<a class="btn small" href="#edit-${c.id}">Edit doors</a><a class="btn ghost small" href="#preview-${c.id}">Preview</a><button class="btn ghost small" type="button" data-share="${c.id}">Share</button><button class="btn ghost small" type="button" data-download title="Save the photos and notes to your computer">Download</button>`
        : `<a class="btn small" href="#view-${c.id}">Open calendar</a><button class="btn ghost small" type="button" data-download title="Save the photos and notes to your computer">Download</button>`;
      const node = el(`<article class="cal-card"><div class="cal-thumb"></div><div class="cal-body"><h3>${esc(c.title || 'Untitled calendar')}</h3><div class="cal-meta">${meta}</div><div class="meter" aria-hidden="true"><i style="width:${pct}%"></i></div><div class="cal-actions">${actions}</div></div></article>`);
      setThumb(node.querySelector('.cal-thumb'), c.design);
      const sb = node.querySelector('[data-share]');
      if (sb) sb.addEventListener('click', () => shareModal(c, (l) => { c.shared = l.length; }));
      const dl = node.querySelector('[data-download]');
      dl.addEventListener('click', () => downloadCalendar(c.id, dl));
      return node;
    };
    const recvEl = document.getElementById('recv'), mineEl = document.getElementById('mine');
    if (!recvEl) return;
    recvEl.innerHTML = recv.length ? '' : `<div class="empty-note">Nothing yet. When someone shares a calendar with your email address, it will appear here.</div>`;
    recv.forEach((c) => recvEl.appendChild(card(c, 'recv')));
    mineEl.innerHTML = '';
    mine.forEach((c) => mineEl.appendChild(card(c, 'mine')));
    mineEl.appendChild(el(`<a class="new-card" href="#new"><div><span>Start a new calendar</span><br><small>Twenty designs to choose from</small></div></a>`));
  }

  /* ---------------- design picker ---------------- */
  function designTiles(selected) {
    return CATALOG.map((d) => `<button class="design-tile ${d.available ? 'available' : ''} ${d.id === selected ? 'selected' : ''}" type="button" data-design="${d.id}" ${d.available ? '' : 'disabled'}>
      <span class="swatch" ${d.available ? `data-thumb="${d.id}"` : `style="background:radial-gradient(circle at 20% 30%, rgba(255,255,255,.35) 0 2px, transparent 3px) 0 0/26px 26px, radial-gradient(circle at 70% 60%, rgba(255,255,255,.25) 0 1.5px, transparent 2.5px) 0 0/34px 34px, linear-gradient(135deg, ${d.c1}, ${d.c2})"`}>${d.available ? '' : `<span class="motif">${esc(d.name)}</span>`}</span>
      <span class="tag">${d.available ? 'Ready' : 'Coming soon'}</span>
      <span class="info"><b>${esc(d.name)}</b><small>${esc(d.blurb)}</small></span></button>`).join('');
  }
  function hydrateThumbs(root) { root.querySelectorAll('[data-thumb]').forEach((n) => setThumb(n, n.dataset.thumb)); }

  function viewNew() {
    shell(`<div class="wrap dash"><div class="dash-head"><div><p class="eyebrow">new calendar</p><h1>Choose a design</h1></div><a class="btn ghost" href="#dashboard">Back to my calendars</a></div>
      <div class="designs">${designTiles()}</div></div>`);
    hydrateThumbs(app);
    app.querySelectorAll('.design-tile.available').forEach((b) => b.addEventListener('click', async () => {
      const u = api.user();
      const { y, m } = defaultMonth();
      b.disabled = true;
      try {
        const c = await api.createCalendar({ title: 'Merry Christmas', to_name: '', from_name: u.name, design: b.dataset.design, start_year: y, start_month: m });
        go('edit-' + c.id);
      } catch (err) { U.toast(err.message, { kind: 'error' }); b.disabled = false; }
    }));
  }

  /* ---------------- editor ---------------- */
  async function viewEditor(id) {
    shell(`<div class="wrap"><p style="padding:40px 0;color:var(--muted)">Loading your calendar…</p></div>`);
    let data;
    try { data = await api.getCalendar(id); } catch (err) { return viewError(err.message); }
    if (data.role !== 'owner') return go('view-' + id);
    const c = data.calendar;
    const sel = `${c.start_year}-${c.start_month}`;
    shell(`<div class="wrap editor">
      <aside class="editor-side">
        <form class="paper form" id="settings" novalidate>
          <h2>Calendar details</h2>
          <div class="field"><label for="c-title">Title on the banner</label><input class="input" id="c-title" maxlength="40" value="${esc(c.title)}"></div>
          <div class="field"><label for="c-to">Who it’s for</label><input class="input" id="c-to" maxlength="60" value="${esc(c.to_name || '')}" placeholder="Mom & Dad"></div>
          <div class="field"><label for="c-from">Signed from</label><input class="input" id="c-from" maxlength="60" value="${esc(c.from_name || '')}"></div>
          <div class="field"><label for="c-month">Month the doors open</label><select class="select" id="c-month">${monthOptions(sel)}</select><span class="hint">Door 1 opens on the 1st, door 24 on the 24th.</span></div>
          <div class="field"><label>Design</label><div class="design-current"><span class="mini" data-thumb="${c.design}"></span><div><b>${esc(designName(c.design))}</b><button class="linkish" type="button" data-act="design">Change design</button></div></div></div>
          <div class="day-foot"><span></span><span id="settings-status"></span></div>
        </form>
        <div class="side-actions">
          <a class="btn gold" href="#preview-${c.id}">Preview the calendar</a>
          <button class="btn" type="button" data-act="share">Share the Calendar</button>
          <p class="shared-with" id="shared-with"></p>
          <button class="btn danger-text small" type="button" data-act="delete">Delete this calendar</button>
        </div>
      </aside>
      <section>
        <div class="days-head"><div><p class="eyebrow">behind the doors</p><h1>${esc(c.title || 'Your calendar')}</h1></div><span class="pill" id="fill-count"></span></div>
        <div class="days-grid" id="days"></div>
      </section>
    </div>`);
    hydrateThumbs(app);

    // settings autosave
    const form = document.getElementById('settings');
    const status = document.getElementById('settings-status');
    let st;
    const saveSettings = () => {
      clearTimeout(st);
      status.textContent = 'Saving…'; status.className = '';
      st = setTimeout(async () => {
        const [yy, mm] = form.querySelector('#c-month').value.split('-').map(Number);
        try {
          Object.assign(c, await api.updateCalendar(c.id, { title: form.querySelector('#c-title').value.trim() || 'Merry Christmas', to_name: form.querySelector('#c-to').value.trim(), from_name: form.querySelector('#c-from').value.trim(), start_year: yy, start_month: mm }));
          status.textContent = 'Saved'; status.className = 'saved';
          app.querySelector('.days-head h1').textContent = c.title;
          relabel();
        } catch (err) { status.textContent = err.message; }
      }, 500);
    };
    form.addEventListener('input', saveSettings);
    form.addEventListener('submit', (e) => e.preventDefault());
    form.querySelector('[data-act="design"]').addEventListener('click', () => designModal(c, (id2) => { api.updateCalendar(c.id, { design: id2 }).then(() => go('edit-' + c.id)); }));
    const sharedWith = document.getElementById('shared-with');
    const showShared = (l) => { sharedWith.textContent = l.length ? 'Shared with ' + l.join(', ') : 'Not shared with anyone yet.'; };
    api.listInvites(c.id).then(showShared).catch(() => {});
    app.querySelector('[data-act="share"]').addEventListener('click', () => shareModal(c, showShared));
    app.querySelector('[data-act="delete"]').addEventListener('click', () => confirmModal(`Delete “${c.title}”?`, 'This removes the calendar, its photos and notes, and it disappears for anyone you shared it with. This can’t be undone.', 'Delete calendar', async () => { await api.deleteCalendar(c.id); U.toast('Calendar deleted.'); go('dashboard'); }));

    // day cards
    const grid = document.getElementById('days');
    const counts = () => {
      let n = 0;
      grid.querySelectorAll('.day-card').forEach((d) => { if (d.dataset.filled === '1') n++; });
      document.getElementById('fill-count').textContent = `${n} of 24 doors filled`;
    };
    const relabel = () => grid.querySelectorAll('.day-card').forEach((card) => {
      const d = Number(card.dataset.day);
      card.querySelector('header span').textContent = 'Opens ' + U.fmtDate(c.start_year, c.start_month, d, true).replace(/^(\w{3})\w*/, '$1');
    });
    for (let d = 1; d <= 24; d++) {
      const day = data.days[d] || {};
      const card = el(`<article class="day-card" data-day="${d}">
        <header><b>${d}</b><span></span></header>
        <button class="day-photo" type="button" aria-label="Add a photo for day ${d}"><span class="ph-label">${ICON_PHOTO}<span>Add a photo</span></span></button>
        <input type="file" accept="image/*" hidden id="file-${d}">
        <div class="photo-tools" hidden><button type="button" data-act="focus">Adjust position</button><button type="button" data-act="replace">Replace</button><button type="button" data-act="remove">Remove</button></div>
        <label class="field" for="cap-${d}"><span class="hint" style="font-weight:600;color:var(--ink)">Note</span><textarea class="textarea" id="cap-${d}" maxlength="400" placeholder="A memory, a joke, a little message…">${esc(day.caption || '')}</textarea></label>
        <div class="day-foot"><span class="count"></span><span class="st"></span></div>
      </article>`);
      grid.appendChild(card);
      const photoBtn = card.querySelector('.day-photo'), file = card.querySelector('input[type=file]'), tools = card.querySelector('.photo-tools');
      const ta = card.querySelector('textarea'), st2 = card.querySelector('.st'), cnt = card.querySelector('.count');
      let hasPhoto = false, photoURL = null;
      let focus = day.focus || [50, 50];
      const setFilled = () => { card.dataset.filled = hasPhoto || ta.value.trim() ? '1' : '0'; counts(); };
      const showPhoto = (url) => {
        hasPhoto = !!url; photoURL = url || null;
        photoBtn.classList.toggle('has', hasPhoto);
        photoBtn.querySelector('img') && photoBtn.querySelector('img').remove();
        if (url) photoBtn.prepend(el(`<img alt="Photo for day ${d}" src="${esc(url)}" style="object-position:${focus[0]}% ${focus[1]}%">`));
        photoBtn.querySelector('.ph-label').hidden = hasPhoto;
        tools.hidden = !hasPhoto;
        setFilled();
      };
      showPhoto(day.image_url);
      const upload = async (f) => {
        if (!f || !/^image\//.test(f.type)) return U.toast('That file isn’t a photo. Choose a JPG, PNG or HEIC image.', { kind: 'error' });
        const ov = el('<span class="busy">Uploading…</span>'); photoBtn.appendChild(ov);
        try { const blob = await U.compressImage(f); focus = [50, 50]; showPhoto(await api.uploadPhoto(c.id, d, blob)); st2.textContent = 'Saved'; st2.className = 'st saved'; }
        catch (err) { U.toast(err.message || 'That photo couldn’t be uploaded. Try a different one.', { kind: 'error' }); }
        finally { ov.remove(); }
      };
      photoBtn.addEventListener('click', () => file.click());
      tools.querySelector('[data-act="replace"]').addEventListener('click', () => file.click());
      tools.querySelector('[data-act="focus"]').addEventListener('click', () => focusModal(c, d, photoURL, focus, async (f) => {
        focus = f;
        const im = photoBtn.querySelector('img'); if (im) im.style.objectPosition = `${f[0]}% ${f[1]}%`;
        st2.textContent = 'Saving…'; st2.className = 'st';
        try { await api.saveFocus(c.id, d, f[0], f[1]); st2.textContent = 'Saved'; st2.className = 'st saved'; }
        catch (err) { st2.textContent = 'Not saved'; U.toast(err.message, { kind: 'error' }); }
      }));
      tools.querySelector('[data-act="remove"]').addEventListener('click', async () => { await api.removePhoto(c.id, d); showPhoto(null); });
      file.addEventListener('change', () => { upload(file.files[0]); file.value = ''; });
      ['dragenter', 'dragover'].forEach((ev) => photoBtn.addEventListener(ev, (e) => { e.preventDefault(); photoBtn.classList.add('dragover'); }));
      ['dragleave', 'drop'].forEach((ev) => photoBtn.addEventListener(ev, () => photoBtn.classList.remove('dragover')));
      photoBtn.addEventListener('drop', (e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); });
      let t;
      const showCount = () => (cnt.textContent = ta.value.length ? `${ta.value.length}/400` : '');
      showCount();
      ta.addEventListener('input', () => {
        showCount(); setFilled();
        st2.textContent = 'Saving…'; st2.className = 'st';
        clearTimeout(t);
        t = setTimeout(async () => {
          try { await api.saveCaption(c.id, d, ta.value); st2.textContent = 'Saved'; st2.className = 'st saved'; }
          catch (err) { st2.textContent = 'Not saved'; U.toast(err.message, { kind: 'error' }); }
        }, 700);
      });
    }
    relabel(); counts();
  }

  /* ---------------- modals ---------------- */
  function modal(html, wide) {
    const m = el(`<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="paper">${html}</div></div>`);
    document.body.appendChild(m);
    const close = () => { m.remove(); window.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    const f = m.querySelector('input, button'); f && f.focus();
    return { m, close };
  }
  /** Choose which part of a photo shows through its little door (saved as object-position percentages). */
  function focusModal(c, d, url, start, onSave) {
    if (!url) return;
    const des = A.designs[c.design] || A.designs.parlor;
    const L = ((A.layouts && A.layouts[des.layout]) || []).find((l) => l.day === d);
    const a = L ? L.w / L.h : 1; // the door's shape for this day in this design
    const { m, close } = modal(`<h2>Day ${d}: what shows in the door</h2>
      <p style="color:var(--ink-soft)">Drag the bright frame over the part of the photo you want peeking out of door ${d}. The whole photo still shows when the door is opened up big.</p>
      <div class="focus-wrap">
        <div class="focus-stage"><div class="focus-pic"><img alt="Photo for day ${d}" src="${esc(url)}" draggable="false"><div class="focus-frame" tabindex="0" role="slider" aria-label="Photo position"></div></div></div>
        <figure class="focus-preview"><div class="focus-door" style="aspect-ratio:${a.toFixed(4)};width:${Math.round(Math.min(132, 180 * a))}px"><img alt="" src="${esc(url)}"></div><figcaption>How door ${d} will look</figcaption></figure>
      </div>
      <p class="focus-none hint" hidden>This photo is already the same shape as the door, so all of it shows.</p>
      <div class="modal-actions"><button class="btn ghost small" type="button" data-act="center" style="color:#6d0f1d;border-color:#c4a86e">Centre it</button><button class="btn ghost small" type="button" data-close style="color:#6d0f1d;border-color:#c4a86e">Cancel</button><button class="btn small" type="button" data-act="save">Save position</button></div>`);
    const stage = m.querySelector('.focus-pic'), img = stage.querySelector('img'), frame = m.querySelector('.focus-frame');
    const prev = m.querySelector('.focus-door img');
    let f = [start[0], start[1]], g = null; // g: rendered geometry
    const clamp = (v) => Math.max(0, Math.min(100, v));
    const measure = () => {
      const iw = img.clientWidth, ih = img.clientHeight;
      if (!iw || !ih) return null;
      const wide = iw / ih > a; // photo wider than the door: frame slides sideways, else up and down
      const fw = wide ? ih * a : iw, fh = wide ? ih : iw / a;
      return { iw, ih, fw, fh, slackX: iw - fw, slackY: ih - fh };
    };
    const draw = () => {
      g = measure(); if (!g) return;
      Object.assign(frame.style, { width: g.fw + 'px', height: g.fh + 'px', left: (g.slackX * f[0]) / 100 + 'px', top: (g.slackY * f[1]) / 100 + 'px' });
      prev.style.objectPosition = `${f[0]}% ${f[1]}%`;
      frame.setAttribute('aria-valuetext', `${Math.round(g.slackX > 1 ? f[0] : f[1])}%`);
      m.querySelector('.focus-none').hidden = g.slackX > 1 || g.slackY > 1;
    };
    const setFromCentre = (cx, cy) => {
      if (!g) return;
      if (g.slackX > 1) f[0] = clamp(((cx - g.fw / 2) / g.slackX) * 100);
      if (g.slackY > 1) f[1] = clamp(((cy - g.fh / 2) / g.slackY) * 100);
      draw();
    };
    let drag = null;
    stage.addEventListener('pointerdown', (e) => {
      if (!g) return;
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const fl = (g.slackX * f[0]) / 100, ft = (g.slackY * f[1]) / 100;
      const inside = px >= fl && px <= fl + g.fw && py >= ft && py <= ft + g.fh;
      if (!inside) setFromCentre(px, py);
      const fl2 = (g.slackX * f[0]) / 100, ft2 = (g.slackY * f[1]) / 100;
      drag = { dx: px - fl2 - g.fw / 2, dy: py - ft2 - g.fh / 2, r };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('dragging');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      setFromCentre(e.clientX - drag.r.left - drag.dx, e.clientY - drag.r.top - drag.dy);
    });
    const end = () => { drag = null; stage.classList.remove('dragging'); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    frame.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!k) return;
      e.preventDefault();
      f = [clamp(f[0] + k[0]), clamp(f[1] + k[1])];
      draw();
    });
    const ro = new ResizeObserver(draw); ro.observe(stage);
    img.addEventListener('load', draw);
    if (img.complete) draw();
    m.querySelector('[data-act="center"]').addEventListener('click', () => { f = [50, 50]; draw(); });
    m.querySelector('[data-act="save"]').addEventListener('click', () => { ro.disconnect(); close(); onSave([Math.round(f[0]), Math.round(f[1])]); });
    frame.focus();
  }

  function shareModal(c, onChange) {
    const url = shareURL(c.share_token);
    const { m } = modal(`<h2>Share “${esc(c.title)}”</h2>
      <p>Add the email address of each person this calendar is for. Only they can open it, after signing in with that email, and it appears in their account automatically. Each door unlocks on its date in ${U.MONTHS[c.start_month - 1]} ${c.start_year}.</p>
      <form class="invite-add" novalidate>
        <label class="sr" for="invite-input">Email addresses</label>
        <input class="input" id="invite-input" type="text" inputmode="email" autocomplete="off" placeholder="mom@example.com, dad@example.com">
        <button class="btn ink" type="submit">Add</button>
      </form>
      <div class="form-error" id="invite-err" role="alert" hidden></div>
      <ul class="invite-list" id="invite-list" aria-live="polite"><li class="invite-empty">Loading…</li></ul>
      <div class="share-send">
        <p class="share-label">Then send them the link</p>
        <div class="share-row"><input class="input" id="share-url" readonly value="${esc(url)}" aria-label="Calendar link"><button class="btn ink" type="button" data-act="copy">Copy link</button></div>
        <div class="share-actions" id="share-actions"></div>
      </div>
      ${api.mode === 'preview' ? `<p class="form-note" style="margin-top:14px">Preview mode keeps accounts in this browser only. To try the other side here: add an email, sign out, open the link, and sign up with that email.</p>` : ''}
      <div class="modal-actions">${api.mode === 'preview' ? `<button class="btn ghost small" type="button" data-act="try" style="color:#6d0f1d;border-color:#c4a86e">Open the link here</button>` : ''}<button class="btn small" type="button" data-close>Done</button></div>`);
    const list = m.querySelector('#invite-list'), err = m.querySelector('#invite-err'), input = m.querySelector('#invite-input');
    let people = []; // [{ email, emailed_at }]
    const emails = () => people.map((p) => p.email);
    const canSend = api.mode === 'preview' || (cfg.inviteEmails && api.mode === 'live');
    const showErr = (msg) => { err.textContent = msg || ''; err.hidden = !msg; };
    const mailto = (to) => {
      const subject = `${c.from_name || 'Someone'} made you an advent calendar`;
      const body = `I made you a photo advent calendar: "${c.title}". A new door opens each day from ${U.MONTHS[c.start_month - 1]} 1.\n\nOpen it here and sign up with this email address so it's saved to your account:\n${url}`;
      return `mailto:?bcc=${encodeURIComponent(to.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    const when = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const refresh = async () => { people = await api.listInviteStatus(c.id); render(); };
    // Email the invitation to just these people; everyone else on the list is left alone.
    const send = async (to, btn) => {
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…'; showErr('');
      try {
        const r = await api.sendInvites(c.id, to, url);
        const who = to.length === 1 ? to[0] : `${r.count} people`;
        U.toast(r.simulated ? `Preview mode: marked as sent to ${who} (no real email goes out).` : `Invitation sent to ${who}.`);
        await refresh();
      } catch (e2) { showErr(e2.message); btn.disabled = false; btn.textContent = label; }
    };
    const render = () => {
      list.innerHTML = people.length
        ? people.map((p) => `<li>
            <span class="inv-who"><span>${esc(p.email)}</span>${canSend ? `<small class="inv-status ${p.emailed_at ? '' : 'pending'}">${p.emailed_at ? 'Invitation emailed ' + esc(when(p.emailed_at)) : 'Not emailed yet'}</small>` : ''}</span>
            <span class="inv-acts">${canSend
              ? `<button class="linkish" type="button" data-send="${esc(p.email)}" aria-label="${p.emailed_at ? 'Send another invitation to' : 'Send the invitation to'} ${esc(p.email)}">${p.emailed_at ? 'Resend' : 'Send'}</button>`
              : `<a class="linkish" href="${esc(mailto([p.email]))}" target="_blank" rel="noopener">Email</a>`}
              <button class="linkish" type="button" data-remove="${esc(p.email)}" aria-label="Stop sharing with ${esc(p.email)}">Remove</button></span>
          </li>`).join('')
        : '<li class="invite-empty">Not shared with anyone yet.</li>';
      const actions = m.querySelector('#share-actions');
      const unsent = people.filter((p) => !p.emailed_at).map((p) => p.email);
      actions.innerHTML = !people.length ? ''
        : !canSend ? `<a class="btn small" href="${esc(mailto(emails()))}" target="_blank" rel="noopener">Write the email in my mail app</a>`
          : unsent.length ? `<button class="btn small" type="button" data-act="send">Email the invitation to ${unsent.length === 1 ? esc(unsent[0]) : unsent.length + ' new people'}</button>`
            : `<p class="share-note">Everyone here has been emailed. Use Resend to send someone another copy.</p>`;
      const bulk = actions.querySelector('[data-act="send"]');
      if (bulk) bulk.addEventListener('click', () => send(unsent, bulk));
      list.querySelectorAll('[data-send]').forEach((b) => b.addEventListener('click', () => send([b.dataset.send], b)));
      list.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
        try { await api.removeInvite(c.id, b.dataset.remove); await refresh(); if (onChange) onChange(emails()); }
        catch (e2) { showErr(e2.message); }
      }));
    };
    refresh().catch((e2) => showErr(e2.message));
    m.querySelector('.invite-add').addEventListener('submit', async (e) => {
      e.preventDefault();
      const parts = input.value.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!parts.length) return;
      const bad = parts.filter((p) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p));
      if (bad.length) return showErr(`“${bad[0]}” doesn’t look like an email address. Check it and try again.`);
      const mine = api.user() && api.user().email.toLowerCase();
      if (parts.includes(mine)) return showErr('That’s your own email. You can already see this calendar from Preview.');
      showErr('');
      try { await api.addInvites(c.id, parts); input.value = ''; await refresh(); if (onChange) onChange(emails()); }
      catch (e2) { showErr(e2.message); }
    });
    input.focus();
    m.querySelector('[data-act="copy"]').addEventListener('click', async (e) => {
      const ok = await U.copyText(url, m.querySelector('#share-url'));
      e.target.textContent = ok ? 'Copied' : 'Select & copy';
    });
    const tr = m.querySelector('[data-act="try"]');
    if (tr) tr.addEventListener('click', () => { m.remove(); go('share-' + c.share_token); });
  }
  /** Saves a calendar to the computer as a zip: every photo, a notes file, and an album page
      that opens in any browser with no internet, so the memories don't depend on this website. */
  async function downloadCalendar(id, btn) {
    const label = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Preparing…'; }
    try {
      const { calendar: c, days } = await api.getCalendar(id);
      const pad = (n) => String(n).padStart(2, '0');
      const files = [], entries = [];
      let missing = 0;
      for (let d = 1; d <= 24; d++) {
        const day = days[d];
        if (!day) continue;
        let photo = null;
        if (day.image_url) {
          try {
            const r = await fetch(day.image_url);
            if (!r.ok) throw new Error(r.status);
            const blob = await r.blob();
            photo = `photos/day-${pad(d)}.${/png/.test(blob.type) ? 'png' : 'jpg'}`;
            files.push({ name: photo, data: new Uint8Array(await blob.arrayBuffer()) });
          } catch (e) { missing++; }
        }
        if (photo || day.caption) entries.push({ d, photo, caption: day.caption || '', date: U.fmtDate(c.start_year, c.start_month, d, true) });
        if (btn) btn.textContent = `Preparing… ${d}/24`;
      }
      const title = c.title || 'Advent calendar';
      const byline = [c.to_name && 'For ' + c.to_name, c.from_name && 'from ' + c.from_name].filter(Boolean).join(' · ');
      const notes = [title, byline, `${U.MONTHS[c.start_month - 1]} ${c.start_year}`, '']
        .concat(entries.map((e) => `Day ${e.d} · ${e.date}${e.photo ? `  [${e.photo}]` : ''}\n${e.caption || '(no note)'}\n`)).filter((l, i) => l || i > 1).join('\n');
      const album = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<style>body{margin:0;background:#2a0f12;color:#2b1a10;font:17px/1.55 Georgia,serif}main{max-width:860px;margin:0 auto;padding:40px 18px}
header{text-align:center;color:#f6eedc;margin-bottom:34px}h1{font-weight:normal;font-style:italic;font-size:44px;margin:0 0 6px}header p{margin:0;color:#d9b46c;letter-spacing:.06em}
article{background:#f6eedc;border:1px solid #c4a86e;border-radius:6px;padding:22px;margin:0 0 22px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.d{font:13px/1 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9a7230;margin:0 0 4px}h2{font-weight:normal;color:#6d0f1d;margin:0 0 14px;font-size:24px}
img{display:block;width:100%;height:auto;border-radius:3px;margin:0 0 14px}p.n{white-space:pre-wrap;margin:0}footer{text-align:center;color:#d9b46c;font-size:13px;padding:10px 0 30px}</style></head>
<body><main><header><h1>${esc(title)}</h1><p>${esc(byline)}${byline ? ' · ' : ''}${U.MONTHS[c.start_month - 1]} ${c.start_year}</p></header>
${entries.map((e) => `<article><p class="d">Day ${e.d} of 24</p><h2>${esc(e.date)}</h2>${e.photo ? `<img src="${e.photo}" alt="Day ${e.d}" loading="lazy">` : ''}${e.caption ? `<p class="n">${esc(e.caption)}</p>` : ''}</article>`).join('\n')}
<footer>Saved from Advent Your Year on ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</footer></main></body></html>`;
      files.unshift({ name: 'Open this album.html', data: album }, { name: 'notes.txt', data: notes });
      const blob = A.zip(files);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'advent-calendar'}-${c.start_year}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      const shown = entries.length;
      U.toast(missing ? `Saved, but ${missing} photo${missing === 1 ? '' : 's'} couldn’t be fetched. Try again later.`
        : shown < 24 ? `Saved ${shown} day${shown === 1 ? '' : 's'}. Doors that haven’t opened or are empty aren’t included yet.` : 'Saved all 24 days to your computer.');
    } catch (err) {
      U.toast(err.message || 'The download couldn’t be prepared. Try again.', { kind: 'error' });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }
  }

  function confirmModal(title, body, action, fn) {
    const { m, close } = modal(`<h2>${esc(title)}</h2><p>${esc(body)}</p><div class="modal-actions"><button class="btn ghost small" type="button" data-close style="color:#6d0f1d;border-color:#c4a86e">Keep it</button><button class="btn small" type="button" data-act="ok">${esc(action)}</button></div>`);
    m.querySelector('[data-act="ok"]').addEventListener('click', async (e) => { e.target.disabled = true; try { await fn(); close(); } catch (err) { U.toast(err.message, { kind: 'error' }); e.target.disabled = false; } });
  }
  function designModal(c, onPick) {
    const { m, close } = modal(`<h2>Choose a design</h2><p style="color:var(--muted)">More designs are on the way.</p><div class="designs">${designTiles(c.design)}</div><div class="modal-actions"><button class="btn ghost small" type="button" data-close>Close</button></div>`, true);
    hydrateThumbs(m);
    m.querySelectorAll('.design-tile.available').forEach((b) => b.addEventListener('click', () => { close(); onPick(b.dataset.design); }));
  }

  /* ---------------- calendar pages ---------------- */
  function statusText(cal, opened, mode) {
    if (mode === 'preview') return '';
    const [ty, tm, td] = U.todayIn(cal.timezone).split('-').map(Number);
    const before = U.daysUntil(cal, 1);
    if (before > 0) return `First door opens ${U.fmtDate(cal.start_year, cal.start_month, 1, true)}`;
    if (ty === cal.start_year && tm === cal.start_month && td <= 24) {
      if (!opened.has(td)) return `Door ${td} is ready to open`;
      return td < 24 ? `Door ${td + 1} opens tomorrow` : 'Merry Christmas! Every door is open';
    }
    const remaining = 24 - [...opened].length;
    return remaining > 0 ? `All doors unlocked · ${remaining} still closed` : 'All 24 doors opened';
  }

  function calendarPage({ cal, days, opened, mode, back, backLabel, extra, onOpened, getImage, sample }) {
    teardown();
    app.innerHTML = `<div class="cal-page">
      <div class="cal-bar">
        <a class="back" href="#${back}">&#8592; ${esc(backLabel)}</a>
        <div class="who">${esc(cal.title || 'Advent calendar')}<small>${[cal.to_name && 'For ' + esc(cal.to_name), cal.from_name && 'from ' + esc(cal.from_name)].filter(Boolean).join(' · ')}</small></div>
        <div class="status">${extra || ''}<span class="pill" id="cal-status"></span></div>
      </div>
      <div class="cal-host" id="cal-host"></div>
    </div>`;
    const status = document.getElementById('cal-status');
    const refreshStatus = () => { const t = statusText(cal, board ? board.opened : opened, mode); status.textContent = t; status.hidden = !t; };
    board = new A.Board(document.getElementById('cal-host'), {
      calendar: cal, days, opened, mode, getImage,
      onOpened: async (d) => { if (onOpened) await onOpened(d); refreshStatus(); },
      onLocked: (d, n, when) => U.toast(`Door ${d} opens ${when}. ${n === 1 ? 'Just one more sleep!' : `${n} sleeps to go.`}`),
    });
    refreshStatus();
    return board;
  }

  function viewSample(designId) {
    const cal = sampleCalendar();
    if (designId && A.designs[designId]) cal.design = designId;
    let opened = new Set();
    try { opened = new Set(JSON.parse(localStorage.getItem('ayy-sample-opened') || '[]')); } catch (e) { /* ignore */ }
    const save = () => { try { localStorage.setItem('ayy-sample-opened', JSON.stringify([...board.opened])); } catch (e) { /* ignore */ } };
    const picker = `<select class="select design-switch" id="design-switch" aria-label="Design">${CATALOG.filter((d) => d.available).map((d) => `<option value="${d.id}" ${d.id === cal.design ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>`;
    const extra = `${picker}<button class="btn ghost small" type="button" id="all-open">Jump to Christmas Eve</button><button class="btn ghost small" type="button" id="reset">Close all doors</button>`;
    const b = calendarPage({ cal, days: sampleDays(), opened, mode: 'live', back: api.user() ? 'dashboard' : 'home', backLabel: api.user() ? 'My calendars' : 'Home', extra, onOpened: save, getImage: (d) => A.samples.photo(d) });
    document.getElementById('design-switch').addEventListener('change', (e) => go('sample-' + e.target.value));
    let eve = false;
    document.getElementById('all-open').addEventListener('click', (e) => {
      eve = !eve;
      if (eve) {
        b.o.mode = 'preview'; // every door unlocked, as on the 24th
        b.setOpened(new Set(Array.from({ length: 24 }, (_, i) => i + 1)));
        e.target.textContent = 'Back to today';
      } else {
        b.o.mode = 'live';
        let o = new Set(); try { o = new Set(JSON.parse(localStorage.getItem('ayy-sample-opened') || '[]')); } catch (x) { /* ignore */ }
        b.setOpened(o);
        e.target.textContent = 'Jump to Christmas Eve';
      }
      const st = document.getElementById('cal-status');
      st.textContent = eve ? 'Christmas Eve: every door open' : statusText(cal, b.opened, 'live');
    });
    document.getElementById('reset').addEventListener('click', () => {
      try { localStorage.removeItem('ayy-sample-opened'); } catch (x) { /* ignore */ }
      b.setOpened(new Set());
      document.getElementById('cal-status').textContent = statusText(cal, b.opened, 'live');
    });
  }

  async function viewPreview(id) {
    let data;
    try { data = await api.getCalendar(id); } catch (err) { return viewError(err.message); }
    if (data.role !== 'owner') return go('view-' + id);
    const extra = `<span class="pill berry">Preview · every door unlocked</span><button class="btn ghost small" type="button" id="open-all">Open every door</button><button class="btn ghost small" type="button" id="reset">Close all doors</button><button class="btn ghost small" type="button" id="download">Download</button><a class="btn small" href="#edit-${id}">Edit doors</a>`;
    const b = calendarPage({ cal: data.calendar, days: data.days, opened: new Set(), mode: 'preview', back: 'edit-' + id, backLabel: 'Back to editing', extra });
    const dl = document.getElementById('download');
    dl.addEventListener('click', () => downloadCalendar(id, dl));
    document.getElementById('reset').addEventListener('click', () => b.setOpened(new Set()));
    document.getElementById('open-all').addEventListener('click', () => b.setOpened(new Set(Array.from({ length: 24 }, (_, i) => i + 1))));
  }

  async function viewCalendar(id) {
    let data;
    try { data = await api.getCalendar(id); } catch (err) { return viewError(err.message); }
    if (data.role === 'owner') return go('preview-' + id);
    const extra = `<button class="btn ghost small" type="button" id="download" title="Save the photos and notes to your computer">Download</button>`;
    calendarPage({ cal: data.calendar, days: data.days, opened: data.opened, mode: 'live', back: 'dashboard', backLabel: 'My calendars', extra, onOpened: (d) => api.markOpened(id, d) });
    const dl = document.getElementById('download');
    dl.addEventListener('click', () => downloadCalendar(id, dl));
  }

  async function viewShare(token) {
    shell(`<div class="wrap"><p style="padding:40px 0;color:var(--muted)">Unwrapping…</p></div>`);
    let info;
    try { info = await api.sharePreview(token); } catch (err) { info = null; }
    if (!info) return viewError('That link doesn’t match a calendar. Ask the person who sent it to share it again.');
    const u = api.user();
    if (u) {
      if (info.owner_id === u.id) return go('preview-' + info.id);
      try { const id = await api.joinByToken(token); U.toast('Saved to your calendars.'); return go('view-' + id); }
      catch (err) { return viewError(err.message); }
    }
    after('share-' + token);
    const from = info.from_name || info.owner_name || 'Someone';
    shell(`<section class="wrap gift">
      <div class="gift-art" id="gift-art"></div>
      <div>
        <p class="eyebrow">a gift for ${esc(info.to_name || 'you')}</p>
        <h1>${esc(from)} made you an advent calendar</h1>
        <p>“${esc(info.title)}” has 24 doors, each with a photo and a note. The first one opens ${U.fmtDate(info.start_year, info.start_month, 1, true)}, ${info.start_year}.</p>
        <p>Create a free account <b>using the email address this link was sent to</b>. The calendar is saved there and will always be waiting when you sign in.</p>
        <div class="hero-cta"><a class="btn gold" href="#signup">Create an account</a><a class="btn ghost" href="#signin">I already have an account</a></div>
      </div></section>`);
    setThumb(document.getElementById('gift-art'), info.design);
  }

  function viewError(msg) {
    shell(`<section class="wrap auth-wrap"><div class="paper auth-card"><h1>Hmm.</h1><p class="sub">${esc(msg)}</p><a class="btn" href="#home">Go to the home page</a></div></section>`);
  }

  /* ---------------- router ---------------- */
  async function route() {
    teardown();
    const h = decodeURIComponent(location.hash.slice(1)) || 'home';
    const u = api.user();
    const needAuth = (fn) => (u ? fn() : (after(h), go('signin')));
    let m;
    if (h === 'home') return u ? viewDashboard() : viewLanding();
    if (h === 'signin') return u ? afterAuth() : viewSignIn();
    if (h === 'signup') return u ? afterAuth() : viewSignUp();
    if (h === 'verify') return viewVerify();
    if (h === 'forgot') return viewForgot();
    if (h === 'sample') return viewSample();
    if ((m = h.match(/^sample-([a-z0-9]+)$/))) return viewSample(m[1]);
    if (h === 'dashboard') return needAuth(viewDashboard);
    if (h === 'new') return needAuth(viewNew);
    if ((m = h.match(/^edit-([\w-]+)$/))) return needAuth(() => viewEditor(m[1]));
    if ((m = h.match(/^preview-([\w-]+)$/))) return needAuth(() => viewPreview(m[1]));
    if ((m = h.match(/^view-([\w-]+)$/))) return needAuth(() => viewCalendar(m[1]));
    if ((m = h.match(/^share-([\w-]+)$/))) return viewShare(m[1]);
    return u ? viewDashboard() : viewLanding();
  }

  /* ---------------- page snow ---------------- */
  function pageSnow() {
    if (U.prefersReducedMotion()) return;
    const c = el('<canvas class="page-snow" aria-hidden="true"></canvas>');
    document.body.prepend(c);
    const ctx = c.getContext('2d');
    let W, H, flakes;
    const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; flakes = Array.from({ length: Math.round((W * H) / 16000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.5 + 0.2, p: Math.random() * 6 })); };
    size(); addEventListener('resize', size);
    const tick = (t) => {
      if (!document.hidden && !document.querySelector('.cal-page')) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (const f of flakes) { f.y += f.v; if (f.y > H) { f.y = -4; f.x = Math.random() * W; } ctx.beginPath(); ctx.arc(f.x + Math.sin(t / 1600 + f.p) * 8, f.y, f.r, 0, 7); ctx.fill(); }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- boot ---------------- */
  (async function boot() {
    await api.init();
    api.onAuth(() => { /* views re-render on next navigation */ });
    window.addEventListener('hashchange', route);
    pageSnow();
    route();
  })();
})();
