import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Tema } from '../../models/Tema';
import { TemaService } from '../../services/tema.service';
import { SeletorDeTemaComponent } from './seletor-de-tema.component';

describe('SeletorDeTemaComponent', () => {
  let fixture: ComponentFixture<SeletorDeTemaComponent>;
  let servico: jasmine.SpyObj<TemaService>;
  let controle: FormControl<number | null>;
  let criados: Tema[];
  let el: HTMLElement;

  const TEMAS: Tema[] = [
    { id: 1, descricao: 'Rotina' },
    { id: 2, descricao: "'Tecnologia'" },
    { id: 3, descricao: 'Café' }
  ];

  const montar = (temas: Tema[] = TEMAS, valor: number | null = null, invalido = false) => {
    controle = new FormControl<number | null>(valor);
    fixture = TestBed.createComponent(SeletorDeTemaComponent);
    fixture.componentRef.setInput('controle', controle);
    fixture.componentRef.setInput('temas', temas);
    fixture.componentRef.setInput('invalido', invalido);
    criados = [];
    fixture.componentInstance.criado.subscribe(t => criados.push(t));
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const botao = () => el.querySelector<HTMLButtonElement>('#tema')!;
  const abrir = () => {
    botao().click();
    fixture.detectChanges();
  };
  const digitar = (texto: string) => {
    const campo = el.querySelector<HTMLInputElement>('.tema-busca')!;
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const pilulas = () => Array.from(el.querySelectorAll('.tema-opcao')).map(b => b.textContent!.trim());

  beforeEach(() => {
    servico = jasmine.createSpyObj('TemaService', ['create']);
    TestBed.configureTestingModule({ imports: [SeletorDeTemaComponent], providers: [{ provide: TemaService, useValue: servico }] });
  });

  it('sem tema escolhido, o botão convida a escolher', () => {
    montar();

    expect(botao().textContent).toContain('Tema');
    expect(botao().querySelector('.tema-atual')!.textContent).toBe('escolher');
    expect(el.querySelector('.tema-painel')).toBeNull();
  });

  it('com tema escolhido, mostra o nome (sem as aspas dos temas antigos)', () => {
    montar(TEMAS, 2);

    expect(botao().querySelector('.tema-atual')!.textContent).toBe('#Tecnologia');
  });

  it('o botão fica com contorno de erro quando o formulário reclama do tema', () => {
    montar(TEMAS, null, true);

    expect(botao().classList).toContain('invalido');
    expect(botao().getAttribute('aria-invalid')).toBe('true');
  });

  it('abre o painel com os temas em pílulas, em ordem alfabética, e a escolha é marcada', () => {
    montar(TEMAS, 3);
    abrir();

    expect(pilulas()).toEqual(['#Café', '#Rotina', '#Tecnologia']);
    expect(el.querySelector('.tema-opcao.escolhido')!.textContent!.trim()).toBe('#Café');
    expect(botao().getAttribute('aria-expanded')).toBe('true');
  });

  it('escolher um tema guarda o id, marca o campo como mexido e fecha o painel', () => {
    montar();
    abrir();

    el.querySelectorAll<HTMLButtonElement>('.tema-opcao')[1].click();
    fixture.detectChanges();

    expect(controle.value).toBe(1);
    expect(controle.dirty).toBeTrue();
    expect(el.querySelector('.tema-painel')).toBeNull();
  });

  it('a busca ignora acento e maiúscula', () => {
    montar();
    abrir();

    digitar('CAFE');

    expect(pilulas()).toEqual(['#Café']);
  });

  describe('criar tema', () => {
    it('um nome que não existe oferece criar, e criar escolhe o tema novo e avisa quem usa', () => {
      servico.create.and.returnValue(of({ id: 9, descricao: 'Viagens' }));
      montar();
      abrir();

      digitar('  Viagens ');
      const criar = el.querySelector<HTMLButtonElement>('.tema-criar')!;
      expect(criar.textContent).toContain('Criar o tema “Viagens”');
      criar.click();
      fixture.detectChanges();

      expect(servico.create).toHaveBeenCalledWith({ descricao: 'Viagens' });
      expect(criados).toEqual([{ id: 9, descricao: 'Viagens' }]);
      expect(controle.value).toBe(9);
      expect(el.querySelector('.tema-painel')).toBeNull();
    });

    it('um nome que já existe (outra caixa, sem acento) não oferece criar e escolhe o existente', () => {
      montar();
      abrir();

      digitar('cafe');
      expect(el.querySelector('.tema-criar')).toBeNull();

      el.querySelector('.tema-busca')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
      fixture.detectChanges();

      expect(servico.create).not.toHaveBeenCalled();
      expect(controle.value).toBe(3);
    });

    it('Enter cria o tema digitado', () => {
      servico.create.and.returnValue(of({ id: 10, descricao: 'Receitas' }));
      montar();
      abrir();
      digitar('Receitas');

      const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      el.querySelector('.tema-busca')!.dispatchEvent(enter);

      expect(enter.defaultPrevented).toBeTrue();
      expect(servico.create).toHaveBeenCalledWith({ descricao: 'Receitas' });
    });

    it('sem nada digitado, não oferece criar', () => {
      montar();
      abrir();

      expect(el.querySelector('.tema-criar')).toBeNull();
    });

    it('se a API recusar, mostra o motivo e não escolhe nada', () => {
      servico.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Tema inválido.' } })));
      montar();
      abrir();
      digitar('Ruim');

      el.querySelector<HTMLButtonElement>('.tema-criar')!.click();
      fixture.detectChanges();

      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Tema inválido');
      expect(controle.value).toBeNull();
      expect(el.querySelector('.tema-painel')).not.toBeNull();
    });

    it('sem nenhum tema cadastrado, explica que dá para criar o primeiro', () => {
      montar([]);
      abrir();

      expect(el.querySelector('.tema-vazio')!.textContent).toContain('criar o primeiro');
    });
  });

  describe('fechar', () => {
    it('fechar sem escolher marca o campo como tocado (o formulário passa a mostrar que falta o tema)', () => {
      montar();
      abrir();

      botao().click();
      fixture.detectChanges();

      expect(controle.touched).toBeTrue();
      expect(controle.value).toBeNull();
    });

    it('Esc e clicar fora fecham', () => {
      montar();
      abrir();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(el.querySelector('.tema-painel')).toBeNull();

      abrir();
      document.body.click();
      fixture.detectChanges();
      expect(el.querySelector('.tema-painel')).toBeNull();
    });

    it('ao abrir, o foco vai para o campo de busca', fakeAsync(() => {
      montar();

      abrir();
      tick();

      expect(document.activeElement).toBe(el.querySelector('.tema-busca'));
    }));
  });

  it('SEGURANÇA: HTML no nome do tema aparece como texto, nunca é executado', () => {
    montar([{ id: 1, descricao: '<img src=x onerror="window.__xss = true">' }]);
    abrir();

    expect(el.querySelector('img')).toBeNull();
    expect(pilulas()[0]).toBe('#<img src=x onerror="window.__xss = true">');
  });
});
