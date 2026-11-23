// Verificador de páginas vazias dos cadernos em PDF: lista toda página com menos de LIMITE (padrão 60%) preenchida.
// Uso: NODE_PATH=$(npm root -g) node scripts/aulinha-vazio.mjs [bateria|intermediario|aula ...]   (sai com erro se achar alguma)
// Página de propósito vazia (ex.: anotações) usa class "anot" ou data-livre.
import { serve } from '../tests/e2e/harness.mjs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const alvos = process.argv.slice(2).length ? process.argv.slice(2) : ['bateria', 'intermediario'];
const limite = Number(process.env.LIMITE || 0.6);
const { srv, url } = await serve(); const browser = await chromium.launch(); let ruim = 0;
for (const a of alvos) {
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.goto(`${url}/marketing/aulinha-ouvido/${a}.html`); await page.waitForFunction(() => window.__pronto, null, { timeout: 90000 });
  const v = await page.evaluate((l) => (window.__medeVazio ? window.__medeVazio(l) : (window.__relatorio?.vazias || [])), limite);
  console.log(`${a}: ${v.length} página(s) com menos de ${Math.round(limite * 100)}% preenchido`); v.forEach(([n, f, t]) => console.log(`  p.${n}  ${Math.round(f * 100)}%  ${t}`)); ruim += v.length; await page.close();
}
await browser.close(); srv.close(); process.exit(ruim ? 1 : 0);
