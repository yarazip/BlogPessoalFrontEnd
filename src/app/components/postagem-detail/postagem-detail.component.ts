import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DateBrPipe } from '../../pipes/date-br.pipe';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { Postagem } from '../models/Postagem';

@Component({
  selector: 'app-postagem-detail',
  standalone: true,
  imports: [CommonModule, DateBrPipe],
  templateUrl: './postagem-detail.component.html',
  styleUrls: ['./postagem-detail.component.scss']
})
export class PostagemDetailComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  postagem?: Postagem;
  isLoading = true;
  mensagemErro: string | null = null;

  /** Só o autor vê as ações de editar e excluir (a API também exige isso). */
  get ehAutor(): boolean {
    const usuario = this.authService.getUsuario();
    return !!usuario && !!this.postagem?.usuario && usuario.id === this.postagem.usuario.id;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigate(['/postagens']);
      return;
    }

    this.postagemService.getById(id).subscribe({
      next: postagem => {
        this.postagem = postagem;
        this.isLoading = false;
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Postagem não encontrada.');
        this.isLoading = false;
      }
    });
  }

  editar(id: number): void {
    this.router.navigate(['/postagens', id, 'editar']);
  }

  excluir(id: number): void {
    if (!confirm('Deseja excluir esta postagem?')) {
      return;
    }

    this.isLoading = true;
    this.mensagemErro = null;
    this.postagemService.delete(id).subscribe({
      next: () => this.router.navigate(['/postagens']),
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Erro ao excluir postagem.');
        this.isLoading = false;
      }
    });
  }
}
