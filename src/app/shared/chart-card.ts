import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { SupabaseService } from '../core/supabase.service';
import { Measurement } from '../core/measurement.model';

type Period = '1h' | '24h' | '7d' | 'custom';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-card',
  imports: [BaseChartDirective],
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.scss'
})
export class ChartCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) metric: 'temperatura' | 'humedad' = 'temperatura';
  @Input({ required: true }) title = '';
  @Input() subtitle = '';

  private readonly supabase = inject(SupabaseService);
  private requestId = 0;
  private timer?: ReturnType<typeof setInterval>;
  period: Period = '24h';
  customStart = '';
  customEnd = '';
  loading = true;
  error = '';
  labels: string[] = [];
  chartData: ChartData<'line'> = { labels: [], datasets: [] };
  readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 7 } },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (item) => `${item.dataset.label}: ${item.formattedValue}`
        }
      }
    },
    scales: {
      x: { ticks: { maxTicksLimit: 7, maxRotation: 0 }, grid: { display: false } },
      y: { title: { display: true, text: 'Temperatura (°C)' }, suggestedMin: 0, grid: { color: '#eceeea' } }
    }
  };

  ngOnInit(): void {
    this.updateAxis();
    void this.load();
    this.timer = setInterval(() => void this.load(), 60000);
  }

  ngOnDestroy(): void {
    this.requestId++;
    if (this.timer) clearInterval(this.timer);
  }

  setPeriod(period: Period): void {
    this.period = period;
    if (period === 'custom' && (!this.customStart || !this.customEnd)) return;
    void this.load();
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  applyCustomRange(): void {
    if (!this.customStart || !this.customEnd) {
      this.error = 'Selecciona ambas fechas para aplicar el rango.';
      return;
    }
    if (new Date(this.customStart) > new Date(this.customEnd)) {
      this.error = 'La fecha inicial debe ser anterior a la fecha final.';
      return;
    }
    void this.load();
  }

  private async load(): Promise<void> {
    const currentRequest = ++this.requestId;
    const now = Date.now();
    this.loading = true;
    this.error = '';

    try {
      if (this.period === 'custom' && (!this.customStart || !this.customEnd)) {
        this.loading = false;
        return;
      }
      const start = this.period === 'custom'
        ? new Date(this.customStart).toISOString()
        : new Date(now - (this.period === '1h' ? 3600000 : this.period === '24h' ? 86400000 : 604800000)).toISOString();
      const end = this.period === 'custom' ? new Date(this.customEnd).toISOString() : new Date(now).toISOString();
      const rows = await this.supabase.getRange(start, end);
      if (currentRequest !== this.requestId) return;
      this.setData(rows);
    } catch (error) {
      if (currentRequest !== this.requestId) return;
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los datos.';
      this.labels = [];
    } finally {
      if (currentRequest === this.requestId) this.loading = false;
    }
  }

  private setData(rows: Measurement[]): void {
    const available = rows.filter((row) => row.creado_en);
    if (!available.some((row) => row[this.metric] !== null)) {
      this.labels = [];
      this.chartData = { labels: [], datasets: [] };
      return;
    }
    const step = Math.max(1, Math.ceil(available.length / 500));
    const sampled = available.filter((_, index) => index % step === 0);
    if (sampled.length && sampled[sampled.length - 1] !== available[available.length - 1]) {
      sampled.push(available[available.length - 1]);
    }
    this.labels = sampled.map((row) => new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(row.creado_en!)));
    const label = this.metric === 'temperatura' ? 'Temperatura' : 'Humedad relativa';
    this.chartData = {
      labels: this.labels,
      datasets: [{
        label: `${label} (${this.metric === 'temperatura' ? '°C' : '%'})`,
        data: sampled.map((row) => row[this.metric]),
        borderColor: this.metric === 'temperatura' ? '#3f6b57' : '#5c8c9b',
        backgroundColor: this.metric === 'temperatura' ? 'rgba(63, 107, 87, .12)' : 'rgba(92, 140, 155, .12)',
        pointRadius: sampled.length > 100 ? 0 : 2,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: true,
        tension: 0.25,
        spanGaps: false
      }]
    };
  }

  private updateAxis(): void {
    this.chartOptions.scales = {
      ...this.chartOptions.scales,
      y: {
        title: { display: true, text: this.metric === 'temperatura' ? 'Temperatura (°C)' : 'Humedad relativa (%)' },
        suggestedMin: 0,
        grid: { color: '#eceeea' }
      }
    };
  }
}
