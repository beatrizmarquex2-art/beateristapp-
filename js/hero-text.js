// Frase do topo do início (abaixo de BEATERISTA): muda sozinha a cada 8 horas (às 0h, 8h e 16h, no horário do aparelho).
// Insights de valor pessoal, liderança, empresária, poder, escassez, dinheiro e prosperidade. Passa por todas antes de repetir.
export const HERO_SUBS = [
  // valor pessoal
  'meu valor não está em promoção',
  'eu valho o que eu entrego, e entrego muito',
  'quem se valoriza ensina o mundo a valorizar',
  'não explico meu preço, mostro meu resultado',
  'minha presença já é parte do serviço',
  'o respeito começa no meu “não”',
  'eu não sou barata, sou rara',
  'autoestima também é estratégia de negócio',
  'meu talento merece contrato, não favor',
  // liderança
  'liderar é decidir e sustentar a decisão',
  'quem lidera dá clareza, não desculpa',
  'líder de verdade forma outros líderes',
  'o time copia o que eu tolero',
  'exemplo fala mais alto que discurso',
  'decidir rápido, ajustar rápido',
  'liderança é coragem em dia de dúvida',
  'delegar é multiplicar, não perder controle',
  // empresária
  'empresária pensa em sistema, não em sorte',
  'o que não é medido não cresce',
  'minha agenda é meu patrimônio',
  'negócio bom funciona sem eu me esgotar',
  'vender é servir com clareza',
  'cuido do caixa como cuido da arte',
  'processo simples vence talento bagunçado',
  'todo dia uma ação que gera receita',
  // poder
  'poder é escolher com quem eu trabalho',
  'quem não pede licença, ocupa o espaço',
  'silêncio estratégico também é poder',
  'minha energia é meu maior recurso',
  'poder é dizer não sem culpa',
  'presença forte, voz calma',
  'quem domina a si domina o jogo',
  // escassez
  'o que é raro vale mais',
  'agenda cheia, vaga é privilégio',
  'escassez cria desejo, valor cria fila',
  'eu não tenho tempo pra tudo, escolho o melhor',
  'vaga limitada protege a qualidade',
  'dizer não abre espaço pro sim certo',
  'exclusividade nasce de limite claro',
  'quem está em todo lugar não é desejado',
  // dinheiro
  'dinheiro segue quem entrega valor',
  'cobrar bem é respeitar meu talento',
  'preço baixo atrai problema, não cliente',
  'dinheiro guiado cresce, dinheiro solto some',
  'reserva dá liberdade, liberdade dá escolha',
  'minha renda cresce quando eu cresço',
  'toda venda começa com uma conversa',
  'eu invisto em mim primeiro',
  'receber bem também é parte da arte',
  // prosperidade
  'prosperar é o meu padrão',
  'abundância começa na decisão',
  'faço dinheiro fazendo o que amo',
  'gratidão e ambição andam juntas',
  'hoje eu planto o que vou colher',
  'passo pequeno todo dia vira prosperidade',
  'mereço o que me proponho a construir',
  'o futuro que eu quero pede minha ação hoje',
  'crescer é inevitável quando eu não paro',
  'bem-estar também é riqueza',
  'meu melhor investimento é a disciplina',
];

const SLOT = 8 * 3600e3;
// embaralha de um jeito sempre igual pra uma semente (assim todo aparelho mostra a mesma frase no mesmo horário)
function order(n, seed) {
  let a = (seed * 2654435761 + 12345) >>> 0; const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const o = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o;
}
/** A frase do período de 8 horas em que `t` (ms) cai. */
export function subFor(t = Date.now()) {
  const slot = Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / SLOT); // 0h, 8h e 16h do relógio local
  const n = HERO_SUBS.length; const cycle = Math.floor(slot / n);
  const o = order(n, cycle);
  if (o[0] === order(n, cycle - 1)[n - 1]) [o[0], o[1]] = [o[1], o[0]]; // a 1ª do ciclo novo nunca repete a última do anterior
  return HERO_SUBS[o[((slot % n) + n) % n]];
}
export const heroSub = () => subFor();
