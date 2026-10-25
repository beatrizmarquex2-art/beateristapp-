// Plano de estudo: estrutura diária (aquecimento, técnica, groove, aplicação), foco de cada dia da semana,
// "montar meu treino de hoje" e as contas do diário. Puro, testado em tests/plan.test.mjs.
// Os textos do Cronograma (sugestões do dia e as 30 dicas) ficam só no Supabase privado da Bia.

export const BASE = [['aquecimento', 'Aquecimento', 5], ['tecnica', 'Técnica', 10], ['groove', 'Groove', 10], ['aplicacao', 'Aplicação', 5]];
export const DURATIONS = [15, 30, 45, 60];

/** Foco de cada dia (0 = domingo). `tec` e `app` escolhem a ferramenta de cada bloco. */
export const WEEK = {
  1: { focus: 'leitura rítmica + groove simples', tec: 'leitura', groove: 'combo', app: 'musica' },
  2: { focus: 'rudimentos + groove', tec: 'rudimento', groove: 'groove', app: 'musica' },
  3: { focus: 'coordenação de mãos e pés', tec: 'coordenacao', groove: 'groove', app: 'musica' },
  4: { focus: 'leitura + variações', tec: 'leitura', groove: 'partitura', app: 'musica' },
  5: { focus: 'controle, dinâmica e velocidade', tec: 'velocidade', groove: 'groove', app: 'musica' },
  6: { focus: 'repertório', tec: 'rudimento', groove: 'combo', app: 'repertorio' },
  0: { focus: 'escuta e descanso criativo', tec: 'escuta', groove: 'groove', app: 'escutar' },
};

/** Minutos de cada bloco pro tempo total, proporcional ao 5/10/10/5 e somando exatamente o total. `over` fixa um bloco. */
export function blockMinutes(total = 30, over = {}) {
  const fixed = BASE.filter(([k]) => over[k] != null).reduce((s, [k]) => s + over[k], 0);
  const free = BASE.filter(([k]) => over[k] == null); const baseFree = free.reduce((s, b) => s + b[2], 0);
  const left = Math.max(0, total - fixed);
  const raw = free.map(([k, , m]) => [k, (left * m) / (baseFree || 1)]);
  const out = Object.fromEntries(raw.map(([k, v]) => [k, Math.floor(v)]));
  let rest = left - Object.values(out).reduce((s, v) => s + v, 0);
  for (const [k] of [...raw].sort((a, b) => (b[1] % 1) - (a[1] % 1))) { if (rest <= 0) break; out[k]++; rest--; }
  for (const [k] of BASE) if (over[k] != null) out[k] = over[k];
  return out;
}

/** Sorteio repetível: o treino do dia não muda a cada vez que abre (só quando a Bea pede "trocar"). */
export function seeded(str) { let x = 2166136261; for (const c of str) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0; } return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const pick = (arr, rnd) => (arr.length ? arr[Math.floor(rnd() * arr.length)] : null);

/**
 * Monta os 4 blocos do dia. `pool` = { rudiments:[{key,name,stick,hasKick}], beats:[{key,name}], combos? } (o método da Bia vem primeiro quando existe).
 * Cada bloco: { key, label, min, item, tool: { label, href, open? } }.
 */
export function buildToday(weekday, total, pool, { seed = '', over = {} } = {}) {
  const w = WEEK[weekday]; const rnd = seeded(`${seed}|${weekday}`); const mins = blockMinutes(total, over);
  const hands = pool.rudiments.filter((r) => !r.hasKick); const feet = pool.rudiments.filter((r) => r.hasKick);
  const warm = pool.rudiments.find((r) => /^toque simples/i.test(r.name)) || hands[0] || null;
  const tec = {
    leitura: { item: 'leitura rítmica (nível do dia)', tool: { label: 'treino de leitura', href: '#/treinos' } },
    escuta: { item: 'ditado rítmico: ouvir e reconhecer', tool: { label: 'treino de escuta', href: '#/treinos/escuta' } },
    rudimento: (() => { const r = pick(hands, rnd); return r && { item: r.name, tool: { label: 'rudimentos', href: '#/rudimentos', open: { rud: r.key } } }; })(),
    coordenacao: (() => { const r = pick(feet, rnd) || pick(hands, rnd); return r && { item: r.name, tool: { label: 'rudimentos', href: '#/rudimentos', open: { rud: r.key } } }; })(),
    velocidade: (() => { const r = pick(hands, rnd); return r && { item: `${r.name}: suba o BPM até o limite limpo`, tool: { label: 'rudimentos', href: '#/rudimentos', open: { rud: r.key, prog: true } } }; })(),
  }[w.tec] || { item: 'rudimento à escolha', tool: { label: 'rudimentos', href: '#/rudimentos' } };
  const b = pick(pool.beats, rnd);
  const groove = {
    groove: b ? { item: b.name, tool: { label: 'Beat Lab', href: '#/beatlab', open: { beat: b.key } } } : { item: 'groove à escolha', tool: { label: 'Beat Lab', href: '#/beatlab' } },
    combo: { item: `${b ? b.name : 'groove'} + virada (3 + 1)`, tool: { label: 'groove + virada', href: '#/beatlab/combo', open: b ? { comboBeat: b.key } : null } },
    partitura: { item: 'escreva uma variação do groove e toque lendo', tool: { label: 'montar partitura', href: '#/partitura' } },
  }[w.groove];
  const app = {
    musica: { item: 'tocar uma música do seu repertório', tool: { label: 'setlist', href: '#/setlist' } },
    repertorio: { item: 'revisar músicas antigas e improvisar viradas', tool: { label: 'setlist', href: '#/setlist' } },
    escutar: { item: 'ouvir com atenção e assistir bateristas', tool: { label: 'bateristas & links', href: '#/bateristas' } },
  }[w.app];
  const items = {
    aquecimento: warm ? { item: `${warm.name} (devagar, mãos soltas)`, tool: { label: 'rudimentos', href: '#/rudimentos', open: { rud: warm.key } } } : { item: 'toque simples devagar', tool: { label: 'metrônomo', href: '#/metronomo' } },
    tecnica: tec, groove, aplicacao: app,
  };
  return { focus: w.focus, blocks: BASE.map(([key, label]) => ({ key, label, min: mins[key], ...items[key] })) };
}

/** Minutos estudados por dia nos últimos 7 dias (do mais antigo pra hoje) e dias seguidos até hoje. */
export function week(logs, todayKey, dayKeyOf) {
  const days = []; const d0 = new Date(`${todayKey}T12:00:00Z`);
  for (let i = 6; i >= 0; i--) { const d = new Date(d0); d.setUTCDate(d.getUTCDate() - i); days.push(d.toISOString().slice(0, 10)); }
  const per = Object.fromEntries(days.map((k) => [k, 0]));
  const all = {};
  for (const l of logs) { const k = dayKeyOf(l); all[k] = (all[k] || 0) + (l.min || 0); if (k in per) per[k] += l.min || 0; }
  let streak = 0; const d = new Date(d0);
  if (!all[todayKey]) d.setUTCDate(d.getUTCDate() - 1); // hoje ainda não estudou: conta até ontem
  while (all[d.toISOString().slice(0, 10)]) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
  return { days: days.map((k) => ({ key: k, min: per[k] })), streak, total: Object.values(per).reduce((s, v) => s + v, 0) };
}

/** Quanto tempo um bloco já correu (somando pausas), contado pelo relógio e não por timer de fundo. */
export const elapsed = (b, now = Date.now()) => (b.acc || 0) + (b.startedAt ? now - b.startedAt : 0);
