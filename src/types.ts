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
  aadhaar_last4: string;
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
