// Apostila "Beaterista toca violão" (violão do zero) — coleção Beaterista Método (verde). Diagramas, partituras e tablaturas são calculados pela afinação (violao-lib.mjs).
import * as L from './lib-premium.mjs';
import * as V from './violao-lib.mjs';
import { AC, MELODIAS as MEL } from './violao-dados.mjs';
import { registra as p1 } from './violao-p1.mjs';
import { registra as p2 } from './violao-p2.mjs';
import { registra as p3 } from './violao-p3.mjs';
import { registra as p4 } from './violao-p4.mjs';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
const NOME = 'BEATERISTA TOCA VIOLÃO';
let MODI = 0; let IDATUAL = '';
const pg = (o) => L.pagina({ ...o, modulo: MODI, id: IDATUAL });
const NUMS = process.env.NUMS && existsSync(process.env.NUMS) ? JSON.parse(readFileSync(process.env.NUMS, 'utf8')) : {};

const MODS = [
  ['Módulo 1 · Primeiros passos', 'Primeiros passos', 'Todo violonista que você admira já tocou um Fá horrível um dia.', 'Conhecer o instrumento, afinar, sentar direito e ler o desenho do acorde.', ['como', 'anatomia', 'escolha', 'postura', 'afinacao', 'cordas', 'desenho']],
  ['Módulo 2 · Música essencial', 'Música essencial', 'Devagar e certo vira rápido e certo. Rápido e errado vira hábito errado.', 'Pulso, figuras, compasso, partitura, tablatura, intervalos e o mapa do braço: o que você precisa saber para entender o que toca.', ['pulso', 'figuras', 'compassos', 'partitura', 'partitura2', 'intervalos', 'braco', 'braco2', 'tom']],
  ['Módulo 3 · Acordes', 'Acordes', 'Você não precisa de talento para começar. Precisa começar para ganhar talento.', 'Como os acordes são formados, os acordes abertos, a pestana e o dicionário completo.', ['formacao', 'maiores', 'maiores2', 'menores', 'pestana', 'dicionario', 'dicionario2', 'moveis']],
  ['Módulo 4 · Ritmo e batidas', 'Ritmo e batidas', 'Precisão nasce da repetição consciente, não da tensão. Toque relaxado e respeite os limites do seu corpo.', 'Batidas, estilos, trocas de acordes e dedilhado: o que faz o acorde virar música.', ['batidas', 'baiao', 'estilos', 'estilos2', 'trocas', 'trocas2', 'trocas3', 'dedilhado']],
  ['Módulo 5 · Técnicas e melodias', 'Técnicas e melodias', 'Ninguém nasce sabendo pestana. Nem o Fá.', 'Técnicas, melodias com partitura e tablatura, escalas e improvisação.', ['tecnicas', 'tecnicas2', 'melodias', 'melodias2', 'melodias3', 'escalas', 'escalas2', 'pentatonicas']],
  ['Módulo 6 · Harmonia e acompanhamento', 'Harmonia e acompanhamento', 'Entender a música por dentro transforma quem só repete em quem cria.', 'Campo harmônico, funções, progressões, blues, transposição e capotraste.', ['campo', 'progressoes', 'transposicao']],
  ['Módulo 7 · Rotina de estudo', 'Rotina de estudo', 'O cérebro grava o movimento enquanto você dorme. Treine hoje, acorde melhor amanhã.', 'Trilha de treino, rotina de 15 minutos e hábitos que aceleram o aprendizado.', ['treino', 'rotina', 'dicas']],
  ['Hora de brincar', null, null, null, ['desafios', 'desafios2', 'respostas']],
  ['Para levar', null, null, null, ['plano4', 'plano8', 'plano12', 'registro', 'controle', 'folha1', 'folha2', 'folha3', 'folha4', 'folha5', 'folha6', 'folha7', 'folha8', 'glossario', 'escola']],
];
const TITULOS = { como: 'Como usar esta apostila', anatomia: 'Anatomia do violão', escolha: 'Escolhendo o primeiro violão', postura: 'Postura e posição das mãos', afinacao: 'Afinação', cordas: 'O nome das cordas e as cifras', desenho: 'Como ler o desenho do acorde',
  pulso: 'Pulso, ritmo, melodia e harmonia', figuras: 'Figuras, pausas e durações', compassos: 'Compasso, contratempo, síncope e tercinas', partitura: 'Lendo partitura e tablatura', partitura2: 'Primeiros exercícios de leitura', intervalos: 'Intervalos', braco: 'O braço do violão: onde ficam as notas', braco2: 'O braço com sustenidos e bemóis', tom: 'Tom, semitom, sustenido e bemol',
  formacao: 'Como se formam os acordes', maiores: 'Acordes maiores', maiores2: 'Os acordes maiores abertos', menores: 'Acordes menores', pestana: 'Pestana e minipestana', dicionario: 'Dicionário: maiores e menores', dicionario2: 'Dicionário: sétimas e outros', moveis: 'Formas móveis, power chords e baixo invertido',
  batidas: 'Tipos de batida', baiao: 'Baião, contratempo e a regra do movimento', estilos: 'Batidas por estilo', estilos2: 'Samba, bossa, forró e blues', trocas: 'Batida + troca de acordes', trocas2: 'Exercícios de troca', trocas3: 'Mais trocas', dedilhado: 'Dedilhado',
  tecnicas: 'Técnicas de violão', tecnicas2: 'Bend, harmônicos e abafamento', melodias: 'Melodias populares', melodias2: 'Mais melodias', melodias3: 'Noite Feliz', escalas: 'Escalas: cromática, maior e menor natural', escalas2: 'Sol maior e Lá menor natural', pentatonicas: 'Pentatônicas, blues e improvisação',
  campo: 'Campo harmônico', progressoes: 'Funções, progressões e blues', transposicao: 'Transposição e capotraste', treino: 'Treino progressivo', rotina: 'Rotina de 15 minutos', dicas: 'Dicas práticas',
  desafios: 'Desafios no papel', desafios2: 'Mais desafios', respostas: 'Respostas dos desafios', plano4: 'Plano das 4 primeiras semanas', plano8: 'Plano de 8 semanas', plano12: 'Plano de 12 semanas', registro: 'Registro dos 30 dias', controle: 'Controle de evolução', folha1: 'Tablatura em branco', folha2: 'Partitura em branco', folha3: 'Partitura e tablatura combinadas', folha4: 'Diagramas de acordes em branco', folha5: 'Braço do violão em branco', folha6: 'Tabelas de batidas', folha7: 'Planejamento semanal e repertório', folha8: 'Anotações livres', glossario: 'Glossário musical', escola: 'Beaterista e os recursos digitais' };
const SEMNUM = ['respostas', 'plano4', 'plano8', 'plano12', 'registro', 'controle', 'folha1', 'folha2', 'folha3', 'folha4', 'folha5', 'folha6', 'folha7', 'folha8', 'glossario', 'escola'];
const N = (id) => MODS.flatMap((m) => m[4]).filter((x) => !SEMNUM.includes(x)).indexOf(id) + 1;
const T = (id, area) => `${N(id)} · ${area}`;

/* ---------- helpers de página ---------- */
const ac = (k, { g = false } = {}) => { const d = AC[k]; if (!d) throw new Error('acorde ' + k); return `<div class="ac${g ? ' g' : ''}">${V.diagrama(d)}<small>${d.nome}</small></div>`; };
const acs = (keys, o = {}) => keys.map((k) => ac(k, o)).join('');
const acx = (k) => { const d = AC[k]; return `<div class="acx"><div class="ac g">${V.diagrama(d)}</div><div class="tx"><b>${d.nome} · ${d.rotulo || d.c}</b><p>${V.descreve(d)}</p></div></div>`; };
const ICO = (d, c = 'currentColor') => `<svg viewBox="0 0 24 30" width="15" height="19" style="display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">${d}</svg>`;
const SIM = { D: ICO('<path d="M12 3V25M4 17L12 26L20 17" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'), U: ICO('<path d="M12 27V5M4 13L12 4L20 13" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>'), X: ICO('<path d="M5 8L19 22M19 8L5 22" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>'), '.': ICO('<circle cx="12" cy="15" r="2.6" fill="currentColor"/>'), B: `<span style="font-size:9pt;display:block;line-height:1">baixo</span>${ICO('<path d="M12 3V25M4 17L12 26L20 17" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>')}`, '': '' };
const CONTA = { 12: ['1', 'la', 'li', '2', 'la', 'li', '3', 'la', 'li', '4', 'la', 'li'], 8: ['1', 'e', '2', 'e', '3', 'e', '4', 'e'], 6: ['1', 'e', '2', 'e', '3', 'e'], 4: ['1', 'e', '2', 'e'] };
const bat = (titulo, meta, arr, n, texto, acentos = []) => `<div class="card"><h4><span>${titulo}</span></h4><div class="meta">${meta}</div><table class="bat"><tr>${arr.map((x, i) => `<td${acentos.includes(i) ? ' class="a"' : ''}>${SIM[x] ?? x}</td>`).join('')}</tr><tr class="cont">${CONTA[n].map((x) => `<td>${x}</td>`).join('')}</tr></table>${texto ? `<p>${texto}</p>` : ''}</div>`;
const part = (id, evs, o = {}) => `<div class="mapa part">${V.partitura({ evs, nomeId: id, ...o })}</div>`;
const melodia = (k) => { const m = MEL[k]; return `<div class="mapa part">${V.partitura({ evs: m.evs, compasso: m.compasso, pickup: m.pickup, tempo: m.tempo, porLinha: m.porLinha, nomeId: k, titulo: m.titulo })}</div>`; };
/** Folhas em branco: pauta com clave, tablatura, ou as duas. */
const pautaVazia = ({ tab = true, pauta = true, sistemas = 6 } = {}) => { const W = 640; const G = 9; const h = (pauta ? 36 : 0) + (tab ? 54 : 0) + (pauta && tab ? 26 : 0) + 30; let o = ''; for (let s = 0; s < sistemas; s++) { let y = s * h + 16; const x1 = 6, x2 = W - 6; let yEnd = y;
  if (pauta) { for (let k = 0; k < 5; k++) o += `<line x1="${x1}" y1="${y + k * G}" x2="${x2}" y2="${y + k * G}" stroke="#1d2236" stroke-width="1"/>`; o += `<text x="28" y="${y + 29}" text-anchor="middle" font-size="40" font-family="serif" fill="#1d2236">𝄞</text><text x="28" y="${y + 52}" text-anchor="middle" font-size="12" font-weight="800" fill="#1d2236" font-family="Hanken, sans-serif">8</text>`; yEnd = y + 36; y += 36 + 26; }
  if (tab) { const yT = pauta ? y - 8 : y; for (let k = 0; k < 6; k++) o += `<line x1="${x1}" y1="${yT + k * 9}" x2="${x2}" y2="${yT + k * 9}" stroke="#1d2236" stroke-width="1"/>`; o += `<text x="24" y="${yT + 19}" text-anchor="middle" font-size="13" font-weight="900" fill="#1d2236" font-family="Hanken, sans-serif">T</text><text x="24" y="${yT + 31}" text-anchor="middle" font-size="13" font-weight="900" fill="#1d2236" font-family="Hanken, sans-serif">A</text><text x="24" y="${yT + 43}" text-anchor="middle" font-size="13" font-weight="900" fill="#1d2236" font-family="Hanken, sans-serif">B</text>`; yEnd = yT + 45; if (pauta) { /* nada */ } }
  const top = s * h + 16; for (let b = 0; b <= 4; b++) { const x = b === 0 ? x1 : x1 + 36 + b * ((x2 - x1 - 36) / 4); o += `<line x1="${x}" y1="${top}" x2="${x}" y2="${yEnd}" stroke="#1d2236" stroke-width="1.2"/>`; } }
  return `<svg viewBox="0 0 ${W} ${sistemas * h + 10}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-height:none">${o}</svg>`; };

const ctx = { L, V, pg, N, T, ac, acs, acx, bat, part, AC, MEL, melodia, pautaVazia, NUMS };
const B = {}; p1(B, ctx); p2(B, ctx); p3(B, ctx); p4(B, ctx);

/* ================= montagem ================= */
const EXTRAS = process.env.EXTRAS && existsSync(process.env.EXTRAS) ? JSON.parse(readFileSync(process.env.EXTRAS, 'utf8')) : {};
const modulos = MODS.map((m, i) => ({ livro: NOME, nome: m[1] ? `MÓDULO ${String(i + 1).padStart(2, '0')} · ${m[1].toUpperCase()}` : (m[0] === 'Hora de brincar' ? 'HORA DE BRINCAR' : 'PARA LEVAR') }));
const AUTO = '<h2 class="s">Autoavaliação do módulo</h2><table class="t"><tr><th>Pergunta</th><th>Minha resposta</th></tr><tr><td>O que já faço bem</td><td style="height:11mm"></td></tr><tr><td>O que ainda trava</td><td style="height:11mm"></td></tr><tr><td>Meu próximo passo</td><td style="height:11mm"></td></tr></table>';
const P = []; P.push(L.capa({ tipo: 'violao', t1: 'violão', t2: 'do zero', lema: 'da primeira corda à primeira música.', kicker: 'Beaterista toca violão' }));
const sumPos = P.length; P.push('');
for (const [i, m] of MODS.entries()) {
  MODI = i;
  if (m[1]) P.push(L.divisor({ modulo: i + 1, titulo: m[1], citacao: m[2], itens: m[4].map((id) => [N(id), TITULOS[id]]), nome: NOME }));
  for (const id of m[4]) { IDATUAL = id; if (!B[id]) throw new Error('falta a seção ' + id); P.push(B[id]()); }
  if (m[1]) P.push(L.revisao({ modulo: i, titulos: m[4].map((id) => TITULOS[id]), linhas: 'auto', extra: AUTO }));
}
P[sumPos] = L.sumario(MODS.map((m) => [m[0], m[4].map((id) => [SEMNUM.includes(id) ? '·' : N(id), TITULOS[id], NUMS[id] || ''])]), NOME, 'Diagramas, partituras e tablaturas deste livro são calculados a partir da afinação padrão (E2 A2 D3 G3 B3 E4) e conferidos por programa antes da impressão.');
writeFileSync('/tmp/apo/violao.html', L.doc(P, 'Beaterista toca violão', 'verde', modulos, NOME));
console.log('seções:', P.length);
console.log('MODS:' + JSON.stringify(MODS.map((m) => ({ primeira: m[4][0], divisor: !!m[1] }))));
console.log(JSON.stringify(MODS.flatMap((m) => m[4])));
if (process.env.AUDIT) { writeFileSync('/tmp/apo/auditoria_violao.json', JSON.stringify(V.AUDITORIA, null, 1)); console.error(`AUDITORIA violão: ${V.AUDITORIA.acordes.length} diagramas, ${V.AUDITORIA.pautas.length} partituras, ${V.AUDITORIA.erros.length} problemas`); V.AUDITORIA.erros.forEach((e) => console.error(' -', e)); }
