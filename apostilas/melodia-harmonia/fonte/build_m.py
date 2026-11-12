# -*- coding: utf-8 -*-
import sys, importlib
sys.path.insert(0,'.')
import base
base.BOOK = 'Robôterista Melodia e Harmonia'
base.FOOT = 'BEATERISTA | ROBOTERISTA MELODIA E HARMONIA'
base.TITLE = 'Robôterista Ensina — Melodia e Harmonia — Beaterista Escola de Música'
from base import *
mods = sys.argv[1].split(',')
L = Livro()
for m in mods:
    importlib.import_module(m).build(L)
html = L.render()
open(sys.argv[2] if len(sys.argv) > 2 else 'livro_m.html','w').write(html)
print(len(L.pages),'páginas')
