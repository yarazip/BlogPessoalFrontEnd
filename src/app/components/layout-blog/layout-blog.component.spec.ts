import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Tema } from '../../models/Tema';
import { AuthService } from '../../services/auth.service';
import { TemaService } from '../../services/tema.service';
import { LayoutBlogComponent } from './layout-blog.component';

describe('LayoutBlogComponent', () => {
  let logado = false;

  const montar = (temas: Observable<Tema[]>) => {
    TestBed.configureTestingModule({
      imports: [LayoutBlogComponent],
      providers: [
        provideRouter([]),
        { provide: TemaService, useValue: { getAll: () => temas } },
        { provide: AuthService, useValue: { isLoggedIn: () => logado } }
      ]
    });
    const fixture = TestBed.createComponent(LayoutBlogComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => (logado = false));

  it('lista os temas na barra lateral, sem as aspas gravadas em temas antigos', () => {
    const el = montar(of([{ id: 1, descricao: "'Tecnologia'" }, { id: 2, descricao: 'Viagens' }]));

    const itens = Array.from(el.querySelectorAll('.caixa-lista li')).map(li => li.textContent!.trim());
    expect(itens).toContain('#Tecnologia');
    expect(itens).toContain('#Viagens');
  });

  it('se os temas não carregarem, a caixa de temas simplesmente não aparece', () => {
    const el = montar(throwError(() => new Error('falhou')));

    const titulos = Array.from(el.querySelectorAll('.caixa-titulo')).map(t => t.textContent);
    expect(titulos).toEqual(['~ sobre ~', '~ cantinho ~']);
  });

  it('visitante vê Entrar e Criar conta', () => {
    const el = montar(of([]));

    const links = Array.from(el.querySelectorAll('.caixa-lista a')).map(a => a.getAttribute('href'));
    expect(links).toContain('/login');
    expect(links).toContain('/register');
    expect(links).not.toContain('/postagens/nova');
  });

  it('quem está logado vê o atalho para escrever um rascunho e o perfil', () => {
    logado = true;
    const el = montar(of([]));

    const links = Array.from(el.querySelectorAll('.caixa-lista a')).map(a => a.getAttribute('href'));
    expect(links).toContain('/postagens/nova');
    expect(links).toContain('/perfil');
    expect(links).not.toContain('/login');
  });
});
