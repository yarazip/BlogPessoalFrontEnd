import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PostagemService } from '../../services/postagem.service';
import { Postagem } from '../models/Postagem';
import { ExplorarComponent } from './explorar.component';

describe('ExplorarComponent', () => {
  let fixture: ComponentFixture<ExplorarComponent>;
  let service: jasmine.SpyObj<PostagemService>;

  const postagem = (texto: string): Postagem => ({
    id: 1,
    titulo: 'Título',
    texto,
    data: '2024-01-10T15:30:00Z',
    usuario: { id: 1, nome: 'Ana' }
  });

  const criar = (resposta: ReturnType<PostagemService['getAll']>) => {
    service.getAll.and.returnValue(resposta);
    fixture = TestBed.createComponent(ExplorarComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('PostagemService', ['getAll']);
    TestBed.configureTestingModule({
      imports: [ExplorarComponent],
      providers: [{ provide: PostagemService, useValue: service }]
    });
  });

  it('SEGURANÇA: HTML no texto da postagem é mostrado como texto, nunca executado', () => {
    const malicioso = '<img src=x onerror="window.__xss = true"><script>window.__xss = true</script>';
    (window as unknown as { __xss?: boolean }).__xss = false;

    const el = criar(of([postagem(malicioso)]));

    expect(el.querySelector('.texto-postagem img')).toBeNull();
    expect(el.querySelector('.texto-postagem script')).toBeNull();
    expect(el.querySelector('.texto-postagem')!.textContent).toContain('<img src=x');
    expect((window as unknown as { __xss?: boolean }).__xss).toBeFalse();
  });

  it('preserva as quebras de linha por CSS, sem inserir <br>', () => {
    const el = criar(of([postagem('linha 1\nlinha 2')]));
    const texto = el.querySelector('.texto-postagem') as HTMLElement;

    expect(texto.textContent).toBe('linha 1\nlinha 2');
    expect(texto.querySelector('br')).toBeNull();
    expect(getComputedStyle(texto).whiteSpace).toBe('pre-line');
  });

  it('usa a foto padrão quando o autor não tem foto', () => {
    const el = criar(of([postagem('texto')]));

    expect((el.querySelector('img.foto-perfil') as HTMLImageElement).getAttribute('src')).toBe('assets/img/sem-foto.svg');
  });

  it('mostra mensagem quando não há postagens', () => {
    expect(criar(of([])).textContent).toContain('Ainda não há postagens');
  });

  it('mostra erro quando a API falha', () => {
    const el = criar(throwError(() => new Error('falhou')));

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Não foi possível carregar as postagens');
  });
});
