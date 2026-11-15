// gera os PNGs de texto e o cartão final de um reel. uso: node overlays.js spec.json pasta_saida
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
const spec=JSON.parse(fs.readFileSync(process.argv[2])); const out=process.argv[3];
const A=path.resolve(__dirname,'../../assets');
const css=`
@font-face{font-family:Anton;src:url(file://${A}/fonts/Anton-latin.woff2)}
@font-face{font-family:HG;src:url(file://${A}/fonts/HankenGrotesk-latin.woff2);font-weight:100 900}
*{margin:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;background:transparent;overflow:hidden}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,14,36,.72) 0,rgba(8,14,36,.35) 28%,rgba(8,14,36,0) 45%,rgba(8,14,36,0) 78%,rgba(8,14,36,.45) 100%)}
.box{position:absolute;left:64px;top:230px;transform:rotate(-2deg);transform-origin:left top}
.tag{display:inline-block;font:800 34px HG;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:#c0152f;padding:10px 22px;border-radius:999px;margin-bottom:22px}
.l{display:table;font:400 SIZEpx/1 Anton;color:#f4ecdf;background:#101f47;padding:16px 26px 20px;margin-bottom:-4px;letter-spacing:.01em;box-shadow:8px 8px 0 rgba(0,0,0,.35)}
.l.hl{background:#f6b93b;color:#101f47}
.bar{position:absolute;left:64px;right:64px;top:170px;display:flex;gap:10px}
.bar i{flex:1;height:8px;border-radius:8px;background:rgba(255,255,255,.35)}
.bar i.on{background:#f6b93b}
.foot{position:absolute;left:64px;bottom:400px;background:#c0152f;color:#fff;font:400 56px/1 Anton;padding:20px 30px 24px;border-radius:20px;box-shadow:8px 8px 0 rgba(0,0,0,.35);letter-spacing:.02em}
.end{position:absolute;inset:0;background:#101f47}
.end:before{content:'';position:absolute;inset:0;background:radial-gradient(900px 700px at 50% 86%,rgba(246,185,59,.22),transparent 70%)}
.end .top{position:absolute;left:0;right:0;top:0;height:22px;background:#c0152f}
.e{position:absolute;left:80px;right:80px;top:200px}
.e .tag{font-size:36px}
.e h1{font:400 150px/1.02 Anton;color:#f4ecdf;letter-spacing:.01em}
.e h1 b{font-weight:400;color:#f6b93b}
.price{margin-top:30px;display:flex;align-items:flex-end;gap:26px}
.price .v{font:400 150px/0.9 Anton;color:#f6b93b}
.price .d{font:700 38px/1.25 HG;color:#f4ecdf;padding-bottom:8px}
.cta{margin-top:40px;display:inline-block;background:#c0152f;color:#fff;font:400 70px/1 Anton;padding:28px 40px 32px;border-radius:26px;box-shadow:10px 10px 0 rgba(0,0,0,.35);letter-spacing:.02em}
.url{margin-top:28px;font:800 46px HG;color:#f4ecdf}
.sub{margin-top:6px;font:600 36px HG;color:#f6b93b}
.hd{margin-top:6px;font:800 42px HG;color:#f6b93b}
.selo{position:absolute;left:84px;top:1268px;width:190px}
.marca{position:absolute;left:50px;top:1462px;width:350px}`;
function clip(i){const s=spec.segs[i];const ls=s.lines;const max=Math.max(...ls.map(x=>x.length));
 const size=max>17?92:max>13?108:124; const n=spec.segs.length;
 return `<style>${css.replace('SIZE',size)}</style>${(s.layout==='h'||s.layout==='tela')?'':'<div class="shade"></div>'}
 ${n>1?`<div class="bar">${spec.segs.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>`:''}
 <div class="box"><div class="tag">${spec.tag}</div>${ls.map(x=>`<div class="l ${x[0]=='*'?'hl':''}">${x.replace('*','')}</div>`).join('')}</div>
 ${s.foot?`<div class="foot">${s.foot}</div>`:''}`}
function end(){const e=spec.end;return `<style>${css}</style><div class="end"><div class="top"></div><div class="e">
 <div class="tag">${e.tag}</div><h1>${e.h[0]}<br><b>${e.h[1]}</b></h1>
 ${e.price===false?'':`<div class="price"><div class="v">${e.price||'R$ 49,90'}</div><div class="d">${e.priceNote||'passe anual<br>pagamento único'}</div></div>`}
 <div class="cta">${e.cta||'JOGUE GRÁTIS · LINK NA BIO'}</div>
 <div class="url">${e.url||'jogos.beaterista.com.br'}</div><div class="hd">${e.handle||'@jogos.beaterista'}</div><div class="sub">${e.sub||'comece grátis hoje'}</div></div>
 <img class="selo" src="file://${A}/logo-512.png"><img class="marca" src="file://${A}/logo-menu-beaterista.webp"></div>`}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 const shot=async(html,name,opaque)=>{const f=path.join(out,'t.html');fs.writeFileSync(f,html);await p.goto('file://'+path.resolve(f));await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(out,name),omitBackground:!opaque});};
 for(let i=0;i<spec.segs.length;i++) await shot(clip(i),`t${i}.png`);
 if(spec.end) await shot(end(),'end.png',true);
 await b.close();})();
