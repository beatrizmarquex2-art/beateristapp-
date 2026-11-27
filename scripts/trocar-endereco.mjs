#!/usr/bin/env node
// Troca o endereço do site que aparece ESCRITO no app (cartões, figurinhas, PaulBox, PDF da partitura): jogos.beaterista.com.br <-> play.beaterista.com.br.
// É só a configuração em js/site.js (e sobe a versão do sw.js pra todo mundo receber). NÃO mexe no domínio de verdade, no DNS, no CSP, no _headers
// nem na função da Hotmart (supabase/functions/hotmart-passe), e as artes prontas em imagem (assets/loja/previa, assets/originals) continuam como estão.
//   node scripts/trocar-endereco.mjs play            # o que está ESCRITO passa a ser play.beaterista.com.br
//   node scripts/trocar-endereco.mjs play --links    # também os LINKS de verdade (só quando play.beaterista.com.br já abrir)
//   node scripts/trocar-endereco.mjs jogos [--links] # volta
//   --dir <pasta>   outra cópia do projeto (pros testes)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2); const alvo = args.find((a) => a === 'play' || a === 'jogos');
const links = args.includes('--links'); const di = args.indexOf('--dir');
const raiz = di >= 0 ? path.resolve(args[di + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!alvo) { console.error('uso: node scripts/trocar-endereco.mjs <play|jogos> [--links] [--dir pasta]'); process.exit(2); }
const siteJs = path.join(raiz, 'js/site.js'); const swJs = path.join(raiz, 'sw.js');
let s = fs.readFileSync(siteJs, 'utf8');
const troca = (nome) => { const re = new RegExp(`^export const ${nome} = '(jogos|play)';`, 'm'); if (!re.test(s)) { console.error(`não achei "export const ${nome} = '…';" em js/site.js`); process.exit(1); } const antes = re.exec(s)[1]; s = s.replace(re, `export const ${nome} = '${alvo}';`); return antes; };
const antesEscrito = troca('ESCRITO'); const antesLinks = links ? troca('LINKS') : null;
fs.writeFileSync(siteJs, s);
let sw = fs.readFileSync(swJs, 'utf8'); const m = /const VERSION = 'beaterista-v(\d+)';/.exec(sw);
if (m) { const novo = Number(m[1]) + 1; sw = sw.replace(m[0], `const VERSION = 'beaterista-v${novo}';`); fs.writeFileSync(swJs, sw); console.log(`sw.js: v${m[1]} -> v${novo}`); }
console.log(`escrito: ${antesEscrito} -> ${alvo}${links ? `\nlinks: ${antesLinks} -> ${alvo}` : '\nlinks: continuam como estavam (use --links só quando o novo endereço abrir de verdade)'}`);
console.log('lembrete: o que já está desenhado em imagem (artes da loja e das redes) não muda sozinho.');
