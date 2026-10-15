import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const resposta = { id: 1, nome: 'Ana', email: 'a@a.com', token: 'Bearer t' };

  const iniciar = (queryParams: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } }
      ]
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const entrar = () => {
    component.loginForm.setValue({ email: 'a@a.com', senha: 'senha1234' });
    component.onSubmit();
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['login', 'saveAuthData']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree', 'serializeUrl'], { events: of() });
  });

  it('não envia o formulário inválido', () => {
    iniciar();

    component.onSubmit();

    expect(auth.login).not.toHaveBeenCalled();
    expect(component.submitted).toBeTrue();
  });

  it('salva a sessão e vai direto para o feed', () => {
    auth.login.and.returnValue(of(resposta));
    iniciar();

    entrar();

    expect(auth.saveAuthData).toHaveBeenCalledWith(resposta);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/explorar');
  });

  it('depois de trocar a senha, mostra o aviso para entrar com a nova', () => {
    iniciar({ senhaTrocada: '1' });

    expect(fixture.nativeElement.querySelector('.aviso-sucesso').textContent).toContain('Senha trocada');
  });

  it('volta para a página que exigiu o login', () => {
    auth.login.and.returnValue(of(resposta));
    iniciar({ returnUrl: '/postagens/3' });

    entrar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/postagens/3');
  });

  it('SEGURANÇA: não redireciona para endereços externos (open redirect)', () => {
    for (const malicioso of ['//evil.com', 'https://evil.com', 'javascript:alert(1)', 'postagens']) {
      TestBed.resetTestingModule();
      router.navigateByUrl.calls.reset();
      auth.login.and.returnValue(of(resposta));
      iniciar({ returnUrl: malicioso });

      entrar();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/explorar');
    }
  });

  it('mostra "e-mail ou senha inválidos" no 401', () => {
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    iniciar();

    entrar();

    expect(component.loginError).toBeTrue();
    expect(component.errorMessage).toBe('E-mail ou senha inválidos!');
    expect(component.isLoading).toBeFalse();
  });

  it('mostra a mensagem do servidor quando há bloqueio por tentativas (429)', () => {
    auth.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 429, error: { detail: 'Muitas tentativas de login.' } }))
    );
    iniciar();

    entrar();

    expect(component.errorMessage).toBe('Muitas tentativas de login.');
  });

  it('avisa quando a sessão expirou', () => {
    iniciar({ expirada: '1' });

    expect(component.loginError).toBeTrue();
    expect(component.errorMessage).toContain('sessão expirou');
  });
});
