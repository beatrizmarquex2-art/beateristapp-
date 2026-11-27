// Janela de "Guardar na pasta online": nome, pasta (escolher uma que já existe ou criar) e, se já foi guardada, "guardar como cópia".
import { h, campo, entrada, dialogo } from './ui.js';

/** Devolve { nome, pasta, copia } ou null se cancelou. `pastas` = nomes que já existem. */
export function pedeDestino({ nome = '', pasta = '', jaGuardada = false, pastas = [] } = {}) {
  return new Promise((res) => {
    let resp = null;
    dialogo(jaGuardada ? 'Guardar de novo' : 'Guardar na pasta online', (fechar) => {
      const n = entrada({ value: nome, maxlength: 60, placeholder: 'Nome da partitura', 'aria-label': 'Nome da partitura' });
      const p = entrada({ value: pasta, maxlength: 60, list: 'pro-pastas-g', placeholder: 'Sem pasta', 'aria-label': 'Pasta' }); const dl = h('datalist', { id: 'pro-pastas-g' }, ...pastas.map((x) => h('option', { value: x })));
      const f = h('form', { class: 'pd-f' }, dl, campo('Nome', n), campo('Pasta', p, 'escolha uma que já existe ou digite um nome novo pra criar'),
        h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'),
          jaGuardada ? h('button', { type: 'button', class: 'pb', onclick: () => { if (!n.value.trim()) { n.focus(); return; } resp = { nome: n.value.trim(), pasta: p.value.trim(), copia: true }; fechar(); } }, 'Guardar como cópia') : null,
          h('button', { type: 'submit', class: 'pb ouro' }, jaGuardada ? 'Atualizar esta' : 'Guardar')));
      f.addEventListener('submit', (e) => { e.preventDefault(); if (!n.value.trim()) { n.focus(); return; } resp = { nome: n.value.trim(), pasta: p.value.trim(), copia: false }; fechar(); });
      setTimeout(() => n.focus(), 50); return f;
    }, { aoFechar: () => res(resp) });
  });
}
