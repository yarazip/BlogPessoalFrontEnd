import { TAMANHO_DA_PREVIA, previaDoTexto } from './previa';

describe('previaDoTexto', () => {
  it('texto curto não é cortado', () => {
    expect(previaDoTexto('Texto curto.')).toEqual({ texto: 'Texto curto.', resumido: false });
  });

  it('texto no limite exato não é cortado', () => {
    const texto = 'a'.repeat(TAMANHO_DA_PREVIA);

    expect(previaDoTexto(texto)).toEqual({ texto, resumido: false });
  });

  it('texto longo é cortado em palavra inteira, sem espaço no fim, e marcado como resumido', () => {
    const previa = previaDoTexto('palavra '.repeat(200).trim());

    expect(previa.resumido).toBeTrue();
    expect(previa.texto.length).toBeLessThanOrEqual(TAMANHO_DA_PREVIA);
    expect(previa.texto.endsWith('palavra')).toBeTrue();
    expect(previa.texto.endsWith(' ')).toBeFalse();
  });

  it('sem espaço para cortar depois da metade, corta no limite', () => {
    const previa = previaDoTexto('a'.repeat(1000));

    expect(previa.texto.length).toBe(TAMANHO_DA_PREVIA);
    expect(previa.resumido).toBeTrue();
  });

  it('não parte um emoji ao meio', () => {
    const texto = 'a'.repeat(TAMANHO_DA_PREVIA - 1) + '😀' + ' resto do texto';

    const previa = previaDoTexto(texto);

    expect(previa.texto).toBe('a'.repeat(TAMANHO_DA_PREVIA - 1));
    expect(previa.texto).not.toMatch(/[\ud800-\udbff]$/);
  });
});
