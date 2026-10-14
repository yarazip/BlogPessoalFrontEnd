import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';
import { ItemDeBusca } from '../../models/ItemDeBusca';
import { BuscaDestaqueComponent } from './busca-destaque.component';

@Component({
  standalone: true,
  imports: [BuscaDestaqueComponent],
  template: `
    <app-busca-destaque
      idDoCampo="campo"
      rotulo="Ouvindo"
      placeholder="Busque"
      [controle]="controle"
      [buscar]="buscar"
      [limite]="limite"
      (escolhido)="escolhidos.push($event)"
    />
  `
})
class AnfitriaoComponent {
  limite = 100;
  controle = new FormControl('', { nonNullable: true });
  escolhidos: (ItemDeBusca | null)[] = [];
  buscar: (termo: string) => Observable<ItemDeBusca[]> = () => of([]);
}

describe('BuscaDestaqueComponent', () => {
  let fixture: ComponentFixture<AnfitriaoComponent>;
  let anfitriao: AnfitriaoComponent;
  let el: HTMLElement;
  let termos: string[];

  const clube: ItemDeBusca = {
    titulo: 'Clube da Esquina Nº 2',
    detalhe: 'Milton Nascimento',
    capa: 'https://is1-ssl.mzstatic.com/capa.jpg',
    previa: 'https://audio-ssl.itunes.apple.com/previa.m4a'
  };

  const montar = (buscar: (termo: string) => Observable<ItemDeBusca[]>) => {
    fixture = TestBed.createComponent(AnfitriaoComponent);
    anfitriao = fixture.componentInstance;
    anfitriao.buscar = termo => {
      termos.push(termo);
      return buscar(termo);
    };
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  /** Digita no campo e deixa passar a espera de 350 ms. */
  const digitar = (texto: string) => {
    anfitriao.controle.setValue(texto);
    tick(400);
    fixture.detectChanges();
  };

  beforeEach(() => {
    termos = [];
    TestBed.configureTestingModule({ imports: [AnfitriaoComponent] });
  });

  it('mostra o rótulo e o campo ligados', () => {
    montar(() => of([]));

    expect(el.querySelector('label')!.textContent).toBe('Ouvindo');
    expect(el.querySelector('label')!.getAttribute('for')).toBe('campo');
    expect(el.querySelector<HTMLInputElement>('#campo')!.placeholder).toBe('Busque');
  });

  it('busca depois da espera, uma vez só, e mostra os resultados com capa', fakeAsync(() => {
    montar(() => of([clube]));

    anfitriao.controle.setValue('cl');
    anfitriao.controle.setValue('clu');
    anfitriao.controle.setValue('clube');
    tick(400);
    fixture.detectChanges();

    expect(termos).toEqual(['clube']);
    expect(el.querySelectorAll('.busca-item').length).toBe(1);
    expect(el.querySelector('.busca-titulo')!.textContent).toBe('Clube da Esquina Nº 2');
    expect(el.querySelector('.busca-detalhe')!.textContent).toBe('Milton Nascimento');
    expect(el.querySelector('img.busca-capa')!.getAttribute('src')).toBe('https://is1-ssl.mzstatic.com/capa.jpg');
  }));

  it('com menos de 2 letras não busca', fakeAsync(() => {
    montar(() => of([clube]));

    digitar('c');

    expect(termos).toEqual([]);
    expect(el.querySelector('.busca-lista')).toBeNull();
  }));

  it('escolher um resultado preenche o campo com "Título - Artista", fecha a lista e avisa quem usa', fakeAsync(() => {
    montar(() => of([clube]));
    digitar('clube');

    el.querySelector<HTMLButtonElement>('.busca-item')!.click();
    fixture.detectChanges();

    expect(anfitriao.controle.value).toBe('Clube da Esquina Nº 2 - Milton Nascimento');
    expect(el.querySelector('.busca-lista')).toBeNull();
    expect(anfitriao.escolhidos).toContain(clube);
  }));

  it('escolher não dispara uma nova busca', fakeAsync(() => {
    montar(() => of([clube]));
    digitar('clube');

    el.querySelector<HTMLButtonElement>('.busca-item')!.click();
    tick(400);

    expect(termos).toEqual(['clube']);
  }));

  it('o texto escolhido respeita o limite do campo', fakeAsync(() => {
    montar(() => of([clube]));
    anfitriao.limite = 40;
    fixture.detectChanges();
    digitar('clube');

    el.querySelector<HTMLButtonElement>('.busca-item')!.click();

    expect(anfitriao.controle.value.length).toBeLessThanOrEqual(40);
  }));

  it('voltar a digitar à mão desfaz a escolha (a capa antiga deixa de valer)', fakeAsync(() => {
    montar(() => of([clube]));
    digitar('clube');
    el.querySelector<HTMLButtonElement>('.busca-item')!.click();
    anfitriao.escolhidos.length = 0;

    anfitriao.controle.setValue('Outra coisa');

    expect(anfitriao.escolhidos).toEqual([null]);
    tick(400);
  }));

  it('sem resultados, avisa que dá para salvar o texto digitado', fakeAsync(() => {
    montar(() => of([]));

    digitar('xyzxyz');

    expect(el.querySelector('.busca-aviso')!.textContent).toContain('Nada encontrado');
  }));

  it('se a busca falhar, avisa e deixa o texto livre', fakeAsync(() => {
    montar(() => throwError(() => new Error('fora do ar')));

    digitar('clube');

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('indisponível');
    expect(anfitriao.controle.value).toBe('clube');
  }));

  it('depois de uma falha, uma nova digitação busca de novo', fakeAsync(() => {
    let falhar = true;
    montar(() => (falhar ? throwError(() => new Error('x')) : of([clube])));
    digitar('clube');

    falhar = false;
    digitar('clube da');

    expect(termos).toEqual(['clube', 'clube da']);
    expect(el.querySelectorAll('.busca-item').length).toBe(1);
  }));

  it('Esc fecha a lista', fakeAsync(() => {
    montar(() => of([clube]));
    digitar('clube');

    el.querySelector<HTMLInputElement>('#campo')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(el.querySelector('.busca-lista')).toBeNull();
  }));

  it('SEGURANÇA: HTML no título aparece como texto, nunca é executado', fakeAsync(() => {
    montar(() => of([{ ...clube, titulo: '<img src=x onerror="window.__xss = true">' }]));

    digitar('clube');

    expect(el.querySelector('.busca-titulo img')).toBeNull();
    expect(el.querySelector('.busca-titulo')!.textContent).toContain('<img src=x');
  }));

  it('resultado sem capa mostra um quadrado vazio no lugar', fakeAsync(() => {
    montar(() => of([{ ...clube, capa: null }]));

    digitar('clube');

    expect(el.querySelector('img.busca-capa')).toBeNull();
    expect(el.querySelector('.busca-capa.sem-capa')).not.toBeNull();
  }));
});
