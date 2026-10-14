import { Component, DestroyRef, Injector, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ItemDeBusca } from '../../models/ItemDeBusca';
import { LIMITE_DESTAQUE, Perfil } from '../../models/Perfil';
import { BuscaLivroService } from '../../services/busca-livro.service';
import { BuscaMusicaService } from '../../services/busca-musica.service';
import { PerfilService } from '../../services/perfil.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { BuscaDestaqueComponent } from '../busca-destaque/busca-destaque.component';

/** Para dar um id próprio aos campos de cada instância (a mesma tela pode ter duas: barra e topo do perfil). */
let proximaInstancia = 0;

/**
 * A música e o livro do momento de uma pessoa: capa ao lado do texto, prévia de 30 segundos da música (só com
 * um clique) e, para a própria dona, a edição com busca. Não decide onde aparece nem o título: quem usa
 * (a barra lateral no computador, o topo do perfil no celular) põe a moldura.
 *
 * Quem usa passa o `perfil` e `ehDona`, e recebe em `atualizado` o perfil com os novos destaques depois de salvar.
 */
@Component({
  selector: 'app-no-momento',
  standalone: true,
  imports: [ReactiveFormsModule, BuscaDestaqueComponent],
  templateUrl: './no-momento.component.html',
  styleUrls: ['./no-momento.component.scss']
})
export class NoMomentoComponent {
  private readonly perfilService = inject(PerfilService);
  // as buscas só são criadas quando a pessoa realmente busca (o componente aparece em várias telas e testes)
  private readonly injector = inject(Injector);

  readonly perfil = input.required<Perfil>();
  readonly ehDona = input(false);

  readonly atualizado = output<Perfil>();

  readonly idBase = `destaque-${++proximaInstancia}`;
  readonly limiteDestaque = LIMITE_DESTAQUE;

  readonly musica = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_DESTAQUE)] });
  readonly livro = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_DESTAQUE)] });
  // o <form> precisa de um FormGroup: é ele que impede o envio nativo (recarregar a página)
  readonly destaquesForm = new FormGroup({ musica: this.musica, livro: this.livro });

  /** Funções de busca passadas aos campos (iTunes para música, Open Library para livro). */
  readonly buscarMusica = (termo: string) => this.injector.get(BuscaMusicaService).buscar(termo);
  readonly buscarLivro = (termo: string) => this.injector.get(BuscaLivroService).buscar(termo);

  /** O item escolhido na busca (com capa e prévia); nulo quando o texto foi digitado à mão. */
  musicaItem: ItemDeBusca | null = null;
  livroItem: ItemDeBusca | null = null;
  /** A prévia de 30 segundos está tocando. */
  tocando = false;
  private audio: HTMLAudioElement | null = null;
  editando = false;
  salvando = false;
  erro: string | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.pararPrevia());
  }

  get temDestaques(): boolean {
    const perfil = this.perfil();
    return !!(perfil.musicaAtual || perfil.livroAtual);
  }

  editar(): void {
    const perfil = this.perfil();
    this.pararPrevia();
    this.musica.setValue(perfil.musicaAtual ?? '');
    this.livro.setValue(perfil.livroAtual ?? '');
    // mantém a capa e a prévia atuais enquanto a pessoa não mexer no texto
    this.musicaItem =
      perfil.musicaCapa || perfil.musicaPrevia
        ? { titulo: '', detalhe: '', capa: perfil.musicaCapa ?? null, previa: perfil.musicaPrevia ?? null }
        : null;
    this.livroItem = perfil.livroCapa ? { titulo: '', detalhe: '', capa: perfil.livroCapa, previa: null } : null;
    this.erro = null;
    this.editando = true;
  }

  cancelar(): void {
    this.editando = false;
    this.erro = null;
  }

  salvar(): void {
    if (this.destaquesForm.invalid || this.salvando) {
      return;
    }

    const perfil = this.perfil();
    this.salvando = true;
    this.erro = null;

    this.perfilService
      .atualizarDestaques(perfil.id, {
        musicaAtual: this.musica.value,
        livroAtual: this.livro.value,
        musicaCapa: this.musicaItem?.capa ?? '',
        musicaPrevia: this.musicaItem?.previa ?? '',
        livroCapa: this.livroItem?.capa ?? ''
      })
      .subscribe({
        next: salvo => {
          this.atualizado.emit({
            ...perfil,
            musicaAtual: salvo.musicaAtual ?? null,
            livroAtual: salvo.livroAtual ?? null,
            musicaCapa: salvo.musicaCapa ?? null,
            musicaPrevia: salvo.musicaPrevia ?? null,
            livroCapa: salvo.livroCapa ?? null
          });
          this.editando = false;
          this.salvando = false;
        },
        error: erro => {
          this.erro = mensagemDeErro(erro, 'Não foi possível salvar. Tente novamente.');
          this.salvando = false;
        }
      });
  }

  /** Toca ou pausa a prévia de 30 segundos. O navegador exige um clique para tocar, então nunca começa sozinha. */
  alternarPrevia(): void {
    const url = this.perfil().musicaPrevia;
    if (!url) {
      return;
    }
    if (this.tocando) {
      this.pararPrevia();
      return;
    }
    this.audio = new Audio(url);
    this.audio.addEventListener('ended', () => (this.tocando = false));
    this.audio.addEventListener('error', () => (this.tocando = false));
    this.tocando = true;
    this.audio.play().catch(() => (this.tocando = false));
  }

  private pararPrevia(): void {
    this.audio?.pause();
    this.audio = null;
    this.tocando = false;
  }
}
