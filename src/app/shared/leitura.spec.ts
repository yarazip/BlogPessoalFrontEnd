import { contarPalavras, minutosDeLeitura } from './leitura';

describe('minutosDeLeitura', () => {
  const palavras = (n: number) => Array(n).fill('palavra').join(' ');

  it('texto curto ou vazio conta 1 minuto', () => {
    expect(minutosDeLeitura('')).toBe(1);
    expect(minutosDeLeitura('oi')).toBe(1);
  });

  it('200 palavras é 1 minuto; 201 passa para 2', () => {
    expect(minutosDeLeitura(palavras(200))).toBe(1);
    expect(minutosDeLeitura(palavras(201))).toBe(2);
  });

  it('ignora espaços e quebras de linha repetidos', () => {
    expect(minutosDeLeitura(`  ${palavras(400)}\n\n\n  `)).toBe(2);
  });

  describe('contarPalavras', () => {
    it('conta palavras ignorando espaços e quebras de linha repetidos', () => {
      expect(contarPalavras('')).toBe(0);
      expect(contarPalavras('   ')).toBe(0);
      expect(contarPalavras('uma')).toBe(1);
      expect(contarPalavras('  uma   frase\n\ncom  cinco palavras ')).toBe(5);
    });
  });
});
