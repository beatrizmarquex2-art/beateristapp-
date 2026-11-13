const { chromium } = require('playwright'); const fs=require('fs');
const A='/home/user/beateristapp-/assets', K=process.argv[2];
const slides=[
 {img:'IMG_9299_pato_gato_longe.jpg',pos:'62% 60%',z:1.25,l:['SEU FILHO JÁ FALA','*EM RITMO.','SÓ FALTA ESCREVER']},
 {img:'IMG_9300_pato_gato_perto.jpg',pos:'90% 50%',z:1.0,l:['PA-TO = 2 SONS','*BOR-BO-LE-TA = 4']},
 {img:'IMG_9302_partitura.jpg',pos:'60% 60%',z:1.0,l:['CADA PEÇA DA BATERIA','*NO SEU LUGAR']},
 {img:'IMG_9301_caixa.jpg',pos:'60% 60%',z:1.0,l:['DESENHOS PRA COLORIR','*ENQUANTO APRENDE']},
 {img:'IMG_9303_vamos_tocar.jpg',pos:'55% 60%',z:1.0,l:['E NO FINAL','*ELE TOCA DE VERDADE']},
 {end:true}];
const css=`@font-face{font-family:Anton;src:url(file://${A}/fonts/Anton-latin.woff2)}
@font-face{font-family:HG;src:url(file://${A}/fonts/HankenGrotesk-latin.woff2);font-weight:100 900}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;overflow:hidden;background:#101f47;position:relative}
.bg{position:absolute;inset:0;background-size:cover}
.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,14,36,.7),rgba(8,14,36,0) 38%)}
.box{position:absolute;left:56px;top:60px;transform:rotate(-2deg);transform-origin:left top}
.tag{display:inline-block;font:800 30px HG;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:#c0152f;padding:9px 20px;border-radius:999px;margin-bottom:18px}
.l{display:table;font:400 82px/1 Anton;color:#f4ecdf;background:#101f47;padding:14px 22px 18px;margin-bottom:-4px;box-shadow:7px 7px 0 rgba(0,0,0,.35)}
.l.hl{background:#f6b93b;color:#101f47}
.n{position:absolute;right:48px;bottom:44px;font:800 30px HG;color:#fff;background:rgba(16,31,71,.85);padding:8px 18px;border-radius:999px}
.e{position:absolute;left:70px;right:70px;top:110px}
.e h1{font:400 170px/1 Anton;color:#f4ecdf}.e h1 b{font-weight:400;color:#f6b93b}
.p{margin-top:26px;display:flex;align-items:flex-end;gap:24px}.p .v{font:400 150px/.9 Anton;color:#f6b93b}.p .d{font:700 38px/1.25 HG;color:#f4ecdf;padding-bottom:8px}
.cta{margin-top:40px;display:inline-block;background:#c0152f;color:#fff;font:400 68px/1 Anton;padding:26px 38px 30px;border-radius:24px;box-shadow:9px 9px 0 rgba(0,0,0,.35)}
.u{margin-top:28px;font:800 42px HG;color:#f4ecdf}.s{margin-top:8px;font:600 34px HG;color:#f6b93b}
.paul{position:absolute;right:50px;bottom:40px;width:430px}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
 for(let i=0;i<slides.length;i++){const s=slides[i];let h;
  if(s.end) h=`<style>${css}</style><div class="e"><div class="tag">material digital em pdf</div><h1>BATERIA<br><b>KIDS</b></h1><div class="p"><div class="v">R$ 19,90</div><div class="d">36 páginas<br>pra imprimir</div></div><div class="cta">LINK NA BIO</div><div class="u">jogos.beaterista.com.br</div><div class="s">compra pela hotmart, pdf na hora</div></div><img class="paul" src="file://${A}/originals/artes-beaterista/kit-roboterista/img/paul.png">`;
  else h=`<style>${css}</style><div class="bg" style="background-image:url(file://${K}/${s.img});background-position:${s.pos};transform:scale(${s.z});transform-origin:${s.pos}"></div><div class="sh"></div><div class="box"><div class="tag">bateria kids</div>${s.l.map(x=>`<div class="l ${x[0]=='*'?'hl':''}">${x.replace('*','')}</div>`).join('')}</div><div class="n">${i+1}/6 →</div>`;
  fs.writeFileSync('t.html',h);await p.goto('file://'+process.cwd()+'/t.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:`kids_carrossel_${i+1}.jpg`,type:'jpeg',quality:92});}
 await b.close();})();
