import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil } from '../models/Perfil';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  /** Perfil público: qualquer pessoa pode ver, mesmo sem login. */
  getPerfil(id: number): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.apiUrl}/${id}`);
  }

  /** Só a própria pessoa pode alterar a bio; texto vazio apaga. */
  atualizarBio(id: number, bio: string): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.apiUrl}/${id}/bio`, { bio });
  }

  /** Só a própria pessoa altera a música e o livro do momento; texto vazio apaga o campo. */
  atualizarDestaques(
    id: number,
    destaques: { musicaAtual: string; livroAtual: string; musicaCapa: string; musicaPrevia: string; livroCapa: string }
  ): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.apiUrl}/${id}/destaques`, destaques);
  }
}
