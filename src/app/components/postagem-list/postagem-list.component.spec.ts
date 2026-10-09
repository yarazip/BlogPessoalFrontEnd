import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { Pagina } from '../models/Pagina';
import { Postagem } from '../models/Postagem';
import { PostagemListComponent } from './postagem-list.component';

describe('PostagemListComponent', () => {
  let service: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;

  const post = (id: number): Postagem => ({ id, titulo: `Post ${id}`, texto: 'Texto', data: '2024-01-10T15:30:00Z' });
  const pagina = (conteudo: Postagem[], numero: number, ultima: boolean): Pagina<Postagem> => ({
    conteudo, pagina: numero, tamanho: 10, totalElementos: conteudo.length, totalPaginas: 2, ultima
  });

  const criar = () => {
    TestBed.configureTestingModule({
      imports: [PostagemListComponent],
      providers: [
        provideRouter([]),
        { provide: PostagemService, useValue: service },
        { provide: AuthService, useValue: auth }
      ]
    });
    const fixture = TestBed.createComponent(PostagemListComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('PostagemService', ['getPagina']);
    auth = jasmine.createSpyObj('AuthService', ['getUsuario']);
    auth.getUsuario.and.returnValue({ id: 7, nome: 'Ana' });
  });

  it('lista só as postagens do usuário logado (filtro autor) na primeira página', () => {
    service.getPagina.and.returnValue(of(pagina([post(1)], 0, true)));

    const fixture = criar();

    expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10, autor: 7 });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Post 1');
  });

  it('carrega mais acrescentando à lista', () => {
    service.getPagina.and.returnValues(of(pagina([post(1)], 0, false)), of(pagina([post(2)], 1, true)));
    const fixture = criar();
    const el = fixture.nativeElement as HTMLElement;

    el.querySelector<HTMLButtonElement>('.btn-carregar-mais')!.click();
    fixture.detectChanges();

    expect(service.getPagina.calls.mostRecent().args[0]).toEqual({ page: 1, size: 10, autor: 7 });
    expect(el.querySelectorAll('.post-card').length).toBe(2);
    expect(el.querySelector('.btn-carregar-mais')).toBeNull();
  });

  it('mostra "nenhuma postagem" quando não há nada', () => {
    service.getPagina.and.returnValue(of(pagina([], 0, true)));

    expect((criar().nativeElement as HTMLElement).textContent).toContain('Nenhuma postagem encontrada');
  });

  it('mostra o erro da API sem a mensagem de lista vazia', () => {
    service.getPagina.and.returnValue(throwError(() => new Error('falhou')));

    const texto = (criar().nativeElement as HTMLElement).textContent!;

    expect(texto).toContain('Erro ao carregar postagens');
    expect(texto).not.toContain('Nenhuma postagem encontrada');
  });

  it('sem usuário logado não chama a API', () => {
    auth.getUsuario.and.returnValue(null);

    criar();

    expect(service.getPagina).not.toHaveBeenCalled();
  });
});
