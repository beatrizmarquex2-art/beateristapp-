// Duelo do Beat Hero: dois celulares, uma sala por código, a MESMA música (pronta ou MIDI) no MESMO andamento. Cada um toca no seu aparelho e, no fim, os pontos são comparados.
// A sala, a contagem e o placar vêm de duelo-base.js; aqui entra o que é do Beat Hero (escolha da música, andamento e como jogar com o pacote de ritmo).
import { h } from '../util.js';
import { STYLES, bpmOf, songLabel } from '../campanha/jogos/noritmo.js';
import { linha, chips, passo, ajuda } from './opcoes.js';
import { mountDueloBase, vencedor as vencedorBase, estadoInicial } from './duelo-base.js';

const PCTS = Array.from({ length: 21 }, (_, i) => 50 + i * 5).map((p) => [p, `${p}%`]);
const DIFFS = [['facil', 'fácil'], ['medio', 'médio'], ['dificil', 'difícil']];
const LENS = [[60, '1 min'], [120, '2 min']];

/** Todas as músicas que os dois celulares têm igual: as 18 prontas e as MIDI que a professora liberou. */
export function catalogo(publicadas = []) {
  const prontas = STYLES.flatMap((s) => [0, 1, 2].map((t) => ({ key: `pre:${s}:${t}`, tipo: 'pre', style: s, tier: t, name: songLabel(s, t), bpm: bpmOf(s, t) })));
  const midis = publicadas.map((sg) => ({ key: `midi:${sg.id}`, tipo: 'midi', id: sg.id, name: sg.name, bpm: sg.bpm }));
  return { prontas, midis, todas: [...prontas, ...midis] };
}
export const bpmEfetivo = (song, pct) => Math.max(30, Math.round((song.bpm || 100) * pct / 100));
export { estadoInicial };
/** Quem ganhou: 0, 1 ou -1 (empate). Compara pontos; sem resultado do outro não decide. */
export const vencedor = (res) => vencedorBase(res, (r) => r.score);

export function mountDuelo(host, opts = {}) {
  let BR = null; let J = null; let pub = []; let cat = catalogo([]); let startedAt = 0; let acabou = false; let vigia = 0;
  const cfg = { key: 'pre:rock:1', pct: 100, diff: 'medio', maxLen: 60, keys: 4 };
  const songOf = (key) => cat.todas.find((x) => x.key === key) || cat.prontas[1];
  return mountDueloBase(host, {
    jogo: 'beathero', titulo: 'Duelo', sub: 'a mesma música, ao mesmo tempo, em dois celulares', voltar: ['#/ritmo', '‹ Beat Hero'], frameClass: 'rg-host', boxId: 'jogos',
    async carregar() {
      J = await import('../views/jogos-ritmo.js'); BR = await J.loadPackage();
      if (opts.student) { try { const C = await import('../codigo.js'); pub = await J.publicadasParaAluno(C.saved()); } catch { pub = []; } }
      cat = catalogo(pub);
    },
    config({ redraw }) {
      const s = songOf(cfg.key);
      const sel = h('select', { class: 'dl-sel', 'aria-label': 'Música', onchange: (e) => { cfg.key = e.target.value; redraw(); } },
        h('optgroup', { label: 'músicas prontas' }, ...cat.prontas.map((x) => h('option', { value: x.key, selected: x.key === cfg.key || null }, `${x.name} · ${x.bpm} bpm`))),
        cat.midis.length ? h('optgroup', { label: 'músicas MIDI da professora' }, ...cat.midis.map((x) => h('option', { value: x.key, selected: x.key === cfg.key || null }, `${x.name} · ${x.bpm} bpm`))) : null);
      return { cfg: () => ({ song: s, pct: cfg.pct, diff: cfg.diff, maxLen: cfg.maxLen, keys: cfg.keys }), nodes: [
        linha('música', sel),
        linha('andamento', passo(PCTS, cfg.pct, (v) => { cfg.pct = v; redraw(); }, 'andamento'), h('small', { class: 'muted' }, `${bpmEfetivo(s, cfg.pct)} bpm`)),
        linha('nível', chips(DIFFS, cfg.diff, (v) => { cfg.diff = v; redraw(); }, 'nível')),
        linha('duração', chips(LENS, cfg.maxLen, (v) => { cfg.maxLen = v; redraw(); }, 'duração'), ajuda('Como funciona', 'os dois celulares tocam a mesma música no mesmo andamento. cada um joga no seu aparelho e, no fim, os pontos são comparados. quem entra na sala toca o que o criador escolheu.'))] };
    },
    resumo: (c) => [c.song.name, `${bpmEfetivo(c.song, c.pct)} bpm (${c.pct}%) · ${(DIFFS.find((d) => d[0] === c.diff) || [0, ''])[1]} · ${c.maxLen / 60} min`],
    desbloquear() { if (BR && BR.unlock) BR.unlock(); },
    nota: (r) => r.score,
    aoVencer(c) { import('./estrelas-jogo.js').then((E) => E.ganhou('beathero', 3, `beathero|duelo|${c && c.song && c.song.id}|${c && c.diff}`)).catch(() => {}); }, // ganhou o duelo: 3 ★
    placar: (r) => [r.desistiu ? 'saiu' : `${r.score.toLocaleString('pt-BR')} pts`, r.desistiu ? '' : `precisão ${r.acc}% · combo ${r.combo}`],
    jogar(box, c, fim) {
      const song = c.song; startedAt = Date.now(); acabou = false; document.documentElement.classList.add('rg-on');
      BR.mount(box, { storageKey: /aluno\.html/.test(location.pathname) ? 'beaterista-aluno-ritmo' : 'beaterista-ritmo', midiImport: false, builtin: true, songs: pub,
        mission: { game: 'beat', keys: c.keys || 4, diff: c.diff, maxLen: c.maxLen, songs: [['rock', 0]], duel: { style: song.style, tier: song.tier, songId: song.tipo === 'midi' ? song.id : null, pct: c.pct } },
        onResult: (r) => { acabou = true; setTimeout(() => fim({ score: r.score | 0, acc: Math.round((Number(r.acc) || 0) * 100), combo: r.maxCombo | 0, grade: r.grade || '', perfect: r.perfect | 0, miss: r.miss | 0 }), 1500); } });
      // se a pessoa sair da música no meio, conta como desistência (0 ponto)
      vigia = setInterval(() => { if (Date.now() - startedAt > 4000 && !acabou && !document.body.classList.contains('rz-lock')) { clearInterval(vigia); fim({ score: 0, acc: 0, combo: 0, grade: '', perfect: 0, miss: 0, desistiu: true }); } }, 800);
      return () => { clearInterval(vigia); try { BR.unmount(); } catch { /* ok */ } document.body.classList.remove('rz-lock'); };
    },
    aoSair() { clearInterval(vigia); try { if (BR && BR.unmount) BR.unmount(); } catch { /* ok */ } document.body.classList.remove('rz-lock'); document.documentElement.classList.remove('rg-on'); },
  });
}
