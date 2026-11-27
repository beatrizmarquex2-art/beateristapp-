// PDF da partitura de melodia: A4 no papel timbrado, com título, nome do aluno, "Beaterista Play" e o endereço do site.
// Desenha a pauta (SVG de js/partitura-melodica.js) num canvas por página e junta num PDF, igual ao plano do aluno. Nada sai do aparelho.
import { pauta, GEOM, nomeCurto } from './partitura-melodica.js';
import { jpegPdf, fileName } from './pdf.js';
import { toJpeg, savePdf } from './views/plan-pdf.js';

import { SITE_TEXTO } from './site.js';
const W = 1240; const H = 1754; const MM = W / 210; // A4 a 150 dpi
const FONT = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';
export const SITE = SITE_TEXTO;
export const MARCA = 'Beaterista Play';
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

/** SVG em texto → imagem pronta pra desenhar no canvas (tinta preta, no tamanho pedido). */
export async function svgImagem(svg, w, h) {
  const t = svg.replace('width="100%"', `width="${w}" height="${h}"`).replace(/currentColor/g, '#111');
  const img = await loadImg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(t)}`); return img;
}

/** Desenha as páginas e devolve os canvases. `d` = { evs, clave, cor, titulo, aluno, bpm, data }. */
export async function paginas(d) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const papel = d.semPapel ? null : await loadImg('assets/papel-timbrado.png');
  const logo = d.semPapel && d.perfil && d.perfil.logo ? await loadImg(d.perfil.logo) : null; // PRO: o logotipo do próprio professor
  const lado = Math.round(16 * MM); const topo = Math.round(40 * MM); const base = H - Math.round(36 * MM);
  const largU = 700; const escala = (W - lado * 2) / largU; // unidades da pauta → pixels da página
  // `d.render(largura)` (tablatura e bateria do PRO) devolve { svg, w, h, sistema, topo, n }; sem ele é a pauta de melodia
  const r = d.render ? d.render(largU) : pauta(d.evs, { clave: d.clave || 'auto', largura: largU, cor: !!d.cor });
  const geo = d.render ? { sistema: r.sistema, topo: () => r.topo } : GEOM; const topoU = geo.topo(!!d.cor); const nSis = d.render ? r.n : Math.max(1, Math.round((r.h - topoU - 4) / geo.sistema));
  const area = base - (topo + 90); const porPag = Math.max(1, Math.floor(area / (geo.sistema * escala)));
  const img = await svgImagem(r.svg, Math.round(largU * escala), Math.round(r.h * escala));
  const pags = Math.ceil(nSis / porPag); const out = [];
  for (let p = 0; p < pags; p++) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); if (papel) g.drawImage(papel, 0, 0, W, H);
    if (d.semPapel) { // PRO: cabeçalho creme com o nome da escola/professor e o logotipo dele
      g.fillStyle = '#f7f2e7'; g.fillRect(0, 0, W, H); g.fillStyle = '#b8913f'; g.fillRect(lado, 70, W - lado * 2, 3);
      const pf = d.perfil || {}; g.fillStyle = '#1b1c1e'; g.font = `700 30px ${FONT}`; g.fillText((pf.escola || pf.nome || '').toUpperCase().slice(0, 40), lado, 126); if (pf.escola && pf.nome) { g.font = `400 22px ${FONT}`; g.fillStyle = '#6b6558'; g.fillText(pf.nome, lado, 160); }
      if (logo) { const k = Math.min(130 / logo.height, 300 / logo.width); g.drawImage(logo, W - lado - logo.width * k, 88, logo.width * k, logo.height * k); }
    }
    g.fillStyle = '#111'; g.font = `700 46px ${FONT}`; g.fillText(d.titulo || 'Minha partitura', lado, topo);
    g.font = `400 24px ${FONT}`; g.fillStyle = '#444';
    g.fillText([d.aluno, `♩ = ${d.bpm || 100}`, d.data, pags > 1 ? `página ${p + 1} de ${pags}` : ''].filter(Boolean).join('  ·  '), lado, topo + 40);
    // fatia da pauta desta página: da linha de sistemas p*porPag até (p+1)*porPag
    if (img) {
      const sy0 = p === 0 ? 0 : (topoU + p * porPag * geo.sistema) * escala; const sy1 = Math.min(img.height, (topoU + (p + 1) * porPag * geo.sistema + (p === pags - 1 ? 8 : 0)) * escala);
      g.drawImage(img, 0, sy0, img.width, sy1 - sy0, lado, topo + 70, img.width, sy1 - sy0);
    }
    g.font = `400 20px ${FONT}`; g.fillStyle = '#555'; g.textAlign = 'center';
    g.fillText(d.rodape || `${MARCA} | ${SITE}`, W / 2, H - Math.round(36 * MM) + 40); g.textAlign = 'left';
    out.push(cv);
  }
  return out;
}

/** Gera o PDF e entrega (no celular abre o compartilhar; no computador baixa). */
export async function baixarPdf(d) {
  const cvs = await paginas(d); const jpegs = await Promise.all(cvs.map(toJpeg));
  const pdf = jpegPdf(jpegs.map((jpeg) => ({ jpeg, w: W, h: H })), { title: `${d.titulo || 'Minha partitura'} - ${d.aluno || ''}` });
  const nome = fileName(d.titulo || 'Partitura', d.aluno, (d.data || '').replace(/\//g, '-'));
  return { ...(await savePdf(pdf, nome)), paginas: cvs.length };
}
/** Salva a partitura como imagem PNG (uma por página A4). No celular abre o compartilhar (WhatsApp, Fotos); no computador baixa. */
export async function baixarImagem(d) {
  const cvs = await paginas(d); const base = fileName(d.titulo || 'Partitura', d.aluno, (d.data || '').replace(/\//g, '-')).replace(/\.pdf$/, '');
  const blobs = await Promise.all(cvs.map((c) => new Promise((ok) => c.toBlob(ok, 'image/png'))));
  const arquivos = blobs.map((b, i) => new File([b], blobs.length > 1 ? `${base} - pagina ${i + 1}.png` : `${base}.png`, { type: 'image/png' }));
  if (navigator.canShare && navigator.canShare({ files: arquivos }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: arquivos, title: d.titulo || 'Partitura' }); return { name: arquivos[0].name, shared: true, paginas: arquivos.length }; } catch { /* cancelou: cai no download */ }
  }
  for (const f of arquivos) { const url = URL.createObjectURL(f); const a = document.createElement('a'); a.href = url; a.download = f.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
  return { name: arquivos[0].name, paginas: arquivos.length };
}
export { nomeCurto };
