import { Component, OnInit, inject } from '@angular/core';
import { Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { NoMomentoComponent } from '../no-momento/no-momento.component';

/**
 * Faixa fina com a música e o livro do momento da pessoa logada, para o topo do feed no celular e no tablet
 * (no computador eles ficam na barra lateral, então a faixa some por CSS). Visitante não vê nada.
 * Carrega o próprio perfil; se falhar, simplesmente não aparece.
 */
@Component({
  selector: 'app-faixa-no-momento',
  standalone: true,
  imports: [NoMomentoComponent],
  template: `
    @if (perfil) {
      <section class="faixa-no-momento" aria-label="No momento">
        <app-no-momento [perfil]="perfil" [ehDona]="true" [compacto]="true" (atualizado)="perfil = $event" />
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .faixa-no-momento {
      border-bottom: 2px dashed var(--zine-contorno);
    }

    @media (min-width: 1024px) {
      :host {
        display: none;
      }
    }
  `
})
export class FaixaNoMomentoComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly perfilService = inject(PerfilService);

  perfil: Perfil | null = null;

  ngOnInit(): void {
    const usuario = this.authService.isLoggedIn() ? this.authService.getUsuario() : null;
    if (!usuario) {
      return;
    }
    this.perfilService.getPerfil(usuario.id).subscribe({
      next: perfil => (this.perfil = perfil),
      error: () => (this.perfil = null)
    });
  }
}
