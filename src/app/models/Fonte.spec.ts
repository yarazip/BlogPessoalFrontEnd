import { FONTES, FontePostagem, fonteDe, pesoDoTituloDe, pilhaDe } from './Fonte';

describe('catálogo de fontes', () => {
  it('tem as mesmas 7 fontes do back-end, na mesma ordem (FontePostagem.java)', () => {
    expect(FONTES.map(f => f.id)).toEqual([
      'INSTRUMENT_SERIF',
      'FRAUNCES',
      'RIGHTEOUS',
      'RYE',
      'MEA_CULPA',
      'RUBIK_VINYL',
      'RAMPART_ONE'
    ]);
  });

  it('cada fonte tem nome, pilha com alternativa genérica e parâmetro do Google Fonts', () => {
    for (const f of FONTES) {
      expect(f.nome).withContext(f.id).toBeTruthy();
      expect(f.pilha).withContext(f.id).toMatch(/^'[^']+', (serif|sans-serif|cursive)$/);
      expect(f.google).withContext(f.id).toMatch(/^[A-Za-z+]+(:wght@[\d;]+)?$/);
    }
  });

  it('a pilha de cada fonte começa pelo nome da própria fonte', () => {
    for (const f of FONTES) {
      expect(f.pilha).withContext(f.id).toContain(`'${f.nome}'`);
    }
  });

  it('só a Fraunces usa negrito no título (as outras têm um peso só)', () => {
    expect(FONTES.filter(f => f.pesoDoTitulo === 700).map(f => f.id)).toEqual(['FRAUNCES']);
  });

  describe('fonteDe, pilhaDe e pesoDoTituloDe', () => {
    it('devolvem a fonte, a pilha e o peso quando há escolha', () => {
      expect(fonteDe('RYE')?.nome).toBe('Rye');
      expect(pilhaDe('MEA_CULPA')).toBe("'Mea Culpa', cursive");
      expect(pesoDoTituloDe('FRAUNCES')).toBe(700);
    });

    it('devolvem nulo para a fonte padrão do site (nulo, ausente ou desconhecida)', () => {
      for (const sem of [null, undefined, 'DESCONHECIDA' as unknown as FontePostagem]) {
        expect(pilhaDe(sem)).withContext(String(sem)).toBeNull();
        expect(pesoDoTituloDe(sem)).withContext(String(sem)).toBeNull();
      }
    });
  });
});
