
/* ===== Beater Rhythm Games — pacote independente (Palco, Piano Tiles, Beatstar, Setinhas, Figuras rítmicas) =====
   Uso:  BeaterRhythm.mount(elemento, { storageKey, onXp(n,why), onScore(info), game:'hero'|'tiles'|'beat'|'setas'|'figuras' })
         BeaterRhythm.unmount()
   Não depende de nenhum outro script. Gerado do app bm. */
(function(global){'use strict';
var ROOT=null,ACTIVE=false,MODE='rz',OPTS={};
var setSongs=function(list){MEXT=(list||[]).filter(function(x){return x&&x.arr&&x.arr.mel&&x.arr.drums});if(typeof mergeImp==='function') mergeImp()};
/* patch Beaterista: RM (movimento reduzido) era usado no acerto do Palco sem estar definido no pacote */
var RM=(global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)'))||{matches:false};
var $=function(s){return ROOT?ROOT.querySelector(s):null},$$=function(s){return ROOT?Array.prototype.slice.call(ROOT.querySelectorAll(s)):[]};
var VIEW=function(){return ROOT.querySelector('.bmr-stage')};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var hash=function(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
var normTxt=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};
var nowIso=function(){return new Date().toISOString()};
var MT={freq:function(m){return 440*Math.pow(2,(m-69)/12)}};
var route=function(){return ACTIVE&&MODE==='rz'?'ritmo':''};
/* armazenamento (localStorage com fallback em memória) */
var state={},SKEY='beater-rhythm-v1',saveT=0;
function load(){try{var j=localStorage.getItem(SKEY);if(j) state=JSON.parse(j)||{}}catch(e){}}
function save(){clearTimeout(saveT);try{localStorage.setItem(SKEY,JSON.stringify(state))}catch(e){}}
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(save,400)}
function ensureRitmo(){var R=state.ritmo&&typeof state.ritmo==='object'?state.ritmo:(state.ritmo={});if(!R.best||typeof R.best!=='object') R.best={};R.plays=R.plays||0;return R}
function ensureHero(){var R=ensureRitmo();R.hero=Object.assign({best:{},plays:0,notes:0,perfect:0,offset:0},R.hero||{});if(!R.hero.best||typeof R.hero.best!=='object') R.hero.best={};return R.hero}
function toast(msg){if(!ROOT) return;var t=ROOT.querySelector('.bmr-toast');if(!t){t=document.createElement('div');t.className='bmr-toast';ROOT.appendChild(t)}t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('on')},3200)}
function xpGain(n,why){if(OPTS.onXp) OPTS.onXp(n,why)}
function sfx(){}

/* ===== áudio ===== */
const AE={
  ctx:null,master:null,rev:null,noise:null,wave:null,voices:new Map(),sustained:new Set(),sustain:false,plucks:new Map(),openHat:null,
  get(){if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});this.build()}return this.ctx},
  build(){
    const c=this.ctx;const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=8;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.2;
    this.master=c.createGain();this.master.gain.value=.85;this.master.connect(comp);comp.connect(c.destination);
    const len=Math.floor(c.sampleRate*2.2),ir=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
    const cv=c.createConvolver();cv.buffer=ir;this.rev=c.createGain();this.rev.gain.value=.2;this.rev.connect(cv);cv.connect(this.master);
    const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;this.noise=nb;
    const amps=[0,1,.55,.3,.2,.12,.08,.05,.035,.02,.014,.01];this.wave=c.createPeriodicWave(new Float32Array(amps.length),new Float32Array(amps));
  },
  running(){return !!this.ctx&&this.ctx.state==='running'},
  unlock(){
    try{if(navigator.audioSession&&navigator.audioSession.type!=='playback') navigator.audioSession.type='playback'}catch(e){}
    const c=this.get();
    if(c.state!=='running') c.resume().catch(()=>{});
    if(!this._primed){try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);this._primed=true}catch(e){}}
  },
  lat(){const c=this.get();return (c.outputLatency||c.baseLatency||0)},
  env(g,t,peak,dur,att){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+(att||.003));g.gain.exponentialRampToValueAtTime(.0001,t+dur)},
  noiseSrc(t,dur){const s=this.ctx.createBufferSource();s.buffer=this.noise;s.start(t,Math.random()*1.5,dur+.05);return s},
  filt(type,f,q){const b=this.ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null) b.Q.value=q;return b},
  /* piano */
  noteOn(m,vel,t){
    const c=this.get();t=t||c.currentTime;vel=vel==null?.8:vel;this.kill(m,t);
    const f=MT.freq(m),g=c.createGain(),peak=vel*.3*(m<52?1.15:1);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+.006);g.gain.setTargetAtTime(peak*.2,t+.01,.35+Math.max(0,84-m)*.014);
    const lp=this.filt('lowpass',Math.min(15000,f*10),.4);lp.frequency.setTargetAtTime(Math.min(8000,f*3.2),t,.45);
    const o1=c.createOscillator(),o2=c.createOscillator(),o2g=c.createGain();o1.setPeriodicWave(this.wave);o2.setPeriodicWave(this.wave);
    o1.frequency.value=f;o2.frequency.value=f;o2.detune.value=5;o2g.gain.value=.45;
    o1.connect(lp);o2.connect(o2g);o2g.connect(lp);lp.connect(g);g.connect(this.master);g.connect(this.rev);
    o1.start(t);o2.start(t);o1.stop(t+10);o2.stop(t+10);
    const v={g,o:[o1,o2]};this.voices.set(m,v);o1.onended=()=>{if(this.voices.get(m)===v) this.voices.delete(m);try{g.disconnect()}catch(e){}};
    return v;
  },
  release(v,t,tau){const p=v.g.gain;if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t)}
    p.setTargetAtTime(.0001,t,tau);v.o.forEach(o=>{try{o.stop(t+tau*8)}catch(e){}})},
  kill(m,t){const v=this.voices.get(m);if(!v) return;this.voices.delete(m);this.sustained.delete(m);this.release(v,t||this.ctx.currentTime,.012)},
  noteOff(m,t){const v=this.voices.get(m);if(!v) return;if(this.sustain){this.sustained.add(m);return}
    this.voices.delete(m);this.release(v,t||this.ctx.currentTime,.09)},
  setSustain(on){this.sustain=on;if(!on){const list=Array.from(this.sustained);this.sustained.clear();list.forEach(m=>{this.noteOff(m)})}},
  allOff(){Array.from(this.voices.keys()).forEach(m=>this.kill(m))},
  /* violão: Karplus-Strong */
  ks(m){const c=this.ctx,sr=c.sampleRate,f=MT.freq(m),N=Math.max(2,Math.round(sr/f-.5)),len=Math.floor(sr*2.4);
    const buf=c.createBuffer(1,len,sr),d=buf.getChannelData(0),ring=new Float32Array(N);
    for(let i=0;i<N;i++) ring[i]=Math.random()*2-1;for(let k=0;k<2;k++) for(let i=0;i<N;i++) ring[i]=(ring[i]+ring[(i+1)%N])*.5;
    let p=0,mx=0;for(let i=0;i<len;i++){const a=ring[p],b=ring[(p+1)%N];d[i]=a;ring[p]=(a+b)*.5*.9985;p=(p+1)%N;if(Math.abs(a)>mx) mx=Math.abs(a)}
    const s=.8/(mx||1);for(let i=0;i<len;i++) d[i]*=s;return buf},
  pluck(m,t,vel){const c=this.get();t=t||c.currentTime;let b=this.plucks.get(m);if(!b){b=this.ks(m);this.plucks.set(m,b)}
    const s=c.createBufferSource(),g=c.createGain(),lp=this.filt('lowpass',4200,.5);s.buffer=b;g.gain.value=(vel||.7)*.8;
    s.connect(lp);lp.connect(g);g.connect(this.master);g.connect(this.rev);s.start(t);s.stop(t+2.4)},
  strum(ms,dir,gap){const c=this.get();const t=c.currentTime+.02;const list=dir==='up'?ms.slice().reverse():ms;list.forEach((m,i)=>this.pluck(m,t+i*(gap||.035),.75))},
  /* bateria sintetizada */
  metal(t,fund,dur,peak,bpF,hpF,dest){const c=this.ctx,bp=this.filt('bandpass',bpF,.9),hp=this.filt('highpass',hpF),g=c.createGain();
    [2,3,4.16,5.43,6.79,8.21].forEach(r=>{const o=c.createOscillator();o.type='square';o.frequency.value=fund*r;o.connect(bp);o.start(t);o.stop(t+dur+.05)});
    bp.connect(hp);hp.connect(g);this.env(g,t,peak,dur,.002);g.connect(dest);return g},
  tom(t,f0,f1,dur,out){const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur*.6);
    this.env(g,t,.95,dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);
    const o2=c.createOscillator(),g2=c.createGain();o2.type='triangle';o2.frequency.setValueAtTime(f0*1.6,t);o2.frequency.exponentialRampToValueAtTime(f1*1.5,t+dur*.4);this.env(g2,t,.25,dur*.5);o2.connect(g2);g2.connect(out);o2.start(t);o2.stop(t+dur);
    const n=this.noiseSrc(t,.06),nf=this.filt('bandpass',1500,1),ng=c.createGain();this.env(ng,t,.18,.05);n.connect(nf);nf.connect(ng);ng.connect(out)},
  drum(name,t,vel){
    const c=this.get();t=t||c.currentTime;vel=vel==null?.9:vel;const out=c.createGain();out.gain.value=vel;out.connect(this.master);
    if(name!=='kick'){const s=c.createGain();s.gain.value=.35;out.connect(s);s.connect(this.rev)}
    if(AE.onDrum) try{AE.onDrum(name,t)}catch(e){}
    switch(name){
      case 'kick':{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(165,t);o.frequency.exponentialRampToValueAtTime(46,t+.13);
        this.env(g,t,1.15,.5,.003);o.connect(g);g.connect(out);o.start(t);o.stop(t+.55);
        const n=this.noiseSrc(t,.03),hp=this.filt('highpass',1800),ng=c.createGain();this.env(ng,t,.3,.025,.001);n.connect(hp);hp.connect(ng);ng.connect(out);break}
      case 'snare':{const n=this.noiseSrc(t,.25),hp=this.filt('highpass',900),bp=this.filt('bandpass',2600,.7),g=c.createGain();this.env(g,t,.8,.21,.001);n.connect(hp);hp.connect(bp);bp.connect(g);g.connect(out);
        [[185,.55,.12],[330,.22,.07]].forEach(([f,p,d])=>{const o=c.createOscillator(),og=c.createGain();o.type='triangle';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.85,t+d);this.env(og,t,p,d);o.connect(og);og.connect(out);o.start(t);o.stop(t+d+.05)});break}
      case 'hhc':{if(this.openHat){const p=this.openHat.gain;if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);else p.cancelScheduledValues(t);p.setTargetAtTime(.0001,t,.008);this.openHat=null}
        this.metal(t,40,.07,.6,10000,7000,out);break}
      case 'hho':{this.openHat=this.metal(t,40,.5,.5,10000,7000,out);break}
      case 'ride':{this.metal(t,52,1.4,.26,4600,2400,out);const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=1180;this.env(g,t,.07,.7);o.connect(g);g.connect(out);o.start(t);o.stop(t+.75);
        const n=this.noiseSrc(t,.4),hp=this.filt('highpass',6500),ng=c.createGain();this.env(ng,t,.06,.35);n.connect(hp);hp.connect(ng);ng.connect(out);break}
      case 'crash':{const n=this.noiseSrc(t,1.8),hp=this.filt('highpass',3800),g=c.createGain();this.env(g,t,.5,1.7,.002);n.connect(hp);hp.connect(g);g.connect(out);this.metal(t,46,1.5,.22,7000,3200,out);break}
      case 'tom1':this.tom(t,250,175,.45,out);break;
      case 'tom2':this.tom(t,185,128,.55,out);break;
      case 'floor':this.tom(t,120,80,.8,out);break;
      case 'click':{const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=vel>.95?2000:1350;out.gain.value=.5;this.env(g,t,.32,.035,.001);o.connect(g);g.connect(out);o.start(t);o.stop(t+.05);break}
      case 'wood':{const o=c.createOscillator(),g=c.createGain(),bp=this.filt('bandpass',900,3);o.type='triangle';o.frequency.value=880;this.env(g,t,.9,.08,.001);o.connect(bp);bp.connect(g);g.connect(out);o.start(t);o.stop(t+.1);break}
      case 'buzz':{const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.value=98;out.gain.value=.35;this.env(g,t,.35,.22,.005);o.connect(g);g.connect(out);o.start(t);o.stop(t+.25);break}
    }
  }
};
/* ===== gerador de músicas e arranjos ===== */
function hgRng(seed){let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
const RS_STYLES=[['rock','Rock','#d92031'],['pop','Pop','#c56f87'],['reggaeton','Reggaeton','#e8c07a'],['balada','Balada','#9fb8d9'],['lofi','Lo-fi','#a58ad8'],['bossa','Bossa nova','#7fb77e']];
/* patch Beaterista: aba "Importados" com músicas prontas (vindas de MIDI); o site passa a lista por opts.songs ou BeaterRhythm.setSongs() */
var IMP=[];RS_STYLES.push(['imp','Importados','#f3eee4']);
const RS_NAMES={rock:[['Estrada','Garagem','Trovão','Faísca','Asfalto','Motor','Vinil','Tempestade','Rádio','Corrente'],['Elétrica','Sem Freio','de Fogo','Distorcida','da Meia-Noite']],
  pop:[['Coração','Neon','Verão','Janela','Mensagem','Cometa','Domingo','Espelho','Glitter','Satélite'],['Brilhante','Pra Dançar','em Câmera Lenta','Cor-de-Rosa','de Madrugada']],
  reggaeton:[['Perreo','Calor','Noche','Fuego','Bahía','Madrugada','Luna','Ritmo','Party','Dembow'],['Lento','de Verano','Sin Parar','Bajo la Luna','Caliente']],
  balada:[['Saudade','Abraço','Lua','Varanda','Ternura','Chuva','Porto','Aurora','Carta','Silêncio'],['Devagar','de Domingo','no Escuro','sem Pressa','pra Você']],
  lofi:[['Café','Biblioteca','Janela','Fita','Estudo','Neblina','Vinil','Gatinho','Sono','Fones'],['de Chuva','às 3h','em Loop','sem Pressa','Cinzento']],
  bossa:[['Praia','Violão','Ipanema','Brisa','Sorriso','Varanda','Maré','Jardim','Cafezinho','Tarde'],['Mansa','de Verão','em Sol','Suave','Azul']]};
const RS_MAJ=[0,2,4,5,7,9,11],RS_MIN=[0,2,3,5,7,8,10];
const RS_PROG={rock:{M:[[0,7,9,5],[0,10,5,0],[9,5,0,7],[0,5,7,5],[0,5,0,7]],m:[[0,8,3,10],[0,10,8,10],[0,5,8,7]]},pop:{M:[[0,7,9,5],[9,5,0,7],[0,9,5,7],[5,0,7,9],[0,4,9,5]],m:[[0,8,3,10],[0,5,8,7]]},reggaeton:{M:[[9,5,0,7]],m:[[0,8,3,10],[0,5,8,7],[0,10,8,10],[0,3,8,10]]},balada:{M:[[0,9,5,7],[0,7,9,5],[5,7,0,9],[0,5,9,7]],m:[[0,8,3,10],[0,5,8,7],[5,3,8,7]]},lofi:{M:[[5,4,9,0],[0,9,5,7],[2,7,0,0]],m:[[0,5,8,10],[0,8,3,10],[5,0,10,8]]},bossa:{M:[[2,7,0,9],[0,9,2,7],[5,10,0,0]],m:[[2,7,0,8],[0,5,10,8],[0,2,7,0]]}};
function rsQual(deg,minor){const M={0:'',2:'m',4:'m',5:'',7:'',9:'m',10:'',8:'',3:''},m={0:'m',3:'',5:'m',7:'m',8:'',10:'',2:'dim'};return (minor?m:M)[deg]||''}
function rsSong(style,i){if(style==='imp') return IMP[i]?Object.assign({},IMP[i],{i:i}):null;const seed=hash('rs-'+style+'-'+i);const r=hgRng(seed);const N=RS_NAMES[style];const name=N[0][i%10]+' '+N[1][Math.floor(i/10)%5];
  const minor=style==='balada'?r()<.5:style==='lofi'?r()<.6:style==='bossa'?r()<.4:style==='reggaeton'?r()<.9:style==='rock'?r()<.35:r()<.2;const bpm=style==='balada'?60+Math.floor(r()*5)*3:style==='lofi'?68+Math.floor(r()*5)*3:style==='bossa'?76+Math.floor(r()*5)*3:style==='rock'?112+Math.floor(r()*8)*5:style==='pop'?96+Math.floor(r()*7)*4:88+Math.floor(r()*5)*3;
  const key=[0,2,4,5,7,9,10][Math.floor(r()*7)];const P=RS_PROG[style][minor?'m':'M'];const pick=()=>P[Math.floor(r()*P.length)];
  return {id:style+'-'+i,style,i,name,bpm,root:48+key,minor,seed,pv:pick(),pc:pick(),pb:pick()}}
function rsAll(style){if(style==='imp') return IMP.map(function(x,i){return Object.assign({},x,{i:i})});return [...Array(50)].map((_,i)=>rsSong(style,i))}
/* arranjo: seções, bateria, baixo, acordes e melodia */
function rsArrange(S,short){const r=hgRng(S.seed^0x9e3779b9);const st=60/S.bpm/4;const scale=S.minor?RS_MIN:RS_MAJ;
  const secs=short?[['intro',2],['verso',8],['refrao',8],['refrao',8],['fim',2]]:[['intro',2],['verso',8],['refrao',8],['verso',8],['refrao',8],['ponte',4],['refrao',8],['fim',2]];
  const ev=[],mel=[],drums=[],chords=[];let bar=0;const lead=1;const T=(b,s)=>(lead+b)*16*st+s*st;
  const motifs={};const mkMotif=(kind)=>{const dens=kind==='refrao'?.62:kind==='ponte'?.4:.48;const on=[];for(let s=0;s<32;s++){const strong=s%4===0,mid=s%2===0;let p=strong?dens+.25:mid?dens-.05:dens*.35;if(S.style==='reggaeton'&&[3,6,11,14,19,22,27,30].includes(s)) p+=.25;if(r()<p) on.push(s)}if(!on.length) on.push(0);
    let idx=kind==='refrao'?7:4;const steps=on.map(()=>{idx+=[-2,-1,-1,0,1,1,2][Math.floor(r()*7)];idx=Math.max(kind==='refrao'?5:2,Math.min(kind==='refrao'?11:8,idx));return idx});return {on,steps}};
  ['verso','refrao','ponte'].forEach(k=>{motifs[k]=[mkMotif(k),mkMotif(k)]});
  const pitchOf=(idx)=>S.root+12+scale[((idx%7)+7)%7]+12*Math.floor(idx/7);
  const chordPcs=deg=>{const q=rsQual(deg,S.minor);const third=q==='m'||q==='dim'?3:4;const fifth=q==='dim'?6:7;return [deg,deg+third,deg+fifth].map(x=>((x%12)+12)%12)};
  const snapIdx=(idx,deg)=>{const pcs=chordPcs(deg);for(let d=0;d<4;d++){for(const s of [idx-d,idx+d]){if(pcs.includes(((S.root+12+scale[((s%7)+7)%7])%12+12-S.root%12)%12)) return s}}return idx};
  secs.forEach(([kind,n],si)=>{const prog=kind==='refrao'?S.pc:kind==='ponte'?S.pb:S.pv;
    for(let b=0;b<n;b++){const deg=kind==='intro'||kind==='fim'?0:prog[b%4];const rootM=S.root+deg;const B=bar+b;const sectionStart=b===0,last=b===n-1;
      const q=rsQual(deg,S.minor);const tri=[0,q==='m'||q==='dim'?3:4,q==='dim'?6:7].map(x=>rootM+12+x);chords.push({t:T(B,0),ms:tri,d:16*st,deg,bar:B,kind});
      /* bateria */
      const D=(s,l,snd,v)=>drums.push({t:T(B,s),lane:l,snd,v:v||1,bar:B,kind});
      if(kind==='fim'){if(b===0){D(0,0,'kick');D(0,2,'crash')}continue}
      if(sectionStart&&si>0) D(0,2,'crash');
      if(S.style==='rock'){const ch=kind==='refrao';[0,8].forEach(s=>D(s,0,'kick'));if(ch||r()<.4) D(10,0,'kick');if(ch&&r()<.5) D(6,0,'kick');[4,12].forEach(s=>D(s,1,'snare'));
        if(last&&kind!=='intro'){[12,13,14,15].forEach((s,k)=>D(s,3,k<2?'tom1':'floor'));}else for(let s=0;s<16;s+=2) if(!(sectionStart&&si>0&&s===0)) D(s,2,ch?'ride':'hhc',s%4?.6:1)}
      else if(S.style==='pop'){const ch=kind==='refrao';(ch?[0,4,8,12]:[0,10]).forEach(s=>D(s,0,'kick'));[4,12].forEach(s=>D(s,1,'snare'));
        if(last&&kind!=='intro'){[12,14].forEach(s=>D(s,3,'tom2'));D(15,1,'snare',.7)}else (ch?[2,6,10,14]:[0,2,4,6,8,10,12,14]).forEach(s=>{if(!(sectionStart&&si>0&&s===0)) D(s,2,ch?'hho':'hhc',ch?.8:.6)})}
      else if(S.style==='balada'){const ch=kind==='refrao';D(0,0,'kick');if(ch) D(8,0,'kick');D(8,1,'snare',.7);if(ch) D(12,1,'snare',.5);
        if(last&&kind!=='intro') D(14,3,'tom2',.7);else (ch?[0,4,8,12]:[0,8]).forEach(s=>{if(!(sectionStart&&si>0&&s===0)) D(s,2,'hhc',.5)})}
      else if(S.style==='lofi'){const ch=kind==='refrao';[0,10].forEach(s=>D(s,0,'kick',.9));if(ch) D(6,0,'kick',.7);[4,12].forEach(s=>D(s,1,'snare',.7));
        if(last&&kind!=='intro') D(15,1,'snare',.5);else [0,3,6,8,11,14].forEach(s=>{if(!(sectionStart&&si>0&&s===0)) D(s,2,'hhc',.4)})}
      else if(S.style==='bossa'){[0,6,8,14].forEach(s=>D(s,0,'kick',.8));if(kind!=='intro') [2,5,8,11,14].forEach(s=>D(s,1,'snare',.45));
        if(last&&kind!=='intro') D(14,3,'tom1',.6);else [0,2,4,6,8,10,12,14].forEach(s=>{if(!(sectionStart&&si>0&&s===0)) D(s,2,'hhc',.35)})}
      else{const ch=kind!=='intro';(ch&&kind!=='ponte'?[0,4,8,12]:[0,8]).forEach(s=>D(s,0,'kick'));(kind==='intro'?[]:[3,6,11,14]).forEach(s=>D(s,1,'snare',.85));
        if(last&&kind!=='intro'){[13,14,15].forEach(s=>D(s,3,'tom1'))}else [2,6,10,14].forEach(s=>D(s,2,'hhc',.5))}
      /* baixo */
      const bassSteps=S.style==='rock'?[0,2,4,6,8,10,12,14]:S.style==='pop'?[0,6,8,14]:S.style==='balada'?[0,8]:S.style==='lofi'?[0,6,10]:S.style==='bossa'?[0,6,8,14]:[0,3,6,8,11,14];bassSteps.forEach(s=>ev.push({t:T(B,s),k:'bass',m:rootM-12+(S.style!=='rock'&&(s===6||s===14)?7:0),d:st*1.8}));
      ev.push({t:T(B,0),k:'chord',ms:tri,d:16*st*.95,sty:S.style});
      if(S.style==='reggaeton') [3,6,11,14].forEach(s=>ev.push({t:T(B,s),k:'stab',ms:tri,d:st*1.2}));
      if(S.style==='rock'&&kind!=='intro') [0,2,4,6,8,10,12,14].forEach(s=>ev.push({t:T(B,s),k:'pchord',m:rootM,d:st*1.6,v:kind==='refrao'?.55:.4}))}
    /* melodia por frases de 2 compassos */
    if(kind==='verso'||kind==='refrao'||kind==='ponte'){for(let p=0;p<n;p+=2){const M=motifs[kind][(p/2)%4===2?1:0];const shift=(p/2)%4===1?1:0;const cad=p+2>=n;
        M.on.forEach((s,k)=>{const b2=bar+p+Math.floor(s/16),s2=s%16;const deg=prog[(p+Math.floor(s/16))%4];let idx=M.steps[k]+shift;if(s2%8===0) idx=snapIdx(idx,deg);if(cad&&k===M.on.length-1) idx=kind==='refrao'?7:0+7;
          const nxt=k+1<M.on.length?M.on[k+1]:32;const durSteps=Math.min(cad&&k===M.on.length-1?12:8,nxt-s);mel.push({t:T(b2,s2),m:pitchOf(idx),idx,d:durSteps*st,ds:durSteps,bar:b2,step:s2,kind})})}}
    bar+=n});
  mel.sort((a,b)=>a.t-b.t);drums.sort((a,b)=>a.t-b.t);ev.sort((a,b)=>a.t-b.t);
  const pre=[];for(let s=0;s<4;s++) pre.push({t:s*4*st,k:'click',v:s?.6:1});
  return {st,mel,drums,ev:pre.concat(ev),chords,dur:T(bar,0)+1.5,bars:bar,lead}}
/* ---------- som ---------- */
function rzGuitar(m,t,d,v,clean){const c=AE.get();t=t||c.currentTime;const out=c.createGain();out.connect(AE.master);const o=c.createOscillator(),o2=c.createOscillator();o.type='sawtooth';o2.type='square';o.frequency.value=440*Math.pow(2,(m-69)/12);o2.frequency.value=o.frequency.value*1.005;
  const ws=c.createWaveShaper();if(!rzGuitar.curve){const n=1024,cu=new Float32Array(n);for(let i=0;i<n;i++){const x=i/n*2-1;cu[i]=Math.tanh(x*3.2)}rzGuitar.curve=cu}ws.curve=rzGuitar.curve;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=clean?2400:3200;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((v||.5)*(clean?.18:.12),t+.008);g.gain.setTargetAtTime((v||.5)*(clean?.08:.09),t+.05,.25);g.gain.setTargetAtTime(0,t+Math.max(.08,d||.3),.08);
  const m2=c.createGain();m2.gain.value=.4;o.connect(clean?lp:ws);o2.connect(m2);m2.connect(clean?lp:ws);if(!clean) ws.connect(lp);lp.connect(g);g.connect(out);const s=c.createGain();s.gain.value=.25;g.connect(s);s.connect(AE.rev);o.start(t);o2.start(t);o.stop(t+(d||.3)+.6);o2.stop(t+(d||.3)+.6)}
function rzSynth(ms,t,d,v){const c=AE.get();ms.forEach(m=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=440*Math.pow(2,(m-69)/12);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((v||.5)*.05,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.08,d));o.connect(lp);lp.connect(g);g.connect(AE.master);o.start(t);o.stop(t+d+.1)})}
function rzVoice(m,t,d,v,pan){const c=AE.get();t=t||c.currentTime;const o=c.createOscillator();o.type='square';o.frequency.value=440*Math.pow(2,(m-69)/12);const f1=c.createBiquadFilter();f1.type='bandpass';f1.frequency.value=900+((m*37)%5)*180;f1.Q.value=2.5;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((v||.6)*.22,t+.01);g.gain.setTargetAtTime(0,t+Math.max(.06,d||.15),.05);
  let node=g;if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan||0;g.connect(p);node=p}o.connect(f1);f1.connect(g);node.connect(AE.master);o.start(t);o.stop(t+(d||.15)+.4)}
function rzPlayEv(e,at,mute){switch(e.k){case 'click':AE.drum('click',at,e.v);break;case 'bass':AE.noteOn(e.m,.55,at);AE.noteOff(e.m,at+e.d);break;
  case 'chord':if(e.sty==='pop'||e.sty==='balada'||e.sty==='lofi'||e.sty==='bossa'){e.ms.forEach(m=>{AE.noteOn(m,.32,at);AE.noteOff(m,at+e.d)})}else if(e.sty==='reggaeton'){e.ms.forEach(m=>{AE.noteOn(m+12,.18,at);AE.noteOff(m+12,at+e.d*.5)})}break;
  case 'stab':rzSynth(e.ms,at,e.d,.7);break;case 'pchord':if(!mute.guitar) rzGuitar(e.m-12,at,e.d,e.v,false);break;
  case 'drum':AE.drum(e.snd,at,e.v);break;case 'lead':if(RZ.inst==='piano'&&RZ.game==='hero'){AE.noteOn(e.m,.45,at);AE.noteOff(e.m,at+e.d)}else rzGuitar(e.m,at,e.d,.32,RZ.song&&RZ.song.style!=='rock');break;case 'voice':rzVoice(e.m,at,e.d,.55,-.5);break}}

/* ===== jogos ===== */
/* ================= jogos de ritmo: Palco (guitarra, bateria, piano), Beatstar e Setinhas ================= */
const RZ={game:'hero',inst:'guitarra',diff:'medio',style:'rock',song:null,phase:'menu',chart:[],bg:[],A:null,t0:0,ptr:0,iv:0,raf:0,cv:null,dpr:1,stats:null,held:new Set(),press:new Map(),fx:[],pops:[],flash:{},pauseS:0,health:.5,q:'',fold:'',sel:null,vis:[],tl:null,kn:{bateria:4,piano:7},lives:3,badf:{},cal:null,howFrom:'menu'};
const RZ_GAMES=[['hero','Palco','guitarra, bateria e teclado estilo guitar hero','#d92031'],['tiles','Piano Tiles','toque nos blocos pretos, no ritmo da música','#9fd0c7'],['beat','Beatstar','toque, segure e deslize no tempo exato','#b48bff'],['setas','Setinhas','batalha de setas: repita depois do rival','#7fe7ff']];
const RZ_GTR=[['#5fbf6a','A'],['#e2554f','S'],['#f2c14e','D'],['#5b8dd6','F'],['#ff9d4a','G']];
const RZ_KITS={3:[['#e2554f','D','bumbo'],['#f2c14e','F','caixa'],['#5b8dd6','J','chimbal']],
  4:[['#e2554f','D','bumbo'],['#f2c14e','F','caixa'],['#5b8dd6','J','chimbal'],['#b48bff','K','tom']],
  5:[['#e2554f','D','bumbo'],['#f2c14e','F','caixa'],['#5b8dd6','J','chimbal'],['#b48bff','K','tom'],['#4fd1c5','L','prato']]};
const RZ_KIT_LANE={3:{kick:0,snare:1,hhc:2,hho:2,ride:2,crash:2,tom1:1,tom2:1,floor:1},4:{kick:0,snare:1,hhc:2,hho:2,ride:2,crash:2,tom1:3,tom2:3,floor:3},5:{kick:0,snare:1,hhc:2,hho:2,ride:4,crash:4,tom1:3,tom2:3,floor:3}};
const RZ_KIT_SND={3:['kick','snare','hhc'],4:['kick','snare','hhc','tom1'],5:['kick','snare','hhc','tom1','crash']};
const RZ_KIT_N=[3,4,5],RZ_PIANO_N=[3,4,5,7,8];
const RZ_PKEYS=['A','S','D','F','G','H','J','K'];
const RZ_SOL=['dó','dó♯','ré','mi♭','mi','fá','fá♯','sol','lá♭','lá','si♭','si'];
const RZ_INST={guitarra:{n:'Guitarra'},bateria:{n:'Bateria'},piano:{n:'Teclado'}};
const RZ_WIN={facil:{pf:.085,gd:.19,spd:.6,n:'Fácil'},medio:{pf:.06,gd:.13,spd:.85,n:'Médio'},dificil:{pf:.045,gd:.1,spd:1.12,n:'Difícil'}};
/* teclado com 3, 4, 5, 7 ou 8 teclas: 3 a 5 viram acorde/pentatônica, 7 é a escala, 8 fecha a oitava */
function rzPSemis(k,minor){const sc=minor?RS_MIN:RS_MAJ;if(k===7) return sc.slice();if(k===8) return sc.concat([12]);
  return k===3?(minor?[0,3,7]:[0,4,7]):k===4?(minor?[0,3,7,10]:[0,4,7,9]):(minor?[0,3,5,7,10]:[0,2,4,7,9])}
function rzL(inst){inst=inst||RZ.inst;if(inst==='guitarra') return RZ_GTR;if(inst==='bateria') return RZ_KITS[RZ.kn.bateria]||RZ_KITS[4];
  const sm=rzPSemis(RZ.kn.piano,!!(RZ.song&&RZ.song.minor));return sm.map((x,i)=>['#F3E7D4',RZ_PKEYS[i],RZ_SOL[x%12]+(x>=12?'↑':'')])}
function rzInstKey(){return RZ.inst+(RZ.inst==='bateria'&&RZ.kn.bateria!==4?RZ.kn.bateria:RZ.inst==='piano'&&RZ.kn.piano!==7?RZ.kn.piano:'')}
const RZ_ARROW=[['←','#c24bd9','ArrowLeft','a'],['↓','#2fc4e8','ArrowDown','s'],['↑','#3ed16a','ArrowUp','w'],['→','#ef4b59','ArrowRight','d']];
function rzKey(){return [RZ.game,RZ.game==='hero'?rzInstKey():'',RZ.diff,RZ.song?RZ.song.id:''].join('|')}
function rzRank(list,val){const u=[...new Set(list)].sort((a,b)=>a-b);return x=>u.length<2?Math.floor(val/2):Math.round(u.indexOf(x)/(u.length-1)*(val-1))}
function rzPhraseLanes(notes,nl,keyFn){const by={};notes.forEach(n=>{const k=keyFn(n);(by[k]=by[k]||[]).push(n)});Object.values(by).forEach(G=>{const f=rzRank(G.map(n=>n.idx),nl);let prev=-1;G.forEach(n=>{let l=f(n.idx);if(l===prev&&G.length>3&&n.idx!==n._pidx) l=Math.max(0,Math.min(nl-1,l+(l>=nl/2?-1:1)));n.lane=l;prev=l})})}
function rzBuild(){const S=RZ.song,dif=RZ.diff==='dificil',easy=RZ.diff==='facil';const A=S.arr?Object.assign({},S.arr,{mel:S.arr.mel.map(n=>Object.assign({},n)),drums:S.arr.drums.map(d=>Object.assign({},d)),ev:S.arr.ev.slice(),chords:(S.arr.chords||[]).slice()}):rsArrange(S,RZ.game!=='hero');RZ.A=A;const st=A.st;let notes=[],bg=A.ev.slice();
  const melF=A.mel.filter(n=>dif||n.step%(easy?4:2)===0).map(n=>Object.assign({},n));
  if(RZ.game==='hero'){
    if(RZ.inst==='guitarra'){notes=melF;rzPhraseLanes(notes,5,n=>Math.floor(n.bar/2));notes.forEach(n=>{if(n.ds>=6) n.sus=n.d*.9});
      if(dif) notes.filter(n=>n.kind==='refrao'&&n.step%8===0).forEach(n=>{const l2=n.lane<=2?n.lane+2:n.lane-2;notes.push({t:n.t,lane:l2,m:n.m-5,idx:n.idx,d:n.d,chord:true})});
      A.drums.forEach(d=>bg.push({t:d.t,k:'drum',snd:d.snd,v:d.v*.85}))}
    else if(RZ.inst==='bateria'){const kk=RZ.kn.bateria,LM=RZ_KIT_LANE[kk];notes=A.drums.filter(d=>easy?(d.lane<=1||d.snd==='crash'):(dif||(d.lane!==2||Math.round(d.t/st)%4===0))).map(d=>({t:d.t,lane:LM[d.snd]!=null?LM[d.snd]:Math.min(d.lane,kk-1),snd:d.snd,v:d.v}));A.mel.forEach(n=>bg.push({t:n.t,k:'lead',m:n.m,d:n.d}))}
    else{const sc=S.minor?RS_MIN:RS_MAJ,K=RZ.kn.piano,sm=rzPSemis(K,S.minor);
      const cd=(a,b)=>{const x=((a-b)%12+12)%12;return Math.min(x,12-x)},sdl=(a,o)=>{const x=((a-o)%12+12)%12;return x>6?x-12:x};
      const near=semi=>{let bi=0,bd=99;sm.forEach((a,i)=>{const d=cd(a%12,semi);if(d<bd){bd=d;bi=i}});return bi};
      let pl=null;notes=melF.map(n=>{const d=((n.idx%7)+7)%7,o=sc[d];let lane;
        if(K>=7){lane=d;if(K===8&&d===0) lane=(pl!=null&&pl>=4)?7:0}
        else{lane=near(o);n.m+=sdl(sm[lane]%12,o)}
        pl=lane;n.lane=lane;return n});notes.forEach(n=>{if(n.ds>=6) n.sus=n.d*.9});
      if(dif) A.chords.forEach(c=>{const cs=((c.deg%12)+12)%12;const li=K>=7?sc.indexOf(cs):near(cs);if(li<0) return;[0,8].forEach(s=>{const t=c.t+s*st;if(!notes.some(n=>Math.abs(n.t-t)<1e-4&&n.lane===li)) notes.push({t,lane:li,m:S.root+(K>=7?c.deg:(sm[li]%12)),lh:true,d:st*6})})});
      A.drums.forEach(d=>bg.push({t:d.t,k:'drum',snd:d.snd,v:d.v*.8}))}
    const seen=new Set();notes=notes.filter(n=>{const k=n.lane+'|'+Math.round(n.t*1000);if(seen.has(k)) return false;seen.add(k);return true})}
  else if(RZ.game==='beat'){notes=melF;rzPhraseLanes(notes,3,n=>Math.floor(n.bar/2));let k=0;notes.forEach(n=>{if(n.ds>=6) n.sus=n.d*.85;else if(++k%(dif?7:easy?20:11)===0){n.sw=n.lane===0?'r':n.lane===2?'l':'u'}});A.drums.forEach(d=>bg.push({t:d.t,k:'drum',snd:d.snd,v:d.v*.8}));A.mel.forEach(n=>bg.push({t:n.t,k:'lead',m:n.m,d:n.d}))}
  else if(RZ.game==='setas'){const bar=16*st;const groups={};melF.forEach(n=>{const g=Math.floor((n.bar-2)/4);if(g<0) return;(groups[g]=groups[g]||[]).push(n)});
    Object.keys(groups).map(Number).filter(g=>g%2===0).forEach(g=>{const G=groups[g];const f=rzRank(G.map(n=>n.idx),4);G.forEach(n=>{const l=f(n.idx);const sus=n.ds>=6?n.d*.8:0;notes.push({t:n.t,lane:l,m:n.m+12,d:Math.min(n.d,.3),sus,cpu:true});notes.push({t:n.t+4*bar,lane:l,m:n.m+12,d:Math.min(n.d,.3),sus})})});
    notes.filter(n=>n.cpu).forEach(n=>bg.push({t:n.t,k:'voice',m:n.m,d:Math.max(.12,n.sus||n.d)}));A.drums.forEach(d=>bg.push({t:d.t,k:'drum',snd:d.snd,v:d.v*.8}));RZ.health=.5}
  else if(RZ.game==='tiles'){notes=melF;rzPhraseLanes(notes,4,n=>Math.floor(n.bar/2));notes.forEach(n=>{if(n.ds>=6) n.sus=n.d*.9});
    const spd=.5*RZ_WIN[RZ.diff].spd,by=[[],[],[],[]];notes.forEach(n=>by[n.lane].push(n));
    by.forEach(arr=>arr.forEach((n,i)=>{const nx=arr[i+1];const gap=nx?nx.t-n.t:9;const maxF=Math.max(.05,gap*spd*.88);n.hf=n.sus?Math.min(maxF,n.sus*spd+.05):Math.min(.17,maxF)}));
    A.drums.forEach(d=>bg.push({t:d.t,k:'drum',snd:d.snd,v:d.v*.8}))}
  notes.sort((a,b)=>a.t-b.t);notes.forEach(n=>{n.res=null;n.hit=false});RZ.chart=notes;bg.sort((a,b)=>a.t-b.t);RZ.bg=bg}
function rzTime(){return AE.ctx.currentTime-RZ.t0-AE.lat()-((ensureHero().offset||0)/1000)}
function rzSched(){if(RZ.phase!=='play') return;const c=AE.ctx;const ahead=c.currentTime-RZ.t0+.3;const mute={guitar:RZ.game==='hero'&&RZ.inst==='guitarra'};
  while(RZ.ptr<RZ.bg.length&&RZ.bg[RZ.ptr].t<ahead){const e=RZ.bg[RZ.ptr++];const at=RZ.t0+e.t;if(at>=c.currentTime-.02) try{rzPlayEv(e,Math.max(at,c.currentTime),mute)}catch(x){}}}
function rzStart(song){rzStop(true);AE.unlock();const c=AE.get();RZ.song=song||RZ.song;rzBuild();RZ.stats={pp:0,perfect:0,good:0,great:0,miss:0,stray:0,combo:0,maxCombo:0,score:0,hold:0};RZ.fx=[];RZ.pops=[];RZ.ptr=0;RZ.held.clear();RZ.flash={};RZ.badf={};RZ.lives=3;
  RZ.t0=c.currentTime+.3;RZ.phase='play';rzWake(true);document.body.classList.add('rz-lock');rzRe();rzBind();RZ.iv=setInterval(rzSched,30);rzSched();RZ.raf=requestAnimationFrame(rzFrame)}
let RZ_WL=null;
async function rzWake(on){try{if(on){if(navigator.wakeLock&&!RZ_WL){RZ_WL=await navigator.wakeLock.request('screen');RZ_WL.addEventListener('release',()=>{RZ_WL=null})}}else if(RZ_WL){await RZ_WL.release();RZ_WL=null}}catch(e){RZ_WL=null}}
window.addEventListener('resize',()=>{if(route()==='ritmo'&&(RZ.phase==='play'||RZ.phase==='pause')) setTimeout(rzBind,80)});
window.addEventListener('orientationchange',()=>{if(route()==='ritmo'&&(RZ.phase==='play'||RZ.phase==='pause')) setTimeout(rzBind,300)});
function rzStop(silent){rzWake(false);document.body.classList.remove('rz-lock');clearInterval(RZ.iv);cancelAnimationFrame(RZ.raf);RZ.iv=0;RZ.raf=0;if(!silent&&RZ.phase!=='end') RZ.phase='menu';if(AE.ctx) AE.allOff()}
function rzPause(){if(RZ.phase!=='play') return;RZ.pauseS=AE.ctx.currentTime-RZ.t0;RZ.phase='pause';clearInterval(RZ.iv);AE.allOff();rzHud();rzDraw()}
function rzResume(){if(RZ.phase!=='pause') return;const c=AE.ctx;const back=Math.min(1.5,RZ.pauseS);RZ.t0=c.currentTime-(RZ.pauseS-back)+.4;RZ.ptr=RZ.bg.findIndex(e=>e.t>RZ.pauseS-back-.01);if(RZ.ptr<0) RZ.ptr=RZ.bg.length;RZ.phase='play';RZ.iv=setInterval(rzSched,30);rzHud();cancelAnimationFrame(RZ.raf);RZ.raf=requestAnimationFrame(rzFrame)}
function rzMult(){return RZ.game==='hero'?Math.min(4,1+Math.floor(RZ.stats.combo/10)):1}
function rzJudge(n,res){const S=RZ.stats;n.res=res;n.at=performance.now();n.hit=res!=='miss';if(res==='miss'){S.miss++;S.combo=0;if(RZ.game==='setas') RZ.health=Math.max(0,RZ.health-.07);if(RZ.game==='tiles') RZ.lives=Math.max(0,RZ.lives-1)}
  else{S[res]++;S.combo++;S.maxCombo=Math.max(S.maxCombo,S.combo);const base={pp:100,perfect:90,great:60,good:40}[res];S.score+=base*rzMult()+(RZ.game==='beat'?Math.min(50,S.combo):0);if(RZ.game==='setas') RZ.health=Math.min(1,RZ.health+(res==='good'?.012:.025))}
  const txt={pp:'PERFEITO+',perfect:'Perfeito',great:'Ótimo',good:'Bom',miss:'Errou'}[res];RZ.pops.push({lane:n.lane,txt,res,t:performance.now()});if(RZ.pops.length>10) RZ.pops.shift()}
function rzTier(d){const W=RZ_WIN[RZ.diff];if(RZ.game==='beat'){if(d<=.025) return 'pp';if(d<=.05) return 'perfect';if(d<=.09) return 'great';if(d<=.13) return 'good';return null}if(d<=W.pf) return 'perfect';if(d<=W.gd) return 'good';return null}
function rzHitSound(n,lane){const c=AE.ctx;
  if(RZ.game==='hero'){
    if(RZ.inst==='bateria') AE.drum(n&&n.snd?n.snd:(RZ_KIT_SND[RZ.kn.bateria]||RZ_KIT_SND[4])[lane],c.currentTime,.95);
    else if(RZ.inst==='piano'){const m=n?n.m:RZ.song.root+12+rzPSemis(RZ.kn.piano,RZ.song.minor)[lane];AE.noteOn(m,.7);setTimeout(()=>AE.noteOff(m),n&&n.sus?n.sus*1000:260)}
    else if(n) rzGuitar(n.m,c.currentTime,n.sus||n.d||.25,.6,RZ.song.style!=='rock')}
  else if(RZ.game==='tiles'){if(n){const m=n.m;AE.noteOn(m,.75);setTimeout(()=>AE.noteOff(m),n.sus?n.sus*1000:320)}}
  else if(RZ.game==='setas'&&n) rzVoice(n.m,c.currentTime,Math.max(.12,n.sus||.15),.6,.5);else if(RZ.game==='beat'&&!n) AE.drum('wood',c.currentTime,.3)}
function rzHit(lane,dir){if(RZ.phase!=='play') return;const s=rzTime();const W=RZ.game==='beat'?.13:RZ_WIN[RZ.diff].gd;
  let best=null,bd=9;for(const n of RZ.chart){if(n.res||n.cpu||n.lane!==lane) continue;const d=Math.abs(n.t-s);if(d<bd){bd=d;best=n}if(n.t>s+W) break}
  const tier=best&&bd<=W?rzTier(bd):null;
  if(best&&tier&&best.sw&&dir!==best.sw){RZ.flash[lane]=performance.now();return}
  if(best&&tier&&best.sw&&!dir) return;
  if(tier){rzJudge(best,tier);if(best.sus){best.holding=true;best.hold0=best.t}rzHitSound(best,lane);const col=rzLaneCol(lane);if(!RM.matches) for(let i=0;i<12;i++) RZ.fx.push({lane,vx:(Math.random()-.5)*5,vy:-2-Math.random()*5,x:0,y:0,life:1,c:col});
    if(RZ.game==='hero'&&RZ.inst==='guitarra') RZ.chart.forEach(o=>{if(o!==best&&!o.res&&o.chord&&Math.abs(o.t-best.t)<.001){}})}
  else{if(RZ.game==='tiles'){if(best&&best.t>s+W&&best.t-s<.55){RZ.flash[lane]=performance.now();return}RZ.stats.stray++;RZ.stats.combo=0;RZ.badf[lane]=performance.now();if(RZ.diff==='dificil') RZ.lives=Math.max(0,RZ.lives-1);rzHud();return}
    RZ.stats.stray++;if(RZ.diff==='dificil'&&RZ.game==='hero') RZ.stats.combo=0;if(RZ.game==='setas') RZ.health=Math.max(0,RZ.health-.02);rzHitSound(null,lane)}
  RZ.flash[lane]=performance.now();rzHud()}
function rzRelease(lane){RZ.chart.forEach(n=>{if(n.holding&&n.lane===lane){n.holding=false}})}
function rzLaneCol(l){if(RZ.game==='hero') return rzL()[l][0];if(RZ.game==='tiles') return '#2fc4e8';if(RZ.game==='setas') return RZ_ARROW[l][1];if(RZ.game==='beat') return ['#ff6ad5','#ffd84a','#5ee0ff'][l];return '#141015'}
function rzFrame(){if(RZ.phase!=='play'&&RZ.phase!=='pause') return;if(RZ.phase==='play'){
    {const s=rzTime(),W=RZ.game==='beat'?.13:RZ_WIN[RZ.diff].gd;let ch=false;
      for(const n of RZ.chart){if(n.res){if(n.holding){if(s<n.t+n.sus){RZ.stats.score+=2*rzMult();RZ.stats.hold++}else{n.holding=false}}continue}if(n.cpu){if(n.t<=s){n.res='cpu';RZ.flash['c'+n.lane]=performance.now()}continue}if(n.t<s-W){rzJudge(n,'miss');ch=true}else if(n.t>s+1) break}
      if(ch) rzHud();if((RZ.game==='setas'&&RZ.health<=0)||(RZ.game==='tiles'&&RZ.lives<=0)){rzEnd(true);return}if(s>RZ.A.dur){rzEnd();return}}}
  rzDraw();RZ.raf=requestAnimationFrame(rzFrame)}
function rzEnd(lost){rzWake(false);document.body.classList.remove('rz-lock');clearInterval(RZ.iv);RZ.phase='end';AE.allOff();const S=RZ.stats;const tot=RZ.chart.filter(n=>!n.cpu).length||1;
  let acc;acc=(S.pp+S.perfect+S.great*.75+S.good*.5)/tot;S.acc=acc;S.lost=!!lost;
  S.grade=lost?'—':acc>=.96&&!S.miss?'S':acc>=.9?'A':acc>=.78?'B':acc>=.6?'C':'D';S.stars=RZ.game==='beat'?(acc>=.97?5:acc>=.9?4:acc>=.8?3:acc>=.65?2:acc>=.45?1:0):0;
  const R=ensureRitmo();const k=rzKey();const prev=R.best[k];const val=S.score;S.record=!lost&&(!prev||val>prev.score);if(S.record) R.best[k]={score:val,acc:Math.round(acc*100),grade:S.grade,stars:S.stars,at:nowIso()};R.plays++;save();
  S.hallKey=rzKey();S.hallQ=false;S.hallDone=false;if(!lost&&OPTS.hallTop){var ht=OPTS.hallTop(S.hallKey)||[];S.hallQ=S.score>0&&(ht.length<5||S.score>ht[ht.length-1].score)}
  try{sfx(lost||acc<.6?'lose':'win')}catch(e){}try{xpGain(Math.round(4+acc*16),'jogo de ritmo')}catch(e){}rzRe()}
/* ---------- desenho ---------- */
function rzBind(){const cv=$('#rz-cv');RZ.cv=cv;if(!cv) return;const r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);RZ.dpr=dpr;rzDraw();}
function rzDraw(){const cv=RZ.cv;if(!cv||!document.contains(cv)) return;const g=cv.getContext('2d');({hero:rzDrawHero,beat:rzDrawBeat,setas:rzDrawSetas,tiles:rzDrawTiles}[RZ.game])(g,cv.width,cv.height,RZ.dpr)}
function rzSNow(){return RZ.phase==='play'?rzTime():RZ.phase==='pause'?RZ.pauseS-AE.lat():-1}
function rzPopsFx(g,xOf,y,dpr){const now=performance.now();RZ.fx=RZ.fx.filter(p=>p.life>0);RZ.fx.forEach(p=>{p.vy+=.25;p.x+=p.vx;p.y+=p.vy;p.life-=.035;g.globalAlpha=Math.max(0,p.life);g.fillStyle=p.c;g.beginPath();g.arc(xOf(p.lane)+p.x*dpr,y+p.y*dpr,2.2*dpr,0,7);g.fill()});g.globalAlpha=1;
  RZ.pops=RZ.pops.filter(p=>now-p.t<650);RZ.pops.forEach(p=>{const a=1-(now-p.t)/650;g.globalAlpha=a;g.fillStyle={pp:'#7fe7ff',perfect:'#F3E7D4',great:'#7fb77e',good:'#e8c07a',miss:'#f0606c'}[p.res];g.font='700 '+(14*dpr)+'px system-ui,sans-serif';g.textAlign='center';g.fillText(p.txt,xOf(p.lane),y-40*dpr-(1-a)*20*dpr)});g.globalAlpha=1}
function rzCountdown(g,W,H,dpr,s){if(s>-1&&RZ.A&&s<RZ.A.lead*16*RZ.A.st){const beat=4*RZ.A.st;const cnt=4-Math.floor(Math.max(0,s)/beat);if(cnt>0&&cnt<=4){g.fillStyle='rgba(243,231,212,.9)';g.font='800 '+(60*dpr)+'px system-ui,sans-serif';g.textAlign='center';g.fillText(String(cnt),W/2,H*.42)}}
  if(RZ.phase==='pause'){g.fillStyle='rgba(13,11,13,.72)';g.fillRect(0,0,W,H);g.fillStyle='#F3E7D4';g.font='800 '+(30*dpr)+'px system-ui,sans-serif';g.textAlign='center';g.fillText('PAUSA',W/2,H*.45)}
  if(s>0&&RZ.A){g.fillStyle='rgba(217,32,49,.9)';g.fillRect(0,0,W*Math.min(1,s/RZ.A.dur),3*dpr)}}
function rzDrawHero(g,W,H,dpr){const L=rzL(),n=L.length;const s=rzSNow();const now=performance.now();const hitY=H*.86,hor=H*.06,bw=W*.96,tw=W*.34,cx=W/2;const look=1.7/RZ_WIN[RZ.diff].spd;
  const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#08060a');bg.addColorStop(1,'#1d1420');g.fillStyle=bg;g.fillRect(0,0,W,H);
  [[-.3,'rgba(217,32,49,.13)'],[1.3,'rgba(91,141,214,.13)']].forEach(([x,c])=>{const gr=g.createRadialGradient(W*x,0,0,W*x,0,H*.9);gr.addColorStop(0,c);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H)});
  const yOf=z=>{const p=1/(1+2.4*z);return hor+(hitY-hor)*((p-1/3.4)/(1-1/3.4))};const half=y=>{const f=(hitY-y)/(hitY-hor);return (bw/2)+(tw/2-bw/2)*f};const xOf=(l,y)=>cx+(l+.5-n/2)*(half(y)*2/n);
  g.beginPath();g.moveTo(cx-tw/2,hor);g.lineTo(cx+tw/2,hor);g.lineTo(cx+bw/2,hitY+30*dpr);g.lineTo(cx-bw/2,hitY+30*dpr);g.closePath();const hw=g.createLinearGradient(0,hor,0,hitY);hw.addColorStop(0,'rgba(40,30,44,.4)');hw.addColorStop(1,'rgba(52,40,56,.95)');g.fillStyle=hw;g.fill();
  for(let i=0;i<=n;i++){const xt=cx+(i-n/2)*(tw/n),xb=cx+(i-n/2)*(bw/n);g.strokeStyle='rgba(243,231,212,.18)';g.lineWidth=dpr;g.beginPath();g.moveTo(xt,hor);g.lineTo(xb,hitY+30*dpr);g.stroke()}
  if(s>-1){const beat=4*RZ.A.st;const first=Math.floor(s/beat);for(let b=first;b<first+20;b++){const z=(b*beat-s)/look;if(z<0||z>1) continue;const y=yOf(z);const hh=half(y);g.fillStyle=b%4===0?'rgba(243,231,212,.22)':'rgba(243,231,212,.08)';g.fillRect(cx-hh,y,hh*2,(b%4===0?2:1)*dpr)}}
  for(let i=0;i<n;i++){const x=xOf(i,hitY),r=half(hitY)/n*.62;const held=RZ.held.has(i),fl=RZ.flash[i]&&now-RZ.flash[i]<140;g.lineWidth=3*dpr;g.strokeStyle=L[i][0];g.globalAlpha=held||fl?1:.55;g.beginPath();g.ellipse(x,hitY,r,r*.42,0,0,7);g.stroke();
    if(held||fl){g.fillStyle=L[i][0]+'55';g.fill();const gr=g.createLinearGradient(0,hitY,0,hitY-H*.35);gr.addColorStop(0,L[i][0]+'66');gr.addColorStop(1,L[i][0]+'00');g.fillStyle=gr;g.fillRect(x-r,hitY-H*.35,r*2,H*.35)}g.globalAlpha=1;
    if(L[i][2]){g.fillStyle='rgba(243,231,212,.78)';g.font='600 '+(Math.max(11,Math.min(17,W/dpr/n*.28)))*dpr+'px system-ui';g.textAlign='center';g.fillText(L[i][2],x,hitY+r*.42+18*dpr)}}
  if(s>-1){for(const nt of RZ.chart){const z=(nt.t-s)/look;if(z>1.02) break;if(nt.hit&&!nt.holding) continue;if(nt.sus){const z2=Math.min(1,(nt.t+nt.sus-s)/look);if(z2>0){const zs=Math.max(0,z);const y1=yOf(zs),y2=yOf(z2);const w1=half(y1)/n*.16,w2=half(y2)/n*.16;const x1=xOf(nt.lane,y1),x2=xOf(nt.lane,y2);g.fillStyle=nt.holding?L[nt.lane][0]:L[nt.lane][0]+'99';g.beginPath();g.moveTo(x1-w1,y1);g.lineTo(x2-w2,y2);g.lineTo(x2+w2,y2);g.lineTo(x1+w1,y1);g.closePath();g.fill()}}
      if(nt.hit||z<-.08) continue;const y=yOf(Math.max(0,z));const x=xOf(nt.lane,y);const r=half(y)/n*(n>=7?.7:.56);const col=L[nt.lane][0];g.globalAlpha=nt.res==='miss'?.25:1;
      g.fillStyle='rgba(0,0,0,.5)';g.beginPath();g.ellipse(x,y+r*.18,r,r*.42,0,0,7);g.fill();const gg=g.createLinearGradient(0,y-r*.4,0,y+r*.4);gg.addColorStop(0,'#fff');gg.addColorStop(.25,col);gg.addColorStop(1,'#000');g.fillStyle=gg;g.beginPath();g.ellipse(x,y,r,r*.42,0,0,7);g.fill();
      g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.ellipse(x,y,r*.38,r*.15,0,0,7);g.fill();if(nt.lh){g.strokeStyle='#141015';g.lineWidth=2*dpr;g.beginPath();g.ellipse(x,y,r*.7,r*.28,0,0,7);g.stroke()}g.globalAlpha=1}}
  rzPopsFx(g,l=>xOf(l,hitY),hitY,dpr);
  if(RZ.stats&&RZ.stats.combo>=10){g.fillStyle='rgba(243,231,212,.85)';g.font='800 '+(18*dpr)+'px system-ui';g.textAlign='left';g.fillText('×'+rzMult(),10*dpr,hitY-14*dpr)}rzCountdown(g,W,H,dpr,s)}
function rzDrawBeat(g,W,H,dpr){const s=rzSNow();const now=performance.now();const hitY=H*.8,lw=W*.8/3,x0=W*.1;const speed=H*.55*RZ_WIN[RZ.diff].spd;const C=['#ff6ad5','#ffd84a','#5ee0ff'];
  const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1a0b2e');bg.addColorStop(.6,'#2a0f3a');bg.addColorStop(1,'#0a0612');g.fillStyle=bg;g.fillRect(0,0,W,H);
  for(let i=0;i<3;i++){g.fillStyle='rgba(255,255,255,'+(i===1?.05:.035)+')';g.fillRect(x0+i*lw+2*dpr,0,lw-4*dpr,H);const fl=RZ.flash[i]&&now-RZ.flash[i]<160;if(fl||RZ.held.has(i)){const gr=g.createLinearGradient(0,hitY,0,hitY-H*.5);gr.addColorStop(0,C[i]+'88');gr.addColorStop(1,C[i]+'00');g.fillStyle=gr;g.fillRect(x0+i*lw+2*dpr,hitY-H*.5,lw-4*dpr,H*.5)}}
  const pl=RZ.pops.length?RZ.pops[RZ.pops.length-1]:null;const lc=pl&&now-pl.t<300?{pp:'#7fe7ff',perfect:'#ffffff',great:'#7fb77e',good:'#e8c07a',miss:'#f0606c'}[pl.res]:'rgba(255,255,255,.75)';g.fillStyle=lc;g.fillRect(x0,hitY-2*dpr,lw*3,4*dpr);g.shadowColor=lc;g.shadowBlur=12*dpr;g.fillRect(x0,hitY-1*dpr,lw*3,2*dpr);g.shadowBlur=0;
  if(s>-1){for(const nt of RZ.chart){const y=hitY-(nt.t-s)*speed;if(y<-60*dpr) break;if(nt.sus){const y2=hitY-(nt.t+nt.sus-s)*speed;if(y2<hitY&&(!nt.hit||nt.holding)){g.fillStyle=C[nt.lane]+(nt.holding?'cc':'66');g.fillRect(x0+nt.lane*lw+lw*.36,Math.max(0,y2),lw*.28,Math.min(hitY,y)-Math.max(0,y2))}}
      if(nt.hit||y>H+20) continue;const x=x0+nt.lane*lw+6*dpr,w=lw-12*dpr,h=Math.max(16*dpr,lw*.28);g.globalAlpha=nt.res==='miss'?.25:1;g.shadowColor=C[nt.lane];g.shadowBlur=14*dpr;const r=8*dpr;g.fillStyle=C[nt.lane];g.beginPath();g.moveTo(x+r,y-h/2);g.arcTo(x+w,y-h/2,x+w,y+h/2,r);g.arcTo(x+w,y+h/2,x,y+h/2,r);g.arcTo(x,y+h/2,x,y-h/2,r);g.arcTo(x,y-h/2,x+w,y-h/2,r);g.closePath();g.fill();g.shadowBlur=0;
      g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x+r,y-h/2+3*dpr,w-2*r,3*dpr);if(nt.sw){g.fillStyle='#1a0b2e';g.font='800 '+(h*.8)+'px system-ui';g.textAlign='center';g.fillText({u:'⇧',l:'⇦',r:'⇨'}[nt.sw],x+w/2,y+h*.3)}g.globalAlpha=1}}
  const st=RZ.stats;if(st){const tot=RZ.chart.length||1;const sc=Math.min(1,(st.pp+st.perfect+st.great*.75+st.good*.5)/tot);[0,1,2,3,4].forEach(i=>{const on=sc>=[.45,.65,.8,.9,.97][i]*((RZ.chart.filter(n=>n.res).length)/tot);g.fillStyle=on&&st.combo+st.perfect>0?'#ffd84a':'rgba(255,255,255,.18)';g.font=(18*dpr)+'px system-ui';g.textAlign='center';g.fillText('★',W/2+(i-2)*24*dpr,30*dpr)})}
  rzPopsFx(g,l=>x0+l*lw+lw/2,hitY,dpr);rzCountdown(g,W,H,dpr,s)}

/* ---------- Piano Tiles ---------- */
function rzDrawTiles(g,W,H,dpr){const s=rzSNow(),now=performance.now();const hitY=H*.8,lw=W/4,sp=H*.5*RZ_WIN[RZ.diff].spd;
  g.fillStyle='#efe9dc';g.fillRect(0,0,W,H);
  for(let i=0;i<4;i++){g.fillStyle=i%2?'rgba(0,0,0,.035)':'rgba(255,255,255,.35)';g.fillRect(i*lw,0,lw,H)}
  g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=dpr;for(let i=1;i<4;i++){g.beginPath();g.moveTo(i*lw,0);g.lineTo(i*lw,H);g.stroke()}
  g.fillStyle='rgba(47,196,232,.10)';g.fillRect(0,hitY-H*.13,W,H*.22);
  for(let i=0;i<4;i++){const fl=RZ.flash[i]&&now-RZ.flash[i]<170;if(fl||RZ.held.has(i)){const gr=g.createLinearGradient(0,hitY+H*.1,0,hitY-H*.45);gr.addColorStop(0,'rgba(47,196,232,.38)');gr.addColorStop(1,'rgba(47,196,232,0)');g.fillStyle=gr;g.fillRect(i*lw,hitY-H*.45,lw,H*.55)}
    const bd=RZ.badf[i]&&now-RZ.badf[i]<240;if(bd){g.fillStyle='rgba(224,74,85,'+(.4*(1-(now-RZ.badf[i])/240))+')';g.fillRect(i*lw,0,lw,H)}}
  g.fillStyle='#2fc4e8';g.fillRect(0,hitY-1.5*dpr,W,3*dpr);
  g.fillStyle='rgba(23,20,27,.45)';g.font='600 '+(11*dpr)+'px system-ui,sans-serif';g.textAlign='left';g.fillText('LINHA DE TOQUE',8*dpr,hitY+H*.045);
  const rr=(x,y,w,h,r)=>{r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
  if(s>-1){for(const nt of RZ.chart){const yb=hitY-(nt.t-s)*sp;if(yb<0) break;const h=nt.hf*H,yt=yb-h;if(yt>H) continue;const x=nt.lane*lw+3*dpr,w=lw-6*dpr;
      if(nt.hit&&!nt.holding){const k=(now-(nt.at||0))/260;if(k<1){g.globalAlpha=1-k;g.fillStyle='#2fc4e8';rr(x,yt,w,h,8*dpr);g.fill();g.globalAlpha=1}continue}
      g.globalAlpha=nt.res==='miss'?.45:1;const gr=g.createLinearGradient(0,yt,0,yb);gr.addColorStop(0,'#2a2530');gr.addColorStop(1,'#0f0c12');g.fillStyle=nt.res==='miss'?'#e04a55':gr;rr(x,yt,w,h,8*dpr);g.fill();
      if(nt.res!=='miss'){g.fillStyle='rgba(255,255,255,.07)';g.fillRect(x+4*dpr,yt+4*dpr,w-8*dpr,3*dpr);if(nt.sus){g.strokeStyle='rgba(255,255,255,.16)';g.lineWidth=2*dpr;g.setLineDash([6*dpr,8*dpr]);g.beginPath();g.moveTo(x+w/2,yt+14*dpr);g.lineTo(x+w/2,yb-16*dpr);g.stroke();g.setLineDash([])}
        g.fillStyle='#2fc4e8';g.fillRect(x+6*dpr,yb-7*dpr,w-12*dpr,4*dpr)}
      if(nt.holding&&yb>hitY){g.save();rr(x,yt,w,h,8*dpr);g.clip();g.fillStyle='rgba(47,196,232,.85)';g.fillRect(x,Math.max(yt,hitY),w,yb-Math.max(yt,hitY));g.restore()}
      g.globalAlpha=1}}
  const lv=RZ.lives;g.textAlign='left';g.font='700 '+(22*dpr)+'px system-ui,sans-serif';for(let i=0;i<3;i++){g.fillStyle=i<lv?'#e04a55':'rgba(0,0,0,.18)';g.fillText('♥',10*dpr+i*26*dpr,28*dpr)}
  const pl=RZ.pops.length?RZ.pops[RZ.pops.length-1]:null;if(pl&&now-pl.t<600){const a=1-(now-pl.t)/600;g.globalAlpha=a;g.textAlign='center';g.font='800 '+(20*dpr)+'px system-ui,sans-serif';g.lineWidth=4*dpr;g.strokeStyle='rgba(239,233,220,.95)';const tx=pl.lane*lw+lw/2,ty=hitY-H*.16-(1-a)*18*dpr;g.strokeText(pl.txt,tx,ty);g.fillStyle={pp:'#13a3c2',perfect:'#13a3c2',great:'#3d8f4a',good:'#a77b14',miss:'#d03846'}[pl.res]||'#222';g.fillText(pl.txt,tx,ty);g.globalAlpha=1}
  if(s>-1&&RZ.A&&s<RZ.A.lead*16*RZ.A.st){const beat=4*RZ.A.st;const cnt=4-Math.floor(Math.max(0,s)/beat);if(cnt>0&&cnt<=4){g.fillStyle='rgba(23,20,27,.82)';g.font='800 '+(70*dpr)+'px system-ui,sans-serif';g.textAlign='center';g.fillText(String(cnt),W/2,H*.42)}}
  if(RZ.phase==='pause'){g.fillStyle='rgba(13,11,13,.72)';g.fillRect(0,0,W,H);g.fillStyle='#F3E7D4';g.font='800 '+(30*dpr)+'px system-ui,sans-serif';g.textAlign='center';g.fillText('PAUSA',W/2,H*.45)}
  if(s>0&&RZ.A){g.fillStyle='rgba(217,32,49,.9)';g.fillRect(0,0,W*Math.min(1,s/RZ.A.dur),3*dpr)}}
function rzArrow(g,x,y,r,lane,col,fill){g.save();g.translate(x,y);g.rotate([Math.PI,Math.PI/2,-Math.PI/2,0][lane]);g.beginPath();g.moveTo(r,0);g.lineTo(0,-r);g.lineTo(0,-r*.45);g.lineTo(-r,-r*.45);g.lineTo(-r,r*.45);g.lineTo(0,r*.45);g.lineTo(0,r);g.closePath();if(fill){g.fillStyle=col;g.fill();g.lineWidth=r*.16;g.strokeStyle='rgba(0,0,0,.6)';g.stroke()}else{g.lineWidth=r*.18;g.strokeStyle=col;g.stroke()}g.restore()}
function rzDrawSetas(g,W,H,dpr){const s=rzSNow();const now=performance.now();const top=H*.12,speed=H*.62*RZ_WIN[RZ.diff].spd;const lw=W/9,r=lw*.4;const colX=(side,l)=>side?W/2+lw*.5+l*lw+lw/2:lw*.5+l*lw;
  const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0e1a2e');bg.addColorStop(1,'#25102a');g.fillStyle=bg;g.fillRect(0,0,W,H);for(let i=0;i<30;i++){g.fillStyle='rgba(255,255,255,'+(.15+((i*37)%10)/40)+')';g.fillRect((i*97)%W,(i*53)%(H*.5),1.5*dpr,1.5*dpr)}
  const stage=H*.78;g.fillStyle='#1b1220';g.fillRect(0,stage,W,H-stage);g.fillStyle='#d92031';g.fillRect(0,stage,W,3*dpr);
  const bob=Math.sin(now/180)*3*dpr;const fig=(x,flip,c1,c2,hair,ex)=>{g.save();g.translate(x,stage-4*dpr+bob*(ex?1:-1));g.scale(flip?-1:1,1);const u=dpr;g.fillStyle=c2;g.fillRect(-10*u,-50*u,20*u,30*u);g.fillStyle='#f0c9a5';g.beginPath();g.arc(0,-62*u,11*u,0,7);g.fill();g.fillStyle=hair;g.beginPath();g.arc(0,-66*u,12*u,Math.PI,2*Math.PI);g.fill();g.fillRect(-12*u,-66*u,5*u,18*u);g.fillStyle=c1;g.fillRect(-10*u,-20*u,8*u,20*u);g.fillRect(2*u,-20*u,8*u,20*u);g.fillStyle='#141015';g.fillRect(-14*u,-48*u,6*u,4*u);g.beginPath();g.arc(4*u,-62*u,1.6*u,0,7);g.fill();g.restore()};
  const L=state.avatar&&state.avatar.cur;fig(W*.22,false,'#2a3550','#5b8dd6','#14223a',false);fig(W*.78,true,L?AVO.cloth[L.bottomC][1]:'#1d1a1f',L?AVO.cloth[L.topC][1]:'#d92031',L?AVO.hairC[L.hairC][1]:'#3b2418',true);
  g.fillStyle='rgba(255,255,255,.12)';g.fillRect(W*.2,H*.94,W*.6,8*dpr);g.fillStyle='#5b8dd6';g.fillRect(W*.2,H*.94,W*.6*(1-RZ.health),8*dpr);g.fillStyle='#3ed16a';g.fillRect(W*.2+W*.6*(1-RZ.health),H*.94,W*.6*RZ.health,8*dpr);
  [0,1].forEach(side=>{for(let l=0;l<4;l++){const x=colX(side,l);const fl=side?(RZ.flash[l]&&now-RZ.flash[l]<130)||RZ.held.has(l):RZ.flash['c'+l]&&now-RZ.flash['c'+l]<130;rzArrow(g,x,top,r,l,fl?RZ_ARROW[l][1]:'rgba(200,210,230,.55)',fl)}});
  if(s>-1){for(const nt of RZ.chart){const y=top+(nt.t-s)*speed;if(y>H+40*dpr) break;const side=nt.cpu?0:1;const x=colX(side,nt.lane);if(nt.sus){const y2=top+(nt.t+nt.sus-s)*speed;const show=nt.cpu?nt.t+nt.sus>s:(!nt.hit||nt.holding);if(show&&y2>top){g.fillStyle=RZ_ARROW[nt.lane][1]+'aa';g.fillRect(x-r*.22,Math.max(top,y),r*.44,y2-Math.max(top,y))}}
      if(nt.hit||nt.res==='cpu'||y<top-r*1.2) continue;g.globalAlpha=nt.res==='miss'?.3:1;rzArrow(g,x,y,r,nt.lane,RZ_ARROW[nt.lane][1],true);g.globalAlpha=1}}
  rzPopsFx(g,l=>colX(1,l),top+80*dpr,dpr);rzCountdown(g,W,H,dpr,s)}
function rzHud(){const S=RZ.stats;if(!S) return;const set=(id,v)=>{const e=$(id);if(e) e.textContent=v};set('#rz-score',S.score.toLocaleString('pt-BR'));if(RZ.game==='tiles') set('#rz-lives','♥'.repeat(RZ.lives)+'♡'.repeat(Math.max(0,3-RZ.lives)));set('#rz-combo',S.combo);const judged=S.pp+S.perfect+S.great+S.good+S.miss;set('#rz-acc',judged?Math.round((S.pp+S.perfect+S.great*.75+S.good*.5)/judged*100)+'%':'—');const pb=$('#rz-pause');if(pb) pb.textContent=RZ.phase==='pause'?'Continuar':'Pausar'}
/* ---------- telas ---------- */
function rzFoldHTML(){var fs=(OPTS.folders?OPTS.folders():[]);var n=IMP.length,sem=IMP.filter(function(x){return !x.folder}).length;
  var chip=function(v,l,c){return '<button type="button" class="rz-fc'+((RZ.fold||'__all__')===v?' on':'')+'" data-act="rz-fold" data-v="'+esc(v)+'">'+esc(l)+' <span class="muted">'+c+'</span></button>'};
  return '<div class="rz-row rz-folds" role="group" aria-label="Pastas">'+chip('__all__','todas',n)+fs.map(function(f){return chip(f,'📁 '+f,IMP.filter(function(x){return x.folder===f}).length)}).join('')+(fs.length?chip('__none__','sem pasta',sem):'')+'<button type="button" class="rz-fc rz-fadd" data-act="rz-mfold">+ adicionar pasta</button></div>'}
function rzSelHTML(){var b=function(act,l,cls,v){return '<button type="button" class="rz-fc '+(cls||'')+'" data-act="'+act+'"'+(v!=null?' data-v="'+esc(v)+'"':'')+'>'+l+'</button>'};
  if(RZ.sel) return '<div class="rz-row rz-folds rz-selbar"><b>'+RZ.sel.size+' selecionada(s)</b>'+b('rz-selall','marcar todas as '+RZ.vis.length+' da lista')+b('rz-selnone','limpar')+(RZ.sel.size?b('rz-selmove','mover pra pasta…','rz-fadd'):'')+b('rz-seloff','cancelar')+'</div>';
  var real=RZ.fold&&RZ.fold!=='__none__';
  return '<div class="rz-row rz-folds">'+b('rz-selon','☑ selecionar várias')+(real?b('rz-fren','renomear pasta')+b('rz-fdel','apagar pasta'):'')+'</div>'}
function rzMenu(){const R=ensureRitmo();const G=RZ_GAMES.find(x=>x[0]===RZ.game);const songs=rsAll(RZ.style).filter(s=>!RZ.q||normTxt(s.name).includes(normTxt(RZ.q))).filter(s=>RZ.style!=='imp'||!OPTS.onAddFolder||!RZ.fold||(RZ.fold==='__none__'?!s.folder:s.folder===RZ.fold));
  let h='<div class="rz-games" role="group" aria-label="Jogo">'+RZ_GAMES.map(([k,t,d,c])=>'<button type="button" class="rz-g'+(RZ.game===k?' on':'')+'" style="--gc:'+c+'" data-act="rz-game" data-v="'+k+'"><b>'+t+'</b><span>'+d+'</span></button>').join('')+'<button type="button" class="rz-g" style="--gc:#e8c07a" data-act="rz-fig"><b>Figuras rítmicas</b><span>ouça e identifique a figura, ditado de 4 tempos</span></button></div>';
  if(RZ.game==='hero'){h+='<div class="rz-row"><div class="segtabs rz-big-tabs" role="group" aria-label="Instrumento">'+Object.entries(RZ_INST).map(([k,v])=>'<button type="button" data-act="rz-inst" data-v="'+k+'" aria-pressed="'+(RZ.inst===k)+'">'+v.n+'</button>').join('')+'</div></div>';
    if(RZ.inst!=='guitarra'){const arr=RZ.inst==='bateria'?RZ_KIT_N:RZ_PIANO_N;const cur=RZ.kn[RZ.inst];h+='<div class="rz-row rz-countrow"><span class="rz-lbl">'+(RZ.inst==='bateria'?'Peças da bateria':'Teclas do teclado')+'</span><div class="segtabs rz-big-tabs" role="group" aria-label="Quantidade">'+arr.map(n=>'<button type="button" data-act="rz-kn" data-v="'+n+'" aria-pressed="'+(cur===n)+'">'+n+'</button>').join('')+'</div><p class="small muted rz-lanes">'+rzL().map(l=>esc(l[2])).join(' · ')+(RZ.inst==='piano'&&cur<7?' <span class="muted">(notas do acorde/pentatônica, o som é sempre o da tecla)</span>':'')+'</p></div>'}}
  if(RZ.game==='tiles') h+='<section class="panel rz-how"><b>Como funciona</b><ol><li>Os blocos pretos descem. Cada bloco é uma nota da música.</li><li>Toque na coluna do bloco quando a base dele encostar na <b style="color:#2fc4e8">linha azul</b>.</li><li>Bloco comprido: segure o dedo até acabar. Deixou passar: perde um ♥ (são 3).</li></ol><button type="button" class="btn btn-sm" data-act="rz-how">Ver com desenho</button></section>';
  h+='<div class="rz-row"><div class="segtabs rz-big-tabs" role="group" aria-label="Dificuldade">'+Object.entries(RZ_WIN).map(([k,v])=>'<button type="button" data-act="rz-diff" data-v="'+k+'" aria-pressed="'+(RZ.diff===k)+'">'+v.n+'</button>').join('')+'</div></div>';
  h+='<div class="rz-row rz-styles">'+RS_STYLES.map(([k,l,c])=>'<button type="button" class="rz-st'+(RZ.style===k?' on':'')+'" style="--sc:'+c+'" data-act="rz-style" data-v="'+k+'">'+l+'</button>').join('')+'</div>';
  if(RZ.style==='imp'&&midiOn()) h+='<div class="rz-row rz-imp"><button type="button" class="btn btn-sm btn-red" data-act="rz-midi">+ importar MIDI</button><span class="small muted">.mid, .midi ou um .zip com vários</span></div>';
  RZ.vis=songs.map(function(x){return x.id});
  if(RZ.style==='imp'&&OPTS.onAddFolder) h+=rzFoldHTML()+rzSelHTML();
  h+='<label class="sr-only" for="rz-q">Buscar música</label><input class="field rz-q" id="rz-q" type="search" placeholder="buscar música…" value="'+esc(RZ.q)+'">';
  h+='<ol class="rz-songs">'+songs.map(s=>{const bk=[RZ.game,RZ.game==='hero'?rzInstKey():'',RZ.diff,s.id].join('|');const b=R.best[bk];const hb=OPTS.hallTop?(OPTS.hallTop(bk)||[])[0]:null;return '<li class="rz-li"><button type="button" class="rz-song'+(RZ.sel&&RZ.sel.has(s.id)?' sel':'')+'" data-act="'+(RZ.sel?'rz-selt':'rz-play')+'" data-v="'+(RZ.sel?esc(s.id):s.i)+'"><span class="rz-n">'+(RZ.sel?(RZ.sel.has(s.id)?'✓':'○'):(s.i+1))+'</span><b>'+esc(s.name)+'</b><span class="small muted">'+s.bpm+' bpm · '+(s.minor?'menor':'maior')+(s.folder&&!RZ.fold?' · 📁 '+esc(s.folder):'')+(hb?' · 👑 '+esc(hb.name):'')+'</span>'+(b?'<span class="rz-b">'+(RZ.game==='beat'?'★'.repeat(b.stars||0):b.grade)+'</span>':'')+'</button>'+(s.hid&&!RZ.sel?'<span class="rz-macts"><button type="button" class="rz-mact" data-act="rz-mren" data-v="'+esc(s.id)+'">renomear</button><button type="button" class="rz-mact" data-act="rz-mmov" data-v="'+esc(s.id)+'">pasta</button></span>':'')+(s.local&&!RZ.sel?'<button type="button" class="rz-mdel" data-act="rz-mdel" data-v="'+esc(s.id)+'" aria-label="Apagar '+esc(s.name)+'">×</button>':'')+'</li>'}).join('')+'</ol>'+(RZ.style==='imp'&&!songs.length?'<p class="small muted rz-empty">'+(IMP.length?'nenhuma música com esse nome.':'nenhuma música importada ainda.')+'</p>':'');
  if(RZ.cal) h+=rzCalHTML();
  h+='<details class="panel"><summary class="small">Calibrar atraso do som</summary><div class="rz-calrow"><button type="button" class="btn btn-sm btn-red" data-act="rz-cal">Calibrar tocando (10 s)</button><span class="small muted">Toque junto com 8 cliques e eu acerto o atraso pra você.</span></div><div class="ctl-row"><input class="range" type="range" id="rz-off" min="-150" max="150" step="5" value="'+(ensureHero().offset||0)+'"><span class="est" id="rz-off-v">'+(ensureHero().offset||0)+' ms</span></div><p class="small muted">Se você acerta sempre um pouco atrasada, aumente. Fones bluetooth costumam pedir de 60 a 140 ms.</p></details>';
  if(RZ.style==='imp') h+='<p class="small muted">Importados: arquivos MIDI seus. '+(midiOn()?'Ficam guardados só neste navegador (não vão pra internet).':'O site guarda as suas músicas.')+' Use só arquivos que você tem direito de usar.</p>';
  h+='<p class="small muted">As 300 músicas são composições originais criadas pelo bm em cada estilo (sem direito autoral de terceiros). Teclado: '+(RZ.game==='hero'?rzL().map(l=>l[1]).join(' '):RZ.game==='beat'?'J K L (segure a tecla para notas longas; setas para deslizar)':RZ.game==='setas'?'setas ou A S W D':'A S D F')+' · espaço pausa. No toque, vale tocar em qualquer lugar da pista.</p>';return h}
function rzPlayView(){const L=RZ.game==='hero'?rzL():RZ.game==='beat'?[['#ff6ad5','J'],['#ffd84a','K'],['#5ee0ff','L']]:RZ.game==='setas'?RZ_ARROW.map(a=>[a[1],a[0]]):[];
  let pads='';if(RZ.game==='hero') pads='<div class="rz-pads rz-'+RZ.inst+' rz-n'+L.length+'" style="--n:'+L.length+'">'+L.map((l,i)=>'<button type="button" class="rz-pad" data-rl="'+i+'" style="--c:'+l[0]+'"><span>'+(l[2]||'')+'</span></button>').join('')+'</div>';
  else if(RZ.game==='beat') pads='<div class="rz-pads rz-beat" style="--n:3">'+L.map((l,i)=>'<button type="button" class="rz-pad" data-rl="'+i+'" style="--c:'+l[0]+'"><span></span></button>').join('')+'</div>';
  else if(RZ.game==='setas') pads='<div class="rz-pads rz-setas" style="--n:4">'+L.map((l,i)=>'<button type="button" class="rz-pad" data-rl="'+i+'" style="--c:'+l[0]+'"><b>'+l[1]+'</b></button>').join('')+'</div>';
  return '<div class="rz-hud"><span>'+esc(RZ.song.name)+'</span><span>Pontos <b id="rz-score">0</b></span><span>Combo <b id="rz-combo">0</b></span><span>Precisão <b id="rz-acc">—</b></span>'+(RZ.game==='tiles'?'<span class="rz-lives" id="rz-lives" aria-label="Vidas"></span>':'')+'<button type="button" class="btn btn-sm" id="rz-pause" data-act="rz-pause">Pausar</button><button type="button" class="btn btn-sm btn-ghost" data-act="rz-quit">Sair</button></div>'
    +'<div class="rz-stage rz-st-'+RZ.game+'"><canvas id="rz-cv" role="img" aria-label="Pista do jogo de ritmo"></canvas></div>'+pads}
function rzTilesHowto(){const fromStart=RZ.howFrom==='start';
  const svg='<svg class="rz-howsvg" viewBox="0 0 200 150" aria-hidden="true"><rect width="200" height="150" fill="#efe9dc"/>'+[1,2,3].map(i=>'<line x1="'+i*50+'" y1="0" x2="'+i*50+'" y2="150" stroke="rgba(0,0,0,.15)"/>').join('')
    +'<rect x="104" y="6" width="42" height="34" rx="6" fill="#17141b"/><rect x="4" y="46" width="42" height="34" rx="6" fill="#17141b"/><rect x="154" y="56" width="42" height="64" rx="6" fill="#17141b"/><rect x="60" y="84" width="30" height="0" fill="#17141b"/><rect x="54" y="84" width="42" height="34" rx="6" fill="#17141b"/>'
    +'<rect x="60" y="111" width="30" height="4" fill="#2fc4e8"/><rect x="0" y="118" width="200" height="3" fill="#2fc4e8"/><rect x="0" y="100" width="200" height="30" fill="rgba(47,196,232,.12)"/>'
    +'<text x="100" y="142" text-anchor="middle" font-size="9" fill="#17141b" font-family="system-ui">linha de toque</text><text x="75" y="80" text-anchor="middle" font-size="30">👆</text><path d="M75 82 v-1" stroke="#17141b"/>'
    +'<text x="175" y="132" text-anchor="middle" font-size="8" fill="#fff" font-family="system-ui">segure</text></svg>';
  return '<section class="panel rz-howto"><span class="tag">Piano Tiles</span><h2 class="h2">Como jogar</h2>'+svg
    +'<ol class="rz-steps"><li><b>Os blocos pretos descem</b> e cada um é uma nota da música. Você toca a melodia.</li>'
    +'<li><b>Toque na coluna do bloco</b> quando a faixa azul da base dele encostar na <b style="color:#12a3c2">linha azul</b>. Não precisa acertar o bloco em cheio: vale qualquer lugar da coluna.</li>'
    +'<li><b>Bloco comprido?</b> Segure o dedo nele até acabar.</li>'
    +'<li><b>Se um bloco passar</b> sem você tocar, perde um ♥ (você tem 3). Tocar em coluna vazia só zera o combo.</li>'
    +'<li><b>Nota que você não toca fica muda.</b> A bateria e o baixo seguem tocando sozinhos.</li></ol>'
    +'<p class="small muted">No iPad, apoie as duas mãos e use os polegares. Dá pra tocar com vários dedos ao mesmo tempo. Com teclado: A S D F.</p>'
    +'<div class="actions">'+(fromStart?'<button type="button" class="btn btn-red rz-bigbtn" data-act="rz-go">Entendi, bora tocar</button>':'')+'<button type="button" class="btn btn-ghost" data-act="rz-menu">'+(fromStart?'Voltar':'Voltar ao menu')+'</button></div></section>'}
function rzCalHTML(){const C=RZ.cal;return '<section class="panel rz-cal"><b>Calibrar o atraso</b><p class="small">Ouça os cliques e toque no botão <b>junto com cada um</b>. Os 4 primeiros são só pra ouvir; depois valem 8.</p><button type="button" class="rz-calpad" id="rz-calpad">TOQUE NO CLIQUE</button><p class="small" id="rz-calmsg">'+(C.msg||'Começando…')+'</p><div class="actions"><button type="button" class="btn btn-sm btn-ghost" data-act="rz-calx">Cancelar</button></div></section>'}
function rzCalStart(){AE.unlock();const c=AE.get();const bpm=100,spb=60/bpm,N=12,t0=c.currentTime+.9;RZ.cal={t0,spb,N,taps:[],msg:'Escute os 4 primeiros cliques…'};for(let i=0;i<N;i++) AE.drum('click',t0+i*spb,i%4===0?1:.7);
  clearTimeout(RZ.calT);RZ.calT=setTimeout(rzCalDone,(.9+N*spb+.7)*1000);rzRe()}
function rzCalTap(ev){const C=RZ.cal;if(!C) return;const c=AE.ctx;const tc=c.currentTime-Math.max(0,(performance.now()-ev.timeStamp)/1000);const i=Math.round((tc-C.t0)/C.spb);
  if(i>=4&&i<C.N&&Math.abs(tc-(C.t0+i*C.spb))<C.spb/2){C.taps.push(tc-(C.t0+i*C.spb));C.msg=C.taps.length+' de 8 toques'}else C.msg='Esse toque ficou longe do clique; tenta de novo.';
  const m=$('#rz-calmsg');if(m) m.textContent=C.msg}
function rzCalDone(){const C=RZ.cal;if(!C) return;RZ.cal=null;const t=C.taps.slice().sort((a,b)=>a-b);
  if(t.length<4){toast('Poucos toques. Tente de novo, bem junto com os cliques.');rzRe();return}
  const med=t[Math.floor(t.length/2)];const ms=Math.max(-150,Math.min(150,Math.round((med-AE.lat())*1000/5)*5));ensureHero().offset=ms;save();
  toast('Pronto: atraso ajustado para '+ms+' ms (você tocou em média '+Math.round(med*1000)+' ms depois do clique).');rzRe()}
function rzHallHTML(){if(!OPTS.hallTop) return '';var S=RZ.stats;var top=OPTS.hallTop(S.hallKey)||[];var h='';
  if(S.hallQ&&!S.hallDone) h+='<div class="rz-hall-new"><b>🏆 NOVO RECORDE! Entre pro ranking</b><div class="rz-hall-form"><input id="rz-hn" class="field" type="text" maxlength="40" autocomplete="name" placeholder="seu nome completo" value="'+esc(ensureRitmo().lastName||'')+'"><button type="button" class="btn btn-red" data-act="rz-hall">Gravar</button></div></div>';
  if(top.length) h+='<div class="rz-hall"><b class="rz-hall-t">🏆 Ranking desta música</b><ol>'+top.slice(0,5).map(function(e,i){return '<li class="'+(S.hallMe===e.at+e.name?'me':'')+'"><span class="rz-hp">'+(i+1)+'º</span><span class="rz-hn">'+esc(e.name)+'</span><b>'+Number(e.score).toLocaleString('pt-BR')+'</b><span class="muted">'+esc(e.grade||'')+'</span></li>'}).join('')+'</ol></div>';
  return h}
function rzEndView(){const S=RZ.stats;const G=RZ_GAMES.find(x=>x[0]===RZ.game);return '<section class="panel rz-end"><span class="tag">'+esc(G[1])+(RZ.game==='hero'?' · '+RZ_INST[RZ.inst].n+(RZ.inst==='bateria'?' '+RZ.kn.bateria+' peças':RZ.inst==='piano'?' '+RZ.kn.piano+' teclas':''):'')+' · '+RZ_WIN[RZ.diff].n+'</span><h2 class="h2">'+esc(RZ.song.name)+'</h2>'
  +(S.lost?'<p class="rz-big">'+(RZ.game==='setas'?'O rival venceu essa':RZ.game==='tiles'?'Acabaram os corações':'Tecla errada!')+'</p>':'<p class="rz-big">'+(RZ.game==='beat'?'★'.repeat(S.stars)+'<span class="rz-off">'+'★'.repeat(5-S.stars)+'</span>':S.grade)+'</p>')
  +'<p>'+(S.score.toLocaleString('pt-BR')+' pontos · precisão '+Math.round(S.acc*100)+'% · combo máximo '+S.maxCombo)+(S.record?' · <b>recorde!</b>':'')+'</p>'+rzHallHTML()
  +('<p class="small muted">'+(RZ.game==='beat'?'Perfeito+: '+S.pp+' · ':'')+'Perfeito: '+S.perfect+' · '+(RZ.game==='beat'?'Ótimo: '+S.great+' · ':'')+'Bom: '+S.good+' · Errou: '+S.miss+'</p>')
  +'<div class="actions"><button type="button" class="btn btn-red" data-act="rz-again">Jogar de novo</button><button type="button" class="btn" data-act="rz-next">Próxima música</button><button type="button" class="btn btn-ghost" data-act="rz-menu">Escolher música</button></div></section>'}
function viewRitmo(){const G=RZ_GAMES.find(x=>x[0]===RZ.game);const playing=RZ.phase==='play'||RZ.phase==='pause';return '<div class="view rzv rz-'+RZ.game+'-v'+(playing?' rz-playing':'')+'">'+(RZ.phase==='menu'?rzMenu():RZ.phase==='howto'?rzTilesHowto():RZ.phase==='end'?rzEndView():rzPlayView())+'</div>'}
function rzRe(){if(route()!=='ritmo') return;const y=window.scrollY;VIEW().innerHTML=viewRitmo();setPlaying();if(RZ.phase==='play'||RZ.phase==='pause'){rzBind();rzHud()}else window.scrollTo(0,y)}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&RZ.phase==='play') rzPause();else if(!document.hidden&&(RZ.phase==='play'||RZ.phase==='pause')) rzWake(true)});
document.addEventListener('click',ev=>{const a=ev.target.closest('[data-act^="rz-"]');if(!a||route()!=='ritmo') return;const act=a.dataset.act;if(act==='rz-fig'){showFiguras();return}if(act==='rz-midi'){mPick();return}if(act==='rz-mdel'){mDel(a.dataset.v);return}if(act==='rz-mren'){if(OPTS.onRename) OPTS.onRename(a.dataset.v);return}if(act==='rz-mmov'){if(OPTS.onMove) OPTS.onMove(a.dataset.v);return}if(act==='rz-hall'){var hn=$('#rz-hn'),nm=hn?hn.value.replace(/\s+/g,' ').trim():'';if(!nm){if(hn) hn.focus();return}var S2=RZ.stats,R2=ensureRitmo();R2.lastName=nm;save();var at=nowIso();if(OPTS.hallAdd) OPTS.hallAdd(S2.hallKey,{name:nm,score:S2.score,acc:Math.round(S2.acc*100),grade:S2.grade,stars:S2.stars,at:at});S2.hallDone=true;S2.hallMe=at+nm;rzRe();return}if(act==='rz-mfold'){if(OPTS.onAddFolder) OPTS.onAddFolder();return}if(act==='rz-selt'&&RZ.sel){var sid=a.dataset.v;if(RZ.sel.has(sid)) RZ.sel.delete(sid);else RZ.sel.add(sid);var son=RZ.sel.has(sid);a.classList.toggle('sel',son);var snn=a.querySelector('.rz-n');if(snn) snn.textContent=son?'✓':'○';var sbb=document.querySelector('.rz-selbar b');if(sbb) sbb.textContent=RZ.sel.size+' selecionada(s)';if(!!RZ.sel.size!==!!document.querySelector('[data-act="rz-selmove"]')) rzRe();return}if(act==='rz-selmove'){if(OPTS.onMoveMany&&RZ.sel&&RZ.sel.size) OPTS.onMoveMany([...RZ.sel],function(ok){if(ok){RZ.sel=null;rzRe()}});return}if(act==='rz-fren'){if(OPTS.onRenameFolder) OPTS.onRenameFolder(RZ.fold,function(nn){RZ.fold=nn;rzRe()});return}if(act==='rz-fdel'){if(OPTS.onDelFolder) OPTS.onDelFolder(RZ.fold,function(ok){if(ok){RZ.fold='';rzRe()}});return}
  if(act==='rz-game'){RZ.game=a.dataset.v}else if(act==='rz-inst'){RZ.inst=a.dataset.v}else if(act==='rz-kn'){RZ.kn[RZ.inst]=+a.dataset.v;const R=ensureRitmo();R.kn=Object.assign({},RZ.kn);saveSoon()}
  else if(act==='rz-how'){RZ.howFrom='menu';RZ.phase='howto'}else if(act==='rz-go'){const R=ensureRitmo();R.tilesSeen=1;save();rzStart(RZ.song);return}
  else if(act==='rz-cal'){rzCalStart();return}else if(act==='rz-calx'){clearTimeout(RZ.calT);RZ.cal=null}else if(act==='rz-diff'){RZ.diff=a.dataset.v}else if(act==='rz-fold'){RZ.fold=a.dataset.v==='__all__'?'':a.dataset.v}else if(act==='rz-selon'){RZ.sel=new Set()}else if(act==='rz-seloff'){RZ.sel=null}else if(act==='rz-selnone'){RZ.sel=new Set()}else if(act==='rz-selall'){RZ.vis.forEach(function(i){RZ.sel.add(i)})}else if(act==='rz-selt'){if(RZ.sel.has(a.dataset.v)) RZ.sel.delete(a.dataset.v);else RZ.sel.add(a.dataset.v)}else if(act==='rz-style'){RZ.style=a.dataset.v}
  else if(act==='rz-play'){const sg=rsSong(RZ.style,+a.dataset.v);if(RZ.game==='tiles'&&!ensureRitmo().tilesSeen){RZ.song=sg;RZ.howFrom='start';RZ.phase='howto';rzRe();window.scrollTo(0,0);return}rzStart(sg);return}else if(act==='rz-again'){rzStart(RZ.song);return}else if(act==='rz-next'){rzStart(rsSong(RZ.song.style,(RZ.song.i+1)%(RZ.song.style==='imp'?Math.max(1,IMP.length):50)));return}
  else if(act==='rz-menu'||act==='rz-quit'){rzStop();RZ.phase='menu'}else if(act==='rz-pause'){if(RZ.phase==='play') rzPause();else rzResume();return}
  rzRe()});
document.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target&&ev.target.id==='rz-hn'){var b=document.querySelector('[data-act="rz-hall"]');if(b) b.click()}});
document.addEventListener('input',ev=>{if(ev.target.id==='rz-q'){RZ.q=ev.target.value;const pos=ev.target.selectionStart;clearTimeout(RZ.qt);RZ.qt=setTimeout(function(){if(!ROOT) return;const y=window.scrollY;VIEW().innerHTML=viewRitmo();const i=$('#rz-q');if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch(e){}}window.scrollTo(0,y)},180)}else if(ev.target.id==='rz-off'){ensureHero().offset=+ev.target.value;const v=$('#rz-off-v');if(v) v.textContent=ev.target.value+' ms';saveSoon()}});
/* toque: pads com segurar e deslizar */
function rzLaneAtX(x,r){const u=(x-r.left)/r.width;const n=RZ.game==='hero'?rzL().length:RZ.game==='beat'?3:4;
  let v=RZ.game==='hero'?(u-.02)/.96:RZ.game==='beat'?(u-.1)/.8:u;return Math.max(0,Math.min(n-1,Math.floor(v*n)))}
function rzDown(ev,lane){ev.preventDefault();RZ.press.set(ev.pointerId,{lane,x:ev.clientX,y:ev.clientY,sw:false});RZ.held.add(lane);$$('[data-rl="'+lane+'"]').forEach(e=>e.classList.add('on'));
  const s=RZ.phase==='play'?rzTime():0;const next=RZ.chart.find(n=>!n.res&&!n.cpu&&n.lane===lane&&Math.abs(n.t-s)<.15);if(!(next&&next.sw)) rzHit(lane)}
document.addEventListener('pointerdown',ev=>{if(route()!=='ritmo') return;if(ev.target.closest('#rz-calpad')){ev.preventDefault();rzCalTap(ev);return}
  const p=ev.target.closest('[data-rl]');if(p){rzDown(ev,+p.dataset.rl);return}
  const cv=ev.target.closest('#rz-cv');if(cv&&RZ.phase==='play'){rzDown(ev,rzLaneAtX(ev.clientX,cv.getBoundingClientRect()))}});
document.addEventListener('pointermove',ev=>{const P=RZ.press.get(ev.pointerId);if(!P||P.sw) return;const dx=ev.clientX-P.x,dy=ev.clientY-P.y;if(Math.hypot(dx,dy)>28){P.sw=true;const dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy<0?'u':'d');rzHit(P.lane,dir)}});
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,ev=>{const P=RZ.press.get(ev.pointerId);if(!P) return;RZ.press.delete(ev.pointerId);RZ.held.delete(P.lane);rzRelease(P.lane);$$('[data-rl="'+P.lane+'"]').forEach(e=>e.classList.remove('on'))}));
const RZ_KEYS=()=>RZ.game==='hero'?rzL().map(l=>l[1].toLowerCase()):RZ.game==='beat'?['j','k','l']:RZ.game==='setas'?['a','s','w','d']:RZ.game==='tiles'?['a','s','d','f']:[];
document.addEventListener('keydown',ev=>{if(route()!=='ritmo'||ev.metaKey||ev.ctrlKey||/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
  if(ev.key===' '||ev.key==='Escape'){if(RZ.phase==='play'){ev.preventDefault();rzPause()}else if(RZ.phase==='pause'){ev.preventDefault();rzResume()}return}if(ev.repeat||RZ.phase!=='play') return;
  let lane=RZ_KEYS().indexOf(ev.key.toLowerCase());let dir=null;if(RZ.game==='setas'&&lane<0) lane=RZ_ARROW.findIndex(a=>a[2]===ev.key);
  if(RZ.game==='beat'&&/^Arrow/.test(ev.key)){dir={ArrowUp:'u',ArrowLeft:'l',ArrowRight:'r'}[ev.key];const s=rzTime();const n=RZ.chart.find(x=>!x.res&&x.sw&&Math.abs(x.t-s)<.15);if(n&&dir){rzHit(n.lane,dir);ev.preventDefault()}return}
  if(lane<0) return;ev.preventDefault();RZ.held.add(lane);rzHit(lane,dir)});
document.addEventListener('keyup',ev=>{if(route()!=='ritmo') return;let lane=RZ_KEYS().indexOf(ev.key.toLowerCase());if(RZ.game==='setas'&&lane<0) lane=RZ_ARROW.findIndex(a=>a[2]===ev.key);if(lane<0) return;RZ.held.delete(lane);rzRelease(lane)});

/* ===== figuras rítmicas (módulo embutido) ===== */
/* Figuras rítmicas — jogo de ouvir e identificar células rítmicas (estilo "ditado rítmico").
   Independente: não depende do bm. Uso:
     RhythmFigures.mount(elemento, { audio, store, onXp })
   audio = { unlock(), ctx(), tick(tempo, volume), note(tempo, volume) }   (tempo em segundos do AudioContext)
   store = { load(): objeto, save(objeto) }   (opcional; guarda recordes)
   Dois jogos: "Qual figura?" (uma célula) e "Ditado de 4 tempos" (preencha as células que faltam). */
(function (global) {
  'use strict';

  /* p: 4 casas de semicolcheia por tempo. x = nota, r = pausa, . = continua a figura anterior */
  var CELLS = [
    { id: 'q',    p: 'x...', n: 'semínima' },
    { id: 'ee',   p: 'x.x.', n: '2 colcheias' },
    { id: 'ssss', p: 'xxxx', n: '4 semicolcheias' },
    { id: 'ess',  p: 'x.xx', n: 'colcheia + 2 semicolcheias' },
    { id: 'sse',  p: 'xxx.', n: '2 semicolcheias + colcheia' },
    { id: 'pq',   p: 'r...', n: 'pausa de semínima' },
    { id: 'ep',   p: 'x..x', n: 'colcheia pontuada + semicolcheia' },
    { id: 'ses',  p: 'xx.x', n: 'semicolcheia + colcheia + semicolcheia' },
    { id: 'spe',  p: 'xx..', n: 'semicolcheia + colcheia pontuada' },
    { id: 'epe',  p: 'x.r.', n: 'colcheia + pausa de colcheia' },
    { id: 'pee',  p: 'r.x.', n: 'pausa de colcheia + colcheia' },
    { id: 'ssp',  p: 'xxr.', n: '2 semicolcheias + pausa de colcheia' }
  ];
  var BY = {}; CELLS.forEach(function (c) { BY[c.id] = c; });
  var ORDER = CELLS.map(function (c) { return c.id; });

  function events(p) {
    var out = [];
    for (var i = 0; i < 4; i++) {
      var c = p.charAt(i);
      if (c === 'x' || c === 'r') out.push({ s: i, len: 1, rest: c === 'r' });
      else if (out.length) out[out.length - 1].len++;
    }
    return out;
  }

  /* ---------- notação em SVG ---------- */
  function restGlyph(kind, cx, Y) {
    if (kind === 4) {
      return '<path d="M' + (cx - 3) + ' ' + (Y - 18) + ' L' + (cx + 4) + ' ' + (Y - 9) + ' L' + (cx - 3) + ' ' + (Y - 2) + ' L' + (cx + 4) + ' ' + (Y + 7) +
        ' C' + (cx - 6) + ' ' + (Y + 6) + ' ' + (cx - 5) + ' ' + (Y + 15) + ' ' + (cx + 1) + ' ' + (Y + 18) + '" class="fg-rest"/>';
    }
    return '<path d="M' + (cx + 4) + ' ' + (Y - 16) + ' L' + (cx - 3) + ' ' + (Y + 12) + '" class="fg-rest"/>' +
      '<circle cx="' + (cx - 3) + '" cy="' + (Y - 9) + '" r="3.4" class="fg-fill"/>' +
      '<path d="M' + (cx - 1) + ' ' + (Y - 8) + ' Q' + (cx + 4) + ' ' + (Y - 9) + ' ' + (cx + 4.5) + ' ' + (Y - 15) + '" class="fg-rest thin"/>';
  }
  function cellSVG(p) {
    var E = events(p), Y = 54, STEM = 34;
    var xs = E.map(function (e) { return 22 + e.s * 25; });
    var sh = 60 - (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
    var X = xs.map(function (x) { return x + sh; });
    var g = '<line x1="6" y1="' + Y + '" x2="114" y2="' + Y + '" class="fg-staff"/>';
    var groups = [], cur = [];
    E.forEach(function (e, i) { if (!e.rest && e.len < 4) cur.push(i); else { if (cur.length) groups.push(cur); cur = []; } });
    if (cur.length) groups.push(cur);
    var inGroup = {};
    groups.forEach(function (gr) { if (gr.length > 1) gr.forEach(function (i) { inGroup[i] = true; }); });
    E.forEach(function (e, i) {
      var x = X[i];
      if (e.rest) { g += restGlyph(e.len >= 4 ? 4 : 8, x, Y); return; }
      g += '<ellipse cx="' + x + '" cy="' + Y + '" rx="7" ry="5" transform="rotate(-20 ' + x + ' ' + Y + ')" class="fg-fill"/>';
      if (e.len < 4 || true) g += '<line x1="' + (x + 6.2) + '" y1="' + (Y - 1.5) + '" x2="' + (x + 6.2) + '" y2="' + (Y - STEM) + '" class="fg-stem"/>';
      if (e.len === 3) g += '<circle cx="' + (x + 14) + '" cy="' + (Y - 5) + '" r="2.2" class="fg-fill"/>';
      if (e.len < 4 && !inGroup[i]) {
        g += '<path d="M' + (x + 6.2) + ' ' + (Y - STEM) + ' C' + (x + 6.2) + ' ' + (Y - STEM + 12) + ' ' + (x + 18) + ' ' + (Y - STEM + 14) + ' ' + (x + 15) + ' ' + (Y - STEM + 26) + '" class="fg-flag"/>';
      }
    });
    groups.forEach(function (gr) {
      if (gr.length < 2) return;
      var x1 = X[gr[0]] + 6.2, x2 = X[gr[gr.length - 1]] + 6.2, yb = Y - STEM;
      g += '<line x1="' + (x1 - 1.2) + '" y1="' + yb + '" x2="' + (x2 + 1.2) + '" y2="' + yb + '" class="fg-beam"/>';
      var k = 0;
      while (k < gr.length) {
        if (E[gr[k]].len === 1) {
          var j = k; while (j + 1 < gr.length && E[gr[j + 1]].len === 1) j++;
          if (j > k) g += '<line x1="' + (X[gr[k]] + 5) + '" y1="' + (yb + 7) + '" x2="' + (X[gr[j]] + 7.4) + '" y2="' + (yb + 7) + '" class="fg-beam"/>';
          else {
            var sx = X[gr[k]] + 6.2;
            if (k === 0) g += '<line x1="' + sx + '" y1="' + (yb + 7) + '" x2="' + (sx + 10) + '" y2="' + (yb + 7) + '" class="fg-beam"/>';
            else g += '<line x1="' + (sx - 10) + '" y1="' + (yb + 7) + '" x2="' + sx + '" y2="' + (yb + 7) + '" class="fg-beam"/>';
          }
          k = j + 1;
        } else k++;
      }
    });
    return '<svg viewBox="0 0 120 80" class="fg-svg" aria-hidden="true">' + g + '</svg>';
  }

  /* ---------- CSS (injetado uma vez; cores vêm de variáveis do site) ---------- */
  var CSS = '' +
    '.fg{--fg-bg:var(--char-2,#1b1720);--fg-card:var(--char-3,#2a2430);--fg-fg:var(--ivory,#f3e7d4);--fg-mut:var(--ivory-3,#a89c8c);--fg-ac:var(--red,#d92031);--fg-ok:#4fbf6a;--fg-bad:#e04a55;--fg-hi:#e8c07a;display:grid;gap:12px;color:var(--fg-fg);font-family:inherit;-webkit-tap-highlight-color:transparent}' +
    '.fg *{box-sizing:border-box}.fg button{font:inherit;color:inherit;touch-action:manipulation;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}' +
    '.fg-hud{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:14px}.fg-hud b{font-variant-numeric:tabular-nums}.fg-lives{color:var(--fg-bad);font-size:20px;letter-spacing:2px;flex:1}' +
    '.fg-menu{display:grid;gap:10px}.fg-mcard{display:grid;gap:4px;text-align:left;padding:16px;border:0;border-radius:14px;background:var(--fg-card);cursor:pointer;box-shadow:inset 0 -4px 0 var(--c,#4fbf6a)}.fg-mcard b{font-size:18px}.fg-mcard span{font-size:13px;color:var(--fg-mut)}' +
    '.fg-seg{display:flex;gap:6px}.fg-seg button{flex:1;min-height:48px;border:0;border-radius:10px;background:var(--fg-card);cursor:pointer;font-weight:600}.fg-seg button[aria-pressed="true"]{background:var(--fg-ac);color:#fff}' +
    '.fg-lbl{font-size:12px;opacity:.7;text-transform:uppercase;letter-spacing:.06em}' +
    '.fg-qbox{display:grid;place-items:center;min-height:150px;border-radius:16px;background:#3a8f4f;position:relative}.fg-qbox.ok{background:#2f7d45}.fg-qbox.bad{background:#a3333d}.fg-qbox .fg-q{font-size:72px;font-weight:800;color:#0f2b18;line-height:1}.fg-qbox .fg-svg{width:min(260px,70%);color:#fff}' +
    '.fg-qbox .fg-nm{position:absolute;bottom:8px;left:0;right:0;text-align:center;font-size:13px;color:#fff;opacity:.9}' +
    '.fg-play{min-height:60px;border:0;border-radius:14px;background:var(--fg-ac);color:#fff;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}.fg-play[disabled]{opacity:.6}' +
    '.fg-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px}.fg-opts.c3{grid-template-columns:repeat(3,1fr)}.fg-opts.c4{grid-template-columns:repeat(4,1fr)}' +
    '.fg-opt{display:grid;gap:2px;justify-items:center;align-content:center;min-height:112px;padding:8px 4px;border:0;border-radius:14px;background:var(--fg-card);cursor:pointer;box-shadow:inset 0 -4px 0 var(--oc,#7fb7ff)}.fg-opt .fg-svg{width:100%;max-width:130px;height:auto;color:var(--fg-fg)}.fg-opt small{font-size:11px;color:var(--fg-mut);line-height:1.15;text-align:center;padding:0 4px}' +
    '.fg-opt:active{filter:brightness(1.3)}.fg-opt.right{outline:3px solid var(--fg-ok)}.fg-opt.wrong{outline:3px solid var(--fg-bad)}.fg-opt[disabled]{opacity:.55}' +
    '.fg-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.fg-slot{display:grid;place-items:center;min-height:116px;border-radius:14px;background:var(--fg-card);position:relative;border:0;color:var(--fg-fg)}.fg-slot .fg-svg{width:100%;max-width:130px}' +
    '.fg-slot.miss{background:#d8c75a;color:#3a3200}.fg-slot.miss.cur{outline:3px solid #fff}.fg-slot.miss.filled{background:#5aa0d8;color:#06263f}.fg-slot.on{outline:3px solid var(--fg-hi)}.fg-slot.right{outline:3px solid var(--fg-ok)}.fg-slot.wrong{outline:3px solid var(--fg-bad)}' +
    '.fg-slot .fg-q{font-size:44px;font-weight:800}.fg-slot i{position:absolute;top:4px;left:8px;font-style:normal;font-size:11px;opacity:.6}' +
    '.fg-row{display:flex;gap:8px}.fg-row>*{flex:1}.fg-btn{min-height:52px;border:0;border-radius:12px;background:var(--fg-card);cursor:pointer;font-weight:700}.fg-btn.go{background:var(--fg-ac);color:#fff}.fg-btn[disabled]{opacity:.45}' +
    '.fg-end{display:grid;gap:10px;text-align:center;padding:18px;border-radius:16px;background:var(--fg-card)}.fg-big{font-size:52px;font-weight:800;color:var(--fg-hi)}' +
    '.fg-svg{display:block;overflow:visible}.fg-staff{stroke:currentColor;stroke-width:1.2;opacity:.35}.fg-fill{fill:currentColor}.fg-stem{stroke:currentColor;stroke-width:2.4;stroke-linecap:butt}.fg-beam{stroke:currentColor;stroke-width:5;stroke-linecap:butt}.fg-flag{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round}.fg-rest{fill:none;stroke:currentColor;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.fg-rest.thin{stroke-width:2.2}' +
    '.fg-note{font-size:13px;color:var(--fg-mut);margin:0}';

  function injectCSS() {
    if (document.getElementById('fg-css')) return;
    var st = document.createElement('style'); st.id = 'fg-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rnd(n) { return Math.floor(Math.random() * n); }

  function mount(root, opts) {
    opts = opts || {};
    injectCSS();
    var A = opts.audio, store = opts.store || { load: function () { return {}; }, save: function () { } };
    var best = {}; try { best = store.load() || {}; } catch (e) { best = {}; }
    var S = { phase: 'menu', mode: 'cell', bpm: 80, lives: 5, score: 0, streak: 0, correct: 0, q: null, given: [], miss: 0, fill: [], result: null, playing: false, hi: -1, names: true };
    var timers = [];
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function unlocked() { return ORDER.slice(0, Math.min(12, 3 + Math.floor(S.correct / 3))); }
    function optColor(i) { return ['#7fb7ff', '#e8c07a', '#c56f87', '#7fb77e', '#b48bff', '#ff9d4a'][i % 6]; }

    /* ---------- som ---------- */
    function schedule(ids, onBeat) {
      if (!A) return 0;
      A.unlock(); var c = A.ctx(); var spb = 60 / S.bpm, sl = spb / 4, t0 = c.currentTime + .18;
      for (var i = 0; i < 4; i++) A.tick(t0 + i * spb, i === 0 ? 1 : .75);
      var base = t0 + 4 * spb;
      ids.forEach(function (id, k) {
        A.tick(base + k * spb, .3);
        events(BY[id].p).forEach(function (e) { if (!e.rest) A.note(base + k * spb + e.s * sl, .9); });
        if (onBeat) later(function () { onBeat(k); }, (4 + k) * spb * 1000 + 180);
      });
      return (4 + ids.length) * spb * 1000 + 300;
    }
    function playQuestion() {
      if (S.playing) return; clearTimers(); S.playing = true; S.hi = -1;
      var ids = S.mode === 'cell' ? [S.q.id, S.q.id] : S.q.cells;
      var total = schedule(ids, function (k) { S.hi = S.mode === 'dict' ? k : -1; paint(); });
      paint();
      later(function () { S.playing = false; S.hi = -1; paint(); }, total);
    }
    function playIds(ids) { clearTimers(); S.playing = false; schedule(ids, null); }

    /* ---------- perguntas ---------- */
    function newQ() {
      var U = unlocked(), prev = S.q;
      if (S.mode === 'cell') {
        var id; do { id = U[rnd(U.length)]; } while (U.length > 1 && prev && prev.id === id);
        S.q = { id: id };
      } else {
        var cells = [], pool = U.filter(function (x) { return x !== 'pq'; }); if (!pool.length) pool = U;
        for (var i = 0; i < 4; i++) cells.push(pool[rnd(pool.length)]);
        if (U.indexOf('pq') >= 0 && Math.random() < .3) cells[rnd(3)] = 'pq';
        S.miss = Math.min(4, 1 + Math.floor(S.correct / 3));
        S.q = { cells: cells, miss: S.miss };
      }
      S.fill = []; S.result = null; paint();
      later(playQuestion, 450);
    }
    function start(mode) {
      clearTimers(); S.mode = mode; S.lives = 5; S.score = 0; S.streak = 0; S.correct = 0; S.phase = 'play'; S.playing = false; S.q = null;
      if (A) A.unlock(); newQ();
    }
    function finish() {
      clearTimers(); S.phase = 'end'; S.playing = false;
      var k = S.mode; S.rec = false;
      if (S.score > (best[k] || 0)) { best[k] = S.score; S.rec = true; try { store.save(best); } catch (e) { } }
      try { if (opts.onXp) opts.onXp(Math.min(20, 3 + Math.round(S.score / 20))); } catch (e) { }
      paint();
    }
    function after(ok) {
      if (!ok) S.lives--;
      paint();
      later(function () { if (S.lives <= 0) finish(); else newQ(); }, ok ? 1100 : 2200);
    }
    function answerCell(id) {
      if (S.result || S.phase !== 'play') return;
      var ok = id === S.q.id; S.result = { ok: ok, pick: id };
      if (ok) { S.score += 10 + Math.min(10, S.streak * 2); S.streak++; S.correct++; } else S.streak = 0;
      clearTimers(); S.playing = false; playIds([S.q.id]); after(ok);
    }
    function pickDict(id) {
      if (S.result || S.fill.length >= S.q.miss) return; S.fill.push(id); paint();
    }
    function checkDict() {
      if (S.result || S.fill.length < S.q.miss) return;
      var from = 4 - S.q.miss, ok = true;
      for (var i = 0; i < S.q.miss; i++) if (S.fill[i] !== S.q.cells[from + i]) ok = false;
      S.result = { ok: ok };
      if (ok) { S.score += 10 * S.q.miss + Math.min(10, S.streak * 2); S.streak++; S.correct++; } else S.streak = 0;
      clearTimers(); S.playing = false; playIds(S.q.cells); after(ok);
    }

    /* ---------- telas ---------- */
    function hud() {
      var hearts = ''; for (var i = 0; i < 5; i++) hearts += i < S.lives ? '♥' : '♡';
      return '<div class="fg-hud"><span class="fg-lives" aria-label="' + S.lives + ' vidas">' + hearts + '</span><span>Pontos <b>' + S.score + '</b></span><span>Recorde <b>' + (best[S.mode] || 0) + '</b></span><button type="button" class="fg-btn" style="flex:0 0 auto;min-height:40px;padding:0 14px" data-fg="menu">Sair</button></div>';
    }
    function optsHTML(U, handler) {
      var cls = U.length <= 3 ? ' c3' : U.length === 4 ? ' c4' : '';
      return '<div class="fg-opts' + cls + '">' + U.map(function (id, i) {
        var c = BY[id], st = '';
        if (S.result && S.mode === 'cell') { if (id === S.q.id) st = ' right'; else if (id === S.result.pick) st = ' wrong'; }
        return '<button type="button" class="fg-opt' + st + '" style="--oc:' + optColor(i) + '" data-fg="' + handler + '" data-id="' + id + '"' + (S.result ? ' disabled' : '') + ' aria-label="' + esc(c.n) + '">' + cellSVG(c.p) + (S.names ? '<small>' + esc(c.n) + '</small>' : '') + '</button>';
      }).join('') + '</div>';
    }
    function playBtn() { return '<button type="button" class="fg-play" data-fg="play"' + (S.playing ? ' disabled' : '') + '>' + (S.playing ? '♪ tocando…' : '▶ ouvir de novo') + '</button>'; }
    function viewCell() {
      var r = S.result, box;
      if (r) box = '<div class="fg-qbox ' + (r.ok ? 'ok' : 'bad') + '">' + cellSVG(BY[S.q.id].p) + '<div class="fg-nm">' + (r.ok ? 'Isso! ' : 'Era: ') + esc(BY[S.q.id].n) + '</div></div>';
      else box = '<div class="fg-qbox"><span class="fg-q">?</span></div>';
      return hud() + box + playBtn() + '<span class="fg-lbl">Qual figura você ouviu?</span>' + optsHTML(unlocked(), 'ans');
    }
    function viewDict() {
      var from = 4 - S.q.miss, slots = '';
      for (var i = 0; i < 4; i++) {
        var id = S.q.cells[i], cls = 'fg-slot', inner = '', tag = '';
        if (i < from) inner = cellSVG(BY[id].p);
        else {
          var k = i - from; cls += ' miss';
          if (S.result) { cls += S.fill[k] === id ? ' right' : ' wrong'; inner = cellSVG(BY[id].p); }
          else if (S.fill[k]) { cls += ' filled'; inner = cellSVG(BY[S.fill[k]].p); }
          else { inner = '<span class="fg-q">?</span>'; if (k === S.fill.length) cls += ' cur'; }
        }
        if (S.hi === i) cls += ' on';
        slots += '<div class="' + cls + '"><i>' + (i + 1) + '</i>' + inner + '</div>';
      }
      var ready = S.fill.length >= S.q.miss && !S.result;
      return hud() + '<div class="fg-slots">' + slots + '</div>' + playBtn() + '<span class="fg-lbl">Complete ' + (S.q.miss === 1 ? 'o tempo que falta' : 'os ' + S.q.miss + ' tempos que faltam') + '</span>' + optsHTML(unlocked(), 'pick')
        + '<div class="fg-row"><button type="button" class="fg-btn" data-fg="undo"' + (S.fill.length && !S.result ? '' : ' disabled') + '>↺ desfazer</button><button type="button" class="fg-btn go" data-fg="check"' + (ready ? '' : ' disabled') + '>CONFERIR</button></div>';
    }
    function viewMenu() {
      return '<div class="fg-menu"><button type="button" class="fg-mcard" style="--c:#4fbf6a" data-fg="start" data-mode="cell"><b>Qual figura?</b><span>Você ouve uma célula e escolhe a figura certa. Começa com 3 e vai liberando mais.</span></button>'
        + '<button type="button" class="fg-mcard" style="--c:#e8c07a" data-fg="start" data-mode="dict"><b>Ditado de 4 tempos</b><span>Ouça quatro tempos e complete os que faltam, na ordem. Depois toque em CONFERIR.</span></button>'
        + '<button type="button" class="fg-mcard" style="--c:#7fb7ff" data-fg="dict"><b>Dicionário de figuras</b><span>Todas as figuras com nome. Toque numa para ouvir.</span></button></div>'
        + '<span class="fg-lbl">Andamento</span><div class="fg-seg">' + [[60, 'devagar'], [80, 'normal'], [100, 'rápido']].map(function (x) { return '<button type="button" data-fg="bpm" data-v="' + x[0] + '" aria-pressed="' + (S.bpm === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>'
        + '<div class="fg-seg"><button type="button" data-fg="names" aria-pressed="' + S.names + '">' + (S.names ? 'nomes das figuras: ligados' : 'nomes das figuras: desligados') + '</button></div>'
        + '<p class="fg-note">Recordes: Qual figura? <b>' + (best.cell || 0) + '</b> · Ditado <b>' + (best.dict || 0) + '</b>. Use fones ou volume médio: o som é um bloco de madeira.</p>';
    }
    function viewDictionary() {
      return '<div class="fg-hud"><b style="flex:1">Dicionário de figuras</b><button type="button" class="fg-btn" style="flex:0 0 auto;min-height:40px;padding:0 14px" data-fg="menu">Voltar</button></div><p class="fg-note">Cada figura ocupa um tempo (uma semínima). Toque pra ouvir.</p><div class="fg-opts">'
        + CELLS.map(function (c, i) { return '<button type="button" class="fg-opt" style="--oc:' + optColor(i) + '" data-fg="hear" data-id="' + c.id + '">' + cellSVG(c.p) + '<small>' + esc(c.n) + '</small></button>'; }).join('') + '</div>';
    }
    function viewEnd() {
      return '<div class="fg-end"><span class="fg-lbl">' + (S.mode === 'cell' ? 'Qual figura?' : 'Ditado de 4 tempos') + '</span><div class="fg-big">' + S.score + '</div><p>' + S.correct + ' acertos' + (S.rec ? ' · <b>novo recorde!</b>' : '') + '</p><div class="fg-row"><button type="button" class="fg-btn go" data-fg="start" data-mode="' + S.mode + '">Jogar de novo</button><button type="button" class="fg-btn" data-fg="menu">Menu</button></div></div>';
    }
    var lastDictView = false;
    function paint() {
      var h = S.phase === 'menu' ? (S.dictionary ? viewDictionary() : viewMenu()) : S.phase === 'end' ? viewEnd() : !S.q ? hud() : (S.mode === 'cell' ? viewCell() : viewDict());
      root.innerHTML = '<div class="fg">' + h + '</div>';
    }

    /* ---------- eventos ---------- */
    function onClick(ev) {
      var b = ev.target.closest('[data-fg]'); if (!b || !root.contains(b)) return;
      var a = b.getAttribute('data-fg'), id = b.getAttribute('data-id');
      if (a === 'start') start(b.getAttribute('data-mode'));
      else if (a === 'menu') { clearTimers(); S.phase = 'menu'; S.dictionary = false; S.playing = false; paint(); }
      else if (a === 'dict') { S.dictionary = true; paint(); }
      else if (a === 'hear') { if (A) A.unlock(); playIds([id, id]); }
      else if (a === 'bpm') { S.bpm = +b.getAttribute('data-v'); paint(); }
      else if (a === 'names') { S.names = !S.names; paint(); }
      else if (a === 'play') playQuestion();
      else if (a === 'ans') answerCell(id);
      else if (a === 'pick') pickDict(id);
      else if (a === 'undo') { if (!S.result) { S.fill.pop(); paint(); } }
      else if (a === 'check') checkDict();
    }
    root.addEventListener('click', onClick);
    paint();
    return { destroy: function () { clearTimers(); root.removeEventListener('click', onClick); root.innerHTML = ''; } };
  }

  global.RhythmFigures = { mount: mount, CELLS: CELLS, cellSVG: cellSVG };
})(typeof window !== 'undefined' ? window : this);

var FGI=null;
function fgAudio(){return {unlock:function(){AE.unlock()},ctx:function(){return AE.get()},tick:function(t,v){AE.drum('click',t,v==null?.7:v)},note:function(t,v){AE.drum('wood',t,v==null?.9:v)}}}
function fgStore(){return {load:function(){return ensureRitmo().fig||{}},save:function(o){ensureRitmo().fig=o;saveSoon()}}}
function showFiguras(){rzStop(true);MODE='fg';ROOT.classList.remove('bmr-playing');var st=VIEW();st.innerHTML='<div class="bmr-fgbar"><button type="button" class="btn btn-sm btn-ghost" data-bmr="back">← jogos de ritmo</button></div><div class="bmr-fgbox"></div>';
  try{RhythmFigures.mount(st.querySelector('.bmr-fgbox'),{audio:fgAudio(),store:fgStore(),onXp:function(n,w){xpGain(n,w||'figuras rítmicas')}})}catch(e){st.querySelector('.bmr-fgbox').textContent='erro: '+e.message}}
function showRZ(game){MODE='rz';if(game) RZ.game=game;RZ.phase='menu';rzRe()}
/* ===== MIDI (gerado por tools/rhythm_midi_patch.py — não editar aqui) ===== */
var BMR_MIDI=(function(){
// Leitor mínimo de .zip (stored/deflate) usando DecompressionStream do navegador. Sem dependências.
async function inflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function readZip(buffer) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador não abre .zip. Envie os arquivos .md soltos.');
  const u8 = new Uint8Array(buffer), dv = new DataView(buffer);
  let e = u8.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Esse arquivo não parece um .zip válido.');
  const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = [];
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (name.endsWith('/') || name.startsWith('__MACOSX') || name.split('/').pop().startsWith('._')) continue;
    const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    const data = u8.subarray(start, start + csize);
    out.push({ name, read: async () => new Uint8Array(method === 0 ? data : await inflate(data)) });
  }
  return out;
}

// Leitor de arquivo MIDI (SMF formato 0 e 1): mapa de andamento, faixas, canais e notas em segundos.
// Puro (só bytes → objetos), testado em tests/midi.test.mjs. Nada sai do aparelho.

/** Lê um MIDI. Devolve { format, ppq, bpm (o primeiro andamento), tempos:[{tick, us}], tracks:[{name, notes:[{t, d, m, v, ch}], programs:{ch: prog}}], dur }. */
function parseMidi(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let p = 0;
  const str = (n) => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(b[p + i]); p += n; return s; };
  const u32 = () => { const v = (b[p] << 24 | b[p + 1] << 16 | b[p + 2] << 8 | b[p + 3]) >>> 0; p += 4; return v; };
  const u16 = () => { const v = b[p] << 8 | b[p + 1]; p += 2; return v; };
  const vlq = () => { let v = 0, c; do { c = b[p++]; v = (v << 7) | (c & 0x7f); } while (c & 0x80 && p < b.length); return v; };
  if (str(4) !== 'MThd') throw new Error('não é um arquivo MIDI');
  const hl = u32(); const format = u16(); const ntr = u16(); const div = u16(); p += hl - 6;
  if (div & 0x8000) throw new Error('MIDI com tempo SMPTE não é suportado');
  const ppq = div || 480;
  const raw = []; const tempos = [];
  for (let k = 0; k < ntr && p < b.length; k++) {
    // pula pedaços desconhecidos até achar uma faixa
    while (p + 8 <= b.length && String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]) !== 'MTrk') { p += 4; const len = u32(); p += len; }
    if (p + 8 > b.length) break;
    p += 4; const len = u32(); const end = Math.min(b.length, p + len);
    let tick = 0, status = 0; const ev = []; let name = ''; const programs = {};
    while (p < end) {
      tick += vlq();
      let st = b[p];
      if (st & 0x80) p++; else st = status; // running status
      if (st === 0xff) {
        const type = b[p++]; const l = vlq(); const at = p; p += l;
        if (type === 0x51 && l === 3) tempos.push({ tick, us: (b[at] << 16) | (b[at + 1] << 8) | b[at + 2] });
        else if (type === 0x03 && !name) { let s = ''; for (let i = 0; i < l; i++) s += String.fromCharCode(b[at + i]); name = s.trim(); }
        else if (type === 0x2f) break;
        continue;
      }
      if (st === 0xf0 || st === 0xf7) { const l = vlq(); p += l; continue; }
      status = st; const hi = st & 0xf0, ch = st & 0x0f;
      if (hi === 0x90 || hi === 0x80) { const m = b[p++], v = b[p++]; ev.push({ tick, on: hi === 0x90 && v > 0, m, v, ch }); }
      else if (hi === 0xc0) { programs[ch] = b[p++]; }
      else if (hi === 0xd0) p += 1;
      else p += 2; // a0, b0, e0
    }
    p = end; raw.push({ name, ev, programs });
  }
  tempos.sort((x, y) => x.tick - y.tick);
  if (!tempos.length || tempos[0].tick > 0) tempos.unshift({ tick: 0, us: 500000 });
  // tick → segundos pelo mapa de andamento
  const segs = []; let sec = 0;
  tempos.forEach((tp, i) => { if (i) sec += ((tp.tick - tempos[i - 1].tick) * tempos[i - 1].us) / ppq / 1e6; segs.push({ tick: tp.tick, sec, us: tp.us }); });
  const toSec = (tick) => { let s = segs[0]; for (const x of segs) { if (x.tick <= tick) s = x; else break; } return s.sec + ((tick - s.tick) * s.us) / ppq / 1e6; };
  let dur = 0;
  const tracks = raw.map((tr) => {
    const open = new Map(); const notes = [];
    for (const e of tr.ev) {
      const key = e.ch * 128 + e.m;
      if (e.on) { if (!open.has(key)) open.set(key, []); open.get(key).push(e); }
      else { const q = open.get(key); const s = q && q.shift(); if (s) { const t = toSec(s.tick); const d = Math.max(0.02, toSec(e.tick) - t); notes.push({ t, d, m: e.m, v: s.v, ch: e.ch }); dur = Math.max(dur, t + d); } }
    }
    // notas sem "desligar": duram um pouquinho
    for (const q of open.values()) for (const s of q) { const t = toSec(s.tick); notes.push({ t, d: 0.2, m: s.m, v: s.v, ch: s.ch }); dur = Math.max(dur, t + 0.2); }
    notes.sort((x, y) => x.t - y.t || x.m - y.m);
    return { name: tr.name, notes, programs: tr.programs };
  });
  return { format, ppq, bpm: Math.round((60e6 / tempos[0].us) * 100) / 100, tempos, tracks, dur };
}

// MIDI → fase dos jogos de ritmo (o mesmo "arranjo" que o pacote gera pras músicas dele):
// bateria do canal 10 vira as pistas do Palco/bateria, a faixa de melodia vira as notas da guitarra, do teclado,
// do Piano Tiles, do Beatstar e das Setinhas; baixo e acordes tocam no fundo. Puro, testado em tests/midi.test.mjs.

/** Bateria General MIDI → som e pista do pacote (0 bumbo, 1 caixa, 2 chimbal/pratos, 3 tons). */
const GM_DRUM = {
  35: 'kick', 36: 'kick', 37: 'snare', 38: 'snare', 39: 'snare', 40: 'snare',
  42: 'hhc', 44: 'hhc', 46: 'hho', 49: 'crash', 52: 'crash', 55: 'crash', 57: 'crash', 51: 'ride', 53: 'ride', 59: 'ride',
  48: 'tom1', 50: 'tom1', 45: 'tom2', 47: 'tom2', 41: 'floor', 43: 'floor',
};
const LANE = { kick: 0, snare: 1, hhc: 2, hho: 2, ride: 2, crash: 2, tom1: 3, tom2: 3, floor: 3 };
const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
// perfis de Krumhansl pra achar o tom
const KMAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KMIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/** Andamento que mais dura no arquivo (o primeiro às vezes é só um "120" padrão antes do de verdade). */
function mainBpm(midi) {
  const t = midi.tempos; if (!t.length) return 120;
  // tempo de cada trecho em segundos (o último vai até o fim da música)
  let sec = 0; const spans = t.map((x, i) => { const start = sec; if (i + 1 < t.length) sec += ((t[i + 1].tick - x.tick) * x.us) / midi.ppq / 1e6; return { us: x.us, start }; });
  spans.forEach((x, i) => { x.len = (i + 1 < spans.length ? spans[i + 1].start : Math.max(midi.dur, x.start)) - x.start; });
  const best = spans.reduce((a, b2) => (b2.len > a.len ? b2 : a));
  return Math.round((60e6 / best.us) * 10) / 10;
}

/** Tom (root como classe 0–11 e menor/maior) pelos pesos de duração das notas. */
function findKey(notes) {
  const w = Array(12).fill(0); notes.forEach((n) => { w[n.m % 12] += Math.min(n.d, 2); });
  const corr = (prof, r) => { const xs = prof.map((_, i) => w[(i + r) % 12]); const mx = xs.reduce((a, b) => a + b, 0) / 12, mp = prof.reduce((a, b) => a + b, 0) / 12;
    let n = 0, dx = 0, dp = 0; xs.forEach((x, i) => { n += (x - mx) * (prof[i] - mp); dx += (x - mx) ** 2; dp += (prof[i] - mp) ** 2; }); return dx && dp ? n / Math.sqrt(dx * dp) : 0; };
  let best = { root: 0, minor: false, c: -2 };
  for (let r = 0; r < 12; r++) { const a = corr(KMAJ, r), b2 = corr(KMIN, r); if (a > best.c) best = { root: r, minor: false, c: a }; if (b2 > best.c) best = { root: r, minor: true, c: b2 }; }
  return best;
}

/** Faixa de melodia: a mais "cantável" (monofônica, no meio do teclado, com nome de voz/melodia ganha bônus). */
function pickMelody(midi) {
  let best = null;
  midi.tracks.forEach((tr, i) => {
    const ns = tr.notes.filter((n) => n.ch !== 9); if (ns.length < 8) return;
    const avg = ns.reduce((s, n) => s + n.m, 0) / ns.length; if (avg < 50) return; // baixo
    let poly = 0; for (let k = 1; k < ns.length; k++) if (Math.abs(ns[k].t - ns[k - 1].t) < 0.03) poly++;
    const mono = 1 - poly / ns.length;
    const named = /voc|voz|vox|melod|lead|sing|canto|main/i.test(tr.name) ? 1.6 : 1;
    const score = Math.min(ns.length, 600) * (0.3 + mono) * (avg >= 55 && avg <= 84 ? 1 : 0.6) * named;
    if (!best || score > best.score) best = { i, score };
  });
  return best ? best.i : -1;
}

/** Uma nota por vez (a mais aguda quando batem juntas) e sem sobrepor a próxima. */
function skyline(notes) {
  const out = [];
  for (const n of notes) {
    const last = out[out.length - 1];
    if (last && Math.abs(n.t - last.t) < 0.03) { if (n.m > last.m) out[out.length - 1] = { ...n }; continue; }
    if (last && last.t + last.d > n.t) last.d = Math.max(0.05, n.t - last.t);
    out.push({ ...n });
  }
  return out;
}

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

/**
 * Monta a fase. Devolve { song, report } ou lança erro se não der pra jogar (sem bateria e sem melodia).
 * song = { id, style: 'imp', name, bpm, root, minor, seed, imported: true, arr: { st, mel, drums, ev, chords, dur, bars, lead } }.
 */
function toChart(midi, name = 'MIDI') {
  const bpm = Math.max(40, Math.min(240, mainBpm(midi)));
  const st = 60 / bpm / 4, barLen = 16 * st, lead = 1;
  const all = midi.tracks.flatMap((tr) => tr.notes);
  const drumsRaw = all.filter((n) => n.ch === 9 && GM_DRUM[n.m]);
  const mi = pickMelody(midi);
  const melRaw = mi >= 0 ? skyline(midi.tracks[mi].notes.filter((n) => n.ch !== 9)) : [];
  if (!drumsRaw.length && melRaw.length < 8) throw new Error('sem bateria (canal 10) e sem melodia');
  const pitched = all.filter((n) => n.ch !== 9);
  const key = findKey(pitched.length ? pitched : melRaw);
  // alinha: o compasso da primeira nota começa depois de 1 compasso de contagem
  const first = Math.min(...[...drumsRaw, ...melRaw, ...pitched].map((n) => n.t));
  const shift = lead * barLen - Math.floor(first / barLen + 1e-6) * barLen;
  const at = (t) => t + shift;
  const barOf = (t) => Math.floor((t + 1e-6) / barLen) - lead;
  const stepOf = (t) => Math.round(((t + 1e-6) % barLen) / st) % 16;
  const scale = key.minor ? MIN : MAJ; const root = 48 + key.root;
  const idxOf = (m) => { const rel = m - (root + 12); const oct = Math.floor(rel / 12); const pc = ((rel % 12) + 12) % 12;
    let bi = 0, bd = 99; scale.forEach((s, i) => { const d = Math.abs(s - pc); if (d < bd) { bd = d; bi = i; } }); return oct * 7 + bi; };
  const drums = drumsRaw.map((n) => { const snd = GM_DRUM[n.m]; const t = at(n.t); return { t, lane: LANE[snd], snd, v: Math.max(0.3, n.v / 127), bar: barOf(t), kind: 'verso' }; });
  // tira duplicata de pista no mesmo instante (ex.: duas caixas juntas)
  const seen = new Set(); const drumsU = drums.filter((d) => { const k = `${d.snd}|${Math.round(d.t * 200)}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const mel = melRaw.map((n) => { const t = at(n.t); const ds = Math.max(1, Math.min(16, Math.round(n.d / st))); return { t, m: n.m, idx: idxOf(n.m), d: n.d, ds, bar: barOf(t), step: stepOf(t), kind: 'verso' }; });
  // fundo: baixo e o resto das notas (acordes agrupados) — limite pra não pesar no celular
  const ev = [];
  const others = midi.tracks.flatMap((tr, i) => (i === mi ? [] : tr.notes.filter((n) => n.ch !== 9)));
  const bassNotes = others.filter((n) => n.m < 52); const restNotes = others.filter((n) => n.m >= 52);
  bassNotes.slice(0, 3000).forEach((n) => ev.push({ t: at(n.t), k: 'bass', m: n.m, d: Math.min(n.d, 2) }));
  const groups = []; restNotes.slice(0, 6000).forEach((n) => { const g = groups[groups.length - 1]; if (g && Math.abs(g.t - n.t) < 0.03) { if (g.ms.length < 5 && !g.ms.includes(n.m)) g.ms.push(n.m); g.d = Math.max(g.d, n.d); } else groups.push({ t: n.t, ms: [n.m], d: n.d }); });
  groups.sort((a, b2) => a.t - b2.t).slice(0, 2500).forEach((g) => ev.push({ t: at(g.t), k: 'chord', ms: g.ms, d: Math.min(g.d, 3), sty: 'pop' }));
  ev.sort((a, b2) => a.t - b2.t);
  const pre = []; for (let s = 0; s < 4; s++) pre.push({ t: s * 4 * st, k: 'click', v: s ? 0.6 : 1 });
  const end = Math.max(...[...drumsU, ...mel].map((n) => n.t + (n.d || 0.1)), ...ev.map((e) => e.t + (e.d || 0.1)));
  const bars = Math.max(1, Math.ceil(end / barLen) - lead);
  mel.sort((a, b2) => a.t - b2.t); drumsU.sort((a, b2) => a.t - b2.t);
  const song = {
    id: `imp-${hash(`${name}|${midi.tracks.length}|${all.length}|${Math.round(midi.dur)}`)}`, style: 'imp', name, bpm: Math.round(bpm), root, minor: key.minor, seed: 0, imported: true,
    arr: { st, mel, drums: drumsU, ev: pre.concat(ev), chords: [], dur: end + 1.5, bars, lead },
  };
  return { song, report: { drums: drumsU.length, melody: mel.length, bpm: Math.round(bpm), seconds: Math.round(end - lead * barLen), melodyTrack: mi >= 0 ? midi.tracks[mi].name || `faixa ${mi + 1}` : '' } };
}

/** Nome bonito a partir do arquivo ("01 - Artista - Música_drums.mid" → "Artista - Música"). */
const nameFromFile = (file) => String(file).split('/').pop().replace(/\.(mid|midi|kar)$/i, '').replace(/^\d+\s*[-_.]\s*/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'MIDI';

return { readZip: readZip, parseMidi: parseMidi, toChart: toChart, nameFromFile: nameFromFile };
})();
var readZip=BMR_MIDI.readZip,parseMidi=BMR_MIDI.parseMidi,toChart=BMR_MIDI.toChart,nameFromFile=BMR_MIDI.nameFromFile;
/* ===== fim MIDI ===== */
/* patch Beaterista v1.1: importar MIDI dentro do pacote. Guarda no IndexedDB do navegador, separado por storageKey.
   opts.midiImport:false desliga (o site guarda do jeito dele e passa as músicas por opts.songs / setSongs). */
var MEXT=[],MLOCAL=[],MDB=null;
function midiOn(){return OPTS.midiImport!==false}
function mergeImp(){var seen={};IMP=MEXT.concat(MLOCAL).filter(function(x){if(seen[x.id]) return false;seen[x.id]=1;return true}).sort(function(a,b){return String(a.name).localeCompare(String(b.name),'pt-BR')});if(ROOT&&MODE==='rz'&&RZ.phase==='menu') rzRe()}
function mdb(){if(MDB) return MDB;MDB=new Promise(function(ok,no){if(!global.indexedDB) return no(new Error('sem IndexedDB'));var r=indexedDB.open('bmr-midi',1);r.onupgradeneeded=function(){r.result.createObjectStore('songs',{keyPath:'id'}).createIndex('site','site')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}});return MDB}
function mreq(r){return new Promise(function(ok,no){r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
function mstore(mode){return mdb().then(function(db){return db.transaction('songs',mode).objectStore('songs')})}
function mLoad(){if(!midiOn()){MLOCAL=[];return Promise.resolve()}return mstore('readonly').then(function(st){return mreq(st.index('site').getAll(SKEY))}).then(function(rows){MLOCAL=rows.map(function(r){try{var c=toChart(parseMidi(new Uint8Array(r.bytes)),r.name).song;c.id=r.id;c.name=r.name;c.local=1;c.hid=1;c.folder=r.folder||'';return c}catch(e){return null}}).filter(Boolean);mergeImp()}).catch(function(){})}
function mImport(files){var items=[],ok=[],bad=[];
  return Array.prototype.reduce.call(files,function(p,f){return p.then(function(){
    if(/\.zip$/i.test(f.name)) return f.arrayBuffer().then(readZip).then(function(es){es.forEach(function(e){if(/\.(mid|midi|kar)$/i.test(e.name)&&!/(^|\/)(__MACOSX|\.)/.test(e.name)){var pp=e.name.split('/');items.push({name:e.name,read:e.read,folder:pp.length>1?pp[pp.length-2]:''})}})});
    if(/\.(mid|midi|kar)$/i.test(f.name)) items.push({name:f.name,read:function(){return f.arrayBuffer().then(function(b){return new Uint8Array(b)})}})})},Promise.resolve())
  .then(function(){return items.reduce(function(p,it){return p.then(function(){var name=nameFromFile(it.name);return it.read().then(function(bytes){if(bytes.length>2097152) throw new Error('arquivo grande demais');var r=toChart(parseMidi(bytes),name);
      return mstore('readwrite').then(function(st){return mreq(st.put({id:SKEY+'|'+r.song.id,site:SKEY,name:name,file:it.name.split('/').pop(),bytes:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),folder:it.folder||'',added:Date.now()}))}).then(function(){if(it.folder) pkAddFolderName(it.folder);ok.push(Object.assign({name:name},r.report))})}).catch(function(e){bad.push({name:name,why:e.message||'não consegui ler'})})})},Promise.resolve())})
  .then(function(){return mLoad()}).then(function(){var nd=ok.filter(function(x){return !x.drums}).length;toast(ok.length?ok.length+' música(s) em Importados ✓'+(nd?' · '+nd+' sem bateria':'')+(bad.length?' · '+bad.length+' não deu':''):'nenhum MIDI deu certo'+(bad.length?': '+bad[0].why:''));if(OPTS.onImport) try{OPTS.onImport({ok:ok,bad:bad})}catch(e){}return {ok:ok,bad:bad}})}
function mPick(){var i=document.createElement('input');i.type='file';i.multiple=true;i.accept='.mid,.midi,.kar,.zip,audio/midi,audio/x-midi,application/zip';i.style.display='none';i.className='rz-midi-input';(ROOT||document.body).appendChild(i);i.addEventListener('change',function(){var fs=Array.prototype.slice.call(i.files);i.remove();if(fs.length){toast('lendo os MIDIs…');mImport(fs)}});i.click()}
function mDel(id){if(!global.confirm('Apagar esta música importada?')) return;mstore('readwrite').then(function(st){return mreq(st.delete(id))}).then(mLoad).catch(function(){})}
/* ---- ATUALIZAÇÃO: pastas, renomear e ranking no modo local ----
   Quando o site NÃO passa os próprios callbacks (onRename, onMove, onAddFolder... hallTop/hallAdd), o pacote guarda tudo sozinho:
   músicas importadas no IndexedDB (campo folder/name) e a lista de pastas e o ranking no localStorage do mesmo storageKey. */
function pkModal(title,build){var back=document.createElement('div');back.className='bmr-modal';var box=document.createElement('div');box.className='bmr-sheet';box.setAttribute('role','dialog');box.setAttribute('aria-label',title);
  var hd=document.createElement('h3');hd.textContent=title;box.appendChild(hd);
  var onk=function(e){if(e.key==='Escape') close()};var close=function(){if(back.parentNode) back.parentNode.removeChild(back);document.removeEventListener('keydown',onk)};
  document.addEventListener('keydown',onk);back.addEventListener('click',function(e){if(e.target===back) close()});box.appendChild(build(close));back.appendChild(box);document.body.appendChild(back);return close}
function pkBtn(label,cls,fn){var b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=label;b.addEventListener('click',fn);return b}
function pkAsk(title,placeholder,initial,okLabel){return new Promise(function(res){var done=false;var fin=function(v){if(!done){done=true;res(v)}};
  pkModal(title,function(close){var wrap=document.createElement('div');var inp=document.createElement('input');inp.type='text';inp.className='field';inp.maxLength=60;inp.placeholder=placeholder;inp.value=initial||'';
    var go=function(){var v=inp.value.replace(/\s+/g,' ').trim();if(!v) return;fin(v);close()};inp.addEventListener('keydown',function(e){if(e.key==='Enter') go()});setTimeout(function(){inp.focus();inp.select()},50);
    var row=document.createElement('div');row.className='bmr-mrow';row.appendChild(pkBtn('Cancelar','btn-ghost',function(){fin(null);close()}));row.appendChild(pkBtn(okLabel||'Salvar','btn-red',go));wrap.appendChild(inp);wrap.appendChild(row);return wrap});})}
function pkSure(title,text,okLabel){return new Promise(function(res){var d=false;var fin=function(v){if(!d){d=true;res(v)}};
  pkModal(title,function(close){var w=document.createElement('div');var p=document.createElement('p');p.textContent=text;w.appendChild(p);var row=document.createElement('div');row.className='bmr-mrow';
    row.appendChild(pkBtn('Cancelar','btn-ghost',function(){fin(false);close()}));row.appendChild(pkBtn(okLabel||'Confirmar','btn-red',function(){fin(true);close()}));w.appendChild(row);return w})})}
function pkFolders(){var R=ensureRitmo(),set={};(R.folders||[]).forEach(function(f){set[f]=1});IMP.forEach(function(x){if(x.folder) set[x.folder]=1});return Object.keys(set).sort(function(a,b){return a.localeCompare(b,'pt-BR')})}
function pkAddFolderName(n){var R=ensureRitmo();R.folders=R.folders||[];if(R.folders.indexOf(n)<0){R.folders.push(n);save()}}
function pkAddFolder(){return pkAsk('Nova pasta','nome da pasta','','Criar').then(function(n){if(!n) return null;var ex=pkFolders().filter(function(f){return f.toLowerCase()===n.toLowerCase()})[0];if(ex){toast('essa pasta já existe');return ex}pkAddFolderName(n);toast('pasta criada ✓');rzRe();return n})}
function pkPickFolder(title,cur){return new Promise(function(res){var d=false;var fin=function(v){if(!d){d=true;res(v)}};
  pkModal(title,function(close){var w=document.createElement('div');w.className='bmr-mlist';
    var opt=function(l,f){w.appendChild(pkBtn(l,f===cur?'':'btn-ghost',function(){fin(f);close()}))};opt('sem pasta','');pkFolders().forEach(function(f){opt('📁 '+f,f)});
    w.appendChild(pkBtn('+ nova pasta','btn-ghost',function(){close();pkAddFolder().then(fin)}));return w})})}
function pkUpdate(id,patch){return mstore('readwrite').then(function(st){return mreq(st.get(id)).then(function(r){if(!r) return;Object.assign(r,patch);return mreq(st.put(r))})})}
function pkFind(id){return IMP.filter(function(x){return x.id===id})[0]}
function pkRename(id){var sg=pkFind(id);if(!sg) return;pkAsk('Renomear música','novo nome',sg.name,'Salvar').then(function(n){if(n&&n!==sg.name) pkUpdate(id,{name:n}).then(mLoad).then(function(){toast('renomeada ✓')})})}
function pkMove(id){var sg=pkFind(id);if(!sg) return;pkPickFolder('Pasta de "'+sg.name+'"',sg.folder||'').then(function(f){if(f===null||f===undefined) return;pkUpdate(id,{folder:f}).then(mLoad).then(function(){toast(f?'na pasta '+f+' ✓':'sem pasta ✓')})})}
function pkEach(ids,patch){return ids.reduce(function(p,id){return p.then(function(){return pkUpdate(id,patch)})},Promise.resolve())}
function pkMoveMany(ids,done){pkPickFolder('Mover '+ids.length+' música(s) pra…','').then(function(f){if(f===null||f===undefined) return;toast('movendo '+ids.length+'…');pkEach(ids,{folder:f}).then(mLoad).then(function(){toast(ids.length+' música(s) '+(f?'na pasta '+f:'sem pasta')+' ✓');done(true)})})}
function pkRenameFolder(old,done){pkAsk('Renomear pasta','novo nome da pasta',old,'Salvar').then(function(n){if(!n||n===old) return;
  if(pkFolders().some(function(f){return f!==old&&f.toLowerCase()===n.toLowerCase()})){toast('já existe a pasta '+n);return}
  var R=ensureRitmo();R.folders=(R.folders||[]).filter(function(f){return f!==old});R.folders.push(n);save();
  pkEach(IMP.filter(function(x){return x.folder===old&&x.local}).map(function(x){return x.id}),{folder:n}).then(mLoad).then(function(){toast('pasta renomeada ✓');done(n)})})}
function pkDelFolder(name,done){var ids=IMP.filter(function(x){return x.folder===name&&x.local}).map(function(x){return x.id});
  pkSure('Apagar a pasta "'+name+'"?',ids.length?'as '+ids.length+' música(s) dentro dela continuam, só ficam sem pasta.':'a pasta está vazia.','Apagar pasta').then(function(ok){if(!ok) return;
    var R=ensureRitmo();R.folders=(R.folders||[]).filter(function(f){return f!==name});save();pkEach(ids,{folder:''}).then(mLoad).then(function(){toast('pasta apagada ✓');done(true)})})}
function pkHallTop(k){var R=ensureRitmo();return (R.hall&&R.hall[k])||[]}
function pkHallAdd(k,e){var R=ensureRitmo();R.hall=R.hall||{};R.hall[k]=(R.hall[k]||[]).concat([e]).sort(function(a,b){return b.score-a.score}).slice(0,10);save()}
function pkLocalInit(){var O=OPTS,local=O.midiImport!==false;
  if(!O.hallTop&&!O.hallAdd){O.hallTop=pkHallTop;O.hallAdd=pkHallAdd}
  if(local&&!O.onAddFolder){O.folders=pkFolders;O.onRename=pkRename;O.onMove=pkMove;O.onMoveMany=pkMoveMany;O.onAddFolder=pkAddFolder;O.onRenameFolder=pkRenameFolder;O.onDelFolder=pkDelFolder}}
function bindRoot(){ROOT.addEventListener('click',function(ev){var b=ev.target.closest('[data-bmr="back"]');if(b){showRZ()}})}
function setPlaying(){if(ROOT) ROOT.classList.toggle('bmr-playing',MODE==='rz'&&(RZ.phase==='play'||RZ.phase==='pause'))}
function mount(el,opts){if(typeof el==='string') el=document.querySelector(el);if(!el) throw new Error('BeaterRhythm.mount: elemento não encontrado');
  if(ACTIVE) unmount();OPTS=Object.assign({},opts||{});pkLocalInit();if(OPTS.storageKey) SKEY=OPTS.storageKey;load();ROOT=el;ROOT.classList.add('bmr');ROOT.innerHTML='<div class="bmr-stage"></div>';if(!ROOT._bmr){ROOT._bmr=1;bindRoot()}
  ACTIVE=true;MODE='rz';var R=ensureRitmo();if(R.kn) Object.assign(RZ.kn,R.kn);RZ.phase='menu';
  /* patch Beaterista */ MEXT=(OPTS.songs||[]).filter(function(x){return x&&x.arr&&x.arr.mel&&x.arr.drums});MLOCAL=[];IMP=MEXT.slice();mLoad();if(OPTS.style&&RS_STYLES.some(function(x){return x[0]===OPTS.style})) RZ.style=OPTS.style;
  if(OPTS.game==='figuras') showFiguras();else{if(OPTS.game&&RZ_GAMES.some(function(g){return g[0]===OPTS.game})) RZ.game=OPTS.game;rzRe()}}
function unmount(){if(!ROOT) return;try{rzStop(true)}catch(e){}ACTIVE=false;ROOT.classList.remove('bmr','bmr-playing');ROOT.innerHTML='';ROOT=null}
global.BeaterRhythm={mount:mount,unmount:unmount,setSongs:setSongs,version:'1.2',importMidi:function(files){return mImport(files)},games:['hero','tiles','beat','setas','figuras']};
})(typeof window!=='undefined'?window:this);
