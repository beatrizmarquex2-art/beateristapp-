// Bateristas & Links: regras puras (tipo de link, vídeo do YouTube, sugestões). Testado em tests/drummers-logic.test.mjs.

/** Aceita "youtube.com/..." sem https; recusa o que não for http(s). */
export function normUrl(s) {
  let u = String(s || '').trim(); if (!u) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = `https://${u}`;
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; }
}
export function linkType(url) {
  let host = ''; try { host = new URL(url).hostname.replace(/^www\.|^m\./, ''); } catch { return 'site'; }
  if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube';
  if (host.endsWith('instagram.com')) return 'instagram';
  if (host.endsWith('tiktok.com')) return 'tiktok';
  if (host.endsWith('spotify.com')) return 'spotify';
  if (host.endsWith('wikipedia.org')) return 'wikipedia';
  return 'site';
}
export const TYPE_LABEL = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', spotify: 'Spotify', wikipedia: 'Wikipedia', site: 'site' };

const secs = (t) => { if (!t) return 0; if (/^\d+$/.test(t)) return +t; const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
/** { id, start } de um vídeo do YouTube (watch, youtu.be, shorts, embed, live), ou null. */
export function youtube(url) {
  let x; try { x = new URL(url); } catch { return null; }
  if (linkType(x.href) !== 'youtube') return null;
  let id = null;
  if (x.hostname.endsWith('youtu.be')) id = x.pathname.slice(1).split('/')[0];
  else if (x.pathname === '/watch') id = x.searchParams.get('v');
  else { const m = /^\/(?:shorts|embed|live)\/([^/?#]+)/.exec(x.pathname); id = m && m[1]; }
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  return { id, start: secs(x.searchParams.get('t') || x.searchParams.get('start')) };
}
export const embedUrl = (v) => `https://www.youtube.com/embed/${v.id}?rel=0&playsinline=1${v.start ? `&start=${v.start}` : ''}`;
export const ytSearch = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const slugOf = (id) => `dr-${id}`;
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const match = (texts, q) => { const n = norm(q.trim()); return !n || texts.some((t) => norm(t).includes(n)); };

export const LINK_TAGS = [['groove', 'groove'], ['tecnica', 'técnica'], ['aula', 'aula'], ['inspiracao', 'inspiração'], ['equipamento', 'equipamento'], ['outro', 'outro']];

// ponto de partida: só nomes, uma linha e a página da Wikipedia (a foto vem do Commons, com crédito). Nada é copiado.
export const SUGGESTIONS = [
  { name: 'Clyde Stubblefield', style: 'funk', why: '“Funky Drummer” (James Brown): um dos breaks mais sampleados da história.', wiki: 'Clyde_Stubblefield' },
  { name: 'Bernard Purdie', style: 'funk, soul', why: 'o “Purdie shuffle” e as ghost notes que viraram escola.', wiki: 'Bernard_Purdie' },
  { name: 'John Bonham', style: 'rock', why: 'peso com swing no Led Zeppelin.', wiki: 'John_Bonham' },
  { name: 'Steve Gadd', style: 'pop, jazz', why: 'groove de estúdio e o padrão de “50 Ways to Leave Your Lover”.', wiki: 'Steve_Gadd' },
  { name: 'Tony Williams', style: 'jazz', why: 'entrou no quinteto de Miles Davis aos 17 anos.', wiki: 'Tony_Williams_(drummer)' },
  { name: 'Questlove', style: 'hip-hop, soul', why: 'o pocket do The Roots.', wiki: 'Questlove' },
  { name: 'Travis Barker', style: 'punk, hip-hop', why: 'Blink-182 e a ponte entre punk e hip-hop.', wiki: 'Travis_Barker' },
  { name: 'Sheila E.', style: 'pop, latin, percussão', why: 'bateria e percussão com Prince.', wiki: 'Sheila_E.' },
  { name: 'Cindy Blackman Santana', style: 'jazz, rock', why: 'jazz de raiz e rock com Lenny Kravitz.', wiki: 'Cindy_Blackman_Santana' },
  { name: 'Dennis Chambers', style: 'funk, fusion', why: 'Parliament-Funkadelic e fusion de alta voltagem.', wiki: 'Dennis_Chambers' },
  { name: 'Vinnie Colaiuta', style: 'fusion, pop', why: 'Frank Zappa, Sting: leitura e compassos ímpares.', wiki: 'Vinnie_Colaiuta' },
  { name: 'Jojo Mayer', style: 'drum and bass', why: 'eletrônico tocado ao vivo (Nerve) e técnica de mãos.', wiki: 'Jojo_Mayer' },
  { name: 'Mark Guiliana', style: 'jazz, eletrônico', why: 'o álbum “Blackstar” de David Bowie.', wiki: 'Mark_Guiliana' },
  { name: 'Senri Kawaguchi', style: 'fusion', why: 'velocidade com musicalidade.', wiki: 'Senri_Kawaguchi' },
  { name: 'Larnell Lewis', style: 'gospel, fusion', why: 'Snarky Puppy e a escola gospel.', wiki: 'Larnell_Lewis' },
  { name: 'Robertinho Silva', style: 'MPB, jazz', why: 'Milton Nascimento e o Clube da Esquina.', wiki: 'Robertinho_Silva' },
];
