// Modo Aventura do Toca Aqui: o spec (puro) fica em toca-spec.js; aqui só a ligação com a tela da missão (js/views/leitura-missao.js).
import { mountLeituraMissao } from '../../views/leitura-missao.js';
import { spec } from './toca-spec.js';

export { spec };
/** body: onde o jogo aparece. opts = { mission: { id, index, title, goal, params }, onResult(result) }. Devolve { destroy, inProgress }. */
export function mount(body, opts) {
  const p = (opts.mission && opts.mission.params) || {};
  const ctl = mountLeituraMissao(body, { bar: p.bar, bpm: p.bpm, onResult: opts.onResult });
  return { destroy: () => { try { ctl.destroy(); } catch { /* ok */ } }, inProgress: () => ctl.inProgress() };
}
export default { spec, mount };
