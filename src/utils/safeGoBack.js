import { ROUTES } from '../constants/routes';

/**
 * `navigation.goBack()` no hace nada si la pantalla no tiene historial previo — algo
 * que en web ocurre con solo recargar la página en una ruta profunda (no hay `linking`
 * config que reconstruya el stack), dejando el botón "Volver" muerto. Cae al dashboard
 * en vez de quedarse sin hacer nada.
 */
export function safeGoBack(navigation, fallbackRoute = ROUTES.DASHBOARD) {
  if (navigation?.canGoBack?.()) {
    navigation.goBack();
  } else {
    navigation?.navigate?.(fallbackRoute);
  }
}
