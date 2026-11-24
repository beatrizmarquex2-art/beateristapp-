// Lista da professora: contatos que abriram o "presente do Paul" (nome, e-mail/WhatsApp, idade, instrumento, aceitou novidades).
// Lê/apaga só por funções protegidas (supabase/023_presente_paul.sql); só a conta da Bea consegue. Exporta lista pra ferramentas de e-mail/WhatsApp.
import { h } from '../util.js';
import { toast, confirmSheet } from '../ui.js';
import { CONFIG } from '../config.js';
import { FAIXAS, INSTRUMENTOS } from '../presente-config.js';

const rotFaixa = (v) => (FAIXAS.find((x) => x[0] === v) || [v, v])[1]; const rotInst = (l) => (l.instrumento === 'outro' && l.instrumento_outro ? `Outro: ${l.instrumento_outro}` : (INSTRUMENTOS.find((x) => x[0] === l.instrumento) || [0, l.instrumento])[1]);
const dia = (t) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(t));
async function rpc(fn, body = {}) {
  const auth = await import('../auth.js'); const t = await auth.accessToken(); if (!t) throw new Error('entre no app');
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status === 404 ? 'a função ainda não existe no banco' : String(r.status)); return r.json();
}
const csv = (rows) => ['nome;e-mail;whatsapp;idade;instrumento;novidades;data', ...rows.map((l) => [l.nome, l.email || '', l.whatsapp || '', rotFaixa(l.faixa_idade), rotInst(l), l.aceita_novidades ? 'sim' : 'não', dia(l.criado_em)].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';'))].join('\n');

/** Monta o cartão dentro de `host`. */
export function montarLeads(host) {
  let lista = []; let fInst = ''; let fFaixa = ''; let soNovid = false; let carregado = false;
  const box = h('div', { class: 'pl-lista' }); const resumo = h('p', { class: 'muted' }, 'toque em "carregar" pra ver os contatos.');
  const filtrados = () => lista.filter((l) => (!fInst || l.instrumento === fInst) && (!fFaixa || l.faixa_idade === fFaixa) && (!soNovid || l.aceita_novidades));
  const sel = (opts, atual, on, rot) => { const s = h('select', { class: 'field', 'aria-label': rot }, ...opts.map(([v, t]) => h('option', { value: v }, t))); s.value = atual; s.addEventListener('change', () => on(s.value)); return s; };
  const copia = async (txt, ok) => { try { await navigator.clipboard.writeText(txt); toast(ok, { ms: 2400 }); } catch { toast('não deu pra copiar', { ms: 3000 }); } };
  const acao = async (fn, ok) => { try { await fn(); toast(ok, { ms: 2200 }); await carrega(); } catch (e) { toast(`não deu (${e.message})`, { ms: 3500 }); } };
  const desenha = () => {
    const f = filtrados(); resumo.textContent = `${f.length} de ${lista.length} contato${lista.length === 1 ? '' : 's'} · ${lista.filter((l) => l.aceita_novidades).length} aceitaram novidades`;
    box.replaceChildren(...f.map((l) => h('article', { class: 'pl-item' },
      h('b', {}, l.nome, l.aceita_novidades ? h('span', { class: 'pl-novid' }, 'novidades') : null),
      h('span', {}, [l.email, l.whatsapp].filter(Boolean).join(' · ')), h('span', { class: 'muted' }, `${rotFaixa(l.faixa_idade)} · ${rotInst(l)} · ${dia(l.criado_em)}`),
      h('div', { class: 'row' },
        l.aceita_novidades ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => acao(() => rpc('presente_lead_novidades', { p_id: l.id, p_aceita: false }), 'tirado das novidades') }, 'tirar das novidades') : null,
        h('button', { type: 'button', class: 'btn small ghost', onclick: async () => { if (await confirmSheet('Apagar este contato?', `${l.nome} sai da lista de vez (use quando o responsável pedir).`, 'Apagar')) acao(() => rpc('presente_lead_apagar', { p_id: l.id }), 'contato apagado'); } }, 'apagar'))))); 
  };
  async function carrega() { try { lista = await rpc('presente_leads_listar'); carregado = true; desenha(); } catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra ver os contatos' : `não consegui ler (${e.message})`, { ms: 3500 }); } }
  const filtros = h('div', { class: 'pl-filtros' },
    sel([['', 'todos os instrumentos'], ...INSTRUMENTOS], fInst, (v) => { fInst = v; desenha(); }, 'Filtrar por instrumento'), sel([['', 'todas as idades'], ...FAIXAS], fFaixa, (v) => { fFaixa = v; desenha(); }, 'Filtrar por idade'),
    h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', onchange: (e) => { soNovid = e.target.checked; desenha(); } }), ' só quem aceitou novidades'));
  host.append(h('p', { class: 'muted' }, 'quem abriu o presente do Paul no Início. o contato é do responsável; só mande novidades pra quem marcou a caixinha.'),
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn small', onclick: carrega }, 'carregar contatos'),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => { if (!carregado) return toast('carregue a lista primeiro', { ms: 2200 }); copia(csv(filtrados()), 'lista copiada (cola numa planilha)'); } }, 'copiar lista (planilha)'),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => { if (!carregado) return toast('carregue a lista primeiro', { ms: 2200 }); const e = filtrados().filter((l) => l.aceita_novidades && l.email).map((l) => l.email); copia(e.join(', '), `${e.length} e-mails copiados (só quem aceitou novidades)`); } }, 'copiar e-mails (novidades)')),
    filtros, resumo, box);
}
