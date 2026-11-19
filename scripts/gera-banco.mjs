// Gera o banco de conteúdo verificado a partir dos PDFs da Bea (cartas do dicionário, cartas de instrumentos, livros Robôterista).
// Uso: node scripts/gera-banco.mjs [--pdfs=/pasta/dos/pdfs]   (precisa do `pdftotext`, do poppler)
// Regras: nada sai da memória. Cada item nasce de um trecho do PDF por transformação mecânica (definição ↔ termo, lacuna, verdadeiro/falso) e só entra
// se o trecho for ENCONTRADO de novo, palavra por palavra, no texto da página (pdftotext em outra ordem de leitura) — senão é rejeitado e listado.
// Saída: assets/jogos/banco/<assunto>.json (+ indice.json) e docs/BANCO-CONTEUDO.md (folha de conferência pra Bea).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { paginas, celulas, cartaDicionario, cartaInstrumento } from './banco-cartas.mjs';
import { NORM, achaNaPagina, PDFS, rawPaginas } from './banco-verifica.mjs';

const ARG = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const DIR = ARG.pdfs || '/root/.claude/uploads/627c7c3f-1f77-565c-9fc7-954418ce0d0d';
const OUT = 'assets/jogos/banco';
const NOME_PDF = { dic: 'Cards Dicionário Musical (120)', ins: 'Cards Instrumentos (90)', ens: 'Robôterista Ensina', mel: 'Robôterista Melodia e Harmonia', cad: 'Caderno de Atividades do Paul' };

/* ---------- utilidades ---------- */
const SEM_ACENTO = (s) => NORM(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set('para como mais muito quando sobre onde pela pelo esse essa cada tem uma uns umas que com sem dos das nos nas por ser tipo isso ele ela eles elas seu sua seus suas nao sim mas'.split(' '));
const palavras = (s) => SEM_ACENTO(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w));
const jaccard = (a, b) => { const A = new Set(a); const B = new Set(b); if (!A.size || !B.size) return 0; let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i); };
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => { let a = hash(seed); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const embaralha = (arr, seed) => { const r = rng(seed); const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const corta = (s, max = 160) => { if (s.length <= max) return s; const fr = s.split(/(?<=[.!?])\s+/); return fr[0].length <= max ? fr[0] : null; };
const nivelPorTamanho = (s) => (s.length <= 70 ? 'f' : s.length <= 110 ? 'm' : 'd');

/* ---------- leitura dos PDFs ---------- */
const rejeitados = []; const puladas = [];
const aceito = []; // itens já verificados
const abre = (cod) => PDFS[cod].map((f) => path.join(DIR, f)).filter((f) => fs.existsSync(f));
for (const k of Object.keys(PDFS)) if (!abre(k).length) { console.error(`PDF não encontrado: ${k} em ${DIR}`); process.exit(1); }

const raw = {}; for (const k of Object.keys(PDFS)) raw[k] = abre(k).map(rawPaginas); // raw[k][versão][página-1]
/** O trecho tem que existir na página do PDF principal (e, se houver, igual na segunda cópia). */
const verifica = (cod, pagina, trechos) => {
  const todos = trechos.filter(Boolean); const v = raw[cod];
  if (!v[0][pagina - 1]) return false;
  return todos.every((t) => achaNaPagina(v[0][pagina - 1], t));
};
const copiaConfere = (cod, pagina, trecho) => (raw[cod].length < 2 ? null : !!raw[cod][1][pagina - 1] && achaNaPagina(raw[cod][1][pagina - 1], trecho));

/* ---------- 1. cartas do dicionário ---------- */
const GRUPO_ASSUNTO = { BATERIA: 'ritmo', TEORIA: 'teoria', TECLADO: 'teoria', VIOLÃO: 'cordas' };
const dic = [];
for (const p of paginas(abre('dic')[0]).slice(2)) for (const c of celulas(p.linhas)) {
  if (!c.length) continue; const k = cartaDicionario(c); if (!k || !k.titulo || !k.expl) continue;
  const grupo = k.grupo.replace(/\s+/g, ''); const m = k.expl.search(/[.!?]\s+"[^"]+"[.!?]?$/); const def = (m >= 0 ? k.expl.slice(0, m + 1) : k.expl).trim();
  dic.push({ pagina: p.pagina, num: k.num, grupo, assunto: GRUPO_ASSUNTO[grupo] || 'dicionario', termo: k.titulo.toLowerCase(), ingles: k.ingles, def, dica: k.dica });
}
// confere a segunda cópia do dicionário (mesmo texto?)
let dicDiferentes = 0;
if (abre('dic').length > 1) { const outro = []; for (const p of paginas(abre('dic')[1]).slice(2)) for (const c of celulas(p.linhas)) { if (!c.length) continue; const k = cartaDicionario(c); if (k && k.titulo) outro.push(k.titulo + '|' + k.expl); } const meu = new Set(dic.map((d) => d.termo.toUpperCase() + '|' + d.def)); dicDiferentes = outro.filter((x) => !dic.some((d) => x.startsWith(d.termo.toUpperCase() + '|'))).length; }

const distratoresDe = (alvo, pool, campo, n, seed, extraNo = '') => {
  const q = SEM_ACENTO(extraNo); const pa = palavras(alvo.rotulo || alvo[campo]);
  const ok = embaralha(pool.filter((x) => x !== alvo && x[campo] !== alvo[campo]), seed).filter((x) => {
    const t = SEM_ACENTO(x[campo]); if (q && (q.includes(t) || palavras(x[campo]).some((w) => q.split(/[^a-z0-9]+/).includes(w)))) return false; // o distrator aparece no enunciado
    if (palavras(x[campo]).some((w) => pa.includes(w))) return false; // divide palavra com a resposta
    if (alvo.def && x.def && jaccard(palavras(alvo.def), palavras(x.def)) >= 0.15) return false; // explicações parecidas: pode ser sinônimo
    return true;
  });
  return ok.slice(0, n);
};
const unico = new Set();
const add = (it, cod, pagina, trechos) => {
  const chave = `${it.a}|${it.t}|${NORM(it.q)}`; if (unico.has(chave)) return;
  if (!verifica(cod, pagina, trechos)) { rejeitados.push({ id: it.i, motivo: 'trecho não achado na página', f: [cod, pagina] }); return; }
  unico.add(chave); aceito.push({ ...it, f: [cod, pagina] });
};
dic.forEach((d, idx) => {
  const mesmo = dic.filter((x) => x.assunto === d.assunto);
  // definição → termo
  const defCurta = corta(d.def);
  if (defCurta) {
    const dist = distratoresDe({ ...d, rotulo: d.termo }, mesmo, 'termo', 3, `dic${idx}`, defCurta);
    if (dist.length === 3) add({ i: `dic${d.pagina}-${idx}d`, a: d.assunto, t: 'definicao', n: nivelPorTamanho(defCurta), q: defCurta, r: d.termo, o: dist.map((x) => x.termo), c: defCurta.slice(0, 70) }, 'dic', d.pagina, [defCurta, d.termo]);
    else puladas.push(`dic p${d.pagina} ${d.termo}: poucos distratores seguros`);
  } else puladas.push(`dic p${d.pagina} ${d.termo}: explicação longa demais pra um trecho curto`);
  // termo → nome em inglês
  const ing = d.ingles || ''; const ingOk = /^[a-z][a-z' ()/-]*$/i.test(ing) && ing.toLowerCase() === ing && !/\b(do|da|de|um|uma|lista)\b/.test(ing) && SEM_ACENTO(ing) !== SEM_ACENTO(d.termo);
  if (ingOk) {
    const pool = mesmo.filter((x) => /^[a-z][a-z' ()/-]*$/i.test(x.ingles || '') && (x.ingles || '').toLowerCase() === x.ingles && !/\b(do|da|de|um|uma|lista)\b/.test(x.ingles) && SEM_ACENTO(x.ingles) !== SEM_ACENTO(x.termo));
    const dist = embaralha(pool.filter((x) => x.ingles !== ing), `ing${idx}`).filter((x) => !palavras(x.ingles).some((w) => palavras(ing).includes(w))).slice(0, 3);
    if (dist.length === 3) add({ i: `dic${d.pagina}-${idx}e`, a: d.assunto, t: 'definicao', n: d.termo.includes(' ') ? 'm' : 'f', q: `como se diz “${d.termo}” em inglês?`, r: ing, o: dist.map((x) => x.ingles), c: ing, k: 'ingles' }, 'dic', d.pagina, [ing]);
  }
  // verdadeiro/falso (alternando): afirmação “termo: explicação”, a falsa troca a explicação por a de outro termo do mesmo assunto
  if (defCurta && defCurta.length <= 110) {
    if (idx % 2 === 0) add({ i: `dic${d.pagina}-${idx}v`, a: d.assunto, t: 'vf', n: nivelPorTamanho(defCurta), q: `${d.termo}: ${defCurta}`, r: 1, c: defCurta.slice(0, 70) }, 'dic', d.pagina, [defCurta, d.termo]);
    else {
      const outro = embaralha(mesmo.filter((x) => x !== d && corta(x.def) && corta(x.def).length <= 110), `vf${idx}`).find((x) => jaccard(palavras(d.def), palavras(x.def)) < 0.1 && !palavras(x.def).some((w) => palavras(d.termo).includes(w)));
      if (outro) add({ i: `dic${d.pagina}-${idx}f`, a: d.assunto, t: 'vf', n: nivelPorTamanho(corta(outro.def)), q: `${d.termo}: ${corta(outro.def)}`, r: 0, c: corta(outro.def).slice(0, 70) }, 'dic', outro.pagina, [corta(outro.def)]);
    }
  }
});

/* ---------- 2. cartas de instrumentos ---------- */
const ins = []; const AS_INS = { BATERIA: 'ritmo', TECLADO: 'teoria', 'VIOLÃO': 'cordas' };
{
  const cartas = [];
  for (const p of paginas(abre('ins')[0]).slice(2)) for (const c of celulas(p.linhas)) { if (!c.length) continue; const k = cartaInstrumento(c); if (k && k.titulo && k.texto) cartas.push({ ...k, pagina: p.pagina }); }
  cartas.forEach((k, i) => { const inst = ['BATERIA', 'TECLADO', 'VIOLÃO'][Math.floor(i / 30)]; const texto = k.texto.replace(/\s+(BATERIA|TECLADO|VIOLÃO)\s+FASE.*$/, '').replace(/\s+(BATERIA|TECLADO|VIOLÃO)$/, '').trim(); const fase = Number((/FASE (\d)/.exec(k.fase || '') || [])[1]) || 1; ins.push({ pagina: k.pagina, num: k.num, inst, assunto: AS_INS[inst], fase, termo: k.titulo.toLowerCase(), def: texto }); });
}
const ARTIGO = /^(o|a|os|as) /;
ins.forEach((d, idx) => {
  const frase = corta(d.def); if (!frase) { puladas.push(`ins p${d.pagina} ${d.termo}: texto longo demais`); return; }
  const tit = d.termo.replace(ARTIGO, ''); const titNorm = SEM_ACENTO(tit); const frNorm = SEM_ACENTO(frase);
  let q = frase; let vaza = false;
  const sig = palavras(tit);
  if (frNorm.includes(titNorm) && titNorm.length >= 2) { q = frase.replace(new RegExp(`(?<![\\p{L}])${tit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu'), '_____'); if (q === frase) vaza = true; }
  else { const vz = sig.filter((w) => frNorm.split(/[^a-z0-9]+/).includes(w)); if (vz.length >= 1) vaza = true; } // pedaço do título no texto: pula (a resposta não pode vazar nem ficar diferente do que foi apagado)
  if (vaza) { puladas.push(`ins p${d.pagina} ${d.termo}: o título aparece no texto em pedaços`); return; }
  if (/\b(app|toca aqui|rudimentix|detetive note)\b/i.test(frase) && /treine nos jogos/i.test(d.termo)) { puladas.push(`ins p${d.pagina} ${d.termo}: propaganda do app`); return; }
  const mesmo = ins.filter((x) => x.inst === d.inst);
  const dist = distratoresDe({ ...d, rotulo: d.termo }, mesmo, 'termo', 3, `ins${idx}`, frase);
  if (dist.length < 3) { puladas.push(`ins p${d.pagina} ${d.termo}: poucos distratores seguros`); return; }
  const ts = [frase.slice(0, 200)]; const lac = q.includes('_____'); const sem = (x) => (lac ? x.replace(ARTIGO, '') : x); add({ i: `ins${d.pagina}-${idx}`, a: d.assunto, t: lac ? 'lacuna' : 'definicao', n: d.fase <= 2 ? 'f' : d.fase <= 4 ? 'm' : 'd', q, r: sem(d.termo), o: dist.map((x) => sem(x.termo)), c: frase.slice(0, 70) }, 'ins', d.pagina, ts);
  // verdadeiro/falso (alternando); a falsa troca o texto pelo de outra carta do mesmo instrumento
  if (!lac && frase.length <= 110) {
    if (idx % 2 === 0) add({ i: `ins${d.pagina}-${idx}v`, a: d.assunto, t: 'vf', n: d.fase <= 2 ? 'f' : d.fase <= 4 ? 'm' : 'd', q: `${d.termo}: ${frase}`, r: 1, c: frase.slice(0, 70) }, 'ins', d.pagina, [frase]);
    else {
      const outro = embaralha(mesmo.filter((x) => x !== d && corta(x.def) && corta(x.def).length <= 110), `ivf${idx}`).find((x) => jaccard(palavras(d.def), palavras(x.def)) < 0.1 && !palavras(x.def).some((w) => palavras(d.termo).includes(w)) && !SEM_ACENTO(x.def).includes(SEM_ACENTO(d.termo.replace(ARTIGO, ''))));
      if (outro) add({ i: `ins${d.pagina}-${idx}f`, a: d.assunto, t: 'vf', n: d.fase <= 2 ? 'f' : d.fase <= 4 ? 'm' : 'd', q: `${d.termo}: ${corta(outro.def)}`, r: 0, c: corta(outro.def).slice(0, 70) }, 'ins', outro.pagina, [corta(outro.def)]);
    }
  }
});

/* ---------- 3. livros: figuras ("vale") e frases com lacuna ---------- */
const FIGS = []; // { nome, valor }
for (let pg = 0; pg < raw.ens[0].length; pg++) {
  const bruto = fs.existsSync('/dev/null') ? null : null; void bruto;
}
const textoBruto = (cod, v = 0) => { const f = abre(cod)[v]; return execFileSync('pdftotext', [f, '-'], { maxBuffer: 1 << 28 }).toString('utf8').split('\f'); };
const ensRaw = textoBruto('ens'); const melRaw = textoBruto('mel');
for (let pg = 0; pg < ensRaw.length; pg++) for (const m of ensRaw[pg].matchAll(/^([A-ZÀ-Ú]{4,})\nvale ([^\n]+)$/gm)) { const nome = m[1].toLowerCase(); if (!FIGS.some((f) => f.nome === nome)) FIGS.push({ nome, valor: m[2].trim(), pagina: pg + 1 }); }
FIGS.forEach((f, idx) => {
  const outros = FIGS.filter((x) => x.nome !== f.nome);
  const nivel = idx < 3 ? 'f' : idx < 5 ? 'm' : 'd';
  const dv = embaralha(outros.filter((x) => x.valor !== f.valor), `fv${idx}`).slice(0, 3);
  const dn = embaralha(outros, `fn${idx}`).slice(0, 3);
  const trecho = `${f.nome} vale ${f.valor}`;
  if (dv.length === 3) add({ i: `ens${f.pagina}-v${idx}`, a: 'ritmo', t: 'definicao', n: nivel, q: `quanto vale a ${f.nome}?`, r: f.valor, o: dv.map((x) => x.valor), c: trecho, k: 'vale' }, 'ens', f.pagina, [trecho]);
  if (dn.length === 3) add({ i: `ens${f.pagina}-n${idx}`, a: 'ritmo', t: 'definicao', n: nivel, q: `qual figura vale ${f.valor}?`, r: f.nome, o: dn.map((x) => x.nome), c: trecho, k: 'vale' }, 'ens', f.pagina, [trecho]);
});
// vocabulário pra lacunas: termos de UMA palavra que já aparecem como título nas cartas, mais os nomes das figuras
const VOC = new Map(); // sem acento → { termo, assunto, classe }
const GENERICAS = new Set(['forma', 'nota', 'base', 'final', 'toque', 'tempo', 'show', 'palco', 'ponte', 'solo', 'take', 'faixa', 'track', 'cover', 'coro', 'dueto']); // palavras comuns demais: a lacuna poderia ter outro sentido
for (const d of dic) if (['ritmo', 'teoria', 'cordas'].includes(d.assunto) && !GENERICAS.has(SEM_ACENTO(d.termo)) && !d.termo.includes(' ') && d.termo.length >= 4) VOC.set(SEM_ACENTO(d.termo), { termo: d.termo, assunto: d.assunto, classe: `dic:${d.grupo}` });
for (const d of ins) { const t = d.termo.replace(ARTIGO, ''); if (!t.includes(' ') && t.length >= 4 && !/\d/.test(t) && !GENERICAS.has(SEM_ACENTO(t))) VOC.set(SEM_ACENTO(t), { termo: t, assunto: d.assunto, classe: `ins:${d.inst}` }); }
for (const f of FIGS) VOC.set(SEM_ACENTO(f.nome), { termo: f.nome, assunto: 'ritmo', classe: 'figura' });
const IMP = /^(ligue|pinte|desenhe|trace|bata|ache|complete|escreva|circule|ou[cç]a|toque|leia|marque|cubra|conte|recorte|cole|procure|use|siga|imprima|aperte|passe|junte|escolha|monte|responda|compare|tente|fa[cç]a|crie|invente|v[aá]|coloque|risque|n[aã]o|pe[cç]a|grave|tire|explique|diga|cante|brinque|olhe|repare|lembre|pense|descubra|observe|abra|segure)\b/i;
const VERBO = / (é|são|vale|valem|fica|ficam|chama|chamam|sobe|desce|tem|têm|serve|marca|mostra|faz|dura|dividem|divide|toca|soa|cabem|aparece|aparecem) /;
const FRASES = [];
for (const [cod, paginasTxt] of [['ens', ensRaw], ['mel', melRaw]]) paginasTxt.forEach((t, i) => {
  for (const b of t.split(/\n\s*\n/).map((x) => x.replace(/\s+/g, ' ').trim())) {
    if (b.length < 45 || b.length > 420 || /BEATERISTA \||Robôterista /.test(b)) continue;
    for (const s of b.split(/(?<=[.!?])\s+/)) {
      const x = s.replace(/^(DICA DO PAUL:|REPARE:|CURIOSIDADE:)\s*/, '').trim();
      if (x.length < 40 || x.length > 160 || !/[.!]$/.test(x) || IMP.test(x) || /\?/.test(x) || !VERBO.test(x) || /\(\d\)|\d\)/.test(x) || /app|aluno|crian[cç]a|professor|jogo|folha|p[aá]gina|capítulo|aula \d|livro|imprim/i.test(x) || /\b(essa|esse|essas|esses|isso|aqui|ali|agora|acima|abaixo|ao lado|nesta|neste|Paul)\b/i.test(x) || /^(a|o|os|as) de /i.test(x) || /[A-ZÀ-Ú]{3,} [A-ZÀ-Ú]{3,}/.test(x) || /^(ela|ele|eles|elas)\b/i.test(x)) continue; // sem frases que dependem do desenho/contexto, nem com título colado
      FRASES.push({ cod, pagina: i + 1, x });
    }
  }
});
const vistas = new Set();
FRASES.forEach((fr, idx) => {
  const chave = SEM_ACENTO(fr.x); if (vistas.has(chave)) return; vistas.add(chave);
  const toks = [...fr.x.matchAll(/\p{L}+/gu)].map((m) => ({ t: m[0], i: m.index, s: SEM_ACENTO(m[0]) }));
  const achados = toks.filter((k) => VOC.has(k.s)); const unicos = [...new Set(achados.map((k) => k.s))];
  if (unicos.length !== 1 || achados.length !== 1) return; // só frases com UM termo do vocabulário, uma vez
  const alvo = achados[0]; const v = VOC.get(alvo.s); if (alvo.i < 3) return; // não no começo da frase
  const q = fr.x.slice(0, alvo.i) + '_____' + fr.x.slice(alvo.i + alvo.t.length); if (/_____.*_____/.test(q)) return;
  const pool = [...VOC.values()].filter((x) => x.classe === v.classe && x.termo !== v.termo && !SEM_ACENTO(fr.x).split(/[^a-z0-9]+/).includes(SEM_ACENTO(x.termo)));
  const dist = embaralha(pool, `fr${idx}`).slice(0, 3);
  if (dist.length < 3) { puladas.push(`${fr.cod} p${fr.pagina}: “${alvo.t}” sem 3 distratores da mesma classe`); return; }
  add({ i: `${fr.cod}${fr.pagina}-l${idx}`, a: v.assunto, t: 'lacuna', n: nivelPorTamanho(fr.x), q, r: v.termo, o: dist.map((x) => x.termo), c: fr.x.slice(0, 70), k: 'livro' }, fr.cod, fr.pagina, [fr.x]);
  const co = copiaConfere(fr.cod, fr.pagina, fr.x); if (co === false) rejeitados.push({ id: `${fr.cod}${fr.pagina}-l${idx}`, motivo: 'a segunda cópia do PDF não tem a mesma frase', f: [fr.cod, fr.pagina] });
});
puladas.push('caderno de atividades: são folhas de exercício (grades de caça-palavras e cruzadinhas sem gabarito em texto); nenhum item gerado (as pistas não têm resposta única verificável no texto)');

/* ---------- gravação ---------- */
const bons = aceito.filter((it) => !rejeitados.some((r) => r.id === it.i));
fs.mkdirSync(OUT, { recursive: true });
const porAssunto = {}; for (const it of bons) (porAssunto[it.a] ||= []).push(it);
const indice = { gerado: 'por scripts/gera-banco.mjs', total: bons.length, assuntos: {}, pdfs: NOME_PDF };
for (const [a, lista] of Object.entries(porAssunto)) {
  fs.writeFileSync(path.join(OUT, `${a}.json`), JSON.stringify(lista));
  indice.assuntos[a] = { total: lista.length, nivel: { f: lista.filter((x) => x.n === 'f').length, m: lista.filter((x) => x.n === 'm').length, d: lista.filter((x) => x.n === 'd').length }, tipo: Object.fromEntries(['definicao', 'lacuna', 'vf'].map((t) => [t, lista.filter((x) => x.t === t).length])) };
}
fs.writeFileSync(path.join(OUT, 'indice.json'), JSON.stringify(indice));

/* ---------- folha de conferência ---------- */
const amostra = embaralha(bons, 'amostra').slice(0, 30);
const nomeAss = { ritmo: 'ritmo', teoria: 'teoria', cordas: 'cordas', dicionario: 'dicionário (banda, estúdio, jeito de falar)' };
const linhas = [];
linhas.push('# Banco de conteúdo verificado (folha de conferência)', '', `Gerado por \`scripts/gera-banco.mjs\` a partir dos PDFs da Bea. **${bons.length} itens** em ${Object.keys(porAssunto).length} assuntos.`, '',
  'Cada item vem de um trecho dos PDFs por transformação mecânica (definição ↔ termo, lacuna, verdadeiro/falso). Antes de entrar, o trecho é procurado de novo, palavra por palavra (janelas de 5 palavras), no texto da página do PDF; se não achar, é rejeitado. As respostas erradas (distratores) vêm de outros itens do mesmo assunto e não podem aparecer no enunciado, dividir palavra com a resposta nem ter explicação parecida (Jaccard ≥ 0,15).', '',
  '**O que isso garante e o que não garante:** garante que o texto do item está nos PDFs. Não garante que uma resposta errada nunca possa ser “também certa” em casos raros (por exemplo termos quase sinônimos) — por isso a amostra abaixo é pra você bater o olho.', '',
  '## Contagem por assunto e nível (f = fácil · m = médio · d = difícil)', '', '| assunto | total | f | m | d | definição | lacuna | v/f |', '|---|---|---|---|---|---|---|---|');
for (const [a, r] of Object.entries(indice.assuntos)) linhas.push(`| ${nomeAss[a] || a} | ${r.total} | ${r.nivel.f} | ${r.nivel.m} | ${r.nivel.d} | ${r.tipo.definicao} | ${r.tipo.lacuna} | ${r.tipo.vf} |`);
const porPdf = {}; for (const it of bons) porPdf[it.f[0]] = (porPdf[it.f[0]] || 0) + 1;
linhas.push('', '## Itens por PDF', '', '| PDF | itens |', '|---|---|', ...Object.entries(NOME_PDF).map(([k, n]) => `| ${n} | ${porPdf[k] || 0} |`));
linhas.push('', '## Como os jogos usam o banco', '', '- **Quiz, caça-palavras e cruzadinha** (aba Jogos e portas da Fuga): os itens de uma palavra só (4 a 11 letras) entram junto com as dicas do método. No quiz, as 3 respostas erradas são as do próprio banco (nunca sorteadas de outro item).', '- **Fuga, trilhas:** a trilha de ritmo, teoria ou cordas filtra o banco pelo assunto; a geral e a infinita usam tudo (inclui o dicionário).', '- **Memória, pesca e mira (Fuga):** pares termo ↔ inglês e figura ↔ valor, e perguntas curtas do banco. Os pares de texto escritos antes à mão só entram se o banco tiver pouco da área (cordas, por enquanto). Os desenhos das figuras na memória são arte do app e continuam.', '- Sem internet o banco funciona: os arquivos ficam no cache do app (assets/jogos/banco).');
linhas.push('', '## Regra de nível (determinística)', '', '- cartas do dicionário: pelo tamanho da explicação (até 70 caracteres = fácil, até 110 = médio, mais = difícil); tradução pro inglês: termo de uma palavra = fácil, mais de uma = médio.', '- cartas de instrumentos: pela fase da carta (fases 1–2 fácil, 3–4 médio, 5–6 difícil).', '- livros: figuras pela ordem (semibreve, mínima, semínima = fácil; colcheia, semicolcheia = médio; o resto = difícil); frases pelo tamanho, como nas cartas.');
linhas.push('', '## Assunto de cada fonte', '', '- Dicionário: BATERIA → ritmo · TEORIA e TECLADO → teoria · VIOLÃO → cordas · BANDA E PALCO, ESTÚDIO E EQUIPAMENTO, COMO O MÚSICO FALA → dicionário.', '- Instrumentos: bateria → ritmo · teclado → teoria · violão → cordas.', '- Livros: figuras → ritmo; frases com lacuna seguem o assunto do termo apagado.');
linhas.push('', '## O que ficou de fora', '', `- ${rejeitados.length} itens rejeitados na verificação${rejeitados.length ? ' (veja abaixo)' : ''}.`, `- ${puladas.length} trechos pulados (distratores inseguros, texto longo demais etc.):`, '', ...puladas.slice(0, 80).map((p) => `  - ${p}`));
if (rejeitados.length) linhas.push('', '### Rejeitados', '', ...rejeitados.map((r) => `- ${r.id}: ${r.motivo} (${r.f.join(' p.')})`));
if (dicDiferentes) linhas.push('', `- Atenção: a segunda cópia do dicionário tem ${dicDiferentes} cartas com título diferente.`);
linhas.push('', '## 30 perguntas sorteadas pra você conferir', '');
amostra.forEach((it, n) => {
  const nm = NOME_PDF[it.f[0]]; const pg = `${nm}, p. ${it.f[1]}`;
  if (it.t === 'vf') linhas.push(`${n + 1}. **[v/f · ${it.a} · ${it.n}]** “${it.q}” → **${it.r ? 'verdadeiro' : 'falso'}** — fonte: ${pg}`);
  else linhas.push(`${n + 1}. **[${it.t} · ${it.a} · ${it.n}]** ${it.q} → **${it.r}** (erradas: ${it.o.join(' · ')}) — fonte: ${pg}`);
});
fs.mkdirSync('docs', { recursive: true }); fs.writeFileSync('docs/BANCO-CONTEUDO.md', linhas.join('\n') + '\n');
console.log(JSON.stringify({ total: bons.length, rejeitados: rejeitados.length, puladas: puladas.length, assuntos: Object.fromEntries(Object.entries(indice.assuntos).map(([a, r]) => [a, r.total])), porPdf }));
