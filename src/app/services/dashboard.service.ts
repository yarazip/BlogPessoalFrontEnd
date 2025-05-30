import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';  

export interface StatsResponse {
  day: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;  

  constructor(private http: HttpClient) {}

  getUserCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/usuarios/count`).pipe(
      catchError(() => of(0))
    );
  }
  
  getPostCount(): Observable<number> {
    return this.http.get<{ quantidade: number }>(`${this.apiUrl}/postagens/count`).pipe(
      map(response => response.quantidade),
      catchError(() => of(0))
    );
  }

  getCommentCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/comentarios/count`).pipe(
      catchError(() => of(0))
    );
  }

  getPostStats(): Observable<StatsResponse[]> {
    return this.http.get<StatsResponse[]>(`${this.apiUrl}/postagens/stats`).pipe(
      catchError(err => {
        console.error('Erro no getPostStats:', err);
        return of([]);
      })
    );
  }
}
