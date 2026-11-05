// Recompensas do álbum de figurinhas (o novo, de 125): a cada 30 estrelas libera uma ROLETA e terminar um jogo inteiro dá 1 pacote com uma rara.
// O sistema antigo de cartas (bateristas/guitarristas/vocalistas) foi removido. As contas ficam em js/figurinhas/estrelas.js e album-logic.js.
import { h } from '../util.js';
import * as EST from '../figurinhas/estrelas.js';
import * as CS from '../campanha/store.js';

/** Endereço do álbum novo (área dos alunos x app da Bea) e da aba dos pacotes. */
export const albumHref = (aba = '') => `${document.documentElement.classList.contains('aluno-on') ? '#/album' : '#/figurinhas'}${aba ? `/${aba}` : ''}`;
export { EST };
/** Depois de ganhar estrelas (em qualquer jogo): entrega as roletas devidas. Devolve quantas roletas novas. */
export const sincronizar = (pid) => EST.sincronizar(pid);
/** Terminou um jogo de fases dos Kids inteiro? Entrega o prêmio (1 pacote de 5 com uma rara) uma única vez. Devolve 1 se novo. */
export const premioKids = (pid, game) => (EST.kidsCompleto(pid, game) ? EST.premioJogo(pid, `kids-${game}`) : 0);
/** Terminou todas as missões de um Modo Aventura? Mesmo prêmio, uma única vez. */
export const premioAventura = (pid, gameId, spec) => (CS.completo(pid, gameId, spec) ? EST.premioJogo(pid, `av-${gameId}`) : 0);
/** Tudo de uma vez depois de uma fase dos Kids: roletas novas e prêmio de jogo completo. */
export async function depoisDaFase(pid, game) { return { roletas: await sincronizar(pid), jogos: await premioKids(pid, game) }; }
/** Aviso de recompensa (roleta liberada e/ou prêmio de jogo completo) pra colocar na tela de resultado. null se não ganhou nada. */
export function rewardEl(r) {
  const { roletas = 0, jogos = 0 } = r || {}; // aceita null/undefined (modo livre não ganha nada)
  if (!roletas && !jogos) return null;
  const msg = [jogos ? '🏆 jogo completo! 1 pacote com uma rara te espera' : '', roletas ? `🎡 ${roletas === 1 ? 'roleta liberada!' : `${roletas} roletas liberadas!`}` : ''].filter(Boolean).join(' · ');
  return h('div', { class: 'kx-reward' }, h('p', { class: 'kx-reward-t' }, msg), h('a', { class: 'kd-btn', href: albumHref('Pacotes') }, 'abrir agora'));
}
/** Texto curtinho de progresso (ex.: "faltam 12 ★ pra próxima roleta"). */
export const progressoTxt = (pid) => `faltam ${EST.faltamParaRoleta(EST.estrelasTotais(pid))} ★ pra próxima roleta`;
