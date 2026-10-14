import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Postagem } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { PostagemService } from '../../services/postagem.service';
import { ExplorarComponent } from './explorar.component';

describe('ExplorarComponent', () => {
  let service: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let fixture: ComponentFixture<ExplorarComponent>;
  let el: HTMLElement;

  const existente: Postagem = { id: 1, tipo: 'COMENTARIO', texto: 'Já estava no feed', usuario: { id: 2, nome: 'Bia' } };

  const abrir = (logado: boolean) => {
    auth.isLoggedIn.and.returnValue(logado);
    fixture = TestBed.createComponent(ExplorarComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('PostagemService', ['getPagina', 'create']);
    service.getPagina.and.returnValue(
      of({ conteudo: [existente], pagina: 0, tamanho: 10, totalElementos: 1, totalPaginas: 1, ultima: true })
    );
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUsuario']);
    auth.getUsuario.and.returnValue({ id: 1, nome: 'Ana' });
    TestBed.configureTestingModule({
      imports: [ExplorarComponent],
      providers: [
        provideRouter([]),
        { provide: PostagemService, useValue: service },
        { provide: PerfilService, useValue: { getPerfil: () => of({ id: 1, nome: 'Ana', totalPostagens: 0 }) } },
        { provide: AuthService, useValue: auth }
      ]
    });
  });

  it('mostra o feed de todo mundo, sem filtrar por autor', () => {
    abrir(false);

    expect(el.querySelector('app-feed-postagens')).not.toBeNull();
    expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10 });
  });

  it('visitante vê o feed mas não a caixa para comentar', () => {
    abrir(false);

    expect(el.querySelector('app-compositor-comentario')).toBeNull();
    expect(el.querySelectorAll('article').length).toBe(1);
  });

  it('quem está logado vê a caixa para comentar no topo do feed', () => {
    abrir(true);

    const caixa = el.querySelector('.feed > app-compositor-comentario');
    expect(caixa).not.toBeNull();
    expect(el.querySelector('.feed')!.firstElementChild).toBe(caixa);
  });

  it('um comentário publicado aparece no topo do feed sem recarregar a lista', () => {
    service.create.and.returnValue(
      of({ id: 9, tipo: 'COMENTARIO', texto: 'Acabei de publicar', usuario: { id: 1, nome: 'Ana' } })
    );
    abrir(true);

    const campo = el.querySelector<HTMLTextAreaElement>('textarea')!;
    campo.value = 'Acabei de publicar';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form.compositor')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();

    const textos = Array.from(el.querySelectorAll('.texto-postagem')).map(t => t.textContent);
    expect(textos).toEqual(['Acabei de publicar', 'Já estava no feed']);
    expect(service.getPagina).toHaveBeenCalledTimes(1); // não buscou a lista de novo
  });
});
