import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostagemService } from '../../services/postagem.service';
import { TemaService } from '../../services/tema.service';
import { Postagem } from '../models/Postagem';
import { Tema } from '../models/Tema';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-postagem-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './postagem-form.component.html',
  styleUrls: ['./postagem-form.component.scss']
})
export class PostagemFormComponent implements OnInit {
  postagemForm: FormGroup;
  isEdit = false;
  postagemId?: number;
  isLoading = false;
  temas: Tema[] = [];
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private postagemService: PostagemService,
    private temaService: TemaService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.postagemForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      texto: ['', [Validators.required, Validators.minLength(10)]],
      temaId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarTemas();
    this.verificarEdicao();
  }

  carregarTemas(): void {
    this.isLoading = true;
    this.temaService.getAll().subscribe({
      next: (temas) => {
        this.temas = temas.length > 0 ? temas : this.getTemasPredefinidos();
        this.isLoading = false;
      },
      error: () => {
        this.temas = this.getTemasPredefinidos();
        this.isLoading = false;
      }
    });
  }
get titulo() {
  return this.postagemForm.get('titulo');
}

get texto() {
  return this.postagemForm.get('texto');
}

get temaId() {
  return this.postagemForm.get('temaId');
}
cancelar(): void {
  this.router.navigate(['/postagens']);
}

  private getTemasPredefinidos(): Tema[] {
    return [
      { id: 1, descricao: 'Tecnologia' },
      { id: 2, descricao: 'Educação' },
      { id: 3, descricao: 'Saúde' },
      { id: 4, descricao: 'Esportes' },
      { id: 5, descricao: 'Entretenimento' },
      { id: 6, descricao: 'Ciência' },
      { id: 7, descricao: 'Política' },
      { id: 8, descricao: 'Meio Ambiente' },
      { id: 9, descricao: 'Arte' },
      { id: 10, descricao: 'Negócios' }
    ];
  }

  verificarEdicao(): void {
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(+id)) {
      this.isEdit = true;
      this.postagemId = +id;
      this.carregarPostagem();
    }
  }

  carregarPostagem(): void {
    if (!this.postagemId) return;

    this.isLoading = true;
    this.postagemService.getById(this.postagemId).subscribe({
      next: (postagem) => {
        this.postagemForm.patchValue({
          titulo: postagem.titulo,
          texto: postagem.texto,
          temaId: postagem.tema?.id || null
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar postagem:', err);
        this.errorMessage = 'Erro ao carregar postagem.';
        this.isLoading = false;
      }
    });
  }

onSubmit(): void {
  if (this.postagemForm.invalid || this.isLoading) return;

const usuarioId = this.authService.getUsuario()?.id;
if (!usuarioId) {
  this.errorMessage = 'Usuário não autenticado. Faça login novamente.';
  return;
}



  this.isLoading = true;
  this.errorMessage = null;

  const formValue = this.postagemForm.value;
const postagem = {
  ...(this.isEdit && { id: this.postagemId }),
  titulo: formValue.titulo,
  texto: formValue.texto,
  idTema: formValue.temaId
};



  const operacao = this.isEdit
    ? this.postagemService.update(postagem)
    : this.postagemService.create(postagem);

  operacao.subscribe({
    next: () => this.router.navigate(['/postagens']),
    error: () => {
      this.errorMessage = 'Erro ao salvar postagem. Tente novamente.';
      this.isLoading = false;
    }
  });
}

}
