import api from './api';

export const authService = {
  async login(email, password) {
    const { data: wrapper } = await api.post('/auth/login', { email, password });
    const raw = wrapper.data;
    return {
      user: {
        userId:    raw.userId,
        email:     raw.email,
        firstName: raw.firstName,
        lastName:  raw.lastName,
        name:      `${raw.firstName} ${raw.lastName}`.trim(),
      },
      roles:     raw.roles,
      token:     raw.token,
      expiresAt: raw.expiresAt,
    };
  },

  async getMe() {
    const { data: wrapper } = await api.get('/auth/me');
    return wrapper.data;
  },

  async changePassword(currentPassword, newPassword, confirmPassword) {
    await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
  },

  /** Datos de una invitación pendiente — usado por CompleteRegistrationScreen para saber qué campos pedir. */
  async invitationPreview(token) {
    const { data: wrapper } = await api.get('/auth/invitation-preview', { params: { token } });
    return wrapper.data;
  },

  /** Crea la cuenta a partir de una invitación por correo (cualquier rol). */
  async completeRegistration(payload) {
    await api.post('/auth/complete-registration', payload);
  },

  /** Pone la contraseña inicial de una cuenta creada directamente (ej. "Agregar Personal"). */
  async activateAccount(token, password) {
    await api.post('/auth/activate-account', { token, password });
  },
};
