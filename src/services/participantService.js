import api from './api';

const STATUS_ORDER = { 'EN CURSO': 0, PENDIENTE: 1, COMPLETADO: 2, CANCELADO: 3 };

function deriveStatus(participant) {
  if (participant.participationStatus === 'Absent') return 'CANCELADO';
  if (participant.checkinAt)                        return 'EN CURSO';
  return 'PENDIENTE';
}

function toCard(participant, traineeMap) {
  const t = traineeMap[participant.traineeFirefighterId] ?? {};
  const status = deriveStatus(participant);
  return {
    id:        participant.sessionParticipantId,
    traineeId: participant.traineeFirefighterId,
    name:      t.firstName ? `${t.firstName} ${t.lastName}`.trim() : 'Bombero',
    age:       t.birthDate ? String(new Date().getFullYear() - new Date(t.birthDate).getFullYear()) : '—',
    weight:    '—',
    status,
  };
}

export const participantService = {
  async getBySession(sessionId) {
    const [{ data: pw }, { data: tw }] = await Promise.all([
      api.get('/session-participants'),
      api.get('/trainee-firefighters'),
    ]);

    const traineeMap = Object.fromEntries(
      tw.data.map(t => [t.traineeFirefighterId, t])
    );

    const filtered = pw.data.filter(p => p.trainingSessionId === sessionId);
    const cards    = filtered.map(p => toCard(p, traineeMap));

    return cards.sort(
      (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    );
  },

  async checkIn(participantId) {
    await api.post(`/session-participants/${participantId}/check-in`);
  },
};
