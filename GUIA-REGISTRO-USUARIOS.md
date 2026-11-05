# Registro de usuarios con Supabase Auth

## Introducción

Supabase Auth permite registrar, iniciar sesión y administrar cuentas sin crear una tabla de usuarios propia. Las cuentas se almacenan y gestionan en el esquema interno `auth` de Supabase.

Una tabla propia solo es necesaria si la aplicación necesita guardar información adicional del perfil, por ejemplo, nombre, departamento o teléfono.

## Configuración

1. Abre el proyecto en el panel de Supabase.
2. Entra a **Authentication** y revisa la configuración de registro de usuarios.
3. Habilita el registro público solo si cualquier persona debe poder crear una cuenta. Si el acceso debe ser privado, mantén el registro público deshabilitado y usa invitaciones administradas.
4. Configura la confirmación por correo electrónico según los requisitos de la aplicación.
5. Agrega los dominios locales y de producción permitidos para la aplicación y para los enlaces de confirmación.

La aplicación debe contar con la URL del proyecto y una clave pública (`anon` o `publishable`) en su configuración. La clave pública puede usarse desde el navegador, pero el acceso a los datos debe protegerse con las políticas correspondientes.

## Registro desde el frontend

Con el cliente JavaScript de Supabase, el registro se realiza con `auth.signUp`:

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password
});

if (error) {
  throw new Error(error.message);
}
```

Si está habilitada la confirmación por correo, la persona recibirá un enlace para confirmar la cuenta antes de iniciar sesión. La respuesta puede no incluir una sesión activa hasta que termine la confirmación.

En una aplicación Angular, conviene encapsular esta llamada en el servicio de autenticación ya existente y mostrar en la pantalla un mensaje claro tanto para el éxito como para los errores. También se deben validar los campos y exigir una contraseña que cumpla los requisitos establecidos.

## ¿Cuándo hace falta una tabla de perfiles?

No hace falta una tabla adicional para guardar los datos básicos de autenticación, como correo, contraseña o estado de confirmación: Supabase Auth los administra.

Si se necesita información propia de la aplicación, se puede crear posteriormente una tabla de perfiles relacionada con el identificador de `auth.users`. Esta tabla debe protegerse con Row Level Security (RLS) y políticas que limiten qué perfiles puede consultar o modificar cada usuario.

## Seguridad

- Nunca coloques una clave `service_role` o una clave secreta en el frontend.
- Usa la clave pública desde el navegador y protege los datos mediante RLS.
- No habilites el registro público si las cuentas deben ser creadas únicamente por un administrador.
- Para invitar o administrar cuentas con privilegios, usa un entorno de backend seguro; no expongas credenciales administrativas al navegador.
- Configura las URL de redirección para que los enlaces de confirmación y recuperación solo regresen a dominios confiables.

## Estado en esta aplicación

La aplicación ya cuenta con inicio de sesión y recuperación de contraseña. El formulario de registro no está incluido actualmente; para permitir que las personas creen sus propias cuentas habría que agregar una pantalla o formulario que invoque `auth.signUp` y definir primero si el registro será público o solo mediante invitación.
