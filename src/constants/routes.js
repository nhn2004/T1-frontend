// Nombres de las pantallas registradas en los navigators (src/navigation/index.js).
//
// Esta es la ÚNICA fuente de verdad: `navigation/index.js` registra cada Stack.Screen
// usando estas constantes, así que cualquier `navigation.navigate(ROUTES.X)` está
// garantizado a resolver. Nunca navegues con un string literal — si el nombre no existe,
// React Navigation falla en silencio y el usuario ve un botón que "no hace nada".
export const ROUTES = {
  // ── Stack de autenticación ──────────────────────────────────────────────
  LOGIN: 'Login',
  FORGOT_PASSWORD: 'ForgotPassword',

  // ── Stack por rol ───────────────────────────────────────────────────────
  DASHBOARD: 'Dashboard',
  TRAINING: 'Training',                            // listado de sesiones (o panel del aspirante)
  SESSION_DETAIL: 'SessionDetail',
  SESSION_CREATE: 'CrearSesion',
  SCHEDULE: 'Schedule',
  PROGRESS: 'Progress',
  PEOPLE: 'Personas',
  PEOPLE_SESSIONS: 'PersonasSesiones',
  VALIDATION_QUEUE: 'ValidationQueue',
  RESULTS_INDIVIDUAL: 'ResultadosIndividuales',
  EVALUATION: 'EvaluacionBombero',
  RESULTS_TRAINEE: 'ResultadosBombero',
  SETTINGS: 'Configuration',
  PROFILE: 'Profile',
  MEDICAL_HISTORY: 'MedicalHistory',
  INSTITUTIONS: 'Institutions',
};
