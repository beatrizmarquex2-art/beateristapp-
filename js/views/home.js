import { h, icon, debounce, todayKey, longDate, sparkle } from '../util.js';
import * as store from '../store.js';
import { MODULES } from '../modules.js';
import { visibleOn } from '../tasks-logic.js';
import { toggleTask } from './tasks.js';
import { homeNoteId, setHomeNote, HOME_NOTE_KEY } from './notes.js';
import { sortedFavs, favChip } from './favs.js';
import { toast } from '../ui.js';
import { getLayout, LAYOUT_KEY } from '../layout.js';
import { todayRoll } from './students.js';
import { studyWidget, metroWidget, focusWidget } from './widgets.js';
import { COVER_KEY, paintCover, openCover } from './cover.js';
import { factPicker } from '../music-facts.js';
import { incentiveFor } from '../hero-text.js';
import { recents } from '../recent.js';
import { findStudy, openStudy } from '../study-link.js';
import { homeStrip } from './lembretes.js';

const ORDER_KEY = 'setting-shortcuts';

/** Faixa de parceiros: imagem montada pela Bea com os logos originais (Pad Gorilla, Spark, Nagano) sobre preto. */
export function partnerStrip() {
  return h('aside', { class: 'partners', 'aria-label': 'Parceiros' },
    h('span', { class: 'partners-label' }, 'parceiros'),
    h('img', { class: 'partners-img', src: 'assets/parceiros.png', alt: 'Pad Gorilla, Spark Cajons e Nagano Drums', width: 988, height: 237, decoding: 'async' }));
}

function swash() {
  const w = document.createElement('span');
  w.innerHTML = '<svg class="swash" viewBox="0 0 300 20" aria-hidden="true" preserveAspectRatio="none"><path pathLength="1" d="M3 14 C 48 3, 112 19, 184 8 S 268 5, 296 12"/></svg>';
  return w.firstChild;
}
const spk = (cls) => h('span', { class: `spk ${cls}`, 'aria-hidden': 'true' }, sparkle());

function hero() {
  return h('section', { class: 'hero' },
    spk('s1'), spk('s2'), spk('s3'),
    h('figure', { class: 'hero-photo', role: 'button', tabindex: '0', 'aria-label': 'Trocar a foto da capa', onclick: openCover, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCover(); } } },
      h('span', { class: 'hpi' }, h('img', { src: 'assets/zine/bea-rock.webp', alt: '', width: 160, height: 200, decoding: 'async' })), h('figcaption', {}, 'bora tocar'),
      h('span', { class: 'hero-photo-edit', 'aria-hidden': 'true' }, icon('photo', 16))),
    h('div', { class: 'hero-top' },
      h('div', { class: 'hero-title' },
        h('p', { class: 'hello' }, 'oi, bea!'),
        h('h1', { class: 'brand-word' }, 'Beaterista'),
        swash()),
      h('img', { class: 'hero-logo', src: 'assets/logo-512.png', alt: 'Escola de Música Beaterista', width: 62, height: 62 })),
    h('p', { class: 'date-line' }, longDate()),
    heroNote(),
    paulCheer());
}

/** Paul dá uma palavra de incentivo (muda a cada 8 horas; toque no balão pra ver outra). */
function paulCheer() {
  let off = 0;
  const img = h('img', { class: 'hp-img', alt: '', width: 64, height: 64, decoding: 'async', draggable: 'false' });
  const msg = h('span', { class: 'hp-msg' });
  const paint = () => { const c = incentiveFor(Date.now(), off); msg.textContent = c.text; img.src = `assets/paul/${c.face}.webp`; return c.slot; };
  let slot = paint();
  const el = h('button', { class: 'hero-paul', type: 'button', 'aria-label': 'Palavra de incentivo do Paul. Toque para ver outra.', onclick: () => { off++; paint(); } }, img, h('span', { class: 'hp-bubble' }, msg));
  el.tick = () => { const now = incentiveFor(Date.now(), 0).slot; if (now !== slot) { off = 0; slot = paint(); } };
  return el;
}

/** Bilhete colado do início: uma curiosidade de música ou o sentido de uma canção (muda todo dia; toque para ver outra). */
function heroNote() {
  const picker = factPicker(todayKey());
  const kicker = h('span', { class: 'hero-note-date' }); const msg = h('span', { class: 'hero-note-msg' });
  const links = h('div', { class: 'hero-note-links' }); const study = h('span', { class: 'hero-note-study' }); let seq = 0;
  // música citada no bilhete (“Título” (Artista, ano)): atalho pra ouvir no YouTube (Spotify fica pra depois)
  const queryOf = (text) => { const m = /“([^”]+)”\s*\(([^),]+)/.exec(text) || /“([^”]+)”/.exec(text); return m ? `${m[1]} ${m[2] || ''}`.trim() : ''; };
  let cur = picker.current();
  const paint = () => {
    const [label, text] = cur; kicker.textContent = label; msg.textContent = text;
    const q = queryOf(text); const enc = encodeURIComponent(q);
    const mine = ++seq; study.replaceChildren();
    const sm = /“([^”]+)”\s*\(([^),]+)/.exec(text);
    if (sm) findStudy(sm[1], sm[2]).then((st) => { if (st && mine === seq) study.replaceChildren(h('button', { class: 'hero-note-link', type: 'button', onclick: () => openStudy(st) }, st.label)); });
    else { const bm = /“([^”]+)”/.exec(text); if (bm) findStudy(bm[1], '').then((st) => { if (st && mine === seq) study.replaceChildren(h('button', { class: 'hero-note-link', type: 'button', onclick: () => openStudy(st) }, st.label)); }); }
    links.replaceChildren(...(q ? [
      h('a', { class: 'hero-note-link', href: `https://www.youtube.com/results?search_query=${enc}`, target: '_blank', rel: 'noopener noreferrer' }, '▶ ouvir no YouTube'),
    ] : [h('a', { class: 'hero-note-link', href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${text.split(/[.:]/)[0].slice(0, 70)} bateria`)}`, target: '_blank', rel: 'noopener noreferrer' }, '▶ ver mais sobre isso')]));
  };
  paint();
  const note = h('button', { class: 'hero-note', type: 'button', 'aria-label': 'Curiosidade de música. Toque para ver outra.', onclick: () => { cur = picker.next(); paint(); } },
    kicker, msg,
    h('small', { class: 'hero-note-more' }, 'toque pra ver outra'),
    h('img', { class: 'hero-note-smile', src: 'assets/mural/smile-face.svg', alt: '' }),
    h('img', { class: 'hero-note-bolt', src: 'assets/mural/bolt-red.svg', alt: '' }),
    h('img', { class: 'hero-note-star', src: 'assets/mural/star-ink.svg', alt: '' }));
  return h('div', { class: 'hero-note-wrap' }, note, links, study);
}

function slogan() {
  return h('section', { class: 'slogan' }, h('div', { class: 'orn' }), h('p', {}, 'menos burocracia, mais música.'), h('div', { class: 'orn' }));
}

function orderedModules() {
  const rec = store.get(ORDER_KEY);
  const saved = rec ? rec.data.order || [] : [];
  const bySlug = new Map(MODULES.map((m) => [m.slug, m]));
  const out = saved.filter((s) => bySlug.has(s)).map((s) => bySlug.get(s));
  MODULES.forEach((m) => { if (!out.includes(m)) out.push(m); });
  return out;
}

function stickyNote() {
  const wrap = h('section', { class: 'sticky-wrap', 'aria-label': 'Nota fixada' });
  let id = homeNoteId();
  const rec = id ? store.get(id) : null;
  const ta = h('textarea', { class: 'sticky-text hand', rows: 3, maxlength: 600, placeholder: 'toque aqui e escreva o que não pode esquecer…', 'aria-label': 'Nota fixada na home. Salva sozinha.' }, rec ? rec.data.body || '' : '');
  const state = h('small', { class: 'sticky-state', 'aria-live': 'polite' }, '');
  const save = debounce(async () => {
    if (!id && !ta.value.trim()) return;
    if (!id) {
      const n = await store.upsert('note', null, { title: '', body: ta.value, pinned: true, archived: false });
      id = n.id; await setHomeNote(id);
    } else await store.upsert('note', id, { body: ta.value });
    state.textContent = 'salvo ✓';
  }, 500);
  ta.addEventListener('input', () => { state.textContent = 'salvando…'; save(); });
  ta.addEventListener('blur', () => save.flush());
  // as escutas de window/document precisam sair junto com a tela (antes cada visita ao Início deixava mais uma: dezenas de gravações a cada bloqueio de tela)
  const onHide = () => save.flush();
  const onVis = () => { if (document.visibilityState === 'hidden') save.flush(); };
  addEventListener('pagehide', onHide); document.addEventListener('visibilitychange', onVis);
  wrap.unsub = () => { removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onVis); if (state.textContent === 'salvando…') save.flush(); };
  wrap.append(h('span', { class: 'tape', 'aria-hidden': 'true' }), ta, state);
  // atualização vinda de outro aparelho: só aplica se a pessoa não estiver digitando
  wrap.refresh = () => {
    const nid = homeNoteId(); const r = nid ? store.get(nid) : null;
    if (nid) id = nid;
    if (r && document.activeElement !== ta && r.data.body !== ta.value) ta.value = r.data.body || '';
  };
  return wrap;
}

export function mount(host) {
  let organizing = false;
  const note = stickyNote();
  const mini = h('section', { class: 'card pad mini-list', role: 'link', tabindex: '0', 'aria-label': 'Abrir o checklist para editar' });
  mini.addEventListener('click', (e) => { if (!e.target.closest('.check, a')) location.hash = '#/checklist'; });
  mini.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === mini) location.hash = '#/checklist'; });
  const favRow = h('section', { class: 'fav-row-home' });
  const grid = h('nav', { class: 'shortcuts', 'aria-label': 'Atalhos' });
  const orgBtn = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { organizing = !organizing; drawGrid(); } });

  function drawMini() {
    const items = visibleOn(store.list('task'), todayKey());
    const pending = items.filter((x) => !x.done);
    const show = [...pending, ...items.filter((x) => x.done)].slice(0, 4);
    mini.replaceChildren(
      h('div', { class: 'row between' }, h('h2', { class: 'tag' }, 'hoje'), h('a', { class: 'link', href: '#/checklist' }, items.length ? `${items.length - pending.length}/${items.length} · ver tudo` : 'ver checklist')),
      ...(show.length ? show.map((it) => h('div', { class: `task mini${it.done ? ' done' : ''}` },
        h('button', { class: `check${it.done ? ' on' : ''}`, type: 'button', role: 'checkbox', 'aria-checked': String(it.done), 'aria-label': `${it.done ? 'Desmarcar' : 'Concluir'}: ${it.rec.data.title}`, onclick: (e) => toggleTask(it.rec, e.currentTarget) }, it.done ? icon('tick', 18) : null),
        h('span', { class: 'task-title' }, it.rec.data.title)))
        : [h('p', { class: 'hand muted' }, 'dia livre. bora criar algo?')]));
  }
  function drawFavs() {
    const f = sortedFavs().slice(0, 6);
    // sempre aparece no início: título que abre os Favoritos gerais + os atalhos (ou uma dica quando ainda não tem nenhum)
    favRow.hidden = false;
    favRow.replaceChildren(h('div', { class: 'row between fav-head' }, h('a', { class: 'fav-title', href: '#/favoritos' }, icon('star', 18), ' Favoritos'), h('a', { class: 'link', href: '#/favoritos' }, f.length ? 'ver todos' : 'abrir')),
      f.length ? h('div', { class: 'chips' }, ...f.map(favChip)) : h('p', { class: 'muted fav-empty' }, 'toque na ★ de qualquer tela, texto ou ferramenta pra guardar aqui.'));
  }
  async function saveOrder(slugs) { await store.upsert('setting', ORDER_KEY, { order: slugs }); }
  function drawGrid() {
    const mods = orderedModules();
    orgBtn.textContent = organizing ? 'concluir' : 'organizar';
    grid.replaceChildren(...mods.map((m, i) => {
      const inner = [h('span', { class: 'sc-ico' }, icon(m.icon, 26)), h('span', { class: 'sc-label' }, m.label), !m.route ? h('span', { class: 'soon' }, 'em breve') : null];
      if (organizing) {
        return h('div', { class: 'shortcut org' }, ...inner,
          h('span', { class: 'sc-move' },
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Mover ${m.label} para antes`, disabled: i === 0, onclick: () => { const s = mods.map((x) => x.slug); [s[i - 1], s[i]] = [s[i], s[i - 1]]; saveOrder(s); } }, icon('back', 18)),
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Mover ${m.label} para depois`, disabled: i === mods.length - 1, onclick: () => { const s = mods.map((x) => x.slug); [s[i + 1], s[i]] = [s[i], s[i + 1]]; saveOrder(s); } }, h('span', { style: { display: 'inline-flex', transform: 'scaleX(-1)' } }, icon('back', 18)))));
      }
      return h('a', { class: `shortcut${m.route ? '' : ' locked'}`, href: m.route || `#/em-breve/${m.slug}` }, ...inner);
    }));
  }

  const remStrip = homeStrip();
  const roll = todayRoll({ compact: true });
  const widgets = { estudar: studyWidget(), metro: metroWidget(), foco: focusWidget() };
  const parts = {
    aulas: roll,
    ...widgets,
    nota: note,
    hoje: mini,
    favoritos: favRow,
    atalhos: h('section', { class: 'home-sec' }, h('div', { class: 'row between pad-x' }, h('h2', { class: 'tag' }, 'atalhos'), orgBtn), grid),
    frase: slogan(),
    parceiros: partnerStrip(),
  };
  const recentBox = h('section', { class: 'home-recent', 'aria-label': 'Abertos recentemente' });
  const drawRecent = () => { const l = recents(); recentBox.hidden = !l.length; recentBox.replaceChildren(h('h2', { class: 'tag' }, 'continuar de onde parou'), h('div', { class: 'home-recent-row' }, ...l.map((x) => h('a', { class: 'home-recent-chip', href: x.h }, x.t)))); };
  drawRecent(); document.addEventListener('recents-changed', drawRecent);
  const top = hero();
  const fig = top.querySelector('.hero-photo');
  paintCover(fig);
  function drawLayout() {
    const { order, hidden } = getLayout();
    host.replaceChildren(top, recentBox, remStrip, ...order.filter((id) => !hidden.includes(id)).map((id) => parts[id]));
  }
  drawLayout();
  drawMini(); drawFavs(); drawGrid();
  const off = store.subscribe((i) => {
    if (!i.kind || i.kind === 'task') drawMini();
    if (!i.kind || i.kind === 'fav') drawFavs();
    if (!i.kind || (i.kind === 'setting' && i.id === ORDER_KEY)) drawGrid();
    if (!i.kind || (i.kind === 'setting' && i.id === LAYOUT_KEY)) drawLayout();
    if (!i.kind || i.id === COVER_KEY) paintCover(fig);
    if (i.remote || i.wiped || i.imported || i.kind === 'note' || i.id === HOME_NOTE_KEY) note.refresh();
  });
  // a frase do topo troca sozinha a cada 8 horas: confere a cada minuto (e quando o app volta pra tela)
  const cheer = top.querySelector('.hero-paul'); const tickSub = () => cheer.tick();
  const subTimer = setInterval(tickSub, 60000); document.addEventListener('visibilitychange', tickSub);
  return () => { off(); document.removeEventListener('recents-changed', drawRecent); clearInterval(subTimer); document.removeEventListener('visibilitychange', tickSub); remStrip.unsub(); roll.unsub(); Object.values(widgets).forEach((w) => w.unsub && w.unsub()); note.unsub(); };
}
