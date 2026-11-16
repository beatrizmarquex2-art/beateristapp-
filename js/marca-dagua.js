// Marca d'água do aluno nas telas que viram "carta" (aulas do Paul, teoria e dicionário): pequena, clarinha, em diagonal e espalhada,
// não atrapalha o toque e serve de aviso e de rastro se um print aparecer num material à venda. Só na área dos alunos. O código nunca aparece.
// 3 modelos (a Bea escolhe): 1 = texto "jogos.beaterista.com.br" + nome · 2 = selo da escola · 3 = texto no amarelo da escola.
export const TERMO_DE_USO = 'o conteúdo da Beaterista é de uso pessoal: copiar, vender ou compartilhar sem permissão não é permitido. os botões de compartilhar do próprio app podem ser usados.';
const ROTAS = /^#\/(dicionario|estudos\/(aulas|basica))/;
const SITE = 'jogos.beaterista.com.br';
const nomeDoAluno = () => { try { return (localStorage.getItem('beaterista-aluno-nome') || '').trim().slice(0, 24); } catch { return ''; } };
const modeloAtual = () => { try { return localStorage.getItem('beaterista-marca-modelo') || '1'; } catch { return '1'; } };
export const rotaComMarca = (hash) => ROTAS.test(String(hash || ''));
const imagem = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
/** Desenha a "telha" que se repete (canvas, sem arquivo novo). */
export async function telha(modelo = modeloAtual(), nome = nomeDoAluno()) {
  const c = document.createElement('canvas'); const W = modelo === '2' ? 280 : 300, H = modelo === '2' ? 240 : 190; c.width = W * 2; c.height = H * 2; const g = c.getContext('2d'); g.scale(2, 2);
  g.translate(W / 2, H / 2); g.rotate(-18 * Math.PI / 180); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (modelo === '2') {
    const logo = await imagem(new URL('../assets/logo-512.png', import.meta.url).href);
    if (logo) { g.globalAlpha = 0.22; g.drawImage(logo, -21, -34, 42, 42); }
    g.globalAlpha = 0.2; g.fillStyle = '#162146'; g.font = '800 10px Arial,sans-serif'; g.fillText(SITE, 0, 22);
  } else if (modelo === '3') {
    g.font = '800 13px Arial,sans-serif'; g.lineWidth = 2; g.strokeStyle = 'rgba(22,33,70,.32)'; g.strokeText(SITE, 0, -4); g.fillStyle = 'rgba(242,169,27,.78)'; g.fillText(SITE, 0, -4);
    if (nome) { g.font = '800 10px Arial,sans-serif'; g.strokeStyle = 'rgba(22,33,70,.28)'; g.strokeText(nome, 0, 12); g.fillStyle = 'rgba(242,169,27,.7)'; g.fillText(nome, 0, 12); }
  } else {
    g.fillStyle = 'rgba(22,33,70,.17)'; g.font = '800 12px Arial,sans-serif'; g.fillText(SITE, 0, -4);
    if (nome) { g.font = '700 10px Arial,sans-serif'; g.fillText(nome, 0, 11); }
  }
  return { url: c.toDataURL('image/png'), w: W, h: H };
}
export function iniciarMarcaDagua() {
  if (typeof document === 'undefined' || document.getElementById('marca-dagua')) return;
  const el = document.createElement('div'); el.id = 'marca-dagua'; el.setAttribute('aria-hidden', 'true'); document.body.append(el);
  let chave = '';
  const atualiza = async () => {
    const on = rotaComMarca(location.hash); el.hidden = !on; if (!on) return;
    const k = `${modeloAtual()}|${nomeDoAluno()}`; if (k === chave) return; chave = k;
    const t = await telha(); el.style.backgroundImage = `url("${t.url}")`; el.style.backgroundSize = `${t.w}px ${t.h}px`;
  };
  addEventListener('hashchange', atualiza); document.addEventListener('aluno-acesso', atualiza); atualiza();
}
