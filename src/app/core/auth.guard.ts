import { inject, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAppConfig } from './app-config';

export const authGuard: CanActivateFn = async () => {
  const injector = inject(Injector);
  const router = inject(Router);
  const config = getAppConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) return router.createUrlTree(['/login']);

  try {
    const { AuthService } = await import('./auth.service');
    const auth = injector.get(AuthService);
    const session = await auth.getSession();
    return session ? true : router.createUrlTree(['/login']);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo comprobar la sesión.';
    return router.createUrlTree(['/login'], { queryParams: { sessionError: message } });
  }
};
