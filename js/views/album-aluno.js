// Aba "Álbum" da área do aluno: pede o código BEA-0000 do aluno; liberado pela Bea, abre o álbum (e o progresso passa a ficar salvo no Supabase).
import { h, icon } from '../util.js';
import { banner } from '../ui.js';
import * as A from '../figurinhas/acesso.js';
import * as fig from './figurinhas.js';

export function mount(host, parts = []) {
  let inner = null, alive = true;
  const open = (r) => { box.remove(); if (alive) inner = fig.mount(host, parts, { estado: r.estado, salvar: (st) => A.salvar(r.code, st), codigo: r.code, nome: r.nome }); };
  const msg = h('p', { class: 'fig-gate-msg', role: 'alert' });
  const input = h('input', { class: 'field', type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Seu código', placeholder: 'seu código', maxlength: 14 });
  const btn = h('button', { type: 'submit', class: 'btn primary wide' }, 'entrar');
  const tentar = async (codigo, silencioso = false) => {
    btn.disabled = true; msg.textContent = 'conferindo…';
    try {
      const r = await A.entrar(codigo);
      if (r.ok) { open(r); return true; }
      A.esquecer();
      msg.textContent = 'não achei esse código, ou ele foi desativado. confira com a sua professora.';
    } catch { msg.textContent = silencioso ? '' : 'não consegui conferir agora. veja a internet e tente de novo.'; if (silencioso) return 'offline'; }
    btn.disabled = false; if (!silencioso) input.select(); return false;
  };
  const form = h('form', { class: 'fig-gate-form', onsubmit: (e) => { e.preventDefault(); const v = input.value.trim(); if (!v) { msg.textContent = 'digite o seu código'; return; } tentar(v); } }, input, btn, msg);
  const box = h('div', { class: 'fig-gate' }, banner('Álbum', 'só pra alunos da Beaterista'),
    h('div', { class: 'card pad fig-gate-card' }, h('div', { class: 'fig-gate-lock', 'aria-hidden': 'true' }, icon('lock', 40)),
      h('p', {}, 'o álbum de figurinhas é exclusivo da turma. digite o código que a professora te passou.'), form));
  host.append(box);
  (async () => {
    const mem = A.lembrado(); if (!mem) { setTimeout(() => input.focus({ preventScroll: true }), 50); return; }
    input.value = mem;
    const r = await tentar(mem, true);
    if (r === 'offline') { open({ code: mem, estado: null, nome: '' }); } // sem internet: abre com o que o aparelho já tem
  })();
  return () => { alive = false; if (typeof inner === 'function') inner(); };
}
