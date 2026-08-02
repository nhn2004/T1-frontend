import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks';
import { ROLES } from '../../constants/roles';
import { a11yButton, a11yDecorative, a11yGroup, a11yModal, a11yTab, ICON_HIT_SLOP, MIN_TOUCH_SIZE } from '../../constants/a11y';
import useTheme from '../../hooks/useTheme';
import Toast from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import { healthPersonnelService, traineeService, userService } from '../../services';
import { usePersonas } from './hooks/usePersonas';

const SEX_OPTIONS = ['M', 'F', 'Otro'];
const PROFESSION_OPTIONS = ['Médico', 'Enfermero', 'Nutricionista'];

const COLS = 3;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;

export default function PersonasScreen() {
  const { user, roles, can } = useAuth();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isFireChief = roles.includes(ROLES.FIRE_CHIEF);
  const isAdmin     = roles.includes(ROLES.ADMIN);
  // Bomberos los administra quien tiene manageFirefighters; personal médico requiere
  // manageHealthPersonnel — son permisos distintos porque dar de alta/baja a un colega
  // médico es una acción de RR.HH. que ni Capacitador ni el propio Médico deberían tener.
  const canManage = isFireChief ? can('manageFirefighters') : can('manageHealthPersonnel');

  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const [institutionId, setInstitutionId] = useState(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const primaryRole = isFireChief ? ROLES.FIRE_CHIEF : roles[0];
  const { personas, filters, loading, error, refresh } = usePersonas(primaryRole);

  // Necesario para crear un User nuevo (POST /users exige institutionId) — se asume la
  // misma institución de quien está dando de alta al personal.
  useEffect(() => {
    if (!canManage || !user?.userId) return;
    let cancelled = false;
    userService.getById(user.userId)
      .then((full) => { if (!cancelled) setInstitutionId(full.institutionId); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canManage, user?.userId]);

  const handleDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      if (isFireChief) {
        await traineeService.setTrainingStatus(deactivateTarget.id, 'Withdrawn');
      } else {
        await healthPersonnelService.setActive(deactivateTarget.id, false);
      }
      setDeactivateTarget(null);
      setNotice(`${deactivateTarget.name} fue dado de baja.`);
      refresh();
    } catch (e) {
      setNotice(e?.response?.data?.message ?? 'No se pudo dar de baja. Intenta de nuevo.');
    } finally {
      setDeactivating(false);
    }
  }, [deactivateTarget, isFireChief, refresh]);

  const filterCounts = useMemo(() => {
    const counts = { Todos: personas.length };
    filters.forEach(f => {
      if (f.value !== 'Todos') {
        counts[f.value] = personas.filter(p => p.role === f.value).length;
      }
    });
    return counts;
  }, [personas, filters]);

  const filteredPersonas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return personas.filter((person) => {
      const matchesFilter = selectedFilter === 'Todos' || person.role === selectedFilter;
      const matchesQuery = !normalizedQuery ||
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.role.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [query, selectedFilter, personas]);

  const totalPages = Math.max(1, Math.ceil(filteredPersonas.length / PER_PAGE));
  const curPage    = Math.min(page, totalPages - 1);
  const hasPrev    = curPage > 0;
  const hasNext    = curPage < totalPages - 1;

  const onLayout = useCallback((e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBox({ w, h });
  }, []);

  // onLayout reporta dimensiones externas (incluye el paddingHorizontal/paddingBottom
  // del propio View). Se restan para obtener el espacio real disponible.
  const SIDE_PAD   = 14;
  const BOT_PAD    = 14;
  const innerW     = box.w > 0 ? box.w - 2 * SIDE_PAD : 0;
  const innerH     = box.h > 0 ? box.h - BOT_PAD : 0;
  const colGap     = innerW * 0.015;
  const rowGap     = innerH * 0.03;
  const arrowSize  = Math.max(30, innerH * 0.05);
  const gridW      = innerW > 0 ? innerW - 2 * (arrowSize + colGap) : 0;
  const cardW      = gridW > 0 ? (gridW - colGap * (COLS - 1)) / COLS : 0;
  const cardH      = innerH > 0 ? (innerH - rowGap * (ROWS - 1)) / ROWS : 0;

  const pageItems = filteredPersonas.slice(curPage * PER_PAGE, (curPage + 1) * PER_PAGE);
  const gridRows  = [];
  for (let r = 0; r < ROWS; r++) {
    const row = pageItems.slice(r * COLS, r * COLS + COLS);
    if (row.length > 0) gridRows.push(row);
  }

  const toggleSearch = () => {
    if (searchExpanded) setQuery('');
    setSearchExpanded(v => !v);
  };

  const handleFilter = (val) => {
    setSelectedFilter(val);
    setQuery('');
    setSearchExpanded(false);
    setPage(0);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Título */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>
          {isAdmin ? 'Todo el Personal' : isFireChief ? 'Personal' : 'Personal Médico'}
        </Text>
        {canManage && (
          <Pressable
            style={styles.addButton}
            onPress={() => setCreateVisible(true)}
            disabled={!institutionId}
            {...a11yButton('Agregar personal', { disabled: !institutionId })}
          >
            <Text style={styles.addButtonText}>+ Agregar Personal</Text>
          </Pressable>
        )}
      </View>

      {!!notice && (
        <View style={styles.noticeWrap}>
          <Toast message={notice} tone="warning" />
        </View>
      )}

      {/* Barra de filtros */}
      <View style={styles.filterBar}>
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.value;
          const count = filterCounts[filter.value] ?? 0;
          return (
            <Pressable
              key={filter.value}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => handleFilter(filter.value)}
              {...a11yTab(`${filter.label}, ${count}`, isActive)}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable
          style={styles.searchIconBtn}
          onPress={toggleSearch}
          {...a11yButton(searchExpanded ? 'Cerrar búsqueda' : 'Buscar persona', {
            expanded: searchExpanded,
          })}
        >
          <Ionicons
            name={searchExpanded ? 'close' : 'search'}
            size={18}
            color={theme.textPrimary}
          />
        </Pressable>

        {searchExpanded && (
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={(v) => { setQuery(v); setPage(0); }}
            placeholder="Buscar por nombre o rol…"
            placeholderTextColor={theme.textPlaceholder}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Buscar por nombre o rol"
          />
        )}
      </View>

      {/* Carrusel */}
      <View style={styles.carousel} onLayout={onLayout}>
        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyBox} accessibilityRole="alert">
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={refresh} {...a11yButton('Reintentar')}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : box.w > 0 && (
          <View style={[styles.carouselRow, { gap: colGap }]}>

            {/* Flecha izquierda — siempre reserva espacio */}
            <View style={[styles.arrowWrap, { width: arrowSize }]}>
              {hasPrev && (
                <TouchableOpacity
                  style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                  onPress={() => setPage(curPage - 1)}
                  activeOpacity={0.8}
                  {...a11yButton(`Página anterior, ${curPage} de ${totalPages}`)}
                >
                  <Ionicons name="chevron-back" size={arrowSize * 0.5} color={theme.primaryText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Grid */}
            <View style={[styles.carouselGrid, { gap: rowGap, width: gridW }]}>
              {gridRows.map((rowItems, ri) => (
                <View key={ri} style={[styles.gridRow, { gap: colGap, height: cardH }]}>
                  {rowItems.map(person => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      cardW={cardW}
                      cardH={cardH}
                      styles={styles}
                      theme={theme}
                      canManage={canManage}
                      onEdit={() => setEditTarget(person)}
                      onDeactivate={() => setDeactivateTarget(person)}
                    />
                  ))}
                  {rowItems.length < COLS &&
                    Array.from({ length: COLS - rowItems.length }).map((_, i) => (
                      <View key={`filler-${ri}-${i}`} style={{ width: cardW }} />
                    ))}
                </View>
              ))}
              {gridRows.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No hay resultados.</Text>
                </View>
              )}
            </View>

            {/* Flecha derecha — siempre reserva espacio */}
            <View style={[styles.arrowWrap, { width: arrowSize }]}>
              {hasNext && (
                <TouchableOpacity
                  style={[styles.arrowBtn, { width: arrowSize, height: arrowSize, borderRadius: arrowSize / 2 }]}
                  onPress={() => setPage(curPage + 1)}
                  activeOpacity={0.8}
                  {...a11yButton(`Página siguiente, ${curPage + 2} de ${totalPages}`)}
                >
                  <Ionicons name="chevron-forward" size={arrowSize * 0.5} color={theme.primaryText} />
                </TouchableOpacity>
              )}
            </View>

          </View>
        )}
      </View>

      <CreatePersonModal
        visible={createVisible}
        isFireChief={isFireChief}
        institutionId={institutionId}
        onClose={() => setCreateVisible(false)}
        onCreated={(personName) => {
          setCreateVisible(false);
          setNotice(`${personName} fue agregado correctamente.`);
          refresh();
        }}
      />

      <EditPersonModal
        visible={!!editTarget}
        person={editTarget}
        isFireChief={isFireChief}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          setNotice('Cambios guardados correctamente.');
          refresh();
        }}
      />

      <ConfirmDialog
        visible={!!deactivateTarget}
        title="Dar de baja"
        message={deactivateTarget ? `¿Seguro que quieres dar de baja a ${deactivateTarget.name}? Podrás seguir consultando su historial, pero dejará de aparecer como personal activo.` : ''}
        confirmLabel={deactivating ? 'Procesando…' : 'Sí, dar de baja'}
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
    </SafeAreaView>
  );
}

function PersonCard({ person, cardW, cardH, styles, theme, canManage, onEdit, onDeactivate }) {
  const inactive = person.isActive === false || person.trainingStatus === 'Withdrawn';
  const spoken = [person.name, person.role, person.email, person.phone, inactive ? 'Dado de baja' : null]
    .filter(Boolean).join(', ');

  return (
    <View style={[styles.card, { width: cardW, height: cardH }, inactive && styles.cardInactive]} {...a11yGroup(spoken)}>
      {canManage && (
        <View style={styles.cardActions} {...a11yDecorative}>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={onEdit}
            hitSlop={ICON_HIT_SLOP}
            {...a11yButton(`Editar ${person.name}`)}
          >
            <Ionicons name="create-outline" size={15} color={theme.iconMuted} />
          </TouchableOpacity>
          {!inactive && (
            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={onDeactivate}
              hitSlop={ICON_HIT_SLOP}
              {...a11yButton(`Dar de baja a ${person.name}`)}
            >
              <Ionicons name="person-remove-outline" size={15} color={theme.status.danger.fg} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.personRow}>
        <View style={styles.avatarPlaceholder} {...a11yDecorative}>
          {person.photoSource ? (
            <Image source={person.photoSource} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={26} color={theme.iconMuted} />
            </View>
          )}
        </View>

        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={2}>{person.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{person.role}</Text>
          </View>
          {inactive && (
            <View style={styles.inactivePill}>
              <Text style={styles.inactivePillText}>Dado de baja</Text>
            </View>
          )}
          <View style={styles.contactLine}>
            <Ionicons name="mail-outline" size={13} color={theme.iconMuted} {...a11yDecorative} />
            <Text style={styles.contactText} numberOfLines={1}>{person.email}</Text>
          </View>
          <View style={styles.contactLine}>
            <Ionicons name="call-outline" size={13} color={theme.iconMuted} {...a11yDecorative} />
            <Text style={styles.contactText} numberOfLines={1}>{person.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} {...a11yDecorative} />

      <View style={styles.sessionsTitleRow}>
        <MaterialCommunityIcons
          name="briefcase-outline"
          size={14}
          color={theme.iconMuted}
          {...a11yDecorative}
        />
        <Text style={styles.sessionsTitle}>Sesiones</Text>
      </View>

      {/* El backend no expone todavía el conteo de sesiones por persona: los servicios
          devuelven `null` (no disponible) y aquí se muestra «—». Antes se renderizaba
          siempre un "0" que se leía como un dato real. */}
      <View style={styles.sessionMetric}>
        <Text style={styles.sessionLabel}>Pendientes:</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.badgeText}>{person.pendingSessions?.length ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.sessionMetric}>
        <Text style={styles.sessionLabel}>Completadas:</Text>
        <View style={styles.completedBadge}>
          <Text style={styles.badgeText}>{person.completedSessions?.length ?? '—'}</Text>
        </View>
      </View>
    </View>
  );
}

function ModalField({ label, value, onChangeText, styles, ...rest }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#8A8F98"
        accessibilityLabel={label}
        {...rest}
      />
    </View>
  );
}

function ChipRow({ label, options, value, onChange, styles }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt)}
              {...a11yButton(opt, { selected: active })}
              accessibilityRole="radio"
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const EMPTY_CREATE = {
  firstName: '', lastName: '', email: '', phone: '',
  applicantCode: '', birthDate: '', sex: '', bloodType: '',
  emergencyContactName: '', emergencyContactPhone: '',
  profession: '', specialty: '', licenseNumber: '',
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Inserta los guiones aaaa-mm-dd automáticamente a medida que se escriben los dígitos. */
function formatBirthDateInput(text) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  let out = year;
  if (month) out += `-${month}`;
  if (day) out += `-${day}`;
  return out;
}

function CreatePersonModal({ visible, isFireChief, institutionId, onClose, onCreated }) {
  const theme = useTheme();
  const styles = useMemo(() => modalStyles(theme), [theme]);
  const [form, setForm] = useState(EMPTY_CREATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (v) => setForm((f) => ({ ...f, [field]: v }));

  const handleClose = useCallback(() => {
    if (submitting) return;
    setForm(EMPTY_CREATE);
    setError('');
    onClose();
  }, [submitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Nombres, apellidos y correo son obligatorios.');
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (isFireChief) {
      if (!form.applicantCode.trim() || !form.birthDate.trim() || !form.sex) {
        setError('Código de aspirante, fecha de nacimiento y sexo son obligatorios.');
        return;
      }
      if (!DATE_RE.test(form.birthDate.trim())) {
        setError('La fecha de nacimiento debe tener el formato AAAA-MM-DD.');
        return;
      }
    } else if (!form.profession) {
      setError('Selecciona una profesión.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const newUser = await userService.create({
        institutionId,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
      });

      if (isFireChief) {
        await traineeService.create({
          userId: newUser.userId,
          applicantCode: form.applicantCode.trim(),
          birthDate: form.birthDate.trim(),
          sex: form.sex,
          bloodType: form.bloodType.trim() || null,
          emergencyContactName: form.emergencyContactName.trim() || null,
          emergencyContactPhone: form.emergencyContactPhone.trim() || null,
        });
        await userService.updateRoles(newUser.userId, [ROLES.FIREFIGHTER_TRAINEE]);
      } else {
        await healthPersonnelService.create({
          userId: newUser.userId,
          profession: form.profession,
          specialty: form.specialty.trim() || null,
          licenseNumber: form.licenseNumber.trim() || null,
          canApproveDischarges: false,
        });
        await userService.updateRoles(newUser.userId, [ROLES.MEDICAL]);
      }

      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      setForm(EMPTY_CREATE);
      onCreated(fullName);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'No se pudo crear el registro. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }, [form, isFireChief, institutionId, onCreated]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal('Agregar personal')}>
              <Text style={styles.title} accessibilityRole="header">
                {isFireChief ? 'Agregar Bombero Aspirante' : 'Agregar Personal Médico'}
              </Text>

              <ScrollView style={styles.formScrollArea} contentContainerStyle={styles.formScroll}>
                <View style={styles.row}>
                  <ModalField label="Nombres" value={form.firstName} onChangeText={set('firstName')} styles={styles} />
                  <ModalField label="Apellidos" value={form.lastName} onChangeText={set('lastName')} styles={styles} />
                </View>
                <ModalField label="Correo" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" styles={styles} />
                <ModalField label="Teléfono (opcional)" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" styles={styles} />

                {isFireChief ? (
                  <>
                    <ModalField label="Código de aspirante" value={form.applicantCode} onChangeText={set('applicantCode')} styles={styles} />
                    <ModalField
                      label="Fecha de nacimiento (AAAA-MM-DD)"
                      value={form.birthDate}
                      onChangeText={(v) => setForm((f) => ({ ...f, birthDate: formatBirthDateInput(v) }))}
                      placeholder="1998-05-20"
                      keyboardType="numeric"
                      maxLength={10}
                      styles={styles}
                    />
                    <ChipRow label="Sexo" options={SEX_OPTIONS} value={form.sex} onChange={set('sex')} styles={styles} />
                    <ModalField label="Tipo de sangre (opcional)" value={form.bloodType} onChangeText={set('bloodType')} placeholder="O+" styles={styles} />
                    <ModalField label="Contacto de emergencia (opcional)" value={form.emergencyContactName} onChangeText={set('emergencyContactName')} styles={styles} />
                    <ModalField label="Teléfono de emergencia (opcional)" value={form.emergencyContactPhone} onChangeText={set('emergencyContactPhone')} keyboardType="phone-pad" styles={styles} />
                  </>
                ) : (
                  <>
                    <ChipRow label="Profesión" options={PROFESSION_OPTIONS} value={form.profession} onChange={set('profession')} styles={styles} />
                    <ModalField label="Especialidad (opcional)" value={form.specialty} onChangeText={set('specialty')} styles={styles} />
                    <ModalField label="Número de licencia (opcional)" value={form.licenseNumber} onChangeText={set('licenseNumber')} styles={styles} />
                  </>
                )}
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
                  {...a11yButton('Crear', { disabled: submitting, busy: submitting })}
                >
                  {submitting ? <ActivityIndicator size="small" color={theme.onPrimarySolid} /> : <Text style={styles.submitBtnText}>Crear</Text>}
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

function EditPersonModal({ visible, person, isFireChief, onClose, onSaved }) {
  const theme = useTheme();
  const styles = useMemo(() => modalStyles(theme), [theme]);
  const [bloodType, setBloodType] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!person) return;
    setBloodType(person.bloodType ?? '');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setProfession(person.role ?? '');
    setSpecialty(person.specialty ?? '');
    setLicenseNumber(person.licenseNumber ?? '');
    setError('');
  }, [person]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [submitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!isFireChief && !profession) {
      setError('Selecciona una profesión.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (isFireChief) {
        await traineeService.update(person.id, {
          bloodType: bloodType.trim() || null,
          emergencyContactName: emergencyContactName.trim() || null,
          emergencyContactPhone: emergencyContactPhone.trim() || null,
        });
      } else {
        await healthPersonnelService.update(person.id, {
          profession,
          specialty: specialty.trim() || null,
          licenseNumber: licenseNumber.trim() || null,
          canApproveDischarges: person.canApproveDischarges ?? false,
        });
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }, [isFireChief, person, bloodType, emergencyContactName, emergencyContactPhone, profession, specialty, licenseNumber, onSaved]);

  if (!person) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.kbAvoid} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.card} {...a11yModal(`Editar ${person.name}`)}>
              <Text style={styles.title} accessibilityRole="header">Editar {person.name}</Text>

              {isFireChief ? (
                <>
                  <ModalField label="Tipo de sangre" value={bloodType} onChangeText={setBloodType} placeholder="O+" styles={styles} />
                  <ModalField label="Contacto de emergencia" value={emergencyContactName} onChangeText={setEmergencyContactName} styles={styles} />
                  <ModalField label="Teléfono de emergencia" value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} keyboardType="phone-pad" styles={styles} />
                </>
              ) : (
                <>
                  <ChipRow label="Profesión" options={PROFESSION_OPTIONS} value={profession} onChange={setProfession} styles={styles} />
                  <ModalField label="Especialidad" value={specialty} onChangeText={setSpecialty} styles={styles} />
                  <ModalField label="Número de licencia" value={licenseNumber} onChangeText={setLicenseNumber} styles={styles} />
                </>
              )}

              {!!error && <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting} {...a11yButton('Cancelar', { disabled: submitting })}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  {...a11yButton('Guardar', { disabled: submitting, busy: submitting })}
                >
                  {submitting ? <ActivityIndicator size="small" color={theme.onPrimarySolid} /> : <Text style={styles.submitBtnText}>Guardar</Text>}
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: t.overlay,
    },
    card: {
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 440,
      gap: 12,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    title: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 2 },
    formScrollArea: { maxHeight: 420 },
    formScroll: { gap: 10, paddingBottom: 2 },
    row: { flexDirection: 'row', gap: 10 },
    field: { flex: 1, gap: 5 },
    fieldLabel: { fontSize: 12, color: t.textSecondary },
    fieldInput: {
      borderWidth: 1.5,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13,
      backgroundColor: t.cardAlt,
      borderColor: t.borderStrong,
      color: t.textPrimary,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1.5,
      backgroundColor: t.card,
      borderColor: t.border,
    },
    chipActive: { backgroundColor: t.primarySolid, borderColor: t.primarySolid },
    chipText: { fontSize: 12, color: t.textPrimary },
    chipTextActive: { color: t.onPrimarySolid, fontWeight: '700' },
    errorText: { fontSize: 12, color: t.status.danger.fg },
    actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
    cancelBtn: {
      flex: 1,
      minHeight: 42,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: t.borderStrong,
    },
    cancelBtnText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    submitBtn: {
      flex: 1,
      minHeight: 42,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: t.primarySolid,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { fontSize: 13, fontWeight: '700', color: t.onPrimarySolid },
  });

const makeStyles = (t) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: t.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 16,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: t.textPrimary,
  },
  addButton: {
    minWidth: 174,
    height: 40,
    borderRadius: 10,
    backgroundColor: t.primarySolid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    shadowColor: t.shadowColor,
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 7,
  },
  addButtonText: {
    color: t.onPrimarySolid,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.border,
  },
  pillActive: {
    backgroundColor: t.primarySolid,
    borderColor: t.primarySolid,
  },
  pillText: {
    color: t.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: t.onPrimarySolid,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: t.pill,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: t.scrim,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: t.textSecondary,
  },
  countTextActive: {
    color: t.onPrimarySolid,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.cardAlt,
    paddingHorizontal: 14,
    fontSize: 13,
    color: t.textPrimary,
  },
  carousel: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  carouselRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowWrap: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBtn: {
    backgroundColor: t.card,
    borderWidth: 1.5,
    borderColor: t.primarySolid,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  carouselGrid: {
    alignSelf: 'stretch',
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 15, color: t.textMuted, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 18, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center',
    borderRadius: 10, borderWidth: 1.5, borderColor: t.primaryBorder,
  },
  retryText: { color: t.primaryText, fontSize: 14, fontWeight: '700' },
  noticeWrap: { paddingHorizontal: 14, paddingBottom: 6 },
  avatarFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: t.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    padding: 14,
    overflow: 'hidden',
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardActions: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 2,
    zIndex: 1,
  },
  cardActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.cardAlt,
  },
  inactivePill: {
    alignSelf: 'flex-start',
    height: 16,
    borderRadius: 8,
    backgroundColor: t.status.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  inactivePillText: {
    color: t.status.danger.fg,
    fontSize: 8,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: t.primary,
    backgroundColor: t.pill,
    overflow: 'hidden',
    flexShrink: 0,
    marginTop: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    color: t.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    height: 18,
    borderRadius: 9,
    backgroundColor: t.primarySolid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  rolePillText: {
    color: t.onPrimarySolid,
    fontSize: 9,
    fontWeight: '700',
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  contactText: {
    color: t.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: t.divider,
    marginVertical: 6,
  },
  sessionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sessionsTitle: {
    color: t.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sessionMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  sessionLabel: {
    color: t.textSecondary,
    fontSize: 11,
  },
  pendingBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 7,
    backgroundColor: t.status.warning.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  completedBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 7,
    backgroundColor: t.status.success.solid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
