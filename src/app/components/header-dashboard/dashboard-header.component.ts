import { IconComponent } from '../../shared/icon/icon.component';
import { LogoComponent } from '../../shared/logo/logo.component';
import { SinoComponent } from '../sino/sino.component';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [RouterModule, IconComponent, LogoComponent, SinoComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  isMobileMenuOpen = false;

  /** Id de quem está logado, para o link do próprio perfil (a página guarda perfil e postagens juntos). */
  get idDoUsuario(): number | string {
    return this.authService.getUsuario()?.id ?? '';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /** Fecha o painel do celular; chamado ao tocar num item para a página nova não ficar coberta. */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /** Encerra a sessão por completo (token e dados do usuário) e volta ao login. */
  logout(): void {
    this.authService.logout();
  }
}
