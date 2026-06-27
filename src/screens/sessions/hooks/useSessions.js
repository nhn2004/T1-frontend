import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../../services';

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch {
      setError('No se pudieron cargar las sesiones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { sessions, loading, error, refresh: load };
}
