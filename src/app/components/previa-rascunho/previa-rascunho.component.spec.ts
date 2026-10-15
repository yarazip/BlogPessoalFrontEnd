import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontePostagem } from '../../models/Fonte';
import { PreviaRascunhoComponent } from './previa-rascunho.component';

describe('PreviaRascunhoComponent', () => {
  let fixture: ComponentFixture<PreviaRascunhoComponent>;
  let el: HTMLElement;

  const definir = (entradas: { titulo?: string; texto?: string; tema?: string | null; fonte?: FontePostagem | null; autor?: string }) => {
    Object.entries(entradas).forEach(([nome, valor]) => fixture.componentRef.setInput(nome, valor));
    fixture.detectChanges();
  };
  const palavras = (n: number) => Array(n).fill('palavra').join(' ');

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PreviaRascunhoComponent] });
    fixture = TestBed.createComponent(PreviaRascunhoComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('sem título nem texto, mostra um convite e nenhuma das duas prévias', () => {
    expect(el.querySelector('.previa-vazia')!.textContent).toContain('Escreva um título e um texto');
    expect(el.querySelector('.previa-post')).toBeNull();
  });

  it('só espaços também conta como vazio', () => {
    definir({ titulo: '   ', texto: '\n  ' });

    expect(el.querySelector('.previa-vazia')).not.toBeNull();
  });

  describe('no feed', () => {
    it('mostra autor, título, texto e tema', () => {
      definir({ titulo: 'Meu título', texto: 'Um texto curto.', tema: 'Escrita', autor: 'Ana' });

      const feed = el.querySelector('.previa-post')!;
      expect(feed.querySelector('.previa-autor')!.textContent).toContain('Ana');
      expect(feed.querySelector('.previa-titulo')!.textContent).toBe('Meu título');
      expect(feed.querySelector('.previa-texto')!.textContent).toBe('Um texto curto.');
      expect(feed.querySelector('.previa-tema')!.textContent).toBe('#Escrita');
      expect(feed.querySelector('.previa-ler-mais')).toBeNull();
    });

    it('texto curto aparece inteiro, sem "Ler mais"', () => {
      definir({ titulo: 'Título', texto: palavras(10) });

      expect(el.querySelector('.previa-post .previa-ler-mais')).toBeNull();
      expect(el.querySelector('.previa-post .previa-texto')!.classList).not.toContain('resumido');
    });

    it('texto longo é cortado como no mural de verdade, com "Ler mais"', () => {
      definir({ titulo: 'Título', texto: palavras(200) });

      const texto = el.querySelector('.previa-post .previa-texto')!;
      expect(texto.textContent!.length).toBeLessThanOrEqual(400);
      expect(texto.classList).toContain('resumido');
      expect(el.querySelector('.previa-post .previa-ler-mais')).not.toBeNull();
    });
  });

  it('mostra só a prévia do feed (não há uma segunda prévia da página da postagem)', () => {
    definir({ titulo: 'Título', texto: palavras(450), autor: 'Ana' });

    expect(el.querySelectorAll('.previa-post').length).toBe(1);
    expect(el.querySelectorAll('.previa-bloco').length).toBe(1);
    expect(el.querySelector('.previa-rotulo')!.textContent).toBe('No mural');
    expect(el.querySelector('.previa-pagina')).toBeNull();
    expect(el.querySelector('.previa-meta')).toBeNull();
    expect(el.textContent).not.toContain('min de leitura');
  });

  describe('fonte', () => {
    it('título e texto aparecem na fonte escolhida', () => {
      definir({ titulo: 'Título', texto: 'Texto', fonte: 'MEA_CULPA' });

      const textos = Array.from(el.querySelectorAll<HTMLElement>('.previa-titulo, .previa-texto'));
      expect(textos.length).toBe(2);
      textos.forEach(t => expect(t.style.fontFamily).toContain('Mea Culpa'));
    });

    it('o título usa o peso certo da fonte (a Fraunces tem negrito de verdade; as outras não)', () => {
      definir({ titulo: 'Título', texto: 'Texto', fonte: 'FRAUNCES' });
      expect(el.querySelector<HTMLElement>('.previa-titulo')!.style.fontWeight).toBe('700');

      definir({ fonte: 'RYE' });
      expect(el.querySelector<HTMLElement>('.previa-titulo')!.style.fontWeight).toBe('400');
    });

    it('na fonte padrão do site, nenhum estilo de fonte é imposto', () => {
      definir({ titulo: 'Título', texto: 'Texto', fonte: null });

      el.querySelectorAll<HTMLElement>('.previa-titulo, .previa-texto').forEach(t => expect(t.style.fontFamily).toBe(''));
    });
  });

  it('sem título, a prévia mostra só o texto (sem um título vazio)', () => {
    definir({ titulo: '', texto: 'Só o texto.' });

    expect(el.querySelector('.previa-titulo')).toBeNull();
    expect(el.querySelector('.previa-texto')!.textContent).toBe('Só o texto.');
  });

  it('sem tema, não mostra a etiqueta', () => {
    definir({ titulo: 'T', texto: 'x', tema: null });

    expect(el.querySelector('.previa-tema')).toBeNull();
  });

  it('SEGURANÇA: HTML no título e no texto aparece como texto, nunca é executado', () => {
    definir({ titulo: '<img src=x onerror="window.__xss = true">', texto: '<script>window.__xss = true</script>' });

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('.previa-titulo')!.textContent).toContain('<img src=x');
  });
});
