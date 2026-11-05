#!/usr/bin/env python3
"""Acha onde estão os rostos em cada foto do catálogo (OpenCV/Haar) para o zoom nunca cortar uma cabeça.
Só guarda caixas (x, y, largura, altura, 0-1) em assets/figurinhas/catalogo.json -> 'rostos'. Não altera as fotos. Não identifica ninguém."""
import cv2, json, os, numpy as np
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
cat = json.load(open(os.path.join(ROOT, 'assets/figurinhas/catalogo.json')))
H = cv2.data.haarcascades
cs = {k: cv2.CascadeClassifier(H + f) for k, f in {'f': 'haarcascade_frontalface_default.xml', 'f2': 'haarcascade_frontalface_alt2.xml', 'p': 'haarcascade_profileface.xml'}.items()}
def iou(a, b):
    x1, y1 = max(a[0], b[0]), max(a[1], b[1]); x2, y2 = min(a[0]+a[2], b[0]+b[2]), min(a[1]+a[3], b[1]+b[3]); i = max(0, x2-x1) * max(0, y2-y1)
    return i / (a[2]*a[3] + b[2]*b[3] - i + 1e-9)
for r in cat:
    img = cv2.imread(os.path.join(ROOT, r['foto'])); h, w = img.shape[:2]; k = 900 / max(h, w); g = cv2.cvtColor(cv2.resize(img, None, fx=k, fy=k), cv2.COLOR_BGR2GRAY); g = cv2.equalizeHist(g)
    ms = max(20, int(min(g.shape) * 0.045)); det = {}
    for n, c in cs.items():
        found = list(c.detectMultiScale(g, 1.08, 6, minSize=(ms, ms)))
        if n == 'p':
            found += [(g.shape[1] - x - fw, y, fw, fh) for (x, y, fw, fh) in c.detectMultiScale(cv2.flip(g, 1), 1.08, 6, minSize=(ms, ms))]
        det[n] = [tuple(int(v) for v in b) for b in found]
    # rosto "confirmado": dois detectores frontais concordam, ou o de perfil achou (menos falsos positivos)
    boxes = [b for b in det['f'] if any(iou(b, q) > 0.3 for q in det['f2'])] + [b for b in det['f2'] if not any(iou(b, q) > 0.3 for q in det['f'])][:0] + det['p']
    keep = []
    for b in sorted(boxes, key=lambda b: -b[2]*b[3]):
        if all(iou(b, q) < 0.3 for q in keep): keep.append(b)
    gh, gw = g.shape
    # foco: onde está a "ação" da foto (energia de bordas, 12%-88% em cada eixo) - o zoom também não corta isso
    gb = cv2.GaussianBlur(g.astype(np.float32), (0, 0), 1.5); en = np.hypot(cv2.Sobel(gb, cv2.CV_32F, 1, 0), cv2.Sobel(gb, cv2.CV_32F, 0, 1)); en = cv2.GaussianBlur(en, (0, 0), max(gh, gw) * 0.02)
    def q(v, lo=0.12, hi=0.88):
        c = np.cumsum(v) / (v.sum() + 1e-9); return float(np.searchsorted(c, lo)) / len(v), float(np.searchsorted(c, hi)) / len(v)
    fx0, fx1 = q(en.sum(0)); fy0, fy1 = q(en.sum(1))
    r['foco'] = [round(max(0, fx0 - .03), 3), round(max(0, fy0 - .03), 3), round(min(1, fx1 + .03), 3), round(min(1, fy1 + .03), 3)]
    r['rostos'] = [[round(x/gw, 4), round(y/gh, 4), round(bw/gw, 4), round(bh/gh, 4)] for x, y, bw, bh in keep]
json.dump(cat, open(os.path.join(ROOT, 'assets/figurinhas/catalogo.json'), 'w'), ensure_ascii=False, indent=1)
import collections; print(collections.Counter(len(r['rostos']) for r in cat))
