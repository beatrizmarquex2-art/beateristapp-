#!/usr/bin/env python3
"""Trilhas originais (sem direito autoral) pros reels, pensadas pra pais e crianças. Tudo sintetizado aqui.
Uso: python3 marketing/reels/musicas.py ESTILO saida.wav DURACAO   (ESTILO: xilofone | ukulele | rock | bumbap)
Progressão Dó–Sol–Lám–Fá (a mais "cantável" que existe), 1 acorde por compasso."""
import sys, wave, numpy as np
EST, OUT, T = sys.argv[1], sys.argv[2], float(sys.argv[3]); sr = 44100
BPM = {'xilofone': 120, 'ukulele': 112, 'rock': 132, 'bumbap': 92}[EST]; b = 60 / BPM
n = int(sr * (T + 1)); L = np.zeros(n); rng = np.random.default_rng(3)
def add(s, t, g=1.0):
    i = int(t * sr)
    if 0 <= i < n: j = min(n, i + len(s)); L[i:j] += s[:j - i] * g
def tt(d): return np.arange(int(sr * d)) / sr
f = lambda m: 440 * 2 ** ((m - 69) / 12)
def kick(): t = tt(.3); return np.sin(2 * np.pi * np.cumsum(50 + 100 * np.exp(-t * 35)) / sr) * np.exp(-t * 14)
def snare(): t = tt(.2); z = rng.standard_normal(len(t)); z -= np.convolve(z, np.ones(6) / 6, 'same'); return (z * .7 + np.sin(2 * np.pi * 190 * t) * .4) * np.exp(-t * 24)
def clap(): t = tt(.16); z = rng.standard_normal(len(t)); z = np.diff(z, prepend=0); e = np.exp(-t * 30) + .6 * np.exp(-((t - .02) * 300) ** 2); return z * e * .5
def hat(): t = tt(.05); return np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 70) * .4
def shaker(): t = tt(.09); return np.diff(rng.standard_normal(len(t)), prepend=0) * np.sin(np.pi * t / .09) ** 2 * .25
def marimba(m, d=.5): t = tt(d); return (np.sin(2 * np.pi * f(m) * t) + .35 * np.sin(2 * np.pi * f(m) * 4 * t) * np.exp(-t * 30)) * np.exp(-t * 9)
def sino(m, d=.9): t = tt(d); return sum(np.sin(2 * np.pi * f(m) * k * t) * a for k, a in ((1, 1), (2.76, .35), (5.4, .15))) * np.exp(-t * 5)
def baixo(m, d): t = tt(d); return (np.sin(2 * np.pi * f(m) * t) + .3 * np.sin(4 * np.pi * f(m) * t)) * np.minimum(1, t * 200) * np.exp(-t * 4)
def corda(m, d=.6):  # Karplus-Strong: som de ukulele
    N = int(sr / f(m)); buf = rng.uniform(-1, 1, N); out = np.empty(int(sr * d))
    for i in range(len(out)): out[i] = buf[i % N]; buf[i % N] = .996 * .5 * (buf[i % N] + buf[(i + 1) % N])
    return out
def assobio(m, d): t = tt(d); return np.sin(2 * np.pi * f(m) * t + .25 * np.sin(2 * np.pi * 5.5 * t)) * np.minimum(1, t * 25) * np.minimum(1, (d - t) * 18)
def guitarra(ms, d): t = tt(d); s = sum(2 * ((f(m) * t) % 1) - 1 for m in ms); return np.tanh(s * 1.8) * np.minimum(1, t * 300) * np.minimum(1, (d - t) * 60) * .5
ACS = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [57, 60, 64]), (41, [57, 60, 65])]   # baixo, tríade
MEL = [[76, 76, 79, 76], [74, 74, 79, 74], [72, 72, 76, 72], [77, 81, 79, None]]             # 1 nota por tempo
bars = int(T / (4 * b)) + 1
for k in range(bars):
    t0 = k * 4 * b; bx, tr = ACS[k % 4]; mel = MEL[k % 4]
    if EST == 'xilofone':
        for q in range(8): add(marimba(tr[(0, 1, 2, 1, 0, 2, 1, 2)[q]] + 12, .4), t0 + q * b / 2, .5)
        for q in range(4):
            add(kick(), t0 + q * b, .9 if q % 2 == 0 else 0); add(clap(), t0 + q * b, .8 if q % 2 else 0)
            if mel[q]: add(sino(mel[q] + 12, .7), t0 + q * b, .22)
        add(baixo(bx - 12 + 12, b * 1.8), t0, .55); add(baixo(bx, b * 1.8), t0 + 2 * b, .5)
    elif EST == 'ukulele':
        for q, g in zip((0, 1, 1.5, 2.5, 3, 3.5), (1, .8, .55, .6, .8, .55)):
            for j, m in enumerate(tr + [tr[0] + 12]): add(corda(m + 12, .5), t0 + q * b + j * .012 * (1 if q % 1 == 0 else -1), .16 * g)
        for q in range(8): add(shaker(), t0 + q * b / 2, 1 if q % 2 else .6)
        add(kick(), t0, .8); add(kick(), t0 + 2.5 * b, .6); add(clap(), t0 + b, .5); add(clap(), t0 + 3 * b, .5)
        for q in range(4):
            if mel[q]: add(assobio(mel[q] + 12, b * .9), t0 + q * b, .2)
        add(baixo(bx, b * 3.5), t0, .5)
    elif EST == 'rock':
        for q in range(8): add(hat(), t0 + q * b / 2, .8); add(baixo(bx, b * .48), t0 + q * b / 2, .5)
        for q in (0, 2, 2.5): add(kick(), t0 + q * b, 1)
        for q in (1, 3): add(snare(), t0 + q * b, .9)
        for q in (0, 1.5, 3): add(guitarra([bx + 12, bx + 19], b * 1.2), t0 + q * b, .32)
        for q in range(4):
            if mel[q]: add(sino(mel[q], .5), t0 + q * b, .2)
    else:  # bumbap: batida mais lenta, com balanço
        sw = b * .16
        for q in range(8): add(hat(), t0 + q * b / 2 + (sw if q % 2 else 0), .7)
        for q in (0, 1.5 + .16, 2.5): add(kick(), t0 + q * b, 1)
        for q in (1, 3): add(snare(), t0 + q * b, .9); add(clap(), t0 + q * b, .4)
        add(baixo(bx, b * 1.4), t0, .65); add(baixo(bx, b * .8), t0 + 2.5 * b, .55)
        for q in range(4):
            if mel[q]: add(sino(mel[q], 1.0), t0 + q * b, .26); add(marimba(tr[q % 3] + 12, .5), t0 + q * b + b / 2 + sw, .28)
L[int(sr * T):] = 0; fade = int(sr * .6); L[int(sr * T) - fade:int(sr * T)] *= np.linspace(1, 0, fade)
L = np.tanh(L * .9); L = L / max(1e-9, np.abs(L).max()) * .85
w = wave.open(OUT, 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((L[:int(sr * T)] * 32767).astype('<i2').tobytes()); w.close()
