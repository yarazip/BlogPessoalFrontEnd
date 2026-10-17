import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificacaoService } from '../../services/notificacao.service';
import { DashboardHeaderComponent } from './dashboard-header.component';

describe('DashboardHeaderComponent', () => {
  let el: HTMLElement;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    localStorage.clear();
    auth = jasmine.createSpyObj('AuthService', ['logout', 'getUsuario']);
    auth.getUsuario.and.returnValue({ id: 24 });
    const notificacoes = jasmine.createSpyObj('NotificacaoService', ['contarNaoLidas']);
    notificacoes.contarNaoLidas.and.returnValue(of(0));
    TestBed.configureTestingModule({
      imports: [DashboardHeaderComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: NotificacaoService, useValue: notificacoes }]
    });
    const fixture = TestBed.createComponent(DashboardHeaderComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('o menu começa pelo Mural, tem o Eu (perfil, com as postagens dentro) e deixa Novidades por último', () => {
    const itens = Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav-links > a')).map(a => a.getAttribute('href'));

    expect(itens).toEqual(['/explorar', '/perfil/24', '/dashboard']);
  });

  it('tem o "+" que começa um rascunho novo de qualquer página', () => {
    const novo = el.querySelector<HTMLAnchorElement>('.header-right .novo-rascunho')!;

    expect(novo.getAttribute('href')).toBe('/postagens/nova');
    expect(novo.getAttribute('aria-label')).toBe('Novo rascunho');
  });

  it('o sino de notificações fica no cabeçalho de quem está logado', () => {
    expect(el.querySelector('.header-right app-sino .sino-botao')).not.toBeNull();
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

    it('o menu ganha só o tema (o "+", o sino e o sair continuam fora dele)', () => {
      const acoes = Array.from(el.querySelectorAll('.nav-links .nav-acoes .acao-menu')).map(b => b.textContent!.trim());

      expect(acoes).toEqual([jasmine.stringMatching(/^Modo (claro|escuro)$/)]);
      expect(el.querySelector('.nav-links .novo-rascunho, .nav-links app-sino, .nav-links .logout-btn')).toBeNull();
    });

    it('o item de tema do menu troca o tema e o próprio texto', () => {
      const tema = () => el.querySelector<HTMLButtonElement>('.nav-acoes .acao-menu')!;
      const antes = tema().textContent!.trim();

      tema().click();
      fixture.detectChanges();

      expect(tema().textContent!.trim()).not.toBe(antes);
    });
  });

  it('sair encerra a sessão', () => {
    el.querySelector<HTMLButtonElement>('.logout-btn')!.click();

    expect(auth.logout).toHaveBeenCalled();
  });
});
