import api from './api';

function toLocation(raw) {
  return {
    id:            raw.trainingLocationId,
    institutionId: raw.institutionId,
    name:          raw.name,
    locationType:  raw.locationType ?? null,
    address:       raw.address ?? null,
    maxCapacity:   raw.maxCapacity ?? null,
  };
}

export const trainingLocationService = {
  async getAll() {
    const { data: wrapper } = await api.get('/training-locations');
    return (wrapper.data ?? []).map(toLocation);
  },

  async create({ institutionId, name, locationType = null, address = null, maxCapacity = null }) {
    const { data: wrapper } = await api.post('/training-locations', {
      institutionId, name, locationType, address, maxCapacity,
    });
    return toLocation(wrapper.data);
  },

  async update(id, { name, locationType = null, address = null, maxCapacity = null }) {
    const { data: wrapper } = await api.put(`/training-locations/${id}`, {
      name, locationType, address, maxCapacity,
    });
    return toLocation(wrapper.data);
  },
};
