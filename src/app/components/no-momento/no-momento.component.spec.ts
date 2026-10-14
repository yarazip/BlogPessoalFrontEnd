import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Perfil } from '../../models/Perfil';
import { BuscaLivroService } from '../../services/busca-livro.service';
import { BuscaMusicaService } from '../../services/busca-musica.service';
import { PerfilService } from '../../services/perfil.service';
import { NoMomentoComponent } from './no-momento.component';

describe('NoMomentoComponent', () => {
  let perfis: jasmine.SpyObj<PerfilService>;
  let fixture: ComponentFixture<NoMomentoComponent>;
  let el: HTMLElement;
  let atualizados: Perfil[];

  const perfil = (sobre: Partial<Perfil> = {}): Perfil => ({ id: 5, nome: 'Bia', totalPostagens: 2, ...sobre });

  const comCapas = () =>
    perfil({
      musicaAtual: 'Clube da Esquina - Milton',
      musicaCapa: 'https://is1-ssl.mzstatic.com/capa.jpg',
      musicaPrevia: 'https://audio-ssl.itunes.apple.com/previa.m4a',
      livroAtual: 'Dom Casmurro',
      livroCapa: 'https://covers.openlibrary.org/b/id/647501-M.jpg'
    });

  const montar = (p: Perfil, ehDona = true) => {
    fixture = TestBed.createComponent(NoMomentoComponent);
    fixture.componentRef.setInput('perfil', p);
    fixture.componentRef.setInput('ehDona', ehDona);
    fixture.componentInstance.atualizado.subscribe(novo => atualizados.push(novo));
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const abrirEdicao = () => {
    el.querySelector<HTMLButtonElement>('.destaques-acoes .botao')!.click();
    fixture.detectChanges();
  };

  const campo = (fim: 'musica' | 'livro') => el.querySelector<HTMLInputElement>(`input[id$="-${fim}"]`)!;

  const digitar = (c: HTMLInputElement, texto: string) => {
    c.value = texto;
    c.dispatchEvent(new Event('input'));
  };

  beforeEach(() => {
    atualizados = [];
    perfis = jasmine.createSpyObj('PerfilService', ['atualizarDestaques']);
    TestBed.configureTestingModule({
      imports: [NoMomentoComponent],
      providers: [
        { provide: PerfilService, useValue: perfis },
        { provide: BuscaMusicaService, useValue: { buscar: () => of([]) } },
        { provide: BuscaLivroService, useValue: { buscar: () => of([]) } }
      ]
    });
  });

  describe('mostrar', () => {
    it('mostra a música e o livro', () => {
      montar(perfil({ musicaAtual: 'Uma música', livroAtual: 'Um livro' }), false);

      expect(el.querySelector('.destaque-musica')!.textContent).toBe('Uma música');
      expect(el.querySelector('.destaque-livro')!.textContent).toBe('Um livro');
    });

    it('visitante não vê botão de editar', () => {
      montar(perfil({ musicaAtual: 'Uma música' }), false);

      expect(el.querySelector('.destaques-acoes')).toBeNull();
    });

    it('a dona sem nada preenchido vê o convite e o botão "Adicionar"', () => {
      montar(perfil());

      expect(el.querySelector('.caixa-texto')!.textContent).toContain('Conte o que você está ouvindo');
      expect(el.querySelector('.destaques-acoes .botao')!.textContent).toContain('Adicionar');
    });

    it('a dona com algo preenchido vê "Editar"', () => {
      montar(perfil({ livroAtual: 'Um livro' }));

      expect(el.querySelector('.destaques-acoes .botao')!.textContent).toContain('Editar');
    });

    it('SEGURANÇA: HTML nos destaques aparece como texto, nunca é executado', () => {
      montar(perfil({ musicaAtual: '<b>negrito</b>', livroAtual: '<img src=x onerror="window.__xss = true">' }), false);

      expect(el.querySelector('.destaque-musica b')).toBeNull();
      expect(el.querySelector('.destaque-musica')!.textContent).toBe('<b>negrito</b>');
      expect(el.querySelector('.destaque-livro img')).toBeNull();
    });
  });

  describe('capa e prévia', () => {
    it('mostra a capa da música e a do livro, sem texto alternativo (o nome já está ao lado)', () => {
      montar(comCapas(), false);

      const capas = el.querySelectorAll<HTMLImageElement>('.destaque-capa');
      expect(capas.length).toBe(2);
      expect(capas[0].getAttribute('src')).toBe('https://is1-ssl.mzstatic.com/capa.jpg');
      expect(capas[1].getAttribute('src')).toBe('https://covers.openlibrary.org/b/id/647501-M.jpg');
      capas.forEach(c => expect(c.getAttribute('alt')).toBe(''));
    });

    it('sem capa mostra só o texto, como antes', () => {
      montar(perfil({ musicaAtual: 'Uma música', livroAtual: 'Um livro' }), false);

      expect(el.querySelector('.destaque-capa')).toBeNull();
      expect(el.querySelector('.previa')).toBeNull();
    });

    it('a prévia só toca com um clique e o botão vira "Pausar"; outro clique pausa', () => {
      const audio = jasmine.createSpyObj<HTMLAudioElement>('Audio', ['play', 'pause', 'addEventListener']);
      audio.play.and.returnValue(Promise.resolve());
      const criar = spyOn(window, 'Audio').and.returnValue(audio);
      montar(comCapas(), false);

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

    it('a prévia para quando o componente sai da tela', () => {
      const audio = jasmine.createSpyObj<HTMLAudioElement>('Audio', ['play', 'pause', 'addEventListener']);
      audio.play.and.returnValue(Promise.resolve());
      spyOn(window, 'Audio').and.returnValue(audio);
      montar(comCapas(), false);
      el.querySelector<HTMLButtonElement>('.previa')!.click();

      fixture.destroy();

      expect(audio.pause).toHaveBeenCalled();
    });
  });

  describe('editar', () => {
    it('salvar manda os textos, avisa quem usa com o perfil novo e fecha o formulário', () => {
      perfis.atualizarDestaques.and.returnValue(of(perfil({ musicaAtual: 'Clube da Esquina', livroAtual: 'Dom Casmurro' })));
      montar(perfil());

      abrirEdicao();
      digitar(campo('musica'), 'Clube da Esquina');
      digitar(campo('livro'), 'Dom Casmurro');
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
      expect(atualizados.length).toBe(1);
      expect(atualizados[0].musicaAtual).toBe('Clube da Esquina');
      expect(atualizados[0].nome).toBe('Bia');
      expect(el.querySelector('form.destaques-form')).toBeNull();
    });

    it('erro da API mantém o formulário aberto com o aviso', () => {
      perfis.atualizarDestaques.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      montar(perfil());

      abrirEdicao();
      fixture.componentInstance.salvar();
      fixture.detectChanges();

      expect(el.querySelector('form.destaques-form [role="alert"]')).not.toBeNull();
      expect(atualizados).toEqual([]);
    });

    it('cancelar fecha o formulário sem chamar a API', () => {
      montar(perfil());

      abrirEdicao();
      el.querySelector<HTMLButtonElement>('.botao-texto')!.click();
      fixture.detectChanges();

      expect(el.querySelector('form.destaques-form')).toBeNull();
      expect(perfis.atualizarDestaques).not.toHaveBeenCalled();
    });

    it('editar sem mexer no texto mantém a capa e a prévia ao salvar', () => {
      perfis.atualizarDestaques.and.returnValue(of(comCapas()));
      montar(comCapas());

      abrirEdicao();
      fixture.componentInstance.salvar();

      expect(perfis.atualizarDestaques).toHaveBeenCalledWith(5, {
        musicaAtual: 'Clube da Esquina - Milton',
        livroAtual: 'Dom Casmurro',
        musicaCapa: 'https://is1-ssl.mzstatic.com/capa.jpg',
        musicaPrevia: 'https://audio-ssl.itunes.apple.com/previa.m4a',
        livroCapa: 'https://covers.openlibrary.org/b/id/647501-M.jpg'
      });
    });

    it('mudar o texto à mão descarta a capa e a prévia antigas (só da música; a do livro fica)', () => {
      perfis.atualizarDestaques.and.returnValue(of(perfil({ musicaAtual: 'Outra' })));
      montar(comCapas());
      abrirEdicao();

      digitar(campo('musica'), 'Outra música');
      fixture.componentInstance.salvar();

      expect(perfis.atualizarDestaques).toHaveBeenCalledWith(
        5,
        jasmine.objectContaining({
          musicaAtual: 'Outra música',
          musicaCapa: '',
          musicaPrevia: '',
          livroCapa: 'https://covers.openlibrary.org/b/id/647501-M.jpg'
        })
      );
    });

    it('não envia texto acima do limite', () => {
      montar(perfil());
      abrirEdicao();

      fixture.componentInstance.musica.setValue('x'.repeat(101));
      fixture.componentInstance.salvar();

      expect(perfis.atualizarDestaques).not.toHaveBeenCalled();
    });
  });

  it('duas instâncias na mesma tela (barra e topo do perfil) têm campos com ids diferentes', () => {
    montar(perfil());
    abrirEdicao();
    const outra = TestBed.createComponent(NoMomentoComponent);
    outra.componentRef.setInput('perfil', perfil());
    outra.componentRef.setInput('ehDona', true);
    outra.detectChanges();
    outra.nativeElement.querySelector('.destaques-acoes .botao').click();
    outra.detectChanges();

    const ids = [campo('musica').id, outra.nativeElement.querySelector('input[id$="-musica"]').id];

    expect(ids[0]).not.toBe(ids[1]);
  });
});
