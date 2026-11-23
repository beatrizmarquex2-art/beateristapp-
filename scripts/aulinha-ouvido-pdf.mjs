// Gera o PDF preto e branco "Robôterista ensina: ouvido e escalas" (a aulinha em papel).
// Uso: NODE_PATH=$(npm root -g) node scripts/aulinha-ouvido-pdf.mjs SAIDA.pdf   (PRINTS=pasta salva um PNG de cada página)
import { serve } from '../tests/e2e/harness.mjs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const saida = process.argv[2]; if (!saida) { console.error('informe o arquivo de saída'); process.exit(1); }
const { srv, url } = await serve(); const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
page.on('pageerror', (e) => console.error('ERRO', String(e)));
await page.goto(`${url}/marketing/aulinha-ouvido/aula.html`); await page.waitForFunction(() => window.__pronto, null, { timeout: 60000 });
console.log(await page.evaluate(() => window.__pronto));
await page.pdf({ path: saida, width: '210mm', height: '297mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
if (process.env.PRINTS) { const pgs = await page.$$('.pg'); for (let i = 0; i < pgs.length; i++) await pgs[i].screenshot({ path: `${process.env.PRINTS}/pg-${String(i + 1).padStart(2, '0')}.png` }); }
await browser.close(); srv.close();
