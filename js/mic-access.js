// Microfone: um jeito só de pedir e de explicar o que deu errado (antes cada ferramenta tinha o seu e algumas desistiam
// por qualquer erro). Tenta sem filtros (melhor pra bateria); se o aparelho recusar os ajustes, tenta o microfone simples.
import { audio } from './audio.js';

const RAW = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

/** Pede o microfone. `plain` = sem ajustes (nota de voz). Lança erro com `.name` já normalizado (ver micProblem). */
export async function getMic({ plain = false } = {}) {
  if (!window.isSecureContext && location.hostname !== 'localhost') throw Object.assign(new Error('sem https'), { name: 'Insecure' });
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('sem microfone'), { name: 'NotSupported' });
  try { audio(); } catch { /* o som da tela pode não abrir; o microfone segue */ } // destrava o áudio dentro do toque (iPhone/iPad)
  const tries = plain ? [{ audio: true }] : [{ audio: RAW }, { audio: true }];
  let last;
  for (const c of tries) {
    try { return await navigator.mediaDevices.getUserMedia(c); }
    catch (e) {
      last = e;
      // permissão negada ou sem aparelho: tentar de novo com outros ajustes não adianta
      if (e && /NotAllowed|Security|NotFound|DevicesNotFound/.test(e.name)) break;
    }
  }
  throw last || new Error('microfone indisponível');
}

/** Tipo do problema: 'negado' | 'sem-aparelho' | 'ocupado' | 'insecure' | 'indisponivel'. */
export function micProblem(e) {
  const n = (e && e.name) || '';
  if (/NotAllowed|Security|Permission/.test(n)) return 'negado';
  if (/NotFound|DevicesNotFound|OverconstrainedError/.test(n)) return 'sem-aparelho';
  if (/NotReadable|TrackStart|Abort/.test(n)) return 'ocupado';
  if (n === 'Insecure') return 'insecure';
  return 'indisponivel';
}

const TEXT = {
  negado: ['sem permissão pro microfone.', 'no iPhone/iPad: Ajustes › Safari › Microfone (ou, no app instalado, Ajustes › Beaterista) e permita. depois volte aqui e toque em tentar de novo.'],
  'sem-aparelho': ['não achei um microfone.', 'confira se o aparelho tem microfone ligado (fone sem microfone ou Bluetooth desconectado atrapalham) e tente de novo.'],
  ocupado: ['o microfone está em uso.', 'feche a chamada, a gravação de tela ou outro app que esteja usando o microfone e tente de novo.'],
  insecure: ['o microfone só abre no endereço seguro (https).', 'abra o app pelo endereço oficial ou pelo ícone instalado na tela de início.'],
  indisponivel: ['não consegui abrir o microfone.', 'este navegador não deu acesso. abra pelo Safari ou pelo app instalado na tela de início e tente de novo.'],
};
/** [título, explicação] pra mostrar na tela. */
export const micMessage = (e) => TEXT[micProblem(e)];
/** Frase curta pra toast. */
export const micToast = (e) => `${TEXT[micProblem(e)][0]} ${micProblem(e) === 'negado' ? 'libere nos ajustes do aparelho.' : ''}`.trim();
