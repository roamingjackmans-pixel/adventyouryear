/* Preview backend: everything lives in this browser (IndexedDB, falling back to memory).
   It behaves like the real service — accounts, email codes, date-locked doors — except
   that "emails" appear on screen instead of in an inbox. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const U = A.util;

  /* ---- tiny key/value store over IndexedDB with an in-memory fallback ---- */
  const STORES = ['users', 'calendars', 'days', 'invites', 'opens', 'blobs', 'meta'];
  let dbp = null;
  const mem = Object.fromEntries(STORES.map((s) => [s, new Map()]));
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open('advent-your-year-preview', 2);
        req.onupgradeneeded = () => STORES.forEach((s) => req.result.objectStoreNames.contains(s) || req.result.createObjectStore(s));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await db();
    if (!d) return fn(null, mem[store]);
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      Promise.resolve(fn(s, null)).then((v) => (out = v));
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
    });
  }
  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const kv = {
    get: (st, k) => tx(st, 'readonly', (s, m) => (m ? m.get(k) : reqP(s.get(k)))),
    put: (st, k, v) => tx(st, 'readwrite', (s, m) => (m ? m.set(k, v) : reqP(s.put(v, k)))),
    del: (st, k) => tx(st, 'readwrite', (s, m) => (m ? m.delete(k) : reqP(s.delete(k)))),
    all: (st) => tx(st, 'readonly', async (s, m) => (m ? [...m.values()] : reqP(s.getAll()))),
  };

  /* ---- session ---- */
  const SKEY = 'ayy-preview-session';
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  let current = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((f) => f(current));

  async function hash(pw) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ayy:' + pw));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'plain:' + pw; }
  }
  const norm = (e) => String(e || '').trim().toLowerCase();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(10))).map((b) => b.toString(16).padStart(2, '0')).join('');
  const publicUser = (u) => u && { id: u.id, email: u.email, name: u.name };
  const fail = (msg, code) => { const e = new Error(msg); e.code = code; throw e; };

  function sendCode(email, purpose) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    kv.put('meta', 'code:' + purpose + ':' + email, { code, at: Date.now() });
    const subject = purpose === 'signup' ? 'Confirm your email' : 'Reset your password';
    U.toast(`<div class="mail-head">Preview inbox &middot; to ${U.esc(email)}</div><div>${subject}. Your code is</div><div class="mail-code">${code}</div>`, { html: true, kind: 'mail', ms: 30000 });
    return code;
  }
  async function checkCode(email, purpose, code) {
    const rec = await kv.get('meta', 'code:' + purpose + ':' + email);
    if (!rec || rec.code !== String(code).trim()) fail('That code doesn’t match. Check the most recent email and try again.', 'bad_code');
    if (Date.now() - rec.at > 60 * 60 * 1000) fail('That code has expired. Send a new one.', 'expired');
    await kv.del('meta', 'code:' + purpose + ':' + email);
  }

  const api = {
    mode: 'preview',
    async init() {
      const email = ls.get(SKEY);
      if (email) {
        const u = await kv.get('users', email);
        current = u && u.verified ? publicUser(u) : null;
      }
      return current;
    },
    user: () => current,
    onAuth(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async signUp({ name, email, password }) {
      email = norm(email);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('Enter a valid email address.');
      if ((password || '').length < 8) fail('Use at least 8 characters for your password.');
      const existing = await kv.get('users', email);
      if (existing && existing.verified) fail('An account with that email already exists. Sign in instead.', 'exists');
      await kv.put('users', email, { id: existing ? existing.id : uid(), email, name: name.trim(), pw: await hash(password), verified: false });
      sendCode(email, 'signup');
      return { needsCode: true };
    },
    async resendSignup(email) { sendCode(norm(email), 'signup'); },
    async verifySignup({ email, code }) {
      email = norm(email);
      await checkCode(email, 'signup', code);
      const u = await kv.get('users', email);
      if (!u) fail('We couldn’t find that account. Sign up again.');
      u.verified = true;
      await kv.put('users', email, u);
      current = publicUser(u); ls.set(SKEY, email); emit();
      return current;
    },
    async signIn({ email, password }) {
      email = norm(email);
      const u = await kv.get('users', email);
      if (!u || u.pw !== (await hash(password))) fail('That email and password don’t match.');
      if (!u.verified) { sendCode(email, 'signup'); fail('Please confirm your email first. We sent you a new code.', 'unverified'); }
      current = publicUser(u); ls.set(SKEY, email); emit();
      return current;
    },
    async requestReset(email) {
      email = norm(email);
      const u = await kv.get('users', email);
      if (u) sendCode(email, 'recovery');
      else U.toast('If an account exists for that email, a code is on its way.');
    },
    async resetPassword({ email, code, password }) {
      email = norm(email);
      if ((password || '').length < 8) fail('Use at least 8 characters for your new password.');
      await checkCode(email, 'recovery', code);
      const u = await kv.get('users', email);
      u.pw = await hash(password); u.verified = true;
      await kv.put('users', email, u);
      current = publicUser(u); ls.set(SKEY, email); emit();
      return current;
    },
    async signOut() { current = null; ls.set(SKEY, null); emit(); },

    /* ---- calendars ---- */
    async listMyCalendars() {
      const cals = (await kv.all('calendars')).filter((c) => c.owner_id === current.id);
      const days = await kv.all('days');
      const inv = await kv.all('invites');
      return cals.sort((a, b) => b.created_at - a.created_at).map((c) => ({ ...c, filled: days.filter((d) => d.calendar_id === c.id && (d.caption || d.blob_id)).length, shared: inv.filter((i) => i.calendar_id === c.id).length }));
    },
    async listReceived() {
      const recs = (await kv.all('invites')).filter((r) => r.email === current.email);
      const opens = (await kv.all('opens')).filter((o) => o.user_id === current.id);
      const out = [];
      for (const r of recs) {
        const c = await kv.get('calendars', r.calendar_id);
        if (c) out.push({ ...c, opened: opens.filter((o) => o.calendar_id === c.id).length });
      }
      return out;
    },
    async createCalendar(fields) {
      const c = { id: uid(), owner_id: current.id, share_token: token(), created_at: Date.now(), timezone: U.localTz(), design: 'parlor', ...fields };
      await kv.put('calendars', c.id, c);
      return c;
    },
    async updateCalendar(id, fields) {
      const c = await kv.get('calendars', id);
      if (!c || c.owner_id !== current.id) fail('Only the person who made this calendar can change it.');
      Object.assign(c, fields);
      await kv.put('calendars', id, c);
      return c;
    },
    async deleteCalendar(id) {
      const c = await kv.get('calendars', id);
      if (!c || c.owner_id !== current.id) fail('Only the person who made this calendar can delete it.');
      for (let d = 1; d <= 24; d++) {
        const row = await kv.get('days', id + ':' + d);
        if (row && row.blob_id) await kv.del('blobs', row.blob_id);
        await kv.del('days', id + ':' + d);
      }
      for (const i of (await kv.all('invites')).filter((x) => x.calendar_id === id)) await kv.del('invites', id + ':' + i.email);
      await kv.del('calendars', id);
    },
    async getCalendar(id) {
      const c = await kv.get('calendars', id);
      if (!c) fail('We couldn’t find that calendar.', 'not_found');
      const isOwner = current && c.owner_id === current.id;
      const rec = current && (await kv.get('invites', id + ':' + current.email));
      if (!isOwner && !rec) fail('This calendar was shared with a different email address. Sign in with the email it was sent to.', 'forbidden');
      const days = {};
      for (let d = 1; d <= 24; d++) {
        if (!isOwner && !U.isUnlocked(c, d)) continue; // same rule the real server enforces
        const row = await kv.get('days', id + ':' + d);
        if (!row) continue;
        let image_url = null;
        if (row.blob_id) { const b = await kv.get('blobs', row.blob_id); if (b) image_url = URL.createObjectURL(b); }
        days[d] = { caption: row.caption || '', image_url };
      }
      const opened = new Set((await kv.all('opens')).filter((o) => o.calendar_id === id && current && o.user_id === current.id).map((o) => o.day));
      return { calendar: c, role: isOwner ? 'owner' : 'recipient', days, opened };
    },
    async saveCaption(id, day, caption) {
      await api.updateCalendar(id, {});
      const row = (await kv.get('days', id + ':' + day)) || { calendar_id: id, day };
      row.caption = caption;
      await kv.put('days', id + ':' + day, row);
    },
    async uploadPhoto(id, day, blob) {
      await api.updateCalendar(id, {});
      const row = (await kv.get('days', id + ':' + day)) || { calendar_id: id, day };
      if (row.blob_id) await kv.del('blobs', row.blob_id);
      row.blob_id = uid();
      await kv.put('blobs', row.blob_id, blob);
      await kv.put('days', id + ':' + day, row);
      return URL.createObjectURL(blob);
    },
    async removePhoto(id, day) {
      const row = await kv.get('days', id + ':' + day);
      if (row && row.blob_id) { await kv.del('blobs', row.blob_id); row.blob_id = null; await kv.put('days', id + ':' + day, row); }
    },
    async sharePreview(tok) {
      const c = (await kv.all('calendars')).find((x) => x.share_token === tok);
      if (!c) return null;
      const owner = (await kv.all('users')).find((u) => u.id === c.owner_id);
      return { id: c.id, title: c.title, to_name: c.to_name, from_name: c.from_name, design: c.design, start_year: c.start_year, start_month: c.start_month, owner_id: c.owner_id, owner_name: owner && owner.name };
    },
    async joinByToken(tok) {
      const c = (await kv.all('calendars')).find((x) => x.share_token === tok);
      if (!c) fail('That link doesn’t match a calendar. Ask the sender to share it again.');
      if (c.owner_id !== current.id && !(await kv.get('invites', c.id + ':' + current.email))) fail('This calendar was shared with a different email address. Sign in with the email it was sent to.', 'not_invited');
      return c.id;
    },
    async listInvites(id) {
      return (await kv.all('invites')).filter((i) => i.calendar_id === id).sort((a, b) => a.invited_at - b.invited_at).map((i) => i.email);
    },
    async addInvites(id, emails) {
      await api.updateCalendar(id, {});
      for (const e of emails) {
        const email = norm(e);
        if (!(await kv.get('invites', id + ':' + email))) await kv.put('invites', id + ':' + email, { calendar_id: id, email, invited_at: Date.now() });
      }
      return api.listInvites(id);
    },
    async removeInvite(id, email) {
      await api.updateCalendar(id, {});
      await kv.del('invites', id + ':' + norm(email));
      return api.listInvites(id);
    },
    async sendInvites() { return { sent: false }; },
    async markOpened(id, day) {
      if (!current) return;
      await kv.put('opens', `${id}:${current.id}:${day}`, { calendar_id: id, user_id: current.id, day, opened_at: Date.now() });
    },
    async leaveCalendar(id) { await kv.del('invites', id + ':' + current.email); },
  };

  A.apiPreview = api;
})();
