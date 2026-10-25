import { h, icon } from '../util.js';
import { sheet, toast } from '../ui.js';
import * as store from '../store.js';
import { THEMES, FONTS, currentTheme, setTheme, currentFont, setFont, motionOn, setMotion } from '../theme.js';
import { openCover } from './cover.js';
import { HERO_SUBS, heroSub, setHeroSub } from '../hero-text.js';
import { SECTIONS, LAYOUT_KEY, getLayout, saveLayout, resetLayout } from '../layout.js';

const sw = (on, label, onToggle) => h('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(on), 'aria-label': label, onclick: onToggle });

export function openPersonalize() {
  sheet('Personalizar', () => {
    const themes = h('div', { class: 'themes', role: 'radiogroup', 'aria-label': 'Tema do app' });
    const fonts = h('div', { class: 'themes', role: 'radiogroup', 'aria-label': 'Fonte dos títulos' });
    const secs = h('div', { class: 'sec-list' });
    const subs = h('div', { class: 'chips wrap hero-subs', role: 'radiogroup', 'aria-label': 'Frase do topo' });
    const own = h('input', { type: 'text', maxlength: 48, placeholder: 'ou escreva a sua…', 'aria-label': 'Frase do topo personalizada' });
    own.addEventListener('change', () => { const v = own.value.trim(); if (v) { setHeroSub(v); toast('frase trocada ✓'); } });
    const motion = h('div', { class: 'sec-row' });

    function drawThemes() {
      const cur = currentTheme();
      themes.replaceChildren(...THEMES.map((t) => h('button', { class: 'theme-opt', type: 'button', role: 'radio', 'aria-checked': String(t.id === cur), onclick: () => setTheme(t.id) },
        h('span', { class: 'swatches', 'aria-hidden': 'true' }, ...t.sw.map((c) => h('i', { style: { background: c } }))),
        h('span', {}, h('strong', {}, t.nome), h('small', {}, t.desc)),
        h('span', { class: 'tick', 'aria-hidden': 'true' }, t.id === cur ? icon('tick', 14) : null))));
    }
    function drawFonts() {
      const cur = currentFont();
      fonts.replaceChildren(...FONTS.map((f) => h('button', { class: 'theme-opt font-opt', type: 'button', role: 'radio', 'aria-checked': String(f.id === cur), onclick: () => setFont(f.id) },
        h('span', { class: 'font-sample', style: { fontFamily: `"${f.family}"`, fontStyle: f.id === 'bodoni' ? 'italic' : 'normal' }, 'aria-hidden': 'true' }, 'Estudos'),
        h('span', {}, h('strong', {}, f.nome), h('small', {}, f.desc)),
        h('span', { class: 'tick', 'aria-hidden': 'true' }, f.id === cur ? icon('tick', 14) : null))));
    }
    function drawSubs() {
      const cur = heroSub();
      subs.replaceChildren(...HERO_SUBS.map((t) => h('button', { type: 'button', class: `lib-tab${t === cur ? ' on' : ''}`, role: 'radio', 'aria-checked': String(t === cur), onclick: () => setHeroSub(t) }, t)));
      if (!HERO_SUBS.includes(cur) && document.activeElement !== own) own.value = cur;
    }
    function drawSecs() {
      const { order, hidden } = getLayout();
      const label = Object.fromEntries(SECTIONS.map((s) => [s.id, s.label]));
      // pula as seções ocultas: o movimento sempre aparece na tela
      const move = (i, d) => { const o = [...order]; let j = i + d; while (j > 0 && j < o.length - 1 && hidden.includes(o[j])) j += d; if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; saveLayout(o, hidden); };
      secs.replaceChildren(...order.map((id, i) => {
        const off = hidden.includes(id);
        return h('div', { class: `sec-row${off ? ' off' : ''}` },
          h('span', {}, label[id]),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Subir ${label[id]}`, disabled: i === 0, onclick: () => move(i, -1) }, icon('up', 20)),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Descer ${label[id]}`, disabled: i === order.length - 1, onclick: () => move(i, 1) }, icon('down', 20)),
          sw(!off, `${off ? 'Mostrar' : 'Ocultar'} ${label[id]}`, () => saveLayout(order, off ? hidden.filter((x) => x !== id) : [...hidden, id])));
      }));
    }
    function drawMotion() {
      motion.replaceChildren(h('span', {}, h('span', {}, 'Animações leves'), h('small', { style: { display: 'block', fontWeight: 400 } }, 'o iPhone em “Reduzir movimento” sempre desliga')),
        sw(motionOn(), 'Animações leves', () => setMotion(!motionOn())));
    }
    const draw = () => { drawThemes(); drawFonts(); drawSubs(); drawSecs(); drawMotion(); };
    draw();
    const off = store.subscribe((i) => { if (!i.kind || i.kind === 'setting') draw(); });
    const obs = new MutationObserver(() => { if (!document.body.contains(secs)) { off(); obs.disconnect(); } });
    obs.observe(document.getElementById('overlay'), { childList: true, subtree: true });

    return h('div', { class: 'sheet-body' },
      THEMES.length > 1 ? h('h3', { class: 'sec-title' }, 'Tema') : null, THEMES.length > 1 ? themes : null,
      h('h3', { class: 'sec-title' }, 'Fonte dos títulos'), fonts,
      h('h3', { class: 'sec-title' }, 'Frase do topo'), subs, own,
      h('h3', { class: 'sec-title' }, 'Foto da capa'),
      h('button', { class: 'btn ghost small', type: 'button', onclick: openCover }, 'Trocar foto da capa'),
      h('h3', { class: 'sec-title' }, 'Início: o que aparece e em que ordem'), secs,
      h('button', { class: 'btn ghost small', type: 'button', onclick: async () => { await resetLayout(); toast('Início voltou à ordem original.'); } }, 'Restaurar ordem do início'),
      h('h3', { class: 'sec-title' }, 'Movimento'), motion,
      h('p', { class: 'muted' }, 'Os atalhos você reorganiza na própria tela inicial, no botão “organizar”.'));
  });
}
