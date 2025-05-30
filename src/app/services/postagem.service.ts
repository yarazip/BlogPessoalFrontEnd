import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Postagem } from '../components/models/Postagem';
import { environment } from '../../environments/environment';  

@Injectable({
  providedIn: 'root'
})
export class PostagemService {
  private apiUrl = `${environment.apiUrl}/postagens`;  

  constructor(private http: HttpClient) {}

  getAll(): Observable<Postagem[]> {
    return this.http.get<Postagem[]>(this.apiUrl);
  }

  listarTodasPostagens(): Observable<Postagem[]> {
    return this.http.get<Postagem[]>(this.apiUrl);
  }

  getById(id: number): Observable<Postagem> {
    return this.http.get<Postagem>(`${this.apiUrl}/${id}`);
  }

  create(postagem: Postagem): Observable<Postagem> {
    return this.http.post<Postagem>(this.apiUrl, postagem);
  }

  update(postagem: Postagem): Observable<Postagem> {
    return this.http.put<Postagem>(`${this.apiUrl}/${postagem.id}`, postagem);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByUsuario(usuarioId: number): Observable<Postagem[]> {
    return this.http.get<Postagem[]>(`${this.apiUrl}/filtro?autor=${usuarioId}`);
  }
}
