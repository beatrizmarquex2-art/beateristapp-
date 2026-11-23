// Peças de desenho dos PDFs de aula (preto e branco): teclado, pauta, ritmo, braço do violão, acordes, grades de bateria e montagem das páginas.
import { TREBLE, BASS, yn } from '../../js/paulta/draw.js';
import { diagramaSVG } from '../../js/acordes.js';
import { LET, SOLFA, cifra } from './teoria.js';

export const P = '../../assets/originals/paul-png/pra-colorir/desenhos/';
export const LOGO = '../../assets/originals/paul-png/pra-colorir/logos-pb/roboterista-escola-de-musica-pb.png';
const PRETA = (m) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
const NOMES = ['dó', 'dó#', 'ré', 'ré#', 'mi', 'fá', 'fá#', 'sol', 'sol#', 'lá', 'lá#', 'si'];
export const lin = (c = '') => `<span class="lin ${c}"></span>`;
export const cx = (t = '') => `<span class="cx"></span>${t}`;
export const paul = (arq, w = 34) => `<img class="pb" style="width:${w}mm;flex:none" src="${P}${arq}.png" alt="">`;
export const fala = (arq, txt, w = 34) => `<div class="fala">${paul(arq, w)}<div class="balao mao">${txt}</div></div>`;
export const caixa = (titulo, corpo, cls = '') => `<div class="caixa ${cls}">${titulo ? `<h3>${titulo}</h3>` : ''}${corpo}</div>`;
export const tabela = (cab, linhas, cls = '') => `<table class="${cls}">${cab ? `<tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr>` : ''}${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
export const vazio = (n = 1) => '&nbsp;'.repeat(n);

/* ---------- exercícios com gabarito automático ---------- */
export function criaExercicios() {
  const GAB = []; const cont = {};
  const ex = (sec, titulo, corpo, resp, dica = '') => { cont[sec] = (cont[sec] || 0) + 1; const num = `${sec}${cont[sec]}`; GAB.push({ sec, num, titulo, resp }); return `<div class="caixa tracejada ex"><h3>exercício ${num}: ${titulo}</h3>${corpo}${dica ? `<p class="peq dica">dica: ${dica}</p>` : ''}</div>`; };
  return { ex, GAB };
}

/* ---------- teclado ---------- */
/** Piano em preto e branco. marca = { midi: 'ton' | 'dest' }; rotulo(m) = texto embaixo; sup(m) = texto em cima. */
export function piano({ de = 60, ate = 72, marca = {}, rotulo = (m) => NOMES[((m % 12) + 12) % 12], sup = () => '', h = 95 } = {}) {
  const brancas = []; for (let m = de; m <= ate; m++) if (!PRETA(m)) brancas.push(m);
  const w = 100; const total = brancas.length * w; const H = h; let s = `<svg class="piano" viewBox="0 0 ${total + 4} ${H + 64}" role="img">`;
  brancas.forEach((m, i) => { const t = marca[m]; const fill = t === 'ton' ? '#5a5a5a' : t === 'dest' ? '#d2d2d2' : '#fff'; s += `<rect x="${2 + i * w}" y="26" width="${w}" height="${H}" fill="${fill}" stroke="#000" stroke-width="2.4"/>`;
    const tx = 2 + i * w + w / 2; if (sup(m)) s += `<text x="${tx}" y="19" font-size="21" font-weight="800" text-anchor="middle">${sup(m)}</text>`;
    s += `<text x="${tx}" y="${H + 20}" font-size="23" font-weight="800" text-anchor="middle" ${t === 'ton' ? `fill="#fff" y="${H + 14}"` : ''}>${rotulo(m) || ''}</text>`; });
  brancas.forEach((m, i) => { const b = m + 1; if (b <= ate && PRETA(b)) { const t = marca[b]; const x = 2 + (i + 1) * w - 24; s += `<rect x="${x}" y="26" width="48" height="${H * 0.6}" fill="#111" stroke="#000" stroke-width="2"/>`;
    if (t) s += `<circle cx="${x + 24}" cy="${26 + H * 0.6 - 14}" r="9" fill="#fff" stroke="#000" stroke-width="2"/>`; if (sup(b)) s += `<text x="${x + 24}" y="19" font-size="19" font-weight="800" text-anchor="middle">${sup(b)}</text>`; } });
  return `${s}</svg>`;
}

/* ---------- pauta ---------- */
const SUST_TREBLE = [['F', 5], ['C', 5], ['G', 5], ['D', 5], ['A', 4], ['E', 5], ['B', 4]]; const BEM_TREBLE = [['B', 4], ['E', 5], ['A', 4], ['D', 5], ['G', 4], ['C', 5], ['F', 4]];
const SUST_BASS = [['F', 3], ['C', 3], ['G', 3], ['D', 3], ['A', 2], ['E', 3], ['B', 2]]; const BEM_BASS = [['B', 2], ['E', 3], ['A', 2], ['D', 3], ['G', 2], ['C', 3], ['F', 2]];
export function parseNota(s) { const m = /^([A-G])(#{0,2}|b{0,2}|n)(\d)$/.exec(s); if (!m) throw new Error(`nota inválida: ${s}`); return { l: m[1], a: m[2] === 'n' ? 'n' : m[2].startsWith('#') ? m[2].length : -m[2].length, o: Number(m[3]) }; }
const passo = (clef, n) => (n.o * 7 + LET.indexOf(n.l)) - (clef === 'sol' ? 4 * 7 + 2 : 2 * 7 + 4);
const glifo = (a) => (a === 'n' ? '♮' : a > 0 ? (a === 2 ? '𝄪' : '♯') : a < -1 ? '♭♭' : '♭');
/**
 * Pauta com notas em sequência. notas = ['C4', 'F#4', ...] ou { p: 'C4', d: 'q'|'h'|'w', r: 'texto embaixo' }.
 * arm = { n, tipo: '♯'|'♭' } (armadura). junto = true desenha as notas empilhadas num acorde (uma coluna só).
 */
export function pauta({ clef = 'sol', notas = [], acordes = null, arm = null, w = 640, rotulos = null, compasso = null, barras = [], h = 150, y0 = 24 } = {}) {
  const H = h; const Y0 = y0; const INK = '#000';
  // colunas: cada coluna é uma nota (sequência) ou um acorde (várias notas juntas, com uma haste só)
  const cols = (acordes || notas.map((n) => [n])).map((c) => c.map((n) => (typeof n === 'string' ? { p: n, d: 'q' } : { d: 'q', ...n })));
  const ks = arm && arm.n ? (arm.tipo === '♯' ? (clef === 'sol' ? SUST_TREBLE : SUST_BASS) : (clef === 'sol' ? BEM_TREBLE : BEM_BASS)).slice(0, arm.n) : [];
  const chaveAcc = {}; ks.forEach(([l]) => { chaveAcc[l] = arm.tipo === '♯' ? 1 : -1; });
  const off = clef === 'fa' ? 20 : 0; let x0 = 84 + off + ks.length * 13; if (compasso) x0 += 26; x0 += 18;
  const n = Math.max(cols.length, 1); const passoX = (w - x0 - 22) / n;
  let s = `<svg class="pauta" viewBox="0 ${Y0} ${w} ${H + 4}" role="img">`;
  for (let i = 0; i < 5; i++) s += `<line x1="14" y1="${yn(i * 2)}" x2="${w - 10}" y2="${yn(i * 2)}" stroke="${INK}" stroke-width="1.8"/>`;
  s += `<line x1="14" y1="${yn(0)}" x2="14" y2="${yn(8)}" stroke="${INK}" stroke-width="2"/><line x1="${w - 10}" y1="${yn(0)}" x2="${w - 10}" y2="${yn(8)}" stroke="${INK}" stroke-width="3.2"/>`;
  s += clef === 'sol' ? TREBLE(46).replace(/#1b1818/g, INK) : BASS(46).replace(/#1b1818/g, INK);
  ks.forEach(([l, o], i) => { const y = yn(passo(clef, { l, o })); s += `<text x="${78 + off + i * 13}" y="${y + 9}" font-size="30" font-family="'DejaVu Sans',sans-serif" text-anchor="middle">${arm.tipo}</text>`; });
  if (compasso) { const [a, b] = compasso.split('/'); const cxp = 80 + off + ks.length * 13 + 14; s += `<text x="${cxp}" y="${yn(6) + 2}" font-size="34" font-family="Anton,Impact" text-anchor="middle">${a}</text><text x="${cxp}" y="${yn(2) + 2}" font-size="34" font-family="Anton,Impact" text-anchor="middle">${b}</text>`; }
  cols.forEach((col, i) => {
    const x = x0 + passoX * i + passoX / 2; const sts = []; let prev = null; let desloca = false;
    col.slice().sort((a, b) => passo(clef, parseNota(a.p)) - passo(clef, parseNota(b.p))).forEach((no) => {
      const nt = parseNota(no.p); const st = passo(clef, nt); const y = yn(st); sts.push(st);
      let dx = 0; if (prev !== null && st - prev === 1) { desloca = !desloca; dx = desloca ? 13 : 0; } else desloca = false; prev = st;
      const xx = x + dx;
      if (st < 0) for (let k = -2; k >= st; k -= 2) s += `<line x1="${xx - 15}" y1="${yn(k)}" x2="${xx + 15}" y2="${yn(k)}" stroke="${INK}" stroke-width="1.8"/>`;
      if (st > 8) for (let k = 10; k <= st; k += 2) s += `<line x1="${xx - 15}" y1="${yn(k)}" x2="${xx + 15}" y2="${yn(k)}" stroke="${INK}" stroke-width="1.8"/>`;
      const noChave = chaveAcc[nt.l] || 0; const a = nt.a; const mostra = a === 'n' || (a !== noChave);
      if (mostra) s += `<text x="${xx - 18}" y="${y + 9}" font-size="26" font-family="'DejaVu Sans',sans-serif" text-anchor="middle">${a === 'n' || a === 0 ? '♮' : glifo(a)}</text>`;
      const aberta = no.d === 'h' || no.d === 'w'; s += `<ellipse cx="${xx}" cy="${y}" rx="10.5" ry="7.4" transform="rotate(-20 ${xx} ${y})" fill="${aberta ? '#fff' : INK}" stroke="${INK}" stroke-width="2.4"/>`;
    });
    const d0 = col[0].d; const lo = Math.min(...sts); const hi = Math.max(...sts); const up = (lo + hi) / 2 < 4;
    if (d0 !== 'w') { const sx = up ? x + 9.5 : x - 9.5; s += `<line x1="${sx}" y1="${yn(up ? lo : hi)}" x2="${sx}" y2="${up ? yn(hi) - 42 : yn(lo) + 42}" stroke="${INK}" stroke-width="2.4"/>`; }
    const r = (col[0].r) || (rotulos && rotulos[i]); if (r) s += `<text x="${x}" y="${Y0 + H}" font-size="${r.length > 6 ? 15 : 19}" font-weight="800" font-family="'Hanken Grotesk',sans-serif" text-anchor="middle">${r}</text>`;
  });
  barras.forEach((b) => { const x = x0 + passoX * b; s += `<line x1="${x}" y1="${yn(0)}" x2="${x}" y2="${yn(8)}" stroke="${INK}" stroke-width="2"/>`; });
  return `${s}</svg>`;
}

/* ---------- ritmo ---------- */
const DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
const dur = (it) => { const base = DUR[it.replace(/^r/, '').replace(/[.~]/g, '')[0]]; return base * (it.includes('.') ? 1.5 : 1); };
/**
 * Linha rítmica numa linha só. compassos = [ [grupo, grupo, ...], ... ]; grupo = ['q'] ou ['e','e'] ou { tup: 3, itens: ['e','e','e'] }.
 * itens: w h q e s (notas), r + letra (pausa), '.' no fim = ponto de aumento, '~' no fim = ligada à próxima.
 * conta = ['1','e','2',...] opcional, escrita embaixo de cada nota/pausa.
 */
export function ritmo({ fc = '4/4', compassos = [], conta = null, w = 640 } = {}) {
  const INK = '#000'; const Yl = 66; const H = 112; let x = 62; let k = 0; let s = '';
  const pos = []; const items = [];
  compassos.forEach((m, mi) => {
    m.forEach((g) => {
      const lst = Array.isArray(g) ? g : g.itens; const tup = Array.isArray(g) ? 0 : g.tup; const beam = lst.length > 1 && lst.every((t) => !t.startsWith('r') && ['e', 's'].includes(t[0]));
      const xs = []; lst.forEach((it) => { const d = tup ? 1 / lst.length : dur(it); const wdt = 26 + Math.min(d, 2) * 34; xs.push(x + wdt / 2); x += wdt; items.push({ it, x: xs[xs.length - 1], mi }); });
      pos.push({ lst, xs, beam, tup });
    });
    x += 10; s += `<line x1="${x - 5}" y1="${Yl - 26}" x2="${x - 5}" y2="${Yl + 26}" stroke="${INK}" stroke-width="${mi === compassos.length - 1 ? 3.4 : 2}"/>`; x += 6;
  });
  const total = Math.max(x + 8, w);
  const kscale = (w - 70) / (x - 62 + 8); // ajusta pra caber na largura
  let body = '';
  pos.forEach(({ lst, xs, beam, tup }) => {
    lst.forEach((it, i) => {
      const cxn = xs[i]; const rest = it.startsWith('r'); const t = it.replace(/^r/, '')[0]; const pont = it.includes('.');
      if (rest) { body += restSvg(t, cxn, Yl); } else {
        const aberta = ['h', 'w'].includes(t); body += `<ellipse cx="${cxn}" cy="${Yl}" rx="9.5" ry="6.8" transform="rotate(-20 ${cxn} ${Yl})" fill="${aberta ? '#fff' : INK}" stroke="${INK}" stroke-width="2.4"/>`;
        if (t !== 'w') body += `<line x1="${cxn + 8.8}" y1="${Yl}" x2="${cxn + 8.8}" y2="${Yl - 38}" stroke="${INK}" stroke-width="2.4"/>`;
        if (!beam && (t === 'e' || t === 's')) { for (let f = 0; f < (t === 's' ? 2 : 1); f++) body += `<path d="M${cxn + 8.8} ${Yl - 38 + f * 8}c1 12 16 12 13 28" stroke="${INK}" stroke-width="2.6" fill="none"/>`; }
      }
      if (pont) body += `<circle cx="${cxn + 17}" cy="${Yl - 4}" r="2.7" fill="${INK}"/>`;
      if (it.endsWith('~')) body += `<path d="M${cxn + 4} ${Yl + 14}q22 14 44 0" stroke="${INK}" stroke-width="2" fill="none"/>`;
    });
    if (beam) { const xa = xs[0] + 8.8; const xb = xs[xs.length - 1] + 8.8; const ns = lst.some((t) => t[0] === 's'); body += `<line x1="${xa}" y1="${Yl - 38}" x2="${xb}" y2="${Yl - 38}" stroke="${INK}" stroke-width="6"/>`; if (ns) lst.forEach((t, i) => { if (t[0] === 's') { const a = i > 0 && lst[i - 1][0] === 's' ? xs[i - 1] + 8.8 : xs[i] + 8.8; const b = i > 0 && lst[i - 1][0] === 's' ? xs[i] + 8.8 : (i < lst.length - 1 && lst[i + 1][0] === 's' ? xs[i + 1] + 8.8 : xs[i] + 8.8 - 12); if (i > 0 && lst[i - 1][0] === 's') body += `<line x1="${a}" y1="${Yl - 29}" x2="${b}" y2="${Yl - 29}" stroke="${INK}" stroke-width="5"/>`; else if (i < lst.length - 1 && lst[i + 1][0] === 's') { /* feita no próximo */ } else body += `<line x1="${xs[i] + 8.8 - 11}" y1="${Yl - 29}" x2="${xs[i] + 8.8}" y2="${Yl - 29}" stroke="${INK}" stroke-width="5"/>`; } }); }
    if (tup) { const xa = xs[0] - 4; const xb = xs[xs.length - 1] + 14; body += `<path d="M${xa} ${Yl - 48}v-8h${(xb - xa) / 2 - 10}M${(xb + xa) / 2 + 10 } ${Yl - 56}h${(xb - xa) / 2 - 10}v8" stroke="${INK}" stroke-width="2" fill="none"/><text x="${(xa + xb) / 2}" y="${Yl - 51}" font-size="17" font-weight="800" font-family="'Hanken Grotesk',sans-serif" text-anchor="middle">${tup}</text>`; }
  });
  const lbl = conta ? items.map((o, i) => `<text x="${o.x}" y="${Yl + 44}" font-size="19" font-weight="800" font-family="'Hanken Grotesk',sans-serif" text-anchor="middle">${conta[i] ?? ''}</text>`).join('') : '';
  const [a, b] = fc.split('/');
  const fcs = `<text x="30" y="${Yl - 3}" font-size="30" font-family="Anton,Impact" text-anchor="middle">${a}</text><text x="30" y="${Yl + 24}" font-size="30" font-family="Anton,Impact" text-anchor="middle">${b}</text>`;
  s = `<svg class="ritmo" viewBox="0 0 ${w} ${H + (conta ? 16 : 0)}" role="img"><line x1="10" y1="${Yl}" x2="${w - 6}" y2="${Yl}" stroke="${INK}" stroke-width="1.8"/><line x1="10" y1="${Yl - 26}" x2="10" y2="${Yl + 26}" stroke="${INK}" stroke-width="2"/>${fcs}<g transform="translate(${62 - 62 * kscale}) scale(${kscale} 1)">${body}${s}${lbl.replace(/text /g, 'text ')}</g></svg>`;
  return s;
}
function restSvg(t, x, y) {
  const I = '#000';
  if (t === 'q') return `<path d="M${x - 3} ${y - 24}l9 11-8 8 9 11c-9-4-13 3-6 9" stroke="${I}" stroke-width="3.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (t === 'e') return `<circle cx="${x - 5}" cy="${y - 10}" r="4" fill="${I}"/><path d="M${x - 3} ${y - 8}q10 3 12-7l-10 26" stroke="${I}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (t === 's') return `<circle cx="${x - 5}" cy="${y - 14}" r="3.6" fill="${I}"/><circle cx="${x - 8}" cy="${y - 2}" r="3.6" fill="${I}"/><path d="M${x - 3} ${y - 12}q9 2 11-7M${x - 6} ${y}q9 2 11-7M${x + 8} ${y - 19}l-13 33" stroke="${I}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (t === 'h') return `<rect x="${x - 9}" y="${y - 6}" width="18" height="6" fill="${I}"/>`;
  return `<rect x="${x - 9}" y="${y}" width="18" height="6" fill="${I}"/>`;
}
/** Grade de bateria (passos × peças): linhas = [{ nome, x: [índices dos passos com batida] }]. */
export function grade({ linhas, passos = 16, cab = null }) {
  const cabec = cab || Array.from({ length: passos }, (_, i) => (i % 4 === 0 ? String(i / 4 + 1) : i % 4 === 2 ? '&' : i % 4 === 1 ? 'e' : 'a'));
  const cell = (v, i) => `<td class="g${i % 4 === 0 ? ' q' : ''}">${v ? '●' : ''}</td>`;
  return `<table class="grade"><tr><th class="gn"></th>${cabec.map((c, i) => `<th class="g${i % 4 === 0 ? ' q' : ''}">${c}</th>`).join('')}</tr>${linhas.map((l) => `<tr><th class="gn">${l.nome}</th>${Array.from({ length: passos }, (_, i) => cell(l.x ? l.x.includes(i) : false, i)).join('')}</tr>`).join('')}</table>`;
}

/* ---------- violão ---------- */
/** Diagrama de acorde (cordas da grave pra aguda). casas: -1 não toca, 0 solta, n casa. */
export const acordeBox = (nome, casas) => `<div class="acorde cifra"><b>${nome}</b>${diagramaSVG({ casas })}</div>`;
/** Braço do violão na horizontal com notas marcadas: marks = [{ s: corda 6..1, f: casa, t: texto, raiz: bool }]. */
export function braco({ de = 0, ate = 5, marks = [], w = 640, pontos = [3, 5, 7, 9, 12] } = {}) {
  const nf = ate - de + 1; const X0 = 46; const dx = (w - X0 - 12) / nf; const Y0 = 20; const dy = 24; const H = Y0 + dy * 5 + 30;
  let s = `<svg class="braco" viewBox="0 0 ${w} ${H}" role="img">`;
  for (let c = 0; c <= nf; c++) s += `<line x1="${X0 + c * dx}" y1="${Y0}" x2="${X0 + c * dx}" y2="${Y0 + dy * 5}" stroke="#000" stroke-width="${c === 0 && de === 0 ? 5 : 1.8}"/>`;
  for (let r = 0; r < 6; r++) s += `<line x1="${X0}" y1="${Y0 + r * dy}" x2="${X0 + nf * dx}" y2="${Y0 + r * dy}" stroke="#000" stroke-width="${1 + r * 0.25}"/>`;
  for (let c = 1; c <= nf; c++) { const f = de + c; s += `<text x="${X0 + (c - 0.5) * dx}" y="${Y0 + dy * 5 + 22}" font-size="15" font-weight="700" font-family="'Hanken Grotesk',sans-serif" text-anchor="middle">${f}</text>`; if (pontos.includes(f)) s += `<circle cx="${X0 + (c - 0.5) * dx}" cy="${Y0 + dy * 2.5}" r="4" fill="#bbb"/>`; }
  const nomes = ['e', 'B', 'G', 'D', 'A', 'E']; nomes.forEach((n, r) => { s += `<text x="16" y="${Y0 + r * dy + 5}" font-size="15" font-weight="800" font-family="'Hanken Grotesk',sans-serif" text-anchor="middle">${n}</text>`; });
  marks.forEach(({ s: cs, f, t = '', raiz = false }) => { const r = 6 - cs; const cxm = f === 0 ? X0 - 16 : X0 + (f - de - 0.5) * dx; if (f === 0) { s += `<circle cx="${X0 - 16}" cy="${Y0 + r * dy}" r="9" fill="${raiz ? '#000' : '#fff'}" stroke="#000" stroke-width="2"/>`; return; }
    s += `<circle cx="${cxm}" cy="${Y0 + r * dy}" r="10.5" fill="${raiz ? '#000' : '#fff'}" stroke="#000" stroke-width="2.2"/><text x="${cxm}" y="${Y0 + r * dy + 5.5}" font-size="13.5" font-weight="800" font-family="'Hanken Grotesk',sans-serif" text-anchor="middle" fill="${raiz ? '#fff' : '#000'}">${t}</text>`; });
  return `${s}</svg>`;
}

/* ---------- montagem das páginas ---------- */
export const topo = (secao, t) => `<div class="top"><span>Robôterista ensina · ${secao}</span><span>${t}</span></div>`;
/** Junta as páginas {sec, titulo, html, capa?} numeradas (a capa não conta como número na pág., mas ocupa a 1ª). */
export function monta(paginas, rodape = 'Escola Beaterista · Robôterista Paul', secao = 'aula') {
  return paginas.map((p, i) => (p.capa ? `<section class="pg capa" data-k="${i}">${p.html}</section>` : `<section class="pg ${p.cls || ''}" data-k="${i}">${topo(p.secao || secao, p.titulo || '')}${p.html}<div class="rod"><span>${rodape}</span><span>página ${i + 1}</span></div></section>`)).join('');
}
export async function pronto() { await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))); await document.fonts.ready; }
export { cifra, SOLFA };
