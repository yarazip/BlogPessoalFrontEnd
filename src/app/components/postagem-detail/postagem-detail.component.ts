import { Component, OnInit } from '@angular/core';
import { PostagemService } from '../../services/postagem.service';
import { Postagem } from '../../components/models/Postagem';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Nl2brPipe } from '../../shared/pipes/nl2br.pipe'; // Importação adicionada
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-postagem-detail',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe,
    Nl2brPipe 
  ],
  templateUrl: './postagem-detail.component.html',
  styleUrls: ['./postagem-detail.component.scss']
})
export class PostagemDetailComponent implements OnInit {
  postagem?: Postagem;
  isLoading = true;

  constructor(
    private postagemService: PostagemService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPostagem(Number(id));
    } else {
      this.router.navigate(['/postagens']);
    }
  }

  loadPostagem(id: number): void {
    this.postagemService.getById(id).subscribe({
      next: (data) => {
        this.postagem = data;
        this.isLoading = false;
      },
      error: () => {
        alert('Postagem não encontrada.');
        this.router.navigate(['/postagens']);
        this.isLoading = false;
      }
    });
  }

  excluir(id: number): void {
    if (confirm('Deseja excluir esta postagem?')) {
      this.isLoading = true;
      this.postagemService.delete(id).subscribe({
        next: () => {
          alert('Postagem excluída com sucesso!');
          this.router.navigate(['/postagens']);
        },
        error: () => {
          alert('Erro ao excluir postagem.');
          this.isLoading = false;
        }
      });
    }
  }
editar(id: number): void {
  this.router.navigate(['/postagens/editar', id]);
}
}