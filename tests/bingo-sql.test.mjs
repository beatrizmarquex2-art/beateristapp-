// Testa supabase/009_bingo_salas.sql num Postgres em WASM (PGlite), instalado FORA do repo:
//   mkdir -p /tmp/claude-0/pgtest && cd /tmp/claude-0/pgtest && npm i @electric-sql/pglite
// Sem o PGlite, os testes são pulados (não quebram `node --test tests/*.test.mjs`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SQL = readFileSync(fileURLToPath(new URL('../supabase/009_bingo_salas.sql', import.meta.url)), 'utf8');
const TEMAS = JSON.parse(readFileSync(fileURLToPath(new URL('../assets/bingo/temas.json', import.meta.url)), 'utf8'));
const ARTISTAS = JSON.parse(readFileSync(fileURLToPath(new URL('../assets/bingo/artistas.json', import.meta.url)), 'utf8'));

let PGlite = null;
for (const p of ['/tmp/claude-0/pgtest/node_modules/@electric-sql/pglite/dist/index.js', '@electric-sql/pglite']) {
  try { ({ PGlite } = await import(p)); break; } catch { /* tenta o próximo */ }
}
if (!PGlite) console.warn('AVISO: PGlite não instalado; testes de bingo-sql pulados (veja o topo do arquivo).');
const t = PGlite ? test : test.skip;

let db = null;
async function boot() {
  if (db) return db;
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;`);
  await db.exec(SQL);
  return db;
}
const q = async (sql, params) => (await (await boot()).query(sql, params)).rows;
const fn = async (nome, ...args) => {
  const ph = args.map((_, i) => `$${i + 1}`).join(',');
  const r = await q(`select * from public.${nome}(${ph})`, args);
  return r;
};
const json = async (nome, ...args) => (await fn(nome, ...args))[0][nome];
async function erro(promessa, trecho) {
  await assert.rejects(promessa, (e) => { if (trecho) assert.match(e.message, trecho); return true; });
}

async function sala(opts = {}) {
  const o = { tema: 'instrumentos', perfil: 'classico', vitoria: 'qualquer', modo: 'manual', intervalo: 10, auto: false, ...opts };
  const a = (await fn('bingo_criar', 'Ana', o.tema, o.perfil, o.vitoria, o.modo, o.intervalo, o.auto))[0];
  const b = (await fn('bingo_entrar', a.code.toLowerCase(), '  Beto ')) [0];
  return { code: a.code, A: a.token, B: b.token };
}
async function comecar(opts) {
  const s = await sala(opts);
  await fn('bingo_iniciar', s.code, s.A);
  return s;
}
const estado = (s, tk = s.A) => json('bingo_estado', s.code, tk, null);
const sortear = async (s, n = 1) => { let e; for (let i = 0; i < n; i++) { const cur = (await estado(s)).idx; e = await json('bingo_sortear', s.code, s.A, cur, false); } return e; };
const sala_row = async (s) => (await q('select * from public.bingo_salas where code=$1', [s.code]))[0];
// força seq/cartelas (ids do tema instrumentos) para montar cenários
const IDS = TEMAS.instrumentos.itens.map((i) => i.id); // 16
async function forcar(s, { seq, c0, c1 }) {
  await q('update public.bingo_salas set seq=$2, pool=$2, idx=0, resultado=null, status=\'jogando\' where code=$1', [s.code, seq]);
  await q('update public.bingo_jogadores set cartela=$3, marcas=array_fill(false, array[9]), completou_em=null where code=$1 and slot=$2', [s.code, 0, c0]);
  await q('update public.bingo_jogadores set cartela=$3, marcas=array_fill(false, array[9]), completou_em=null where code=$1 and slot=$2', [s.code, 1, c1]);
}
const ALFA = /^[A-HJKMNP-Z2-9]{6}$/;

t('temas populados exatamente como os JSONs e migração idempotente', async () => {
  await boot();
  for (const k of ['instrumentos', 'pecas', 'figuras', 'simbolos']) {
    const r = await q('select ids from public.bingo_temas where tema=$1', [k]);
    assert.deepEqual(r[0].ids, TEMAS[k].itens.map((i) => i.id));
  }
  const r = await q("select ids from public.bingo_temas where tema='artistas'");
  assert.deepEqual(r[0].ids, ARTISTAS.alvos.map((a) => a.id));
  assert.equal(r[0].ids.length, 86);
  await db.exec(SQL); // rodar de novo não quebra
  assert.equal((await q('select count(*)::int n from public.bingo_temas'))[0].n, 5);
});

t('anon não acessa tabelas, mas chama as funções', async () => {
  await boot();
  await db.exec('set role anon');
  try {
    await erro(db.query('select * from public.bingo_salas'), /permission denied/);
    await erro(db.query('select * from public.bingo_jogadores'), /permission denied/);
    await erro(db.query('select public._bingo_embaralhar(array[\'a\'])'), /permission denied/);
    const r = await db.query("select * from public.bingo_criar('X','instrumentos','kids','qualquer','manual',10,true)");
    assert.equal(r.rows.length, 1);
  } finally { await db.exec('reset role'); }
});

t('criação: código sem ambíguos, token forte, validações', async () => {
  const r = (await fn('bingo_criar', '  Ana  ', 'pecas', 'kids', 'horizontal', 'auto', 7, true))[0];
  assert.match(r.code, ALFA); assert.equal(r.slot, 0); assert.ok(r.token.length >= 32);
  const row = await sala_row({ code: r.code });
  assert.equal(row.status, 'lobby'); assert.equal(row.perfil, 'kids'); assert.equal(row.intervalo, 7); assert.equal(row.auto_marcar, true);
  assert.equal((await q('select nome from public.bingo_jogadores where code=$1', [r.code]))[0].nome, 'Ana');
  for (let i = 0; i < 30; i++) assert.match((await fn('bingo_criar', 'x', 'figuras', 'classico', 'qualquer', 'manual', 5, false))[0].code, ALFA);
  const ruins = [
    ['', 'pecas', 'kids', 'qualquer', 'manual', 10], ['a'.repeat(21), 'pecas', 'kids', 'qualquer', 'manual', 10], ['   ', 'pecas', 'kids', 'qualquer', 'manual', 10],
    ['A', 'nada', 'kids', 'qualquer', 'manual', 10], ['A', 'pecas', 'x', 'qualquer', 'manual', 10], ['A', 'pecas', 'kids', 'x', 'manual', 10],
    ['A', 'pecas', 'kids', 'qualquer', 'x', 10], ['A', 'pecas', 'kids', 'qualquer', 'manual', 4], ['A', 'pecas', 'kids', 'qualquer', 'manual', 61],
  ];
  for (const a of ruins) await erro(fn('bingo_criar', ...a, false), /inválid/);
});

t('entrada: case-insensitive, terceiro recusado, sala inexistente/fim recusada', async () => {
  const s = await sala();
  assert.equal((await estado(s, s.B)).eu.slot, 1);
  await erro(fn('bingo_entrar', s.code, 'Zé'), /cheia/);
  await erro(fn('bingo_entrar', 'AAAAAA', 'Zé'), /não encontrada/);
  await erro(fn('bingo_entrar', s.code, ''), /nome/);
  await fn('bingo_iniciar', s.code, s.A);
  await q("update public.bingo_salas set status='fim' where code=$1", [s.code]);
  await q('delete from public.bingo_jogadores where code=$1 and slot=1', [s.code]);
  await erro(fn('bingo_entrar', s.code, 'Zé'), /encerrada/);
});

t('token errado recusado em tudo', async () => {
  const s = await comecar();
  const ruim = 'x'.repeat(64);
  await erro(fn('bingo_estado', s.code, ruim, null), /token/);
  await erro(fn('bingo_estado', s.code, null, null), /token/);
  await erro(fn('bingo_sortear', s.code, ruim, 0, false), /token/);
  await erro(fn('bingo_marcar', s.code, ruim, 0, true), /token/);
  await erro(fn('bingo_bingo', s.code, ruim), /token/);
  await erro(fn('bingo_pausar', s.code, ruim, true), /token/);
  await erro(fn('bingo_sair', s.code, ruim), /token/);
  await erro(fn('bingo_iniciar', s.code, ruim), /token/);
  const outra = await sala();
  await erro(fn('bingo_estado', s.code, outra.A, null), /token/); // token de outra sala
});

t('início: só anfitrião, só com 2, só em lobby/fim', async () => {
  const a = (await fn('bingo_criar', 'Ana', 'instrumentos', 'classico', 'qualquer', 'manual', 10, false))[0];
  await erro(fn('bingo_iniciar', a.code, a.token), /2 jogadores/);
  const b = (await fn('bingo_entrar', a.code, 'Beto'))[0];
  await erro(fn('bingo_iniciar', a.code, b.token), /anfitrião/);
  await fn('bingo_iniciar', a.code, a.token);
  await erro(fn('bingo_iniciar', a.code, a.token), /já começou/);
  assert.equal((await sala_row(a)).status, 'jogando');
});

t('cartelas: 9 ids distintos do pool, diferentes entre si; pool 16 e 18', async () => {
  for (const tema of ['instrumentos', 'pecas', 'figuras', 'simbolos', 'artistas']) {
    for (let k = 0; k < 8; k++) {
      const s = await comecar({ tema });
      const row = await sala_row(s);
      const esperado = tema === 'artistas' ? 18 : 16;
      assert.equal(row.pool.length, esperado); assert.equal(new Set(row.pool).size, esperado);
      assert.equal(row.seq.length, esperado); assert.deepEqual([...row.seq].sort(), [...row.pool].sort());
      const base = tema === 'artistas' ? ARTISTAS.alvos.map((a) => a.id) : TEMAS[tema].itens.map((i) => i.id);
      for (const id of row.pool) assert.ok(base.includes(id));
      const js = await q('select slot, cartela from public.bingo_jogadores where code=$1 order by slot', [s.code]);
      for (const j of js) { assert.equal(j.cartela.length, 9); assert.equal(new Set(j.cartela).size, 9); for (const id of j.cartela) assert.ok(row.seq.includes(id)); }
      assert.notDeepEqual(js[0].cartela, js[1].cartela);
    }
  }
});

t('sorteio percorre o pool inteiro sem repetir; seq não vaza', async () => {
  const s = await comecar();
  const row = await sala_row(s);
  let e = await estado(s);
  assert.deepEqual(e.sorteados, []); assert.equal(e.total, 16); assert.equal(e.idx, 0);
  assert.ok(!('seq' in e)); assert.deepEqual(e.pool.sort(), [...row.pool].sort());
  for (let i = 1; i <= 16; i++) {
    e = await json('bingo_sortear', s.code, s.A, i - 1, false);
    assert.equal(e.idx, i); assert.equal(e.sorteados.length, i);
    assert.deepEqual(e.sorteados, row.seq.slice(0, i));
    const txt = JSON.stringify(e);
    for (const id of row.seq.slice(i)) assert.ok(!txt.includes(`"${id}"`) || e.pool.includes(id) || e.eu.cartela.includes(id), 'vazou?');
    assert.ok(!('seq' in e));
  }
  assert.equal(new Set(e.sorteados).size, 16);
  const depois = await json('bingo_sortear', s.code, s.A, 16, false); // idx = total: não faz nada
  assert.equal(depois.idx, 16); assert.equal(depois.status, 'jogando');
  assert.equal((await q('select count(*)::int n from public.bingo_salas where code=$1', [s.code]))[0].n, 1);
});

t('estado: sem cartela do outro; null com mesma ver; ping atualiza', async () => {
  const s = await comecar();
  const e = await estado(s, s.B);
  assert.equal(e.host, false); assert.equal(e.eu.slot, 1); assert.equal(e.eu.nome, 'Beto'); assert.equal(e.outro.nome, 'Ana'); assert.equal(e.outro.presente, true);
  assert.ok(!('cartelas' in e));
  const dA = (await q('select cartela from public.bingo_jogadores where code=$1 and slot=0', [s.code]))[0].cartela;
  assert.notDeepEqual(e.eu.cartela, dA);
  assert.equal(await json('bingo_estado', s.code, s.B, e.ver), null);
  await q("update public.bingo_jogadores set ping = now() - interval '1 minute' where code=$1 and slot=1", [s.code]);
  await json('bingo_estado', s.code, s.B, e.ver);
  const p = (await q('select ping > now() - interval \'5 seconds\' ok from public.bingo_jogadores where code=$1 and slot=1', [s.code]))[0];
  assert.equal(p.ok, true);
});

t('presença do outro: mudança vira nova ver', async () => {
  const s = await comecar();
  const e = await estado(s);
  await q("update public.bingo_jogadores set ping = now() - interval '1 minute' where code=$1 and slot=1", [s.code]);
  const e2 = await json('bingo_estado', s.code, s.A, e.ver);
  assert.equal(e2.outro.presente, false); assert.ok(e2.ver > e.ver);
  await json('bingo_estado', s.code, s.B, null); // B volta
  const e3 = await json('bingo_estado', s.code, s.A, e2.ver);
  assert.equal(e3.outro.presente, true);
});

t('sortear: só anfitrião, idempotente por p_idx, pausa, auto com outro ausente', async () => {
  const s = await comecar();
  await erro(fn('bingo_sortear', s.code, s.B, 0, false), /anfitrião/);
  const e1 = await json('bingo_sortear', s.code, s.A, 0, false);
  const e1b = await json('bingo_sortear', s.code, s.A, 0, false); // toque duplo
  assert.equal(e1.idx, 1); assert.equal(e1b.idx, 1); assert.deepEqual(e1b.sorteados, e1.sorteados);
  assert.equal((await json('bingo_sortear', s.code, s.A, 5, false)).idx, 1); // idx errado
  await fn('bingo_pausar', s.code, s.A, true);
  await erro(fn('bingo_pausar', s.code, s.B, false), /anfitrião/);
  assert.equal((await estado(s)).pausado, true);
  assert.equal((await json('bingo_sortear', s.code, s.A, 1, false)).idx, 1); // pausado
  await fn('bingo_pausar', s.code, s.A, false);
  assert.equal((await json('bingo_sortear', s.code, s.A, 1, true)).idx, 2); // auto, outro presente
  await q("update public.bingo_jogadores set ping = now() - interval '1 minute' where code=$1 and slot=1", [s.code]);
  assert.equal((await json('bingo_sortear', s.code, s.A, 2, true)).idx, 2); // auto, outro ausente
  assert.equal((await json('bingo_sortear', s.code, s.A, 2, false)).idx, 3); // manual ainda pode
  const l = await comecar();
  await erro(fn('bingo_sortear', (await sala()).code, 'x', 0, false), /token/);
  const lob = await sala();
  await erro(fn('bingo_sortear', lob.code, lob.A, 0, false), /não começou/);
  assert.ok(l);
});

t('marcar: só id sorteado, desmarcar sempre, idempotente, casa inválida', async () => {
  const s = await comecar();
  const e0 = await estado(s);
  await erro(fn('bingo_marcar', s.code, s.A, 0, true), /não saiu/);
  await erro(fn('bingo_marcar', s.code, s.A, 9, true), /inválida/);
  await erro(fn('bingo_marcar', s.code, s.A, -1, true), /inválida/);
  const row = await sala_row(s);
  const id = e0.eu.cartela[4];
  await q('update public.bingo_salas set seq = array[$2]::text[] || array_remove(seq, $2) where code=$1', [s.code, id]);
  await sortear(s);
  await fn('bingo_marcar', s.code, s.A, 4, true); await fn('bingo_marcar', s.code, s.A, 4, true);
  assert.equal((await estado(s)).eu.marcas[4], true);
  assert.equal((await estado(s, s.B)).eu.marcas[4], false); // marca é de cada um
  await fn('bingo_marcar', s.code, s.A, 4, false);
  assert.equal((await estado(s)).eu.marcas[4], false);
  await fn('bingo_marcar', s.code, s.A, 4, false);
  assert.ok(row);
});

t('auto_marcar marca nas duas cartelas', async () => {
  const s = await comecar({ auto: true });
  const e = await sortear(s);
  const id = e.sorteados[0];
  for (const tk of [s.A, s.B]) {
    const x = await estado(s, tk);
    x.eu.cartela.forEach((c, i) => assert.equal(x.eu.marcas[i], c === id));
  }
});

// ---- bingo ----
const SEQ = IDS.slice(); // ordem controlada
const C0 = IDS.slice(0, 9);          // casas 0..8 = ids 0..8 -> linha {0,1,2} sai com 3 sorteios
const C1 = [9, 10, 11, 12, 13, 14, 15, 0, 1].map((i) => IDS[i]); // outro conjunto

t('bingo inválido não ganha: sem marcar, não sorteado, vitória errada', async () => {
  const s = await comecar();
  await forcar(s, { seq: SEQ, c0: C0, c1: C1 });
  await q('update public.bingo_salas set idx=0 where code=$1', [s.code]);
  await sortear(s, 3); // sorteia ids 0,1,2 -> linha 0 da cartela do A toda sorteada
  let e = await json('bingo_bingo', s.code, s.A); // sem marcar
  assert.equal(e.erro, 'invalido'); assert.equal(e.status, 'jogando'); assert.equal(e.resultado, null);
  const ver = e.ver;
  await erro(fn('bingo_marcar', s.code, s.A, 3, true), /não saiu/); // casa 3 não saiu
  await fn('bingo_marcar', s.code, s.A, 0, true); await fn('bingo_marcar', s.code, s.A, 1, true);
  e = await json('bingo_bingo', s.code, s.A); // falta uma marca
  assert.equal(e.erro, 'invalido');
  assert.equal(e.ver > ver, true); // só as marcas mudaram a ver, não o bingo
  assert.equal((await sala_row(s)).status, 'jogando');
  e = await json('bingo_bingo', s.code, s.B); assert.equal(e.erro, 'invalido'); // B nem tem linha
  await fn('bingo_marcar', s.code, s.A, 2, true);
  e = await json('bingo_bingo', s.code, s.A);
  assert.equal(e.status, 'fim'); assert.equal(e.resultado.tipo, 'vitoria'); assert.deepEqual(e.resultado.vencedores, [0]); assert.deepEqual(e.resultado.linhas['0'], [0, 1, 2]);
  assert.equal(e.erro, undefined);
});

t('vitória por horizontal, vertical e diagonal; condições restritas', async () => {
  // cartela do A: casas 0..8 = ids 0..8
  const casos = [
    { vit: 'horizontal', sortear: [3, 4, 5], marcas: [3, 4, 5], ok: true, linha: [3, 4, 5] },
    { vit: 'vertical', sortear: [1, 4, 7], marcas: [1, 4, 7], ok: true, linha: [1, 4, 7] },
    { vit: 'diagonal', sortear: [2, 4, 6], marcas: [2, 4, 6], ok: true, linha: [2, 4, 6] },
    { vit: 'diagonal', sortear: [0, 1, 2], marcas: [0, 1, 2], ok: false },   // horizontal não vale
    { vit: 'horizontal', sortear: [0, 3, 6], marcas: [0, 3, 6], ok: false }, // vertical não vale
    { vit: 'vertical', sortear: [0, 4, 8], marcas: [0, 4, 8], ok: false },   // diagonal não vale
    { vit: 'qualquer', sortear: [0, 4, 8], marcas: [0, 4, 8], ok: true, linha: [0, 4, 8] },
    { vit: 'qualquer', sortear: [6, 7, 8], marcas: [6, 7, 8], ok: true, linha: [6, 7, 8] },
  ];
  for (const c of casos) {
    const s = await comecar({ vitoria: c.vit });
    const resto = IDS.filter((_, i) => !c.sortear.includes(i));
    await forcar(s, { seq: [...c.sortear.map((i) => IDS[i]), ...resto], c0: C0, c1: C1 });
    await sortear(s, 3);
    for (const m of c.marcas) await fn('bingo_marcar', s.code, s.A, m, true);
    const e = await json('bingo_bingo', s.code, s.A);
    if (c.ok) { assert.equal(e.status, 'fim', c.vit); assert.deepEqual(e.resultado.linhas['0'], c.linha); }
    else { assert.equal(e.erro, 'invalido', c.vit); assert.equal(e.status, 'jogando'); }
  }
});

t('auto_marcar (kids): bingo valido sem marcar nada', async () => {
  const s = await comecar({ auto: true, perfil: 'kids' });
  await forcar(s, { seq: SEQ, c0: C0, c1: C1 });
  await sortear(s, 3);
  const e = await json('bingo_bingo', s.code, s.A);
  assert.equal(e.status, 'fim'); assert.deepEqual(e.resultado.vencedores, [0]);
});

t('EMPATE: mesmo sorteio completa a linha dos dois', async () => {
  const s = await comecar({ auto: true });
  // A: casas 0,1,2 = ids 0,1,2 ; B: casas 0,1,2 = ids 2,1,0 em outras posições -> mesma linha completa no sorteio 3
  const cA = [IDS[0], IDS[1], IDS[2], IDS[3], IDS[4], IDS[5], IDS[6], IDS[7], IDS[8]];
  const cB = [IDS[8], IDS[9], IDS[10], IDS[0], IDS[1], IDS[2], IDS[11], IDS[12], IDS[13]]; // linha {3,4,5}
  await forcar(s, { seq: SEQ, c0: cA, c1: cB });
  await sortear(s, 3);
  assert.equal((await q('select completou_em from public.bingo_jogadores where code=$1 order by slot', [s.code])).map((r) => r.completou_em).join(), '3,3');
  const e = await json('bingo_bingo', s.code, s.B); // B pede e A nem apertou nada
  assert.equal(e.status, 'fim'); assert.equal(e.resultado.tipo, 'empate'); assert.deepEqual(e.resultado.vencedores.sort(), [0, 1]);
  assert.deepEqual(e.resultado.linhas['0'], [0, 1, 2]); assert.deepEqual(e.resultado.linhas['1'], [3, 4, 5]);
});

t('pedido tardio vs primeiro pedido; o outro completou antes mas não pediu', async () => {
  const s = await comecar({ auto: true });
  const cA = IDS.slice(0, 9);
  const cB = [IDS[9], IDS[10], IDS[11], IDS[12], IDS[13], IDS[14], IDS[3], IDS[4], IDS[5]]; // linha {6,7,8} = ids 3,4,5
  await forcar(s, { seq: SEQ, c0: cA, c1: cB });
  await sortear(s, 3); // A completa {0,1,2} em 3
  await sortear(s, 3); // B completa {6,7,8} em 6; A segue válida
  const ccc = (await q('select completou_em from public.bingo_jogadores where code=$1 order by slot', [s.code])).map((r) => r.completou_em);
  assert.deepEqual(ccc, [3, 6]);
  const e = await json('bingo_bingo', s.code, s.B); // B pede primeiro, mas A completou antes (3) e B em 6
  // regra: primeiro BINGO confirmado vence; completou_em diferentes -> só o pedinte vence
  assert.equal(e.resultado.tipo, 'vitoria'); assert.deepEqual(e.resultado.vencedores, [1]);
  const tardio = await json('bingo_bingo', s.code, s.A); // pedido tardio: idempotente
  assert.equal(tardio.status, 'fim'); assert.deepEqual(tardio.resultado.vencedores, [1]); assert.equal(tardio.erro, undefined);
  assert.deepEqual(await json('bingo_bingo', s.code, s.B), e);
  assert.equal(e.ver, tardio.ver);
});

t('bingo simultâneo: duas chamadas ao mesmo tempo dão um resultado só', async () => {
  const s = await comecar({ auto: true });
  await forcar(s, { seq: SEQ, c0: IDS.slice(0, 9), c1: [IDS[2], IDS[1], IDS[0], ...IDS.slice(9, 15)] });
  await sortear(s, 3);
  const [x, y] = await Promise.all([json('bingo_bingo', s.code, s.A), json('bingo_bingo', s.code, s.B)]);
  assert.equal(x.status, 'fim'); assert.deepEqual(x.resultado, y.resultado);
  assert.equal(x.resultado.tipo, 'empate');
});

t('fim revela as duas cartelas; antes não; bingo não vira após fim; ações ignoradas', async () => {
  const s = await comecar({ auto: true });
  await forcar(s, { seq: SEQ, c0: C0, c1: C1 });
  await sortear(s, 3);
  const e = await json('bingo_bingo', s.code, s.A);
  assert.equal(e.cartelas.length, 2); assert.deepEqual(e.cartelas[0], C0); assert.deepEqual(e.cartelas[1], C1);
  assert.equal(e.marcas.length, 2);
  const eb = await estado(s, s.B); assert.equal(eb.cartelas[0].length, 9);
  await fn('bingo_marcar', s.code, s.B, 0, false); // ignorado após fim
  assert.equal((await json('bingo_sortear', s.code, s.A, 3, false)).idx, 3);
});

t('reconexão: mesmo token restaura estado completo', async () => {
  const s = await comecar({ auto: true });
  await sortear(s, 4);
  const antes = await estado(s, s.B);
  const depois = await estado(s, s.B); // "recarregou a página"
  assert.deepEqual(depois, antes);
  assert.equal(depois.sorteados.length, 4); assert.equal(depois.eu.cartela.length, 9); assert.equal(depois.config.tema, 'instrumentos');
  assert.equal(depois.eu.marcas.filter(Boolean).length, depois.eu.cartela.filter((c) => depois.sorteados.includes(c)).length);
});

t('revanche: iniciar em fim gera tudo novo', async () => {
  const s = await comecar({ auto: true });
  await forcar(s, { seq: SEQ, c0: C0, c1: C1 });
  await sortear(s, 3);
  await json('bingo_bingo', s.code, s.A);
  await erro(fn('bingo_iniciar', s.code, s.B), /anfitrião/);
  await fn('bingo_iniciar', s.code, s.A);
  const e = await estado(s);
  assert.equal(e.status, 'jogando'); assert.equal(e.idx, 0); assert.deepEqual(e.sorteados, []); assert.equal(e.resultado, null);
  assert.deepEqual(e.eu.marcas, Array(9).fill(false)); assert.equal(e.pausado, false);
  assert.equal(e.cartelas, undefined);
  const js = await q('select completou_em from public.bingo_jogadores where code=$1', [s.code]);
  assert.ok(js.every((j) => j.completou_em === null));
});

t('sair: anfitrião apaga a sala; convidado libera o slot e volta ao lobby', async () => {
  const s = await comecar();
  await sortear(s, 2);
  await fn('bingo_sair', s.code, s.B);
  let e = await estado(s);
  assert.equal(e.status, 'lobby'); assert.equal(e.outro, null); assert.equal(e.idx, 0); assert.deepEqual(e.pool, []); assert.equal(e.eu.cartela, null);
  await erro(fn('bingo_estado', s.code, s.B, null), /token/);
  const n = (await fn('bingo_entrar', s.code, 'Novo'))[0]; assert.equal(n.slot, 1);
  await fn('bingo_iniciar', s.code, s.A);
  await fn('bingo_sair', s.code, s.A);
  assert.equal((await q('select count(*)::int n from public.bingo_salas where code=$1', [s.code]))[0].n, 0);
  assert.equal((await q('select count(*)::int n from public.bingo_jogadores where code=$1', [s.code]))[0].n, 0);
  await erro(fn('bingo_estado', s.code, n.token, null), /token/);
});

t('limpeza: criar apaga salas com mais de 1 dia', async () => {
  const velha = await sala();
  const nova = await sala();
  await q("update public.bingo_salas set updated_at = now() - interval '2 days' where code=$1", [velha.code]);
  await fn('bingo_criar', 'X', 'pecas', 'kids', 'qualquer', 'manual', 10, false);
  assert.equal((await q('select count(*)::int n from public.bingo_salas where code=$1', [velha.code]))[0].n, 0);
  assert.equal((await q('select count(*)::int n from public.bingo_salas where code=$1', [nova.code]))[0].n, 1);
  assert.equal((await q('select count(*)::int n from public.bingo_jogadores where code=$1', [velha.code]))[0].n, 0);
});

t('sorteio é embaralhamento sem viés grosseiro (primeiro item varia)', async () => {
  const vistos = new Set();
  for (let i = 0; i < 40; i++) vistos.add((await q("select (public._bingo_embaralhar(array['a','b','c','d']))[1] x"))[0].x);
  assert.equal(vistos.size, 4);
});
