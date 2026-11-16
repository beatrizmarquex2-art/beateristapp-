#!/usr/bin/env python3
"""GIFs animados do Paul (fundo claro liso) -> Paul recortado e animado.
uso: python3 paul_animado.py PASTA_DOS_GIFS PASTA_DE_SAIDA
os GIFs ficam em assets/originals/paul-gif/paul-POSE.gif. Sai:
  SAIDA/site/paul-POSE.webp  animado, fundo transparente, 360 px de altura (copiar pra assets/paul/animado/ e somar a pose em ANIMADOS, js/paul-cor.js)
  SAIDA/reels/POSE/0..N.png  quadros 2x com contorno branco de adesivo (entrada do marketing/reels/aula/aula.py)
precisa de pillow, numpy e scipy."""
import sys,os,glob,numpy as np
from PIL import Image,ImageSequence,ImageFilter
from scipy import ndimage as nd
def recorta(im,tol=26):
    a=np.asarray(im.convert('RGB')).astype(int)
    borda=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]); fundo=np.median(borda,0)
    cand=np.abs(a-fundo).max(2)<tol
    # fecha frestas de 1 px no contorno antes de inundar a partir das bordas
    lab,_=nd.label(nd.binary_erosion(cand,iterations=1,border_value=1))
    ids=set(lab[0])|set(lab[-1])|set(lab[:,0])|set(lab[:,-1]); ids.discard(0)
    m=nd.binary_dilation(np.isin(lab,list(ids)),iterations=2)&cand
    al=np.asarray(Image.fromarray((~m*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.7))).astype(float)
    al=np.clip((al-110)/145,0,1)*255
    return Image.fromarray(np.dstack([a.astype('uint8'),al.astype('uint8')]),'RGBA')
def adesivo(im):
    w,h=im.size; big=im.resize((w*2,h*2),Image.LANCZOS).filter(ImageFilter.UnsharpMask(2,60,2))
    P=28; c=Image.new('RGBA',(w*2+2*P,h*2+2*P),(0,0,0,0)); c.paste(big,(P,P))
    d=nd.binary_fill_holes(nd.binary_dilation(np.asarray(c)[...,3]>100,iterations=11))
    base=Image.new('RGBA',c.size,(255,255,255,0)); base.putalpha(Image.fromarray((d*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)))
    base.alpha_composite(c); return base
if __name__=='__main__':
    src,out=sys.argv[1],sys.argv[2]; os.makedirs(out+'/site',exist_ok=True)
    for f in sorted(glob.glob(src+'/paul-*.gif')):
        nm=os.path.basename(f)[5:-4]; g=Image.open(f); dur=g.info.get('duration',140)
        fr=[recorta(x.convert('RGB')) for x in ImageSequence.Iterator(g)]
        os.makedirs(f'{out}/reels/{nm}',exist_ok=True)
        for i,x in enumerate(fr): adesivo(x).save(f'{out}/reels/{nm}/{i}.png')
        sm=[x.resize((round(x.width*360/x.height),360),Image.LANCZOS) for x in fr]
        sm[0].save(f'{out}/site/paul-{nm}.webp',save_all=True,append_images=sm[1:],duration=dur,loop=0,quality=72,method=4)
        print(nm,len(fr),'quadros',dur,'ms')
