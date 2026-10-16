import { chaveDoMes, mesValido, nomeDoMes, nomeDoMesDaChave } from './arquivo';

describe('arquivo', () => {
  it('chaveDoMes completa o mês com zero', () => {
    expect(chaveDoMes(2026, 10)).toBe('2026-10');
    expect(chaveDoMes(2026, 3)).toBe('2026-03');
  });

  describe('mesValido', () => {
    it('aceita aaaa-mm com mês de 01 a 12', () => {
      expect(mesValido('2026-10')).toBe('2026-10');
      expect(mesValido('1999-01')).toBe('1999-01');
    });

    it('recusa o que não é um mês (a barra de endereço é entrada de quem quiser)', () => {
      for (const ruim of ['2026-13', '2026-00', '2026-1', 'outubro', '2026-10-01', "2026-10'; drop", '', null, undefined]) {
        expect(mesValido(ruim)).toBeNull();
      }
    });
  });

  it('nomeDoMes escreve o mês por extenso', () => {
    expect(nomeDoMes(2026, 10)).toBe('outubro 2026');
    expect(nomeDoMes(2026, 3)).toBe('março 2026');
  });

  it('nomeDoMesDaChave só escreve chave válida', () => {
    expect(nomeDoMesDaChave('2026-08')).toBe('agosto 2026');
    expect(nomeDoMesDaChave('lixo')).toBe('');
    expect(nomeDoMesDaChave(null)).toBe('');
  });
});
