import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PostagemService } from '../../services/postagem.service';
import { ExplorarComponent } from './explorar.component';

describe('ExplorarComponent', () => {
  it('mostra o feed de todo mundo, sem filtrar por autor', () => {
    const service = jasmine.createSpyObj<PostagemService>('PostagemService', ['getPagina']);
    service.getPagina.and.returnValue(
      of({ conteudo: [], pagina: 0, tamanho: 10, totalElementos: 0, totalPaginas: 1, ultima: true })
    );
    TestBed.configureTestingModule({
      imports: [ExplorarComponent],
      providers: [provideRouter([]), { provide: PostagemService, useValue: service }]
    });

    const fixture = TestBed.createComponent(ExplorarComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-feed-postagens')).not.toBeNull();
    expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10 });
  });
});
