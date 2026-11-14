// Checks the live database rules with throwaway accounts, then deletes them.
// Usage: node tools/live-test.mjs     (needs `npx supabase login`; no emails are sent)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const cfgText = fs.readFileSync('docs/config.js', 'utf8');
const url = cfgText.match(/supabaseUrl: '([^']+)'/)[1];
const anon = cfgText.match(/supabaseAnonKey: '([^']+)'/)[1];
const ref = url.match(/https:\/\/(\w+)\./)[1];
const keys = JSON.parse(spawnSync('npx', ['supabase', 'projects', 'api-keys', '--project-ref', ref, '-o', 'json'], { encoding: 'utf8', shell: true }).stdout);
const service = keys.find((k) => k.name === 'service_role').api_key; // used in memory only, never printed
const admin = createClient(url, service, { auth: { persistSession: false } });

const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`); };
const tag = crypto.randomBytes(3).toString('hex');
const pw = crypto.randomBytes(18).toString('base64url');
const mk = async (who) => {
  const email = `ayy-test-${who}-${tag}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { display_name: who } });
  if (error) throw error;
  const c = createClient(url, anon, { auth: { persistSession: false } });
  const s = await c.auth.signInWithPassword({ email, password: pw });
  if (s.error) throw s.error;
  return { id: data.user.id, email, c };
};
const users = [];
try {
  const owner = await mk('owner'), mom = await mk('mom'), sis = await mk('sis'), stranger = await mk('stranger');
  users.push(owner, mom, sis, stranger);
  const now = new Date();
  const ins = (title) => owner.c.from('calendars').insert({ title, from_name: 'Owner', start_year: now.getUTCFullYear(), start_month: now.getUTCMonth() + 1, timezone: 'UTC' }).select().single();
  const c1 = (await ins('For Mom')).data, c2 = (await ins('For Sis')).data;
  check('owner can create two calendars', !!(c1 && c2));
  const days = Array.from({ length: 24 }, (_, i) => ({ calendar_id: c1.id, day: i + 1, caption: 'note ' + (i + 1) }));
  check('owner can write all 24 notes', !(await owner.c.from('calendar_days').insert(days)).error);
  const img = new Blob([new Uint8Array([255, 216, 255, 217])], { type: 'image/jpeg' });
  const today = now.getUTCDate(), future = Math.min(24, today + 1);
  const up1 = await owner.c.storage.from('advent-photos').upload(`${c1.id}/1-${tag}.jpg`, img, { contentType: 'image/jpeg' });
  const upF = await owner.c.storage.from('advent-photos').upload(`${c1.id}/${future}-${tag}.jpg`, img, { contentType: 'image/jpeg' });
  check('owner can upload photos', !up1.error && !upF.error, up1.error?.message || upF.error?.message);
  check('owner can share c1 with mom', !(await owner.c.from('calendar_invites').insert({ calendar_id: c1.id, email: mom.email })).error);
  check('owner can share c2 with sis', !(await owner.c.from('calendar_invites').insert({ calendar_id: c2.id, email: sis.email })).error);

  const momCals = (await mom.c.from('calendar_invites').select('calendar_id, calendars(title)').eq('email', mom.email)).data || [];
  check('mom sees only her calendar', momCals.length === 1 && momCals[0].calendars.title === 'For Mom');
  check('mom cannot read the sister calendar', ((await mom.c.from('calendars').select('id').eq('id', c2.id)).data || []).length === 0);
  check('stranger cannot read any calendar', ((await stranger.c.from('calendars').select('id').in('id', [c1.id, c2.id])).data || []).length === 0);
  check('stranger cannot invite themselves', !!(await stranger.c.from('calendar_invites').insert({ calendar_id: c1.id, email: stranger.email })).error);
  const j = await stranger.c.rpc('join_calendar', { p_token: c1.share_token });
  check('share link alone does not let a stranger in', !!j.error);
  check('mom can resolve her share link', (await mom.c.rpc('join_calendar', { p_token: c1.share_token })).data === c1.id);

  const momDays = ((await mom.c.from('calendar_days').select('day').eq('calendar_id', c1.id)).data || []).map((d) => d.day);
  const expect = Math.min(today, 24);
  check(`mom receives only days 1-${expect} (today is the ${today})`, momDays.length === expect && Math.max(...momDays) === expect, `got ${momDays.length}`);
  const sOk = await mom.c.storage.from('advent-photos').createSignedUrl(`${c1.id}/1-${tag}.jpg`, 60);
  check('mom can view an unlocked photo', !!sOk.data?.signedUrl, sOk.error?.message);
  if (future > today) {
    const sNo = await mom.c.storage.from('advent-photos').createSignedUrl(`${c1.id}/${future}-${tag}.jpg`, 60);
    check('mom cannot view a future photo', !sNo.data?.signedUrl);
  }
  check('mom cannot edit notes', ((await mom.c.from('calendar_days').update({ caption: 'hacked' }).eq('calendar_id', c1.id).select()).data || []).length === 0);
  check('mom can record an opened door', !(await mom.c.from('day_opens').insert({ calendar_id: c1.id, user_id: mom.id, day: 1 })).error);
  if (future > today) check('mom cannot open a future door', !!(await mom.c.from('day_opens').insert({ calendar_id: c1.id, user_id: mom.id, day: future })).error);
  await owner.c.from('calendar_invites').delete().eq('calendar_id', c1.id).eq('email', mom.email);
  check('removing mom’s email removes her access', ((await mom.c.from('calendars').select('id').eq('id', c1.id)).data || []).length === 0);
  const prev = await admin.rpc('share_preview', { p_token: c1.share_token });
  check('share teaser shows title only', prev.data?.[0]?.title === 'For Mom' && !('caption' in (prev.data?.[0] || {})));

  await owner.c.storage.from('advent-photos').remove([`${c1.id}/1-${tag}.jpg`, `${c1.id}/${future}-${tag}.jpg`]);
  await owner.c.from('calendars').delete().in('id', [c1.id, c2.id]);
} finally {
  for (const u of users) await admin.auth.admin.deleteUser(u.id);
  console.log(`cleaned up ${users.length} test accounts`);
}
const failed = results.filter((r) => !r).length;
console.log(failed ? `${failed} check(s) FAILED` : `all ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
