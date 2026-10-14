import { Component, DestroyRef, OnInit, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { ItemDeBusca, textoDoItem } from '../../models/ItemDeBusca';

/** Letras mínimas para começar a buscar, e a espera depois da última tecla (evita uma chamada por letra). */
const MINIMO_DE_LETRAS = 2;
const ESPERA_EM_MS = 350;

/** Estado da lista que aparece abaixo do campo. */
type Estado = { tipo: 'fechada' } | { tipo: 'resultados'; itens: ItemDeBusca[] } | { tipo: 'vazia' } | { tipo: 'erro' };

/**
 * Campo de texto com busca: a pessoa digita e aparece uma lista de resultados (com capa) para escolher.
 * O texto continua livre: se a busca não achar ou estiver fora do ar, dá para digitar e salvar mesmo assim.
 *
 * Quem usa fornece o `controle` (o texto), a função `buscar` e recebe em `escolhido` o item selecionado,
 * ou `null` quando a pessoa volta a digitar à mão (a capa do item anterior deixa de valer).
 */
@Component({
  selector: 'app-busca-destaque',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './busca-destaque.component.html',
  styleUrls: ['./busca-destaque.component.scss']
})
export class BuscaDestaqueComponent implements OnInit {
  readonly controle = input.required<FormControl<string>>();
  readonly buscar = input.required<(termo: string) => Observable<ItemDeBusca[]>>();
  readonly idDoCampo = input.required<string>();
  readonly rotulo = input.required<string>();
  readonly placeholder = input('');
  readonly limite = input(100);

  readonly escolhido = output<ItemDeBusca | null>();

  estado: Estado = { tipo: 'fechada' };
  buscando = false;

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.controle()
      .valueChanges.pipe(
        // qualquer digitação à mão desfaz a escolha anterior
        map(valor => {
          this.escolhido.emit(null);
          return valor.trim();
        }),
        debounceTime(ESPERA_EM_MS),
        distinctUntilChanged(),
        switchMap(termo => {
          if (termo.length < MINIMO_DE_LETRAS) {
            this.buscando = false;
            return of<Estado>({ tipo: 'fechada' });
          }
          this.buscando = true;
          return this.buscar()(termo).pipe(
            map<ItemDeBusca[], Estado>(itens => (itens.length ? { tipo: 'resultados', itens } : { tipo: 'vazia' })),
            catchError(() => of<Estado>({ tipo: 'erro' }))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(estado => {
        this.buscando = false;
        this.estado = estado;
      });
  }

  get resultados(): ItemDeBusca[] {
    return this.estado.tipo === 'resultados' ? this.estado.itens : [];
  }

  escolher(item: ItemDeBusca): void {
    // sem emitir valueChanges: escolher não é "digitar", e não deve disparar outra busca
    this.controle().setValue(textoDoItem(item, this.limite()), { emitEvent: false });
    this.estado = { tipo: 'fechada' };
    this.escolhido.emit(item);
  }

  fechar(): void {
    this.estado = { tipo: 'fechada' };
  }
}
