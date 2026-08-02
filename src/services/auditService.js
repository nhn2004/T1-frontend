import api from './api';

function toRecord(raw) {
  return {
    id:           raw.accessAuditId,
    userId:       raw.userId,
    resourceType: raw.resourceType,
    resourceId:   raw.resourceId,
    event:        raw.event,
    success:      raw.success,
    occurredAt:   raw.occurredAt,
  };
}

export const auditService = {
  /** Requiere rol SYSTEM_ADMIN en el backend — cualquier otro rol recibe 403. */
  async getAll(resourceType) {
    const { data: wrapper } = await api.get('/audit', {
      params: resourceType ? { resourceType } : undefined,
    });
    return (wrapper.data ?? []).map(toRecord);
  },
};
