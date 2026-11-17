#!/usr/bin/env python3
"""Regra da Bea (nov/2026) pras figurinhas de artistas (catalogo.json):
  seção  = Bandas (grupo) ou Artistas (pessoa). Beatlemania e Beaterista não mudam.
  rara   = músico/instrumentista (Slash, Angus, Eloy...) + os cantores que a Bea escolheu + as duplas.
  comum  = banda, cantor de banda e os outros cantores.
O modelo do card acompanha a raridade (C/R e M1-M4/M5-M6). Rodar de novo não muda nada."""
import json, os
P = os.path.join(os.path.dirname(__file__), '..', 'assets', 'figurinhas', 'catalogo.json')
BANDAS = {'Nirvana', 'Terno Rei', 'Legião Urbana', 'Skank', 'Jota Quest', 'NX Zero', 'Imagine Dragons', 'Linkin Park', 'Metallica', 'Led Zeppelin', 'KISS', 'Green Day',
          "Guns N' Roses", 'The Rolling Stones', 'AC/DC — Angus Young e Brian Johnson', 'Red Hot Chili Peppers', 'Oasis', 'Paramore', 'Blink-182', 'Black Sabbath', 'Slipknot',
          'System of a Down', 'Muse', 'Arctic Monkeys', 'Coldplay', 'The Strokes', 'The Neighbourhood', 'The 1975', 'Polyphia', 'Bring Me the Horizon', 'Radiohead',
          'Twenty One Pilots', 'AC/DC', 'Bon Jovi', 'Charlie Brown Jr.', 'Limp Bizkit', 'My Chemical Romance', 'Gorillaz', 'Restart', 'Mamonas Assassinas', 'Queen'}
MUSICOS = {'John Bonham', 'Eloy Casagrande', 'Angus Young', 'Slash', 'Dave Grohl — Nirvana', 'Flea', 'Jimi Hendrix', 'Tim Henson'}
CANTORES_RAROS = {'Michael Jackson', 'Justin Bieber', 'Chorão', 'John Mayer', 'Bad Bunny', 'Eminem', 'Beyoncé', 'Paul McCartney'}  # escolhidos pela Bea
DUPLAS = {'Justin Bieber e Billie Eilish', 'Paul McCartney e Michael Jackson'}
cat = json.load(open(P, encoding='utf8')); nc = nr = 0; mud = []
for c in cat:
    if c['colecao'] in ('Beatles', 'Beaterista'): continue
    nome = c['artista_banda']; banda = nome in BANDAS
    rara = (not banda) and (nome in MUSICOS or nome in CANTORES_RAROS or nome in DUPLAS)
    secao = 'Bandas' if banda else 'Artistas'; rar = 'Rara' if rara else 'Comum'
    if rara: modelo, m2 = f'R0{nr % 2 + 1}', f'M{5 + nr % 2}'; nr += 1
    else: modelo, m2 = f'C0{nc % 2 + 1}', f'M{1 + nc % 4}'; nc += 1
    if c['raridade'] != rar: mud.append(f"{c['codigo']} {nome}: {c['raridade']} -> {rar}")
    if c['raridade'] != rar or c.get('secao') != secao:
        if c['raridade'] != rar: c['modelo'], c['modelo2'] = modelo, m2
        c['raridade'], c['secao'] = rar, secao
        c['criterio_raridade'] = ('músico/artista escolhido pela Bea: rara' if rara else 'banda ou cantor: comum') + ' (regra de nov/2026)'
json.dump(cat, open(P, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('\n'.join(mud)); print(len(mud), 'mudaram de raridade')
