
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostagemService } from '../../services/postagem.service';
import { TemaService } from '../../services/tema.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { LIMITE_COMENTARIO, LIMITES_POSTAGEM, PostagemRequest } from '../../models/Postagem';
import { Tema } from '../../models/Tema';

@Component({
  selector: 'app-postagem-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './postagem-form.component.html',
  styleUrls: ['./postagem-form.component.scss']
})
export class PostagemFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly postagemService = inject(PostagemService);
  private readonly temaService = inject(TemaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly limites = LIMITES_POSTAGEM;
  readonly limiteComentario = LIMITE_COMENTARIO;

  // os limites são os mesmos validados pela API; divergir faz o envio falhar com 400
  readonly postagemForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(LIMITES_POSTAGEM.tituloMin), Validators.maxLength(LIMITES_POSTAGEM.tituloMax)]],
    texto: ['', [Validators.required, Validators.minLength(LIMITES_POSTAGEM.textoMin), Validators.maxLength(LIMITES_POSTAGEM.textoMax)]],
    temaId: this.fb.control<number | null>(null, Validators.required)
  });

  isEdit = false;
  /** Editando um comentário: só o texto (até 280 caracteres), sem título nem tema. */
  isComentario = false;
  postagemId?: number;
  isLoading = false;
  temas: Tema[] = [];
  semTemas = false;
  errorMessage: string | null = null;

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

  ngOnInit(): void {
    this.carregarTemas();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.isEdit = true;
      this.postagemId = id;
      this.carregarPostagem(id);
    }
  }

  cancelar(): void {
    this.router.navigate(['/postagens']);
  }

  onSubmit(): void {
    if (this.postagemForm.invalid || this.isLoading) {
      this.postagemForm.markAllAsTouched();
      return;
    }

    const { titulo, texto, temaId } = this.postagemForm.getRawValue();
    // a criação por aqui é sempre de blog (comentários nascem na caixa do feed); a edição mantém o tipo
    const dados: PostagemRequest = this.isComentario
      ? { tipo: 'COMENTARIO', texto: texto! }
      : { tipo: 'BLOG', titulo: titulo!, texto: texto!, idTema: temaId! };

    this.isLoading = true;
    this.errorMessage = null;

    const operacao = this.isEdit
      ? this.postagemService.update(this.postagemId!, dados)
      : this.postagemService.create(dados);

    operacao.subscribe({
      next: () => this.router.navigate(['/postagens']),
      error: erro => {
        this.errorMessage = mensagemDeErro(erro, 'Erro ao salvar postagem. Tente novamente.');
        this.isLoading = false;
      }
    });
  }

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
    this.postagemService.getById(id).subscribe({
      next: postagem => {
        if (postagem.tipo === 'COMENTARIO') {
          this.usarRegrasDeComentario();
        }
        this.postagemForm.patchValue({
          titulo: postagem.titulo ?? '',
          texto: postagem.texto,
          temaId: postagem.tema?.id ?? null
        });
        this.isLoading = false;
      },
      error: erro => {
        this.errorMessage = mensagemDeErro(erro, 'Erro ao carregar postagem.');
        this.isLoading = false;
      }
    });
  }
}
