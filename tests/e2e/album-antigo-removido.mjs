// O sistema antigo de figurinhas (cartas de bateristas/guitarristas/vocalistas) saiu: o card "Álbum" do Kids leva pro álbum NOVO e a rota antiga redireciona.
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx } = await launch(); const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await ctx.route('**/rest/v1/rpc/{aluno_codigo_ok,aluno_acesso}', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
await ctx.route('**/*.supabase.co/**', (r) => r.fallback());
await page.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('beaterista-aluno-codigo', 'TESTE1'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
await page.goto(url + '/aluno.html#/kids'); await sleep(1800);
const href = await page.evaluate(() => { const a = [...document.querySelectorAll('a')].find((x) => /Álbum/.test(x.textContent) && x.getAttribute('href')); return a ? a.getAttribute('href') : null; });
check('card Álbum do Kids leva pro álbum novo (#/album)', href === '#/album', String(href));
check('o card mostra a contagem do álbum novo (de 125)', await page.evaluate(() => /de 125 figurinhas/.test(document.body.innerText)));
await page.goto(url + '/aluno.html#/kids/album'); await sleep(1500);
check('a rota antiga #/kids/album redireciona pro álbum novo', (await page.evaluate(() => location.hash)).startsWith('#/album'), await page.evaluate(() => location.hash));
check('nada das cartas antigas aparece (bateristas/guitarristas/vocalistas)', await page.evaluate(() => !document.querySelector('.kx-card-fig, .kx-album')));
const mod = await page.evaluate(async () => { try { await import('/js/kids/album-data.js'); return 'existe'; } catch { return 'removido'; } });
check('o arquivo de dados das cartas antigas foi removido', mod === 'removido', mod);
check('sem erros de página', errs.length === 0, errs.join(' | '));
await browser.close(); srv.close(); done();
