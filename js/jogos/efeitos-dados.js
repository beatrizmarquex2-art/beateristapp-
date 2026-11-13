// Efeitos sonoros próprios de cada jogo (só dados: quem toca é efeitos.js). Cada efeito é uma lista de sons curtos:
//   { t: atraso (s), w: onda, f: frequência (Hz), to: desliza até (Hz), d: duração (s), g: volume }  ou  ruído { t, n: filtro agudo (Hz), d, g, lp: filtro grave (Hz) }
const m = (n) => 440 * Math.pow(2, (n - 69) / 12); // nota MIDI -> Hz
const O = (t, w, f, d, g = 0.25, to) => ({ t, w, f, d, g, ...(to ? { to } : {}) });
const R = (t, n, d, g = 0.3, lp) => ({ t, n, d, g, ...(lp ? { lp } : {}) });
/** sequência de notas MIDI tocadas uma depois da outra */
const arp = (notes, w, passo = 0.09, d = 0.18, g = 0.25) => notes.map((n, i) => O(i * passo, w, m(n), d, g));

export const EFEITOS = {
  uno: { nome: 'Uno Musical e UN🚫', som: 'papel, estalos e sino', efeitos: {
    'jogar carta': [R(0, 2800, 0.07, 0.5), O(0, 'sine', 140, 0.09, 0.35, 70)],
    'comprar carta': [R(0, 1800, 0.06, 0.35), R(0.07, 2400, 0.06, 0.35)],
    'carta especial': [O(0, 'sawtooth', 260, 0.28, 0.12, 900), R(0, 3500, 0.2, 0.15)],
    'UNO': [O(0, 'triangle', m(81), 0.35, 0.28), O(0.1, 'triangle', m(88), 0.45, 0.25)],
    'jogada inválida': [O(0, 'square', 110, 0.2, 0.14)],
    'vitória': arp([64, 67, 69, 71, 74, 76], 'square', 0.1, 0.2, 0.1),
    'derrota': [O(0, 'triangle', m(62), 0.5, 0.25, m(50))] } },
  bingo: { nome: 'Bingo', som: 'bolinha, carimbo e sino', efeitos: {
    'sorteou a bola': [O(0, 'sine', 700, 0.22, 0.3, 280), R(0.02, 900, 0.18, 0.12, 2500)],
    'marcou': [O(0, 'sine', 160, 0.12, 0.5, 60), R(0, 1200, 0.05, 0.25, 3000)],
    'quase lá': [O(0, 'triangle', m(76), 0.15, 0.25), O(0.12, 'triangle', m(79), 0.2, 0.25)],
    'BINGO!': [O(0, 'triangle', m(84), 0.6, 0.25), O(0.06, 'triangle', m(88), 0.6, 0.22), O(0.12, 'triangle', m(91), 0.7, 0.22), O(0.5, 'triangle', m(96), 0.8, 0.18)],
    'errou': [O(0, 'square', 190, 0.08, 0.2), O(0.12, 'square', 190, 0.1, 0.2)],
    'vitória': arp([60, 64, 67, 72, 67, 72, 76], 'sawtooth', 0.11, 0.25, 0.1) } },
  velha: { nome: 'Jogo da Velha', som: 'canetinha e trombone', efeitos: {
    'marcar X': [O(0, 'sine', 760, 0.07, 0.35, 500)],
    'marcar O': [O(0, 'sine', 520, 0.09, 0.35, 380)],
    'acertou a pergunta': [O(0, 'triangle', m(74), 0.1, 0.3), O(0.09, 'triangle', m(79), 0.1, 0.3), O(0.18, 'triangle', m(83), 0.26, 0.3)],
    'errou a pergunta': [O(0, 'triangle', 170, 0.22, 0.3, 120)],
    'vitória': arp([67, 71, 74, 79, 74, 79], 'triangle', 0.09, 0.22, 0.28),
    'derrota (trombone)': [O(0, 'sawtooth', m(58), 0.3, 0.12, m(56)), O(0.32, 'sawtooth', m(55), 0.7, 0.12, m(48))],
    'empate': [O(0, 'triangle', m(67), 0.18, 0.25), O(0.2, 'triangle', m(67), 0.3, 0.25)] } },
  quebra: { nome: 'Quebra-cabeça', som: 'caixinha de música e madeira', efeitos: {
    'pegar a peça': [R(0, 3000, 0.04, 0.25)],
    'encaixou': [O(0, 'sine', 1100, 0.05, 0.5, 600), R(0, 1500, 0.04, 0.25), O(0.08, 'sine', m(84), 0.3, 0.2)],
    'não encaixa': [O(0, 'triangle', 220, 0.14, 0.3, 160), O(0.12, 'triangle', 200, 0.14, 0.25, 150)],
    'dica': [O(0, 'sine', m(88), 0.35, 0.18), O(0.14, 'sine', m(95), 0.4, 0.15)],
    'terminou': arp([72, 76, 79, 84, 79, 84, 88, 91], 'sine', 0.12, 0.45, 0.22) } },
  cara: { nome: 'Cara a Cara', som: 'detetive e carta virando', efeitos: {
    'virar carta': [R(0, 600, 0.12, 0.3, 4000), O(0, 'sine', 400, 0.08, 0.08, 900)],
    'fazer pergunta': [O(0, 'sine', m(88), 0.3, 0.25), O(0.01, 'sine', m(95), 0.3, 0.1)],
    'resposta: sim': [O(0, 'triangle', m(72), 0.1, 0.3), O(0.1, 'triangle', m(79), 0.22, 0.3)],
    'resposta: não': [O(0, 'triangle', m(60), 0.14, 0.3), O(0.12, 'triangle', m(55), 0.26, 0.3)],
    'palpite certo': [O(0, 'sawtooth', m(52), 0.18, 0.12), O(0, 'sawtooth', m(55), 0.18, 0.12), O(0, 'sawtooth', m(58), 0.18, 0.12), O(0.22, 'triangle', m(72), 0.12, 0.25), O(0.34, 'triangle', m(76), 0.12, 0.25), O(0.46, 'triangle', m(79), 0.5, 0.25)],
    'palpite errado': [O(0, 'sawtooth', m(55), 0.3, 0.12, m(53)), O(0.32, 'sawtooth', m(52), 0.6, 0.12, m(46))] } },
  memoria: { nome: 'Memória', som: 'harpa', efeitos: {
    'virar a carta': [O(0, 'sine', m(81), 0.35, 0.28), O(0, 'triangle', m(93), 0.12, 0.06)],
    'achou o par': [O(0, 'sine', m(84), 0.4, 0.25), O(0.1, 'sine', m(88), 0.4, 0.25), O(0.2, 'sine', m(91), 0.6, 0.25)],
    'não é par': [O(0, 'sine', m(64), 0.3, 0.22), O(0.02, 'triangle', m(52), 0.3, 0.12)],
    'terminou': arp([60, 64, 67, 72, 76, 79, 84, 88], 'sine', 0.09, 0.6, 0.2) } },
  figuras: { nome: 'Figuras rítmicas', som: 'marimba', efeitos: {
    'acertou': [O(0, 'sine', m(76), 0.28, 0.35), O(0, 'sine', m(88), 0.09, 0.12)],
    'errou': [O(0, 'triangle', m(52), 0.18, 0.3, m(48)), R(0, 800, 0.05, 0.12, 2500)],
    'ganhou estrela': [O(0, 'sine', m(88), 0.2, 0.2), O(0.08, 'sine', m(93), 0.2, 0.2), O(0.16, 'sine', m(100), 0.4, 0.16)],
    'passou de fase': arp([67, 71, 74, 79, 83, 86], 'sine', 0.09, 0.32, 0.28),
    'chefão': [O(0, 'sawtooth', m(43), 0.2, 0.14), O(0.2, 'sawtooth', m(43), 0.2, 0.14), O(0.4, 'sawtooth', m(50), 0.5, 0.14)] } },
  paulta: { nome: 'pauLta', som: 'pizzicato de cordas', efeitos: {
    'acertou': [O(0, 'triangle', m(79), 0.14, 0.4), O(0, 'sine', m(91), 0.06, 0.12)],
    'errou': [O(0, 'triangle', m(55), 0.14, 0.4, m(52)), O(0, 'sine', m(43), 0.1, 0.2)],
    'ganhou estrela': arp([83, 88, 95], 'triangle', 0.07, 0.14, 0.3),
    'passou de fase': arp([62, 66, 69, 74, 78, 81], 'triangle', 0.08, 0.16, 0.38),
    'mundo concluído': arp([60, 64, 67, 72, 76, 79, 84, 88], 'triangle', 0.08, 0.2, 0.35) } },
  toca: { nome: 'Toca Aqui', som: 'batucada: pandeiro, tamborim e surdo', efeitos: {
    'acertou o tempo': [O(0, 'sine', 230, 0.13, 0.5, 110), R(0, 6000, 0.09, 0.28), R(0.05, 7500, 0.07, 0.2)],
    'quase': [R(0, 3500, 0.05, 0.3, 6000), R(0.07, 3500, 0.05, 0.22, 6000)],
    'errou': [O(0, 'sine', 85, 0.28, 0.5, 55)],
    'contagem (tique)': [O(0, 'sine', 1700, 0.04, 0.35), O(0.4, 'sine', 1700, 0.04, 0.35), O(0.8, 'sine', 1700, 0.04, 0.35), O(1.2, 'sine', 2300, 0.07, 0.4)],
    'passou de fase': [R(0, 3500, 0.05, 0.3, 6000), R(0.08, 3500, 0.05, 0.3, 6000), R(0.16, 3500, 0.05, 0.3, 6000), R(0.24, 3500, 0.05, 0.3, 6000), O(0.34, 'sine', 200, 0.3, 0.6, 70), R(0.34, 7000, 0.7, 0.28)] } },
  beat: { nome: 'Beat Hero', som: 'arcade: laser, moeda e chiptune', efeitos: {
    'acertou a nota': [O(0, 'square', 1300, 0.07, 0.14, 620), O(0.06, 'square', m(88), 0.12, 0.1)],
    'perdeu a nota': [O(0, 'square', 330, 0.22, 0.14, 70)],
    'combo': arp([72, 76, 79, 84], 'square', 0.05, 0.1, 0.1),
    'nota estrela': [O(0, 'triangle', m(91), 0.1, 0.22), O(0.07, 'triangle', m(96), 0.1, 0.22), O(0.14, 'triangle', m(100), 0.14, 0.22), O(0.22, 'triangle', m(103), 0.3, 0.2)],
    'fim da música': [...arp([67, 72, 76, 79, 84], 'square', 0.1, 0.16, 0.1), O(0.55, 'square', m(88), 0.7, 0.1), O(0.55, 'triangle', m(76), 0.7, 0.14)] } },
  stop: { nome: 'STOP', som: 'programa de auditório: sino e buzina', efeitos: {
    'tique-taque': [O(0, 'sine', 1900, 0.03, 0.4), O(0.5, 'sine', 1400, 0.03, 0.4)],
    'STOP!': [O(0, 'square', 880, 0.16, 0.14), O(0, 'square', 1108, 0.16, 0.1), O(0.2, 'square', 880, 0.3, 0.14), O(0.2, 'square', 1108, 0.3, 0.1), R(0, 2500, 0.3, 0.15)],
    'resposta válida': [O(0, 'triangle', m(88), 0.5, 0.3), O(0, 'sine', m(100), 0.5, 0.1), O(0.01, 'sine', m(95), 0.5, 0.12)],
    'resposta inválida': [O(0, 'sawtooth', 120, 0.32, 0.18, 90), O(0, 'square', 126, 0.32, 0.08)],
    'acabou o tempo': [O(0, 'triangle', 988, 0.1, 0.25), O(0.14, 'triangle', 784, 0.1, 0.25), O(0.28, 'triangle', 622, 0.1, 0.25), O(0.44, 'square', 233, 0.7, 0.14)] } },
};
