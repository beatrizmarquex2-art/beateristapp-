// Motor de campanhas (Modo Aventura): PURO, sem tela. Cada jogo entrega um "spec" com as missões e como avaliar o resultado de verdade;
// o motor cuida de estrelas, desbloqueio, medalhas e do formato do progresso salvo. Uma missão só conta quando o jogo entrega um RESULTADO
// (vitória/derrota/pontos reais) e `evaluate` aprova: abrir ou iniciar a partida não conclui nada.
//
// spec = {
//   id: 'cartas', title: 'Uno Musical', theme: 'cartas',                 // theme: chave de themes.js
//   missions: [{
//     id: 'cartas-00',                  // ID ESTÁVEL (é o que fica salvo): nunca renomear
//     title: 'Aquecimento', goal: 'ganhe 1 partida contra o Beto',   // objetivo escrito pro jogador (curto)
//     tag: 'vs Beto',                   // texto curtinho no disco do mapa
//     rules: ['…'],                     // (opcional) regras/dicas da missão
//     stars: ['1 estrela: vencer', '2: …', '3: …'],  // (opcional) como ganhar mais estrelas, exatamente como evaluate calcula
//     params: {…},                      // configuração que o jogo usa pra montar a partida
//     evaluate(result) → { done: boolean, stars: 0..3, summary: ['…'], label?: 'texto do melhor resultado' },
//   }],
//   medals: [{ id, title, desc, icon?: '🏅', test(game, spec) → boolean }],  // medalhas extras do jogo (as gerais vêm de genericMedals)
// }
export const MAX_STARS = 3;
export const blankGame = () => ({ m: {}, medals: [], log: [] });
const clampStars = (n) => Math.max(0, Math.min(MAX_STARS, Math.floor(Number(n) || 0)));

/** Confere o spec: ids únicos, missões com objetivo e avaliação. Devolve { ok, errors }. */
export function checkSpec(spec) {
  const errors = []; const ids = new Set();
  if (!spec || !spec.id) errors.push('spec sem id');
  if (!spec || !Array.isArray(spec.missions) || !spec.missions.length) return { ok: false, errors: [...errors, 'sem missões'] };
  spec.missions.forEach((m, i) => {
    if (!m.id) errors.push(`missão ${i} sem id`); else if (ids.has(m.id)) errors.push(`id repetido: ${m.id}`); ids.add(m.id);
    if (!m.title || !m.goal) errors.push(`missão ${m.id || i} sem título/objetivo`);
    if (typeof m.evaluate !== 'function') errors.push(`missão ${m.id || i} sem evaluate`);
  });
  const mids = new Set(); (spec.medals || []).forEach((x) => { if (mids.has(x.id)) errors.push(`medalha repetida: ${x.id}`); mids.add(x.id); });
  return { ok: !errors.length, errors };
}

export const starsOf = (g, id) => (g.m[id] && g.m[id].s) || 0;
export const doneIdx = (spec, g) => spec.missions.filter((m) => starsOf(g, m.id) >= 1).length;
export const totalStars = (spec, g) => spec.missions.reduce((a, m) => a + starsOf(g, m.id), 0);
/** Desbloqueio: a primeira sempre; as outras quando a anterior tem ≥1 estrela. Missão que já tem estrela nunca volta a trancar. */
export function isUnlocked(spec, g, index) {
  if (index <= 0) return true;
  return starsOf(g, spec.missions[index].id) >= 1 || starsOf(g, spec.missions[index - 1].id) >= 1;
}
/** Quadro por missão, na ordem. */
export const statusOf = (spec, g) => spec.missions.map((m, i) => ({ id: m.id, index: i, stars: starsOf(g, m.id), unlocked: isUnlocked(spec, g, i), done: starsOf(g, m.id) >= 1, tries: (g.m[m.id] || {}).n || 0, label: (g.m[m.id] || {}).l || null }));

/** Medalhas gerais (valem pra qualquer jogo, calculadas só do progresso real). */
export function genericMedals(spec) {
  const n = spec.missions.length;
  return [
    { id: 'first', title: 'Primeira missão', desc: 'conclua a primeira missão', icon: '🥉', test: (g) => doneIdx(spec, g) >= 1 },
    { id: 'half', title: 'Meio caminho', desc: `conclua ${Math.ceil(n / 2)} missões`, icon: '🥈', test: (g) => doneIdx(spec, g) >= Math.ceil(n / 2) },
    { id: 'all', title: 'Turnê completa', desc: 'conclua todas as missões', icon: '🥇', test: (g) => doneIdx(spec, g) >= n },
    { id: 'perfect', title: 'Três estrelas em tudo', desc: 'consiga 3 estrelas em todas as missões', icon: '🌟', test: (g) => totalStars(spec, g) >= n * MAX_STARS },
  ];
}
export const allMedals = (spec) => [...genericMedals(spec), ...(spec.medals || [])];

/**
 * Aplica o resultado de uma tentativa. Não muda `g0`. Devolve { g, done, stars, gain, firstTime, summary, label, newMedals }.
 * `gain` = estrelas novas acima do melhor anterior. Só grava estrela/medalha quando `evaluate` aprova de verdade.
 */
export function applyResult(g0, spec, missionId, result, now = Date.now()) {
  const m = spec.missions.find((x) => x.id === missionId); if (!m) throw new Error(`missão desconhecida: ${missionId}`);
  const ev = m.evaluate(result, m) || {}; const done = !!ev.done; const stars = done ? Math.max(1, clampStars(ev.stars)) : 0;
  const g = { ...blankGame(), ...g0, m: { ...g0.m }, medals: [...(g0.medals || [])], log: [...(g0.log || [])] };
  const old = g.m[missionId] || { s: 0, n: 0 };
  g.m[missionId] = { s: Math.max(old.s, stars), n: old.n + 1, l: stars >= old.s && ev.label ? String(ev.label) : old.l || null };
  g.log.push({ t: now, id: missionId, ok: done, s: stars }); if (g.log.length > 100) g.log = g.log.slice(-100);
  const newMedals = [];
  for (const md of allMedals(spec)) { if (!g.medals.includes(md.id) && md.test(g, spec)) { g.medals.push(md.id); newMedals.push(md); } }
  return { g, done, stars, gain: Math.max(0, stars - old.s), firstTime: old.s === 0 && done, summary: ev.summary || [], label: ev.label || null, newMedals };
}
