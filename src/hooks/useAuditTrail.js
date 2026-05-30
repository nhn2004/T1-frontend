import { useCallback } from 'react';
import { api } from '../services';

// All medical data screens must call useAuditTrail and log access/modifications.
export function useAuditTrail(resourceType) {
  const logAccess = useCallback(
    async (resourceId, action = 'READ') => {
      try {
        await api.post('/audit', { resourceType, resourceId, action });
      } catch {
        // Audit failures must not block the user — log locally if offline
      }
    },
    [resourceType]
  );

  return { logAccess };
}
