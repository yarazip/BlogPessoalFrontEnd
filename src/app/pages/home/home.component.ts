import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostagemService } from '../../services/postagem.service';
import { Postagem } from '../../components/models/Postagem';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  postagemService = inject(PostagemService);
  postagens: Postagem[] = [];

  ngOnInit(): void {
    this.postagemService.getAll().subscribe(data => {
      this.postagens = data;
    });
  }
}
