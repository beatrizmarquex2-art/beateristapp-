// Gera assets/arsenal/discos.json (só os álbuns) a partir da pasta do pacote "Arsenal Musical" já descompactada.
// Uso: node scripts/build-arsenal.mjs /pasta/ARSENAL_MUSICAL_BEA
import fs from 'node:fs'; import path from 'node:path';
import { parseArsenal } from '../js/collection.js';
const root = path.resolve(process.argv[2] || '');
const base = path.join(root, '01_artistas'); const out = [];
for (const artist of fs.readdirSync(base)) for (const dir of fs.readdirSync(path.join(base, artist))) {
  const f = path.join(base, artist, dir, '00_album_e_referencias.txt'); if (!fs.existsSync(f)) continue;
  const r = parseArsenal(`01_artistas/${artist}/${dir}/00_album_e_referencias.txt`, fs.readFileSync(f, 'utf8'), 'Arsenal Musical da Bea').data;
  const m = r.meta; const body = r.body.replace(/\n*a lista preserva os blocos[^\n]*/i, '').replace(/^## repertório e edições[\s\S]*?(?=\n## |$)/m, '').replace(/^## (edição digital|referências)[\s\S]*$/m, '').trim();
  out.push({ a: r.artist, t: r.title, d: r.date, g: m['gênero(s) indicados'] || '', s: m['selo(s)'] || '', p: m['produção geral do álbum'] || '', r: m['período de gravação'] || '', k: r.tracks.map((x) => x.title), b: body });
}
out.sort((x, y) => x.a.localeCompare(y.a, 'pt-BR') || x.d.localeCompare(y.d));
fs.mkdirSync('assets/arsenal', { recursive: true });
fs.writeFileSync('assets/arsenal/discos.json', JSON.stringify(out));
console.log(out.length, 'álbuns', fs.statSync('assets/arsenal/discos.json').size, 'bytes');
