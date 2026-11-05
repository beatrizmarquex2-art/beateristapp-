// Pacotes de figurinhas do álbum (o novo, de 125) ganhos jogando: contas puras, sem tela e sem armazenamento (rodam em Node nos testes).
export const STARS_PER_CARD = 5;
/** Quantos pacotes ainda são devidos: ★ acumuladas de ritmo ÷ 5, menos os já entregues. */
export const owedByStars = (totalStars, paid = 0, per = STARS_PER_CARD) => Math.max(0, Math.floor((totalStars || 0) / per) - (paid || 0));
/** Quantas ★ faltam pro próximo pacote de ritmo. */
export const starsToNext = (totalStars, per = STARS_PER_CARD) => per - ((totalStars || 0) % per);
