import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface StatsResponse {
  day: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUserCount(): Observable<number> {
    return this.http.get<{ quantidade: number }>(`${this.apiUrl}/usuarios/count`).pipe(map(r => r.quantidade));
  }

  getPostCount(): Observable<number> {
    return this.http.get<{ quantidade: number }>(`${this.apiUrl}/postagens/count`).pipe(map(r => r.quantidade));
  }

  /** Postagens por dia da semana; os nomes dos dias já vêm em português da API. */
  getPostStats(): Observable<StatsResponse[]> {
    return this.http.get<StatsResponse[]>(`${this.apiUrl}/postagens/stats`);
  }
}
