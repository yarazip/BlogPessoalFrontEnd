import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { DashboardService, StatsResponse } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  usuarioLogado: string = 'Usuario';
  userCount = 0;
  postCount = 0;
  commentCount = 0;
  loading = true;
  error: string | null = null;
  usuario: any;
  isDarkMode = false;
  chart: Chart | null = null;

  @ViewChild('activityChart') activityChart!: ElementRef<HTMLCanvasElement>;
  private colorModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private colorModeListener = () => this.handleSystemThemeChange();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
    this.initializeTheme();
    this.colorModeMediaQuery.addEventListener('change', this.colorModeListener);
  }

  ngOnDestroy(): void {
    this.colorModeMediaQuery.removeEventListener('change', this.colorModeListener);
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngAfterViewInit(): void {
    this.loadChart();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin([
      this.dashboardService.getUserCount().pipe(catchError(() => of(0))),
      this.dashboardService.getPostCount().pipe(catchError(() => of(0))),
      this.dashboardService.getCommentCount().pipe(catchError(() => of(0)))
    ]).subscribe({
      next: ([users, posts, comments]) => {
        this.userCount = users;
        this.postCount = posts;
        this.commentCount = comments;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.error = 'Erro ao carregar dados do dashboard';
        this.loading = false;
      }
    });
  }

  loadChart(): void {
    const ctx = this.activityChart?.nativeElement;
    if (!ctx) {
      console.warn('Canvas não encontrado!');
      return;
    }

    this.dashboardService.getPostStats().subscribe({
      next: (stats: StatsResponse[]) => {
const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Mapear nomes em inglês para índice
const mapEnglishToIndex: {[key: string]: number} = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

const labels = stats.map(s => {
  const diaIndex = mapEnglishToIndex[s.day];
  return diasSemana[diaIndex] || s.day; // fallback para caso dê problema
});


        const data = stats.map(s => s.count);

        if (this.chart) {
          this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels,
            datasets: [{
              label: 'Postagens por dia',
              data,
              backgroundColor: this.isDarkMode ? this.getDarkColors() : this.getLightColors(),
              borderColor: this.isDarkMode ? 'rgba(30, 30, 30, 1)' : 'rgba(255, 255, 255, 1)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  color: this.isDarkMode ? '#fff' : '#000',
                  font: {
                    size: this.getFontSize()
                  }
                }
              },
              title: {
                display: true,
                text: 'Distribuição de Postagens',
                color: this.isDarkMode ? '#fff' : '#000',
                font: {
                  size: this.getTitleSize()
                }
              }
            }
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar dados do gráfico:', err);
      }
    });
  }

  private getLightColors() {
    return [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(201, 203, 207, 0.8)'
    ];
  }

  private getDarkColors() {
    return [
      'rgba(100, 180, 255, 0.8)',
      'rgba(255, 120, 150, 0.8)',
      'rgba(255, 220, 100, 0.8)',
      'rgba(100, 220, 220, 0.8)',
      'rgba(180, 150, 255, 0.8)',
      'rgba(255, 180, 100, 0.8)',
      'rgba(220, 220, 220, 0.8)'
    ];
  }

  private getFontSize(): number {
    return window.innerWidth < 768 ? 10 : 12;
  }

  private getTitleSize(): number {
    return window.innerWidth < 768 ? 14 : 16;
  }
initializeTheme() {
  const storedTheme = localStorage.getItem('theme');
  this.isDarkMode = storedTheme === 'dark';
  this.applyTheme();
}

handleSystemThemeChange() {
  const storedTheme = localStorage.getItem('theme');
  if (!storedTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDarkMode = prefersDark;
    this.applyTheme();
  }
}

toggleTheme() {
  this.isDarkMode = !this.isDarkMode;
  localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  this.applyTheme();
  this.updateChartTheme();
}

applyTheme() {
  if (this.isDarkMode) {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light-mode');
  } else {
    document.documentElement.classList.add('light-mode');
    document.documentElement.classList.remove('dark-mode');
  }
}



  updateChartTheme() {
    if (!this.chart) return;

    // Atualiza cores do gráfico
    this.chart.data.datasets[0].backgroundColor = this.isDarkMode ? this.getDarkColors() : this.getLightColors();
    this.chart.data.datasets[0].borderColor = this.isDarkMode ? 'rgba(30, 30, 30, 1)' : 'rgba(255, 255, 255, 1)';

    const options = this.chart.options;
    if (options.plugins) {
      if (options.plugins.legend?.labels) {
        options.plugins.legend.labels.color = this.isDarkMode ? '#fff' : '#333';
      }
      if (options.plugins.title) {
        options.plugins.title.color = this.isDarkMode ? '#fff' : '#333';
      }
    }

    this.chart.update();
  }

  goToPostagens() {
    this.router.navigate(['/postagens']);
  }

  goToPostagemNova() {
    this.router.navigate(['/postagens/nova']);
  }
}