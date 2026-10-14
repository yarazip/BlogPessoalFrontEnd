import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ItemDeBusca } from '../models/ItemDeBusca';

/** Pedaço da resposta da busca da Open Library que interessa aqui. */
interface RespostaOpenLibrary {
  docs?: { title?: string; author_name?: string[]; cover_i?: number }[];
}

/** Pedaço da resposta da busca de livros do Apple Books (a mesma API pública do iTunes) que interessa aqui. */
interface RespostaAppleBooks {
  results?: { trackName?: string; artistName?: string; artworkUrl100?: string }[];
}

/**
 * Quantos resultados pedir a cada fonte para escolher os melhores. Pedimos bem mais do que mostramos porque nem toda
 * edição tem capa; com uma margem maior, quase sempre sobram livros com capa.
 */
const RESULTADOS_PEDIDOS = 24;

/** Título e autor sem acento, maiúscula nem pontuação: "Machado de Assís" e "Machado de Assis" viram a mesma coisa. */
function chaveDe(titulo: string, autor: string): string {
  const limpar = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  return `${limpar(titulo)}|${limpar(autor)}`;
}

/** A capa do Apple Books vem em 100x100; pedimos 200x200 (mesmo endereço, só o tamanho muda) para ficar nítida. */
function ampliar(capa?: string): string | null {
  if (!capa || !capa.startsWith('https://')) {
    return null;
  }
  return capa.replace(/\/\d+x\d+bb\./, '/200x200bb.');
}

/**
 * Busca de livros em duas fontes gratuitas, sem chave e com chamadas permitidas do navegador, juntadas numa lista só:
 *
 * - **Apple Books** (a API do iTunes): quase todo resultado tem capa, inclusive edições brasileiras. Vem primeiro.
 * - **Open Library**: cobre bem livros antigos e de domínio público, mas deixa muitos sem capa. Completa a lista.
 *
 * O Google Books sem chave estoura a cota diária compartilhada, por isso não é usado. Se uma das fontes falhar, a
 * outra segue valendo; só se as duas falharem a busca dá erro.
 *
 * A lista é arrumada antes de aparecer: edições repetidas do mesmo livro (mesmo título e autor) viram uma só, ficando
 * a que tem capa, e os livros com capa vêm primeiro, na ordem de relevância. Os sem capa só completam a lista.
 */
@Injectable({ providedIn: 'root' })
export class BuscaLivroService {
  private readonly http = inject(HttpClient);
  private readonly urlOpenLibrary = 'https://openlibrary.org/search.json';
  private readonly urlAppleBooks = 'https://itunes.apple.com/search';

  buscar(termo: string, limite = 6): Observable<ItemDeBusca[]> {
    const pedidos = Math.max(limite, RESULTADOS_PEDIDOS);

    const apple$ = this.http
      .get<RespostaAppleBooks>(this.urlAppleBooks, {
        params: { term: termo, media: 'ebook', country: 'BR', limit: pedidos }
      })
      .pipe(
        map(resposta => this.doAppleBooks(resposta)),
        catchError(() => of(null))
      );

    const openLibrary$ = this.http
      .get<RespostaOpenLibrary>(this.urlOpenLibrary, {
        params: { q: termo, limit: pedidos, fields: 'title,author_name,cover_i' }
      })
      .pipe(
        map(resposta => this.daOpenLibrary(resposta)),
        catchError(() => of(null))
      );

    return forkJoin([apple$, openLibrary$]).pipe(
      map(([apple, openLibrary]) => {
        if (apple === null && openLibrary === null) {
          throw new Error('As duas fontes de livros falharam');
        }
        return this.escolherOsMelhores([...(apple ?? []), ...(openLibrary ?? [])], limite);
      })
    );
  }

  private doAppleBooks(resposta: RespostaAppleBooks): ItemDeBusca[] {
    return (resposta.results ?? [])
      .filter(r => !!r.trackName)
      .map(r => ({ titulo: r.trackName!, detalhe: r.artistName ?? '', capa: ampliar(r.artworkUrl100), previa: null }));
  }

  private daOpenLibrary(resposta: RespostaOpenLibrary): ItemDeBusca[] {
    return (resposta.docs ?? [])
      .filter(d => !!d.title)
      .map(d => ({
        titulo: d.title!,
        detalhe: d.author_name?.[0] ?? '',
        capa: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
        previa: null
      }));
  }

  private escolherOsMelhores(candidatos: ItemDeBusca[], limite: number): ItemDeBusca[] {
    const unicos = new Map<string, ItemDeBusca>();

    for (const item of candidatos) {
      const chave = chaveDe(item.titulo, item.detalhe);
      const existente = unicos.get(chave);
      // o mesmo livro aparece em várias edições e fontes: fica o primeiro, a não ser que só um deles tenha capa
      if (!existente || (!existente.capa && item.capa)) {
        unicos.set(chave, item);
      }
    }

    const itens = Array.from(unicos.values());
    // com capa primeiro; dentro de cada grupo, a ordem de chegada (Apple Books, depois Open Library)
    return [...itens.filter(i => i.capa), ...itens.filter(i => !i.capa)].slice(0, limite);
  }
}
