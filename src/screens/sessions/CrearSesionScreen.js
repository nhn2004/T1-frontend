import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DOCTOR_FILTERS } from './__mocks__/crearSesionData';
import { healthPersonnelService } from '../../services/healthPersonnelService';
import api from '../../services/api';

const COLS = 3;

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
  const [step, setStep] = useState(1);

  // Step 1 — Información de la sesión
  const [nombre,    setNombre]    = useState('');
  const [fecha,     setFecha]     = useState('');
  const [hora,      setHora]      = useState('');
  const [capacidad, setCapacidad] = useState('');

  // Step 1 — Doctores (API)
  const [allDoctors,     setAllDoctors]     = useState([]);
  const [loadingDocs,    setLoadingDocs]    = useState(true);
  const [doctorFilter,   setDoctorFilter]   = useState('todos');
  const [doctorSearch,   setDoctorSearch]   = useState('');
  const [selectedDocs,   setSelectedDocs]   = useState([]);
  const [showAddDoctor,  setShowAddDoctor]  = useState(false);

  // Step 2 — Capacitadores (API)
  const [allCapacitadores, setAllCapacitadores] = useState([]);
  const [loadingCaps,      setLoadingCaps]      = useState(true);
  const [capSearch,        setCapSearch]         = useState('');
  const [selectedCaps,     setSelectedCaps]      = useState([]);
  const [showAddCap,       setShowAddCap]        = useState(false);

  // Step 2 — Bomberos (lista de correos)
  const [bomberoEmails,  setBomberoEmails]  = useState(['', '', '', '']);
  const [saving,         setSaving]         = useState(false);
  const [successData,    setSuccessData]    = useState(null);

  // ── Carga personal médico ──────────────────────────────────────────────────
  useEffect(() => {
    healthPersonnelService.getAll()
      .then(list => setAllDoctors(list.map(p => ({
        id:        p.id,
        name:      p.name,
        specialty: p.specialty ?? p.role,
        email:     p.email,
        role:      p.role?.toLowerCase().includes('enfer') ? 'enfermero'
                 : p.role?.toLowerCase().includes('nutri') ? 'nutricionista'
                 : 'medico',
      }))))
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);

  // ── Carga capacitadores ────────────────────────────────────────────────────
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

  // ── Filtrado doctores ──────────────────────────────────────────────────────
  const filteredDoctors = useMemo(() => {
    let list = allDoctors;
    if (doctorFilter !== 'todos') list = list.filter(d => d.role === doctorFilter);
    if (doctorSearch.trim())      list = list.filter(d =>
      d.name.toLowerCase().includes(doctorSearch.trim().toLowerCase())
    );
    return list;
  }, [allDoctors, doctorFilter, doctorSearch]);

  const filteredCaps = useMemo(() => {
    if (!capSearch.trim()) return allCapacitadores;
    return allCapacitadores.filter(c =>
      c.name.toLowerCase().includes(capSearch.trim().toLowerCase())
    );
  }, [allCapacitadores, capSearch]);

  function toggleDoc(doc) {
    setSelectedDocs(prev =>
      prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : [...prev, doc]
    );
  }
  function toggleCap(cap) {
    setSelectedCaps(prev =>
      prev.find(c => c.id === cap.id) ? prev.filter(c => c.id !== cap.id) : [...prev, cap]
    );
  }

  function addBomberoEmail() {
    setBomberoEmails(prev => [...prev, '']);
  }
  function updateBomberoEmail(idx, val) {
    setBomberoEmails(prev => prev.map((e, i) => i === idx ? val : e));
  }
  function removeBomberoEmail(idx) {
    setBomberoEmails(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleCrearSesion() {
    const start = parseDatetime(fecha, hora);
    if (!nombre.trim() || !start) {
      Alert.alert('Faltan datos', 'Ingresa nombre, fecha (dd/mm/aaaa) y hora (HH:MM AM/PM).');
      return;
    }
    const end = new Date(start.getTime() + 4 * 3_600_000);

    setSaving(true);
    try {
      // Resolver institución y ubicación
      const [{ data: instWrap }, { data: locWrap }] = await Promise.all([
        api.get('/institutions'),
        api.get('/training-locations'),
      ]);
      const institutionId       = instWrap.data?.[0]?.institutionId;
      const trainingLocationId  = locWrap.data?.[0]?.trainingLocationId;

      if (!institutionId || !trainingLocationId) {
        Alert.alert('Error', 'No se encontró institución o ubicación de entrenamiento.');
        return;
      }

      // Crear sesión
      const { data: sessionWrap } = await api.post('/training-sessions', {
        institutionId,
        trainingLocationId,
        title:          nombre.trim(),
        description:    null,
        sessionCode:    null,
        scheduledStart: start.toISOString(),
        scheduledEnd:   end.toISOString(),
        plannedCapacity: capacidad.trim() ? parseInt(capacidad, 10) : null,
      });
      const sessionId = sessionWrap.data?.trainingSessionId;

      // Invitar bomberos
      const validEmails = bomberoEmails.map(e => e.trim()).filter(Boolean);
      const expiresAt   = new Date(Date.now() + 7 * 86_400_000).toISOString();
      await Promise.allSettled(
        validEmails.map(email =>
          api.post('/invitations', {
            targetEmail:       email,
            trainingSessionId: sessionId,
            targetUserId:      null,
            targetRoleId:      null,
            expiresAt,
          })
        )
      );

      setSuccessData({
        title:   nombre.trim(),
        invites: validEmails.length,
      });
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'No se pudo crear la sesión.';
      Alert.alert('Error al crear sesión', msg);
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
        <TouchableOpacity style={s.volverBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={15} color="#2E2E2E" />
          <Text style={s.volverText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* ── Contenido por step ── */}
      {step === 1 ? (
        <Step1
          nombre={nombre}       setNombre={setNombre}
          fecha={fecha}         setFecha={setFecha}
          hora={hora}           setHora={setHora}
          capacidad={capacidad} setCapacidad={setCapacidad}
          doctorFilter={doctorFilter} setDoctorFilter={setDoctorFilter}
          doctorSearch={doctorSearch} setDoctorSearch={setDoctorSearch}
          filteredDoctors={filteredDoctors}
          loadingDocs={loadingDocs}
          selectedDocs={selectedDocs} toggleDoc={toggleDoc}
          onAddDoctor={() => setShowAddDoctor(true)}
          onSiguiente={() => setStep(2)}
        />
      ) : (
        <Step2
          filteredCaps={filteredCaps}
          loadingCaps={loadingCaps}
          capSearch={capSearch} setCapSearch={setCapSearch}
          selectedCaps={selectedCaps} toggleCap={toggleCap}
          onAddCap={() => setShowAddCap(true)}
          bomberoEmails={bomberoEmails}
          updateBomberoEmail={updateBomberoEmail}
          removeBomberoEmail={removeBomberoEmail}
          addBomberoEmail={addBomberoEmail}
          onCancelar={() => setStep(1)}
          onCrear={handleCrearSesion}
          saving={saving}
        />
      )}

      {/* ── Modales ── */}
      <AddEmailModal
        visible={showAddDoctor}
        title="Añadir Doctor"
        onClose={() => setShowAddDoctor(false)}
        actionLabel="Enviar Solicitud"
      />
      <AddEmailModal
        visible={showAddCap}
        title="Añadir Capacitador"
        onClose={() => setShowAddCap(false)}
        actionLabel="Enviar Invitación"
      />
      <SuccessModal
        data={successData}
        onClose={() => navigation.goBack()}
      />

    </SafeAreaView>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({
  nombre, setNombre, fecha, setFecha, hora, setHora,
  capacidad, setCapacidad,
  doctorFilter, setDoctorFilter, doctorSearch, setDoctorSearch,
  filteredDoctors, loadingDocs, selectedDocs, toggleDoc, onAddDoctor, onSiguiente,
}) {
  return (
    <View style={s.body}>
      <View style={s.row}>

        {/* Información de la Sesión */}
        <View style={[s.card, { flex: 0.85 }]}>
          <SectionHeader icon="calendar-outline" title="Información de la Sesión" />
          <View style={s.infoFields}>
            <View style={s.infoField}>
              <Text style={s.fieldLabel}>Nombre de Sesión</Text>
              <TextInput
                style={s.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Prueba chequeo G5"
                placeholderTextColor="#B0B7C3"
              />
            </View>
            <View style={s.infoField}>
              <Text style={s.fieldLabel}>Fecha</Text>
              <TextInput
                style={s.input}
                value={fecha}
                onChangeText={setFecha}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#B0B7C3"
              />
            </View>
            <View style={s.infoField}>
              <Text style={s.fieldLabel}>Hora</Text>
              <TextInput
                style={s.input}
                value={hora}
                onChangeText={setHora}
                placeholder="09:00 AM"
                placeholderTextColor="#B0B7C3"
              />
            </View>
            <View style={s.infoField}>
              <Text style={s.fieldLabel}>Capacidad Planeada</Text>
              <TextInput
                style={s.input}
                value={capacidad}
                onChangeText={setCapacidad}
                placeholder="Ej: 10"
                placeholderTextColor="#B0B7C3"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Doctores a Cargo */}
        <View style={[s.card, { flex: 1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="people-outline" title="Doctores a Cargo" />
            <TouchableOpacity style={s.addBtn} onPress={onAddDoctor} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={14} color="#E85D27" />
              <Text style={s.addBtnText}>Añadir Doctor</Text>
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <View style={s.filterRow}>
            {DOCTOR_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[s.filterPill, doctorFilter === f.key && s.filterPillActive]}
                onPress={() => setDoctorFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.filterPillText, doctorFilter === f.key && s.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={s.searchSmall}
              value={doctorSearch}
              onChangeText={setDoctorSearch}
              placeholder="Buscar..."
              placeholderTextColor="#B0B7C3"
            />
          </View>

          {/* Grid de doctores */}
          {loadingDocs
            ? <ActivityIndicator size="small" color="#E85D27" style={{ marginVertical: 8 }} />
            : <PersonGrid people={filteredDoctors} selected={selectedDocs} onToggle={toggleDoc} cols={COLS} />
          }

          {/* Seleccionados */}
          {selectedDocs.length > 0 && (
            <SelectedTags people={selectedDocs} onRemove={doc => toggleDoc(doc)} />
          )}
        </View>

      </View>

      {/* Siguiente */}
      <View style={s.footer}>
        <TouchableOpacity style={s.sigBtn} onPress={onSiguiente} activeOpacity={0.85}>
          <Text style={s.sigBtnText}>Siguiente</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({
  filteredCaps, loadingCaps, capSearch, setCapSearch,
  selectedCaps, toggleCap, onAddCap,
  bomberoEmails, updateBomberoEmail, removeBomberoEmail, addBomberoEmail,
  onCancelar, onCrear, saving,
}) {
  return (
    <View style={s.body}>
      <View style={s.row}>

        {/* Capacitador a Cargo */}
        <View style={[s.card, { flex: 1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="people-outline" title="Capacitador a Cargo" />
            <TouchableOpacity style={s.addBtn} onPress={onAddCap} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={14} color="#E85D27" />
              <Text style={s.addBtnText}>Añadir Capacitador</Text>
            </TouchableOpacity>
          </View>

          {/* Buscador */}
          <View style={s.filterRow}>
            <TextInput
              style={[s.searchSmall, { flex: 1 }]}
              value={capSearch}
              onChangeText={setCapSearch}
              placeholder="Buscar capacitador..."
              placeholderTextColor="#B0B7C3"
            />
          </View>

          {loadingCaps
            ? <ActivityIndicator size="small" color="#E85D27" style={{ marginVertical: 8 }} />
            : <PersonGrid people={filteredCaps} selected={selectedCaps} onToggle={toggleCap} cols={COLS} />
          }

          {selectedCaps.length > 0 && (
            <SelectedTags people={selectedCaps} onRemove={cap => toggleCap(cap)} />
          )}
        </View>

        {/* Bomberos Participantes */}
        <View style={[s.card, { flex: 0.85 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="people-outline" title="Bomberos Participantes" />
            <TouchableOpacity style={s.addBtn} onPress={addBomberoEmail} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={14} color="#E85D27" />
              <Text style={s.addBtnText}>Añadir Bombero</Text>
            </TouchableOpacity>
          </View>

          <View style={s.emailList}>
            {bomberoEmails.map((email, idx) => (
              <View key={idx} style={s.emailRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={email}
                  onChangeText={v => updateBomberoEmail(idx, v)}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#B0B7C3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={s.removeEmailBtn}
                  onPress={() => removeBomberoEmail(idx)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={16} color="#D83B35" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

      </View>

      {/* Botones */}
      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancelar} activeOpacity={0.8}>
          <Text style={s.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.crearBtn, saving && { opacity: 0.6 }]} onPress={saving ? undefined : onCrear} activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          }
          <Text style={s.crearBtnText}>{saving ? 'Creando...' : 'Crear Sesión'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Componentes reutilizables ─────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <View style={s.sectionHeaderRow}>
      <Ionicons name={icon} size={16} color="#E85D27" />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function PersonGrid({ people, selected, onToggle, cols }) {
  const rows = [];
  for (let i = 0; i < people.length; i += cols) {
    rows.push(people.slice(i, i + cols));
  }
  return (
    <View style={s.personGrid}>
      {rows.map((row, ri) => (
        <View key={ri} style={s.personRow}>
          {row.map(p => {
            const isSelected = !!selected.find(x => x.id === p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[s.personCard, isSelected && s.personCardSelected]}
                onPress={() => onToggle(p)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#E85D27" style={s.checkmark} />
                )}
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
  return (
    <View style={s.tagsRow}>
      <Text style={s.tagsLabel}>Seleccionados:</Text>
      {people.map(p => (
        <TouchableOpacity
          key={p.id}
          style={s.tag}
          onPress={() => onRemove(p)}
          activeOpacity={0.8}
        >
          <Text style={s.tagText}>{p.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Modal para añadir por correo ──────────────────────────────────────────────

function AddEmailModal({ visible, title, onClose, actionLabel }) {
  const [emails, setEmails] = useState(['', '', '', '', '']);

  function addEmail() { setEmails(p => [...p, '']); }
  function updateEmail(idx, val) { setEmails(p => p.map((e, i) => i === idx ? val : e)); }
  function removeEmail(idx) { setEmails(p => p.filter((_, i) => i !== idx)); }

  function handleEnviar() {
    onClose();
    Alert.alert('Solicitud enviada', 'Las invitaciones fueron enviadas correctamente.');
    setEmails(['', '', '', '', '']);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={m.box} onPress={e => e.stopPropagation()}>

          <TouchableOpacity style={m.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#2E2E2E" />
          </TouchableOpacity>

          <Text style={m.title}>{title}</Text>
          <Text style={m.subtitle}>
            Ingresa los correos electrónicos de los doctores que deseas invitar
          </Text>

          <View style={m.emailList}>
            {emails.map((e, idx) => (
              <View key={idx} style={m.emailRow}>
                <TextInput
                  style={m.emailInput}
                  value={e}
                  onChangeText={v => updateEmail(idx, v)}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#B0B7C3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={m.removeBtn} onPress={() => removeEmail(idx)} activeOpacity={0.8}>
                  <Ionicons name="close" size={14} color="#D83B35" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={m.addMoreBtn} onPress={addEmail} activeOpacity={0.8}>
            <Ionicons name="person-add-outline" size={14} color="#495565" />
            <Text style={m.addMoreText}>Añadir otro correo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={m.submitBtn} onPress={handleEnviar} activeOpacity={0.85}>
            <Text style={m.submitText}>{actionLabel}</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Modal de éxito ───────────────────────────────────────────────────────────

function SuccessModal({ data, onClose }) {
  return (
    <Modal visible={!!data} transparent animationType="fade">
      <View style={m.overlay}>
        <View style={m.box}>

          {/* Icono */}
          <View style={sc.iconCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          </View>

          <Text style={sc.title}>¡Sesión Creada!</Text>
          <Text style={sc.sessionName}>{data?.title}</Text>

          <View style={sc.divider} />

          <View style={sc.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#697282" />
            <Text style={sc.infoText}>La sesión fue registrada exitosamente</Text>
          </View>

          {data?.invites > 0 && (
            <View style={sc.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#697282" />
              <Text style={sc.infoText}>
                {data.invites} invitación{data.invites > 1 ? 'es enviadas' : ' enviada'} a bomberos
              </Text>
            </View>
          )}

          <TouchableOpacity style={sc.btn} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="arrow-back-outline" size={16} color="#fff" />
            <Text style={sc.btnText}>Ver Sesiones</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14,
  },
  pageTitle:    { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  pageSubtitle: { fontSize: 12, color: '#697282', marginTop: 2 },
  volverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  volverText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },

  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  row:  { flex: 1, flexDirection: 'row', gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8EBF0',
    padding: 16, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#E85D27', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { fontSize: 13, color: '#E85D27', fontWeight: '600' },

  infoFields: { gap: 10 },
  infoField:  { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#495565' },
  input: {
    backgroundColor: '#F3F3F5', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: '#2E2E2E',
  },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    backgroundColor: '#555',
  },
  filterPillActive: { backgroundColor: '#E85D27' },
  filterPillText:   { color: '#fff', fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: '#fff' },
  searchSmall: {
    backgroundColor: '#F3F3F5', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 12, color: '#2E2E2E', minWidth: 120,
  },

  // Person grid
  personGrid: { flex: 1, gap: 8 },
  personRow:  { flexDirection: 'row', gap: 8 },
  personCard: {
    flex: 1, backgroundColor: '#F9FAFB',
    borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0',
    padding: 10, gap: 2, position: 'relative',
  },
  personCardSelected: { borderColor: '#E85D27', backgroundColor: '#FFF5F0' },
  checkmark: { position: 'absolute', top: 8, right: 8 },
  personName:  { fontSize: 12, fontWeight: '700', color: '#2E2E2E', paddingRight: 20 },
  personSpec:  { fontSize: 11, color: '#697282' },
  personEmail: { fontSize: 10, color: '#9AA3B0' },

  // Selected tags
  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tagsLabel:{ fontSize: 12, fontWeight: '600', color: '#495565' },
  tag: {
    backgroundColor: '#E85D27', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Bombero emails
  emailList: { gap: 8, flex: 1 },
  emailRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeEmailBtn: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D83B35',
    alignItems: 'center', justifyContent: 'center',
  },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  sigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E85D27', borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  sigBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D0D5DD',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#495565' },
  crearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E85D27', borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  crearBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

const m = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    width: 480, backgroundColor: '#fff',
    borderRadius: 16, padding: 28, gap: 14,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 4 },
  title:    { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#697282', lineHeight: 20 },

  emailList: { gap: 10 },
  emailRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailInput: {
    flex: 1, backgroundColor: '#F3F3F5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: '#2E2E2E',
  },
  removeBtn: {
    width: 34, height: 34, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D83B35',
    alignItems: 'center', justifyContent: 'center',
  },

  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    paddingVertical: 10, justifyContent: 'center',
  },
  addMoreText: { fontSize: 13, color: '#495565', fontWeight: '600' },

  submitBtn: {
    backgroundColor: '#E85D27', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

const sc = StyleSheet.create({
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '800', color: '#1A1A1A',
    textAlign: 'center',
  },
  sessionName: {
    fontSize: 14, color: '#697282', textAlign: 'center',
    fontWeight: '600',
  },
  divider: {
    height: 1, backgroundColor: '#F0F0F0', marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  infoText: { fontSize: 13, color: '#495565' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#E85D27', borderRadius: 10,
    paddingVertical: 14, marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
