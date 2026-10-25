// Ficha técnica de um disco a partir do MusicBrainz (aberto, sem chave) e resumo da Wikipedia (com link).
// Só o que a fonte traz: nada é inventado. Puro (sem rede), testado em tests/musicdata.test.mjs.

const MB = 'https://musicbrainz.org/ws/2';
export const releasesUrl = (rgid) => `${MB}/release?release-group=${encodeURIComponent(rgid)}&fmt=json&limit=50`;
export const releaseUrl = (rid) => `${MB}/release/${encodeURIComponent(rid)}?inc=artist-credits+recordings+artist-rels+recording-level-rels+work-rels+work-level-rels+place-rels+labels&fmt=json`;
export const mbPage = (rgid) => `https://musicbrainz.org/release-group/${rgid}`;

/** Edição de referência: oficial, mais antiga, com mais faixas (de preferência). */
export function pickRelease(json) {
  const list = ((json && json.releases) || []).filter((r) => r.id);
  if (!list.length) return null;
  const score = (r) => [(r.status === 'Official' ? 0 : 1), (r.date || '9999'), -((r.media || []).reduce((s, m) => s + (m['track-count'] || 0), 0))];
  return list.sort((a, b) => { const x = score(a), y = score(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; })[0].id;
}

const ROLE_PT = {
  drums: 'bateria', 'drums (drum set)': 'bateria', 'drum set': 'bateria', percussion: 'percussão', 'bass guitar': 'baixo', bass: 'baixo', 'double bass': 'contrabaixo acústico', 'electric bass guitar': 'baixo',
  guitar: 'guitarra', 'electric guitar': 'guitarra', 'acoustic guitar': 'violão', 'slide guitar': 'guitarra slide', 'twelve-string guitar': 'violão 12 cordas', piano: 'piano', keyboard: 'teclado', organ: 'órgão',
  'hammond organ': 'órgão Hammond', synthesizer: 'sintetizador', mellotron: 'mellotron', mandolin: 'bandolim', harmonica: 'gaita', saxophone: 'saxofone', trumpet: 'trompete', trombone: 'trombone', violin: 'violino',
  strings: 'cordas', flute: 'flauta', 'lead vocals': 'voz principal', 'background vocals': 'backing vocal', vocal: 'voz', 'guest': 'participação',
  producer: 'produção', engineer: 'engenharia de som', 'recording engineer': 'gravação', mix: 'mixagem', mastering: 'masterização', 'audio engineer': 'engenharia de som', arranger: 'arranjo', orchestrator: 'orquestração', conductor: 'regência',
};
export const rolePt = (r) => ROLE_PT[String(r).toLowerCase()] || String(r).toLowerCase();
const fmtLen = (ms) => { if (!ms) return ''; const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** Release completo → { tracks, people:[{name, roles}], writers:[{name, roles}], studios, label, date }. */
export function parseRelease(rel) {
  const people = new Map(); const writers = new Map(); const studios = new Set(); const tracks = [];
  const addP = (map, name, role) => { if (!name) return; if (!map.has(name)) map.set(name, new Set()); map.get(name).add(role); };
  const takeRels = (rels = []) => {
    for (const r of rels) {
      const who = r.artist && r.artist.name;
      if (r.type === 'instrument') (r.attributes && r.attributes.length ? r.attributes : ['instrumento']).forEach((a) => addP(people, who, rolePt(a)));
      else if (r.type === 'vocal') addP(people, who, rolePt((r.attributes || [])[0] || 'vocal'));
      else if (['producer', 'engineer', 'mix', 'mastering', 'recording', 'arranger', 'orchestrator', 'conductor', 'audio'].includes(r.type)) addP(people, who, rolePt(r.type === 'recording' ? 'recording engineer' : r.type === 'audio' ? 'audio engineer' : r.type));
      else if (r.type === 'performer') addP(people, who, (r.attributes || []).includes('guest') ? 'participação' : 'músico');
      else if (r['target-type'] === 'place' && /record|mix/.test(r.type) && r.place) studios.add(r.place.name);
      else if (r.type === 'performance' && r.work) for (const w of r.work.relations || []) if (['composer', 'writer', 'lyricist'].includes(w.type)) addP(writers, w.artist && w.artist.name, { composer: 'música', writer: 'composição', lyricist: 'letra' }[w.type]);
    }
  };
  takeRels(rel.relations);
  for (const m of rel.media || []) for (const t of m.tracks || []) {
    tracks.push({ n: tracks.length + 1, title: t.title || (t.recording && t.recording.title) || '', len: fmtLen(t.length || (t.recording && t.recording.length)) });
    if (t.recording) takeRels(t.recording.relations);
  }
  const list = (map) => [...map].map(([name, roles]) => ({ name, roles: [...roles] })).sort((a, b) => a.name.localeCompare(b.name));
  return { tracks, people: list(people), writers: list(writers), studios: [...studios], label: ((rel['label-info'] || [])[0] || {}).label ? rel['label-info'][0].label.name : '', date: rel.date || '', release: rel.id };
}

/* ---------- Wikipedia ---------- */
export const wikiSearchUrl = (lang, q) => `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3&format=json&origin=*`;
export const wikiSummaryUrl = (lang, title) => `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
/** Escolhe o verbete que parece ser o disco (o título contém o nome do álbum). */
export function pickWikiTitle(json, album) {
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hits = ((json && json.query && json.query.search) || []).map((x) => x.title);
  return hits.find((t) => norm(t).includes(norm(album))) || null;
}
