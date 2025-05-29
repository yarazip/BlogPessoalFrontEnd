import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  isMobileMenuOpen = false;
  isHomePage = false;
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkThemePreference();
    this.setupRouterListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.classList.remove('menu-open');
  }

  // 🌙 Alternar tema claro/escuro
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.updateThemeStorage();
    this.applyThemeToDocument();
  }

  onNavLinkClick(isSamePage: boolean) {
  if (!isSamePage) {
    this.isMobileMenuOpen = false;
  }
}


  openMobileMenu() {
    this.isMobileMenuOpen = true;
    document.body.classList.add('menu-open');
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.classList.remove('menu-open');
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
  }

  private setupRouterListener() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      const baseUrl = this.getBaseUrl(event.urlAfterRedirects);
      this.isHomePage = ['/', '/home'].includes(baseUrl);
    });
  }

  private getBaseUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  private checkThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.isDarkMode = savedTheme
      ? savedTheme === 'dark'
      : prefersDark;

    this.applyThemeToDocument();
  }

  private updateThemeStorage() {
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

private applyThemeToDocument() {
  const root = document.documentElement;

  if (this.isDarkMode) {
    root.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-mode');
  }
}

  scrollToFragment(fragment: string) {
    this.router.navigate(['/home'], { fragment }).then(() => {
      setTimeout(() => {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 50);
    });
  }
}
