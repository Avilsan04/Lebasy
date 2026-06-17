# Lebasy

Aplicacion web para gestionar el inventario de productos de Lebasy.

## Arquitectura

- `frontend`: React + Vite, catalogo publico y panel de administrador oculto en una URL especifica.
- `supabase`: SQL para base de datos persistente, usuarios admin y storage de fotos.
- `backend`: API local antigua con JSON. Queda como referencia, pero no se usa para el despliegue gratis.

## Rutas

- Publico: `http://127.0.0.1:5173/`
- Administrador: `http://127.0.0.1:5173/admin-lebasy`

La ruta de administrador no aparece enlazada en la web publica y las acciones de inventario se protegen con Supabase Auth + RLS.

## Despliegue gratis

Consulta `CLOUDFLARE_SUPABASE.md` para desplegar en Cloudflare Pages con Supabase.

## Variables locales

Configura `frontend/.env`:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

## Ejecutar en local

Instalar dependencias del frontend:

```powershell
npm.cmd --prefix frontend install
```

Arrancar backend:

```powershell
npm.cmd --prefix backend run dev
```

Arrancar frontend en otra terminal:

```powershell
npm.cmd --prefix frontend run dev
```

## Notas de produccion

- Crea el admin desde Supabase Authentication.
- No subas claves privadas ni service-role keys al frontend.
- El `anon key` de Supabase si puede estar en el frontend porque la seguridad real la aplican las politicas RLS.
