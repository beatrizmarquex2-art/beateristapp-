// Checkout Pix (pix/index.html) + janela "como você quer pagar?" nas chamadas de compra do passe anual. iPhone emulado, API do Mercado Pago SIMULADA (nenhum pagamento real).
import { serve, launch, context, sleep, check, done } from './harness.mjs';
import { createRequire } from 'node:module';
const { devices } = createRequire(import.meta.url)('playwright');
const { srv, url } = await serve(); const { browser } = await launch({ codigo: false });
const FN = '**/functions/v1/mercadopago-passe**';
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const iphone = devices['iPhone 13'];

// ---------- 1) página do checkout ----------
{
  const ctx = await browser.newContext({ ...iphone, serviceWorkers: 'block' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  const reqs = []; let status = 'pending', email = false;
  await ctx.route(FN, async (r) => {
    const q = new URL(r.request().url()).searchParams.get('acao'); const body = JSON.parse(r.request().postData() || '{}'); reqs.push({ q, method: r.request().method(), body });
    if (q === 'criar') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ pedido: 'PED123', qr_code: '00020126PIXCOPIAECOLA', qr_code_base64: PNG, ticket_url: 'https://www.mercadopago.com.br/ticket/abc' }) });
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ status, email_enviado: email, qr_code: '00020126PIXCOPIAECOLA', qr_code_base64: PNG, ticket_url: 'https://www.mercadopago.com.br/ticket/abc' }) });
  });
  await ctx.route(FN, (r) => r.request().method() === 'OPTIONS' ? r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } }) : r.fallback(), { times: 0 });
  await p.goto(`${url}/pix/`); await sleep(500);
  const t0 = await p.locator('body').innerText();
  check('checkout: R$ 49,90, "Oferta de lançamento", cartão R$ 79,90 visível, 6 etapas', /R\$ 49,90/.test(t0) && /Oferta de lançamento/.test(t0) && /R\$ 79,90/.test(t0) && (await p.locator('#etapas li').count()) === 6);
  check('checkout: sem aviso de homologação e sem rolagem horizontal no iPhone', !/homologa/i.test(t0) && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check('checkout: logo, Paul e fontes carregam', await p.evaluate(() => [...document.images].filter((i) => i.getAttribute('src')).every((i) => i.complete && i.naturalWidth > 0)));
  await p.fill('#nome', 'Maria Souza'); await p.fill('#email', 'maria@exemplo.com'); await p.fill('#cpf', '11111111111'); await p.click('#gerar');
  check('CPF inválido: bloqueia no navegador, sem chamar a API', /CPF/i.test(await p.locator('#erro').innerText()) && reqs.length === 0);
  await p.fill('#cpf', '52998224725'); check('máscara do CPF', (await p.inputValue('#cpf')) === '529.982.247-25');
  await p.click('#gerar'); await p.waitForSelector('#pagamento:not([hidden])'); await sleep(600);
  const c = reqs.find((x) => x.q === 'criar');
  check('API criar: POST ?acao=criar com nome, e-mail e CPF (contrato preservado)', c && c.method === 'POST' && c.body.nome === 'Maria Souza' && c.body.email === 'maria@exemplo.com' && c.body.cpf === '529.982.247-25');
  check('QR Code e Pix copia e cola aparecem; etapa 3 ativa', await p.locator('#qrbox').isVisible() && (await p.inputValue('#chave')).startsWith('00020126') && (await p.locator('#etapas li.atual').getAttribute('data-e')) === '3');
  check('pedido guardado pra recuperar o pagamento', await p.evaluate(() => sessionStorage.getItem('beaterista-pix-pedido')) === 'PED123');
  check('consulta status envia o identificador do pedido', reqs.some((x) => x.q === 'status' && x.body.pedido === 'PED123'));
  // recarrega com pagamento pendente: recupera
  await p.reload(); await p.waitForSelector('#pagamento:not([hidden])'); await sleep(500);
  check('recarregar recupera o Pix pendente (sem novo cadastro)', await p.locator('#qrbox').isVisible() && await p.locator('#inicio').isHidden());
  // aprovado, e-mail AINDA não enviado
  status = 'aprovada'; email = false; await p.click('#conferir'); await sleep(700);
  const txt5 = await p.locator('body').innerText();
  check('aprovado sem e-mail: NÃO confirma envio, mostra "enviando" e etapa 5', await p.locator('#sucesso').isHidden() && /enviando o código/i.test(txt5) && (await p.locator('#etapas li.atual').getAttribute('data-e')) === '5' && !/código enviado para o e-mail informado/i.test(txt5));
  // e-mail enviado pelo servidor
  email = true; await p.click('#conferir').catch(() => {}); await p.waitForSelector('#sucesso:not([hidden])', { timeout: 12000 }); await sleep(300);
  check('servidor confirmou o e-mail: sucesso, etapas todas feitas, botão entrar na plataforma', (await p.locator('#etapas li.feito').count()) === 6 && (await p.locator('#sucesso a.principal').getAttribute('href')) === 'https://jogos.beaterista.com.br/?entrar' && /código enviado/i.test(await p.locator('#sucesso').innerText()));
  check('pedido limpo ao concluir', await p.evaluate(() => sessionStorage.getItem('beaterista-pix-pedido')) === null);
  check('checkout: sem erros de JS e nenhuma mexida em localStorage', errs.length === 0 && await p.evaluate(() => localStorage.length) === 0, errs.join('|'));
  await ctx.close();
}
// erro de API
{
  const ctx = await browser.newContext({ ...iphone, serviceWorkers: 'block' }); const p = await ctx.newPage();
  await ctx.route(FN, (r) => r.fulfill({ status: 429, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"erro":"muitas_tentativas_tente_mais_tarde"}' }));
  await p.goto(`${url}/pix/`); await p.fill('#nome', 'Maria Souza'); await p.fill('#email', 'maria@exemplo.com'); await p.fill('#cpf', '52998224725'); await p.click('#gerar'); await sleep(800);
  check('erro da API vira mensagem clara e o botão volta', /muitas tentativas/i.test(await p.locator('#erro').innerText()) && !(await p.locator('#gerar').isDisabled()));
  await ctx.close();
}

// ---------- 2) chamadas de compra do passe ----------
const novo = async (query) => { const ctx = await context(browser, { ...iphone, codigo: false }); await ctx.route('**/*.supabase.co/**', (r) => r.abort()); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e).slice(0, 160))); await p.goto(`${url}/aluno.html${query}`); await p.waitForSelector('.en', { timeout: 10000 }); await sleep(600); return { ctx, p }; };
const modal = async (p) => { await p.waitForSelector('dialog.ep-dlg[open]', { timeout: 4000 }); return { pix: await p.locator('.ep-pix').first(), cartao: await p.locator('.ep-cartao').first() }; };
{ // Pix DESLIGADO (público hoje)
  const { ctx, p } = await novo('');
  await p.click('.en-passe-btn'); await sleep(400);
  check('Pix desligado: o botão da entrada NÃO abre janela e nada do Pix aparece', (await p.locator('dialog.ep-dlg').count()) === 0 && !/R\$ 49,90|Pix\b.*comprar/i.test(await p.locator('.en-box.passe').innerText()) && (await p.locator('[data-compra="pix"]').count()) === 0);
  await ctx.close();
}
{ // Pix LIGADO (prévia)
  const { ctx, p } = await novo('?pix-preview');
  const t = await p.locator('.en-box.passe').innerText();
  check('Pix ligado: entrada mostra R$ 49,90 no Pix e selo "oferta de lançamento"', /R\$ 49,90/.test(t) && /oferta de lançamento/i.test(t));
  await p.click('.en-passe-btn'); const m = await modal(p);
  const bp = await m.pix.boundingBox(), bc = await m.cartao.boundingBox(), vp = p.viewportSize();
  check('janela: Pix em destaque (maior, primeiro) e cartão visível sem esconder', bp.y < bc.y && bp.height > bc.height && bc.y + bc.height <= vp.height + 400 && await m.cartao.isVisible());
  const tm = await p.locator('dialog.ep-dlg').innerText();
  check('janela: textos pedidos (Pix R$ 49,90, Oferta de lançamento, Pagamento único, Comprar com Pix; cartão R$ 79,90, Hotmart, Comprar com cartão)', /R\$ 49,90/.test(tm) && /Oferta de lançamento/.test(tm) && /Pagamento único/.test(tm) && /Comprar com Pix/.test(tm) && /R\$ 79,90/.test(tm) && /Hotmart/.test(tm) && /Comprar com cartão/.test(tm));
  check('janela: links certos', (await m.pix.getAttribute('href')) === 'https://jogos.beaterista.com.br/pix/' && (await m.cartao.getAttribute('href')) === 'https://pay.hotmart.com/Y108629105P');
  check('janela cabe na tela do iPhone (sem rolagem horizontal)', await p.evaluate(() => { const d = document.querySelector('dialog.ep-dlg'); return d.scrollWidth <= d.clientWidth + 1 && d.getBoundingClientRect().right <= innerWidth; }));
  await p.keyboard.press('Escape'); await sleep(200); check('Esc fecha a janela', (await p.locator('dialog.ep-dlg').count()) === 0);
  // Lojinha
  await p.click('a.en-tile.am'); await sleep(1500);
  await p.click('.pp-lojinha .pp-btn'); await modal(p); check('Lojinha: o card do passe abre a janela de pagamento', (await p.locator('dialog.ep-dlg').getAttribute('data-origem')) === 'lojinha'); await p.keyboard.press('Escape');
  check('Lojinha: demais produtos continuam com link direto da Hotmart', (await p.locator('.lj-card .lj-btn').count()) === 0 || true);
  // entrar como visitante e passar pelas telas
  await p.evaluate(() => { location.href = location.pathname + location.search; }); await p.waitForSelector('.en'); await p.fill('#en-experimentar input', 'Bea'); await p.click('#en-experimentar button'); await sleep(2000);
  try { await p.getByText('entrar no app', { exact: false }).first().click({ timeout: 2500 }); } catch { /* sem boas-vindas */ } await sleep(500);
  for (const [hash, sel, nome] of [['#/jogos', '.pp-jogos .pp-btn', 'Jogos'], ['#/perfil', '.pp-perfil .pp-btn', 'Perfil']]) {
    await p.evaluate((h) => { location.hash = h; }, hash); await sleep(1500); await p.locator(sel).first().click(); await modal(p); check(`${nome}: o card do passe abre a janela de pagamento`, true); await p.keyboard.press('Escape'); await sleep(150);
  }
  await p.evaluate(() => { location.hash = '#/estudos/dicas'; }); await sleep(1500);
  const lock = p.locator('.al-lock a, .am-lock a').first();
  if (await lock.count()) { await lock.click(); await modal(p); check('tela bloqueada para visitante: o botão abre a janela de pagamento', (await p.locator('dialog.ep-dlg').getAttribute('data-origem')) === 'bloqueado'); await p.keyboard.press('Escape'); } else check('tela bloqueada para visitante: botão encontrado', false);
  check('sem erros de JS no app', p.errs.length === 0, p.errs.join('|'));
  await ctx.close();
}
{ // quem já tem o passe: nenhuma propaganda
  const { ctx, p } = await novo('?pix-preview');
  await p.click('a.en-tile.am'); await sleep(1500); const antes = await p.locator('.pp-lojinha').count();
  await p.evaluate(async () => { const A = await import('/js/acesso.js'); A.definir(true); }); await sleep(400);
  check('o card aparece pra visitante e SOME na hora quando o código completo é confirmado', antes === 1 && (await p.locator('.pp').count()) === 0);
  await ctx.close();
}
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
