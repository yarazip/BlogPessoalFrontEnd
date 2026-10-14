import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LarguraDoModal, ModalComponent } from './modal.component';

@Component({
  standalone: true,
  imports: [ModalComponent],
  template: `
    <button type="button" id="abrir" (click)="aberto.set(true)">Abrir</button>
    <app-modal
      [aberto]="aberto()"
      [titulo]="titulo()"
      [largura]="largura()"
      [fecharAoClicarFora]="fecharAoClicarFora()"
      [mostrarX]="mostrarX()"
      (fechar)="pedidosParaFechar = pedidosParaFechar + 1; aberto.set(false)"
    >
      <p class="conteudo">Esta ação não pode ser desfeita.</p>
      @if (comAcoes()) {
        <ng-container modalAcoes>
          <button type="button" class="zine-botao" id="cancelar">Cancelar</button>
          <button type="button" class="zine-botao perigo" id="confirmar">Excluir</button>
        </ng-container>
      }
    </app-modal>
  `
})
class AnfitriaoComponent {
  readonly aberto = signal(false);
  readonly titulo = signal('Excluir postagem?');
  readonly largura = signal<LarguraDoModal>('media');
  readonly fecharAoClicarFora = signal(true);
  readonly mostrarX = signal(true);
  readonly comAcoes = signal(true);
  pedidosParaFechar = 0;
}

describe('ModalComponent', () => {
  let fixture: ComponentFixture<AnfitriaoComponent>;
  let anfitriao: AnfitriaoComponent;
  let el: HTMLElement;

  const dialogo = () => el.querySelector<HTMLDialogElement>('dialog')!;

  const abrir = () => {
    anfitriao.aberto.set(true);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AnfitriaoComponent] });
    fixture = TestBed.createComponent(AnfitriaoComponent);
    anfitriao = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => document.body.classList.remove('modal-aberto'));

  describe('abrir e fechar', () => {
    it('começa fechado', () => {
      expect(dialogo().open).toBeFalse();
      expect(document.body.classList.contains('modal-aberto')).toBeFalse();
    });

    it('abre como modal (de verdade: o resto da página fica inerte) e trava a rolagem da página', () => {
      abrir();

      expect(dialogo().open).toBeTrue();
      expect(dialogo().matches(':modal')).toBeTrue();
      expect(document.body.classList.contains('modal-aberto')).toBeTrue();
    });

    it('fecha quando quem usa muda "aberto", e libera a rolagem', () => {
      abrir();

      anfitriao.aberto.set(false);
      fixture.detectChanges();

      expect(dialogo().open).toBeFalse();
      expect(document.body.classList.contains('modal-aberto')).toBeFalse();
    });

    it('pode abrir de novo depois de fechado', () => {
      abrir();
      anfitriao.aberto.set(false);
      fixture.detectChanges();

      abrir();

      expect(dialogo().open).toBeTrue();
    });

    it('destruir o componente aberto libera a rolagem da página', () => {
      abrir();

      fixture.destroy();

      expect(document.body.classList.contains('modal-aberto')).toBeFalse();
    });
  });

  describe('conteúdo', () => {
    it('mostra o título e liga o diálogo a ele (aria-labelledby)', () => {
      abrir();

      const titulo = el.querySelector('.modal-titulo')!;
      expect(titulo.textContent).toBe('Excluir postagem?');
      expect(dialogo().getAttribute('aria-labelledby')).toBe(titulo.id);
    });

    it('cada modal tem um id de título próprio', () => {
      const outro = TestBed.createComponent(AnfitriaoComponent);
      outro.detectChanges();

      const ids = [el.querySelector('.modal-titulo')!.id, outro.nativeElement.querySelector('.modal-titulo').id];

      expect(ids[0]).not.toBe(ids[1]);
    });

    it('o conteúdo vai no corpo e os botões marcados com modalAcoes vão para o rodapé', () => {
      abrir();

      expect(el.querySelector('.modal-corpo .conteudo')!.textContent).toContain('não pode ser desfeita');
      expect(el.querySelector('.modal-rodape #cancelar')).not.toBeNull();
      expect(el.querySelector('.modal-rodape #confirmar')).not.toBeNull();
      expect(el.querySelector('.modal-corpo #confirmar')).toBeNull();
    });

    it('sem botões projetados, o rodapé não ocupa espaço', () => {
      anfitriao.comAcoes.set(false);
      fixture.detectChanges();
      abrir();

      expect(getComputedStyle(el.querySelector('.modal-rodape')!).display).toBe('none');
    });

    it('a largura muda a classe do diálogo', () => {
      anfitriao.largura.set('estreita');
      fixture.detectChanges();
      expect(dialogo().classList.contains('estreita')).toBeTrue();

      anfitriao.largura.set('larga');
      fixture.detectChanges();
      expect(dialogo().classList.contains('larga')).toBeTrue();
      expect(dialogo().classList.contains('estreita')).toBeFalse();
    });

    it('SEGURANÇA: o título é mostrado como texto, nunca como HTML', () => {
      anfitriao.titulo.set('<img src=x onerror="window.__xss = true">');
      fixture.detectChanges();
      abrir();

      expect(el.querySelector('.modal-titulo img')).toBeNull();
      expect(el.querySelector('.modal-titulo')!.textContent).toContain('<img src=x');
    });
  });

  describe('pedir para fechar', () => {
    it('o botão X avisa que a pessoa pediu para fechar', () => {
      abrir();

      el.querySelector<HTMLButtonElement>('.modal-x')!.click();
      fixture.detectChanges();

      expect(anfitriao.pedidosParaFechar).toBe(1);
      expect(dialogo().open).toBeFalse();
    });

    it('o botão X pode ser escondido', () => {
      anfitriao.mostrarX.set(false);
      fixture.detectChanges();
      abrir();

      expect(el.querySelector('.modal-x')).toBeNull();
    });

    it('Esc avisa quem usa e NÃO fecha sozinho (quem usa decide)', () => {
      abrir();
      let semDecidir = 0;
      const modal = fixture.debugElement.children.find(c => c.name === 'app-modal')!.componentInstance as ModalComponent;
      modal.fechar.subscribe(() => semDecidir++);

      const esc = new Event('cancel', { cancelable: true });
      dialogo().dispatchEvent(esc);

      expect(esc.defaultPrevented).toBeTrue();
      expect(semDecidir).toBe(1);
    });

    it('clicar na área escura (fora da folha) avisa que é para fechar', () => {
      abrir();

      dialogo().click();
      fixture.detectChanges();

      expect(anfitriao.pedidosParaFechar).toBe(1);
    });

    it('clicar dentro da folha não fecha', () => {
      abrir();

      el.querySelector<HTMLElement>('.modal-corpo')!.click();
      el.querySelector<HTMLElement>('.modal-titulo')!.click();
      fixture.detectChanges();

      expect(anfitriao.pedidosParaFechar).toBe(0);
      expect(dialogo().open).toBeTrue();
    });

    it('com fecharAoClicarFora desligado, clicar fora não fecha (mas o X e o Esc continuam)', () => {
      anfitriao.fecharAoClicarFora.set(false);
      fixture.detectChanges();
      abrir();

      dialogo().click();
      fixture.detectChanges();
      expect(anfitriao.pedidosParaFechar).toBe(0);

      el.querySelector<HTMLButtonElement>('.modal-x')!.click();
      expect(anfitriao.pedidosParaFechar).toBe(1);
    });

    // o evento "close" do <dialog> é disparado pelo navegador numa tarefa à parte: o teste espera por ele de verdade
    // (e não por um tempo fixo). O ouvinte do componente foi ligado antes, então já rodou quando este resolve.
    const aguardarOEventoClose = () =>
      new Promise<void>(resolver => dialogo().addEventListener('close', () => resolver(), { once: true }));

    it('se o navegador fechar o diálogo por fora (ex.: form method=dialog), quem usa é avisado', async () => {
      abrir();

      const fechado = aguardarOEventoClose();
      dialogo().close();
      await fechado;

      expect(anfitriao.pedidosParaFechar).toBe(1);
    });

    it('fechar por quem usa não gera um segundo aviso', async () => {
      abrir();

      const fechado = aguardarOEventoClose();
      anfitriao.aberto.set(false);
      fixture.detectChanges();
      await fechado;

      expect(anfitriao.pedidosParaFechar).toBe(0);
    });
  });

  describe('foco', () => {
    it('ao abrir, o foco vai para dentro do modal', () => {
      abrir();

      expect(dialogo().contains(document.activeElement)).toBeTrue();
    });

    it('ao fechar, o foco volta ao botão que abriu', () => {
      const abridor = el.querySelector<HTMLButtonElement>('#abrir')!;
      document.body.appendChild(el);
      abridor.focus();
      abrir();

      anfitriao.aberto.set(false);
      fixture.detectChanges();

      expect(document.activeElement).toBe(abridor);
      el.remove();
    });
  });
});
