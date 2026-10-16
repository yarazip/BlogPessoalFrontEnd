import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ComentarioPostagem } from '../models/ComentarioPostagem';
import { Pagina } from '../models/Pagina';

/** Comentários embaixo das postagens: leitura pública, escrever e apagar exigem login. */
@Injectable({ providedIn: 'root' })
export class ComentarioPostagemService {
  private readonly http = inject(HttpClient);

  /** Do mais antigo ao mais novo. */
  listar(postagemId: number, pagina = 0, tamanho = 20): Observable<Pagina<ComentarioPostagem>> {
    const params = new HttpParams().set('page', pagina).set('size', tamanho);
    return this.http.get<Pagina<ComentarioPostagem>>(this.url(postagemId), { params });
  }

  comentar(postagemId: number, texto: string): Observable<ComentarioPostagem> {
    return this.http.post<ComentarioPostagem>(this.url(postagemId), { texto });
  }

  excluir(postagemId: number, comentarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.url(postagemId)}/${comentarioId}`);
  }

  private url(postagemId: number): string {
    return `${environment.apiUrl}/postagens/${postagemId}/comentarios`;
  }
}
