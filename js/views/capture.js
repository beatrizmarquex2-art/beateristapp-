import { h } from '../util.js';
import { sheet } from '../ui.js';
import { taskForm } from './tasks.js';
import { noteEditor } from './notes.js';
import { favForm } from './favs.js';
import { ideaForm } from './ideias.js';

const SOON = [];

/** Captura rápida (+). Só oferece o que já existe; o resto aparece desabilitado com a fase. */
export function openCapture() {
  sheet('Capturar rápido', (close) => {
    const body = h('div', { class: 'sheet-body' });
    const show = (builder) => body.replaceChildren(builder(close));
    const picker = () => h('div', {},
      h('div', { class: 'capture-grid' },
        h('button', { class: 'btn', type: 'button', onclick: () => show((c) => noteEditor(null, c)) }, 'Nota'),
        h('button', { class: 'btn', type: 'button', onclick: () => show((c) => taskForm(null, c)) }, 'Tarefa'),
        h('button', { class: 'btn', type: 'button', onclick: () => show((c) => favForm(null, c)) }, 'Link / favorito'),
        h('button', { class: 'btn', type: 'button', onclick: () => show((c) => ideaForm(c)) }, 'Ideia'),
        SOON.map(([t, ph]) => h('button', { class: 'btn ghost', type: 'button', disabled: true, 'aria-label': `${t} — ${ph ? `chega na fase ${ph}` : 'ainda sem data'}` }, t, h('small', {}, ph ? `fase ${ph}` : 'em breve')))));
    body.append(picker());
    return body;
  });
}
