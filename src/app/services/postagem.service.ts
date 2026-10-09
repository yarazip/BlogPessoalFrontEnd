import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OpcoesDePagina, Pagina } from '../components/models/Pagina';
import { Postagem, PostagemRequest } from '../components/models/Postagem';

@Injectable({ providedIn: 'root' })
export class PostagemService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/postagens`;

  /** Uma página de postagens, das mais recentes para as mais antigas; autor e tema são filtros opcionais. */
  getPagina(opcoes: OpcoesDePagina = {}): Observable<Pagina<Postagem>> {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(opcoes)) {
      if (valor !== undefined) {
        params = params.set(chave, valor);
      }
    }
    return this.http.get<Pagina<Postagem>>(`${this.apiUrl}/pagina`, { params });
  }

  getById(id: number): Observable<Postagem> {
    return this.http.get<Postagem>(`${this.apiUrl}/${id}`);
  }

  create(postagem: PostagemRequest): Observable<Postagem> {
    return this.http.post<Postagem>(this.apiUrl, postagem);
  }

  update(id: number, postagem: PostagemRequest): Observable<Postagem> {
    return this.http.put<Postagem>(`${this.apiUrl}/${id}`, postagem);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
