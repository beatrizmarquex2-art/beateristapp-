#!/usr/bin/env python3
"""Transforma um Paul colorido em alta em desenho pra colorir (traço preto liso, fundo transparente), em 3 traços:
A = limpo (visor preto) · B = vazado (visor branco, dá pra pintar o rosto) · C = grosso (pros pequenos).
Uso: python3 scripts/paul-traco.py [nome ...]   (sem nome = todos de coloridos-hd)
Precisa: pip install opencv-python-headless scikit-image. Saída: assets/originals/paul-png/pra-colorir/traco-A|B|C/paul-NOME.png"""
import glob, os
import cv2, numpy as np, sys
from skimage.morphology import skeletonize
from skimage import morphology as _m
def remove_small_objects(m,n,connectivity=1): return _m.remove_small_objects(m.astype(bool),max_size=n,connectivity=connectivity)
T=40
def base(nome):
    im=cv2.imread('assets/originals/paul-png/coloridos-hd/paul-%s.png'%nome, cv2.IMREAD_UNCHANGED)
    im=cv2.resize(im,None,fx=2,fy=2,interpolation=cv2.INTER_LANCZOS4)
    a=im[...,3]>128
    v=cv2.cvtColor(im[...,:3],cv2.COLOR_BGR2HSV)[...,2]
    v=cv2.medianBlur(v,15)
    dark=(v<T)&a
    global CHEIO
    vb=cv2.medianBlur(cv2.cvtColor(im[...,:3],cv2.COLOR_BGR2HSV)[...,2],31)
    CHEIO=(vb<30)&a
    return im,a,dark
def E(n): return cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(n,n))
def liso(m,s=3.0):
    return cv2.GaussianBlur(m.astype(np.float32),(0,0),s)>.5
def partes(dark):
    d=CHEIO.astype(np.uint8)
    core=cv2.erode(d,E(27))            # só sobrevive o que é área cheia (visor, sombras grandes)
    fills=cv2.dilate(core,E(33))&d
    fills=remove_small_objects(fills.astype(bool),3000)
    fills=_m.remove_small_holes(fills,max_size=2500)
    lines=dark&~cv2.dilate(fills.astype(np.uint8),E(5)).astype(bool)
    return fills,lines
def versoes(nome):
    im,a,dark=base(nome)
    fills,lines=partes(dark)
    sil=a.astype(np.uint8)
    borda=(cv2.dilate(sil,E(9))-cv2.erode(sil,E(9))).astype(bool)   # contorno de fora sempre fechado
    out={}
    # A: limpo (mesma espessura do desenho, sem pontinhos nem hachura), visor preto
    la=remove_small_objects(lines,1500); la=cv2.morphologyEx(la.astype(np.uint8),cv2.MORPH_CLOSE,E(7)).astype(bool)
    out['A']=liso(la|fills|borda,3.2)
    A=out['A'].astype(np.uint8)
    # áreas cheias do resultado A (visor, notas grandes): o que sobra depois de afinar bastante
    cheio=cv2.dilate(cv2.erode(A,E(25)),E(29))&A
    cheio=remove_small_objects(cheio,9000)
    cheio=_m.remove_small_holes(cheio.astype(bool),max_size=1500).astype(np.uint8)
    # B: tudo vazado (visor branco, olhos desenhados), pra pintar até o rosto
    miolo=cv2.erode(cheio,E(13))
    out['B']=liso((A&~miolo).astype(bool),2.2)
    # C: traço grosso, pros pequenos
    out['C']=liso(cv2.dilate(A,E(11)).astype(bool),3.5)
    return out
if __name__=='__main__':
    RAIZ=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(RAIZ)
    nomes=sys.argv[1:] or [os.path.basename(f)[5:-4] for f in sorted(glob.glob('assets/originals/paul-png/coloridos-hd/paul-*.png'))]
    for nome in nomes:
        for k,m in versoes(nome).items():
            d='assets/originals/paul-png/pra-colorir/traco-%s'%k; os.makedirs(d,exist_ok=True)
            al=(cv2.GaussianBlur(m.astype(np.float32),(0,0),1.2)*255).astype(np.uint8)
            cv2.imwrite('%s/paul-%s.png'%(d,nome), np.dstack([np.zeros_like(al)]*3+[al]))
        print(nome)
