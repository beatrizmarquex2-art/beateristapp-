// Chave por aluno (mesma regra de figurinhas/dono.js), sem puxar o banco de dados: serve pra arquivos que o progresso-nuvem.js usa (testado sem navegador).
export const dono = () => { try { return (localStorage.getItem('beaterista-aluno-nome') || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30); } catch { return ''; } };
export const chave = (base) => { const d = dono(); return d ? `${base}:${d}` : base; };
