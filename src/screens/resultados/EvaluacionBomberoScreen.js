import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SINTOMAS_LIST } from './__mocks__/resultadosData';

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

const SEM_BORDER = { green: '#27AE60', orange: '#E85D27' };
const SEM_BG     = { green: '#F0FFF4', orange: '#FFF5F0' };

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
  const bomberoName = route?.params?.bomberoName ?? 'Bombero';
  const numQuemas   = route?.params?.numQuemas   ?? 2;

  const [stage,        setStage]        = useState(S.PRE_SESION);
  const [currentQuema, setCurrentQuema] = useState(1);

  const [preData,       setPreData]       = useState(EMPTY_PRE);
  const [quemasData,    setQuemasData]    = useState(() =>
    Array.from({ length: numQuemas }, () => ({ ...EMPTY_POST_QUEMA }))
  );
  const [cierreData,    setCierreData]    = useState(EMPTY_CIERRE);
  const [aptitud,       setAptitud]       = useState(null);
  const [isNoApto,      setIsNoApto]      = useState(false);
  const [esInvestigacion, setEsInvestigacion] = useState(false);
  const [invData,       setInvData]       = useState(EMPTY_INVESTIGACION);

  // Validación de campos vacíos (mostrar rojo al hacer click en Evaluar)
  const [showPreErrors, setShowPreErrors]   = useState(false);
  const [showPostErrors, setShowPostErrors] = useState(false);

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
  function handleEvaluarPre() {
    if (!vitalsComplete(preData) || !preData.rol) {
      setShowPreErrors(true);
      return;
    }
    setShowPreErrors(false);
    const result = verificarAptitud(preData);
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

  function handleGuardarPostQuema() {
    if (!vitalsComplete(quemasData[currentQuema - 1])) {
      setShowPostErrors(true);
      return;
    }
    setShowPostErrors(false);
    if (currentQuema < numQuemas) {
      setCurrentQuema(q => q + 1);
      setStage(S.QUEMA_ACTIVA);
    } else {
      setStage(S.CIERRE);
    }
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
          <Ionicons name="arrow-back" size={15} color="#2E2E2E" />
          <Text style={st.volverText}>Volver</Text>
        </TouchableOpacity>
      </View>

      {/* ── Timeline ── */}
      <TimelineBar stage={stage} currentQuema={currentQuema} numQuemas={numQuemas} />

      {/* ── No Apto Banner ── */}
      {isNoApto && stage !== S.NO_APTO && stage !== S.LISTO && (
        <View style={st.noAptoBanner}>
          <Ionicons name="warning" size={15} color="#fff" />
          <Text style={st.noAptoBannerText}>Bombero marcado NO APTO — Completa el cierre</Text>
        </View>
      )}

      {/* ── Body ── */}
      <View style={st.body}>
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
              onFinalizar={() => setStage(S.LISTO)}
            />
          )}

          {stage === S.LISTO && (
            <ListoPanel isNoApto={isNoApto} onVolver={() => navigation.goBack()} />
          )}

        </View>
      </View>
    </SafeAreaView>
  );
}

// ── TimelineBar ───────────────────────────────────────────────────────────────

function TimelineBar({ stage, currentQuema, numQuemas }) {
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
                  ? <Ionicons name="checkmark" size={10} color="#fff" />
                  : <Text style={[tl.dotText, (active || done) && { color: '#fff' }]}>{i + 1}</Text>
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
  const errRol    = showErrors && !data.rol;
  const errHumo1  = showErrors && data.esFumador === null;
  const errHumo2  = showErrors && data.expuestoHumo === null;

  return (
    <View style={p.twoCol}>

      {/* ── Izquierda: Rol + Exposición ── */}
      <View style={p.leftCol}>
        <View style={p.panelHeader}>
          <Ionicons name="person-outline" size={18} color="#E85D27" />
          <Text style={p.panelTitle}>Pre-sesión</Text>
        </View>

        <Text style={[p.secLabel, errRol && { color: '#D83B35' }]}>
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
            <Ionicons name="pulse-outline" size={17} color="#fff" />
            <Text style={p.evalBtnText}>Evaluar Aptitud</Text>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── NoAptoPanel ───────────────────────────────────────────────────────────────

function NoAptoPanel({ data, razones, onTerminar, onReintentar }) {
  return (
    <View style={p.centered}>
      <View style={[p.resultBadge, { backgroundColor: '#FFF0EE', borderColor: '#FFCCCC' }]}>
        <Ionicons name="close-circle" size={48} color="#D83B35" />
        <Text style={[p.resultTitle, { color: '#D83B35' }]}>NO APTO</Text>
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
          <Ionicons name="create-outline" size={15} color="#E85D27" />
          <Text style={p.outlineBtnText}>Corregir datos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[p.mainBtn, { backgroundColor: '#697282' }]} onPress={onTerminar} activeOpacity={0.85}>
          <Text style={p.mainBtnText}>Terminar evaluación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── AptoPanel ─────────────────────────────────────────────────────────────────

function AptoPanel({ data, onIniciar }) {
  return (
    <View style={p.centered}>
      <View style={[p.resultBadge, { backgroundColor: '#F0FFF4', borderColor: '#C3E6CB' }]}>
        <Ionicons name="checkmark-circle" size={48} color="#27AE60" />
        <Text style={[p.resultTitle, { color: '#27AE60' }]}>APTO</Text>
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
          <MaterialCommunityIcons name="fire" size={18} color="#fff" />
          <Text style={p.mainBtnText}>Iniciar Quema 1</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── QuemaActivaPanel ──────────────────────────────────────────────────────────

function QuemaActivaPanel({ quemaNum, secs, toMM, toSS, onFinalizar }) {
  return (
    <View style={p.centered}>
      <Text style={p.quemaLabel}>Quema {quemaNum} en progreso</Text>

      {/* Círculo de fuego */}
      <View style={p.fireCircleOuter}>
        <View style={p.fireCircle}>
          <MaterialCommunityIcons name="fire" size={54} color="#fff" />
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

      <TouchableOpacity style={[p.mainBtn, { backgroundColor: '#C62828', marginTop: 8 }]} onPress={onFinalizar} activeOpacity={0.85}>
        <Ionicons name="stop-circle-outline" size={18} color="#fff" />
        <Text style={p.mainBtnText}>Finalizar Quema {quemaNum}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── PostQuemaPanel ────────────────────────────────────────────────────────────

function PostQuemaPanel({ quemaNum, numQuemas, data, onChange, onToggleSintoma, showErrors, onGuardar }) {
  const isLast = quemaNum === numQuemas;
  return (
    <View style={p.twoCol}>

      {/* ── Izquierda: Duración + Síntomas ── */}
      <View style={p.leftCol}>
        <View style={p.panelHeader}>
          <Ionicons name="timer-outline" size={18} color="#E85D27" />
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
            <Ionicons name={isLast ? 'flag-outline' : 'arrow-forward'} size={16} color="#fff" />
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
}) {
  return (
    <View style={p.twoCol}>

      {/* ── Izquierda: Síntomas + Observaciones + Investigación ── */}
      <View style={p.leftCol}>
        <View style={p.panelHeader}>
          <Ionicons name="flag-outline" size={18} color="#2E7D32" />
          <Text style={p.panelTitle}>Cierre del día</Text>
        </View>

        {isNoApto && (
          <View style={p.noAptoNote}>
            <Ionicons name="warning-outline" size={14} color="#D83B35" />
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
          placeholderTextColor="#B0B7C3"
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
            {esInvestigacion && <Ionicons name="checkmark" size={12} color="#fff" />}
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
        <VitalesForm data={data} onChange={onChange} showErrors={false} />

        <View style={p.evalBtnWrap}>
          <TouchableOpacity style={[p.evalBtn, { backgroundColor: '#2E7D32' }]} onPress={onFinalizar} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
            <Text style={p.evalBtnText}>Finalizar Evaluación</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── InvestigacionSection ──────────────────────────────────────────────────────

function InvestigacionSection({ data, onChange }) {
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
  return (
    <View style={p.invField}>
      <Text style={p.invFieldLabel}>{label}</Text>
      <TextInput
        style={p.invInput}
        value={value} onChangeText={onChange}
        keyboardType="number-pad" placeholder="—"
        placeholderTextColor="#B0B7C3"
      />
    </View>
  );
}

// ── ListoPanel ────────────────────────────────────────────────────────────────

function ListoPanel({ isNoApto, onVolver }) {
  return (
    <View style={p.centered}>
      <View style={[p.resultBadge, { backgroundColor: isNoApto ? '#FFF0EE' : '#F0FFF4', borderColor: isNoApto ? '#FFCCCC' : '#C3E6CB' }]}>
        <Ionicons
          name={isNoApto ? 'close-circle' : 'checkmark-circle'}
          size={52}
          color={isNoApto ? '#D83B35' : '#27AE60'}
        />
        <Text style={[p.resultTitle, { color: isNoApto ? '#D83B35' : '#27AE60' }]}>
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
        <Ionicons name="arrow-back" size={16} color="#fff" />
        <Text style={p.mainBtnText}>Volver a la lista</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Vitales Form ──────────────────────────────────────────────────────────────

function VitalesForm({ data, onChange, showErrors }) {
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
  const color = getSemaforoColor(field, value);
  const borderColor = showError ? '#D83B35'
    : color ? SEM_BORDER[color]
    : '#E8EBF0';
  const bgColor = showError ? '#FFF5F5'
    : color ? SEM_BG[color]
    : '#F3F3F5';
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
        placeholderTextColor={showError ? '#D83B35' : '#B0B7C3'}
      />
      {showError && !isCompact && <Text style={vi.errorText}>Campo obligatorio</Text>}
    </View>
  );
}

function SemaforoIndicator({ color }) {
  return <View style={[vi.dot, { backgroundColor: SEM_BORDER[color] }]} />;
}

function SintomasChips({ selected, onToggle }) {
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
  return (
    <View style={vi.yesNoWrap}>
      <Text style={[vi.yesNoLabel, hasError && { color: '#D83B35' }]}>{label}</Text>
      <View style={vi.yesNoRow}>
        <TouchableOpacity
          style={[vi.yesNoBtn, value === true && vi.yesNoBtnActive, hasError && vi.yesNoBtnErr]}
          onPress={() => onChange(true)} activeOpacity={0.8}
        >
          <Text style={[vi.yesNoBtnText, value === true && { color: '#fff' }]}>Sí</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[vi.yesNoBtn, value === false && vi.yesNoBtnActive, hasError && vi.yesNoBtnErr]}
          onPress={() => onChange(false)} activeOpacity={0.8}
        >
          <Text style={[vi.yesNoBtnText, value === false && { color: '#fff' }]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VitalStatItem({ label, value, bad }) {
  return (
    <View style={[p.vitalStat, bad && p.vitalStatBad]}>
      <Text style={p.vitalStatLabel}>{label}</Text>
      <Text style={[p.vitalStatValue, bad && { color: '#D83B35' }]}>{value}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E85D27', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bomberName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  bomberSub:  { fontSize: 11, color: '#697282', marginTop: 2 },
  volverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  volverText: { fontSize: 13, fontWeight: '600', color: '#2E2E2E' },
  noAptoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D83B35', paddingHorizontal: 20, paddingVertical: 8,
  },
  noAptoBannerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 14 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E8EBF0', padding: 22,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
});

const tl = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 10 },
  stepWrap: { flex: 1, alignItems: 'center', gap: 4 },
  dotRow:   { flexDirection: 'row', alignItems: 'center', width: '100%' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8EBF0', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dotActive: { backgroundColor: '#E85D27' },
  dotDone:   { backgroundColor: '#27AE60' },
  dotText:   { fontSize: 11, fontWeight: '700', color: '#9AA3B0' },
  line:      { flex: 1, height: 2, backgroundColor: '#E8EBF0' },
  lineDone:  { backgroundColor: '#27AE60' },
  label:     { fontSize: 10, color: '#9AA3B0', textAlign: 'center' },
  labelActive:{ color: '#E85D27', fontWeight: '700' },
  labelDone:  { color: '#27AE60' },
});

const p = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  twoCol:   { flex: 1, flexDirection: 'row', gap: 22 },
  leftCol:  { flex: 0.9, gap: 10 },
  rightCol: { flex: 1.1, gap: 10 },

  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  panelTitle:  { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  secLabel:    { fontSize: 12, fontWeight: '700', color: '#495565' },

  // Rol chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D0D5DD', backgroundColor: '#F9FAFB',
  },
  roleChipActive: { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  roleChipErr:    { borderColor: '#D83B35' },
  roleChipText:   { fontSize: 13, fontWeight: '600', color: '#697282' },
  roleChipTextActive: { color: '#fff' },

  // Result badge
  resultBadge: {
    alignItems: 'center', gap: 10, borderRadius: 16, padding: 28,
    borderWidth: 1,
  },
  resultTitle: { fontSize: 26, fontWeight: '900' },
  resultSub:   { fontSize: 13, color: '#697282', textAlign: 'center', maxWidth: 360 },

  // Vitales summary
  vitalesSummary: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
  },
  vitalesSummaryNoApto: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
  },
  vitalStat: {
    backgroundColor: '#F9FAFB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', minWidth: 80,
    borderWidth: 1, borderColor: '#E8EBF0',
  },
  vitalStatBad: { borderColor: '#FFCCCC', backgroundColor: '#FFF5F5' },
  vitalStatLabel: { fontSize: 10, color: '#697282', fontWeight: '600' },
  vitalStatValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginTop: 2 },

  // Fire circle (quema activa)
  quemaLabel: { fontSize: 16, fontWeight: '700', color: '#697282' },
  fireCircleOuter: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  fireCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#E85D27',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E85D27', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
  },
  fireNumBadge: {
    position: 'absolute', bottom: -6, right: -6,
    backgroundColor: '#C62828', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 2, borderColor: '#fff',
  },
  fireNumText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  timerBox:  { alignItems: 'center', gap: 4 },
  timerText: { fontSize: 68, fontWeight: '900', color: '#C62828', letterSpacing: 2 },
  timerSub:  { fontSize: 12, color: '#9AA3B0', letterSpacing: 6 },

  // Duración
  duracionRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  duracionField:{ alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, flex: 1, borderWidth: 1, borderColor: '#E8EBF0' },
  duracionUnit: { fontSize: 10, color: '#697282', fontWeight: '600' },
  duracionValue:{ fontSize: 28, fontWeight: '900', color: '#2E2E2E' },
  duracionSep:  { fontSize: 24, fontWeight: '300', color: '#9AA3B0' },

  // No Apto note
  noAptoNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF5F5', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#FFCCCC',
  },
  noAptoNoteText: { flex: 1, fontSize: 12, color: '#D83B35', fontWeight: '600' },

  // Investigacion
  invToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  invCheckbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#D0D5DD',
    alignItems: 'center', justifyContent: 'center',
  },
  invCheckboxActive: { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  invToggleText: { fontSize: 13, fontWeight: '600', color: '#495565' },
  invSection: {
    backgroundColor: '#F9FAFB', borderRadius: 10,
    borderWidth: 1, borderColor: '#E8EBF0', padding: 12, gap: 8,
  },
  invSectionTitle: { fontSize: 12, fontWeight: '700', color: '#E85D27', marginBottom: 4 },
  invGroupLabel:   { fontSize: 11, fontWeight: '700', color: '#697282' },
  invRow:          { flexDirection: 'row', gap: 8 },
  invField:        { flex: 1, gap: 4 },
  invFieldLabel:   { fontSize: 10, color: '#697282', fontWeight: '600' },
  invInput: {
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: '#2E2E2E',
    borderWidth: 1, borderColor: '#E8EBF0',
    textAlign: 'center', fontWeight: '600',
  },

  // Text area
  textArea: {
    backgroundColor: '#F3F3F5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: '#2E2E2E', minHeight: 80,
  },

  // Evaluar btn (bottom-right)
  evalBtnWrap: { marginTop: 'auto', alignItems: 'flex-end' },
  evalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E85D27', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  evalBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Generic buttons
  mainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#E85D27', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  mainBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E85D27',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: '#E85D27' },
  btnRow: { flexDirection: 'row', gap: 12 },
});

const vi = StyleSheet.create({
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldWrap:{ width: '47%', gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:    { fontSize: 11, fontWeight: '600', color: '#495565' },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  input: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 14, color: '#2E2E2E', fontWeight: '600',
  },
  errorText: { fontSize: 10, color: '#D83B35', marginTop: 1 },
  bpWrap:  { width: '47%', gap: 4 },
  bpLabel: { fontSize: 11, fontWeight: '600', color: '#495565' },
  bpRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bpSlash: { fontSize: 20, fontWeight: '300', color: '#9AA3B0' },
  sintomasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  sintomaChip: {
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#D0D5DD', backgroundColor: '#F9FAFB',
  },
  sintomaChipActive:    { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  sintomaChipText:      { fontSize: 12, color: '#697282' },
  sintomaChipTextActive:{ color: '#fff', fontWeight: '600' },
  yesNoWrap:  { gap: 4 },
  yesNoLabel: { fontSize: 12, color: '#495565', lineHeight: 16 },
  yesNoRow:   { flexDirection: 'row', gap: 8 },
  yesNoBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#D0D5DD',
    alignItems: 'center', backgroundColor: '#F9FAFB',
  },
  yesNoBtnActive: { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  yesNoBtnErr:    { borderColor: '#D83B35' },
  yesNoBtnText:   { fontSize: 13, fontWeight: '600', color: '#697282' },
});
