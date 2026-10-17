import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Postit } from '../../models/Postit';
import { PostitsDaLeituraComponent } from './postits-da-leitura.component';

describe('PostitsDaLeituraComponent', () => {
  let fixture: ComponentFixture<PostitsDaLeituraComponent>;
  let el: HTMLElement;

  const montar = (postits: Postit[]) => {
    fixture = TestBed.createComponent(PostitsDaLeituraComponent);
    fixture.componentRef.setInput('postits', postits);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [PostitsDaLeituraComponent] }));

  it('sem post-its, não desenha nada', () => {
    montar([]);

    expect(el.querySelector('.postits')).toBeNull();
  });

  it('um recado vira texto num papel da cor escolhida, com fita e inclinação', () => {
    montar([{ tipo: 'NOTA', texto: 'Lembrar do café', cor: 'ROSA' }]);

    const postit = el.querySelector<HTMLElement>('.postit')!;
    expect(postit.querySelector('.postit-texto')!.textContent).toBe('Lembrar do café');
    expect(postit.querySelector('.postit-fita')).not.toBeNull();
    expect(postit.style.getPropertyValue('--papel')).toBe('#ff9ec4');
    expect(postit.style.getPropertyValue('--inclinacao')).toBe('-2.2deg');
  });

  it('uma foto vira imagem com a legenda (ou um texto alternativo padrão sem legenda)', () => {
    montar([
      { tipo: 'FOTO', fotoUrl: 'https://res.cloudinary.com/x/a.jpg', texto: 'Meu caderno', cor: 'AMARELO' },
      { tipo: 'FOTO', fotoUrl: 'https://res.cloudinary.com/x/b.jpg', cor: 'VERDE' }
    ]);

    const imagens = el.querySelectorAll('.postit-imagem');
    expect(imagens[0].getAttribute('src')).toBe('https://res.cloudinary.com/x/a.jpg');
    expect(imagens[0].getAttribute('alt')).toBe('Meu caderno');
    expect(imagens[1].getAttribute('alt')).toBe('Foto do post-it');
    expect(el.querySelectorAll('.postit-legenda').length).toBe(1);
  });

  it('cada post-it fica torto para um lado, alternando', () => {
    montar([1, 2, 3].map(n => ({ tipo: 'NOTA', texto: String(n), cor: 'AMARELO' }) as Postit));

    const graus = Array.from(el.querySelectorAll<HTMLElement>('.postit')).map(p => p.style.getPropertyValue('--inclinacao'));
    expect(graus).toEqual(['-2.2deg', '1.8deg', '-1.2deg']);
  });

  it('o recado aceita os emojis da Rasura', () => {
    montar([{ tipo: 'NOTA', texto: 'Bom dia :sol:', cor: 'AMARELO' }]);

    expect(el.querySelector('.postit-texto .emoji')!.getAttribute('aria-label')).toBe('Sol');
  });

  it('SEGURANÇA: HTML no recado e na legenda aparece como texto, nunca é executado', () => {
    montar([
      { tipo: 'NOTA', texto: '<img src=x onerror="window.__xss = true"><script>1</script>', cor: 'AMARELO' },
      { tipo: 'FOTO', fotoUrl: 'https://res.cloudinary.com/x/a.jpg', texto: '<b>negrito</b>', cor: 'ROSA' }
    ]);

    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('img[src="x"]')).toBeNull();
    expect(el.querySelector('.postit-texto')!.textContent).toContain('<img src=x');
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('.postit-legenda')!.textContent).toBe('<b>negrito</b>');
  });
});
