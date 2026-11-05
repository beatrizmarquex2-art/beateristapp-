// O que cada tipo de registro é e onde ele mora no app (usado na busca geral e na lixeira).
export const KINDS = {
  task: ['Checklist', '#/checklist'], note: ['Não esquecer', '#/notas'], idea: ['Ideia', '#/ideias'], student: ['Aluno', '#/beaterista'],
  lesson: ['Aula', '#/beaterista'], partitura: ['Partitura', '#/partitura'], beat: ['Beat', '#/beatlab'], song: ['Música', '#/repertorio'],
  songmap: ['Mapa da música', '#/ferramentas/mapa'], fav: ['Favorito', '#/favoritos'], link: ['Link', '#/kit/links'], ebook: ['Ebook', '#/kit/ebooks'],
  midia: ['Na mídia', '#/kit/midia'], fotopro: ['Foto profissional', '#/kit/fotos'], poster: ['Mural', '#/mural'], post: ['Feed', '#/feed'],
  album: ['Álbum', '#/estudos/club'], clubpost: ['Clube', '#/estudos/club'], arsenal: ['Arsenal', '#/estudos/club'], reminder: ['Lembrete', '#/lembretes'],
  study: ['Estudo', '#/estudos'], gbpattern: ['Groovebox', '#/ferramentas'], ytloop: ['Loop', '#/ferramentas/loop'], ytlink: ['Ambiente', '#/ambiente'],
  exercise: ['Exercício', '#/acentuacao'], plano: ['Plano', '#/planos'],
};
const TITLE_KEYS = ['title', 'name', 'nome', 'titulo', 'song', 'text', 'label', 'body', 'script', 'url'];
export function titleOf(d) {
  if (!d) return '(sem título)';
  for (const k of TITLE_KEYS) if (typeof d[k] === 'string' && d[k].trim()) return d[k].trim().replace(/\s+/g, ' ').slice(0, 80);
  for (const v of Object.values(d)) if (typeof v === 'string' && v.trim() && v.length < 120) return v.trim().slice(0, 80);
  return '(sem título)';
}
export const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Todo o texto do registro (só strings/números curtos), pra buscar. */
export function textOf(d, depth = 0) {
  if (d == null) return '';
  if (typeof d === 'string') return d.length > 600 || /^(data:|blob:)/.test(d) ? '' : d;
  if (typeof d === 'number') return String(d);
  if (depth > 2 || typeof d !== 'object') return '';
  return Object.values(d).map((v) => textOf(v, depth + 1)).filter(Boolean).join(' ');
}
export const ago = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); if (m < 1) return 'agora'; if (m < 60) return `há ${m} min`; const hr = Math.round(m / 60); if (hr < 24) return `há ${hr} h`; const d = Math.round(hr / 24); return `há ${d} dia${d > 1 ? 's' : ''}`; };
