// Gera o PDF "Cards do Robôterista Paul" (os 150 cartões da Teoria pra imprimir e recortar; produto da Bea).
// Uso: NODE_PATH=$(npm root -g) node scripts/cards-paul-pdf.mjs SAIDA.pdf ["nome da autora"] [cartas por tema na amostra]
//   completo: ... completo.pdf      amostra de 3 por tema: ... amostra.pdf "" 3
//   baralho dos instrumentos: ... instrumentos.pdf "" "" instrumentos   (amostra: ... "" 3 instrumentos)
// O PDF NÃO vai pro repositório (o repo é público e o PDF é produto à venda): gerar numa pasta de fora.
import { serve } from '../tests/e2e/harness.mjs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const saida = process.argv[2]; if (!saida) { console.error('informe o arquivo de saída'); process.exit(1); }
const qs = new URLSearchParams(); if (process.argv[3]) qs.set('autora', process.argv[3]); if (Number(process.argv[4])) qs.set('amostra', process.argv[4]); if (process.argv[5]) qs.set('deck', process.argv[5]); // 4º argumento: 'instrumentos' = baralho dos instrumentos (90 cartas)
 // 3º argumento: quantas cartas por tema na AMOSTRA (vazio = completo)
const autora = qs.toString() ? `?${qs}` : '';
const { srv, url } = await serve(); const browser = await chromium.launch(); const page = await browser.newPage();
page.on('pageerror', (e) => console.error('ERRO', String(e)));
await page.goto(`${url}/marketing/cards-paul/cards.html${autora}`); await page.waitForFunction(() => window.__pronto, null, { timeout: 60000 });
console.log(await page.evaluate(() => window.__pronto));
await page.pdf({ path: saida, width: '210mm', height: '297mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
if (process.env.PRINTS) { await page.setViewportSize({ width: 794, height: 1123 }); const pgs = await page.$$('.pg'); for (const i of [0, 1, 2, 5, 7, 9, pgs.length - 1]) { const el = pgs[i]; if (el) await el.screenshot({ path: `${process.env.PRINTS}/cards-pg${i + 1}.png` }); } }
await browser.close(); srv.close();
