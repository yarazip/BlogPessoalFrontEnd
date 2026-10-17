import { nomeDoTema, normalizarTema } from './tema';

describe('tema', () => {
  describe('nomeDoTema', () => {
    it('tira as aspas dos temas antigos e os espaços das pontas', () => {
      expect(nomeDoTema("'Tecnologia'")).toBe('Tecnologia');
      expect(nomeDoTema('"Escrita"')).toBe('Escrita');
      expect(nomeDoTema('  Rotina ')).toBe('Rotina');
    });

    it('ausente vira texto vazio', () => {
      expect(nomeDoTema(undefined)).toBe('');
      expect(nomeDoTema(null)).toBe('');
    });
  });

  describe('normalizarTema', () => {
    it('ignora acento, maiúscula e espaços repetidos', () => {
      expect(normalizarTema('  CAFÉ   da  Manhã ')).toBe('cafe da manha');
      expect(normalizarTema('Café')).toBe(normalizarTema('cafe'));
    });
  });
});
