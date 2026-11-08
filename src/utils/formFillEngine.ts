import { UserProfile, FillReportItem } from '../types';

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
  aadhaar_last4: '4321',
  photo_name: 'rahul_passport_photo.jpg',
  signature_name: 'rahul_signature.png',
  marksheet_name: '10th_marksheet.pdf'
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

  return { validData, errors };
}

// Generate a Bookmarklet code for official websites
export function generateBookmarkletCode(profile: UserProfile): string {
  const profileJson = JSON.stringify({
    naam: profile.naam,
    pita: profile.pita,
    mata: profile.mata,
    janm: profile.janm,
    mobile: profile.mobile,
    email: profile.email,
    pata: profile.pata,
    pincode: profile.pincode,
    gender: profile.gender,
    rajya: profile.rajya,
    jila: profile.jila,
    category: profile.category,
    marital: profile.marital
  });

  return `javascript:(function(){
    var P = ${profileJson};
    var rules = [
      {k:'naam', r:/\\b(full name|name|naam|applicant|candidate)\\b|नाम/i, neg:/father|mother|spouse|city/i},
      {k:'pita', r:/father|pita|guardian|पिता/i, neg:/mother|mobile|email/i},
      {k:'mata', r:/mother|mata|माता/i, neg:/father|mobile/i},
      {k:'mobile', r:/mobile|phone|contact|मोबाइल/i, neg:/alt|emergency|parent/i},
      {k:'email', r:/e?mail|ईमेल/i, neg:/alt|parent/i},
      {k:'pincode', r:/pin ?code|zip|पिन/i, neg:/otp|security/i},
      {k:'pata', r:/address|pata|पता/i, neg:/email|ip/i}
    ];
    var filled = 0;
    document.querySelectorAll('input:not([type=hidden]):not([type=submit]), textarea').forEach(function(el){
      var meta = ((el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')+' '+(el.title||'')).toLowerCase();
      if(/captcha|otp|password/i.test(meta)) return;
      for(var i=0; i<rules.length; i++){
        var rule = rules[i];
        if(rule.r.test(meta) && !rule.neg.test(meta) && P[rule.k]){
          el.value = P[rule.k];
          el.style.backgroundColor = '#dcfce7';
          el.style.border = '2px solid #22c55e';
          el.dispatchEvent(new Event('input', {bubbles:true}));
          el.dispatchEvent(new Event('change', {bubbles:true}));
          filled++;
          break;
        }
      }
    });
    alert('Narad AI: ' + filled + ' field auto-fill ho gaye!\\nAb aap CAPTCHA aur OTP enter kijiye.');
  })();`;
}

// Generate the Fill Report based on User Profile
export function simulateAutoFill(profile: UserProfile, formType: string): {
  report: FillReportItem[];
  filledCount: number;
  otpRequired: boolean;
  fieldsFilled: Record<string, string>;
} {
  const report: FillReportItem[] = [];
  const fieldsFilled: Record<string, string> = {};

  if (profile.naam) {
    report.push({ k: 'naam', st: 'ok', msg: `Naam: "${profile.naam}" safaltapoorvak bhara gaya.` });
    fieldsFilled['naam'] = profile.naam;
  } else {
    report.push({ k: 'naam', st: 'warn', msg: 'Naam profile me khali tha.' });
  }

  if (profile.pita) {
    report.push({ k: 'pita', st: 'ok', msg: `Pita ka naam: "${profile.pita}" safaltapoorvak bhara.` });
    fieldsFilled['pita'] = profile.pita;
  }

  if (profile.mata) {
    report.push({ k: 'mata', st: 'ok', msg: `Mata ka naam: "${profile.mata}" bhara gaya.` });
    fieldsFilled['mata'] = profile.mata;
  }

  if (profile.janm) {
    const [y, m, d] = profile.janm.split('-');
    report.push({ k: 'janm', st: 'ok', msg: `Janm tithi: "${d}/${m}/${y}" date field me set ho gaya.` });
    fieldsFilled['janm'] = `${d}/${m}/${y}`;
  }

  if (profile.mobile) {
    report.push({ k: 'mobile', st: 'ok', msg: `Mobile: "${profile.mobile}" bhara gaya (OTP isi par aayega).` });
    fieldsFilled['mobile'] = profile.mobile;
  }

  if (profile.email) {
    report.push({ k: 'email', st: 'ok', msg: `Email: "${profile.email}" verify form me set kiya gaya.` });
    fieldsFilled['email'] = profile.email;
  }

  if (profile.gender) {
    report.push({ k: 'gender', st: 'ok', msg: `Gender: "${profile.gender === 'male' ? 'Purush (Male)' : profile.gender === 'female' ? 'Mahila (Female)' : 'Anya'}" radio/dropdown select ho gaya.` });
    fieldsFilled['gender'] = profile.gender;
  }

  if (profile.category) {
    report.push({ k: 'category', st: 'ok', msg: `Category: "${profile.category.toUpperCase()}" reservation category select ho gayi.` });
    fieldsFilled['category'] = profile.category.toUpperCase();
  }

  if (profile.rajya) {
    report.push({ k: 'rajya', st: 'ok', msg: `Rajya: "${profile.rajya}" state dropdown me select hua.` });
    fieldsFilled['rajya'] = profile.rajya;
  }

  if (profile.jila) {
    report.push({ k: 'jila', st: 'ok', msg: `Jila: "${profile.jila}" district dropdown me set hua.` });
    fieldsFilled['jila'] = profile.jila;
  }

  if (profile.pincode) {
    report.push({ k: 'pincode', st: 'ok', msg: `Pincode: "${profile.pincode}" set hua.` });
    fieldsFilled['pincode'] = profile.pincode;
  }

  if (profile.pata) {
    report.push({ k: 'pata', st: 'ok', msg: `Pata: "${profile.pata}" permanent address me bhara.` });
    fieldsFilled['pata'] = profile.pata;
  }

  // Ticket booking / Exam specific
  if (formType.includes('IRCTC')) {
    report.push({ k: 'ticket', st: 'ok', msg: 'Passenger 1: Age, Berth Preference, Senior Citizen quota mapped.' });
    report.push({ k: 'insurance', st: 'ok', msg: 'Travel Insurance option "Yes" select kiya gaya.' });
    report.push({ k: 'otp', st: 'warn', msg: 'IRCTC Security: CAPTCHA image & Bank Payment OTP bas aap enter karenge.' });
  } else {
    report.push({ k: 'declare', st: 'ok', msg: 'Terms & Conditions / Declaration box tick kar diya gaya.' });
    report.push({ k: 'otp', st: 'warn', msg: 'Form Security: Image CAPTCHA aur Mobile OTP user verify karenge.' });
  }

  const okCount = report.filter(r => r.st === 'ok').length;

  return {
    report,
    filledCount: okCount,
    otpRequired: true,
    fieldsFilled
  };
}
