// Fotos do Cara a Cara Musical: miniatura da carta, foto grande e recorte inteligente (centraliza no rosto do catálogo do álbum; a original nunca é alterada).
export const mini = (c) => `assets/figurinhas/mini/${c}.webp`;
export const grande = (c) => `assets/figurinhas/fotos/${c}.jpeg`;
let CATALOGO = null; export const loadCat = async () => { if (!CATALOGO) { try { CATALOGO = Object.fromEntries((await (await fetch('assets/figurinhas/catalogo.json')).json()).map((c) => [c.codigo, c])); } catch { CATALOGO = {}; } } return CATALOGO; };
/** Recorte inteligente: centraliza o corte no rosto (ou no foco) detectado no catálogo do álbum. A original nunca é alterada. */
export const posOf = (code) => { const c = (CATALOGO || {})[code]; if (!c) return '50% 30%'; const r = c.rostos && c.rostos.length ? c.rostos : null;
  if (r) { const cx = r.reduce((s, b) => s + b[0] + b[2] / 2, 0) / r.length; const cy = r.reduce((s, b) => s + b[1] + b[3] / 2, 0) / r.length; return `${Math.round(cx * 100)}% ${Math.round(cy * 100)}%`; }
  if (c.foco) return `${Math.round(((c.foco[0] + c.foco[2]) / 2) * 100)}% ${Math.round(((c.foco[1] + c.foco[3]) / 2) * 100)}%`; return '50% 30%'; };

