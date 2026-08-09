import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SINTOMAS_LIST } from './__mocks__/resultadosData';
import { vitalSignsService } from '../../services/vitalSignsService';
import { healthPersonnelService } from '../../services/healthPersonnelService';
import { bioimpedanceService } from '../../services/bioimpedanceService';
import { symptomReportService } from '../../services/symptomReportService';
import { useAuth } from '../../hooks';
import useTheme from '../../hooks/useTheme';
import { useAuditOnMount } from '../../hooks/useAuditTrail';
import { a11yButton, a11yDecorative } from '../../constants/a11y';
import Toast from '../../components/Toast';

// ── Etapas ────────────────────────────────────────────────────────────────────
const S = {
  PRE_SESION:   'pre_sesion',
  NO_APTO:      'no_apto',
  APTO:         'apto',
  QUEMA_ACTIVA: 'quema_activa',
  POST_QUEMA:   'post_quema',
  CIERRE:       'cierre',
  LISTO:        'listo',
};

const ROLES_BOMBERO = ['Portero', 'Speaker', 'Seguridad', 'Observador'];

const EMPTY_PRE = {
  rol: '', esFumador: null, expuestoHumo: null,
  temperatura: '', presionSistolica: '', presionDiastolica: '',
  frecuenciaCardiaca: '', nivelOxigeno: '', nivelCO: '',
  sintomas: [],
};
const EMPTY_POST_QUEMA = {
  duracionMin: '', duracionSeg: '',
  temperatura: '', presionSistolica: '', presionDiastolica: '',
  frecuenciaCardiaca: '', nivelOxigeno: '', nivelCO: '',
  sintomas: [],
};
const EMPTY_CIERRE = {
  temperatura: '', presionSistolica: '', presionDiastolica: '',
  frecuenciaCardiaca: '', nivelOxigeno: '', nivelCO: '',
  sintomas: [], eventosEspeciales: '',
};
const EMPTY_INVESTIGACION = {
  lactato_pre: '', lactato_post: '',
  bioimpedancia_grasa: '', bioimpedancia_musculo: '', bioimpedancia_edad_metabolica: '',
  stroop_tiempo: '', stroop_errores: '',
};

/** Entrega las cuatro hojas de estilo del módulo ya resueltas contra el tema. */
function useSheets() {
  const t = useTheme();
  return useMemo(
    () => ({ st: makeSt(t), tl: makeTl(t), p: makeP(t), vi: makeVi(t), t }),
    [t],
  );
}

// ── Semáforo: verde = normal, naranja = fuera de rango ───────────────────────
function getSemaforoColor(field, rawVal) {
  const val = parseFloat(rawVal);
  if (isNaN(val) || rawVal === '') return null;
  switch (field) {
    case 'temperatura':
      return (val >= 35 && val <= 38) ? 'green' : 'orange';
    case 'presionSistolica':
      return (val >= 90 && val <= 140) ? 'green' : 'orange';
    case 'presionDiastolica':
      return (val >= 60 && val <= 90) ? 'green' : 'orange';
    case 'frecuenciaCardiaca':
      return (val >= 60 && val <= 100) ? 'green' : 'orange';
    case 'nivelOxigeno':
      return val >= 95 ? 'green' : 'orange';
    case 'nivelCO':
      return val < 10 ? 'green' : 'orange';
    default: return null;
  }
}

// El semáforo se deriva del tema para que sus fondos no queden luminosos en
// modo oscuro; los tonos siguen siendo verde (en rango) y naranja (fuera).
function semaforoTones(t) {
  return {
    border: { green: t.status.success.solid, orange: t.primary },
    bg:     { green: t.status.success.bg,    orange: t.primarySoft },
  };
}

// ── Aptitud ───────────────────────────────────────────────────────────────────
function verificarAptitud(form) {
  const spo2  = parseFloat(form.nivelOxigeno);
  const temp  = parseFloat(form.temperatura);
  const pulso = parseFloat(form.frecuenciaCardiaca);
  const co    = parseFloat(form.nivelCO);
  const sist  = parseFloat(form.presionSistolica);
  const diast = parseFloat(form.presionDiastolica);
  const razones = [];
  if (!isNaN(spo2)  && spo2  < 92)               razones.push('SpO₂ baja');
  if (!isNaN(temp)  && (temp > 39 || temp < 35))  razones.push('Temperatura fuera de rango');
  if (!isNaN(pulso) && pulso > 130)               razones.push('Frecuencia cardíaca alta');
  if (!isNaN(co)    && co > 20)                   razones.push('Nivel de CO elevado');
  if (!isNaN(sist)  && (sist > 160 || sist < 80)) razones.push('Presión sistólica fuera de rango');
  if (!isNaN(diast) && (diast > 100 || diast < 50)) razones.push('Presión diastólica fuera de rango');
  return { apto: razones.length === 0, razones };
}

function vitalsComplete(form) {
  return !!(form.temperatura && form.presionSistolica && form.presionDiastolica
         && form.frecuenciaCardiaca && form.nivelOxigeno && form.nivelCO);
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function EvaluacionBomberoScreen({ navigation, route }) {
  const { st, t } = useSheets();
  const bomberoName   = route?.params?.bomberoName ?? 'Bombero';
  const participantId = route?.params?.bomberoId   ?? null;
  // Se acota a un mínimo de 1: con `numQuemas = 0` el array de quemas quedaba vacío y
  // `quemasData[currentQuema - 1]` era undefined, reventando al leer sus campos.
  const numQuemas     = Math.max(1, Number(route?.params?.numQuemas) || 2);
  const { user }      = useAuth();

  // Requisito de auditoría: esta pantalla escribe la ficha médica de un bombero.
  useAuditOnMount('MEDICAL_RECORD', participantId, 'WRITE');

  const [stage,        setStage]        = useState(S.PRE_SESION);
  const [currentQuema, setCurrentQuema] = useState(1);

  // Ficha de personal de salud del usuario logueado. Es obligatoria para registrar
  // mediciones: sin ella el backend atribuiría el registro a otro profesional.
  const [healthPersonnelId, setHealthPersonnelId] = useState(null);
  const [hpResolved,        setHpResolved]        = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [saveNotice,        setSaveNotice]        = useState(null);

  useEffect(() => {
    let alive = true;

    healthPersonnelService.findByUserId(user?.userId)
      .then((hp) => {
        if (!alive) return;
        // Antes se caía a `list[0]` cuando el usuario no era personal de salud, lo que
        // atribuía la medición a un profesional cualquiera y corrompía la trazabilidad.
        setHealthPersonnelId(hp?.id ?? null);
      })
      .catch(() => { if (alive) setHealthPersonnelId(null); })
      .finally(() => { if (alive) setHpResolved(true); });

    return () => { alive = false; };
  }, [user?.userId]);

  /**
   * Registra una medición de signos vitales y reporta el resultado real.
   * Devuelve true solo si el servidor confirmó el guardado.
   */
  async function submitVitals(form, etiqueta) {
    if (!participantId) {
      setSaveNotice({ tone: 'error', message: 'No hay un participante asociado: no se puede guardar.' });
      return false;
    }
    if (!hpResolved) {
      setSaveNotice({ tone: 'error', message: 'Espera a que termine de cargar tu ficha profesional.' });
      return false;
    }
    if (!healthPersonnelId) {
      // No se duplica el aviso aquí: el banner persistente de arriba (visible mientras
      // dure el bloqueo) ya explica esto. Mostrar además un saveNotice al intentar
      // guardar hacía aparecer dos mensajes casi idénticos a la vez.
      return false;
    }

    setSaving(true);
    try {
      const { unsupported } = await vitalSignsService.submit(participantId, healthPersonnelId, form);

      // Los síntomas de esta etapa van por un endpoint aparte (SymptomReport). Un fallo
      // aquí no debe hacer parecer que la medición de vitales tampoco se guardó — se
      // reporta como una advertencia adicional, no como error de toda la operación.
      let symptomWarning = null;
      if (form.sintomas?.length) {
        try {
          await symptomReportService.submit(participantId, user?.userId, { symptoms: form.sintomas });
        } catch {
          symptomWarning = 'los síntomas reportados';
        }
      }

      const unsupportedMsg = unsupported.length
        ? `No se almacenaron (sin soporte en el servidor): ${unsupported.join(', ')}.`
        : '';
      const symptomMsg = symptomWarning ? `No se pudieron guardar ${symptomWarning}.` : '';

      if (unsupportedMsg || symptomMsg) {
        setSaveNotice({
          tone: 'warning',
          message: `${etiqueta} guardada. ${unsupportedMsg} ${symptomMsg}`.trim(),
        });
      } else {
        setSaveNotice({ tone: 'success', message: `${etiqueta} guardada correctamente.` });
      }
      return true;
    } catch (error) {
      // `!error.response` significa que la petición nunca llegó a tener respuesta (sin
      // red) — api.js ya la encoló en offlineQueueStore para reenviarla en cuanto
      // vuelva la señal (ver useOfflineSync). Antes esto se trataba igual que un
      // rechazo real del servidor y el asistente se quedaba trabado en Pre-sesión para
      // siempre, aunque el dato SÍ se hubiera capturado. Se avanza igual, con un aviso
      // de que quedó pendiente de sincronizar, en vez de bloquear al médico.
      if (!error.response) {
        setSaveNotice({
          tone: 'warning',
          message: `${etiqueta} guardada localmente (sin conexión). Se enviará automáticamente cuando vuelva la señal.`,
        });
        return true;
      }
      const detail = error?.response?.data?.message ?? error?.message ?? 'Error desconocido.';
      setSaveNotice({ tone: 'error', message: `No se pudo guardar ${etiqueta.toLowerCase()}: ${detail}` });
      return false;
    } finally {
      setSaving(false);
    }
  }

  const [preData,       setPreData]       = useState(EMPTY_PRE);
  const [quemasData,    setQuemasData]    = useState(() =>
    Array.from({ length: numQuemas }, () => ({ ...EMPTY_POST_QUEMA }))
  );
  const [cierreData,    setCierreData]    = useState(EMPTY_CIERRE);
  const [aptitud,       setAptitud]       = useState(null);
  // Se deriva de la evaluación en vez de mantenerse en un estado propio que nunca se
  // actualizaba: el banner de "NO APTO" jamás llegaba a mostrarse.
  const isNoApto = aptitud ? !aptitud.apto : false;
  const [esInvestigacion, setEsInvestigacion] = useState(false);
  const [invData,       setInvData]       = useState(EMPTY_INVESTIGACION);

  // Validación de campos vacíos (mostrar rojo al hacer click en Evaluar)
  const [showPreErrors, setShowPreErrors]     = useState(false);
  const [showPostErrors, setShowPostErrors]   = useState(false);
  const [showCierreErrors, setShowCierreErrors] = useState(false);

  const [quemaSecs, setQuemaSecs] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (stage === S.QUEMA_ACTIVA) {
      setQuemaSecs(0);
      timerRef.current = setInterval(() => setQuemaSecs(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [stage, currentQuema]);

  function pad(n) { return String(n).padStart(2, '0'); }
  function secsToMM(s) { return pad(Math.floor(s / 60)); }
  function secsToSS(s) { return pad(s % 60); }

  // Updaters
  const updatePre    = (f, v) => setPreData(p => ({ ...p, [f]: v }));
  const updateCierre = (f, v) => setCierreData(p => ({ ...p, [f]: v }));
  const updateInv    = (f, v) => setInvData(p => ({ ...p, [f]: v }));

  function updateQuema(f, v) {
    setQuemasData(prev => {
      const next = [...prev];
      next[currentQuema - 1] = { ...next[currentQuema - 1], [f]: v };
      return next;
    });
  }

  function toggleSintomaPre(s) {
    setPreData(p => {
      const sins = p.sintomas.includes(s) ? p.sintomas.filter(x => x !== s) : [...p.sintomas, s];
      return { ...p, sintomas: sins };
    });
  }
  function toggleSintomaQuema(s) {
    setQuemasData(prev => {
      const next = [...prev];
      const cur = next[currentQuema - 1];
      const sins = cur.sintomas.includes(s) ? cur.sintomas.filter(x => x !== s) : [...cur.sintomas, s];
      next[currentQuema - 1] = { ...cur, sintomas: sins };
      return next;
    });
  }
  function toggleSintomaCierre(s) {
    setCierreData(p => {
      const sins = p.sintomas.includes(s) ? p.sintomas.filter(x => x !== s) : [...p.sintomas, s];
      return { ...p, sintomas: sins };
    });
  }

  // Evaluar aptitud — siempre disponible; valida campos vacíos primero
  async function handleEvaluarPre() {
    if (!vitalsComplete(preData) || !preData.rol) {
      setShowPreErrors(true);
      return;
    }
    setShowPreErrors(false);
    const result = verificarAptitud(preData);

    // Solo se marca la aptitud (y se avanza) si la medición quedó registrada: antes
    // `setAptitud` se llamaba antes de guardar, así que el banner "NO APTO" aparecía
    // aunque el guardado hubiera fallado y la evaluación siguiera en Pre-sesión.
    const ok = await submitVitals(preData, 'Medición pre-sesión');
    if (!ok) return;

    setAptitud(result);
    setStage(result.apto ? S.APTO : S.NO_APTO);
  }

  function handleFinalizarQuema() {
    setQuemasData(prev => {
      const next = [...prev];
      next[currentQuema - 1] = {
        ...next[currentQuema - 1],
        duracionMin: secsToMM(quemaSecs),
        duracionSeg: secsToSS(quemaSecs),
      };
      return next;
    });
    setStage(S.POST_QUEMA);
  }

  /**
   * Guarda la medición post-quema y avanza.
   * Antes esta función solo cambiaba de etapa: los signos vitales de cada quema
   * nunca llegaban al servidor y se perdían al salir de la pantalla.
   */
  async function handleGuardarPostQuema() {
    const current = quemasData[currentQuema - 1];
    if (!vitalsComplete(current)) {
      setShowPostErrors(true);
      return;
    }
    setShowPostErrors(false);

    const ok = await submitVitals(current, `Medición post-quema ${currentQuema}`);
    if (!ok) return;

    if (currentQuema < numQuemas) {
      setCurrentQuema(q => q + 1);
      setStage(S.QUEMA_ACTIVA);
    } else {
      setStage(S.CIERRE);
    }
  }

  /**
   * Guarda la medición de cierre y finaliza la evaluación.
   * Antes el panel de cierre solo hacía `setStage(S.LISTO)` sin persistir nada.
   */
  async function handleFinalizarEvaluacion() {
    if (!vitalsComplete(cierreData)) {
      setShowCierreErrors(true);
      return;
    }
    setShowCierreErrors(false);

    const ok = await submitVitals(cierreData, 'Medición de cierre');
    if (!ok) return;

    // Los marcadores de investigación (lactato/bioimpedancia/Stroop) son opcionales y
    // solo se envían si la sesión se marcó como I+D+i. Un fallo aquí no debe bloquear
    // el cierre: los vitales ya quedaron guardados en el paso anterior.
    if (esInvestigacion) {
      try {
        await bioimpedanceService.submit(participantId, healthPersonnelId, {
          fatPercentage: invData.bioimpedancia_grasa,
          muscleMassKg: invData.bioimpedancia_musculo,
          metabolicAgeYears: invData.bioimpedancia_edad_metabolica,
          lactatePreMmol: invData.lactato_pre,
          lactatePostMmol: invData.lactato_post,
          stroopTimeSeconds: invData.stroop_tiempo,
          stroopErrors: invData.stroop_errores,
        });
      } catch (error) {
        const detail = error?.response?.data?.message ?? error?.message ?? 'Error desconocido.';
        setSaveNotice({
          tone: 'warning',
          message: `Cierre guardado, pero los marcadores de investigación no se pudieron registrar: ${detail}`,
        });
      }
    }

    setStage(S.LISTO);
  }

  const curQuemaData = quemasData[currentQuema - 1];

  return (
    <SafeAreaView style={st.root} edges={['top', 'bottom']}>

      {/* ── Header ── */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>
              {bomberoName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={st.bomberName}>{bomberoName}</Text>
            <Text style={st.bomberSub}>Evaluación · {numQuemas} quema{numQuemas > 1 ? 's' : ''}</Text>
          </View>
        </View>
        <TouchableOpacity style={st.volverBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={15} color={t.textPrimary} />
          <Text style={st.volverText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* ── Timeline ── */}
      <TimelineBar stage={stage} currentQuema={currentQuema} numQuemas={numQuemas} />

      {/* ── No Apto Banner ── */}
      {isNoApto && stage !== S.NO_APTO && stage !== S.LISTO && (
        <View style={st.noAptoBanner}>
          <Ionicons name="warning" size={15} color={t.onPrimarySolid} />
          <Text style={st.noAptoBannerText}>Bombero marcado NO APTO — Completa el cierre</Text>
        </View>
      )}

      {/* Resultado real del guardado: éxito, éxito parcial (campos sin soporte en el
          servidor) o error. Antes el guardado fallaba en silencio. */}
      {!!saveNotice && (
        <View style={st.noticeWrap}>
          <Toast message={saveNotice.message} tone={saveNotice.tone} />
        </View>
      )}

      {/* Aviso de bloqueo: sin ficha de personal de salud no se pueden firmar
          mediciones, y conviene saberlo antes de llenar todo el formulario. */}
      {hpResolved && !healthPersonnelId && (
        <View style={st.noticeWrap}>
          <Toast
            message="Tu usuario no está registrado como personal de salud: no podrás guardar mediciones."
            tone="error"
          />
        </View>
      )}

      {/* ── Body ── */}
      <ScrollView style={st.body} contentContainerStyle={st.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={st.card}>

          {stage === S.PRE_SESION && (
            <PreSesionPanel
              data={preData}
              onChange={updatePre}
              onToggleSintoma={toggleSintomaPre}
              showErrors={showPreErrors}
              onEvaluar={handleEvaluarPre}
            />
          )}

          {stage === S.NO_APTO && (
            <NoAptoPanel
              data={preData}
              razones={aptitud?.razones ?? []}
              onTerminar={() => navigation.goBack()}
              onReintentar={() => setStage(S.PRE_SESION)}
            />
          )}

          {stage === S.APTO && (
            <AptoPanel
              data={preData}
              onIniciar={() => setStage(S.QUEMA_ACTIVA)}
            />
          )}

          {stage === S.QUEMA_ACTIVA && (
            <QuemaActivaPanel
              quemaNum={currentQuema}
              secs={quemaSecs}
              toMM={secsToMM} toSS={secsToSS}
              onFinalizar={handleFinalizarQuema}
            />
          )}

          {stage === S.POST_QUEMA && (
            <PostQuemaPanel
              quemaNum={currentQuema}
              numQuemas={numQuemas}
              data={curQuemaData}
              onChange={updateQuema}
              onToggleSintoma={toggleSintomaQuema}
              showErrors={showPostErrors}
              onGuardar={handleGuardarPostQuema}
            />
          )}

          {stage === S.CIERRE && (
            <CierrePanel
              data={cierreData}
              isNoApto={isNoApto}
              onChange={updateCierre}
              onToggleSintoma={toggleSintomaCierre}
              esInvestigacion={esInvestigacion}
              setEsInvestigacion={setEsInvestigacion}
              invData={invData}
              updateInv={updateInv}
              showErrors={showCierreErrors}
              saving={saving}
              onFinalizar={handleFinalizarEvaluacion}
            />
          )}

          {stage === S.LISTO && (
            <ListoPanel isNoApto={isNoApto} onVolver={() => navigation.goBack()} />
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── TimelineBar ───────────────────────────────────────────────────────────────

function TimelineBar({ stage, currentQuema, numQuemas }) {
  const { tl, t } = useSheets();
  const preStages    = [S.PRE_SESION, S.NO_APTO, S.APTO];
  const cierreStages = [S.CIERRE, S.LISTO];
  const quemaStages  = [S.QUEMA_ACTIVA, S.POST_QUEMA];

  function isDone(idx) {
    if (idx === 0) return !preStages.includes(stage);
    if (idx === numQuemas + 1) return stage === S.LISTO;
    if (cierreStages.includes(stage)) return true;
    if (quemaStages.includes(stage)) return currentQuema > idx;
    return false;
  }
  function isActive(idx) {
    if (idx === 0) return preStages.includes(stage);
    if (idx === numQuemas + 1) return cierreStages.includes(stage);
    return quemaStages.includes(stage) && currentQuema === idx;
  }

  const steps = [
    { key: 'pre', label: 'Pre-sesión' },
    ...Array.from({ length: numQuemas }, (_, i) => ({ key: `q${i + 1}`, label: `Quema ${i + 1}` })),
    { key: 'cierre', label: 'Cierre' },
  ];

  return (
    <View style={tl.bar}>
      {steps.map((step, i) => {
        const done   = isDone(i);
        const active = isActive(i);
        const isLast = i === steps.length - 1;
        return (
          <View key={step.key} style={tl.stepWrap}>
            <View style={tl.dotRow}>
              <View style={[tl.dot, done && tl.dotDone, active && tl.dotActive]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color={t.onPrimarySolid} />
                  : <Text style={[tl.dotText, (active || done) && { color: t.onPrimarySolid }]}>{i + 1}</Text>
                }
              </View>
              {!isLast && <View style={[tl.line, done && tl.lineDone]} />}
            </View>
            <Text style={[tl.label, active && tl.labelActive, done && tl.labelDone]} numberOfLines={1}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── PreSesionPanel ────────────────────────────────────────────────────────────

function PreSesionPanel({ data, onChange, onToggleSintoma, showErrors, onEvaluar }) {
  const { p, t } = useSheets();
  const errRol    = showErrors && !data.rol;
  const errHumo1  = showErrors && data.esFumador === null;
  const errHumo2  = showErrors && data.expuestoHumo === null;

  return (
    <View style={p.twoCol}>

      {/* ── Izquierda: Rol + Exposición ── */}
      <View style={p.leftCol}>
        <View style={p.panelHeader}>
          <Ionicons name="person-outline" size={18} color={t.primaryText} />
          <Text style={p.panelTitle}>Pre-sesión</Text>
        </View>

        <Text style={[p.secLabel, errRol && { color: t.status.danger.fg }]}>
          Rol en la práctica {errRol && '— requerido'}
        </Text>
        <View style={p.chipGrid}>
          {ROLES_BOMBERO.map(rol => (
            <TouchableOpacity
              key={rol}
              style={[p.roleChip, data.rol === rol && p.roleChipActive, errRol && p.roleChipErr]}
              onPress={() => onChange('rol', rol)}
              activeOpacity={0.8}
            >
              <Text style={[p.roleChipText, data.rol === rol && p.roleChipTextActive]}>{rol}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[p.secLabel, { marginTop: 6 }]}>Exposición al humo</Text>
        <YesNoField
          label="¿Es fumador habitual?"
          value={data.esFumador}
          hasError={errHumo1}
          onChange={v => onChange('esFumador', v)}
        />
        <YesNoField
          label="¿Expuesto a humo últimas 48h?"
          value={data.expuestoHumo}
          hasError={errHumo2}
          onChange={v => onChange('expuestoHumo', v)}
        />

        <Text style={[p.secLabel, { marginTop: 6 }]}>Síntomas — inicio del día</Text>
        <SintomasChips selected={data.sintomas} onToggle={onToggleSintoma} />
      </View>

      {/* ── Derecha: Vitales ── */}
      <View style={p.rightCol}>
        <Text style={p.secLabel}>Signos Vitales — Antes de entrar</Text>
        <VitalesForm data={data} onChange={onChange} showErrors={showErrors} />

        {/* ── Botón Evaluar (siempre activo, centrado abajo) ── */}
        <View style={p.evalBtnWrap}>
          <TouchableOpacity style={p.evalBtn} onPress={onEvaluar} activeOpacity={0.85}>
            <Ionicons name="pulse-outline" size={17} color={t.onPrimarySolid} />
            <Text style={p.evalBtnText}>Evaluar Aptitud</Text>
            <Ionicons name="arrow-forward" size={17} color={t.onPrimarySolid} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── NoAptoPanel ───────────────────────────────────────────────────────────────

function NoAptoPanel({ data, razones, onTerminar, onReintentar }) {
  const { p, t } = useSheets();
  return (
    <View style={p.centered}>
      <View style={[p.resultBadge, { backgroundColor: t.status.danger.bg, borderColor: t.status.danger.border }]}>
        <Ionicons name="close-circle" size={48} color={t.status.danger.fg} />
        <Text style={[p.resultTitle, { color: t.status.danger.fg }]}>NO APTO</Text>
        <Text style={p.resultSub}>El bombero no cumple los parámetros mínimos para la práctica.</Text>
      </View>

      {/* Vitales mostradas limpiamente */}
      <View style={p.vitalesSummaryNoApto}>
        <VitalStatItem
          label="Temp." value={`${data.temperatura}°C`}
          bad={razones.some(r => r.includes('Temperatura'))}
        />
        <VitalStatItem
          label="PA" value={`${data.presionSistolica}/${data.presionDiastolica}`}
          bad={razones.some(r => r.includes('sistólica') || r.includes('diastólica'))}
        />
        <VitalStatItem
          label="Pulso" value={`${data.frecuenciaCardiaca} lpm`}
          bad={razones.some(r => r.includes('cardíaca'))}
        />
        <VitalStatItem
          label="SpO₂" value={`${data.nivelOxigeno}%`}
          bad={razones.some(r => r.includes('SpO₂'))}
        />
        <VitalStatItem
          label="CO" value={`${data.nivelCO} ppm`}
          bad={razones.some(r => r.includes('CO'))}
        />
        <VitalStatItem label="Rol" value={data.rol} bad={false} />
      </View>

      <View style={p.btnRow}>
        <TouchableOpacity style={p.outlineBtn} onPress={onReintentar} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={15} color={t.primaryText} />
          <Text style={p.outlineBtnText}>Corregir datos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[p.mainBtn, { backgroundColor: t.status.neutral.solid }]} onPress={onTerminar} activeOpacity={0.85}>
          <Text style={p.mainBtnText}>Terminar evaluación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── AptoPanel ─────────────────────────────────────────────────────────────────

function AptoPanel({ data, onIniciar }) {
  const { p, t } = useSheets();
  return (
    <View style={p.centered}>
      <View style={[p.resultBadge, { backgroundColor: t.status.success.bg, borderColor: t.status.success.border }]}>
        <Ionicons name="checkmark-circle" size={48} color={t.status.success.fg} />
        <Text style={[p.resultTitle, { color: t.status.success.fg }]}>APTO</Text>
        <Text style={p.resultSub}>Parámetros dentro del rango. El bombero puede iniciar la práctica.</Text>
      </View>

      <View style={p.vitalesSummary}>
        <VitalStatItem label="Temp."  value={`${data.temperatura}°C`} bad={false} />
        <VitalStatItem label="PA"     value={`${data.presionSistolica}/${data.presionDiastolica}`} bad={false} />
        <VitalStatItem label="Pulso"  value={`${data.frecuenciaCardiaca} lpm`} bad={false} />
        <VitalStatItem label="SpO₂"   value={`${data.nivelOxigeno}%`} bad={false} />
        <VitalStatItem label="CO"     value={`${data.nivelCO} ppm`} bad={false} />
        <VitalStatItem label="Rol"    value={data.rol} bad={false} />
      </View>

      <View style={p.btnRow}>
        <TouchableOpacity style={[p.mainBtn, { paddingHorizontal: 36 }]} onPress={onIniciar} activeOpacity={0.85}>
          <MaterialCommunityIcons name="fire" size={18} color={t.onPrimarySolid} />
          <Text style={p.mainBtnText}>Iniciar Quema 1</Text>
          <Ionicons name="arrow-forward" size={16} color={t.onPrimarySolid} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── QuemaActivaPanel ──────────────────────────────────────────────────────────

function QuemaActivaPanel({ quemaNum, secs, toMM, toSS, onFinalizar }) {
  const { p, t } = useSheets();
  return (
    <View style={p.centered}>
      <Text style={p.quemaLabel}>Quema {quemaNum} en progreso</Text>

      {/* Círculo de fuego */}
      <View style={p.fireCircleOuter}>
        <View style={p.fireCircle}>
          <MaterialCommunityIcons name="fire" size={54} color={t.onPrimarySolid} />
        </View>
        <View style={p.fireNumBadge}>
          <Text style={p.fireNumText}>#{quemaNum}</Text>
        </View>
      </View>

      {/* Timer */}
      <View style={p.timerBox}>
        <Text style={p.timerText}>{toMM(secs)}:{toSS(secs)}</Text>
        <Text style={p.timerSub}>min &nbsp; : &nbsp; seg</Text>
      </View>

      <TouchableOpacity style={[p.mainBtn, { backgroundColor: t.status.danger.solid, marginTop: 8 }]} onPress={onFinalizar} activeOpacity={0.85}>
        <Ionicons name="stop-circle-outline" size={18} color={t.onPrimarySolid} />
        <Text style={p.mainBtnText}>Finalizar Quema {quemaNum}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── PostQuemaPanel ────────────────────────────────────────────────────────────

function PostQuemaPanel({ quemaNum, numQuemas, data, onChange, onToggleSintoma, showErrors, onGuardar }) {
  const { p, t } = useSheets();
  const isLast = quemaNum === numQuemas;
  return (
    <View style={p.twoCol}>

      {/* ── Izquierda: Duración + Síntomas ── */}
      <View style={p.leftCol}>
        <View style={p.panelHeader}>
          <Ionicons name="timer-outline" size={18} color={t.primaryText} />
          <Text style={p.panelTitle}>Registro — Quema {quemaNum}</Text>
        </View>

        <Text style={p.secLabel}>Duración en quema</Text>
        <View style={p.duracionRow}>
          <View style={p.duracionField}>
            <Text style={p.duracionUnit}>min</Text>
            <Text style={p.duracionValue}>{data.duracionMin || '--'}</Text>
          </View>
          <Text style={p.duracionSep}>:</Text>
          <View style={p.duracionField}>
            <Text style={p.duracionUnit}>seg</Text>
            <Text style={p.duracionValue}>{data.duracionSeg || '--'}</Text>
          </View>
        </View>

        <Text style={[p.secLabel, { marginTop: 8 }]}>Síntomas — durante la práctica</Text>
        <SintomasChips selected={data.sintomas} onToggle={onToggleSintoma} />
      </View>

      {/* ── Derecha: Vitales + Botón ── */}
      <View style={p.rightCol}>
        <Text style={p.secLabel}>Signos Vitales — Después de la quema</Text>
        <VitalesForm data={data} onChange={onChange} showErrors={showErrors} />

        <View style={p.evalBtnWrap}>
          <TouchableOpacity style={p.evalBtn} onPress={onGuardar} activeOpacity={0.85}>
            <Text style={p.evalBtnText}>
              {isLast ? 'Ir al Cierre' : `Guardar y continuar a Quema ${quemaNum + 1}`}
            </Text>
            <Ionicons name={isLast ? 'flag-outline' : 'arrow-forward'} size={16} color={t.onPrimarySolid} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── CierrePanel ───────────────────────────────────────────────────────────────

function CierrePanel({
  data, isNoApto, onChange, onToggleSintoma,
  esInvestigacion, setEsInvestigacion, invData, updateInv, onFinalizar,
  showErrors, saving,
}) {
  const { p, t } = useSheets();

  return (
    <View style={p.twoCol}>

      {/* ── Izquierda: Síntomas + Observaciones + Investigación ── */}
      <View style={p.leftCol}>
        <View style={p.panelHeader}>
          <Ionicons name="flag-outline" size={18} color={t.status.success.fg} />
          <Text style={p.panelTitle}>Cierre del día</Text>
        </View>

        {isNoApto && (
          <View style={p.noAptoNote}>
            <Ionicons name="warning-outline" size={14} color={t.status.danger.fg} />
            <Text style={p.noAptoNoteText}>Bombero NO APTO — Completa el registro de cierre.</Text>
          </View>
        )}

        <Text style={p.secLabel}>Síntomas — al final del día</Text>
        <SintomasChips selected={data.sintomas} onToggle={onToggleSintoma} />

        <Text style={[p.secLabel, { marginTop: 8 }]}>Eventos especiales / Observaciones</Text>
        <TextInput
          style={p.textArea}
          value={data.eventosEspeciales}
          onChangeText={v => onChange('eventosEspeciales', v)}
          placeholder="Describe cualquier evento relevante durante la práctica..."
          placeholderTextColor={t.textPlaceholder}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* ── Sección de investigación (opcional) ── */}
        <TouchableOpacity
          style={p.invToggleRow}
          onPress={() => setEsInvestigacion(v => !v)}
          activeOpacity={0.8}
        >
          <View style={[p.invCheckbox, esInvestigacion && p.invCheckboxActive]}>
            {esInvestigacion && <Ionicons name="checkmark" size={12} color={t.onPrimarySolid} />}
          </View>
          <Text style={p.invToggleText}>Sesión de investigación (I+D+i)</Text>
        </TouchableOpacity>

        {esInvestigacion && (
          <InvestigacionSection data={invData} onChange={updateInv} />
        )}
      </View>

      {/* ── Derecha: Vitales + Botón ── */}
      <View style={p.rightCol}>
        <Text style={p.secLabel}>Signos Vitales — Fin del día</Text>
        {/* Se validan igual que en el resto de etapas: antes se pasaba showErrors
            fijo en false, así que se podía finalizar con los vitales vacíos. */}
        <VitalesForm data={data} onChange={onChange} showErrors={showErrors} />

        {/* Las observaciones libres ("eventosEspeciales") todavía no tienen columna en
            el backend — los marcadores de investigación sí se envían (ver
            handleFinalizarEvaluacion), por eso la nota ya solo menciona observaciones. */}
        {!!data.eventosEspeciales && (
          <Text style={p.unsupportedNote}>
            Nota: las observaciones de texto libre aún no se envían al servidor (sin
            soporte en la API).
          </Text>
        )}

        <View style={p.evalBtnWrap}>
          <TouchableOpacity
            style={[p.evalBtn, { backgroundColor: saving ? t.disabledBg : t.status.success.solid }]}
            onPress={onFinalizar}
            activeOpacity={0.85}
            disabled={saving}
            {...a11yButton('Finalizar evaluación', { disabled: saving, busy: saving })}
          >
            {saving
              ? <ActivityIndicator size="small" color={t.onPrimarySolid} />
              : <Ionicons name="checkmark-circle-outline" size={17} color={t.onPrimarySolid} {...a11yDecorative} />}
            <Text style={p.evalBtnText}>
              {saving ? 'Guardando…' : 'Finalizar Evaluación'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── InvestigacionSection ──────────────────────────────────────────────────────

function InvestigacionSection({ data, onChange }) {
  const { p } = useSheets();
  return (
    <View style={p.invSection}>
      <Text style={p.invSectionTitle}>Marcadores de Investigación</Text>

      <Text style={p.invGroupLabel}>Lactato (mmol/L)</Text>
      <View style={p.invRow}>
        <InvField label="Pre-quema"  value={data.lactato_pre}  onChange={v => onChange('lactato_pre', v)} />
        <InvField label="Post-quema" value={data.lactato_post} onChange={v => onChange('lactato_post', v)} />
      </View>

      <Text style={p.invGroupLabel}>Bioimpedancia</Text>
      <View style={p.invRow}>
        <InvField label="% Grasa"       value={data.bioimpedancia_grasa}         onChange={v => onChange('bioimpedancia_grasa', v)} />
        <InvField label="% Músculo"     value={data.bioimpedancia_musculo}       onChange={v => onChange('bioimpedancia_musculo', v)} />
        <InvField label="Edad metab."   value={data.bioimpedancia_edad_metabolica} onChange={v => onChange('bioimpedancia_edad_metabolica', v)} />
      </View>

      <Text style={p.invGroupLabel}>Prueba de Stroop</Text>
      <View style={p.invRow}>
        <InvField label="Tiempo (seg)" value={data.stroop_tiempo}  onChange={v => onChange('stroop_tiempo', v)} />
        <InvField label="Errores"      value={data.stroop_errores} onChange={v => onChange('stroop_errores', v)} />
      </View>
    </View>
  );
}

function InvField({ label, value, onChange }) {
  const { p, t } = useSheets();
  return (
    <View style={p.invField}>
      <Text style={p.invFieldLabel}>{label}</Text>
      <TextInput
        style={p.invInput}
        value={value} onChangeText={onChange}
        keyboardType="number-pad" placeholder="—"
        placeholderTextColor={t.textPlaceholder}
      />
    </View>
  );
}

// ── ListoPanel ────────────────────────────────────────────────────────────────

function ListoPanel({ isNoApto, onVolver }) {
  const { p, t } = useSheets();
  return (
    <View style={p.centered}>
      <View style={[p.resultBadge, {
          backgroundColor: isNoApto ? t.status.danger.bg : t.status.success.bg,
          borderColor: isNoApto ? t.status.danger.border : t.status.success.border,
        }]}>
        <Ionicons
          name={isNoApto ? 'close-circle' : 'checkmark-circle'}
          size={52}
          color={isNoApto ? t.status.danger.fg : t.status.success.fg}
        />
        <Text style={[p.resultTitle, { color: isNoApto ? t.status.danger.fg : t.status.success.fg }]}>
          Evaluación Guardada
        </Text>
        <Text style={p.resultSub}>
          {isNoApto
            ? 'El registro fue guardado. El bombero fue marcado NO APTO.'
            : 'Todos los datos de la sesión fueron registrados correctamente.'
          }
        </Text>
      </View>
      <TouchableOpacity style={[p.mainBtn, { paddingHorizontal: 36 }]} onPress={onVolver} activeOpacity={0.85}>
        <Ionicons name="arrow-back" size={16} color={t.onPrimarySolid} />
        <Text style={p.mainBtnText}>Volver a la lista</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Vitales Form ──────────────────────────────────────────────────────────────

function VitalesForm({ data, onChange, showErrors }) {
  const { vi } = useSheets();
  return (
    <View style={vi.grid}>
      <SemaforoInput
        field="temperatura" label="Temperatura (°C)"
        value={data.temperatura} onChangeText={v => onChange('temperatura', v)}
        showError={showErrors && !data.temperatura}
      />
      <View style={vi.bpWrap}>
        <Text style={vi.bpLabel}>Presión Arterial (mmHg)</Text>
        <View style={vi.bpRow}>
          <SemaforoInput
            field="presionSistolica" label="" isCompact
            value={data.presionSistolica} onChangeText={v => onChange('presionSistolica', v)}
            showError={showErrors && !data.presionSistolica}
            placeholder="Sis."
          />
          <Text style={vi.bpSlash}>/</Text>
          <SemaforoInput
            field="presionDiastolica" label="" isCompact
            value={data.presionDiastolica} onChangeText={v => onChange('presionDiastolica', v)}
            showError={showErrors && !data.presionDiastolica}
            placeholder="Dias."
          />
        </View>
        {showErrors && (!data.presionSistolica || !data.presionDiastolica) && (
          <Text style={vi.errorText}>Campo obligatorio</Text>
        )}
      </View>
      <SemaforoInput
        field="frecuenciaCardiaca" label="Frec. Cardíaca (lpm)"
        value={data.frecuenciaCardiaca} onChangeText={v => onChange('frecuenciaCardiaca', v)}
        showError={showErrors && !data.frecuenciaCardiaca}
      />
      <SemaforoInput
        field="nivelOxigeno" label="SpO₂ (%)"
        value={data.nivelOxigeno} onChangeText={v => onChange('nivelOxigeno', v)}
        showError={showErrors && !data.nivelOxigeno}
      />
      <SemaforoInput
        field="nivelCO" label="Nivel CO (ppm)"
        value={data.nivelCO} onChangeText={v => onChange('nivelCO', v)}
        showError={showErrors && !data.nivelCO}
      />
    </View>
  );
}

function SemaforoInput({ field, label, value, onChangeText, showError, placeholder, isCompact }) {
  const { vi, t } = useSheets();
  const color = getSemaforoColor(field, value);
  const borderColor = showError ? t.status.danger.border
    : color ? semaforoTones(t).border[color]
    : t.border;
  const bgColor = showError ? t.status.danger.bg
    : color ? semaforoTones(t).bg[color]
    : t.cardAlt;
  return (
    <View style={[vi.fieldWrap, isCompact && { flex: 1 }]}>
      {!!label && (
        <View style={vi.labelRow}>
          <Text style={vi.label}>{label}</Text>
          {color && !showError && <SemaforoIndicator color={color} />}
        </View>
      )}
      <TextInput
        style={[vi.input, { borderColor, borderWidth: (color || showError) ? 1.5 : 1, backgroundColor: bgColor }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholder={placeholder || (showError ? 'Obligatorio' : '—')}
        placeholderTextColor={showError ? t.status.danger.fg : t.textPlaceholder}
      />
      {showError && !isCompact && <Text style={vi.errorText}>Campo obligatorio</Text>}
    </View>
  );
}

function SemaforoIndicator({ color }) {
  const { vi, t } = useSheets();
  return <View style={[vi.dot, { backgroundColor: semaforoTones(t).border[color] }]} />;
}

function SintomasChips({ selected, onToggle }) {
  const { vi } = useSheets();
  return (
    <View style={vi.sintomasGrid}>
      {SINTOMAS_LIST.map(s => {
        const isSel = selected.includes(s);
        return (
          <TouchableOpacity
            key={s}
            style={[vi.sintomaChip, isSel && vi.sintomaChipActive]}
            onPress={() => onToggle(s)}
            activeOpacity={0.8}
          >
            <Text style={[vi.sintomaChipText, isSel && vi.sintomaChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function YesNoField({ label, value, hasError, onChange }) {
  const { vi, t } = useSheets();
  return (
    <View style={vi.yesNoWrap}>
      <Text style={[vi.yesNoLabel, hasError && { color: t.status.danger.fg }]}>{label}</Text>
      <View style={vi.yesNoRow}>
        <TouchableOpacity
          style={[vi.yesNoBtn, value === true && vi.yesNoBtnActive, hasError && vi.yesNoBtnErr]}
          onPress={() => onChange(true)} activeOpacity={0.8}
        >
          <Text style={[vi.yesNoBtnText, value === true && { color: t.onPrimarySolid }]}>Sí</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[vi.yesNoBtn, value === false && vi.yesNoBtnActive, hasError && vi.yesNoBtnErr]}
          onPress={() => onChange(false)} activeOpacity={0.8}
        >
          <Text style={[vi.yesNoBtnText, value === false && { color: t.onPrimarySolid }]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VitalStatItem({ label, value, bad }) {
  const { p, t } = useSheets();
  return (
    <View style={[p.vitalStat, bad && p.vitalStatBad]}>
      <Text style={p.vitalStatLabel}>{label}</Text>
      <Text style={[p.vitalStatValue, bad && { color: t.status.danger.fg }]}>{value}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const makeSt = (t) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: t.background },
  noticeWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: t.primarySolid, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: t.onPrimarySolid, fontSize: 16, fontWeight: '800' },
  bomberName: { fontSize: 17, fontWeight: '800', color: t.textPrimary },
  bomberSub:  { fontSize: 11, color: t.textMuted, marginTop: 2 },
  volverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: t.card, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: t.border,
  },
  volverText: { fontSize: 13, fontWeight: '600', color: t.textPrimary },
  noAptoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: t.status.danger.solid, paddingHorizontal: 20, paddingVertical: 8,
  },
  noAptoBannerText: { color: t.onPrimarySolid, fontSize: 12, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 14 },
  card: {
    flex: 1, backgroundColor: t.card, borderRadius: 14,
    borderWidth: 1, borderColor: t.border, padding: 22,
    shadowColor: t.shadowColor, shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  });

const makeTl = (t) =>
  StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 10 },
  stepWrap: { flex: 1, alignItems: 'center', gap: 4 },
  dotRow:   { flexDirection: 'row', alignItems: 'center', width: '100%' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: t.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dotActive: { backgroundColor: t.primarySolid },
  dotDone:   { backgroundColor: t.status.success.solid },
  dotText:   { fontSize: 11, fontWeight: '700', color: t.iconMuted },
  line:      { flex: 1, height: 2, backgroundColor: t.border },
  lineDone:  { backgroundColor: t.status.success.solid },
  label:     { fontSize: 10, color: t.iconMuted, textAlign: 'center' },
  labelActive:{ color: t.primaryText, fontWeight: '700' },
  labelDone:  { color: t.status.success.fg },
  });

const makeP = (t) =>
  StyleSheet.create({
  unsupportedNote: {
    fontSize: 12, color: t.status.warning.fg, backgroundColor: t.status.warning.bg,
    borderRadius: 8, padding: 10, marginTop: 8, lineHeight: 17,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  twoCol:   { flex: 1, flexDirection: 'row', gap: 22 },
  leftCol:  { flex: 0.9, gap: 10 },
  rightCol: { flex: 1.1, gap: 10 },

  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  panelTitle:  { fontSize: 16, fontWeight: '800', color: t.textPrimary },
  secLabel:    { fontSize: 12, fontWeight: '700', color: t.textSecondary },

  // Rol chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: t.borderStrong, backgroundColor: t.cardAlt,
  },
  roleChipActive: { backgroundColor: t.primarySolid, borderColor: t.primary },
  roleChipErr:    { borderColor: t.status.danger.border },
  roleChipText:   { fontSize: 13, fontWeight: '600', color: t.textMuted },
  roleChipTextActive: { color: t.onPrimarySolid },

  // Result badge
  resultBadge: {
    alignItems: 'center', gap: 10, borderRadius: 16, padding: 28,
    borderWidth: 1,
  },
  resultTitle: { fontSize: 26, fontWeight: '900' },
  resultSub:   { fontSize: 13, color: t.textMuted, textAlign: 'center', maxWidth: 360 },

  // Vitales summary
  vitalesSummary: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
  },
  vitalesSummaryNoApto: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
  },
  vitalStat: {
    backgroundColor: t.cardAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', minWidth: 80,
    borderWidth: 1, borderColor: t.border,
  },
  vitalStatBad: { borderColor: t.status.danger.border, backgroundColor: t.status.danger.bg },
  vitalStatLabel: { fontSize: 10, color: t.textMuted, fontWeight: '600' },
  vitalStatValue: { fontSize: 15, fontWeight: '800', color: t.textPrimary, marginTop: 2 },

  // Fire circle (quema activa)
  quemaLabel: { fontSize: 16, fontWeight: '700', color: t.textMuted },
  fireCircleOuter: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  fireCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: t.primarySolid,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: t.primary, shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
  },
  fireNumBadge: {
    position: 'absolute', bottom: -6, right: -6,
    backgroundColor: t.status.danger.solid, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 2, borderColor: t.card,
  },
  fireNumText: { color: t.onPrimarySolid, fontSize: 14, fontWeight: '900' },

  timerBox:  { alignItems: 'center', gap: 4 },
  timerText: { fontSize: 68, fontWeight: '900', color: t.status.danger.fg, letterSpacing: 2 },
  timerSub:  { fontSize: 12, color: t.iconMuted, letterSpacing: 6 },

  // Duración
  duracionRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  duracionField:{ alignItems: 'center', backgroundColor: t.cardAlt, borderRadius: 10, padding: 12, flex: 1, borderWidth: 1, borderColor: t.border },
  duracionUnit: { fontSize: 10, color: t.textMuted, fontWeight: '600' },
  duracionValue:{ fontSize: 28, fontWeight: '900', color: t.textPrimary },
  duracionSep:  { fontSize: 24, fontWeight: '300', color: t.iconMuted },

  // No Apto note
  noAptoNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: t.status.danger.bg, borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: t.status.danger.border,
  },
  noAptoNoteText: { flex: 1, fontSize: 12, color: t.status.danger.fg, fontWeight: '600' },

  // Investigacion
  invToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  invCheckbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: t.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  invCheckboxActive: { backgroundColor: t.primarySolid, borderColor: t.primary },
  invToggleText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
  invSection: {
    backgroundColor: t.cardAlt, borderRadius: 10,
    borderWidth: 1, borderColor: t.border, padding: 12, gap: 8,
  },
  invSectionTitle: { fontSize: 12, fontWeight: '700', color: t.primaryText, marginBottom: 4 },
  invGroupLabel:   { fontSize: 11, fontWeight: '700', color: t.textMuted },
  invRow:          { flexDirection: 'row', gap: 8 },
  invField:        { flex: 1, gap: 4 },
  invFieldLabel:   { fontSize: 10, color: t.textMuted, fontWeight: '600' },
  invInput: {
    backgroundColor: t.card, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: t.textPrimary,
    borderWidth: 1, borderColor: t.border,
    textAlign: 'center', fontWeight: '600',
  },

  // Text area
  textArea: {
    backgroundColor: t.cardAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: t.textPrimary, minHeight: 80,
  },

  // Evaluar btn (bottom-right)
  evalBtnWrap: { marginTop: 'auto', alignItems: 'flex-end' },
  evalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: t.primarySolid, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  evalBtnText: { color: t.onPrimarySolid, fontSize: 14, fontWeight: '700' },

  // Generic buttons
  mainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: t.primarySolid, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  mainBtnText: { color: t.onPrimarySolid, fontSize: 14, fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: t.primary,
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: t.primaryText },
  btnRow: { flexDirection: 'row', gap: 12 },
  });

const makeVi = (t) =>
  StyleSheet.create({
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldWrap:{ width: '47%', gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:    { fontSize: 11, fontWeight: '600', color: t.textSecondary },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  input: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 14, color: t.textPrimary, fontWeight: '600',
  },
  errorText: { fontSize: 10, color: t.status.danger.fg, marginTop: 1 },
  bpWrap:  { width: '47%', gap: 4 },
  bpLabel: { fontSize: 11, fontWeight: '600', color: t.textSecondary },
  bpRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bpSlash: { fontSize: 20, fontWeight: '300', color: t.iconMuted },
  sintomasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  sintomaChip: {
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: t.borderStrong, backgroundColor: t.cardAlt,
  },
  sintomaChipActive:    { backgroundColor: t.primarySolid, borderColor: t.primary },
  sintomaChipText:      { fontSize: 12, color: t.textMuted },
  sintomaChipTextActive:{ color: t.onPrimarySolid, fontWeight: '600' },
  yesNoWrap:  { gap: 4 },
  yesNoLabel: { fontSize: 12, color: t.textSecondary, lineHeight: 16 },
  yesNoRow:   { flexDirection: 'row', gap: 8 },
  yesNoBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: t.borderStrong,
    alignItems: 'center', backgroundColor: t.cardAlt,
  },
  yesNoBtnActive: { backgroundColor: t.primarySolid, borderColor: t.primary },
  yesNoBtnErr:    { borderColor: t.status.danger.border },
  yesNoBtnText:   { fontSize: 13, fontWeight: '600', color: t.textMuted },
  });
