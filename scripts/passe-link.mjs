// Troca os links de compra do PASSE pelo checkout da Hotmart (js/loja-config.js e vendas/index.html). Só mexe no Passe; os outros produtos ficam intactos.
// Uso: node scripts/passe-link.mjs https://pay.hotmart.com/XXXXXXXXXXX [--dry]   (o ANUAL da loja usa o mesmo link do PASSE, então vai junto)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [url, flag] = process.argv.slice(2);
if (!url || !/^https:\/\/pay\.hotmart\.com\/[A-Za-z0-9]{6,}(\?[A-Za-z0-9=&_%.-]*)?$/.test(url)) { console.error('uso: node scripts/passe-link.mjs https://pay.hotmart.com/CODIGO_DO_CHECKOUT_DO_PASSE [--dry]'); process.exit(1); }
const dry = flag === '--dry';
const lerE = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');
const hot = (t) => (t.match(/https:\/\/pay\.hotmart\.com\/[A-Za-z0-9]+/g) || []).sort().join(',');

// 1) js/loja-config.js: só a linha `export const PASSE = ...`
let cfg = lerE('js/loja-config.js'); const antesHot = hot(cfg);
const linha = cfg.split('\n').findIndex((l) => l.startsWith('export const PASSE = '));
if (linha < 0) { console.error('não achei `export const PASSE` em js/loja-config.js'); process.exit(1); }
const L = cfg.split('\n'); const velha = L[linha];
let nova = velha.replace(/link: `[^`]*`/, `link: '${url}'`).replace(/link: '[^']*'/, `link: '${url}'`)
  .replace("'Pagamento único (pix) pelo WhatsApp'", "'Pagamento único, direto pela Hotmart'");
if (nova === velha) { console.error('nada mudou na linha do PASSE (já está com esse link?)'); process.exit(1); }
L[linha] = nova; cfg = L.join('\n');
// os outros produtos não podem ter mudado: mesmos links Hotmart de antes, mais o do passe
const esperado = [...new Set([...antesHot.split(',').filter(Boolean), url.split('?')[0]])].sort().join(',');
if (hot(cfg) !== esperado && !antesHot.includes(url.split('?')[0])) { console.error('conferência falhou: links dos outros produtos mudaram'); process.exit(1); }

// 2) vendas/index.html: só o botão dentro de `.passe-oferta` (a seção #passe)
let v = lerE('vendas/index.html');
const re = /(<div class="passe-oferta">[\s\S]*?)<a class="btn" href="https:\/\/wa\.me\/[^"]*">Consultar compra pelo WhatsApp<\/a>/;
if (!re.test(v)) { console.error('não achei o botão do Passe em vendas/index.html'); process.exit(1); }
v = v.replace(re, `$1<a class="btn" href="${url}?src=vendas">Comprar o Passe Anual</a>`);

if (dry) { console.log('(dry) loja-config:', nova.slice(0, 220)); console.log('(dry) vendas: botão do Passe →', `${url}?src=vendas`); process.exit(0); }
fs.writeFileSync(path.join(raiz, 'js/loja-config.js'), cfg); fs.writeFileSync(path.join(raiz, 'vendas/index.html'), v);
console.log('ok: Passe agora aponta pra', url, '\nlembre: subir a versão do sw.js e conferir o preço do Passe em js/loja-config.js e vendas/index.html.');
