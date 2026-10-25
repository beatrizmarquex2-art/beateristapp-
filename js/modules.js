// Catálogo dos atalhos da home. `route` = existe de verdade; `phase` = ainda não existe (aviso honesto).
export const MODULES = [
  { slug: 'beatlab', label: 'Beat Lab', icon: 'kit', route: '#/beatlab' },
  { slug: 'ouvido', label: 'Estúdio de Ouvido', icon: 'mic', route: '#/ouvido' },
  { slug: 'metronomo', label: 'Metrônomo', icon: 'metro', route: '#/metronomo' },
  { slug: 'acentuacao', label: 'Acentuação 4×4', icon: 'staff', route: '#/acentuacao' },
  { slug: 'estudos', label: 'Meus Estudos', icon: 'study', route: '#/estudos' },
  { slug: 'checklist', label: 'Checklist', icon: 'check', route: '#/checklist' },
  { slug: 'partitura', label: 'Montar Partitura', icon: 'staff', phase: 3 },
  { slug: 'arquivos', label: 'Meus Arquivos', icon: 'folder', phase: 2 },
  { slug: 'mural', label: 'Mural de Artistas', icon: 'photo', route: '#/mural' },
  { slug: 'bateristas', label: 'Bateristas & Links', icon: 'drummer', phase: 2 },
  { slug: 'naoesquecer', label: 'Não Esquecer', icon: 'note', route: '#/notas' },
  { slug: 'favoritos', label: 'Favoritos', icon: 'star', route: '#/favoritos' },
  { slug: 'feed', label: 'Feed Beaterista', icon: 'mural', route: '#/feed' },
  { slug: 'ideias', label: 'Caixa de Ideias', icon: 'bulb', phase: null },
  { slug: 'foco', label: 'Cronômetro de Foco', icon: 'timer', route: '#/foco' },
  { slug: 'alunos', label: 'Alunos', icon: 'drummer', route: '#/beaterista' },
];
export const bySlug = Object.fromEntries(MODULES.map((m) => [m.slug, m]));

/** Destinos que podem ser favoritados dentro do app. */
export const TOOL_TARGETS = [
  { label: 'Checklist', href: '#/checklist' },
  { label: 'Não Esquecer', href: '#/notas' },
  { label: 'Mural de Artistas', href: '#/mural' },
  { label: 'Meus Estudos', href: '#/estudos' },
  { label: 'Beat Lab', href: '#/beatlab' },
  { label: 'Estúdio de Ouvido', href: '#/ouvido' },
  { label: 'Metrônomo', href: '#/metronomo' },
  { label: 'Acentuação 4×4', href: '#/acentuacao' },
  { label: 'Cronômetro de Foco', href: '#/foco' },
  { label: 'Alunos', href: '#/beaterista' },
  { label: 'Feed Beaterista', href: '#/feed' },
  { label: 'Ajustes e backup', href: '#/ajustes' },
];

export const BRANDS = ['Pessoal', 'Beaterista', 'Pad Gorilla', 'Spark', 'Nagano'];

export const phaseText = (m) => (m.phase ? `chega na fase ${m.phase}` : 'ainda sem data');
