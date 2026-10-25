// Estúdio de ambiente: canais, misturas prontas, links do YouTube e timer pra dormir. Puro, testado em tests/ambient.test.mjs.

export const CHANNELS = [
  ['chuva', 'chuva'], ['mar', 'mar'], ['lareira', 'lareira'], ['vento', 'vento'], ['trovao', 'trovão'],
  ['passaros', 'passarinhos'], ['vinil', 'vinil'], ['branco', 'ruído branco'], ['rosa', 'ruído rosa'], ['marrom', 'ruído marrom'],
];
export const MIXES = [
  { id: 'estudo', name: 'chuva de estudo', mix: { chuva: 0.6, vinil: 0.25 } },
  { id: 'praia', name: 'praia', mix: { mar: 0.7, vento: 0.15, passaros: 0.15 } },
  { id: 'lareira', name: 'lareira em dia de chuva', mix: { lareira: 0.7, chuva: 0.3, trovao: 0.3 } },
  { id: 'foco', name: 'foco profundo', mix: { marrom: 0.55 } },
  { id: 'manha', name: 'manhã no mato', mix: { passaros: 0.5, vento: 0.2 } },
  { id: 'tempestade', name: 'tempestade', mix: { chuva: 0.8, trovao: 0.7, vento: 0.4 } },
];
export const SLEEP = [0, 15, 30, 60];

/** Só canais conhecidos e volume entre 0 e 1 (o resto é descartado). */
export function clean(mix = {}) {
  const ids = new Set(CHANNELS.map((c) => c[0])); const out = {};
  for (const [k, v] of Object.entries(mix || {})) { const n = Number(v); if (ids.has(k) && n > 0) out[k] = Math.min(1, Math.round(n * 100) / 100); }
  return out;
}
export const isSilent = (mix) => !Object.values(clean(mix)).some((v) => v > 0);

/** Link do YouTube → endereço do player embutido (vídeo, vídeo com minuto ou playlist). null se não for do YouTube. */
export function ytEmbed(url) {
  let x; try { x = new URL(String(url).trim().replace(/^(?!https?:)/, 'https://')); } catch { return null; }
  const host = x.hostname.replace(/^www\.|^m\.|^music\./, '');
  if (host !== 'youtu.be' && host !== 'youtube.com') return null;
  const list = x.searchParams.get('list');
  let id = host === 'youtu.be' ? x.pathname.slice(1).split('/')[0] : x.pathname === '/watch' ? x.searchParams.get('v') : (/^\/(?:shorts|embed|live)\/([\w-]{11})/.exec(x.pathname) || [])[1];
  if (id && !/^[\w-]{11}$/.test(id)) id = null;
  const t = x.searchParams.get('t') || x.searchParams.get('start'); const start = t && /^\d+s?$/.test(t) ? parseInt(t, 10) : 0;
  const q = 'rel=0&playsinline=1&autoplay=1';
  if (id) return `https://www.youtube.com/embed/${id}?${q}${list ? `&list=${encodeURIComponent(list)}` : ''}${start ? `&start=${start}` : ''}`;
  if (list) return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}&${q}`;
  return null;
}

/** Quanto falta pro timer de dormir (ms); 0 = desligado ou acabou. */
export const sleepLeft = (endsAt, now = Date.now()) => (endsAt ? Math.max(0, endsAt - now) : 0);
