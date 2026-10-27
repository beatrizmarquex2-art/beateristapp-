// Relatório em PDF da criança: % de acerto, onde acertou e errou, por que cada exercício importa e uma tabelinha pra decorar em casa.
// Desenha as páginas A4 num canvas (papel timbrado opcional) e junta num PDF, igual ao plano do aluno. Nada sai do aparelho.
import { jpegPdf, fileName } from '../pdf.js';
import { toJpeg, savePdf } from '../views/plan-pdf.js';
import * as P from './progress.js';
import * as Album from './album.js';
import { CARDS } from './album-data.js';
import { roboStandalone, tierOf } from './robo.js';
import { AGES } from './levels.js';
import { INSTRUMENTS, nameOf as instName, artColored } from './instruments.js';
import { FIGURES, PIECES, BUMBO_SPOTS, nameOf as pieceName } from '../kids-logic.js';
import { figureMarkup } from './art.js';
import { ROW_NAME } from './groove.js';

const W = 1240, H = 1754, MM = W / 210; const SIDE = Math.round(16 * MM);
const FONT = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';
export const TITLES = { pecas: 'Que peça é essa?', pauta: 'Onde mora na pauta?', figuras: 'Figuras rítmicas', bumbos: 'Quantos bumbos?', memoria: 'Memória dos instrumentos', detetive: 'Detetive do groove', eco: 'Eco rítmico' };
const ORDER = Object.keys(TITLES);

const WHY = {
  pecas: 'Conhecer cada peça é o alfabeto da bateria.',
  pauta: 'Saber onde cada peça mora na pauta é o primeiro passo pra ler partitura.',
  figuras: 'As figuras dizem quanto cada nota dura: a base pra contar e tocar no tempo.',
  bumbos: 'O bumbo é o coração do groove: contar de ouvido treina a atenção.',
  memoria: 'Reconhecer instrumentos pelo som e pela imagem treina a escuta.',
  detetive: 'Ouvir, escrever e tocar: o ciclo completo do estudo musical.',
  eco: 'Repetir um ritmo logo depois de ouvir treina a memória rítmica.',
};
const HOME = {
  pecas: 'Em casa: olhe uma foto de bateria e diga o nome de cada peça em voz alta, depois toque cada uma e escute o som.',
  pauta: 'Em casa: cubra a coluna "onde mora" da tabela e tente lembrar a casinha de cada peça.',
  figuras: 'Em casa: bata palmas contando uma semínima (pão), duas colcheias (bo-lo) e quatro semicolcheias (cho-co-la-te).',
  bumbos: 'Em casa: ouça uma música e conte quantos bumbos aparecem em cada compasso.',
  memoria: 'Em casa: ouça uma música e tente descobrir quais instrumentos da tabela estão tocando.',
  detetive: 'Em casa: peça pra alguém tocar dois ritmos quase iguais e descubra o que mudou.',
  eco: 'Em casa: escute um ritmo de 4 tempos, espere, e repita batendo na mesa.',
};
const PIECE_ROLE = { bd: 'o som grave que marca o pulso', sn: 'o estalo do 2 e do 4 (o "tá" do groove)', hh: 'mantém o tempo corrido, tipo um relógio', tt: 'viradas agudas', mt: 'viradas médias', ft: 'viradas graves, fecham a frase', cr: 'acento forte, marca começos e finais', rd: 'pulso aberto nas partes fortes da música' };
const PIECE_STAFF = { bd: '1º espaço (embaixo)', ft: '2º espaço', sn: '3º espaço', mt: '4ª linha', tt: '4º espaço', rd: '5ª linha (a de cima)', hh: 'logo acima da pauta (x)', cr: 'linha suplementar, bem acima (x)' };
const FAMILY = { bumbo: 'percussão (bateria)', caixa: 'percussão (bateria)', chimbal: 'percussão (bateria)', prato: 'percussão (bateria)', tom: 'percussão (bateria)', guitarra: 'cordas elétricas', baixo: 'cordas elétricas (grave)', teclado: 'teclas', voz: 'voz', violino: 'cordas com arco' };
const stepName = (i) => `${Math.floor(i / 2) + 1}${i % 2 ? ' e' : ''}`;
const MISS = (game, key) => {
  if (game === 'pecas' || game === 'pauta') return `${TITLES[game]}: ${pieceName(key)}`;
  if (game === 'figuras') return `${TITLES[game]}: ${key === 'dura' ? 'comparar a duração' : key === 'tempos' ? 'quantos tempos cada figura dura' : 'o nome das figuras'}`;
  if (game === 'bumbos') return `${TITLES[game]}: contar os bumbos`;
  if (game === 'memoria') return `${TITLES[game]}: ${instName(key)}`;
  if (game === 'detetive') return `${TITLES[game]}: ouvir o ${ROW_NAME[key] || key}`;
  if (game === 'eco') return `${TITLES[game]}: ${key === 'figuras' ? 'ritmos com pão, bo-lo e cho-co-la-te' : 'ritmos com contratempo'}`;
  return `${TITLES[game] || game}`;
};

const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
function svgImg(svg) {
  let s = svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  if (!/\swidth=/.test(s)) { const m = /viewBox="[\d.\s-]*?(\d+)\s+(\d+)"/.exec(s); if (m) s = s.replace('<svg ', `<svg width="${m[1]}" height="${m[2]}" `); }
  return loadImg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`);
}

class Pager {
  constructor(paper) { this.pages = []; this.paper = paper; this.top = Math.round((paper ? 40 : 18) * MM); this.bottom = H - Math.round((paper ? 32 : 14) * MM); this.CW = W - SIDE * 2; this.newPage(); }
  newPage() { const c = document.createElement('canvas'); c.width = W; c.height = H; this.g = c.getContext('2d'); this.g.fillStyle = '#fff'; this.g.fillRect(0, 0, W, H); if (this.paper) this.g.drawImage(this.paper, 0, 0, W, H); this.g.textBaseline = 'alphabetic'; this.pages.push(c); this.y = this.top; }
  ensure(hh) { if (this.y + hh > this.bottom && this.y > this.top + 10) this.newPage(); }
  gap(n) { this.y += n; }
  wrap(s, maxW, font) { this.g.font = font; const out = []; let cur = ''; for (const w of String(s).split(/\s+/)) { const t = cur ? `${cur} ${w}` : w; if (this.g.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }
  text(s, { size = 26, weight = 400, color = '#111', x = SIDE, maxW = this.CW, lh = 1.35 } = {}) {
    const font = `${weight} ${size}px ${FONT}`; const lines = this.wrap(s, maxW, font); this.ensure(lines.length * size * lh + 8);
    this.g.font = font; this.g.fillStyle = color; for (const l of lines) { this.y += size * lh; this.g.fillText(l, x, this.y); } return lines.length;
  }
  h2(s) { this.gap(16); this.ensure(80); this.text(s, { size: 36, weight: 700, color: '#b5162b' }); this.g.strokeStyle = '#b5162b'; this.g.lineWidth = 3; this.g.beginPath(); this.g.moveTo(SIDE, this.y + 8); this.g.lineTo(W - SIDE, this.y + 8); this.g.stroke(); this.gap(10); }
  /** cols: [{ label, w (fração) }]; rows: células texto ou { img (Image), w, h }. */
  table(cols, rows, { size = 24, pad = 12 } = {}) {
    const widths = cols.map((c) => Math.round(this.CW * c.w)); const font = `${size}px ${FONT}`;
    const rowH = (r) => Math.max(...r.map((cell, i) => (cell && cell.img ? cell.h + pad * 2 : this.wrap(cell == null ? '' : cell, widths[i] - pad * 2, font).length * size * 1.3 + pad * 2)));
    const drawRow = (r, hh, head) => {
      let x = SIDE; this.g.fillStyle = head ? '#1b1818' : '#fff'; this.g.fillRect(SIDE, this.y, this.CW, hh); this.g.strokeStyle = '#999'; this.g.lineWidth = 1.5; this.g.strokeRect(SIDE, this.y, this.CW, hh);
      r.forEach((cell, i) => { if (i) { this.g.beginPath(); this.g.moveTo(x, this.y); this.g.lineTo(x, this.y + hh); this.g.stroke(); }
        if (cell && cell.img) this.g.drawImage(cell.img, x + (widths[i] - cell.w) / 2, this.y + pad, cell.w, cell.h);
        else { this.g.font = `${head ? 700 : 400} ${size}px ${FONT}`; this.g.fillStyle = head ? '#fff' : '#111'; this.wrap(cell == null ? '' : cell, widths[i] - pad * 2, this.g.font).forEach((l, k) => this.g.fillText(l, x + pad, this.y + pad + size + k * size * 1.3 - 4)); }
        x += widths[i]; });
      this.y += hh;
    };
    const head = cols.map((c) => c.label); const hh = rowH(head);
    this.ensure(hh + 60); drawRow(head, hh, true);
    rows.forEach((r, idx) => { const h2 = rowH(r); if (this.y + h2 > this.bottom) { this.newPage(); drawRow(head, hh, true); } drawRow(r, h2, false); if (idx % 2) { this.g.fillStyle = 'rgb(0 0 0 / .04)'; this.g.fillRect(SIDE, this.y - h2, this.CW, h2); } });
    this.gap(14);
  }
}

const dateBR = (ts) => { const d = new Date(ts); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; };
const todayBR = () => new Date().toLocaleDateString('pt-BR');

export async function renderReport(profile) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const paper = await loadImg('assets/papel-timbrado.png'); const pg = new Pager(paper);
  const p = P.progOf(profile.id); const total = P.totalStars(profile.id); const tier = tierOf(total);
  const ageTxt = (AGES.find((a) => a[0] === profile.age) || AGES[1])[1];
  const answered = (g) => { const s = p.st[g] || { r: 0, w: 0 }; return s.r + s.w; };
  const played = ORDER.filter((g) => answered(g) > 0 || P.summary(profile.id, g).stars > 0);
  const allR = Object.values(p.st).reduce((a, x) => a + x.r, 0); const allW = Object.values(p.st).reduce((a, x) => a + x.w, 0); const pctAll = allR + allW ? Math.round((allR / (allR + allW)) * 100) : null;

  // ---- cabeçalho ----
  const rob = await svgImg(roboStandalone(total ? 'cheer' : 'happy', tier));
  if (rob) pg.g.drawImage(rob, W - SIDE - 150, pg.top - 30, 130, 152);
  pg.text(`Relatório do ${profile.name}`, { size: 54, weight: 700, maxW: pg.CW - 170 });
  pg.text(`Beaterista Kids · ${ageTxt} · ${todayBR()}`, { size: 26, weight: 600, color: '#555', maxW: pg.CW - 170 });
  pg.gap(18);
  pg.text(`${total} estrelas · ${pctAll == null ? 'ainda não jogou' : `${pctAll}% de acerto`} · ${Album.owned(profile.id).length} de ${CARDS.length} figurinhas`, { size: 30, weight: 700 });
  if (!played.length) { pg.gap(10); pg.text('Ainda não há jogos registrados. Depois de algumas fases, este relatório mostra onde foi bem e o que treinar.', { size: 26 }); return pg.pages; }

  pg.gap(14);
  pg.table([{ label: 'Jogo', w: 0.55 }, { label: 'Estrelas', w: 0.22 }, { label: 'Acerto', w: 0.23 }],
    played.map((g) => { const s = P.summary(profile.id, g); return [TITLES[g], `${s.stars} de ${s.maxStars}`, s.pct == null ? '—' : `${s.pct}%`]; }));
  const misses = Object.entries(p.miss).sort((a, b) => b[1] - a[1]).slice(0, 3);
  pg.h2('Pra treinar mais');
  if (misses.length) misses.forEach(([k]) => { const [g, ...rest] = k.split(':'); pg.text(`•  ${MISS(g, rest.join(':'))}`, { size: 27 }); });
  else pg.text('Nenhum erro registrado ainda. Continue assim! 👏', { size: 27 });

  // ---- por que importa + tabelinhas ----
  pg.h2('Pra decorar em casa');
  for (const g of played) {
    pg.gap(8); pg.text(TITLES[g], { size: 32, weight: 700, color: '#111' }); pg.text(WHY[g], { size: 22, color: '#555' }); pg.gap(4);
    if (g === 'pecas') pg.table([{ label: 'Peça', w: 0.28 }, { label: 'Pra que serve', w: 0.72 }], PIECES.map((x) => [x.name, PIECE_ROLE[x.id]]));
    if (g === 'pauta') pg.table([{ label: 'Peça', w: 0.4 }, { label: 'Onde mora na pauta', w: 0.6 }], PIECES.map((x) => [x.name, PIECE_STAFF[x.id]]));
    if (g === 'figuras') { const imgs = await Promise.all(FIGURES.map((f) => svgImg(figureMarkup(f.id)))); pg.table([{ label: 'Figura', w: 0.2 }, { label: 'Nome', w: 0.26 }, { label: 'Dura', w: 0.22 }, { label: 'Conta com', w: 0.32 }],
      FIGURES.map((f, i) => [imgs[i] ? { img: imgs[i], w: 62, h: 76 } : '', f.name, f.beats >= 1 ? `${f.beats} tempo${f.beats > 1 ? 's' : ''}` : f.beats === 0.5 ? 'meio tempo' : '¼ de tempo', { semibreve: '1-2-3-4', minima: '1-2', seminima: 'pão', colcheia: 'bo-lo', semicolcheia: 'cho-co-la-te' }[f.id]])); }
    if (g === 'bumbos') pg.table([{ label: 'Bumbos', w: 0.2 }, { label: 'Onde caem (no compasso de 4 tempos)', w: 0.8 }], [1, 2, 3, 4, 5].map((n) => [String(n), BUMBO_SPOTS[n].map(stepName).join(' · ')]));
    if (g === 'memoria') { const imgs = await Promise.all(INSTRUMENTS.map((x) => svgImg(artColored(x.id, '#1b1818', '#b5162b')))); pg.table([{ label: 'Instrumento', w: 0.22 }, { label: 'Nome', w: 0.28 }, { label: 'Família', w: 0.5 }], INSTRUMENTS.map((x, i) => [imgs[i] ? { img: imgs[i], w: 70, h: 70 } : '', x.name, FAMILY[x.name] || FAMILY[x.id]])); }
    if (g === 'detetive') pg.table([{ label: 'Estrela', w: 0.2 }, { label: 'O que fazer', w: 0.8 }], [['⭐', 'Clicar: ouvir os grooves A e B e dizer o que mudou.'], ['⭐⭐', 'Escrever: marcar na grade (chimbal, caixa e bumbo) o que ouviu.'], ['⭐⭐⭐', 'Tocar: tocar a linha pedida no tempo certo, na tela ou no pad/bateria.']]);
    if (g === 'eco') pg.table([{ label: 'Palavra', w: 0.3 }, { label: 'Batidas no tempo', w: 0.3 }, { label: 'Quantas', w: 0.4 }], [['pão', '● ○ ○ ○', '1 batida'], ['bo-lo', '● ○ ● ○', '2 batidas'], ['cho-co-la-te', '● ● ● ●', '4 batidas'], ['shhh', '○ ○ ○ ○', 'silêncio (pausa)']]);
  }
  return pg.pages;
}

/** Gera o PDF e entrega (compartilhar no celular, baixar no computador). */
export async function downloadReport(profile) {
  const pages = await renderReport(profile); const jpegs = await Promise.all(pages.map(toJpeg));
  const name = fileName('Relatorio Kids', profile.name, todayBR().replace(/\//g, '-'));
  return { ...(await savePdf(jpegPdf(jpegs.map((jpeg) => ({ jpeg, w: W, h: H })), { title: `Relatório Kids - ${profile.name}` }), name)), pages: pages.length };
}
