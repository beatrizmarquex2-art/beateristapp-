// Marca d'água com o NOME do aluno nas telas que viram "carta" (aulas do Paul, teoria e dicionário): fica clarinha, em diagonal, não atrapalha o toque
// e serve de aviso e de rastro se um print aparecer num material à venda. Usa só o nome (o código nunca aparece). Só na área dos alunos.
const ROTAS = /^#\/(dicionario|estudos\/(aulas|basica))/;
const nomeDoAluno = () => { try { return (localStorage.getItem('beaterista-aluno-nome') || '').trim().slice(0, 24); } catch { return ''; } };
const esc = (s) => s.replace(/[<>&"']/g, '');
export function marcaDoAluno(nome = nomeDoAluno()) {
  const t = esc(`Beaterista · ${nome || 'aluno'}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150"><text x="125" y="80" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="15" fill="rgb(110,110,135)" fill-opacity=".17" transform="rotate(-22 125 75)">${t}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
export const rotaComMarca = (hash) => ROTAS.test(String(hash || ''));
export function iniciarMarcaDagua() {
  if (typeof document === 'undefined' || document.getElementById('marca-dagua')) return;
  const el = document.createElement('div'); el.id = 'marca-dagua'; el.setAttribute('aria-hidden', 'true'); document.body.append(el);
  const atualiza = () => { const on = rotaComMarca(location.hash); el.hidden = !on; if (on) el.style.backgroundImage = marcaDoAluno(); };
  addEventListener('hashchange', atualiza); document.addEventListener('aluno-acesso', atualiza); atualiza();
}
