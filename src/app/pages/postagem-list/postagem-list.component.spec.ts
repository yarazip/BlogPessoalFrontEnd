import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { PostagemListComponent } from './postagem-list.component';

describe('PostagemListComponent (Minhas postagens)', () => {
  let service: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;

  const montar = () => {
    service.getPagina.and.returnValue(
      of({
        conteudo: [
          { id: 1, tipo: 'COMENTARIO', texto: 'Meu comentário', usuario: { id: 5, nome: 'Eu' } },
          { id: 2, tipo: 'BLOG', titulo: 'Meu blog', texto: 'Texto do blog', usuario: { id: 5, nome: 'Eu' } }
        ],
        pagina: 0,
        tamanho: 10,
        totalElementos: 2,
        totalPaginas: 1,
        ultima: true
      })
    );
    const fixture = TestBed.createComponent(PostagemListComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('PostagemService', ['getPagina', 'delete']);
    auth = jasmine.createSpyObj('AuthService', ['getUsuario']);
    TestBed.configureTestingModule({
      imports: [PostagemListComponent],
      providers: [
        provideRouter([]),
        { provide: PostagemService, useValue: service },
        { provide: AuthService, useValue: auth }
      ]
    });
  });

  it('lista só as postagens da pessoa logada (filtro por autor), comentários e blogs juntos', () => {
    auth.getUsuario.and.returnValue({ id: 5 });

    const el = montar();

    expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10, autor: 5 });
    expect(el.querySelectorAll('article').length).toBe(2);
    expect(el.querySelector('.minhas-topo h2')!.textContent).toBe('Minhas postagens');
  });

  it('cada postagem traz Editar e Excluir', () => {
    auth.getUsuario.and.returnValue({ id: 5 });

    const el = montar();

    expect(el.querySelectorAll('.post-acoes').length).toBe(2);
  });

  it('tem o atalho para escrever uma postagem de blog', () => {
    auth.getUsuario.and.returnValue({ id: 5 });

    const el = montar();

    expect(el.querySelector('.minhas-nova')!.getAttribute('href')).toBe('/postagens/nova');
  });

  it('sem sessão não monta a lista nem chama a API', () => {
    auth.getUsuario.and.returnValue(null);

    const el = montar();

    expect(service.getPagina).not.toHaveBeenCalled();
    expect(el.querySelector('article')).toBeNull();
  });
});
