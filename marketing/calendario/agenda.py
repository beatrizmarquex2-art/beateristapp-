#!/usr/bin/env python3
"""Agente de agenda da Beaterista (sem depender de app nenhum).

Lê catalogo.py (peças prontas), aplica as regras abaixo e escreve:
  agenda.json · agenda.csv · agenda.ics (importa no Google Agenda / iPhone: avisa no celular na hora de postar)
  index.html (calendário com legenda pra copiar, versão leve que usa as miniaturas da pasta thumbs/)
  calendario-completo.html (um arquivo só, com as miniaturas dentro: serve pra mandar por zap/e-mail)

Uso:  python3 marketing/calendario/agenda.py [--inicio 2026-11-28] [--ate 2026-12-31]
Ele NÃO publica nada em rede social: só planeja. Postar depende do ok da Bea em cada peça.
"""
import argparse, base64, csv, datetime as dt, io, json, os, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from catalogo import PECAS, TAGS, CONTATO, EXCLUIDAS  # noqa: E402

PRONTOS = os.path.normpath(os.path.join(AQUI, "..", "prontos"))
THUMBS = os.path.join(AQUI, "thumbs")
DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
REDES = {"paul": "@jogos.beaterista", "bea": "@beaterista_", "tiktok": "TikTok @beaterista"}

# ritmo semanal: dia da semana (0 = segunda) -> horários. tipos: o primeiro é o preferido, os outros só se faltar peça.
def S(hora, perfil, tipos, prefs):
    return dict(hora=hora, perfil=perfil, tipos=tipos, prefs=prefs)

FERIADOS = {
    "12-24": "véspera de Natal: não há arte de Natal pronta. Criar uma arte (ou deixar o perfil descansar).",
    "12-25": "Natal: não há arte de Natal pronta. Criar uma arte (ou deixar o perfil descansar).",
    "01-01": "ano novo: não há arte pronta. Criar uma arte (ou deixar o perfil descansar).",
}

RITMO = {
    0: [S("19:00", "paul", ["reel"], ["jogos", "pais"])],
    1: [S("12:00", "paul", ["cartaz", "reel"], ["paul"]), S("20:00", "bea", ["reel", "carrossel"], ["curso", "prova", "profs"])],
    2: [S("19:00", "paul", ["reel"], ["pais", "prova", "album", "profs"])],
    3: [S("12:00", "paul", ["carrossel", "reel"], ["pais", "loja", "jogos"])],
    4: [S("18:00", "paul", ["reel"], ["loja", "jogos"])],
    5: [S("11:00", "paul", ["reel"], ["jogos", "album", "prova"]), S("16:00", "bea", ["reel", "carrossel"], ["curso", "prova", "profs"])],
    6: [S("10:00", "paul", ["cartaz", "carrossel"], ["paul", "quiz"])],
}

# peças fixas em data/perfil/hora (o que a Bea pediu ou tem prazo)
ANCORAS = {
    ("2026-11-28", "paul", "11:00"): "ap1",   # apresentação do Paul abre tudo
    ("2026-11-28", "bea", "16:00"): "r21",    # apostila com prazo
    ("2026-11-29", "paul", "10:00"): "ap2",   # o que é a Beaterista
    ("2026-11-30", "paul", "19:00"): "r21",   # último dia da apostila no perfil do Paul
    ("2026-12-01", "bea", "20:00"): "ap3",    # apresentação da Bea
}

FASES = [  # datas da planilha de cupons (sem os códigos, que são privados)
    ("2026-11-28", "2026-12-04", "Semana de apresentação", "apresenta o Paul, a escola e a Bea; apostila até 30/nov"),
    ("2026-12-05", "2026-12-15", "Campanha de lançamento", "jogos e passe; a campanha de lançamento termina em 15/12"),
    ("2026-12-16", "2026-12-31", "Natal e virada", "começa a campanha de Natal em 16/12; preço muda em 01/01"),
    ("2027-01-01", "2027-07-01", "2027", "campanha de 2027 até 01/07"),
]
MARCOS = [
    ("2026-11-30", "Último dia da apostila a R$ 14,90", "tirar o story da apostila dos destaques em 01/12."),
    ("2026-12-15", "Termina a campanha de lançamento", "fonte: planilha de cupons."),
    ("2026-12-16", "Começa a campanha de Natal", "fonte: planilha de cupons. Não há arte de Natal pronta: ver 'peças que faltam'."),
    ("2027-01-01", "Preço muda (campanha 2027)", "peças com R$ 49,90 do passe não valem mais sem confirmar com a Bea."),
]
FALTAM = [
    "3 artes de Natal (presente de Natal: passe e materiais; 16 a 25/12)",
    "mais peças pro perfil da Bea (curso, depoimentos, bastidores): acabam em meados de dezembro",
    "1 reel curto de virada de ano (o que o Paul vai ensinar em 2027)",
    "1 reel de volta às aulas (janeiro/fevereiro)",
    "arte nova com o valor de 2027, no lugar das que mostram R$ 49,90",
    "kit de divulgação dos Cards do Paul (quando tiver link de venda)",
    "livro de colorir (2 posts e 2 stories já feitos: entram quando tiver link da Hotmart)",
]
TAREFAS = [
    ("2026-11-28", "09:00", "Criar os destaques do Instagram", "use as capas de marketing/prontos/destaques/ (o que é, jogos, pais, profs, álbum, lojinha, curso). Não criar o do gibi."),
    ("2026-12-01", "09:00", "Tirar a apostila dos destaques", "o prazo de R$ 14,90 acabou em 30/nov."),
]


def d(s):
    return dt.date.fromisoformat(s)


def fase(dia):
    for a, b, nome, _ in FASES:
        if d(a) <= dia <= d(b):
            return nome
    return ""


def arquivos(p):
    if not p.get("arq"):
        return []
    if "{i}" in p["arq"]:
        return [p["arq"].replace("{i}", str(i + 1)) for i in range(p["n"])]
    return [p["arq"]]


def planejar(inicio, ate):
    por_id = {p["id"]: p for p in PECAS}
    usos = {}      # (id, perfil) -> data
    ultimo = {}    # perfil -> pilar da última peça
    itens, lacunas = [], []

    def usar(pid, perfil, dia):
        usos[(pid, perfil)] = dia

    def livre(p, perfil, dia, ancora=False):
        if p["tipo"] == "story":
            return False
        if p["perfil"] not in (perfil, "ambos"):
            return False
        if (p["id"], perfil) in usos and not ancora:
            return False
        if not ancora:  # peça ambos já usada no outro perfil só volta depois de 7 dias
            for o in ("paul", "bea"):
                u = usos.get((p["id"], o))
                if u and abs((dia - u).days) < 7:
                    return False
        if p.get("fim") and dia > d(p["fim"]):
            return False
        if p["pilar"] == "apresentacao":  # as de apresentação só entram nas âncoras
            return False
        return True

    def item(dia, hora, rede, p, extra=None):
        pilar = p["pilar"]
        it = dict(data=dia.isoformat(), dia=DIAS[dia.weekday()], hora=hora, rede=rede, tipo=p["tipo"], id=p["id"],
                  titulo=p["titulo"], pilar=pilar, fase=fase(dia),
                  status="precisa_ok" if p.get("ok_bea") else "planejado",
                  obs=p.get("obs", ""))
        if extra:
            it.update(extra)
        return it

    dia = inicio
    while dia <= ate:
        for s in sorted(RITMO[dia.weekday()], key=lambda x: x["hora"]):
            perfil = s["perfil"]
            if dia.strftime("%m-%d") in FERIADOS:
                if perfil == "paul":
                    itens.append(dict(data=dia.isoformat(), dia=DIAS[dia.weekday()], hora=s["hora"], rede="paul", tipo="lacuna", id="lacuna",
                                      titulo="Sem post pronto de data comemorativa", pilar="lacuna", fase=fase(dia), status="planejado",
                                      obs=FERIADOS[dia.strftime("%m-%d")]))
                continue
            chave = (dia.isoformat(), perfil, s["hora"])
            if chave in ANCORAS:
                p = por_id[ANCORAS[chave]]
                usar(p["id"], perfil, dia)
            else:
                melhor, nota = None, None
                for p in PECAS:
                    if p["tipo"] not in s["tipos"] or not livre(p, perfil, dia):
                        continue
                    rank = s["prefs"].index(p["pilar"]) if p["pilar"] in s["prefs"] else len(s["prefs"]) + 2
                    nota_p = rank * 10 + s["tipos"].index(p["tipo"]) * 30 + p.get("ordem", 50)
                    if ultimo.get(perfil) == p["pilar"]:
                        nota_p += 25   # não repetir o assunto em sequência
                    recentes = sum(1 for (q, pf), u in usos.items() if pf == perfil and por_id[q]["pilar"] == p["pilar"] and 0 <= (dia - u).days <= 10)
                    nota_p += recentes * 9   # espalhar os assuntos
                    if p.get("ok_bea"):
                        nota_p += 45   # peça que precisa da Bea ouvir antes fica pro fim
                    if p.get("fim") and (d(p["fim"]) - dia).days <= 3:
                        nota_p -= 100  # prazo curto passa na frente
                    if nota is None or nota_p < nota:
                        melhor, nota = p, nota_p
                p = melhor
                if not p:
                    lacunas.append(dict(data=dia.isoformat(), hora=s["hora"], rede=perfil, motivo="sem peça pronta pra esse horário"))
                    itens.append(dict(data=dia.isoformat(), dia=DIAS[dia.weekday()], hora=s["hora"], rede=perfil, tipo="lacuna", id="lacuna",
                                      titulo="Falta peça pra este horário", pilar="lacuna", fase=fase(dia), status="planejado",
                                      obs="acabaram as peças prontas pra este perfil. Criar uma nova (curso, depoimento ou bastidor) ou pular o dia."))
                    continue
                usar(p["id"], perfil, dia)
            ultimo[perfil] = p["pilar"]
            itens.append(item(dia, s["hora"], perfil, p))
            if p["tipo"] == "reel" and p.get("tiktok") and perfil in ("paul",):
                t = dia + dt.timedelta(days=1)
                if t <= ate:
                    itens.append(item(t, "21:00", "tiktok", p, dict(obs="mesmo vídeo do reel, no TikTok. " + p.get("obs", ""))))
        dia += dt.timedelta(days=1)

    # stories de arte, ligados às peças de feed
    def story(sid, data, hora, rede, obs=""):
        p = por_id[sid]
        if d(data) < inicio or d(data) > ate:
            return
        it = item(d(data), hora, "story", p, dict(perfil_story=rede))
        if obs:
            it["obs"] = obs
        itens.append(it)

    story("s_semana01", "2026-11-28", "11:10", "paul")
    story("s_apostila", "2026-11-28", "16:10", "ambos", "figurinha de link pra apostila na lojinha.")
    story("s_apostila", "2026-11-29", "12:00", "ambos", "lembrete: faltam 2 dias.")
    story("s_apostila", "2026-11-30", "10:00", "ambos", "último dia.")
    for i, dia_q in enumerate(sorted(x for x in {d(i["data"]) for i in itens} if x.weekday() == 2)):
        if i == 0:
            story("s_enquete1", dia_q.isoformat(), "19:10", "paul")
        elif i == 2:
            story("s_enquete2", dia_q.isoformat(), "19:10", "paul")
    for i in [x for x in itens if x["id"] == "c_passe_carrossel" and x["tipo"] == "carrossel"]:
        story("s_passe", i["data"], "12:10", "paul")

    # rotina diária de story: reaproveitar o post do dia
    dias_post = sorted({i["data"] for i in itens if i["rede"] in ("paul", "bea")})
    for ds in dias_post:
        itens.append(dict(data=ds, dia=DIAS[d(ds).weekday()], hora="20:30", rede="story", tipo="rotina", id="rotina",
                          titulo="Compartilhar o post do dia nos stories", pilar="rotina", fase=fase(d(ds)), status="planejado",
                          obs="reposte o post de hoje nos stories com figurinha de link/enquete e responda os comentários."))

    for data, hora, tit, obs in TAREFAS:
        if inicio <= d(data) <= ate:
            itens.append(dict(data=data, dia=DIAS[d(data).weekday()], hora=hora, rede="tarefa", tipo="tarefa", id="tarefa",
                              titulo=tit, pilar="tarefa", fase=fase(d(data)), status="planejado", obs=obs))
    dia = inicio
    while dia <= ate:
        if dia.weekday() == 6:
            itens.append(dict(data=dia.isoformat(), dia="domingo", hora="21:00", rede="tarefa", tipo="tarefa", id="tarefa",
                              titulo="Olhar os Insights da semana", pilar="tarefa", fase=fase(dia), status="planejado",
                              obs="veja em que horas os seguidores estão online e ajuste os horários da semana que vem."))
        dia += dt.timedelta(days=1)

    for data, tit, obs in MARCOS:
        if inicio <= d(data) <= ate:
            itens.append(dict(data=data, dia=DIAS[d(data).weekday()], hora="00:00", rede="marco", tipo="marco", id="marco",
                              titulo=tit, pilar="marco", fase=fase(d(data)), status="planejado", obs=obs))

    itens.sort(key=lambda x: (x["data"], x["hora"]))
    return itens, lacunas


def legenda_completa(p, rede):
    if not p.get("legenda"):
        return ""
    return p["legenda"] + "\n\n" + TAGS.get(p["pilar"], "")


# ---------- miniaturas ----------
def fazer_miniaturas():
    from PIL import Image
    os.makedirs(THUMBS, exist_ok=True)
    for p in PECAS:
        saida = os.path.join(THUMBS, p["id"] + ".jpg")
        if os.path.exists(saida) or not p.get("arq"):
            continue
        origem = os.path.join(PRONTOS, arquivos(p)[0])
        if not os.path.exists(origem):
            print("faltou arquivo:", origem)
            continue
        if origem.endswith(".mp4"):
            tmp = saida + ".png"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1.2", "-i", origem, "-frames:v", "1", tmp], check=True)
            origem = tmp
        im = Image.open(origem).convert("RGB")
        im.thumbnail((360, 640))
        im.save(saida, "JPEG", quality=72, optimize=True)
        if origem.endswith(".png"):
            os.remove(origem)


def miniatura_b64(pid):
    f = os.path.join(THUMBS, pid + ".jpg")
    if os.path.exists(f):
        return "data:image/jpeg;base64," + base64.b64encode(open(f, "rb").read()).decode()
    return ""


# ---------- saídas ----------
def escrever_csv(itens, pecas):
    with open(os.path.join(AQUI, "agenda.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["data", "dia", "hora", "rede", "tipo", "peça", "arquivo", "legenda", "obs", "status"])
        for i in itens:
            p = pecas.get(i["id"], {})
            w.writerow([i["data"], i["dia"], i["hora"], REDES.get(i["rede"], i["rede"]), i["tipo"], i["titulo"],
                        ", ".join(arquivos(p)) if p else "", p.get("legenda", ""), i["obs"], i["status"]])


def esc_ics(t):
    return t.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def escrever_ics(itens, pecas):
    L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Beaterista//Agenda de posts//PT", "CALSCALE:GREGORIAN",
         "X-WR-CALNAME:Posts da Beaterista", "X-WR-TIMEZONE:America/Sao_Paulo"]
    for n, i in enumerate(itens):
        if i["tipo"] == "marco":
            ini = i["data"].replace("-", "")
            fim = (d(i["data"]) + dt.timedelta(days=1)).strftime("%Y%m%d")
            L += ["BEGIN:VEVENT", "UID:marco-%d@beaterista" % n, "DTSTAMP:20261127T120000Z",
                  "DTSTART;VALUE=DATE:" + ini, "DTEND;VALUE=DATE:" + fim, "SUMMARY:" + esc_ics("📌 " + i["titulo"]),
                  "DESCRIPTION:" + esc_ics(i["obs"]), "END:VEVENT"]
            continue
        p = pecas.get(i["id"], {})
        h, m = i["hora"].split(":")
        ini = dt.datetime.fromisoformat(i["data"] + "T%s:%s:00" % (h, m))
        fim = ini + dt.timedelta(minutes=15)
        rede = REDES.get(i["rede"], i["rede"])
        desc = "%s\nrede: %s\n" % (i["titulo"], rede)
        if p:
            desc += "arquivo: marketing/prontos/%s\n" % (arquivos(p)[0] if arquivos(p) else "(Drive)")
            desc += "\nLEGENDA:\n" + legenda_completa(p, i["rede"]) + "\n"
        if i["obs"]:
            desc += "\nATENÇÃO: " + i["obs"]
        if i["status"] == "precisa_ok":
            desc += "\n(precisa do ok da Bea antes de postar)"
        L += ["BEGIN:VEVENT", "UID:post-%d@beaterista" % n, "DTSTAMP:20261127T120000Z",
              "DTSTART;TZID=America/Sao_Paulo:" + ini.strftime("%Y%m%dT%H%M%S"),
              "DTEND;TZID=America/Sao_Paulo:" + fim.strftime("%Y%m%dT%H%M%S"),
              "SUMMARY:" + esc_ics("%s · %s" % (rede, i["titulo"])), "DESCRIPTION:" + esc_ics(desc),
              "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Hora de postar", "TRIGGER:-PT30M", "END:VALARM", "END:VEVENT"]
    L.append("END:VCALENDAR")
    open(os.path.join(AQUI, "agenda.ics"), "w", encoding="utf-8", newline="").write("\r\n".join(L) + "\r\n")


def montar_html(dados, inline):
    modelo = open(os.path.join(AQUI, "modelo.html"), encoding="utf-8").read()
    if inline:
        for p in dados["pecas"].values():
            p["thumb"] = miniatura_b64(p["id"])
    else:
        for p in dados["pecas"].values():
            p["thumb"] = "thumbs/%s.jpg" % p["id"] if os.path.exists(os.path.join(THUMBS, p["id"] + ".jpg")) else ""
    dados["inline"] = inline
    js = json.dumps(dados, ensure_ascii=False).replace("</", "<\\/")
    return modelo.replace("/*DADOS*/null", js)


def pagina(fragmento):
    """o modelo é um fragmento (o Artifact põe o esqueleto); no repo precisa do esqueleto completo."""
    topo = ('<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>[hidden]{display:none!important}img{max-width:100%}</style></head><body>\n')
    # o <title> e os <meta>/<link>/<style> do fragmento ficam onde estão: o navegador os aceita no corpo
    return topo + fragmento + "\n</body></html>\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inicio", default="2026-11-28")
    ap.add_argument("--ate", default="2026-12-31")
    ap.add_argument("--fragmento", help="caminho pra gravar a versão sem esqueleto (pra publicar como Artifact)")
    a = ap.parse_args()
    fazer_miniaturas()
    itens, lacunas = planejar(d(a.inicio), d(a.ate))
    pecas = {}
    for p in PECAS:
        q = dict(p)
        q["arquivos"] = arquivos(p)
        q["legenda_completa"] = legenda_completa(p, "")
        q["drive_url"] = "https://drive.google.com/file/d/%s/view" % p["drive"] if p.get("drive") else ""
        pecas[p["id"]] = q
    json.dump(itens, open(os.path.join(AQUI, "agenda.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    escrever_csv(itens, pecas)
    escrever_ics(itens, pecas)
    feed0 = {i["id"] for i in itens if i["rede"] in ("paul", "bea", "tiktok")}
    sobra = [p["titulo"] for p in PECAS if p["id"] not in feed0 and p["tipo"] != "story" and p["pilar"] != "apresentacao"]
    dados = dict(sobra=sobra, itens=itens, pecas=pecas, fases=FASES, lacunas=lacunas, faltam=FALTAM, excluidas=EXCLUIDAS,
                 redes=REDES, inicio=a.inicio, ate=a.ate)
    open(os.path.join(AQUI, "index.html"), "w", encoding="utf-8").write(pagina(montar_html(json.loads(json.dumps(dados)), False)))
    frag = montar_html(json.loads(json.dumps(dados)), True)
    open(os.path.join(AQUI, "calendario-completo.html"), "w", encoding="utf-8").write(pagina(frag))
    if a.fragmento:
        open(a.fragmento, "w", encoding="utf-8").write(frag)
    feed = [i for i in itens if i["rede"] in ("paul", "bea", "tiktok")]
    usadas = {i["id"] for i in feed}
    sobra = [p["titulo"] for p in PECAS if p["id"] not in usadas and p["tipo"] != "story" and p["pilar"] != "apresentacao"]
    print("itens:", len(itens), "· posts de feed/tiktok:", len(feed), "· lacunas:", len(lacunas))
    print("peças que não couberam no período (%d): %s" % (len(sobra), "; ".join(sobra)))


if __name__ == "__main__":
    main()
