import React, { useState } from 'react';
import { User, Save, Sparkles, CheckCircle2, ShieldCheck, FileText, Upload, Copy, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { INDIA_STATES, defaultProfile, validateProfile, generateBookmarkletCode } from '../utils/formFillEngine';

interface ProfileViewProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onSaveProfile
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleChange = (key: keyof UserProfile, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    setSaveSuccess(false);
  };

  const handleFillSample = () => {
    setFormData(defaultProfile);
    setErrors([]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: validationErrors } = validateProfile(formData);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      onSaveProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleCopyBookmarklet = () => {
    const code = generateBookmarkletCode(formData);
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header with Quick Fill Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Mera Profile & Digital Locker
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Yahan ek baar details save karein, saare forms me AI auto-fill karega.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleFillSample}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Sample Data Bharo (Test)</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile safaltapoorvak save ho gayi! Ab kisi bhi form par AI Auto-Fill chala sakte hain.</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="p-3.5 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs space-y-1">
          <div className="font-bold">Kripya ye galtiyan sudharein:</div>
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          1. Vyaktigat Jaankari (Personal Details)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pura Naam (As per 10th Marksheet) *
            </label>
            <input
              type="text"
              required
              value={formData.naam}
              onChange={(e) => handleChange('naam', e.target.value)}
              placeholder="Jaise: Rahul Kumar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pita Ka Naam (Father&apos;s Name) *
            </label>
            <input
              type="text"
              required
              value={formData.pita}
              onChange={(e) => handleChange('pita', e.target.value)}
              placeholder="Pita ji ka naam"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mata Ka Naam (Mother&apos;s Name) *
            </label>
            <input
              type="text"
              required
              value={formData.mata}
              onChange={(e) => handleChange('mata', e.target.value)}
              placeholder="Mata ji ka naam"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Janm Tithi (DOB) *
            </label>
            <input
              type="date"
              required
              value={formData.janm}
              onChange={(e) => handleChange('janm', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="male">Purush (Male)</option>
              <option value="female">Mahila (Female)</option>
              <option value="other">Anya (Other)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="general">General (UR)</option>
              <option value="obc">OBC (Other Backward)</option>
              <option value="ews">EWS</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vaivahik Sthiti *
            </label>
            <select
              value={formData.marital}
              onChange={(e) => handleChange('marital', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="single">Avivahit (Single)</option>
              <option value="married">Vivahit (Married)</option>
            </select>
          </div>
        </div>

        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pt-3 pb-2">
          2. Sampark & Pata (Contact & Address)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number (OTP & SMS ke liye) *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              placeholder="10 ank ka mobile number"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email ID *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="naam@gmail.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rajya (State) *
            </label>
            <select
              value={formData.rajya}
              onChange={(e) => handleChange('rajya', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {INDIA_STATES.map((st, i) => (
                <option key={i} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jila (District) *
            </label>
            <input
              type="text"
              required
              value={formData.jila}
              onChange={(e) => handleChange('jila', e.target.value)}
              placeholder="Jaise: Patna / Gorakhpur"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pincode *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="6 ank ka pin"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Poora Pata (Full Address: Gaon, Post, Thana, Gali) *
          </label>
          <textarea
            required
            rows={2}
            value={formData.pata}
            onChange={(e) => handleChange('pata', e.target.value)}
            placeholder="Gram, Post, Thana, Makan number..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Uchhtam Shiksha (Highest Qualification)
          </label>
          <input
            type="text"
            value={formData.education}
            onChange={(e) => handleChange('education', e.target.value)}
            placeholder="Jaise: 12th Pass (PCM, 78%) ya Graduate B.Sc"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Digital Document Attachments */}
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pt-3 pb-2">
          3. Digital Document Locker (Photo & Signature)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Passport Photo</span>
              <span className="text-[10px] text-emerald-600 font-bold">Attached</span>
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {formData.photo_name || 'photo.jpg'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Signature Copy</span>
              <span className="text-[10px] text-emerald-600 font-bold">Attached</span>
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {formData.signature_name || 'signature.png'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">10th Marksheet</span>
              <span className="text-[10px] text-emerald-600 font-bold">Attached</span>
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {formData.marksheet_name || 'marksheet.pdf'}
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Yeh data sirf aapke browser ke memory me save rehta hai.</span>
          </div>

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Mera Profile Save Karein</span>
          </button>
        </div>
      </form>

      {/* 1-Click Bookmarklet Guide */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              1-Click Bookmarklet: Asli Govt Website Par Auto-Fill Karein
            </h3>
          </div>
          <button
            onClick={handleCopyBookmarklet}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Script Copied!' : 'Copy Auto-Fill Script'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Agar aap Chrome ya Safari me official government website (IRCTC / SSC / RTPS) kholte hain, to browser ke Bookmark ya address bar me ye script paste karke Enter dabayein — aapki profile se saari details 1 second me auto-fill ho jayengi!
        </p>
      </div>
    </div>
  );
};
