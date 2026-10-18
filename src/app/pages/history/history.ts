import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Measurement, MeasurementSort } from '../../core/measurement.model';
import { SupabaseService } from '../../core/supabase.service';
import { csvCell, formatLocalDate, localDateInputBoundary } from '../../core/measurement-utils';

@Component({
  selector: 'app-history',
  imports: [FormsModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  readonly pageSize = 25;
  readonly sortOptions: { label: string; value: MeasurementSort }[] = [
    { label: 'Fecha', value: 'creado_en' }, { label: 'Temperatura', value: 'temperatura' },
    { label: 'Humedad', value: 'humedad' }, { label: 'Índice de calor', value: 'indice_calor' },
    { label: 'Dispositivo', value: 'dispositivo' }
  ];
  rows: Measurement[] = [];
  total = 0;
  page = 0;
  startDate = '';
  endDate = '';
  device = '';
  sort: MeasurementSort = 'creado_en';
  ascending = false;
  loading = false;
  error = '';
  notice = '';

  ngOnInit(): void {
    void this.load();
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get firstRecord(): number {
    return this.total ? this.page * this.pageSize + 1 : 0;
  }

  get lastRecord(): number {
    return Math.min((this.page + 1) * this.pageSize, this.total);
  }

  formatDate(value: string | null): string {
    return formatLocalDate(value);
  }

  applyFilters(): void {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.error = 'La fecha inicial debe ser anterior o igual a la fecha final.';
      return;
    }
    this.page = 0;
    void this.load();
  }

  changeSort(): void {
    this.ascending = !this.ascending;
    void this.load();
  }

  changePage(offset: number): void {
    this.page = Math.min(Math.max(this.page + offset, 0), this.pageCount - 1);
    void this.load();
  }

  exportCsv(): void {
    if (!this.rows.length) return;
    const columns = ['Fecha y hora', 'Temperatura (°C)', 'Humedad (%)', 'Índice de calor (°C)', 'Dispositivo'];
    const lines = this.rows.map((row) => [
      csvCell(row.creado_en ? formatLocalDate(row.creado_en) : ''),
      csvCell(row.temperatura), csvCell(row.humedad), csvCell(row.indice_calor),
      csvCell(row.dispositivo && /^[=+\-@\t\r]/.test(row.dispositivo) ? `'${row.dispositivo}` : row.dispositivo)
    ].join(','));
    const blob = new Blob(['\uFEFF', columns.map(csvCell).join(','), '\r\n', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `aquaguard-mediciones-pagina-${this.page + 1}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.notice = `Se exportaron ${this.rows.length} filas de esta página.`;
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.notice = '';
    try {
      const result = await this.supabase.getPage({
        from: this.page * this.pageSize,
        pageSize: this.pageSize,
        start: localDateInputBoundary(this.startDate),
        end: localDateInputBoundary(this.endDate, true),
        device: this.device.trim() || undefined,
        sort: this.sort,
        ascending: this.ascending
      });
      this.rows = result.rows;
      this.total = result.count;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo cargar el historial.';
    } finally {
      this.loading = false;
    }
  }
}
