# -*- coding: utf-8 -*-
import html as _h
from nota import *

BOOK = 'Robôterista Ensina'
SCHOOL = 'Beaterista Escola de Música'

CSS = r"""
@font-face{font-family:Marker;src:url(fonts/PermanentMarker-latin.woff2) format('woff2');unicode-range:U+0000-0025,U+0027-FFFF}
@font-face{font-family:Marker;src:url(fonts/Anton-latin.woff2) format('woff2');unicode-range:U+0026}
@font-face{font-family:Gochi;src:url(fonts/GochiHand-latin.woff2) format('woff2');}
@font-face{font-family:Hanken;src:url(fonts/HankenGrotesk-latin.woff2) format('woff2');font-weight:100 900;}
@page{size:210mm 297mm;margin:0}
@page land{size:297mm 210mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff}
body{font-family:Hanken,Arial,sans-serif;color:#111;font-size:13.2px;line-height:1.42;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;break-after:page;background:#fff;padding:0 15mm}
.page.land{page:land;width:297mm;height:210mm;padding:0}
.page.full{padding:0}
.hd{position:absolute;top:9mm;left:15mm;right:15mm;font-size:9.5px;color:#9a9a9a;display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:4px}
.ft{position:absolute;bottom:7mm;left:9mm;right:9mm;font-size:9.5px;color:#333;display:flex;justify-content:space-between;letter-spacing:.2px}
.in{position:absolute;top:17mm;left:15mm;right:15mm;bottom:15mm}
.t{font-family:Marker,Impact,sans-serif;font-size:35px;line-height:1.05;font-weight:400;letter-spacing:.3px}
.s{font-family:Gochi,cursive;font-size:19px;color:#333;margin-top:3px}
.rule{max-width:100%;height:4px;background:#111;margin:9px 0 14px}
.g{font-family:Gochi,cursive}
.m{font-family:Marker,Impact,sans-serif;font-weight:400;letter-spacing:.3px}
.fala{display:flex;align-items:center;gap:14px;margin:4px 0 12px}
.fala .pic{flex:none}
.fala .pic img{display:block;height:84px}
.fala.r{flex-direction:row-reverse}
.bub{position:relative;flex:1;border:2px solid #111;border-radius:16px;padding:9px 14px;font-family:Gochi,cursive;font-size:16.5px;line-height:1.28}
.fala:not(.r) .bub:before{content:"";position:absolute;left:-13px;top:50%;margin-top:-9px;border:9px solid transparent;border-right:13px solid #111;border-left:0}
.fala:not(.r) .bub:after{content:"";position:absolute;left:-9px;top:50%;margin-top:-7px;border:7px solid transparent;border-right:10px solid #fff;border-left:0}
.fala.r .bub:before{content:"";position:absolute;right:-13px;top:50%;margin-top:-9px;border:9px solid transparent;border-left:13px solid #111;border-right:0}
.fala.r .bub:after{content:"";position:absolute;right:-9px;top:50%;margin-top:-7px;border:7px solid transparent;border-left:10px solid #fff;border-right:0}
.box{border:2px solid #111;border-radius:14px;padding:10px 14px;background:#fff}
.box.soft{border-color:#111;background:#fff}
.box.dash{border-style:dashed}
.lab{font-family:Marker,sans-serif;font-size:15px;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px;display:block}
.lab.first{margin-top:0}
.chip{display:inline-block;border:2px solid #111;border-radius:30px;padding:5px 18px;font-family:Marker,sans-serif;font-size:13.5px;text-transform:uppercase;min-width:116px;text-align:center}
p{margin:0 0 8px}
b,strong{font-weight:800}
.dots{border-bottom:2px dotted #888;height:22px;margin:2px 0}
.line{border-bottom:1.6px solid #111;height:24px;margin:2px 0}
.ck{display:inline-block;width:15px;height:15px;border:2px solid #111;border-radius:3px;vertical-align:-3px;margin-right:4px}
.ck.r{border-radius:50%}
.ck.big{width:22px;height:22px}
.row{display:flex;align-items:center}
.col2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.col3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.col4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.num{font-family:Marker,sans-serif;font-size:16px}
.cap{font-size:11px;color:#555}
.gray{color:#666}
.tiny{font-size:10.5px;color:#666}
.center{text-align:center}
.corner{position:absolute;right:0;bottom:0}
svg{max-width:100%;height:auto}
.corner img{height:70px;display:block}
.corner.l{right:auto;left:0}
.tip{border:2px solid #111;border-radius:30px;padding:8px 18px;font-size:13px;margin-top:12px;display:flex;align-items:center;gap:10px}
.tip b{font-family:Marker,sans-serif;font-weight:400;text-transform:uppercase;font-size:13px}
.cut{border:1.6px dashed #888;border-radius:6px}
.scissors{font-size:11px;color:#777;text-align:center;margin:3px 0}
table{border-collapse:collapse}
.tbl td,.tbl th{border:1.6px solid #111;padding:5px 8px;text-align:left}
.bx{display:inline-block;border:2px solid #111;border-radius:8px;min-width:52px;height:34px;text-align:center;line-height:30px;font-weight:700}
.star{font-family:Marker,sans-serif}
.pill{display:inline-block;border:1.6px solid #111;border-radius:20px;padding:1px 10px;font-size:11.5px;font-weight:700}
.hide{visibility:hidden}
.abs{position:absolute}
"""

def esc(s):
    return _h.escape(s, quote=False)

def img(name, h=None, w=None, cls='', style=''):
    st = ''
    if h: st += f'height:{h}px;'
    if w: st += f'width:{w}px;'
    return f'<img src="img/{name}" class="{cls}" style="{st}{style}" alt="">'

def paul(nome='feliz', h=84, style=''):
    return img(f'paul_{nome}.png', h=h, style=style)

def fala(texto, nome='feliz', lado='l', h=84):
    r = ' r' if lado == 'r' else ''
    return f'<div class="fala{r}"><div class="pic">{paul(nome, h)}</div><div class="bub">{texto}</div></div>'

def titulo(t, sub=None, bar=None):
    w = bar if bar else min(640, int(len(t) * 17 + 46))
    return (f'<h1 class="t">{t}</h1>' + (f'<div class="s">{sub}</div>' if sub else '') + f'<div class="rule" style="width:{w}px"></div>')

def lab(t, first=False):
    return f'<span class="lab{" first" if first else ""}">{t}</span>'

def box(c, cls='', style=''):
    return f'<div class="box {cls}" style="{style}">{c}</div>'

def corner(nome='feliz', h=70, lado='r'):
    return f'<div class="corner{" l" if lado == "l" else ""}">{paul(nome, h)}</div>'

def dots(n=1):
    return '<div class="dots"></div>' * n

def lines(n=1, h=24):
    return f'<div class="line" style="height:{h}px"></div>' * n

def ck(n=1, cls=''):
    return '<span style="white-space:nowrap">' + ' '.join(f'<span class="ck {cls}"></span>' for _ in range(n)) + '</span>'

def tip(t, titulo_='dica do Paul'):
    return f'<div class="tip"><b>{titulo_}:</b><span>{t}</span></div>'

def svg_wrap(inner, w, h, style=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="display:block;{style}">{inner}</svg>'

# ---------- páginas ----------
class Livro:
    def __init__(self):
        self.pages = []      # (id, secao, fn)
        self.ans = []        # (page_id, titulo, html, kind)
        self.num = {}

    def add(self, pid, secao, fn, kind='std', maxz=None):
        self.pages.append([pid, secao, fn, kind, maxz])

    def pg(self, pid):
        return self.num.get(pid, '?')

    def gab(self, pid, titulo_, html_, kind='text'):
        self.ans.append((pid, titulo_, html_, kind))

    def render(self, extra_css=''):
        for i, p in enumerate(self.pages):
            self.num[p[0]] = i + 1
        out = []
        for i, (pid, secao, fn, kind, maxz) in enumerate(self.pages):
            self.cur = pid
            body = fn(self)
            n = i + 1
            if kind == 'raw':      # página inteira desenhada à mão (capa, diploma, arte)
                out.append(body.replace('{{PN}}', str(n)))
                continue
            cls = 'page' + (' land' if kind == 'land' else '') + (' full' if kind == 'full' else '')
            hd = f'<div class="hd"><span>{BOOK} &nbsp;·&nbsp; {SCHOOL}</span><span>{secao}</span></div>'
            ft = f'<div class="ft"><span>BEATERISTA | ROBOTERISTA ENSINA</span><span>{n}</span></div>'
            if kind in ('land', 'full'):
                out.append(f'<section class="{cls}">{body}{ft}</section>')
            else:
                dz = f' data-maxz="{maxz}"' if maxz else ''
                out.append(f'<section class="{cls}"{dz}>{hd}<div class="in"><div class="z">{body}</div></div>{ft}</section>')
        return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Robôterista Ensina — Beaterista Escola de Música</title><style>' + CSS + extra_css + '</style></head><body>' + ''.join(out) + '</body></html>'
