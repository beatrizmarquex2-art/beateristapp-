// As 30 dicas viram jogos (quiz, caça-palavras, cruzadinha, embaralhada): daqui saem a palavra-chave de cada dica,
// as pistas e as grades. Puro (sem tela). Os textos das dicas moram no Supabase privado da Bea (registros "tip"),
// então nada daqui guarda texto de dica: tudo é calculado em cima do que chega.

export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const STOP = new Set(('A O AS OS UM UMA UNS UMAS DE DO DA DOS DAS EM NO NA NOS NAS POR PARA COM SEM SOBRE ENTRE ATE APOS ANTE QUE QUANDO COMO MAIS MENOS MUITO MUITA MUITOS MUITAS POUCO POUCA JA SO TAMBEM AINDA CADA TODO TODA TODOS TODAS ISSO ISTO ESSE ESSA ESSES ESSAS ESTE ESTA ESTES ESTAS AQUELE AQUELA SEU SUA SEUS SUAS MEU MINHA NOSSO NOSSA VOCE VOCES ELE ELA ELES ELAS NAO SIM SER ESTAR TER HA FOI SAO ERA VAI VAO PODE PODEM DEVE DEVEM FAZER FAZ FAZENDO FICAR FICA FICAM SEMPRE NUNCA DEPOIS ANTES DURANTE ENQUANTO ONDE PORQUE POIS MAS OU E SE NEM QUER QUERO TUDO NADA ALGO ALGUEM OUTRO OUTRA OUTROS OUTRAS MESMO MESMA TAL TANTO TANTA ASSIM ENTAO AQUI ALI LA BEM MAL MELHOR PIOR PRIMEIRO PRIMEIRA SEGUNDO SEGUNDA PRECISA PRECISO PRECISAM VEZ VEZES COISA COISAS JEITO PARTE PARTES FORMA QUALQUER ALGUMA ALGUM ALGUMAS ALGUNS SENDO SERA SERIA TEM TENHA TEMOS TIVER VAMOS VEM VER VEJA TOQUE TOCAR TOCA USE USAR USA FACA FACO DEIXE DEIXA PENSE PENSA TENTE TENTA COMECE COMECA CONTINUE QUASE BASTA DEPENDE ONDE DENTRO FORA PERTO LONGE ACIMA ABAIXO LOGO PRIMEIRAMENTE APENAS SOMENTE PORQUE PORQUE NESSE NESSA NESTE NESTA DESSE DESSA DESTE DESTA NUM NUMA PELO PELA PELOS PELAS AOS AAS ALEM CONTRA SEGUNDO MEIO MEUS MINHAS ISSO AQUILO').split(' '));
// palavras do mundo da bateria: valem mais na hora de escolher a palavra-chave da dica
const MUSIC = new Set(('METRONOMO PULSO GROOVE RUDIMENTO RUDIMENTOS PARADIDDLE DINAMICA GHOST COMPASSO SEMICOLCHEIA COLCHEIA ANDAMENTO RITMO BAQUETA BAQUETAS REBOTE POSTURA RELAXAMENTO CONTAGEM BUMBO CAIXA CHIMBAL REPERTORIO LEITURA OUVIDO PARTITURA TEMPO CLICK ACENTO FIGURA PAUSA VIRADA LEVADA PRATO SURDO CONDUCAO GRAVAR GRAVACAO FOCO PRATICA ESTUDO DEVAGAR VELOCIDADE PRECISAO COORDENACAO INDEPENDENCIA MUSICALIDADE POCKET SINCOPE CONTRATEMPO FRASE SOLO AQUECIMENTO TECNICA CONSTANCIA REGULARIDADE DIARIO RELAXE ESCUTA MAOS PEDAL BATERIA PADRAO COMPASSOS SEMINIMA SUBDIVISAO ACENTUACAO FLAM DOBRADO TOQUE SIMPLES DUPLO INTERPRETACAO ESTUDAR TREINAR TREINO METAS OBJETIVO MEMORIA CONTROLE VOLUME SOM TIMBRE AFINACAO').split(' '));

/** Palavras (só letras) de um texto, na forma como aparecem e normalizadas (sem acento, maiúsculas). */
export function wordsOf(text) {
  const out = []; for (const m of String(text || '').matchAll(/\p{L}+/gu)) out.push({ shown: m[0], w: norm(m[0]) }); return out;
}

/** Candidatas a palavra-chave de cada dica, da melhor pra pior. `tips` = [{ n, text }]. */
export function candidates(tips, { min = 5, max = 11 } = {}) {
  const df = new Map(); // em quantas dicas cada palavra aparece (as que aparecem em todas não dizem nada)
  for (const t of tips) for (const w of new Set(wordsOf(t.text).map((x) => x.w))) df.set(w, (df.get(w) || 0) + 1);
  const out = new Map();
  for (const t of tips) {
    const seen = new Map();
    for (const x of wordsOf(t.text)) { if (x.w.length < min || x.w.length > max || STOP.has(x.w) || seen.has(x.w)) continue; seen.set(x.w, x.shown.toLowerCase()); }
    const list = [...seen.entries()].map(([w, shown]) => ({ w, shown, score: (MUSIC.has(w) ? 40 : 0) + Math.min(w.length, 9) + (df.get(w) <= 2 ? 6 : -4 * (df.get(w) - 2)) }));
    out.set(t.n, list.sort((a, b) => b.score - a.score || a.w.localeCompare(b.w)));
  }
  return out;
}

/** Uma palavra por dica, sem repetir entre dicas. `over` = { n: 'PALAVRA' } (a escolha da Bea vale mais). Devolve [{ n, text, w, shown, cands }]. */
export function keywords(tips, over = {}) {
  const cands = candidates(tips); const used = new Set(); const res = [];
  for (const t of tips) {
    const list = cands.get(t.n) || []; let pick = null;
    const want = over[t.n] && norm(over[t.n]);
    if (want) pick = list.find((c) => c.w === want) || null;
    if (!pick) pick = list.find((c) => !used.has(c.w)) || null;
    if (!pick) continue; // dica sem palavra boa: fica de fora dos jogos
    used.add(pick.w); res.push({ n: t.n, text: t.text, w: pick.w, shown: pick.shown, cands: list.slice(0, 8) });
  }
  return res;
}

/** A dica com a palavra-chave trocada por ____ (pista). Usa só a frase onde a palavra aparece, se a dica for longa. */
export function clueOf(item, { whole = false } = {}) {
  const blank = (s) => s.replace(/\p{L}+/gu, (m) => (norm(m) === item.w ? '_____' : m));
  const parts = item.text.split(/(?<=[.!?])\s+/);
  const hit = parts.find((p) => wordsOf(p).some((x) => x.w === item.w));
  return blank(whole || !hit ? item.text : hit);
}

/* ---------- caça-palavras ---------- */
export const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
/** Grade size×size com as palavras em linha reta (→ ↓ ↘ ↗). Devolve { size, grid, placed:[{w,x,y,dx,dy}] } (as que não couberam ficam de fora). */
export function wordsearch(words, size = 12, rnd = Math.random) {
  const grid = Array.from({ length: size }, () => Array(size).fill('')); const placed = [];
  const list = [...words].filter((w) => w.length <= size).sort((a, b) => b.length - a.length);
  for (const w of list) {
    let ok = false;
    for (let tries = 0; tries < 200 && !ok; tries++) {
      const [dx, dy] = DIRS[Math.floor(rnd() * DIRS.length)]; const x = Math.floor(rnd() * size); const y = Math.floor(rnd() * size);
      const ex = x + dx * (w.length - 1), ey = y + dy * (w.length - 1);
      if (ex < 0 || ex >= size || ey < 0 || ey >= size) continue;
      let fits = true; for (let i = 0; i < w.length; i++) { const c = grid[y + dy * i][x + dx * i]; if (c && c !== w[i]) { fits = false; break; } }
      if (!fits) continue;
      for (let i = 0; i < w.length; i++) grid[y + dy * i][x + dx * i] = w[i];
      placed.push({ w, x, y, dx, dy }); ok = true;
    }
  }
  const L = 'AAAEEEIIOOUBCDFGLMNPRSTV';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!grid[y][x]) grid[y][x] = L[Math.floor(rnd() * L.length)];
  return { size, grid, placed };
}
/** A seleção de (x0,y0) a (x1,y1) é uma linha reta? Devolve as casas [{x,y}] ou null. */
export function lineCells(x0, y0, x1, y1) {
  const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); const ax = Math.abs(x1 - x0), ay = Math.abs(y1 - y0);
  if (!(ax === 0 || ay === 0 || ax === ay) || (ax === 0 && ay === 0)) return null;
  const n = Math.max(ax, ay) + 1; return Array.from({ length: n }, (_, i) => ({ x: x0 + dx * i, y: y0 + dy * i }));
}

/* ---------- cruzadinha ---------- */
/** Encaixa as palavras cruzando letras. Tenta várias ordens e fica com a que colocou mais palavras. Devolve { w, h, entries:[{w,x,y,dir,n,idx}] }. */
export function crossword(words, rnd = Math.random, size = 15) {
  let best = null;
  for (let attempt = 0; attempt < 80; attempt++) {
    const order = words.map((w, idx) => ({ w, idx })).sort((a, b) => b.w.length - a.w.length + (rnd() - 0.5) * 3);
    const cells = new Map(); const at = (x, y) => cells.get(`${x},${y}`); const entries = [];
    const can = (w, x, y, dir) => {
      const dx = dir === 'h' ? 1 : 0, dy = dir === 'v' ? 1 : 0; let cross = 0;
      if (x < 0 || y < 0 || x + dx * (w.length - 1) >= size || y + dy * (w.length - 1) >= size) return -1;
      if (at(x - dx, y - dy) || at(x + dx * w.length, y + dy * w.length)) return -1;
      for (let i = 0; i < w.length; i++) {
        const cx = x + dx * i, cy = y + dy * i; const c = at(cx, cy);
        if (c) { if (c !== w[i]) return -1; cross++; continue; }
        if (at(cx + dy, cy + dx) || at(cx - dy, cy - dx)) return -1; // vizinho colado do lado
      }
      return cross;
    };
    const put = (w, x, y, dir, idx) => { const dx = dir === 'h' ? 1 : 0, dy = dir === 'v' ? 1 : 0; for (let i = 0; i < w.length; i++) cells.set(`${x + dx * i},${y + dy * i}`, w[i]); entries.push({ w, x, y, dir, idx }); };
    for (const { w, idx } of order) {
      if (!entries.length) { put(w, Math.floor((size - w.length) / 2), Math.floor(size / 2), 'h', idx); continue; }
      const opts = [];
      for (const dir of ['h', 'v']) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const c = can(w, x, y, dir); if (c > 0) opts.push({ x, y, dir, c }); }
      if (!opts.length) continue;
      const top = Math.max(...opts.map((o) => o.c)); const pool = opts.filter((o) => o.c === top); const o = pool[Math.floor(rnd() * pool.length)];
      put(w, o.x, o.y, o.dir, idx);
    }
    if (!best || entries.length > best.entries.length) best = { entries, cells };
    if (best.entries.length === words.length) break;
  }
  const xs = best.entries.flatMap((e) => [e.x, e.x + (e.dir === 'h' ? e.w.length - 1 : 0)]); const ys = best.entries.flatMap((e) => [e.y, e.y + (e.dir === 'v' ? e.w.length - 1 : 0)]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys); const W = Math.max(...xs) - x0 + 1, H = Math.max(...ys) - y0 + 1;
  const entries = best.entries.map((e) => ({ ...e, x: e.x - x0, y: e.y - y0 }));
  // numeração: por posição (linha, depois coluna); a mesma casa inicial divide o número
  const starts = []; for (const e of entries) if (!starts.some((s) => s.x === e.x && s.y === e.y)) starts.push({ x: e.x, y: e.y });
  starts.sort((a, b) => a.y - b.y || a.x - b.x);
  for (const e of entries) e.n = starts.findIndex((s) => s.x === e.x && s.y === e.y) + 1;
  return { w: W, h: H, entries: entries.sort((a, b) => a.n - b.n) };
}

/* ---------- quiz ---------- */
export const shuffle = (a, rnd = Math.random) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const snippet = (t) => { const s = t.split(/(?<=[.!?])\s+/)[0]; return s.length > 90 ? `${s.slice(0, 88).trim()}…` : s; };
/** Uma pergunta: kind 'blank' (qual palavra completa?), 'match' (qual dica fala disso?) ou 'embaralhada' (desembaralhe). */
export function question(items, kind, rnd = Math.random) {
  const it = items[Math.floor(rnd() * items.length)]; const others = shuffle(items.filter((x) => x.n !== it.n), rnd);
  if (kind === 'match') {
    const wrong = others.filter((x) => !wordsOf(x.text).some((y) => y.w === it.w)).slice(0, 3);
    return { kind, item: it, prompt: `qual dica fala de “${it.shown}”?`, options: shuffle([it, ...wrong], rnd).map((x) => ({ id: String(x.n), label: snippet(x.text) })), ans: String(it.n) };
  }
  if (kind === 'embaralhada') {
    let letters = shuffle([...it.w], rnd); for (let k = 0; k < 6 && letters.join('') === it.w; k++) letters = shuffle(letters, rnd);
    return { kind, item: it, prompt: 'desembaralhe a palavra da dica:', letters, ans: it.w, clue: clueOf(it) };
  }
  const wrong = others.slice(0, 3);
  return { kind: 'blank', item: it, prompt: clueOf(it), options: shuffle([it, ...wrong], rnd).map((x) => ({ id: x.w, label: x.shown })), ans: it.w };
}

/* ---------- dica certa pra cada tela ---------- */
export const CONTEXT_WORDS = {
  metronomo: ['METRONOMO', 'CLICK', 'ANDAMENTO', 'BPM', 'TEMPO', 'PULSO', 'DEVAGAR'], rudimentos: ['RUDIMENTO', 'MAOS', 'BAQUETA', 'REBOTE', 'RELAXAMENTO', 'TECNICA', 'PARADIDDLE', 'VELOCIDADE'],
  treinos: ['LEITURA', 'OUVIDO', 'ESCUTA', 'CONTAGEM', 'RITMO', 'FIGURA', 'PAUSA'], beatlab: ['GROOVE', 'LEVADA', 'BUMBO', 'CAIXA', 'CHIMBAL', 'VIRADA'], repertorio: ['REPERTORIO', 'MUSICA', 'MUSICAS', 'OUVIR', 'ESTUDAR'],
  partitura: ['PARTITURA', 'ESCREVER', 'ANOTAR', 'COMPASSO', 'LEITURA'], toque: ['DEDOS', 'GRAVAR', 'TEMPO', 'GROOVE'], ferramentas: ['ESTUDO', 'PRATICA', 'FOCO', 'TEMPO'], folhas: ['LEITURA', 'FIGURA', 'COMPASSO'],
};
/** A dica que mais combina com a tela (pelas palavras do texto); sem combinação, uma do dia. */
export function tipFor(ctx, tips, day = '', salt = 0) {
  if (!tips.length) return null;
  const words = CONTEXT_WORDS[ctx] || [];
  const scored = tips.map((t) => { const ws = new Set(wordsOf(t.text).map((x) => x.w)); return { t, s: words.reduce((n, w) => n + (ws.has(w) ? 1 : 0), 0) }; });
  const top = Math.max(...scored.map((x) => x.s)); const pool = top > 0 ? scored.filter((x) => x.s === top).map((x) => x.t) : tips;
  let h = 7; for (const c of `${ctx}${day}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[(h + salt) % pool.length];
}
