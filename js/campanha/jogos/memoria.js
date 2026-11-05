// Modo Aventura do Jogo da Memória: o spec (puro) fica em memoria-spec.js; aqui só a ligação com a tela do jogo.
import { mountMemoria } from '../../kids/memoria.js';
import { spec } from './memoria-spec.js';

export { spec };
/** body: onde o jogo aparece. opts = { mission: { id, index, title, goal, params }, onResult(result) }. Devolve { destroy, inProgress }. */
export function mount(body, opts) {
  const stop = mountMemoria(body, opts);
  return { destroy: () => { try { stop(); } catch { /* ok */ } }, inProgress: () => !!(stop.inProgress && stop.inProgress()) };
}
export default { spec, mount };
