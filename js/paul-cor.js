// Paul colorido (adesivos da Bea, PNG recortado) e os elementos-adesivo (notas, estrelas, vinil, fones…).
// Regra da Bea: o Paul sempre colorido ou PNG, nunca dentro de círculo/moldura.
export const POSES = ['bateria', 'guitarra', 'teclado', 'microfone', 'pandeiro', 'lendo-partitura', 'ouvindo', 'estudando', 'baquetas-pra-cima', 'metronomo', 'cajon', 'oculos', 'agua', 'professor', 'meditando', 'selfie', 'maestro', 'produtor', 'gravando', 'dj'];
export const corSrc = (pose) => `assets/paul/colorido/paul-${POSES.includes(pose) ? pose : 'ouvindo'}.webp`;
export const stkSrc = (nome) => `assets/paul/stk/${nome}.webp`;
export const ELEMENTOS = ['baquetas', 'caixa', 'piano', 'equalizador', 'fone', 'amp', 'mic', 'caneca', 'livros', 'laptop', 'calendario', 'palheta', 'estrela', 'raio', 'nota', 'nota2', 'cassete', 'vinil', 'lampada', 'coracao', 'estrela-ouro', 'onda'];
/** Pose do Paul por humor (para telas que falam de "humor"); `base` é a pose natural do lugar (ex.: o instrumento da aula). */
const HUMOR = { cheer: 'baquetas-pra-cima', wave: null, happy: null, music: 'microfone', point: 'professor', read: 'lendo-partitura', idea: 'estudando', think: 'estudando', love: 'ouvindo', cool: 'oculos', wow: 'baquetas-pra-cima', crown: 'baquetas-pra-cima', run: 'pandeiro' };
export const poseDe = (humor, base = 'ouvindo') => HUMOR[humor] || base;
/** Pose do Paul de cada jogo do mapa. */
export const POSE_JOGO = { ritmo: 'bateria', toca: 'bateria', paulta: 'lendo-partitura', pauta: 'lendo-partitura', memoria: 'estudando', figuras: 'metronomo', eco: 'cajon', cartas: 'baquetas-pra-cima', stop: 'microfone', velha: 'meditando', bingo: 'pandeiro', quebra: 'oculos', cara: 'selfie', monte: 'produtor', noritmo: 'maestro' };
export const poseDoJogo = (gameId) => { const g = String(gameId || '').replace(/^av-/, ''); return POSE_JOGO[g] || POSES[(g.length * 7) % POSES.length]; };
