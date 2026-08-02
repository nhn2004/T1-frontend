import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { a11yButton, a11yGroup, a11yModal, ICON_HIT_SLOP } from '../../constants/a11y';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';
import { institutionService, trainingLocationService } from '../../services';

export default function InstitutionsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [institutions, setInstitutions] = useState([]);
  const [locations,    setLocations]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [notice,        setNotice]        = useState(null);

  const [createInstVisible, setCreateInstVisible] = useState(false);
  const [editInst,          setEditInst]          = useState(null);
  const [createLocVisible,  setCreateLocVisible]  = useState(false);
  const [editLoc,           setEditLoc]           = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return Promise.all([institutionService.getAll(), trainingLocationService.getAll()])
      .then(([inst, loc]) => {
        setInstitutions(inst);
        setLocations(loc);
      })
      .catch(() => setError('No se pudieron cargar las instituciones y ubicaciones.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const institutionName = useCallback(
    (id) => institutions.find((i) => i.id === id)?.name ?? '—',
    [institutions],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.pageTitle}>Instituciones y Centros de Entrenamiento</Text>
          <Text style={styles.pageSubtitle}>
            Estos datos alimentan el selector de ubicación al crear una sesión.
          </Text>
        </View>
      </View>

      {!!notice && (
        <View style={styles.noticeWrap}>
          <Toast message={notice} tone="success" />
        </View>
      )}

      {loading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyBox} accessibilityRole="alert">
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} {...a11yButton('Reintentar')}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Instituciones</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setCreateInstVisible(true)}
                {...a11yButton('Agregar institución')}
              >
                <Ionicons name="add" size={16} color={theme.primaryText} />
                <Text style={styles.addBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            {institutions.length === 0 ? (
              <Text style={styles.emptyText}>No hay instituciones registradas.</Text>
            ) : institutions.map((inst) => (
              <View key={inst.id} style={styles.row} {...a11yGroup(`${inst.name}${inst.acronym ? `, ${inst.acronym}` : ''}`)}>
                <View style={styles.rowIcon}>
                  <Ionicons name="business-outline" size={18} color={theme.primaryText} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {inst.name}{inst.acronym ? ` (${inst.acronym})` : ''}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {[inst.city, inst.country].filter(Boolean).join(', ') || 'Sin ubicación registrada'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setEditInst(inst)}
                  hitSlop={ICON_HIT_SLOP}
                  {...a11yButton(`Editar ${inst.name}`)}
                >
                  <Ionicons name="create-outline" size={16} color={theme.iconMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Centros de Entrenamiento</Text>
              <TouchableOpacity
                style={[styles.addBtn, institutions.length === 0 && styles.addBtnDisabled]}
                onPress={() => setCreateLocVisible(true)}
                disabled={institutions.length === 0}
                {...a11yButton('Agregar centro de entrenamiento', { disabled: institutions.length === 0 })}
              >
                <Ionicons name="add" size={16} color={institutions.length === 0 ? theme.textDisabled : theme.primaryText} />
                <Text style={[styles.addBtnText, institutions.length === 0 && { color: theme.textDisabled }]}>Agregar</Text>
              </TouchableOpacity>
            </View>
            {institutions.length === 0 && (
              <Text style={styles.emptyText}>Registra primero una institución.</Text>
            )}

            {locations.length === 0 ? (
              <Text style={styles.emptyText}>No hay centros de entrenamiento registrados.</Text>
            ) : locations.map((loc) => (
              <View key={loc.id} style={styles.row} {...a11yGroup(`${loc.name}, ${institutionName(loc.institutionId)}`)}>
                <View style={styles.rowIcon}>
                  <Ionicons name="location-outline" size={18} color={theme.primaryText} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{loc.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {institutionName(loc.institutionId)}
                    {loc.address ? ` · ${loc.address}` : ''}
                    {loc.maxCapacity ? ` · Capacidad: ${loc.maxCapacity}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setEditLoc(loc)}
                  hitSlop={ICON_HIT_SLOP}
                  {...a11yButton(`Editar ${loc.name}`)}
                >
                  <Ionicons name="create-outline" size={16} color={theme.iconMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <InstitutionModal
        visible={createInstVisible}
        onClose={() => setCreateInstVisible(false)}
        onSaved={(name) => {
          setCreateInstVisible(false);
          setNotice(`Institución "${name}" creada correctamente.`);
          load();
        }}
      />
      <InstitutionModal
        visible={!!editInst}
        institution={editInst}
        onClose={() => setEditInst(null)}
        onSaved={(name) => {
          setEditInst(null);
          setNotice(`Institución "${name}" actualizada.`);
          load();
        }}
      />
      <LocationModal
        visible={createLocVisible}
        institutions={institutions}
        onClose={() => setCreateLocVisible(false)}
        onSaved={(name) => {
          setCreateLocVisible(false);
          setNotice(`Centro de entrenamiento "${name}" creado correctamente.`);
          load();
        }}
      />
      <LocationModal
        visible={!!editLoc}
        location={editLoc}
        institutions={institutions}
        onClose={() => setEditLoc(null)}
        onSaved={(name) => {
          setEditLoc(null);
          setNotice(`Centro de entrenamiento "${name}" actualizado.`);
          load();
        }}
      />
    </SafeAreaView>
  );
}

function ModalField({ label, value, onChangeText, styles, theme, required, ...rest }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.textPlaceholder}
        accessibilityLabel={label}
        {...rest}
      />
    </View>
  );
}

function InstitutionModal({ visible, institution, onClose, onSaved }) {
  const theme = useTheme();
  const styles = useMemo(() => modalStyles(theme), [theme]);
  const isEdit = !!institution;

  const [name,    setName]    = useState('');
  const [acronym, setAcronym] = useState('');
  const [country, setCountry] = useState('');
  const [city,    setCity]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(institution?.name ?? '');
    setAcronym(institution?.acronym ?? '');
    setCountry(institution?.country ?? '');
    setCity(institution?.city ?? '');
    setError('');
  }, [visible, institution]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [submitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        acronym: acronym.trim() || null,
        country: country.trim() || null,
        city: city.trim() || null,
      };
      if (isEdit) {
        await institutionService.update(institution.id, payload);
      } else {
        await institutionService.create(payload);
      }
      onSaved(name.trim());
    } catch (e) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar la institución.');
    } finally {
      setSubmitting(false);
    }
  }, [name, acronym, country, city, isEdit, institution, onSaved]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal(isEdit ? `Editar ${institution?.name}` : 'Agregar institución')}>
              <Text style={styles.title} accessibilityRole="header">
                {isEdit ? 'Editar Institución' : 'Agregar Institución'}
              </Text>

              <ScrollView style={styles.formScrollArea} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
                <ModalField label="Nombre" value={name} onChangeText={setName} styles={styles} theme={theme} required />
                <ModalField label="Sigla (opcional)" value={acronym} onChangeText={setAcronym} styles={styles} theme={theme} />
                <View style={styles.row}>
                  <ModalField label="Ciudad (opcional)" value={city} onChangeText={setCity} styles={styles} theme={theme} />
                  <ModalField label="País (opcional)" value={country} onChangeText={setCountry} styles={styles} theme={theme} />
                </View>
              </ScrollView>

              {!!error && <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting} {...a11yButton('Cancelar', { disabled: submitting })}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  {...a11yButton(isEdit ? 'Guardar' : 'Crear', { disabled: submitting, busy: submitting })}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                    : <Text style={styles.submitBtnText}>{isEdit ? 'Guardar' : 'Crear'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LocationModal({ visible, location, institutions, onClose, onSaved }) {
  const theme = useTheme();
  const styles = useMemo(() => modalStyles(theme), [theme]);
  const isEdit = !!location;

  const [institutionId, setInstitutionId] = useState(null);
  const [name,         setName]         = useState('');
  const [locationType, setLocationType] = useState('');
  const [address,      setAddress]      = useState('');
  const [maxCapacity,  setMaxCapacity]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setInstitutionId(location?.institutionId ?? institutions[0]?.id ?? null);
    setName(location?.name ?? '');
    setLocationType(location?.locationType ?? '');
    setAddress(location?.address ?? '');
    setMaxCapacity(location?.maxCapacity != null ? String(location.maxCapacity) : '');
    setError('');
  }, [visible, location, institutions]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [submitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!isEdit && !institutionId) {
      setError('Selecciona una institución.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        locationType: locationType.trim() || null,
        address: address.trim() || null,
        maxCapacity: maxCapacity.trim() ? parseInt(maxCapacity, 10) : null,
      };
      if (isEdit) {
        await trainingLocationService.update(location.id, payload);
      } else {
        await trainingLocationService.create({ ...payload, institutionId });
      }
      onSaved(name.trim());
    } catch (e) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar el centro de entrenamiento.');
    } finally {
      setSubmitting(false);
    }
  }, [name, locationType, address, maxCapacity, institutionId, isEdit, location, onSaved]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal(isEdit ? `Editar ${location?.name}` : 'Agregar centro de entrenamiento')}>
              <Text style={styles.title} accessibilityRole="header">
                {isEdit ? 'Editar Centro de Entrenamiento' : 'Agregar Centro de Entrenamiento'}
              </Text>

              <ScrollView style={styles.formScrollArea} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
                {!isEdit && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Institución<Text style={styles.required}> *</Text></Text>
                    <View style={styles.chipRow}>
                      {institutions.map((inst) => {
                        const active = institutionId === inst.id;
                        return (
                          <TouchableOpacity
                            key={inst.id}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setInstitutionId(inst.id)}
                            {...a11yButton(inst.name, { selected: active })}
                            accessibilityRole="radio"
                          >
                            <Text
                              style={[styles.chipText, active && styles.chipTextActive]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {inst.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <ModalField label="Nombre" value={name} onChangeText={setName} styles={styles} theme={theme} required />
                <ModalField label="Tipo (opcional)" value={locationType} onChangeText={setLocationType} placeholder="Sede principal, aula, patio…" styles={styles} theme={theme} />
                <ModalField label="Dirección (opcional)" value={address} onChangeText={setAddress} styles={styles} theme={theme} />
                <ModalField label="Capacidad máxima (opcional)" value={maxCapacity} onChangeText={setMaxCapacity} keyboardType="numeric" styles={styles} theme={theme} />
              </ScrollView>

              {!!error && <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting} {...a11yButton('Cancelar', { disabled: submitting })}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  {...a11yButton(isEdit ? 'Guardar' : 'Crear', { disabled: submitting, busy: submitting })}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={theme.onPrimarySolid} />
                    : <Text style={styles.submitBtnText}>{isEdit ? 'Guardar' : 'Crear'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = (t) =>
  StyleSheet.create({
    kbAvoid: { flex: 1 },
    overlay: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      padding: 20, backgroundColor: t.overlay,
    },
    card: {
      borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, maxHeight: '90%', gap: 12,
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
    },
    title: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 2 },
    formScrollArea: { flexShrink: 1 },
    formScroll: { gap: 10, paddingBottom: 2 },
    row: { flexDirection: 'row', gap: 10 },
    field: { flex: 1, gap: 5 },
    fieldLabel: { fontSize: 12, color: t.textSecondary },
    required: { fontSize: 12, fontWeight: '700', color: t.status.danger.fg },
    fieldInput: {
      borderWidth: 1.5, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 9,
      fontSize: 13, backgroundColor: t.cardAlt,
      borderColor: t.borderStrong, color: t.textPrimary,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      maxWidth: '100%', flexShrink: 1,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
      borderWidth: 1.5, backgroundColor: t.card, borderColor: t.border,
    },
    chipActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    chipText: { fontSize: 12, color: t.textPrimary },
    chipTextActive: { color: t.onPrimarySolid, fontWeight: '700' },
    errorText: { fontSize: 12, color: t.status.danger.fg },
    actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
    cancelBtn: {
      flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center',
      borderRadius: 10, borderWidth: 1.5, borderColor: t.borderStrong,
    },
    cancelBtnText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    submitBtn: {
      flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center',
      borderRadius: 10, backgroundColor: t.primarySolid,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { fontSize: 13, fontWeight: '700', color: t.onPrimarySolid },
  });

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },
    titleRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
    pageTitle: { fontSize: 18, fontWeight: '800', color: t.textPrimary },
    pageSubtitle: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    noticeWrap: { paddingHorizontal: 16, paddingBottom: 6 },
    body: { padding: 16, gap: 20 },
    section: { gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderWidth: 1.5, borderColor: t.primary, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    addBtnDisabled: { borderColor: t.border },
    addBtnText: { fontSize: 13, color: t.primaryText, fontWeight: '600' },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.card, borderRadius: 10, borderWidth: 1, borderColor: t.border,
      paddingHorizontal: 12, paddingVertical: 10,
    },
    rowIcon: {
      width: 36, height: 36, borderRadius: 9, backgroundColor: t.primarySoft,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 13, fontWeight: '700', color: t.textPrimary },
    rowSub: { fontSize: 11, color: t.textSecondary, marginTop: 1 },
    editBtn: {
      width: 32, height: 32, borderRadius: 8, backgroundColor: t.cardAlt,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
    emptyText: { fontSize: 13, color: t.textMuted, textAlign: 'center' },
    retryBtn: {
      paddingHorizontal: 18, minHeight: 44, justifyContent: 'center',
      borderRadius: 10, borderWidth: 1.5, borderColor: t.primaryBorder,
    },
    retryText: { color: t.primaryText, fontSize: 14, fontWeight: '700' },
  });
