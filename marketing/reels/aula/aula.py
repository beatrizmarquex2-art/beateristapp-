#!/usr/bin/env python3
"""reels "aula do paul": o Paul animado ensinando, com o som sincronizado com o que acende na tela.
uso: python3 aula.py NOME PASTA_DOS_PAULS PASTA_DE_SAIDA [quadros de teste, ex.: 30,200]
NOME = batida | do | tati (ou "todas"). PASTA_DOS_PAULS = saída do marketing/ferramentas/paul_animado.py (pasta reels/)."""
import json,sys,os,subprocess,tempfile,wave,numpy as np
here=os.path.dirname(os.path.abspath(__file__)); sr=44100; rng=np.random.default_rng(7)
def env(d,k): t=np.arange(int(sr*d))/sr; return t,np.exp(-t*k)
def kick():
    t,e=env(0.35,14); f=45+110*np.exp(-t*35); return np.sin(2*np.pi*np.cumsum(f)/sr)*e
def snare():
    t,e=env(0.22,22); nz=rng.standard_normal(len(t)); nz=nz-np.convolve(nz,np.ones(6)/6,'same')
    return (nz*0.7+np.sin(2*np.pi*190*t)*0.5*np.exp(-t*30))*e*0.8
def hat():
    t,e=env(0.05,70); nz=np.diff(rng.standard_normal(len(t)),prepend=0); return nz*e*0.22
def crash():
    t,e=env(1.4,3.2); nz=np.diff(rng.standard_normal(len(t)),prepend=0); return nz*e*0.3
def clap():
    t,e=env(0.16,30); nz=rng.standard_normal(len(t)); nz=nz-np.convolve(nz,np.ones(10)/10,'same'); b=np.zeros(len(t))
    for d in (0,0.011,0.023): i=int(d*sr); b[i:]+=nz[:len(t)-i]*e[:len(t)-i]
    return b*0.4
def tick():
    t,e=env(0.03,150); return np.sin(2*np.pi*1500*t)*e*0.18
def piano(f,d=0.9):
    t=np.arange(int(sr*d))/sr; s=sum(np.sin(2*np.pi*f*h*t)*a for h,a in ((1,1),(2,.45),(3,.2),(4,.1),(5,.05)))
    return s*np.minimum(1,t*300)*np.exp(-t*3.5)*0.32
def bass(f,d):
    t=np.arange(int(sr*d))/sr; s=np.sin(2*np.pi*f*t)+0.35*np.sin(4*np.pi*f*t); return s*np.minimum(1,t*200)*np.exp(-t*5)*0.4
SND={'kick':kick,'snare':snare,'hat':hat,'crash':crash,'clap':clap,'tick':tick}
C4=261.63; NOTA=lambda n: C4*2**(n/12)
BR=[0,2,4,5,7,9,11,12,14,16,17,19,21,23]  # semitons das 14 teclas brancas a partir do dó

class L:
    def __init__(s,name,tag,paul,ms,bpm,end): s.d=dict(name=name,tag=tag,paul=paul,paulMs=ms,bpm=bpm,end=end,scenes=[],hits=[]); s.ev=[]; s.t=0; s.b=60/bpm
    def scene(s,beats,lines,board=None): s.d['scenes'].append(dict(t0=round(s.t,4),dur=round(beats*s.b,4),lines=lines,board=board)); s.t0=s.t; s.t+=beats*s.b
    def hit(s,beat,snd,ids=(),g=1.0,f=None):  # beat = posição dentro da cena atual
        t=s.t0+beat*s.b
        if snd: s.ev.append((t,snd,g,f))
        if ids: s.d['hits'].append(dict(t=round(t,4),ids=list(ids)))
    def groove(s,bars,k=True,sn=True,h=True,vol=1.0,ids=True,off=0):
        for bar in range(bars):
            o=off+bar*4
            for c in range(8):
                x=o+c/2; s.hit(x,None,['h%d'%c] if ids else [])
                if h: s.hit(x,'hat',['r0c%d'%c] if ids else [],vol*(1 if c%2==0 else .7))
                if sn and c in (2,6): s.hit(x,'snare',['r1c%d'%c] if ids else [],vol)
                if k and c in (0,4): s.hit(x,'kick',['r2c%d'%c] if ids else [],vol)
    def backing(s,beat,beats,vol=0.5):
        for i in range(int(beats)):
            r=(55.0,43.65,65.41,49.0)[(i//4)%4]; s.ev.append((s.t0+(beat+i)*s.b,'bass',vol,r))
    def done(s,endbeats=6):
        d=s.d; d['clipT']=round(s.t,4); s.t0=s.t
        s.ev.append((s.t,'crash',1,None)); s.ev.append((s.t,'kick',1,None)); s.scene_end=endbeats
        for bar in range(-(-endbeats//4)):
            for c in range(8):
                x=bar*4+c/2
                if x>=endbeats: break
                s.ev.append((s.t+x*s.b,'hat',.8 if c%2==0 else .5,None))
                if c in (2,6): s.ev.append((s.t+x*s.b,'snare',.8,None))
                if c in (0,4,5): s.ev.append((s.t+x*s.b,'kick',.9,None))
        s.backing(0,endbeats,.6); d['T']=round(s.t+endbeats*s.b,4); return s
    def wav(s,path):
        T=s.d['T']; n=int(sr*(T+0.3)); A=np.zeros(n)
        for t,snd,g,f in s.ev:
            sig=piano(f) if snd=='piano' else bass(f,s.b*.9) if snd=='bass' else SND[snd]()
            i=int(t*sr); j=min(n,i+len(sig))
            if i<n: A[i:j]+=sig[:j-i]*g
        A=np.tanh(A*1.2); m=int(sr*.5); A[-m:]*=np.linspace(1,0,m); A=A/np.max(np.abs(A))*.9
        st=(np.stack([A,A],1)*32767).astype('<i2'); w=wave.open(path,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st.tobytes()); w.close()

def batida():
    a=L('29_aula_do_paul_batida','aula do paul · bateria','bateria',120,100,dict(tag='agora é sua vez',h=['TOCA NA MESA','*E ME MARCA'],cta='SALVA PRA TREINAR',sub='mais aulas do Paul no app'))
    row=lambda k,sn,h: dict(type='grid',rows=[dict(label='CHIMBAL',k='h',on=list(range(8)),off=not h),dict(label='CAIXA',k='s',on=[2,6],off=not sn),dict(label='BUMBO',k='k',on=[0,4],off=not k)])
    a.scene(4,['A BATIDA MAIS','FAMOSA DO MUNDO','*EM 3 PASSOS'],row(1,1,1)); a.hit(0,'crash'); a.groove(1)
    a.scene(8,['1. BUMBO','*NO 1 E NO 3'],row(1,0,0)); a.groove(2,1,0,0)
    for i in range(8): a.hit(i,'tick')
    a.scene(8,['2. CAIXA','*NO 2 E NO 4'],row(1,1,0)); a.groove(2,1,1,0)
    for i in range(8): a.hit(i,'tick')
    a.scene(8,['3. CHIMBAL','*EM TODOS: 1 E 2 E…'],row(1,1,1)); a.groove(2)
    a.scene(8,['JUNTOU TUDO?','*VOCÊ TÁ TOCANDO ROCK'],row(1,1,1)); a.groove(2); a.backing(0,8)
    for i in range(4): a.hit(7+i/4,'snare',g=.5+.12*i)
    return a.done()
def do():
    a=L('30_aula_do_paul_cade_o_do','aula do paul · teclado','teclado',140,100,dict(tag='agora é sua vez',h=['ACHOU O DÓ?','*ME MARCA'],cta='SALVA PRA NÃO ESQUECER',sub='mais aulas do Paul no app'))
    K=lambda **k: dict(type='keys',**k)
    a.scene(4,['CADÊ O DÓ','*NO TECLADO?'],K()); a.hit(0,'crash',g=.6)
    for i,k in enumerate((0,4,7,11)): a.hit(i,'piano',['w%d'%k],f=NOTA(BR[k])/1)
    a.scene(8,['1. ACHA AS','*2 TECLAS PRETAS','JUNTINHAS'],K(blackMark=[0,1,5,6]))
    for i in range(8): a.hit(i,'tick',['b0','b1'] if i%4<2 else ['b5','b6'])
    a.scene(8,['2. O DÓ MORA','*À ESQUERDA DELAS'],K(blackMark=[0,1,5,6],mark=[0,7],labels={0:'DÓ',7:'DÓ'}))
    for i,k in enumerate((0,7,0,7)): a.hit(i*2,'piano',['w%d'%k],f=NOTA(BR[k]))
    a.scene(8,['3. DAÍ É SÓ SUBIR:','*DÓ RÉ MI FÁ SOL'],K(mark=[0],labels={0:'DÓ',1:'RÉ',2:'MI',3:'FÁ',4:'SOL'}))
    for i,k in enumerate((0,1,2,3,4,4,4)): a.hit(i if i<5 else 4, None)
    for i,k in enumerate((0,1,2,3,4)): a.hit(i,'piano',['w%d'%k],f=NOTA(BR[k]))
    for i,k in enumerate((4,2,0)): a.hit(5+i,'piano',['w%d'%k],f=NOTA(BR[k]))
    a.scene(8,['TODO TECLADO','DO MUNDO','*É ASSIM'],K(mark=[0,7],blackMark=[0,1,5,6],labels={0:'DÓ',7:'DÓ'})); a.backing(0,8,.45)
    for i,k in enumerate((0,2,4,7,4,2,0,0)): a.hit(i,'piano',['w%d'%k],f=NOTA(BR[k]))
    for i in range(8): a.hit(i+.5,'hat',g=.6)
    return a.done()
def tati():
    a=L('31_aula_do_paul_ta_e_titi','aula do paul · ritmo','professor',170,90,dict(tag='agora é sua vez',h=['CONSEGUIU?','*ME MARCA'],cta='SALVA PRA TREINAR',sub='mais aulas do Paul no app'))
    N=lambda *it: dict(type='notes',items=list(it))
    def fala(off,items,vol=1):
        for i,it in enumerate(items):
            a.hit(off+i,'tick',g=.8); a.hit(off+i,'clap',['n%da'%i],vol)
            if it=='e': a.hit(off+i+.5,'clap',['n%db'%i],vol)
    a.scene(4,['LER RITMO','É MAIS FÁCIL','*DO QUE PARECE'],N('q','e','q','q')); a.hit(0,'crash',g=.6); fala(0,['q','e','q','q'])
    a.scene(8,['1 SOM NO TEMPO:','*FALA "TA"'],N('q','q','q','q')); fala(0,['q']*4); fala(4,['q']*4)
    a.scene(8,['2 SONS NO TEMPO:','*FALA "TI-TI"'],N('e','e','e','e')); fala(0,['e']*4); fala(4,['e']*4)
    a.scene(8,['AGORA MISTURA','*E BATE PALMA'],N('q','e','q','q')); fala(0,['q','e','q','q']); fala(4,['q','e','q','q'])
    a.scene(8,['ÚLTIMO DESAFIO:','*LÊ SEM ERRAR'],N('e','q','e','q')); fala(0,['e','q','e','q']); fala(4,['e','q','e','q']); a.backing(0,8,.45)
    return a.done()
LIC=dict(batida=batida,do=do,tati=tati)
if __name__=='__main__':
    nomes=list(LIC) if sys.argv[1]=='todas' else [sys.argv[1]]; pauls=sys.argv[2]; out=sys.argv[3]; teste=sys.argv[4] if len(sys.argv)>4 else None
    os.makedirs(out,exist_ok=True)
    for nm in nomes:
        a=LIC[nm](); tmp=tempfile.mkdtemp(); sp=os.path.join(tmp,'spec.json'); json.dump(a.d,open(sp,'w'))
        fr=os.path.join(out,'teste_'+nm) if teste else os.path.join(tmp,'f')
        subprocess.check_call(['node',os.path.join(here,'render.js'),sp,pauls,fr]+([teste] if teste else []))
        if teste: print('quadros em',fr); continue
        wv=os.path.join(tmp,'a.wav'); a.wav(wv); mp=os.path.join(out,a.d['name']+'.mp4')
        subprocess.check_call(['ffmpeg','-v','error','-y','-framerate','30','-i',os.path.join(fr,'%05d.jpg'),'-i',wv,'-af','loudnorm=I=-14:TP=-1.5:LRA=11','-c:v','libx264','-preset','medium','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','44100','-movflags','+faststart','-t',str(a.d['T']),mp])
        print('ok',mp,a.d['T'],'s')
