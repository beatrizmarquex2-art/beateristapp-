// Acesso da área dos alunos (jogos.beaterista.com.br). Todo mundo entra e joga o básico (Jogos grátis, Tocar, Ranking).
// Quem tem o código BEA-0000 liberado pela Bea (tela "Códigos liberados" no app dela) abre o resto: o que está com 🔒 aparece destravado.
// A trava é do app (guardada no aparelho): serve pra organizar o que é de aluno; o conteúdo pago de verdade precisa de checagem no servidor.
import { h } from './util.js';
import { CONFIG } from './config.js';
import { sheet, toast } from './ui.js';
import * as store from './store.js';
import * as P from './kids/progress.js';
import * as Cloud from './kids/album-cloud.js';
import { normCode, resumo } from './kids/savegame-logic.js';

const KEY = 'beaterista-aluno-liberado';
const head = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
const isAluno = () => document.documentElement.classList.contains('aluno-on');
const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return !!window.__liberado; } };
const write = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { window.__liberado = v; } };

/** No app da Bea tudo é liberado. Na área dos alunos, só com código liberado. */
export const liberado = () => !isAluno() || read();

/** Recursos que dependem do código liberado (chave → texto). Tudo o que não está aqui é livre. */
export const TRAVA = {
  ritmo: 'Beat Hero e Piano Hero', dicas: 'quiz e letras e as 30 dicas', dicionario: 'o dicionário da bateria', aula: 'modo aula (professor)', beatlab: 'Beat Lab',
};
export const bloqueado = (k) => !liberado() && k in TRAVA;

async function rpc(fn, body) {
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: head, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status)); return r.json();
}
const emit = () => window.dispatchEvent(new CustomEvent('acesso'));

/** Pergunta ao servidor se o código desse jogador está liberado (sem internet: mantém o que já estava). */
/** Traz as 30 dicas (só o servidor entrega, e só pra código liberado) e guarda no aparelho: o quiz e as letras usam elas. */
export async function carregarDicas() {
  const me = P.active(); const code = me ? Cloud.codeOf(me.id) : ''; if (!code) return 0;
  try {
    const rows = await rpc('dicas_ler', { p_code: code });
    for (const r of rows) await store.upsert('tip', `dica-${r.n}`, { n: r.n, text: r.texto });
    return rows.length;
  } catch { return 0; }
}

export async function refresh() {
  if (!isAluno()) return true;
  const me = P.active(); const code = me ? Cloud.codeOf(me.id) : '';
  const before = read();
  if (!code) { write(false); if (before) emit(); return false; }
  try { const ok = (await rpc('acesso_ler', { p_code: code })) === true; write(ok); if (ok) carregarDicas(); if (ok !== before) emit(); return ok; } catch { return before; }
}

/** Folha "tenho um código": confere, junta o álbum e libera se a Bea já liberou. */
export function promptCode(why = '') {
  const me = P.active();
  sheet('🔒 só pra alunos', (close) => {
    const inp = h('input', { class: 'input', inputmode: 'numeric', maxlength: '8', placeholder: 'BEA-0000', 'aria-label': 'código do aluno' });
    const go = async () => {
      const c = normCode(inp.value); if (!c) { toast('digita os 4 números do código', { ms: 2200 }); return; }
      let snap; try { snap = await Cloud.peek(c); } catch { toast('sem internet. tenta de novo', { ms: 2500 }); return; }
      if (!snap) { toast('não achei esse código', { ms: 2500 }); return; }
      let ok = false; try { ok = (await rpc('acesso_ler', { p_code: c })) === true; } catch { toast('sem internet. tenta de novo', { ms: 2500 }); return; }
      if (!ok) { toast('esse código ainda não foi liberado pela Bea', { ms: 3500 }); return; }
      if (me) await Cloud.adopt(me, c, snap);
      write(true); carregarDicas(); emit(); close(); toast(`liberado, ${resumo(snap).nome}! ✓`, { ms: 2500 });
    };
    return h('div', { class: 'sheet-body' },
      h('p', {}, why ? `${why} é pra alunos da Beaterista.` : 'essa parte é pra alunos da Beaterista.'),
      h('p', { class: 'muted' }, 'a Bea libera o seu código BEA-0000. já é aluno? digita o código aqui:'),
      h('div', { class: 'row' }, inp, h('button', { class: 'kd-btn', type: 'button', onclick: go }, 'liberar')));
  });
}

/** Selinho 🔒 pros cartões. */
export const cadeado = () => h('span', { class: 'ac-lock', 'aria-label': 'só pra alunos', title: 'só pra alunos' }, '🔒');
