// Resgate por print: o aluno manda o print de uma missão (Google, YouTube, amigo) ou da compra de 3 produtos (lendária) e a Bea aprova no app.
// O print vai privado pro Supabase (tabela resgates_print, só a Bea lê) e é apagado quando ela aprova ou recusa. Recompensa chega sozinha no aparelho do aluno.
import { CONFIG } from './config.js';
import * as CODE from './codigo.js';

const base = `${CONFIG.SUPABASE_URL}/rest/v1`;
const anon = { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
export const ESTRELAS_MISSAO = 5;
export const MISSOES = [
  { tipo: 'google', titulo: 'avaliou a escola no Google', dica: 'avalie a escola e tire um print da sua avaliação publicada', link: 'https://g.page/r/CS34GVfs3jjqEAE/review', rotulo: 'avaliar no Google' },
  { tipo: 'youtube', titulo: 'seguiu no YouTube ou nas redes', dica: 'siga a Bea no YouTube, no Instagram ou no TikTok e tire um print mostrando que você segue', link: 'https://www.youtube.com/@beateristadrummer', rotulo: 'YouTube', extras: [['Instagram', 'https://www.instagram.com/beaterista_/'], ['TikTok', 'https://www.tiktok.com/@beaterista']] },
  { tipo: 'amigo', titulo: 'mandou pra um amigo', dica: 'mande o app pra um amigo e tire um print da conversa', link: 'https://jogos.beaterista.com.br', rotulo: 'copiar o link do app' },
];
/** Missão de postar (pedido da Bea, 15/nov/2026): postou um jogo, marcou a escola, mandou o print = 5 ★. Vale 1 vez POR JOGO (o tipo vai como `post:<jogo>`). */
export const ARROBA = '@beaterista_';
export const JOGOS_POST = [['paulbox', 'PaulBox'], ['uno', 'Uno Musical'], ['velha', 'Jogo da velha'], ['quebra', 'Quebra-cabeça'], ['cara', 'Cara a cara'], ['stop', 'Stop'], ['memoria', 'Jogo da memória'], ['bingo', 'Bingo'],
  ['paulta', 'pauLta'], ['figurix', 'Figurix'], ['detetive', 'Detetive Note'], ['rudimentix', 'Rudimentix'], ['toca', 'Toca Aqui'], ['beathero', 'Beat Hero'], ['figurinha', 'figurinha do álbum'], ['outro', 'outro jogo']];
export const tipoPost = (jogo) => `post:${jogo}`;
/** Regra nova (nov/2026): o print de POSTAR (qualquer `post:<jogo>`, inclusive o Desafio do Paul), de SEGUIR nas redes e de AVALIAR a escola, aprovado pela Bea, vale UM giro épico (de 1 a 5 figurinhas + uma exclusiva garantida). Mandar pra um amigo continua valendo estrelas. */
export const DA_GIRO_EPICO = (tipo) => tipo === 'google' || tipo === 'youtube' || /^post:/.test(String(tipo)); // (antiga regra; agora TODA missão aprovada vale 1 giro da roleta maluca, menos 'lendaria')
/** Cada missão aprovada vale 1 giro da ROLETA MALUCA (js/figurinhas/roleta-maluca.js). Só o resgate de lendária fica de fora. */
export const VALE_GIRO = (tipo) => tipo !== 'lendaria';
/** Redes sociais: 1 giro cada. `youtube` já existia no banco; Instagram e TikTok usam 'post:rede-…' (o banco aceita sem mudar nada). */
export const REDES = [['youtube', 'YouTube', 'https://www.youtube.com/@beateristadrummer'], ['post:rede-instagram', 'Instagram', 'https://www.instagram.com/beaterista_/'], ['post:rede-tiktok', 'TikTok', 'https://www.tiktok.com/@beaterista']];
/** Próximo tipo livre pra repetir uma missão (cada amigo, cada postagem nova): base, base-2, base-3… O banco só aceita 1 por tipo. `ocupado(tipo)` diz se já tem. */
export function tipoLivre(base, ocupado) {
  if (!ocupado(base)) return base; const raiz = base === 'amigo' ? 'post:amigo' : base;
  for (let n = 2; n < 100; n++) { const t = `${raiz}-${n}`; if (t.length <= 29 && !ocupado(t)) return t; } return null;
}
/** Desafio do Paul: cole sua figurinha, poste, marque a escola e mande o print. O banco já aceita o tipo `post:desafio` (vale 1 vez por aluno). */
export const TIPO_DESAFIO = 'post:desafio';
/** Nome legível de qualquer tipo de resgate (inclui `post:<jogo>`). */
export function nomeTipo(tipo) { const m = /^post:(.+)$/.exec(String(tipo)); if (!m) return TIPO_NOME[tipo] || String(tipo); if (m[1] === 'desafio') return 'postou e marcou a escola (1 giro)'; if (/^rede-/.test(m[1])) return `seguiu no ${m[1].slice(5)}`; if (/^amigo-/.test(m[1])) return 'mandou pra mais um amigo'; if (/^indicou/.test(m[1])) return 'indicou um amigo pelo nome (o amigo entrou)'; if (/^depoimento/.test(m[1])) return 'mandou um depoimento (precisa de autorização dos pais)'; const j = JOGOS_POST.find((x) => x[0] === m[1]); return `postou e marcou a escola: ${j ? j[1] : m[1]}`; }
export const TIPO_NOME = { google: 'avaliou a escola (giro épico)', youtube: 'seguiu nas redes (giro épico)', amigo: 'mandou pra um amigo', lendaria: 'lendária (compra de produtos da Lojinha)' };
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
