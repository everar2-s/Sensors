import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAppConfig } from './app-config';
import { Measurement, MeasurementPage, MeasurementQuery } from './measurement.model';

const TABLE = 'mediciones';
const SELECT_COLUMNS = 'id,temperatura,humedad,indice_calor,dispositivo,creado_en';
const DEVICE_PAGE_SIZE = 1000;

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client?: SupabaseClient;

  get configured(): boolean {
    const { supabaseUrl, supabaseAnonKey } = getAppConfig();
    return Boolean(supabaseUrl && supabaseAnonKey);
  }

  get supabaseUrl(): string {
    return getAppConfig().supabaseUrl;
  }

  get auth() {
    return this.getClient().auth;
  }

  async getPage(options: MeasurementQuery): Promise<MeasurementPage> {
    let query = this.getClient()
      .from(TABLE)
      .select(SELECT_COLUMNS, { count: 'exact' });

    if (options.start) query = query.gte('creado_en', options.start);
    if (options.end) query = query.lte('creado_en', options.end);
    if (options.device) query = query.eq('dispositivo', options.device);

    const sort = options.sort ?? 'creado_en';
    const ascending = options.ascending ?? false;
    const { data, error, count } = await query
      .order(sort, { ascending, nullsFirst: false })
      .order('id', { ascending: false })
      .range(options.from, options.from + options.pageSize - 1);

    if (error) throw new Error(`No se pudieron consultar las mediciones: ${error.message}`);
    return { rows: (data ?? []) as Measurement[], count: count ?? 0 };
  }

  async getLatest(): Promise<Measurement | null> {
    const { data, error } = await this.getClient()
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .order('creado_en', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`No se pudo obtener la última medición: ${error.message}`);
    return data as Measurement | null;
  }

  async getRecent(limit: number): Promise<Measurement[]> {
    const { data, error } = await this.getClient()
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .order('creado_en', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`No se pudieron consultar las últimas mediciones: ${error.message}`);
    return (data ?? []) as Measurement[];
  }

  async getRange(start: string, end: string, maxRows = 50000): Promise<Measurement[]> {
    const client = this.getClient();
    const rows: Measurement[] = [];
    for (let from = 0; from <= maxRows; from += DEVICE_PAGE_SIZE) {
      const { data, error } = await client
        .from(TABLE)
        .select(SELECT_COLUMNS)
        .gte('creado_en', start)
        .lte('creado_en', end)
        .order('creado_en', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .range(from, from + DEVICE_PAGE_SIZE - 1);

      if (error) throw new Error(`No se pudieron cargar los datos de la gráfica: ${error.message}`);
      const page = (data ?? []) as Measurement[];
      if (from === maxRows) {
        if (page.length) throw new Error(`El periodo contiene más de ${maxRows.toLocaleString()} mediciones; reduce el rango.`);
        return rows;
      }
      rows.push(...page);
      if (page.length < DEVICE_PAGE_SIZE) return rows;
    }
    return rows;
  }

  async getDevices(): Promise<Measurement[]> {
    const client = this.getClient();
    const deviceNames = new Set<string>();

    for (let from = 0; ; from += DEVICE_PAGE_SIZE) {
      const { data, error } = await client
        .from(TABLE)
        .select('dispositivo')
        .not('dispositivo', 'is', null)
        .order('dispositivo', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + DEVICE_PAGE_SIZE - 1);

      if (error) throw new Error(`No se pudieron consultar los dispositivos: ${error.message}`);
      const page = data ?? [];
      for (const row of page) if (row.dispositivo) deviceNames.add(row.dispositivo);
      if (page.length < DEVICE_PAGE_SIZE) break;
    }

    const names = [...deviceNames];
    const latest: Measurement[] = [];
    for (let index = 0; index < names.length; index += 20) {
      const batch = names.slice(index, index + 20);
      const results = await Promise.all(batch.map((name) => client
        .from(TABLE)
        .select(SELECT_COLUMNS)
        .eq('dispositivo', name)
        .order('creado_en', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()));
      for (const result of results) {
        if (result.error) throw new Error(`No se pudieron consultar los dispositivos: ${result.error.message}`);
        if (result.data) latest.push(result.data as Measurement);
      }
    }
    return latest.sort((a, b) => (a.dispositivo ?? '').localeCompare(b.dispositivo ?? ''));
  }

  subscribeToMeasurements(onChange: () => void): () => void {
    const channel = this.getClient()
      .channel('mediciones-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onChange)
      .subscribe();

    return () => {
      void this.getClient().removeChannel(channel);
    };
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;
    const { supabaseUrl, supabaseAnonKey } = getAppConfig();
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY. Consulta el README.');
    }
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
    return this.client;
  }
}
