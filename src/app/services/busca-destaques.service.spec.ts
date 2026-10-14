import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { textoDoItem } from '../models/ItemDeBusca';
import { BuscaLivroService } from './busca-livro.service';
import { BuscaMusicaService } from './busca-musica.service';

describe('busca de música e de livro', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('BuscaMusicaService (iTunes)', () => {
    it('pede músicas no Brasil e traz título, artista, capa e prévia', () => {
      let itens: unknown;
      TestBed.inject(BuscaMusicaService).buscar('clube da esquina').subscribe(i => (itens = i));

      const req = http.expectOne(r => r.url === 'https://itunes.apple.com/search');
      expect(req.request.params.get('term')).toBe('clube da esquina');
      expect(req.request.params.get('media')).toBe('music');
      expect(req.request.params.get('entity')).toBe('song');
      expect(req.request.params.get('country')).toBe('BR');
      req.flush({
        results: [
          {
            trackName: 'Clube da Esquina Nº 2',
            artistName: 'Milton Nascimento',
            artworkUrl100: 'https://is1-ssl.mzstatic.com/capa/100x100bb.jpg',
            previewUrl: 'https://audio-ssl.itunes.apple.com/previa.m4a'
          }
        ]
      });

      expect(itens).toEqual([
        {
          titulo: 'Clube da Esquina Nº 2',
          detalhe: 'Milton Nascimento',
          capa: 'https://is1-ssl.mzstatic.com/capa/100x100bb.jpg',
          previa: 'https://audio-ssl.itunes.apple.com/previa.m4a'
        }
      ]);
    });

    it('descarta endereços que não são https e resultados sem nome', () => {
      let itens: { capa: string | null; previa: string | null }[] = [];
      TestBed.inject(BuscaMusicaService).buscar('x').subscribe(i => (itens = i));

      http.expectOne(r => r.url.includes('itunes')).flush({
        results: [
          { trackName: 'Sem https', artworkUrl100: 'http://a/capa.jpg', previewUrl: 'http://a/previa.m4a' },
          { artistName: 'Sem nome' }
        ]
      });

      expect(itens.length).toBe(1);
      expect(itens[0].capa).toBeNull();
      expect(itens[0].previa).toBeNull();
    });

    it('resposta sem resultados vira lista vazia', () => {
      let itens: unknown[] | undefined;
      TestBed.inject(BuscaMusicaService).buscar('nada').subscribe(i => (itens = i));

      http.expectOne(r => r.url.includes('itunes')).flush({});

      expect(itens).toEqual([]);
    });
  });

  describe('BuscaLivroService (Open Library)', () => {
    it('pede só os campos necessários e monta a capa pelo cover_i', () => {
      let itens: unknown;
      TestBed.inject(BuscaLivroService).buscar('dom casmurro').subscribe(i => (itens = i));

      const req = http.expectOne(r => r.url === 'https://openlibrary.org/search.json');
      expect(req.request.params.get('q')).toBe('dom casmurro');
      expect(req.request.params.get('fields')).toBe('title,author_name,cover_i');
      req.flush({ docs: [{ title: 'Dom Casmurro', author_name: ['Machado de Assis'], cover_i: 647501 }] });

      expect(itens).toEqual([
        {
          titulo: 'Dom Casmurro',
          detalhe: 'Machado de Assis',
          capa: 'https://covers.openlibrary.org/b/id/647501-M.jpg',
          previa: null
        }
      ]);
    });

    describe('capas', () => {
      const doc = (titulo: string, autor: string, cover?: number) => ({ title: titulo, author_name: [autor], cover_i: cover });
      const buscar = (docs: unknown[], limite?: number) => {
        let itens: { titulo: string; capa: string | null }[] = [];
        TestBed.inject(BuscaLivroService).buscar('x', limite).subscribe(i => (itens = i));
        http.expectOne(r => r.url.includes('openlibrary')).flush({ docs });
        return itens;
      };

      it('pede bem mais resultados do que mostra, para ter de onde escolher livros com capa', () => {
        TestBed.inject(BuscaLivroService).buscar('dom casmurro').subscribe();

        const req = http.expectOne(r => r.url.includes('openlibrary'));
        expect(Number(req.request.params.get('limit'))).toBeGreaterThanOrEqual(20);
        req.flush({ docs: [] });
      });

      it('os livros com capa vêm primeiro, mantendo a ordem de relevância dentro de cada grupo', () => {
        const itens = buscar([
          doc('Sem capa A', 'Autor 1'),
          doc('Com capa B', 'Autor 2', 2),
          doc('Sem capa C', 'Autor 3'),
          doc('Com capa D', 'Autor 4', 4)
        ]);

        expect(itens.map(i => i.titulo)).toEqual(['Com capa B', 'Com capa D', 'Sem capa A', 'Sem capa C']);
      });

      it('as edições repetidas do mesmo livro viram uma só, e fica a que tem capa', () => {
        const itens = buscar([
          doc('Dom Casmurro', 'Machado de Assis'),
          doc('Dom Casmurro', 'Machado de Assis', 647501),
          doc('Dom Casmurro', 'Machado de Assis', 999)
        ]);

        expect(itens.length).toBe(1);
        expect(itens[0].capa).toBe('https://covers.openlibrary.org/b/id/647501-M.jpg');
      });

      it('título e autor iguais, mesmo com acento, maiúscula ou pontuação diferentes, contam como o mesmo livro', () => {
        const itens = buscar([
          doc('Dom Casmurro', 'Machado de Assís'),
          doc('DOM CASMURRO!', 'machado de assis', 5)
        ]);

        expect(itens.length).toBe(1);
        expect(itens[0].capa).not.toBeNull();
      });

      it('livros diferentes do mesmo autor, ou com o mesmo título e autores diferentes, não são juntados', () => {
        const itens = buscar([
          doc('Dom Casmurro', 'Machado de Assis', 1),
          doc('Quincas Borba', 'Machado de Assis', 2),
          doc('Dom Casmurro', 'Outra Pessoa', 3)
        ]);

        expect(itens.length).toBe(3);
      });

      it('mostra no máximo o limite pedido (6), escolhendo os com capa', () => {
        const docs = [
          ...Array.from({ length: 5 }, (_, n) => doc(`Sem capa ${n}`, `Autor ${n}`)),
          ...Array.from({ length: 8 }, (_, n) => doc(`Com capa ${n}`, `Escritor ${n}`, n + 1))
        ];

        const itens = buscar(docs);

        expect(itens.length).toBe(6);
        expect(itens.every(i => i.capa)).toBeTrue();
      });

      it('se há poucos com capa, os sem capa completam a lista (a pessoa ainda pode escolher o livro)', () => {
        const itens = buscar([doc('Com capa', 'Autor 1', 1), doc('Sem capa 1', 'Autor 2'), doc('Sem capa 2', 'Autor 3')]);

        expect(itens.map(i => i.titulo)).toEqual(['Com capa', 'Sem capa 1', 'Sem capa 2']);
      });

      it('respeita um limite diferente do padrão', () => {
        const itens = buscar(Array.from({ length: 10 }, (_, n) => doc(`Livro ${n}`, `Autor ${n}`, n + 1)), 3);

        expect(itens.length).toBe(3);
      });

      it('resultados sem título são descartados', () => {
        const itens = buscar([{ author_name: ['Alguém'], cover_i: 1 }, doc('Com título', 'Autor', 2)]);

        expect(itens.map(i => i.titulo)).toEqual(['Com título']);
      });
    });

    it('livro sem capa ou sem autor continua aparecendo', () => {
      let itens: unknown;
      TestBed.inject(BuscaLivroService).buscar('x').subscribe(i => (itens = i));

      http.expectOne(r => r.url.includes('openlibrary')).flush({ docs: [{ title: 'Sem nada' }] });

      expect(itens).toEqual([{ titulo: 'Sem nada', detalhe: '', capa: null, previa: null }]);
    });
  });

  describe('textoDoItem', () => {
    it('junta título e artista', () => {
      expect(textoDoItem({ titulo: 'Clube da Esquina', detalhe: 'Milton', capa: null, previa: null }, 100)).toBe(
        'Clube da Esquina - Milton'
      );
    });

    it('sem artista, só o título', () => {
      expect(textoDoItem({ titulo: 'Dom Casmurro', detalhe: '', capa: null, previa: null }, 100)).toBe('Dom Casmurro');
    });

    it('corta no limite do campo, com reticências', () => {
      const texto = textoDoItem({ titulo: 'a'.repeat(120), detalhe: 'b', capa: null, previa: null }, 100);

      expect(texto.length).toBe(100);
      expect(texto.endsWith('…')).toBeTrue();
    });
  });
});
