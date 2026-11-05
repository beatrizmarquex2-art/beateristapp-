// Modo Aventura de "No Ritmo" (Beat Hero e Piano Hero). NENHUMA música é trancada: cada missão só ASSOCIA uma meta a músicas/ajustes que já existem
// no jogo (músicas prontas, 3 por estilo; o motor gera as mesmas músicas de sempre). A única "trava" é a ordem dos desafios no mapa.
// Métricas usadas são as que o motor JÁ calcula no fim da música (rzEnd): precisão (acertos ponderados ÷ notas), combo máximo e "perdeu" (Piano Hero:
// acabaram os corações). Nenhuma pontuação nova é inventada. A missão só conclui quando a música TERMINA de verdade (resultado do rzEnd).
// Sem imports estáticos de navegador: o módulo carrega em Node (testes) e só puxa o pacote de ritmo dentro de mount().

const STYLE_NAME = { rock: 'Rock', pop: 'Pop', reggaeton: 'Reggaeton', balada: 'Balada', lofi: 'Lo-fi', bossa: 'Bossa nova' };
const TIER_NAME = ['devagar', 'médio', 'rápido'];
export const STYLES = Object.keys(STYLE_NAME);
export const ALL_SONGS = STYLES.flatMap((s) => [0, 1, 2].map((t) => [s, t]));
const DIFF_NAME = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
export const songLabel = (s, t) => `${STYLE_NAME[s]} · ${TIER_NAME[t]}`;

/** Porcentagem inteira (para baixo, nunca arredonda pra cima): 59,9% não vira 60%. */
export const pctOf = (acc) => Math.max(0, Math.floor((Number(acc) || 0) * 100 + 1e-9));

/** Confere se o resultado veio mesmo desta missão (jogo, ajustes e música). */
export function matches(p, r) {
  if (!r || typeof r !== 'object') return false;
  if (r.game !== p.game || r.diff !== p.diff) return false;
  if (p.game === 'beat' && (r.keys !== p.keys || r.maxLen !== p.maxLen)) return false; // no Piano Hero o motor usa a música inteira e 4 colunas
  return p.songs.some(([s, t]) => r.style === s && r.tier === t);
}

/** Avaliação pura, igual pra todas as missões (os números vêm de `params`). */
export function evaluateWith(p, r) {
  if (!matches(p, r)) return { done: false, stars: 0, summary: ['esse resultado não é desta missão'] };
  const pct = pctOf(r.acc); const combo = Number(r.maxCombo) || 0;
  const sum = [`${r.songName || 'música'}: precisão ${pct}% · combo máximo ${combo}`];
  if (r.finished === false || r.lost) return { done: false, stars: 0, summary: [r.game === 'tiles' ? 'acabaram os corações antes do fim da música' : 'a música não chegou ao fim', ...sum] };
  if (pct < p.min) return { done: false, stars: 0, summary: [...sum, `faltou precisão: a meta era ${p.min}% (faltaram ${p.min - pct} pontos)`] };
  if (p.combo && combo < p.combo) return { done: false, stars: 0, summary: [...sum, `faltou sequência: a meta era um combo de ${p.combo} (faltaram ${p.combo - combo})`] };
  const stars = pct >= p.s3 ? 3 : pct >= p.s2 ? 2 : 1;
  if (stars < 3) sum.push(`pra ${stars + 1} estrelas: ${stars === 1 ? p.s2 : p.s3}% de precisão`);
  return { done: true, stars, summary: sum, label: `${pct}% de precisão` };
}

const jogoTxt = (p) => (p.game === 'tiles' ? 'Piano Hero' : `Beat Hero (${p.keys} teclas)`);
const starsTxt = (p) => [`${p.min}% de precisão ou mais${p.combo ? ` e um combo de ${p.combo}` : ''} (terminar a música)`, `${p.s2}% ou mais`, `${p.s3}% ou mais`];

function mission(index, id, title, tag, goalEnd, p, extraRules = []) {
  const params = { game: p.game, keys: p.keys || 4, diff: p.diff, maxLen: p.maxLen || 60, songs: p.songs, min: p.min, s2: p.s2, s3: p.s3, ...(p.combo ? { combo: p.combo } : {}) };
  const song = params.songs.length === 1 ? ` — ${songLabel(...params.songs[0])}` : '';
  return {
    id, title, tag, goal: `${goalEnd} (${jogoTxt(params)}, ${DIFF_NAME[params.diff]}${params.game === 'beat' ? `, ${params.maxLen / 60} min` : ''}${song})`,
    rules: [
      params.songs.length === 1 ? `música: ${songLabel(...params.songs[0])}.` : 'escolha qualquer uma das músicas prontas: nenhuma está trancada.',
      params.game === 'beat' ? 'toque nas notas quando elas chegarem na linha. Pode pausar quando quiser.' : 'toque nos blocos quando encostarem na linha azul. Se perder os 3 corações, tente de novo.',
      'a missão só conta quando a música chega ao fim.', ...extraRules,
    ],
    stars: starsTxt(params),
    params,
    evaluate: (r) => evaluateWith(params, r),
  };
}

const B = (s, t) => [[s, t]];
export const spec = {
  id: 'noritmo', title: 'No Ritmo', theme: 'noritmo',
  missions: [
    mission(0, 'noritmo-00', 'Aquecimento', 'aquece', 'termine uma música de aquecimento', { game: 'beat', keys: 3, diff: 'facil', maxLen: 60, songs: B('balada', 0), min: 45, s2: 65, s3: 80 }, ['aqui são só 3 teclas e notas bem espaçadas: o importante é sentir o tempo.']),
    mission(1, 'noritmo-01', 'Quatro teclas', 'pop', 'toque uma música inteira com 4 teclas', { game: 'beat', keys: 4, diff: 'facil', maxLen: 60, songs: B('pop', 0), min: 50, s2: 70, s3: 85 }),
    mission(2, 'noritmo-02', 'Lo-fi tranquilo', 'lo-fi', 'termine uma música no nível médio', { game: 'beat', keys: 3, diff: 'medio', maxLen: 60, songs: B('lofi', 1), min: 55, s2: 70, s3: 85 }),
    mission(3, 'noritmo-03', 'Rock de garagem', 'rock', 'toque um rock inteiro com 4 teclas', { game: 'beat', keys: 4, diff: 'medio', maxLen: 60, songs: B('rock', 0), min: 55, s2: 72, s3: 88 }),
    mission(4, 'noritmo-04', 'Primeiro piano', 'piano', 'toque a melodia no Piano Hero', { game: 'tiles', diff: 'facil', songs: B('bossa', 0), min: 60, s2: 75, s3: 90 }, ['tem um "como jogar" na tela antes de começar.']),
    mission(5, 'noritmo-05', 'Reggaeton em 5', '5 teclas', 'toque um reggaeton com 5 teclas', { game: 'beat', keys: 5, diff: 'medio', maxLen: 60, songs: B('reggaeton', 1), min: 55, s2: 72, s3: 88 }),
    mission(6, 'noritmo-06', 'Sequência de ouro', 'combo', 'faça uma sequência de acertos seguidos', { game: 'beat', keys: 4, diff: 'medio', maxLen: 60, songs: B('pop', 1), min: 60, s2: 75, s3: 90, combo: 25 }, ['combo = acertos seguidos sem errar. Precisa chegar a 25 em algum momento da música.']),
    mission(7, 'noritmo-07', 'Piano no médio', 'piano+', 'toque uma melodia inteira no nível médio', { game: 'tiles', diff: 'medio', songs: B('rock', 0), min: 60, s2: 78, s3: 92 }),
    mission(8, 'noritmo-08', 'Maratona de 2 minutos', '2 min', 'toque 2 minutos sem parar', { game: 'beat', keys: 4, diff: 'medio', maxLen: 120, songs: B('balada', 1), min: 60, s2: 78, s3: 90 }, ['é a versão longa do jogo (2 minutos).']),
    mission(9, 'noritmo-09', 'Cinco teclas, difícil', 'difícil', 'encare o nível difícil com 5 teclas', { game: 'beat', keys: 5, diff: 'dificil', maxLen: 60, songs: B('rock', 1), min: 60, s2: 75, s3: 90 }),
    mission(10, 'noritmo-10', 'Grande Palco', 'show', 'feche o show: 2 minutos no nível difícil, na música que você escolher', { game: 'beat', keys: 4, diff: 'dificil', maxLen: 120, songs: ALL_SONGS, min: 65, s2: 80, s3: 92 }, ['você escolhe qualquer uma das 18 músicas prontas (6 estilos × 3 velocidades).']),
  ],
  medals: [
    { id: 'nr-dois-jogos', title: 'Beat e Piano', desc: 'conclua uma missão do Beat Hero e uma do Piano Hero', icon: '🎹', test: (g) => ['noritmo-04', 'noritmo-07'].some((i) => ((g.m[i] || {}).s || 0) >= 1) && ['noritmo-00', 'noritmo-01', 'noritmo-02', 'noritmo-03', 'noritmo-05', 'noritmo-06', 'noritmo-08', 'noritmo-09', 'noritmo-10'].some((i) => ((g.m[i] || {}).s || 0) >= 1) },
    { id: 'nr-sequencia', title: 'Sequência de ouro', desc: 'conclua a missão do combo', icon: '🔥', test: (g) => ((g.m['noritmo-06'] || {}).s || 0) >= 1 },
    { id: 'nr-maratona', title: 'Maratona', desc: 'conclua a missão de 2 minutos', icon: '⏱️', test: (g) => ((g.m['noritmo-08'] || {}).s || 0) >= 1 },
    { id: 'nr-afinado', title: 'Ouvido de ouro', desc: 'ganhe 3 estrelas em 3 missões', icon: '🎯', test: (g) => Object.values(g.m).filter((x) => x && x.s >= 3).length >= 3 },
    { id: 'nr-palco', title: 'Grande Palco', desc: 'conclua a missão final', icon: '🎤', test: (g) => ((g.m['noritmo-10'] || {}).s || 0) >= 1 },
  ],
};

/** Monta a partida da missão dentro de `body`. O pacote de ritmo recebe `mission` e só avisa `onResult` no fim real da música. */
export function mount(body, opts) {
  const m = opts.mission; const p = m.params; let gone = false; let BRref = null;
  const root = document.createElement('div'); root.className = 'rg-host'; const box = document.createElement('div'); box.id = 'jogos';
  const wait = document.createElement('p'); wait.className = 'muted rg-wait'; wait.textContent = 'carregando o jogo…'; box.append(wait); root.append(box); body.append(root);
  (async () => {
    try {
      const J = await import('../../views/jogos-ritmo.js'); const BR = await J.loadPackage(); if (gone) return;
      box.replaceChildren(); BRref = BR; document.documentElement.classList.add('rg-on');
      BR.mount(box, {
        storageKey: /aluno\.html/.test(location.pathname) ? 'beaterista-aluno-ritmo' : 'beaterista-ritmo', // só LÊ (calibração do atraso); a aventura não grava nele midiImport: false, builtin: true, songs: [],
        mission: { game: p.game, keys: p.keys, diff: p.diff, maxLen: p.maxLen, songs: p.songs },
        onXp: (n, why) => { J.addXp(n, why ? `${why} (aventura)` : 'aventura').catch(() => {}); }, // XP como numa partida normal (decisão documentada)
        onResult: (r) => { if (!gone) opts.onResult(r); },
      });
    } catch (e) { if (!gone) { box.replaceChildren(); const q = document.createElement('p'); q.className = 'muted'; q.textContent = `não consegui abrir o jogo (${e && e.message ? e.message : 'erro'}).`; box.append(q); } }
  })();
  return {
    inProgress: () => !gone && document.body.classList.contains('rz-lock'),
    destroy() {
      gone = true;
      try { if (BRref && BRref.unmount) BRref.unmount(); } catch { /* ok */ }
      document.body.classList.remove('rz-lock'); document.documentElement.classList.remove('rg-on');
      root.remove();
    },
  };
}
export default { spec, mount };
