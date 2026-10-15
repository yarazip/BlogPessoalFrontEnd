import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RedefinirSenhaComponent } from './redefinir-senha.component';

describe('RedefinirSenhaComponent', () => {
  let fixture: ComponentFixture<RedefinirSenhaComponent>;
  let component: RedefinirSenhaComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;
  let el: HTMLElement;

  const iniciar = (queryParams: Record<string, string>) => {
    TestBed.configureTestingModule({
      imports: [RedefinirSenhaComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(RedefinirSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const salvar = (senha: string, confirmacao: string) => {
    component.form.setValue({ senha, confirmacao });
    component.onSubmit();
    fixture.detectChanges();
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['redefinirSenha']);
  });

  it('sem o token na endereço, mostra "link inválido" e leva a pedir outro', () => {
    iniciar({});

    expect(el.querySelector('h1')!.textContent).toContain('Link inválido');
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('a[href="/esqueci-senha"]')).not.toBeNull();
  });

  it('troca a senha com o token do link e vai para o login com o aviso', () => {
    auth.redefinirSenha.and.returnValue(of(undefined));
    iniciar({ token: 'abc123' });

    salvar('senhaNova123', 'senhaNova123');

    expect(auth.redefinirSenha).toHaveBeenCalledWith('abc123', 'senhaNova123');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { senhaTrocada: 1 } });
  });

  it('não envia senha curta', () => {
    iniciar({ token: 'abc123' });

    salvar('curta', 'curta');

    expect(auth.redefinirSenha).not.toHaveBeenCalled();
    expect(el.textContent).toContain('entre 8 e 72 caracteres');
  });

  it('não envia quando a confirmação é diferente', () => {
    iniciar({ token: 'abc123' });

    salvar('senhaNova123', 'senhaOutra123');

    expect(auth.redefinirSenha).not.toHaveBeenCalled();
    expect(el.textContent).toContain('As senhas não coincidem');
  });

  it('link vencido ou usado: mostra o erro da API e oferece pedir novo link', () => {
    auth.redefinirSenha.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Este link é inválido ou já expirou.' } }))
    );
    iniciar({ token: 'velho' });

    salvar('senhaNova123', 'senhaNova123');

    const alerta = el.querySelector('[role="alert"]')!;
    expect(alerta.textContent).toContain('inválido ou já expirou');
    expect(alerta.querySelector('a[href="/esqueci-senha"]')).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
