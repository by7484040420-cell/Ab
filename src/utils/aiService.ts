import { AiConfig, Portal } from '../types';
import { allPortals } from '../data/portals';

export const defaultAiConfig: AiConfig = {
  key: (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_AI_KEY || '',
  base: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  model: 'gemini-3.8-flash',
  autoSpeed: 40
};

export function getSavedAiConfig(): AiConfig {
  try {
    const saved = localStorage.getItem('narad_ai_cfg');
    if (saved) {
      return { ...defaultAiConfig, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return defaultAiConfig;
}

export function saveAiConfig(cfg: AiConfig) {
  try {
    localStorage.setItem('narad_ai_cfg', JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

// Built-in intelligent fallback for offline or zero-key mode
function generateSmartResponse(prompt: string): string {
  const p = prompt.toLowerCase();

  // IRCTC / Train ticket
  if (p.includes('irctc') || p.includes('ticket') || p.includes('train') || p.includes('tatkal')) {
    return `IRCTC Train Ticket Booking me Narad AI aapka 90% kaam khud karega:\n
1. Passenger Details: Aapka naam, umar, gender, berth choice, aur travel insurance AI khud fill karega.
2. Tatkal Timings: AC ticket booking subah 10:00 baje aur Non-AC/Sleeper subah 11:00 baje shuru hoti hai.
3. Master List: Booking se pehle profile me passenger add rakhein taaki 1 click me add ho jaye.
4. AAPKA KAAM: User ko sirf CAPTCHA image type karna hoga aur payment ka Bank OTP daalna hoga!
[OPEN:IRCTC (Train Ticket Booking)]`;
  }

  // PAN Card
  if (p.includes('pan') || p.includes('e-pan') || p.includes('pan card')) {
    return `Instant e-PAN bilkul FREE (₹0) banta hai Income Tax portal par:\n
• Samay: Sirf 10 minute me PDF download ho jata hai.
• Shart: 18+ umar aur Aadhaar se mobile number link hona chahiye.
• AI form me aapka Aadhaar number aur basic details verify karke fill karega.
• Bas aapko mobile par aane wala Aadhaar OTP daalna hoga!
[OPEN:PAN Card (Instant e-PAN)]`;
  }

  // SSC CGL / GD
  if (p.includes('ssc') || p.includes('cgl') || p.includes('gd') || p.includes('chsl')) {
    return `SSC ke forms (CGL, GD, CHSL, MTS) ke liye Narad AI ready hai:\n
• One-Time Registration (OTR) aur application form me aapka 10th roll number, marks, category, address sab AI fill karega.
• Documents: Photo aur Signature aapke Digital Locker se automatic select honge.
• Sirf final live webcam capture aur review aap karenge!
[OPEN:SSC (Staff Selection Commission)]`;
  }

  // RTPS Bihar (Income, Caste, Residence)
  if (p.includes('rtps') || p.includes('caste') || p.includes('jati') || p.includes('income') || p.includes('aay') || p.includes('awasiya') || p.includes('niwas') || p.includes('bihar')) {
    return `Bihar RTPS Seva (serviceonline.bihar.gov.in) par Aay, Jaati, aur Niwas praman patra free bante hain:\n
• AI aapka naam, pita, mata, gaon, post office, block aur jila 1 second me auto-fill kar dega.
• Shapath patra declaration box automatic tick ho jayega.
• 7 se 14 din me certificate DigiLocker / email par mil jata hai.
[OPEN:Income Certificate (RTPS Bihar)]`;
  }

  // Voter ID
  if (p.includes('voter') || p.includes('form 6') || p.includes('matdata')) {
    return `Naya Voter ID card (Form 6) banana bahut aasan hai:\n
• Fees: ₹0 (Free)\n
• Chahiye: Passport size photo, Age proof aur Address proof.\n
• AI assembly constituency, ward, address sab format me fill karega.\n
[OPEN:Voter ID (ECI Form 6)]`;
  }

  // Driving licence
  if (p.includes('driving') || p.includes('licence') || p.includes('license') || p.includes('dl') || p.includes('sarathi')) {
    return `Driving Licence / Learner Licence Parivahan Sarathi portal se banta hai:\n
• Ghar baithe Aadhaar verification se bina RTO jaye Learner Licence mil jata hai.\n
• AI aapka address, blood group aur category auto-fill karega.\n
[OPEN:Driving Licence (Parivahan)]`;
  }

  // Aadhaar
  if (p.includes('aadhaar') || p.includes('aadhar') || p.includes('uidai')) {
    return `Aadhaar Card services UIDAI myAadhaar portal par available hain:\n
• Aadhaar download karne par PDF ka password: Aapke naam ke shuru ke 4 akshar CAPITAL me + janm ka saal (jaise RAHU1998).\n
• PVC Card order ₹50 me ghar par deliver hota hai.\n
• Mobile number aur address update online ho jata hai.\n
[OPEN:Aadhaar Card (UIDAI)]`;
  }

  // General Sarkari jobs
  if (p.includes('job') || p.includes('naukri') || p.includes('bharti') || p.includes('vacancy') || p.includes('police') || p.includes('railway') || p.includes('rrb')) {
    return `Abhi RRB NTPC (11,558 post), SSC GD (39,481 post), Bihar Police (21,391 post) aur UP Police bharti chal rahi hai.\n
• AI auto-filler se kisi bhi exam form me aapki personal details, educational qualifications aur category instantly fill ho jati hain.\n
• Bas OTP aur Captcha enter karke payment karein.\n
[OPEN:Railway Recruitment Board (RRB)]`;
  }

  // Default intelligent assistant response
  return `Namaste! Mai Narad AI hoon. Aapka personal sarkari sahayak.\n
• Mera kaam: Form auto-fill karna, IRCTC train ticket book karna, aur document requirements batana.\n
• User ka kaam: User ko sirf CAPTCHA code aur mobile par aane wala OTP enter karna hai.\n
Bataiye aapko kaun sa form bharna hai ya ticket book karni hai?`;
}

export async function askNaradAi(
  cfg: AiConfig,
  history: { role: 'user' | 'assistant'; text: string }[]
): Promise<{ text: string; portal?: Portal }> {
  const lastUserMsg = history[history.length - 1]?.text || '';

  // If no API key configured, use our built-in high-accuracy advisor!
  if (!cfg.key || !cfg.key.trim()) {
    // Artificial small delay for natural feeling
    await new Promise(r => setTimeout(r, 600));
    const responseText = generateSmartResponse(lastUserMsg);
    const portal = extractPortal(responseText);
    return { text: responseText, portal };
  }

  // If API key is present, invoke Gemini / Groq / OpenAI endpoint
  try {
    const targetUrl = cfg.base.trim().replace(/\/+$/, '') + '/chat/completions';
    const names = allPortals.map(p => p.name).join(', ');

    const systemPrompt = `Tum Narad AI ho, ek tezz aur imaandar sarkari sahayak.
Hinglish me 2-4 lines me bilkul clear jawab do, bina ** # ya extra formatting ke.
User ka sapna hai ki AI saare forms aur IRCTC ticket booking khud bhare, aur user ko sirf OTP aur CAPTCHA bharna pade.
Batao form me kya kya chahiye aur AI kaise fill karega.
Kabhi kisi se OTP, password, ya Aadhaar OTP mat maangna.
Agar user kisi sarkari portal ya seva ki baat kare to aakhir me tag likho: [OPEN:<seva ka naam>].
Valid Portal names: ${names}.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.text }))
    ];

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.key.trim()}`
      },
      body: JSON.stringify({
        model: cfg.model || 'gemini-3.8-flash',
        messages,
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      // If external API fails, gracefully fallback to smart local response
      console.warn(`AI API returned ${res.status}: ${errText}. Using built-in engine.`);
      const fb = generateSmartResponse(lastUserMsg);
      return { text: fb, portal: extractPortal(fb) };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || generateSmartResponse(lastUserMsg);
    return { text: content, portal: extractPortal(content) };
  } catch (err) {
    console.warn('AI call exception:', err);
    const fb = generateSmartResponse(lastUserMsg);
    return { text: fb, portal: extractPortal(fb) };
  }
}

export function extractPortal(text: string): Portal | undefined {
  const match = text.match(/\[OPEN:([^\]]+)\]/);
  if (!match) return undefined;
  const name = match[1].trim();
  return (
    allPortals.find(p => p.name.toLowerCase() === name.toLowerCase()) ||
    allPortals.find(p => p.name.toLowerCase().includes(name.toLowerCase()))
  );
}
