// carrossel de depoimentos (so texto) 1080x1350. uso: node carrossel_depoimentos.js PASTA_DE_SAIDA
// as frases sao copia fiel da tela "alunos da Beaterista" da lojinha (nov/2026). nunca inventar depoimento.
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const A=path.resolve(__dirname,'../../assets'), O=path.resolve(process.argv[2]);
const Q=[
 ['aluna do Bateria Start','era um sonho que eu tenho desde criança, mas não tinha condições de comprar uma bateria nem de fazer um curso. mas hoje eu estou <b>realizando esse sonho</b>'],
 ['aluno do Bateria Start','tô gostando pra caramba! seu método é simplificado e direto, de um jeito que <b>não tem como não entender</b>'],
 ['aluna do Bateria Start','amei a didática, é <b>bem mais fácil de entender</b>, amei que também tem uma parte que explica partitura, estou bem empolgada para continuar'],
 ['aluna do Bateria Start','achei bem objetivas mesmo as aulas. <b>não estão cansativas</b>, e dá pra entender bem. tô gostando bastante'],
 ['aluna do Bateria Start','eu amo demais tocar. e com o teu curso junto tenho certeza que <b>ficarei mais confiante</b>'],
 ['aluna do Bateria Start','está muito legal!! <b>agora é treinar!</b> amei a estrutura!']];
const css=`@font-face{font-family:Anton;src:url(file://${A}/fonts/Anton-latin.woff2)}
@font-face{font-family:HG;src:url(file://${A}/fonts/HankenGrotesk-latin.woff2);font-weight:100 900}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;overflow:hidden;background:#101f47;position:relative}
.top{position:absolute;left:0;right:0;top:0;height:18px;background:#c0152f}
.tag{display:inline-block;font:800 30px HG;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:#c0152f;padding:9px 20px;border-radius:999px}
.c{position:absolute;left:70px;right:70px;top:150px}
.c h1{margin-top:26px;font:400 150px/1.02 Anton;color:#f4ecdf}.c h1 b{font-weight:400;color:#f6b93b}
.c p{margin-top:30px;font:700 44px/1.3 HG;color:#f4ecdf}
.card{position:absolute;left:70px;right:70px;top:250px;background:#f8f0de;border:5px solid #101f47;box-shadow:14px 14px 0 #c0152f;padding:54px 56px 60px;transform:rotate(-1.2deg)}
.who{font:800 42px HG;color:#a3192c}
.q{margin-top:22px;font:600 SIZEpx/1.28 HG;color:#101f47}.q b{background:#f6b93b;font-weight:800;padding:0 6px}
.aspas{position:absolute;left:70px;top:70px;font:400 200px/1 Anton;color:#f6b93b;height:120px}
.n{position:absolute;right:40px;bottom:36px;font:800 30px HG;color:#fff;background:rgba(255,255,255,.14);padding:8px 18px;border-radius:999px}
.rod{position:absolute;left:70px;bottom:40px;font:700 30px HG;color:#f4ecdf;opacity:.85}
.cta{margin-top:40px;display:inline-block;background:#c0152f;color:#fff;font:400 64px/1 Anton;padding:26px 36px 30px;border-radius:24px;box-shadow:9px 9px 0 rgba(0,0,0,.35)}
.u{margin-top:28px;font:800 42px HG;color:#f4ecdf}.hd{margin-top:6px;font:800 38px HG;color:#f6b93b}
.paul{position:absolute;right:6px;bottom:-4px;width:470px}.selo{position:absolute;left:60px;bottom:56px;width:132px}.marca{position:absolute;left:205px;bottom:46px;width:290px}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});const n=Q.length+2;const H=[];
 H.push(`<div class="top"></div><div class="c"><div class="tag">curso bateria start</div><h1>O QUE DIZ<br>QUEM JÁ<br><b>ESTUDA COMIGO</b></h1><p>6 mensagens de alunos,<br>do jeito que chegaram</p></div><img class="selo" src="file://${A}/logo-512.png"><img class="marca" src="file://${A}/logo-menu-beaterista.webp"><div class="n">1/${n} →</div>`);
 Q.forEach((q,i)=>{const len=q[1].replace(/<[^>]+>/g,'').length;const size=len>130?72:len>90?86:104;
  H.push(`<style>.q{font-size:${size}px}</style><div class="top"></div><div class="aspas">“</div><div class="card"><div class="who">${q[0]}</div><div class="q">${q[1]}</div></div><div class="rod">alunos da beaterista</div><div class="n">${i+2}/${n} →</div>`);});
 H.push(`<div class="top"></div><div class="c" style="top:110px"><div class="tag">curso online de bateria</div><h1 style="font-size:132px">DO ZERO À<br>SUA PRIMEIRA<br><b>MÚSICA</b></h1><p style="font-size:40px;margin-top:20px">mesmo sem bateria em casa</p><div class="cta">QUERO COMEÇAR · LINK NA BIO</div><div class="u">beaterista.com.br</div><div class="hd">@beaterista_</div></div><img class="selo" src="file://${A}/logo-512.png"><img class="marca" src="file://${A}/logo-menu-beaterista.webp"><img class="paul" src="file://${__dirname}/paul_final.png">`);
 for(let i=0;i<H.length;i++){const f=path.join(O,'t.html');fs.writeFileSync(f,`<style>${css.replace('SIZEpx','66px')}</style>`+H[i]);await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);await p.screenshot({path:path.join(O,`depoimentos_${i+1}.jpg`),type:'jpeg',quality:92});}
 fs.unlinkSync(path.join(O,'t.html'));await b.close();})();
