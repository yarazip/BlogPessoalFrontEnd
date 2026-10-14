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
