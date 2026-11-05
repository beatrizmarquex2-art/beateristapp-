// Aba "Álbum" da área do aluno: pede o código da turma; certo, abre o álbum de figurinhas.
import { h, icon } from '../util.js';
import { banner } from '../ui.js';
import * as A from '../figurinhas/acesso.js';
import * as fig from './figurinhas.js';

export function mount(host, parts = []) {
  let inner = null, alive = true;
  const open = () => { box.remove(); if (alive) inner = fig.mount(host, parts); };
  const msg = h('p', { class: 'fig-gate-msg', role: 'alert' });
  const input = h('input', { class: 'field', type: 'text', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', 'aria-label': 'Código da turma', placeholder: 'código da turma', maxlength: 40 });
  const btn = h('button', { type: 'submit', class: 'btn primary wide' }, 'entrar');
  const form = h('form', { class: 'fig-gate-form', onsubmit: async (e) => {
    e.preventDefault(); const v = input.value.trim(); if (!v) { msg.textContent = 'digite o código'; return; }
    btn.disabled = true; msg.textContent = 'conferindo…';
    try { if (await A.entrar(v)) { open(); return; } msg.textContent = 'esse código não confere. confira com a sua professora.'; }
    catch { msg.textContent = 'não consegui conferir agora. veja a internet e tente de novo.'; }
    btn.disabled = false; input.select();
  } }, input, btn, msg);
  const box = h('div', { class: 'fig-gate' }, banner('Álbum', 'só pra alunos da Beaterista'),
    h('div', { class: 'card pad fig-gate-card' }, h('div', { class: 'fig-gate-lock', 'aria-hidden': 'true' }, icon('lock', 40)),
      h('p', {}, 'o álbum de figurinhas é exclusivo da turma. digite o código que a sua professora passou.'), form));
  host.append(box);
  (async () => {
    const mem = A.lembrado(); if (!mem) { setTimeout(() => input.focus({ preventScroll: true }), 50); return; }
    const v = await A.versao();
    if (!alive) return;
    if (v === null || v === mem.versao) { open(); return; } // sem internet: segue liberado; com internet, só se o código não mudou
    A.esquecer(); msg.textContent = 'o código mudou. digite o novo.';
  })();
  return () => { alive = false; if (typeof inner === 'function') inner(); };
}
