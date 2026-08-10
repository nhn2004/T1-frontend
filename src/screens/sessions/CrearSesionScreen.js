import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DOCTOR_FILTERS } from './__mocks__/crearSesionData';
import { a11yAlert, a11yButton, a11yModal } from '../../constants/a11y';
import Toast from '../../components/Toast';
import useTheme from '../../hooks/useTheme';
import { healthPersonnelService } from '../../services/healthPersonnelService';
import { trainingLocationService } from '../../services/trainingLocationService';
import api from '../../services/api';
import { safeGoBack } from '../../utils/safeGoBack';

// Umbral compartido con el resto de la app (ej. LoginScreen, Sidebar) para decidir
// cuándo hay espacio para columnas lado a lado en vez de apilar en una sola.
const WIDE_BREAKPOINT = 860;

function getPersonCols(width) {
  if (width < 500) return 1;
  if (width < 760) return 2;
  return 3;
}

// Mismo patrón que AddEmailModal/LoginScreen — sin este chequeo aquí, un correo mal
// escrito en las filas de bomberos pasaba directo a `/invitations` y solo fallaba ahí.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PUNTOS_QUEMA = [
  { key: 'coept',      label: 'Casa COEPT' },
  { key: 'ataque',     label: 'Casa de ataque' },
  { key: 'progresion', label: 'Casa de progresión' },
];

/** Entrega las hojas de estilo de la pantalla ya resueltas contra el tema. */
function useSheets() {
  const t = useTheme();
  return useMemo(() => ({ s: makeS(t), m: makeM(t), sc: makeSC(t), t }), [t]);
}

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

export default function CrearSesionScreen({ navigation }) {
  const { s, t } = useSheets();
  const [step, setStep] = useState(1);

  // Step 1 — Información de la sesión
  const [nombre,     setNombre]     = useState('');
  const [fecha,      setFecha]      = useState('');
  const [hora,       setHora]       = useState('');
  const [capacidad,  setCapacidad]  = useState('');
  const [puntoQuema, setPuntoQuema] = useState('');
  const [numQuemas,  setNumQuemas]  = useState(2);
  const [showErrors, setShowErrors] = useState(false);

  // Step 1 — Ubicación de entrenamiento (API)
  const [locations,         setLocations]         = useState([]);
  const [loadingLocations,  setLoadingLocations]  = useState(true);
  const [locationId,        setLocationId]        = useState('');

  // Step 1 — Médicos (API)
  const [allMedicos,      setAllMedicos]      = useState([]);
  const [loadingMedicos,  setLoadingMedicos]  = useState(true);
  const [medicoFilter,    setMedicoFilter]    = useState('todos');
  const [medicoSearch,    setMedicoSearch]    = useState('');
  const [selectedMedicos, setSelectedMedicos] = useState([]);
  const [showAddMedico,   setShowAddMedico]   = useState(false);

  // Step 2 — Capacitadores (API)
  const [allCapacitadores, setAllCapacitadores] = useState([]);
  const [loadingCaps,      setLoadingCaps]      = useState(true);
  const [capSearch,        setCapSearch]         = useState('');
  const [selectedCaps,     setSelectedCaps]      = useState([]);
  const [showAddCap,       setShowAddCap]        = useState(false);

  // Step 2 — Bomberos (lista de correos)
  const [bomberoEmails, setBomberoEmails] = useState(['', '', '', '']);
  const [saving,        setSaving]        = useState(false);
  const [successData,   setSuccessData]   = useState(null);
  // Alert.alert es un no-op en web, así que los errores del formulario se muestran
  // dentro de la pantalla en vez de en un diálogo nativo que nunca aparecería.
  const [formError,     setFormError]     = useState('');
  // Correos añadidos manualmente desde los modales de médico/capacitador.
  const [extraEmails,   setExtraEmails]   = useState([]);

  useEffect(() => {
    healthPersonnelService.getAll()
      .then(list => setAllMedicos(list.map(p => ({
        id:        p.id,
        // Se conserva el userId: las invitaciones se vinculan al usuario, no a la
        // ficha de personal de salud.
        userId:    p.userId,
        name:      p.name,
        specialty: p.specialty ?? p.role,
        email:     p.email,
        role:      p.role?.toLowerCase().includes('enfer') ? 'enfermero'
                 : p.role?.toLowerCase().includes('nutri') ? 'nutricionista'
                 : 'medico',
      }))))
      .catch(() => {})
      .finally(() => setLoadingMedicos(false));
  }, []);

  useEffect(() => {
    trainingLocationService.getAll()
      .then((list) => {
        setLocations(list);
        // Preselecciona la primera ubicación para no obligar a elegir cuando solo hay
        // una registrada; el usuario puede cambiarla si hay más de un centro disponible.
        setLocationId((prev) => prev || list[0]?.id || '');
      })
      .catch(() => {})
      .finally(() => setLoadingLocations(false));
  }, []);

  useEffect(() => {
    api.get('/users?role=CAPACITATOR')
      .then(({ data: wrapper }) =>
        setAllCapacitadores((wrapper.data ?? []).map(u => ({
          id:        u.userId,
          name:      `${u.firstName} ${u.lastName}`.trim(),
          specialty: 'Capacitador',
          email:     u.email,
        })))
      )
      .catch(() => {})
      .finally(() => setLoadingCaps(false));
  }, []);

  const filteredMedicos = useMemo(() => {
    let list = allMedicos;
    if (medicoFilter !== 'todos') list = list.filter(d => d.role === medicoFilter);
    if (medicoSearch.trim())      list = list.filter(d =>
      d.name.toLowerCase().includes(medicoSearch.trim().toLowerCase())
    );
    return list;
  }, [allMedicos, medicoFilter, medicoSearch]);

  const filteredCaps = useMemo(() => {
    if (!capSearch.trim()) return allCapacitadores;
    return allCapacitadores.filter(c =>
      c.name.toLowerCase().includes(capSearch.trim().toLowerCase())
    );
  }, [allCapacitadores, capSearch]);

  function toggleMedico(doc) {
    setSelectedMedicos(prev =>
      prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : [...prev, doc]
    );
  }
  function toggleCap(cap) {
    setSelectedCaps(prev =>
      prev.find(c => c.id === cap.id) ? prev.filter(c => c.id !== cap.id) : [...prev, cap]
    );
  }
  function addBomberoEmail() {
    if (bomberoEmails.length < 20) setBomberoEmails(prev => [...prev, '']);
  }
  function updateBomberoEmail(idx, val) {
    setBomberoEmails(prev => prev.map((e, i) => i === idx ? val : e));
  }
  function removeBomberoEmail(idx) {
    setBomberoEmails(prev => prev.filter((_, i) => i !== idx));
  }

  /**
   * Añade correos capturados en el modal de "Añadir médico/capacitador" a la lista de
   * invitados. Se envían de verdad al crear la sesión, junto con el resto.
   */
  function addExtraEmails(list) {
    setExtraEmails((prev) => {
      const known = new Set(prev);
      return [...prev, ...list.filter((e) => !known.has(e))];
    });
  }

  function handleSiguiente() {
    if (!nombre.trim() || !fecha.trim() || !puntoQuema || !locationId) {
      setShowErrors(true);
      return;
    }
    if (capacidad.trim() !== '' && parseInt(capacidad, 10) <= 0) {
      setShowErrors(true);
      setFormError('La capacidad planeada debe ser mayor a 0.');
      return;
    }
    const start = parseDatetime(fecha, hora);
    if (start && start.getTime() < Date.now()) {
      setShowErrors(true);
      setFormError('La fecha de la sesión no puede ser en el pasado.');
      return;
    }
    setFormError('');
    setShowErrors(false);
    setStep(2);
  }

  /**
   * Crea la sesión y envía las invitaciones.
   *
   * Nota sobre el modelo de datos: `TrainingSession` no tiene columnas para el punto
   * de quema ni el número de quemas, y no existe una relación sesión↔personal. Para no
   * descartar lo que el usuario configuró:
   *   · punto de quema y nº de quemas se guardan en `description` (único campo de texto
   *     libre que el backend persiste) con un formato que la app puede volver a leer;
   *   · médicos y capacitadores se vinculan mediante invitaciones, que es la única
   *     relación real entre una persona y una sesión.
   */
  async function handleCrearSesion() {
    const start = parseDatetime(fecha, hora);
    if (!nombre.trim() || !start) {
      setFormError('Ingresa nombre, fecha (dd/mm/aaaa) y hora (HH:MM AM/PM).');
      return;
    }
    if (!puntoQuema) {
      setFormError('Selecciona el punto de quema en el paso 1.');
      return;
    }
    const selectedLocation = locations.find((l) => l.id === locationId);
    if (!selectedLocation) {
      setFormError('Selecciona una ubicación de entrenamiento en el paso 1.');
      return;
    }
    const invalidBomberoEmails = bomberoEmails.map((e) => e.trim()).filter(Boolean).filter((e) => !EMAIL_RE.test(e));
    if (invalidBomberoEmails.length > 0) {
      setFormError(`Correo(s) de bombero inválido(s): ${invalidBomberoEmails.join(', ')}`);
      return;
    }

    const end = new Date(start.getTime() + 4 * 3_600_000);
    const puntoLabel = PUNTOS_QUEMA.find((p) => p.key === puntoQuema)?.label ?? puntoQuema;

    setFormError('');
    setSaving(true);

    // La creación de la sesión se separa del envío de invitaciones: si el POST de la
    // sesión queda encolado offline (api.js lo reintenta solo cuando vuelva la señal),
    // todavía no existe un trainingSessionId real — las invitaciones dependen de ese
    // ID, así que no se pueden encolar también. Se avisa y se detiene ahí, en vez de
    // tratarlo como un error duro que descarta todo lo que el usuario configuró.
    let sessionWrap;
    try {
      const response = await api.post('/training-sessions', {
        institutionId: selectedLocation.institutionId,
        trainingLocationId: selectedLocation.id,
        title:           nombre.trim(),
        description:     `Punto de quema: ${puntoLabel}. Número de quemas: ${numQuemas}.`,
        sessionCode:     null,
        scheduledStart:  start.toISOString(),
        scheduledEnd:    end.toISOString(),
        plannedCapacity: capacidad.trim() ? parseInt(capacidad, 10) : null,
      });
      sessionWrap = response.data;
    } catch (e) {
      if (!e.response) {
        setFormError('Sin conexión: la sesión quedó guardada localmente y se creará automáticamente cuando vuelva la señal. Las invitaciones deberás enviarlas manualmente después, una vez creada.');
      } else {
        setFormError(e?.response?.data?.message ?? e?.message ?? 'No se pudo crear la sesión.');
      }
      setSaving(false);
      return;
    }

    try {
      const sessionId = sessionWrap.data?.trainingSessionId;

      // Destinatarios: bomberos por correo + personal seleccionado en los pasos 1 y 2.
      const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
      const recipients = [
        ...bomberoEmails.map((e) => e.trim()).filter(Boolean).map((email) => ({ email, userId: null })),
        ...extraEmails.map((email) => ({ email, userId: null })),
        ...selectedMedicos.filter((md) => md.email).map((md) => ({ email: md.email, userId: md.userId ?? null })),
        ...selectedCaps.filter((c) => c.email).map((c) => ({ email: c.email, userId: c.id ?? null })),
      ];

      const results = await Promise.allSettled(
        recipients.map((r) =>
          api.post('/invitations', {
            targetEmail:       r.email,
            trainingSessionId: sessionId,
            targetUserId:      r.userId,
            targetRoleId:      null,
            expiresAt,
          })),
      );

      const sent   = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - sent;

      setSuccessData({
        title:   nombre.trim(),
        invites: sent,
        // Se informa explícitamente si alguna invitación falló: antes se reportaba
        // como enviadas todas las que se intentaron.
        failed,
      });
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'No se pudo crear la sesión.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.pageTitle}>Crear Nueva Sesión</Text>
          <Text style={s.pageSubtitle}>Configura los detalles de la sesión de monitoreo</Text>
        </View>
        <TouchableOpacity
          style={s.volverBtn}
          onPress={() => safeGoBack(navigation)}
          activeOpacity={0.8}
          {...a11yButton('Volver')}
        >
          <Ionicons name="arrow-back" size={15} color={t.textPrimary} />
          <Text style={s.volverText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* Errores del formulario: visibles en la propia pantalla porque Alert.alert
          no muestra nada en web. */}
      {!!formError && (
        <View style={s.errorWrap} {...a11yAlert(formError)}>
          <Toast message={formError} tone="error" />
        </View>
      )}

      {extraEmails.length > 0 && (
        <View style={s.errorWrap}>
          <Toast
            message={`${extraEmails.length} correo(s) adicional(es) se invitarán al crear la sesión.`}
            tone="info"
          />
        </View>
      )}

      {/* ── Barra de pasos ── */}
      <View style={s.stepsBar}>
        <StepIndicator num={1} label="Sesión y médicos" active={step === 1} done={step > 1} />
        <View style={s.stepLine} />
        <StepIndicator num={2} label="Capacitadores y bomberos" active={step === 2} done={false} />
      </View>

      {step === 1 ? (
        <Step1
          nombre={nombre}       setNombre={setNombre}
          fecha={fecha}         setFecha={setFecha}
          hora={hora}           setHora={setHora}
          capacidad={capacidad} setCapacidad={setCapacidad}
          puntoQuema={puntoQuema} setPuntoQuema={setPuntoQuema}
          numQuemas={numQuemas}   setNumQuemas={setNumQuemas}
          locations={locations}   loadingLocations={loadingLocations}
          locationId={locationId} setLocationId={setLocationId}
          medicoFilter={medicoFilter} setMedicoFilter={setMedicoFilter}
          medicoSearch={medicoSearch} setMedicoSearch={setMedicoSearch}
          filteredMedicos={filteredMedicos}
          loadingMedicos={loadingMedicos}
          selectedMedicos={selectedMedicos} toggleMedico={toggleMedico}
          onAddMedico={() => setShowAddMedico(true)}
          showErrors={showErrors}
          onSiguiente={handleSiguiente}
        />
      ) : (
        <Step2
          nombre={nombre} fecha={fecha}
          puntoQuema={puntoQuema} numQuemas={numQuemas}
          selectedMedicos={selectedMedicos}
          filteredCaps={filteredCaps}
          loadingCaps={loadingCaps}
          capSearch={capSearch} setCapSearch={setCapSearch}
          selectedCaps={selectedCaps} toggleCap={toggleCap}
          onAddCap={() => setShowAddCap(true)}
          bomberoEmails={bomberoEmails}
          updateBomberoEmail={updateBomberoEmail}
          removeBomberoEmail={removeBomberoEmail}
          addBomberoEmail={addBomberoEmail}
          onVolver={() => setStep(1)}
          onCrear={handleCrearSesion}
          saving={saving}
        />
      )}

      <AddEmailModal
        visible={showAddMedico}
        title="Añadir Médico"
        subtitle="Los correos se invitarán al crear la sesión."
        onClose={() => setShowAddMedico(false)}
        onSubmit={addExtraEmails}
        actionLabel="Añadir a la sesión"
      />
      <AddEmailModal
        visible={showAddCap}
        title="Añadir Capacitador"
        subtitle="Los correos se invitarán al crear la sesión."
        onClose={() => setShowAddCap(false)}
        onSubmit={addExtraEmails}
        actionLabel="Añadir a la sesión"
      />
      <SuccessModal
        data={successData}
        onClose={() => safeGoBack(navigation)}
      />

    </SafeAreaView>
  );
}

// ── Step 1 ─────────────────────────────────────────────────────────────────────

function Step1({
  nombre, setNombre, fecha, setFecha, hora, setHora,
  capacidad, setCapacidad,
  puntoQuema, setPuntoQuema, numQuemas, setNumQuemas,
  locations, loadingLocations, locationId, setLocationId,
  medicoFilter, setMedicoFilter, medicoSearch, setMedicoSearch,
  filteredMedicos, loadingMedicos, selectedMedicos, toggleMedico, onAddMedico,
  showErrors, onSiguiente,
}) {
  const { s, t } = useSheets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const personCols = getPersonCols(width);
  const errNombre    = showErrors && !nombre.trim();
  const errFecha     = showErrors && !fecha.trim();
  const errPunto     = showErrors && !puntoQuema;
  const errLocation  = showErrors && !locationId;
  const errCapacidad = showErrors && capacidad.trim() !== '' && parseInt(capacidad, 10) <= 0;

  // En pantallas angostas las dos tarjetas se apilan en vez de ir lado a lado — sin
  // esto la fila fuerza ambas a compartir la mitad del ancho, ilegibles en un teléfono.
  // Al apilar, la fila necesita poder desplazarse: dos tarjetas completas casi nunca
  // caben juntas en el alto disponible.
  const RowContainer = isWide ? View : ScrollView;
  const rowContainerProps = isWide
    ? { style: [s.row, { flexDirection: 'row' }] }
    : { style: s.row, contentContainerStyle: { gap: 12 }, showsVerticalScrollIndicator: false };

  return (
    <View style={s.body}>
      <RowContainer {...rowContainerProps}>

        {/* ── Izquierda: Info + Punto de quema + N Quemas ── */}
        <View style={[s.card, isWide && { flex: 0.9 }]}>
          <ScrollView
            style={s.leftCardScroll}
            contentContainerStyle={s.leftCardScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <SectionHeader icon="calendar-outline" title="Información de la Sesión" />

          <View style={s.infoFields}>
            <View style={s.infoField}>
              <View style={s.labelRow}>
                <Text style={s.fieldLabel}>Nombre de Sesión</Text>
                <Text style={s.required}> *</Text>
              </View>
              <TextInput
                style={[s.input, errNombre && s.inputError]}
                value={nombre} onChangeText={setNombre}
                placeholder="Ej: Capacitación G5 — Casa COEPT"
                placeholderTextColor={t.textPlaceholder}
              />
              {errNombre && <Text style={s.errorMsg}>Campo obligatorio</Text>}
            </View>
            <View style={s.infoField}>
              <View style={s.labelRow}>
                <Text style={s.fieldLabel}>Fecha</Text>
                <Text style={s.required}> *</Text>
              </View>
              <TextInput
                style={[s.input, errFecha && s.inputError]}
                value={fecha}
                onChangeText={(v) => setFecha(formatFechaInput(v))}
                placeholder="dd/mm/aaaa" placeholderTextColor={t.textPlaceholder}
                keyboardType="numeric"
                maxLength={10}
              />
              {errFecha && <Text style={s.errorMsg}>Campo obligatorio</Text>}
            </View>
            <View style={s.infoField}>
              <Text style={s.fieldLabel}>Capacidad Planeada</Text>
              <TextInput
                style={[s.input, errCapacidad && s.inputError]}
                value={capacidad}
                onChangeText={(v) => setCapacidad(v.replace(/\D/g, ''))}
                placeholder="Ej: 10"
                placeholderTextColor={t.textPlaceholder}
                keyboardType="numeric"
              />
              {errCapacidad && <Text style={s.errorMsg}>Debe ser mayor a 0</Text>}
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.sectionLabelRow}>
            <SectionHeader icon="location-outline" title="Ubicación de Entrenamiento" />
            <Text style={s.required}>*</Text>
          </View>
          {errLocation && <Text style={s.errorMsg}>Selecciona una ubicación</Text>}
          {loadingLocations ? (
            <ActivityIndicator size="small" color={t.primaryText} style={{ marginVertical: 4 }} />
          ) : locations.length === 0 ? (
            <Text style={s.errorMsg}>
              No hay centros de entrenamiento registrados. Pide a un administrador que agregue uno.
            </Text>
          ) : (
            <View style={s.radioList}>
              {locations.map((loc) => {
                const sel = locationId === loc.id;
                return (
                  <TouchableOpacity
                    key={loc.id} style={[s.radioRow, errLocation && s.radioRowError]}
                    onPress={() => setLocationId(loc.id)} activeOpacity={0.7}
                  >
                    <View style={[s.radio, sel && s.radioSel]}>
                      {sel && <View style={s.radioDot} />}
                    </View>
                    <Text
                      style={[s.radioLabel, sel && s.radioLabelSel]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {loc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={s.divider} />

          <View style={s.sectionLabelRow}>
            <SectionHeader icon="flame-outline" title="Punto de Quema" />
            <Text style={s.required}>*</Text>
          </View>
          {errPunto && <Text style={s.errorMsg}>Selecciona un punto de quema</Text>}
          <View style={s.radioList}>
            {PUNTOS_QUEMA.map(p => {
              const sel = puntoQuema === p.key;
              return (
                <TouchableOpacity
                  key={p.key} style={[s.radioRow, errPunto && s.radioRowError]}
                  onPress={() => setPuntoQuema(p.key)} activeOpacity={0.7}
                >
                  <View style={[s.radio, sel && s.radioSel]}>
                    {sel && <View style={s.radioDot} />}
                  </View>
                  <Text style={[s.radioLabel, sel && s.radioLabelSel]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.divider} />

          <SectionHeader icon="layers-outline" title="Número de Quemas" />
          <View style={s.numRow}>
            {[1, 2, 3, 4].map(n => (
              <TouchableOpacity
                key={n}
                style={[s.numChip, numQuemas === n && s.numChipActive]}
                onPress={() => setNumQuemas(n)}
                activeOpacity={0.8}
              >
                <Text style={[s.numChipText, numQuemas === n && s.numChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          </ScrollView>
        </View>

        {/* ── Derecha: Médicos a Cargo ── */}
        <View style={[s.card, isWide && { flex: 1.1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="medkit-outline" title="Médicos a Cargo" />
            <TouchableOpacity style={s.addBtn} onPress={onAddMedico} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={14} color={t.primaryText} />
              <Text style={s.addBtnText}>Añadir</Text>
            </TouchableOpacity>
          </View>

          <View style={s.filterRow}>
            {DOCTOR_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[s.filterPill, medicoFilter === f.key && s.filterPillActive]}
                onPress={() => setMedicoFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.filterPillText, medicoFilter === f.key && s.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={s.searchSmall}
              value={medicoSearch} onChangeText={setMedicoSearch}
              placeholder="Buscar..." placeholderTextColor={t.textPlaceholder}
            />
          </View>

          {loadingMedicos
            ? <ActivityIndicator size="small" color={t.primaryText} style={{ marginVertical: 8 }} />
            : <PersonGrid people={filteredMedicos} selected={selectedMedicos} onToggle={toggleMedico} cols={personCols} />
          }
          {selectedMedicos.length > 0 && (
            <SelectedTags people={selectedMedicos} onRemove={doc => toggleMedico(doc)} />
          )}
        </View>
      </RowContainer>

      <View style={s.footer}>
        <TouchableOpacity style={s.sigBtn} onPress={onSiguiente} activeOpacity={0.85}>
          <Text style={s.sigBtnText}>Siguiente</Text>
          <Ionicons name="arrow-forward" size={16} color={t.onPrimarySolid} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 2 ─────────────────────────────────────────────────────────────────────

function Step2({
  nombre, fecha, puntoQuema, numQuemas, selectedMedicos,
  filteredCaps, loadingCaps, capSearch, setCapSearch,
  selectedCaps, toggleCap, onAddCap,
  bomberoEmails, updateBomberoEmail, removeBomberoEmail, addBomberoEmail,
  onVolver, onCrear, saving,
}) {
  const { s, t } = useSheets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const personCols = getPersonCols(width);
  const puntoLabel = PUNTOS_QUEMA.find(p => p.key === puntoQuema)?.label ?? '—';
  const RowContainer = isWide ? View : ScrollView;
  const rowContainerProps = isWide
    ? { style: [s.row, { flex: 1, flexDirection: 'row' }] }
    : { style: s.row, contentContainerStyle: { gap: 12 }, showsVerticalScrollIndicator: false };

  return (
    <View style={s.body}>

      {/* ── Resumen arriba, ancho completo ── */}
      <View style={s.card}>
        <SectionHeader icon="document-text-outline" title="Resumen de Sesión" />
        <View style={s.summaryGrid}>
          <SummaryChip icon="text-outline"     label="Nombre"         value={nombre} />
          <SummaryChip icon="calendar-outline" label="Fecha"          value={fecha} />
          <SummaryChip icon="flame-outline"    label="Punto de quema" value={puntoLabel} />
          <SummaryChip icon="layers-outline"   label="N° de quemas"   value={`${numQuemas} quema${numQuemas > 1 ? 's' : ''}`} />
          <SummaryChip
            icon="medkit-outline"
            label="Médicos a cargo"
            value={selectedMedicos.length > 0
              ? selectedMedicos.map(m => m.name).join(' · ')
              : 'Ninguno asignado'}
            wide
          />
        </View>
      </View>

      {/* ── Abajo: dos columnas (apiladas en pantallas angostas) ── */}
      <RowContainer {...rowContainerProps}>

        {/* Capacitadores */}
        <View style={[s.card, { flex: 1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="people-outline" title="Capacitadores a Cargo" />
            <TouchableOpacity style={s.addBtn} onPress={onAddCap} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={14} color={t.primaryText} />
              <Text style={s.addBtnText}>Añadir</Text>
            </TouchableOpacity>
          </View>
          <View style={s.filterRow}>
            <TextInput
              style={[s.searchSmall, { flex: 1 }]}
              value={capSearch} onChangeText={setCapSearch}
              placeholder="Buscar capacitador..." placeholderTextColor={t.textPlaceholder}
            />
          </View>
          {loadingCaps
            ? <ActivityIndicator size="small" color={t.primaryText} style={{ marginVertical: 8 }} />
            : <PersonGrid people={filteredCaps} selected={selectedCaps} onToggle={toggleCap} cols={personCols} />
          }
          {selectedCaps.length > 0 && (
            <SelectedTags people={selectedCaps} onRemove={cap => toggleCap(cap)} />
          )}
        </View>

        {/* Bomberos */}
        <View style={[s.card, { flex: 1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="shield-outline" title={`Bomberos (${bomberoEmails.length}/20)`} />
            <TouchableOpacity
              style={[s.addBtn, bomberoEmails.length >= 20 && s.addBtnDisabled]}
              onPress={addBomberoEmail}
              activeOpacity={0.8}
              disabled={bomberoEmails.length >= 20}
            >
              <Ionicons
                name="person-add-outline" size={14}
                color={bomberoEmails.length >= 20 ? t.textDisabled : t.primaryText}
              />
              <Text style={[s.addBtnText, bomberoEmails.length >= 20 && { color: t.textDisabled }]}>
                Añadir
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={s.emailHint}>Invitación directa por correo electrónico.</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.emailList}>
              {bomberoEmails.map((email, idx) => (
                <View key={idx} style={s.emailRow}>
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    value={email}
                    onChangeText={v => updateBomberoEmail(idx, v)}
                    placeholder={`Bombero ${idx + 1} — correo`}
                    placeholderTextColor={t.textPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={s.removeEmailBtn}
                    onPress={() => removeBomberoEmail(idx)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={16} color={t.status.danger.fg} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

      </RowContainer>

      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={onVolver} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={15} color={t.textSecondary} />
          <Text style={s.cancelBtnText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.crearBtn, saving && { opacity: 0.6 }]} onPress={saving ? undefined : onCrear} activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator size="small" color={t.onPrimarySolid} />
            : <Ionicons name="checkmark-circle-outline" size={16} color={t.onPrimarySolid} />
          }
          <Text style={s.crearBtnText}>{saving ? 'Creando...' : 'Crear Sesión'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Componentes ───────────────────────────────────────────────────────────────

function StepIndicator({ num, label, active, done }) {
  const { s, t } = useSheets();
  return (
    <View style={s.stepWrap}>
      <View style={[s.stepBubble, active && s.stepBubbleActive, done && s.stepBubbleDone]}>
        {done
          ? <Ionicons name="checkmark" size={13} color={t.onPrimarySolid} />
          : <Text style={[s.stepNum, (active || done) && { color: t.onPrimarySolid }]}>{num}</Text>
        }
      </View>
      <Text style={[s.stepLabel, active && s.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ icon, title }) {
  const { s, t } = useSheets();
  return (
    <View style={s.sectionHeaderRow}>
      <Ionicons name={icon} size={16} color={t.primaryText} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function SummaryChip({ icon, label, value, wide }) {
  const { s, t } = useSheets();
  return (
    <View style={[s.summaryChip, wide && s.summaryChipWide]}>
      <View style={s.summaryChipIcon}>
        <Ionicons name={icon} size={14} color={t.primaryText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.summaryChipLabel}>{label}</Text>
        <Text style={s.summaryChipValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function PersonGrid({ people, selected, onToggle, cols }) {
  const { s, t } = useSheets();
  const rows = [];
  for (let i = 0; i < people.length; i += cols) rows.push(people.slice(i, i + cols));
  return (
    <View style={s.personGrid}>
      {rows.map((row, ri) => (
        <View key={ri} style={s.personRow}>
          {row.map(p => {
            const isSel = !!selected.find(x => x.id === p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[s.personCard, isSel && s.personCardSel]}
                onPress={() => onToggle(p)}
                activeOpacity={0.8}
              >
                {isSel && <Ionicons name="checkmark" size={14} color={t.primaryText} style={s.checkmarkAbs} />}
                <Text style={s.personName} numberOfLines={1}>{p.name}</Text>
                <Text style={s.personSpec} numberOfLines={1}>{p.specialty}</Text>
                <Text style={s.personEmail} numberOfLines={1}>{p.email}</Text>
              </TouchableOpacity>
            );
          })}
          {row.length < cols && Array.from({ length: cols - row.length }).map((_, i) => (
            <View key={i} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function SelectedTags({ people, onRemove }) {
  const { s } = useSheets();
  return (
    <View style={s.tagsRow}>
      <Text style={s.tagsLabel}>Seleccionados:</Text>
      {people.map(p => (
        <TouchableOpacity key={p.id} style={s.tag} onPress={() => onRemove(p)} activeOpacity={0.8}>
          <Text style={s.tagText}>{p.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/**
 * Modal para invitar personal por correo.
 *
 * Los correos se acumulan en `pendingEmails` del formulario principal y se envían como
 * invitaciones reales al crear la sesión. Antes este modal solo mostraba un mensaje de
 * éxito sin llamar a ninguna API: el usuario creía haber invitado a alguien que nunca
 * recibió nada.
 */
function AddEmailModal({ visible, title, subtitle, onClose, onSubmit, actionLabel }) {
  const { m, t } = useSheets();
  const [emails, setEmails] = useState(['', '']);
  const [error, setError]   = useState('');

  function addEmail()          { setEmails((p) => [...p, '']); }
  function updateEmail(idx, v) { setEmails((p) => p.map((e, i) => (i === idx ? v : e))); }
  function removeEmail(idx)    { setEmails((p) => p.filter((_, i) => i !== idx)); }

  function handleEnviar() {
    const valid = emails.map((e) => e.trim()).filter(Boolean);
    if (valid.length === 0) {
      setError('Ingresa al menos un correo electrónico.');
      return;
    }
    const malformed = valid.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (malformed.length) {
      setError(`Correo no válido: ${malformed[0]}`);
      return;
    }
    setError('');
    onSubmit(valid);
    setEmails(['', '']);
    onClose();
  }

  function handleClose() {
    setError('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={m.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={m.overlay} onPress={handleClose}>
        <Pressable style={m.box} onPress={(e) => e.stopPropagation()} {...a11yModal(title)}>
          <TouchableOpacity style={m.closeBtn} onPress={handleClose} {...a11yButton('Cerrar')}>
            <Ionicons name="close" size={20} color={t.textPrimary} />
          </TouchableOpacity>
          <Text style={m.title} accessibilityRole="header">{title}</Text>
          <Text style={m.subtitle}>{subtitle}</Text>

          {!!error && (
            <Text style={m.errorText} {...a11yAlert(error)}>{error}</Text>
          )}

          <View style={m.emailList}>
            {emails.map((e, idx) => (
              <View key={`email-${idx}`} style={m.emailRow}>
                <TextInput
                  style={m.emailInput}
                  value={e}
                  onChangeText={(v) => { updateEmail(idx, v); setError(''); }}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={t.textPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={`Correo ${idx + 1}`}
                />
                {emails.length > 1 && (
                  <TouchableOpacity
                    style={m.removeBtn}
                    onPress={() => removeEmail(idx)}
                    activeOpacity={0.8}
                    {...a11yButton(`Quitar correo ${idx + 1}`)}
                  >
                    <Ionicons name="close" size={14} color={t.status.danger.fg} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={m.addMoreBtn}
            onPress={addEmail}
            activeOpacity={0.8}
            {...a11yButton('Añadir otro correo')}
          >
            <Ionicons name="person-add-outline" size={14} color={t.textSecondary} />
            <Text style={m.addMoreText}>Añadir otro correo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={m.submitBtn}
            onPress={handleEnviar}
            activeOpacity={0.85}
            {...a11yButton(actionLabel)}
          >
            <Text style={m.submitText}>{actionLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Modal de éxito ───────────────────────────────────────────────────────────

function SuccessModal({ data, onClose }) {
  const { m, sc, t } = useSheets();
  return (
    <Modal visible={!!data} transparent animationType="fade">
      <View style={m.overlay}>
        <View style={m.box}>

          {/* Icono */}
          <View style={sc.iconCircle}>
            <Ionicons name="checkmark-circle" size={48} color={t.status.success.fg} />
          </View>

          <Text style={sc.title}>¡Sesión Creada!</Text>
          <Text style={sc.sessionName}>{data?.title}</Text>

          <View style={sc.divider} />

          <View style={sc.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={t.textMuted} />
            <Text style={sc.infoText}>La sesión fue registrada exitosamente</Text>
          </View>

          {data?.invites > 0 && (
            <View style={sc.infoRow}>
              <Ionicons name="mail-outline" size={16} color={t.textSecondary} />
              <Text style={sc.infoText}>
                {data.invites} invitación{data.invites > 1 ? 'es enviadas' : ' enviada'}
              </Text>
            </View>
          )}

          {/* Fallos parciales: el usuario debe saber que no todas se enviaron. */}
          {data?.failed > 0 && (
            <View style={sc.infoRow}>
              <Ionicons name="alert-circle-outline" size={16} color={t.status.danger.fg} />
              <Text style={[sc.infoText, sc.infoTextError]}>
                {data.failed} invitación{data.failed > 1 ? 'es no se pudieron enviar' : ' no se pudo enviar'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={sc.btn}
            onPress={onClose}
            activeOpacity={0.85}
            {...a11yButton('Ver sesiones')}
          >
            <Ionicons name="arrow-back-outline" size={16} color={t.onPrimarySolid} />
            <Text style={sc.btnText}>Ver Sesiones</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const makeS = (t) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: t.background },

  errorWrap: { paddingHorizontal: 20, paddingBottom: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14,
  },
  pageTitle:    { fontSize: 20, fontWeight: '800', color: t.textPrimary },
  pageSubtitle: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  volverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: t.card, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: t.border,
  },
  volverText: { fontSize: 13, fontWeight: '600', color: t.textPrimary },

  stepsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 10 },
  stepWrap:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBubble:      { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: t.border },
  stepBubbleActive:{ backgroundColor: t.primarySolid },
  stepBubbleDone:  { backgroundColor: t.status.success.solid },
  stepNum:         { fontSize: 12, fontWeight: '700', color: t.textMuted },
  stepLabel:       { fontSize: 12, fontWeight: '600', color: t.iconMuted },
  stepLabelActive: { color: t.primaryText },
  stepLine:        { flex: 1, height: 2, backgroundColor: t.border, marginHorizontal: 10 },

  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  row:  { flex: 1, flexDirection: 'row', gap: 12 },

  card: {
    backgroundColor: t.card, borderRadius: 14,
    borderWidth: 1, borderColor: t.border,
    padding: 16, gap: 12,
    shadowColor: t.shadowColor, shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  leftCardScroll:        { flex: 1 },
  leftCardScrollContent: { gap: 12, paddingBottom: 4 },
  cardHeaderRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: t.textPrimary },
  sectionLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider:          { height: 1, backgroundColor: t.divider },

  // Campos
  infoFields: { gap: 10 },
  infoField:  { gap: 5 },
  labelRow:   { flexDirection: 'row', alignItems: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: t.textSecondary },
  required:   { fontSize: 13, fontWeight: '700', color: t.status.danger.fg },
  input: {
    backgroundColor: t.cardAlt, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: t.textPrimary,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputError: { borderColor: t.status.danger.border, backgroundColor: t.status.danger.bg },
  errorMsg:   { fontSize: 11, color: t.status.danger.fg, marginTop: 2 },

  // Radio buttons (single-select punto de quema)
  radioList:     { gap: 10 },
  radioRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2, minWidth: 0 },
  radioRowError: { opacity: 0.8 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: t.borderStrong,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: t.card,
  },
  radioSel:   { borderColor: t.primary },
  radioDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: t.primarySolid },
  radioLabel: { fontSize: 13, color: t.textPrimary, fontWeight: '500', flexShrink: 1 },
  radioLabelSel: { color: t.primaryText, fontWeight: '700' },

  // Num quemas
  numRow: { flexDirection: 'row', gap: 10 },
  numChip: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: t.borderStrong,
    alignItems: 'center', justifyContent: 'center', backgroundColor: t.cardAlt,
  },
  numChipActive:     { backgroundColor: t.primarySolid, borderColor: t.primary },
  numChipText:       { fontSize: 18, fontWeight: '700', color: t.textMuted },
  numChipTextActive: { color: t.onPrimarySolid },

  // Filter
  filterRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterPill:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: t.status.neutral.solid },
  filterPillActive:    { backgroundColor: t.primarySolid },
  filterPillText:      { color: t.onPrimarySolid, fontSize: 12, fontWeight: '600' },
  filterPillTextActive:{ color: t.onPrimarySolid },
  searchSmall: {
    backgroundColor: t.cardAlt, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 12, color: t.textPrimary, minWidth: 120,
  },

  // Person grid
  personGrid: { flex: 1, gap: 8 },
  personRow:  { flexDirection: 'row', gap: 8 },
  personCard: {
    flex: 1, backgroundColor: t.cardAlt,
    borderRadius: 10, borderWidth: 1, borderColor: t.border,
    padding: 10, gap: 2, position: 'relative',
  },
  personCardSel: { borderColor: t.primary, backgroundColor: t.primarySoft },
  checkmarkAbs:  { position: 'absolute', top: 8, right: 8 },
  personName:    { fontSize: 12, fontWeight: '700', color: t.textPrimary, paddingRight: 20 },
  personSpec:    { fontSize: 11, color: t.textMuted },
  personEmail:   { fontSize: 10, color: t.iconMuted },

  // Tags
  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tagsLabel:{ fontSize: 12, fontWeight: '600', color: t.textSecondary },
  tag:      { backgroundColor: t.primarySolid, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:  { color: t.onPrimarySolid, fontSize: 11, fontWeight: '600' },

  // Add btn
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: t.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnDisabled: { borderColor: t.border },
  addBtnText:     { fontSize: 13, color: t.primaryText, fontWeight: '600' },

  // Summary
  summaryGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  summaryChip:     { flexDirection: 'row', alignItems: 'center', gap: 10, width: '23%', backgroundColor: t.cardAlt, borderRadius: 10, borderWidth: 1, borderColor: t.border, padding: 10 },
  summaryChipWide: { width: '100%' },
  summaryChipIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: t.primarySoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  summaryChipLabel:{ fontSize: 10, fontWeight: '700', color: t.iconMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryChipValue:{ fontSize: 13, fontWeight: '700', color: t.textPrimary, marginTop: 1 },

  emailHint: { fontSize: 11, color: t.iconMuted, fontStyle: 'italic' },
  emailList: { gap: 8 },
  emailRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeEmailBtn: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1.5, borderColor: t.status.danger.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Footer
  footer:       { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  sigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: t.primarySolid, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  sigBtnText:   { color: t.onPrimarySolid, fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: t.borderStrong,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: t.textSecondary },
  crearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: t.primarySolid, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  crearBtnText: { color: t.onPrimarySolid, fontSize: 14, fontWeight: '700' },
  });

const makeM = (t) =>
  StyleSheet.create({
  kbAvoid:   { flex: 1 },
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  box:       { width: '100%', maxWidth: 460, backgroundColor: t.card, borderRadius: 16, padding: 28, gap: 14 },
  errorText: {
    fontSize: 13, color: t.status.danger.fg, fontWeight: '600',
    backgroundColor: t.status.danger.bg, borderRadius: 8, padding: 10,
  },
  closeBtn:  { position: 'absolute', top: 16, right: 16, padding: 4 },
  title:     { fontSize: 18, fontWeight: '800', color: t.textPrimary },
  subtitle:  { fontSize: 13, color: t.textMuted, lineHeight: 20 },
  emailList: { gap: 10 },
  emailRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailInput: {
    flex: 1, backgroundColor: t.cardAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: t.textPrimary,
  },
  removeBtn: {
    width: 34, height: 34, borderRadius: 8,
    borderWidth: 1.5, borderColor: t.status.danger.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: t.border, borderRadius: 10,
    paddingVertical: 10, justifyContent: 'center',
  },
  addMoreText: { fontSize: 13, color: t.textSecondary, fontWeight: '600' },
  submitBtn:   { backgroundColor: t.primarySolid, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitText:  { color: t.onPrimarySolid, fontSize: 15, fontWeight: '700' },
  });

const makeSC = (t) =>
  StyleSheet.create({
  infoTextError: { color: t.status.danger.fg, fontWeight: '600' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: t.status.success.bg,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '800', color: t.textPrimary,
    textAlign: 'center',
  },
  sessionName: {
    fontSize: 14, color: t.textMuted, textAlign: 'center',
    fontWeight: '600',
  },
  divider: {
    height: 1, backgroundColor: t.pill, marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  infoText: { fontSize: 13, color: t.textSecondary },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: t.primarySolid, borderRadius: 10,
    paddingVertical: 14, marginTop: 4,
  },
  btnText: { color: t.onPrimarySolid, fontSize: 15, fontWeight: '700' },
  });
