// AUDITORIA DE TELAS: abre cada rota da área dos alunos (jogos, estudos, álbum, perfil…) em vários aparelhos e mede o que quebra:
// rolagem lateral, coisas cortadas pra fora da tela, barra de rolagem dentro de barra (a "barra do quebra-cabeça"), botão escondido pelo menu de baixo,
// texto cortado dentro de botão e imagem quebrada. Uso: `node tests/e2e/telas-auditoria.mjs [filtro-de-rota] [filtro-de-aparelho]`; relatório JSON em $SHOTS (ou /tmp).
import fs from 'node:fs';
import { serve, launch, context, sleep, done, check } from './harness.mjs';

export const APARELHOS = [
  ['iPhone SE', 375, 667, 'm'], ['iPhone 14', 390, 844, 'm'], ['iPhone Pro Max', 430, 932, 'm'], ['iPhone deitado', 844, 390, 'm'],
  ['Galaxy S pequeno', 360, 740, 'm'], ['Galaxy S ultra', 412, 915, 'm'], ['Galaxy deitado', 915, 412, 'm'],
  ['iPad mini', 744, 1133, 't'], ['iPad', 820, 1180, 't'], ['iPad deitado', 1180, 820, 't'], ['iPad Pro deitado', 1366, 1024, 't'], ['Galaxy Tab', 800, 1280, 't'], ['Galaxy Tab deitado', 1280, 800, 't'],
  ['MacBook Air', 1280, 720, 'd'], ['MacBook Pro', 1512, 900, 'd'], ['Windows notebook', 1366, 768, 'd'], ['Windows zoom 125%', 1229, 691, 'd'], ['PC full HD', 1920, 1080, 'd'], ['monitor baixo', 1440, 560, 'd'],
];

/** Mede a tela atual. Roda dentro da página. */
export const MEDE = () => {
  const vw = innerWidth; const vh = innerHeight; const de = document.documentElement; const out = { vw, vh, problemas: [] };
  const add = (tipo, det) => out.problemas.push({ tipo, det });
  const visivel = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const nome = (e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const rolaX = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') && p.scrollWidth > p.clientWidth - 1 && p.clientWidth < vw + 1) return true; } return false; };
  if (de.scrollWidth - vw > 1) add('rolagem-lateral', `${de.scrollWidth - vw}px`);
  const view = document.querySelector('#view') || document.body;
  // coisas pra fora da tela (esquerda/direita), fora de áreas que rolam de propósito
  const fora = [];
  for (const e of view.querySelectorAll('*')) {
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue; if (!visivel(e)) continue; const cs = getComputedStyle(e); if (cs.position === 'fixed') continue;
    const r = e.getBoundingClientRect(); if (r.right > vw + 2 || r.left < -2) { if (rolaX(e)) continue; if (e.closest('[aria-hidden="true"], .mp-decor, .decor, .confete, canvas')) continue; fora.push(`${nome(e)} (${Math.round(r.left)}→${Math.round(r.right)})`); }
  }
  if (fora.length) add('fora-da-tela', fora.slice(0, 4).join(' | ') + (fora.length > 4 ? ` +${fora.length - 4}` : ''));
  // barra de rolagem dentro de barra (rolagem vertical aninhada)
  const aninhada = [];
  for (const e of view.querySelectorAll('*')) {
    const cs = getComputedStyle(e); if (!(cs.overflowY === 'auto' || cs.overflowY === 'scroll')) continue; if (!visivel(e)) continue;
    if (e.scrollHeight > e.clientHeight + 4 && e.clientHeight > 60 && !e.closest('[role="dialog"], .modal, .sheet, .overlay')) aninhada.push(`${nome(e)} (${e.clientHeight}/${e.scrollHeight}px)`);
  }
  if (aninhada.length) add('barra-dentro-de-barra', aninhada.slice(0, 3).join(' | '));
  // texto cortado dentro de botão/rótulo (overflow escondido e o conteúdo é maior que a caixa)
  const cortado = [];
  for (const e of view.querySelectorAll('button, a, .btn, h1, h2, h3, label, .chip, [class*="tab"] > *')) {
    if (!visivel(e)) continue; const cs = getComputedStyle(e); if (!/hidden|clip/.test(cs.overflowX + cs.overflowY)) continue; if (cs.textOverflow === 'ellipsis') continue;
    if (e.scrollWidth > e.clientWidth + 3 && e.textContent.trim().length > 1) cortado.push(`${nome(e)} "${e.textContent.trim().slice(0, 24)}"`);
  }
  if (cortado.length) add('texto-cortado', cortado.slice(0, 4).join(' | '));
  // imagem quebrada
  const quebradas = [...view.querySelectorAll('img')].filter((i) => visivel(i) && i.complete && i.naturalWidth === 0).map((i) => (i.getAttribute('src') || '').slice(-40));
  if (quebradas.length) add('imagem-quebrada', quebradas.slice(0, 3).join(' | '));
  // menu de baixo tampando o fim da página: rola até o fim e vê se o último botão/link fica livre
  const nav = document.querySelector('.bottom-nav'); const navR = nav && visivel(nav) && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect() : null;
  out.rolagemY = Math.max(0, de.scrollHeight - vh);
  if (navR) {
    const antes = scrollY; scrollTo(0, de.scrollHeight); const alvos = [...view.querySelectorAll('button, a, input, select')].filter((e) => visivel(e) && !e.closest('.bottom-nav, [aria-hidden="true"]') && getComputedStyle(e).position !== 'fixed');
    const ult = alvos.map((e) => e.getBoundingClientRect()).filter((r) => r.bottom > 0 && r.top < vh).sort((a, b) => b.bottom - a.bottom)[0];
    if (ult && ult.bottom > navR.top + 4) add('tampado-pelo-menu', `último botão termina em ${Math.round(ult.bottom)} e o menu começa em ${Math.round(navR.top)}`);
    scrollTo(0, antes);
  }
  // alvos de toque pequenos demais em aparelhos de toque (mínimo 32px; o ideal é 44)
  if (matchMedia('(pointer:coarse)').matches) {
    const peq = [...view.querySelectorAll('button, a.btn, [role="button"], input[type="checkbox"], select')].filter((e) => visivel(e) && !e.closest('svg')).filter((e) => { const r = e.getBoundingClientRect(); return r.height < 30 || r.width < 30; }).map((e) => `${nome(e)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
    if (peq.length) add('alvo-pequeno', `${peq.length}: ${peq.slice(0, 3).join(' | ')}`);
  }
  return out;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const fRota = process.argv[2] && process.argv[2] !== '*' ? process.argv[2] : null; const fApar = process.argv[3] || null;
  const { srv, url } = await serve(); const { browser } = await launch();
  const aparelhos = APARELHOS.filter((a) => !fApar || new RegExp(fApar, 'i').test(a[0]));
  const ROTAS = ['#/inicio', '#/jogos', '#/estudos', '#/album', '#/perfil', '#/tocar', '#/roleta', '#/dicionario', '#/lojinha', '#/paulta', '#/kids', '#/ritmo/drum', '#/ritmo/piano', '#/ritmo/setas', '#/estudos/aulas', '#/estudos/ouvido', '#/estudos/ritmos', '#/estudos/acordes/violao', '#/estudos/basica/figuras', '#/estudos/curiosidades', '#/estudos/dicas', '#/jogos/relatorio', '#/piano'];
  const relatorio = {}; const rodaAparelho = async ([nome, w, h, tipo]) => {
    const ctx = await context(browser, { viewport: { width: w, height: h }, isMobile: tipo !== 'd', hasTouch: tipo !== 'd' });
    if (tipo === 't') await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 }); } catch { /* ok */ } });
    await ctx.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
    await p.goto(`${url}/aluno.html#/jogos`); await sleep(1500);
    // descobre as rotas dos jogos e das aulas olhando os links das telas principais
    const achadas = new Set(ROTAS);
    for (const base of ['#/jogos', '#/estudos', '#/kids', '#/estudos/aulas']) { await p.evaluate((b) => { location.hash = b; }, base); await sleep(700); (await p.evaluate(() => [...document.querySelectorAll('#view a[href^="#/"]')].map((a) => a.getAttribute('href')))).forEach((hh) => { if (/^#\/(jogos|kids|ritmo|estudos|paulta|toque|tocar|roleta)(\/|$)/.test(hh) && hh.split('/').length <= 4) achadas.add(hh); }); }
    const lista = [...achadas].filter((r) => !fRota || new RegExp(fRota, 'i').test(r));
    for (const r of lista) {
      await p.evaluate((x) => { location.hash = x; }, r); await sleep(850);
      let m; try { m = await p.evaluate(MEDE); } catch (e) { m = { problemas: [{ tipo: 'erro-medindo', det: String(e).slice(0, 80) }] }; }
      for (const pr of m.problemas) (relatorio[r] ||= []).push({ aparelho: nome, ...pr });
      if (m.rolagemY != null) (relatorio.__rolagem ||= {})[`${r}|${nome}`] = m.rolagemY;
    }
    if (errs.length) (relatorio.__erros ||= []).push({ aparelho: nome, errs: [...new Set(errs)].slice(0, 3) });
    await ctx.close();
  };
  const fila = [...aparelhos]; await Promise.all(Array.from({ length: 4 }, async () => { while (fila.length) await rodaAparelho(fila.shift()); }));
  fs.writeFileSync(`${process.env.SHOTS || '/tmp'}/telas-auditoria.json`, JSON.stringify(relatorio, null, 1));
  const rotasRuins = Object.keys(relatorio).filter((k) => !k.startsWith('__'));
  for (const r of rotasRuins) { console.log(`\n${r}`); const por = {}; relatorio[r].forEach((x) => { (por[x.tipo] ||= []).push(x); }); for (const [t, xs] of Object.entries(por)) console.log(`  ${t}: ${[...new Set(xs.map((x) => x.aparelho))].join(', ')}\n     ex.: ${xs[0].det}`); }
  if (relatorio.__erros) console.log('\nERROS DE PÁGINA', JSON.stringify(relatorio.__erros));
  check('nenhuma rota com problema de tela', rotasRuins.length === 0, `${rotasRuins.length} rotas com problema`);
  await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
}
