// Categorias de estudo, a linha em português de cada tema em inglês e a pergunta central de cada artista.
// Tudo pelo slug, então funciona com os textos já importados (sem precisar reimportar). Um texto novo pode
// trazer `category:` no frontmatter; sem isso cai na categoria padrão da coleção.

export const CATEGORIES = [
  { id: 'bateristas', label: 'Bateristas', blurb: 'quem pensa a música a partir das baquetas', kind: 'artist' },
  { id: 'musicos', label: 'Músicos & compositores', blurb: 'guitarra, piano, voz e canção', kind: 'artist' },
  { id: 'produtores', label: 'Produtores & beatmakers', blurb: 'quem compõe com o estúdio inteiro', kind: 'artist' },
  { id: 'ritmo', label: 'Ritmo & groove', blurb: 'pulso, síncope, microtempo e vontade de mexer', kind: 'topic' },
  { id: 'pratica', label: 'Estudo & prática', blurb: 'como o corpo aprende e fixa o que você treina', kind: 'topic' },
  { id: 'escuta', label: 'Ouvido & teoria da escuta', blurb: 'o que o cérebro prevê, separa e entende no som', kind: 'topic' },
  { id: 'prazer', label: 'Prazer & emoção', blurb: 'por que a música arrepia e dá vontade de repetir', kind: 'topic' },
  { id: 'palco', label: 'Palco & ensino', blurb: 'pressão, fluxo e a arte de explicar o óbvio', kind: 'topic' },
];

const GROUPS = {
  bateristas: ['john-bonham', 'josh-dun', 'zac-farro', 'eloy-casagrande', 'vinnie-colaiuta', 'matt-helders', 'travis-barker', 'dave-grohl'],
  musicos: ['john-mayer', 'frederic-chopin', 'justin-bieber', 'john-lennon', 'paul-mccartney', 'george-harrison', 'alex-turner', 'tyler-joseph', 'thom-yorke', 'tim-henson', 'bad-bunny'],
  produtores: ['pharrell-williams', 'rick-rubin', 'kanye-west', 'tyler-the-creator'],
  ritmo: ['groove-inverted-u', 'syncopation-urge-to-move', 'microtiming', 'p-centers-perceived-timing', 'entrainment', 'beat-perception-beat-finding', 'beat-deafness', 'sensorimotor-synchronization', 'vibrotactile-beat-perception', 'multisensory-rhythm-perception', 'development-evolution-beat', 'social-entrainment-musicians', 'inter-brain-synchrony-music'],
  pratica: ['mental-vs-physical-practice', 'contextual-interference-interleaved-practice', 'retrieval-practice-music', 'production-effect-learning', 'motor-chunking', 'procedural-memory-musicians', 'error-based-motor-learning', 'automaticity-skilled-performance', 'tacit-knowledge', 'sensorimotor-integration', 'embodied-cognition', 'musical-skill-executive-functions'],
  escuta: ['audiation-voluntary-musical-imagery', 'auditory-prediction-temporal-attention', 'auditory-scene-analysis', 'categorical-perception-musicians', 'expertise-changes-hearing', 'selective-musical-attention', 'musical-expectations', 'predictive-coding-in-music', 'statistical-learning-music', 'congenital-amusia', 'involuntary-musical-imagery-earworms'],
  prazer: ['dopamine-and-music', 'musical-pleasure-reward', 'prediction-error-musical-reward', 'specific-musical-anhedonia'],
  palco: ['flow-musical-performance', 'choking-under-pressure', 'explicit-monitoring-automated-skills', 'curse-of-knowledge-music-teaching', 'experts-forget-beginner'],
};
const CAT_OF = Object.fromEntries(Object.entries(GROUPS).flatMap(([c, slugs]) => slugs.map((s) => [s, c])));

export function categoryOf(a) {
  const own = a.meta && a.meta.category;
  if (own && CATEGORIES.some((c) => c.id === own)) return own;
  return CAT_OF[a.slug] || (a.collection === 'laboratorio-de-artistas' ? 'musicos' : 'escuta');
}
export const category = (id) => CATEGORIES.find((c) => c.id === id) || null;

/** Uma linha em português para cada tema que veio com título em inglês. */
export const PT = {
  'audiation-voluntary-musical-imagery': 'ouvir música por dentro, de olhos fechados, sem tocar nada',
  'auditory-prediction-temporal-attention': 'o cérebro adivinha quando vem o próximo som e presta atenção na hora certa',
  'auditory-scene-analysis': 'como o ouvido separa bumbo, baixo e voz quando tudo toca junto',
  'automaticity-skilled-performance': 'quando a mão faz sozinha e a cabeça fica livre para a música',
  'beat-deafness': 'gente que ouve bem mas não acha o pulso: o que isso ensina sobre ritmo',
  'beat-perception-beat-finding': 'como a gente encontra o “um” e o pulso de uma música',
  'categorical-perception-musicians': 'por que o músico ouve “caixinhas” (notas, figuras) onde outros ouvem contínuo',
  'choking-under-pressure': 'por que a gente trava no palco ou na prova, e como evitar',
  'congenital-amusia': 'quem nasce sem perceber afinação: o que falta e o que sobra',
  'contextual-interference-interleaved-practice': 'misturar exercícios no treino rende mais do que repetir um só em bloco',
  'curse-of-knowledge-music-teaching': 'a maldição de quem já sabe: esquecer o que o aluno ainda não vê',
  'development-evolution-beat': 'de onde vem a nossa capacidade de sentir pulso, do bebê à evolução',
  'dopamine-and-music': 'dopamina e música: o que a ciência sabe de verdade (e o que é exagero)',
  'embodied-cognition': 'pensar com o corpo: o movimento faz parte de entender música',
  'entrainment': 'quando o corpo se sincroniza sozinho com o ritmo',
  'error-based-motor-learning': 'como o erro corrige o movimento, e por que errar faz parte',
  'expertise-changes-hearing': 'como anos de estudo mudam o que o músico consegue ouvir',
  'experts-forget-beginner': 'por que quem toca bem esquece como era ser iniciante',
  'explicit-monitoring-automated-skills': 'prestar atenção demais no que já é automático atrapalha',
  'flow-musical-performance': 'o estado de fluxo: tocar inteira, sem pensar no tempo',
  'groove-inverted-u': 'ritmo nem simples nem complexo demais é o que dá mais vontade de dançar',
  'inter-brain-synchrony-music': 'quando dois músicos tocam juntos, os cérebros entram no mesmo passo',
  'involuntary-musical-imagery-earworms': 'música chiclete: por que um trecho gruda na cabeça',
  'mental-vs-physical-practice': 'treinar de cabeça funciona? quanto vale o estudo sem instrumento',
  'microtiming': 'os milissegundos antes ou depois do tempo que fazem o groove',
  'motor-chunking': 'como o cérebro junta notas em “blocos” para tocar rápido',
  'multisensory-rhythm-perception': 'sentir ritmo com olho, ouvido e corpo ao mesmo tempo',
  'musical-expectations': 'o que a gente espera ouvir a seguir, e o prazer de ser surpreendido',
  'musical-pleasure-reward': 'o sistema de recompensa do cérebro e o arrepio da música',
  'musical-skill-executive-functions': 'estudar música e funções como foco, memória e planejamento',
  'p-centers-perceived-timing': 'o ponto exato em que um som “cai” no tempo para quem ouve',
  'prediction-error-musical-reward': 'o prazer vem do quase-esperado: a surpresa na medida',
  'predictive-coding-in-music': 'o cérebro como máquina de previsão musical',
  'procedural-memory-musicians': 'a memória das mãos: o que fica guardado no corpo',
  'production-effect-learning': 'falar, tocar ou cantar em voz alta ajuda a lembrar',
  'retrieval-practice-music': 'puxar da memória (sem olhar) fixa mais do que reler',
  'selective-musical-attention': 'escolher um instrumento e seguir só ele no meio da banda',
  'sensorimotor-integration': 'como ouvir e mover viram uma coisa só',
  'sensorimotor-synchronization': 'bater junto com o metrônomo: por que a gente adianta',
  'social-entrainment-musicians': 'sincronizar com outras pessoas: banda, plateia, aluno',
  'specific-musical-anhedonia': 'quem não sente prazer com música, e o que isso revela',
  'statistical-learning-music': 'o ouvido aprende padrões só de ouvir muito, sem regra',
  'syncopation-urge-to-move': 'síncope e a vontade irresistível de mexer o corpo',
  'tacit-knowledge': 'o saber que você tem mas não consegue explicar em palavras',
  'vibrotactile-beat-perception': 'sentir o pulso pela vibração na pele e no chão',
};

/** A pergunta central de cada perfil (do índice do Laboratório de Artistas). */
/** Título em português dos temas da Mente Musical (o original em inglês aparece pequeno embaixo). */
export const TITLE_PT = {
  'audiation-voluntary-musical-imagery': 'Audiação: ouvir a música por dentro',
  'auditory-prediction-temporal-attention': 'Previsão auditiva e atenção no tempo',
  'auditory-scene-analysis': 'Análise da cena auditiva',
  'automaticity-skilled-performance': 'Automatismo na performance',
  'beat-deafness': 'Surdez de pulso',
  'beat-perception-beat-finding': 'Perceber e achar o pulso',
  'categorical-perception-musicians': 'Percepção categórica nos músicos',
  'choking-under-pressure': 'Travar sob pressão',
  'congenital-amusia': 'Amusia congênita',
  'contextual-interference-interleaved-practice': 'Interferência contextual e prática intercalada',
  'curse-of-knowledge-music-teaching': 'A maldição do conhecimento no ensino de música',
  'development-evolution-beat': 'Como a percepção do pulso nasce e evolui',
  'dopamine-and-music': 'Dopamina e música: o que se sabe de verdade',
  'embodied-cognition': 'Cognição incorporada: o corpo também pensa',
  'entrainment': 'Sincronização com o ritmo',
  'error-based-motor-learning': 'Aprender o movimento pelo erro',
  'expertise-changes-hearing': 'Como a experiência muda o que o músico ouve',
  'experts-forget-beginner': 'Por que quem sabe esquece como era ser iniciante',
  'explicit-monitoring-automated-skills': 'Vigiar demais o que já é automático',
  'flow-musical-performance': 'Estado de fluxo na performance',
  'groove-inverted-u': 'Groove e o "U invertido" da complexidade rítmica',
  'inter-brain-synchrony-music': 'Cérebros em sincronia tocando juntos',
  'involuntary-musical-imagery-earworms': 'Música chiclete: a que gruda na cabeça',
  'mental-vs-physical-practice': 'Prática mental x prática física',
  'microtiming': 'Microtempo',
  'motor-chunking': 'Agrupar movimentos em blocos',
  'multisensory-rhythm-perception': 'Perceber o ritmo com vários sentidos',
  'musical-expectations': 'Expectativas musicais',
  'musical-pleasure-reward': 'Prazer musical e o sistema de recompensa',
  'musical-skill-executive-functions': 'Habilidade musical e funções executivas',
  'p-centers-perceived-timing': 'Centro perceptivo da nota e o tempo que a gente sente',
  'prediction-error-musical-reward': 'Erro de previsão e recompensa musical',
  'predictive-coding-in-music': 'Codificação preditiva na música',
  'procedural-memory-musicians': 'Memória procedural nos músicos',
  'production-effect-learning': 'Efeito de produção: falar e tocar pra aprender',
  'retrieval-practice-music': 'Prática de recordar aplicada à música',
  'selective-musical-attention': 'Atenção musical seletiva',
  'sensorimotor-integration': 'Integração sensório-motora',
  'sensorimotor-synchronization': 'Sincronização sensório-motora',
  'social-entrainment-musicians': 'Sincronia entre músicos',
  'specific-musical-anhedonia': 'Anedonia musical específica',
  'statistical-learning-music': 'Aprendizado estatístico na música',
  'syncopation-urge-to-move': 'Síncope e a vontade de mexer',
  'tacit-knowledge': 'Conhecimento tácito',
  'vibrotactile-beat-perception': 'Sentir o pulso pela vibração',
};
/** Aplica o título em português e guarda o original em `titleEn`. */
export const withPt = (a) => (a && TITLE_PT[a.slug] && !a.titleEn ? { ...a, title: TITLE_PT[a.slug], titleEn: a.title } : a);

export const QUESTION = {
  'travis-barker': 'como marching, jazz, punk e hip-hop viram uma linguagem só, sem soar como colagem?',
  'eloy-casagrande': 'técnica extrema a serviço de uma imagem sonora interna, não de demonstração',
  'matt-helders': 'como um baterista muito reconhecível aprende a reduzir a própria assinatura',
  'rick-rubin': 'criar é adicionar coisas ou criar condições para perceber o essencial?',
  'pharrell-williams': 'como curiosidade analítica vira originalidade sem matar o instinto',
  'josh-dun': 'autodidata: observação obsessiva e pouco recurso viram identidade de palco',
  'tyler-joseph': 'usar as restrições de uma dupla para decidir o que a música precisa',
  'john-bonham': 'o que produz peso: força, timing, som, dinâmica ou arquitetura da parte?',
  'alex-turner': 'trocar a ferramenta de compor muda o vocabulário que a mente oferece',
  'kanye-west': 'dezenas de colaboradores e ainda assim uma direção autoral forte',
  'justin-bieber': 'o que tocar vários instrumentos de ouvido faz com o fraseado pop',
  'john-mayer': 'quando o virtuosismo serve a música e quando compete com ela',
  'thom-yorke': 'quando a produção deixa de ser acabamento e vira composição',
  'tyler-the-creator': 'música, roupa, cor, capa e personagem como uma só composição',
  'bad-bunny': 'preservar instinto e identidade local dentro do pop global',
  'paul-mccartney': 'continuar prolífico sem transformar composição em fórmula',
  'john-lennon': 'som das palavras, confissão e edição de texto como identidade',
  'george-harrison': 'estudar outra tradição a sério, sem tratar como enfeite exótico',
  'frederic-chopin': 'técnica como som e frase, não ginástica separada',
  'zac-farro': 'como compor muda o que um baterista acha necessário numa parte',
  'dave-grohl': 'por que uma parte simples pode ter mais composição que uma densa',
  'vinnie-colaiuta': 'complexidade métrica tão fluente que vira linguagem',
  'tim-henson': 'guitarra como ferramenta de sound design e beatmaking',
};

/** Título da página na Wikipedia (inglês) de cada artista, para buscar uma foto de licença livre. */
export const WIKI = {
  'john-bonham': 'John_Bonham', 'josh-dun': 'Josh_Dun', 'zac-farro': 'Zac_Farro', 'eloy-casagrande': 'Eloy_Casagrande',
  'vinnie-colaiuta': 'Vinnie_Colaiuta', 'matt-helders': 'Matt_Helders', 'travis-barker': 'Travis_Barker', 'dave-grohl': 'Dave_Grohl',
  'john-mayer': 'John_Mayer', 'frederic-chopin': 'Frédéric_Chopin', 'justin-bieber': 'Justin_Bieber', 'john-lennon': 'John_Lennon',
  'paul-mccartney': 'Paul_McCartney', 'george-harrison': 'George_Harrison', 'alex-turner': 'Alex_Turner_(musician)', 'tyler-joseph': 'Tyler_Joseph',
  'thom-yorke': 'Thom_Yorke', 'tim-henson': 'Tim_Henson', 'bad-bunny': 'Bad_Bunny', 'pharrell-williams': 'Pharrell_Williams',
  'rick-rubin': 'Rick_Rubin', 'kanye-west': 'Kanye_West', 'tyler-the-creator': 'Tyler,_the_Creator',
};

/** Só aceita imagem hospedada no Wikimedia Commons (lá tudo é de licença livre; "fair use" fica na Wikipedia em inglês). */
export const isCommons = (url) => typeof url === 'string' && url.includes('upload.wikimedia.org/wikipedia/commons/');
export function commonsFile(url) {
  // .../commons/thumb/a/ab/Nome.jpg/330px-Nome.jpg  ou  .../commons/a/ab/Nome.jpg
  const m = String(url).match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
export const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
