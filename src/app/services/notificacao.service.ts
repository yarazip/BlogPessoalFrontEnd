import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notificacao } from '../models/Notificacao';
import { Pagina } from '../models/Pagina';

/** O sino de quem está logado: curtidas e comentários nas postagens da pessoa. Tudo exige login. */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/notificacoes`;

  /** O número do sino. */
  contarNaoLidas(): Observable<number> {
    return this.http.get<{ total: number }>(`${this.url}/nao-lidas`).pipe(map(r => r.total));
  }

  /** Das mais novas para as mais antigas. */
  listar(pagina = 0, tamanho = 15): Observable<Pagina<Notificacao>> {
    const params = new HttpParams().set('page', pagina).set('size', tamanho);
    return this.http.get<Pagina<Notificacao>>(this.url, { params });
  }

  marcarTodasComoLidas(): Observable<void> {
    return this.http.post<void>(`${this.url}/lidas`, null);
  }
}
