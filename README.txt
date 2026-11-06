NARAD AI - EK HI PROJECT (app + jobs search + auto safai)

KYA KYA HAI IS FOLDER ME
  app/ , build.gradle.kts ...   Android app (Narad AI)
  crawler/                      Sarkari sites padhne wala + AI se date nikalne wala
  data/                         haath se likhi jobs (manual_jobs.json) aur hata di gayi entries
  docs/                         jobs.json (taaza data) + search page (GitHub Pages)
  .github/workflows/            build.yml = APK banata hai, crawl.yml = har 6 ghante jobs laata hai

KAISE CHALTA HAI
  crawl.yml har 6 ghante: aapki sites (crawler/my_sites.json) + 110 sarkari sites padhta hai
  -> naye bharti / admit card / result jodta hai
  -> AI (Gemini) naye job ki notification padh kar last date, post, vacancy nikalta hai
     (date tabhi maani jaati hai jab notification ke text me sach me likhi ho)
  -> JIS JOB KI LAST DATE NIKAL GAYI, AUTOMATIC DELETE:
       date nikal gayi -> delete | date nahi mili aur 30 din purani -> delete | site se 21 din gayab -> delete
  -> docs/jobs.json update. App kholte hi wahi data padhta hai (Latest Jobs, Admit Cards, Results).
  App me bhi aaj se purani date wali job apne aap hat jati hai.

SETUP (ek baar) - sab ek hi repo me
  1. GitHub par ek PUBLIC repo banao, is folder ki saari files upload karo (.github folder ke saath).
  2. Settings -> Pages -> Deploy from branch -> main -> /docs -> Save
  3. AI keys (dono free, aistudio.google.com/apikey se):
     Settings -> Secrets and variables -> Actions -> New repository secret
       AI_API_KEY      app ke chat ke liye (APK me jaati hai, isliye sirf free / limited key)
       GEMINI_API_KEY  crawler ke liye (sirf GitHub me rehti hai, APK me nahi)
     Dono ek hi key ho sakti hain; behtar hai alag alag banao.
  4. Settings -> Actions -> General -> Workflow permissions -> "Read and write" -> Save
  5. Actions -> "Crawl" -> Run workflow   (jobs aa jayengi, ~10 min)
  6. Actions -> "Build APK" -> Run workflow -> Artifacts se NaradAI-debug-apk download -> install
     (App ko jobs ka link apne aap mil jata hai: raw.githubusercontent.com/<github-naam>/<repo-naam>/main/docs/jobs.json - isliye repo PUBLIC rakhein)

APP ME WEBSITE LAPTOP JAISI + SIDE ME AI
  - Koi bhi https website laptop (desktop) wale roop me khulti hai, poori layout, chhota text,
    pinch se zoom. AI panel khulne / band hone par website khud screen me fit hoti hai.
  - Upar 💻 dabao: phone landscape ho jata hai aur AI panel side me aata hai (📱 se wapas).
    Portrait me AI panel neeche aata hai.
  - Website kholte hi AI page scan karta hai ki kya kya chahiye. Jo AI ke paas nahi wo ⭐ se dikhta hai.
  - Jaise hi website ka maanga sab AI ko mil jata hai, 2 second baad confirm khud aata hai.
    "Haan, bharo" dabate hi AI bharta hai aur panel apne aap chhup jata hai (puri website dikhti hai).
  - Beech me website kuch naya maange (naya field, naya step) to panel khud wapas aata hai,
    sawaal poochhta hai, jawab milte hi dobara chhup jata hai.
  - Neeche chhoti patti: ⏸ ruko, ⏹ band (AI phir khud nahi khulega), 🤖 AI wapas bulao.
  - OTP, CAPTCHA, Aadhaar number, password, payment AI kabhi nahi bharta; wo aap seedha website par karein.

DOCUMENT DOWNLOAD (Aadhaar, PAN, certificate, receipt...)
  - Website ka download button dabate hi file Downloads/NaradAI me save hoti hai (Android 10+ par koi permission nahi).
    Upar hari patti me file ka naam + "Kholo" button aata hai.
  - Download AI nahi karta: OTP / CAPTCHA aap dalte ho, phir website file deti hai aur app use rakh leti hai.
  - e-Aadhaar PDF ka password: naam ke pehle 4 akshar (CAPITAL) + janm ka saal (jaise RAHU1998).
  - Kuch website file POST se deti hain (seedha link nahi). Tab app batata hai ki "website ne file seedha nahi di";
    download button dobara dabayein ya website ke download page se karein.
  - Sirf https. Certificate sahi na ho to website nahi khulti.

APNI WEBSITE JODNA (jahan jobs aati hain)
  crawler/my_sites.json:
  { "sites": [ { "name": "Site ka naam", "urls": ["https://example.com/jobs"] } ] }
  Ye sites sabse pehle padhi jaati hain. Title me keyword na ho tab bhi saal wale link liye jaate hain,
  AI jaanchta hai ki wo sach me bharti hai ya nahi. Sirf usi site ke ya gov.in / nic.in / ac.in ke link liye jaate hain.

HAATH SE JOB JODNA
  data/manual_jobs.json:
  { "jobs": [ { "title": "...", "url": "https://official-link", "last_date": "2026-12-25",
                "posts": "Constable", "qualification": "12th pass" } ] }
  last_date zaroori hai. Us din ke baad apne aap delete.

DEKHNA
  docs/status.json: kaun si site ok / fail / robots / empty, kitni nayi job, AI ne kitni padhi, kitni hati.
  Search page (browser me): https://<github-naam>.github.io/<repo-naam>/

NIYAM
  - Crawler robots.txt maanta hai, har site par ruk-ruk kar jata hai.
  - Last date hamesha official notification se jaanch lein.
  - Kuch site bot rokti hain ya JavaScript se data dikhati hain - unka data nahi aayega.
  - 60 din repo me activity na ho to GitHub schedule band kar sakta hai -> Run workflow dabao.
  - Crawler ke commit se APK dobara nahi banta (build.yml me paths-ignore laga hai).
