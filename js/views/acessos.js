// Acessos dos alunos: quem entrou na área do aluno (aluno.html), quantas vezes e quando foi a última. Só a conta da Bea consegue ler.
import { h } from '../util.js';
import { CONFIG } from '../config.js';
import * as auth from '../auth.js';
import { banner, toast } from '../ui.js';

const when = (iso) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const device = (ua = '') => (/iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : '—');

async function load() {
  const token = await auth.accessToken(); if (!token) throw new Error('entre de novo no app');
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/aluno_visitas?select=*&order=last_seen.desc&limit=500`, { headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(r.status === 404 ? 'a tabela de acessos ainda não foi criada no Supabase' : `erro ${r.status}`);
  return r.json();
}

export function mount(host) {
  const body = h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('p', { class: 'muted' }, 'carregando…'));
  host.append(banner('Acessos dos alunos', 'quem entrou na área do aluno'), body);
  let gone = false;
  const draw = async () => {
    try {
      const rows = await load(); if (gone) return;
      const sem = rows.filter((x) => !x.name).length;
      const today = new Date().toDateString();
      const hoje = rows.filter((x) => new Date(x.last_seen).toDateString() === today).length;
      body.replaceChildren(
        h('section', { class: 'card pad' }, h('b', {}, `${rows.length} aparelho(s) já entraram · ${hoje} hoje`), h('p', { class: 'muted' }, sem ? `${sem} abriu o link mas ainda não escolheu o nome.` : 'todos escolheram um nome.')),
        rows.length ? h('ul', { class: 'al-rank' }, ...rows.map((x) => h('li', { style: 'grid-template-columns: 1fr auto' },
          h('span', {}, h('b', {}, x.name || '(sem nome)'), h('br'), h('small', { class: 'muted' }, `${device(x.ua)} · primeira vez ${when(x.first_seen)}`)),
          h('span', { style: 'text-align:right' }, h('b', {}, `${x.visits}×`), h('br'), h('small', { class: 'muted' }, `última ${when(x.last_seen)}`)))))
          : h('p', { class: 'muted' }, 'ninguém entrou ainda.'),
        h('button', { class: 'btn small', type: 'button', onclick: draw }, 'atualizar'));
    } catch (e) { if (!gone) body.replaceChildren(h('p', { class: 'muted' }, `não consegui carregar: ${e.message}`), h('button', { class: 'btn small', type: 'button', onclick: draw }, 'tentar de novo')); }
  };
  draw();
  return () => { gone = true; };
}
