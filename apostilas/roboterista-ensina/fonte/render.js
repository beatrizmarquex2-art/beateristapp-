const {chromium}=require('playwright');
(async()=>{
  const [,, inp, out] = process.argv;
  const b=await chromium.launch(); const p=await b.newPage();
  await p.goto('file://'+require('path').resolve(inp),{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  const rep = await p.evaluate(()=>{
    const res=[];
    document.querySelectorAll('section.page').forEach((s,i)=>{
      const inn=s.querySelector('.in'); const z=s.querySelector('.z'); if(!z) return;
      const reserve = s.querySelector('.corner')?96:0;
      const avail=inn.getBoundingClientRect().height-reserve-4;
      const maxz=parseFloat(s.dataset.maxz||'1.22'), minz=1.0;
      z.style.zoom=maxz; let h=z.getBoundingClientRect().height;
      if(h<=avail){res.push([i+1,maxz,h/avail]);return;}
      z.style.zoom=minz; h=z.getBoundingClientRect().height;
      if(h>avail){res.push([i+1,minz,h/avail]);return;}
      let lo=minz,hi=maxz;
      for(let k=0;k<12;k++){const mid=(lo+hi)/2; z.style.zoom=mid; if(z.getBoundingClientRect().height<=avail) lo=mid; else hi=mid;}
      z.style.zoom=lo; h=z.getBoundingClientRect().height; res.push([i+1,lo,h/avail]);
    });
    return res;});
  const bad=rep.filter(r=>r[2]>1.0);
  console.log('zoom médio',(rep.reduce((a,r)=>a+r[1],0)/rep.length).toFixed(3),'| estouro:',JSON.stringify(bad.map(r=>[r[0],+r[2].toFixed(2)])));
  require('fs').writeFileSync('fit.json',JSON.stringify(rep));
  await p.pdf({path:out,preferCSSPageSize:true,printBackground:true});
  await b.close();
})();
