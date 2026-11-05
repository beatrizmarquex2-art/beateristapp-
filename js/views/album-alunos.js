// Álbum dos alunos (app da Bea): quem entrou, com qual código, de onde veio, quando e quantas figurinhas colou.
// Também cria código novo e ativa/desativa. Só a conta da Bea consegue (fig_alunos, alunos_codigos e acesso_liberar no Supabase).
import { h } from '../util.js';
import { CONFIG } from '../config.js';
import * as auth from '../auth.js';
import * as Codigo from '../codigo.js';
import { banner, toast } from '../ui.js';

const when = (iso) => (iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '—');
async function rpc(fn, body) {
  const token = await auth.accessToken(); if (!token) throw new Error('entre de novo no app');
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch { /* ok */ } throw new Error(m || (r.status === 404 ? 'o SQL 011 ainda não foi aplicado no Supabase' : `erro ${r.status}`)); }
  return r.json();
}
const TOTAL = 125;

export function mount(host) {
  const body = h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('p', { class: 'muted' }, 'carregando…'));
  host.append(banner('Álbum dos alunos', 'quem entrou, código e de onde veio'), body);
  let gone = false;
  const msgPara = (nome, code) => `Oi${nome ? `, ${nome}` : ''}! Seu código do álbum de figurinhas da Beaterista: ${code}. Entre em jogos.beaterista.com.br, toque na aba Álbum e digite o código (ele também abre o Beat Hero). Bom jogo! 🥁`;
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); toast('mensagem copiada'); } catch { toast(t, { ms: 12000 }); } };
  async function novo() {
    const nome = prompt('Nome do aluno:'); if (nome === null) return;
    try { const code = await Codigo.criar(nome.trim()); await copiar(msgPara(nome.trim(), code)); toast(`código ${code} criado e liberado`); draw(); } catch (e) { toast(`não consegui: ${e.message}`); }
  }
  async function liberar(x, on) { try { if (x.fonte === 'b') await rpc('acesso_liberar', { p_code: x.exibir, p_on: on }); else await Codigo.alterar(x.exibir, { ativo: on }); toast(on ? `${x.exibir} ativado` : `${x.exibir}: acesso tirado`); draw(); } catch (e) { toast(`não consegui: ${e.message}`); } }
  const linha = (x) => {
    const quem = x.aluno || x.nome || '(sem nome)', pct = Math.round((x.coladas / TOTAL) * 100);
    return h('li', { class: 'al-rep' },
      h('div', { class: 'al-rep-top' }, h('b', {}, quem), h('code', { class: 'al-code' }, x.exibir)),
      h('small', { class: 'muted' }, `${x.nome && x.aluno && x.nome !== x.aluno ? `cadastro: ${x.nome} · ` : ''}${x.nomes.length > 1 ? `nomes usados: ${x.nomes.join(', ')} · ` : ''}veio de: ${x.origem || 'não informou'}`),
      h('small', { class: 'muted' }, x.acessos ? `${x.acessos}× · primeira vez ${when(x.primeiro_acesso)} · última ${when(x.ultimo_acesso)}` : 'ainda não entrou'),
      x.ativo ? h('div', { class: 'fig-prog' }, h('div', { class: 'fig-bar' }, h('i', { style: { width: `${pct}%` } })), h('span', {}, `${x.coladas}/${TOTAL} coladas`)) : null,
      h('div', { class: 'al-rep-btn' },
        x.ativo ? h('button', { class: 'btn small', type: 'button', onclick: () => copiar(msgPara(x.aluno || x.nome, x.exibir)) }, 'copiar mensagem') : null,
        h('button', { class: `btn small${x.ativo ? ' ghost' : ' primary'}`, type: 'button', onclick: () => liberar(x, !x.ativo) }, x.ativo ? 'tirar acesso' : 'ativar de novo')));
  };
  const draw = async () => {
    try {
      const rows = await rpc('fig_alunos'); if (gone) return;
      const espera = rows.filter((x) => !x.ativo), ok = rows.filter((x) => x.ativo), hoje = ok.filter((x) => x.ultimo_acesso && new Date(x.ultimo_acesso).toDateString() === new Date().toDateString()).length;
      body.replaceChildren(
        h('section', { class: 'card pad' }, h('b', {}, `${ok.length} aluno(s) com acesso · ${hoje} entraram hoje`), h('p', { class: 'muted' }, espera.length ? `${espera.length} código(s) desativado(s) com histórico.` : 'todos os códigos estão ativos.'),
          h('button', { class: 'btn primary', type: 'button', onclick: novo }, '+ novo código de aluno')),
        espera.length ? h('section', {}, h('h2', { class: 'al-h' }, 'desativados'), h('ul', { class: 'al-list' }, espera.map(linha))) : null,
        h('section', {}, h('h2', { class: 'al-h' }, 'alunos com acesso'), ok.length ? h('ul', { class: 'al-list' }, ok.map(linha)) : h('p', { class: 'muted' }, 'nenhum ainda.')),
        h('button', { class: 'btn small', type: 'button', onclick: draw }, 'atualizar'));
    } catch (e) { if (!gone) body.replaceChildren(h('p', { class: 'muted' }, `não consegui carregar: ${e.message}`), h('button', { class: 'btn small', type: 'button', onclick: draw }, 'tentar de novo')); }
  };
  draw();
  return () => { gone = true; };
}
