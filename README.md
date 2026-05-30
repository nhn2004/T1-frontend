# FireHealth App — SMAB Frontend

Sistema de Monitoreo y Análisis de Bomberos. Plataforma web y móvil para evaluación médica y monitoreo fisiológico de bomberos en entrenamiento (Ecuador y Francia).

---

## Requisitos previos

Instala esto antes de empezar:

- [Node.js 18+](https://nodejs.org)
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

Abre un Pull Request en GitHub desde tu rama hacia `main`. No hagas merge directo a `main`.

---

## Estructura del proyecto

```
src/
├── constants/          # Valores globales que todos usan
│   ├── roles.js        # Los 5 roles del sistema
│   ├── colors.js       # Paleta de colores (tema fuego)
│   └── routes.js       # Nombres de todas las rutas/pantallas
│
├── store/
│   └── authStore.js    # Estado global: usuario, rol, token, isAuthenticated
│
├── navigation/
│   ├── index.js        # Navegador raíz: decide qué mostrar según el rol
│   └── guards.js       # Permisos por rol: qué puede hacer cada uno
│
├── services/
│   └── api.js          # Instancia de axios con token automático
│
├── hooks/
│   ├── useAuth.js          # Hook principal de autenticación
│   ├── useOfflineSync.js   # Cola de datos offline (Sprint 4)
│   └── useAuditTrail.js    # Log de acceso a datos médicos
│
├── components/         # Componentes UI reutilizables (botones, cards, inputs)
│
└── screens/
    ├── auth/           # Login, ForgotPassword
    ├── dashboard/      # Un dashboard por cada rol
    ├── sessions/       # Gestión de sesiones de entrenamiento
    ├── medical/        # Registros médicos, signos vitales, bioimpedancia
    ├── profile/        # Perfil y configuración del usuario
    └── researcher/     # Exportaciones anonimizadas y reportes
```

---

## Roles del sistema

Definidos en `src/constants/roles.js`:

| Constante | Descripción |
|---|---|
| `SYSTEM_ADMIN` | Gestión global de usuarios, permisos y auditoría |
| `ADMIN` | Crea y gestiona sesiones, invita participantes (Sara Flores / Rep. Francia) |
| `FIREFIGHTER_TRAINEE` | Participa en sesiones, ve sus propios resultados |
| `MEDICAL` | Registra signos vitales, historial médico, bioimpedancia, emite alertas |
| `RESEARCHER` | Accede a datos anonimizados, genera reportes estadísticos |

---

## Colores del diseño

Definidos en `src/constants/colors.js`. Úsalos siempre desde ahí, nunca pongas colores hardcodeados:

```js
import { COLORS } from '../constants';

// Ejemplos
COLORS.primary        // #E85D27 — naranja fuego principal
COLORS.background     // #1A1A1A — fondo oscuro
COLORS.textPrimary    // #FFFFFF — texto principal
COLORS.danger         // #D32F2F — alertas críticas
COLORS.success        // #4CAF50 — confirmaciones
```

---

## Guía por desarrollador

---

### Dev 1 — `feature/auth`

**Tu objetivo**: pantallas de login y recuperación de contraseña, más las llamadas al API de autenticación.

**Archivos que modificas**:

```
src/screens/auth/LoginScreen.js         ← pantalla principal de login
src/screens/auth/ForgotPasswordScreen.js ← recuperar contraseña
src/services/authService.js             ← CREAR este archivo
```

**Diseño de LoginScreen** (según prototipo):
- Layout dividido: panel izquierdo con logo y branding, panel derecho con formulario
- El formulario recibe un token de invitación (no es registro abierto)
- Fondo oscuro, botón naranja `COLORS.primary`

**Cómo hacer el login** — llama esto cuando el backend responda OK:

```js
import useAuthStore from '../../store/authStore';

const { setAuth } = useAuthStore();

// Después de recibir respuesta del API:
setAuth({
  user: { id: '...', name: 'Sara Flores', email: '...' },
  role: 'ADMIN',   // usa las constantes de roles.js
  token: 'jwt-token-aqui',
});
// El navigator automáticamente redirige al dashboard correcto
```

**Crea `src/services/authService.js`** con esta estructura:

```js
import api from './api';

export const authService = {
  login: (invitationToken, password) =>
    api.post('/auth/login', { invitationToken, password }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  logout: () =>
    api.post('/auth/logout'),
};
```

---

### Dev 2 — `feature/navigation`

**Tu objetivo**: sidebar de navegación con iconos y protección de rutas por rol.

**Archivos que modificas**:

```
src/navigation/index.js          ← agregar el sidebar navigator
src/components/Sidebar.js        ← CREAR este componente
src/components/index.js          ← exportar Sidebar aquí
```

**Diseño del Sidebar** (según prototipo):
- Vertical, solo iconos (sin texto)
- Logo de la app arriba
- Iconos: dashboard (grid), sesiones (fuego), calendario, configuración (engranaje)
- Ícono de logout abajo del todo
- Fondo `COLORS.sidebarBg`, ícono activo `COLORS.sidebarIconActive`

**Cómo leer el rol y proteger rutas**:

```js
import { useAuth } from '../hooks';
import { can } from './guards';

const { role, isAuthenticated } = useAuth();

// Verificar un permiso:
if (can(role, 'createSession')) {
  // mostrar botón de crear sesión
}
```

**Permisos disponibles en `guards.js`**:

```
createSession          → ADMIN, SYSTEM_ADMIN
manageInvitations      → ADMIN, SYSTEM_ADMIN
viewAllSessions        → ADMIN, SYSTEM_ADMIN, MEDICAL, RESEARCHER
viewOwnSessions        → FIREFIGHTER_TRAINEE
createMedicalRecord    → MEDICAL
readMedicalRecord      → MEDICAL, ADMIN, SYSTEM_ADMIN
exportAnonymizedData   → RESEARCHER, SYSTEM_ADMIN
```

---

### Dev 3 — `feature/dashboard` (tú)

**Tu objetivo**: implementar los 5 dashboards, uno por cada rol.

**Archivos que modificas**:

```
src/screens/dashboard/AdminDashboard.js
src/screens/dashboard/TraineeDashboard.js
src/screens/dashboard/MedicalDashboard.js
src/screens/dashboard/ResearcherDashboard.js
src/screens/dashboard/SystemAdminDashboard.js
```

**Regla importante**: el rol llega del store, nunca lo hardcodees:

```js
import { useAuth } from '../../hooks';

export default function AdminDashboard() {
  const { user, role } = useAuth();
  // user.name, user.email, etc.
}
```

**Diseño del Dashboard** (según prototipo):
- Banner hero con saludo al usuario: *"Welcome back, [nombre]"*
- Card "Immediate Action Required" — muestra invitaciones a sesiones pendientes
- Panel derecho con el horario semanal
- El contenido cambia según el rol

**Qué muestra cada dashboard**:

| Dashboard | Contenido principal |
|---|---|
| `AdminDashboard` | Sesiones activas, invitaciones pendientes, estadísticas generales |
| `TraineeDashboard` | Mis invitaciones, mis sesiones, mis estadísticas personales |
| `MedicalDashboard` | Panel de vitales en tiempo real, cola de alertas, trainees asignados |
| `ResearcherDashboard` | Exportaciones disponibles, generador de reportes estadísticos |
| `SystemAdminDashboard` | Gestión de usuarios, log de auditoría, permisos globales |

---

## Reglas que todos deben seguir

1. **Nunca hardcodear colores** — usa siempre `COLORS.algo` de `constants/colors.js`
2. **Nunca hardcodear el rol** — léelo siempre desde `useAuth()`
3. **Nunca hardcodear rutas** — usa siempre `ROUTES.algo` de `constants/routes.js`
4. **Las pantallas médicas** deben llamar `useAuditTrail` al montarse (requerimiento de auditoría)
5. **No crear lógica de API dentro de los screens** — ponla en `src/services/`
6. **No hacer merge directo a `main`** — siempre Pull Request

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

---

## Sprints y responsabilidades

| Sprint | Qué se construye | Quién |
|---|---|---|
| 1 (actual) | Estructura base, constantes, store, navegación, placeholders | Todos traen este main |
| 2 | Módulos System Admin (usuarios, auditoría, permisos) | TBD |
| 3 | Gestión de sesiones, invitaciones, participantes | TBD |
| 4 | Módulos Trainee (acceso, sesiones, perfil) | TBD |
| 5 | Módulos Medical (vitales, bioimpedancia, ambiente) | TBD |
| 6 | Módulos Researcher (exportación, análisis) | TBD |
| 7 | Validación de requisitos no funcionales | Todos |
| 8 | Testing con usuarios, bugs, documentación final | Todos |

---

## Preguntas frecuentes

**¿Dónde pongo una nueva pantalla?**
En la carpeta de screens que corresponda (`sessions/`, `medical/`, etc.) y la exportas desde el `index.js` de esa carpeta.

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
