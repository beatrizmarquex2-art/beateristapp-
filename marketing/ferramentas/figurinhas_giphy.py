# figurinhas animadas do Paul pro GIPHY (GIF com fundo transparente, contorno branco, 600x600)
# uso: python3 figurinhas_giphy.py DIR_POSES DIR_SAIDA
import sys, os, math, glob
from PIL import Image, ImageFilter, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
S, NF = 600, 16
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 78)
def contorno(im, r=9):
    a = im.split()[3].filter(ImageFilter.MaxFilter(2 * r + 1)).filter(ImageFilter.GaussianBlur(1.2))
    base = Image.new('RGBA', im.size, (255, 255, 255, 0)); base.putalpha(a.point(lambda v: 255 if v > 90 else 0))
    return Image.alpha_composite(base, im)
def nota(fr, x, y, cor, ang, esc):
    t = Image.new('RGBA', (140, 140), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
    d.text((70, 70), '♪', font=font, fill=cor, anchor='mm', stroke_width=7, stroke_fill=(255, 255, 255, 255))
    t = t.rotate(ang, resample=Image.BICUBIC); w = max(8, int(140 * esc)); t = t.resize((w, w), Image.LANCZOS)
    fr.alpha_composite(t, (int(x - w / 2), int(y - w / 2)))
for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    nome = os.path.basename(f)[:-4]
    im = Image.open(f).convert('RGBA'); im = im.crop(im.getbbox())
    k = 440 / max(im.size); im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
    pad = Image.new('RGBA', (im.width + 40, im.height + 40), (0, 0, 0, 0)); pad.alpha_composite(im, (20, 20)); im = contorno(pad)
    frames = []
    for i in range(NF):
        t = i / NF; s = math.sin(2 * math.pi * t)
        fr = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        esq = 1 + 0.03 * math.cos(4 * math.pi * t)  # estica e achata de leve
        p = im.resize((int(im.width / esq), int(im.height * esq)), Image.BICUBIC).rotate(4 * s, resample=Image.BICUBIC, expand=True)
        x = (S - p.width) // 2; y = S - 20 - p.height - int(14 * abs(s)) + (p.height - im.height) // 2
        fr.alpha_composite(p, (x, max(0, y)))
        for j, (nx, cor) in enumerate(((95, (192, 21, 47, 255)), (505, (246, 185, 59, 255)))):
            u = (t + j * 0.5) % 1  # cada nota sobe e some, alternadas
            if u < 0.8: nota(fr, nx + 14 * math.sin(6.28 * u), 250 - 170 * u, cor, 12 * math.sin(6.28 * u), 0.55 + 0.6 * min(1, u * 4) * (1 if u < 0.6 else (0.8 - u) / 0.2))
        frames.append(fr)
    # paleta única pros quadros (sem piscar) + 1 cor reservada pra transparência
    tira = Image.new('RGB', (S * 4, S)); [tira.paste(frames[i * 4].convert('RGB'), (i * S, 0)) for i in range(4)]
    pal = tira.quantize(255, method=Image.MEDIANCUT)
    ps = []
    for fr in frames:
        q = fr.convert('RGB').quantize(palette=pal, dither=Image.NONE)
        q.paste(255, mask=fr.split()[3].point(lambda v: 255 if v < 128 else 0)); ps.append(q)
    ps[0].save(os.path.join(out, f'paul_{nome}.gif'), save_all=True, append_images=ps[1:], duration=70, loop=0, transparency=255, disposal=2, optimize=False)
    print(nome, os.path.getsize(os.path.join(out, f'paul_{nome}.gif')) // 1024, 'KB')
