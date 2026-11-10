// Compatibilidade com iPhones/iPads mais antigos (iOS antes do 15.4): sem isso o app quebrava com erros como
// "crypto.randomUUID is not a function" ou ".at is not a function". Cada item só entra se o aparelho não tiver.
(() => {
  const g = typeof globalThis !== 'undefined' ? globalThis : window;
  const def = (obj, nome, fn) => { try { if (obj && typeof obj[nome] !== 'function') Object.defineProperty(obj, nome, { value: fn, writable: true, configurable: true }); } catch { /* aparelho não deixa: segue sem */ } };
  // crypto.randomUUID (iOS 15.4+)
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    def(g.crypto, 'randomUUID', function randomUUID() {
      const b = g.crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
      const x = Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('');
      return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
    });
  }
  // .at(-1) em listas e textos (iOS 15.4+)
  const at = function at(i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return i < 0 || i >= this.length ? undefined : this[i]; };
  for (const C of [Array, String, Uint8Array, Float32Array, Int32Array]) def(C.prototype, 'at', at);
  // findLast / findLastIndex (iOS 15.4+)
  def(Array.prototype, 'findLast', function findLast(f, t) { for (let i = this.length - 1; i >= 0; i--) if (f.call(t, this[i], i, this)) return this[i]; return undefined; });
  def(Array.prototype, 'findLastIndex', function findLastIndex(f, t) { for (let i = this.length - 1; i >= 0; i--) if (f.call(t, this[i], i, this)) return i; return -1; });
  // Object.hasOwn (iOS 15.4+)
  def(Object, 'hasOwn', function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); });
  // String.replaceAll (iOS 13.4+)
  def(String.prototype, 'replaceAll', function replaceAll(a, b) { return a instanceof RegExp ? this.replace(a, b) : this.split(String(a)).join(b); });
  // structuredClone (iOS 15.4+): cópia simples por JSON (os dados do app são JSON puro)
  if (typeof g.structuredClone !== 'function') { try { g.structuredClone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v))); } catch { /* sem */ } }
})();
