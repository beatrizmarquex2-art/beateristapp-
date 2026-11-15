// 3 opções de disposição do texto pro mesmo post (a Bea não gostou da disposição das letras). Uso: node scripts/kit-letras-opcoes.mjs PASTA
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href, F = (n) => u(`assets/fonts/${n}`);
const OUT = path.resolve(process.argv[2]); fs.mkdirSync(OUT, { recursive: true });
const AZ = '#0d1a36', VI = '#a8182e', CR = '#f4ead8', OU = '#d8b879';
const css = `@font-face{font-family:Marker;src:url(${F('PermanentMarker-latin.woff2')})}@font-face{font-family:Gochi;src:url(${F('GochiHand-latin.woff2')})}
@font-face{font-family:Anton;src:url(${F('Anton-latin.woff2')})}@font-face{font-family:Hanken;font-weight:400 800;src:url(${F('HankenGrotesk-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;position:relative;overflow:hidden;background:${AZ}}h1,p{text-wrap:balance}`;
const logo = u('assets/originals/logo-beaterista-dourado.png');
const sg = (cor) => `<div style="display:flex;align-items:center;gap:14px;color:${cor};font:800 27px/1.15 Hanken,sans-serif"><img src="${logo}" style="height:76px"><span>Beaterista<br><span style="font-weight:500;font-size:23px">educação musical com propósito</span></span></div>`;
const D = { foto: u('marketing/fotos-bea/bea-casaco-gola.jpg'), pos: '50% 18%', t1: 'tem noite que eu', t2: 'troco o sono pelo site', corpo: 'porque eu sei exatamente onde meu aluno trava, e quero que o jogo resolva isso.', paul: u('assets/originals/paul-png/coloridos-hd/paul-produtor.png') };
const OPC = {
  // 1: foto em cima, faixa creme embaixo com tudo alinhado à esquerda e letra de ler
  '1-faixa-clara': `<style>${css}.f{position:absolute;left:0;right:0;top:0;height:800px;width:100%;object-fit:cover;object-position:${D.pos}}
.b{position:absolute;left:0;right:0;top:770px;bottom:0;background:${CR};color:${AZ};padding:54px 70px 0;border-top:12px solid ${OU}}
h1{font:400 74px/1.02 Marker,cursive;margin-bottom:22px}h1 em{font-style:normal;color:${VI}}p{font:500 40px/1.3 Hanken,sans-serif;max-width:720px}
.s{position:absolute;left:70px;bottom:44px}.c{position:absolute;right:26px;bottom:26px;height:250px}</style>
<img class="f" src="${D.foto}"><div class="b"><h1>${D.t1} <em>${D.t2}</em></h1><p>${D.corpo}</p></div><div class="s">${sg(AZ)}</div><img class="c" src="${D.paul}">`,
  // 2: foto cheia, texto centralizado embaixo, título manuscrito em 2 linhas equilibradas
  '2-centralizado': `<style>${css}.f{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${D.pos}}
.g{position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,26,54,0) 40%,rgba(13,26,54,.96) 70%)}
.t{position:absolute;left:80px;right:80px;bottom:190px;text-align:center;color:${CR}}h1{font:400 84px/1.02 Marker,cursive;margin-bottom:26px}h1 em{font-style:normal;color:${OU};display:block}
p{font:500 38px/1.3 Hanken,sans-serif}.s{position:absolute;left:0;right:0;bottom:50px;display:flex;justify-content:center}.c{position:absolute;right:20px;top:40px;height:210px}</style>
<img class="f" src="${D.foto}"><div class="g"></div><div class="t"><h1>${D.t1}<em>${D.t2}</em></h1><p>${D.corpo}</p></div><div class="s">${sg(CR)}</div><img class="c" src="${D.paul}">`,
  // 3: frase inteira como citação grande, sem título separado
  '3-citacao': `<style>${css}.f{position:absolute;left:0;top:0;width:100%;height:760px;object-fit:cover;object-position:${D.pos}}
.b{position:absolute;left:0;right:0;top:700px;bottom:0;background:${VI};color:${CR};padding:70px 70px 0}
.a{position:absolute;left:60px;top:640px;font:400 240px/1 Anton,sans-serif;color:${OU}}
p{font:400 54px/1.18 Gochi,cursive}p b{font-weight:400;color:${OU}}.s{position:absolute;left:70px;bottom:44px}.c{position:absolute;right:26px;bottom:26px;height:230px}</style>
<img class="f" src="${D.foto}"><div class="b"><p><b>${D.t1} ${D.t2}.</b> ${D.corpo}</p></div><div class="a">“</div><div class="s">${sg(CR)}</div><img class="c" src="${D.paul}">`,
};
const browser = await chromium.launch();
for (const [nome, html] of Object.entries(OPC)) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } }); const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, '<!doctype html><meta charset="utf-8">' + html);
  await page.goto(pathToFileURL(tmp).href); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `letras-${nome}.jpg`), type: 'jpeg', quality: 92 }); await page.close(); fs.rmSync(tmp); console.log('ok', nome);
}
await browser.close();
