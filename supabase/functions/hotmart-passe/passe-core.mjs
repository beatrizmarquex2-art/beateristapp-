// Webhook da Hotmart → Passe Beaterista. Lógica pura (sem APIs do Deno) pra rodar igual na Edge Function e nos testes do Node.
// Segredos só em variáveis de ambiente do servidor:
//   HOTMART_HOTTOK        token do webhook (Hotmart: Ferramentas → Webhook → "hottok")
//   HOTMART_PRODUCT_IDS   id(s) numérico(s) ou ucode do produto Passe, separados por vírgula
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (o Supabase já injeta nas Edge Functions)
//   RESEND_API_KEY, MAIL_FROM                 envio do e-mail (ex.: "Beaterista <passe@seudominio.com.br>", domínio verificado no Resend)
//   ADMIN_TOKEN           (opcional) libera POST .../reenviar pra mandar o e-mail de novo
//   SITE_URL              (opcional) padrão https://jogos.beaterista.com.br
const EVENTOS_APROVA = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
const EVENTOS_REVOGA = { PURCHASE_REFUNDED: 'reembolsada', PURCHASE_CHARGEBACK: 'chargeback' };
const MAX_BODY = 256 * 1024;
const EMAIL_RE = /^[^\s@<>"',;]{1,64}@[^\s@<>"',;]{1,190}\.[^\s@<>"',;]{2,24}$/;

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const log = (o) => { try { console.log(JSON.stringify(o)); } catch { /* ok */ } };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Comparação em tempo constante (compara os hashes SHA-256, então o tamanho do segredo também não vaza). */
export async function igualSeguro(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(String(a ?? ''))), crypto.subtle.digest('SHA-256', enc.encode(String(b ?? '')))]);
  const A = new Uint8Array(x); const B = new Uint8Array(y); let d = 0;
  for (let i = 0; i < A.length; i++) d |= A[i] ^ B[i];
  return d === 0;
}

export const dataBR = (iso) => { const d = new Date(iso); return Number.isNaN(+d) ? '' : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }); };

export function montarEmail({ nome, code, expiraEm, siteUrl }) {
  const primeiro = String(nome || '').trim().split(/\s+/)[0] || '';
  const ate = expiraEm ? dataBR(expiraEm) : '';
  const url = siteUrl.replace(/\/+$/, '');
  const assunto = 'Seu código do Passe Beaterista chegou 🎉';
  const texto = [`Oi${primeiro ? `, ${primeiro}` : ''}! Obrigada pela compra do Passe Beaterista.`, '', `Seu código de acesso: ${code}`, '',
    'Como entrar:', `1. abra ${url}`, '2. escreva seu nome', '3. escolha "código de acesso" e digite o código acima', '',
    `O passe vale 12 meses${ate ? ` (até ${ate})` : ''} e funciona em até 2 aparelhos.`, 'Guarde este e-mail. Qualquer dúvida, é só responder.', '', 'Professora Bea · Beaterista'].join('\n');
  const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1b1818"><p>Oi${primeiro ? `, ${esc(primeiro)}` : ''}! Obrigada pela compra do <b>Passe Beaterista</b>.</p>
<p style="margin:18px 0 4px">Seu código de acesso:</p><p style="font:700 28px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.12em;background:#fff1c7;border:2px solid #1b1818;border-radius:12px;padding:12px 16px;display:inline-block;margin:0">${esc(code)}</p>
<p style="margin-top:20px"><b>Como entrar</b></p><ol><li>abra <a href="${esc(url)}">${esc(url.replace(/^https?:\/\//, ''))}</a></li><li>escreva seu nome</li><li>escolha “código de acesso” e digite o código acima</li></ol>
<p>O passe vale <b>12 meses</b>${ate ? ` (até ${esc(ate)})` : ''} e funciona em até <b>2 aparelhos</b>.</p><p>Guarde este e-mail. Qualquer dúvida, é só responder.</p><p>Professora Bea · Beaterista</p></div>`;
  return { assunto, texto, html };
}

/** Envio via Resend. Idempotency-Key evita e-mail em dobro se o aviso da Hotmart chegar duas vezes ao mesmo tempo. */
export async function enviarEmail({ env, fetchImpl, para, msg, chave }) {
  const r = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': chave },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [para], subject: msg.assunto, text: msg.texto, html: msg.html }),
  });
  if (!r.ok) { let t = ''; try { t = (await r.text()).slice(0, 200); } catch { /* ok */ } throw new Error(`email ${r.status} ${t}`); }
}

export function criarHandler({ env, fetchImpl = fetch, agora = () => new Date() }) {
  const rpc = async (nome, args) => {
    const r = await fetchImpl(`${env.SUPABASE_URL}/rest/v1/rpc/${nome}`, { method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(`rpc ${nome} ${r.status}`);
    const t = await r.text(); return t ? JSON.parse(t) : null;
  };
  const siteUrl = env.SITE_URL || 'https://jogos.beaterista.com.br';
  const configurado = () => !!(env.HOTMART_HOTTOK && env.HOTMART_PRODUCT_IDS && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.RESEND_API_KEY && env.MAIL_FROM);
  const produtosOk = () => new Set(String(env.HOTMART_PRODUCT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean));

  async function lerCorpo(req) {
    const len = Number(req.headers.get('content-length') || 0);
    if (len > MAX_BODY) return null;
    const t = await req.text(); return t.length > MAX_BODY ? null : t;
  }

  async function reenviar(req) {
    if (!env.ADMIN_TOKEN || !(await igualSeguro(req.headers.get('x-admin-token'), env.ADMIN_TOKEN))) return json(401, { erro: 'nao autorizado' });
    let corpo; try { corpo = JSON.parse((await lerCorpo(req)) || '{}'); } catch { return json(400, { erro: 'json invalido' }); }
    const transacao = String(corpo.transacao || '').trim();
    if (!transacao) return json(400, { erro: 'faltou a transacao' });
    const d = await rpc('passe_dados_envio', { p_transacao: transacao });
    if (!d || d.status !== 'aprovada' || !d.code || !d.email) return json(404, { erro: 'compra nao encontrada, revogada ou sem e-mail' });
    try {
      await enviarEmail({ env, fetchImpl, para: d.email, msg: montarEmail({ nome: d.comprador, code: d.code, expiraEm: d.expira_em, siteUrl }), chave: `passe-${transacao}-reenvio-${agora().getTime()}` });
      await rpc('passe_email_resultado', { p_transacao: transacao, p_ok: true, p_erro: null });
      log({ evento: 'reenvio_ok', transacao }); return json(200, { ok: true });
    } catch (e) { await rpc('passe_email_resultado', { p_transacao: transacao, p_ok: false, p_erro: String(e.message) }).catch(() => {}); log({ evento: 'reenvio_falhou', transacao }); return json(502, { erro: 'email falhou, tente de novo' }); }
  }

  return async function handler(req) {
    if (req.method !== 'POST') return json(405, { erro: 'use POST' });
    if (!configurado()) { log({ evento: 'sem_config' }); return json(500, { erro: 'servidor nao configurado' }); } // falha fechado: nunca libera nada sem segredo/produto configurados
    try {
      if (new URL(req.url).pathname.replace(/\/+$/, '').endsWith('/reenviar')) return await reenviar(req);
      const texto = await lerCorpo(req); if (texto == null) return json(413, { erro: 'corpo grande demais' });
      let b; try { b = JSON.parse(texto); } catch { return json(400, { erro: 'json invalido' }); }
      if (!b || typeof b !== 'object') return json(400, { erro: 'json invalido' });
      // 1) token da Hotmart (cabeçalho X-HOTMART-HOTTOK; o corpo v2 também traz "hottok")
      if (!(await igualSeguro(req.headers.get('x-hotmart-hottok') ?? b.hottok, env.HOTMART_HOTTOK))) { log({ evento: 'token_invalido' }); return json(401, { erro: 'token invalido' }); }
      // 2) produto certo (id numérico ou ucode)
      const d = b.data || {}; const prod = d.product || {};
      const ids = [prod.id, prod.ucode].filter((x) => x != null).map(String);
      if (!ids.some((i) => produtosOk().has(i))) { log({ evento: 'produto_ignorado' }); return json(200, { ok: true, ignorado: 'produto' }); }
      const ev = String(b.event || ''); const compra = d.purchase || {}; const transacao = String(compra.transaction || '').trim();
      const motivo = EVENTOS_REVOGA[ev];
      if (!EVENTOS_APROVA.has(ev) && !motivo) { log({ evento: 'evento_ignorado', ev }); return json(200, { ok: true, ignorado: 'evento' }); }
      if (!transacao || transacao.length < 4 || transacao.length > 80) return json(400, { erro: 'sem transacao' });
      // 4) reembolso / chargeback: revoga só a compra
      if (motivo) { const r = await rpc('passe_revogar', { p_transacao: transacao, p_motivo: motivo }); log({ evento: 'revogacao', transacao, motivo, revogado: !!r?.revogado }); return json(200, { ok: true, revogado: !!r?.revogado }); }
      // 3) aprovação: gera (ou reaproveita) o código e manda o e-mail
      const email = String(d.buyer?.email || '').trim();
      if (!EMAIL_RE.test(email)) return json(400, { erro: 'sem e-mail do comprador' });
      const nome = String(d.buyer?.first_name || d.buyer?.name || '').trim();
      const ms = Number(compra.approved_date); const aprovadoEm = Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : null;
      const r = await rpc('passe_registrar_compra', { p_transacao: transacao, p_email: email, p_nome: nome, p_produto: String(prod.id ?? ''), p_aprovado_em: aprovadoEm });
      if (r.status !== 'aprovada' || !r.code) { log({ evento: 'compra_revogada_ignorada', transacao }); return json(200, { ok: true, ignorado: 'revogada' }); }
      if (r.email_enviado) { log({ evento: 'duplicado', transacao }); return json(200, { ok: true, duplicado: true }); }
      try {
        await enviarEmail({ env, fetchImpl, para: email, msg: montarEmail({ nome, code: r.code, expiraEm: r.expira_em, siteUrl }), chave: `passe-${transacao}` });
        await rpc('passe_email_resultado', { p_transacao: transacao, p_ok: true, p_erro: null });
        log({ evento: 'aprovada', transacao, novo: !!r.novo }); return json(200, { ok: true, novo: !!r.novo });
      } catch (e) {
        await rpc('passe_email_resultado', { p_transacao: transacao, p_ok: false, p_erro: String(e.message) }).catch(() => {});
        log({ evento: 'email_falhou', transacao }); return json(502, { erro: 'email falhou, a Hotmart vai tentar de novo' }); // 5xx: a Hotmart reenvia o aviso e o mesmo código é usado
      }
    } catch (e) { log({ evento: 'erro', msg: String(e.message).slice(0, 120) }); return json(500, { erro: 'erro interno' }); }
  };
}
