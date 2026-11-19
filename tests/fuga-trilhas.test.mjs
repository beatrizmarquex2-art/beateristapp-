import test from 'node:test'; import assert from 'node:assert/strict';
import { MUNDOS, FASES, idFase, portasDaFase, faseCfg, cfgMini, TIPOS_FASE, NIVEL_CFG } from '../js/jogos/fuga-logic.js';
import { trilhaInfo, trilhaCfg, prefixo, estDaTrilha, paraTrilha, fasesFeitas, FASES_TRILHA, trilhaCompleta, trilhaLiberada, reiniciar, pagaPorPorta, estrelasDaTrilha, chavePorta, chaveTrilha, romano, concluirTrilha, filtraAssunto, semVistos, registraVistos } from '../js/jogos/fuga-trilhas-logic.js';
import { paresMemoria, rodadasQA, AREAS } from '../js/jogos/fuga-mini-logic.js';

const tudo = (n, v = 1) => Object.fromEntries(MUNDOS.flatMap((m) => Array.from({ length: FASES }, (_, i) => [`${prefixo(n)}${idFase(m.id, i + 1)}`, v])));

test('trilhas: 1 geral, 2 ritmo, 3 teoria, 4 cordas, 5+ infinita (sobe a cada volta, com teto)', () => {
  assert.deepEqual([1, 2, 3, 4].map((n) => trilhaInfo(n).id), ['geral', 'ritmo', 'teoria', 'cordas']);
  assert.deepEqual(trilhaInfo(2).assuntos, ['ritmo']); assert.equal(trilhaInfo(1).assuntos.length, 3);
  assert.equal(trilhaInfo(5).id, 'infinita'); assert.equal(trilhaInfo(5).volta, 1); assert.equal(trilhaInfo(5).extra, 1); assert.equal(trilhaInfo(9).extra, 3); assert.equal(trilhaInfo(40).extra, 3);
  assert.equal(trilhaInfo(7).nivelShift, 1); assert.equal(trilhaInfo(5).nivelShift, 0);
});

test('progresso por trilha: a trilha 1 usa as chaves de sempre (sem prefixo); as outras levam t<n>:', () => {
  const all = { 'estudio:1': 3, 'vulcao:2:1': 2, 't2:estudio:1': 1, 't3:estudio:5': 2 };
  assert.deepEqual(estDaTrilha(all, 1), { 'estudio:1': 3, 'vulcao:2:1': 2 });
  assert.deepEqual(estDaTrilha(all, 2), { 'estudio:1': 1 }); assert.deepEqual(estDaTrilha(all, 3), { 'estudio:5': 2 });
  assert.deepEqual(paraTrilha({ 'estudio:3': 1 }, 1), { 'estudio:3': 1 }); assert.deepEqual(paraTrilha({ 'estudio:3': 1 }, 4), { 't4:estudio:3': 1 });
});

test('desbloqueio: a trilha N+1 abre quando as 36 fases da N têm 1 ★ (a porta B não conta)', () => {
  assert.equal(FASES_TRILHA, 36); assert.equal(trilhaLiberada({}, 1), true); assert.equal(trilhaLiberada({}, 2), false);
  const quase = tudo(1); delete quase['espaco:12']; assert.equal(fasesFeitas(quase, 1), 35); assert.equal(trilhaCompleta(quase, 1), false); assert.equal(trilhaLiberada(quase, 2), false);
  const feita = tudo(1); assert.equal(trilhaCompleta(feita, 1), true); assert.equal(trilhaLiberada(feita, 2), true); assert.equal(trilhaLiberada(feita, 3), false);
  const duas = { ...tudo(1), ...tudo(2) }; assert.equal(trilhaLiberada(duas, 3), true); assert.equal(trilhaLiberada({ ...duas, ...tudo(3) }, 4), true);
  assert.equal(trilhaLiberada({ ...tudo(1), ...tudo(2), ...tudo(3), ...tudo(4) }, 5), true);
});

test('recomeçar: apaga só o progresso da trilha escolhida', () => {
  const all = { ...tudo(1), ...tudo(2), ...tudo(3) };
  const r2 = reiniciar(all, 2); assert.equal(fasesFeitas(r2, 2), 0); assert.equal(fasesFeitas(r2, 1), 36); assert.equal(fasesFeitas(r2, 3), 36);
  const r1 = reiniciar(all, 1); assert.equal(fasesFeitas(r1, 1), 0); assert.equal(fasesFeitas(r1, 2), 36);
});

test('estrelas: trilhas 1-3 pagam por porta; da 4 em diante a trilha inteira paga 1 ★ (uma vez)', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 8].map(pagaPorPorta), [true, true, true, false, false, false]);
  assert.deepEqual([1, 2, 3, 4, 5, 8].map(estrelasDaTrilha), [0, 0, 0, 1, 1, 1]);
  assert.equal(chavePorta(1, 'estudio', 3, 2), 'fuga|estudio|3|2'); assert.equal(chavePorta(1, 'vulcao', 'B'), 'fuga|vulcao|B');
  assert.equal(chavePorta(2, 'estudio', 3, 2), 'fuga|t2|estudio|3|2'); assert.equal(chaveTrilha(4), 'fuga|trilha|4');
  assert.notEqual(chavePorta(2, 'estudio', 1, 1), chavePorta(3, 'estudio', 1, 1));
});

test('títulos: Mestre das Portas sobe de nível a cada trilha concluída; as de assunto ganham o título do assunto; só uma vez', () => {
  assert.deepEqual([1, 4, 9, 14].map(romano), ['I', 'IV', 'IX', 'XIV']);
  let g = {}; let r = concluirTrilha(g, 1); assert.equal(r.nova, true); assert.deepEqual(r.novos.map((t) => t.nome), ['Mestre das Portas I']); g = r.g;
  r = concluirTrilha(g, 2); assert.deepEqual(r.novos.map((t) => t.nome), ['Mestre das Portas II', 'Mestre do Ritmo']); g = r.g;
  r = concluirTrilha(g, 3); assert.deepEqual(r.novos.map((t) => t.nome), ['Mestre das Portas III', 'Mestre da Teoria']); g = r.g;
  r = concluirTrilha(g, 4); assert.deepEqual(r.novos.map((t) => t.nome), ['Mestre das Portas IV', 'Mestre das Cordas']); g = r.g;
  r = concluirTrilha(g, 5); assert.deepEqual(r.novos.map((t) => t.nome), ['Mestre das Portas V']); g = r.g;
  const de = concluirTrilha(g, 5); assert.equal(de.nova, false); assert.equal(de.novos.length, 0); assert.equal(g.titulos.length, 8); assert.deepEqual(g.trilhasFeitas, [1, 2, 3, 4, 5]);
});

test('conteúdo por assunto: filtra as dicas, cai pro geral se sobrar pouco, nunca devolve vazio', () => {
  const it = (n, text) => ({ n, text, w: 'x', shown: 'x' });
  const banco = [...Array.from({ length: 12 }, (_, i) => it(i, `o bumbo e a caixa marcam o pulso ${i}`)), ...Array.from({ length: 12 }, (_, i) => it(100 + i, `a clave de sol e a escala maior ${i}`)), ...Array.from({ length: 11 }, (_, i) => it(200 + i, `o violão tem seis cordas ${i}`))];
  const r = filtraAssunto(banco, ['ritmo']); assert.equal(r.fallback, false); assert.ok(r.itens.length >= 12 && r.itens.every((x) => x.n < 100));
  assert.ok(filtraAssunto(banco, ['teoria']).itens.every((x) => x.n >= 100 && x.n < 200)); assert.ok(filtraAssunto(banco, ['cordas']).itens.every((x) => x.n >= 200));
  assert.equal(filtraAssunto(banco, ['ritmo', 'teoria', 'cordas']).itens.length, banco.length);
  const poucos = filtraAssunto([it(1, 'bumbo'), it(2, 'caixa'), it(3, 'qualquer coisa')], ['cordas']); assert.equal(poucos.fallback, true); assert.equal(poucos.itens.length, 3);
  assert.equal(filtraAssunto([], ['ritmo']).itens.length, 0);
});

test('dicas vistas: a trilha evita repetir; se sobrar pouco, vale tudo de novo; guarda no máximo 300', () => {
  const lista = Array.from({ length: 30 }, (_, i) => ({ n: i })); assert.equal(semVistos(lista, [0, 1, 2]).length, 27); assert.equal(semVistos(lista, lista.slice(0, 25).map((x) => x.n)).length, 30);
  let g = {}; g = registraVistos(g, 2, [1, 2, 3]); g = registraVistos(g, 2, [3, 4]); assert.deepEqual(g.vistos[2], [1, 2, 3, 4]); assert.equal(g.vistos[3], undefined);
  g = registraVistos(g, 2, Array.from({ length: 400 }, (_, i) => 1000 + i)); assert.equal(g.vistos[2].length, 300);
});

test('portasDaFase por trilha: trilha 1 igual a antes; ritmo usa bateria; teoria e cordas trocam os jogos de figuras; infinita sobe com teto', () => {
  const base = portasDaFase(0, 11).map((p) => p.tipo); assert.deepEqual(portasDaFase(0, 11, trilhaCfg(1)).map((p) => p.tipo), base);
  assert.deepEqual(portasDaFase(0, 11, trilhaCfg(1)).map((p) => p.nivel), portasDaFase(0, 11).map((p) => p.nivel));
  assert.ok(portasDaFase(0, 3, trilhaCfg(2)).every((p) => p.area === 'bateria')); assert.ok(portasDaFase(0, 3, trilhaCfg(3)).every((p) => p.area === 'notas'));
  for (const t of [3, 4]) for (let n = 1; n <= FASES; n++) { const tipos = portasDaFase(0, n, trilhaCfg(t)).map((p) => p.tipo); assert.ok(!tipos.some((x) => ['montar', 'queda', 'queda4'].includes(x)), `t${t} f${n}`); if (n >= 11) assert.equal(new Set(tipos).size, 4, `t${t} f${n} sem repetir jogo`); assert.equal(tipos.length, TIPOS_FASE[n - 1].length); }
  assert.deepEqual(portasDaFase(0, 12, trilhaCfg(3)).map((p) => p.tipo), ['memoria', 'caminho', 'genius', 'cruz']);
  assert.deepEqual(portasDaFase(0, 11, trilhaCfg(4)).map((p) => p.tipo), ['memoria', 'genius', 'caca', 'cruz']);
  assert.deepEqual(portasDaFase(0, 3, trilhaCfg(2)).map((p) => p.assuntos), [['ritmo'], ['ritmo'], ['ritmo']]);
  const a = faseCfg(0, 9, trilhaCfg(1)); const b = faseCfg(0, 9, trilhaCfg(7)); assert.ok(b.palavras >= a.palavras && b.palavras <= 9); assert.ok(b.cruz <= 7 && b.grade <= 12);
  assert.equal(faseCfg(2, 12, trilhaCfg(20)).nivel, 'dificil'); assert.equal(faseCfg(0, 1, trilhaCfg(7)).nivel, 'medio');
});

test('cfgMini: a infinita aumenta um pouco, sempre com teto; sem extra é o NIVEL_CFG de sempre', () => {
  for (const j of ['genius', 'caminho', 'memoria', 'compasso', 'intruso']) assert.deepEqual(cfgMini('medio', j, 0), NIVEL_CFG.medio[j]);
  const g = cfgMini('dificil', 'genius', 3); assert.ok(g.rodadas <= 10 && g.rodadas > NIVEL_CFG.dificil.genius.rodadas && g.ms >= 300);
  assert.ok(cfgMini('dificil', 'memoria', 3).pares <= 8); assert.ok(cfgMini('dificil', 'caminho', 3).len <= 8); const p = cfgMini('dificil', 'intruso', 3); assert.ok(p.rodadas <= 5);
});

test('mini jogos por assunto: memória e pergunta (pesca/mira) só da área da trilha; cordas tem pares suficientes', () => {
  for (const a of AREAS) { const ps = paresMemoria(6, Math.random, [a]); assert.ok(ps.length >= 6 && ps.every((p) => p.area === a), a); const rs = rodadasQA(6, 4, Math.random, [a]); assert.ok(rs.length >= 5 && rs.every((r) => r.area === a && r.opcoes.length === 4 && r.opcoes[r.ok] === r.certo), a); }
  assert.equal(new Set(paresMemoria(9).map((p) => p.area)).size, 3);
  assert.ok(paresMemoria(8, Math.random, ['cordas']).length === 8);
  assert.ok(paresMemoria(4, Math.random, ['inexistente']).length === 4);
});
