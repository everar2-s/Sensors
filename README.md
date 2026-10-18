# AquaGuard IoT

Panel web responsive para consultar las mediciones de `public.mediciones` con Angular 20, Supabase Auth y Chart.js. La interfaz no muestra lecturas ficticias. El proyecto no incluye ni aplica migraciones SQL.

## Requisitos y puesta en marcha

- Node.js 20.19 o posterior y npm.
- Una clave pública (publishable/anon) del proyecto Supabase; nunca uses una clave `service_role` en el navegador.

1. Instala dependencias con `npm install`.
2. Copia `.env.example` como `.env` y configura `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
3. Ejecuta `npm start` y abre `http://localhost:4200`.

Los scripts de inicio, compilación y pruebas cargan `.env` y generan `public/runtime-config.js` antes de ejecutarse. Ese archivo y `.env` están ignorados por Git. La clave anon es visible para el navegador por diseño: protege el acceso con Supabase Auth y políticas RLS; no pongas una clave de servicio en `.env`.

Para despliegues, define ambas variables en el entorno de compilación. La configuración se incorpora al archivo público `runtime-config.js` del artefacto.

## Supabase y acceso

El frontend usa la URL indicada en la configuración (por defecto, `https://jmhwjulmjopioyevlkhz.supabase.co`) y consulta únicamente estas columnas conocidas: `id`, `temperatura`, `humedad`, `indice_calor`, `dispositivo` y `creado_en`. La conexión disponible en este entorno no permitió inspeccionar la base de datos; confirma que la tabla, los tipos y las políticas coincidan con el esquema real antes de desplegar.

- En Supabase Auth, crea/invita usuarios de forma controlada y deshabilita el registro público si no es parte de tu política de acceso. La pantalla no ofrece registro.
- Configura la URL del sitio y permite `http://localhost:4200/reset-password` (y el dominio de despliegue equivalente) como URL de redirección para recuperación de contraseña.
- Verifica que RLS esté habilitado y que el rol autenticado tenga únicamente los permisos de lectura necesarios para `public.mediciones`. No se instala ni modifica ninguna política automáticamente; conserva la política de escritura existente del ESP32.
- Las actualizaciones en vivo usan Realtime cuando `public.mediciones` está publicado. El dashboard también consulta cada 15 segundos, por lo que conserva actualización periódica si Realtime no está habilitado.

## Funciones y límites de consulta

- Dashboard: última medición ordenada por `creado_en` descendente y desempate por `id` descendente, avisos de ausencia/antigüedad de datos (umbral de 90 segundos) y lecturas recientes.
- Historial: filtros de fechas locales y dispositivo, orden, paginación de 25 filas y CSV de la página consultada. No descarga todo el historial.
- Gráficas: periodos de una hora, 24 horas, siete días o rango personalizado; se consultan páginas de 1.000 filas y se limita a 50.000 mediciones, muestreadas a un máximo aproximado de 500 puntos. Los nulos se dejan como discontinuidades.
- Dispositivos: la antigüedad se estima con la última medición por identificador. “Activo” significa que esa lectura tiene como máximo cinco minutos; no demuestra conectividad Wi-Fi. Para descubrir todos los identificadores históricos, se recorren páginas que contienen solo `dispositivo`; después se obtiene la última lectura de cada dispositivo en lotes pequeños.
- Las fechas se convierten desde/hacia UTC para consultas y se presentan en la zona horaria local del navegador.

## Desarrollo y validación

```bash
npm start
npm run build
npm test -- --watch=false
```
