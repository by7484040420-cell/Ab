export interface Portal {
  name: string;
  url: string;
  keys: string[];
  note: string;
}

export interface Category {
  name: string;
  sub: string;
  tag: string;
  color: string;
  links: Portal[];
}

export interface JobItem {
  title: string;
  url: string;
  source: string;
  last_date?: string;
  first_seen: string;
  kind: 'job' | 'admit' | 'result' | 'all';
  posts?: string;
  vacancies?: number | string;
  qualification?: string;
}

export interface UserProfile {
  naam: string;
  pita: string;
  mata: string;
  janm: string; // YYYY-MM-DD
  mobile: string;
  email: string;
  pata: string;
  pincode: string;
  gender: 'male' | 'female' | 'other' | '';
  rajya: string;
  jila: string;
  category: 'general' | 'obc' | 'sc' | 'st' | 'ews' | '';
  marital: 'single' | 'married' | '';
  education: string;
  aadhaar: string; // 12 digits
  aadhaar_last4?: string;
  pan_number?: string;
  voter_id?: string;
  blood_group?: string;
  // 10th & 12th & Higher Education (Admissions & Job forms)
  board_10th?: string;
  roll_10th?: string;
  marks_10th?: string;
  passing_year_10th?: string;
  board_12th?: string;
  roll_12th?: string;
  marks_12th?: string;
  stream_12th?: string;
  passing_year_12th?: string;
  college_name?: string;
  graduation_degree?: string;
  graduation_marks?: string;
  // Vehicle / Driving Licence
  vehicle_class?: string;
  rto_office?: string;
  // Passport / Verification
  birth_place?: string;
  passport_type?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  // Documents
  photo_name?: string;
  photo_data?: string; // base64
  signature_name?: string;
  signature_data?: string; // base64
  marksheet_name?: string;
}

export interface AiMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  portal?: Portal;
  suggestedAction?: {
    label: string;
    action: string;
    portalName?: string;
  };
}

export interface FillReportItem {
  k: string;
  st: 'ok' | 'warn' | 'bad' | 'skip';
  msg: string;
}

export interface SvcDetail {
  direct?: string;
  info?: string;
  ask?: string;
  yesLabel?: string;
  noLabel?: string;
  yesUrl?: string;
  noUrl?: string;
  yesSay?: string;
  noSay?: string;
}

export interface AiConfig {
  key: string;
  base: string;
  model: string;
  autoSpeed: number; // ms delay between typing
}

export interface NaradNative {
  isNative(): boolean;
  openSite(url: string): void;
  closeSite(): void;
  aiFill(profileJson: string, key: string, base: string, model: string): void;
  clickText(text: string): void;
}

declare global {
  interface Window {
    NaradNative?: NaradNative;
    onNaradStatus?: (msg: string) => void;
  }
}
