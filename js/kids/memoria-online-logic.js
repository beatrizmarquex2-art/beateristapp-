// Jogo da memória em 2 celulares (sala por código). Regras puras, sem DOM: o estado inteiro é um objeto simples que vai e volta pelo Supabase.
// Só quem está na vez escreve (vira carta, resolve o par); o outro celular só desenha o que recebe. As cartas são as mesmas do jogo normal:
// o estado guarda só o id do tema e a ordem das cartas (ids), e cada celular monta as imagens com os temas que já tem.
export const JOGO = 'memoria';

const shuffleWith = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Partida nova. `theme` = { id, items:[{id}] }; `first` = quem começa (0 = quem criou a sala, 1 = quem entrou); `rev` = número da revanche. */
export function newMatch({ theme, pairs, again = true, first = 0, rev = 0, rnd = Math.random }) {
  const n = Math.max(2, Math.min(pairs | 0, theme.items.length));
  const picks = shuffleWith(theme.items, rnd).slice(0, n).map((x) => x.id);
  const deck = shuffleWith(picks.flatMap((id) => [id, id]), rnd);
  return { v: 1, th: theme.id, pairs: n, again: again !== false, deck, turn: first === 1 ? 1 : 0, up: [], ok: [], score: [0, 0], tries: 0, fin: false, rev };
}

export function validMatch(s) {
  return !!s && s.v === 1 && typeof s.th === 'string' && Array.isArray(s.deck) && s.deck.length >= 4 && s.deck.length % 2 === 0
    && Array.isArray(s.up) && Array.isArray(s.ok) && Array.isArray(s.score) && s.score.length === 2 && (s.turn === 0 || s.turn === 1);
}

/** Dá pra virar a carta `i` agora? Só na vez de `me`, com no máximo uma carta virada, e só carta que ainda está de costas. */
export function canFlip(s, i, me) {
  return !!s && !s.fin && s.turn === me && s.up.length < 2 && Number.isInteger(i) && i >= 0 && i < s.deck.length && !s.up.includes(i) && !s.ok.includes(i);
}

/** Vira a carta `i` (devolve o estado novo; o antigo não muda). */
export function flip(s, i, me) {
  if (!canFlip(s, i, me)) return s;
  return { ...s, up: [...s.up, i] };
}

/** Duas cartas viradas esperando conferir (quem está na vez confere). */
export const aguardaConferir = (s) => !!s && !s.fin && s.up.length === 2;

/** Confere as duas cartas viradas. Acertou: fica com elas, ganha ponto e (se "acerta joga de novo") joga mais uma vez. Errou: desvira e passa a vez. */
export function resolve(s) {
  if (!aguardaConferir(s)) return s;
  const [a, b] = s.up; const same = s.deck[a] === s.deck[b];
  if (same) {
    const ok = [...s.ok, a, b]; const score = s.score.slice(); score[s.turn] += 1; const fin = ok.length >= s.deck.length;
    return { ...s, ok, up: [], score, tries: s.tries + 1, fin, turn: fin || s.again ? s.turn : 1 - s.turn };
  }
  return { ...s, up: [], tries: s.tries + 1, turn: 1 - s.turn };
}

/** 0 ou 1 = quem venceu; -1 = empate; null = ainda não acabou. */
export function winner(s) {
  if (!s || !s.fin) return null;
  return s.score[0] === s.score[1] ? -1 : s.score[0] > s.score[1] ? 0 : 1;
}

/** Revanche: mesmas opções, cartas novas, e quem começa alterna. */
export function rematch(s, theme, rnd = Math.random) {
  return newMatch({ theme, pairs: s.pairs, again: s.again, first: (s.rev + 1) % 2, rev: s.rev + 1, rnd });
}

/** Assinatura do baralho: quando muda (revanche, outro tema), o tabuleiro é montado de novo. */
export const deckKey = (s) => `${s.th}|${s.rev}|${s.deck.join(',')}`;
