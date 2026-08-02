// Helpers para construir la grilla mensual y ubicar sesiones en sus días. No hay un
// endpoint de calendario dedicado: TrainingScheduleScreen reutiliza useSessions()
// (sessionService, datos reales) y estos helpers solo dan formato a fechas/grilla.

import { MONTHS, WEEKDAY_LABELS, WEEKDAYS_FULL } from '../../../i18n/strings';

export function weekdayLabels(language) {
  return WEEKDAY_LABELS[language] ?? WEEKDAY_LABELS.es;
}

export function monthLabel(monthDate, language) {
  const months = MONTHS[language] ?? MONTHS.es;
  return `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
}

export function fullDateLabel(date, language) {
  const months = MONTHS[language] ?? MONTHS.es;
  const weekdaysFull = WEEKDAYS_FULL[language] ?? WEEKDAYS_FULL.es;
  const weekday = weekdaysFull[date.getDay()];

  return {
    weekday,
    dayMonth: language === 'en'
      ? `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
      : `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`,
  };
}

export function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

// Devuelve una matriz de semanas (cada una con 7 días) cubriendo el mes completo,
// rellenando con días del mes anterior/siguiente para completar la grilla.
export function buildMonthMatrix(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const gridStart = new Date(year, month, 1 - startOffset);

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = [];
  for (let i = 0; i < totalCells; i += 1) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      date: cellDate,
      isCurrentMonth: cellDate.getMonth() === month,
    });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
