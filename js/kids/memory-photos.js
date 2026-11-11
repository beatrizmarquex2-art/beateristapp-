// Categorias de artistas do jogo da memória: The Beatles, Bandas e Solo, com as fotos do catálogo de figurinhas (miniaturas).
// Cada carta é uma foto; o par é a MESMA foto duas vezes. Nada de nome ou dado inventado: só o que está no cadastro do catálogo e do elenco.
import { ENTIDADES } from '../jogos/cara-musical/elenco.js';
import { agrupar } from '../jogos/artistas-logic.js';
import { mini, loadCat, posOf } from '../jogos/cara-musical/midia.js';

const sample = (a, n, rnd = Math.random) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b.slice(0, n); };

/** Enquadramento da foto na carta (a moldura da foto é ~0,9 de largura por 1 de altura; o nome fica numa faixa própria embaixo).
 *  Foto mais larga que a moldura: aparece INTEIRA (fit 'contain', com a própria foto desfocada no fundo), pra ninguém ser cortado nas laterais.
 *  Foto alta: preenche a moldura alinhada ao TOPO, onde fica a cabeça (o rosto detectado do catálogo erra bastante, então não é usado aqui).
 *  `ENQUADRE` guarda ajustes manuais por foto (id ou código → { fit, pos }). */
export const ENQUADRE = {
  'axl-rose': { fit: 'cover', pos: '50% 40%' }, 'cassia-eller': { fit: 'cover', pos: '50% 95%' }, 'thom-yorke-radiohead': { fit: 'cover', pos: '50% 65%' }, 'justin-bieber': { fit: 'cover', pos: '50% 25%' },
};
export function enquadra(aspect, manual) {
  if (manual) return manual;
  if (!(aspect > 0)) return { fit: 'cover', pos: '50% 0%' };
  if (aspect > 0.98) return { fit: 'contain', pos: '50% 50%' };
  return { fit: 'cover', pos: aspect > 0.8 ? '50% 12%' : '50% 0%' };
}

/** Monta as 3 categorias a partir do catálogo (array do catalogo.json). Sem DOM: dá pra testar em Node. `pos` é o recorte no rosto (opcional). */
export function buildPhotoThemes(catalogo, { pos = () => '50% 30%', rnd = Math.random } = {}) {
  const dims = Object.fromEntries((catalogo || []).map((c) => [c.codigo, c.largura_px && c.altura_px ? c.largura_px / c.altura_px : 0.75]));
  const item = (id, name, code, cap) => ({ id, name, img: mini(code), ...enquadra(dims[code], ENQUADRE[id] || ENQUADRE[code]), photo: true, cap: cap || '' });
  const beatles = (catalogo || []).filter((c) => c.colecao === 'Beatles').map((c) => ({ ...item(c.codigo, 'The Beatles', c.codigo, 'The Beatles'), fit: 'contain', pos: '50% 50%' })); // fotos de grupo, com gente em qualquer altura: sempre inteiras
  const { artistas } = agrupar(ENTIDADES, catalogo);
  const sem = (a) => !a.colecoes.includes('Beatles') && !a.colecoes.includes('Beaterista');
  const bandas = artistas.filter((a) => a.tipo === 'banda' && sem(a)).map((a) => item(a.id, a.curto, a.fotoPrincipal, a.curto));
  const solo = artistas.filter((a) => a.tipo === 'solo' && sem(a)).map((a) => item(a.id, a.curto, a.fotoPrincipal, a.curto));
  const mk = (id, title, blurb, items, back, open = false) => ({ id, title, blurb, items, verso: null, back, photo: true, open, cover: sample(items, 3, rnd).map((x) => x.img) }); // back: o verso das cartas (assets/cards)
  return [
    mk('beatles', 'The Beatles', 'ache as fotos iguais da banda', beatles, 'assets/cards/b02.webp', true),
    mk('bandas', 'Bandas', 'Queen, Nirvana, Coldplay…', bandas, 'assets/cards/b01.webp'),
    mk('solo', 'Solos', 'Rita Lee, Michael Jackson, Pitty…', solo, 'assets/cards/b03.webp'),
  ].filter((t) => t.items.length >= 6);
}

/** Baixa o catálogo e devolve as categorias (ou null se não der: o jogo cai nos temas desenhados). */
export async function loadPhotoThemes() {
  try { const cat = await (await fetch('assets/figurinhas/catalogo.json')).json(); await loadCat(); const list = buildPhotoThemes(cat, { pos: posOf }); return list.length ? list : null; } catch { return null; }
}
