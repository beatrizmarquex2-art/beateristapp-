# -*- coding: utf-8 -*-
import sys, importlib, shutil, os
sys.path.insert(0,'.')
from base import *
mods = sys.argv[1].split(',') if len(sys.argv)>1 else ['pages_a']
L = Livro()
for m in mods:
    importlib.import_module(m).build(L)
html = L.render()
open('livro.html','w').write(html)
print(len(L.pages),'páginas')
