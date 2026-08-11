import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, TextInput, Pressable, ActivityIndicator, useWindowDimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { a11yAlert, a11yButton, a11yDecorative, a11yLiveRegion, a11yModal, ICON_HIT_SLOP, MIN_TOUCH_SIZE } from '../../constants/a11y';
import AgendaTimeline from './components/AgendaTimeline';
import TrainingCenterSidebar from './components/TrainingCenterSidebar';
import { STATUS_DISPLAY, TRAINEE_STATUS_DISPLAY } from './sessionDisplay';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import useTranslation from '../../hooks/useTranslation';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { safeGoBack } from '../../utils/safeGoBack';
import { sessionService, environmentalDataService } from '../../services';
import { traineeService } from '../../services/traineeService';
import api from '../../services/api';
import { FONT_SIZE, FONT_WEIGHT, TEXT_STYLES } from '../../constants/typography';

/** Inserta las barras dd/mm/aaaa automáticamente a medida que se escriben los dígitos. */
function formatFechaInput(text) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  let out = day;
  if (month) out += `/${month}`;
  if (year) out += `/${year}`;
  return out;
}

function parseDatetime(fecha, hora) {
  const parts = fecha.trim().split('/').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [day, month, year] = parts;
  const [timePart, period] = hora.trim().split(' ');
  let [h, m] = (timePart || '09:00').split(':').map(Number);
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return new Date(year, month - 1, day, h, m, 0);
}

function formatFechaForInput(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatHoraForInput(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
}

const EMPTY_SESSION = {
  id: null,
  title: '',
  description: '',
  date: '—',
  time: '—',
  capacityCount: 0,
  status: 'PLANNED',
  note: '',
  agenda: null,
  trainingCenter: null,
  instructors: [],
  instructorsLoaded: false,
};

const EMPTY_AMBIENTAL = {
  presionAtmosferica: '',
  temperaturaAmbiente: '',
  humedadRelativa: '',
};

const AMBIENTAL_FIELDS = [
  { key: 'presionAtmosferica',  label: 'Presión atmosférica (hPa)', placeholder: 'ej. 1013' },
  { key: 'temperaturaAmbiente', label: 'Temperatura ambiente (°C)', placeholder: 'ej. 24' },
  { key: 'humedadRelativa',     label: 'Humedad relativa (%)',      placeholder: 'ej. 65' },
];

export default function SessionDetailScreen({ navigation, route, sessionId, onBack }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { roles, user, can, canAccessRoute } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 980;
  const isTrainee = roles.includes(ROLES.FIREFIGHTER_TRAINEE);

  const styles = useMemo(() => makeStyles(theme, isCompact), [theme, isCompact]);

  const id = sessionId ?? route?.params?.id;
  const [session, setSession] = useState({ ...EMPTY_SESSION });
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [notice, setNotice] = useState(null);
  const myParticipantIdRef = useRef(null);

  const [showAmbientalModal, setShowAmbientalModal] = useState(false);
  const [ambiental, setAmbiental] = useState(EMPTY_AMBIENTAL);
  const [ambErrors, setAmbErrors] = useState(false);
  const [savingAmbiental, setSavingAmbiental] = useState(false);
  const [ambSaveError, setAmbSaveError] = useState('');

  // Editar/Cancelar solo tiene sentido para quien puede crear sesiones (mismos roles
  // que CrearSesionScreen) y solo mientras el backend acepta la operación: una vez
  // iniciada/finalizada/cancelada, PUT y PATCH .../status responden 422.
  // `!!session.id` evita mostrarlo de más durante la carga: EMPTY_SESSION arranca con
  // status:'PLANNED' como placeholder, así que sin este chequeo el botón aparecía un
  // instante con datos falsos y desaparecía en cuanto llegaba el estado real.
  const canManageSession = can('createSession') && session.status === 'PLANNED' && !!session.id;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editHora, setEditHora] = useState('');
  const [editCapacidad, setEditCapacidad] = useState('');
  const [editErrors, setEditErrors] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSaveError, setEditSaveError] = useState('');

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let alive = true;

    setSyncing(true);
    setLoadError(null);
    sessionService.getById(id)
      .then((data) => { if (alive) setSession({ ...EMPTY_SESSION, ...data }); })
      .catch(() => {
        if (alive) setLoadError('No se pudo cargar el detalle de la capacitación.');
      })
      .finally(() => { if (alive) setSyncing(false); });

    return () => { alive = false; };
  }, [id]);

  // Resuelve el sessionParticipantId del aspirante logueado para esta sesión.
  useEffect(() => {
    if (!isTrainee || !id || !user?.userId) return undefined;
    let alive = true;

    (async () => {
      try {
        const trainees = await traineeService.getAll();
        const me = trainees.find((x) => x.userId === user.userId);
        if (!me || !alive) return;

        const { data: wrapper } = await api.get('/session-participants');
        const mine = (wrapper.data ?? []).find(
          (p) => p.trainingSessionId === id && p.traineeFirefighterId === me.id,
        );
        if (mine && alive) myParticipantIdRef.current = mine.sessionParticipantId;
      } catch {
        // Sin participante resuelto el botón de resultados avisará al pulsarse.
      }
    })();

    return () => { alive = false; };
  }, [isTrainee, id, user]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Iniciar una sesión es un acto de organizador (mismo permiso que crearla, mismos
  // roles que exige el backend en PATCH .../start): antes cualquier rol no-aspirante
  // (Médico, Investigador incluidos) veía el botón "Iniciar" habilitado en una sesión
  // Pendiente. Para Investigador el POST a /environmental-data ya devolvía 403 de
  // entrada; para Médico ese POST sí lo aceptaba pero el START posterior devolvía 403,
  // dejando una condición ambiental guardada huérfana en una sesión que seguía
  // "Pendiente" — un guardado a medias con un mensaje de error que ni siquiera
  // explicaba bien qué había fallado. Se reutiliza el mismo mensaje "el instructor
  // iniciará la sesión" que ya usa el aspirante, aquí para cualquier rol sin permiso
  // de organizador.
  const canStartSession = can('createSession');
  // "Continuar" (ACTIVE) y "Ver resultados" (COMPLETED) navegan a la gestión de
  // asistentes (ROUTES.PEOPLE_SESSIONS) — Investigador no tiene ese permiso
  // (`viewPeople`) y hasta ahora veía el botón habilitado igual, para toparse recién al
  // tocarlo con el aviso de `navigateToPersonas`. Incorrecto por el mismo motivo que el
  // botón "Iniciar": si el rol nunca puede completar la acción, el botón no debería
  // aparecer habilitado en primer lugar.
  const canViewAttendance = canAccessRoute(ROUTES.PEOPLE_SESSIONS);
  const display = useMemo(() => {
    if (isTrainee) return TRAINEE_STATUS_DISPLAY[session.status] ?? TRAINEE_STATUS_DISPLAY.PLANNED;
    if (session.status === 'PLANNED' && !canStartSession) {
      return { ...STATUS_DISPLAY.PLANNED, btnLabelKey: 'instructorWillStart', btnTone: 'disabled', btnDisabled: true };
    }
    if ((session.status === 'ACTIVE' || session.status === 'COMPLETED') && !canViewAttendance) {
      return { ...(STATUS_DISPLAY[session.status] ?? STATUS_DISPLAY.PLANNED), btnLabelKey: 'noAccess', btnTone: 'disabled', btnDisabled: true };
    }
    return STATUS_DISPLAY[session.status] ?? STATUS_DISPLAY.PLANNED;
  }, [isTrainee, session.status, canStartSession, canViewAttendance]);

  const updateAmb = useCallback(
    (field, val) => setAmbiental((prev) => ({ ...prev, [field]: val })),
    [],
  );

  // Solo se navega a la gestión de asistentes si el rol tiene esa pantalla montada:
  // antes cualquier rol no-aspirante lo intentaba y la navegación fallaba en silencio.
  const navigateToPersonas = useCallback(() => {
    if (!canAccessRoute(ROUTES.PEOPLE_SESSIONS)) {
      setLoadError('Tu rol no tiene acceso a la gestión de asistentes.');
      return;
    }
    navigation?.navigate(ROUTES.PEOPLE_SESSIONS, {
      sessionId: session.id,
      sessionName: session.title,
      ambiental,
    });
  }, [canAccessRoute, navigation, session.id, session.title, ambiental]);

  const handleAction = useCallback(() => {
    if (display.btnDisabled) return;

    if (isTrainee) {
      if (!myParticipantIdRef.current) {
        setLoadError('No encontramos tu participación en esta capacitación.');
        return;
      }
      navigation?.navigate(ROUTES.RESULTS_TRAINEE, {
        bomberoId: myParticipantIdRef.current,
        bomberoName: user?.name,
      });
      return;
    }

    if (session.status === 'PLANNED') {
      setAmbErrors(false);
      setAmbiental(EMPTY_AMBIENTAL);
      setShowAmbientalModal(true);
    } else {
      navigateToPersonas();
    }
  }, [display, isTrainee, navigation, session.status, user, navigateToPersonas]);

  /**
   * Guarda las condiciones ambientales y continúa a la gestión de asistentes.
   *
   * Antes estos datos solo viajaban como parámetro de navegación y se perdían, pese a
   * que el backend ya expone POST /environmental-data. La presión atmosférica sigue sin
   * tener columna en la API, así que se informa explícitamente.
   */
  const handleConfirmarAmbiental = useCallback(async () => {
    const missing = AMBIENTAL_FIELDS.some((f) => !ambiental[f.key]);
    if (missing) {
      setAmbErrors(true);
      return;
    }

    setSavingAmbiental(true);
    try {
      const { unsupported } = await environmentalDataService.create(
        session.id,
        user?.userId,
        ambiental,
      );

      // Iniciar la capacitación DEBE cambiar su estado en el servidor. Antes solo se
      // navegaba a la gestión de asistentes y la sesión seguía "Pendiente" para todos
      // los demás roles, aunque en la práctica ya estuviera en curso.
      if (session.status === 'PLANNED') {
        const updated = await sessionService.start(session.id);
        setSession((prev) => ({ ...prev, ...updated }));
      }

      setShowAmbientalModal(false);
      if (unsupported.length) {
        setLoadError(`Condiciones guardadas. Sin soporte en el servidor: ${unsupported.join(', ')}.`);
      }
      navigateToPersonas();
    } catch (error) {
      if (!error.response) {
        // Encolado offline por api.js — se sincroniza solo cuando vuelva la señal. No
        // se puede reflejar el nuevo estado de la sesión todavía (depende de la
        // respuesta del servidor), pero no hay razón para bloquear al usuario aquí.
        setShowAmbientalModal(false);
        setLoadError('Sin conexión: las condiciones ambientales quedaron guardadas localmente y se enviarán cuando vuelva la señal.');
        navigateToPersonas();
        return;
      }
      const detail = error?.response?.data?.message ?? error?.message ?? 'Error desconocido.';
      setAmbSaveError(`No se pudieron guardar las condiciones ambientales: ${detail}`);
    } finally {
      setSavingAmbiental(false);
    }
  }, [ambiental, navigateToPersonas, session.id, session.status, user?.userId]);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else safeGoBack(navigation);
  }, [onBack, navigation]);

  const handleOpenEdit = useCallback(() => {
    setEditTitle(session.title ?? '');
    setEditDescription(session.description ?? '');
    setEditFecha(formatFechaForInput(session.scheduledStart));
    setEditHora(formatHoraForInput(session.scheduledStart));
    setEditCapacidad(session.capacityCount ? String(session.capacityCount) : '');
    setEditErrors(false);
    setEditSaveError('');
    setShowEditModal(true);
  }, [session]);

  const handleSaveEdit = useCallback(async () => {
    const start = parseDatetime(editFecha, editHora);
    const invalidCapacidad = editCapacidad.trim() !== '' && parseInt(editCapacidad, 10) <= 0;
    if (!editTitle.trim() || !start || invalidCapacidad) {
      setEditErrors(true);
      return;
    }
    setEditErrors(false);
    setSavingEdit(true);
    setEditSaveError('');
    try {
      // Se preserva la duración original (scheduledEnd - scheduledStart) — la pantalla
      // de creación tampoco pide una hora de fin explícita, usa una duración fija.
      const originalStart = session.scheduledStart ? new Date(session.scheduledStart) : start;
      const originalEnd = session.scheduledEnd ? new Date(session.scheduledEnd) : new Date(start.getTime() + 4 * 3_600_000);
      const durationMs = Math.max(originalEnd.getTime() - originalStart.getTime(), 60 * 60_000);
      const end = new Date(start.getTime() + durationMs);

      const updated = await sessionService.update(session.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        plannedCapacity: editCapacidad.trim() ? parseInt(editCapacidad, 10) : null,
      });
      setSession((prev) => ({ ...prev, ...updated }));
      setShowEditModal(false);
      setNotice(t.sessionDetail.updatedToast);
    } catch (error) {
      if (!error.response) {
        // Encolado offline — el cambio se aplicará solo cuando vuelva la señal, pero
        // esta pantalla no puede mostrar todavía el resultado (lo calcula el
        // servidor), así que se cierra el modal en vez de dejar al usuario atascado.
        setShowEditModal(false);
        setNotice('Sin conexión: los cambios quedaron guardados localmente y se aplicarán cuando vuelva la señal.');
        setSavingEdit(false);
        return;
      }
      const detail = error?.response?.data?.message ?? error?.message ?? 'Error desconocido.';
      setEditSaveError(`${t.sessionDetail.saveError}: ${detail}`);
    } finally {
      setSavingEdit(false);
    }
  }, [editFecha, editHora, editTitle, editDescription, editCapacidad, session, t]);

  const handleCancelSession = useCallback(async () => {
    setCancelling(true);
    try {
      const updated = await sessionService.cancel(session.id);
      setSession((prev) => ({ ...prev, ...updated }));
      setShowCancelConfirm(false);
      setNotice(t.sessionDetail.cancelledToast);
    } catch (error) {
      setShowCancelConfirm(false);
      if (!error.response) {
        setNotice('Sin conexión: la cancelación quedó guardada localmente y se aplicará cuando vuelva la señal.');
        setCancelling(false);
        return;
      }
      const detail = error?.response?.data?.message ?? error?.message ?? 'Error desconocido.';
      setLoadError(`${t.sessionDetail.cancelError}: ${detail}`);
    } finally {
      setCancelling(false);
    }
  }, [session.id, t]);

  const BodyContainer = isCompact ? ScrollView : View;

  const btnBackground = display.btnDisabled
    ? theme.disabledBg
    : display.btnTone === 'primary'
      ? theme.primarySolid
      : theme.status[display.btnTone]?.solid ?? theme.primarySolid;

  const btnTextColor = display.btnDisabled
    ? theme.textDisabled
    : display.btnTone === 'primary'
      ? theme.onPrimarySolid
      : theme.status[display.btnTone]?.onSolid ?? theme.onPrimarySolid;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topTitleRow}>
            <Ionicons name="calendar" size={20} color={theme.primaryText} {...a11yDecorative} />
            <Text style={styles.topTitle} accessibilityRole="header">
              {t.sessionDetail.pageTitle}
            </Text>
            {syncing && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.8}
            {...a11yButton(t.sessionDetail.back)}
          >
            <Ionicons name="arrow-back" size={16} color={theme.textPrimary} {...a11yDecorative} />
            <Text style={styles.backBtnText}>{t.sessionDetail.back}</Text>
          </TouchableOpacity>
        </View>

        {!!loadError && (
          <View {...a11yAlert(loadError)}>
            <Toast message={loadError} tone="error" />
          </View>
        )}
        {!!notice && (
          <View {...a11yLiveRegion('polite')}>
            <Toast message={notice} tone="success" />
          </View>
        )}

        {/* En tablet/escritorio ocupa toda la altura sin scroll de página (solo la
            agenda scrollea). En teléfono se apila y todo el cuerpo scrollea. */}
        <BodyContainer
          style={styles.body}
          {...(isCompact
            ? { contentContainerStyle: styles.bodyCompactContent, showsVerticalScrollIndicator: false }
            : {})}
        >
          <View style={styles.leftPanel}>
            {/* Resumen */}
            <View style={styles.card}>
              <Text style={styles.sessionTitle} accessibilityRole="header">{session.title}</Text>
              {!!session.description && (
                <Text style={styles.sessionDesc}>{session.description}</Text>
              )}
              <View style={styles.statsRow}>
                <StatItem icon="calendar-outline" label={t.sessionDetail.date} value={session.date} styles={styles} theme={theme} />
                <StatItem icon="time-outline" label={t.sessionDetail.time} value={session.time} styles={styles} theme={theme} />
                <StatItem
                  icon="people-outline"
                  label={t.sessionDetail.capacity}
                  value={`${session.capacityCount} ${t.sessions.applicants}`}
                  styles={styles}
                  theme={theme}
                />
              </View>
            </View>

            {/* Descripción general + agenda */}
            <View style={[styles.card, !isCompact && styles.overviewCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="layers-outline" size={18} color={theme.icon} {...a11yDecorative} />
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  {t.sessionDetail.overview}
                </Text>
              </View>

              <ScrollView
                style={!isCompact && styles.overviewScroll}
                scrollEnabled={!isCompact}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.overviewScrollContent}
              >
                {!!session.note && (
                  <Text style={styles.note}>
                    <Text style={styles.noteBold}>{t.sessionDetail.note} </Text>
                    {session.note}
                  </Text>
                )}
                <AgendaTimeline items={session.agenda} />
              </ScrollView>
            </View>

            {/* Estado + acción */}
            <View style={styles.statusCard}>
              <View style={styles.watermark} pointerEvents="none" {...a11yDecorative}>
                <Ionicons name="flame" size={90} color={theme.primary} style={styles.watermarkIcon} />
              </View>

              <View style={styles.statusRow}>
                <Ionicons name="layers-outline" size={16} color={theme.icon} {...a11yDecorative} />
                <Text style={styles.statusLabel}>{t.sessionDetail.status}</Text>
                {(display.badges || []).map((b) => {
                  const tone = theme.status[b.tone] ?? theme.status.neutral;
                  return (
                    <View key={b.labelKey} style={[styles.badge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.badgeText, { color: tone.fg }]}>
                        {t.common.status[b.labelKey]}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: btnBackground }]}
                onPress={handleAction}
                activeOpacity={display.btnDisabled ? 1 : 0.85}
                disabled={display.btnDisabled}
                {...a11yButton(t.sessionDetail[display.btnLabelKey], {
                  disabled: display.btnDisabled,
                })}
              >
                <Text style={[styles.actionBtnText, { color: btnTextColor }]}>
                  {t.sessionDetail[display.btnLabelKey]}
                </Text>
              </TouchableOpacity>

              {canManageSession && (
                <View style={styles.manageRow}>
                  <TouchableOpacity
                    style={styles.manageBtn}
                    onPress={handleOpenEdit}
                    activeOpacity={0.8}
                    {...a11yButton(t.sessionDetail.editSession)}
                  >
                    <Ionicons name="create-outline" size={15} color={theme.textPrimary} {...a11yDecorative} />
                    <Text style={styles.manageBtnText}>{t.sessionDetail.edit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.manageBtn, styles.manageBtnDanger]}
                    onPress={() => setShowCancelConfirm(true)}
                    activeOpacity={0.8}
                    {...a11yButton(t.sessionDetail.cancelSession)}
                  >
                    <Ionicons name="close-circle-outline" size={15} color={theme.status.danger.fg} {...a11yDecorative} />
                    <Text style={[styles.manageBtnText, { color: theme.status.danger.fg }]}>{t.sessionDetail.cancelSession}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <TrainingCenterSidebar
            trainingCenter={session.trainingCenter}
            instructors={session.instructors}
            instructorsLoaded={session.instructorsLoaded}
            fullWidth={isCompact}
          />
        </BodyContainer>
      </View>

      {/* ── Modal de datos ambientales ── */}
      <Modal
        visible={showAmbientalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAmbientalModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowAmbientalModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()} {...a11yModal('Datos ambientales')}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon} {...a11yDecorative}>
                <Ionicons name="partly-sunny-outline" size={22} color={theme.primaryText} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} accessibilityRole="header">Datos Ambientales</Text>
                <Text style={styles.sheetSub}>
                  Registra las condiciones del entorno antes de iniciar la práctica.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAmbientalModal(false)}
                hitSlop={ICON_HIT_SLOP}
                {...a11yButton('Cerrar')}
              >
                <Ionicons name="close" size={22} color={theme.icon} />
              </TouchableOpacity>
            </View>

            {!!ambSaveError && (
              <View {...a11yAlert(ambSaveError)}>
                <Toast message={ambSaveError} tone="error" />
              </View>
            )}

            <View style={styles.fields}>
              {AMBIENTAL_FIELDS.map((f) => {
                const hasError = ambErrors && !ambiental[f.key];
                return (
                  <View key={f.key} style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, hasError && styles.fieldLabelErr]} nativeID={`amb-${f.key}`}>
                      {f.label}
                      {hasError && <Text style={styles.required}> — obligatorio</Text>}
                    </Text>
                    <TextInput
                      style={[styles.input, hasError && styles.inputErr]}
                      value={ambiental[f.key]}
                      onChangeText={(v) => updateAmb(f.key, v)}
                      keyboardType="decimal-pad"
                      placeholder={f.placeholder}
                      placeholderTextColor={theme.textPlaceholder}
                      accessibilityLabel={f.label}
                      accessibilityLabelledBy={`amb-${f.key}`}
                      accessibilityState={{ invalid: hasError }}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAmbientalModal(false)}
                activeOpacity={0.8}
                {...a11yButton('Cancelar')}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, savingAmbiental && styles.confirmBtnBusy]}
                onPress={handleConfirmarAmbiental}
                activeOpacity={0.85}
                disabled={savingAmbiental}
                {...a11yButton('Iniciar capacitación', {
                  disabled: savingAmbiental,
                  busy: savingAmbiental,
                })}
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={theme.onPrimarySolid}
                  {...a11yDecorative}
                />
                <Text style={styles.confirmBtnText}>
                  {savingAmbiental ? 'Guardando…' : 'Iniciar Capacitación'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal de edición de sesión ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => !savingEdit && setShowEditModal(false)}
      >
        <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.overlay} onPress={() => !savingEdit && setShowEditModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()} {...a11yModal('Editar sesión')}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon} {...a11yDecorative}>
                <Ionicons name="create-outline" size={22} color={theme.primaryText} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} accessibilityRole="header">{t.sessionDetail.editModalTitle}</Text>
                <Text style={styles.sheetSub}>{t.sessionDetail.editModalSub}</Text>
              </View>
              <TouchableOpacity
                onPress={() => !savingEdit && setShowEditModal(false)}
                hitSlop={ICON_HIT_SLOP}
                {...a11yButton(t.sessionDetail.close)}
              >
                <Ionicons name="close" size={22} color={theme.icon} />
              </TouchableOpacity>
            </View>

            {!!editSaveError && (
              <View {...a11yAlert(editSaveError)}>
                <Toast message={editSaveError} tone="error" />
              </View>
            )}

            <ScrollView style={styles.editScroll} contentContainerStyle={styles.fields}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, editErrors && !editTitle.trim() && styles.fieldLabelErr]} nativeID="edit-title">
                  {t.sessionDetail.titleLabel}{editErrors && !editTitle.trim() && <Text style={styles.required}>{t.sessionDetail.requiredSuffix}</Text>}
                </Text>
                <TextInput
                  style={[styles.input, editErrors && !editTitle.trim() && styles.inputErr]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  accessibilityLabel={t.sessionDetail.titleLabel}
                  accessibilityLabelledBy="edit-title"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel} nativeID="edit-desc">{t.sessionDetail.descriptionLabel}</Text>
                <TextInput
                  style={styles.input}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  accessibilityLabel={t.sessionDetail.descriptionLabel}
                  accessibilityLabelledBy="edit-desc"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, editErrors && !parseDatetime(editFecha, editHora) && styles.fieldLabelErr]} nativeID="edit-fecha">
                  {t.sessionDetail.dateLabel}{editErrors && !parseDatetime(editFecha, editHora) && <Text style={styles.required}>{t.sessionDetail.requiredSuffix}</Text>}
                </Text>
                <TextInput
                  style={[styles.input, editErrors && !parseDatetime(editFecha, editHora) && styles.inputErr]}
                  value={editFecha}
                  onChangeText={(v) => setEditFecha(formatFechaInput(v))}
                  placeholder="dd/mm/aaaa"
                  placeholderTextColor={theme.textPlaceholder}
                  keyboardType="numeric"
                  maxLength={10}
                  accessibilityLabel={t.sessionDetail.dateLabel}
                  accessibilityLabelledBy="edit-fecha"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel} nativeID="edit-hora">{t.sessionDetail.timeLabel}</Text>
                <TextInput
                  style={styles.input}
                  value={editHora}
                  onChangeText={setEditHora}
                  placeholder="09:00 AM"
                  placeholderTextColor={theme.textPlaceholder}
                  accessibilityLabel={t.sessionDetail.timeLabel}
                  accessibilityLabelledBy="edit-hora"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, editErrors && editCapacidad.trim() !== '' && parseInt(editCapacidad, 10) <= 0 && styles.fieldLabelErr]} nativeID="edit-capacidad">
                  {t.sessionDetail.capacityLabel}
                </Text>
                <TextInput
                  style={[styles.input, editErrors && editCapacidad.trim() !== '' && parseInt(editCapacidad, 10) <= 0 && styles.inputErr]}
                  value={editCapacidad}
                  onChangeText={(v) => setEditCapacidad(v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  accessibilityLabel={t.sessionDetail.capacityLabel}
                  accessibilityLabelledBy="edit-capacidad"
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.8}
                disabled={savingEdit}
                {...a11yButton(t.sessionDetail.cancel, { disabled: savingEdit })}
              >
                <Text style={styles.cancelBtnText}>{t.sessionDetail.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, savingEdit && styles.confirmBtnBusy]}
                onPress={handleSaveEdit}
                activeOpacity={0.85}
                disabled={savingEdit}
                {...a11yButton(t.sessionDetail.saveChanges, { disabled: savingEdit, busy: savingEdit })}
              >
                {savingEdit
                  ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                  : <Text style={styles.confirmBtnText}>{t.sessionDetail.saveChanges}</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={showCancelConfirm}
        title={t.sessionDetail.cancelConfirmTitle}
        message={t.sessionDetail.cancelConfirmMessage}
        confirmLabel={cancelling ? t.sessionDetail.cancelling : t.sessionDetail.cancelConfirmYes}
        cancelLabel={t.sessionDetail.back}
        destructive
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSession}
      />
    </SafeAreaView>
  );
}

function StatItem({ icon, label, value, styles, theme }) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconBox} {...a11yDecorative}>
        <Ionicons name={icon} size={18} color={theme.icon} />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const makeStyles = (t, isCompact) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background },
    content: { flex: 1, padding: 14, gap: 12 },

    topBar: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', flexWrap: 'wrap', gap: 10,
    },
    topTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    topTitle: { ...TEXT_STYLES.sectionTitle, color: t.textPrimary },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE, borderRadius: 10,
      backgroundColor: t.card, borderWidth: 1.5, borderColor: t.border,
    },
    backBtnText: { ...TEXT_STYLES.bodyBold, color: t.textPrimary },

    body: { flex: 1, flexDirection: isCompact ? 'column' : 'row', gap: 14 },
    bodyCompactContent: { gap: 14, paddingBottom: 24 },
    // "flex: 0" en RN-Web fija flexBasis:0% (colapsa a 0px): hay que cancelar el flex
    // heredado con las props largas y flexBasis 'auto' para medir por contenido.
    leftPanel: isCompact
      ? { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', gap: 12 }
      : { flex: 1, gap: 12 },

    card: {
      backgroundColor: t.card, borderRadius: 18, padding: 18, gap: 12,
      borderWidth: 1, borderColor: t.border,
      shadowColor: t.shadowColor, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity, shadowRadius: 6, elevation: 2,
    },
    overviewCard: { flex: 1 },
    sessionTitle: { ...TEXT_STYLES.screenTitle, color: t.textPrimary },
    sessionDesc: { fontSize: FONT_SIZE.lg, color: t.textSecondary, lineHeight: 20 },
    statsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statIconBox: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: t.pill, alignItems: 'center', justifyContent: 'center',
    },
    statLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: t.textMuted, letterSpacing: 0.5 },
    statValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary, marginTop: 1 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    overviewScroll: { flex: 1 },
    overviewScrollContent: { gap: 10, paddingBottom: 8 },
    note: { fontSize: FONT_SIZE.lg, color: t.textSecondary, lineHeight: 20 },
    noteBold: { fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },

    statusCard: {
      backgroundColor: t.card, borderRadius: 18, padding: 18, gap: 12,
      borderWidth: 1, borderColor: t.border, overflow: 'hidden',
      shadowColor: t.shadowColor, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.shadowOpacity, shadowRadius: 6, elevation: 2,
    },
    watermark: { position: 'absolute', right: 12, bottom: -10 },
    watermarkIcon: { opacity: 0.08 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    statusLabel: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
    actionBtn: {
      borderRadius: 12, minHeight: MIN_TOUCH_SIZE + 6,
      alignItems: 'center', justifyContent: 'center',
    },
    actionBtnText: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.3 },
    manageRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
    manageBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      minHeight: MIN_TOUCH_SIZE, borderRadius: 10, borderWidth: 1.5, borderColor: t.border,
      backgroundColor: t.card,
    },
    manageBtnDanger: { borderColor: t.status.danger.border },
    manageBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: t.textPrimary },
    editScroll: { maxHeight: 360 },

    // ── Modal ──
    kbAvoid: { flex: 1 },
    overlay: {
      flex: 1, backgroundColor: t.overlay,
      alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    sheet: {
      width: '100%', maxWidth: 460, backgroundColor: t.card, borderRadius: 20,
      padding: 24, gap: 20, borderWidth: 1, borderColor: t.border,
      shadowColor: t.shadowColor, shadowOpacity: t.shadowOpacity * 3,
      shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 12,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    sheetHeaderText: { flex: 1 },
    sheetIcon: {
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: t.primarySoft, alignItems: 'center', justifyContent: 'center',
    },
    sheetTitle: { ...TEXT_STYLES.modalTitle, color: t.textPrimary },
    sheetSub: { fontSize: FONT_SIZE.md, color: t.textSecondary, marginTop: 3, lineHeight: 18 },
    fields: { gap: 16 },
    fieldWrap: { gap: 6 },
    fieldLabel: { ...TEXT_STYLES.bodyBold, color: t.textSecondary },
    fieldLabelErr: { color: t.status.danger.fg },
    required: { fontWeight: FONT_WEIGHT.regular, fontSize: FONT_SIZE.md },
    input: {
      borderWidth: 1, borderColor: t.border, borderRadius: 10,
      paddingHorizontal: 14, minHeight: MIN_TOUCH_SIZE,
      fontSize: FONT_SIZE.lg, color: t.textPrimary, fontWeight: FONT_WEIGHT.semibold,
      backgroundColor: t.cardAlt,
    },
    inputErr: { borderColor: t.status.danger.border, backgroundColor: t.status.danger.bg, borderWidth: 1.5 },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' },
    cancelBtn: {
      paddingHorizontal: 22, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
      borderRadius: 10, borderWidth: 1.5, borderColor: t.borderStrong,
    },
    cancelBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, color: t.textSecondary },
    confirmBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.primarySolid, borderRadius: 10,
      paddingHorizontal: 22, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    },
    confirmBtnBusy: { opacity: 0.8 },
    confirmBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: t.onPrimarySolid },
  });
