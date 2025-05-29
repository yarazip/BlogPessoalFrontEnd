import { Component, OnInit } from '@angular/core';
import { PostagemService } from '../../services/postagem.service';
import { Postagem } from '../../components/models/Postagem';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';


@Component({
  selector: 'app-postagem-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, TruncatePipe],
  templateUrl: './postagem-list.component.html',
  styleUrls: ['./postagem-list.component.scss']
})
export class PostagemListComponent implements OnInit {
  postagens: Postagem[] = [];
  isLoading = true;

  constructor(
    private postagemService: PostagemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPostagens();
  }

  loadPostagens(): void {
  const user = localStorage.getItem('usuario');
  if (user) {
    const usuario = JSON.parse(user);
    const usuarioId = usuario.id;

    this.postagemService.getByUsuario(usuarioId).subscribe({
      next: (data) => {
        this.postagens = data;
        this.isLoading = false;
      },
      error: () => {
        alert('Erro ao carregar postagens.');
        this.isLoading = false;
      }
    });
  } else {
    alert('Usuário não logado.');
    this.isLoading = false;
  }
}

  excluir(id: number): void {
  if (confirm('Deseja excluir esta postagem?')) {
    this.isLoading = true;
    this.postagemService.delete(id).subscribe({
      next: () => {
        this.loadPostagens();
        alert('Postagem excluída com sucesso!');
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