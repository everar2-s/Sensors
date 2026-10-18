import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Measurement } from '../../core/measurement.model';
import { ageLabel, DEVICE_ACTIVE_MINUTES, deviceStatus, formatLocalDate } from '../../core/measurement-utils';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-devices',
  imports: [CommonModule],
  templateUrl: './devices.html',
  styleUrl: './devices.scss'
})
export class DevicesPage implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);
  devices: Measurement[] = [];
  loading = true;
  error = '';
  readonly thresholdMinutes = DEVICE_ACTIVE_MINUTES;
  now = Date.now();
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    void this.load();
    this.timer = setInterval(() => this.now = Date.now(), 30000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  status(device: Measurement): string {
    return deviceStatus(device.creado_en, this.now);
  }

  age(device: Measurement): string {
    return ageLabel(device.creado_en, this.now);
  }

  date(device: Measurement): string {
    return formatLocalDate(device.creado_en);
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.devices = await this.supabase.getDevices();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudieron consultar los dispositivos.';
    } finally {
      this.loading = false;
    }
  }
}
