import { Component, ElementRef, HostListener, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Tema } from '../../models/Tema';
import { TemaService } from '../../services/tema.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { LIMITE_NOME_DE_TEMA, nomeDoTema, normalizarTema } from '../../shared/tema';

/**
 * Botão "Tema" da barra de ferramentas do editor: mostra o tema escolhido e abre uma lista com busca. Quem não acha o
 * que quer cria o tema ali mesmo ("+ Criar tema ..."), sem sair do texto. Criar um tema que já existe (mesmo com outra
 * caixa ou sem acento) só escolhe o existente.
 *
 *     <app-seletor-de-tema [controle]="temaId" [temas]="temas" [invalido]="..." (criado)="temas.push($event)" />
 */
@Component({
  selector: 'app-seletor-de-tema',
  standalone: true,
  templateUrl: './seletor-de-tema.component.html',
  styleUrls: ['./seletor-de-tema.component.scss']
})
export class SeletorDeTemaComponent {
  private readonly temaService = inject(TemaService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly campoDeBusca = viewChild<ElementRef<HTMLInputElement>>('campoDeBusca');

  /** O id do tema escolhido (nulo = nenhum). */
  readonly controle = input.required<FormControl<number | null>>();
  readonly temas = input<Tema[]>([]);
  /** O formulário reclamou da falta de tema: o botão fica com contorno de erro. */
  readonly invalido = input(false);

  /** Avisa quem usa que um tema novo foi criado (para entrar na lista dele). */
  readonly criado = output<Tema>();

  readonly limiteDoNome = LIMITE_NOME_DE_TEMA;
  readonly nomeDoTema = nomeDoTema;

  aberto = false;
  readonly busca = signal('');
  criando = false;
  erro: string | null = null;

  /** O que foi digitado, com os espaços arrumados. */
  readonly termo = computed(() => this.busca().trim().replace(/\s+/g, ' '));

  /** Os temas que combinam com a busca, em ordem alfabética. */
  readonly filtrados = computed(() => {
    const procurado = normalizarTema(this.termo());
    return [...this.temas()]
      .filter(t => normalizarTema(nomeDoTema(t.descricao)).includes(procurado))
      .sort((a, b) => nomeDoTema(a.descricao).localeCompare(nomeDoTema(b.descricao), 'pt-BR'));
  });

  /** Já existe um tema com exatamente esse nome? */
  readonly existente = computed(() => {
    const procurado = normalizarTema(this.termo());
    return procurado ? this.temas().find(t => normalizarTema(nomeDoTema(t.descricao)) === procurado) : undefined;
  });

  readonly podeCriar = computed(() => this.termo().length > 0 && !this.existente());

  /** O nome do tema escolhido agora (vazio = nenhum). */
  get nomeAtual(): string {
    const tema = this.temas().find(t => t.id === this.controle().value);
    return tema ? nomeDoTema(tema.descricao) : '';
  }

  alternar(): void {
    if (this.aberto) {
      this.fechar();
      return;
    }
    this.aberto = true;
    this.busca.set('');
    this.erro = null;
    // o foco vai para a busca assim que o painel existe
    setTimeout(() => this.campoDeBusca()?.nativeElement.focus());
  }

  fechar(): void {
    if (!this.aberto) {
      return;
    }
    this.aberto = false;
    // fechar sem escolher conta como "mexeu": o formulário passa a mostrar que falta o tema
    this.controle().markAsTouched();
  }

  digitar(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
    this.erro = null;
  }

  escolher(tema: Tema): void {
    this.controle().setValue(tema.id);
    this.controle().markAsDirty();
    this.fechar();
  }

  /** Enter na busca: escolhe o tema que combina, ou cria o digitado. */
  confirmar(evento: Event): void {
    evento.preventDefault();
    const existente = this.existente();
    if (existente) {
      this.escolher(existente);
    } else if (this.podeCriar()) {
      this.criar();
    } else if (this.filtrados().length === 1) {
      this.escolher(this.filtrados()[0]);
    }
  }

  criar(): void {
    const nome = this.termo();
    const existente = this.existente();
    if (existente) {
      this.escolher(existente);
      return;
    }
    if (!nome || this.criando) {
      return;
    }

    this.criando = true;
    this.erro = null;
    this.temaService.create({ descricao: nome }).subscribe({
      next: tema => {
        this.criando = false;
        this.criado.emit(tema);
        this.escolher(tema);
      },
      error: erro => {
        this.criando = false;
        this.erro = mensagemDeErro(erro, 'Não foi possível criar o tema. Tente de novo.');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: Event): void {
    if (this.aberto && !this.elemento.nativeElement.contains(evento.target as Node)) {
      this.fechar();
    }
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    this.fechar();
  }
}
