// Dicionário da bateria: busca, temas, explicação curta, dica, exemplo tocando, nome em inglês e "ler mais" na Mente Musical.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { CATS, TERMS, searchTerms, byId } from '../glossary.js';
import { TITLE_PT } from '../catalog.js';
import { playBeat, stopBeat, playingId } from './beatlab.js';
import { banner } from '../ui.js';

/** Exemplo do termo vira um ritmo completo do Beat Lab (todas as linhas da grade). */
export const beatOf = (x) => x.ex && {
  id: `dic-${x.id}`, name: x.t, style: '', kind: 'groove', bpm: x.ex.bpm, steps: x.ex.steps,
  rows: Object.fromEntries(B.ROWS.map((r) => [r.id, x.ex.rows[r.id] || Array(x.ex.steps).fill(0)])),
  acc: x.ex.acc || Array(x.ex.steps).fill(0),
};

export function mount(host, parts = []) {
  let q = ''; let cat = ''; let open = parts[0] || null;
  const list = h('div', { class: 'dc-list' });
  const search = h('input', { type: 'search', placeholder: 'buscar: síncope, ghost note, BPM…', 'aria-label': 'Buscar no dicionário' });
  search.addEventListener('input', () => { q = search.value; draw(); });
  const chips = h('div', { class: 'chips lib-tabs pad-x', role: 'radiogroup', 'aria-label': 'Temas' });
  const card = (x) => {
    const isOpen = open === x.id; const b = beatOf(x); const playing = b && playingId() === b.id;
    const mini = b && isOpen ? (() => { const f = h('figure', { class: 'tr-bar' }); f.innerHTML = N.toSVG(N.layout(b, { width: 340, full: false })); return f; })() : null;
    return h('article', { class: `card pad dc-term${isOpen ? ' open' : ''}`, id: `t-${x.id}` },
      h('button', { type: 'button', class: 'dc-head', 'aria-expanded': String(isOpen), onclick: () => { open = isOpen ? null : x.id; draw(); } },
        h('strong', {}, x.t), x.en && x.en !== x.t ? h('small', { lang: 'en' }, x.en) : null, h('span', { class: 'dc-cat' }, (CATS.find((c) => c[0] === x.cat) || ['', ''])[1])),
      h('p', { class: 'dc-def' }, x.d),
      isOpen ? h('div', { class: 'dc-more' },
        x.dica ? h('p', { class: 'dc-tip' }, '💡 ', x.dica) : null,
        mini,
        b ? h('div', { class: 'row ft-row' },
          h('button', { class: `bl-play small${playing ? ' on' : ''}`, type: 'button', 'aria-label': playing ? 'Parar exemplo' : `Ouvir exemplo de ${x.t}`, onclick: () => { if (playing) stopBeat(); else playBeat(b, { onStop: draw }); draw(); } }, icon(playing ? 'stop' : 'play', 18)),
          h('span', { class: 'muted' }, `exemplo a ${b.bpm} BPM`),
          h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { stopBeat(); await store.upsert('setting', 'setting-beatlab', { beat: { ...b, name: `exemplo: ${x.t}`, id: 'dicionario' } }); location.hash = '#/beatlab'; } }, 'abrir no Beat Lab')) : null,
        h('div', { class: 'chips' },
          x.link ? h('a', { class: 'chip-link', href: x.link }, 'praticar no app →') : null,
          x.art ? h('a', { class: 'chip-link', href: `#/estudos/a/${x.art}` }, `ler mais: ${TITLE_PT[x.art] || x.art}`) : null),
        (x.see || []).length ? h('p', { class: 'dc-see' }, 'veja também: ', ...x.see.map(byId).filter(Boolean).flatMap((y, i) => [i ? ', ' : '', h('button', { type: 'button', class: 'link', onclick: () => { open = y.id; q = ''; search.value = ''; cat = ''; draw(); setTimeout(() => { const el = document.getElementById(`t-${y.id}`); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 30); } }, y.t)])) : null) : null);
  };
  const draw = () => {
    chips.replaceChildren(...[['', 'todos'], ...CATS].map(([id, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(cat === id), class: `lib-tab${cat === id ? ' on' : ''}`, onclick: () => { cat = id; draw(); } }, t)));
    const shown = searchTerms(q, TERMS.filter((x) => !cat || x.cat === cat));
    list.replaceChildren(...(shown.length ? shown.map(card) : [h('p', { class: 'pad-x muted' }, 'não achei esse termo. me pede que eu coloco!')]));
  };
  host.append(banner('Dicionário da bateria', `${TERMS.length} termos explicados, com exemplo tocando`), h('div', { class: 'pad-x dc-search' }, search), chips, list,
    h('p', { class: 'pad-x lib-note' }, 'toque no termo pra abrir a dica e o exemplo. o nome em inglês aparece porque é assim que você vai achar em vídeo e partitura de fora.'));
  draw();
  if (open) setTimeout(() => { const el = document.getElementById(`t-${open}`); if (el) el.scrollIntoView({ block: 'start' }); }, 50);
  return () => { if (String(playingId() || '').startsWith('dic-')) stopBeat(); };
}
