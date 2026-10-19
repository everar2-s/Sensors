import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="reset-card">
      <a class="brand reset-brand" routerLink="/login"><span class="brand-mark" aria-hidden="true"><img src="/icons/aquaguard-logo.svg" alt=""></span><span><strong>AquaGuard</strong><small>MONITOREO AMBIENTAL</small></span></a>
      @if (!ready && !error) {<p>Comprobando el enlace de recuperación…</p>}
      @if (error) {<div class="notice notice--error" role="alert">{{ error }}</div>}
      @if (success) {<div class="notice notice--success" role="status">{{ success }}</div>}
      @if (ready && !success) {
        <h1>Elige una nueva contraseña</h1><p class="reset-intro">Usa una contraseña segura para proteger tu cuenta.</p>
        <form (ngSubmit)="update()">
          <label>Nueva contraseña<input type="password" name="password" [(ngModel)]="password" minlength="8" required autocomplete="new-password"></label>
          <label>Confirmar contraseña<input type="password" name="confirm" [(ngModel)]="confirm" minlength="8" required autocomplete="new-password"></label>
          <button class="button" [disabled]="loading">{{ loading ? 'Guardando…' : 'Actualizar contraseña' }}</button>
        </form>
      }
      @if (success || error) {<a class="reset-back" routerLink="/login">Volver al inicio de sesión</a>}
    </main>
  `,
  styles: [`
    :host { display:grid; min-height:100vh; place-items:center; padding:20px; background:var(--background); }
    .reset-card { width:min(100%,430px); padding:32px; background:#fff; border:1px solid var(--border); border-radius:16px; }
    .reset-brand { margin-bottom:26px; color:var(--text); }
    h1 { margin:0 0 8px; font-size:24px; } .reset-intro { margin:0 0 22px; color:var(--muted); font-size:14px; }
    form { display:grid; gap:15px; } label { display:grid; gap:6px; font-size:13px; }
    input { width:100%; padding:10px; } .button { justify-content:center; margin-top:4px; }
    .reset-back { display:inline-block; margin-top:18px; color:var(--accent); font-size:13px; }
  `]
})
export class ResetPasswordPage implements OnInit {
  private readonly auth = inject(AuthService);
  ready = false;
  loading = false;
  error = '';
  success = '';
  password = '';
  confirm = '';

  async ngOnInit(): Promise<void> {
    try {
      this.ready = Boolean(await this.auth.getSession());
      if (!this.ready) this.error = 'El enlace no es válido o ha caducado. Solicita uno nuevo.';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo validar el enlace.';
    }
  }

  async update(): Promise<void> {
    this.error = '';
    if (this.password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (this.password !== this.confirm) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }
    this.loading = true;
    try {
      await this.auth.updatePassword(this.password);
      this.success = 'La contraseña se actualizó correctamente.';
      this.ready = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.';
    } finally {
      this.loading = false;
    }
  }
}
