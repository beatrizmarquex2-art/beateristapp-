# Agenda de posts da Beaterista

Calendário feito em casa, sem Metricool, vidIQ ou qualquer app. Planeja as peças que já estão prontas
(`marketing/prontos/` + as artes de apresentação do Drive) e entrega:

| arquivo | pra quê |
|---|---|
| `index.html` | calendário no navegador: toque na peça, copie a legenda (já com hashtags) e marque "postado" |
| `calendario-completo.html` | o mesmo, num arquivo só (miniaturas dentro), bom pra mandar por zap/e-mail |
| `agenda.ics` | importar no Google Agenda ou no calendário do iPhone: avisa 30 min antes e traz a legenda no evento |
| `agenda.csv` | planilha (abre no Excel/Sheets) |
| `agenda.json` | os dados |

## Refazer o calendário
```
python3 marketing/calendario/agenda.py --inicio 2026-11-28 --ate 2027-01-31
```
Precisa só de Python 3, Pillow e ffmpeg (pras miniaturas). Peça nova: acrescentar uma linha em `catalogo.py`.

## Regras do agente (em `agenda.py`)
- Ritmo: Paul (`@jogos.beaterista`) todo dia (seg reel jogos · ter cartaz · qua reel pais/prova · qui carrossel · sex reel loja · sáb reel · dom cartaz); Bea (`@beaterista_`) ter e sáb; TikTok espelha os reels do Paul no dia seguinte às 21h; story de reposte todo dia 20h30; Insights no domingo.
- Começa pelas apresentações (Paul, escola, Bea) e pela apostila com prazo (30/nov).
- Não repete o mesmo assunto em sequência e espalha os assuntos; peça com prazo passa na frente.
- Peça que precisa da Bea ouvir/conferir vai pro fim e sai marcada "conferir".
- Não agenda: gibi (cancelado), stories-semanas com erro, colorir e Cards (sem link de venda), fotos de alunos com criança.
- 24/12, 25/12 e 01/01 ficam sem post, avisando que falta arte de data comemorativa.
- Horário sem peça pronta aparece como "falta criar" (acaba o estoque da Bea em meados de dezembro).
- As datas das fases (lançamento até 15/12, Natal a partir de 16/12, 2027) vêm da planilha de cupons do Drive; os códigos de cupom NÃO entram aqui porque o repositório é público.

## Limite honesto
O agente **planeja e lembra**; ele não publica sozinho. Publicar direto no Instagram/TikTok exige a API da Meta/TikTok
(app aprovado + token) ou um serviço de agendamento. Pra postar: abrir o evento, copiar a legenda e subir a peça (ou usar o
agendador gratuito do Meta Business Suite só pra colar a peça). **Nada vai ao ar sem o ok da Bea em cada peça.**
