// Estrelas dos jogos: toda vitória vale estrela (velha 1, os outros 3; quebra-cabeça por imagem), no máximo 30 por jogo por dia.
// As estrelas entram no total que libera a roleta (estrelas.js). Sem código de acesso (modo livre) nada conta, como na pauLta.
import * as P from '../kids/progress.js';
import * as AC from '../acesso.js';
import { toast } from '../ui.js';

import { LIMITE_DIA, limiteDe, avisoPerto, APRENDER, contar, hoje, ENSINAM, starsPct, starsErros, ESTRELAS_JOGO, premioQuebra, pagarChave } from './mesa-logic.js';
export { pagarChave, LIMITE_DIA, APRENDER, contar, ENSINAM, starsPct, starsErros, ESTRELAS_JOGO, premioQuebra };
const livre = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();
export const totalMesa = (pid) => (P.progOf(pid).mesa || {}).total || 0;
/** Entrega as estrelas e avisa quantas faltam pra roleta (a cada 15 ★ de qualquer jogo libera 1 giro). */
/** Avisos sobre o limite diário, sempre animados (nunca "acabou"): uma vez por jogo por dia cada um. */
function avisoLimite(jogo, tipo, texto) {
  const k = `beaterista-aviso-estrelas:${jogo}:${hoje()}:${tipo}`;
  try { if (localStorage.getItem(k)) return false; localStorage.setItem(k, '1'); } catch { /* sem armazenamento: avisa */ }
  toast(texto, { ms: 5200, id: `lim-${jogo}` }); return true;
}
const onde = (jogo) => (String(jogo).startsWith('memoria:') ? 'neste tema' : 'neste jogo');
const MSG_CHEGOU = (jogo) => `você completou as ${limiteDe(jogo)} ★ de hoje ${onde(jogo)}! 🎸 amanhã tem mais ★ esperando. por hoje, joga pela diversão: o treino continua valendo e o seu ouvido agradece 🎶`;
const MSG_PERTO = (jogo, resta) => `quase lá! faltam ${resta} ★ pra completar o limite de hoje ${onde(jogo)} (${limiteDe(jogo)}). depois disso o jogo segue igualzinho, só sem ★ até amanhã 🎶`;
const MSG_DEPOIS = (jogo) => `hoje as ★ ${onde(jogo)} já estão completas (${limiteDe(jogo)}!) 🎸 continue tocando e jogando: é treino de graça. as ★ voltam amanhã 🌟`;
async function entregar(me, r, jogo) {
  if (!r.ganhou) { if (r.pediu > 0 && r.resta === 0) avisoLimite(jogo, 'depois', MSG_DEPOIS(jogo)); return 0; } // bateu no limite antes: avisa uma vez, com carinho
  let faltam = 0; let nova = 0;
  try { const E = await import('../figurinhas/estrelas.js'); nova = await E.sincronizar(me.id); faltam = E.faltamParaRoleta(E.estrelasTotais(me.id)); } catch { /* sem o álbum, só conta */ }
  toast(`+${r.ganhou} ★ ${nova ? `· 🎡 roleta liberada!` : faltam ? `· faltam ${faltam} pra roleta` : ''}`, { ms: 2600 });
  if (r.resta === 0) setTimeout(() => avisoLimite(jogo, 'chegou', MSG_CHEGOU(jogo)), 2800); // zerou o dia neste jogo: parabeniza
  else if (r.resta <= avisoPerto(jogo)) setTimeout(() => avisoLimite(jogo, 'perto', MSG_PERTO(jogo, r.resta)), 2800); // falta pouco: avisa antes, sem susto
  return r.ganhou;
}
/** Chame UMA vez por vitória. `n` = quantas estrelas (padrão: a tabela ESTRELAS_JOGO do jogo, senão 1). Devolve quantas ganhou.
 *  `chave` (opcional) = o que foi jogado (ex.: `toca|exercício 3|90`): cada chave paga até 3 ★ na vida, sem repetir (anti-farm). */
export async function vitoria(jogo, n, chave) {
  try {
    if (livre()) return 0; const me = P.active(); if (!me) return 0;
    const mesa0 = P.progOf(me.id).mesa || {}; let q = n == null ? (ESTRELAS_JOGO[jogo] || 1) : n; let pago = null;
    if (chave) { const c = pagarChave(mesa0.pago, chave, q); if (!c.novas) { toast('você já ganhou as ★ dessa — tente outra música ou nível 😉', { ms: 2600 }); return 0; } q = c.novas; pago = c.pago; }
    const r = contar(mesa0, jogo, undefined, q); if (pago && r.ganhou) pago = pagarChave(mesa0.pago, chave, r.ganhou).pago;
    await P.patch(me.id, { mesa: pago ? { ...r.mesa, pago } : r.mesa });
    return entregar(me, r, jogo);
  } catch { return 0; }
}
/** Quebra-cabeça montado: 3 ★ por imagem na 1ª volta, 2 na 2ª, 1 depois (`premioQuebra`). `total` = quantas imagens existem. */
export async function quebra(imgId, total) {
  try {
    if (livre()) return 0; const me = P.active(); if (!me) return 0;
    const mesa = P.progOf(me.id).mesa || {}; const pr = premioQuebra(mesa.quebra, imgId, total); if (!pr.estrelas) return 0;
    const r = contar(mesa, 'quebra', undefined, pr.estrelas); if (!r.ganhou) { await entregar(me, r, 'quebra'); return 0; } // bateu o limite do dia: não gasta a imagem (e avisa com carinho)
    await P.patch(me.id, { mesa: { ...r.mesa, quebra: pr.q } });
    return entregar(me, r, 'quebra');
  } catch { return 0; }
}
