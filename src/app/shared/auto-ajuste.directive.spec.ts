import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AutoAjusteDirective } from './auto-ajuste.directive';

@Component({
  standalone: true,
  imports: [AutoAjusteDirective, ReactiveFormsModule],
  template: '<textarea appAutoAjuste [formControl]="texto" rows="2" style="width:200px;box-sizing:border-box"></textarea>'
})
class AnfitriaoComponent {
  texto = new FormControl('', { nonNullable: true });
}

describe('AutoAjusteDirective', () => {
  let fixture: ComponentFixture<AnfitriaoComponent>;
  let area: HTMLTextAreaElement;
  const linhas = (n: number) => Array(n).fill('linha').join('\n');

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AnfitriaoComponent] });
    fixture = TestBed.createComponent(AnfitriaoComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    area = fixture.nativeElement.querySelector('textarea');
  });

  afterEach(() => fixture.nativeElement.remove());

  it('esconde a rolagem interna (a altura acompanha o texto)', () => {
    expect(getComputedStyle(area).overflowY).toBe('hidden');
  });

  it('cresce quando se digita mais linhas', () => {
    const antes = area.offsetHeight;

    area.value = linhas(20);
    area.dispatchEvent(new Event('input'));

    expect(area.offsetHeight).toBeGreaterThan(antes);
    expect(area.offsetHeight).toBeGreaterThanOrEqual(area.scrollHeight);
  });

  it('encolhe quando o texto diminui', () => {
    area.value = linhas(20);
    area.dispatchEvent(new Event('input'));
    const grande = area.offsetHeight;

    area.value = 'uma linha';
    area.dispatchEvent(new Event('input'));

    expect(area.offsetHeight).toBeLessThan(grande);
  });

  it('também acompanha o texto definido por código (carregar ou restaurar)', async () => {
    const antes = area.offsetHeight;

    fixture.componentInstance.texto.setValue(linhas(20));
    await Promise.resolve();
    await Promise.resolve();

    expect(area.offsetHeight).toBeGreaterThan(antes);
  });
});
