// Em qual espaço a Bea está: "bea" (dela) ou "beaterista" (aulas e alunos). Define qual menu ☰ abre. Guardado só neste aparelho.
const KEY = 'bt-space';
export const getSpace = () => { try { return localStorage.getItem(KEY) === 'beaterista' ? 'beaterista' : 'bea'; } catch { return 'bea'; } };
export const setSpace = (s) => { try { localStorage.setItem(KEY, s === 'beaterista' ? 'beaterista' : 'bea'); } catch { /* sem armazenamento */ } document.documentElement.dataset.space = getSpace(); };
