// Modo Aventura do Monte Seu Ritmo: o spec (puro) fica em monte-spec.js; aqui só a ligação com a tela (js/kids/ritmo-missao.js).
import { mountRitmo } from '../../kids/ritmo.js';
import { spec } from './monte-spec.js';

export { spec };
/** body: onde o jogo aparece. opts = { mission: { id, index, title, goal, params }, onResult(result) }. Devolve { destroy, inProgress }. */
export function mount(body, opts) {
  const stop = mountRitmo(body, opts);
  return { destroy: () => { try { stop(); } catch { /* ok */ } }, inProgress: () => !!(stop.inProgress && stop.inProgress()) };
}
export default { spec, mount };
