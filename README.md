# FireHealth App — SMAB Frontend

Sistema de Monitoreo y Análisis de Bomberos. Plataforma web y móvil para evaluación médica y monitoreo fisiológico de bomberos en entrenamiento (Ecuador y Francia), construida con **Expo (SDK 54)**, **React 19** y **React Native 0.81**. Corre en Android, iOS y web (`react-native-web`) desde un único código base.

---

## Requisitos previos

Instala esto antes de empezar:

- [Node.js 20+](https://nodejs.org) (requerido por las herramientas de build de Expo/Metro)
- [Git](https://git-scm.com)
- [Expo Go](https://expo.dev/client) en tu celular (Android o iOS)

---

## Setup inicial (solo la primera vez)

### 1. Clona el repositorio

```bash
git clone https://github.com/nhn2004/Fronted_App_Bomberos.git
cd Fronted_App_Bomberos
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Crea tu archivo de entorno

```bash
cp .env.example .env
```

Abre `.env` y coloca la URL del backend cuando el equipo backend te la comparta:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

> Usa la IP local de quien corra el backend, no `localhost`, para que funcione desde el celular.

### 4. Corre la app

```bash
npm start
```

Luego:
- **Celular**: escanea el QR con la app Expo Go
- **Navegador**: presiona `w`
- **Android emulador**: presiona `a`
- **iOS simulador**: presiona `i`

### Scripts disponibles

| Script | Comando | Uso |
|---|---|---|
| `npm start` | `expo start` | Levanta Metro y el menú de Expo (QR, web, emuladores) |
| `npm run android` | `expo run:android` | Compila y corre en un emulador/dispositivo Android nativo |
| `npm run ios` | `expo run:ios` | Compila y corre en un simulador/dispositivo iOS nativo |
| `npm run web` | `expo start --web` | Levanta directamente en el navegador |

---

## Integración Continua (CI)

El repositorio tiene un workflow de GitHub Actions en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) que corre automáticamente en cada `push` y `pull_request` hacia `main` y hacia ramas `feature/**`.

**Qué valida en cada ejecución:**

1. **Instala dependencias** con `npm ci` (usa `package-lock.json`, instalación limpia y reproducible).
2. **Lint** — corre `npm run lint` solo si ese script existe en `package.json`; si no existe, lo omite sin romper el pipeline. Lo mismo aplica para `npm test`.
3. **Build de validación** — corre `npx expo export --platform web`, que compila todo el bundle de la app para web. Si hay un error de sintaxis, un import roto, o cualquier problema que impida compilar, el pipeline falla aquí.

No despliega nada: solo confirma que el código compila correctamente antes de hacer merge.

### Cómo verificar que el CI corrió bien

1. Haz push a tu rama `feature/*` o abre un Pull Request hacia `main`.
2. Ve a la pestaña **Actions** del repositorio en GitHub — debe aparecer un run llamado **CI**.
3. En un PR, el resultado (✅ o ❌) aparece directamente en la conversación del PR, como check requerido antes de mergear.
4. Si el job falla, revisa el log del step que truena — usualmente apunta justo al archivo y línea del error de compilación.

> Nota: corre en Node 20 en CI (`actions/setup-node`). Si en tu máquina tienes una versión distinta y algo se comporta diferente, prioriza lo que diga el pipeline.

---

## Flujo de trabajo con Git

### Trae los cambios del main a tu rama (haz esto siempre antes de empezar a trabajar)

```bash
git checkout feature/tu-rama
git fetch origin
git merge origin/main
```

### Crea tu rama si aún no existe

```bash
git checkout main
git pull origin main
git checkout -b feature/nombre-de-tu-rama
```

### Guardar tu trabajo

```bash
git add .
git commit -m "descripcion de lo que hiciste"
git push origin feature/tu-rama
```

### Cuando termines una funcionalidad

Abre un Pull Request en GitHub desde tu rama hacia `main`. No hagas merge directo a `main`. El PR debe pasar el check de CI antes de mergear.

---

## Estructura del proyecto

```
src/
├── constants/              # Valores globales que todos usan
│   ├── roles.js             # Los 7 roles del sistema
│   ├── colors.js            # Paleta de colores (tema fuego)
│   ├── routes.js            # Nombres de todas las rutas/pantallas
│   └── index.js
│
├── store/                   # Estado global (Zustand)
│   ├── authStore.js          # Usuario, rol, token, isAuthenticated
│   ├── settingsStore.js      # Preferencias: tema, idioma, notificaciones, auto-sync
│   └── index.js
│
├── navigation/
│   ├── index.js              # RootNavigator: stack de auth vs. stack por rol
│   └── guards.js              # Mapa de permisos (PERMISSIONS) y helper can(role, permiso)
│
├── services/
│   ├── api.js                 # Instancia de axios con token automático
│   └── index.js
│
├── hooks/
│   ├── useAuth.js              # Hook principal de autenticación y permisos
│   ├── useOfflineSync.js       # Cola de operaciones cuando no hay internet
│   ├── useAuditTrail.js        # Log de acceso a datos médicos (auditoría)
│   ├── useTheme.js             # Tokens de color light/dark según settingsStore
│   ├── useTranslation.js       # Acceso a STRINGS según el idioma activo
│   └── index.js
│
├── i18n/
│   └── strings.js              # Diccionario es/en de toda la interfaz (chrome de la UI)
│
├── components/               # Componentes UI compartidos
│   ├── MainLayout.js           # Layout con Sidebar + contenido, usado por casi toda pantalla autenticada
│   ├── Sidebar.js              # Navegación lateral (iconos, logout, colapsable)
│   ├── ConfirmDialog.js         # Modal de confirmación genérico
│   ├── Toast.js                 # Notificaciones tipo toast
│   └── index.js
│
├── assets/
│   ├── anatomy/                # Imágenes para el diagrama corporal (evaluación médica)
│   └── people/                  # Avatares / fotos de personas
│
└── screens/
    ├── auth/                    # LoginScreen, ForgotPasswordScreen
    ├── dashboard/                # Un dashboard por rol + componentes (StatCard, WelcomeBanner, ValidationCard, etc.)
    ├── sessions/                  # Listado, detalle y creación de sesiones de entrenamiento (CarouselGrid, AgendaTimeline, FilterTabs)
    ├── resultados/                 # Evaluación médica por pasos: signos vitales, síntomas, nutrición, certificados, diagrama corporal 2D
    ├── schedule/                   # Cronograma mensual de capacitaciones (MonthCalendar, DayAgendaPanel)
    ├── progress/                    # Historial de progreso del bombero (gráficas de síntomas y línea de tiempo)
    ├── people/                       # Gestión de personas / participantes por sesión
    ├── settings/                      # Configuración de la app (tema, idioma, notificaciones)
    ├── profile/                        # Perfil del usuario
    └── researcher/                      # Exportaciones anonimizadas y reportes (investigador)
```

---

## Roles del sistema

Definidos en `src/constants/roles.js`:

| Constante | Label | Descripción |
|---|---|---|
| `SYSTEM_ADMIN` | Administrador del Sistema | Gestión global de usuarios, permisos y auditoría |
| `ADMIN` | Administrador | Crea y gestiona sesiones, invita participantes |
| `FIREFIGHTER_TRAINEE` | Bombero Aspirante | Participa en sesiones, ve sus propios resultados y progreso |
| `CAPACITATOR` | Capacitador | Imparte capacitaciones, gestiona agenda y asistencia |
| `MEDICAL` | Médico | Registra signos vitales, historial médico, evaluaciones y certificados |
| `RESEARCHER` | Investigador | Accede a datos anonimizados, genera reportes estadísticos |
| `FIRE_CHIEF` | Jefe de Bomberos | Gestiona personal (bomberos y capacitadores), crea sesiones |

### Permisos (`src/navigation/guards.js`)

```
createSession          → ADMIN, SYSTEM_ADMIN, CAPACITATOR, FIRE_CHIEF
manageInvitations      → ADMIN, SYSTEM_ADMIN, CAPACITATOR, FIRE_CHIEF
viewAllSessions        → ADMIN, SYSTEM_ADMIN, CAPACITATOR, MEDICAL, RESEARCHER, FIRE_CHIEF
viewOwnSessions        → FIREFIGHTER_TRAINEE
createMedicalRecord    → MEDICAL
readMedicalRecord      → MEDICAL, ADMIN, SYSTEM_ADMIN
readOwnMedicalRecord   → FIREFIGHTER_TRAINEE
manageUsers            → SYSTEM_ADMIN
manageAuditLog         → SYSTEM_ADMIN
exportAnonymizedData   → RESEARCHER, SYSTEM_ADMIN
generateReports        → RESEARCHER, ADMIN, SYSTEM_ADMIN, CAPACITATOR, FIRE_CHIEF
manageFirefighters     → FIRE_CHIEF, ADMIN, SYSTEM_ADMIN
manageCapacitators     → FIRE_CHIEF, ADMIN, SYSTEM_ADMIN
```

```js
import { useAuth } from '../hooks';

const { role, isAuthenticated, can } = useAuth();

if (can('createSession')) {
  // mostrar botón de crear sesión
}
```

---

## Navegación

`src/navigation/index.js` define el `RootNavigator`: si no hay sesión (`isAuthenticated` en `authStore` es `false`) se muestra el `AuthStack` (Login / ForgotPassword); si hay sesión, se monta un `RoleNavigator` cuyas pantallas disponibles varían según el rol (creación de sesión, "Personas", cola de validación, etc.). La mayoría de pantallas se envuelven con `MainLayout` (Sidebar + contenido) mediante el helper `withMainLayout`.

---

## Tema, colores e i18n

### Colores

Definidos en `src/constants/colors.js`. Úsalos siempre desde ahí, nunca pongas colores hardcodeados:

```js
import { COLORS } from '../constants';

COLORS.primary        // #E85D27 — naranja fuego principal
COLORS.background     // #1A1A1A — fondo oscuro
COLORS.textPrimary    // #FFFFFF — texto principal
COLORS.danger         // #D32F2F — alertas críticas
COLORS.success        // #4CAF50 — confirmaciones
```

### Tema claro/oscuro

El modo oscuro vive en `useSettingsStore` (Zustand) y se consume con `useTheme()`, que devuelve el set de tokens (`light`/`dark`) correspondiente — fondo, texto, bordes, badges de estado, etc. Cualquier componente puede llamarlo directo, sin prop drilling:

```js
import { useTheme } from '../hooks';

const theme = useTheme();
// theme.background, theme.textPrimary, theme.badge.success, ...
```

### Internacionalización (i18n)

`src/i18n/strings.js` centraliza los textos de toda la interfaz (menús, títulos, botones, validaciones, mensajes de estado) en español e inglés. El idioma activo también vive en `settingsStore` y se lee con `useTranslation()`:

```js
import { useTranslation } from '../hooks';

const { t } = useTranslation();
t('sidebar.dashboard'); // "Inicio" o "Home" según el idioma
```

> El contenido mock de negocio (nombres de capacitaciones, instructores, direcciones) no se traduce — solo el "chrome" de la UI que controla este código.

---

## Hooks disponibles

### `useAuth()` — el más importante

```js
import { useAuth } from '../hooks';

const { user, role, isAuthenticated, login, logout, can } = useAuth();

can('createSession')   // true/false según el rol
```

### `useAuditTrail(resourceType)` — obligatorio en pantallas médicas

```js
import { useAuditTrail } from '../hooks';

const { logAccess } = useAuditTrail('MEDICAL_RECORD');

useEffect(() => {
  logAccess(recordId, 'READ');
}, []);
```

### `useOfflineSync()` — para cuando no hay internet

```js
import { useOfflineSync } from '../hooks';

const { enqueue } = useOfflineSync();

// Si no hay internet, encola la operación:
enqueue({ endpoint: '/vitals', method: 'POST', payload: data });
```

### `useTheme()` — tokens de color según modo claro/oscuro

```js
import { useTheme } from '../hooks';

const theme = useTheme();
```

### `useTranslation()` — textos según idioma activo

```js
import { useTranslation } from '../hooks';

const { t } = useTranslation();
```

---

## Módulos por pantalla

| Módulo (`src/screens/...`) | Qué hace | Componentes propios destacados |
|---|---|---|
| `auth/` | Login con token de invitación, recuperación de contraseña | — |
| `dashboard/` | Un dashboard por rol con banner de bienvenida, estadísticas e invitaciones pendientes | `WelcomeBanner`, `StatCard`, `PerformanceStatCard`, `InvitationCard`, `ValidationCard`, `WeekScheduleCard`, `ActivityRow` |
| `sessions/` | Listado, filtro, detalle y creación de sesiones de entrenamiento | `SessionCard`, `FilterTabs`, `AgendaTimeline`, `CarouselGrid`, `TrainingCenterSidebar` |
| `resultados/` | Evaluación médica por pasos (signos vitales → síntomas → nutrición → certificados) y resultados individuales/generales | `Step1SignosVitales`...`Step4Certificados`, `StepProgress`, `BodyDiagram2D` |
| `schedule/` | Cronograma mensual de capacitaciones | `MonthCalendar`, `DayAgendaPanel` |
| `progress/` | Historial de progreso del bombero (síntomas y evolución en el tiempo) | `InteractiveLineChart`, `SymptomFrequencyChart`, `SymptomHistoryItem` |
| `people/` | Gestión de personas/participantes asociados a una sesión | — |
| `settings/` | Preferencias de la app: tema, idioma, notificaciones, auto-sync | `SettingsCard`, `ToggleRow`, `FormField` |
| `profile/` | Perfil del usuario autenticado | — |
| `researcher/` | Exportaciones anonimizadas y reportes estadísticos | — |

---

## Reglas que todos deben seguir

1. **Nunca hardcodear colores** — usa siempre `COLORS.algo` de `constants/colors.js`, o `useTheme()` si el componente debe soportar modo claro/oscuro.
2. **Nunca hardcodear el rol** — léelo siempre desde `useAuth()`.
3. **Nunca hardcodear rutas** — usa siempre `ROUTES.algo` de `constants/routes.js`.
4. **Nunca hardcodear textos de interfaz** — usa `useTranslation()` y agrega la clave en `src/i18n/strings.js` (es/en).
5. **Las pantallas médicas** deben llamar `useAuditTrail` al montarse (requerimiento de auditoría).
6. **No crear lógica de API dentro de los screens** — ponla en `src/services/`.
7. **No hacer merge directo a `main`** — siempre Pull Request, y debe pasar el check de CI.

---

## Preguntas frecuentes

**¿Dónde pongo una nueva pantalla?**
En la carpeta de `screens/` que corresponda y la exportas desde el `index.js` de esa carpeta.

**¿Cómo agrego un nuevo componente compartido?**
Créalo en `src/components/NombreComponente.js` y expórtalo en `src/components/index.js`.

**¿Cómo llamo al backend?**
Usa `api` de `src/services/api.js`. El token se adjunta automáticamente:
```js
import api from '../services/api';
const response = await api.get('/sessions');
```

**¿Cómo sé si el usuario tiene permiso para hacer algo?**
```js
const { can } = useAuth();
if (can('createSession')) { /* mostrar botón */ }
```

**¿Por qué falló el CI en mi PR?**
Revisa el log del job en la pestaña Actions. Lo más común es un error de compilación detectado por `expo export --platform web` (import roto, sintaxis inválida) o un `package-lock.json` desincronizado con `package.json` — en ese caso corre `npm install` localmente y comitea el lockfile actualizado.
