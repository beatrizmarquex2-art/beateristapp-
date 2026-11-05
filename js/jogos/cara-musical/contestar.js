// Contestar uma resposta do Paul. O jogador diz "acho que está errado" ou "não tenho certeza": fica anotado neste aparelho (e dá pra copiar a lista pra Bea)
// e a pergunta passa a ficar DE FORA dessa carta neste aparelho até a Bea revisar (em dúvida nunca vira resposta). Funciona sem internet.
const K_LISTA = 'beaterista-cara-contestes'; const K_DUV = 'beaterista-cara-duvidas';
const mem = {}; let duvCache = null;
const ler = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch { return k in mem ? mem[k] : def; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { mem[k] = v; } };

/** Chave estável do que foi posto em dúvida: um atributo de uma entidade, ou de uma foto. */
export const chaveDuvida = (q, carta) => (q.de === 'foto' ? `f:${carta.foto}:${q.attr}` : `e:${carta.id}:${q.attr}`);
const duvidas = () => (duvCache ||= ler(K_DUV, {}));
export const emDuvida = (chave) => !!duvidas()[chave];

/** Anota a contestação. `parecer`: 'errado' ou 'duvida'. Devolve o registro. */
export function registrar({ q, carta, nomeCarta, texto, resposta, parecer, nota = '' }) {
  const reg = { t: Date.now(), chave: chaveDuvida(q, carta), carta: nomeCarta, foto: carta.foto, pergunta: texto, paul: resposta ? 'SIM' : 'NÃO', parecer: parecer === 'errado' ? 'errado' : 'duvida', nota: String(nota || '').slice(0, 140) };
  const lista = ler(K_LISTA, []); lista.unshift(reg); gravar(K_LISTA, lista.slice(0, 200));
  duvCache = { ...duvidas(), [reg.chave]: reg.t }; gravar(K_DUV, duvCache);
  return reg;
}
export const listar = () => ler(K_LISTA, []);
export function limpar() { duvCache = {}; gravar(K_LISTA, []); gravar(K_DUV, {}); }
/** Texto pra copiar e mandar pra Bea. */
export function textoParaCopiar(lista = listar()) {
  if (!lista.length) return '';
  return ['Cara a Cara Musical: respostas contestadas', ...lista.map((r) => `- ${r.carta} (foto ${r.foto}) | "${r.pergunta}" | o Paul disse ${r.paul} | ${r.parecer === 'errado' ? 'acho que está errado' : 'não tenho certeza'}${r.nota ? ` | ${r.nota}` : ''}`)].join('\n');
}
