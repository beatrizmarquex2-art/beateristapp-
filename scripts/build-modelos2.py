#!/usr/bin/env python3
"""Recorta os 8 modelos do painel enviado pela Bea (assets/figurinhas/modelos2/PAINEL_FONTE.png), apaga o texto de exemplo,
acha a janela cinza da foto e grava: M1..M8.webp (modelo limpo, janela preenchida de preto) + modelos2.json (janela, rótulo, ângulos).
Uso: python3 scripts/build-modelos2.py   (precisa de opencv-python-headless e numpy)"""
import cv2, numpy as np, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(HERE, '..', 'assets/figurinhas/modelos2')
im = cv2.imread(os.path.join(D, 'PAINEL_FONTE.png'))
BOXES = [(26,19,356,473),(403,19,362,473),(784,19,354,472),(1161,19,352,472),(19,516,364,477),(402,516,362,477),(784,516,353,475),(1156,515,364,478)]
SEED = [(200,240),(580,250),(960,240),(1330,240),(200,740),(590,740),(960,740),(1340,740)]
# retângulo (no recorte) onde está o texto de exemplo "ARTISTA / BANDA" e se o texto é escuro (1) ou claro (0)
TEXT = [(80,362,280,402,1),(86,372,272,408,1),(88,372,265,408,1),(96,372,276,412,1),(88,360,300,402,1),(78,360,286,400,1),(84,357,274,384,0),(80,336,274,380,1)]
NAMES = ['M1','M2','M3','M4','M5','M6','M7','M8']; RAR = ['Comum']*4 + ['Rara']*2 + ['Exclusiva']*2
S = 3; TW, TH = 360, 475   # coordenadas dos modelos: 360 x 475; arquivo final 3x
bgm = (np.abs(im.astype(int) - 16).sum(2) > 30).astype(np.uint8); bgm = cv2.morphologyEx(bgm, cv2.MORPH_CLOSE, np.ones((9,9), np.uint8))

def apaga_texto(c, tm, rect, pad=8):
    """Apaga o texto de exemplo repondo o papel do rótulo: cada coluna recebe a mediana dos pixels limpos da mesma coluna (mantém degradês)."""
    x0, y0, x1, y1 = rect; m = cv2.dilate(tm, np.ones((7, 7), np.uint8)); out = c.copy(); rng = np.random.default_rng(3)
    a, b = max(0, y0 - pad), y1 + pad; band = c[a:b, x0:x1].astype(float); bm = m[a:b, x0:x1] > 0
    base = np.median(band[~bm], axis=0)
    for x in range(x1 - x0):
        col = band[:, x]; ok = (~bm[:, x]) & (np.abs(col - base).max(1) < 45)
        val = np.median(col[ok], axis=0) if ok.sum() >= 3 else base
        ys = np.nonzero(bm[:, x])[0]
        if len(ys): out[a + ys, x0 + x] = np.clip(val + rng.normal(0, 2.2, (len(ys), 3)), 0, 255)
    return out

meta = {}
for i, ((x,y,w,h),(sx,sy)) in enumerate(zip(BOXES, SEED)):
    c = im[y:y+h, x:x+w].copy(); sxl, syl = TW / w, TH / h
    # janela cinza
    ref = im[sy-8:sy+8, sx-8:sx+8].reshape(-1,3).mean(0); d = np.abs(cv2.GaussianBlur(c,(0,0),1.5).astype(float) - ref).max(2)
    m = cv2.morphologyEx((d < 20).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5,5), np.uint8)); n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    win = (lab == lab[sy-y, sx-x]).astype(np.uint8); win = cv2.morphologyEx(win, cv2.MORPH_CLOSE, np.ones((11,11), np.uint8))
    cn, _ = cv2.findContours(win, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cnt = max(cn, key=cv2.contourArea)
    win = np.zeros_like(win); cv2.drawContours(win, [cnt], -1, 1, -1)
    (rcx, rcy), (rw, rh), ang = cv2.minAreaRect(cnt); ang = ang % 90; ang = ang - 90 if ang > 45 else ang
    poly = cv2.approxPolyDP(cnt, 1.4, True).reshape(-1,2).astype(float)
    ell = cv2.fitEllipse(cnt); circ = abs(ell[1][0]-ell[1][1]) < 14 and cv2.contourArea(cnt) / (np.pi*ell[1][0]*ell[1][1]/4) > 0.93
    # texto de exemplo -> apagar
    x0,y0,x1,y1,dark = TEXT[i]; g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY)
    tm = np.zeros(g.shape, np.uint8); roi = g[y0:y1, x0:x1]
    tm[y0:y1, x0:x1] = ((roi < 105) if dark else (roi > 105)).astype(np.uint8)
    tm = cv2.morphologyEx(tm, cv2.MORPH_OPEN, np.ones((2,2), np.uint8))
    pts = cv2.findNonZero(tm); (tcx, tcy), (tw, th_), tang = cv2.minAreaRect(pts); tang = tang % 90; tang = tang - 90 if tang > 45 else tang
    ink = np.median(c[tm > 0], axis=0)[::-1].astype(int).tolist()
    clean = apaga_texto(c, tm, (x0, y0, x1, y1))
    # janela -> preto (um pouco além da borda, pra sumir o cinza que sobra na beirada)
    clean[cv2.dilate(win, np.ones((5,5), np.uint8)) > 0] = (18, 16, 20)
    # recorte arredondado do cartão
    cm = bgm[y:y+h, x:x+w].copy(); fl = cm.copy(); cv2.floodFill(fl, None, (0,0), 2) if fl[0,0] == 0 else None
    cm = (fl != 2).astype(np.uint8); cm = cv2.erode(cm, np.ones((3,3), np.uint8))
    rgba = cv2.cvtColor(clean, cv2.COLOR_BGR2BGRA); rgba[:,:,3] = cm * 255
    big = cv2.resize(rgba, (TW*S, TH*S), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(big[:,:,:3], (0,0), 2.0); big[:,:,:3] = cv2.addWeighted(big[:,:,:3], 1.5, blur, -0.5, 0)  # leve nitidez
    cv2.imwrite(os.path.join(D, f'{NAMES[i]}.webp'), big, [cv2.IMWRITE_WEBP_QUALITY, 92])
    sc = lambda px, py: [round(px*sxl, 1), round(py*syl, 1)]
    meta[NAMES[i]] = {'raridade': RAR[i], 'w': TW, 'h': TH,
        'janela': {'poly': [sc(*p) for p in poly], 'centro': sc(rcx, rcy), 'angulo': 0 if (circ or abs(ang) < 1.2 or abs(ang) > 15) else round(ang, 1), 'circulo': bool(circ)},
        'rotulo': {'centro': sc(tcx, tcy), 'angulo': 0 if abs(tang) < 0.8 else round(tang, 1), 'largura': round(max(tw, th_) * sxl * 1.0, 1), 'altura': round(min(min(tw, th_) * syl, 24), 1), 'tinta': ink, 'escuro': bool(dark)}}
    print(NAMES[i], RAR[i], 'janela ang', meta[NAMES[i]]['janela']['angulo'], 'circ', bool(circ), 'rot', meta[NAMES[i]]['rotulo'])
json.dump(meta, open(os.path.join(D, 'modelos2.json'), 'w'), indent=1)
open(os.path.join(HERE, '..', 'js/figurinhas/modelos2-data.js'), 'w').write("// Gerado por scripts/build-modelos2.py — janela da foto e rótulo de cada um dos 8 modelos novos (coordenadas 360 x 475).\nexport const MODELOS2 = " + json.dumps(meta, ensure_ascii=False) + ";\n")
