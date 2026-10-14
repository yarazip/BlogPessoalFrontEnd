import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemDeBusca } from '../models/ItemDeBusca';

/** Pedaço da resposta da busca do iTunes que interessa aqui. */
interface RespostaItunes {
  results?: {
    trackName?: string;
    artistName?: string;
    artworkUrl100?: string;
    previewUrl?: string;
  }[];
}

/**
 * Busca de músicas na API pública do iTunes (grátis, sem chave, aceita chamadas do navegador).
 * Devolve a capa e a prévia de 30 segundos junto, para o perfil guardar. Só usa endereços https.
 */
@Injectable({ providedIn: 'root' })
export class BuscaMusicaService {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://itunes.apple.com/search';

  buscar(termo: string, limite = 6): Observable<ItemDeBusca[]> {
    return this.http
      .get<RespostaItunes>(this.url, {
        params: { term: termo, media: 'music', entity: 'song', limit: limite, country: 'BR' }
      })
      .pipe(
        map(resposta =>
          (resposta.results ?? [])
            .filter(r => !!r.trackName)
            .map(r => ({
              titulo: r.trackName!,
              detalhe: r.artistName ?? '',
              capa: soHttps(r.artworkUrl100),
              previa: soHttps(r.previewUrl)
            }))
        )
      );
  }
}

function soHttps(url?: string): string | null {
  return url && url.startsWith('https://') ? url : null;
}
