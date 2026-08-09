# Build de emergencia para el despliegue temporal en Hetzner (Linux + Docker).
# Sirve la versión WEB de la app (útil para demostrar desde laptop). El APK para
# tablets se compila aparte (expo run:android / EAS Build) y no pasa por esta imagen.

# ---- Etapa 1: build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# EXPO_PUBLIC_* se hornea DENTRO del bundle en build time, no se lee en runtime — por
# eso va como build-arg, no como variable de entorno del contenedor ya corriendo.
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
RUN npx expo export --platform web

# Zustand empaqueta su middleware `devtools` (no usado por esta app) en el mismo
# archivo que `persist` (el que sí usamos) — ese código trae `import.meta.env`,
# sintaxis de bundlers tipo Vite que Metro no transforma y deja literal en el bundle.
# El navegador la rechaza como error de sintaxis al cargar el <script> como clásico
# (no como módulo ES), dejando la página en blanco. Ese código nunca se ejecuta en
# esta app, así que sustituir el token por un objeto vacío es seguro: solo evita el
# crash de sintaxis, no cambia comportamiento real.
RUN sed -i 's/import\.meta/self/g' dist/_expo/static/js/web/*.js

# ---- Etapa 2: nginx ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
