import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ConfirmeSeuEmailComponent } from './confirme-seu-email.component';

describe('ConfirmeSeuEmailComponent', () => {
  let fixture: ComponentFixture<ConfirmeSeuEmailComponent>;
  let component: ConfirmeSeuEmailComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let el: HTMLElement;

  /** O e-mail chega pelo estado da navegação (history.state), não pela URL. */
  const abrir = (estado: Record<string, unknown> = {}) => {
    history.replaceState(estado, '');
    TestBed.configureTestingModule({
      imports: [ConfirmeSeuEmailComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }]
    });
    fixture = TestBed.createComponent(ConfirmeSeuEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['reenviarConfirmacao']);
  });

  afterEach(() => history.replaceState({}, ''));

  it('depois do cadastro, diz para onde o link foi e permite reenviar sem pedir o e-mail de novo', () => {
    auth.reenviarConfirmacao.and.returnValue(of(undefined));
    abrir({ email: 'ana@teste.com' });

    expect(el.querySelector('h1')!.textContent).toContain('Confirme seu e-mail');
    expect(el.textContent).toContain('ana@teste.com');
    expect(el.querySelector('input')).toBeNull();

    component.reenviar();
    fixture.detectChanges();

    expect(auth.reenviarConfirmacao).toHaveBeenCalledWith('ana@teste.com');
    expect(el.querySelector('[role="status"]')!.textContent).toContain('enviamos um novo link');
  });

  it('vindo da entrada, explica que falta confirmar para poder entrar', () => {
    abrir({ email: 'ana@teste.com', daEntrada: true });

    expect(el.querySelector('h1')!.textContent).toContain('Falta confirmar seu e-mail');
    expect(el.textContent).toContain('Para entrar');
  });

  it('aberta direto (sem e-mail), pede o e-mail para o reenvio e valida', () => {
    auth.reenviarConfirmacao.and.returnValue(of(undefined));
    abrir();

    component.form.setValue({ email: 'isso-nao-e-email' });
    component.reenviar();
    fixture.detectChanges();
    expect(auth.reenviarConfirmacao).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Informe um e-mail válido');

    component.form.setValue({ email: 'bia@teste.com' });
    component.reenviar();
    expect(auth.reenviarConfirmacao).toHaveBeenCalledWith('bia@teste.com');
  });

  it('mostra o erro (ex.: limite de pedidos) e mantém o botão', () => {
    auth.reenviarConfirmacao.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 429, error: { detail: 'Muitos pedidos de confirmação de e-mail.' } }))
    );
    abrir({ email: 'ana@teste.com' });

    component.reenviar();
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Muitos pedidos');
    expect(el.querySelector('button[type="submit"]')).not.toBeNull();
  });
});
