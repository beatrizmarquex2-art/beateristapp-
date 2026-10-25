// Meus Arquivos: regras puras (tipo do arquivo, tipo aceito pela nuvem, pastas). Testado em tests/files-logic.test.mjs.

export const KINDS = { pdf: 'PDF', imagem: 'imagem', audio: 'áudio', video: 'vídeo', partitura: 'partitura', doc: 'documento', planilha: 'planilha', outro: 'arquivo' };
const EXT = {
  pdf: ['pdf', 'epub'], imagem: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'], audio: ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac', 'aif', 'aiff', 'mid', 'midi'],
  video: ['mp4', 'mov', 'webm', 'm4v'], partitura: ['musicxml', 'mxl', 'gp', 'gp5', 'gpx'], doc: ['doc', 'docx', 'txt', 'md', 'rtf', 'pages', 'ppt', 'pptx', 'key'], planilha: ['xls', 'xlsx', 'csv', 'numbers'],
};
export const extOf = (name = '') => { const m = /\.([a-z0-9]{1,8})$/i.exec(name); return m ? m[1].toLowerCase() : ''; };
export function kindOf(name, mime = '') {
  const e = extOf(name);
  for (const [k, list] of Object.entries(EXT)) if (list.includes(e)) return k;
  if (mime.startsWith('image/')) return 'imagem';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  return 'outro';
}
/** O que dá pra ver dentro do app (o resto abre numa aba nova). */
export const previewable = (k) => k === 'imagem' || k === 'audio' || k === 'video';

// mesma lista do bucket "arquivos" no Supabase; fora dela sobe como binário genérico (nunca html/svg/js)
const OK = ['application/pdf', 'application/epub+zip', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv', 'text/markdown', 'application/rtf',
  'application/zip', 'application/x-zip-compressed', 'application/vnd.recordare.musicxml+xml', 'application/vnd.recordare.musicxml'];
export const cloudType = (mime = '') => (OK.includes(mime) || /^audio\/[\w.+-]+$/.test(mime) ? mime : 'application/octet-stream');

export const DEFAULT_FOLDERS = ['Aulas', 'Partituras', 'Áudios', 'Contratos', 'Divulgação'];
export const GERAL = 'geral';
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Pastas com contagem; arquivo sem pasta (ou de pasta apagada) cai em "Geral". */
export function folderList(folders, files) {
  const ids = new Set(folders.map((f) => f.id));
  const count = (id) => files.filter((r) => (ids.has(r.data.folder) ? r.data.folder : GERAL) === id).length;
  const out = folders.map((f) => ({ id: f.id, name: f.data.name, n: count(f.id) })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return [{ id: GERAL, name: 'Geral', n: count(GERAL) }, ...out];
}
export const inFolder = (folders, files, id) => { const ids = new Set(folders.map((f) => f.id)); return files.filter((r) => (ids.has(r.data.folder) ? r.data.folder : GERAL) === id); };
export const search = (files, q) => { const n = norm(q.trim()); return n ? files.filter((r) => norm(r.data.name).includes(n)) : files; };
export const nameTaken = (folders, name) => folders.some((f) => norm(f.data.name) === norm(name.trim())) || norm(name.trim()) === 'geral';
export const mb = (bytes) => (bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
