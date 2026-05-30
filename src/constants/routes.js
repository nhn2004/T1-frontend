// Auth
export const ROUTES = {
  // Auth stack
  LOGIN: 'Login',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Root navigators (one per role)
  SYSTEM_ADMIN_ROOT: 'SystemAdminRoot',
  ADMIN_ROOT: 'AdminRoot',
  TRAINEE_ROOT: 'TraineeRoot',
  MEDICAL_ROOT: 'MedicalRoot',
  RESEARCHER_ROOT: 'ResearcherRoot',

  // Dashboard
  DASHBOARD: 'Dashboard',

  // Sessions
  SESSIONS_LIST: 'SessionsList',
  SESSION_DETAIL: 'SessionDetail',
  SESSION_CREATE: 'SessionCreate',
  SESSION_INVITE: 'SessionInvite',
  SESSION_ATTENDANCE: 'SessionAttendance',

  // Medical
  MEDICAL_RECORDS: 'MedicalRecords',
  MEDICAL_RECORD_DETAIL: 'MedicalRecordDetail',
  MEDICAL_RECORD_CREATE: 'MedicalRecordCreate',
  VITAL_SIGNS: 'VitalSigns',
  BIOIMPEDANCE: 'Bioimpedance',
  ENVIRONMENTAL_DATA: 'EnvironmentalData',

  // Profile
  PROFILE: 'Profile',
  SETTINGS: 'Settings',

  // Researcher
  RESEARCHER_EXPORTS: 'ResearcherExports',
  RESEARCHER_REPORTS: 'ResearcherReports',

  // Schedule
  SCHEDULE: 'Schedule',
};
