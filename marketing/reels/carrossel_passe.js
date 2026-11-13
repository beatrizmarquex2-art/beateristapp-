// carrossel "o que tem dentro do passe". uso: node carrossel_passe.js PASTA_DOS_RECORTES PASTA_DE_SAIDA
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const A=path.resolve(__dirname,'../../assets'), K=path.resolve(process.argv[2]), O=path.resolve(process.argv[3]);
const slides=[
 {img:'1_grade.jpg',pos:'50% 60%',l:['O QUE TEM DENTRO DO','*PASSE BEATERISTA?']},
 {img:'2_beathero.jpg',pos:'50% 50%',l:['*BEAT HERO','TOCAR NO TEMPO CERTO']},
 {img:'3_fases.jpg',pos:'50% 50%',l:['FASES QUE','*SOBEM DE NÍVEL']},
 {img:'4_taiko.jpg',pos:'30% 30%',l:['RUDIMENTOS DE BATERIA','*VIRAM DESAFIO']},
 {img:'5_estudos.jpg',pos:'50% 0%',l:['ESTUDOS: QUIZ,','*CAÇA-PALAVRAS E CRUZADINHA']},
 {img:'6_memoria.jpg',pos:'50% 40%',l:['JOGO DA MEMÓRIA','*COM O PAUL']},
 {end:true}];
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
.u{margin-top:28px;font:800 42px HG;color:#f4ecdf}.s{margin-top:8px;font:600 34px HG;color:#f6b93b}
.paul{position:absolute;right:6px;bottom:-4px;width:470px}.paul.inteiro{right:34px;bottom:34px;width:470px;height:430px;object-fit:contain;object-position:right bottom}
.selo{position:absolute;left:60px;bottom:56px;width:132px}.marca{position:absolute;left:205px;bottom:46px;width:290px}.hd{margin-top:6px;font:800 38px HG;color:#f6b93b}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
 for(let i=0;i<slides.length;i++){const s=slides[i];let h;
  if(s.end) h=`<style>${css}</style><div class="e"><div class="tag">jogos + estudos + álbum</div><h1>PASSE<br><b>BEATERISTA</b></h1><div class="p"><div class="v">R$ 49,90</div><div class="d">12 meses de acesso<br>pagamento único</div></div><div class="cta">JOGUE GRÁTIS · LINK NA BIO</div><div class="u">jogos.beaterista.com.br</div><div class="hd">@jogos.beaterista</div><div class="s">+ de 15 jogos e estudos</div></div><img class="selo" src="file://${A}/logo-512.png"><img class="marca" src="file://${A}/logo-menu-beaterista.webp"><img class="paul inteiro" src="file://${__dirname}/pauls/amplificador.png">`;
  else{const m=Math.max(...s.l.map(x=>x.length));const size=m>24?58:m>19?68:80;
   h=`<style>${css.replace('SIZE',size)}</style><div class="img" style="background-image:url('file://${K}/${s.img}');background-position:${s.pos}"></div><div class="box"><div class="tag">passe beaterista</div>${s.l.map(x=>`<div class="l ${x[0]=='*'?'hl':''}">${x.replace('*','')}</div>`).join('')}</div><div class="n">${i+1}/${slides.length} →</div>`;}
  const f=path.join(O,'t.html');fs.writeFileSync(f,h);await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:path.join(O,`passe_carrossel_${i+1}.jpg`),type:'jpeg',quality:92});}
 fs.unlinkSync(path.join(O,'t.html'));await b.close();})();
