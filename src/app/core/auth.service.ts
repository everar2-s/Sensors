import { Injectable } from '@angular/core';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  get isConfigured(): boolean {
    return this.supabase.configured;
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw new Error(`No se pudo comprobar la sesión: ${error.message}`);
    return data.session;
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`No se pudo iniciar sesión: ${error.message}`);
    if (!data.user) throw new Error('La autenticación no devolvió un usuario válido.');
    return data.user;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(`No se pudo enviar el correo de recuperación: ${error.message}`);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(`No se pudo actualizar la contraseña: ${error.message}`);
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
  }

  watchSession(callback: (email: string | undefined) => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => callback(session?.user.email)
    );
    return () => data.subscription.unsubscribe();
  }
}
