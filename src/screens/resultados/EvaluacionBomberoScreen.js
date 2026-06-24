import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Step1SignosVitales from './components/Step1SignosVitales';
import { SINTOMAS_LIST } from './__mocks__/resultadosData';

// ── Etapas ───────────────────────────────────────────────────────────────────
const S = {
  INITIAL:        'initial',
  PRE_FORM:       'pre_form',
  NO_APTO:        'no_apto',
  APTO:           'apto',
  PRIMER_TIEMPO:  'primer_tiempo',
  T2_FORM:        't2_form',
  ENTRE_TIEMPOS:  'entre_tiempos',
  SEGUNDO_TIEMPO: 'segundo_tiempo',
  T3_FORM:        't3_form',
  EVAL_FINAL:     'eval_final',
  LISTO:          'listo',
};

const EMPTY_VITALS = {
  horaInicio: '', horaFin: '',
  temperatura: '', presionSistolica: '', presionDiastolica: '',
  frecuenciaCardiaca: '', nivelOxigeno: '',
  nivelCO: '', tiempoTranscurrido: '',
  sintomasSeleccionados: [],
};

function vitalsComplete(form) {
  return !!(form.temperatura && form.presionSistolica && form.presionDiastolica && form.frecuenciaCardiaca && form.nivelOxigeno && form.nivelCO);
}

function secsToDisplay(secs) {
  const mm = Math.floor(secs / 60).toString().padStart(2, '0');
  const ss = (secs % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// Umbrales de aptitud
function verificarAptitud(form) {
  const spo2  = parseFloat(form.nivelOxigeno);
  const temp  = parseFloat(form.temperatura);
  const pulso = parseFloat(form.frecuenciaCardiaca);
  const co    = parseFloat(form.nivelCO);
  const razones = [];
  if (!isNaN(spo2)  && spo2  < 95)  razones.push(`SpO₂ = ${spo2}% — mínimo requerido: 95%`);
  if (!isNaN(temp)  && temp  > 38)  razones.push(`Temperatura = ${temp}°C — máximo permitido: 38°C`);
  if (!isNaN(pulso) && pulso > 110) razones.push(`Pulso = ${pulso} lpm — máximo permitido: 110 lpm`);
  if (!isNaN(co)    && co    > 20)  razones.push(`CO = ${co} ppm — máximo permitido: 20 ppm`);
  return { apto: razones.length === 0, razones };
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function EvaluacionBomberoScreen({ navigation, route }) {
  const bomberoName = route?.params?.bomberoName ?? 'Bombero';
  const [stage,     setStage]     = React.useState(S.INITIAL);
  const [preForm,   setPreForm]   = React.useState(EMPTY_VITALS);
  const [t2Form,    setT2Form]    = React.useState(EMPTY_VITALS);
  const [t3Form,    setT3Form]    = React.useState(EMPTY_VITALS);
  const [finalSintomas, setFinalSintomas] = React.useState([]);
  const [aptitud,   setAptitud]   = React.useState(null);

  const updatePre = (f, v) => setPreForm(p => ({ ...p, [f]: v }));
  const updateT2  = (f, v) => setT2Form(p  => ({ ...p, [f]: v }));
  const updateT3  = (f, v) => setT3Form(p  => ({ ...p, [f]: v }));

  function toggleSintoma(form, setForm, sintoma) {
    setForm(p => {
      const prev = p.sintomasSeleccionados || [];
      const next = prev.includes(sintoma) ? prev.filter(s => s !== sintoma) : [...prev, sintoma];
      return { ...p, sintomasSeleccionados: next };
    });
  }

  function handleEvaluarPre() {
    const result = verificarAptitud(preForm);
    setAptitud(result);
    setStage(result.apto ? S.APTO : S.NO_APTO);
  }

  // Pre-prueba: "Ahora Fin" habilitado cuando horaInicio llenado + todos los vitales
  const preFinEnabled = !!preForm.horaInicio && vitalsComplete(preForm);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {bomberoName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.bomberName}>{bomberoName}</Text>
            <Text style={styles.bomberSub}>Bombero voluntario · Casa de Fuego</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.volverBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={15} color="#2E2E2E" />
          <Text style={styles.volverText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <TimelineBar stage={stage} />

      <View style={styles.body}>
        <View style={styles.card}>

          {stage === S.INITIAL && (
            <InitialPanel onStart={() => setStage(S.PRE_FORM)} />
          )}

          {/* PRE-PRUEBA: Ahora Fin auto-evalúa; sin botón extra */}
          {stage === S.PRE_FORM && (
            <FormPanel
              titulo="Pre-Prueba — Signos Vitales"
              formData={preForm}
              updateField={updatePre}
              showTiempo={false}
              finEnabled={preFinEnabled}
              onHoraFinCapture={handleEvaluarPre}
              onToggleSintoma={s => toggleSintoma(preForm, setPreForm, s)}
              showFooter={false}
            />
          )}

          {stage === S.NO_APTO && (
            <NoAptoPanel
              razones={aptitud?.razones ?? []}
              onTerminar={() => navigation.goBack()}
              onReintentar={() => { setPreForm(EMPTY_VITALS); setStage(S.PRE_FORM); }}
            />
          )}

          {stage === S.APTO && (
            <AptoPanel
              formData={preForm}
              onIniciar={() => setStage(S.PRIMER_TIEMPO)}
            />
          )}

          {/* 1er TIEMPO — cronómetro */}
          {stage === S.PRIMER_TIEMPO && (
            <TiempoActivoPanel
              label="1er Tiempo"
              color="#E85D27"
              btnLabel="Finalizar 1er Tiempo"
              onFinalizar={(secs) => {
                setT2Form(f => ({ ...f, tiempoTranscurrido: secsToDisplay(secs) }));
                setStage(S.T2_FORM);
              }}
            />
          )}

          {/* REGISTRO T2 */}
          {stage === S.T2_FORM && (
            <FormPanel
              titulo="Registro — Después del 1er Tiempo"
              formData={t2Form}
              updateField={updateT2}
              showTiempo
              onToggleSintoma={s => toggleSintoma(t2Form, setT2Form, s)}
              showFooter
              btnLabel="Guardar T2"
              btnColor="#E85D27"
              btnEnabled={vitalsComplete(t2Form)}
              onGuardar={() => setStage(S.ENTRE_TIEMPOS)}
            />
          )}

          {stage === S.ENTRE_TIEMPOS && (
            <EntrePanel
              onSegundoTiempo={() => setStage(S.SEGUNDO_TIEMPO)}
              onGuardar={() => setStage(S.EVAL_FINAL)}
            />
          )}

          {/* 2do TIEMPO — cronómetro */}
          {stage === S.SEGUNDO_TIEMPO && (
            <TiempoActivoPanel
              label="2do Tiempo"
              color="#C62828"
              btnLabel="Finalizar 2do Tiempo"
              onFinalizar={(secs) => {
                setT3Form(f => ({ ...f, tiempoTranscurrido: secsToDisplay(secs) }));
                setStage(S.T3_FORM);
              }}
            />
          )}

          {/* REGISTRO T3 */}
          {stage === S.T3_FORM && (
            <FormPanel
              titulo="Registro — Después del 2do Tiempo"
              formData={t3Form}
              updateField={updateT3}
              showTiempo
              onToggleSintoma={s => toggleSintoma(t3Form, setT3Form, s)}
              showFooter
              btnLabel="Guardar T3"
              btnColor="#C62828"
              btnEnabled={vitalsComplete(t3Form)}
              onGuardar={() => setStage(S.EVAL_FINAL)}
            />
          )}

          {stage === S.EVAL_FINAL && (
            <EvaluacionFinalPanel
              sintomas={finalSintomas}
              onToggle={s => setFinalSintomas(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
              onGuardar={() => setStage(S.LISTO)}
            />
          )}

          {stage === S.LISTO && (
            <ListoPanel onVolver={() => navigation.goBack()} />
          )}

        </View>
      </View>
    </SafeAreaView>
  );
}

// ── TimelineBar ───────────────────────────────────────────────────────────────

function TimelineBar({ stage }) {
  const pasos = [
    { key: 'pre',    label: 'PRE',          stages: [S.PRE_FORM] },
    { key: 't1',     label: '1er Tiempo',   stages: [S.PRIMER_TIEMPO] },
    { key: 't2',     label: 'Registro',     stages: [S.T2_FORM] },
    { key: 'entre',  label: 'Decisión',     stages: [S.ENTRE_TIEMPOS] },
    { key: 't3',     label: '2do Registro', stages: [S.SEGUNDO_TIEMPO, S.T3_FORM] },
    { key: 'final',  label: 'Final',        stages: [S.EVAL_FINAL, S.LISTO] },
  ];

  const ORDER = [
    S.INITIAL, S.PRE_FORM, S.NO_APTO, S.APTO, S.PRIMER_TIEMPO,
    S.T2_FORM, S.ENTRE_TIEMPOS, S.SEGUNDO_TIEMPO, S.T3_FORM, S.EVAL_FINAL, S.LISTO,
  ];
  const currentIdx = ORDER.indexOf(stage);

  return (
    <View style={tl.bar}>
      {pasos.map((paso, i) => {
        const pasoIdx  = ORDER.indexOf(paso.stages[0]);
        const isDone   = pasoIdx < currentIdx && !paso.stages.includes(stage);
        const isActive = paso.stages.includes(stage);
        const isLast   = i === pasos.length - 1;
        return (
          <View key={paso.key} style={tl.stepWrap}>
            <View style={[tl.dot, isDone && tl.dotDone, isActive && tl.dotActive]}>
              {isDone
                ? <Ionicons name="checkmark" size={10} color="#fff" />
                : <Text style={[tl.dotNum, isActive && tl.dotNumActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[tl.label, isActive && tl.labelActive, isDone && tl.labelDone]}>
              {paso.label}
            </Text>
            {!isLast && <View style={[tl.line, isDone && tl.lineDone]} />}
          </View>
        );
      })}
    </View>
  );
}

// ── Panels ────────────────────────────────────────────────────────────────────

function InitialPanel({ onStart }) {
  return (
    <View style={p.center}>
      <View style={p.iconCircle}>
        <Ionicons name="medical-outline" size={48} color="#E85D27" />
      </View>
      <Text style={p.bigTitle}>Evaluación Pre-Prueba</Text>
      <Text style={p.bigSub}>
        Registra los signos vitales del bombero antes de ingresar al área de entrenamiento.
        Los valores determinarán si puede realizar la prueba.
      </Text>
      <TouchableOpacity style={[p.bigBtn, { backgroundColor: '#E85D27' }]} onPress={onStart}>
        <Ionicons name="clipboard-outline" size={18} color="#fff" />
        <Text style={p.bigBtnText}>Iniciar Pre-Prueba</Text>
      </TouchableOpacity>
    </View>
  );
}

function FormPanel({
  titulo, formData, updateField, showTiempo,
  finEnabled, onHoraFinCapture, onToggleSintoma,
  showFooter, btnLabel, btnColor, btnEnabled = true, onGuardar,
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={p.formHeader}>
        <Text style={p.formTitle}>{titulo}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Step1SignosVitales
          formData={formData}
          updateField={updateField}
          showTiempo={showTiempo}
          finEnabled={finEnabled}
          onHoraFinCapture={onHoraFinCapture}
          sintomas={SINTOMAS_LIST}
          onToggleSintoma={onToggleSintoma}
        />
      </View>

      {showFooter && (
        <View style={p.formFooter}>
          <TouchableOpacity
            style={[p.footerBtn, { backgroundColor: btnColor }, !btnEnabled && p.footerBtnDisabled]}
            onPress={btnEnabled ? onGuardar : undefined}
            activeOpacity={btnEnabled ? 0.8 : 1}
          >
            <Text style={p.footerBtnText}>{btnLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function NoAptoPanel({ razones, onTerminar, onReintentar }) {
  return (
    <View style={[p.center, { padding: 40, gap: 16 }]}>
      <View style={p.noAptoIconBox}>
        <Ionicons name="close-circle" size={64} color="#C62828" />
      </View>
      <Text style={p.noAptoTitle}>No puede realizar la prueba</Text>
      <Text style={p.noAptoSub}>Los siguientes parámetros están fuera del rango permitido:</Text>
      <View style={p.razonesBox}>
        {razones.map((r, i) => (
          <View key={i} style={p.razonRow}>
            <Ionicons name="warning-outline" size={16} color="#C62828" />
            <Text style={p.razonText}>{r}</Text>
          </View>
        ))}
      </View>
      <Text style={p.noAptoNote}>
        El bombero debe recibir atención médica antes de participar en cualquier ejercicio.
      </Text>
      <View style={p.noAptoBtns}>
        <TouchableOpacity style={p.reintentarBtn} onPress={onReintentar}>
          <Ionicons name="refresh-outline" size={14} color="#495565" />
          <Text style={p.reintentarText}>Reingresar valores</Text>
        </TouchableOpacity>
        <TouchableOpacity style={p.terminarBtn} onPress={onTerminar}>
          <Ionicons name="checkmark-outline" size={14} color="#fff" />
          <Text style={p.terminarText}>Terminar prueba</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AptoPanel({ formData, onIniciar }) {
  const bp = (formData.presionSistolica && formData.presionDiastolica)
    ? `${formData.presionSistolica}/${formData.presionDiastolica}`
    : '—';
  const campos = [
    { label: 'Temperatura',  value: formData.temperatura        ? `${formData.temperatura}°C`          : '—' },
    { label: 'Tensión Art.', value: bp },
    { label: 'Pulso',        value: formData.frecuenciaCardiaca ? `${formData.frecuenciaCardiaca} lpm` : '—' },
    { label: 'SpO₂',         value: formData.nivelOxigeno       ? `${formData.nivelOxigeno}%`          : '—' },
    { label: 'CO',           value: formData.nivelCO            ? `${formData.nivelCO} ppm`            : '—' },
  ];
  return (
    <View style={p.center}>
      <View style={[p.iconCircle, { backgroundColor: '#E8F5E9' }]}>
        <Ionicons name="checkmark-circle" size={56} color="#2E7D32" />
      </View>
      <Text style={[p.bigTitle, { color: '#2E7D32' }]}>Bombero APTO</Text>
      <Text style={p.bigSub}>Todos los parámetros están dentro del rango normal.</Text>
      <View style={p.valoresRow}>
        {campos.map(c => (
          <View key={c.label} style={p.valorChip}>
            <Text style={p.valorLabel}>{c.label}</Text>
            <Text style={p.valorValue}>{c.value}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[p.bigBtn, { backgroundColor: '#E85D27' }]} onPress={onIniciar}>
        <Ionicons name="play-circle-outline" size={20} color="#fff" />
        <Text style={p.bigBtnText}>Iniciar Primer Tiempo</Text>
      </TouchableOpacity>
    </View>
  );
}

// Cronómetro en vivo — muestra tiempo alrededor del ícono de fuego
function TiempoActivoPanel({ label, color, btnLabel, onFinalizar }) {
  const [secs, setSecs] = React.useState(0);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const mm = Math.floor(secs / 60).toString().padStart(2, '0');
  const ss = (secs % 60).toString().padStart(2, '0');

  function handleFinalizar() {
    clearInterval(timerRef.current);
    onFinalizar(secs);
  }

  return (
    <View style={p.center}>
      <View style={[p.pulseRing, { borderColor: color }]}>
        <View style={[p.iconCircle, { backgroundColor: color + '20' }]}>
          <Ionicons name="flame" size={52} color={color} />
        </View>
      </View>
      <Text style={[p.timerDisplay, { color }]}>{mm}:{ss}</Text>
      <Text style={[p.bigTitle, { color }]}>{label} en progreso</Text>
      <Text style={p.bigSub}>
        El bombero está en el área de entrenamiento.{'\n'}
        Cuando finalice, presiona el botón para registrar la medición.
      </Text>
      <TouchableOpacity style={[p.bigBtn, { backgroundColor: color }]} onPress={handleFinalizar}>
        <Ionicons name="stop-circle-outline" size={20} color="#fff" />
        <Text style={p.bigBtnText}>{btnLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EntrePanel({ onSegundoTiempo, onGuardar }) {
  return (
    <View style={p.center}>
      <View style={[p.iconCircle, { backgroundColor: '#FFF3E0' }]}>
        <Ionicons name="time-outline" size={48} color="#E85D27" />
      </View>
      <Text style={p.bigTitle}>1er Tiempo completado</Text>
      <Text style={p.bigSub}>¿El bombero realizará un segundo tiempo de entrenamiento?</Text>
      <View style={p.entreRow}>
        <TouchableOpacity style={[p.entreBtn, { borderColor: '#C62828' }]} onPress={onSegundoTiempo}>
          <Ionicons name="play-circle-outline" size={20} color="#C62828" />
          <Text style={[p.entreBtnText, { color: '#C62828' }]}>Iniciar 2do Tiempo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[p.entreBtn, { backgroundColor: '#2E7D32', borderColor: '#2E7D32' }]} onPress={onGuardar}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={[p.entreBtnText, { color: '#fff' }]}>Guardar Evaluación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EvaluacionFinalPanel({ sintomas, onToggle, onGuardar }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={p.formHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="clipboard-outline" size={16} color="#2E7D32" />
          <Text style={p.formTitle}>Final de la Prueba</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#697282', marginTop: 2 }}>
          Registra los síntomas finales del bombero
        </Text>
      </View>

      <View style={ef.body}>
        <Text style={ef.colTitle}>Registrar síntomas finales:</Text>
        <View style={ef.chips}>
          {SINTOMAS_LIST.map(sint => {
            const sel = sintomas.includes(sint);
            return (
              <TouchableOpacity
                key={sint}
                style={[ef.chip, sel && ef.chipOn]}
                onPress={() => onToggle(sint)}
                activeOpacity={0.7}
              >
                <Text style={[ef.chipText, sel && ef.chipTextOn]}>{sint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={p.formFooter}>
        <TouchableOpacity
          style={[p.footerBtn, { backgroundColor: '#2E7D32' }]}
          onPress={onGuardar}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={p.footerBtnText}>Finalizar Prueba</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ListoPanel({ onVolver }) {
  return (
    <View style={p.center}>
      <View style={[p.iconCircle, { backgroundColor: '#E8F5E9' }]}>
        <Ionicons name="ribbon-outline" size={52} color="#2E7D32" />
      </View>
      <Text style={[p.bigTitle, { color: '#2E7D32' }]}>Evaluación guardada</Text>
      <Text style={p.bigSub}>
        Todos los datos de la sesión han sido registrados correctamente.
      </Text>
      <TouchableOpacity style={[p.bigBtn, { backgroundColor: '#2E7D32' }]} onPress={onVolver}>
        <Ionicons name="arrow-back-outline" size={18} color="#fff" />
        <Text style={p.bigBtnText}>Volver a la sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E85D27', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bomberName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  bomberSub:  { fontSize: 11, color: '#697282' },
  volverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  volverText: { fontSize: 14, fontWeight: '600', color: '#2E2E2E' },
  body: { flex: 1, padding: 14 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
});

const tl = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  stepWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    marginRight: 5,
  },
  dotActive: { backgroundColor: '#E85D27' },
  dotDone:   { backgroundColor: '#2E7D32' },
  dotNum:    { fontSize: 10, fontWeight: '700', color: '#9AA3B0' },
  dotNumActive: { color: '#fff' },
  label:       { fontSize: 10, fontWeight: '600', color: '#9AA3B0' },
  labelActive: { color: '#E85D27' },
  labelDone:   { color: '#2E7D32' },
  line:     { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  lineDone: { backgroundColor: '#2E7D32' },
});

const p = StyleSheet.create({
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 16,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
  },
  pulseRing: {
    padding: 8, borderRadius: 62,
    borderWidth: 2, borderStyle: 'dashed',
  },
  timerDisplay: {
    fontSize: 40, fontWeight: '800', letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  bigTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  bigSub: { fontSize: 14, color: '#697282', textAlign: 'center', lineHeight: 22, maxWidth: 500 },
  bigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 8,
  },
  bigBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  valoresRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  valorChip: {
    backgroundColor: '#F3F3F5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  valorLabel: { fontSize: 10, fontWeight: '700', color: '#9AA3B0', letterSpacing: 0.5 },
  valorValue: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },

  noAptoIconBox: { marginBottom: 4 },
  noAptoTitle: { fontSize: 24, fontWeight: '800', color: '#C62828', textAlign: 'center' },
  noAptoSub:   { fontSize: 14, color: '#697282', textAlign: 'center' },
  razonesBox: {
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 16,
    gap: 10, width: '100%', maxWidth: 520,
  },
  razonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  razonText: { fontSize: 13, fontWeight: '600', color: '#C62828', flex: 1 },
  noAptoNote: {
    fontSize: 13, color: '#697282', textAlign: 'center',
    fontStyle: 'italic', maxWidth: 480,
  },
  noAptoBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  reintentarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D0D5DD',
  },
  reintentarText: { fontSize: 13, fontWeight: '600', color: '#495565' },
  terminarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#C62828',
  },
  terminarText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  entreRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  entreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  entreBtnText: { fontSize: 14, fontWeight: '700' },

  formHeader: {
    paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  formFooter: {
    flexDirection: 'row', justifyContent: 'flex-end',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10,
  },
  footerBtnDisabled: { opacity: 0.4 },
  footerBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

const ef = StyleSheet.create({
  body: {
    flex: 1, paddingHorizontal: 24, paddingVertical: 18, gap: 16,
  },
  colTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
    borderColor: '#D0D5DD', backgroundColor: '#F9FAFB',
  },
  chipOn:     { backgroundColor: '#E85D27', borderColor: '#E85D27' },
  chipText:   { fontSize: 13, fontWeight: '500', color: '#495565' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
});
