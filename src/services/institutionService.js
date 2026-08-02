import api from './api';

function toInstitution(raw) {
  return {
    id:        raw.institutionId,
    name:      raw.name,
    acronym:   raw.acronym ?? null,
    country:   raw.country ?? null,
    city:      raw.city ?? null,
    isActive:  raw.isActive,
  };
}

export const institutionService = {
  async getAll() {
    const { data: wrapper } = await api.get('/institutions');
    return (wrapper.data ?? []).map(toInstitution);
  },

  async create({ name, acronym = null, country = null, city = null }) {
    const { data: wrapper } = await api.post('/institutions', { name, acronym, country, city });
    return toInstitution(wrapper.data);
  },

  async update(id, { name, acronym = null, country = null, city = null }) {
    const { data: wrapper } = await api.put(`/institutions/${id}`, { name, acronym, country, city });
    return toInstitution(wrapper.data);
  },
};
