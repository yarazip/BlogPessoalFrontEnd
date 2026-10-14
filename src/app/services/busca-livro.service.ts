import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemDeBusca } from '../models/ItemDeBusca';

/** Pedaço da resposta da busca da Open Library que interessa aqui. */
interface RespostaOpenLibrary {
  docs?: { title?: string; author_name?: string[]; cover_i?: number }[];
}

/**
 * Busca de livros na Open Library (grátis, sem chave, aceita chamadas do navegador). O Google Books sem chave
 * estoura a cota diária compartilhada, por isso não é usado. A capa vem de covers.openlibrary.org.
 */
@Injectable({ providedIn: 'root' })
export class BuscaLivroService {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://openlibrary.org/search.json';

  buscar(termo: string, limite = 6): Observable<ItemDeBusca[]> {
    return this.http
      .get<RespostaOpenLibrary>(this.url, {
        params: { q: termo, limit: limite, fields: 'title,author_name,cover_i' }
      })
      .pipe(
        map(resposta =>
          (resposta.docs ?? [])
            .filter(d => !!d.title)
            .map(d => ({
              titulo: d.title!,
              detalhe: d.author_name?.[0] ?? '',
              capa: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
              previa: null
            }))
        )
      );
  }
}
