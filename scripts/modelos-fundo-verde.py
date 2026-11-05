#!/usr/bin/env python3
"""Gera os 8 modelos com a janela da foto VERDE (#00FF00), 1080 x 1425, pra quem quer colocar a foto num editor (Canva etc.).
Uso: python3 scripts/modelos-fundo-verde.py [pasta-de-saida]"""
import json, os, sys
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets/figurinhas/modelos2')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, '..', '..', '..', 'exports/figurinhas/modelos_fundo_verde')
os.makedirs(OUT, exist_ok=True)
meta = json.load(open(os.path.join(D, 'modelos2.json')))
for k, m in meta.items():
    im = Image.open(os.path.join(D, f'{k}.webp')).convert('RGBA'); S = im.width / m['w']
    mask = Image.new('L', im.size, 0); ImageDraw.Draw(mask).polygon([(x * S, y * S) for x, y in m['janela']['poly']], fill=255)
    verde = Image.new('RGBA', im.size, (0, 255, 0, 255)); im.paste(verde, (0, 0), mask)
    im.save(os.path.join(OUT, f'{k}_{m["raridade"].upper()}_fundo_verde.png'))
print('ok', OUT)
