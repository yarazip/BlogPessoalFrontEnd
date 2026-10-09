import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let component: RegisterComponent;

  const valido = { nome: 'Ana', email: 'a@a.com', senha: 'senha1234', confirmPassword: 'senha1234' };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['register']);
    router = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], { events: of() });
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });
    component = TestBed.createComponent(RegisterComponent).componentInstance;
  });

  it('exige senha de 8 a 72 caracteres (limites da API)', () => {
    component.registerForm.patchValue({ ...valido, senha: '1234567', confirmPassword: '1234567' });
    expect(component.f.senha.errors?.['minlength']).toBeTruthy();

    const longa = 'a'.repeat(73);
    component.registerForm.patchValue({ ...valido, senha: longa, confirmPassword: longa });
    expect(component.f.senha.errors?.['maxlength']).toBeTruthy();
  });

  it('detecta confirmação diferente da senha', () => {
    component.registerForm.patchValue({ ...valido, confirmPassword: 'outra-senha' });
    component.f.confirmPassword.markAsTouched();

    expect(component.registerForm.hasError('mismatch')).toBeTrue();
    expect(component.senhasDiferentes).toBeTrue();
  });

  it('não cadastra com formulário inválido', () => {
    component.onSubmit();

    expect(auth.register).not.toHaveBeenCalled();
  });

  it('cadastra e vai para o login (sem enviar a confirmação de senha)', () => {
    auth.register.and.returnValue(of({ id: 1 }));
    component.registerForm.setValue(valido);

    component.onSubmit();

    expect(auth.register).toHaveBeenCalledWith('Ana', 'a@a.com', 'senha1234');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('mostra o detalhe do servidor quando o email já existe (409)', () => {
    auth.register.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Email já está em uso.' } }))
    );
    component.registerForm.setValue(valido);

    component.onSubmit();

    expect(component.errorMessage).toBe('Email já está em uso.');
    expect(component.isLoading).toBeFalse();
  });
});
