import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ConfirmarEmailComponent } from './confirmar-email.component';

describe('ConfirmarEmailComponent', () => {
  let fixture: ComponentFixture<ConfirmarEmailComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let el: HTMLElement;

  const abrir = (queryParams: Record<string, string>) => {
    TestBed.configureTestingModule({
      imports: [ConfirmarEmailComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } }
      ]
    });
    fixture = TestBed.createComponent(ConfirmarEmailComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['confirmarEmail']);
  });

  it('confirma sozinho com o token do link e leva ao login', () => {
    auth.confirmarEmail.and.returnValue(of(undefined));

    abrir({ token: 'abc123' });

    expect(auth.confirmarEmail).toHaveBeenCalledWith('abc123');
    expect(el.querySelector('h1')!.textContent).toContain('E-mail confirmado');
    expect(el.querySelector('a[href="/login"]')).not.toBeNull();
  });

  it('link vencido ou já usado: mostra o motivo da API', () => {
    auth.confirmarEmail.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Este link é inválido ou já expirou.' } }))
    );

    abrir({ token: 'velho' });

    expect(el.querySelector('h1')!.textContent).toContain('Não deu para confirmar');
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('inválido ou já expirou');
  });

  it('sem token no endereço, nem chama a API', () => {
    abrir({});

    expect(auth.confirmarEmail).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('não tem o código');
  });
});
