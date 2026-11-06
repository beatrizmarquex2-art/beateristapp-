// Passe Beaterista (só a Bea): consultar compras e acessos, reemitir o código PAUL#### e revogar. Tudo passa por funções do Supabase que conferem a sua conta e gravam auditoria (supabase/013_passe.sql).
import { h } from '../util.js';
import { banner, toast, confirmSheet } from '../ui.js';
import { CONFIG } from '../config.js';

const dia = (t) => (t ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(t)) : '—');
async function rpc(fn, body = {}) {
  const auth = await import('../auth.js'); const t = await auth.accessToken(); if (!t) throw new Error('entre no app');
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status)); return r.json();
}
export function mount(host) {
  let gone = false; const box = h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('p', { class: 'muted' }, 'carregando…'));
  host.append(banner('Passe Beaterista', 'compras, códigos e acessos'), box);
  async function load() {
    try {
      const rows = await rpc('passe_admin_listar'); if (gone) return;
      box.replaceChildren(h('p', { class: 'muted' }, 'o código PAUL#### é de uso único e só vale com o e-mail da compra. copie e mande pelo seu canal de sempre.'),
        ...(rows.length ? rows.map((x) => h('section', { class: 'card pad' },
          h('b', {}, x.email), h('p', { class: 'muted' }, `${x.estado} · vale até ${dia(x.expira_em)} · bônus ${x.bonus ? 'aberto' : 'não aberto'}`),
          h('p', { class: 'muted' }, `compras: ${(x.compras || []).map((c) => `${c.transacao} (${c.estado}${c.ambiente === 'teste' ? ', teste' : ''})`).join(', ') || '—'}`),
          h('p', { class: 'muted' }, `códigos: ${(x.codigos || []).map((c) => `${c.codigo} (${c.estado})`).join(', ') || '—'}`),
          h('div', { class: 'row' },
            h('button', { class: 'btn small', type: 'button', onclick: async () => { try { const c = await rpc('passe_admin_reemitir', { p_email: x.email }); try { await navigator.clipboard.writeText(c); } catch { /* ok */ } toast(`novo código ${c} (copiado)`); load(); } catch { toast('não deu pra reemitir (Passe ativo?)'); } } }, 'reemitir código'),
            h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await confirmSheet('revogar o Passe?', `${x.email} perde o acesso do Passe. o progresso fica guardado.`, 'revogar')) { try { await rpc('passe_admin_revogar', { p_email: x.email, p_motivo: 'revogado pela Bea' }); toast('Passe revogado'); load(); } catch { toast('não consegui revogar'); } } } }, 'revogar'))))
          : [h('p', { class: 'muted' }, 'nenhuma compra ainda.')]));
    } catch (e) { if (!gone) box.replaceChildren(h('p', { class: 'muted' }, e.message === 'entre no app' ? 'entre no app pra ver o Passe' : e.message === '404' ? 'o Passe ainda não foi criado no Supabase (migration 013).' : 'não consegui carregar agora.')); }
  }
  load();
  return () => { gone = true; };
}
