// One-shot Supabase setup for Advent Your Year. Safe to re-run.
//   1. npx supabase login           (you, once: opens the browser)
//   2. node tools/supabase-setup.mjs
// Creates (or reuses) the "adventyouryear" project, loads the database rules, pushes the auth settings
// (6-digit email codes, Resend SMTP shared with Roleplay20), deploys the invite-email function, and
// writes docs/config.js. Secrets are read in memory and handed straight to Supabase; nothing secret is
// printed or written into this project.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT = 'adventyouryear';
const REGION = process.env.SUPABASE_REGION || 'us-east-2';
const ENV_FILE = process.env.EMAIL_ENV_FILE || 'C:/dev/Roleplay20/.env';
const PUBLIC_URL = 'https://josephjackman.com/adventyouryear/';

const step = (m) => console.log(`\n== ${m}`);
function sb(args, { env = {}, input, quiet = false, allowFail = false } = {}) {
  const r = spawnSync('npx', ['supabase', ...args], { encoding: 'utf8', shell: true, input, env: { ...process.env, ...env } });
  if (!quiet) { if (r.stdout) process.stdout.write(r.stdout.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[key]')); }
  if (r.status !== 0 && !allowFail) {
    process.stderr.write((r.stderr || '').replace(/re_[\w]+/g, '[key]'));
    throw new Error(`supabase ${args[0]} ${args[1] || ''} failed`);
  }
  return r;
}

// --- email settings from Roleplay20 (values never printed)
const envText = fs.readFileSync(ENV_FILE, 'utf8');
const getVar = (k) => { const m = envText.match(new RegExp(`^${k}=(.*)$`, 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };
const RESEND_API_KEY = getVar('RESEND_API_KEY');
const EMAIL_FROM = getVar('EMAIL_FROM');
if (!RESEND_API_KEY || !EMAIL_FROM) throw new Error(`RESEND_API_KEY / EMAIL_FROM not found in ${ENV_FILE}`);
const fromAddress = (EMAIL_FROM.match(/<([^>]+)>/) || [null, EMAIL_FROM])[1].trim();
console.log(`Using the Resend sender from Roleplay20 (${fromAddress.replace(/^[^@]+/, '***')}).`);

// --- project
step('Finding or creating the Supabase project');
const list = JSON.parse(sb(['projects', 'list', '-o', 'json'], { quiet: true }).stdout || '[]');
let proj = list.find((p) => p.name === PROJECT);
let dbPassword = process.env.SUPABASE_DB_PASSWORD || '';
if (!proj) {
  const orgs = JSON.parse(sb(['orgs', 'list', '-o', 'json'], { quiet: true }).stdout || '[]');
  if (!orgs.length) throw new Error('No Supabase organization found on this account. Create one at supabase.com/dashboard first.');
  dbPassword = crypto.randomBytes(24).toString('base64url');
  sb(['projects', 'create', PROJECT, '--org-id', orgs[0].id, '--region', REGION, '--db-password', dbPassword, '-o', 'json'], { quiet: true });
  // Keep the database password in Windows Credential Manager (only needed for future schema changes).
  spawnSync('cmdkey', [`/generic:AdventYourYear-supabase-db`, '/user:postgres', `/pass:${dbPassword}`], { stdio: 'ignore' });
  console.log('Created. Database password saved in Windows Credential Manager as "AdventYourYear-supabase-db".');
  for (let i = 0; i < 60; i++) {
    proj = JSON.parse(sb(['projects', 'list', '-o', 'json'], { quiet: true }).stdout || '[]').find((p) => p.name === PROJECT);
    if (proj && /ACTIVE_HEALTHY/.test(proj.status || '')) break;
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.log('');
} else {
  console.log('Project already exists; reusing it.');
}
const ref = proj.id || proj.ref;
if (!ref) throw new Error('Could not read the project ref');
console.log(`Project ref: ${ref}`);

// --- database
step('Loading the database rules');
const linkArgs = ['link', '--project-ref', ref];
sb(linkArgs, { env: dbPassword ? { SUPABASE_DB_PASSWORD: dbPassword } : {} });
sb(['db', 'push', '--include-all', '--yes'], { env: dbPassword ? { SUPABASE_DB_PASSWORD: dbPassword } : {} });

// --- auth settings (codes, templates, Resend SMTP)
step('Pushing sign-in settings (6-digit codes, email templates, Resend sender)');
sb(['config', 'push', '--project-ref', ref, '--yes'], { env: { RESEND_API_KEY, EMAIL_FROM_ADDRESS: fromAddress, SUPABASE_YES: '1' } });

// --- invite email function
step('Deploying the invitation email function');
const tmp = path.join(os.tmpdir(), `ayy-secrets-${process.pid}.env`);
fs.writeFileSync(tmp, `RESEND_API_KEY=${RESEND_API_KEY}\nINVITE_FROM=Advent Your Year <${fromAddress}>\nPUBLIC_URL=${PUBLIC_URL}\n`, { mode: 0o600 });
try { sb(['secrets', 'set', '--env-file', tmp, '--project-ref', ref], { quiet: true }); }
finally { fs.rmSync(tmp, { force: true }); }
sb(['functions', 'deploy', 'send-invite', '--project-ref', ref, '--use-api']);

// --- site config
step('Writing docs/config.js');
const keys = JSON.parse(sb(['projects', 'api-keys', '--project-ref', ref, '-o', 'json'], { quiet: true }).stdout || '[]');
const anon = (keys.find((k) => k.name === 'anon') || keys.find((k) => /publishable/i.test(k.type || k.name || '')) || {}).api_key;
if (!anon) throw new Error('Could not read the public anon key');
fs.writeFileSync('docs/config.js', `/* Advent Your Year configuration (written by tools/supabase-setup.mjs).
   The anon key is the public client key; the database rules in supabase/schema.sql protect the data. */
window.AYY_CONFIG = {
  supabaseUrl: 'https://${ref}.supabase.co',
  supabaseAnonKey: '${anon}',
  publicUrl: '${PUBLIC_URL}',
  inviteEmails: true,
};
`);
console.log('\nDone. The site at docs/ now talks to the live backend.');
