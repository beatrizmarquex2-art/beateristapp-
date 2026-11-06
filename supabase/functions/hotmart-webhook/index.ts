// Webhook da Hotmart para o Passe Beaterista (Supabase Edge Function, plano Free).
// Segredos (só no servidor): HOTMART_HOTTOK. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem nas funções.
// NÃO publicar antes da aprovação da Bea. Deploy: supabase functions deploy hotmart-webhook --no-verify-jwt
import { autorizado, formatoOk, statusDe } from './logic.js';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!autorizado(req.headers, Deno.env.get('HOTMART_HOTTOK'))) return new Response('unauthorized', { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return new Response('bad json', { status: 400 }); }
  const f = formatoOk(body); if (!f.ok) return new Response(`bad payload: ${f.motivo}`, { status: 400 });
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/passe_processar_evento`, {
    method: 'POST',
    headers: { apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_payload: body }),
  });
  if (!r.ok) return new Response('erro ao processar', { status: 500 }); // a Hotmart reenvia; o banco é idempotente
  const out = await r.json();
  return new Response(JSON.stringify(out), { status: statusDe(out), headers: { 'Content-Type': 'application/json' } });
});
