import { TestBed } from '@angular/core/testing';
import { SeloVerificadoComponent } from './selo-verificado.component';

describe('SeloVerificadoComponent', () => {
  it('é uma imagem com nome acessível ("Conta verificada") e dica ao passar o mouse', () => {
    const fixture = TestBed.createComponent(SeloVerificadoComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Conta verificada');
    expect(el.getAttribute('title')).toBe('Conta verificada');
    expect(el.querySelector('svg .roseta')!.getAttribute('points')).toContain('12,1');
  });
});
