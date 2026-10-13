import { TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  const criar = () => {
    const fixture = TestBed.createComponent(LogoComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('mostra o nome do site', () => {
    expect(criar().textContent).toBe('Rasura');
  });

  it('usa a fonte Mansalva', () => {
    expect(getComputedStyle(criar()).fontFamily).toContain('Mansalva');
  });
});
