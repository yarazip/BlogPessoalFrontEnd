import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MostrarSenhaComponent } from './mostrar-senha.component';

@Component({
  standalone: true,
  imports: [MostrarSenhaComponent],
  template: `
    <div class="campo-senha">
      <input #senha type="password" />
      <app-mostrar-senha [campo]="senha" />
    </div>
  `
})
class AnfitriaComponent {}

describe('MostrarSenhaComponent', () => {
  let fixture: ComponentFixture<AnfitriaComponent>;
  let el: HTMLElement;
  let input: HTMLInputElement;
  let botao: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AnfitriaComponent] });
    fixture = TestBed.createComponent(AnfitriaComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
    input = el.querySelector('input')!;
    botao = el.querySelector('button')!;
  });

  it('começa com a senha escondida e o botão oferece mostrar', () => {
    expect(input.type).toBe('password');
    expect(botao.getAttribute('aria-label')).toBe('Mostrar senha');
    expect(botao.getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelector('svg use')!.getAttribute('href')).toContain('#icon-olho');
  });

  it('ao clicar mostra a senha, troca o ícone e o rótulo', () => {
    botao.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
    expect(botao.getAttribute('aria-label')).toBe('Ocultar senha');
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('svg use')!.getAttribute('href')).toContain('#icon-olho-riscado');
  });

  it('clicar de novo esconde a senha', () => {
    botao.click();
    botao.click();
    fixture.detectChanges();

    expect(input.type).toBe('password');
    expect(botao.getAttribute('aria-label')).toBe('Mostrar senha');
  });

  it('é um botão de tipo "button" (não envia o formulário) e não rouba o foco do campo', () => {
    expect(botao.type).toBe('button');

    const evento = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
    botao.dispatchEvent(evento);

    expect(evento.defaultPrevented).toBeTrue();
  });
});
