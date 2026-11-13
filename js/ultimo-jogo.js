// Último jogo aberto (por aluno, neste aparelho): a tela de Jogos e o Álbum mostram "voltar pro jogo", pra ninguém se perder depois de ir colar figurinha.
const KEY0 = 'beaterista-jogo-ultimo'; const VALE = 30 * 24 * 3600 * 1000;
const dono = () => { try { return (localStorage.getItem('beaterista-aluno-nome') || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30); } catch { return ''; } };
const chave = () => { const d = dono(); return d ? `${KEY0}:${d}` : KEY0; };
/** Guarda o jogo aberto: `href` = endereço completo (#/jogos/copia), `nome` = como aparece no botão. */
export function lembrar(href, nome, id = '') { try { localStorage.setItem(chave(), JSON.stringify({ id, href, nome, at: Date.now() })); } catch { /* sem armazenamento */ } }
/** { id, href, nome, at } do último jogo, ou null. */
export function ultimoJogo() { try { const u = JSON.parse(localStorage.getItem(chave()) || 'null'); return u && u.href && u.nome && Date.now() - (u.at || 0) < VALE ? u : null; } catch { return null; } }
