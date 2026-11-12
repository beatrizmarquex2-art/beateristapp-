// Acesso do aluno: sem código só o Modo Livre. O Modo Aventura (mapa e missões) fica trancado; com código abre (Beat Hero/Piano Hero não têm; o Toca Aqui voltou na trilha).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
async function phone(codigo) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: codigo ? 'true' : 'false' }));
  await ctx.route('**/rest/v1/rpc/midis_publicos_lista', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const p = await ctx.newPage(); await p.addInitScript((c) => { localStorage.setItem('beaterista-aluno-nome', 'Teste'); if (c) localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); }, codigo);
  return { ctx, p };
}
const go = async (p, h) => { await p.goto(url + '/aluno.html' + h); await sleep(1600); };
const ROTAS = ['#/kids/memoria/aventura', '#/kids/ritmo/aventura']; // (o Modo Aventura do Beat Hero/Piano Hero foi removido)
{
  const { ctx, p } = await phone(false);
  for (const r of ROTAS) { await go(p, r); check(`sem código: ${r} fica trancado`, await p.evaluate(() => !!document.querySelector('.al-lock') && !document.querySelector('.mp-node') && !document.querySelector('.av-go'))); }
  await go(p, '#/jogos/toca'); check('sem código: o Toca Aqui (com Modo Aventura) fica trancado', await p.evaluate(() => !!document.querySelector('.al-lock')));
  await go(p, '#/jogos/stop'); check('sem código: o stop abre direto no jogo, sem escolher modo e sem Modo Aventura', await p.evaluate(() => !document.querySelector('.al-lock') && !!document.querySelector('.jg-game') && !/Modo Aventura/.test(document.body.innerText)));
  await go(p, '#/kids/memoria/livre'); check('sem código: Jogo da memória livre continua aberto', await p.evaluate(() => !document.querySelector('.al-lock')));
  await ctx.close();
}
{
  const { ctx, p } = await phone(true);
  for (const r of ['#/kids/memoria/aventura']) { await go(p, r); check(`com código: ${r} abre o mapa`, await p.evaluate(() => !document.querySelector('.al-lock') && !!document.querySelector('.mp-node'))); }
  await go(p, '#/jogos/toca'); check('com código: o Toca Aqui pergunta o modo (livre ou aventura)', await p.evaluate(() => !document.querySelector('.al-lock') && /Modo Aventura/.test(document.body.textContent)));
  await go(p, '#/trilha'); check('com código: a trilha mostra 7 passos e só o primeiro aberto', await p.evaluate(() => document.querySelectorAll('.tr-i').length === 7 && document.querySelectorAll('a.tr-i').length === 1));
  await go(p, '#/jogos/toca/aventura'); check('com código: Toca Aqui (aventura) trancado até terminar os passos antes dele, volta pra trilha', await p.evaluate(() => location.hash === '#/trilha'));
  await ctx.close();
}
const fails = done(); await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
