// Trilha de aprender e tocar: a ordem certinha dos Modos Aventura que ensinam (teoria e tocar de verdade).
// Puro (sem DOM, sem armazenamento): recebe quais passos já foram concluídos e diz o que está aberto, o que é o próximo e o que está trancado.
// Os jogos de diversão (Uno, Bingo, STOP, Velha, Quebra-cabeça, Cara a Cara) não entram: ficam só no Modo Livre.
export const PASSOS = [
  { id: 'memoria', nome: 'Memória dos instrumentos', texto: 'conheça os instrumentos da banda', href: '#/kids/memoria/aventura' },
  { id: 'figuras', nome: 'Figuras rítmicas', texto: 'pulso, semínima, colcheia, pausas', href: '#/kids/figuras' },
  { id: 'paulta-bateria', nome: 'pauLta · Bateria', texto: 'ler a pauta da bateria', href: '#/paulta/drum' },
  { id: 'monte', nome: 'Monte seu ritmo', texto: 'criar ritmos com o que aprendeu', href: '#/kids/ritmo/aventura' },
  { id: 'toca', nome: 'Toca Aqui', texto: 'ler e tocar: iniciante, intermediário e avançado', href: '#/jogos/toca/aventura' },
  { id: 'paulta-claves', nome: 'pauLta · Claves de Sol e Fá', texto: 'ler melodias nas duas claves', href: '#/paulta/sol' },
  { id: 'paulta-duelo', nome: 'pauLta · Duelo das Claves', texto: 'sol contra fá, o desafio final', href: '#/paulta/duel' },
];
export const IDS = PASSOS.map((p) => p.id);

/** feitos: { [id]: boolean }. Um passo abre quando o anterior está concluído (o primeiro sempre abre). */
export function estado(feitos = {}) {
  let atual = null;
  return PASSOS.map((p, i) => {
    const feito = !!feitos[p.id]; const aberto = i === 0 || !!feitos[PASSOS[i - 1].id];
    const isAtual = !feito && aberto && atual === null; if (isAtual) atual = p.id;
    return { ...p, n: i + 1, feito, aberto, atual: isAtual };
  });
}
export const travado = (feitos, id) => { const p = estado(feitos).find((x) => x.id === id); return !!p && !p.aberto; };
export const progresso = (feitos) => { const e = estado(feitos); return { feitos: e.filter((p) => p.feito).length, total: e.length }; };
