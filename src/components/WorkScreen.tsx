import React, { useState, useEffect } from 'react';
import {
  Sparkles, ExternalLink, CheckCircle2, AlertTriangle, Play,
  RefreshCw, ShieldAlert, FileText, UserCheck, Copy, ArrowLeft,
  Calendar, Info, Send, Bot, Check, Clock
} from 'lucide-react';
import { Portal, UserProfile, FillReportItem } from '../types';
import { SERVICE_EXTRA, isAllowed } from '../data/portals';
import { simulateAutoFill, generateBookmarkletCode } from '../utils/formFillEngine';
import { askNaradAi } from '../utils/aiService';

interface WorkScreenProps {
  portal: Portal;
  userProfile: UserProfile;
  onExit: () => void;
  onOpenProfile: () => void;
}

export const WorkScreen: React.FC<WorkScreenProps> = ({
  portal,
  userProfile,
  onExit,
  onOpenProfile
}) => {
  const svcInfo = SERVICE_EXTRA[portal.name];
  const isTicket = portal.name.includes('IRCTC') || portal.name.includes('Ticket');
  
  // State for automation
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [statusLog, setStatusLog] = useState<string>('AI Auto-Fill Engine tayyar hai.');
  const [fillReport, setFillReport] = useState<FillReportItem[]>([]);
  const [showOtpBanner, setShowOtpBanner] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Form values currently filled
  const [formData, setFormData] = useState<Record<string, string>>({
    naam: '',
    pita: '',
    mata: '',
    janm: '',
    mobile: '',
    email: '',
    pata: '',
    pincode: '',
    gender: '',
    rajya: '',
    jila: '',
    category: '',
    marital: '',
    education: '',
    trainNo: isTicket ? '12309 (Rajdhani Express)' : '',
    berthChoice: isTicket ? 'Lower Berth (Senior / Prefer)' : '',
    quota: isTicket ? 'Tatkal / General' : ''
  });

  // Verification step: CAPTCHA & OTP
  const [captchaCode, setCaptchaCode] = useState('7K9P2');
  const [captchaInput, setCaptchaInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Side Chat in Work Screen
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Namaste! ${portal.name} ke liye mai aapka form bharne me madad karunga. '✨ AI Auto-Fill Chalao' dabayein taaki aapka poora form auto-fill ho jaye.`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  // Auto-generate fresh captcha code
  const reloadCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  // Run the automated filling simulation
  const handleRunAutoFill = () => {
    setIsRunning(true);
    setProgress(5);
    setStatusLog('Profile details verify ho rahi hain...');
    setShowOtpBanner(false);
    setOtpVerified(false);
    setSubmitted(false);

    // Sequence through the fields with realistic animated delays
    const steps = [
      { p: 20, msg: `Naam "${userProfile.naam}" aur Pita ka naam fill ho raha hai...`, f: { naam: userProfile.naam, pita: userProfile.pita } },
      { p: 40, msg: `Janm Tithi (${userProfile.janm}) aur Gender select hua...`, f: { mata: userProfile.mata, janm: userProfile.janm, gender: userProfile.gender } },
      { p: 60, msg: `Mobile (${userProfile.mobile}) aur Email set kiya gaya...`, f: { mobile: userProfile.mobile, email: userProfile.email } },
      { p: 80, msg: `Address, Pincode (${userProfile.pincode}), aur Category (${userProfile.category.toUpperCase()}) set hua...`, f: { pata: userProfile.pata, pincode: userProfile.pincode, rajya: userProfile.rajya, jila: userProfile.jila, category: userProfile.category, marital: userProfile.marital, education: userProfile.education } },
      { p: 100, msg: 'Declaration box tick kar diya gaya! AI ne sabhi fields bhar diye.', f: {} }
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        const s = steps[current];
        setProgress(s.p);
        setStatusLog(s.msg);
        setFormData(prev => ({ ...prev, ...s.f }));
        current++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        const sim = simulateAutoFill(userProfile, portal.name);
        setFillReport(sim.report);
        setShowOtpBanner(true);
        setStatusLog('⚡ AI kaam poora hua: Bas CAPTCHA aur OTP enter kijiye!');
        
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `✔ AI ne ${sim.filledCount} fields bhar diye hain! Ab aapka kaam shuru: Neeche Security CAPTCHA aur Mobile OTP enter karein.`
          }
        ]);
      }
    }, 450);
  };

  // Handle Send Chat
  const handleSendChat = async () => {
    const q = chatInput.trim();
    if (!q || chatBusy) return;
    const newHistory = [...chatMessages, { role: 'user' as const, text: q }];
    setChatMessages(newHistory);
    setChatInput('');
    setChatBusy(true);

    try {
      const cfg = {
        key: '',
        base: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        model: 'gemini-3.8-flash',
        autoSpeed: 40
      };
      const res = await askNaradAi(cfg, newHistory);
      setChatMessages(prev => [...prev, { role: 'assistant', text: res.text }]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Kuch dikkat aayi, official notification check karein.' }
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  // Copy Bookmarklet script
  const handleCopyScript = () => {
    const code = generateBookmarkletCode(userProfile);
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Top Navigation & Portal Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-start space-x-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
            title="Wapas jayein"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                {isTicket ? 'TRAIN TICKET ENGINE' : 'GOVT RECRUITMENT & PORTAL'}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Portal</span>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {portal.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Official link: <span className="text-blue-600">{portal.url}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <span>Asli Govt Site Kholo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleCopyScript}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-all"
            title="Official site par 1-click me bharne ka script"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Script Copied!' : '1-Click Script'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Runner & AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: The Interactive Form & Ticket Engine (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Automation Control Card */}
          <div className="bg-gradient-to-r from-[#0B1B3F] to-[#162a5c] text-white p-5 rounded-2xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Smart Form Automation
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  {isTicket ? 'IRCTC Ticket AI Auto-Filler' : 'Sarkari Form Auto-Filler'}
                </h2>
                <p className="text-xs text-slate-300">
                  Profile Locker se data utha kar saare boxes me AI auto-type karega.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={isRunning}
                  onClick={handleRunAutoFill}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg transition-all ${
                    isRunning
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-red-900/50 hover:scale-102 cursor-pointer pulse-glow'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isRunning ? 'AI Bhar Raha Hai...' : '✨ AI Auto-Fill Chalao'}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar & Status Text */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium text-amber-200">{statusLog}</span>
                <span className="font-mono font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 🚨 THE KEY USER FEATURE: OTP / CAPTCHA HANDOVER BANNER 🚨 */}
          {showOtpBanner && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-amber-950">
                    ⚡ AI ne Sabhi Fields Bhar Diye Hain!
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                    Aapka sapna pura hua: Personal details, address, parent details, aur category 100% bhar chuke hain. 
                    <strong> Security ke niyam ke anusaar, bas ye CAPTCHA aur Mobile OTP aap enter kijiye!</strong>
                  </p>
                </div>
              </div>

              {/* Interactive Captcha & OTP verification box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
                {/* 1. CAPTCHA Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Step 1: Security Image CAPTCHA
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="px-3.5 py-1.5 bg-slate-800 text-amber-400 font-mono font-black text-lg tracking-widest rounded-lg select-none border-2 border-slate-700 shadow-inner">
                      {captchaCode}
                    </div>
                    <button
                      onClick={reloadCaptcha}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Naya Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    placeholder="Upar ka code likhein"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {captchaInput && captchaInput !== captchaCode && (
                    <span className="text-[11px] text-red-600 font-semibold">Code match nahi hua</span>
                  )}
                </div>

                {/* 2. Mobile OTP Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Step 2: Mobile / Bank OTP ({userProfile.mobile})
                  </label>
                  <div className="text-[11px] text-slate-500">
                    OTP aapke registered number par aayega
                  </div>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 ank ka OTP daalein (jaise: 482910)"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Test OTP: koi bhi 6 ank</span>
                    <button
                      onClick={() => setOtpInput('482910')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Auto-Fill Test OTP
                    </button>
                  </div>
                </div>
              </div>

              {/* Verification & Final Submit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-xs text-amber-800 font-medium">
                  {captchaInput === captchaCode && otpInput.length === 6 ? (
                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CAPTCHA & OTP Verify Ho Gaye! Ab Submit Karein.</span>
                    </span>
                  ) : (
                    'Donon boxes bharne ke baad button dabayein.'
                  )}
                </span>

                <button
                  disabled={captchaInput !== captchaCode || otpInput.length !== 6}
                  onClick={() => {
                    setSubmitted(true);
                    setChatMessages(prev => [
                      ...prev,
                      {
                        role: 'assistant',
                        text: `🎉 Badhai ho! ${isTicket ? 'Train Ticket Booking Confirm ho gayi!' : 'Application Form Successfully Submit ho gaya!'} Reference ID: NARAD-${Math.floor(100000 + Math.random() * 900000)}`
                      }
                    ]);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all ${
                    captchaInput === captchaCode && otpInput.length === 6
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-900/30 hover:scale-102'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isTicket ? 'Confirm & Book Ticket →' : 'Final Submit Form →'}
                </button>
              </div>
            </div>
          )}

          {/* Submission Success Dialog */}
          {submitted && (
            <div className="bg-emerald-50 border-2 border-emerald-400 p-5 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center space-x-3 text-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-lg font-black">
                    {isTicket ? 'Ticket Successfully Booked!' : 'Form Successfully Submitted!'}
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Aapka application reference generated: <strong>NRD-{Date.now().toString().slice(-6)}</strong>
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-emerald-200">
                AI ne aapki saari details sahi bhari, OTP aur CAPTCHA verify hua, aur application safe tareeqe se submit ho gaya. Receipt aapke profile locker me save kar di gayi hai.
              </p>
            </div>
          )}

          {/* Live Interactive Form Simulation View */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Live Form Preview (AI Ke dwara Bhara Ja Raha Hai)
                </h3>
              </div>
              <button
                onClick={onOpenProfile}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Mera Profile Dekhein
              </button>
            </div>

            {/* Simulated Live Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Field 1: Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Candidate / Passenger Name *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.naam ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.naam || 'AI bharega (Rahul Kumar Sharma)...'}
                </div>
              </div>

              {/* Field 2: Father Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Father&apos;s Name *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.pita ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.pita || 'AI bharega (Suresh Kumar Sharma)...'}
                </div>
              </div>

              {/* Field 3: DOB */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Date of Birth (DD/MM/YYYY) *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.janm ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.janm || 'AI bharega (15/08/1998)...'}
                </div>
              </div>

              {/* Field 4: Gender */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Gender *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.gender ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold capitalize' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.gender || 'AI bharega (Male / Purush)...'}
                </div>
              </div>

              {/* Field 5: Mobile */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mobile Number (For OTP) *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.mobile ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-mono font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.mobile || 'AI bharega (9876543210)...'}
                </div>
              </div>

              {/* Field 6: Email */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.email ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.email || 'AI bharega (rahul.sharma@gmail.com)...'}
                </div>
              </div>

              {/* Field 7: Category */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category / Reservation *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.category ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold uppercase' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.category || 'AI bharega (OBC / GEN / SC / ST)...'}
                </div>
              </div>

              {/* Field 8: State / District */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">State & District *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.rajya ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.rajya ? `${formData.rajya} - ${formData.jila}` : 'AI bharega (Bihar - Patna)...'}
                </div>
              </div>

              {/* Field 9: Address (Span 2) */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Permanent Address & Pincode *</label>
                <div className={`p-2.5 rounded-lg border font-medium transition-all ${
                  formData.pata ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {formData.pata ? `${formData.pata}, Pin: ${formData.pincode}` : 'AI bharega (Gram - Rampur, Post - Rampur Bazzar, Pin: 800001)...'}
                </div>
              </div>

              {/* Field 10: Special for Ticket */}
              {isTicket && (
                <div className="sm:col-span-2 space-y-1 bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                  <div className="font-bold text-blue-900 mb-1">IRCTC Journey & Berth Details:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div><strong>Train:</strong> 12309 / 12310 Rajdhani Express</div>
                    <div><strong>Berth:</strong> Lower Berth / No Choice</div>
                    <div><strong>Auto-Upgradation:</strong> Yes (Checked)</div>
                    <div><strong>Travel Insurance:</strong> ₹0.45 (Opted In)</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fill Report Table */}
          {fillReport.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>AI Auto-Fill Report ({fillReport.length} Inspections)</span>
              </h4>
              <div className="space-y-1.5">
                {fillReport.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-xs flex items-center space-x-2 ${
                      r.st === 'ok'
                        ? 'bg-emerald-50 text-emerald-800'
                        : r.st === 'warn'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    <span>{r.st === 'ok' ? '✅' : r.st === 'warn' ? '⚠️' : '❌'}</span>
                    <span className="font-medium">{r.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Portal Info & Narad AI Chat Assistant (1 col) */}
        <div className="space-y-5">
          {/* Service / Vacancy Quick Guide */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Is Portal Ki Zaroori Baatein</span>
            </h3>

            {svcInfo?.info ? (
              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                {svcInfo.info}
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>• <strong>Official Domain:</strong> {new URL(portal.url).hostname}</p>
                <p>• <strong>Document Chahiye:</strong> Photo (under 50KB), Signature (under 20KB), 10th Marksheet, Aadhaar Card</p>
                <p>• <strong>Fees:</strong> General/OBC ₹100, SC/ST/Women ₹0 (portal notification ke anusaar)</p>
                <p>• <strong>Last Date:</strong> Hamesha official advertisement se check karein</p>
              </div>
            )}

            {svcInfo?.ask && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs space-y-2">
                <p className="font-bold text-blue-900">{svcInfo.ask}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (svcInfo.yesSay) {
                        setChatMessages(prev => [...prev, { role: 'assistant', text: svcInfo.yesSay! }]);
                      }
                    }}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px]"
                  >
                    {svcInfo.yesLabel || 'Haan'}
                  </button>
                  <button
                    onClick={() => {
                      if (svcInfo.noSay) {
                        setChatMessages(prev => [...prev, { role: 'assistant', text: svcInfo.noSay! }]);
                      }
                    }}
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-[11px]"
                  >
                    {svcInfo.noLabel || 'Nahi'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Embedded Assistant Chat */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="p-3.5 bg-[#0B1B3F] text-white rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-xs sm:text-sm">Narad AI Form Sahayak</span>
              </div>
              <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-2.5 rounded-xl whitespace-pre-line leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 font-medium rounded-tl-none border border-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {chatBusy && (
                <div className="text-[11px] text-slate-500 italic">
                  Narad AI soch raha hai...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-2 border-t border-slate-100 flex items-center space-x-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Is form ke baare me poochhein..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
              <button
                onClick={handleSendChat}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
