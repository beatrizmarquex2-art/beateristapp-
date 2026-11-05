// Tela do Modo Aventura (serve pra qualquer jogo): escolha de modo (livre × aventura), mapa de missões, briefing, partida e resultado.
// O jogo em si não muda: recebe `opts.mission` e avisa o resultado real em `opts.onResult(result)`.
import { h } from '../util.js';
import { session } from '../session.js';
import { robo, tierOf } from '../kids/robo.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { mapSfx, soundOn, setSound } from '../kids/mapa-sfx.js';
import { sheet, confirmSheet } from '../ui.js';
import { themeOf } from './themes.js';
import * as E from './engine.js';
import * as CS from './store.js';
import * as P from '../kids/progress.js';
import * as AC from '../acesso.js';
import { pontuacaoEl } from './pontuacao.js';

const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** Primeira tela do jogo: Modo Livre (como sempre foi) ou Modo Aventura. */
export function modeChooser(host, { gameId, spec, hrefLivre, hrefAventura, title, blurb }) {
  const pid = CS.playerId(); const g = CS.gameOf(pid, gameId); const n = spec.missions.length;
  const lockedAdv = document.documentElement.classList.contains('aluno-on') && !AC.liberado(); // aluno sem código: só o Modo Livre
  const card = (cls, href, name, text, meta) => h('a', { class: `av-mode ${cls}`, href }, h('b', { class: 'av-mode-t' }, name), h('span', { class: 'av-mode-d' }, text), meta ? h('small', { class: 'av-mode-m' }, meta) : null);
  host.replaceChildren(h('div', { class: 'av av-choose' },
    h('h2', { class: 'av-h' }, title), blurb ? h('p', { class: 'av-p' }, blurb) : null, h('p', { class: 'av-q' }, 'como você quer jogar?'),
    card('livre', hrefLivre, 'Modo Livre', 'do jeito de sempre: sem bloqueios, quantas vezes quiser.', null),
    card('aventura', hrefAventura, `${lockedAdv ? '🔒 ' : ''}Modo Aventura`, lockedAdv ? 'precisa do código da professora (a professora te dá, ou gere o seu na entrada).' : 'missões, estrelas e medalhas num mapa só desse jogo.', lockedAdv ? null : `${E.doneIdx(spec, g)}/${n} missões · ★ ${E.totalStars(spec, g)}/${n * 3}`),
    pontuacaoEl(gameId, 'livre'), pontuacaoEl(gameId, 'aventura'),
    h('p', { class: 'av-note' }, 'o progresso de cada modo é independente: trocar de um pro outro não apaga nada.')));
  return () => {};
}

/** Painel de medalhas (as ganhas de verdade; as outras aparecem apagadas com o jeito de ganhar). */
export function medalsEl(spec, g) {
  const have = new Set(g.medals || []);
  return h('div', { class: 'av-medals', role: 'list', 'aria-label': 'medalhas' }, ...E.allMedals(spec).map((m) => h('div', { class: `av-medal${have.has(m.id) ? ' on' : ''}`, role: 'listitem', title: m.desc },
    h('span', { class: 'av-medal-i', 'aria-hidden': 'true' }, have.has(m.id) ? (m.icon || '🏅') : '🔒'), h('b', {}, m.title), h('small', {}, m.desc))));
}

/**
 * Monta o Modo Aventura de um jogo dentro de `host`.
 * cfg: { gameId, spec, adv: { mount(body, opts) }, base: '#/jogos/cartas/aventura', mission: índice|null, nav(hash), backHref }
 */
export function mountAdventure(host, cfg) {
  const { gameId, spec, adv, base, nav, backHref } = cfg; const S = session({ quiet: false }); const sfx = mapSfx(); const motion = !reduced();
  const pid = CS.playerId(); const theme = themeOf(spec.theme); let ctl = null; let off = () => {}; let stage = null;
  const tier = (() => { try { return tierOf(P.totalStars(pid)); } catch { return 0; } })();
  const cur = () => CS.gameOf(pid, gameId);
  const snd = () => { const b = h('button', { type: 'button', class: 'av-snd', 'aria-pressed': String(!soundOn()), 'aria-label': 'Sons da aventura', onclick: () => { setSound(!soundOn()); b.textContent = soundOn() ? '🔊' : '🔇'; b.setAttribute('aria-pressed', String(!soundOn())); sfx.play('click'); } }, soundOn() ? '🔊' : '🔇'); return b; };
  const clean = () => { try { off(); } catch { /* ok */ } off = () => {}; if (ctl && ctl.destroy) { try { ctl.destroy(); } catch { /* ok */ } } ctl = null; };

  /* ---------- mapa ---------- */
  function mapScreen() {
    const g = cur(); const n = spec.missions.length; const st = E.statusOf(spec, g);
    const top = h('div', {}); const med = h('div', { class: 'av' });
    const bar = h('div', { class: 'av-bar' }, h('a', { class: 'av-back', href: backHref }, '‹ voltar'), h('b', { class: 'av-bt' }, spec.title)); // o botão de som fica só no cabeçalho do mapa (um só)
    host.replaceChildren(h('div', { class: 'av' }, bar, h('p', { class: 'av-sub' }, `${theme.name} · modo aventura`)), top, h('div', { class: 'av av-meds' }, pontuacaoEl(gameId, 'aventura', { open: false }), h('h3', { class: 'av-h3' }, 'medalhas'), medalsEl(spec, g)));
    const levels = spec.missions.map((m, i) => ({ id: m.id, index: i, label: String(i), tag: m.tag || '', boss: i === n - 1 }));
    off = mountProgressionMap(top, {
      gameId: `av-${gameId}`, levels, tier, profileId: pid, theme, unitName: 'Missão', lockedMsg: 'complete a missão anterior pra abrir',
      stars: { have: E.totalStars(spec, g), max: n * 3 },
      starsOf: (id) => E.starsOf(g, id), unlockedOf: (id) => st.find((x) => x.id === id).unlocked, bestOf: (id) => (st.find((x) => x.id === id) || {}).label || null,
      onOpen: (nd) => nav(`${base}/${nd.index}`),
    });
  }

  /* ---------- missão ---------- */
  function missionScreen(index) {
    const m = spec.missions[index]; const g = cur();
    if (!m || !E.isUnlocked(spec, g, index)) { nav(base); return; }
    const bar = (extra) => h('div', { class: 'av-bar' }, h('a', { class: 'av-back', href: base }, '‹ mapa'), h('b', { class: 'av-bt' }, `missão ${index} · ${m.title}`), extra || null);
    const briefing = () => {
      clean(); const bot = robo({ mood: 'happy', tier, size: 84, say: index === 0 ? 'vamos começar a turnê!' : 'bora nessa missão!' });
      host.replaceChildren(h('div', { class: 'av av-brief' }, bar(),
        h('div', { class: 'av-card' }, h('small', { class: 'av-kick' }, `${theme.name}`), h('h2', { class: 'av-h' }, m.title), h('p', { class: 'av-goal' }, h('span', { class: 'av-ico', 'aria-hidden': 'true' }, '🎯'), ' ', m.goal),
          m.rules && m.rules.length ? h('ul', { class: 'av-list' }, ...m.rules.map((r) => h('li', {}, r))) : null,
          m.stars && m.stars.length ? h('div', { class: 'av-stars-how' }, h('b', {}, 'estrelas'), h('ul', { class: 'av-list' }, ...m.stars.map((r, k) => h('li', {}, h('span', { class: 'av-s' }, '★'.repeat(k + 1)), ` ${r}`)))) : null,
          h('div', { class: 'av-actions' }, h('button', { class: 'kd-btn av-go', type: 'button', onclick: () => { sfx.play('disc'); play(); } }, 'começar a missão'))),
        h('div', { class: 'av-bot' }, bot.el)));
    };
    let finished = false;
    const play = () => {
      clean(); finished = false; const body = h('div', { class: `av-play ${cfg.playClass || ''}`.trim() });
      stage = h('div', { class: 'av av-stage' }, bar(snd()), h('p', { class: 'av-objective', role: 'status' }, h('span', { 'aria-hidden': 'true' }, '🎯 '), m.goal), body,
        h('div', { class: 'av-actions row' }, h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (!ctl || !ctl.inProgress || !ctl.inProgress() || await confirmSheet('tentar de novo?', 'a partida atual será perdida.', 'recomeçar')) play(); } }, 'recomeçar missão')));
      host.replaceChildren(stage);
      ctl = adv.mount(body, { mission: { id: m.id, index, title: m.title, goal: m.goal, params: m.params || {} }, onResult: (r) => { if (finished) return; finished = true; S.later(() => settle(r), motion ? (r && r.delay != null ? r.delay : 900) : 0); } });
    };
    const settle = async (result) => {
      if (!stage || !stage.isConnected) return;
      let out; try { out = E.applyResult(cur(), spec, m.id, result); } catch (e) { console.warn('aventura: resultado inválido', e); return; }
      try { await CS.saveGame(pid, gameId, out.g); } catch (e) { console.warn('aventura: não salvou', e); } // tentativa de verdade (vitória ou derrota) sempre conta
      if (!stage || !stage.isConnected) return;
      sfx.play(out.done ? 'win' : 'lose'); if (out.done) S.later(() => sfx.play('star'), 450); if (out.newMedals.length) S.later(() => sfx.play('medal'), 1000);
      const bot = robo({ mood: out.done ? (out.stars >= 2 ? 'cheer' : 'happy') : 'oops', tier, size: 84, say: out.done ? (out.stars === 3 ? 'perfeito!' : 'missão cumprida!') : 'quase! tenta de novo?' });
      const nextOk = out.done && index + 1 < spec.missions.length;
      const panel = h('div', { class: 'av-res', role: 'dialog', 'aria-label': 'resultado da missão' }, h('div', { class: 'av-res-in' },
        h('h2', { class: 'av-h' }, out.done ? 'Missão concluída!' : 'Ainda não deu'),
        h('div', { class: 'av-rstars', 'aria-label': `${out.stars} de 3 estrelas` }, ...[1, 2, 3].map((k) => h('span', { class: `av-rstar${k <= out.stars ? ' on' : ''}`, style: `--d:${k * 0.2}s` }, '★'))),
        out.summary.length ? h('ul', { class: 'av-list av-sum' }, ...out.summary.map((x) => h('li', {}, x))) : null,
        out.firstTime && nextOk ? h('p', { class: 'av-unlock' }, `🔓 missão ${index + 1} liberada!`) : null,
        out.newMedals.length ? h('div', { class: 'av-newm' }, h('b', {}, out.newMedals.length > 1 ? 'medalhas novas!' : 'medalha nova!'), ...out.newMedals.map((x) => h('span', { class: 'av-chip' }, `${x.icon || '🏅'} ${x.title}`))) : null,
        h('div', { class: 'av-bot' }, bot.el),
        h('div', { class: 'av-actions' },
          nextOk ? h('button', { class: 'kd-btn av-go', type: 'button', onclick: () => nav(`${base}/${index + 1}`) }, `missão ${index + 1} →`) : null,
          h('button', { class: nextOk ? 'kd-chip' : 'kd-btn', type: 'button', onclick: () => { panel.remove(); play(); } }, 'jogar de novo'),
          h('button', { class: 'kd-chip', type: 'button', onclick: () => nav(base) }, 'ver o mapa'))));
      stage.append(panel); const first = panel.querySelector('button'); if (first) first.focus();
    };
    briefing();
  }

  if (cfg.mission == null) mapScreen(); else missionScreen(cfg.mission);
  return () => { S.dispose(); sfx.dispose(); clean(); };
}
