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
 * Quantos resultados pedir à Open Library para escolher os melhores. Pedimos bem mais do que mostramos porque
 * perto de 4 em cada 10 resultados vêm sem capa; com uma margem maior, quase sempre sobram livros com capa.
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

/**
 * Busca de livros na Open Library (grátis, sem chave, aceita chamadas do navegador). O Google Books sem chave
 * estoura a cota diária compartilhada, por isso não é usado. A capa vem de covers.openlibrary.org.
 *
 * A Open Library não tem capa para todos os livros, então a lista é arrumada antes de aparecer: edições repetidas
 * do mesmo livro (mesmo título e autor) viram uma só, ficando a que tem capa, e os livros com capa vêm primeiro,
 * na ordem de relevância da própria busca. Os sem capa só aparecem para completar a lista.
 */
@Injectable({ providedIn: 'root' })
export class BuscaLivroService {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://openlibrary.org/search.json';

  buscar(termo: string, limite = 6): Observable<ItemDeBusca[]> {
    return this.http
      .get<RespostaOpenLibrary>(this.url, {
        params: { q: termo, limit: Math.max(limite, RESULTADOS_PEDIDOS), fields: 'title,author_name,cover_i' }
      })
      .pipe(map(resposta => this.escolherOsMelhores(resposta, limite)));
  }

  private escolherOsMelhores(resposta: RespostaOpenLibrary, limite: number): ItemDeBusca[] {
    const unicos = new Map<string, ItemDeBusca>();

    for (const doc of resposta.docs ?? []) {
      if (!doc.title) {
        continue;
      }
      const item: ItemDeBusca = {
        titulo: doc.title,
        detalhe: doc.author_name?.[0] ?? '',
        capa: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        previa: null
      };
      const chave = chaveDe(item.titulo, item.detalhe);
      const existente = unicos.get(chave);
      // o mesmo livro aparece em várias edições: fica a primeira, a não ser que só uma delas tenha capa
      if (!existente || (!existente.capa && item.capa)) {
        unicos.set(chave, item);
      }
    }

    const itens = Array.from(unicos.values());
    // com capa primeiro; dentro de cada grupo, a ordem de relevância da Open Library (a ordenação do JS é estável)
    return [...itens.filter(i => i.capa), ...itens.filter(i => !i.capa)].slice(0, limite);
  }
}
