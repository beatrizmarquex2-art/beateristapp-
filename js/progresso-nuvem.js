// Progresso do aluno na nuvem (pedido da Bea, 18/nov/2026): quem joga em casa continua na escola, em outro aparelho.
// Vale só pra quem tem CÓDIGO de aluno (o código é a chave; sem código não há como achar o progresso em outro aparelho).
// Guarda: o progresso dos jogos (por jogo, o mais recente ganha), os estudos/caminhos feitos e as melhores marcas. O álbum de figurinhas já tinha a sua própria nuvem.
// Nunca guarda: código, nome, tema, som, calibração do aparelho. Tudo falha em silêncio: sem internet o aparelho continua com o dele e manda depois.
import { CONFIG } from './config.js';
import * as CODE from './codigo.js';
import { jogosParaNuvem, jogosDaNuvem } from './jogos/base.js';
import * as FAV from './inicio-fav.js';

const OUTROS = ['beaterista-teoria-feitas', 'beaterista-estudos-vistos', 'beaterista-estudos-meta', 'beaterista-caminhos-feitos', 'beaterista-aluno-ritmo', 'beaterista-toca-aventura', 'beaterista-fuga-melhor'];
const DEVICE = /calib|latenc|atraso|offset|delay|aparelho/i; // medidas deste aparelho: nunca viajam
const ST = 'beaterista-progresso-nuvem'; // { hash do último envio }
const call = (fn, body) => fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', keepalive: true, headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
const ler = (k) => { try { const v = localStorage.getItem(k); return v == null ? undefined : JSON.parse(v); } catch { return undefined; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
const limpa = (v) => (Array.isArray(v) ? v.map(limpa) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !DEVICE.test(k)).map(([k, x]) => [k, limpa(x)])) : v);

/** Mescla sem perder nada: arrays = união; números = o maior; booleanos = "sim" vence; objetos = campo a campo; texto = o local. */
export function mescla(a, b) {
  if (a === undefined) return b; if (b === undefined) return a;
  if (Array.isArray(a) && Array.isArray(b)) { const vistos = new Set(); return [...a, ...b].filter((x) => { const k = JSON.stringify(x); if (vistos.has(k)) return false; vistos.add(k); return true; }); }
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = mescla(a[k], b[k]); return o; }
  return a;
}
/** Cada jogo: fica o que foi mexido por último (__t). Sem __t (versões antigas), o que tem mais conteúdo. */
export function mesclaJogos(l, r) {
  const out = { ...(r || {}) };
  for (const [id, g] of Object.entries(l || {})) {
    const o = out[id];
    if (!o) { out[id] = g; continue; }
    const tl = Number(g && g.__t) || 0, tr = Number(o && o.__t) || 0;
    out[id] = tl > tr ? g : tr > tl ? o : (JSON.stringify(g).length >= JSON.stringify(o).length ? g : o);
  }
  return out;
}
export function coleta() {
  const outros = {}; for (const k of OUTROS) { const v = ler(k); if (v !== undefined) outros[k] = limpa(v); }
  const fav = FAV.paraNuvem(); if (fav) outros[FAV.CHAVE_NUVEM] = fav; // bandas favoritas do Início (o mais recente ganha, ver inicio-fav.js)
  return { v: 1, jogos: limpa(jogosParaNuvem().games), outros };
}
const hash = (o) => { const s = JSON.stringify(o); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return `${s.length}:${h}`; };
const ultimoEnvio = () => { try { return localStorage.getItem(ST) || ''; } catch { return ''; } };
const marca = (h) => { try { localStorage.setItem(ST, h); } catch { /* ok */ } };

let parado = false; // true quando o servidor recusou o código (desativado): para de tentar
const codigo = () => CODE.saved();
/** Manda o progresso se mudou desde o último envio. */
export async function enviar(forcar = false) {
  const c = codigo(); if (!c || parado) return false;
  const d = coleta(); const h = hash(d); if (!forcar && h === ultimoEnvio()) return false;
  try { const ok = await call('prog_salvar', { p_code: c, p_dados: d }); if (ok === true) { marca(h); return true; } if (ok === false) parado = true; } catch { /* sem internet: tenta de novo depois */ }
  return false;
}
/** Traz o progresso da nuvem e junta com o deste aparelho (nada se perde nos dois lados). Chamar ANTES de desenhar as telas. */
export async function puxar(ms = 4000) {
  const c = codigo(); if (!c) return false;
  try {
    const r = await Promise.race([call('prog_ler', { p_code: c }), new Promise((_, rej) => setTimeout(() => rej(new Error('demorou')), ms))]);
    if (!r || !r.ok) return false;
    const nuvem = r.dados && typeof r.dados === 'object' ? r.dados : null;
    if (nuvem && nuvem.jogos) {
      const local = coleta(); const g = mesclaJogos(local.jogos, nuvem.jogos);
      const atual = jogosParaNuvem().games; jogosDaNuvem({ ...g, ...Object.fromEntries(Object.keys(g).map((k) => [k, mescla2(atual[k], g[k])])) });
      for (const k of OUTROS) { const novo = mescla(local.outros[k], nuvem.outros && nuvem.outros[k]); if (novo !== undefined) { const orig = ler(k); gravar(k, orig && typeof orig === 'object' && !Array.isArray(orig) ? mescla(novo, orig) : novo); } }
    }
    try { FAV.daNuvem(nuvem && nuvem.outros && nuvem.outros[FAV.CHAVE_NUVEM]); } catch { /* ok */ }
    await enviar(true); // o que só existe neste aparelho sobe agora
    return true;
  } catch { return false; }
}
// parte do jogo que é do aparelho (calibração etc.) não é sobrescrita pela nuvem
const mescla2 = (atual, novo) => (atual && typeof atual === 'object' && novo && typeof novo === 'object' ? { ...novo, ...Object.fromEntries(Object.entries(atual).filter(([k]) => DEVICE.test(k))) } : novo);

let on = false;
/** Liga o envio automático: a cada 40 s se mudou, ao esconder a tela/sair do app e quando a internet volta. */
export function iniciar() {
  if (on) return; on = true;
  setInterval(() => { if (!document.hidden) enviar(); }, 40000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) enviar(); });
  addEventListener('pagehide', () => { enviar(); });
  addEventListener('online', () => enviar());
}
