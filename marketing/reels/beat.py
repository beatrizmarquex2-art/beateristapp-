import numpy as np, wave, sys
# uso: python3 beat.py saida.wav DURACAO INICIO_DO_CARTAO_FINAL (segundos, multiplos de 0.5; 120 bpm)
OUT=sys.argv[1]; T=float(sys.argv[2]); END=float(sys.argv[3]) if len(sys.argv)>3 else -1
sr=44100; bpm=120; b=60/bpm
n=int(sr*(T+0.5)); L=np.zeros(n); rng=np.random.default_rng(7)
def add(sig,t,g=1.0):
    i=int(t*sr)
    if i<0 or i>=n: return
    j=min(n,i+len(sig)); L[i:j]+=sig[:j-i]*g
def env(d,k): t=np.arange(int(sr*d))/sr; return t,np.exp(-t*k)
def kick():
    t,e=env(0.35,14); f=45+110*np.exp(-t*35); return np.sin(2*np.pi*np.cumsum(f)/sr)*e
def snare():
    t,e=env(0.22,22); nz=rng.standard_normal(len(t)); nz=nz-np.convolve(nz,np.ones(6)/6,'same')
    return (nz*0.7+np.sin(2*np.pi*190*t)*0.5*np.exp(-t*30))*e
def hat(d=0.05,k=70):
    t,e=env(d,k); nz=rng.standard_normal(len(t)); nz=np.diff(nz,prepend=0); return nz*e*0.5
def crash():
    t,e=env(1.4,3.2); nz=rng.standard_normal(len(t)); nz=np.diff(nz,prepend=0); return nz*e*0.35
def bass(f,d):
    t=np.arange(int(sr*d))/sr; s=np.sin(2*np.pi*f*t)+0.35*np.sin(4*np.pi*f*t)+0.15*np.sin(6*np.pi*f*t)
    return s*np.minimum(1,t*200)*np.exp(-t*5)
def pluck(f,d=0.3):
    t=np.arange(int(sr*d))/sr; s=sum(np.sin(2*np.pi*f*h*t)/h for h in (1,2,3,4)); return s*np.exp(-t*12)
A,F,C,G=55.0,43.65,65.41,49.0
prog=[A,F,C,G]
chords={A:(220,261.6,329.6),F:(174.6,220,261.6),C:(196,261.6,329.6),G:(196,246.9,293.7)}
bars=int(np.ceil(T/(4*b)))
for bar in range(bars):
    t0=bar*4*b; r=prog[bar%4]
    fill = False
    for k,g in ((0,1),(2,1),(2.5,.8)): add(kick(),t0+k*b,g*0.95)
    if not fill:
        for k in (1,3): add(snare(),t0+k*b,0.6)
    else:
        add(snare(),t0+1*b,0.6)
        for i,k in enumerate(np.arange(3,4,0.25)): add(snare(),t0+k*b,0.35+0.1*i)
    for k in np.arange(0,4,0.5): add(hat(),t0+k*b,0.35 if k%1==0 else 0.22)
    for k,d in ((0,1.4),(1.5,.45),(2,.9),(3,.45),(3.5,.45)): add(bass(r*(2 if k==3.5 else 1),d*b),t0+k*b,0.42)
    for k in (0.5,1.5,2.5,3.5):
        for f in chords[r]: add(pluck(f*2),t0+k*b,0.05)
add(crash(),0,0.6)
if END>0:
    for i,k in enumerate(np.arange(END-0.5,END,0.125)): add(snare(),k,0.3+0.1*i)
    add(crash(),END,0.8); add(kick(),END,1)
L=np.tanh(L*1.3)
fade=np.ones(n); m=int(sr*0.5); fade[-m:]=np.linspace(1,0,m); L*=fade
L=L/np.max(np.abs(L))*0.9
d=int(0.012*sr); R=np.concatenate([np.zeros(d),L[:-d]])*0.97+L*0.03
st=(np.stack([L,R],1)*32767).astype('<i2')
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st.tobytes()); w.close()
