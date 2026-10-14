import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Pagina } from '../../models/Pagina';
import { Postagem } from '../../models/Postagem';
import { PostagemService } from '../../services/postagem.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let service: jasmine.SpyObj<PostagemService>;
  let fixture: ComponentFixture<HomeComponent>;
  let el: HTMLElement;

  const pagina = (conteudo: Postagem[]): Pagina<Postagem> => ({
    conteudo,
    pagina: 0,
    tamanho: 3,
    totalElementos: conteudo.length,
    totalPaginas: 1,
    ultima: true
  });

  const abrir = (resposta: Observable<Pagina<Postagem>> = of(pagina([]))) => {
    service.getPagina.and.returnValue(resposta);
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('PostagemService', ['getPagina']);
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: PostagemService, useValue: service }]
    });
  });

  it('a abertura traz a frase da marca e os dois caminhos (criar conta e ver o feed)', () => {
    abrir();

    expect(el.querySelector('h1')!.textContent!.replace(/\s+/g, ' ')).toContain('Escreva rascunhos. Solte rabiscos.');
    const links = Array.from(el.querySelectorAll('.acoes a')).map(a => a.getAttribute('href'));
    expect(links).toEqual(['/register', '/explorar']);
  });

  it('a faixa corre com as frases da marca (e só uma cópia é lida por leitores de tela)', () => {
    abrir();

    const faixa = el.querySelector('.faixa')!;
    expect(faixa.getAttribute('aria-label')).toContain('Escreva um rascunho hoje');
    expect(el.querySelector('.faixa-trilho')!.getAttribute('aria-hidden')).toBe('true');
    const texto = el.querySelector('.faixa-grupo')!.textContent!.replace(/\s+/g, ' ');
    expect(texto).toContain('★ Bem-vinda à Rasura');
    expect(texto).toContain('★ escreva um rascunho hoje');
    expect(texto).toContain('★ solte um rabisco agora');
    expect(texto).toContain('★ sem pressa, sem pose');
    expect(el.querySelectorAll('.faixa-grupo').length).toBe(2);
  });

  it('mostra os dois tipos de postagem, com os exemplos marcados como exemplo', () => {
    abrir();

    expect(el.querySelector('#recursos .folha')!.textContent).toContain('Rascunho');
    expect(el.querySelector('#recursos .postit')!.textContent).toContain('Rabisco');
    expect(el.querySelector('#recursos')!.textContent).toContain('Exemplo');
  });

  it('as âncoras que o cabeçalho usa existem (home, sobre e recursos)', () => {
    abrir();

    ['home', 'sobre', 'recursos'].forEach(id => expect(el.querySelector(`#${id}`)).withContext(id).not.toBeNull());
  });

  it('não tem mais depoimentos nem números inventados', () => {
    abrir();

    expect(el.textContent).not.toContain('milhões');
    expect(el.textContent).not.toContain('Sarah');
    expect(el.querySelector('.testimonial-card')).toBeNull();
  });

  describe('vitrine com postagens de verdade', () => {
    const rascunho: Postagem = {
      id: 1,
      tipo: 'BLOG',
      titulo: 'Meu rascunho',
      texto: 'Texto…',
      resumido: true,
      minutosLeitura: 4,
      data: '2026-10-12T15:00:00Z',
      usuario: { id: 7, nome: 'Ana' }
    };
    const rabisco: Postagem = {
      id: 2,
      tipo: 'COMENTARIO',
      texto: 'Um rabisco curto',
      data: '2026-10-11T15:00:00Z',
      usuario: { id: 8, nome: 'Bruno', foto: 'https://cdn/bruno.png' }
    };

    it('pede só as 3 últimas postagens', () => {
      abrir();

      expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 3 });
    });

    it('mostra o título do rascunho (com link e tempo de leitura) e o texto do rabisco', () => {
      abrir(of(pagina([rascunho, rabisco])));

      const posts = el.querySelectorAll('.vitrine .post');
      expect(posts.length).toBe(2);
      expect(posts[0].querySelector('.texto a')!.getAttribute('href')).toBe('/postagens/1');
      expect(posts[0].textContent).toContain('Meu rascunho');
      expect(posts[0].textContent).toContain('4 min de leitura');
      expect(posts[0].querySelector('.foto.inicial')!.textContent).toBe('A');
      expect(posts[1].textContent).toContain('Um rabisco curto');
      expect(posts[1].querySelector('.texto a')).toBeNull();
      expect(posts[1].querySelector('img.foto')!.getAttribute('src')).toBe('https://cdn/bruno.png');
    });

    it('SEGURANÇA: HTML no texto aparece como texto, nunca é executado', () => {
      abrir(of(pagina([{ ...rabisco, texto: '<img src=x onerror="window.__xss = true">' }])));

      expect(el.querySelector('.vitrine .texto img')).toBeNull();
      expect(el.querySelector('.vitrine .texto')!.textContent).toContain('<img src=x');
    });

    it('sem postagens, ou com a API fora do ar, a vitrine nem aparece', () => {
      abrir(of(pagina([])));
      expect(el.querySelector('.vitrine')).toBeNull();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HomeComponent],
        providers: [provideRouter([]), { provide: PostagemService, useValue: service }]
      });
      abrir(throwError(() => new Error('fora do ar')));
      expect(el.querySelector('.vitrine')).toBeNull();
      expect(el.querySelector('.convite')).not.toBeNull();
    });
  });
});
