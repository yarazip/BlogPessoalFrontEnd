import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { FontePostagem } from '../../models/Fonte';
import { SeletorDeFonteComponent } from './seletor-de-fonte.component';

describe('SeletorDeFonteComponent', () => {
  let fixture: ComponentFixture<SeletorDeFonteComponent>;
  let el: HTMLElement;
  let controle: FormControl<FontePostagem | null>;

  const botao = () => el.querySelector<HTMLButtonElement>('.fonte-botao')!;
  const modal = () => el.querySelector<HTMLDialogElement>('dialog')!;
  const opcoes = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.fonte-opcao'));

  beforeEach(() => {
    controle = new FormControl<FontePostagem | null>(null);
    TestBed.configureTestingModule({ imports: [SeletorDeFonteComponent] });
    fixture = TestBed.createComponent(SeletorDeFonteComponent);
    fixture.componentRef.setInput('controle', controle);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => document.body.classList.remove('modal-aberto'));

  describe('o botão único', () => {
    it('com a fonte padrão, diz "Padrão do site" e não impõe nenhuma fonte', () => {
      expect(el.querySelectorAll('.fonte-botao').length).toBe(1);
      expect(el.querySelector('.fonte-atual')!.textContent!.trim()).toBe('Padrão do site');
      expect((el.querySelector('.fonte-atual') as HTMLElement).style.fontFamily).toBe('');
    });

    it('mostra o nome da fonte escolhida escrito nela mesma', () => {
      controle.setValue('RYE');
      fixture.detectChanges();

      expect(el.querySelector('.fonte-atual')!.textContent!.trim()).toBe('Rye');
      expect((el.querySelector('.fonte-atual') as HTMLElement).style.fontFamily).toContain('Rye');
      expect((el.querySelector('.fonte-amostra') as HTMLElement).style.fontFamily).toContain('Rye');
    });

    it('avisa leitores de tela que abre uma janela e diz qual é a fonte atual', () => {
      expect(botao().getAttribute('aria-haspopup')).toBe('dialog');
      expect(botao().getAttribute('aria-labelledby')).toBe('rotulo-fonte fonte-atual');
    });
  });

  describe('a janela de escolha', () => {
    it('começa fechada', () => {
      expect(modal().open).toBeFalse();
    });

    it('abre ao clicar no botão', () => {
      botao().click();
      fixture.detectChanges();

      expect(modal().open).toBeTrue();
      expect(el.querySelector('.modal-titulo')!.textContent).toBe('Escolher a fonte');
    });

    it('lista a fonte padrão e as 7 fontes, cada uma com um trecho de exemplo na própria fonte', () => {
      botao().click();
      fixture.detectChanges();

      expect(opcoes().length).toBe(8);
      expect(opcoes()[0].querySelector('.opcao-nome')!.textContent).toContain('Padrão do site');
      const nomes = opcoes().slice(1).map(o => o.querySelector('.opcao-nome')!.textContent!.trim());
      expect(nomes).toEqual(['Instrument Serif', 'Fraunces', 'Righteous', 'Rye', 'Mea Culpa', 'Rubik Vinyl', 'Rampart One']);
      expect((opcoes()[4].querySelector('.opcao-nome') as HTMLElement).style.fontFamily).toContain('Rye');
      expect((opcoes()[4].querySelector('.opcao-exemplo') as HTMLElement).style.fontFamily).toContain('Rye');
      expect(opcoes()[4].querySelector('.opcao-exemplo')!.textContent).toContain('Era uma vez');
    });

    it('é um grupo de opções exclusivas e marca a escolhida (aria-checked)', () => {
      controle.setValue('FRAUNCES');
      botao().click();
      fixture.detectChanges();

      expect(el.querySelector('[role="radiogroup"]')).not.toBeNull();
      expect(opcoes().filter(o => o.getAttribute('aria-checked') === 'true').length).toBe(1);
      expect(opcoes()[2].getAttribute('aria-checked')).toBe('true');
      expect(opcoes()[2].classList).toContain('escolhida');
    });

    it('com a fonte padrão, a marcada é a primeira', () => {
      botao().click();
      fixture.detectChanges();

      expect(opcoes()[0].getAttribute('aria-checked')).toBe('true');
    });

    it('escolher uma fonte grava no controle, marca como alterado e fecha a janela', () => {
      botao().click();
      fixture.detectChanges();

      opcoes()[4].click();
      fixture.detectChanges();

      expect(controle.value).toBe('RYE');
      expect(controle.dirty).toBeTrue();
      expect(modal().open).toBeFalse();
      expect(el.querySelector('.fonte-atual')!.textContent!.trim()).toBe('Rye');
    });

    it('escolher "Padrão do site" volta o controle para nulo', () => {
      controle.setValue('RYE');
      botao().click();
      fixture.detectChanges();

      opcoes()[0].click();
      fixture.detectChanges();

      expect(controle.value).toBeNull();
      expect(el.querySelector('.fonte-atual')!.textContent!.trim()).toBe('Padrão do site');
    });

    it('fechar sem escolher (Esc, X ou fora) não muda a fonte', () => {
      controle.setValue('RYE');
      botao().click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.modal-x')!.click();
      fixture.detectChanges();

      expect(modal().open).toBeFalse();
      expect(controle.value).toBe('RYE');
      expect(controle.dirty).toBeFalse();
    });
  });
});
