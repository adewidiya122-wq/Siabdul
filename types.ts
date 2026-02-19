export interface Student {
  id: string;
  nisn: string;
  name: string;
  grade: string;
  avatar: string;
  parentPhone?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timestamp: Date;
  status: 'present' | 'late' | 'sick' | 'permission' | 'alpha';
}

export interface ScanResult {
  text: string;
  format?: string;
}

export interface WhatsAppConfig {
  mode: 'link' | 'gateway';
  apiUrl: string;
  apiKey: string;
  autoSend: boolean;
}

export interface WALog {
  id: string;
  target: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
}

export type ViewState = 'dashboard' | 'scan' | 'students' | 'manual-attendance' | 'report' | 'student-form' | 'settings' | 'wa-gateway';