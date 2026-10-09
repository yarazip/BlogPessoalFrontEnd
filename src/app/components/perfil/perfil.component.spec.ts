import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PerfilComponent, TAMANHO_MAXIMO_FOTO } from './perfil.component';

describe('PerfilComponent', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let component: PerfilComponent;

  const evento = (arquivo?: File) => {
    const entrada = document.createElement('input');
    Object.defineProperty(entrada, 'files', { value: arquivo ? [arquivo] : [] });
    return { target: entrada } as unknown as Event;
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['getUsuario', 'atualizarFoto', 'updateUsuario']);
    auth.getUsuario.and.returnValue({ id: 3, nome: 'Ana', email: 'a@a.com' });
    TestBed.configureTestingModule({ imports: [PerfilComponent], providers: [{ provide: AuthService, useValue: auth }] });
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
});
