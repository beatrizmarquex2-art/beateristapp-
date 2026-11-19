// A foto de perfil do aluno vai com ele pra qualquer celular (pedido da Bea, 19/nov/2026), junto com o progresso (js/progresso-nuvem.js).
// O original continua só no aparelho (IndexedDB 'perfil-foto'); pra nuvem vai uma MINIATURA (até 320 px, ~20 KB) guardada num espelho no localStorage.
// Formato do espelho: { d: dataURL JPEG ('' = sem foto), t: quando mudou }. Em conflito vale o mais recente. O limite do servidor é 200 mil caracteres por aluno (supabase/018).
import { chave } from './chave-aluno.js';
const MIR = 'bt-foto-nuvem'; export const CHAVE_NUVEM = 'beaterista-foto-perfil'; const MAX = 60000;
const ler = () => { try { const v = JSON.parse(localStorage.getItem(chave(MIR)) || 'null'); return v && typeof v.t === 'number' && typeof v.d === 'string' ? v : null; } catch { return null; } };
const gravarMir = (o) => { try { localStorage.setItem(chave(MIR), JSON.stringify(o)); } catch { /* sem armazenamento */ } };
export const paraNuvem = () => ler() || undefined;
async function miniatura(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('imagem')); i.src = url; });
    for (const [lado, q] of [[320, 0.78], [256, 0.7], [192, 0.6], [128, 0.55]]) {
      const k = Math.min(1, lado / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const d = c.toDataURL('image/jpeg', q); if (d.length <= MAX) return d;
    }
    return '';
  } finally { URL.revokeObjectURL(url); }
}
/** O aluno trocou (blob) ou tirou (null) a foto neste aparelho: guarda a miniatura e manda pra nuvem. */
export async function guardou(blob) {
  try { gravarMir({ d: blob ? await miniatura(blob) : '', t: Date.now() }); } catch { return; }
  import('./progresso-nuvem.js').then((m) => m.enviar()).catch(() => { /* sem internet: sobe depois */ });
}
const blobDe = (dataUrl) => { const [h, b64] = dataUrl.split(','); const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: (/data:([^;]+)/.exec(h) || [])[1] || 'image/jpeg' }); };
/** Chegou da nuvem: se é mais recente que a daqui, vira a foto deste aparelho. */
export async function daNuvem(n) {
  if (!n || typeof n.t !== 'number' || typeof n.d !== 'string') return; const l = ler(); if (l && l.t >= n.t) return;
  gravarMir({ d: n.d, t: n.t });
  try { const D = await import('./figurinhas/dono.js'); if (n.d) await D.metaGravar('perfil-foto', blobDe(n.d)); else await D.metaApagar('perfil-foto'); window.dispatchEvent(new Event('bt-foto-perfil')); } catch { /* ok */ }
}
/** Quem já tinha foto antes desta função: cria o espelho uma vez e sobe. */
export async function garantir() {
  if (ler()) return; try { const D = await import('./figurinhas/dono.js'); const b = await D.metaLer('perfil-foto'); if (b) await guardou(b); } catch { /* ok */ }
}
