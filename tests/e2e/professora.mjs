// Modo professora (código secreto + busca de aluno pelo nome + trocar aluno) e limite de 2 aparelhos do passe. Supabase simulado.
// O código da professora aqui é de mentira: o verdadeiro nunca vai pro repositório (no banco só existe o hash).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const PROF = 'PROFTESTE99';
const turma = [{ nome: 'Marina S.', code: 'MARI11' }, { nome: 'Marcos', code: 'MARC22' }, { nome: 'José Pedro', code: 'JOSE33' }];
const aparelhosPasse = new Set(); // o "servidor" do teste guarda os aparelhos do passe
const json = (r, v) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) });
async function novoAparelho() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true });
  await ctx.route('**/rest/v1/rpc/aluno_acesso', (r) => {
    const b = r.request().postDataJSON(); const c = String(b.p_code).toUpperCase();
    if (c === PROF) return json(r, { ok: true, tipo: 'prof', nome: 'Professora' });
    if (turma.some((x) => x.code === c)) return json(r, { ok: true, tipo: 'turma' });
    if (c === 'PASSE1') {
      if (!aparelhosPasse.has(b.p_aparelho) && aparelhosPasse.size >= 2) return json(r, { ok: false, motivo: 'aparelhos', max: 2 });
      aparelhosPasse.add(b.p_aparelho); return json(r, { ok: true, tipo: 'passe' });
    }
    return json(r, { ok: false, motivo: 'codigo' });
  });
  await ctx.route('**/rest/v1/rpc/prof_turma', (r) => (r.request().postDataJSON().p_prof === PROF ? json(r, turma) : r.fulfill({ status: 400, body: '{}' })));
  await ctx.route('**/rest/v1/rpc/{midis_publicos_lista,fig_entrar,fig_salvar}', (r) => json(r, r.request().url().includes('fig_entrar') ? { ok: false } : []));
  await ctx.route('**/rest/v1/rpc/aluno_visit', (r) => json(r, null));
  return ctx;
}
async function entrarComCodigo(p, nome, codigo) {
  await p.goto(`${url}/aluno.html`); await sleep(1200);
  await p.locator('input[aria-label="Seu nome"]').fill(nome); await p.locator('select').selectOption('codigo'); await sleep(150);
  await p.locator('.al-cod').fill(codigo); await p.locator('button:has-text("entrar")').click(); await sleep(2200);
}

// --- professora ---
{
  const ctx = await novoAparelho(); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await entrarComCodigo(p, 'Bea', PROF);
  check('professora entra com o código secreto', (await p.locator('.al-entry').count()) === 0 && (await p.locator('.bottom-nav').count()) > 0);
  check('modo professora fica guardado neste aparelho', (await p.evaluate(() => localStorage.getItem('beaterista-prof-codigo'))) === PROF);
  check('com o código dela, nada fica com cadeado', (await p.locator('.bottom-nav .nav-lock').count()) === 0);
  await p.locator('button:has-text("trocar aluno")').click(); await sleep(800);
  check('"trocar aluno" abre a BUSCA pelo nome (não pede código)', (await p.locator('input[aria-label="Buscar aluno pelo nome"]').count()) === 1 && (await p.locator('input[aria-label="Código do aluno"]').count()) === 0);
  check('lista a turma toda de início', (await p.locator('.prof-lista button').count()) === 3);
  await p.locator('input[aria-label="Buscar aluno pelo nome"]').fill('mar'); await sleep(250);
  check('"mar" acha Marcos e Marina', (await p.locator('.prof-lista button').allTextContents()).join('|') === 'Marcos|Marina S.');
  await p.locator('input[aria-label="Buscar aluno pelo nome"]').fill('jose'); await sleep(250);
  check('sem acento acha "José Pedro"', (await p.locator('.prof-lista button').allTextContents()).join('|') === 'José Pedro');
  const tela = await p.locator('body').textContent();
  check('o código do aluno nunca aparece na tela', !/JOSE33|MARI11|MARC22/.test(tela || ''));
  await p.locator('input[aria-label="Buscar aluno pelo nome"]').fill('marina'); await sleep(250);
  await p.locator('.prof-lista button').first().click(); await sleep(2500);
  check('tocou na Marina: o app vira a conta dela', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === 'MARI11' && (await p.evaluate(() => localStorage.getItem('beaterista-aluno-nome'))) === 'Marina S.');
  check('a saudação mostra a aluna', (await p.locator('.topwrap').textContent()).includes('Marina'));
  check('o modo professora continua guardado', (await p.evaluate(() => localStorage.getItem('beaterista-prof-codigo'))) === PROF);
  await p.locator('button:has-text("trocar aluno")').click(); await sleep(800);
  await p.locator('button:has-text("voltar pra mim")').click(); await sleep(2500);
  check('voltar pra mim: volta pro código da professora', (await p.evaluate(() => localStorage.getItem('beaterista-aluno-codigo'))) === PROF);
  check('sem erros de JS (professora)', errs.length === 0, errs.join('|'));
  await ctx.close();
}
// --- passe: 2 aparelhos ---
{
  const res = [];
  for (const i of [1, 2, 3]) {
    const ctx = await novoAparelho(); const p = await ctx.newPage();
    await entrarComCodigo(p, `Aluno${i}`, 'PASSE1');
    res.push({ entrou: (await p.locator('.al-entry').count()) === 0, erro: (await p.locator('.form-err').textContent().catch(() => '')) || '' });
    await ctx.close();
  }
  check('passe: 1º aparelho entra', res[0].entrou); check('passe: 2º aparelho entra', res[1].entrou);
  check('passe: 3º aparelho é recusado', !res[2].entrou);
  check('passe: o aviso fala de 2 aparelhos e da professora', /2 aparelhos/.test(res[2].erro) && /professora/.test(res[2].erro), res[2].erro);
}
await browser.close(); srv.close(); done();
