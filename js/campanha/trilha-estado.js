// Lê o progresso de verdade (Kids, Aventura, pauLta) e diz quais passos da trilha estão concluídos. A trava só vale pro aluno com código.
import * as CS from './store.js';
import * as T from './trilha.js';
import * as AC from '../acesso.js';
import * as EST from '../figurinhas/estrelas.js';
import * as PL from '../paulta/save.js';
import * as S from '../paulta/score.js';
import { spec as memoria } from './jogos/memoria-spec.js';
import { spec as monte } from './jogos/monte-spec.js';
import { spec as toca } from './jogos/toca-spec.js';

export function feitosDe(pid = CS.playerId()) {
  const p = PL.getP(pid);
  return {
    memoria: CS.completo(pid, 'memoria', memoria),
    figuras: EST.kidsCompleto(pid, 'figuras'),
    'paulta-bateria': S.worldDone(p, 'drum'),
    monte: CS.completo(pid, 'monte', monte),
    toca: CS.completo(pid, 'toca', toca),
    'paulta-claves': S.worldDone(p, 'sol') && S.worldDone(p, 'fa'),
    'paulta-duelo': S.worldDone(p, 'duel'),
  };
}
export const estado = (pid) => T.estado(feitosDe(pid));
/** A trava só vale na área do aluno, com código (a Bea e o modo livre abrem tudo). */
const desligada = () => { try { return localStorage.getItem('beaterista-trilha-off') === '1'; } catch { return false; } }; // só os testes usam
export const vale = () => document.documentElement.classList.contains('aluno-on') && AC.liberado() && !desligada();
export const bloqueado = (id) => { try { return vale() && T.travado(feitosDe(), id); } catch { return false; } };
/** Se o passo está trancado, leva pra trilha e devolve true. */
export function guarda(id) { if (!bloqueado(id)) return false; location.hash = '#/trilha'; return true; }
