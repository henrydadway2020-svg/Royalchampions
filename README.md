# Royal Rumble · Pokémon Champions

Torneo doubles, eliminación directa 64→32→16→8→4→2, con registro público
en línea y panel de administración para el bracket.

## Estructura

```
index.html          → página pública de registro (para los jugadores)
admin.html           → panel del organizador (armas el bracket) — NO lo compartas
functions/api/
  register.js         → guarda un registro nuevo
  players.js           → lista los registros (usada por index.html y admin.html)
  lock.js               → abre/cierra el registro (solo admin)
  reset.js               → borra todos los registros del servidor (solo admin)
```

El bracket vive solo en el navegador donde uses `admin.html` (con respaldo
en JSON descargable). Los **registros de jugadores** viven en Cloudflare KV,
así que cualquier persona puede registrarse desde su propio celular y a ti
te va a ir cayendo la lista sola — solo entras a `admin.html` y le das
"Sincronizar".

## Paso a paso en Cloudflare

### 1. Sube esta carpeta a GitHub
Como ya tienes plan de subirlo a GitHub: crea el repo, sube todo el contenido
de esta carpeta tal cual (respetando la carpeta `functions/`).

### 2. Conecta el repo en Cloudflare Pages
1. Entra a **dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git**.
2. Elige tu repositorio.
3. Framework preset: **None**. Build command: (vacío). Output directory: `/`.
4. Deploy. Cloudflare va a detectar automáticamente la carpeta `functions/`
   como Pages Functions — no necesitas configurar nada extra para eso.

### 3. Crea el namespace de KV (la "base de datos")
1. **Workers & Pages → KV** (en el menú lateral) → **Create namespace**.
2. Nómbralo, por ejemplo, `rumble-kv`.

### 4. Conecta el KV a tu proyecto de Pages
1. Entra a tu proyecto de Pages → **Settings → Functions → KV namespace bindings**.
2. Agrega un binding:
   - **Variable name:** `RUMBLE_KV`   ⚠️ debe llamarse exactamente así.
   - **KV namespace:** el que creaste (`rumble-kv`).
3. Guarda para **Production** (y repite para **Preview** si vas a usar ramas de prueba).

### 5. Crea tu token de administrador
1. En el mismo proyecto → **Settings → Environment variables**.
2. Agrega una variable:
   - **Name:** `RUMBLE_ADMIN_TOKEN`
   - **Value:** cualquier contraseña larga que solo tú conozcas (ej. `torneo-2026-XyZ99!`).
   - Márcala como **Encrypt** (secreta) si te lo ofrece.
3. Guarda para Production.

### 6. Vuelve a desplegar
Los bindings y variables de entorno solo aplican a partir del **próximo
deploy**. Ve a **Deployments** y dale **Retry deployment** (o haz un nuevo
commit) para que tome la configuración.

### 7. Úsalo
- Comparte la URL raíz de tu proyecto (`https://tu-proyecto.pages.dev/`) con
  los jugadores — esa es `index.html`, el registro público.
- Tú entra a `https://tu-proyecto.pages.dev/admin.html` (no lo publiques).
  Ahí:
  1. Pega tu token de administrador en la pestaña **Datos / Servidor** y
     guárdalo.
  2. En la pestaña **Registro**, dale **Sincronizar registros desde el
     servidor** cuando quieras traer a los jugadores inscritos.
  3. Cuando el cupo esté completo (o decidas cerrarlo), dale **Cerrar
     registro** para que nadie más se registre.
  4. Ve a **Bracket** y genera el bracket con la lista sincronizada.
  5. Ve marcando ganadores ronda por ronda; puedes corregir cualquier
     resultado mientras esa ronda no haya "avanzado" (y con "Reabrir
     ronda" incluso después, si hace falta).
  6. Descarga el JSON del torneo cada cierto tiempo desde **Datos /
     Servidor** como respaldo (puedes subir ese archivo a tu repo de
     GitHub si quieres dejar constancia histórica).

## Notas

- El límite de 64 jugadores y el bloqueo por nick duplicado se validan en
  el servidor (`register.js`), no solo en el navegador — así nadie se
  puede registrar dos veces ni pasarse del cupo aunque manipule la página.
- Hay un campo "honeypot" oculto en el formulario público para filtrar
  bots simples.
- El plan gratuito de Cloudflare KV alcanza sobradamente para un torneo de
  64 jugadores (miles de lecturas/escrituras gratis al día).
- Si algún día quieres reiniciar el torneo desde cero, usa **Borrar
  registros del servidor** (pide el token) y **Borrar todo en este
  navegador** para limpiar el bracket local.
