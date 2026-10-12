# Historial de sesión — Sistema de Inventario de Disfraces

- **Fecha:** 2026-10-08
- **Workspace:** `D:\17.ProyectoSistemaInventario`
- **Repositorio:** https://github.com/disfracesrosaelvira/productos.git (branch `main`)
- **Frontend (deploy):** https://disfracesrosaelvira.github.io/productos/
- **Backend (deploy):** https://productos-production-8443.up.railway.app
- **Base de datos:** Supabase (project ref `zlcjzgpcswigxulsplpp`)

> Nota: este archivo es un resumen para retomar el trabajo. No contiene claves ni contraseñas
> (viven en los `.env`, que están ignorados por git).

---

## Contexto técnico
- **Frontend:** Svelte 5 + Vite + Tailwind, en `inventario-frontend/`.
- **Backend:** Fastify + `@supabase/supabase-js`, en `inventario-backend/`.
- **Auth:** Supabase Auth (correo + contraseña) + tabla `profiles` (perfil/rol/estado).
- **Deploy:** push a `main` → GitHub Actions publica frontend en GitHub Pages; backend en Railway.
- **`_referencias/`:** carpeta de otros proyectos, ignorada por git (NO se sube).

---

## Trabajo realizado en esta sesión

### 1. Movimientos de stock (kardex)
- Nueva tabla `stock_movements` con `tipo_movimiento`, `cantidad_movimiento` (con signo),
  `fecha_movimiento`, `referencia`, `user_id`.
- Triggers en `sale_items`: **Venta** (INSERT, cantidad negativa) y **Devolucion** (DELETE).
- Movimientos manuales (**Entrada/Salida**) registrados por el backend al crear/ajustar stock.
- Backend: `services/movementService.js`, `routes/movements.js` (`GET /movements`).
- Frontend: sección "Movimientos de stock" en `Detalle.svelte`.

### 2. Editar producto — stock inline
- `Editar.svelte` ahora carga las variantes existentes y permite editar **solo el stock**
  con un ícono ✏️ por fila (`PATCH /variants/:id/stock`).

### 3. Detalle — género/tela sin redundancia
- Si todas las variantes comparten género/tela, se muestran una vez como subtítulo
  (`Niña · tela raso`) y se ocultan esas columnas de la tabla.

### 4. Catálogo — autocompletado
- `Catalogo.svelte`: lista desplegable al escribir, navegable con ↑/↓, Enter/clic selecciona
  (abre el detalle); Esc cierra.

### 5. Tela como lista fija
- En nuevo/editar producto, la tela pasó de texto libre a **lista fija opcional**:
  Polinan, Poliestress, Poliestress forrado, Polar, Alicrado, Raso, Látex, Sermat.

### 6. Módulo Usuarios y Roles
- Botón **hamburguesa ☰** a la izquierda del logo en `Nav.svelte`.
- Panel lateral `UsuariosDrawer.svelte` con pestañas **Usuarios** y **Roles**.
- Backend: `routes/usuarios.js` (`/usuarios`) y `routes/roles.js` (`/roles`); contraseñas
  vía Supabase Auth (bcrypt interno). Gestión **solo admin** (`requireAdmin`).
- `profiles` es la fuente única de usuario; la tabla `usuario` quedó obsoleta (se mantiene por decisión).

### 7. Unificación de identidad en `profiles`
- `profiles` ahora tiene `estado` (1 activo / 0 inactivo) y `fecha_eliminacion`.
- Check de `role` ampliado a `admin`, `supervisor`, `vendedor` + FK a `rol(nombre)`.
- `requireAuth` bloquea usuarios inactivos; `requireAdmin` protege la gestión de usuarios/roles.
- Frontend: `lib/perfil.svelte.js` carga nombre/rol/permisos; el Nav muestra nombre+rol,
  filtra menús por permisos y muestra el ☰ solo al admin.

---

## Migraciones SQL aplicadas (en Supabase → SQL Editor)
1. `db/migrations/20261008000001_stock_movements.sql`
2. `db/migrations/20261008000002_usuarios_roles.sql`
3. `db/migrations/20261008000003_unificar_usuarios_profiles.sql`

---

## Cuentas y roles (en `profiles`)
| Correo | Nombre | Rol | Estado |
|---|---|---|---|
| yesin.camarena@gmail.com | yesin.camarena | admin | activo |
| corp.dayamo@gmail.com | boris.camarena | supervisor | activo |
| elvira.comr@gmail.com | rosa.elvira | vendedor | activo |
| disfraces.rosaelvira@gmail.com | — | vendedor | inactivo + baneado en Auth |

- Las contraseñas se conservan (cada quien con la suya, vía Supabase Auth).
- Roles base (tabla `rol`) con permisos por menú: admin (todo), supervisor
  (catalogo/ventas/reportes), vendedor (catalogo/ventas).

---

## Cómo levantar en local
- Backend: `cd inventario-backend` → `npm install` → `npm start` (puerto 3000; usa `.env`).
- Frontend: `cd inventario-frontend` → `npm install` → `npm run dev` (Vite, puerto 5173).
- El frontend usa `VITE_API_URL=http://localhost:3000` en local.

---

## Estado de git / deploy
- Último commit: `8bebd7c` — "feat(inventario): movimientos de stock, modulo usuarios/roles
  y mejoras de catalogo/edicion" (pusheado a `main`).
- Workflow "Deploy frontend a GitHub Pages": **success** para `8bebd7c`.
- Backend Railway verificado con las rutas nuevas (`/movements` 200, `/roles` y `/usuarios` 401).

---

## Pendientes / notas al retomar
- `docs/Documentacion_App_Backus_Merch.docx` y `scripts/generar_documento_merch.py`
  quedaron **sin commitear** (son del proyecto merch, ajeno al inventario).
- Eliminación de `MockupInteractivoHTML.html` quedó sin confirmar / sin commitear.
- La tabla `usuario` (version anterior) se dejó intacta como respaldo; ya no se usa.
- `bcryptjs` quedó como dependencia del backend aunque ya no se usa (Auth maneja el hash).
