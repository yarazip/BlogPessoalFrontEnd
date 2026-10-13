import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FeedPostagensComponent } from '../../components/feed-postagens/feed-postagens.component';
import { Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/** Perfil de uma pessoa: foto, nome, bio e as postagens dela. Público, sem exigir login. */
@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [FeedPostagensComponent, RouterLink],
  templateUrl: './perfil-publico.component.html',
  styleUrls: ['./perfil-publico.component.scss']
})
export class PerfilPublicoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly perfilService = inject(PerfilService);
  private readonly authService = inject(AuthService);

  readonly fotoPadrao = 'assets/img/sem-foto.svg';

  perfil: Perfil | null = null;
  carregando = true;
  mensagemErro: string | null = null;

  /** Mostra o atalho para editar quando a pessoa está olhando o próprio perfil. */
  get ehOProprioPerfil(): boolean {
    return this.perfil !== null && this.authService.isLoggedIn() && this.authService.getUsuario()?.id === this.perfil.id;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => this.carregar(Number(params.get('id'))));
  }

  carregar(id: number): void {
    this.perfil = null;
    this.mensagemErro = null;

    if (!Number.isInteger(id) || id <= 0) {
      this.carregando = false;
      this.mensagemErro = 'Perfil não encontrado.';
      return;
    }

    this.carregando = true;
    this.perfilService.getPerfil(id).subscribe({
      next: perfil => {
        this.perfil = perfil;
        this.carregando = false;
      },
      error: erro => {
        this.mensagemErro = erro?.status === 404 ? 'Perfil não encontrado.' : mensagemDeErro(erro, 'Não foi possível carregar o perfil.');
        this.carregando = false;
      }
    });
  }
}
