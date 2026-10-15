import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EsqueciSenhaComponent } from './esqueci-senha.component';

describe('EsqueciSenhaComponent', () => {
  let fixture: ComponentFixture<EsqueciSenhaComponent>;
  let component: EsqueciSenhaComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let el: HTMLElement;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['esqueciSenha']);
    TestBed.configureTestingModule({
      imports: [EsqueciSenhaComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }]
    });
    fixture = TestBed.createComponent(EsqueciSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  const enviar = (email: string) => {
    component.form.setValue({ email });
    component.onSubmit();
    fixture.detectChanges();
  };

  it('não envia sem e-mail ou com e-mail inválido, e mostra o motivo', () => {
    enviar('');
    expect(el.textContent).toContain('O e-mail é obrigatório');

    enviar('isso-nao-e-email');
    expect(el.textContent).toContain('Informe um e-mail válido');
    expect(auth.esqueciSenha).not.toHaveBeenCalled();
  });

  it('envia o e-mail e mostra a confirmação sem dizer se a conta existe', () => {
    auth.esqueciSenha.and.returnValue(of(undefined));

    enviar('ana@teste.com');

    expect(auth.esqueciSenha).toHaveBeenCalledWith('ana@teste.com');
    expect(el.querySelector('h1')!.textContent).toContain('Confira seu e-mail');
    expect(el.textContent).toContain('Se existir uma conta com');
    expect(el.querySelector('form')).toBeNull();
  });

  it('mostra o erro (ex.: limite de pedidos) e mantém o formulário', () => {
    auth.esqueciSenha.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 429, error: { detail: 'Muitos pedidos de redefinição de senha.' } }))
    );

    enviar('ana@teste.com');

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Muitos pedidos');
    expect(el.querySelector('form')).not.toBeNull();
    expect(component.isLoading).toBeFalse();
  });

  it('tem o caminho de volta para o login', () => {
    expect(el.querySelector('a[href="/login"]')).not.toBeNull();
  });
});
