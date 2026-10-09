import { IconComponent } from '../../shared/icon/icon.component';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ArcElement, Chart, Legend, PieController, Title, Tooltip } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DashboardService, StatsResponse } from '../../services/dashboard.service';
import { ThemeService } from '../../services/theme.service';

// Registra só o que o gráfico de pizza usa (em vez de todo o Chart.js)
Chart.register(PieController, ArcElement, Tooltip, Legend, Title);

const CORES_CLARO = [
  'rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)',
  'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)', 'rgba(201, 203, 207, 0.8)'
];
const CORES_ESCURO = [
  'rgba(100, 180, 255, 0.8)', 'rgba(255, 120, 150, 0.8)', 'rgba(255, 220, 100, 0.8)', 'rgba(100, 220, 220, 0.8)',
  'rgba(180, 150, 255, 0.8)', 'rgba(255, 180, 100, 0.8)', 'rgba(220, 220, 220, 0.8)'
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  @ViewChild('activityChart') activityChart?: ElementRef<HTMLCanvasElement>;

  usuario = this.authService.getUsuario();
  userCount = 0;
  postCount = 0;
  loading = true;
  error: string | null = null;
  chart: Chart | null = null;

  constructor() {
    // redesenha as cores do gráfico sempre que o tema muda
    effect(() => {
      this.themeService.escuro();
      this.atualizarTemaDoGrafico();
    });
  }

  ngOnInit(): void {
    this.carregarContadores();
  }

  ngAfterViewInit(): void {
    this.carregarGrafico();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  goToPostagens(): void {
    this.router.navigate(['/postagens']);
  }

  goToPostagemNova(): void {
    this.router.navigate(['/postagens/nova']);
  }

  private carregarContadores(): void {
    this.loading = true;
    this.error = null;

    forkJoin([
      this.dashboardService.getUserCount().pipe(catchError(() => of(null))),
      this.dashboardService.getPostCount().pipe(catchError(() => of(null)))
    ]).subscribe(([usuarios, postagens]) => {
      this.userCount = usuarios ?? 0;
      this.postCount = postagens ?? 0;
      if (usuarios === null || postagens === null) {
        this.error = 'Não foi possível carregar todos os dados do dashboard.';
      }
      this.loading = false;
    });
  }

  private carregarGrafico(): void {
    const canvas = this.activityChart?.nativeElement;
    if (!canvas) {
      return;
    }

    this.dashboardService.getPostStats().subscribe({
      next: stats => this.desenharGrafico(canvas, stats),
      error: () => {
        this.error = 'Não foi possível carregar o gráfico de postagens.';
      }
    });
  }

  private desenharGrafico(canvas: HTMLCanvasElement, stats: StatsResponse[]): void {
    this.chart?.destroy();

    const escuro = this.themeService.isDarkMode();
    const textoCor = escuro ? '#fff' : '#333';

    this.chart = new Chart(canvas, {
      type: 'pie',
      data: {
        // "Segunda-feira" -> "Segunda": cabe melhor na legenda
        labels: stats.map(s => s.day.replace('-feira', '')),
        datasets: [{
          label: 'Postagens por dia',
          data: stats.map(s => s.count),
          backgroundColor: escuro ? CORES_ESCURO : CORES_CLARO,
          borderColor: escuro ? 'rgba(30, 30, 30, 1)' : 'rgba(255, 255, 255, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: textoCor, font: { size: this.tamanhoFonte(10, 12) } } },
          title: { display: true, text: 'Distribuição de Postagens', color: textoCor, font: { size: this.tamanhoFonte(14, 16) } }
        }
      }
    });
  }

  private atualizarTemaDoGrafico(): void {
    if (!this.chart) {
      return;
    }

    const escuro = this.themeService.isDarkMode();
    const textoCor = escuro ? '#fff' : '#333';
    const dataset = this.chart.data.datasets[0];
    dataset.backgroundColor = escuro ? CORES_ESCURO : CORES_CLARO;
    dataset.borderColor = escuro ? 'rgba(30, 30, 30, 1)' : 'rgba(255, 255, 255, 1)';

    const plugins = this.chart.options.plugins;
    if (plugins?.legend?.labels) {
      plugins.legend.labels.color = textoCor;
    }
    if (plugins?.title) {
      plugins.title.color = textoCor;
    }
    this.chart.update();
  }

  private tamanhoFonte(mobile: number, desktop: number): number {
    return window.innerWidth < 768 ? mobile : desktop;
  }
}
