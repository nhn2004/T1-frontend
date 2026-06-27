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
};
