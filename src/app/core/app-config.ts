export interface AquaGuardConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

declare global {
  interface Window {
    AQUAGUARD_CONFIG?: AquaGuardConfig;
  }
}

export function getAppConfig(): AquaGuardConfig {
  return window.AQUAGUARD_CONFIG ?? { supabaseUrl: '', supabaseAnonKey: '' };
}
