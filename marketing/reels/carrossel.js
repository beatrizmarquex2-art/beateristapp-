// carrossel generico 1080x1350. uso: node carrossel.js spec.json PASTA_DOS_RECORTES PASTA_DE_SAIDA
// spec: {prefix, tag, slides:[{img,pos,l:[linhas, "*" = amarelo]}], end:{tag,h:[a,b],price,priceNote,cta,url,handle,sub}}
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const spec=JSON.parse(fs.readFileSync(process.argv[2])); const A=path.resolve(__dirname,'../../assets'), K=path.resolve(process.argv[3]), O=path.resolve(process.argv[4]);
const css=`@font-face{font-family:Anton;src:url(file://${A}/fonts/Anton-latin.woff2)}
@font-face{font-family:HG;src:url(file://${A}/fonts/HankenGrotesk-latin.woff2);font-weight:100 900}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;overflow:hidden;background:#101f47;position:relative}
.img{position:absolute;left:0;right:0;bottom:0;height:1000px;background-size:cover;border-top:10px solid #f6b93b}
.box{position:absolute;left:56px;top:56px;transform:rotate(-2deg);transform-origin:left top}
.tag{display:inline-block;font:800 30px HG;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:#c0152f;padding:9px 20px;border-radius:999px;margin-bottom:18px}
.l{display:table;font:400 SIZEpx/1 Anton;color:#f4ecdf;background:#101f47;padding:12px 20px 16px;margin-bottom:-4px;box-shadow:7px 7px 0 rgba(0,0,0,.35);border:3px solid #f4ecdf}
.l.hl{background:#f6b93b;color:#101f47;border-color:#f6b93b}
.n{position:absolute;right:40px;bottom:36px;font:800 30px HG;color:#fff;background:rgba(16,31,71,.9);padding:8px 18px;border-radius:999px}
.e{position:absolute;left:70px;right:70px;top:110px}
.e h1{font:400 160px/1 Anton;color:#f4ecdf}.e h1 b{font-weight:400;color:#f6b93b}
.p{margin-top:26px;display:flex;align-items:flex-end;gap:24px}.p .v{font:400 150px/.9 Anton;color:#f6b93b}.p .d{font:700 38px/1.25 HG;color:#f4ecdf;padding-bottom:8px}
.cta{margin-top:40px;display:inline-block;background:#c0152f;color:#fff;font:400 64px/1 Anton;padding:26px 36px 30px;border-radius:24px;box-shadow:9px 9px 0 rgba(0,0,0,.35)}
.u{margin-top:28px;font:800 42px HG;color:#f4ecdf}.hd{margin-top:6px;font:800 38px HG;color:#f6b93b}.s{margin-top:8px;font:600 34px HG;color:#f6b93b}
.paul{position:absolute;right:6px;bottom:-4px;width:470px}.paul.inteiro{right:34px;bottom:34px;width:470px;height:430px;object-fit:contain;object-position:right bottom}.selo{position:absolute;left:60px;bottom:56px;width:132px}.marca{position:absolute;left:205px;bottom:46px;width:290px}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});const n=spec.slides.length+1;
 for(let i=0;i<n;i++){const s=spec.slides[i];let h;
  if(!s){const e=spec.end;h=`<style>${css}</style><div class="e"><div class="tag">${e.tag}</div><h1>${e.h[0]}<br><b>${e.h[1]}</b></h1>${e.price===false?'':`<div class="p"><div class="v">${e.price||'R$ 49,90'}</div><div class="d">${e.priceNote||'12 meses de acesso<br>pagamento único'}</div></div>`}<div class="cta">${e.cta||'JOGUE GRÁTIS · LINK NA BIO'}</div><div class="u">${e.url||'jogos.beaterista.com.br'}</div><div class="hd">${e.handle||'@jogos.beaterista'}</div><div class="s">${e.sub||''}</div></div><img class="selo" src="file://${A}/logo-512.png"><img class="marca" src="file://${A}/logo-menu-beaterista.webp"><img class="paul ${(e.paul||'caderno')=='caderno'?'':'inteiro'}" src="file://${__dirname}/pauls/${e.paul||'caderno'}.png">`;}
  else{const m=Math.max(...s.l.map(x=>x.length));const size=m>24?58:m>19?68:80;
   h=`<style>${css.replace('SIZE',size)}</style><div class="img" style="background-image:url('file://${K}/${s.img}');background-position:${s.pos||'50% 50%'}"></div><div class="box"><div class="tag">${spec.tag}</div>${s.l.map(x=>`<div class="l ${x[0]=='*'?'hl':''}">${x.replace('*','')}</div>`).join('')}</div><div class="n">${i+1}/${n} →</div>`;}
  const f=path.join(O,'t.html');fs.writeFileSync(f,h);await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:path.join(O,`${spec.prefix}_${i+1}.jpg`),type:'jpeg',quality:92});}
 fs.unlinkSync(path.join(O,'t.html'));await b.close();})();
