// Jogo da memória em 2 celulares (sala por código). O Supabase é simulado na memória (as 4 funções sala_*).
// Cobre: mesma mesa nos dois, só a vez vira, par soma e joga de novo, erro passa a vez, fim e revanche, tema trancado, pausa.
import { serve, launch, context, sleep, check, done } from './harness.mjs';
const { srv, url } = await serve(); const { browser, ctx: ctxBase } = await launch({ codigo: false });
const salas = new Map();
const mock = async (route) => {
  const fn = new URL(route.request().url()).pathname.split('/').pop(); const b = route.request().postDataJSON();
  const ok = (j) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  if (fn === 'sala_criar') { const c = 'ME' + String(salas.size + 100); salas.set(c, { jogo: b.p_jogo, estado: b.p_estado, ver: 1, convidado: false }); return ok(c); }
  const s = salas.get(String(b.p_code || '').toUpperCase());
  if (fn === 'sala_entrar') { if (!s || s.jogo !== b.p_jogo) return ok([]); s.convidado = true; return ok([{ ver: s.ver, estado: s.estado }]); }
  if (fn === 'sala_ler') return ok(s ? [{ ver: s.ver, convidado: s.convidado, estado: s.ver === b.p_ver ? null : s.estado }] : []);
  if (fn === 'sala_enviar') { if (!s || s.ver !== b.p_ver) return ok(0); s.estado = b.p_estado; s.ver++; return ok(s.ver); }
  return route.continue();
};
const errs = [];
async function phone(codigo) {
  const ctx = codigo ? await context(browser) : ctxBase;
  await ctx.route('**/rest/v1/rpc/sala_*', mock);
  if (!codigo) await ctx.route('**/rest/v1/rpc/aluno_codigo_ok', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'false' }));
  const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.addInitScript(() => { try { localStorage.setItem('beaterista-aluno-nome', 'Teste'); localStorage.setItem('bt-mute', '1'); } catch { /* ok */ } });
  await p.goto(`${url}/aluno.html#/jogos/memart`); await p.waitForSelector('.mem-theme', { timeout: 15000 }); await sleep(500); return p;
}
const srcs = (p) => p.locator('.kx-mem img.mem-card-img').evaluateAll((es) => es.map((e) => e.getAttribute('src')));
const ups = (p) => p.locator('.kx-mem.up').count();
const vez = async (p) => (await p.locator('.ms-vez').innerText()).trim();
const placar = async (p) => (await p.locator('.ms-placar').innerText()).trim();
async function entrar(a, b, tema) {
  if (tema) { await a.locator(`.mem-theme:has-text("${tema}")`).click(); await sleep(300); }
  await a.locator('.mem-ic[aria-label^="sala"]').click(); await sleep(250);
  await b.locator('.mem-ic[aria-label^="sala"]').click(); await sleep(250);
  while ((await a.locator('.mem-step > span').textContent()) !== '6 pares') { await a.locator('.mem-step button[aria-label="menos pares"]').click(); await sleep(150); }
  await a.locator('button:has-text("criar sala")').click(); await sleep(500);
  const code = (await a.locator('.jg-code').textContent()).trim();
  await b.locator('.jg-code-in').fill(code); await sleep(2800); // o lobby entra sozinho com 5 caracteres
  return code;
}

{ // dois celulares, tema livre (The Beatles), 6 pares
  const a = await phone(true); const b = await phone(true);
  check('o ícone de sala (2 celulares) aparece nas opções, em chip pequeno', (await a.locator('.mem-ic[aria-label^="sala"]').count()) === 1);
  const code = await entrar(a, b);
  check('sala criada com código de 5 caracteres', code.length === 5, code);
  check('os dois veem a mesa de 12 cartas', (await a.locator('.kx-mem').count()) === 12 && (await b.locator('.kx-mem').count()) === 12);
  const sa = await srcs(a); const sb = await srcs(b);
  check('é a MESMA mesa nos dois celulares (mesma ordem das cartas)', JSON.stringify(sa) === JSON.stringify(sb) && new Set(sa).size === 6);
  check('quem criou começa: "sua vez" no A e "vez do outro" no B', (await vez(a)) === 'sua vez' && (await vez(b)) === 'vez do outro', `${await vez(a)} / ${await vez(b)}`);
  check('placar começa 0 × 0 e o badge de 2 celulares aparece', (await placar(a)) === 'você 0 × 0 o outro' && (await a.locator('.jg-link-badge').count()) === 1);
  // só a vez vira
  await b.locator('.kx-mem').nth(0).click(); await sleep(2200);
  check('quem não tem a vez não consegue virar carta (nem aqui nem lá)', (await ups(b)) === 0 && (await ups(a)) === 0);
  const idx = (s, src) => s.map((x, i) => (x === src ? i : -1)).filter((i) => i >= 0);
  const [p0, p1] = idx(sa, sa[0]); const certo = (s) => { const por = {}; s.forEach((x, i) => (por[x] ||= []).push(i)); return Object.values(por); };
  const pares = certo(sa);
  // A vira uma carta: o B vê quase em tempo real
  await a.locator('.kx-mem').nth(p0).click(); await sleep(2200);
  check('a carta virada por A aparece virada no B', (await ups(a)) === 1 && (await ups(b)) === 1 && (await b.locator('.kx-mem.up').first().getAttribute('aria-label')).length > 3);
  // A erra: vira uma carta de outro par; as duas ficam à vista nos dois, depois desviram e a vez passa
  const outro = pares.find((pr) => !pr.includes(p0))[0];
  await a.locator('.kx-mem').nth(outro).click(); await sleep(1500);
  check('erro: as duas cartas ficam à vista nos dois celulares', (await ups(a)) === 2 && (await ups(b)) === 2, `${await ups(a)}/${await ups(b)}`);
  await sleep(3200);
  check('erro: desviram nos dois e a vez passou pro B', (await ups(a)) === 0 && (await ups(b)) === 0 && (await vez(b)) === 'sua vez' && (await vez(a)) === 'vez do outro', `${await vez(a)} / ${await vez(b)}`);
  check('erro: ninguém pontuou', (await placar(b)) === 'você 0 × 0 o outro');
  await a.locator('.kx-mem').nth(p1).click(); await sleep(2000);
  check('agora quem não tem a vez (A) não vira mais nada', (await ups(a)) === 0 && (await ups(b)) === 0);
  // B acha um par: soma o ponto e joga de novo
  const [q0, q1] = pares.find((pr) => pr.includes(p0));
  await b.locator('.kx-mem').nth(q0).click(); await sleep(300); await b.locator('.kx-mem').nth(q1).click(); await sleep(3600);
  check('par: B soma 1 ponto (nos dois celulares)', (await placar(b)) === 'você 1 × 0 o outro' && (await placar(a)) === 'você 0 × 1 o outro', `${await placar(b)} / ${await placar(a)}`);
  check('par: as cartas ficam achadas nos dois e B joga de novo', (await b.locator('.kx-mem.ok').count()) === 2 && (await a.locator('.kx-mem.ok').count()) === 2 && (await vez(b)) === 'sua vez');
  // B acha o resto
  for (const pr of pares.filter((x) => !x.includes(p0))) { await b.locator('.kx-mem').nth(pr[0]).click(); await sleep(250); await b.locator('.kx-mem').nth(pr[1]).click(); await sleep(2800); }
  check('fim: B venceu 6 × 0 e A vê que o outro venceu', (await b.locator('.ms-vez').innerText()).includes('você venceu') && (await a.locator('.ms-vez').innerText()).includes('o outro venceu') && (await placar(b)) === 'você 6 × 0 o outro', `${await vez(b)} / ${await vez(a)}`);
  check('fim: os dois têm o botão revanche', (await a.locator('button:has-text("revanche")').count()) === 1 && (await b.locator('button:has-text("revanche")').count()) === 1);
  await a.locator('button:has-text("revanche")').click(); await sleep(2800);
  const sa2 = await srcs(a); const sb2 = await srcs(b);
  check('revanche: mesa nova, igual nos dois, placar zerado', JSON.stringify(sa2) === JSON.stringify(sb2) && JSON.stringify(sa2) !== JSON.stringify(sa) && (await placar(a)) === 'você 0 × 0 o outro' && (await a.locator('.kx-mem').count()) === 12);
  check('revanche: começa o outro (B)', (await vez(b)) === 'sua vez' && (await vez(a)) === 'vez do outro');
  // regra "acerta joga de novo": a partida usou a padrão (sim); estado da sala guarda a regra
  const estado = [...salas.values()][0].estado;
  check('o estado da sala tem tudo pra reconstruir a partida (tema, pares, regra, semente, baralho, vez)', estado.tema === 'beatles' && estado.pares === 6 && estado.again === true && Number.isInteger(estado.seed) && estado.deck.length === 12 && 'vez' in estado && 'virou' in estado && 'achou' in estado);
  // reconstruir só pelo estado: recarrega o B e entra de novo? (o app ainda não tem "voltar pra sala"): monta direto pelo módulo com o estado da sala
  const rec = await b.evaluate(async (est) => {
    const M = await import('/js/kids/memoria-sala.js'); const stage = document.createElement('div'); document.body.append(stage);
    const th = { id: est.tema, title: 'x', items: est.deck.map((id) => ({ id, name: id, img: 'assets/cards/b01.webp' })).filter((x, i, l) => l.findIndex((y) => y.id === x.id) === i) };
    let pushes = 0; const conn = { me: 1, on: {}, push: async () => { pushes++; return true; }, close() {} };
    const ctl = M.mostrarSala({ stage, themes: () => [th], locked: () => false, face: (it) => Object.assign(document.createElement('span'), { textContent: it.name }), bot: { set() {} }, back() {} }, conn, est);
    const r = { cartas: stage.querySelectorAll('.kx-mem').length, vez: stage.querySelector('.ms-vez').textContent };
    ctl.pause(); r.pausado = stage.querySelector('.ms-mesa').classList.contains('paused');
    stage.querySelector('.kx-mem').click(); r.pushPausado = pushes; // pausado: não vira
    ctl.resume(); r.retomou = !stage.querySelector('.ms-mesa').classList.contains('paused');
    stage.querySelector('.kx-mem').click(); r.pushDepois = pushes; ctl.destroy(); stage.remove(); return r;
  }, estado);
  check('reconstrói a mesa só pelo estado (12 cartas, minha vez)', rec.cartas === 12 && rec.vez === 'sua vez', JSON.stringify(rec));
  check('pausa local: bloqueia o toque e continuar volta', rec.pausado && rec.pushPausado === 0 && rec.retomou && rec.pushDepois === 1, JSON.stringify(rec));
}

{ // tema trancado: quem criou tem código e escolhe "Bandas"; o outro celular não tem código
  const a = await phone(true); const b = await phone(false);
  check('sem código o tema Bandas aparece trancado', (await b.locator('.mem-theme.locked:has-text("Bandas")').count()) === 1);
  await entrar(a, b, 'Bandas');
  check('com código: A joga a mesa de Bandas', (await a.locator('.kx-mem').count()) === 12 && (await a.locator('.ms-vez').count()) === 1);
  const msg = await b.locator('.ms-bloq').innerText().catch(() => '');
  check('sem código: B recebe um aviso claro e não vê as cartas', msg.includes('Bandas') && msg.includes('código') && (await b.locator('.kx-mem').count()) === 0, msg);
  check('o aviso tem como sair da sala', (await b.locator('button:has-text("sair da sala")').count()) === 1);
}
{ // atalho "tem um código de sala": abre direto na sala, sem escolher tema nem clicar no ícone
  const a = await phone(true); await a.locator('.mem-ic[aria-label^="sala"]').click(); await sleep(250); await a.locator('button:has-text("criar sala")').click(); await sleep(500);
  const code = (await a.locator('.jg-code').textContent()).trim();
  const ctx = await context(browser); await ctx.route('**/rest/v1/rpc/sala_*', mock);
  await ctx.addInitScript((c) => { try { sessionStorage.setItem('beaterista-sala-auto', JSON.stringify({ jogo: 'memoria', code: c, voltar: false, at: Date.now() })); localStorage.setItem('beaterista-aluno-nome', 'Teste'); } catch { /* ok */ } }, code);
  const b = await ctx.newPage(); b.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await b.goto(`${url}/aluno.html#/jogos/memart`); await sleep(4500); 
  check('atalho de código: a memória abre direto na sala e a mesa aparece nos dois', (await b.locator('.kx-mem').count()) === 16 && (await a.locator('.kx-mem').count()) === 16 && (await b.locator('.ms-vez').innerText()) === 'vez do outro');
}
check('sem erros de JS', errs.length === 0, errs.join('|'));
await browser.close(); srv.close(); process.exit(done() ? 1 : 0);
