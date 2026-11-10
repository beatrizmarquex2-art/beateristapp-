import test from 'node:test';
import assert from 'node:assert/strict';
import * as O from '../js/jogos/cara-musical/online-regras.js';
import * as R from '../js/jogos/cara-musical/regras.js';

/** simula dois celulares: cada um só tem o próprio segredo; o estado é o único canal */
async function partida(modo, escolhas, rnd = Math.random) {
  const mesa = R.novaMesa({ modo, tamanho: modo === 'kids' ? 6 : 12 }); let e = O.novoEstado({ modo, mesa });
  const ids = mesa.cartas.map((c) => c.id); const seg = [ids[escolhas[0]], ids[escolhas[1]]]; const sal = [O.novoSal(), O.novoSal()];
  for (const p of [0, 1]) e = O.escolher(e, p, await O.selo(seg[p], sal[p]));
  return { e, seg, sal, ids, mesa };
}
/** joga até o fim: cada um pergunta a melhor pergunta e palpita quando sobra 1 candidato */
function jogarAteFim(S) {
  let { e } = S; let guard = 0;
  while (O.fase(e) === 'jogo' && guard++ < 200) {
    const pend = O.pendente(e);
    if (pend) { e = O.responder(e, 1 - pend.p, S.seg[1 - pend.p]); continue; }
    const p = e.turno; const lado = O.ladoDe(e, p); const cand = R.candidatosDo(e.mesa, lado);
    if (cand.length === 1) e = O.palpitar(e, p, cand[0]);
    else { const q = R.sugestoes(e.mesa, lado, 1)[0]; e = O.palpitar ? O.perguntar(e, p, q.id) : e; }
  }
  return e;
}
test('o segredo nunca aparece no estado compartilhado antes da revelação', async () => {
  const S = await partida('classico', [0, 1]); let e = S.e;
  const j = () => JSON.stringify(e);
  assert.ok(!/"segredo"/.test(j())); assert.ok(!j().includes(S.sal[0])); assert.ok(!j().includes(S.sal[1]));
  e = jogarAteFim(S); assert.ok(!/"segredo"/.test(JSON.stringify(e)));
});
test('partida completa de dois lados termina, acha os segredos e fecha a rodada', async () => {
  for (const modo of ['kids', 'classico']) {
    const S = await partida(modo, [0, 3]); const e = jogarAteFim(S);
    assert.equal(O.fase(e), 'fim'); assert.ok(e.fim); assert.equal(O.ladoDe(e, 0).acertou, true); assert.equal(O.ladoDe(e, 1).acertou, true);
    assert.equal(e.serie.vitorias[0] + e.serie.vitorias[1] + e.serie.empates, 1);
  }
});
test('vez alterna, ninguém joga fora da vez nem com pergunta aberta', async () => {
  const S = await partida('classico', [0, 1]); let e = S.e; const q = R.sugestoes(e.mesa, O.ladoDe(e, 0), 1)[0];
  assert.throws(() => O.perguntar(e, 1, q.id)); e = O.perguntar(e, 0, q.id);
  assert.throws(() => O.perguntar(e, 0, q.id)); assert.throws(() => O.responder(e, 0, S.seg[0]));
  e = O.responder(e, 1, S.seg[1]); assert.equal(e.turno, 1);
  assert.throws(() => O.perguntar(e, 1, q.id) && O.perguntar(O.responder(O.perguntar(e, 1, q.id), 0, S.seg[0]), 0, q.id) && 0, /./);
});
test('resposta vem do segredo de quem responde e elimina as cartas certas', async () => {
  const S = await partida('classico', [2, 5]); let e = S.e; const q = R.sugestoes(e.mesa, O.ladoDe(e, 0), 1)[0];
  e = O.responder(O.perguntar(e, 0, q.id), 1, S.seg[1]); const sim = R.respostaDe(q, O.cartaDe(e, S.seg[1]));
  assert.equal(e.log.at(-1).sim, sim); const lado = O.ladoDe(e, 0); assert.ok(!lado.fora.includes(S.seg[1]));
  for (const id of lado.fora) assert.notEqual(R.respostaDe(q, O.cartaDe(e, id)), sim);
});
test('kids: erro no 1º palpite dá dica validada e 2º erro termina; clássico termina no 1º', async () => {
  for (const [modo, n] of [['kids', 2], ['classico', 1]]) {
    const S = await partida(modo, [0, 1]); let e = S.e; let erros = 0;
    while (O.fase(e) === 'jogo' && erros < 5) {
      const p = e.turno; if (p === 1) { const q = R.sugestoes(e.mesa, O.ladoDe(e, 1), 1)[0]; e = O.responder(O.perguntar(e, 1, q.id), 0, S.seg[0]); continue; }
      const errado = R.candidatosDo(e.mesa, O.ladoDe(e, 0)).find((id) => id !== S.seg[1]); e = O.responder(O.palpitar(e, 0, errado), 1, S.seg[1]); erros++;
      if (modo === 'kids' && erros === 1) { const d = O.ladoDe(e, 0).dica; assert.ok(d); assert.equal(R.respostaDe((await import("../js/jogos/cara-musical/perguntas.js")).BY_Q[d.id], O.cartaDe(e, S.seg[1])), d.sim); }
      if (O.ladoDe(e, 0).terminou) break;
    }
    assert.equal(erros, n);
  }
});
test('selo confere na revelação e trapaça é detectada', async () => {
  const S = await partida('classico', [0, 1]); let e = jogarAteFim(S);
  e = O.revelar(O.revelar(e, 0, S.seg[0], S.sal[0]), 1, S.seg[1], S.sal[1]);
  assert.equal((await O.conferir(e, 0)).ok, true); assert.equal((await O.conferir(e, 1)).ok, true);
  const fraude = JSON.parse(JSON.stringify(e)); fraude.log.find((x) => x.t === 'a').sim = !fraude.log.find((x) => x.t === 'a').sim;
  assert.equal((await O.conferir(fraude, 0)).ok && (await O.conferir(fraude, 1)).ok, false);
  const troca = O.revelar(e, 0, S.ids[4], S.sal[0]); assert.equal((await O.conferir(troca, 0)).ok, false);
});
test('melhor de 3 e próxima rodada alternam quem começa', async () => {
  const S = await partida('kids', [0, 1]); const e = jogarAteFim(S); const m = R.novaMesa({ modo: 'kids', tamanho: 6 });
  const n = O.proxima(e, m); if (!e.serie.fim) { assert.equal(n.rodada, 2); assert.equal(n.turno, 1); assert.deepEqual(n.selos, [null, null]); }
});

test('pergunta livre: o outro responde SIM/NÃO na mão, a vez alterna, conta como pergunta e não vira cartas sozinha', async () => {
  const S = await partida('classico', [0, 1]); let e = S.e; const p = e.turno;
  e = O.perguntarLivre(e, p, '  tem   bateria? ');
  assert.equal(O.pendente(e).t, 'f'); assert.equal(O.pendente(e).txt, 'tem bateria?');
  assert.throws(() => O.perguntarLivre(e, p, 'outra'), /sua vez/); // enquanto espera, não pode perguntar de novo
  assert.throws(() => O.responderLivre(e, p, true), /nada pra responder/); // quem perguntou não responde
  e = O.responderLivre(e, 1 - p, true);
  assert.equal(O.pendente(e), null); assert.equal(e.turno, 1 - p, 'a vez passa pro outro');
  const lado = O.ladoDe(e, p);
  assert.equal(lado.perguntas.length, 1); assert.equal(lado.perguntas[0].livre, true); assert.equal(lado.perguntas[0].sim, true);
  assert.equal(lado.fora.length, 0, 'nenhuma carta sai sozinha: quem perguntou vira à mão');
});
test('pergunta livre: texto é opcional (pergunta falada) e limitado a 140 caracteres', async () => {
  const S = await partida('kids', [0, 1]); let e = S.e; const p = e.turno;
  e = O.perguntarLivre(e, p); assert.equal(O.pendente(e).txt, ''); e = O.responderLivre(e, 1 - p, false);
  assert.equal(O.ladoDe(e, p).perguntas[0].sim, false);
  e = O.perguntarLivre(e, 1 - p, 'x'.repeat(500)); assert.equal(O.pendente(e).txt.length, O.TEXTO_LIVRE_MAX);
});
test('pergunta livre mistura com perguntas prontas e palpite sem quebrar o fim da rodada nem a conferência', async () => {
  const S = await partida('classico', [0, 1]); let e = S.e; let guard = 0;
  while (O.fase(e) === 'jogo' && guard++ < 200) {
    const pend = O.pendente(e);
    if (pend) { const outro = 1 - pend.p; e = pend.t === 'f' ? O.responderLivre(e, outro, guard % 2 === 0) : O.responder(e, outro, S.seg[outro]); continue; }
    const p = e.turno; const lado = O.ladoDe(e, p); const cand = R.candidatosDo(e.mesa, lado);
    if (cand.length === 1) e = O.palpitar(e, p, cand[0]);
    else if (guard % 3 === 0) e = O.perguntarLivre(e, p, 'pergunta livre ' + guard);
    else e = O.perguntar(e, p, R.sugestoes(e.mesa, lado, 1)[0].id);
  }
  assert.equal(O.fase(e), 'fim'); assert.ok(e.fim);
  for (const p of [0, 1]) e = O.revelar(e, p, S.seg[p], S.sal[p]);
  assert.ok((await O.conferir(e, 0)).ok && (await O.conferir(e, 1)).ok);
});
