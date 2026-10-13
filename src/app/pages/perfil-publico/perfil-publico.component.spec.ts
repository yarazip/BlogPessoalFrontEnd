import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { PostagemService } from '../../services/postagem.service';
import { PerfilPublicoComponent } from './perfil-publico.component';

describe('PerfilPublicoComponent', () => {
  let fixture: ComponentFixture<PerfilPublicoComponent>;
  let el: HTMLElement;
  let perfis: jasmine.SpyObj<PerfilService>;
  let postagens: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const perfil = (sobre: Partial<Perfil> = {}): Perfil => ({
    id: 5,
    nome: 'Bia Autora',
    bio: 'Escrevo sobre café.',
    totalPostagens: 3,
    ...sobre
  });

  const abrir = (id: string, resposta: Observable<Perfil> = of(perfil())) => {
    perfis.getPerfil.and.returnValue(resposta);
    params.next(convertToParamMap({ id }));
    fixture = TestBed.createComponent(PerfilPublicoComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    perfis = jasmine.createSpyObj('PerfilService', ['getPerfil']);
    postagens = jasmine.createSpyObj('PostagemService', ['getPagina']);
    postagens.getPagina.and.returnValue(
      of({ conteudo: [], pagina: 0, tamanho: 10, totalElementos: 0, totalPaginas: 1, ultima: true })
    );
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUsuario']);
    auth.isLoggedIn.and.returnValue(false);
    params = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({
      imports: [PerfilPublicoComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilService, useValue: perfis },
        { provide: PostagemService, useValue: postagens },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { paramMap: params } }
      ]
    });
  });

  it('mostra nome, bio e quantidade de postagens, sem e-mail', () => {
    abrir('5');

    expect(el.querySelector('.perfil-nome')!.textContent).toBe('Bia Autora');
    expect(el.querySelector('.perfil-bio')!.textContent).toBe('Escrevo sobre café.');
    expect(el.querySelector('.perfil-contagem')!.textContent!.trim()).toBe('3 postagens');
    expect(el.textContent).not.toContain('@');
  });

  it('usa o singular com uma postagem e a foto padrão sem foto', () => {
    abrir('5', of(perfil({ totalPostagens: 1, foto: null })));

    expect(el.querySelector('.perfil-contagem')!.textContent!.trim()).toBe('1 postagem');
    expect(el.querySelector<HTMLImageElement>('.perfil-foto')!.getAttribute('src')).toBe('assets/img/sem-foto.svg');
  });

  it('sem bio mostra "Sem bio ainda."', () => {
    abrir('5', of(perfil({ bio: null })));

    expect(el.querySelector('.perfil-bio-vazia')!.textContent).toBe('Sem bio ainda.');
  });

  it('SEGURANÇA: HTML na bio aparece como texto, nunca é executado', () => {
    abrir('5', of(perfil({ bio: '<img src=x onerror="window.__xss = true">' })));

    expect(el.querySelector('.perfil-bio img')).toBeNull();
    expect(el.querySelector('.perfil-bio')!.textContent).toContain('<img src=x');
  });

  it('lista só as postagens daquela pessoa, com o cabeçalho do perfil no topo', () => {
    abrir('5');

    expect(postagens.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10, autor: 5 });
    expect(el.querySelector('app-feed-postagens .perfil-topo')).not.toBeNull();
  });

  it('perfil inexistente (404) mostra aviso e volta ao feed', () => {
    abrir('999', throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Perfil não encontrado.');
    expect(el.querySelector('[role="alert"] a')!.getAttribute('href')).toBe('/explorar');
    expect(postagens.getPagina).not.toHaveBeenCalled();
  });

  it('id que não é número não chega a chamar a API', () => {
    abrir('abc');

    expect(perfis.getPerfil).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Perfil não encontrado.');
  });

  it('trocar de perfil na mesma rota carrega o novo', () => {
    abrir('5');
    perfis.getPerfil.and.returnValue(of(perfil({ id: 8, nome: 'Caio' })));

    params.next(convertToParamMap({ id: '8' }));
    fixture.detectChanges();

    expect(perfis.getPerfil).toHaveBeenCalledWith(8);
    expect(el.querySelector('.perfil-nome')!.textContent).toBe('Caio');
  });

  describe('botão "Editar perfil"', () => {
    it('aparece só no próprio perfil, com sessão ativa', () => {
      auth.isLoggedIn.and.returnValue(true);
      auth.getUsuario.and.returnValue({ id: 5 });
      abrir('5');

      expect(el.querySelector('.perfil-editar')!.getAttribute('href')).toBe('/perfil');
    });

    it('não aparece no perfil de outra pessoa', () => {
      auth.isLoggedIn.and.returnValue(true);
      auth.getUsuario.and.returnValue({ id: 99 });
      abrir('5');

      expect(el.querySelector('.perfil-editar')).toBeNull();
    });

    it('não aparece para visitante', () => {
      abrir('5');

      expect(el.querySelector('.perfil-editar')).toBeNull();
    });
  });
});
