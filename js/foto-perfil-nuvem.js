// A foto de perfil do aluno pode ir com ele pra qualquer celular, MAS SÓ SE ELE LIGAR ("usar minha foto em todos os meus celulares", no Perfil). Desligado é o padrão.
// O original continua só no aparelho (IndexedDB 'perfil-foto'); pra nuvem vai uma MINIATURA (até 320 px, ~20 KB) guardada num espelho no localStorage.
// Espelho: { d: dataURL JPEG ('' = sem foto), t: quando mudou, on: ligado? }. Em conflito vale o mais recente. Desligar manda um "aviso de desligado" ({off:true}) que apaga a miniatura
// do servidor e faz os outros celulares pararem de mandar (a foto que já está em cada celular fica nele). Limite do servidor: 200 mil caracteres por aluno (supabase/018).
import { chave } from './chave-aluno.js';
const MIR = 'bt-foto-nuvem'; export const CHAVE_NUVEM = 'beaterista-foto-perfil'; const MAX = 60000;
const gravarMir = (o) => { try { localStorage.setItem(chave(MIR), JSON.stringify(o)); } catch { /* sem armazenamento */ } };
const ler = () => {
  try {
    const v = JSON.parse(localStorage.getItem(chave(MIR)) || 'null'); if (!v || typeof v.t !== 'number' || typeof v.d !== 'string') return null;
    if (v.on === undefined) { const o = { d: '', t: Date.now(), on: false }; gravarMir(o); return o; } // versão de teste (v652-655) subia a foto sem o aluno ligar: vira "desligado" e o servidor apaga
    return v;
  } catch { return null; }
};
export const ligado = () => { const m = ler(); return !!(m && m.on); };
/** O que vai pra nuvem: a miniatura (se ligado) ou o aviso de desligado (se já esteve ligado); nada se nunca ligou. */
export const paraNuvem = () => { const m = ler(); if (!m) return undefined; return m.on ? { d: m.d, t: m.t, on: true } : { d: '', t: m.t, off: true }; };
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
  if (!ligado()) return; // desligado: a foto não sai deste aparelho
  try { gravarMir({ d: blob ? await miniatura(blob) : '', t: Date.now(), on: true }); } catch { return; }
  import('./progresso-nuvem.js').then((m) => m.enviar()).catch(() => { /* sem internet: sobe depois */ });
}
const blobDe = (dataUrl) => { const [h, b64] = dataUrl.split(','); const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: (/data:([^;]+)/.exec(h) || [])[1] || 'image/jpeg' }); };
/** O aluno ligou ("usar minha foto em todos os meus celulares"): sobe a miniatura da foto que ele tem agora. */
export async function ligar() {
  let d = ''; try { const D = await import('./figurinhas/dono.js'); const b = await D.metaLer('perfil-foto'); if (b) d = await miniatura(b); } catch { /* sem foto ainda */ }
  gravarMir({ d, t: Date.now(), on: true }); import('./progresso-nuvem.js').then((m) => m.enviar(true)).catch(() => { /* sobe depois */ });
}
/** Desligou: a miniatura sai do servidor e os outros celulares param de mandar. */
export function desligar() { gravarMir({ d: '', t: Date.now(), on: false }); import('./progresso-nuvem.js').then((m) => m.enviar(true)).catch(() => { /* sobe depois */ }); }
/** Chegou da nuvem: se é mais recente que a daqui, vira a foto deste aparelho (ou desliga, se veio o aviso de desligado). */
export async function daNuvem(n) {
  if (!n || typeof n.t !== 'number' || typeof n.d !== 'string') return; const l = ler(); if (l && l.t >= n.t) return;
  if (n.off) { gravarMir({ d: '', t: n.t, on: false }); return; }
  if (n.on !== true) return; // miniatura de teste (v652-655), sem o aluno ter ligado: ignora
  gravarMir({ d: n.d, t: n.t, on: true });
  try { const D = await import('./figurinhas/dono.js'); if (n.d) await D.metaGravar('perfil-foto', blobDe(n.d)); else await D.metaApagar('perfil-foto'); window.dispatchEvent(new Event('bt-foto-perfil')); } catch { /* ok */ }
}
