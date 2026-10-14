import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { FaixaNoMomentoComponent } from './faixa-no-momento.component';

describe('FaixaNoMomentoComponent', () => {
  let perfis: jasmine.SpyObj<PerfilService>;
  let logado: { id: number } | null;
  let fixture: ComponentFixture<FaixaNoMomentoComponent>;
  let el: HTMLElement;

  const perfil = (sobre: Partial<Perfil> = {}): Perfil => ({ id: 5, nome: 'Bia', totalPostagens: 1, ...sobre });

  const montar = (resposta: Observable<Perfil> = of(perfil())) => {
    perfis.getPerfil.and.returnValue(resposta);
    fixture = TestBed.createComponent(FaixaNoMomentoComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    logado = { id: 5 };
    perfis = jasmine.createSpyObj('PerfilService', ['getPerfil', 'atualizarDestaques']);
    TestBed.configureTestingModule({
      imports: [FaixaNoMomentoComponent],
      providers: [
        { provide: PerfilService, useValue: perfis },
        { provide: AuthService, useValue: { isLoggedIn: () => !!logado, getUsuario: () => logado } }
      ]
    });
  });

  it('carrega o perfil de quem está logado e mostra a faixa com a música e o livro', () => {
    montar(of(perfil({ musicaAtual: 'Uma música', livroAtual: 'Um livro' })));

    expect(perfis.getPerfil).toHaveBeenCalledOnceWith(5);
    expect(el.querySelector('section[aria-label="No momento"] .faixa')).not.toBeNull();
    expect(el.querySelector('.destaque-musica')!.textContent).toBe('Uma música');
    expect(el.querySelector('.destaque-livro')!.textContent).toBe('Um livro');
  });

  it('é a faixa da própria pessoa: tem o botão para adicionar ou editar', () => {
    montar();

    expect(el.querySelector('.faixa .botao')!.textContent).toContain('Adicionar');
  });

  it('visitante não vê nada e nem chama a API', () => {
    logado = null;
    montar();

    expect(perfis.getPerfil).not.toHaveBeenCalled();
    expect(el.querySelector('.faixa-no-momento')).toBeNull();
  });

  it('se o perfil não carregar, a faixa simplesmente não aparece', () => {
    montar(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(el.querySelector('.faixa-no-momento')).toBeNull();
  });

  it('salvar atualiza a faixa sem recarregar', () => {
    perfis.atualizarDestaques.and.returnValue(of(perfil({ musicaAtual: 'Nova música' })));
    montar();

    el.querySelector<HTMLButtonElement>('.faixa .botao')!.click();
    fixture.detectChanges();
    el.querySelector('form.destaques-form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(el.querySelector('.destaque-musica')!.textContent).toBe('Nova música');
  });
});
