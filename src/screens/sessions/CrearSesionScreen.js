import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  MOCK_DOCTORS, DOCTOR_FILTERS,
  MOCK_CAPACITADORES,
} from './__mocks__/crearSesionData';

const COLS = 3;

const PUNTOS_QUEMA = [
  { key: 'coept',      label: 'Casa COEPT' },
  { key: 'ataque',     label: 'Casa de ataque' },
  { key: 'progresion', label: 'Casa de progresión' },
];

export default function CrearSesionScreen({ navigation }) {
  const [step, setStep] = useState(1);

  // Step 1 — Campos requeridos
  const [nombre,    setNombre]    = useState('');
  const [fecha,     setFecha]     = useState('');
  const [puntoQuema, setPuntoQuema] = useState('');  // single-select
  const [numQuemas, setNumQuemas] = useState(2);
  const [showErrors, setShowErrors] = useState(false);

  // Step 1 — Médicos a cargo
  const [medicoFilter,    setMedicoFilter]    = useState('todos');
  const [medicoSearch,    setMedicoSearch]    = useState('');
  const [selectedMedicos, setSelectedMedicos] = useState([]);
  const [showAddMedico,   setShowAddMedico]   = useState(false);

  // Step 2 — Capacitadores a cargo
  const [capSearch,      setCapSearch]      = useState('');
  const [selectedCaps,   setSelectedCaps]   = useState([]);
  const [showAddCap,     setShowAddCap]     = useState(false);

  // Step 2 — Bomberos
  const [bomberoEmails, setBomberoEmails] = useState(['', '', '', '']);

  const filteredMedicos = useMemo(() => {
    let list = MOCK_DOCTORS;
    if (medicoFilter !== 'todos') list = list.filter(d => d.role === medicoFilter);
    if (medicoSearch.trim()) list = list.filter(d =>
      d.name.toLowerCase().includes(medicoSearch.trim().toLowerCase())
    );
    return list;
  }, [medicoFilter, medicoSearch]);

  const filteredCaps = useMemo(() => {
    if (!capSearch.trim()) return MOCK_CAPACITADORES;
    return MOCK_CAPACITADORES.filter(c =>
      c.name.toLowerCase().includes(capSearch.trim().toLowerCase())
    );
  }, [capSearch]);

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

  function handleSiguiente() {
    if (!nombre.trim() || !fecha.trim() || !puntoQuema) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(2);
  }

  function handleCrearSesion() {
    Alert.alert('Sesión creada', `"${nombre}" fue creada correctamente.`, [
      { text: 'Volver', onPress: () => navigation.goBack() },
    ]);
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

      {/* ── Barra de pasos ── */}
      <View style={s.stepsBar}>
        <StepIndicator num={1} label="Sesión y médicos" active={step === 1} done={step > 1} />
        <View style={s.stepLine} />
        <StepIndicator num={2} label="Capacitadores y bomberos" active={step === 2} done={false} />
      </View>

      {step === 1 ? (
        <Step1
          nombre={nombre} setNombre={setNombre}
          fecha={fecha} setFecha={setFecha}
          puntoQuema={puntoQuema} setPuntoQuema={setPuntoQuema}
          numQuemas={numQuemas} setNumQuemas={setNumQuemas}
          medicoFilter={medicoFilter} setMedicoFilter={setMedicoFilter}
          medicoSearch={medicoSearch} setMedicoSearch={setMedicoSearch}
          filteredMedicos={filteredMedicos}
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
          capSearch={capSearch} setCapSearch={setCapSearch}
          selectedCaps={selectedCaps} toggleCap={toggleCap}
          onAddCap={() => setShowAddCap(true)}
          bomberoEmails={bomberoEmails}
          updateBomberoEmail={updateBomberoEmail}
          removeBomberoEmail={removeBomberoEmail}
          addBomberoEmail={addBomberoEmail}
          onVolver={() => setStep(1)}
          onCrear={handleCrearSesion}
        />
      )}

      <AddEmailModal
        visible={showAddMedico}
        title="Añadir Médico"
        subtitle="Ingresa el correo electrónico del médico que deseas invitar"
        onClose={() => setShowAddMedico(false)}
        actionLabel="Enviar Invitación"
      />
      <AddEmailModal
        visible={showAddCap}
        title="Añadir Capacitador"
        subtitle="Ingresa el correo electrónico del capacitador que deseas invitar"
        onClose={() => setShowAddCap(false)}
        actionLabel="Enviar Invitación"
      />
    </SafeAreaView>
  );
}

// ── Step 1 ─────────────────────────────────────────────────────────────────────

function Step1({
  nombre, setNombre, fecha, setFecha,
  puntoQuema, setPuntoQuema, numQuemas, setNumQuemas,
  medicoFilter, setMedicoFilter, medicoSearch, setMedicoSearch,
  filteredMedicos, selectedMedicos, toggleMedico, onAddMedico,
  showErrors, onSiguiente,
}) {
  const errNombre = showErrors && !nombre.trim();
  const errFecha  = showErrors && !fecha.trim();
  const errPunto  = showErrors && !puntoQuema;

  return (
    <View style={s.body}>
      <View style={s.row}>

        {/* ── Izquierda: Info + Punto de quema + N Quemas ── */}
        <View style={[s.card, { flex: 0.9 }]}>
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
                placeholderTextColor="#B0B7C3"
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
                value={fecha} onChangeText={setFecha}
                placeholder="dd/mm/aaaa" placeholderTextColor="#B0B7C3"
              />
              {errFecha && <Text style={s.errorMsg}>Campo obligatorio</Text>}
            </View>
          </View>

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
        </View>

        {/* ── Derecha: Médicos a Cargo ── */}
        <View style={[s.card, { flex: 1.1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="medkit-outline" title="Médicos a Cargo" />
            <TouchableOpacity style={s.addBtn} onPress={onAddMedico} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={14} color="#E85D27" />
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
              placeholder="Buscar..." placeholderTextColor="#B0B7C3"
            />
          </View>

          <PersonGrid people={filteredMedicos} selected={selectedMedicos} onToggle={toggleMedico} cols={COLS} />
          {selectedMedicos.length > 0 && (
            <SelectedTags people={selectedMedicos} onRemove={doc => toggleMedico(doc)} />
          )}
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.sigBtn} onPress={onSiguiente} activeOpacity={0.85}>
          <Text style={s.sigBtnText}>Siguiente</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 2 ─────────────────────────────────────────────────────────────────────

function Step2({
  nombre, fecha, puntoQuema, numQuemas, selectedMedicos,
  filteredCaps, capSearch, setCapSearch,
  selectedCaps, toggleCap, onAddCap,
  bomberoEmails, updateBomberoEmail, removeBomberoEmail, addBomberoEmail,
  onVolver, onCrear,
}) {
  const puntoLabel = PUNTOS_QUEMA.find(p => p.key === puntoQuema)?.label ?? '—';

  return (
    <View style={s.body}>
      <View style={s.row}>

        {/* ── Resumen ── */}
        <View style={[s.card, { flex: 0.62 }]}>
          <SectionHeader icon="document-text-outline" title="Resumen de Sesión" />
          <View style={s.summaryList}>
            <SummaryRow icon="text-outline"     label="Nombre"         value={nombre} />
            <SummaryRow icon="calendar-outline" label="Fecha"          value={fecha} />
            <SummaryRow icon="flame-outline"    label="Punto de quema" value={puntoLabel} />
            <SummaryRow icon="layers-outline"   label="N° de quemas"   value={`${numQuemas} quema${numQuemas > 1 ? 's' : ''}`} />
            <SummaryRow
              icon="medkit-outline"
              label="Médicos"
              value={selectedMedicos.length > 0
                ? selectedMedicos.map(m => m.name).join(', ')
                : 'Ninguno asignado'}
            />
          </View>
        </View>

        {/* ── Capacitadores a Cargo ── */}
        <View style={[s.card, { flex: 1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader icon="people-outline" title="Capacitadores a Cargo" />
            <TouchableOpacity style={s.addBtn} onPress={onAddCap} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={14} color="#E85D27" />
              <Text style={s.addBtnText}>Añadir</Text>
            </TouchableOpacity>
          </View>

          <View style={s.filterRow}>
            <TextInput
              style={[s.searchSmall, { flex: 1 }]}
              value={capSearch} onChangeText={setCapSearch}
              placeholder="Buscar capacitador..." placeholderTextColor="#B0B7C3"
            />
          </View>

          <PersonGrid people={filteredCaps} selected={selectedCaps} onToggle={toggleCap} cols={COLS} />
          {selectedCaps.length > 0 && (
            <SelectedTags people={selectedCaps} onRemove={cap => toggleCap(cap)} />
          )}
        </View>

        {/* ── Bomberos ── */}
        <View style={[s.card, { flex: 1 }]}>
          <View style={s.cardHeaderRow}>
            <SectionHeader
              icon="shield-outline"
              title={`Bomberos (${bomberoEmails.length}/20)`}
            />
            <TouchableOpacity
              style={[s.addBtn, bomberoEmails.length >= 20 && s.addBtnDisabled]}
              onPress={addBomberoEmail}
              activeOpacity={0.8}
              disabled={bomberoEmails.length >= 20}
            >
              <Ionicons
                name="person-add-outline" size={14}
                color={bomberoEmails.length >= 20 ? '#B0B7C3' : '#E85D27'}
              />
              <Text style={[s.addBtnText, bomberoEmails.length >= 20 && { color: '#B0B7C3' }]}>
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
          </ScrollView>
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={onVolver} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={15} color="#495565" />
          <Text style={s.cancelBtnText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.crearBtn} onPress={onCrear} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={s.crearBtnText}>Crear Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Componentes ───────────────────────────────────────────────────────────────

function StepIndicator({ num, label, active, done }) {
  return (
    <View style={s.stepWrap}>
      <View style={[s.stepBubble, active && s.stepBubbleActive, done && s.stepBubbleDone]}>
        {done
          ? <Ionicons name="checkmark" size={13} color="#fff" />
          : <Text style={[s.stepNum, (active || done) && { color: '#fff' }]}>{num}</Text>
        }
      </View>
      <Text style={[s.stepLabel, active && s.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <View style={s.sectionHeaderRow}>
      <Ionicons name={icon} size={16} color="#E85D27" />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <View style={s.summaryRow}>
      <Ionicons name={icon} size={13} color="#697282" />
      <Text style={s.summaryLabel}>{label}:</Text>
      <Text style={s.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function PersonGrid({ people, selected, onToggle, cols }) {
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
                {isSel && <Ionicons name="checkmark" size={14} color="#E85D27" style={s.checkmarkAbs} />}
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
        <TouchableOpacity key={p.id} style={s.tag} onPress={() => onRemove(p)} activeOpacity={0.8}>
          <Text style={s.tagText}>{p.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AddEmailModal({ visible, title, subtitle, onClose, actionLabel }) {
  const [emails, setEmails] = useState(['', '']);
  function addEmail()          { setEmails(p => [...p, '']); }
  function updateEmail(idx, v) { setEmails(p => p.map((e, i) => i === idx ? v : e)); }
  function removeEmail(idx)    { setEmails(p => p.filter((_, i) => i !== idx)); }
  function handleEnviar() {
    onClose();
    Alert.alert('Invitación enviada', 'Las invitaciones fueron enviadas correctamente.');
    setEmails(['', '']);
  }
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={m.box} onPress={e => e.stopPropagation()}>
          <TouchableOpacity style={m.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#2E2E2E" />
          </TouchableOpacity>
          <Text style={m.title}>{title}</Text>
          <Text style={m.subtitle}>{subtitle}</Text>
          <View style={m.emailList}>
            {emails.map((e, idx) => (
              <View key={idx} style={m.emailRow}>
                <TextInput
                  style={m.emailInput} value={e} onChangeText={v => updateEmail(idx, v)}
                  placeholder="correo@ejemplo.com" placeholderTextColor="#B0B7C3"
                  keyboardType="email-address" autoCapitalize="none"
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

  stepsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 10 },
  stepWrap:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBubble:      { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EBF0' },
  stepBubbleActive:{ backgroundColor: '#E85D27' },
  stepBubbleDone:  { backgroundColor: '#27AE60' },
  stepNum:         { fontSize: 12, fontWeight: '700', color: '#697282' },
  stepLabel:       { fontSize: 12, fontWeight: '600', color: '#9AA3B0' },
  stepLabelActive: { color: '#E85D27' },
  stepLine:        { flex: 1, height: 2, backgroundColor: '#E8EBF0', marginHorizontal: 10 },

  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  row:  { flex: 1, flexDirection: 'row', gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8EBF0',
    padding: 16, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  cardHeaderRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  sectionLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider:          { height: 1, backgroundColor: '#F0F2F5' },

  // Campos
  infoFields: { gap: 10 },
  infoField:  { gap: 5 },
  labelRow:   { flexDirection: 'row', alignItems: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#495565' },
  required:   { fontSize: 13, fontWeight: '700', color: '#D83B35' },
  input: {
    backgroundColor: '#F3F3F5', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: '#2E2E2E',
    borderWidth: 1, borderColor: 'transparent',
  },
  inputError: { borderColor: '#D83B35', backgroundColor: '#FFF5F5' },
  errorMsg:   { fontSize: 11, color: '#D83B35', marginTop: 2 },

  // Radio buttons (single-select punto de quema)
  radioList:     { gap: 10 },
  radioRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  radioRowError: { opacity: 0.8 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D0D5DD',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioSel:   { borderColor: '#E85D27' },
  radioDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E85D27' },
  radioLabel: { fontSize: 13, color: '#2E2E2E', fontWeight: '500' },
  radioLabelSel: { color: '#E85D27', fontWeight: '700' },

  // Num quemas
  numRow: { flexDirection: 'row', gap: 10 },
  numChip: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D0D5DD',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB',
  },
  numChipActive:     { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  numChipText:       { fontSize: 18, fontWeight: '700', color: '#697282' },
  numChipTextActive: { color: '#fff' },

  // Filter
  filterRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterPill:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#555' },
  filterPillActive:    { backgroundColor: '#E85D27' },
  filterPillText:      { color: '#fff', fontSize: 12, fontWeight: '600' },
  filterPillTextActive:{ color: '#fff' },
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
  personCardSel: { borderColor: '#E85D27', backgroundColor: '#FFF5F0' },
  checkmarkAbs:  { position: 'absolute', top: 8, right: 8 },
  personName:    { fontSize: 12, fontWeight: '700', color: '#2E2E2E', paddingRight: 20 },
  personSpec:    { fontSize: 11, color: '#697282' },
  personEmail:   { fontSize: 10, color: '#9AA3B0' },

  // Tags
  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  tagsLabel:{ fontSize: 12, fontWeight: '600', color: '#495565' },
  tag:      { backgroundColor: '#E85D27', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:  { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Add btn
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#E85D27', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnDisabled: { borderColor: '#E0E0E0' },
  addBtnText:     { fontSize: 13, color: '#E85D27', fontWeight: '600' },

  // Summary
  summaryList: { gap: 12 },
  summaryRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  summaryLabel:{ fontSize: 12, fontWeight: '700', color: '#495565', width: 90 },
  summaryValue:{ flex: 1, fontSize: 12, color: '#2E2E2E', lineHeight: 18 },

  emailHint: { fontSize: 11, color: '#9AA3B0', fontStyle: 'italic' },
  emailList: { gap: 8 },
  emailRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeEmailBtn: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D83B35',
    alignItems: 'center', justifyContent: 'center',
  },

  // Footer
  footer:       { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  sigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E85D27', borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  sigBtnText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
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
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  box:       { width: 460, backgroundColor: '#fff', borderRadius: 16, padding: 28, gap: 14 },
  closeBtn:  { position: 'absolute', top: 16, right: 16, padding: 4 },
  title:     { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  subtitle:  { fontSize: 13, color: '#697282', lineHeight: 20 },
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
  submitBtn:   { backgroundColor: '#E85D27', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});
