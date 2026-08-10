import { create } from 'zustand';

// Cambiar `refreshKey` se usa como `key` del árbol de navegación en App.js — React
// desmonta y vuelve a montar todas las pantallas activas cuando cambia, así que cada
// una vuelve a pedir sus datos desde cero (igual que si se reabriera la app). Es la
// forma más simple de tener un "Actualizar datos" global sin una capa de caché/queries
// compartida entre pantallas, que hoy no existe.
const useAppRefreshStore = create((set) => ({
  refreshKey: 0,
  bumpRefreshKey: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));

export default useAppRefreshStore;
