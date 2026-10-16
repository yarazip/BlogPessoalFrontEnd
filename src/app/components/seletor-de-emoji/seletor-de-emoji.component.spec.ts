import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMOJIS, Emoji } from '../../shared/emojis';
import { SeletorDeEmojiComponent } from './seletor-de-emoji.component';

describe('SeletorDeEmojiComponent', () => {
  let fixture: ComponentFixture<SeletorDeEmojiComponent>;
  let el: HTMLElement;
  let escolhidos: Emoji[];

  const botao = () => el.querySelector<HTMLButtonElement>('.emoji-botao')!;
  const abrir = () => {
    botao().click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SeletorDeEmojiComponent] });
    fixture = TestBed.createComponent(SeletorDeEmojiComponent);
    escolhidos = [];
    fixture.componentInstance.escolher.subscribe(e => escolhidos.push(e));
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('começa fechado, só com o botão', () => {
    expect(botao().getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('.emoji-grade')).toBeNull();
  });

  it('ao clicar mostra um botão para cada emoji, com nome acessível', () => {
    abrir();

    const opcoes = el.querySelectorAll<HTMLButtonElement>('.emoji-opcao');
    expect(botao().getAttribute('aria-expanded')).toBe('true');
    expect(opcoes.length).toBe(EMOJIS.length);
    expect(opcoes[0].getAttribute('aria-label')).toBe(EMOJIS[0].rotulo);
    expect(opcoes[0].title).toContain(`:${EMOJIS[0].nome}:`);
  });

  it('escolher avisa qual emoji foi e mantém a grade aberta para escolher outro', () => {
    abrir();

    el.querySelectorAll<HTMLButtonElement>('.emoji-opcao')[3].click();
    el.querySelectorAll<HTMLButtonElement>('.emoji-opcao')[4].click();
    fixture.detectChanges();

    expect(escolhidos.map(e => e.nome)).toEqual([EMOJIS[3].nome, EMOJIS[4].nome]);
    expect(el.querySelector('.emoji-grade')).not.toBeNull();
  });

  it('fecha com o botão, com Esc e clicando fora', () => {
    abrir();
    botao().click();
    fixture.detectChanges();
    expect(el.querySelector('.emoji-grade')).toBeNull();

    abrir();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('.emoji-grade')).toBeNull();

    abrir();
    document.body.click();
    fixture.detectChanges();
    expect(el.querySelector('.emoji-grade')).toBeNull();
  });

  it('os botões não tiram o foco do campo de texto (mousedown cancelado) nem enviam formulário', () => {
    abrir();

    const evento = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
    el.querySelector('.emoji-opcao')!.dispatchEvent(evento);

    expect(evento.defaultPrevented).toBeTrue();
    expect(botao().type).toBe('button');
    expect(el.querySelector<HTMLButtonElement>('.emoji-opcao')!.type).toBe('button');
  });
});
