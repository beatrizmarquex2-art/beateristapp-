// Figurinhas: catálogo íntegro (125 fotos, hashes, raridades da usuária) e lógica do álbum idempotente.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import crypto from 'node:crypto';
import * as L from '../js/figurinhas/album-logic.js';
const root = new URL('../', import.meta.url);
const cat = JSON.parse(fs.readFileSync(new URL('assets/figurinhas/catalogo.json', root), 'utf8'));
const count = (k) => cat.reduce((m, c) => ({ ...m, [c[k]]: (m[c[k]] || 0) + 1 }), {});

test('125 registros únicos, cada um com sua foto original intacta (SHA256)', () => {
  assert.equal(cat.length, 125); assert.equal(new Set(cat.map((c) => c.codigo)).size, 125); assert.equal(new Set(cat.map((c) => c.foto)).size, 125);
  for (const c of cat) { const b = fs.readFileSync(new URL(c.foto, root)); assert.equal(crypto.createHash('sha256').update(b).digest('hex'), c.sha256, c.codigo); assert.ok(c.artista_banda, c.codigo); }
});
test('distribuição de coleções e raridades fechadas', () => {
  assert.deepEqual(count('colecao'), { Geral: 91, Beatles: 22, Beaterista: 10, Especial: 2 });
  assert.deepEqual(count('raridade'), { Comum: 96, Rara: 19, Exclusiva: 10 });
  assert.equal(cat.find((c) => c.codigo === 'F102').artista_banda, 'Jimi Hendrix');
});
test('seções do álbum: Beatlemania 22, Beaterista 10, Bandas 47, Artistas 46 (cada figurinha em uma só)', () => {
  assert.deepEqual(count('secao'), { Beatlemania: 22, Beaterista: 10, Bandas: 47, Artistas: 46 });
  for (const c of cat) assert.ok(L.SECOES.includes(c.secao), c.codigo);
  assert.ok(cat.filter((c) => c.secao === 'Bandas').every((c) => c.raridade === 'Comum'), 'banda é sempre comum');
  assert.ok(cat.filter((c) => c.raridade === 'Rara' && c.colecao !== 'Beatles').every((c) => c.secao === 'Artistas'), 'fora dos Beatles, rara é sempre artista');
  assert.equal(cat.filter((c) => L.grupo(c) === 'Raras').length, 18); assert.equal(cat.filter((c) => L.grupo(c) === 'Comum').length, 75);
  assert.equal(L.SECAO_ANTIGA.Comum, 'Bandas'); assert.equal(L.SECAO_ANTIGA.Raras, 'Artistas');
  assert.equal(cat.find((c) => c.codigo === 'F087').secao, 'Beatlemania');
  assert.equal(L.SECAO_ANTIGA.Beatles, 'Beatlemania');
});
test('raridades conforme a decisão da usuária', () => {
  const ids = (r) => cat.filter((c) => c.raridade === r).map((c) => c.codigo).sort().join();
  assert.equal(ids('Exclusiva'), 'F001,F004,F005,F010,F011,F012,F015,F129,F131,F132');
  assert.equal(ids('Rara'), 'F016,F017,F018,F025,F044,F052,F086,F087,F089,F093,F094,F100,F102,F106,F107,F108,F112,F117,F124');
  for (const c of cat.filter((c) => c.colecao === 'Beaterista')) assert.equal(c.raridade, 'Exclusiva');
  for (const c of cat.filter((c) => /Justin/.test(c.artista_banda))) assert.equal(c.raridade, 'Rara', c.codigo);
  assert.equal(cat.find((c) => c.codigo === 'F053').raridade, 'Comum');
});
test('modelo combina com a raridade (C=Comum, R=Rara, E=Exclusiva)', () => {
  for (const c of cat) assert.equal({ C: 'Comum', R: 'Rara', E: 'Exclusiva' }[c.modelo[0]], c.raridade, c.codigo);
});
test('pacote: mesmo id = mesmas figurinhas, entrega e abertura só uma vez', () => {
  assert.deepEqual(L.drawPack(cat, 'daily:2026-11-05'), L.drawPack(cat, 'daily:2026-11-05'));
  let s = L.grantPack(L.emptyState(), 'daily:2026-11-05'); s = L.grantPack(s, 'daily:2026-11-05');
  assert.equal(L.pendingPacks(s).length, 1);
  const a = L.openPack(s, cat, 'daily:2026-11-05'); assert.equal(a.fresh, true); assert.equal(a.codes.length, L.PACK_SIZE);
  const b = L.openPack(a.state, cat, 'daily:2026-11-05'); assert.equal(b.fresh, false); assert.deepEqual(b.state, a.state);
  assert.equal(L.inHand(a.state), L.PACK_SIZE);
  assert.equal(L.pendingPacks(L.grantPack(a.state, 'daily:2026-11-05')).length, 0, 'pacote já aberto não volta');
});
test('colar: uma por espaço, repetida fica na mão', () => {
  let s = L.grantPack(L.emptyState(), 'p'); s = L.openPack(s, cat, 'p').state; const abertas = s.opened.p; // o sorteio agora é por aluno (seed): vale o que foi gravado
  const code = Object.keys(s.inv)[0];
  s = L.paste(s, code); assert.ok(s.pasted[code]); assert.equal(L.paste(s, code), s);
  s = L.pasteAll(s); assert.equal(Object.keys(s.pasted).length, new Set(abertas).size);
  assert.equal(L.stats(s, cat).got, Object.keys(s.pasted).length);
});
test('raridade das figurinhas sorteadas respeita o catálogo (não existem códigos inventados)', () => {
  const codes = new Set(cat.map((c) => c.codigo));
  for (let i = 0; i < 300; i++) for (const c of L.drawPack(cat, `t${i}`)) assert.ok(codes.has(c));
});

/* ---------- modelos novos (M1..M8): foto cabe inteira na janela ---------- */
import { MODELOS2 } from '../js/figurinhas/modelos2-data.js';
import { planoFoto, caixaRostos, fitLabel } from '../js/figurinhas/card2.js';
test('modelo novo combina com a raridade (M1-M4 Comum, M5-M6 Rara, M7-M8 Exclusiva)', () => {
  for (const c of cat) assert.equal(MODELOS2[c.modelo2].raridade, c.raridade, c.codigo);
  assert.equal(Object.keys(MODELOS2).length, 8);
  for (const id of Object.keys(MODELOS2)) assert.ok(fs.existsSync(new URL(`assets/figurinhas/modelos2/${id}.webp`, root)), id);
});
test('zoom: a foto mantém a proporção, preenche a janela quando dá e nunca corta rosto nem a área de ação', () => {
  const inPoly = (p, x, y) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  let cobre = 0;
  for (const c of cat) {
    assert.ok(Array.isArray(c.rostos) && c.foco?.length === 4, `${c.codigo} tem rostos/foco`);
    const p = planoFoto(c, c.modelo2), F = caixaRostos(c.rostos, c.foco);
    assert.ok(Math.abs(p.w / p.h - c.largura_px / c.altura_px) < 0.01, `${c.codigo} proporção preservada (sem esticar)`);
    for (const [u, v] of [[F.x0, F.y0], [F.x1, F.y0], [F.x1, F.y1], [F.x0, F.y1]]) assert.ok(inPoly(p.poly, p.x + u * p.w, p.y + v * p.h), `${c.codigo} rosto/ação inteiros na janela`);
    if (p.cobre) cobre++;
  }
  assert.ok(cobre > 15, `pelo menos parte das fotos preenche a janela (${cobre})`);
});
test('nome sempre cabe no rótulo, inclusive os longos (sem truncar)', () => {
  for (const c of cat) { const r = MODELOS2[c.modelo2].rotulo, f = fitLabel(c.artista_banda, r.largura * 0.97); assert.equal(f.lines.join(' ').replace(/\s+/g, ' '), c.artista_banda.toUpperCase().replace(/\s+/g, ' '), c.codigo); assert.ok(f.size >= 10); }
});

test('juntar progresso de dois aparelhos: união, sem perder nada, e a mão é recalculada', () => {
  let a = L.grantPack(L.emptyState(), 'p1'); a = L.openPack(a, cat, 'p1').state; a = L.pasteAll(a);
  let b = L.grantPack(L.emptyState(), 'p2'); b = L.openPack(b, cat, 'p2').state;
  const m = L.mergeStates(a, b);
  for (const c of Object.keys(a.pasted)) assert.ok(m.pasted[c]);
  assert.ok(m.opened.p1 && m.opened.p2);
  assert.deepEqual(L.mergeStates(m, a), m, 'juntar de novo é idempotente');
  assert.deepEqual(L.mergeStates(a, b), L.mergeStates(b, a), 'ordem não importa');
  const total = Object.values(m.inv).reduce((x, y) => x + y, 0) + Object.keys(m.pasted).length;
  assert.equal(total, 6, 'nenhuma figurinha some nem aparece do nada (2 pacotes x 3)');
});

test('juntar com a nuvem NÃO perde o check-in da semana, as lendárias nem a semente (era o que zerava o check-in todo dia)', () => {
  const local = { ...L.emptyState(), sem: { ult: '2026-11-19', seq: 3, ciclo: 0 }, lend: ['L1'], seed: 'bbb' };
  const nuvem = { ...L.emptyState(), sem: { ult: '2026-11-18', seq: 2, ciclo: 0 }, lend: ['L2'], seed: 'aaa' };
  const m = L.mergeStates(local, nuvem);
  assert.deepEqual(m.sem, { ult: '2026-11-19', seq: 3, ciclo: 0 }, 'vale o check-in mais adiantado');
  assert.deepEqual(m.lend, ['L1', 'L2'], 'lendárias: união');
  assert.equal(m.seed, 'aaa');
  assert.deepEqual(L.mergeStates(local, nuvem), L.mergeStates(nuvem, local), 'ordem não importa');
  assert.deepEqual(L.mergeStates(m, local), m, 'idempotente');
  // dia seguinte: o check-in continua de onde parou (dia 4), mesmo depois de juntar com a nuvem
  assert.equal(L.checkinSemana(L.mergeStates(local, nuvem).sem, '2026-11-20').sem.seq, 4);
  // um ciclo novo (7 dias completos) ganha de um velho
  assert.equal(L.mergeStates({ ...L.emptyState(), sem: { ult: '2026-11-01', seq: 6, ciclo: 0 } }, { ...L.emptyState(), sem: { ult: '2026-11-02', seq: 0, ciclo: 1 } }).sem.ciclo, 1);
});

test('pacote "estudo:": terminar um tema dos estudos dá 1 exclusiva (da Bea ou do Paul), de novo o mesmo id não entrega outro', () => {
  const paul = JSON.parse(fs.readFileSync(new URL('assets/figurinhas/catalogo-paul.json', root), 'utf8')); const todas = [...cat, ...paul];
  assert.equal(L.packSize('estudo:figuras'), 1);
  const cods = L.drawPack(todas, 'estudo:figuras', 1); assert.equal(cods.length, 1); assert.ok(todas.find((c) => c.codigo === cods[0]).secao === 'Beaterista', cods[0]);
  const tipos = new Set(); for (let i = 0; i < 60; i++) tipos.add(L.drawPack(todas, `estudo:t${i}`, 1)[0][0]); assert.ok(tipos.has('F') && tipos.has('P'), 'sai exclusiva da Bea (F) e do Paul (P)');
  assert.ok(L.motivoDoPacote('estudo:figuras').includes('tema'));
  let st = L.grantPack(L.emptyState(), 'estudo:figuras'); st = L.grantPack(st, 'estudo:figuras'); assert.equal(st.granted.filter((x) => x === 'estudo:figuras').length, 1);
});
