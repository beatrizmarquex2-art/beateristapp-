// Lojinha e Passe: visitante em link direto, interruptor, vitrine, checkout, Passe (simulado), envelope, álbum, Paul apresenta, menu e layout.
// SHOTS=pasta para salvar capturas. Supabase simulado (nada vai a produção).
import { serve, launch, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser } = await launch();
const SHOTS = process.env.SHOTS || '';
const shot = async (p, n) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true }); };
const novo = async (w = 390, h = 800) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700, deviceScaleFactor: 1 });
  await ctx.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: /aluno_codigo_ok|fig_salvar/.test(r.request().url()) ? 'true' : /fig_entrar/.test(r.request().url()) ? JSON.stringify({ ok: true, nome: 'Aluno', estado: null }) : 'null' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) errs.push(m.text()); });
  return { ctx, p, errs };
};
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// 1) interruptor desligado: nada novo aparece
{
  const { p, errs } = await novo(); await p.goto(`${url}/aluno.html`); await sleep(1200);
  check('desligado: sem "Visitar a Lojinha" na entrada', (await p.locator('text=Visitar a Lojinha').count()) === 0);
  await p.goto(`${url}/aluno.html#/lojinha`); await sleep(800);
  check('desligado: link direto da lojinha continua só pedindo o nome (visitante não vê vitrine)', (await p.locator('.lj-grid').count()) === 0);
  check('desligado: sem erros', errs.length === 0, errs.join('|'));
}
// 2) visitante em link direto (ligado)
{
  const { p, errs } = await novo(); await p.goto(`${url}/aluno.html?loja=on#/lojinha`); await sleep(1500);
  check('visitante: vitrine abre sem pedir nome', (await p.locator('.lj-grid').count()) === 2 && (await p.locator('.al-entry').count()) === 0);
  const titulos = await p.locator('.lj-card h2').allTextContents();
  check('ordem inicial: Memória, Kids, Robôterista, Violão, depois os outros', titulos.slice(0, 4).join('|') === 'Jogo da Memória Musical|Bateria Kids|Robôterista Ensina|Violão do Zero', titulos.join('|'));
  check('7 produtos (Robôterista só 1 SKU)', titulos.length === 7 && titulos.filter((t) => /Rob/.test(t)).length === 1);
  check('ingresso do Passe aparece depois dos 4 cards', await p.evaluate(() => { const g = document.querySelectorAll('.lj-grid')[0], i = document.querySelector('.lj-ingresso'); return !!(g.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_FOLLOWING) && document.querySelectorAll('.lj-grid')[1].compareDocumentPosition(i) & Node.DOCUMENT_POSITION_PRECEDING; }));
  const links = await p.locator('a[data-checkout]').evaluateAll((a) => a.map((x) => [x.dataset.checkout, x.href]));
  check('só o curso tem checkout, com o link oficial exato', links.length === 1 && links[0][0] === 'curso' && links[0][1] === 'https://pay.hotmart.com/M76102148V?checkoutMode=10&off=va81350a', JSON.stringify(links));
  check('demais cards: "Em breve" (6) e sem link de compra', (await p.locator('.lj-card .lj-btn.soon').count()) === 6);
  check('curso mostra R$ 79,90 e os outros não mostram preço inventado', (await p.locator('.lj-preco').allTextContents()).join() === 'R$ 79,90');
  check('selo de formato em todos', (await p.locator('.lj-selo').count()) === 7);
  check('sem rolagem horizontal em 390px', (await overflow(p)) <= 0, String(await overflow(p)));
  await shot(p, 'vitrine-390');
  // recarregar em detalhe e Passe
  await p.goto(`${url}/aluno.html?loja=on#/lojinha/roboterista-ensina`); await p.reload(); await sleep(1200);
  check('detalhe abre em link direto e depois de recarregar', (await p.locator('.lj-det h1').textContent()) === 'Robôterista Ensina');
  check('galeria do Robôterista: 2 artes, trocam sem criar SKU', (await p.locator('.lj-thumbs button').count()) === 2);
  await p.locator('.lj-thumbs button').nth(1).click(); check('segunda arte: "Treine em casa entre as aulas"', (await p.locator('.lj-det-art img').getAttribute('alt')) === 'Treine em casa entre as aulas');
  await shot(p, 'detalhe-robo-390');
  await p.goto(`${url}/aluno.html?loja=on#/passe`); await p.reload(); await sleep(1200);
  check('Passe abre em link direto', (await p.locator('.lj-passe-top h1').textContent()) === 'Passe Beaterista' && (await p.locator('.lj-preco.big').textContent()).includes('R$ 49,90'));
  check('Passe sem checkout: compra desativada ("Compra em breve")', (await p.locator('.lj-btn.soon.wide').count()) === 1 && (await p.locator('a[data-checkout="passe"]').count()) === 0);
  check('Passe: validade 12 meses e pagamento único', (await p.locator('.lj-preco.big').textContent()).includes('12 meses') && (await p.locator('.lj-preco.big').textContent()).includes('pagamento único'));
  await shot(p, 'passe-390');
  check('rota privada continua pedindo o nome', await (async () => { await p.goto(`${url}/aluno.html?loja=on#/ranking`); await sleep(900); return (await p.locator('.al-entry').count()) === 1; })());
  check('sem erros de JS', errs.length === 0, errs.join('|'));
}
// 3) entrada: Visitar a Lojinha e Conhecer o Passe
{
  const { p } = await novo(); await p.goto(`${url}/aluno.html?loja=on`); await sleep(1200);
  check('entrada: "Visitar a Lojinha" abaixo do login', (await p.locator('.al-loja-links a:has-text("Visitar a Lojinha")').count()) === 1);
  await p.locator('input[aria-label="Seu nome"]').fill('Maria'); await p.locator('select').selectOption('codigo'); await sleep(200);
  check('entrada: "Conhecer o Passe Beaterista" junto às opções de acesso', await p.locator('.al-codbox a:has-text("Conhecer o Passe Beaterista")').isVisible());
  await shot(p, 'entrada-390');
  await p.locator('.al-codbox a:has-text("Conhecer o Passe")').click(); await sleep(900);
  check('o link do Passe leva à página do Passe', (await p.locator('.lj-passe-top h1').count()) === 1);
  await p.locator('.lj-entrar').click(); await sleep(900);
  check('voltar leva à entrada', (await p.locator('.al-entry').count()) === 1);
  await p.locator('.al-loja-links a:has-text("Visitar a Lojinha")').click(); await sleep(900);
  check('"Visitar a Lojinha" leva à vitrine', (await p.locator('.lj-grid').count()) === 2);
}
// 4) Paul apresenta o curso (nada toca sozinho) + menu inferior + estados do Passe + envelope + álbum
{
  const { p, errs } = await novo(); await p.goto(`${url}/aluno.html?loja=on#/lojinha/bateria-start-curso`); await sleep(1200);
  check('curso: bloco do Paul com "Assistir à apresentação"', (await p.locator('.lj-paul button:has-text("Assistir à apresentação")').count()) === 1);
  check('nenhum vídeo carregado antes do clique (sem áudio automático)', (await p.locator('iframe').count()) === 0);
  check('roteiro/legenda disponível como texto', (await p.locator('.lj-legenda p').textContent()).startsWith('Oi, eu sou o Paul!'));
  check('link externo de reserva presente', (await p.locator('.lj-ext').getAttribute('href')) === 'https://www.youtube.com/watch?v=8JxMYbuRYqg');
  await p.locator('.lj-paul button').click(); await sleep(300);
  const src = await p.locator('iframe').getAttribute('src');
  check('clique carrega o vídeo oficial (nocookie, legendas ligadas, sem autoplay)', /youtube-nocookie\.com\/embed\/8JxMYbuRYqg/.test(src) && /cc_load_policy=1/.test(src) && !/autoplay=1/.test(src), src);
  check('botão Adquirir do curso presente', (await p.locator('.lj-det a[data-checkout="curso"]').count()) === 1);
  await shot(p, 'detalhe-curso-390');
  // ativar Passe (simulado)
  await p.goto(`${url}/aluno.html?loja=on#/passe`); await sleep(1000);
  await p.locator('input[type=email]').fill('teste@exemplo.com'); await p.locator('input[placeholder=PAUL0000]').fill('PAUL9999'); await p.locator('.lj-form button').click(); await sleep(600);
  check('código errado: mensagem sem revelar o motivo', (await p.locator('.lj-msg').textContent()).startsWith('não conferiu'));
  await p.locator('.lj-teste summary').click(); await p.locator('button:has-text("nova compra simulada")').click(); await sleep(900);
  await p.locator('input[type=email]').fill('teste@exemplo.com'); await p.locator('input[placeholder=PAUL0000]').fill('paul1234'); await p.locator('.lj-form button').click(); await sleep(1800);
  check('ativação correta leva ao envelope', /#\/passe\/envelope/.test(p.url()) && (await p.locator('button:has-text("Abrir envelope")').count()) === 1, p.url());
  check('menu inferior: Lojinha depois de Tocar (6 abas)', (await p.locator('.bottom-nav .nav-item span').allTextContents()).join('|') === 'Jogos|Estudos|Tocar|Lojinha|Álbum|Perfil');
  await p.locator('button:has-text("Abrir envelope")').click(); await sleep(1200);
  check('envelope mostra as 3 cartas e "Ver no álbum"', (await p.locator('.lj-env .lj-carta').count()) === 3 && (await p.locator('.lj-env a:has-text("Ver no álbum")').count()) === 1);
  await shot(p, 'envelope-390');
  await p.goto(`${url}/aluno.html?loja=on#/passe`); await p.reload(); await sleep(1200);
  check('reabrir: Passe ativo com validade e sem novo envelope', (await p.locator('.lj-box.ok').count()) === 1 && (await p.locator('.lj-box.ok a:has-text("Ver no álbum")').count()) === 1);
  const ate = await p.locator('.lj-box.ok p').first().textContent(); check('mostra a data de vencimento', /Vale até \d{2}\/\d{2}\/\d{4}/.test(ate), ate);
  await shot(p, 'passe-ativo-390');
  await p.goto(`${url}/aluno.html?loja=on#/passe/envelope`); await sleep(1200); await p.locator('button:has-text("Abrir envelope")').click(); await sleep(900);
  check('segundo resgate: "já abriu", sem duplicar', (await p.locator('.lj-env .lj-aviso').textContent()).includes('já abriu'));
  await p.goto(`${url}/aluno.html?loja=on#/album`); await sleep(2500);
  check('álbum: aba "passe" separada com 3 cartas', (await p.locator('.fig-tabs button:has-text("passe")').count()) === 1);
  await p.locator('.fig-tabs button:has-text("passe")').click(); await sleep(500);
  check('seção Edição Passe Beaterista com P01..P03', (await p.locator('.fig-passe-card').evaluateAll((a) => a.map((x) => x.dataset.id).join())) === 'P01,P02,P03');
  const total = await p.locator('.fig-total').textContent(); check('contagem do álbum principal continua /125', /\/125/.test(total), total);
  // vencido
  await p.goto(`${url}/aluno.html?loja=on#/passe`); await sleep(900); await p.locator('.lj-teste summary').click(); await p.locator('button:has-text("vencer")').click(); await sleep(1000);
  check('vencido: aviso, progresso preservado e opção de renovar', (await p.locator('.lj-box[data-estado=vencido]').count()) === 1 && (await p.locator('.lj-box.warn').textContent()).includes('continuam guardados'));
  await p.locator('.lj-teste summary').click(); await p.locator('button:has-text("revogar")').click(); await sleep(1000);
  check('revogado: estado próprio', (await p.locator('.lj-box[data-estado=revogado]').count()) === 1);
  await p.goto(`${url}/aluno.html?loja=on#/passe/retorno`); await sleep(900);
  check('retorno do pagamento: só informa o andamento', (await p.locator('.lj-box[data-estado=retorno]').count()) === 1 && (await p.locator('.lj-box[data-estado=retorno]').textContent()).includes('não libera'));
  check('sem erros de JS', errs.length === 0, errs.join('|'));
}
// 5) layout: iPhone SE, desktop
for (const [w, h, n] of [[320, 640, 'se'], [1280, 900, 'desktop']]) {
  const { p } = await novo(w, h); await p.goto(`${url}/aluno.html?loja=on#/lojinha`); await sleep(1500);
  check(`${n}: sem rolagem horizontal`, (await overflow(p)) <= 0, String(await overflow(p)));
  if (n === 'desktop') check('desktop: grade de 4 colunas', await p.evaluate(() => getComputedStyle(document.querySelector('.lj-grid')).gridTemplateColumns.split(' ').length) === 4);
  await shot(p, `vitrine-${n}`);
}
// 6) movimento reduzido: sem animação
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  await p.goto(`${url}/aluno.html?loja=on#/lojinha/bateria-start-curso`); await sleep(1000);
  check('movimento reduzido: Paul sem animação', (await p.locator('.lj-paul-img.anim').count()) === 0 && (await p.evaluate(() => getComputedStyle(document.querySelector('.lj-paul-img')).animationName)) === 'none');
}
await browser.close(); srv.close(); done();
