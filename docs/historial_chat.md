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

### 8. Tallas múltiples con precio y cantidad por talla
- Nueva columna `variants.price` (migración 04). Si es NULL se usa `products.price`.
- `Editar.svelte`: en nuevo/editar producto se eligen **varias tallas** (chips) y por cada una
  se define **Precio** y **Cantidad**; datos compartidos (nombre, categoría, género, tela, fotos)
  se llenan una sola vez. Botones "Seleccionar todas", "Usar precio base en todas",
  "Cantidad para todas".
- La tabla de variantes en edición permite editar **precio y stock** por talla (✏️).
- `Detalle.svelte`: columna **Precio** por talla. `Ventas.svelte`: usa el precio de la variante.

### 9. Categorías reemplazadas (8)
- La tabla `categories` quedó con solo 8: **Halloween, Fantasía Series Películas, Profesiones,
  Canción Criolla, Princesas, Animales, Accesorios, Anime Cosplay**.
- Los 21 productos se reasignaron a la más cercana (Halloween 5, Profesiones 1,
  Fantasía Series Películas 15). Ninguno quedó sin categoría.
- Seed actualizado en `db/supabase_schema.sql`.

### 10. Ajustes de UI para móvil (sin scroll horizontal)
- **Barra de navegación (`Nav.svelte`):** se quitó el logo/texto "👗 Inventario"; padding y gaps
  reducidos en móvil; la barra usa `flex-wrap` y `whitespace-nowrap`, así se reacomoda y no
  desborda (entran ☰, Catálogo, Ventas, Reportes, rol y Salir).
- **Editar producto → "Tallas / variantes (stock y precio)":** se reemplazó la tabla de 7 columnas
  por **tarjetas apilables**. Al pulsar ✏️ la tarjeta se expande en vertical (Precio, Stock,
  Guardar/Cancelar) sin desbordar.
- **Alta de producto → tallas seleccionadas:** la tabla Precio/Cantidad se reemplazó por filas
  flexibles que se ajustan al ancho de la pantalla.

### 11. Género
- Selector de género en nuevo/editar producto ahora incluye **Niño** y **Niña** (además de
  Hombre, Mujer, Unisex).
- En el **catálogo** (tarjetas de la pantalla principal) se muestra el **género** debajo del
  nombre y encima de la categoría (se deriva de las variantes; se oculta si no tiene).

### 12. Fotos en Editar — eliminar y reordenar
- `Editar.svelte`: cada foto tiene **✕** para eliminarla y **◀ ▶** para reordenarla; la primera se
  marca como **Principal** (portada del catálogo).
- Backend: `PATCH /products/:id/images` (reordenar) y `DELETE /products/:id/images` (eliminar);
  `services/productService.js` actualiza `position`/`is_primary`.
- **Pendiente:** desplegar el backend en Railway para que estos endpoints (404 en prod) funcionen.

### 13. Documentación Word regenerada
- `scripts/generar_documento.py` actualizado: diagramas ER + `usuarios_roles` + `movimientos`,
  datos de `variants.price`/`stock_movements`/`rol`/`profiles.estado`, endpoints nuevos,
  config de roles, secciones 14 (Usuarios/Roles) y 15 (Movimientos), mockups (catálogo con
  género/autocompletado, alta con tallas múltiples, detalle con precio/movimientos, editar,
  usuarios/roles), anexo de migraciones y nav con hamburguesa.
- Regenerado `docs/Documentacion_Sistema_Inventario_Disfraces.docx`.

### 14. Fondo blanco de fotos (rembg) — 1. Boy_man
- Se instalaron `rembg`, `onnxruntime` y `pillow-heif` (reconocen HEIC).
- 43 carpetas-modelo (1–43) dentro de `D:\Google fotos disfraces\1. Boy_man`.
- Se generaron hasta **3 fotos con fondo blanco por carpeta** (JPG, máx. 2000 px) en
  `D:\Google fotos disfraces\_fondoblanco\1. Boy_man\<carpeta>\`, con `_manifest.csv`
  (precio y tela de referencia). Los originales no se tocaron.
- **Dedupe global (md5):** las fotos repetidas entre carpetas se asignan a la de menor número.
  5↔7, 7↔16 y 16↔31 compartían fotos; **31 (Irospiderman)** quedó sin fotos propias → omitida.
- 113 fotos generadas; con menos de 3 fotos por falta de originales: 23, 26, 27, 32, 36, 37, 38, 41.
- Scripts usados (en temp): `C:\Users\YESIN\AppData\Local\Temp\opencode\fondo_blanco_boyman.py`
  y `plan_boyman.py`.

### 15. Carga de 22 productos nuevos (1. Boy_man)
- Plan: `data/boyman_plan.csv` (43 carpetas → 22 NUEVO / 21 OMITIR) y `data/metadatos_boyman.csv`.
- Reglas: nombre = primeras palabras (sin tela, precio, talla ni detalles); precio de la carpeta o
  **50**; tela inferida o **Polinan**; tallas **4;6;8**; stock **3** por talla; categorías asignadas.
- Cargados con `scripts/cargar_supabase.py` (comprime a **WebP ≤1600 px, q80** → 31–58 KB por foto).
- Catálogo pasó de **124 → 146** productos (66 variantes y 56 fotos nuevas).
- Omitidos por ya existir: Bugui Bugui, Capitán América, Gekko, Superman, Spiderman, Batman, Flash,
  Chapulín, Sonic, Payaso IT, Mario Bros, Planta vs Zombi, Mariachi, Juego de Calamar, Luigui, etc.
- `data/catalogo_actual.csv`: lista de referencia de los 146 productos (categoría, precio, var, img).

### 16. Fix del buscador del catálogo
- Síntoma: al tipear "Ñoño", "Power Ranger", "Principe", etc. no salían sugerencias.
- Causa: el autocompletado filtraba **solo los 100 productos cargados** (había 146) y era sensible a
  tildes/ñ. El backend sí buscaba bien (probado en producción).
- Fix en `Catalogo.svelte`: **carga todas las páginas** y filtra localmente **sin tildes/ñ** (NFD),
  tanto en sugerencias como en la grilla. Build OK; el frontend se despliega solo con el push.

### 17. Catálogo público (modo lectura) en /publico
- Segunda build del mismo frontend con `VITE_MODO_PUBLICO=true` y `VITE_BASE=/productos/publico/`.
  El workflow compila el staff (`/productos/`) y el público, y copia el público a `dist/publico/`.
- Público: arranca en **Catálogo sin login**; oculta “+ Nuevo producto”, Ventas, Reportes y usuarios;
  el Detalle oculta Editar/Eliminar y Movimientos; botón **“Ingresar”** lleva al login del staff;
  las rutas no permitidas redirigen al catálogo. No usa Realtime ni sesión (lee por el backend).
- Config en `src/lib/config.js` (`MODO_PUBLICO`, `URL_STAFF`).
- URL pública: **https://disfracesrosaelvira.github.io/productos/publico/**

### 18. Endurecimiento de seguridad (gratuito)
- Se detectó que **`stock_movements` era legible con la anon key** (451 filas). Se creó y aplicó
  `db/migrations/20261029000001_rls_stock_movements.sql`: ahora devuelve **0 filas** sin sesión.
- `GET /movements` ahora exige `requireAuth` (**401** sin token).
- **Rate limit** 200 req/min por IP (`@fastify/rate-limit`).
- **CORS** restringido a `https://disfracesrosaelvira.github.io` + `localhost` (bloquea otros orígenes).
- **`noindex, nofollow`** + `robots.txt` (evita indexación; no bloquea el acceso).
- Auditoría con anon key: `products`, `variants`, `product_images`, `categories` legibles (catálogo
  público); `profiles`, `sales`, `sale_items`, `rol`, `usuario`, `stock_movements` = 0 filas.
- Nota: la anon key es pública por diseño; la seguridad real es **RLS + JWT**. El catálogo sigue
  visible con el link; para restringir el acceso habría que usar **Cloudflare Access** (gratis).
- Backend redeployado en Railway (verificado: `/movements` 401, `x-ratelimit-limit: 200`, CORS OK,
  `PATCH /products/:id/images` 401 → endpoint nuevo activo).

### 19. Título del modo público
- **Público:** “Disfraces Rosa Elvira”. **Interno:** “Sistema de Inventario de Disfraces”.
- Se define en `vite.config.js` (`transformIndexHtml`) solo para el build público (sin parpadeo).

### 20. Documentación Word (actualización)
- `scripts/generar_documento.py`: estructura real de backend/frontend, sección **10.4 Búsqueda y
  filtros del catálogo**, **Anexo G** (carga masiva y preparación de fotos). Regenerado el `.docx`.
- (Pendiente commitear el `.docx` y el script.)

### Nota: expiración de token
- Síntoma: mensajes rojos "token inválido o expirado" en Usuarios/Roles, Ventas y Reportes.
- Causa: la sesión del navegador tenía el token vencido. **Solución:** cerrar sesión y reingresar.
- Se hizo un ajuste de código para auto-refrescar el token, pero se **revirtió** (el usuario lo
  resolvió con re-login) y no se dejó cambio.

---

## Migraciones SQL aplicadas (en Supabase → SQL Editor)
1. `db/migrations/20261008000001_stock_movements.sql`
2. `db/migrations/20261008000002_usuarios_roles.sql`
3. `db/migrations/20261008000003_unificar_usuarios_profiles.sql`
4. `db/migrations/20261008000004_variants_precio.sql`

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
- Commits pusheados a `main`:
  - `8bebd7c` movimientos de stock + modulo usuarios/roles + mejoras catalogo/edicion
  - `bd6960e` historial de sesion
  - `f6efb7d` tallas multiples con precio y cantidad por talla
  - `80d925c` seed de categorias a las 8 nuevas
  - `a375b5c` historial de sesion (actualizado)
  - `8a28e00` nav responsive sin logo (sin scroll horizontal en movil)
  - `0c20be1` variantes y tallas en tarjetas apilables (sin desborde en movil)
  - `8598c25` historial (ajustes UI movil)
  - `745b470` agregar Nino y Nina al selector de genero
  - `58a219d` mostrar genero en las tarjetas del catalogo
  - `d61372b` historial (genero en catalogo)
  - `68dd210` eliminar y reordenar fotos en editar producto
  - `84722e5` documentacion del sistema actualizada (roles, movimientos, tallas con precio, fotos)
  - `77d1b64` historial para retomar (estado y siguiente paso)
  - `fc5768e` plan y metadatos de carga (22 productos de 1. Boy_man)
  - `1e876fc` fix buscador del catalogo (todos los productos, sin tildes/ñ)
  - `abbd634` lista de referencia del catalogo (146 productos)
  - `0eb8d6c` historial (fondo blanco, carga 22 productos, fix buscador)
  - `3e7c265` catalogo publico sin login en /publico (solo lectura)
  - `410e182` exigir autenticacion en GET /movements
  - `798f287` seguridad: noindex/robots, rate limit, CORS y RLS de stock_movements
  - `4a63f59` titulo "Disfraces Rosa Elvira" en el modo publico
- **Deploy frontend:** `push` a `main` → GitHub Actions publica en GitHub Pages (staff y público).
- **Deploy backend (Railway):** NO es automatico. Ya se redesplegó y se verificó en producción:
  `/movements` 401, rate limit activo (200/min), CORS restringido y `PATCH/DELETE /products/:id/images`
  responden 401 (endpoint nuevo activo).
- **URLs:** staff `https://disfracesrosaelvira.github.io/productos/` · público
  `https://disfracesrosaelvira.github.io/productos/publico/`.

---

## Estado actual / siguiente paso al regresar
- Todo el trabajo está **commiteado y pusheado** a `main` (último commit de código: `4a63f59`;
  este historial se commitea aparte).
- Catálogo con **146 productos**; 22 cargados desde `1. Boy_man`.
- **Modo público** activo y endurecido en `…/productos/publico/` (titulo "Disfraces Rosa Elvira").
- **Seguridad verificada:** movimientos ya no legibles con anon key; rate limit, CORS, noindex y
  `/movements` protegido. Backend redeployado en Railway.
- Buscador del catálogo corregido (carga todos y filtra sin tildes/ñ).
- **Siguiente grupo previsto:** repetir el flujo (fondo blanco + dedupe + plan + carga) con los demás
  grupos enumerados (`2.Girl_woman`, `3.Hombre_adulto`, `4.Mujer_adulta`, `5.Bebe_unisex`, etc.).
- Hay **60 productos sin categoría** en el catálogo (pendiente de clasificar).
- Opcional: poner **Cloudflare Access** delante del público si se quiere restringir el acceso
  (el catálogo hoy es visible con el link; `noindex` solo evita indexación).

## Pendientes / notas al retomar
- `docs/Documentacion_Sistema_Inventario_Disfraces.docx` y `scripts/generar_documento.py`
  quedaron **sin commitear** (actualización del Word con estructura, 10.4 y Anexo G).
- `docs/Documentacion_App_Backus_Merch.docx` y `scripts/generar_documento_merch.py`
  quedaron **sin commitear** (son del proyecto merch, ajeno al inventario).
- La tabla `usuario` (version anterior) se dejó intacta como respaldo; ya no se usa.
- `bcryptjs` quedó como dependencia del backend aunque ya no se usa (Auth maneja el hash).
- Recordatorio: cambios de backend requieren redeploy manual en Railway; los de frontend
  se publican solos con push.
