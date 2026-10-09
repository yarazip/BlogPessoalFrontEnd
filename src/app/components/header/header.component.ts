import { IconComponent } from '../../shared/icon/icon.component';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  isMobileMenuOpen = false;

  /** O cabeçalho da página inicial tem um visual próprio. */
  get isHomePage(): boolean {
    return this.router.url.split(/[?#]/)[0] === '/';
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('menu-open');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen = true;
    document.body.classList.add('menu-open');
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.classList.remove('menu-open');
  }

  toggleMobileMenu(): void {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }
}
