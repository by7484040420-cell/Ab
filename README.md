# Narad AI - Sarkari Form & Ticket Auto-Filler

Narad AI is a complete React web application that automates government recruitment applications and IRCTC train ticket bookings.

## Key Features

1. **AI Auto-Form & Ticket Engine (`WorkScreen`)**:
   - Auto-fills personal details (Full Name, Father's Name, Mother's Name, DOB, Gender, Mobile, Email, Full Address, Pincode, Category, State, District, Marital Status).
   - Dedicated IRCTC Tatkal & General Train Ticket booking assistant.
   - **Handover for Security**: Once all form fields are filled, Narad AI pauses and prompts the user to enter only the Security Image CAPTCHA and Mobile/Bank OTP.
   - Includes 1-Click Auto-Fill Bookmarklet Script for direct execution on official websites.

2. **Official Government Directory (`HomeView`)**:
   - 85+ verified official central and state government portals (`.gov.in` / `.nic.in`).
   - 13 comprehensive categories (IRCTC & Ticket, Jobs & Exams, Admit Cards, Results, Documents & Identity, Land & Property, Govt Loans, Scholarships, Schemes, Insurance, etc.).
   - Live notifications feed for ongoing recruitments (Railway RRB, SSC CGL/GD, Bihar Police, UP Police, etc.).
   - Intelligent Hindi/Hinglish search engine with synonym matching and spelling tolerance.

3. **Narad AI Assistant (`ChatView`)**:
   - Conversational AI in Hindi / Hinglish.
   - Connects live to Gemini API or Groq API, with a built-in intelligent offline advisor for all recruitment rules, eligibility, fees, deadlines, and portals.
   - Automatic portal detection and one-click launch buttons.

4. **Mera Profile & Digital Locker (`ProfileView`)**:
   - Save applicant profile once in local browser storage.
   - "Sample Data Bharo" button for instant one-click testing.
   - Attachment tracker for Photo, Signature, and 10th Marksheet.

5. **AI Settings (`SettingsView`)**:
   - Configure free Gemini / Groq API keys, base URLs, and auto-typing speeds.

## Tech Stack
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Lucide React Icons
