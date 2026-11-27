// PDF do plano de aula do PRO: A4 limpo (creme), com o nome e o logotipo do PRÓPRIO professor no cabeçalho. Feito no aparelho, sem biblioteca de fora.
import { jpegPdf, fileName } from '../pdf.js';
import { toJpeg, savePdf } from '../views/plan-pdf.js';
import { ETAPAS, nomeNivel, minutos } from './dados.js';

const W = 1240; const H = 1754; const M = 96;
const SERIF = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif'; const SANS = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';
const nomeEtapa = (t) => (ETAPAS.find((e) => e[0] === t) || [, t])[1];
const loadImg = (src) => new Promise((ok) => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

/** Quebra o texto em linhas que cabem em `larg` pixels. */
export function quebra(g, texto, larg) {
  const out = [];
  for (const par of String(texto || '').split('\n')) {
    let linha = '';
    for (const p of par.split(/\s+/).filter(Boolean)) { const t = linha ? `${linha} ${p}` : p; if (g.measureText(t).width > larg && linha) { out.push(linha); linha = p; } else linha = t; }
    out.push(linha);
  }
  return out;
}

/** `aula` = linha de pro_aulas; `perfil` = pro_perfil. Devolve os canvases. */
export async function paginas(aula, perfil = {}, aluno = '') {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const logo = await loadImg(perfil.logo); const d = aula.dados || {}; const out = []; let cv; let g; let y;
  const nova = () => {
    cv = document.createElement('canvas'); cv.width = W; cv.height = H; g = cv.getContext('2d'); g.fillStyle = '#f7f2e7'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#b8913f'; g.fillRect(M, 70, W - M * 2, 3);
    if (logo) { const k = Math.min(150 / logo.height, 300 / logo.width); g.drawImage(logo, W - M - logo.width * k, 92, logo.width * k, logo.height * k); }
    g.fillStyle = '#1b1c1e'; g.font = `600 30px ${SANS}`; g.fillText((perfil.escola || perfil.nome || '').toUpperCase().slice(0, 40), M, 126);
    g.font = `400 22px ${SANS}`; g.fillStyle = '#6b6558'; if (perfil.escola && perfil.nome) g.fillText(perfil.nome, M, 160);
    g.fillStyle = '#8a8372'; g.font = `400 18px ${SANS}`; g.textAlign = 'center'; g.fillText('Criado no Beaterista PRO · pro.beaterista.com.br', W / 2, H - 56); g.textAlign = 'left';
    out.push(cv); y = 250;
  };
  const garante = (h) => { if (y + h > H - 120) { nova(); } };
  nova();
  g.fillStyle = '#1b1c1e'; g.font = `800 58px ${SERIF}`; for (const l of quebra(g, aula.titulo, W - M * 2)) { garante(70); g.fillText(l, M, y); y += 70; }
  g.font = `400 24px ${SANS}`; g.fillStyle = '#6b6558';
  g.fillText([aula.instrumento, nomeNivel(aula.nivel), aula.idade && `${aula.idade}`, `${aula.duracao_min} min`, aluno && `para ${aluno}`].filter(Boolean).join('  ·  '), M, y); y += 56;
  const bloco = (rotulo, texto) => {
    if (!String(texto || '').trim()) return;
    garante(120); g.fillStyle = '#b8913f'; g.font = `600 22px ${SANS}`; g.fillText(rotulo.toUpperCase(), M, y); y += 14; g.fillStyle = '#b8913f'; g.fillRect(M, y, 60, 2); y += 40;
    g.fillStyle = '#1b1c1e'; g.font = `400 28px ${SANS}`; for (const l of quebra(g, texto, W - M * 2)) { garante(42); g.fillText(l, M, y); y += 42; } y += 22;
  };
  bloco('Objetivos', d.objetivos);
  if ((d.etapas || []).length) {
    garante(120); g.fillStyle = '#b8913f'; g.font = `600 22px ${SANS}`; g.fillText(`ROTEIRO · ${minutos(d.etapas)} MIN`, M, y); y += 14; g.fillRect(M, y, 60, 2); y += 44;
    for (const e of d.etapas) {
      garante(110); g.fillStyle = '#1b1c1e'; g.font = `600 28px ${SANS}`; g.fillText(`${nomeEtapa(e.tipo)}${e.titulo ? ` — ${e.titulo}` : ''}`, M, y);
      g.textAlign = 'right'; g.fillStyle = '#8a8372'; g.font = `400 24px ${SANS}`; g.fillText(`${e.min || 0} min`, W - M, y); g.textAlign = 'left'; y += 40;
      g.fillStyle = '#3b3a36'; g.font = `400 26px ${SANS}`; for (const l of quebra(g, e.texto, W - M * 2 - 20)) { garante(38); g.fillText(l, M + 20, y); y += 38; } y += 18;
    }
  }
  bloco('Repertório', d.repertorio); bloco('Materiais', d.materiais); bloco('Tarefa para casa', d.tarefa);
  return out;
}

export async function baixarPdf(aula, perfil, aluno = '') {
  const cvs = await paginas(aula, perfil, aluno); const jp = await Promise.all(cvs.map(toJpeg));
  const pdf = jpegPdf(jp.map((jpeg) => ({ jpeg, w: W, h: H })), { title: aula.titulo });
  return savePdf(pdf, fileName(aula.titulo, aluno, new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')));
}
