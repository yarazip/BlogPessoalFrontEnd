import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  // Para pipe date, ngFor, etc
import { Postagem } from '../models/Postagem';
import { PostagemService } from '../../services/postagem.service';
import { HttpClientModule } from '@angular/common/http'; // Caso o serviço use HttpClient

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule, 
  ],
  providers: [PostagemService] 
})
export class ExplorarComponent implements OnInit {

  postagens: Postagem[] = [];

  constructor(private postagemService: PostagemService) { }

  ngOnInit(): void {
    this.postagemService.listarTodasPostagens().subscribe(
      (posts) => {
        this.postagens = posts;
      },
      (error) => {
        console.error('Erro ao carregar postagens', error);
      }
    );
  }
}
