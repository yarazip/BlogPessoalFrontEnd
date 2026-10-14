import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmarExclusaoComponent } from './confirmar-exclusao.component';

describe('ConfirmarExclusaoComponent', () => {
  let fixture: ComponentFixture<ConfirmarExclusaoComponent>;
  let el: HTMLElement;
  let confirmados: number;
  let cancelados: number;

  const dialogo = () => el.querySelector<HTMLDialogElement>('dialog')!;
  const botaoConfirmar = () => el.querySelector<HTMLButtonElement>('.zine-botao.perigo')!;
  const botaoCancelar = () => el.querySelector<HTMLButtonElement>('.modal-rodape .zine-botao:not(.perigo)')!;

  const definir = (entradas: Record<string, unknown>) => {
    Object.entries(entradas).forEach(([nome, valor]) => fixture.componentRef.setInput(nome, valor));
    fixture.detectChanges();
  };

  beforeEach(() => {
    confirmados = 0;
    cancelados = 0;
    TestBed.configureTestingModule({ imports: [ConfirmarExclusaoComponent] });
    fixture = TestBed.createComponent(ConfirmarExclusaoComponent);
    fixture.componentInstance.confirmar.subscribe(() => confirmados++);
    fixture.componentInstance.cancelar.subscribe(() => cancelados++);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => document.body.classList.remove('modal-aberto'));

  it('fechado por padrão', () => {
    expect(dialogo().open).toBeFalse();
  });

  it('aberto mostra a pergunta e a explicação (textos padrão), com Cancelar e Excluir', () => {
    definir({ aberto: true });

    expect(dialogo().open).toBeTrue();
    expect(el.querySelector('.modal-titulo')!.textContent).toBe('Excluir esta postagem?');
    expect(el.querySelector('.modal-corpo')!.textContent).toContain('não pode ser desfeita');
    expect(botaoCancelar().textContent!.trim()).toBe('Cancelar');
    expect(botaoConfirmar().textContent!.trim()).toBe('Excluir');
  });

  it('o título e o texto podem ser trocados', () => {
    definir({ aberto: true, titulo: 'Apagar o comentário?', texto: 'Some para sempre.' });

    expect(el.querySelector('.modal-titulo')!.textContent).toBe('Apagar o comentário?');
    expect(el.querySelector('.modal-corpo')!.textContent).toContain('Some para sempre.');
  });

  it('o foco começa em "Cancelar" (a ação segura)', () => {
    definir({ aberto: true });

    expect(document.activeElement).toBe(botaoCancelar());
  });

  it('"Excluir" avisa que foi confirmado, e "Cancelar" avisa que foi cancelado', () => {
    definir({ aberto: true });

    botaoConfirmar().click();
    botaoCancelar().click();

    expect(confirmados).toBe(1);
    expect(cancelados).toBe(1);
  });

  it('Esc, X e clique fora cancelam', () => {
    definir({ aberto: true });

    dialogo().dispatchEvent(new Event('cancel', { cancelable: true }));
    el.querySelector<HTMLButtonElement>('.modal-x')!.click();
    dialogo().click();

    expect(cancelados).toBe(3);
    expect(confirmados).toBe(0);
  });

  describe('enquanto exclui', () => {
    beforeEach(() => definir({ aberto: true, excluindo: true }));

    it('trava os dois botões e mostra "Excluindo..."', () => {
      expect(botaoConfirmar().disabled).toBeTrue();
      expect(botaoCancelar().disabled).toBeTrue();
      expect(botaoConfirmar().textContent!.trim()).toBe('Excluindo...');
    });

    it('esconde o X e não cancela por Esc nem por clique fora', () => {
      expect(el.querySelector('.modal-x')).toBeNull();

      dialogo().dispatchEvent(new Event('cancel', { cancelable: true }));
      dialogo().click();

      expect(cancelados).toBe(0);
      expect(dialogo().open).toBeTrue();
    });
  });
});
