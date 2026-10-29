// Refaz a lista EXTRA do sw.js (artes dos jogos, memória, mural, zine…): tudo o que esses jogos pedem tem que estar no cache pra rodar sem internet.
// Uso: node scripts/sw-extra.mjs   (rode depois de adicionar arquivos nessas pastas)
import fs from 'node:fs'; import path from 'node:path';
const dirs = ['assets/jogos', 'assets/mural', 'assets/memoria', 'assets/zine', 'assets/paul', 'assets/rhythm-games', 'assets/arsenal', 'assets/instrumentos', 'assets/aluno'];
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
let sw = fs.readFileSync('sw.js', 'utf8');
const shell = new Set([...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
const extra = [...new Set(dirs.flatMap(walk))].sort().filter((f) => !shell.has(f));
const block = `// <extra-gerado> arquivos dos jogos e das artes, baixados depois do essencial (scripts/sw-extra.mjs refaz esta lista)\nconst EXTRA = [\n${extra.map((f) => `  '${f}',`).join('\n')}\n];\n// </extra-gerado>\n`;
sw = sw.replace(/\/\/ <extra-gerado>[\s\S]*?\/\/ <\/extra-gerado>\n/, block);
fs.writeFileSync('sw.js', sw); console.log(extra.length, 'arquivos extras');
