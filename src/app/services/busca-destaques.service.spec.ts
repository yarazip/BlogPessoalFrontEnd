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

  describe('BuscaLivroService (Apple Books + Open Library)', () => {
    interface Livro {
      titulo: string;
      detalhe: string;
      capa: string | null;
      previa: null;
    }

    const reqApple = () => http.expectOne(r => r.url === 'https://itunes.apple.com/search' && r.params.get('media') === 'ebook');
    const reqOpenLibrary = () => http.expectOne(r => r.url === 'https://openlibrary.org/search.json');
    const apple = (titulo: string, autor: string, comCapa = true) => ({
      trackName: titulo,
      artistName: autor,
      artworkUrl100: comCapa ? 'https://is1-ssl.mzstatic.com/image/thumb/Publication/capa/100x100bb.jpg' : undefined
    });
    const doc = (titulo: string, autor: string, cover?: number) => ({ title: titulo, author_name: [autor], cover_i: cover });

    /** Faz a busca e responde às duas fontes ('erro' simula uma fonte fora do ar). */
    const buscar = (resposta: { apple?: unknown[] | 'erro'; ol?: unknown[] | 'erro' }, limite?: number) => {
      let itens: Livro[] | undefined;
      let falhou = false;
      TestBed.inject(BuscaLivroService)
        .buscar('x', limite)
        .subscribe({ next: i => (itens = i as Livro[]), error: () => (falhou = true) });
      const a = reqApple();
      const ol = reqOpenLibrary();
      if (resposta.apple === 'erro') {
        a.flush('fora do ar', { status: 500, statusText: 'Erro' });
      } else {
        a.flush({ results: resposta.apple ?? [] });
      }
      if (resposta.ol === 'erro') {
        ol.flush('fora do ar', { status: 500, statusText: 'Erro' });
      } else {
        ol.flush({ docs: resposta.ol ?? [] });
      }
      return { itens, falhou };
    };

    describe('o que é pedido', () => {
      it('às duas fontes ao mesmo tempo, com bem mais resultados do que mostra', () => {
        TestBed.inject(BuscaLivroService).buscar('dom casmurro').subscribe();

        const a = reqApple();
        const ol = reqOpenLibrary();
        expect(a.request.params.get('term')).toBe('dom casmurro');
        expect(a.request.params.get('country')).toBe('BR');
        expect(Number(a.request.params.get('limit'))).toBeGreaterThanOrEqual(20);
        expect(ol.request.params.get('q')).toBe('dom casmurro');
        expect(ol.request.params.get('fields')).toBe('title,author_name,cover_i');
        expect(Number(ol.request.params.get('limit'))).toBeGreaterThanOrEqual(20);
        a.flush({ results: [] });
        ol.flush({ docs: [] });
      });
    });

    describe('o que volta', () => {
      it('Apple Books: título, autor e a capa em 200x200 (mesmo endereço, só o tamanho)', () => {
        const { itens } = buscar({ apple: [apple('Dom Casmurro', 'Machado de Assis')] });

        expect(itens).toEqual([
          {
            titulo: 'Dom Casmurro',
            detalhe: 'Machado de Assis',
            capa: 'https://is1-ssl.mzstatic.com/image/thumb/Publication/capa/200x200bb.jpg',
            previa: null
          }
        ]);
      });

      it('Open Library: título, autor e a capa montada pelo cover_i', () => {
        const { itens } = buscar({ ol: [doc('Dom Casmurro', 'Machado de Assis', 647501)] });

        expect(itens).toEqual([
          { titulo: 'Dom Casmurro', detalhe: 'Machado de Assis', capa: 'https://covers.openlibrary.org/b/id/647501-M.jpg', previa: null }
        ]);
      });

      it('capa do Apple Books que não é https é descartada (o livro continua na lista, sem capa)', () => {
        const { itens } = buscar({ apple: [{ trackName: 'Livro', artistName: 'Autora', artworkUrl100: 'http://a/capa/100x100bb.jpg' }] });

        expect(itens![0].capa).toBeNull();
      });

      it('livro sem capa ou sem autor continua aparecendo', () => {
        const { itens } = buscar({ ol: [{ title: 'Sem nada' }] });

        expect(itens).toEqual([{ titulo: 'Sem nada', detalhe: '', capa: null, previa: null }]);
      });

      it('resultados sem título são descartados nas duas fontes', () => {
        const { itens } = buscar({
          apple: [{ artistName: 'Sem título', artworkUrl100: 'https://a/x/100x100bb.jpg' }, apple('Com título A', 'Autor')],
          ol: [{ author_name: ['Alguém'], cover_i: 1 }, doc('Com título B', 'Autor 2', 2)]
        });

        expect(itens!.map(i => i.titulo)).toEqual(['Com título A', 'Com título B']);
      });
    });

    describe('juntando as duas fontes', () => {
      it('o Apple Books vem primeiro (quase tudo tem capa) e a Open Library completa a lista', () => {
        const { itens } = buscar({
          apple: [apple('Livro A', 'Autor 1'), apple('Livro B', 'Autor 2')],
          ol: [doc('Livro C', 'Autor 3', 3), doc('Livro D', 'Autor 4', 4)]
        });

        expect(itens!.map(i => i.titulo)).toEqual(['Livro A', 'Livro B', 'Livro C', 'Livro D']);
      });

      it('o mesmo livro nas duas fontes aparece uma vez só (e fica o do Apple Books)', () => {
        const { itens } = buscar({
          apple: [apple('Dom Casmurro', 'Machado de Assis')],
          ol: [doc('Dom Casmurro', 'Machado de Assís', 647501)]
        });

        expect(itens!.length).toBe(1);
        expect(itens![0].capa).toContain('mzstatic.com');
      });

      it('se o Apple Books não tem a capa, a edição da Open Library que tem entra no lugar', () => {
        const { itens } = buscar({
          apple: [apple('Dom Casmurro', 'Machado de Assis', false)],
          ol: [doc('Dom Casmurro', 'Machado de Assis', 647501)]
        });

        expect(itens!.length).toBe(1);
        expect(itens![0].capa).toBe('https://covers.openlibrary.org/b/id/647501-M.jpg');
      });

      it('os livros com capa vêm primeiro, mantendo a ordem dentro de cada grupo', () => {
        const { itens } = buscar({
          apple: [apple('Sem capa A', 'Autor 1', false), apple('Com capa B', 'Autor 2')],
          ol: [doc('Sem capa C', 'Autor 3'), doc('Com capa D', 'Autor 4', 4)]
        });

        expect(itens!.map(i => i.titulo)).toEqual(['Com capa B', 'Com capa D', 'Sem capa A', 'Sem capa C']);
      });

      it('título e autor iguais, mesmo com acento, maiúscula ou pontuação diferentes, contam como o mesmo livro', () => {
        const { itens } = buscar({ ol: [doc('Dom Casmurro', 'Machado de Assís'), doc('DOM CASMURRO!', 'machado de assis', 5)] });

        expect(itens!.length).toBe(1);
        expect(itens![0].capa).not.toBeNull();
      });

      it('livros diferentes do mesmo autor, ou o mesmo título com autores diferentes, não são juntados', () => {
        const { itens } = buscar({
          apple: [apple('Dom Casmurro', 'Machado de Assis'), apple('Quincas Borba', 'Machado de Assis')],
          ol: [doc('Dom Casmurro', 'Outra Pessoa', 3)]
        });

        expect(itens!.length).toBe(3);
      });

      it('mostra no máximo o limite pedido (6), e todos com capa quando há de onde escolher', () => {
        const { itens } = buscar({
          apple: Array.from({ length: 4 }, (_, n) => apple(`Apple ${n}`, `Autor ${n}`)),
          ol: [
            ...Array.from({ length: 4 }, (_, n) => doc(`Sem capa ${n}`, `Escritor ${n}`)),
            ...Array.from({ length: 6 }, (_, n) => doc(`Open ${n}`, `Escritora ${n}`, n + 1))
          ]
        });

        expect(itens!.length).toBe(6);
        expect(itens!.every(i => i.capa)).toBeTrue();
      });

      it('se há poucos com capa, os sem capa completam a lista (a pessoa ainda pode escolher o livro)', () => {
        const { itens } = buscar({ ol: [doc('Com capa', 'Autor 1', 1), doc('Sem capa 1', 'Autor 2'), doc('Sem capa 2', 'Autor 3')] });

        expect(itens!.map(i => i.titulo)).toEqual(['Com capa', 'Sem capa 1', 'Sem capa 2']);
      });

      it('respeita um limite diferente do padrão', () => {
        const { itens } = buscar({ apple: Array.from({ length: 10 }, (_, n) => apple(`Livro ${n}`, `Autor ${n}`)) }, 3);

        expect(itens!.length).toBe(3);
      });
    });

    describe('quando uma fonte falha', () => {
      it('com o Apple Books fora do ar, a Open Library segue valendo', () => {
        const { itens, falhou } = buscar({ apple: 'erro', ol: [doc('Dom Casmurro', 'Machado de Assis', 1)] });

        expect(falhou).toBeFalse();
        expect(itens!.map(i => i.titulo)).toEqual(['Dom Casmurro']);
      });

      it('com a Open Library fora do ar, o Apple Books segue valendo', () => {
        const { itens, falhou } = buscar({ apple: [apple('Dom Casmurro', 'Machado de Assis')], ol: 'erro' });

        expect(falhou).toBeFalse();
        expect(itens!.length).toBe(1);
      });

      it('só se as duas falharem a busca dá erro (e a tela avisa que a busca está indisponível)', () => {
        const { itens, falhou } = buscar({ apple: 'erro', ol: 'erro' });

        expect(falhou).toBeTrue();
        expect(itens).toBeUndefined();
      });

      it('uma fonte que responde sem resultados não conta como falha', () => {
        const { itens, falhou } = buscar({ apple: [], ol: [] });

        expect(falhou).toBeFalse();
        expect(itens).toEqual([]);
      });
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
