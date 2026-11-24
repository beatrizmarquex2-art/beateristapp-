// Ponte jogos.beaterista.com.br → play.beaterista.com.br: leva código/nome/aparelho do aluno sem perder nada e sem aceitar link malicioso.
import test from 'node:test';
import assert from 'node:assert/strict';
import { empacotar, codificar, decodificar, aplicar, migrarSeNecessario, HOST_ANTIGO, URL_NOVO, FLAG_MIGRADO } from '../js/migrar-dominio.js';

class Store { constructor(o = {}) { this.m = new Map(Object.entries(o)); } get length() { return this.m.size; } key(i) { return [...this.m.keys()][i] ?? null; } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } }
const aluno = () => new Store({ 'beaterista-aluno-codigo': 'PABC234XYZ', 'beaterista-aluno-nome': 'Maria', 'beaterista-aparelho-id': 'aa11bb22cc33dd44', 'beaterista-theme': 'escuro', 'bt-mute': '1', 'outra-coisa': 'nao-leva', 'token-x': 'nao-leva' });
const loc = (host, hash = '') => ({ hostname: host, hash, pathname: '/', search: '', replaced: null, replace(u) { this.replaced = u; } });
const hist = () => ({ url: null, replaceState(_a, _b, u) { this.url = u; } });
const NOW = 1_800_000_000_000;

test('empacotar leva só beaterista-* e bt-*', () => {
  const k = empacotar(aluno()); assert.deepEqual(Object.keys(k).sort(), ['beaterista-aluno-codigo', 'beaterista-aluno-nome', 'beaterista-aparelho-id', 'beaterista-theme', 'bt-mute']);
});
test('no endereço antigo: manda pro play com os dados no #hash (nunca na query)', () => {
  const l = loc(HOST_ANTIGO); const r = migrarSeNecessario({ loc: l, st: aluno(), hist: hist(), agora: () => NOW });
  assert.equal(r, true); assert.ok(l.replaced.startsWith(`${URL_NOVO}/#migrar=`)); assert.ok(!l.replaced.includes('?'));
  assert.ok(!l.replaced.includes('PABC234XYZ'), 'o código não aparece em texto puro');
});
test('ida e volta: o play recebe código, nome e o MESMO id de aparelho, e limpa o endereço', () => {
  const origem = loc(HOST_ANTIGO); migrarSeNecessario({ loc: origem, st: aluno(), hist: hist(), agora: () => NOW });
  const hash = origem.replaced.slice(URL_NOVO.length + 1); const play = new Store(); const h = hist();
  const r = migrarSeNecessario({ loc: loc('play.beaterista.com.br', hash), st: play, hist: h, agora: () => NOW + 5000 });
  assert.equal(r, false); assert.equal(play.getItem('beaterista-aluno-codigo'), 'PABC234XYZ'); assert.equal(play.getItem('beaterista-aparelho-id'), 'aa11bb22cc33dd44');
  assert.equal(play.getItem('beaterista-aluno-nome'), 'Maria'); assert.equal(play.getItem('bt-mute'), '1'); assert.equal(play.getItem('outra-coisa'), null); assert.equal(play.getItem(FLAG_MIGRADO), '1'); assert.equal(h.url, '/');
});
test('o play já tem um aparelho id (abriu antes): vale o id antigo, já registrado no servidor', () => {
  const play = new Store({ 'beaterista-aparelho-id': 'novo-id-gerado-agora' }); aplicar(empacotar(aluno()), play);
  assert.equal(play.getItem('beaterista-aparelho-id'), 'aa11bb22cc33dd44');
});
test('o play já tem outro código: identidade não é trocada (link não troca de pessoa), só completa o que falta', () => {
  const play = new Store({ 'beaterista-aluno-codigo': 'PMEUCODIGO', 'beaterista-theme': 'claro' }); aplicar(empacotar(aluno()), play);
  assert.equal(play.getItem('beaterista-aluno-codigo'), 'PMEUCODIGO'); assert.equal(play.getItem('beaterista-aluno-nome'), null); assert.equal(play.getItem('beaterista-theme'), 'claro'); assert.equal(play.getItem('bt-mute'), '1');
});
test('pacote velho, adulterado ou de outro formato é recusado; chaves estranhas são ignoradas', () => {
  const novo = codificar({ v: 1, t: NOW, k: { 'beaterista-aluno-codigo': 'P1' } });
  assert.ok(decodificar(novo, NOW + 1000)); assert.equal(decodificar(novo, NOW + 10 * 60000), null, 'passou de 2 min'); assert.equal(decodificar(novo, NOW - 60000), null, 'data no futuro');
  assert.equal(decodificar('lixo!!', NOW), null); assert.equal(decodificar(codificar({ v: 2, t: NOW, k: {} }), NOW), null);
  const k = decodificar(codificar({ v: 1, t: NOW, k: { 'beaterista-x': 'ok', 'evil-key': 'x', 'bt-y': 123 } }), NOW); assert.deepEqual(k, { 'beaterista-x': 'ok' });
});
test('sem nada guardado: só redireciona; acento e emoji no nome sobrevivem', () => {
  const l = loc(HOST_ANTIGO); migrarSeNecessario({ loc: l, st: new Store(), hist: hist(), agora: () => NOW }); assert.equal(l.replaced, `${URL_NOVO}/`);
  const st = new Store({ 'beaterista-aluno-nome': 'José Ângela 🎸' }); const l2 = loc(HOST_ANTIGO); migrarSeNecessario({ loc: l2, st, hist: hist(), agora: () => NOW });
  const play = new Store(); migrarSeNecessario({ loc: loc('play.beaterista.com.br', l2.replaced.slice(URL_NOVO.length + 1)), st: play, hist: hist(), agora: () => NOW }); assert.equal(play.getItem('beaterista-aluno-nome'), 'José Ângela 🎸');
});
test('no play sem #migrar nada acontece; armazenamento quebrado não derruba o app', () => {
  const l = loc('play.beaterista.com.br'); assert.equal(migrarSeNecessario({ loc: l, st: new Store(), hist: hist() }), false); assert.equal(l.replaced, null);
  const quebrado = { get length() { throw new Error('bloqueado'); }, key() { return null; }, getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(migrarSeNecessario({ loc: loc(HOST_ANTIGO), st: quebrado, hist: hist() }), true);
  assert.equal(migrarSeNecessario({ loc: loc('play.beaterista.com.br', '#migrar=zzz'), st: quebrado, hist: hist() }), false);
});
