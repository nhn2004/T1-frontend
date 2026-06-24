import useSettingsStore from '../store/settingsStore';
import { STRINGS } from '../i18n/strings';

// El idioma vive en el settingsStore global — cualquier componente puede llamar
// useTranslation() directamente (sin prop drilling) y el cambio en Configuración
// se refleja en toda la app, igual que useTheme() con el modo oscuro.
export default function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  return { t: STRINGS[language] ?? STRINGS.es, language };
}
