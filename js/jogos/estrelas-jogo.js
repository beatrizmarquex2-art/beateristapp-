// Atalho dos jogos pras estrelas (carrega o módulo só quando alguém ganha, pra o jogo continuar testável fora do navegador).
// Todo jogo dá estrela: velha 1, os outros 3, quebra-cabeça por imagem (js/figurinhas/mesa-logic.js). A cada 15 ★ de qualquer jogo, 1 giro da roleta.
export const ganhou = (jogo, n) => import('../figurinhas/mesa.js').then((M) => M.vitoria(jogo, n)).catch(() => 0);
export const quebra = (imgId, total) => import('../figurinhas/mesa.js').then((M) => M.quebra(imgId, total)).catch(() => 0);
