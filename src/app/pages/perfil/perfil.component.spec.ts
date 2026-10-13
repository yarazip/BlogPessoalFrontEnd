import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { PerfilComponent, TAMANHO_MAXIMO_FOTO } from './perfil.component';

describe('PerfilComponent', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let perfis: jasmine.SpyObj<PerfilService>;
  let component: PerfilComponent;

  const evento = (arquivo?: File) => {
    const entrada = document.createElement('input');
    Object.defineProperty(entrada, 'files', { value: arquivo ? [arquivo] : [] });
    return { target: entrada } as unknown as Event;
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['getUsuario', 'atualizarFoto', 'updateUsuario']);
    auth.getUsuario.and.returnValue({ id: 3, nome: 'Ana', email: 'a@a.com' });
    perfis = jasmine.createSpyObj('PerfilService', ['getPerfil', 'atualizarBio']);
    perfis.getPerfil.and.returnValue(of({ id: 3, nome: 'Ana', bio: 'Bio antiga', totalPostagens: 0 }));
    TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: PerfilService, useValue: perfis }]
    });
    component = TestBed.createComponent(PerfilComponent).componentInstance;
    component.ngOnInit();
  });

  it('rejeita SVG (a API não aceita) sem chamar o servidor', () => {
    component.onFileSelected(evento(new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' })));

    expect(component.mensagemErro).toContain('Formato não suportado');
    expect(auth.atualizarFoto).not.toHaveBeenCalled();
  });

  it('rejeita arquivo maior que 5MB', () => {
    const grande = new File([new Uint8Array(TAMANHO_MAXIMO_FOTO + 1)], 'a.png', { type: 'image/png' });

    component.onFileSelected(evento(grande));

    expect(component.mensagemErro).toContain('muito grande');
    expect(auth.atualizarFoto).not.toHaveBeenCalled();
  });

  it('não quebra quando nenhum arquivo é escolhido', () => {
    expect(() => component.onFileSelected(evento())).not.toThrow();
    expect(auth.atualizarFoto).not.toHaveBeenCalled();
  });

  it('envia a foto, atualiza a tela e a sessão', () => {
    auth.atualizarFoto.and.returnValue(of({ foto: 'http://cdn/foto.png' }));
    const arquivo = new File(['x'], 'a.png', { type: 'image/png' });

    component.onFileSelected(evento(arquivo));

    expect(auth.atualizarFoto).toHaveBeenCalledWith(3, arquivo);
    expect(component.usuario?.foto).toBe('http://cdn/foto.png');
    expect(auth.updateUsuario).toHaveBeenCalledWith({ foto: 'http://cdn/foto.png' });
    expect(component.enviando).toBeFalse();
  });

  it('mostra erro se o envio falhar e libera o botão', () => {
    auth.atualizarFoto.and.returnValue(throwError(() => new Error('falhou')));

    component.onFileSelected(evento(new File(['x'], 'a.png', { type: 'image/png' })));

    expect(component.mensagemErro).toContain('Não foi possível atualizar a foto');
    expect(component.enviando).toBeFalse();
  });

  describe('bio', () => {
    it('carrega a bio atual do perfil público', () => {
      expect(perfis.getPerfil).toHaveBeenCalledWith(3);
      expect(component.bio.value).toBe('Bio antiga');
    });

    it('se a bio não carregar, o campo fica vazio em vez de quebrar a tela', () => {
      perfis.getPerfil.and.returnValue(throwError(() => new Error('falhou')));
      component.ngOnInit();

      expect(component.bio.value).toBe('');
    });

    it('salva a bio e avisa', () => {
      perfis.atualizarBio.and.returnValue(of({ id: 3, nome: 'Ana', bio: 'Nova bio', totalPostagens: 0 }));
      component.bio.setValue('Nova bio');

      component.salvarBio();

      expect(perfis.atualizarBio).toHaveBeenCalledOnceWith(3, 'Nova bio');
      expect(component.bioSalva).toBeTrue();
      expect(component.salvandoBio).toBeFalse();
    });

    it('mostra o erro da API sem perder o que foi digitado', () => {
      perfis.atualizarBio.and.returnValue(throwError(() => new Error('falhou')));
      component.bio.setValue('Texto');

      component.salvarBio();

      expect(component.erroBio).toContain('Não foi possível salvar a bio');
      expect(component.bio.value).toBe('Texto');
      expect(component.salvandoBio).toBeFalse();
    });

    it('não envia uma bio maior que o limite', () => {
      component.bio.setValue('x'.repeat(256));

      component.salvarBio();

      expect(perfis.atualizarBio).not.toHaveBeenCalled();
    });

    it('REGRESSÃO: enviar o formulário salva a bio sem deixar o navegador recarregar a página', () => {
      perfis.atualizarBio.and.returnValue(of({ id: 3, nome: 'Ana', bio: 'Pelo formulário', totalPostagens: 0 }));
      const fixture = TestBed.createComponent(PerfilComponent);
      fixture.detectChanges();
      fixture.componentInstance.bio.setValue('Pelo formulário');

      const envio = new Event('submit', { cancelable: true });
      (fixture.nativeElement as HTMLElement).querySelector('form.bio-form')!.dispatchEvent(envio);

      expect(envio.defaultPrevented).toBeTrue();
      expect(perfis.atualizarBio).toHaveBeenCalledOnceWith(3, 'Pelo formulário');
    });

    it('a tela tem o link para o perfil público', () => {
      const fixture = TestBed.createComponent(PerfilComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.ver-publico').getAttribute('href')).toBe('/perfil/3');
    });
  });
});
