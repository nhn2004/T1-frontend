import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../../services';
import { useAuth } from '../../../hooks';
import { ROLES } from '../../../constants/roles';

export function useSessions() {
  const { user, roles } = useAuth();
  const isTrainee = roles.includes(ROLES.FIREFIGHTER_TRAINEE);

  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getAll();
      // GET /training-sessions trae el calendario completo de la institución sin
      // filtrar por rol — un aspirante solo debe ver las sesiones en las que
      // participa, no las de todos los demás.
      if (isTrainee && user?.userId) {
        const mine = await sessionService.getMySessionIds(user.userId);
        setSessions(data.filter((s) => mine.has(s.id)));
      } else {
        setSessions(data);
      }
    } catch {
      setError('No se pudieron cargar las sesiones.');
    } finally {
      setLoading(false);
    }
  }, [isTrainee, user?.userId]);

  useEffect(() => { load(); }, [load]);

  return { sessions, loading, error, refresh: load };
}
