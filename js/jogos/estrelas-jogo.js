// Atalho dos jogos pras estrelas (carrega o módulo só quando alguém ganha, pra o jogo continuar testável fora do navegador).
// Todo jogo dá estrela: velha 1, os outros 3, quebra-cabeça por imagem (js/figurinhas/mesa-logic.js). A cada 15 ★ de qualquer jogo, 1 giro da roleta.
/** `chave` = o que foi jogado (música/nível/tema): cada chave paga até 3 ★ na vida (sem repetir a mesma). */
export const ganhou = (jogo, n, chave) => import('../figurinhas/mesa.js').then((M) => M.vitoria(jogo, n, chave)).catch(() => 0);
export const quebra = (imgId, total) => import('../figurinhas/mesa.js').then((M) => M.quebra(imgId, total)).catch(() => 0);
