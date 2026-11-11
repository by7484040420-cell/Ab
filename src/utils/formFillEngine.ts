import { UserProfile } from '../types';

export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const defaultProfile: UserProfile = {
  naam: 'Rahul Kumar Sharma',
  pita: 'Suresh Kumar Sharma',
  mata: 'Sunita Devi',
  janm: '1998-08-15',
  mobile: '9876543210',
  email: 'rahul.sharma@gmail.com',
  pata: 'Gram - Rampur, Post - Rampur Bazzar, Thana - Sadar',
  pincode: '800001',
  gender: 'male',
  rajya: 'Bihar',
  jila: 'Patna',
  category: 'obc',
  marital: 'single',
  education: 'Graduate (B.Sc Computer Science, 2020)',
  aadhaar: '567812344321',
  aadhaar_last4: '4321',
  pan_number: 'ABCDE1234F',
  voter_id: 'BR0102312345',
  blood_group: 'B+',
  board_10th: 'BSEB Patna',
  roll_10th: '201402891',
  marks_10th: '82.4%',
  passing_year_10th: '2014',
  board_12th: 'BSEB Patna',
  roll_12th: '201604128',
  marks_12th: '79.6%',
  stream_12th: 'Science (PCM)',
  passing_year_12th: '2016',
  college_name: 'Patna Science College, Patna University',
  graduation_degree: 'B.Sc Computer Science',
  graduation_marks: '78.2%'
};

export function validateProfile(profile: Partial<UserProfile>): { validData: Record<string, string>; errors: string[] } {
  const validData: Record<string, string> = {};
  const errors: string[] = [];

  const v = (key: keyof UserProfile) => ((profile[key] as string) || '').trim().replace(/\s+/g, ' ');

  // Name validations
  const nameRe = /^[\p{L}\p{M} .'-]{2,60}$/u;
  const nameKeys: [keyof UserProfile, string][] = [
    ['naam', 'Naam'],
    ['pita', 'Pita ka naam'],
    ['mata', 'Mata ka naam']
  ];

  for (const [k, lbl] of nameKeys) {
    const s = v(k);
    if (!s) continue;
    if (nameRe.test(s)) {
      validData[k] = s;
    } else {
      errors.push(`${lbl}: Sirf akshar aur space likhein.`);
    }
  }

  // DOB
  const j = v('janm');
  if (j) {
    const match = j.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/) || j.match(/^(\d{1,2})[/.\\-](\d{1,2})[/.\\-](\d{4})$/);
    if (match) {
      let y = 0, m = 0, d = 0;
      if (j.includes('-') && j.split('-')[0].length === 4) {
        y = parseInt(j.split('-')[0], 10);
        m = parseInt(j.split('-')[1], 10);
        d = parseInt(j.split('-')[2], 10);
      } else {
        d = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        y = parseInt(match[3], 10);
      }

      if (y >= 1940 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        validData['janm'] = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      } else {
        errors.push('Janm tithi sahi nahi hai.');
      }
    } else {
      errors.push('Janm tithi YYYY-MM-DD ya DD/MM/YYYY me likhein.');
    }
  }

  // Mobile
  let mob = v('mobile').replace(/[\s-+]/g, '');
  if (mob.startsWith('91') && mob.length === 12) mob = mob.slice(2);
  if (mob.startsWith('0') && mob.length === 11) mob = mob.slice(1);
  if (mob) {
    if (/^[6-9]\d{9}$/.test(mob)) {
      validData['mobile'] = mob;
    } else {
      errors.push('Mobile: 10 ank ka sahi number likhein (6-9 se shuru).');
    }
  }

  // Email
  const em = v('email').toLowerCase();
  if (em) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      validData['email'] = em;
    } else {
      errors.push('Email sahi nahi lag raha (jaise naam@gmail.com).');
    }
  }

  // Pincode
  const pin = v('pincode');
  if (pin) {
    if (/^[1-9]\d{5}$/.test(pin)) {
      validData['pincode'] = pin;
    } else {
      errors.push('Pincode 6 ank ka hona chahiye.');
    }
  }

  // Address
  const addr = v('pata');
  if (addr) {
    if (addr.length >= 5) {
      validData['pata'] = addr;
    } else {
      errors.push('Pata thoda vistaar se likhein (kam se kam 5 akshar).');
    }
  }

  // Choices
  const g = v('gender');
  if (['male', 'female', 'other'].includes(g)) validData['gender'] = g;

  const st = v('rajya');
  if (st) validData['rajya'] = st;

  const dist = v('jila');
  if (dist) validData['jila'] = dist;

  const cat = v('category');
  if (['general', 'obc', 'sc', 'st', 'ews'].includes(cat)) validData['category'] = cat;

  const mar = v('marital');
  if (['single', 'married'].includes(mar)) validData['marital'] = mar;

  // Education
  const edu = v('education');
  if (edu) validData['education'] = edu;

  // Aadhaar (12 digits)
  const aadh = v('aadhaar').replace(/[\s-]/g, '');
  if (aadh) {
    if (/^\d{12}$/.test(aadh)) {
      validData['aadhaar'] = aadh;
      validData['aadhaar_last4'] = aadh.slice(-4);
    } else {
      errors.push('Aadhaar number 12 ank ka hona chahiye.');
    }
  }

  // Extra attributes pass-through
  ['pan_number', 'voter_id', 'blood_group', 'board_10th', 'roll_10th', 'marks_10th', 'passing_year_10th',
   'board_12th', 'roll_12th', 'marks_12th', 'stream_12th', 'passing_year_12th', 'college_name',
   'graduation_degree', 'graduation_marks'].forEach((k) => {
    const val = v(k as keyof UserProfile);
    if (val) validData[k] = val;
  });

  return { validData, errors };
}
