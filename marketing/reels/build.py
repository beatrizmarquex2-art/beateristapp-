#!/usr/bin/env python3
"""monta um reel vertical 1080x1920 a partir de um spec json.
uso: python3 build.py specs/NOME.json PASTA_DOS_BRUTOS PASTA_DE_SAIDA
os brutos sao achados pelo numero (ex.: "9268" acha qualquer arquivo *IMG_9268.mov).
layout de cada trecho: "v" (vertical, tela cheia), "h" (horizontal, recorte 4:5 com faixa azul em cima),
"rot" (gravado de lado: gira e usa em tela cheia), "img" (foto com zoom lento). audio: "beat" (batida original) ou "raw" (som da gravacao)."""
import json,sys,glob,os,subprocess,tempfile
spec=json.load(open(sys.argv[1])); raw=sys.argv[2]; outdir=sys.argv[3]; here=os.path.dirname(os.path.abspath(__file__))
os.makedirs(outdir,exist_ok=True); tmp=tempfile.mkdtemp()
subprocess.check_call(['node',os.path.join(here,'overlays.js'),sys.argv[1],tmp])
segs=spec['segs']; end=spec.get('end'); ENDD=3.0 if end else 0
clipT=sum(s['dur'] for s in segs); T=clipT+ENDD
cmd=['ffmpeg','-v','error','-y']; fc=''
for i,s in enumerate(segs):
    f=glob.glob(os.path.join(raw,f"*{s['src']}*"))[0]
    if s.get('layout')=='img': cmd+=['-loop','1','-framerate','30','-t',str(s['dur']+0.2),'-i',f]
    else: cmd+=['-ss',str(s['ss']),'-t',str(s['dur']+0.2),'-i',f]
    g=s.get('gamma',1.06); eq=f"eq=contrast=1.07:brightness={s.get('bright',0.03)}:saturation=1.18:gamma={g},unsharp=5:5:0.5"
    d=s['dur']; z=f"zoompan=z='1+0.05*on/{int(d*30)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30"
    lay=s.get('layout','v')
    if lay=='h':
        x=s.get('x','(iw-864)/2')
        v=f"fps=30,crop=864:1080:{x}:0,scale=1080:1350:flags=lanczos,{eq},pad=1080:1920:0:570:color=0x101f47"
    elif lay=='img':  # foto: preenche a tela (cx = posicao horizontal do recorte, 0 a 1), encostada embaixo pra frase nao cobrir a pagina
        v=f"scale=-2:1700:flags=lanczos,crop=1080:1700:(iw-1080)*{s.get('cx',0.5)}:0,eq=contrast=1.05:saturation=1.1,pad=1080:1920:0:220:color=0x101f47,fps=30"
    elif lay=='rot':
        v=f"fps=30,transpose={s.get('transpose',2)},scale=1188:2112:flags=lanczos,{z},{eq}"
    else:
        v=f"fps=30,scale=1188:2112:flags=lanczos,{z},{eq}"
    fc+=f"[{i}:v]{v},trim=duration={d},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[c{i}];"
n=len(segs)
fc+=''.join(f'[c{i}]' for i in range(n))+f"concat=n={n}:v=1"+(f",tpad=stop_mode=clone:stop_duration={ENDD+0.1}" if end else '')+f",trim=duration={T}[base];"
k=n; prev='base'; t=0
for i,s in enumerate(segs):
    cmd+=['-loop','1','-framerate','30','-t',str(T),'-i',os.path.join(tmp,f't{i}.png')]
    fade='' if i==0 else f",fade=in:st={t}:d=0.18:alpha=1"
    fc+=f"[{k}:v]format=rgba{fade}[o{i}];[{prev}][o{i}]overlay=enable='gte(t,{t})*lt(t,{t+s['dur']})'[v{i}];"; prev=f'v{i}'; k+=1; t+=s['dur']
if end:
    cmd+=['-loop','1','-framerate','30','-t',str(T),'-i',os.path.join(tmp,'end.png')]
    fc+=f"[{k}:v]format=rgba,fade=in:st={clipT}:d=0.15:alpha=1[oe];[{prev}][oe]overlay=enable='gte(t,{clipT})'[ve];"; k+=1
    cmd+=['-loop','1','-framerate','30','-t',str(T),'-i',os.path.join(here,'../../assets/originals/artes-beaterista/kit-roboterista/img/paul.png')]
    fc+=f"[{k}:v]scale=540:-1,format=rgba[pl];[ve][pl]overlay=x=W-w-70:y='H-h-170+900*pow(max(0,1-(t-{clipT+0.1})/0.35),2)':enable='gte(t,{clipT+0.1})'[vout];"; k+=1
else:
    fc+=f"[{prev}]null[vout];"
if spec.get('audio')=='raw':
    for i,s in enumerate(segs):
        fc+=f"[{i}:a]atrim=duration={s['dur']},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={s['dur']-0.04}:d=0.04[a{i}];"
    # o som do ultimo trecho continua por baixo do cartao final
    last=segs[-1]; f=glob.glob(os.path.join(raw,f"*{last['src']}*"))[0]
    cmd+=['-ss',str(last['ss']+last['dur']),'-t',str(ENDD),'-i',f]
    fc+=''.join(f'[a{i}]' for i in range(n))+f"[{k}:a]concat=n={n+1}:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=11,apad,atrim=duration={T},afade=t=out:st={T-0.6}:d=0.6[aout]"
else:
    wav=os.path.join(tmp,'beat.wav'); subprocess.check_call([sys.executable,os.path.join(here,'beat.py'),wav,str(T),str(clipT if end else -1)])
    cmd+=['-i',wav]; fc+=f"[{k}:a]loudnorm=I=-14:TP=-1.5:LRA=11,atrim=duration={T},afade=t=out:st={T-0.4}:d=0.4[aout]"
out=os.path.join(outdir,spec['name']+'.mp4')
cmd+=['-filter_complex',fc,'-map','[vout]','-map','[aout]','-r','30','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','44100','-movflags','+faststart','-t',str(T),out]
subprocess.check_call(cmd); print('ok',out,T,'s')
