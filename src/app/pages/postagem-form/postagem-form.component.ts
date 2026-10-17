import { Component, DestroyRef, ElementRef, HostListener, OnInit, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ModalComponent } from '../../components/modal/modal.component';
import { PreviaRascunhoComponent } from '../../components/previa-rascunho/previa-rascunho.component';
import { EditorDePostitsComponent } from '../../components/editor-de-postits/editor-de-postits.component';
import { SeletorDeTemaComponent } from '../../components/seletor-de-tema/seletor-de-tema.component';
import { SeletorDeEmojiComponent } from '../../components/seletor-de-emoji/seletor-de-emoji.component';
import { SeletorDeFonteComponent } from '../../components/seletor-de-fonte/seletor-de-fonte.component';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { RascunhoLocalService } from '../../services/rascunho-local.service';
import { TemaService } from '../../services/tema.service';
import { AutoAjusteDirective } from '../../shared/auto-ajuste.directive';
import { Emoji, codigoDe, inserirNoTexto } from '../../shared/emojis';
import { contarPalavras, minutosDeLeitura } from '../../shared/leitura';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { FontePostagem, pilhaDe } from '../../models/Fonte';
import { LIMITE_COMENTARIO, LIMITES_POSTAGEM, PostagemRequest } from '../../models/Postagem';
import { LadoDosPostits, Postit, postitCompleto } from '../../models/Postit';
import { Tema } from '../../models/Tema';

/** Espera depois da última tecla antes de guardar o rascunho no navegador (evita gravar a cada letra). */
const ESPERA_DO_SALVAMENTO_EM_MS = 500;

export type AbaDoFormulario = 'escrever' | 'previa';

@Component({
  selector: 'app-postagem-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AutoAjusteDirective,
    DateBrPipe,
    ModalComponent,
    PreviaRascunhoComponent,
    SeletorDeFonteComponent,
    SeletorDeEmojiComponent,
    SeletorDeTemaComponent,
    EditorDePostitsComponent
  ],
  templateUrl: './postagem-form.component.html',
  styleUrls: ['./postagem-form.component.scss']
})
export class PostagemFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly postagemService = inject(PostagemService);
  private readonly temaService = inject(TemaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly rascunhoLocal = inject(RascunhoLocalService);
  private readonly destroyRef = inject(DestroyRef);

  /** O campo do texto, para inserir o emoji onde está o cursor. */
  private readonly areaTexto = viewChild<ElementRef<HTMLTextAreaElement>>('areaTexto');

  private readonly fonteService = inject(FonteService);

  readonly limites = LIMITES_POSTAGEM;
  readonly pilhaDe = pilhaDe;
  readonly limiteComentario = LIMITE_COMENTARIO;

  // os limites são os mesmos validados pela API; divergir faz o envio falhar com 400
  readonly postagemForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(LIMITES_POSTAGEM.tituloMin), Validators.maxLength(LIMITES_POSTAGEM.tituloMax)]],
    texto: ['', [Validators.required, Validators.minLength(LIMITES_POSTAGEM.textoMin), Validators.maxLength(LIMITES_POSTAGEM.textoMax)]],
    temaId: this.fb.control<number | null>(null, Validators.required),
    // só o rascunho (blog) escolhe fonte; nulo = a padrão do site
    fonte: this.fb.control<FontePostagem | null>(null)
  });

  isEdit = false;
  /** Editando um comentário: só o texto (até 280 caracteres), sem título nem tema. */
  isComentario = false;
  postagemId?: number;
  isLoading = false;
  /**
   * Na edição, até a postagem chegar da API não se sabe se é rascunho ou rabisco. Enquanto isso o formulário
   * não aparece, senão a tela mostrava os campos do rascunho (título, tema, fonte) e trocava para os do rabisco.
   */
  carregandoPostagem = false;
  /** A postagem a editar não pôde ser carregada: não há o que editar, só o aviso e o botão de voltar. */
  falhaAoCarregar = false;
  temas: Tema[] = [];
  semTemas = false;

  /** Os post-its do rascunho (0 a 3) e o lado da tela em que aparecem. Ficam fora do FormGroup de propósito. */
  postits: Postit[] = [];
  ladoDosPostits: LadoDosPostits = 'DIREITA';
  /** Avisa o salvamento automático quando os post-its mudam (o FormGroup não sabe deles). */
  private readonly postitsAlterados = new Subject<void>();
  errorMessage: string | null = null;

  /** Aba aberta no rascunho: escrever ou ver a prévia de como vai aparecer. */
  aba: AbaDoFormulario = 'escrever';

  /** Quando foi guardado o texto recuperado do navegador (nulo = nada foi recuperado, ou a pessoa já descartou). */
  recuperadoEm: string | null = null;
  /** A janela "Sair sem publicar?" está aberta. */
  confirmandoSaida = false;

  private chaveLocal = '';
  /** Valores com que o formulário começou (vazio, ou a postagem como está publicada): o que difere disso é "alteração". */
  private valoresBase: {
    titulo: string;
    texto: string;
    temaId: number | null;
    fonte: FontePostagem | null;
    postits?: Postit[];
    ladoDosPostits?: LadoDosPostits;
  } | null = null;
  private baseline = '';
  private publicado = false;
  private respostaDaSaida: ((sair: boolean) => void) | null = null;

  /** Limite do texto do tipo em edição (o blog aceita bem mais que o comentário). */
  get limiteTexto(): number {
    return this.isComentario ? this.limiteComentario : this.limites.textoMax;
  }

  get titulo() {
    return this.postagemForm.controls.titulo;
  }
  get texto() {
    return this.postagemForm.controls.texto;
  }
  get temaId() {
    return this.postagemForm.controls.temaId;
  }
  get fonte() {
    return this.postagemForm.controls.fonte;
  }

  get palavras(): number {
    return contarPalavras(this.texto.value ?? '');
  }

  get minutosDeLeitura(): number {
    return minutosDeLeitura(this.texto.value ?? '');
  }

  /** Nome do tema escolhido, sem as aspas que alguns temas antigos têm no banco. */
  get nomeDoTema(): string | null {
    const descricao = this.temas.find(t => t.id === this.temaId.value)?.descricao;
    return descricao ? descricao.replace(/^['"]+|['"]+$/g, '') : null;
  }

  /** A coluna de post-its só existe no rascunho (blog) e depois que a postagem carregou. */
  get mostrarPostits(): boolean {
    return !this.isComentario && !this.carregandoPostagem && !this.falhaAoCarregar;
  }

  get nomeDoAutor(): string {
    return this.authService.getUsuario()?.nome ?? 'Você';
  }

  /** Há um rascunho com alterações que ainda não foram publicadas (rabisco não entra: é curto e vai direto). */
  get temAlteracoes(): boolean {
    return !this.isComentario && !this.publicado && this.chaveLocal !== '' && this.instantaneo() !== this.baseline;
  }

  ngOnInit(): void {
    this.carregarTemas();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.isEdit = true;
      this.postagemId = id;
      this.carregarPostagem(id);
    } else {
      this.fonteService.carregarTodas(); // o seletor mostra cada opção na própria fonte
      this.iniciarRascunhoLocal();
    }
  }

  cancelar(): void {
    this.router.navigate(['/postagens']);
  }

  selecionarAba(aba: AbaDoFormulario): void {
    this.aba = aba;
  }

  /** Setas esquerda e direita trocam de aba (padrão de abas acessíveis). */
  teclaDaAba(evento: KeyboardEvent): void {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') {
      return;
    }
    evento.preventDefault();
    this.aba = this.aba === 'escrever' ? 'previa' : 'escrever';
    document.getElementById(this.aba === 'escrever' ? 'aba-escrever' : 'aba-previa')?.focus();
  }

  mudarPostits(postits: Postit[]): void {
    this.postits = postits;
    this.postitsAlterados.next();
  }

  mudarLado(lado: LadoDosPostits): void {
    this.ladoDosPostits = lado;
    this.postitsAlterados.next();
  }

  /** Os post-its (ou o lado) são diferentes dos do ponto de partida (vazio, ou a postagem como está publicada)? */
  private postitsMudaram(): boolean {
    const antes = JSON.stringify(this.valoresBase?.postits ?? []);
    const agora = JSON.stringify(this.postits.map(p => this.normalizado(p)));
    return antes !== agora || (this.valoresBase?.ladoDosPostits ?? 'DIREITA') !== this.ladoDosPostits;
  }

  /** Todo post-it tem o que precisa (recado com texto, foto com endereço)? */
  get postitsProntos(): boolean {
    return this.postits.every(postitCompleto);
  }

  /** Um tema novo, criado na própria barra de ferramentas: entra na lista sem recarregar a página. */
  temaCriado(tema: Tema): void {
    this.temas = [...this.temas, tema];
    this.semTemas = false;
  }

  /**
   * Coloca o código do emoji (`:sol:`) onde está o cursor do texto, trocando a seleção se houver. Se o código não couber
   * no limite de caracteres, nada muda. O cursor fica logo depois do emoji, para seguir escrevendo.
   */
  inserirEmoji(emoji: Emoji): void {
    const campo = this.areaTexto()?.nativeElement;
    const atual = this.texto.value ?? '';
    const inicio = campo?.selectionStart ?? atual.length;
    const fim = campo?.selectionEnd ?? atual.length;

    const resultado = inserirNoTexto(atual, inicio, fim, codigoDe(emoji), this.limiteTexto);
    if (!resultado) {
      return;
    }

    this.texto.setValue(resultado.texto);
    this.texto.markAsDirty();
    if (campo) {
      campo.focus();
      campo.setSelectionRange(resultado.cursor, resultado.cursor);
    }
  }

  onSubmit(): void {
    if (this.postagemForm.invalid || this.isLoading) {
      this.postagemForm.markAllAsTouched();
      return;
    }

    if (!this.isComentario && !this.postitsProntos) {
      this.errorMessage = 'Preencha os post-its (o recado ou a foto) ou remova os que ficaram vazios.';
      return;
    }

    const { titulo, texto, temaId, fonte } = this.postagemForm.getRawValue();
    // a criação por aqui é sempre de blog (comentários nascem na caixa do feed); a edição mantém o tipo
    const dados: PostagemRequest = this.isComentario
      ? { tipo: 'COMENTARIO', texto: texto! }
      : {
          tipo: 'BLOG',
          titulo: titulo!,
          texto: texto!,
          idTema: temaId!,
          fonte,
          // só manda os post-its quando há algum ou quando mudaram (lista vazia tira os que existiam); quem não usa
          // post-its envia o mesmo de antes
          ...(this.postits.length > 0 || this.postitsMudaram()
            ? { postits: this.postits.map(p => this.paraEnvio(p)), ladoDosPostits: this.ladoDosPostits }
            : {})
        };

    this.isLoading = true;
    this.errorMessage = null;

    const operacao = this.isEdit
      ? this.postagemService.update(this.postagemId!, dados)
      : this.postagemService.create(dados);

    operacao.subscribe({
      next: () => {
        // publicado: o rascunho guardado no navegador não vale mais, e sair da tela não pede confirmação
        this.publicado = true;
        if (this.chaveLocal) {
          this.rascunhoLocal.limpar(this.chaveLocal);
        }
        this.router.navigate(['/postagens']);
      },
      error: erro => {
        this.errorMessage = mensagemDeErro(erro, 'Erro ao salvar postagem. Tente novamente.');
        this.isLoading = false;
      }
    });
  }

  // ---------------------------------------------------------------- rascunho guardado no navegador

  /** Joga fora o texto recuperado e volta ao começo (vazio, ou a postagem como está publicada). */
  descartarRecuperado(): void {
    if (this.chaveLocal) {
      this.rascunhoLocal.limpar(this.chaveLocal);
    }
    if (this.valoresBase) {
      this.aplicarValores(this.valoresBase);
      this.postagemForm.markAsPristine();
    }
    this.recuperadoEm = null;
  }

  /**
   * Chamado pelo guard ao sair da tela. Sem alterações a saída é livre; com alterações abre a janela "Sair sem
   * publicar?" e espera a resposta. O texto já fica guardado no navegador de qualquer jeito.
   */
  podeSair(): boolean | Promise<boolean> {
    if (!this.temAlteracoes) {
      return true;
    }
    this.gravarAgora();
    return new Promise<boolean>(resolver => {
      this.respostaDaSaida = resolver;
      this.confirmandoSaida = true;
    });
  }

  responderSaida(sair: boolean): void {
    this.confirmandoSaida = false;
    this.respostaDaSaida?.(sair);
    this.respostaDaSaida = null;
  }

  /** Fechar a aba ou recarregar com um rascunho não publicado: o navegador pergunta antes. */
  @HostListener('window:beforeunload', ['$event'])
  aoFecharAAba(evento: BeforeUnloadEvent): void {
    if (this.temAlteracoes) {
      this.gravarAgora();
      evento.preventDefault();
    }
  }

  /**
   * Liga o salvamento automático (só para rascunho, nunca para rabisco): restaura o que estava guardado, se for
   * diferente do ponto de partida, e passa a guardar a cada pausa na digitação. Chamado quando o tipo já é conhecido.
   */
  private iniciarRascunhoLocal(): void {
    this.chaveLocal = this.rascunhoLocal.chave(this.authService.getUsuario()?.id, this.postagemId ?? null);
    this.valoresBase = this.valores();
    this.baseline = this.instantaneo();

    const salvo = this.rascunhoLocal.carregar(this.chaveLocal);
    if (salvo) {
      const { salvoEm, ...dados } = salvo;
      if (JSON.stringify(dados) !== this.baseline) {
        this.aplicarValores(dados);
        this.recuperadoEm = salvoEm;
      } else {
        this.rascunhoLocal.limpar(this.chaveLocal); // igual ao ponto de partida: não há o que recuperar
      }
    }

    merge(this.postagemForm.valueChanges, this.postitsAlterados)
      .pipe(debounceTime(ESPERA_DO_SALVAMENTO_EM_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.gravarAgora());
    // sair da tela antes da pausa não perde as últimas letras
    this.destroyRef.onDestroy(() => this.gravarAgora());
  }

  /** Guarda (ou, se voltou ao ponto de partida, apaga) o rascunho no navegador. */
  private gravarAgora(): void {
    if (!this.chaveLocal || this.isComentario || this.publicado) {
      return;
    }
    if (this.temAlteracoes) {
      this.rascunhoLocal.salvar(this.chaveLocal, this.valores());
    } else {
      this.rascunhoLocal.limpar(this.chaveLocal);
    }
  }

  private valores() {
    const { titulo, texto, temaId, fonte } = this.postagemForm.getRawValue();
    return {
      titulo: titulo ?? '',
      texto: texto ?? '',
      temaId,
      fonte,
      // só entram quando há post-its (ou o lado não é o padrão): quem não usa guarda e compara o mesmo de antes
      ...(this.postits.length > 0 && { postits: this.postits.map(p => this.normalizado(p)) }),
      ...(this.ladoDosPostits !== 'DIREITA' && { ladoDosPostits: this.ladoDosPostits })
    };
  }

  /** Põe os valores (do navegador ou da postagem) no formulário e nos post-its. */
  private aplicarValores(dados: {
    titulo: string;
    texto: string;
    temaId: number | null;
    fonte: FontePostagem | null;
    postits?: Postit[];
    ladoDosPostits?: LadoDosPostits;
  }): void {
    const { titulo, texto, temaId, fonte } = dados;
    this.postagemForm.patchValue({ titulo, texto, temaId, fonte });
    this.postits = (dados.postits ?? []).map(p => this.normalizado(p));
    this.ladoDosPostits = dados.ladoDosPostits ?? 'DIREITA';
  }

  /** Sempre com as mesmas chaves, na mesma ordem: assim comparar dois post-its iguais dá igual. */
  private normalizado(p: Postit): Postit {
    return { tipo: p.tipo, texto: p.texto ?? null, fotoUrl: p.fotoUrl ?? null, cor: p.cor };
  }

  /** O formato que a API espera: sem os campos vazios (recado não leva foto; legenda em branco some). */
  private paraEnvio(p: Postit): Postit {
    const texto = p.texto?.trim() || undefined;
    return p.tipo === 'NOTA' ? { tipo: 'NOTA', texto, cor: p.cor } : { tipo: 'FOTO', fotoUrl: p.fotoUrl, texto, cor: p.cor };
  }

  /** O conteúdo do formulário numa forma fixa, para comparar com o ponto de partida. */
  private instantaneo(): string {
    return JSON.stringify(this.valores());
  }

  // ---------------------------------------------------------------- carregamento

  /** Comentário não tem título nem tema obrigatórios, e o texto vai só até 280 caracteres. */
  private usarRegrasDeComentario(): void {
    this.isComentario = true;
    this.titulo.clearValidators();
    this.temaId.clearValidators();
    this.texto.setValidators([Validators.required, Validators.maxLength(LIMITE_COMENTARIO)]);
    [this.titulo, this.temaId, this.texto].forEach(c => c.updateValueAndValidity());
  }

  private carregarTemas(): void {
    this.temaService.getAll().subscribe({
      next: temas => {
        this.temas = temas;
        this.semTemas = temas.length === 0;
      },
      error: erro => {
        this.errorMessage = mensagemDeErro(erro, 'Não foi possível carregar os temas.');
      }
    });
  }

  private carregarPostagem(id: number): void {
    this.isLoading = true;
    this.carregandoPostagem = true;
    this.postagemService.getById(id).subscribe({
      next: postagem => {
        if (postagem.tipo === 'COMENTARIO') {
          this.usarRegrasDeComentario();
        } else {
          this.fonteService.carregarTodas();
        }
        this.postagemForm.patchValue({
          titulo: postagem.titulo ?? '',
          texto: postagem.texto,
          temaId: postagem.tema?.id ?? null,
          fonte: postagem.fonte ?? null
        });
        this.postits = (postagem.postits ?? []).map(p => this.normalizado(p));
        this.ladoDosPostits = postagem.ladoDosPostits ?? 'DIREITA';
        this.isLoading = false;
        this.carregandoPostagem = false;
        if (!this.isComentario) {
          this.iniciarRascunhoLocal();
        }
      },
      error: erro => {
        this.errorMessage = mensagemDeErro(erro, 'Erro ao carregar postagem.');
        this.isLoading = false;
        this.carregandoPostagem = false;
        this.falhaAoCarregar = true;
      }
    });
  }
}
