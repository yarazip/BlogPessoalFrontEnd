import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Postagem, PostagemRequest } from '../components/models/Postagem';

@Injectable({ providedIn: 'root' })
export class PostagemService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/postagens`;

  getAll(): Observable<Postagem[]> {
    return this.http.get<Postagem[]>(this.apiUrl);
  }

  getById(id: number): Observable<Postagem> {
    return this.http.get<Postagem>(`${this.apiUrl}/${id}`);
  }

  getByUsuario(usuarioId: number): Observable<Postagem[]> {
    const params = new HttpParams().set('autor', usuarioId);
    return this.http.get<Postagem[]>(`${this.apiUrl}/filtro`, { params });
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
