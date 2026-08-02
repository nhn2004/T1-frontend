import api from './api';

function toUser(raw) {
  return {
    userId:        raw.userId,
    institutionId: raw.institutionId,
    email:         raw.email,
    firstName:     raw.firstName,
    lastName:      raw.lastName,
    name:          `${raw.firstName} ${raw.lastName}`.trim(),
    phone:         raw.phone ?? null,
    accountStatus: raw.accountStatus,
    createdAt:     raw.createdAt,
  };
}

export const userService = {
  async getAll(role) {
    const { data: wrapper } = await api.get('/users', { params: role ? { role } : undefined });
    return wrapper.data.map(toUser);
  },

  async create({ institutionId, email, firstName, lastName, phone }) {
    const { data: wrapper } = await api.post('/users', {
      institutionId, email, firstName, lastName, phone: phone ?? null,
    });
    return toUser(wrapper.data);
  },

  async getById(id) {
    const { data: wrapper } = await api.get(`/users/${id}`);
    return toUser(wrapper.data);
  },

  async update(id, { firstName, lastName, phone, email }) {
    const { data: wrapper } = await api.put(`/users/${id}`, {
      firstName,
      lastName,
      phone: phone ?? null,
      email,
    });
    return toUser(wrapper.data);
  },

  async setStatus(id, status) {
    await api.patch(`/users/${id}/status`, { status });
  },

  async getRoles(id) {
    const { data: wrapper } = await api.get(`/users/${id}/roles`);
    return wrapper.data;
  },

  async updateRoles(id, roleCodes) {
    await api.patch(`/users/${id}/roles`, { roleCodes });
  },
};
