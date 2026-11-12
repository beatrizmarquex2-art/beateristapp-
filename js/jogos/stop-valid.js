// STOP musical: banco de respostas e validação. Puro (sem DOM), exceto o cadastro local de respostas aprovadas na revisão (localStorage).
// Pipeline: normalizar → tirar artigo inicial → conferir a letra → reconhecer na categoria → classificar (válida / inválida / pendente).
import { LINES as TEORIA } from './stop-bank-teoria.js';
import { LINES as CULTURA } from './stop-bank-cultura.js';
import { LINES as EXTRA } from './stop-bank-extra.js';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V'];
/** As 12 categorias oficiais. `grupo` serve pro sorteio de categorias variar entre instrumentos, teoria e cultura. */
export const CATS = [
  { id: 'instrumento', label: 'instrumento musical e derivados (pad, tubos sonoros, peças da bateria, sinos melódicos, percussão)', grupo: 'instrumentos' },
  { id: 'percussao', label: 'peças da bateria e instrumentos de percussão', grupo: 'instrumentos' },
  { id: 'equipamento', label: 'acessórios e equipamentos (baqueta, cabo, palheta, afinador, pedal, mesa de som, caixa de som…)', grupo: 'instrumentos' },
  { id: 'estilo', label: 'estilo musical', grupo: 'teoria' },
  { id: 'profissao', label: 'profissão da música', grupo: 'teoria' },
  { id: 'tecnica', label: 'técnicas musicais', grupo: 'teoria' },
  { id: 'cantor', label: 'cantor ou cantora (nacional ou internacional, solo, de dupla ou de banda: só um)', grupo: 'cultura' },
  { id: 'banda', label: 'banda ou grupo (nacional ou internacional: só um)', grupo: 'cultura' },
  { id: 'musica', label: 'nome de música (qualquer uma)', grupo: 'cultura' },
  { id: 'album', label: 'álbum musical', grupo: 'cultura' },
  { id: 'brasileiro', label: 'artista brasileiro', grupo: 'cultura' },
  { id: 'marca', label: 'marca de instrumentos musicais', grupo: 'instrumentos' },
];
export const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));
export const MIN_CATS = 5; export const MAX_CATS = 8;
// pares que se confundem de verdade (um título pode ser álbum e música; um artista pode ser cantor e brasileiro...): nunca viram "inválida" só por isso
const AMBIG = [['musica', 'album'], ['cantor', 'brasileiro'], ['banda', 'brasileiro'], ['instrumento', 'percussao'], ['percussao', 'equipamento'], ['instrumento', 'equipamento'], ['cantor', 'banda'], ['marca', 'equipamento'], ['musica', 'banda'], ['musica', 'cantor'], ['album', 'banda'], ['album', 'cantor'], ['estilo', 'tecnica'], ['profissao', 'cantor']];
const ambig = (a, b) => AMBIG.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/* ---------- normalização ---------- */
const ARTICLE = /^(o|a|os|as|um|uma|the|an)\s+(?=\S)/; // "A-ha" não casa (o "a" vem colado no hífen)
/** minúsculas, sem acento, sem pontuação solta, espaços únicos (o hífen vira espaço) */
export function normalize(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
/** tira UM artigo inicial (O, A, Os, As, Um, Uma, The, An) */
export const stripArticle = (n) => n.replace(ARTICLE, '');
/** o texto como a regra enxerga: normalizado, sem artigo, com hífen virando espaço */
export const clean = (s) => stripArticle(normalize(s)).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
/** chave de comparação: sem espaços ("hi-hat", "hi hat" e "hihat" são a mesma) */
export const keyOf = (s) => clean(s).replace(/\s/g, '');
/** primeira letra do texto (já sem artigo); '' se não tiver */
export const initialOf = (s) => { const m = clean(s).match(/[a-z]/); return m ? m[0].toUpperCase() : ''; };

/* ---------- banco ---------- */
const CUSTOM_KEY = 'beaterista-stop-custom';
const readCustom = () => { try { const v = JSON.parse(localStorage.getItem(CUSTOM_KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
let custom = readCustom();
const idx = new Map(); // catId -> Map(chave -> { id, name })
const letters = new Map(); // catId -> Set(letras que têm resposta)
function put(cat, line) {
  const parts = String(line).split('|').map((x) => x.trim()).filter(Boolean); if (!parts.length) return;
  const id = `${cat}:${keyOf(parts[0])}`; const m = idx.get(cat) || new Map(); idx.set(cat, m); const ls = letters.get(cat) || new Set(); letters.set(cat, ls);
  for (const p of parts) { const k = keyOf(p); if (k && !m.has(k)) m.set(k, { id, name: parts[0] }); const l = initialOf(p); if (l) ls.add(l); }
}
for (const [cat, list] of Object.entries({ ...TEORIA, ...CULTURA })) if (CAT[cat]) list.forEach((l) => put(cat, l));
// categorias fixas: "instrumento musical e derivados" aceita também as peças da bateria e a percussão; os complementos da Bea entram aqui
(TEORIA.percussao || []).forEach((l) => put('instrumento', l));
for (const [cat, list] of Object.entries(EXTRA)) list.forEach((l) => put(cat, l));
custom.forEach((c) => put(c.cat, [c.name, ...(c.aliases || [])].join('|')));
/** Guarda uma resposta aprovada na revisão (fica neste aparelho). */
export function addCustom(cat, name, aliases = []) {
  if (!CAT[cat] || !clean(name)) return false;
  custom.push({ cat, name: String(name).slice(0, 80), aliases: aliases.map((a) => String(a).slice(0, 80)), at: Date.now() }); custom = custom.slice(-500);
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch { /* sem armazenamento: vale só nesta sessão */ }
  put(cat, [name, ...aliases].join('|')); return true;
}
export const bankSize = () => Object.fromEntries(CATS.map((c) => [c.id, (idx.get(c.id) || new Map()).size]));
/** Letras (das 16) em que TODAS as categorias escolhidas têm pelo menos uma resposta cadastrada. */
export const eligibleLetters = (cats) => LETTERS.filter((l) => cats.every((c) => (letters.get(c) || new Set()).has(l)));
export const coverage = (cat) => LETTERS.filter((l) => (letters.get(cat) || new Set()).has(l));

/* ---------- reconhecimento ---------- */
function lev(a, b, max) { // distância de edição com troca de letras vizinhas ("bateira" ~ "bateria" = 1)
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let pp = null; let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let low = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
      cur[j] = v; if (v < low) low = v;
    }
    if (low > max && !(pp && Math.min(...pp) + 1 <= max)) return max + 1; pp = prev; prev = cur;
  }
  return prev[b.length];
}
/** Chave mais parecida no banco da categoria, só se for uma e só (diferença de 1 letra em palavras de 5+, de 2 em 9+). */
function closest(cat, k, letter) {
  const max = k.length >= 9 ? 2 : k.length >= 5 ? 1 : 0; if (!max) return null;
  const m = idx.get(cat); if (!m) return null; let best = null; let bestD = max + 1; let tie = false;
  for (const [key, e] of m) {
    if (key[0] !== k[0] && key[0] !== letter.toLowerCase()) continue;
    const d = lev(k, key, max); if (d > max) continue;
    if (d < bestD) { best = e; bestD = d; tie = false; } else if (d === bestD && e.id !== best.id) tie = true;
  }
  return best && !tie ? best : null;
}
/**
 * Classifica uma resposta. Devolve { status: 'valida'|'invalida'|'pendente', canon, name?, why, suggest? }.
 * `canon` identifica a resposta para comparar entre jogadores (chimbal e hi-hat dão o mesmo).
 */
export function recognize(text, cat, letter) {
  const k = keyOf(text);
  if (!k) return { status: 'invalida', canon: '', why: 'vazia', empty: true };
  const ini = initialOf(text);
  if (ini !== letter) return { status: 'invalida', canon: '', why: `não começa com ${letter}` };
  const hit = (idx.get(cat) || new Map()).get(k);
  if (hit) return { status: 'valida', canon: hit.id, name: hit.name, why: 'reconhecida' };
  const others = [...idx].filter(([c, m]) => c !== cat && m.has(k)).map(([c]) => c);
  if (others.length && !others.some((o) => ambig(o, cat))) return { status: 'invalida', canon: '', why: `parece ser de outra categoria (${CAT[others[0]].label})` };
  const near = closest(cat, k, letter);
  if (near) return { status: 'pendente', canon: `${cat}:${k}`, why: 'confira a grafia', suggest: near.name, suggestId: near.id };
  return { status: 'pendente', canon: `${cat}:${k}`, why: 'não reconhecida: aguardando revisão' };
}
