import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly configured = this.auth.isConfigured;
  email = '';
  password = '';
  loading = false;
  recoveryMode = false;
  error = '';
  success = '';

  constructor() {
    this.error = this.route.snapshot.queryParamMap.get('sessionError') ?? '';
  }

  async signIn(): Promise<void> {
    this.error = '';
    this.success = '';
    if (!this.email.trim() || !this.password) {
      this.error = 'Escribe tu correo y contraseña.';
      return;
    }
    this.loading = true;
    try {
      await this.auth.signIn(this.email.trim(), this.password);
      await this.router.navigateByUrl('/dashboard');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
    } finally {
      this.loading = false;
    }
  }

  async requestReset(): Promise<void> {
    this.error = '';
    this.success = '';
    if (!this.email.trim()) {
      this.error = 'Escribe tu correo para recibir el enlace de recuperación.';
      return;
    }
    this.loading = true;
    try {
      await this.auth.requestPasswordReset(this.email.trim());
      this.success = 'Si la cuenta está habilitada, recibirás un correo con los siguientes pasos.';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo enviar el correo.';
    } finally {
      this.loading = false;
    }
  }
}
