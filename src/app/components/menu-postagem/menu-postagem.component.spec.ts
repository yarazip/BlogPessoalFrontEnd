import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenuPostagemComponent } from './menu-postagem.component';

describe('MenuPostagemComponent', () => {
  let fixture: ComponentFixture<MenuPostagemComponent>;
  let el: HTMLElement;
  let excluidos: number;

  const botao = () => el.querySelector<HTMLButtonElement>('.menu-botao')!;
  const menu = () => el.querySelector('.menu-lista');
  const itens = () => Array.from(el.querySelectorAll<HTMLElement>('.menu-item'));
  const abrir = () => {
    botao().click();
    fixture.detectChanges();
  };
  const tecla = (key: string) => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(() => {
    excluidos = 0;
    TestBed.configureTestingModule({ imports: [MenuPostagemComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(MenuPostagemComponent);
    fixture.componentRef.setInput('postagemId', 7);
    fixture.componentRef.setInput('rotulo', 'Meu primeiro rascunho');
    fixture.componentInstance.excluir.subscribe(() => excluidos++);
    fixture.detectChanges();
    el = fixture.nativeElement;
    document.body.appendChild(el); // precisa estar na página para receber foco
  });

  afterEach(() => el.remove());

  describe('fechado', () => {
    it('mostra só o botão de três pontinhos, sem o menu', () => {
      expect(botao().querySelector('use')!.getAttribute('href')).toContain('#icon-ellipsis');
      expect(menu()).toBeNull();
    });

    it('o botão se anuncia como menu fechado e diz de qual postagem é', () => {
      expect(botao().getAttribute('aria-haspopup')).toBe('menu');
      expect(botao().getAttribute('aria-expanded')).toBe('false');
      expect(botao().getAttribute('aria-label')).toBe('Opções da postagem: Meu primeiro rascunho');
    });

    it('sem rótulo, o nome do botão é genérico', () => {
      fixture.componentRef.setInput('rotulo', '');
      fixture.detectChanges();

      expect(botao().getAttribute('aria-label')).toBe('Opções da postagem');
    });
  });

  describe('aberto', () => {
    it('mostra Editar (link para o formulário) e Excluir', () => {
      abrir();

      expect(itens().map(i => i.textContent!.trim())).toEqual(['Editar', 'Excluir']);
      expect(itens()[0].getAttribute('href')).toBe('/postagens/7/editar');
      expect(botao().getAttribute('aria-expanded')).toBe('true');
      expect(menu()!.getAttribute('role')).toBe('menu');
      expect(itens().every(i => i.getAttribute('role') === 'menuitem')).toBeTrue();
    });

    it('leva o foco para o primeiro item', () => {
      abrir();

      expect(document.activeElement).toBe(itens()[0]);
    });

    it('tocar de novo no botão fecha', () => {
      abrir();

      botao().click();
      fixture.detectChanges();

      expect(menu()).toBeNull();
    });

    it('clicar fora fecha', () => {
      abrir();

      document.body.click();
      fixture.detectChanges();

      expect(menu()).toBeNull();
    });

    it('clicar dentro do menu, no espaço entre os itens, não fecha', () => {
      abrir();

      menu()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(menu()).not.toBeNull();
    });

    it('Excluir avisa quem usa o componente e fecha o menu', () => {
      abrir();

      itens()[1].click();
      fixture.detectChanges();

      expect(excluidos).toBe(1);
      expect(menu()).toBeNull();
    });

    it('Editar fecha o menu (a navegação é do link)', () => {
      abrir();

      itens()[0].addEventListener('click', e => e.preventDefault()); // sem navegar de verdade no teste
      itens()[0].click();
      fixture.detectChanges();

      expect(menu()).toBeNull();
      expect(excluidos).toBe(0);
    });
  });

  describe('teclado', () => {
    it('Esc fecha e devolve o foco ao botão', () => {
      abrir();

      tecla('Escape');

      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(botao());
    });

    it('seta para baixo percorre os itens e volta ao primeiro', () => {
      abrir();

      tecla('ArrowDown');
      expect(document.activeElement).toBe(itens()[1]);

      tecla('ArrowDown');
      expect(document.activeElement).toBe(itens()[0]);
    });

    it('seta para cima vai ao último item a partir do primeiro', () => {
      abrir();

      tecla('ArrowUp');

      expect(document.activeElement).toBe(itens()[1]);
    });

    it('Tab fecha o menu e deixa o foco seguir', () => {
      abrir();

      tecla('Tab');

      expect(menu()).toBeNull();
    });

    it('as teclas não fazem nada com o menu fechado', () => {
      tecla('ArrowDown');
      tecla('Escape');

      expect(menu()).toBeNull();
    });
  });
});
