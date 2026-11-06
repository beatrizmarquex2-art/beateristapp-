// Cliente do Passe (site do aluno). Fala só com as funções passe_* do Supabase (nada de chave secreta aqui).
// Em preview de teste (?loja=on) usa uma SIMULAÇÃO em memória, que nunca toca em produção: e-mail teste@exemplo.com + código PAUL1234.
import { CONFIG } from '../config.js';
import { modoTeste } from './flags.js';

const base = () => `${CONFIG.SUPABASE_URL}/rest/v1/rpc`;
const call = (fn, body) => fetch(`${base()}/${fn}`, { method: 'POST', headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));

/* ---------- simulação local (somente modo teste) ---------- */
const MK = 'bt-loja-sim';
const simLer = () => { try { return JSON.parse(localStorage.getItem(MK)) || { passe: null, usado: false, bonus: false }; } catch { return { passe: null, usado: false, bonus: false }; } };
const simGravar = (v) => { try { localStorage.setItem(MK, JSON.stringify(v)); } catch { /* ok */ } };
export const SIM = { email: 'teste@exemplo.com', codigo: 'PAUL1234', code: 'PSSIMULA1' };
const DIA = 864e5;
const sim = {
  async status(code) {
    const s = simLer();
    if (code !== SIM.code || !s.passe) return { tipo: 'nenhum' };
    const exp = new Date(s.passe.expira_em).getTime();
    return { tipo: 'passe', estado: s.passe.revogado ? 'revogado' : exp <= Date.now() ? 'vencido' : 'ativo', expira_em: s.passe.expira_em, bonus_resgatado: s.bonus };
  },
  async ativar(email, codigo) {
    const s = simLer();
    if (String(email).trim().toLowerCase() !== SIM.email || String(codigo).trim().toUpperCase() !== SIM.codigo || s.usado) return { ok: false, motivo: 'codigo' };
    s.usado = true; s.passe = { expira_em: new Date(Date.now() + 365 * DIA).toISOString(), revogado: false }; simGravar(s);
    return { ok: true, code: SIM.code, expira_em: s.passe.expira_em, bonus_pendente: !s.bonus };
  },
  async resgatarBonus(code) {
    const s = simLer(); if (code !== SIM.code || !s.passe || s.passe.revogado || new Date(s.passe.expira_em) <= Date.now()) return { ok: false, motivo: 'sem_passe' };
    const novo = !s.bonus; s.bonus = true; simGravar(s); return { ok: true, novo, ids: ['P01', 'P02', 'P03'] };
  },
};
/** Atalhos de teste: simulam o que o webhook faria (só existem no preview). */
export const simular = {
  comprar() { simGravar({ passe: null, usado: false, bonus: false }); return `e-mail ${SIM.email} · código ${SIM.codigo}`; },
  vencer() { const s = simLer(); if (s.passe) { s.passe.expira_em = new Date(Date.now() - DIA).toISOString(); simGravar(s); } },
  revogar() { const s = simLer(); if (s.passe) { s.passe.revogado = true; simGravar(s); } },
  zerar() { try { localStorage.removeItem(MK); } catch { /* ok */ } },
  renovar() { const s = simLer(); if (s.passe) { s.passe.expira_em = new Date(Math.max(Date.now(), new Date(s.passe.expira_em)) + 365 * DIA).toISOString(); s.passe.revogado = false; simGravar(s); } },
};

const norm = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
const real = {
  status: (code) => call('passe_status', { p_code: norm(code) }),
  ativar: (email, codigo) => call('passe_ativar', { p_email: String(email || '').trim().toLowerCase(), p_codigo: String(codigo || '').trim().toUpperCase() }),
  resgatarBonus: (code) => call('passe_resgatar_bonus', { p_code: norm(code) }),
};
const impl = () => (modoTeste() ? sim : real);
/** { tipo: 'nenhum'|'aluno'|'passe', estado?, expira_em?, bonus_resgatado? } (lança erro sem internet) */
export const status = (code) => (code ? impl().status(norm(code)) : Promise.resolve({ tipo: 'nenhum' }));
export const ativar = (email, codigo) => impl().ativar(email, codigo);
export const resgatarBonus = (code) => impl().resgatarBonus(norm(code));
