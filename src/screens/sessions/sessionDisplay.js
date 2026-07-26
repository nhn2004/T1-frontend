// Configuración de presentación del detalle de sesión.
//
// Estas tablas estuvieron en `__mocks__/sessionDetailData.js` mezcladas con datos de
// ejemplo. Los datos ficticios ya no se usan (la pantalla consume `sessionService`),
// pero esta configuración sí es código de producción.
//
// `labelKey`/`btnLabelKey` se resuelven contra t.common.status / t.sessionDetail, y
// `tone` contra los estados semánticos del tema — así funciona en claro y en oscuro.

export const STATUS_DISPLAY = {
  PLANNED: {
    badges:      [{ labelKey: 'pending', tone: 'warning' }],
    btnLabelKey: 'start',
    btnTone:     'primary',
    btnDisabled: false,
  },
  ACTIVE: {
    badges: [
      { labelKey: 'pending',    tone: 'warning' },
      { labelKey: 'inProgress', tone: 'info' },
    ],
    btnLabelKey: 'continue',
    btnTone:     'primary',
    btnDisabled: false,
  },
  COMPLETED: {
    badges:      [{ labelKey: 'completed', tone: 'success' }],
    btnLabelKey: 'viewResults',
    btnTone:     'success',
    btnDisabled: false,
  },
  CANCELLED: {
    badges:      [{ labelKey: 'cancelled', tone: 'neutral' }],
    btnLabelKey: 'viewDetailsDisabled',
    btnTone:     'disabled',
    btnDisabled: true,
  },
};

// El aspirante no administra la sesión (eso es del instructor): solo puede consultarla
// y, una vez finalizada, ver sus propios resultados. Evita mandarlo a una pantalla de
// gestión de asistentes que su rol ni siquiera tiene montada.
export const TRAINEE_STATUS_DISPLAY = {
  PLANNED: {
    badges:      STATUS_DISPLAY.PLANNED.badges,
    btnLabelKey: 'instructorWillStart',
    btnTone:     'disabled',
    btnDisabled: true,
  },
  ACTIVE: {
    badges:      STATUS_DISPLAY.ACTIVE.badges,
    btnLabelKey: 'inProgressWait',
    btnTone:     'disabled',
    btnDisabled: true,
  },
  COMPLETED: {
    badges:      STATUS_DISPLAY.COMPLETED.badges,
    btnLabelKey: 'viewMyResults',
    btnTone:     'success',
    btnDisabled: false,
  },
  CANCELLED: STATUS_DISPLAY.CANCELLED,
};

/** Tono semántico del badge de rol del personal de salud. */
export const ROLE_TONES = {
  NUTRICIONISTA: 'info',
  CAPACITADOR:   'info',
  MEDICO:        'warning',
  ENFERMERO:     'neutral',
};
