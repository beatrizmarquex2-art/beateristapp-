// Nomes de quem joga no mesmo aparelho (pedido da Bea): "jogador 1 ____". O jogo chama cada um pelo nome na vez e no placar.
// Ficam guardados no aparelho e valem pra todos os jogos (memória, Uno, velha). Vazio = "jogador N".
import { h } from '../util.js';

const KEY = 'beaterista-nomes-jogadores';
const ler = () => { try { const l = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(l) ? l.map((x) => String(x || '')) : []; } catch { return []; } };
const limpo = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 14);

/** O nome digitado do jogador `i` (0 = primeiro) ou '' se ficou em branco. */
export const nomeDigitado = (i) => limpo(ler()[i]);
/** Como chamar o jogador `i`: o nome dele ou "jogador N". */
export const nomeDe = (i) => nomeDigitado(i) || `jogador ${i + 1}`;
/** Com preposição, pra frase ficar certa: "de Ana" / "do jogador 1"; "para Ana" / "para o jogador 1". */
export const deNome = (i) => (nomeDigitado(i) ? `de ${nomeDigitado(i)}` : `do jogador ${i + 1}`);
export const paraNome = (i) => (nomeDigitado(i) ? `para ${nomeDigitado(i)}` : `para o jogador ${i + 1}`);
export function guardarNome(i, v) { const l = ler(); while (l.length <= i) l.push(''); l[i] = limpo(v); try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 4))); } catch { /* sem espaço: segue com "jogador N" */ } }

/** Os campinhos "jogador 1 ____" pra `n` pessoas. Salva enquanto digita; não redesenha a tela (o teclado não fecha). */
export function camposNomes(n) {
  return h('div', { class: 'jg-nomes', role: 'group', 'aria-label': 'Nomes dos jogadores (opcional)' }, ...Array.from({ length: n }, (_, i) => h('label', {}, h('span', {}, `jogador ${i + 1}`),
    h('input', { type: 'text', maxlength: 14, value: nomeDigitado(i), placeholder: 'nome', autocomplete: 'off', autocapitalize: 'words', enterkeyhint: 'done', 'aria-label': `Nome do jogador ${i + 1}`, oninput: (e) => guardarNome(i, e.target.value) }))));
}
