# Despliegue de emergencia en Hetzner (Docker, sin dominio)

Esto es un despliegue **temporal** para poder presentar el proyecto. El despliegue
definitivo 24/7 va a ser la máquina Windows + IIS/servicio de Windows documentada en
`DEPLOY.md` (frontend) y el `DEPLOY.md` del backend — cuando esa máquina esté lista,
esto se da de baja.

Sirve todo por **HTTP plano sobre la IP pública** (sin dominio, sin HTTPS) — aceptable
para una demo corta, no para producción real con datos de pacientes.

## Prerrequisitos en el servidor

- Docker + Docker Compose v2 instalados (`docker compose version` debe responder).
- Puertos abiertos en el firewall: `8081` (frontend web) y `5054` (API, para que el
  APK de las tablets pueda llegar a ella):
  ```bash
  sudo ufw allow 8081/tcp
  sudo ufw allow 5054/tcp
  ```
  El frontend se publica en `8081` (no `80`) porque en un servidor compartido con otros
  proyectos `80`/`8080`/`8000` suelen estar ocupados — revisa con `sudo ss -tlnp` antes
  de asumir que un puerto está libre, y ajusta el mapeo en `docker-compose.yml`
  (`ports: - "8081:80"` bajo el servicio `frontend`) si hace falta otro.
- Los dos repos clonados **como carpetas hermanas**, igual que en desarrollo:
  ```
  algún-directorio/
    Fronted_App_Bomberos/
    ProyectBomberos_Backend/
  ```
  (el `docker-compose.yml` referencia al backend como `../ProyectBomberos_Backend` — si
  la estructura de carpetas es distinta, ajusta esa ruta en `docker-compose.yml`.)

## Pasos

1. **Clonar ambos repos** en el servidor, uno al lado del otro:
   ```bash
   git clone <url-frontend> Fronted_App_Bomberos
   git clone <url-backend> ProyectBomberos_Backend
   ```

2. **Configurar secretos**, desde `Fronted_App_Bomberos/`:
   ```bash
   cp .env.docker.example .env.docker
   nano .env.docker
   ```
   Completa:
   - `SERVER_IP` → la IP pública real del servidor (ej. `94.130.182.254`).
   - `MSSQL_SA_PASSWORD` → contraseña fuerte (SQL Server exige mayúsculas, minúsculas,
     números y símbolos, mínimo 8 caracteres).
   - `JWT_SECRET_KEY` → cualquier string aleatorio largo. Generar uno:
     ```bash
     openssl rand -base64 48
     ```

3. **Levantar el stack** (SQL Server, API, frontend):
   ```bash
   docker compose --env-file .env.docker up -d --build db backend frontend
   ```
   La primera vez tarda unos minutos (build de ambas imágenes + arranque de SQL Server).
   Verifica que los tres contenedores estén `Up`:
   ```bash
   docker compose ps
   ```

4. **Aplicar las migraciones** de base de datos (una sola vez, y de nuevo cada vez que
   el backend traiga migraciones nuevas):
   ```bash
   docker compose --env-file .env.docker --profile tools run --rm migrate
   ```
   Esto crea el schema completo en la base `bd_bomberos` dentro del contenedor `db`.

5. **Sembrar usuarios de prueba** (opcional, para poder loguearte en la demo). El
   `DbSeeder` automático solo corre en `Development`, así que en este stack (que corre
   en `Production`) la base queda vacía — puedes correr `seed_local_users.sql` a mano
   contra el contenedor `db`. Nota el `-T` en `exec` — sin eso, `docker compose exec`
   asigna una pseudo-terminal que choca con redirigir el archivo por stdin:
   ```bash
   docker compose --env-file .env.docker exec -T db /opt/mssql-tools18/bin/sqlcmd \
     -C -S localhost -U sa -P "<tu MSSQL_SA_PASSWORD>" -d bd_bomberos \
     -f 65001 -i /dev/stdin < ../ProyectBomberos_Backend/seed_local_users.sql
   ```
   (si `mssql-tools18` no existe en esa ruta dentro del contenedor, prueba
   `/opt/mssql-tools/bin/sqlcmd` — depende de la versión exacta de la imagen).
   Password para las 7 cuentas sembradas: `Smab2026!`.

6. **Verificar**:
   - Backend: `curl http://<SERVER_IP>:5054/api/institutions` (debe dar 401, no un
     error de conexión — 401 confirma que el servidor está vivo y protegiendo la ruta).
   - Frontend web: abre `http://<SERVER_IP>:8081` en el navegador.

## APK para tablets

Al compilar el APK, `EXPO_PUBLIC_API_URL` debe apuntar a esta IP:
```bash
EXPO_PUBLIC_API_URL=http://<SERVER_IP>:5054/api npx expo run:android
# o con EAS Build, pasando la misma variable en el perfil de build
```

`app.json` ya tiene `"usesCleartextTraffic": true` agregado para este despliegue de
emergencia — permite que el APK hable HTTP plano con esa IP. **Recordar revertir esto
(o acotarlo solo a la IP del servidor vía network security config) una vez que el
despliegue real tenga HTTPS**, para no dejar la app aceptando cleartext en producción.

## Actualizar a una versión nueva

```bash
git pull   # en ambos repos
docker compose --env-file .env.docker up -d --build backend frontend
docker compose --env-file .env.docker --profile tools run --rm migrate   # si hay migraciones nuevas
```

## Apagar todo

```bash
docker compose --env-file .env.docker down          # conserva los datos (volumen mssql_data)
docker compose --env-file .env.docker down -v        # borra también los datos
```
