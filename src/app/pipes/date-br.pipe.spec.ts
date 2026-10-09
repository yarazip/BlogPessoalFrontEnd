import { DateBrPipe } from './date-br.pipe';

describe('DateBrPipe', () => {
  const pipe = new DateBrPipe();

  it('formata no fuso de São Paulo (UTC-3)', () => {
    expect(pipe.transform('2024-01-10T15:30:00Z')).toBe('10/01/2024 12:30');
  });

  it('aceita padrão personalizado', () => {
    expect(pipe.transform('2024-01-10T15:30:00Z', 'dd/MM/yyyy')).toBe('10/01/2024');
  });

  it('devolve vazio para valor ausente', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('devolve vazio para data inválida, sem lançar erro', () => {
    expect(pipe.transform('não é uma data')).toBe('');
  });
});
