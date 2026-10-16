import { Postagem } from '../models/Postagem';
import { ehRascunho, maisDaAutora, rotuloDe, temasDaAutora, vizinhasDe } from './leitura-lateral';

describe('leitura-lateral', () => {
  const blog = (id: number, extra: Partial<Postagem> = {}): Postagem => ({ id, tipo: 'BLOG', titulo: `Blog ${id}`, texto: 'texto', ...extra });
  const rabisco = (id: number, texto = 'um rabisco'): Postagem => ({ id, tipo: 'COMENTARIO', titulo: null, texto });

  describe('ehRascunho', () => {
    it('blog é rascunho, rabisco não, e resposta antiga sem tipo conta como rascunho', () => {
      expect(ehRascunho(blog(1))).toBeTrue();
      expect(ehRascunho(rabisco(2))).toBeFalse();
      expect(ehRascunho({ id: 3, texto: 'x' })).toBeTrue();
    });
  });

  describe('rotuloDe', () => {
    it('usa o título quando há', () => {
      expect(rotuloDe(blog(1, { titulo: '  Meu título  ' }))).toBe('Meu título');
    });

    it('rabisco usa o texto, em uma linha só', () => {
      expect(rotuloDe(rabisco(1, 'linha um\n\n  linha dois'))).toBe('linha um linha dois');
    });

    it('texto longo é cortado com reticências', () => {
      const rotulo = rotuloDe(rabisco(1, 'a'.repeat(100)));

      expect(rotulo).toBe('a'.repeat(60) + '…');
    });

    it('não parte um emoji ao meio', () => {
      const rotulo = rotuloDe(rabisco(1, 'a'.repeat(59) + '😀' + 'b'.repeat(20)));

      expect(rotulo).toBe('a'.repeat(59) + '…');
    });
  });

  describe('vizinhasDe', () => {
    // a lista vem das mais novas para as mais antigas
    const lista = [blog(5), rabisco(4), blog(3), blog(2), rabisco(1)];

    it('anterior é a mais antiga seguinte e próxima é a mais nova, só entre rascunhos', () => {
      const v = vizinhasDe(lista, 3, true);

      expect(v.anterior?.id).toBe(2);
      expect(v.proxima?.id).toBe(5);
    });

    it('rabisco navega só entre rabiscos', () => {
      const v = vizinhasDe(lista, 4, false);

      expect(v.anterior?.id).toBe(1);
      expect(v.proxima).toBeUndefined();
    });

    it('a mais nova não tem próxima e a mais antiga não tem anterior', () => {
      expect(vizinhasDe(lista, 5, true)).toEqual({ anterior: lista[2], proxima: undefined });
      expect(vizinhasDe(lista, 2, true).anterior).toBeUndefined();
    });

    it('postagem que não está na lista (muito antiga) fica sem vizinhas', () => {
      expect(vizinhasDe(lista, 999, true)).toEqual({});
    });

    it('lista vazia não quebra', () => {
      expect(vizinhasDe([], 1, true)).toEqual({});
    });
  });

  describe('maisDaAutora', () => {
    it('só rascunhos, sem o atual, no máximo cinco, na ordem recebida', () => {
      const lista = [blog(9), rabisco(8), blog(7), blog(6), blog(5), blog(4), blog(3), blog(2)];

      expect(maisDaAutora(lista, 7).map(p => p.id)).toEqual([9, 6, 5, 4, 3]);
    });

    it('com poucas postagens devolve as que há', () => {
      expect(maisDaAutora([blog(1)], 1)).toEqual([]);
    });
  });

  describe('temasDaAutora', () => {
    it('conta por tema, do mais usado ao menos usado, e desempata em ordem alfabética', () => {
      const lista = [
        blog(1, { tema: { id: 1, descricao: 'Rotina' } }),
        blog(2, { tema: { id: 2, descricao: 'Escrita' } }),
        blog(3, { tema: { id: 2, descricao: 'Escrita' } }),
        blog(4, { tema: { id: 3, descricao: 'Livros' } })
      ];

      expect(temasDaAutora(lista)).toEqual([
        { nome: 'Escrita', quantidade: 2 },
        { nome: 'Livros', quantidade: 1 },
        { nome: 'Rotina', quantidade: 1 }
      ]);
    });

    it('tira as aspas que alguns temas antigos trazem e ignora postagens sem tema', () => {
      const lista = [blog(1, { tema: { id: 1, descricao: "'Tecnologia'" } }), rabisco(2), blog(3, { tema: null })];

      expect(temasDaAutora(lista)).toEqual([{ nome: 'Tecnologia', quantidade: 1 }]);
    });

    it('respeita o máximo de temas', () => {
      const lista = Array.from({ length: 12 }, (_, i) => blog(i + 1, { tema: { id: i, descricao: `Tema ${String(i).padStart(2, '0')}` } }));

      expect(temasDaAutora(lista, 8).length).toBe(8);
    });
  });
});
