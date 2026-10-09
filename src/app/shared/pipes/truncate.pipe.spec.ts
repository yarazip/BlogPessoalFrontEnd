import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('não mexe em textos curtos', () => {
    expect(pipe.transform('curto', 10)).toBe('curto');
  });

  it('corta e acrescenta reticências', () => {
    expect(pipe.transform('0123456789ABC', 10)).toBe('0123456789...');
  });

  it('pode cortar em palavra completa', () => {
    expect(pipe.transform('uma frase bem comprida', 12, true)).toBe('uma frase...');
  });

  it('devolve vazio para valor ausente', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(undefined as unknown as string)).toBe('');
  });
});
