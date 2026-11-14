// Supabase Edge Function: emails a calendar invitation to people on its invite list.
// Deploy:  supabase functions deploy send-invite
// Secrets: supabase secrets set RESEND_API_KEY=... INVITE_FROM="Advent Your Year <calendars@josephjackman.com>"
// Then set inviteEmails: true in dist/config.js.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { calendar_id, emails, link } = await req.json();
    // Act as the signed-in caller so database rules decide what they may see.
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: 'Sign in first' }, 401);
    const { data: cal } = await sb.from('calendars').select('*').eq('id', calendar_id).maybeSingle();
    if (!cal || cal.owner_id !== user.id) return json({ error: 'Only the calendar owner can send invitations' }, 403);
    // Only send to addresses that are actually on this calendar's invite list.
    const { data: invites } = await sb.from('calendar_invites').select('email').eq('calendar_id', calendar_id);
    const allowed = new Set((invites ?? []).map((i: { email: string }) => i.email));
    const to = (emails as string[]).map((e) => e.toLowerCase()).filter((e) => allowed.has(e)).slice(0, 50);
    if (!to.length) return json({ sent: 0 });
    const base = (Deno.env.get('PUBLIC_URL') ?? 'https://josephjackman.com/adventyouryear/').replace(/#.*$/, '');
    const url = `${base}#share-${cal.share_token}`;
    const from = cal.from_name || user.user_metadata?.display_name || 'Someone';
    const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px;background:#f6eedc;color:#2b1a10;border:1px solid #c4a86e">
      <p style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;color:#9a7230;margin:0">A GIFT FOR ${esc((cal.to_name || 'YOU').toUpperCase())}</p>
      <h1 style="font-weight:normal;color:#6d0f1d;margin:8px 0 14px">${esc(from)} made you an advent calendar</h1>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55">“${esc(cal.title)}” has 24 little doors, each hiding a photo and a note. The first door opens ${MONTHS[cal.start_month - 1]} 1.</p>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55">Create a free account <b>with this email address</b> and the calendar will be saved there for good.</p>
      <p style="margin:26px 0"><a href="${esc(url)}" style="background:#a3182b;color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-family:Arial,sans-serif;font-weight:bold">Open my calendar</a></p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#6e5846">Or paste this link into your browser: ${esc(url)}</p></div>`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: Deno.env.get('INVITE_FROM'), to: to.length === 1 ? to : [Deno.env.get('INVITE_FROM')], bcc: to.length === 1 ? undefined : to, subject: `${from} made you an advent calendar`, html }),
    });
    if (!res.ok) return json({ error: 'Email service refused the message' }, 502);
    // Remember who has been emailed (as the owner, so the normal database rules apply).
    const emailed_at = new Date().toISOString();
    await sb.from('calendar_invites').update({ emailed_at }).eq('calendar_id', calendar_id).in('email', to);
    return json({ sent: to.length, emailed_at });
  } catch (_e) {
    return json({ error: 'Could not send invitations' }, 500);
  }
});
