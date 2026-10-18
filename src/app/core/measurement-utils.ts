export const DEVICE_ACTIVE_MINUTES = 5;
export const STALE_MEASUREMENT_MS = 90000;

export function formatLocalDate(value: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no válida'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function localDateInputBoundary(value: string, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function ageLabel(value: string | null, now = Date.now()): string {
  if (!value) return 'Sin fecha';
  const milliseconds = now - new Date(value).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return 'Fecha no válida';
  const minutes = Math.floor(milliseconds / 60000);
  if (minutes < 1) return 'Hace menos de un minuto';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

export function deviceStatus(value: string | null, now = Date.now()): 'activo' | 'sin datos recientes' | 'desconocido' {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'desconocido';
  const elapsed = now - new Date(value).getTime();
  if (elapsed < 0) return 'desconocido';
  return elapsed <= DEVICE_ACTIVE_MINUTES * 60000 ? 'activo' : 'sin datos recientes';
}

export function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
