// uso: node render.js spec.json PASTA_DOS_PAULS(r/) PASTA_DOS_QUADROS
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
(async()=>{const spec=JSON.parse(fs.readFileSync(process.argv[2])); const out=process.argv[4]; fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+path.join(__dirname,'aula.html'));
 await p.evaluate(([s,d])=>load(s,d),[spec,'file://'+path.resolve(process.argv[3])]);
 const only=process.argv[5]; const N=Math.round(spec.T*30);
 for(let f=0;f<N;f++){ if(only&&!only.split(',').includes(String(f))) continue;
  await p.evaluate(t=>setT(t),f/30); await p.screenshot({path:path.join(out,String(f).padStart(5,'0')+'.jpg'),type:'jpeg',quality:93}); }
 await b.close();})();
