import api from './api';

function toPersona(raw) {
  return {
    id:                raw.healthPersonnelId,
    userId:            raw.userId,
    name:              `${raw.firstName} ${raw.lastName}`.trim(),
    role:              raw.profession ?? 'Personal médico',
    email:             raw.email,
    phone:             raw.phone ?? '—',
    specialty:         raw.specialty,
    licenseNumber:     raw.licenseNumber,
    // El backend no expone todavía el conteo de sesiones por persona. `null` significa
    // "no disponible" y la UI lo muestra como «—»; usar [] haría que se renderizara un
    // "0" que el usuario leería como un dato real.
    pendingSessions:   null,
    completedSessions: null,
    photoSource:       null,
  };
}

export const healthPersonnelService = {
  async getAll() {
    const { data: wrapper } = await api.get('/health-personnel');
    return wrapper.data.map(toPersona);
  },

  async getById(id) {
    const { data: wrapper } = await api.get(`/health-personnel/${id}`);
    return toPersona(wrapper.data);
  },

  /**
   * Busca la ficha de personal de salud del usuario indicado.
   * Devuelve `null` si el usuario no es personal de salud — quien llame NO debe caer
   * en "el primero de la lista": atribuiría el registro médico a otro profesional.
   */
  async findByUserId(userId) {
    if (!userId) return null;
    const { data: wrapper } = await api.get('/health-personnel');
    const match = (wrapper.data ?? []).find((hp) => hp.userId === userId);
    return match ? toPersona(match) : null;
  },
};
