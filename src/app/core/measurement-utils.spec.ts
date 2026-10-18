import { ageLabel, csvCell, deviceStatus, DEVICE_ACTIVE_MINUTES, localDateInputBoundary } from './measurement-utils';

describe('measurement utilities', () => {
  it('converts local date boundaries into ISO timestamps', () => {
    const start = localDateInputBoundary('2026-10-17');
    const end = localDateInputBoundary('2026-10-17', true);

    expect(start).toBe(new Date('2026-10-17T00:00:00').toISOString());
    expect(end).toBe(new Date('2026-10-17T23:59:59.999').toISOString());
    expect(localDateInputBoundary('')).toBeUndefined();
  });

  it('estimates activity using the documented five-minute threshold', () => {
    const now = Date.parse('2026-10-17T18:00:00.000Z');
    const atThreshold = new Date(now - DEVICE_ACTIVE_MINUTES * 60000).toISOString();
    const tooOld = new Date(now - (DEVICE_ACTIVE_MINUTES * 60000 + 1)).toISOString();

    expect(deviceStatus(atThreshold, now)).toBe('activo');
    expect(deviceStatus(tooOld, now)).toBe('sin datos recientes');
    expect(deviceStatus(null, now)).toBe('desconocido');
    expect(deviceStatus(new Date(now + 1000).toISOString(), now)).toBe('desconocido');
  });

  it('labels elapsed time without implying network connectivity', () => {
    const now = Date.parse('2026-10-17T18:00:00.000Z');
    expect(ageLabel(new Date(now - 2 * 60000).toISOString(), now)).toBe('Hace 2 min');
    expect(ageLabel(null, now)).toBe('Sin fecha');
  });

  it('escapes quotes in CSV values', () => {
    expect(csvCell('ESP32 "principal"')).toBe('"ESP32 ""principal"""');
    expect(csvCell(null)).toBe('""');
  });
});
