import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMATOS, frase, nomeArquivo } from '../js/figurinhas/estrelas-card.js';
test('cartão de conquista das estrelas: formatos e textos', () => {
  assert.deepEqual(FORMATOS, { post: [1080, 1350], story: [1080, 1920] });
  assert.equal(nomeArquivo('story', 87), 'BEATERISTA_ESTRELAS_87_story.png'); assert.equal(nomeArquivo('post', -3), 'BEATERISTA_ESTRELAS_0_post.png');
  assert.ok(frase(0) !== frase(1) && frase(1) !== frase(30) && frase(30) !== frase(100) && frase(100) !== frase(300));
});
