#!/usr/bin/env python3
"""Tira o verde de uma foto (a Bea não quer verde): a luz verde/ciano de palco vira azul da marca, com a saturação mais baixa.
Uso: python3 scripts/foto-tira-verde.py entrada.jpg saida.jpg [gama]   (gama < 1 clareia)"""
import sys, numpy as np
from PIL import Image
def tira_verde(im, gama=1.0):
    a = np.asarray(im.convert('HSV')).astype(np.float32); h, s, v = a[..., 0] * 360 / 255, a[..., 1], a[..., 2]
    # peso: 1 no miolo do verde (80°–170°), cai suave até 55° e 195°
    w = np.clip((h - 55) / 25, 0, 1) * np.clip((195 - h) / 25, 0, 1)
    h2 = h * (1 - w) + 222 * w; s2 = s * (1 - .45 * w)
    out = np.stack([h2 * 255 / 360, s2, 255 * np.power(v / 255, gama)], -1).clip(0, 255).astype('uint8')
    return Image.fromarray(out, 'HSV').convert('RGB')
def verde(im):
    a = np.asarray(im.convert('HSV').resize((200, 200))).astype(np.float32); h = a[..., 0] * 360 / 255
    return float((((h > 75) & (h < 175) & (a[..., 1] > 90) & (a[..., 2] > 60)).mean()))
if __name__ == '__main__':
    im = Image.open(sys.argv[1]).convert('RGB'); tira_verde(im, float(sys.argv[3]) if len(sys.argv) > 3 else 1).save(sys.argv[2], quality=92)
