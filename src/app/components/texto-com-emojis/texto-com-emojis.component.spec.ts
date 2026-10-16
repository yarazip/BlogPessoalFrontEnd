import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextoComEmojisComponent } from './texto-com-emojis.component';

describe('TextoComEmojisComponent', () => {
  let fixture: ComponentFixture<TextoComEmojisComponent>;
  let el: HTMLElement;

  const mostrar = (texto: string | null | undefined) => {
    fixture.componentRef.setInput('texto', texto);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TextoComEmojisComponent] });
    fixture = TestBed.createComponent(TextoComEmojisComponent);
    el = fixture.nativeElement;
  });

  it('texto sem emojis sai igual, sem nenhum ícone', () => {
    mostrar('Só texto, com "aspas" & <tags>.');

    expect(el.textContent).toBe('Só texto, com "aspas" & <tags>.');
    expect(el.querySelector('.emoji')).toBeNull();
  });

  it('troca o código pelo desenho, com nome para leitores de tela', () => {
    mostrar('Bom dia :sol: pessoal');

    const emoji = el.querySelector('.emoji')!;
    expect(emoji.getAttribute('role')).toBe('img');
    expect(emoji.getAttribute('aria-label')).toBe('Sol');
    expect(emoji.querySelector('use')!.getAttribute('href')).toContain('#icon-emoji-sol');
    expect(el.textContent).toBe('Bom dia  pessoal');
  });

  it('não acrescenta nem tira espaços e quebras de linha do texto (o parágrafo usa white-space: pre-line)', () => {
    mostrar('linha 1\n\n  :amor:  linha 3\n');

    expect(el.textContent).toBe('linha 1\n\n    linha 3\n');
  });

  it('vários emojis, inclusive colados e repetidos', () => {
    mostrar(':fogo::fogo: e :lua:');

    expect(Array.from(el.querySelectorAll('.emoji')).map(e => e.getAttribute('aria-label'))).toEqual(['Fogo', 'Fogo', 'Lua']);
  });

  it('código desconhecido continua aparecendo como texto', () => {
    mostrar('Isso :naoexiste: fica');

    expect(el.textContent).toBe('Isso :naoexiste: fica');
    expect(el.querySelector('.emoji')).toBeNull();
  });

  it('texto vazio, nulo ou indefinido não mostra nada', () => {
    mostrar('');
    expect(el.textContent).toBe('');
    mostrar(null);
    expect(el.textContent).toBe('');
    mostrar(undefined);
    expect(el.textContent).toBe('');
  });

  it('SEGURANÇA: HTML no texto aparece como texto, nunca é executado, mesmo ao lado de um emoji', () => {
    mostrar('<img src=x onerror="window.__xss = true"> :sorriso: <script>window.__xss = true</script>');

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('script')).toBeNull();
    expect(el.textContent).toContain('<img src=x onerror="window.__xss = true">');
    expect(el.querySelectorAll('.emoji').length).toBe(1);
  });
});
