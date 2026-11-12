// Webhook da Hotmart → Passe Beaterista: token, produto, aprovação, aviso duplicado, falha de e-mail com nova tentativa, reembolso/chargeback.
// O banco aqui é um "falso" que imita as funções de supabase/015_passe_hotmart.sql (o SQL de verdade é testado em tests/e2e/passe-sql.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarHandler, montarEmail, igualSeguro, esc } from '../supabase/functions/hotmart-passe/passe-core.mjs';

const ENV = { HOTMART_HOTTOK: 'segredo-hottok', HOTMART_PRODUCT_IDS: '4567890,PASSE-UCODE', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', RESEND_API_KEY: 're_123', MAIL_FROM: 'Beaterista <passe@exemplo.com>', ADMIN_TOKEN: 'admin-123' };

function mundo({ emailFalha = 0 } = {}) {
  const codigos = new Map([['TURMA1', { ativo: true, tipo: 'turma' }], ['PASSEOUTRO', { ativo: true, tipo: 'passe' }]]); // códigos que já existiam: devem seguir intactos
  const compras = new Map(); const emails = []; let seq = 0; let falhas = emailFalha;
  const rpcs = {
    passe_registrar_compra: (a) => {
      const c = compras.get(a.p_transacao);
      if (c) return { novo: false, status: c.status, code: c.code, expira_em: c.code ? codigos.get(c.code).expira_em : null, email_enviado: !!c.email_enviado };
      const code = `PNOVO${String(++seq).padStart(5, '0')}`; const ap = a.p_aprovado_em ? new Date(a.p_aprovado_em) : new Date('2026-11-12T12:00:00Z');
      const exp = new Date(ap); exp.setUTCMonth(exp.getUTCMonth() + 12);
      codigos.set(code, { ativo: true, tipo: 'passe', expira_em: exp.toISOString(), nome: a.p_nome });
      compras.set(a.p_transacao, { code, status: 'aprovada', email: a.p_email, nome: a.p_nome, email_enviado: false });
      return { novo: true, status: 'aprovada', code, expira_em: exp.toISOString(), email_enviado: false };
    },
    passe_revogar: (a) => {
      const c = compras.get(a.p_transacao);
      if (!c) { compras.set(a.p_transacao, { code: null, status: a.p_motivo }); return { revogado: false, motivo: 'sem_compra' }; }
      if (c.status !== 'aprovada') return { revogado: false, motivo: 'ja_revogada' };
      c.status = a.p_motivo; const k = codigos.get(c.code); if (k && k.tipo === 'passe') k.ativo = false; return { revogado: true, code: c.code };
    },
    passe_email_resultado: (a) => { const c = compras.get(a.p_transacao); if (c && a.p_ok) c.email_enviado = true; return null; },
    passe_dados_envio: (a) => { const c = compras.get(a.p_transacao); return c ? { status: c.status, code: c.code, email: c.email, comprador: c.nome, expira_em: c.code ? codigos.get(c.code).expira_em : null } : null; },
  };
  const fetchImpl = async (url, opts) => {
    if (url.includes('/rest/v1/rpc/')) { const nome = url.split('/rpc/')[1]; const out = rpcs[nome](JSON.parse(opts.body)); return new Response(JSON.stringify(out), { status: 200 }); }
    if (url === 'https://api.resend.com/emails') {
      if (falhas > 0) { falhas--; return new Response('boom', { status: 500 }); }
      emails.push({ ...JSON.parse(opts.body), chave: opts.headers['idempotency-key'] }); return new Response('{}', { status: 200 });
    }
    throw new Error(`url inesperada ${url}`);
  };
  return { codigos, compras, emails, handler: criarHandler({ env: ENV, fetchImpl, agora: () => new Date('2026-11-12T12:00:00Z') }) };
}
const evento = (ev, extra = {}) => ({ id: 'e1', event: ev, version: '2.0.0', data: { product: { id: 4567890, ucode: 'PASSE-UCODE', name: 'Passe Beaterista' }, buyer: { email: 'maria@exemplo.com', name: 'Maria Souza', first_name: 'Maria' }, purchase: { transaction: 'HP12345678', approved_date: Date.parse('2026-11-12T09:00:00Z'), status: ev === 'PURCHASE_APPROVED' ? 'APPROVED' : 'X' }, ...extra } });
const post = (w, corpo, headers = { 'x-hotmart-hottok': ENV.HOTMART_HOTTOK }, path = '/hotmart-passe') => w.handler(new Request(`https://x.supabase.co/functions/v1${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(corpo) }));

test('token errado ou ausente: 401 e nada acontece', async () => {
  const w = mundo();
  assert.equal((await post(w, evento('PURCHASE_APPROVED'), { 'x-hotmart-hottok': 'errado' })).status, 401);
  assert.equal((await post(w, evento('PURCHASE_APPROVED'), {})).status, 401);
  assert.equal(w.compras.size, 0); assert.equal(w.emails.length, 0);
});
test('o token também vale vindo no corpo (webhook v2 manda "hottok")', async () => {
  const w = mundo(); const r = await post(w, { ...evento('PURCHASE_APPROVED'), hottok: ENV.HOTMART_HOTTOK }, {});
  assert.equal(r.status, 200); assert.equal(w.emails.length, 1);
});
test('produto de outro item: 200 ignorado, sem código e sem e-mail', async () => {
  const w = mundo(); const e = evento('PURCHASE_APPROVED'); e.data.product = { id: 999, ucode: 'OUTRO' };
  const r = await post(w, e); assert.equal(r.status, 200); assert.equal((await r.json()).ignorado, 'produto');
  assert.equal(w.compras.size, 0); assert.equal(w.emails.length, 0);
});
test('aprovação: cria código de passe (12 meses da aprovação) e manda o e-mail com o código', async () => {
  const w = mundo(); const r = await post(w, evento('PURCHASE_APPROVED'));
  assert.equal(r.status, 200); assert.equal(w.emails.length, 1);
  const c = w.compras.get('HP12345678'); const k = w.codigos.get(c.code);
  assert.equal(k.tipo, 'passe'); assert.equal(k.expira_em, '2027-11-12T09:00:00.000Z'); assert.ok(c.email_enviado);
  const m = w.emails[0]; assert.deepEqual(m.to, ['maria@exemplo.com']); assert.ok(m.text.includes(c.code) && m.html.includes(c.code)); assert.ok(m.text.includes('jogos.beaterista.com.br'));
  assert.equal(m.from, ENV.MAIL_FROM); assert.equal(m.chave, 'passe-HP12345678');
});
test('aviso duplicado: mesmo código, um código só, sem segundo e-mail', async () => {
  const w = mundo(); await post(w, evento('PURCHASE_APPROVED')); const code = w.compras.get('HP12345678').code;
  const r2 = await post(w, evento('PURCHASE_APPROVED')); const r3 = await post(w, evento('PURCHASE_COMPLETE'));
  assert.equal(r2.status, 200); assert.equal((await r2.json()).duplicado, true); assert.equal(r3.status, 200);
  assert.equal(w.compras.get('HP12345678').code, code); assert.equal([...w.codigos.keys()].filter((k) => k.startsWith('PNOVO')).length, 1); assert.equal(w.emails.length, 1);
});
test('e-mail falhou: 502 (a Hotmart reenvia) e a nova tentativa usa o MESMO código', async () => {
  const w = mundo({ emailFalha: 1 }); const r1 = await post(w, evento('PURCHASE_APPROVED')); assert.equal(r1.status, 502);
  const code = w.compras.get('HP12345678').code; assert.equal(w.emails.length, 0); assert.equal(w.compras.get('HP12345678').email_enviado, false);
  const r2 = await post(w, evento('PURCHASE_APPROVED')); assert.equal(r2.status, 200); assert.equal(w.emails.length, 1);
  assert.equal(w.compras.get('HP12345678').code, code); assert.ok(w.emails[0].text.includes(code)); assert.equal([...w.codigos.keys()].filter((k) => k.startsWith('PNOVO')).length, 1);
});
test('reenvio manual (ADMIN_TOKEN) manda o e-mail de novo com o mesmo código', async () => {
  const w = mundo(); await post(w, evento('PURCHASE_APPROVED')); const code = w.compras.get('HP12345678').code;
  assert.equal((await post(w, { transacao: 'HP12345678' }, { 'x-admin-token': 'nao' }, '/hotmart-passe/reenviar')).status, 401);
  const r = await post(w, { transacao: 'HP12345678' }, { 'x-admin-token': ENV.ADMIN_TOKEN }, '/hotmart-passe/reenviar');
  assert.equal(r.status, 200); assert.equal(w.emails.length, 2); assert.ok(w.emails[1].text.includes(code));
});
test('reembolso revoga SÓ o código daquela compra; turma e outros passes ficam ativos', async () => {
  const w = mundo(); await post(w, evento('PURCHASE_APPROVED')); const code = w.compras.get('HP12345678').code;
  const r = await post(w, evento('PURCHASE_REFUNDED')); assert.equal(r.status, 200); assert.equal((await r.json()).revogado, true);
  assert.equal(w.codigos.get(code).ativo, false); assert.equal(w.compras.get('HP12345678').status, 'reembolsada');
  assert.equal(w.codigos.get('TURMA1').ativo, true); assert.equal(w.codigos.get('PASSEOUTRO').ativo, true);
});
test('chargeback também revoga; reembolso repetido não faz nada', async () => {
  const w = mundo(); await post(w, evento('PURCHASE_APPROVED')); const code = w.compras.get('HP12345678').code;
  assert.equal((await (await post(w, evento('PURCHASE_CHARGEBACK'))).json()).revogado, true); assert.equal(w.codigos.get(code).ativo, false);
  assert.equal((await (await post(w, evento('PURCHASE_REFUNDED'))).json()).revogado, false); assert.equal(w.compras.get('HP12345678').status, 'chargeback');
});
test('reembolso de outro produto não mexe em nada', async () => {
  const w = mundo(); await post(w, evento('PURCHASE_APPROVED')); const code = w.compras.get('HP12345678').code;
  const e = evento('PURCHASE_REFUNDED'); e.data.product = { id: 1, ucode: 'X' }; await post(w, e); assert.equal(w.codigos.get(code).ativo, true);
});
test('reembolso que chega antes da aprovação: a aprovação tardia não libera código nem manda e-mail', async () => {
  const w = mundo(); await post(w, evento('PURCHASE_REFUNDED')); const r = await post(w, evento('PURCHASE_APPROVED'));
  assert.equal(r.status, 200); assert.equal((await r.json()).ignorado, 'revogada'); assert.equal(w.emails.length, 0); assert.equal([...w.codigos.keys()].filter((k) => k.startsWith('PNOVO')).length, 0);
});
test('outros eventos (cancelada, atrasada) e e-mail inválido', async () => {
  const w = mundo(); assert.equal((await (await post(w, evento('PURCHASE_CANCELED'))).json()).ignorado, 'evento');
  const e = evento('PURCHASE_APPROVED'); e.data.buyer.email = 'sem-arroba'; assert.equal((await post(w, e)).status, 400); assert.equal(w.compras.size, 0);
});
test('só POST; sem configuração o servidor falha fechado', async () => {
  const w = mundo(); assert.equal((await w.handler(new Request('https://x/y', { method: 'GET' }))).status, 405);
  const h = criarHandler({ env: { ...ENV, HOTMART_PRODUCT_IDS: '' }, fetchImpl: async () => { throw new Error('nao chamar'); } });
  assert.equal((await h(new Request('https://x/y', { method: 'POST', body: '{}' }))).status, 500);
});
test('e-mail: nome do comprador não injeta HTML; comparação segura', async () => {
  const m = montarEmail({ nome: '<img src=x onerror=alert(1)> Zé', code: 'PABC234XYZ', expiraEm: '2027-11-12T09:00:00Z', siteUrl: 'https://jogos.beaterista.com.br' });
  assert.ok(!m.html.includes('<img')); assert.ok(m.html.includes('&lt;img')); assert.ok(m.texto.includes('12/11/2027'));
  assert.equal(esc('<&>'), '&lt;&amp;&gt;'); assert.equal(await igualSeguro('a', 'a'), true); assert.equal(await igualSeguro('a', 'b'), false); assert.equal(await igualSeguro(undefined, 'b'), false);
});
