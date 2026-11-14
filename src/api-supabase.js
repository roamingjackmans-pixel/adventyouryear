/* Live backend: Supabase (Postgres + Auth + Storage).
   Day locking is enforced in the database (see supabase/schema.sql), so a recipient's
   browser never receives a photo or note before its day arrives. */
(function () {
  const A = (window.AYY = window.AYY || {});
  const U = A.util;
  const BUCKET = 'advent-photos';

  function make(cfg) {
    const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    let current = null;
    const listeners = new Set();
    const toUser = (u) => u && { id: u.id, email: u.email, name: (u.user_metadata && u.user_metadata.display_name) || u.email.split('@')[0] };
    const check = ({ data, error }) => { if (error) throw friendly(error); return data; };
    function friendly(err) {
      const m = (err && err.message) || String(err);
      const e = new Error(
        /Invalid login credentials/i.test(m) ? 'That email and password don’t match.'
          : /Email not confirmed/i.test(m) ? 'Please confirm your email first. We sent you a new code.'
          : /expired|invalid.*(otp|token)/i.test(m) ? 'That code doesn’t match or has expired. Send a new one and try again.'
          : /already registered/i.test(m) ? 'An account with that email already exists. Sign in instead.'
          : /rate limit/i.test(m) ? 'Too many emails were sent just now. Wait a minute and try again.'
          : /Password should be/i.test(m) ? 'Use at least 8 characters for your password.'
          : m
      );
      if (/Email not confirmed/i.test(m)) e.code = 'unverified';
      if (/already registered/i.test(m)) e.code = 'exists';
      return e;
    }
    async function signedUrls(paths) {
      if (!paths.length) return {};
      const data = check(await sb.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 6));
      const out = {};
      data.forEach((d) => { if (d.signedUrl) out[d.path] = d.signedUrl; });
      return out;
    }

    const api = {
      mode: 'live',
      async init() {
        const { data } = await sb.auth.getSession();
        current = toUser(data.session && data.session.user);
        sb.auth.onAuthStateChange((_ev, session) => {
          const next = toUser(session && session.user);
          if ((next && next.id) !== (current && current.id)) { current = next; listeners.forEach((f) => f(current)); }
          else current = next;
        });
        return current;
      },
      user: () => current,
      onAuth(fn) { listeners.add(fn); return () => listeners.delete(fn); },

      async signUp({ name, email, password }) {
        const data = check(await sb.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() } } }));
        // Supabase hides existing accounts by returning a user with no identities
        if (data.user && data.user.identities && data.user.identities.length === 0) { const e = new Error('An account with that email already exists. Sign in instead.'); e.code = 'exists'; throw e; }
        return { needsCode: !data.session };
      },
      async resendSignup(email) { check(await sb.auth.resend({ type: 'signup', email: email.trim() })); },
      async verifySignup({ email, code }) {
        const data = check(await sb.auth.verifyOtp({ email: email.trim(), token: String(code).trim(), type: 'signup' }));
        current = toUser(data.user);
        return current;
      },
      async signIn({ email, password }) {
        const res = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (res.error && /Email not confirmed/i.test(res.error.message)) { await sb.auth.resend({ type: 'signup', email: email.trim() }).catch(() => {}); }
        const data = check(res);
        current = toUser(data.user);
        return current;
      },
      async requestReset(email) { check(await sb.auth.resetPasswordForEmail(email.trim())); },
      async resetPassword({ email, code, password }) {
        check(await sb.auth.verifyOtp({ email: email.trim(), token: String(code).trim(), type: 'recovery' }));
        const data = check(await sb.auth.updateUser({ password }));
        current = toUser(data.user);
        return current;
      },
      async signOut() { await sb.auth.signOut(); current = null; listeners.forEach((f) => f(null)); },

      async listMyCalendars() {
        const cals = check(await sb.from('calendars').select('*').eq('owner_id', current.id).order('created_at', { ascending: false }));
        if (!cals.length) return [];
        const ids = cals.map((c) => c.id);
        const days = check(await sb.from('calendar_days').select('calendar_id, caption, image_path').in('calendar_id', ids));
        const inv = check(await sb.from('calendar_invites').select('calendar_id').in('calendar_id', ids));
        return cals.map((c) => ({ ...c, filled: days.filter((d) => d.calendar_id === c.id && (d.caption || d.image_path)).length, shared: inv.filter((i) => i.calendar_id === c.id).length }));
      },
      async listReceived() {
        const rows = check(await sb.from('calendar_invites').select('calendar_id, calendars(*)').eq('email', current.email.toLowerCase()));
        const opens = check(await sb.from('day_opens').select('calendar_id, day').eq('user_id', current.id));
        return rows.filter((r) => r.calendars).map((r) => ({ ...r.calendars, opened: opens.filter((o) => o.calendar_id === r.calendar_id).length }));
      },
      async createCalendar(fields) {
        return check(await sb.from('calendars').insert({ ...fields, owner_id: current.id, timezone: fields.timezone || U.localTz() }).select().single());
      },
      async updateCalendar(id, fields) {
        return check(await sb.from('calendars').update(fields).eq('id', id).select().single());
      },
      async deleteCalendar(id) {
        const files = check(await sb.storage.from(BUCKET).list(id));
        if (files.length) await sb.storage.from(BUCKET).remove(files.map((f) => `${id}/${f.name}`));
        check(await sb.from('calendars').delete().eq('id', id));
      },
      async getCalendar(id) {
        const cal = check(await sb.from('calendars').select('*').eq('id', id).maybeSingle());
        if (!cal) { const e = new Error('This calendar was shared with a different email address. Sign in with the email it was sent to.'); e.code = 'forbidden'; throw e; }
        const role = current && cal.owner_id === current.id ? 'owner' : 'recipient';
        const rows = check(await sb.from('calendar_days').select('day, caption, image_path, focus_x, focus_y').eq('calendar_id', id));
        const urls = await signedUrls(rows.filter((r) => r.image_path).map((r) => r.image_path));
        const days = {};
        rows.forEach((r) => { days[r.day] = { caption: r.caption || '', image_url: r.image_path ? urls[r.image_path] || null : null, focus: [r.focus_x ?? 50, r.focus_y ?? 50] }; });
        const opens = current ? check(await sb.from('day_opens').select('day').eq('calendar_id', id).eq('user_id', current.id)) : [];
        return { calendar: cal, role, days, opened: new Set(opens.map((o) => o.day)) };
      },
      async saveCaption(id, day, caption) {
        check(await sb.from('calendar_days').upsert({ calendar_id: id, day, caption }, { onConflict: 'calendar_id,day' }));
      },
      async uploadPhoto(id, day, blob) {
        const prev = check(await sb.from('calendar_days').select('image_path').eq('calendar_id', id).eq('day', day).maybeSingle());
        const path = `${id}/${day}-${Date.now().toString(36)}.jpg`;
        check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
        check(await sb.from('calendar_days').upsert({ calendar_id: id, day, image_path: path, focus_x: 50, focus_y: 50 }, { onConflict: 'calendar_id,day' }));
        if (prev && prev.image_path) await sb.storage.from(BUCKET).remove([prev.image_path]);
        const urls = await signedUrls([path]);
        return urls[path];
      },
      async saveFocus(id, day, x, y) {
        check(await sb.from('calendar_days').update({ focus_x: Math.round(x), focus_y: Math.round(y) }).eq('calendar_id', id).eq('day', day));
      },
      async removePhoto(id, day) {
        const prev = check(await sb.from('calendar_days').select('image_path').eq('calendar_id', id).eq('day', day).maybeSingle());
        if (prev && prev.image_path) {
          await sb.storage.from(BUCKET).remove([prev.image_path]);
          check(await sb.from('calendar_days').update({ image_path: null }).eq('calendar_id', id).eq('day', day));
        }
      },
      async sharePreview(token) {
        const rows = check(await sb.rpc('share_preview', { p_token: token }));
        return rows && rows[0] ? rows[0] : null;
      },
      async joinByToken(token) { return check(await sb.rpc('join_calendar', { p_token: token })); },
      async listInvites(id) {
        return check(await sb.from('calendar_invites').select('email, invited_at').eq('calendar_id', id).order('invited_at')).map((r) => r.email);
      },
      async addInvites(id, emails) {
        const rows = emails.map((e) => ({ calendar_id: id, email: e.trim().toLowerCase() }));
        check(await sb.from('calendar_invites').upsert(rows, { onConflict: 'calendar_id,email', ignoreDuplicates: true }));
        return api.listInvites(id);
      },
      async removeInvite(id, email) {
        check(await sb.from('calendar_invites').delete().eq('calendar_id', id).eq('email', email.trim().toLowerCase()));
        return api.listInvites(id);
      },
      /** Emails the invitation through the send-invite Edge Function (needs Resend set up). */
      async sendInvites(id, emails, link) {
        if (!cfg.inviteEmails) return { sent: false };
        const { data, error } = await sb.functions.invoke('send-invite', { body: { calendar_id: id, emails, link } });
        if (error) throw new Error('The invitation emails couldn’t be sent. Copy the link and send it yourself.');
        return { sent: true, count: (data && data.sent) || emails.length };
      },
      async markOpened(id, day) {
        if (!current) return;
        await sb.from('day_opens').upsert({ calendar_id: id, user_id: current.id, day }, { onConflict: 'calendar_id,user_id,day', ignoreDuplicates: true });
      },
      async leaveCalendar(id) { check(await sb.from('calendar_invites').delete().eq('calendar_id', id).eq('email', current.email.toLowerCase())); },
    };
    return api;
  }

  A.apiLive = make;
})();
