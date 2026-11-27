import test from 'node:test'; import assert from 'node:assert/strict';
import * as R from '../js/pro/ritmo.js'; import * as E from '../js/pro/escrita.js';
const V = R.cordasDe('violao', 6); const B4 = R.cordasDe('baixo', 4);
const acorde = [{ c: 0, f: 3, ini: 0, d: 4 }, { c: 1, f: 0, ini: 0, d: 4 }, { c: 2, f: 0, ini: 0, d: 4 }, { c: 3, f: 0, ini: 0, d: 4 }, { c: 4, f: 2, ini: 0, d: 4 }, { c: 5, f: 3, ini: 0, d: 4 }]; // G aberto
test('escrito: uma oitava acima do que soa; clave: sol (violão/guitarra) e fá (baixo)', () => { assert.equal(E.escrito(40), 52); assert.equal(E.claveDe('violao'), 'sol'); assert.equal(E.claveDe('guitarra'), 'sol'); assert.equal(E.claveDe('baixo'), 'fa'); });
test('contagem: 1 e & a 2 …', () => assert.deepEqual([0, 1, 2, 3, 4, 6].map(E.contagem), ['1', 'e', '&', 'a', '2', '&']));
test('pauta comum: acorde de 6 notas vira 6 cabeças selecionáveis e uma haste só', () => {
  const r = E.cordas(acorde, { cordas: V, inst: 'violao', escrita: 'pauta', largura: 420 });
  assert.equal((r.svg.match(/data-ev=/g) || []).length, 6); assert.ok(!/>T</.test(r.svg)); assert.ok(r.n >= 1 && r.h > 80);
});
test('pauta + tablatura: as duas aparecem (T A B e a clave) e a altura é maior que só a pauta', () => {
  const a = E.cordas(acorde, { cordas: V, inst: 'violao', escrita: 'ambas', largura: 420 }); const p = E.cordas(acorde, { cordas: V, inst: 'violao', escrita: 'pauta', largura: 420 });
  assert.match(a.svg, />T</); assert.match(a.svg, />A</); assert.match(a.svg, />B</); assert.ok(a.h > p.h); assert.equal((a.svg.match(/data-ev=/g) || []).length, 12);
});
test('escrita "tab" é a tablatura de sempre', () => assert.equal(E.cordas(acorde, { cordas: V, escrita: 'tab', largura: 420 }).svg, R.tablatura(acorde, { cordas: V, largura: 420 }).svg));
test('baixo na clave de fá desenha e marca as notas', () => { const r = E.cordas([{ c: 3, f: 0, ini: 0, d: 4 }, { c: 2, f: 2, ini: 4, d: 4 }], { cordas: B4, inst: 'baixo', escrita: 'pauta', largura: 380 }); assert.equal((r.svg.match(/data-ev=/g) || []).length, 2); });
test('sustenido aparece quando a nota é preta (casa 1 da corda Si = Dó, sem; casa 2 = Dó♯)', () => {
  const sem = E.cordas([{ c: 1, f: 1, ini: 0, d: 4 }], { cordas: V, escrita: 'pauta', largura: 380 }); const com = E.cordas([{ c: 1, f: 2, ini: 0, d: 4 }], { cordas: V, escrita: 'pauta', largura: 380 });
  assert.ok(com.svg.includes('M-2 -7V7') && !sem.svg.includes('M-2 -7V7'));
});
test('segunda no acorde desloca a cabeça (notas vizinhas não se sobrepõem)', () => {
  const r = E.cordas([{ c: 0, f: 0, ini: 0, d: 4 }, { c: 0, f: 1, ini: 0, d: 4, }].map((e, i) => (i ? { ...e, c: 1, f: 6 } : e)), { cordas: V, escrita: 'pauta', largura: 380 }); // e solta (Mi4) e Si com casa 6 (Fá4): vizinhas
  const xs = [...r.svg.matchAll(/<ellipse cx="([\d.]+)"/g)].map((m) => +m[1]); assert.equal(xs.length, 2); assert.ok(Math.abs(xs[0] - xs[1]) > 9);
});
test('ritmo sem pauta: uma linha, contagem "&", acento e fantasma, e a coluna vira um item', () => {
  const evs = [{ p: 'hh', ini: 0, d: 2, mao: 'D' }, { p: 'bd', ini: 0, d: 2 }, { p: 'sn', ini: 2, d: 2, acc: true, mao: 'E' }, { p: 'sn', ini: 4, d: 2, fan: true }];
  const r = E.ritmo(evs, { largura: 420 }); assert.match(r.svg, />&</); assert.match(r.svg, />DB</); assert.match(r.svg, /\(</); assert.equal((r.svg.match(/data-ev=/g) || []).length, 3);
  assert.ok(!E.ritmo(evs, { largura: 420, mostrarContagem: false }).svg.includes('>&<'));
});
test('ritmo: clicar de novo na mesma coluna passa pro próximo evento dela', () => { const evs = [{ p: 'hh', ini: 0, d: 2 }, { p: 'bd', ini: 0, d: 2 }]; assert.match(E.ritmo(evs, { largura: 380, sel: 0 }).svg, /data-ev="1"/); });
test('ritmo vazio desenha a linha e a fórmula de compasso', () => { const r = E.ritmo([], { largura: 380 }); assert.equal(r.n, 1); assert.ok(r.svg.includes('<line')); });
test('cifra do acorde aparece em cima da tablatura e da pauta', () => {
  const ev = [{ c: 0, f: 0, ini: 0, d: 4, cif: 'Mim' }, { c: 1, f: 0, ini: 0, d: 4 }];
  assert.match(R.tablatura(ev, { cordas: V, largura: 380 }).svg, />Mim</); assert.match(E.cordas(ev, { cordas: V, escrita: 'pauta', largura: 380 }).svg, />Mim</);
});
test('seta de direção (↓/↑) aparece em cima do acorde; abafada vira × na tablatura e na pauta', () => {
  const b = [{ c: 0, f: 0, ini: 0, d: 4, dir: 'b' }, { c: 1, f: 1, ini: 0, d: 4, dir: 'b' }]; const c = b.map((e) => ({ ...e, dir: 'c' }));
  const sb = R.tablatura(b, { cordas: V, largura: 380 }).svg; const sc = R.tablatura(c, { cordas: V, largura: 380 }).svg; assert.ok(sb.includes('seta-r') && sc.includes('seta-r') && sb !== sc);
  assert.ok(!R.tablatura([{ c: 0, f: 0, ini: 0, d: 4 }], { cordas: V, largura: 380 }).svg.includes('seta-r'));
  const mudo = [{ c: 0, f: 2, ini: 0, d: 4, mudo: true }]; assert.match(R.tablatura(mudo, { cordas: V, largura: 380 }).svg, />×</); assert.ok(E.cordas(mudo, { cordas: V, escrita: 'pauta', largura: 380 }).svg.includes('stroke-width="2.2"'));
  assert.ok(E.cordas(b, { cordas: V, escrita: 'pauta', largura: 380 }).svg.includes('seta-r'));
});
// ---- bateria desenhada (com um kit de mentira, já que o de verdade precisa do navegador)
const ic = { defs: '<defs id="d"/>', art: { x: 0, y: 0, w: 300, h: 200 }, pecas: { hh: { x: 20, y: 20, w: 60, h: 20, cx: 50, cy: 30 }, sn: { x: 90, y: 110, w: 70, h: 40, cx: 125, cy: 130 }, bd: { x: 170, y: 100, w: 90, h: 90, cx: 215, cy: 145 } }, tem(p) { return !!this.pecas[p]; }, usa: (p) => (['hh', 'sn', 'bd'].includes(p) ? p : 'sn'), icone: (p, cx, cy, l) => `<g class="ic" data-i="${p}" data-x="${cx.toFixed(0)}"/>` };
const groove = [...Array.from({ length: 8 }, (_, k) => ({ p: 'hh', ini: k * 2, d: 2 })), { p: 'bd', ini: 0, d: 2 }, { p: 'bd', ini: 8, d: 2 }, { p: 'sn', ini: 4, d: 2 }, { p: 'sn', ini: 12, d: 2 }];
test('bateria "desenho": uma peça desenhada por batida no lugar das cabeças, selecionáveis', () => {
  const r = E.bateriaEscrita(groove, { escrita: 'desenho', largura: 460, icones: ic }); assert.equal((r.svg.match(/class="ic"/g) || []).length, 12); assert.equal((r.svg.match(/data-ev=/g) || []).length, 12); assert.ok(r.svg.includes('<defs id="d"/>'));
});
test('bateria "faixa": pauta normal em cima e a faixa de peças alinhada embaixo, mais alta que a pauta sozinha', () => {
  const f = E.bateriaEscrita(groove, { escrita: 'faixa', largura: 460, icones: ic }); const p = E.bateriaEscrita(groove, { escrita: 'pauta', largura: 460, icones: ic });
  assert.ok(f.h > p.h); assert.equal((f.svg.match(/data-peca=/g) || []).length, 12); assert.match(f.svg, />&</);
  assert.equal([...f.svg.matchAll(/data-peca="bd"><g class="ic" data-i="bd" data-x="(\d+)"/g)].length, 2);
});
test('bateria "quadros": 8 quadros por compasso (colcheias), com peças acesas, contagem e o número do compasso', () => {
  const r = E.bateriaEscrita(groove, { escrita: 'quadros', largura: 460, icones: ic, pecas: ['hh', 'sn', 'bd'] }); assert.equal(r.n, 1); assert.match(r.svg, /COMPASSO 1/); assert.equal((r.svg.match(/stroke-width="3"/g) || []).length, 12); assert.equal((r.svg.match(/opacity="0.14"/g) || []).length, 8 * 3 - 12);
  assert.equal((r.svg.match(/data-ev=/g) || []).length, 8); assert.match(r.svg, />&</);
});
test('quadros: acento engrossa o anel e fantasma é tracejado; 2 compassos viram 2 "sistemas"', () => {
  const r = E.bateriaEscrita([{ p: 'sn', ini: 0, d: 2, acc: true }, { p: 'sn', ini: 2, d: 2, fan: true }, { p: 'bd', ini: 16, d: 2 }], { escrita: 'quadros', largura: 460, icones: ic, pecas: ['hh', 'sn', 'bd'] });
  assert.match(r.svg, /stroke-width="4.5"/); assert.match(r.svg, /stroke-dasharray="3 3"/); assert.equal(r.n, 2); assert.match(r.svg, /COMPASSO 2/);
});
test('quadros: com a seleção, clicar de novo passa pro próximo evento do mesmo quadro', () => { const evs = [{ p: 'hh', ini: 0, d: 2 }, { p: 'bd', ini: 0, d: 2 }]; assert.match(E.bateriaEscrita(evs, { escrita: 'quadros', largura: 460, icones: ic, sel: 0 }).svg, /data-ev="1"/); });
test('sem o kit ilustrado (sem DOM) as escritas desenhadas caem na pauta comum', () => { assert.equal(E.bateriaEscrita(groove, { escrita: 'desenho', largura: 460, icones: null }).svg, R.bateria(groove, { largura: 460 }).svg); });
test('feixe: 8 colcheias de chimbal ficam ligadas de 2 em 2 (uma barra por tempo, sem 8 bandeirolas)', () => { const r = R.bateria(groove, { largura: 460 }); assert.equal((r.svg.match(/stroke-width="3.4"/g) || []).length, 4); });
// ---- visuais: cordas (faixa de braços, mapa) e teclado (faixa de teclados, quadros)
import * as X from '../js/pro/escrita-visual.js'; import * as Pm from '../js/partitura-melodica.js';
const dó = [{ c: 1, f: 1, ini: 0, d: 8, cif: 'Dó', dir: 'b' }, { c: 2, f: 0, ini: 0, d: 8, dir: 'b' }, { c: 3, f: 2, ini: 0, d: 8, dir: 'b' }, { c: 4, f: 3, ini: 0, d: 8, dir: 'b' }, { c: 0, f: 0, ini: 8, d: 4 }, { c: 0, f: 3, ini: 12, d: 4 }];
test('tablatura + faixa de braços: um mini braço por coluna, mais alta que a tablatura sozinha, bolinhas na cor da nota', () => {
  const r = X.tablaturaFaixa(dó, { cordas: V, largura: 460 }); const t = R.tablatura(dó, { cordas: V, largura: 460 });
  assert.equal((r.svg.match(/data-peca=/g) || []).length, 3); assert.ok(r.h > t.h); assert.match(r.svg, /fill="#e0262f"/); assert.equal((r.svg.match(/data-ev=/g) || []).length, 6); assert.ok(r.n >= 1);
});
test('mini braço: casa 1 de uma corda aperta a 1ª casa; corda solta vira anel; casa alta mostra o número da casa', () => {
  const a = X.miniBraco(30, 10, 40, [{ c: 1, f: 1 }, { c: 2, f: 0 }], V); assert.match(a.o, /fill="#e0262f"/); assert.match(a.o, /fill="none"/);
  assert.match(X.miniBraco(30, 10, 40, [{ c: 1, f: 7 }, { c: 2, f: 8 }], V).o, />7ª</);
});
test('mapa no braço: um braço por compasso, bolinhas numeradas na ordem, mesmo número no acorde', () => {
  const r = X.mapaBraco(dó, { cordas: V, largura: 460 }); assert.equal(r.n, 1); assert.match(r.svg, /COMPASSO 1/); assert.equal((r.svg.match(/data-ev=/g) || []).length, 6);
  const nums = [...r.svg.matchAll(/font-size="11" font-weight="800" fill="(?!#d9b45f)[^"]+" font-family="[^"]*">(\d)<\/text>/g)].map((m) => m[1]); assert.deepEqual([...new Set(nums)], ['1', '2', '3']);
  assert.equal(X.mapaBraco([{ c: 0, f: 2, ini: 0, d: 4 }, { c: 0, f: 5, ini: 16, d: 4 }], { cordas: V, largura: 460 }).n, 2);
});
test('mapa: notas acima da 12ª casa ampliam o braço', () => { const curto = X.mapaBraco([{ c: 0, f: 5, ini: 0, d: 4 }], { cordas: V, largura: 460 }).svg; const longo = X.mapaBraco([{ c: 0, f: 20, ini: 0, d: 4 }], { cordas: V, largura: 460 }).svg; assert.ok(longo.match(/<line/g).length > curto.match(/<line/g).length); });
test('E.cordas escolhe as novas escritas pelo nome', () => { assert.equal(E.cordas(dó, { cordas: V, escrita: 'faixa', largura: 460 }).svg, X.tablaturaFaixa(dó, { cordas: V, largura: 460 }).svg); assert.match(E.cordas(dó, { cordas: V, escrita: 'mapa', largura: 460 }).svg, /COMPASSO/); });
const ode = [64, 64, 65, 67, 67, 65, 64, 62].map((m, i) => ({ m, ini: i * 4, d: 4 }));
test('mini teclado acende só a tecla da nota, na cor dela (mi = amarelo)', () => { const s = X.miniTeclado(0, 0, 60, 40, [64]); assert.ok(s.includes('fill="#f6d11e"')); assert.ok(!s.includes('fill="#e0262f"')); assert.ok(X.miniTeclado(0, 0, 60, 40, [61]).includes('fill="#f28c1e"') === false); });
test('teclado "faixa": a pauta + um mini teclado por nota, com o nome; mais alta que só a pauta', () => {
  const f = X.tecladoEscrita(ode, { escrita: 'faixa', clave: 'sol', largura: 460 }); const p = X.tecladoEscrita(ode, { escrita: 'pauta', clave: 'sol', largura: 460 });
  assert.equal((f.svg.match(/data-peca=/g) || []).length, 8); assert.ok(f.h > p.h); assert.match(f.svg, />Mi</); assert.match(f.svg, />Sol</); assert.equal((f.svg.match(/data-ev=/g) || []).length, 8);
});
test('teclado "pauta" não mudou: igual a P.pauta', () => assert.equal(X.tecladoEscrita(ode, { escrita: 'pauta', clave: 'sol', largura: 460 }).svg, Pm.pauta(ode, { clave: 'sol', largura: 460 }).svg));
test('teclado "quadros": 8 quadros acesos (colcheia por quadro? semínimas = 4 por compasso), nome grande e contagem', () => {
  const q = X.tecladoEscrita(ode, { escrita: 'quadros', largura: 460 }); assert.equal(q.n, 2); assert.match(q.svg, /COMPASSO 2/); assert.equal((q.svg.match(/data-ev=/g) || []).length, 8); assert.match(q.svg, />Fá</);
});
test('quadros do teclado: nota longa continua nos quadros seguintes mais clarinha (‿) e o quadro seleciona a nota', () => {
  const q = X.tecladoEscrita([{ m: 60, ini: 0, d: 8 }], { escrita: 'quadros', largura: 460 }); assert.match(q.svg, /fill-opacity=".38"/); assert.match(q.svg, /‿/);
  assert.equal((q.svg.match(/data-ev="0"/g) || []).length, 2);
});
test('quadros do teclado: quadro vazio nunca aparece como selecionado (sem seleção = -1)', () => { const q = X.tecladoEscrita([{ m: 60, ini: 0, d: 4 }], { escrita: 'quadros', largura: 460, sel: -1 }); assert.equal((q.svg.match(/stroke="#b8913f"/g) || []).length, 0); });
