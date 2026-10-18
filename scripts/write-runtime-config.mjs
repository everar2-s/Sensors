import 'dotenv/config';
import { writeFile } from 'node:fs/promises';

const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://jmhwjulmjopioyevlkhz.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
};

await writeFile(
  new URL('../public/runtime-config.js', import.meta.url),
  `window.AQUAGUARD_CONFIG = ${JSON.stringify(config)};\n`,
  'utf8'
);
