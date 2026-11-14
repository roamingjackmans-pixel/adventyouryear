// Confirms the live site can send email (sign-up code + calendar invitation) using Resend's
// test address delivered@resend.dev, which accepts mail without reaching a person.
// Usage: node tools/email-test.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const cfgText = fs.readFileSync('docs/config.js', 'utf8');
const url = cfgText.match(/supabaseUrl: '([^']+)'/)[1];
const anon = cfgText.match(/supabaseAnonKey: '([^']+)'/)[1];
const ref = url.match(/https:\/\/(\w+)\./)[1];
const keys = JSON.parse(spawnSync('npx', ['supabase', 'projects', 'api-keys', '--project-ref', ref, '-o', 'json'], { encoding: 'utf8', shell: true }).stdout);
const admin = createClient(url, keys.find((k) => k.name === 'service_role').api_key, { auth: { persistSession: false } });
const TEST = 'delivered@resend.dev';
const pw = crypto.randomBytes(18).toString('base64url');
let ok = true;
const ids = [];
try {
  // 1. sign-up code email through Supabase -> Resend SMTP
  const c = createClient(url, anon, { auth: { persistSession: false } });
  const su = await c.auth.signUp({ email: TEST, password: pw, options: { data: { display_name: 'Email test' } } });
  if (su.data?.user) ids.push(su.data.user.id);
  console.log(su.error ? `FAIL  sign-up code email: ${su.error.message}` : 'PASS  sign-up code email accepted for delivery');
  ok &&= !su.error;

  // 2. invitation email through the send-invite function
  const owner = `ayy-email-owner-${crypto.randomBytes(3).toString('hex')}@example.com`;
  const cu = await admin.auth.admin.createUser({ email: owner, password: pw, email_confirm: true, user_metadata: { display_name: 'Email test' } });
  ids.push(cu.data.user.id);
  const oc = createClient(url, anon, { auth: { persistSession: false } });
  await oc.auth.signInWithPassword({ email: owner, password: pw });
  const now = new Date();
  const cal = (await oc.from('calendars').insert({ title: 'Email test', start_year: now.getUTCFullYear(), start_month: 12 }).select().single()).data;
  await oc.from('calendar_invites').insert({ calendar_id: cal.id, email: TEST });
  const inv = await oc.functions.invoke('send-invite', { body: { calendar_id: cal.id, emails: [TEST] } });
  let detail = '';
  if (inv.error) { try { detail = JSON.stringify(await inv.error.context.json()); } catch { detail = inv.error.message; } }
  console.log(inv.error ? `FAIL  invitation email: ${detail}` : `PASS  invitation email sent (${JSON.stringify(inv.data)})`);
  ok &&= !inv.error;
  // 3. the send is remembered, so the sharing screen only offers to email people who haven't had one
  const rec = (await oc.from('calendar_invites').select('emailed_at').eq('calendar_id', cal.id).eq('email', TEST).single()).data;
  console.log(rec && rec.emailed_at ? `PASS  send recorded (${rec.emailed_at})` : 'FAIL  send was not recorded');
  ok &&= !!(rec && rec.emailed_at);
  await oc.from('calendars').delete().eq('id', cal.id);
} finally {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
  console.log(`cleaned up ${ids.length} test accounts`);
}
process.exit(ok ? 0 : 1);
