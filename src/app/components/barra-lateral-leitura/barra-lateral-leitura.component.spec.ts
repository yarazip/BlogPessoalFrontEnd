import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Perfil } from '../../models/Perfil';
import { Postagem } from '../../models/Postagem';
import { BarraLateralLeituraComponent } from './barra-lateral-leitura.component';

describe('BarraLateralLeituraComponent', () => {
  let fixture: ComponentFixture<BarraLateralLeituraComponent>;
  let el: HTMLElement;

  const autor = { id: 3, nome: 'Bia', foto: 'https://cdn/bia.png' };
  const perfil = (extra: Partial<Perfil> = {}): Perfil => ({ id: 3, nome: 'Bia Souza', totalPostagens: 12, ...extra });
  const blog = (id: number, titulo: string, tema?: string): Postagem => ({
    id,
    tipo: 'BLOG',
    titulo,
    texto: 'texto do blog',
    data: '2026-10-01T10:00:00',
    minutosLeitura: 3,
    tema: tema ? { id: id, descricao: tema } : null
  });

  const montar = (entradas: { perfil?: Perfil | null; lista?: Postagem[]; atualId?: number } = {}) => {
    fixture = TestBed.createComponent(BarraLateralLeituraComponent);
    fixture.componentRef.setInput('autor', autor);
    fixture.componentRef.setInput('perfil', entradas.perfil ?? null);
    fixture.componentRef.setInput('postagensDaAutora', entradas.lista ?? []);
    fixture.componentRef.setInput('atualId', entradas.atualId);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const titulos = () => Array.from(el.querySelectorAll('.caixa-titulo')).map(t => t.textContent!.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BarraLateralLeituraComponent],
      // o "no momento" usa o serviço de perfil, que precisa de HTTP (nunca chamado aqui)
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
  });

  it('sem perfil nem lista, sobra só o cartão da autora com o nome e a foto da postagem', () => {
    montar();

    expect(titulos()).toEqual(['~ sobre a autora ~']);
    expect(el.querySelector('.autora-nome')!.textContent).toBe('Bia');
    expect(el.querySelector('.autora-foto img')!.getAttribute('src')).toBe('https://cdn/bia.png');
    expect(el.querySelector('.autora-numeros')).toBeNull();
    expect(el.querySelector('.autora-botao')!.getAttribute('href')).toBe('/perfil/3');
  });

  it('o cartão mostra nome do perfil, bio e o total de postagens (no singular também)', () => {
    montar({ perfil: perfil({ bio: 'Escrevo à mão.', totalPostagens: 1 }) });

    expect(el.querySelector('.autora-nome')!.textContent).toBe('Bia Souza');
    expect(el.querySelector('.autora-bio')!.textContent).toBe('Escrevo à mão.');
    expect(el.querySelector('.autora-numeros')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('1 postagem');
  });

  it('sem foto no perfil nem na postagem, usa a foto padrão', () => {
    fixture = TestBed.createComponent(BarraLateralLeituraComponent);
    fixture.componentRef.setInput('autor', { id: 3, nome: 'Bia' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.autora-foto img').getAttribute('src')).toBe('assets/img/sem-foto.svg');
  });

  it('"no momento" só aparece quando a autora tem música ou livro', () => {
    montar({ perfil: perfil() });
    expect(titulos()).not.toContain('~ no momento ~');

    montar({ perfil: perfil({ musicaAtual: 'Clube da Esquina' }) });
    expect(titulos()).toContain('~ no momento ~');
    expect(el.querySelector('app-no-momento .destaque-musica')!.textContent).toBe('Clube da Esquina');
  });

  it('"mais da autora" lista os últimos rascunhos sem o que está sendo lido, com data e minutos', () => {
    montar({ lista: [blog(9, 'Mais nova'), blog(7, 'A que estou lendo'), blog(5, 'Antiga')], atualId: 7 });

    const itens = Array.from(el.querySelectorAll('.lista li'));
    expect(itens.map(i => i.querySelector('a')!.textContent)).toEqual(['Mais nova', 'Antiga']);
    expect(itens[0].querySelector('a')!.getAttribute('href')).toBe('/postagens/9');
    expect(itens[0].querySelector('small')!.textContent).toBe('01/10/2026 · 3 min');
  });

  it('"mais da autora" some quando não há outros rascunhos', () => {
    montar({ lista: [blog(7, 'Só esta')], atualId: 7 });

    expect(titulos()).not.toContain('~ mais da autora ~');
  });

  it('"temas" mostra cada tema com a quantidade, do mais usado ao menos usado', () => {
    montar({ lista: [blog(1, 'a', 'Rotina'), blog(2, 'b', 'Escrita'), blog(3, 'c', 'Escrita')], atualId: 99 });

    const temas = Array.from(el.querySelectorAll('.tema')).map(t => t.textContent!.replace(/\s+/g, ' ').trim());
    expect(temas).toEqual(['#Escrita (2)', '#Rotina (1)']);
  });

  it('SEGURANÇA: HTML no título, no nome e na bio aparece como texto, nunca é executado', () => {
    fixture = TestBed.createComponent(BarraLateralLeituraComponent);
    fixture.componentRef.setInput('autor', { id: 3, nome: '<img src=x onerror="window.__xss = true">' });
    fixture.componentRef.setInput('perfil', perfil({ bio: '<script>window.__xss = true</script>' }));
    fixture.componentRef.setInput('postagensDaAutora', [blog(1, '<b>negrito</b>')]);
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;

    expect(raiz.querySelector('img[src="x"]')).toBeNull();
    expect(raiz.querySelector('script')).toBeNull();
    expect(raiz.querySelector('.lista b')).toBeNull();
    expect(raiz.querySelector('.lista a')!.textContent).toBe('<b>negrito</b>');
  });

  describe('etapa 2', () => {
    const montarComExtras = (extras: { perfil?: Perfil | null; visitas?: number | null; arquivo?: { ano: number; mes: number; total: number }[] }) => {
      fixture = TestBed.createComponent(BarraLateralLeituraComponent);
      fixture.componentRef.setInput('autor', autor);
      fixture.componentRef.setInput('perfil', extras.perfil ?? null);
      fixture.componentRef.setInput('visitas', extras.visitas ?? null);
      fixture.componentRef.setInput('arquivo', extras.arquivo ?? []);
      fixture.detectChanges();
      el = fixture.nativeElement;
    };

    it('o contador mostra o total em dígitos, com zeros à esquerda até seis casas', () => {
      montarComExtras({ visitas: 1234 });

      expect(Array.from(el.querySelectorAll('.digito')).map(d => d.textContent).join('')).toBe('001234');
      expect(el.querySelector('.contador')!.getAttribute('aria-label')).toBe('1234 visitas');
      expect(el.querySelector('.contador-legenda')!.textContent).toContain('visitas a esta postagem');
    });

    it('com uma visita, o singular; com zero, o contador aparece zerado', () => {
      montarComExtras({ visitas: 1 });
      expect(el.querySelector('.contador-legenda')!.textContent).toContain('visita a esta postagem');

      montarComExtras({ visitas: 0 });
      expect(Array.from(el.querySelectorAll('.digito')).map(d => d.textContent).join('')).toBe('000000');
    });

    it('passando de seis dígitos, mostra todos (não corta)', () => {
      montarComExtras({ visitas: 1234567 });

      expect(Array.from(el.querySelectorAll('.digito')).map(d => d.textContent).join('')).toBe('1234567');
    });

    it('sem o total (ainda não se sabe), a caixa de visitas não aparece', () => {
      montarComExtras({ visitas: null });

      expect(titulos()).not.toContain('~ visitas ~');
    });

    it('o arquivo só aparece quando há meses, com o link do mês no perfil da autora', () => {
      montarComExtras({});
      expect(titulos()).not.toContain('~ arquivo ~');

      montarComExtras({ arquivo: [{ ano: 2026, mes: 3, total: 2 }] });
      const link = el.querySelector<HTMLAnchorElement>('.arquivo a')!;
      expect(link.textContent).toBe('março 2026');
      expect(link.getAttribute('href')).toBe('/perfil/3?mes=2026-03');
      expect(el.querySelector('.arquivo-total')!.textContent).toBe('2');
    });

    it('o humor do dia só aparece quando a autora tem um, e aceita os emojis da Rasura', () => {
      montarComExtras({ perfil: perfil() });
      expect(titulos()).not.toContain('~ humor do dia ~');

      montarComExtras({ perfil: perfil({ humor: 'animada :sol:' }) });
      expect(titulos()).toContain('~ humor do dia ~');
      expect(el.querySelector('.humor')!.textContent).toContain('animada');
      expect(el.querySelector('.humor .emoji')).not.toBeNull();
    });
  });
});
