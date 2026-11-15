// Lógica do álbum de figurinhas (sem tela): pacotes, sorteio, colar, contagem. Tudo determinístico e idempotente:
// o mesmo pacote (mesmo id) sempre dá as mesmas figurinhas e nunca é entregue nem aberto duas vezes.
import { rng, hashSeed } from './ornaments.js';

export const PACK_SIZE = 3; // pacote comum e prêmio de jogo: 3 figurinhas (a roleta dá de 1 a 3)
export const TOTAL_FIGURINHAS = 146; // 125 do catálogo original + 13 do Paul (catalogo-paul.json) + 8 fotos novas da Bea (catalogo-bea.json)
export const ESTRELAS_POR_ROLETA = 15; // a cada 15 estrelas (somando todos os jogos) libera uma roleta
/** Roleta: 1 a 3 figurinhas; raramente (4%) uma exclusiva da Beaterista; às vezes Beatlemania e rara. */
export const ROLETA_PESOS = [['Comum', 62], ['Raras', 16], ['Beatlemania', 18], ['Beaterista', 4]];
export const ROLETA_QTD = [[1, 45], [2, 35], [3, 20]]; // a roleta dá de 1 a 3 figurinhas (peso de cada quantidade)
/** Prêmio de terminar um jogo inteiro: 3 figurinhas tops (exclusivas da Beaterista e raras). */
/** Pacotes da pauLta: id `pl:<cartas>:<chance de Beaterista %>:...`. Qualquer outro pacote comum tem PACK_SIZE cartas. */
export const plPack = (id) => { const m = /^pl:(\d+):(\d+):/.exec(String(id)); return m ? { n: Number(m[1]), bea: Number(m[2]) } : null; };
/** Pacotinhos de FIM de modo da pauLta (pedido da Bea): `plf:<drumF|drumI|drumD>:<a|b|c>:...` = 2 cartas cada; os 3 juntos dão 2 Beatles + 3 comuns + 1 especial
 *  (fácil = rara, médio = do robô Paul, difícil = exclusiva da Bea). a = Beatles + comum, b = Beatles + comum, c = comum + a especial. */
export const plfPack = (id) => { const m = /^plf:(drum[FID]):([abc]):/.exec(String(id)); return m ? { modo: m[1], k: m[2] } : null; };
export const packSize = (id) => (plPack(id) ? plPack(id).n : plfPack(id) ? 2 : String(id).startsWith('semana:') ? 1 : PACK_SIZE);
export const packKind = (id) => (String(id).startsWith('roleta:') ? 'roleta' : String(id).startsWith('jogo:') ? 'jogo' : 'pacote');
export const WEIGHTS = { Comum: 80, Rara: 17, Exclusiva: 3 }; // chance de cada figurinha do pacote ser dessa raridade
// Seções do álbum (cada figurinha está em UMA): Beatlemania = coleção Beatles; Beaterista = as da Bea; Raras = raridade Rara (fora Beatles/Beaterista); Comum = o resto.
/** Nome que aparece pra cada raridade. Os Beatles NÃO são "comum": o nome deles é Beatlemania. (Os outros nomes podem ser trocados aqui quando a Bea escolher a lista nova.) */
export const NOME_RARIDADE = { Comum: 'Comum', Rara: 'Rara', Exclusiva: 'Exclusiva' };
export const ehBeatles = (e) => !!e && (e.colecao === 'Beatles' || e.secao === 'Beatlemania');
export const nomeRaridade = (e) => (ehBeatles(e) ? 'Beatlemania' : NOME_RARIDADE[e && e.raridade] || (e && e.raridade) || '');
export const SECOES = ['Beatlemania', 'Beaterista', 'Comum', 'Raras'];
export const SECAO_ANTIGA = { Beatles: 'Beatlemania', Geral: 'Comum', Especial: 'Raras' }; // links e abas de antes
export const COLECOES = SECOES;
export const emptyState = () => ({ v: 1, inv: {}, pasted: {}, granted: [], opened: {}, reduzir: false });

const clone = (s) => ({ ...emptyState(), ...s, inv: { ...(s.inv || {}) }, pasted: { ...(s.pasted || {}) }, granted: [...(s.granted || [])], opened: { ...(s.opened || {}) } });

/** Check-in: 1 giro grátis da roleta por dia (id fixo por dia: abrir o álbum de novo não entrega outro). */
export const checkinId = (dateKey) => `roleta:dia:${dateKey}`;
/** Check-in da semana (pedido da Bea): 7 dias SEGUIDOS entrando no Álbum = pacote com 1 exclusiva da Bea + 10 ★ + festa. Faltou um dia: recomeça.
 *  `sem` = { ult: 'AAAA-MM-DD', seq: dias seguidos (0 a 6), ciclo: semanas completas }. Puro: devolve o novo estado e se completou a semana agora. */
export const SEMANA_DIAS = 7; export const SEMANA_ESTRELAS = 10;
const diaAntes = (k) => { const [y, m, d] = String(k).split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d - 1)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
export function checkinSemana(sem, dateKey) {
  const s = { ult: '', seq: 0, ciclo: 0, ...(sem || {}) };
  if (s.ult === dateKey) return { sem: s, completou: false };
  const seq = s.ult === diaAntes(dateKey) ? (s.seq | 0) + 1 : 1;
  if (seq >= SEMANA_DIAS) return { sem: { ult: dateKey, seq: 0, ciclo: (s.ciclo | 0) + 1, completada: dateKey }, completou: true };
  return { sem: { ult: dateKey, seq, ciclo: s.ciclo | 0 }, completou: false };
}
export const semanaPackId = (ciclo) => `semana:${ciclo}`;

/** Entrega um pacote (uma vez só por id). */
export function grantPack(state, id) {
  if (state.granted?.includes(id) || state.opened?.[id]) return state;
  const s = clone(state); s.granted.push(id); return s;
}
export const pendingPacks = (state) => (state.granted || []).filter((id) => !state.opened?.[id]);

const pickWeighted = (r, pesos) => { const t = pesos.reduce((a, [, w]) => a + w, 0); let x = r() * t; for (const [k, w] of pesos) { if (x < w) return k; x -= w; } return pesos[0][0]; };
/** Sorteia `n` códigos distintos, cada um de uma seção escolhida pelos pesos (mesma seed = mesmo resultado). */
function drawBySection(catalog, r, n, pesos) {
  const by = {}; for (const c of catalog) (by[c.secao] ||= []).push(c.codigo);
  const out = []; let guard = 0;
  while (out.length < n && guard++ < 500) { const pool = by[pickWeighted(r, pesos)] || []; const c = pool[Math.floor(r() * pool.length)]; if (c && !out.includes(c)) out.push(c); }
  return out;
}
/** Sorteio do pacote. `roleta:*` = 1 a 3 figurinhas; `jogo:*` = pacote de 3 com 1 rara garantida; o resto = pacote de 3 por raridade. Mesma seed = mesmas figurinhas. */
export function drawPack(catalog, packId, size = PACK_SIZE, salt = '') {
  const r = rng(hashSeed(`pack|${packId}${salt ? `|${salt}` : ''}`)); const kind = packKind(packId);
  if (String(packId).startsWith('dado:')) { const c = String(packId).split(':')[1].split(','); return c.filter((x) => catalog.some((y) => y.codigo === x)); } // presente da Bea: cartas escolhidas
  if (String(packId).startsWith('semana:')) { const ex = catalog.filter((c) => c.secao === 'Beaterista' && /^F/.test(c.codigo)).map((c) => c.codigo); return ex.length ? [ex[Math.floor(r() * ex.length)]] : []; } // 1 exclusiva da Bea
  const plf = plfPack(packId);
  if (plf) {
    const sec = (s, ok = () => true) => catalog.filter((c) => c.secao === s && ok(c)).map((c) => c.codigo); const um = (lista, fora = []) => { const l = lista.filter((x) => !fora.includes(x)); const pool = l.length ? l : lista; return pool.length ? pool[Math.floor(r() * pool.length)] : null; };
    const especial = plf.modo === 'drumF' ? () => um(sec('Raras')) : plf.modo === 'drumI' ? (f) => um(sec('Beaterista', (c) => /^P/.test(c.codigo)), f) : (f) => um(sec('Beaterista', (c) => /^F/.test(c.codigo)), f);
    const out = plf.k === 'c' ? [um(sec('Comum'))] : [um(sec('Beatlemania')), um(sec('Comum'))];
    if (plf.k === 'c') out.push(especial(out)); return out.filter(Boolean);
  }
  const pl = plPack(packId);
  if (pl) return drawBySection(catalog, r, pl.n, [['Comum', 62], ['Raras', 16], ['Beatlemania', 18], ['Beaterista', pl.bea]].filter(([, w]) => w > 0));
  if (kind === 'roleta') return drawBySection(catalog, r, pickWeighted(r, ROLETA_QTD), ROLETA_PESOS);
  if (kind === 'jogo') { // prêmio de jogo completo: 1 pacote de 3 com uma RARA garantida
    const raras = catalog.filter((c) => c.raridade === 'Rara').map((c) => c.codigo); const garantida = raras[Math.floor(r() * raras.length)];
    const out = garantida ? [garantida] : []; let guard = 0; const by = {}; for (const c of catalog) (by[c.raridade] ||= []).push(c.codigo); const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    while (out.length < size && guard++ < 800) { let x = r() * total, rar = 'Comum'; for (const [k, w] of Object.entries(WEIGHTS)) { if (x < w) { rar = k; break; } x -= w; } const pool = by[rar]; if (!pool?.length) continue; const c = pool[Math.floor(r() * pool.length)]; if (!out.includes(c)) out.push(c); }
    return out;
  }
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); const out = [];
  const by = {}; for (const c of catalog) (by[c.raridade] ||= []).push(c.codigo);
  while (out.length < size) {
    let x = r() * total, rar = 'Comum';
    for (const [k, w] of Object.entries(WEIGHTS)) { if (x < w) { rar = k; break; } x -= w; }
    const pool = by[rar]; if (!pool?.length) continue;
    out.push(pool[Math.floor(r() * pool.length)]);
  }
  return out;
}
/**
 * Sem figurinha repetida (pedido da Bea): troca cada carta que o aluno JÁ TEM (colada ou na mão), ou que veio duas vezes no mesmo pacote,
 * por uma que ainda falta. Procura primeiro do mesmo tipo (mesma seção e mesma letra do código), depois da mesma seção, depois qualquer uma que falte.
 * Se faltam menos cartas do que o pacote traria, o pacote vem menor. Só repete quando o álbum inteiro já está completo. `tem` = Set dos códigos que o aluno já tem; `r` = gerador de números (0 a 1).
 */
/** Degrau de raridade da carta: comum 0, Beatlemania 1, rara 2, exclusiva da Beaterista 3. */
export const degrau = (e) => (!e ? 0 : e.raridade === 'Exclusiva' ? 3 : e.raridade === 'Rara' ? 2 : ehBeatles(e) ? 1 : 0);
/**
 * De onde sai a carta que entra no lugar de uma repetida (pedido da Bea: troca pela MESMA raridade).
 * 1º a mesma raridade (mesmo tipo de carta quando dá); se dessa raridade já não falta nenhuma, a mais alta que falta ABAIXO dela.
 * Nunca sobe de raridade: repetida comum não vira rara nem exclusiva. Sem nada pra pôr no lugar devolve undefined.
 */
export function poolTroca(livres, e, code, sobe = false) {
  const d = degrau(e); const mesma = livres.filter((c) => degrau(c) === d);
  if (mesma.length) return [mesma.filter((c) => e && c.secao === e.secao && c.codigo[0] === code[0]), mesma.filter((c) => e && c.secao === e.secao), mesma].find((l) => l.length);
  for (let k = d - 1; k >= 0; k--) { const l = livres.filter((c) => degrau(c) === k); if (l.length) return l; }
  if (sobe) for (let k = d + 1; k <= 3; k++) { const l = livres.filter((c) => degrau(c) === k); if (l.length) return l; } // pacote NOVO: melhor uma carta mais rara do que vir repetida ou vazio
  return undefined;
}
export function semRepetir(catalog, codes, tem, r = Math.random) {
  const by = Object.fromEntries(catalog.map((c) => [c.codigo, c])); const usados = new Set(tem); const out = [];
  for (const code of codes) {
    if (!usados.has(code)) { usados.add(code); out.push(code); continue; }
    const e = by[code]; const livres = catalog.filter((c) => !usados.has(c.codigo));
    const pool = poolTroca(livres, e, code, true);
    if (!pool) continue; // não sobrou carta nova: o pacote vem menor em vez de trazer repetida
    const novo = pool[Math.floor(r() * pool.length)].codigo; usados.add(novo); out.push(novo);
  }
  return out.length ? out : [...new Set(codes)]; // álbum completo: aí o pacote vem como foi sorteado
}
/**
 * Quem já tinha figurinha repetida (de antes da regra "sem repetir"): cada cópia a mais vira uma carta NOVA que ainda falta (pedido da Bea).
 * Percorre os pacotes já abertos em ordem; a 1ª vez de cada carta fica, as repetidas são trocadas (mesmo tipo quando dá). Presentes da Bea (`dado:`) não mudam.
 * Só sobra repetida se o álbum inteiro já estiver completo. Devolve { state, trocadas } (o mesmo state se não havia nada pra trocar).
 */
export function trocarRepetidas(state, catalog) {
  if (!repeated(state)) return { state, trocadas: 0 };
  const s = clone(state); if (!s.seed) s.seed = Math.random().toString(36).slice(2, 12);
  const by = Object.fromEntries(catalog.map((c) => [c.codigo, c])); const r = rng(hashSeed(`trocarep|${s.seed}`)); const ids = Object.keys(s.opened).sort();
  // `tem` = tudo que o aluno já tem em qualquer pacote ou colado (a carta nova nunca pode ser uma dessas); `vistos` = as que já apareceram nesta passada
  const tem = new Set([...Object.keys(s.pasted || {}), ...Object.keys(s.inv || {}), ...ids.flatMap((id) => s.opened[id] || [])]);
  const vistos = new Set(); for (const id of ids) if (String(id).startsWith('dado:')) for (const c of s.opened[id] || []) vistos.add(c); // os presentes contam como "já tem"
  const opened = {}; let trocadas = 0;
  for (const id of ids) {
    const codes = s.opened[id] || []; if (String(id).startsWith('dado:')) { opened[id] = codes; continue; }
    opened[id] = codes.map((code) => {
      if (!vistos.has(code)) { vistos.add(code); return code; }
      const e = by[code]; const livres = catalog.filter((c) => !tem.has(c.codigo));
      const pool = poolTroca(livres, e, code);
      if (!pool) return code; // álbum completo: não tem o que pôr no lugar
      if ((s.inv[code] || 0) <= 0) return code; // essa cópia não está na mão (dado antigo): não mexe
      const novo = pool[Math.floor(r() * pool.length)].codigo; vistos.add(novo); tem.add(novo); trocadas++;
      s.inv[code] -= 1; if (s.inv[code] <= 0) delete s.inv[code]; s.inv[novo] = (s.inv[novo] || 0) + 1; return novo; // sai a repetida da mão, entra a nova
    });
  }
  if (!trocadas) return { state, trocadas: 0 };
  s.opened = opened; return { state: s, trocadas };
}
/** Abre o pacote: as figurinhas vão pra "mão" (ainda não coladas). Abrir de novo o mesmo id não faz nada. */
export function openPack(state, catalog, packId) {
  if (!state.granted?.includes(packId) || state.opened?.[packId]) return { state, codes: state.opened?.[packId] || null, fresh: false };
  const s = clone(state); if (!s.seed) s.seed = Math.random().toString(36).slice(2, 12); let codes = drawPack(catalog, packId, PACK_SIZE, s.seed); // sorteio diferente pra cada aluno
  if (!String(packId).startsWith('dado:')) codes = semRepetir(catalog, codes, new Set([...Object.keys(s.inv).filter((c) => s.inv[c] > 0), ...Object.keys(s.pasted)]), rng(hashSeed(`troca|${packId}|${s.seed}`))); // presente da Bea (cartas escolhidas) vem como ela mandou
  s.opened[packId] = codes; for (const c of codes) s.inv[c] = (s.inv[c] || 0) + 1;
  return { state: s, codes, fresh: true };
}
export const canPaste = (state, code) => (state.inv?.[code] || 0) > 0 && !state.pasted?.[code];
/** Cola uma figurinha no álbum. Se já está colada, a outra fica como repetida na mão. */
export function paste(state, code) {
  if (!canPaste(state, code)) return state;
  const s = clone(state); s.inv[code] -= 1; if (s.inv[code] <= 0) delete s.inv[code]; s.pasted[code] = true; return s;
}
export const pasteAll = (state) => Object.keys(state.inv || {}).reduce((s, c) => paste(s, c), state);
export const repeated = (state) => Object.entries(state.inv || {}).reduce((n, [c, k]) => n + (state.pasted?.[c] ? k : Math.max(0, k - 1)), 0);
export const inHand = (state) => Object.values(state.inv || {}).reduce((a, b) => a + b, 0);

/** Contagem de uma coleção (ou de todas): coladas, total, faltantes. */
export function stats(state, catalog, secao = null) {
  const list = secao ? catalog.filter((c) => c.secao === secao) : catalog;
  const got = list.filter((c) => state.pasted?.[c.codigo]).length;
  return { total: list.length, got, missing: list.length - got };
}
/** Número do espaço no álbum (1..N dentro da coleção, na ordem do catálogo). */
export const slotNumber = (catalog, entry) => catalog.filter((c) => c.secao === entry.secao).findIndex((c) => c.codigo === entry.codigo) + 1;
export const artistsOf = (catalog, secao) => [...new Set(catalog.filter((c) => c.secao === secao).map((c) => c.artista_banda))].sort((a, b) => a.localeCompare(b, 'pt'));

/** Cópias que sobram na mão = (vezes que a figurinha saiu nos pacotes abertos) - (1 se já está colada). Sempre dá pra recalcular, então juntar dois aparelhos nunca erra. */
export function deriveInv(opened, pasted) {
  const inv = {};
  for (const codes of Object.values(opened || {})) for (const c of codes || []) inv[c] = (inv[c] || 0) + 1;
  for (const c of Object.keys(pasted || {})) if (inv[c]) { inv[c] -= 1; if (inv[c] <= 0) delete inv[c]; }
  return inv;
}
/** Junta o progresso de dois aparelhos: pacotes abertos, pacotes recebidos e figurinhas coladas são a união (nunca apaga nada). */
export function mergeStates(a, b) {
  const A = { ...emptyState(), ...(a || {}) }, B = { ...emptyState(), ...(b || {}) };
  const opened = { ...A.opened, ...B.opened }, pasted = { ...A.pasted, ...B.pasted };
  return { ...emptyState(), opened, pasted, granted: [...new Set([...(A.granted || []), ...(B.granted || [])])].sort(), reduzir: !!(A.reduzir || B.reduzir), inv: deriveInv(opened, pasted) };
}
export const sameProgress = (a, b) => JSON.stringify([Object.keys(a.pasted || {}).sort(), Object.keys(a.opened || {}).sort(), [...(a.granted || [])].sort()]) === JSON.stringify([Object.keys(b.pasted || {}).sort(), Object.keys(b.opened || {}).sort(), [...(b.granted || [])].sort()]);
