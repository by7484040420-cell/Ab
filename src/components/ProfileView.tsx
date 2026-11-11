import React, { useState } from 'react';
import { User, Save, ShieldCheck, CheckCircle2, AlertCircle, FileText, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { INDIA_STATES, defaultProfile, validateProfile } from '../utils/formFillEngine';

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

  return (
    <div className="max-w-[480px] mx-auto w-full px-3 py-3 space-y-3 font-sans">
      {/* Header with Red & Navy Styling */}
      <div className="bg-[#14213D] text-white p-4 rounded-2xl shadow-md border-t-4 border-[#E53935] flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white truncate">Mera Profile Locker</h1>
            <p className="text-[11px] text-slate-300">
              Personal form auto-fill data
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFillSample}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 shrink-0 transition-colors"
        >
          Sample Data
        </button>
      </div>

      {/* Required Phone-Only Data Security Note */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="font-bold text-xs sm:text-sm">
          Ye data sirf aapke phone me rehta hai.
        </p>
      </div>

      {/* Alerts */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-400 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile phone me save ho gaya!</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#E53935]" />
            <span>Kripya in galtiyon ko theek karein:</span>
          </div>
          <ul className="list-disc list-inside pl-1 space-y-0.5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form with all 15 required fields (One column flow) */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#14213D] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
        {/* Section 1: Personal Details */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#E53935] pb-1 border-b border-slate-100 dark:border-slate-800">
            1. Vyaktigat Vivaran (Personal)
          </h2>

          <div className="space-y-2.5">
            {/* 1. naam */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Poora Naam (Full Name) *
              </label>
              <input
                type="text"
                required
                value={formData.naam || ''}
                onChange={(e) => handleChange('naam', e.target.value)}
                placeholder="Jaise: Rahul Kumar Sharma"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>

            {/* 2. pita */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pita Ka Naam (Father&apos;s Name) *
              </label>
              <input
                type="text"
                required
                value={formData.pita || ''}
                onChange={(e) => handleChange('pita', e.target.value)}
                placeholder="Jaise: Suresh Kumar Sharma"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>

            {/* 3. mata */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mata Ka Naam (Mother&apos;s Name) *
              </label>
              <input
                type="text"
                required
                value={formData.mata || ''}
                onChange={(e) => handleChange('mata', e.target.value)}
                placeholder="Jaise: Sunita Devi"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 4. janm (yyyy-mm-dd) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Janm Tithi (YYYY-MM-DD) *
              </label>
              <input
                type="date"
                required
                value={formData.janm || ''}
                onChange={(e) => handleChange('janm', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>

            {/* 5. gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gender (Ling) *
              </label>
              <select
                value={formData.gender || ''}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              >
                <option value="">Chunein</option>
                <option value="male">Male (Purush)</option>
                <option value="female">Female (Mahila)</option>
                <option value="other">Other (Anya)</option>
              </select>
            </div>

            {/* 6. marital */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vaivaahik Sthiti (Marital Status)
              </label>
              <select
                value={formData.marital || ''}
                onChange={(e) => handleChange('marital', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              >
                <option value="">Chunein</option>
                <option value="single">Single (Avivaahit)</option>
                <option value="married">Married (Vivaahit)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 7. category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category (Varg) *
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              >
                <option value="">Chunein</option>
                <option value="general">General (Samanya)</option>
                <option value="obc">OBC (Pichhra Varg)</option>
                <option value="sc">SC (Anusuchit Jati)</option>
                <option value="st">ST (Anusuchit Janjati)</option>
                <option value="ews">EWS (Aarthik Kamzor)</option>
              </select>
            </div>

            {/* 8. education */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shiksha (Education Qualification) *
              </label>
              <input
                type="text"
                required
                value={formData.education || ''}
                onChange={(e) => handleChange('education', e.target.value)}
                placeholder="Jaise: 10th / 12th / Graduate (B.Sc, B.A, B.Tech)"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#E53935] pb-1 border-b border-slate-100 dark:border-slate-800">
            2. Sampark Aur Pata (Contact & Address)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 9. mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (10 digits) *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.mobile || ''}
                onChange={(e) => handleChange('mobile', e.target.value)}
                placeholder="Jaise: 9876543210"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>

            {/* 10. email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Jaise: rahul.sharma@gmail.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>
          </div>

          {/* 11. pata */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Poora Pata (Full Permanent Address) *
            </label>
            <textarea
              rows={2}
              required
              value={formData.pata || ''}
              onChange={(e) => handleChange('pata', e.target.value)}
              placeholder="Gram, Post, Thana, Makan Sankhya..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 12. pincode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pincode (6 digits) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.pincode || ''}
                onChange={(e) => handleChange('pincode', e.target.value)}
                placeholder="800001"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>

            {/* 13. rajya */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Rajya (State) *
              </label>
              <select
                value={formData.rajya || ''}
                onChange={(e) => handleChange('rajya', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              >
                <option value="">Rajya Chunein</option>
                {INDIA_STATES.map((st, idx) => (
                  <option key={idx} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* 14. jila */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jila (District) *
              </label>
              <input
                type="text"
                required
                value={formData.jila || ''}
                onChange={(e) => handleChange('jila', e.target.value)}
                placeholder="Patna, Lucknow, Jaipur..."
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Identity Documents */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#E53935] pb-1 border-b border-slate-100 dark:border-slate-800">
            3. Pehchan Praman Patra (Identity Verification)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 15. aadhaar (12 digits) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Aadhaar Number (12 digits) *
              </label>
              <input
                type="password"
                required
                maxLength={12}
                value={formData.aadhaar || ''}
                onChange={(e) => handleChange('aadhaar', e.target.value)}
                placeholder="12 digit Aadhaar number"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
              <span className="text-[10px] text-slate-500">
                🔒 Safe: Aadhaar kabhi AI ya server par nahi jaata.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                PAN Number (Optional)
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.pan_number || ''}
                onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            * Sabhi zaroori fields bharna anivarya hai
          </span>

          <button
            type="submit"
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#E53935] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Profile Phone Me Save Karein</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileView;
