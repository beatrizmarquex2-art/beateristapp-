"""Gera as figurinhas exclusivas novas da Bea (F133 em diante) a partir de fotos dela: assets/figurinhas/fotos, mini e catalogo-bea.json.
Uso: python3 scripts/gerar-figurinhas-bea.py PASTA   (arquivos 133.jpg, 134.jpg... na pasta; a lista abaixo diz a frase, o giro e a área que não pode ser cortada)
O catalogo.json original (125) não muda. Só entra foto em que a Bea aparece sozinha (ou com gente irreconhecível ao fundo)."""
import sys, os, json, glob, hashlib
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SRC = sys.argv[1]
# numero: (frase, giro em graus anti-horário, foco [x0, y0, x1, y1] depois do giro)
LISTA = {133: ('cabelo voando na bateria', 0, [0.2, 0.08, 0.85, 0.95]), 134: ('passagem de som', 0, [0.25, 0.3, 0.75, 0.62]), 135: ('guitarra e sorriso', 0, [0.3, 0.1, 0.78, 0.95]),
         136: ('luzes e fumaça', 0, [0.25, 0.33, 0.8, 0.62]), 137: ('rindo no palco', 0, [0.3, 0.2, 0.78, 0.95]), 138: ('no baixo, de gravata', 90, [0.0, 0.1, 1.0, 0.95]),
         139: ('batucando na rua', 0, [0.3, 0.25, 0.8, 0.78]), 140: ('cantando na bateria', 0, [0.2, 0.1, 0.75, 0.95])}
# rosto aproximado [x, y, largura, altura] das fotos tiradas de longe: sem isso a cartinha não dá zoom
ROSTOS = {134: [[0.46, 0.325, 0.10, 0.08]], 135: [[0.42, 0.16, 0.11, 0.10]], 136: [[0.50, 0.365, 0.10, 0.04]], 137: [[0.55, 0.27, 0.06, 0.10]], 139: [[0.53, 0.30, 0.10, 0.075]]}
MOD = [('E03', 'M7'), ('E04', 'M8'), ('E01', 'M7'), ('E02', 'M8')]
cat = []
for k, (n, (frase, giro, foco)) in enumerate(sorted(LISTA.items())):
    f = glob.glob(os.path.join(SRC, f'{n}.*'))[0]; im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    if giro: im = im.rotate(giro, expand=True)
    im.thumbnail((1536, 1536), Image.LANCZOS); cod = f'F{n}'
    foto = os.path.join(ROOT, 'assets/figurinhas/fotos', cod + '.jpeg'); im.save(foto, quality=86, optimize=True)
    m = im.copy(); m.thumbnail((360, 360), Image.LANCZOS); m.save(os.path.join(ROOT, 'assets/figurinhas/mini', cod + '.webp'), quality=80)
    mod, mod2 = MOD[k % 4]
    cat.append({'codigo': cod, 'artista_banda': 'Beaterista', 'colecao': 'Beaterista', 'raridade': 'Exclusiva', 'modelo': mod, 'sha256': hashlib.sha256(open(foto, 'rb').read()).hexdigest(),
        'largura_px': im.width, 'altura_px': im.height, 'status': 'identificado', 'nota': frase, 'criterio_raridade': 'foto da Bea: exclusiva da Beaterista (enviada por ela em nov/2026)',
        'foto': f'assets/figurinhas/fotos/{cod}.jpeg', 'modelo2': mod2, 'rostos': ROSTOS.get(n, []), 'foco': foco, 'secao': 'Beaterista'})
    print(cod, frase, im.size, os.path.getsize(foto) // 1024, 'KB')
json.dump(cat, open(os.path.join(ROOT, 'assets/figurinhas/catalogo-bea.json'), 'w'), ensure_ascii=False, indent=1)
