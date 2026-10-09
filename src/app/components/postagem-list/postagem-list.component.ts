import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DateBrPipe } from '../../pipes/date-br.pipe';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { Postagem } from '../models/Postagem';

@Component({
  selector: 'app-postagem-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DateBrPipe, TruncatePipe],
  templateUrl: './postagem-list.component.html',
  styleUrls: ['./postagem-list.component.scss']
})
export class PostagemListComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);

  postagens: Postagem[] = [];
  isLoading = true;
  mensagemErro: string | null = null;

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) {
      this.isLoading = false;
      return;
    }

    this.postagemService.getByUsuario(usuario.id).subscribe({
      next: postagens => {
        this.postagens = postagens;
        this.isLoading = false;
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Erro ao carregar postagens.');
        this.isLoading = false;
      }
    });
  }
}
