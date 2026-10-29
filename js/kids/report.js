// Relatório em PDF da criança: % de acerto, onde acertou e errou, por que cada exercício importa e uma tabelinha pra decorar em casa.
// Desenha as páginas A4 num canvas (papel timbrado opcional) e junta num PDF, igual ao plano do aluno. Nada sai do aparelho.
import { jpegPdf, fileName } from '../pdf.js';
import { toJpeg, savePdf } from '../views/plan-pdf.js';
import * as P from './progress.js';
import * as Album from './album.js';
import { CARDS } from './album-data.js';
import { roboSrc, tierOf } from './robo.js';
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

/** Monta as partes do relatório (cada uma pode ser ligada/desligada e editada antes do PDF). */
export function buildSections(profile) {
  const p = P.progOf(profile.id); const total = P.totalStars(profile.id);
  const ageTxt = (AGES.find((a) => a[0] === profile.age) || AGES[1])[1];
  const answered = (g) => { const s = p.st[g] || { r: 0, w: 0 }; return s.r + s.w; };
  const played = ORDER.filter((g) => answered(g) > 0 || P.summary(profile.id, g).stars > 0);
  const allR = Object.values(p.st).reduce((a, x) => a + x.r, 0); const allW = Object.values(p.st).reduce((a, x) => a + x.w, 0); const pctAll = allR + allW ? Math.round((allR / (allR + allW)) * 100) : null;
  const T = (text, o = {}) => ({ t: 'text', text, ...o });
  const secs = [];
  secs.push({ id: 'resumo', title: 'Cabeçalho e resumo', on: true, blocks: [
    T(`Relatório do ${profile.name}`, { size: 54, weight: 700 }), T(`Jogos Beaterista · ${ageTxt} · ${todayBR()}`, { size: 26, weight: 600, color: '#555' }),
    T(`${total} estrelas · ${pctAll == null ? 'ainda não jogou' : `${pctAll}% de acerto`} · ${Album.owned(profile.id).length} de ${CARDS.length} figurinhas`, { size: 30, weight: 700 })] });
  if (!played.length) { secs.push({ id: 'vazio', title: 'Observação', on: true, blocks: [T('Ainda não há jogos registrados. Depois de algumas fases, este relatório mostra onde foi bem e o que treinar.', { size: 26 })] }); }
  else {
    secs.push({ id: 'jogos', title: 'Jogos', on: true, blocks: [{ t: 'table', cols: [{ label: 'Jogo', w: 0.55 }, { label: 'Estrelas', w: 0.22 }, { label: 'Acerto', w: 0.23 }],
      rows: played.map((g) => { const s = P.summary(profile.id, g); return [TITLES[g], `${s.stars} de ${s.maxStars}`, s.pct == null ? '—' : `${s.pct}%`]; }) }] });
    const misses = Object.entries(p.miss).sort((a, b) => b[1] - a[1]).slice(0, 3);
    secs.push({ id: 'treinar', title: 'Pra treinar mais', on: true, blocks: [T(misses.length ? misses.map(([k]) => { const [g, ...rest] = k.split(':'); return `•  ${MISS(g, rest.join(':'))}`; }).join('\n') : 'Nenhum erro registrado ainda. Continue assim! 👏', { size: 27 })] });
  }
  for (const g of played) {
    const blocks = [T(WHY[g], { size: 22, color: '#555' })];
    if (g === 'pecas') blocks.push({ t: 'table', cols: [{ label: 'Peça', w: 0.28 }, { label: 'Pra que serve', w: 0.72 }], rows: PIECES.map((x) => [x.name, PIECE_ROLE[x.id]]) });
    if (g === 'pauta') blocks.push({ t: 'table', cols: [{ label: 'Peça', w: 0.4 }, { label: 'Onde mora na pauta', w: 0.6 }], rows: PIECES.map((x) => [x.name, PIECE_STAFF[x.id]]) });
    if (g === 'figuras') blocks.push({ t: 'table', cols: [{ label: 'Figura', w: 0.2 }, { label: 'Nome', w: 0.26 }, { label: 'Dura', w: 0.22 }, { label: 'Conta com', w: 0.32 }],
      rows: FIGURES.map((f) => [{ fig: f.id }, f.name, f.beats >= 1 ? `${f.beats} tempo${f.beats > 1 ? 's' : ''}` : f.beats === 0.5 ? 'meio tempo' : '¼ de tempo', { semibreve: '1-2-3-4', minima: '1-2', seminima: 'pão', colcheia: 'bo-lo', semicolcheia: 'cho-co-la-te' }[f.id]]) });
    if (g === 'bumbos') blocks.push({ t: 'table', cols: [{ label: 'Bumbos', w: 0.2 }, { label: 'Onde caem (no compasso de 4 tempos)', w: 0.8 }], rows: [1, 2, 3, 4, 5].map((n) => [String(n), BUMBO_SPOTS[n].map(stepName).join(' · ')]) });
    if (g === 'memoria') blocks.push({ t: 'table', cols: [{ label: 'Instrumento', w: 0.22 }, { label: 'Nome', w: 0.28 }, { label: 'Família', w: 0.5 }], rows: INSTRUMENTS.map((x) => [{ ins: x.id }, x.name, FAMILY[x.name] || FAMILY[x.id]]) });
    if (g === 'detetive') blocks.push({ t: 'table', cols: [{ label: 'Estrela', w: 0.2 }, { label: 'O que fazer', w: 0.8 }], rows: [['⭐', 'Clicar: ouvir os grooves A e B e dizer o que mudou.'], ['⭐⭐', 'Escrever: marcar na grade (chimbal, caixa e bumbo) o que ouviu.'], ['⭐⭐⭐', 'Tocar: tocar a linha pedida no tempo certo, na tela ou no pad/bateria.']] });
    if (g === 'eco') blocks.push({ t: 'table', cols: [{ label: 'Palavra', w: 0.3 }, { label: 'Batidas no tempo', w: 0.3 }, { label: 'Quantas', w: 0.4 }], rows: [['pão', '● ○ ○ ○', '1 batida'], ['bo-lo', '● ○ ● ○', '2 batidas'], ['cho-co-la-te', '● ● ● ●', '4 batidas'], ['shhh', '○ ○ ○ ○', 'silêncio (pausa)']] });
    blocks.push(T(HOME[g], { size: 22, color: '#555' }));
    secs.push({ id: `g-${g}`, title: TITLES[g], on: true, blocks });
  }
  secs.push({ id: 'recado', title: 'Recado da professora', on: true, blocks: [T('', { size: 26 })] });
  return secs;
}

/** Desenha só as partes ligadas. `sections` pode ter sido editado. */
export async function renderSections(profile, sections) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const paper = await loadImg('assets/papel-timbrado.png'); const pg = new Pager(paper);
  const total = P.totalStars(profile.id);
  for (const s of sections.filter((x) => x.on !== false)) {
    const has = s.blocks.some((b) => (b.t === 'text' ? String(b.text || '').trim() : b.rows.length));
    if (!has) continue;
    if (s.id === 'resumo') { const rob = await loadImg(roboSrc(total ? 'cheer' : 'happy')); if (rob) { const bw = 150; const bh = Math.round(bw * rob.height / rob.width); pg.g.drawImage(rob, W - SIDE - bw, pg.top - 30, bw, bh); } }
    else { pg.gap(8); pg.ensure(120); pg.text(s.title, { size: 34, weight: 700, color: '#b5162b' }); pg.gap(4); }
    for (const b of s.blocks) {
      if (b.t === 'text') { for (const line of String(b.text || '').split('\n')) if (line.trim()) pg.text(line, { size: b.size || 26, weight: b.weight || 400, color: b.color || '#111', maxW: s.id === 'resumo' ? pg.CW - 170 : pg.CW }); pg.gap(6); }
      else if (b.rows.length) {
        const rows = [];
        for (const r of b.rows) rows.push(await Promise.all(r.map(async (c) => {
          if (c && c.fig) { const im = await svgImg(figureMarkup(c.fig)); return im ? { img: im, w: 62, h: 76 } : ''; }
          if (c && c.ins) { const im = await svgImg(artColored(c.ins, '#1b1818', '#b5162b')); return im ? { img: im, w: 70, h: 70 } : ''; }
          return c;
        })));
        pg.table(b.cols, rows);
      }
    }
  }
  return pg.pages;
}

export async function renderReport(profile) { return renderSections(profile, buildSections(profile)); }

/** Gera o PDF e entrega (compartilhar no celular, baixar no computador). */
export async function downloadReport(profile, sections) {
  const pages = sections ? await renderSections(profile, sections) : await renderReport(profile); const jpegs = await Promise.all(pages.map(toJpeg));
  const name = fileName('Relatorio Jogos', profile.name, todayBR().replace(/\//g, '-'));
  return { ...(await savePdf(jpegPdf(jpegs.map((jpeg) => ({ jpeg, w: W, h: H })), { title: `Relatório de jogos - ${profile.name}` }), name)), pages: pages.length };
}
