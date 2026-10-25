// Leitor mínimo de .zip (stored/deflate) usando DecompressionStream do navegador. Sem dependências.
async function inflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
export async function readZip(buffer) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador não abre .zip. Envie os arquivos .md soltos.');
  const u8 = new Uint8Array(buffer), dv = new DataView(buffer);
  let e = u8.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Esse arquivo não parece um .zip válido.');
  const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = [];
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (name.endsWith('/') || name.startsWith('__MACOSX') || name.split('/').pop().startsWith('._')) continue;
    const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    const data = u8.subarray(start, start + csize);
    out.push({ name, read: async () => new Uint8Array(method === 0 ? data : await inflate(data)) });
  }
  return out;
}
