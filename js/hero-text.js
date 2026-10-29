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

// Palavra de incentivo do Paul (no topo do início): muda a cada 8 horas, sem repetir até acabar a lista. Toque no balão pra ver outra.
export const INCENTIVOS = [
  'bora, bea! hoje o seu som vale ouro',
  'cada aula sua planta uma semente de música na vida de alguém',
  'você já chegou mais longe do que a bea de ontem imaginava',
  'pequeno passo todo dia vira palco lotado',
  'seu talento não pede desculpa, pede espaço',
  'respira, confia e toca como quem sabe, porque você sabe',
  'a beleza que você mostra por fora nasce da que você cultiva por dentro',
  'quem ensina com amor ensina pra vida inteira',
  'sua presença já é um show',
  'hoje é dia de fazer uma coisa que a bea do futuro vai agradecer',
  'seu jeito único é o seu maior diferencial',
  'não precisa ser perfeito, precisa ser verdadeiro e constante',
  'você é a artista e a empresária, as duas merecem brilhar',
  'tem gente esperando exatamente o que só você sabe fazer',
  'disciplina hoje, liberdade amanhã',
  'sua voz, seu ritmo, sua regra',
  'foco de 25 minutos e depois um sorriso: você consegue',
  'o que você treina em silêncio aparece no aplauso',
  'estudar um pouquinho hoje já é vitória',
  'magnetismo é energia boa, e você tem de sobra',
  'o palco é pequeno perto da sua vontade de crescer',
  'um dia de cada vez, sempre com música',
  'você inspira mais gente do que imagina',
  'quando bater o cansaço, lembra por que você começou',
  'cuida de você que a arte cuida do resto',
  'sua arte merece ser vista, então mostra',
  'aluno que aprende com você leva a música pra vida',
  'confia no processo, o resultado vem junto',
  'hoje a prioridade é você ficar orgulhosa de você',
  'tudo o que você sonha cabe num compasso por vez',
  'você tem lábia, luz e talento: usa os três',
  'erro é só uma nota que ensina o próximo toque',
  'beleza, fé e ritmo: combinação imbatível',
  'o dia ainda tem muita música pra acontecer',
  'sua constância vale mais que qualquer pressa',
  'fecha os olhos, imagina o show lotado e vai atrás',
  'a bea que você quer ser já está caminhando',
  'seja a pessoa que você precisava ter ao lado quando estava começando',
  'você está construindo algo grande, tijolinho por tijolinho',
  'obrigado por existir e fazer música virar encontro',
];
const FACES = ['e02', 'e03', 'e20', 'e26', 'e09', 'e10', 'e27', 'e06', 'e13', 'e04'];
/** { text, face, slot } do período de 8 horas de `t`; `off` pula pra próximas (toque no balão). */
export function incentiveFor(t = Date.now(), off = 0) {
  const slot = Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / SLOT) + off;
  const n = INCENTIVOS.length; const cycle = Math.floor(slot / n);
  const o = order(n, cycle + 777);
  if (o[0] === order(n, cycle + 776)[n - 1]) [o[0], o[1]] = [o[1], o[0]];
  const i = ((slot % n) + n) % n;
  return { text: INCENTIVOS[o[i]], face: FACES[((slot % FACES.length) + FACES.length) % FACES.length], slot: slot - off };
}
