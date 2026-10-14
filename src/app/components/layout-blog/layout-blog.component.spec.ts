import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { BuscaLivroService } from '../../services/busca-livro.service';
import { BuscaMusicaService } from '../../services/busca-musica.service';
import { PerfilService } from '../../services/perfil.service';
import { LayoutBlogComponent } from './layout-blog.component';

@Component({
  standalone: true,
  imports: [LayoutBlogComponent],
  template: '<app-layout-blog [perfilId]="id()" [comCartao]="comCartao()"><p class="conteudo">feed</p></app-layout-blog>'
})
class AnfitriaoComponent {
  readonly id = signal<number | null>(null);
  readonly comCartao = signal(true);
}

describe('LayoutBlogComponent', () => {
  let perfis: jasmine.SpyObj<PerfilService>;
  let logadoComo: { id: number } | null;
  let fixture: ComponentFixture<AnfitriaoComponent>;
  let el: HTMLElement;

  const perfil = (sobre: Partial<Perfil> = {}): Perfil => ({
    id: 5,
    nome: 'Bia Autora',
    bio: 'Escrevo sobre café.',
    totalPostagens: 2,
    ...sobre
  });

  const montar = (opcoes: { id?: number | null; comCartao?: boolean; resposta?: Observable<Perfil> } = {}) => {
    perfis.getPerfil.and.returnValue(opcoes.resposta ?? of(perfil()));
    fixture = TestBed.createComponent(AnfitriaoComponent);
    fixture.componentInstance.id.set(opcoes.id ?? null);
    fixture.componentInstance.comCartao.set(opcoes.comCartao ?? true);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const titulos = () => Array.from(el.querySelectorAll('.caixa-titulo')).map(t => t.textContent!.trim());

  beforeEach(() => {
    logadoComo = null;
    perfis = jasmine.createSpyObj('PerfilService', ['getPerfil', 'atualizarDestaques']);
    TestBed.configureTestingModule({
      imports: [AnfitriaoComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilService, useValue: perfis },
        { provide: BuscaMusicaService, useValue: { buscar: () => of([]) } },
        { provide: BuscaLivroService, useValue: { buscar: () => of([]) } },
        { provide: AuthService, useValue: { isLoggedIn: () => !!logadoComo, getUsuario: () => logadoComo } }
      ]
    });
  });

  it('projeta o conteúdo no meio da moldura', () => {
    montar();

    expect(el.querySelector('.principal .conteudo')).not.toBeNull();
  });

  describe('visitante, sem perfil para mostrar', () => {
    it('mostra só "sobre" e "cantinho", com Entrar e Criar conta', () => {
      montar();

      expect(perfis.getPerfil).not.toHaveBeenCalled();
      expect(titulos()).toEqual(['~ sobre ~', '~ cantinho ~']);
      const links = Array.from(el.querySelectorAll('.caixa-lista a')).map(a => a.getAttribute('href'));
      expect(links).toContain('/login');
      expect(links).toContain('/register');
      expect(links).not.toContain('/postagens/nova');
    });
  });

  describe('pessoa logada', () => {
    beforeEach(() => (logadoComo = { id: 5 }));

    it('sem perfilId mostra o cartão do próprio perfil (foto, nome e bio)', () => {
      montar();

      expect(perfis.getPerfil).toHaveBeenCalledWith(5);
      expect(titulos()[0]).toBe('~ meu perfil ~');
      expect(el.querySelector('.cartao-nome')!.textContent).toBe('Bia Autora');
      expect(el.querySelector('.cartao-bio')!.textContent).toBe('Escrevo sobre café.');
      expect(el.querySelector<HTMLImageElement>('.cartao-foto img')!.getAttribute('src')).toBe('assets/img/sem-foto.svg');
    });

    it('tem os atalhos para escrever e para o perfil', () => {
      montar();

      const links = Array.from(el.querySelectorAll('.caixa-lista a')).map(a => a.getAttribute('href'));
      expect(links).toContain('/postagens/nova');
      expect(links).toContain('/perfil');
      expect(links).not.toContain('/login');
    });

    it('SEGURANÇA: HTML na bio e nos destaques aparece como texto, nunca é executado', () => {
      montar({ resposta: of(perfil({ bio: '<img src=x onerror="window.__xss = true">', musicaAtual: '<b>negrito</b>' })) });

      expect(el.querySelector('.cartao-bio img')).toBeNull();
      expect(el.querySelector('.destaque-musica b')).toBeNull();
      expect(el.querySelector('.destaque-musica')!.textContent).toBe('<b>negrito</b>');
    });

    it('dona sem destaques vê o convite para adicionar', () => {
      montar();

      expect(titulos()).toContain('~ no momento ~');
      expect(el.querySelector('.destaques-acoes .botao')!.textContent).toContain('Adicionar');
    });

    it('editar e salvar mostra a música e o livro na barra', () => {
      perfis.atualizarDestaques.and.returnValue(of(perfil({ musicaAtual: 'Clube da Esquina', livroAtual: 'Dom Casmurro' })));
      montar();

      el.querySelector<HTMLButtonElement>('.destaques-acoes .botao')!.click();
      fixture.detectChanges();
      const musica = el.querySelector<HTMLInputElement>('#destaque-musica')!;
      const livro = el.querySelector<HTMLInputElement>('#destaque-livro')!;
      musica.value = 'Clube da Esquina';
      musica.dispatchEvent(new Event('input'));
      livro.value = 'Dom Casmurro';
      livro.dispatchEvent(new Event('input'));
      const envio = new Event('submit', { cancelable: true });
      el.querySelector('form.destaques-form')!.dispatchEvent(envio);
      fixture.detectChanges();

      expect(envio.defaultPrevented).toBeTrue();
      expect(perfis.atualizarDestaques).toHaveBeenCalledWith(5, {
        musicaAtual: 'Clube da Esquina',
        livroAtual: 'Dom Casmurro',
        musicaCapa: '',
        musicaPrevia: '',
        livroCapa: ''
      });
      expect(el.querySelector('.destaque-musica')!.textContent).toBe('Clube da Esquina');
      expect(el.querySelector('.destaque-livro')!.textContent).toBe('Dom Casmurro');
      expect(el.querySelector('form.destaques-form')).toBeNull();
    });

    it('erro da API mantém o formulário aberto com o aviso', () => {
      perfis.atualizarDestaques.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      montar();

      el.querySelector<HTMLButtonElement>('.destaques-acoes .botao')!.click();
      fixture.detectChanges();
      fixture.debugElement.query(x => x.name === 'app-layout-blog').componentInstance.salvar();
      fixture.detectChanges();

      expect(el.querySelector('form.destaques-form [role="alert"]')).not.toBeNull();
    });

    it('cancelar fecha o formulário sem chamar a API', () => {
      montar();

      el.querySelector<HTMLButtonElement>('.destaques-acoes .botao')!.click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.botao-texto')!.click();
      fixture.detectChanges();

      expect(el.querySelector('form.destaques-form')).toBeNull();
      expect(perfis.atualizarDestaques).not.toHaveBeenCalled();
    });

    describe('capa e prévia', () => {
      const comCapas = () =>
        perfil({
          musicaAtual: 'Clube da Esquina - Milton',
          musicaCapa: 'https://is1-ssl.mzstatic.com/capa.jpg',
          musicaPrevia: 'https://audio-ssl.itunes.apple.com/previa.m4a',
          livroAtual: 'Dom Casmurro',
          livroCapa: 'https://covers.openlibrary.org/b/id/647501-M.jpg'
        });

      it('mostra a capa da música e a do livro, sem texto alternativo (o nome já está ao lado)', () => {
        montar({ resposta: of(comCapas()) });

        const capas = el.querySelectorAll<HTMLImageElement>('.destaque-capa');
        expect(capas.length).toBe(2);
        expect(capas[0].getAttribute('src')).toBe('https://is1-ssl.mzstatic.com/capa.jpg');
        expect(capas[1].getAttribute('src')).toBe('https://covers.openlibrary.org/b/id/647501-M.jpg');
        capas.forEach(c => expect(c.getAttribute('alt')).toBe(''));
      });

      it('sem capa mostra só o texto, como antes', () => {
        montar({ resposta: of(perfil({ musicaAtual: 'Uma música', livroAtual: 'Um livro' })) });

        expect(el.querySelector('.destaque-capa')).toBeNull();
        expect(el.querySelector('.previa')).toBeNull();
        expect(el.querySelector('.destaque-musica')!.textContent).toBe('Uma música');
      });

      it('a prévia só toca com um clique e o botão vira "Pausar"; outro clique pausa', () => {
        const audio = jasmine.createSpyObj<HTMLAudioElement>('Audio', ['play', 'pause', 'addEventListener']);
        audio.play.and.returnValue(Promise.resolve());
        const criar = spyOn(window, 'Audio').and.returnValue(audio);
        montar({ resposta: of(comCapas()) });

        expect(criar).not.toHaveBeenCalled();
        const botao = () => el.querySelector<HTMLButtonElement>('.previa')!;
        expect(botao().textContent!.trim()).toBe('▶ Prévia');

        botao().click();
        fixture.detectChanges();
        expect(criar).toHaveBeenCalledOnceWith('https://audio-ssl.itunes.apple.com/previa.m4a');
        expect(audio.play).toHaveBeenCalled();
        expect(botao().textContent!.trim()).toBe('❚❚ Pausar');
        expect(botao().getAttribute('aria-pressed')).toBe('true');

        botao().click();
        fixture.detectChanges();
        expect(audio.pause).toHaveBeenCalled();
        expect(botao().textContent!.trim()).toBe('▶ Prévia');
      });

      it('editar sem mexer no texto mantém a capa e a prévia ao salvar', () => {
        perfis.atualizarDestaques.and.returnValue(of(comCapas()));
        montar({ resposta: of(comCapas()) });

        el.querySelector<HTMLButtonElement>('.destaques-acoes .botao')!.click();
        fixture.detectChanges();
        fixture.debugElement.query(x => x.name === 'app-layout-blog').componentInstance.salvar();

        expect(perfis.atualizarDestaques).toHaveBeenCalledWith(5, {
          musicaAtual: 'Clube da Esquina - Milton',
          livroAtual: 'Dom Casmurro',
          musicaCapa: 'https://is1-ssl.mzstatic.com/capa.jpg',
          musicaPrevia: 'https://audio-ssl.itunes.apple.com/previa.m4a',
          livroCapa: 'https://covers.openlibrary.org/b/id/647501-M.jpg'
        });
      });

      it('mudar o texto à mão descarta a capa e a prévia antigas', () => {
        perfis.atualizarDestaques.and.returnValue(of(perfil({ musicaAtual: 'Outra' })));
        montar({ resposta: of(comCapas()) });
        el.querySelector<HTMLButtonElement>('.destaques-acoes .botao')!.click();
        fixture.detectChanges();

        const campo = el.querySelector<HTMLInputElement>('#destaque-musica')!;
        campo.value = 'Outra música';
        campo.dispatchEvent(new Event('input'));
        fixture.debugElement.query(x => x.name === 'app-layout-blog').componentInstance.salvar();

        expect(perfis.atualizarDestaques).toHaveBeenCalledWith(
          5,
          jasmine.objectContaining({ musicaAtual: 'Outra música', musicaCapa: '', musicaPrevia: '', livroCapa: 'https://covers.openlibrary.org/b/id/647501-M.jpg' })
        );
      });
    });

    it('com comCartao=false esconde o cartão e mantém música e livro', () => {
      montar({ id: 5, comCartao: false, resposta: of(perfil({ musicaAtual: 'Uma música' })) });

      expect(el.querySelector('.cartao')).toBeNull();
      expect(el.querySelector('.destaque-musica')!.textContent).toBe('Uma música');
    });
  });

  describe('perfil de outra pessoa (público)', () => {
    beforeEach(() => (logadoComo = { id: 99 }));

    it('mostra música e livro, sem botão de editar', () => {
      montar({ id: 5, comCartao: false, resposta: of(perfil({ musicaAtual: 'Uma música', livroAtual: 'Um livro' })) });

      expect(perfis.getPerfil).toHaveBeenCalledWith(5);
      expect(el.querySelector('.destaque-musica')!.textContent).toBe('Uma música');
      expect(el.querySelector('.destaque-livro')!.textContent).toBe('Um livro');
      expect(el.querySelector('.destaques-acoes')).toBeNull();
    });

    it('sem destaques a caixa "no momento" nem aparece', () => {
      montar({ id: 5, comCartao: false });

      expect(titulos()).not.toContain('~ no momento ~');
    });
  });

  it('se o perfil não carregar, a barra mostra só o que não depende dele', () => {
    logadoComo = { id: 5 };
    montar({ resposta: throwError(() => new HttpErrorResponse({ status: 500 })) });

    expect(titulos()).toEqual(['~ sobre ~', '~ cantinho ~']);
  });
});
