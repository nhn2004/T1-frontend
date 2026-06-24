import { useEffect, useState } from 'react';
import { ROLES } from '../../../constants/roles';
import { healthPersonnelService, traineeService } from '../../../services';

export const MEDICAL_FILTERS = [
  { label: 'Todos',          value: 'Todos' },
  { label: 'Médicos',        value: 'Médico' },
  { label: 'Enfermeros',     value: 'Enfermero' },
  { label: 'Nutricionistas', value: 'Nutricionista' },
];

export const TRAINEE_FILTERS = [
  { label: 'Todos',    value: 'Todos' },
  { label: 'Bomberos', value: 'Bombero' },
];

export function usePersonas(role) {
  const [personas, setPersonas]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isFireChief = role === ROLES.FIRE_CHIEF;
  const filters     = isFireChief ? TRAINEE_FILTERS : MEDICAL_FILTERS;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = isFireChief
          ? await traineeService.getAll()
          : await healthPersonnelService.getAll();

        if (!cancelled) setPersonas(data);
      } catch {
        if (!cancelled) setError('No se pudo cargar el personal. Intenta de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isFireChief, refreshKey]);

  return { personas, filters, loading, error, refresh: () => setRefreshKey(k => k + 1) };
}
