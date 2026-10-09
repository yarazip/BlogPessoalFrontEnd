import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HeaderComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  afterEach(() => document.body.classList.remove('menu-open'));

  it('os links do menu são links reais (alcançáveis pelo teclado) para as seções da home', () => {
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.nav-links a'));

    expect(links.map(a => a.getAttribute('href'))).toEqual(['/#home', '/#sobre', '/#recursos']);
  });

  it('abre e fecha o menu mobile, travando a rolagem do corpo', () => {
    const componente = fixture.componentInstance;

    componente.toggleMobileMenu();
    expect(componente.isMobileMenuOpen).toBeTrue();
    expect(document.body.classList).toContain('menu-open');

    componente.toggleMobileMenu();
    expect(componente.isMobileMenuOpen).toBeFalse();
    expect(document.body.classList).not.toContain('menu-open');
  });

  it('clicar num link do menu fecha o menu mobile', () => {
    fixture.componentInstance.openMobileMenu();
    fixture.detectChanges();

    element.querySelector<HTMLAnchorElement>('.nav-links a')!.click();

    expect(fixture.componentInstance.isMobileMenuOpen).toBeFalse();
  });

  it('o botão de tema alterna o tema salvo', () => {
    const antes = fixture.componentInstance.isDarkMode;

    element.querySelector<HTMLButtonElement>('.theme-toggle')!.click();

    expect(fixture.componentInstance.isDarkMode).toBe(!antes);
    expect(localStorage.getItem('theme')).toBe(antes ? 'light' : 'dark');
  });
});
