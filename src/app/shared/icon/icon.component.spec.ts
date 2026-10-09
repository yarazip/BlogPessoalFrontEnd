import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ICON_NAMES, SPRITE_URL } from './icon-names';
import { IconComponent } from './icon.component';

@Component({
  standalone: true,
  imports: [IconComponent],
  template: `<button type="button" aria-label="Alternar tema"><app-icon [name]="nome" /></button>`
})
class AnfitriaoComponent {
  nome: (typeof ICON_NAMES)[number] = 'moon';
}

describe('IconComponent', () => {
  const criar = () => {
    const fixture = TestBed.createComponent(AnfitriaoComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('desenha o símbolo certo do sprite', () => {
    const el = criar().nativeElement as HTMLElement;

    expect(el.querySelector('svg use')!.getAttribute('href')).toBe(`${SPRITE_URL}#icon-moon`);
  });

  it('acompanha a troca do nome', () => {
    const fixture = criar();

    fixture.componentInstance.nome = 'sun';
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('svg use')!.getAttribute('href')).toBe(
      `${SPRITE_URL}#icon-sun`
    );
  });

  it('é decorativo: escondido de leitores de tela e fora da ordem de foco', () => {
    const svg = (criar().nativeElement as HTMLElement).querySelector('svg')!;

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  });

  it('herda a cor do texto (currentColor), como uma fonte de ícones', () => {
    const fixture = criar();
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    botao.style.color = 'rgb(10, 20, 30)';

    const svg = botao.querySelector('svg')!;

    expect(getComputedStyle(svg).fill).toBe('rgb(10, 20, 30)');
  });

  it('acompanha o font-size do contexto, numa caixa quadrada', () => {
    const fixture = criar();
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    botao.style.fontSize = '32px';

    const caixa = botao.querySelector('svg')!.getBoundingClientRect();

    expect(caixa.height).toBeCloseTo(32, 0);
    // regressão: sem largura explícita o <svg> sem viewBox ocupa 300px e estoura o layout
    expect(caixa.width).toBeCloseTo(32, 0);
  });
});

describe('sprite de ícones', () => {
  let sprite: string;

  beforeAll(async () => {
    const resposta = await fetch(SPRITE_URL);
    expect(resposta.ok).withContext(`o sprite não foi servido em ${SPRITE_URL}`).toBeTrue();
    sprite = await resposta.text();
  });

  it('tem um símbolo para cada nome da lista', () => {
    for (const nome of ICON_NAMES) {
      expect(sprite).withContext(`falta o símbolo icon-${nome} (rode npm run icons)`).toContain(`id="icon-${nome}"`);
    }
  });

  it('não tem símbolos fora da lista (evita ícone morto no arquivo)', () => {
    const ids = [...sprite.matchAll(/<symbol id="icon-([a-z-]+)"/g)].map(m => m[1]).sort();

    expect(ids).toEqual([...ICON_NAMES].sort());
  });

  it('cada símbolo tem viewBox e ao menos um desenho', () => {
    for (const bloco of sprite.match(/<symbol[\s\S]*?<\/symbol>/g) ?? []) {
      expect(bloco).toMatch(/viewBox="[\d. ]+"/);
      expect(bloco).toContain('<path d="');
    }
  });

  it('mantém a atribuição de licença dos ícones (CC BY 4.0)', () => {
    expect(sprite).toContain('CC BY 4.0');
    expect(sprite).toContain('Font Awesome');
  });
});
