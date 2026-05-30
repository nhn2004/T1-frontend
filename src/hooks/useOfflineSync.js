import { useState, useCallback } from 'react';

// Offline queue lives here, not inside individual screens.
// Each queued item: { id, endpoint, method, payload, retries }
// TODO Sprint 4: wire up to EncryptedStorage + NetInfo + background sync

export function useOfflineSync() {
  const [queue, setQueue] = useState([]);

  const enqueue = useCallback((item) => {
    setQueue((prev) => [...prev, { ...item, id: Date.now().toString(), retries: 0 }]);
  }, []);

  const flush = useCallback(() => {
    // Will be implemented when offline sync module is built (Sprint 4)
  }, []);

  return { queue, enqueue, flush };
}
