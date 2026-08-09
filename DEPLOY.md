# Despliegue en el servidor (Windows + IIS)

Esta guía es para cuando ya tengan la máquina que va a quedar siempre prendida como
servidor. El desarrollo local (`npm run web`, `npm start` + Expo Go, `.env` apuntando a
tu backend local) **no cambia** — `.env.production` es un archivo nuevo y separado que
solo se usa cuando se genera el build de producción (`expo export`), nunca en
`npm start`/`npm run web`.

> Nota: esto publica la **versión web** de la app (la que corre en cualquier
> navegador). La tablet/celular pueden seguir usando Expo Go apuntado al servidor si
> lo prefieren — para eso solo hace falta que `.env` (no `.env.production`) del
> desarrollo apunte a la IP del servidor en vez de a tu máquina local, igual que hoy
> apunta a tu propia IP.

## Prerrequisitos en el servidor

1. **Node.js** (versión 20 o superior) — para poder correr `npx expo export`.
2. **IIS** con el rol "Servidor web (IIS)" instalado (`Panel de control > Activar o
   desactivar las características de Windows`).
3. **Módulo URL Rewrite de IIS** — no viene instalado por defecto, hace falta para que
   la navegación de React funcione al refrescar la página en cualquier ruta que no sea
   la raíz. Descargar: https://www.iis.net/downloads/microsoft/url-rewrite

## Primer despliegue

1. Copia el repo `Fronted_App_Bomberos` al servidor (o publícalo desde tu máquina de
   desarrollo y copia solo la carpeta `dist` resultante — no hace falta que el
   servidor tenga el repo completo si prefieren mantenerlo simple).
2. **Edita `.env.production`** en la raíz del repo: reemplaza
   `CAMBIAR-ESTO-a-la-IP-o-dominio-del-servidor` por la URL real donde vaya a quedar
   corriendo el backend (ver `../ProyectBomberos_Backend/DEPLOY.md`) — por ejemplo
   `http://192.168.1.50:5054/api` si el backend queda en esa IP con el puerto de
   siempre.
3. En IIS Manager, crea un sitio nuevo (o usa uno existente) y anota su **ruta física**
   (ej. `C:\inetpub\wwwroot\bomberos`).
4. Genera el build y cópialo directo a esa ruta:
   ```powershell
   .\deploy\publish.ps1 -SitePath 'C:\inetpub\wwwroot\bomberos'
   ```
5. En IIS, confirma que el sitio apunta a esa carpeta y tiene un binding (puerto 80,
   o el que prefieran) — `dist\web.config` (incluido en el build) ya trae la regla de
   reescritura para que la navegación de la app funcione al refrescar cualquier
   página.
6. Abre el sitio desde un navegador en la red y confirma que carga y que el login
   funciona (si falla el login pero la página carga, casi seguro es CORS — revisa que
   `Cors:AllowedOrigins` en el backend tenga exactamente esta URL, ver su DEPLOY.md).

## Actualizar a una versión nueva

1. `git pull` (o copiar los archivos nuevos) — `.env.production` está en git (no es
   secreto, ver el comentario dentro del archivo), así que si ya lo habías editado en
   el servidor, un `git pull` normal lo puede sobreescribir si también cambió en el
   repo. Revisa el diff antes de hacer pull si no estás seguro.
2. ```powershell
   .\deploy\publish.ps1 -SitePath 'C:\inetpub\wwwroot\bomberos'
   ```
3. Nada más — IIS sirve los archivos estáticos directo, no hay servicio que reiniciar.

## Cosas a tener en cuenta más adelante

- **HTTPS**: igual que el backend, esto corre en `http://` plano por ahora. Si el
  sitio va a ser accesible fuera de la red interna, conviene certificado TLS.
- **Caché del navegador**: los archivos JS que genera `expo export` llevan un hash en
  el nombre (ej. `index-abc123.js`), así que actualizar y volver a copiar a IIS es
  seguro — los navegadores no van a servir una versión vieja cacheada por accidente.
