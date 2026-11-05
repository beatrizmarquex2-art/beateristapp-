// Códigos liberados: a Bea digita o BEA-0000 que o aluno falou e libera (ou tira) o acesso completo na área dos alunos.
import { h } from '../util.js';
import { CONFIG } from '../config.js';
import * as auth from '../auth.js';
import { banner, toast, confirmSheet } from '../ui.js';
import { normCode } from '../kids/savegame-logic.js';

async function rpc(fn, body = {}) {
  const token = await auth.accessToken(); if (!token) throw new Error('entre de novo no app');
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status === 404 ? 'o SQL 008 ainda não foi aplicado no Supabase' : `erro ${r.status}`);
  return r.json();
}
const when = (iso) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export function mount(host) {
  const list = h('div', {}, h('p', { class: 'muted' }, 'carregando…'));
  const inp = h('input', { class: 'input', inputmode: 'numeric', maxlength: '8', placeholder: 'BEA-0000', 'aria-label': 'código do aluno' });
  let gone = false;
  const set = async (code, on) => {
    try { const ok = await rpc('acesso_liberar', { p_code: code, p_on: on });
      if (!ok) { toast('esse código ainda não existe (o aluno precisa gerar no álbum)', { ms: 3500 }); return; }
      toast(on ? `${code} liberado ✓` : `${code} voltou pro grátis`, { ms: 2200 }); draw();
    } catch (e) { toast(`não deu: ${e.message}`, { ms: 3500 }); }
  };
  const add = () => { const c = normCode(inp.value); if (!c) { toast('digita os 4 números', { ms: 2000 }); inp.focus(); return; } inp.value = ''; set(c, true); };
  const draw = async () => {
    try {
      const rows = await rpc('acesso_listar'); if (gone) return;
      const lib = rows.filter((x) => x.liberado).length;
      list.replaceChildren(
        h('p', { class: 'muted' }, `${lib} liberado(s) · ${rows.length - lib} só no grátis`),
        rows.length ? h('ul', { class: 'al-rank' }, ...rows.map((x) => h('li', { style: 'grid-template-columns: 1fr auto' },
          h('span', {}, h('b', {}, x.code), ' ', x.nome || '(sem nome)', h('br'), h('small', { class: 'muted' }, `${x.figurinhas} figurinhas · ${x.estrelas} ★ · mexeu ${when(x.atualizado)}`)),
          h('button', { class: `btn small${x.liberado ? '' : ' ghost'}`, type: 'button', 'aria-pressed': String(x.liberado), onclick: async () => {
            if (x.liberado && !(await confirmSheet(`tirar a liberação de ${x.nome || x.code}?`, 'volta a ver só o grátis.', 'tirar'))) return;
            set(x.code, !x.liberado); } }, x.liberado ? '🔓 liberado' : '🔒 liberar'))))
          : h('p', { class: 'muted' }, 'nenhum código ainda. eles aparecem quando o aluno gera no álbum.'));
    } catch (e) { if (!gone) list.replaceChildren(h('p', { class: 'muted' }, `não consegui carregar: ${e.message}`), h('button', { class: 'btn small', type: 'button', onclick: draw }, 'tentar de novo')); }
  };
  host.append(banner('Códigos liberados', 'quem abre tudo em jogos.beaterista.com.br'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
      h('section', { class: 'card pad' }, h('b', {}, 'liberar um aluno'), h('p', { class: 'muted' }, 'digite o código que o aluno te passou (BEA-0000). ele abre Beat Hero, Piano Hero, modo aula, jogos das dicas e Beat Lab.'),
        h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: add }, 'liberar'))),
      h('section', { class: 'card pad' }, list)));
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  draw();
  return () => { gone = true; };
}
