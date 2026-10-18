import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartCardComponent } from '../../shared/chart-card';
import { Measurement } from '../../core/measurement.model';
import { SupabaseService } from '../../core/supabase.service';
import { formatLocalDate, STALE_MEASUREMENT_MS } from '../../core/measurement-utils';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ChartCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private timer?: ReturnType<typeof setInterval>;
  private unsubscribeRealtime?: () => void;
  private requestId = 0;
  latest: Measurement | null = null;
  recent: Measurement[] = [];
  updatedAt: Date | null = null;
  loading = true;
  error = '';

  get isStale(): boolean {
    return Boolean(this.latest?.creado_en &&
      Date.now() - new Date(this.latest.creado_en).getTime() > STALE_MEASUREMENT_MS);
  }

  ngOnInit(): void {
    void this.load();
    this.timer = setInterval(() => void this.load(), 15000);
    this.unsubscribeRealtime = this.supabase.subscribeToMeasurements(() => void this.load());
  }

  ngOnDestroy(): void {
    this.requestId++;
    if (this.timer) clearInterval(this.timer);
    this.unsubscribeRealtime?.();
  }

  formatDate(value: string | null): string {
    return formatLocalDate(value);
  }

  displayValue(value: number | null, suffix: string): string {
    return value === null ? '—' : `${value.toFixed(1)}${suffix}`;
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    const requestId = ++this.requestId;
    this.error = '';
    try {
      const [latest, recent] = await Promise.all([
        this.supabase.getLatest(),
        this.supabase.getRecent(8)
      ]);
      if (requestId === this.requestId) {
        this.latest = latest;
        this.recent = recent;
        this.updatedAt = new Date();
      }
    } catch (error) {
      if (requestId === this.requestId) {
        this.error = error instanceof Error ? error.message : 'No se pudieron cargar las mediciones.';
      }
    } finally {
      if (requestId === this.requestId) this.loading = false;
    }
  }
}
