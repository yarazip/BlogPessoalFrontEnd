import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { PostagemService } from './postagem.service';
import { TemaService } from './tema.service';

describe('Serviços de dados', () => {
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('PostagemService', () => {
    let service: PostagemService;
    beforeEach(() => (service = TestBed.inject(PostagemService)));

    it('lista e busca por id', () => {
      service.getAll().subscribe();
      expect(http.expectOne(`${api}/postagens`).request.method).toBe('GET');

      service.getById(4).subscribe();
      expect(http.expectOne(`${api}/postagens/4`).request.method).toBe('GET');
    });

    it('filtra por autor usando parâmetro de consulta', () => {
      service.getByUsuario(3).subscribe();

      const req = http.expectOne(r => r.url === `${api}/postagens/filtro`);
      expect(req.request.params.get('autor')).toBe('3');
    });

    it('cria com POST e atualiza com PUT /{id} enviando idTema', () => {
      const dados = { titulo: 'Título ok', texto: 'Texto com tamanho válido', idTema: 2 };

      service.create(dados).subscribe();
      const criar = http.expectOne(`${api}/postagens`);
      expect(criar.request.method).toBe('POST');
      expect(criar.request.body).toEqual(dados);

      service.update(8, dados).subscribe();
      const atualizar = http.expectOne(`${api}/postagens/8`);
      expect(atualizar.request.method).toBe('PUT');
      expect(atualizar.request.body).toEqual(dados);
    });

    it('exclui com DELETE', () => {
      service.delete(8).subscribe();
      expect(http.expectOne(`${api}/postagens/8`).request.method).toBe('DELETE');
    });
  });

  describe('TemaService', () => {
    let service: TemaService;
    beforeEach(() => (service = TestBed.inject(TemaService)));

    it('atualiza com PUT /temas e o id no corpo, como a API espera', () => {
      service.update({ id: 5, descricao: 'Novo' }).subscribe();

      const req = http.expectOne(`${api}/temas`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ id: 5, descricao: 'Novo' });
    });

    it('lista, cria e exclui', () => {
      service.getAll().subscribe();
      expect(http.expectOne(`${api}/temas`).request.method).toBe('GET');

      service.create({ descricao: 'Java' }).subscribe();
      expect(http.expectOne(`${api}/temas`).request.method).toBe('POST');

      service.delete(5).subscribe();
      expect(http.expectOne(`${api}/temas/5`).request.method).toBe('DELETE');
    });
  });
});
