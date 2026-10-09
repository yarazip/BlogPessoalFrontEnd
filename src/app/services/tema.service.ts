import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tema } from '../components/models/Tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/temas`;

  getAll(): Observable<Tema[]> {
    return this.http.get<Tema[]>(this.apiUrl);
  }

  getById(id: number): Observable<Tema> {
    return this.http.get<Tema>(`${this.apiUrl}/${id}`);
  }

  create(tema: Pick<Tema, 'descricao'>): Observable<Tema> {
    return this.http.post<Tema>(this.apiUrl, tema);
  }

  /** A API atualiza por PUT /temas, com o id no corpo (não na URL). */
  update(tema: Tema): Observable<Tema> {
    return this.http.put<Tema>(this.apiUrl, tema);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
