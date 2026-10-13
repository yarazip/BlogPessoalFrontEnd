import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardHeaderComponent } from './dashboard-header.component';

describe('DashboardHeaderComponent', () => {
  let el: HTMLElement;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    localStorage.clear();
    auth = jasmine.createSpyObj('AuthService', ['logout', 'getUsuario']);
    auth.getUsuario.and.returnValue({ id: 24 });
    TestBed.configureTestingModule({
      imports: [DashboardHeaderComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }]
    });
    const fixture = TestBed.createComponent(DashboardHeaderComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('o menu começa pelo Feed, tem o Perfil (com as postagens dentro) e deixa Insights por último', () => {
    const itens = Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav-links a')).map(a => a.getAttribute('href'));

    expect(itens).toEqual(['/explorar', '/perfil/24', '/dashboard']);
  });

  it('o logo leva ao feed, não à página de entrada pública', () => {
    expect(el.querySelector('.logo-link')!.getAttribute('href')).toBe('/explorar');
  });

  describe('menu do celular', () => {
    let fixture: ComponentFixture<DashboardHeaderComponent>;
    const botao = () => el.querySelector<HTMLButtonElement>('.mobile-menu-toggle')!;

    beforeEach(() => {
      fixture = TestBed.createComponent(DashboardHeaderComponent);
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    it('o botão informa se o menu está aberto (aria-expanded)', () => {
      expect(botao().getAttribute('aria-expanded')).toBe('false');

      botao().click();
      fixture.detectChanges();

      expect(botao().getAttribute('aria-expanded')).toBe('true');
    });

    it('tocar num item fecha o menu', () => {
      botao().click();
      fixture.detectChanges();

      el.querySelector<HTMLAnchorElement>('.nav-links a')!.click();
      fixture.detectChanges();

      expect(botao().getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('sair encerra a sessão', () => {
    el.querySelector<HTMLButtonElement>('.logout-btn')!.click();

    expect(auth.logout).toHaveBeenCalled();
  });
});
