import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DateBrPipe } from '../../pipes/date-br.pipe';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { Postagem } from '../models/Postagem';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, DateBrPipe],
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);

  postagens: Postagem[] = [];
  isLoading = true;
  mensagemErro: string | null = null;

  readonly fotoPadrao = 'assets/img/sem-foto.svg';

  ngOnInit(): void {
    this.postagemService.getAll().subscribe({
      next: postagens => {
        this.postagens = postagens;
        this.isLoading = false;
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Não foi possível carregar as postagens.');
        this.isLoading = false;
      }
    });
  }
}
