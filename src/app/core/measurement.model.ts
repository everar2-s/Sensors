export interface Measurement {
  id: number | string;
  temperatura: number | null;
  humedad: number | null;
  indice_calor: number | null;
  dispositivo: string | null;
  creado_en: string | null;
}

export type MeasurementSort = 'creado_en' | 'temperatura' | 'humedad' | 'indice_calor' | 'dispositivo';

export interface MeasurementQuery {
  from: number;
  pageSize: number;
  start?: string;
  end?: string;
  device?: string;
  sort?: MeasurementSort;
  ascending?: boolean;
}

export interface MeasurementPage {
  rows: Measurement[];
  count: number;
}
