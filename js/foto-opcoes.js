// Foto do perfil: as artes prontas (Pauls e a Billie) e o jeito de trocar a foto sem sair da tela. Usado no Perfil e no passe do Início.
// Grava no mesmo lugar da foto própria ('perfil-foto'), então topo, figurinha e sala já mostram a escolhida.
import * as D from './figurinhas/dono.js';
const FOTO = 'perfil-foto';
/** [id, texto do aria-label, arquivo] das artes prontas, na ordem de exibição. */
export const ARTES = [...[1, 2, 3, 4, 5, 6].map((n) => [`paul-${n}`, `Paul ${n}`, `assets/paul/perfil/paul-${n}.webp`]), ...[1, 2, 3].map((n) => [`billie-${n}`, `Billie ${n}`, `assets/paul/perfil/billie-${n}.webp`])];
/** Paul da época (Natal, Páscoa, Dia das Mães…): vem primeiro na lista durante o período. Fora dele não existe. */
export const epoca = () => { try { const e = window.BtSazonal && window.BtSazonal.estacaoDe(new Date()); return e ? { id: e.id, rotulo: e.rotulo, oi: e.oi, rosto: `assets/sazonal/rosto-${e.id}.webp`, corpo: `assets/sazonal/paul-${e.id}.webp` } : null; } catch { return null; } };
/** Artes pra escolher agora: a da época (se houver) + as de sempre. */
export const artesAgora = () => { const e = epoca(); return e ? [[`epoca-${e.id}`, `Paul de ${e.rotulo}`, e.rosto], ...ARTES] : ARTES; };
const avisa = (blob) => { window.dispatchEvent(new Event('bt-foto-perfil')); import('./foto-perfil-nuvem.js').then((m) => m.guardou(blob)).catch(() => {}); };
/** Usa uma das artes prontas como foto. */
export async function usarArte(src) { const blob = await (await fetch(src)).blob(); await D.metaGravar(FOTO, blob); avisa(blob); }
/** Foto da própria pessoa: corta quadrado no centro e reduz (480px, webp) pra ficar leve. */
export async function usarArquivo(file) {
  const bmp = await createImageBitmap(file); const lado = Math.min(bmp.width, bmp.height); const c = document.createElement('canvas'); c.width = c.height = 480;
  c.getContext('2d').drawImage(bmp, (bmp.width - lado) / 2, (bmp.height - lado) / 2, lado, lado, 0, 0, 480, 480);
  const blob = await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('sem imagem'))), 'image/webp', 0.85)); await D.metaGravar(FOTO, blob); avisa(blob);
}
/** Tira a foto: volta o Paul na bateria. */
export async function voltarPadrao() { try { await D.metaApagar(FOTO); } catch { /* já estava sem */ } avisa(null); }
