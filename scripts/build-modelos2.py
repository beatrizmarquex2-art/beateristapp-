#!/usr/bin/env python3
"""Recorta os 8 modelos do painel enviado pela Bea (assets/figurinhas/modelos2/PAINEL_FONTE.png), apaga o texto de exemplo,
acha a janela cinza da foto e grava: M1..M8.webp (modelo limpo, janela preenchida de preto) + modelos2.json (janela, rótulo, ângulos).
Uso: python3 scripts/build-modelos2.py   (precisa de opencv-python-headless e numpy)"""
import cv2, numpy as np, json, os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(HERE, '..', 'assets/figurinhas/modelos2')
im = cv2.imread(os.path.join(D, 'PAINEL_FONTE.png'))
BOXES = [(26,19,356,473),(403,19,362,473),(784,19,354,472),(1161,19,352,472),(19,516,364,477),(402,516,362,477),(784,516,353,475),(1156,515,364,478)]
SEED = [(200,240),(580,250),(960,240),(1330,240),(200,740),(590,740),(960,740),(1340,740)]
# retângulo (no recorte) onde está o texto de exemplo "ARTISTA / BANDA" e se o texto é escuro (1) ou claro (0)
TEXT = [(80,362,280,402,1),(86,372,272,408,1),(88,372,265,408,1),(96,372,276,412,1),(88,360,300,402,1),(78,360,286,400,1),(84,357,274,384,0),(80,336,274,380,1)]
SUB_ESCURO = [1, 0, 0, 1, 1, 0, 0, 1]  # a tinta do subtítulo é escura (1) ou clara (0)
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

# Subtítulo da arte: o painel original dizia 'FIGUIRINHAS' (com um I a mais). Aqui o texto é apagado e reescrito certo ('FIGURINHAS'),
# na mesma reta, inclinação e cor. SUB = reta ajustada em cada modelo (coordenadas do recorte original): angulo, centro e extensão do texto.
SUB = [{"ang": -6.0, "cx": 171.96, "cy": 73.37, "t0": -69.36, "t1": 69.36}, {"ang": -5.38, "cx": 164.75, "cy": 82.94, "t0": -79.51, "t1": 79.51}, {"ang": -6.56, "cx": 142.46, "cy": 76.3, "t0": -80.43, "t1": 80.43}, {"ang": -5.01, "cx": 132.33, "cy": 85.01, "t0": -68.77, "t1": 68.77}, {"ang": -5.59, "cx": 129.84, "cy": 73.75, "t0": -68.24, "t1": 68.24}, {"ang": -6.53, "cx": 132.92, "cy": 79.65, "t0": -68.89, "t1": 68.89}, {"ang": -5.67, "cx": 161.6, "cy": 78.12, "t0": -70.3, "t1": 70.3}, {"ang": -6.13, "cx": 128.52, "cy": 76.75, "t0": -69.86, "t1": 69.86}]
PALAVRA, ERRADA = 'FIGURINHAS', 'FIGUIRINHAS'
def apaga_subtitulo(c, f, dark):
    h, w = c.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]; a = np.radians(f['ang']); vx, vy = np.cos(a), np.sin(a)
    t = (xx - f['cx']) * vx + (yy - f['cy']) * vy; d = np.abs((xx - f['cx']) * vy - (yy - f['cy']) * vx)
    g = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY); band = (d < 8) & (t > f['t0'] - 10) & (t < f['t1'] + 10)
    ink = band & ((g < 112) if dark else (g > 160))
    ink = cv2.dilate(ink.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    ink &= (d < 9)
    out = c.copy(); rng = np.random.default_rng(5); ys, xs = np.nonzero(ink)
    cor = np.median(c[(band & ((g < 112) if dark else (g > 160)))], axis=0)
    for x in np.unique(xs):
        col = np.arange(max(0, ys[xs == x].min() - 9), min(h, ys[xs == x].max() + 10)); bad = ink[col, x]
        ok = ~bad & (np.abs(c[col, x].astype(float) - cor).max(1) > 30)
        if ok.sum() < 2: ok = ~bad
        val = np.median(c[col[ok], x], axis=0) if ok.sum() else c[col[0], x]
        out[col[bad], x] = np.clip(val + rng.normal(0, 2.0, (bad.sum(), 3)), 0, 255)
    return out, cor[::-1].astype(int).tolist()
def escreve_subtitulo(big, f, cor, S, sx):
    # big: BGRA já ampliado (S vezes o tamanho do modelo, sx = escala recorte->modelo). Desenha PALAVRA girada, com o mesmo espaçamento do texto antigo.
    cap = 10.6 * sx * S; font = ImageFont.truetype(os.path.join(D, 'Hanken-700.ttf'), int(round(cap / 0.70)))
    adv = lambda t: sum(font.getlength(ch) for ch in t)
    span_old = (f['t1'] - f['t0']) * sx * S  # distância entre o centro da 1ª e da última letra da palavra antiga
    # espaçamento entre letras (tracking) que reproduz o tamanho da palavra antiga
    trk = (span_old - (adv(ERRADA) - (font.getlength(ERRADA[0]) + font.getlength(ERRADA[-1])) / 2)) / (len(ERRADA) - 1)
    comp = adv(PALAVRA) + trk * (len(PALAVRA) - 1)
    W_, H_ = int(comp + 80 * S), int(cap * 3); lay = Image.new('RGBA', (W_, H_), (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
    x = (W_ - comp) / 2
    for ch in PALAVRA:
        dr.text((x, H_ / 2), ch, font=font, fill=tuple(cor) + (255,), anchor='lm'); x += font.getlength(ch) + trk
    lay = lay.rotate(-f['ang'], resample=Image.BICUBIC, expand=True)
    px, py = f['cx'] * sx * S, f['cy'] * sx * S
    base = Image.fromarray(cv2.cvtColor(big, cv2.COLOR_BGRA2RGBA)); base.alpha_composite(lay, (int(round(px - lay.width / 2)), int(round(py - lay.height / 2))))
    return cv2.cvtColor(np.array(base), cv2.COLOR_RGBA2BGRA)
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
    if i == 6:  # M7: a plaquinha do nome é preta lisa; sobravam fantasmas claros do texto de exemplo -> preenche com o preto da própria placa
        gg = cv2.cvtColor(clean, cv2.COLOR_BGR2GRAY); rx0, ry0, rx1, ry1 = 76, 351, 282, 384; sub = clean[ry0:ry1, rx0:rx1]
        base = np.median(sub[gg[ry0:ry1, rx0:rx1] < 70].reshape(-1, 3), axis=0)
        clean[ry0:ry1, rx0:rx1] = np.clip(base + np.random.default_rng(9).normal(0, 1.6, sub.shape), 0, 255).astype(np.uint8)
    clean, sub_cor = apaga_subtitulo(clean, SUB[i], SUB_ESCURO[i])
    # janela -> preto (um pouco além da borda, pra sumir o cinza que sobra na beirada)
    clean[cv2.dilate(win, np.ones((5,5), np.uint8)) > 0] = (18, 16, 20)
    # recorte arredondado do cartão
    cm = bgm[y:y+h, x:x+w].copy(); fl = cm.copy(); cv2.floodFill(fl, None, (0,0), 2) if fl[0,0] == 0 else None
    cm = (fl != 2).astype(np.uint8); cm = cv2.erode(cm, np.ones((3,3), np.uint8))
    rgba = cv2.cvtColor(clean, cv2.COLOR_BGR2BGRA); rgba[:,:,3] = cm * 255
    big = cv2.resize(rgba, (TW*S, TH*S), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(big[:,:,:3], (0,0), 2.0); big[:,:,:3] = cv2.addWeighted(big[:,:,:3], 1.5, blur, -0.5, 0)  # leve nitidez
    big = escreve_subtitulo(big, SUB[i], sub_cor, S, sxl)
    cv2.imwrite(os.path.join(D, f'{NAMES[i]}.webp'), big, [cv2.IMWRITE_WEBP_QUALITY, 92])
    sc = lambda px, py: [round(px*sxl, 1), round(py*syl, 1)]
    meta[NAMES[i]] = {'raridade': RAR[i], 'w': TW, 'h': TH,
        'janela': {'poly': [sc(*p) for p in poly], 'centro': sc(rcx, rcy), 'angulo': 0 if (circ or abs(ang) < 1.2 or abs(ang) > 15) else round(ang, 1), 'circulo': bool(circ)},
        'rotulo': {'centro': sc(tcx, tcy), 'angulo': 0 if abs(tang) < 0.8 else round(tang, 1), 'largura': round(max(tw, th_) * sxl * 1.0, 1), 'altura': round(min(min(tw, th_) * syl, 24), 1), 'tinta': ink, 'escuro': bool(dark)}}
    print(NAMES[i], RAR[i], 'janela ang', meta[NAMES[i]]['janela']['angulo'], 'circ', bool(circ), 'rot', meta[NAMES[i]]['rotulo'])
json.dump(meta, open(os.path.join(D, 'modelos2.json'), 'w'), indent=1)
open(os.path.join(HERE, '..', 'js/figurinhas/modelos2-data.js'), 'w').write("// Gerado por scripts/build-modelos2.py — janela da foto e rótulo de cada um dos 8 modelos novos (coordenadas 360 x 475).\nexport const MODELOS2 = " + json.dumps(meta, ensure_ascii=False) + ";\n")
