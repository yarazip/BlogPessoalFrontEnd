import { IconComponent } from '../../shared/icon/icon.component';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [RouterModule, IconComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /** Encerra a sessão por completo (token e dados do usuário) e volta ao login. */
  logout(): void {
    this.authService.logout();
  }
}
