// Meus Álbuns (The Listening Club): busca de discos no MusicBrainz (dados abertos, sem chave) e capas do Cover Art Archive.
// Nada é inventado: se a busca não acha, o disco pode ser adicionado à mão. Puro, testado em tests/albums.test.mjs.

export const STATUS = [['quero', 'quero ouvir'], ['ouvindo', 'ouvindo'], ['ouvi', 'já ouvi']];
export const mbSearchUrl = (q) => `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(q.trim())}&type=album&limit=12&fmt=json`;
export const coverUrl = (mbid, size = 250) => (mbid ? `https://coverartarchive.org/release-group/${mbid}/front-${size}` : null);

/** Resposta do MusicBrainz → lista enxuta (álbuns primeiro, sem repetidos). */
export function parseMB(json) {
  const seen = new Set(); const out = [];
  for (const g of (json && json['release-groups']) || []) {
    if (!g.id || seen.has(g.id)) continue; seen.add(g.id);
    const artist = (g['artist-credit'] || []).map((c) => (c.name || (c.artist && c.artist.name) || '') + (c.joinphrase || '')).join('').trim();
    out.push({ mbid: g.id, title: g.title || '', artist, year: (g['first-release-date'] || '').slice(0, 4), type: g['primary-type'] || '' });
  }
  return out.sort((a, b) => (a.type === 'Album' ? 0 : 1) - (b.type === 'Album' ? 0 : 1));
}
export const albumLine = (a) => [a.artist, a.year].filter(Boolean).join(' · ');
/** Ordenação da estante: favoritos, depois "ouvindo", depois mais recentes. */
export const shelfSort = (a, b) => (b.data.fav ? 1 : 0) - (a.data.fav ? 1 : 0) || (b.data.status === 'ouvindo' ? 1 : 0) - (a.data.status === 'ouvindo' ? 1 : 0) || (b.data.added || 0) - (a.data.added || 0);
