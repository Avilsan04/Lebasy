# Despliegue gratis: Cloudflare Pages + Supabase

## 1. Crear Supabase

1. Crea un proyecto gratis en Supabase.
2. Ve a `SQL Editor`.
3. Ejecuta el contenido de `supabase/schema.sql`.
4. Ve a `Authentication > Users` y crea el usuario administrador con email y contrasena.
5. Vuelve a `SQL Editor` y ejecuta:

```sql
insert into public.admin_profiles (user_id)
select id from auth.users where email = 'TU_EMAIL_ADMIN'
on conflict do nothing;
```

## 2. Variables de entorno

En Supabase, copia:

- `Project URL`
- `publishable key` (`sb_publishable_...`)

En local crea `frontend/.env` usando `frontend/.env.example`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
```

En Cloudflare Pages anade las mismas variables en `Settings > Environment variables`.

No uses una clave `sb_secret_...` en Cloudflare Pages ni en React. Esa clave es solo para backend seguro.

## 3. Cloudflare Pages

Conecta el repositorio de GitHub y usa:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`

El archivo `frontend/public/_redirects` permite que funcionen `/admin-lebasy` y `/producto/:id`.

## 4. Notas

- El backend local queda como legado de desarrollo, pero el despliegue gratis usa solo `frontend` + Supabase.
- Las fotos se guardan en Supabase Storage, bucket `product-images`.
- Los productos se guardan en la tabla `products`.
- El admin usa Supabase Auth con email y contrasena.
