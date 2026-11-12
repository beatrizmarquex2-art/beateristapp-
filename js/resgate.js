// Resgate por print: o aluno manda o print de uma missão (Google, YouTube, amigo) ou da compra de 3 produtos (lendária) e a Bea aprova no app.
// O print vai privado pro Supabase (tabela resgates_print, só a Bea lê) e é apagado quando ela aprova ou recusa. Recompensa chega sozinha no aparelho do aluno.
import { CONFIG } from './config.js';
import * as CODE from './codigo.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const anon = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
export const ESTRELAS_MISSAO = 5;
export const MISSOES = [
  { tipo: 'google', titulo: 'avaliou a escola no Google', dica: 'avalie a escola e tire um print da sua avaliação publicada', link: 'https://g.page/r/CS34GVfs3jjqEAE/review', rotulo: 'avaliar no Google' },
  { tipo: 'youtube', titulo: 'seguiu no YouTube', dica: 'se inscreva no canal da Bea e tire um print mostrando "inscrito"', link: 'https://www.youtube.com/@beateristadrummer', rotulo: 'abrir o canal' },
  { tipo: 'amigo', titulo: 'mandou pra um amigo', dica: 'mande o app pra um amigo e tire um print da conversa', link: 'https://jogos.beaterista.com.br', rotulo: 'copiar o link do app' },
];
export const TIPO_NOME = { google: 'avaliou no Google', youtube: 'seguiu no YouTube', amigo: 'mandou pra um amigo', lendaria: 'lendária (compra de produtos da Lojinha)' };
const rpc = async (nome, corpo) => { const r = await fetch(`${base}/rpc/${nome}`, { method: 'POST', headers: anon, body: JSON.stringify(corpo) }); if (!r.ok) throw new Error(String(r.status)); return r.json(); };

/** Reduz o print (lado maior 900 px, JPEG) e devolve o base64 puro. Fica bem abaixo do limite do banco (900 mil caracteres). */
export async function comprimir(file, max = 900) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('imagem')); i.src = url; });
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); let q = 0.72; let d = c.toDataURL('image/jpeg', q);
    while (d.length > 700000 && q > 0.3) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
    return d.split(',')[1];
  } finally { URL.revokeObjectURL(url); }
}
/** Devolve 'ok' | 'codigo' (sem código válido) | 'ja_enviado' | 'invalido'. */
export async function enviar(tipo, file, nome = '') { const b64 = await comprimir(file); return rpc('resgate_enviar', { p_code: CODE.saved(), p_nome: nome, p_tipo: tipo, p_print: b64 }); }
export const minhas = () => (CODE.saved() ? rpc('resgate_minhas', { p_code: CODE.saved() }) : Promise.resolve([]));
export const entregar = (id) => rpc('resgate_entregar', { p_code: CODE.saved(), p_id: id });
/** Próxima lendária que a pessoa ainda não tem (pra entregar quando a compra é aprovada). Puro. */
export const proximaLendaria = (lend, todas) => (todas.map((x) => x.codigo).find((c) => !(lend || []).includes(c)) || null);

/* ---------- lado da Bea (precisa estar logada) ---------- */
const head = async () => { const auth = await import('./auth.js'); const t = await auth.accessToken(); if (!t) throw new Error('entre no app'); return { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }; };
export async function pendentes() { const r = await fetch(`${base}/resgates_print?status=eq.pendente&select=id,code,nome,tipo,print_b64,criado_em&order=criado_em.asc&limit=100`, { headers: await head() }); if (!r.ok) throw new Error(String(r.status)); return r.json(); }
export async function quantosPendentes() { const r = await fetch(`${base}/resgates_print?status=eq.pendente&select=id`, { headers: { ...(await head()), Prefer: 'count=exact', Range: '0-0' } }); if (!r.ok) throw new Error(String(r.status)); const m = /\/(\d+)$/.exec(r.headers.get('content-range') || ''); return m ? Number(m[1]) : 0; }
export async function decidir(id, status, obs = '') { const r = await fetch(`${base}/resgates_print?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { ...(await head()), Prefer: 'return=minimal' }, body: JSON.stringify({ status, obs: String(obs).slice(0, 200) }) }); if (!r.ok) throw new Error(String(r.status)); }
