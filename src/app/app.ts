import { Component, DestroyRef, inject, Injector, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { getAppConfig } from './core/app-config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html'
})
export class App {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private authUnsubscribe?: () => void;
  private authConnecting = false;
  readonly userEmail = signal('');
  readonly menuOpen = signal(false);
  readonly authError = signal('');
  readonly authChecking = signal(false);

  get isAuthPage(): boolean {
    return this.router.url.startsWith('/login') || this.router.url.startsWith('/reset-password');
  }

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.authChecking.set(!event.url.startsWith('/login') && !event.url.startsWith('/reset-password'));
      } else if (event instanceof NavigationEnd) {
        this.authChecking.set(false);
        if (!this.isAuthPage) void this.connectAuth();
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.authChecking.set(false);
      }
    });
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      this.authUnsubscribe?.();
    });
  }

  async signOut(): Promise<void> {
    this.authError.set('');
    try {
      const { AuthService } = await import('./core/auth.service');
      await this.injector.get(AuthService).signOut();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.authError.set(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.');
    }
  }

  private async connectAuth(): Promise<void> {
    const config = getAppConfig();
    if (this.authUnsubscribe || this.authConnecting || !config.supabaseUrl || !config.supabaseAnonKey) return;
    this.authConnecting = true;
    try {
      const { AuthService } = await import('./core/auth.service');
      this.authUnsubscribe = this.injector.get(AuthService)
        .watchSession((email) => this.userEmail.set(email ?? ''));
    } catch (error) {
      this.authError.set(error instanceof Error ? error.message : 'No se pudo comprobar la sesión.');
    } finally {
      this.authConnecting = false;
    }
  }
}
