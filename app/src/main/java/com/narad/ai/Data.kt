package com.narad.ai

import android.net.Uri

data class Portal(
    val name: String,
    val url: String,
    val keys: List<String> = emptyList(),
    val note: String = ""
)

data class Category(
    val name: String,
    val sub: String,
    val tag: String,
    val color: Long,
    val links: List<Portal>
)

// .gov.in / .nic.in ke alawa kuch asli sarkari sites
private val extraHosts = listOf(
    "irctc.co.in", "mudra.org.in", "jansamarth.in", "standupmitra.in", "licindia.in",
    "sbpdcl.co.in", "nbpdcl.co.in", "nta.ac.in", "nptel.ac.in", "upmsp.edu.in",
    "slprbassam.in", "tgprb.in", "manipurpolice.org", "ibps.in", "sbi.co.in", "rbi.org.in", "cdac.in", "aiimsexams.ac.in", "cbse.gov.in", "uksssc.in"
)

fun isAllowed(url: String): Boolean {
    if (url.isBlank()) return false
    val uri = Uri.parse(url)
    val host = (uri.host ?: return false).lowercase()
    if (uri.scheme != "https") return false
    if (host == "gov.in" || host.endsWith(".gov.in") || host.endsWith(".nic.in")) return true
    return extraHosts.any { host == it || host.endsWith("." + it) }
}

// ---------- Asli sarkari links (sab ek hi jagah, badalna ho to yahin badlein) ----------

val pAadhaar = Portal("Aadhaar Card", "https://myaadhaar.uidai.gov.in", listOf("aadhaar", "aadhar", "adhar"))
val pPan = Portal("PAN Card", "https://www.incometax.gov.in", listOf("pan"))
val pIrctc = Portal("IRCTC", "https://www.irctc.co.in", listOf("irctc", "train", "ticket", "railway ticket"))
val pVoter = Portal("Voter ID", "https://voters.eci.gov.in", listOf("voter", "matdata", "election card"))
val pPassport = Portal("Passport", "https://www.passportindia.gov.in", listOf("passport"))
val pDl = Portal("Driving Licence", "https://parivahan.gov.in", listOf("driving", "licence", "license", "dl"))
val pRation = Portal("Ration Card", "https://epds.bihar.gov.in", listOf("ration"), "Bihar")
val pIncomeCert = Portal("Income Certificate", "https://serviceonline.bihar.gov.in", listOf("income certificate", "aay praman", "aay"), "Bihar (RTPS)")
val pCasteCert = Portal("Caste Certificate", "https://serviceonline.bihar.gov.in", listOf("caste", "jati", "jaati"), "Bihar (RTPS)")
val pResidenceCert = Portal("Residence Certificate", "https://serviceonline.bihar.gov.in", listOf("residence", "domicile", "niwas", "nivas", "awasiya"), "Bihar (RTPS)")
val pBirthCert = Portal("Birth Certificate", "https://crsorgi.gov.in", listOf("birth", "janm praman"))
val pEpf = Portal("EPF / UAN", "https://www.epfindia.gov.in", listOf("epf", "uan", "pf"))
val pGst = Portal("GST Registration", "https://www.gst.gov.in", listOf("gst"))
val pItr = Portal("Income Tax e-Filing", "https://www.incometax.gov.in", listOf("itr", "income tax", "tax"))
val pNcs = Portal("National Career Service", "https://www.ncs.gov.in", listOf("ncs", "job", "naukri", "rojgar", "career"))
val pUmang = Portal("UMANG", "https://web.umang.gov.in", listOf("umang"))
val pDigi = Portal("DigiLocker", "https://www.digilocker.gov.in", listOf("digilocker", "digi locker"))

val pUpsc = Portal("UPSC", "https://upsc.gov.in", listOf("upsc", "ias"), "Official site")
val pSsc = Portal("SSC", "https://ssc.gov.in", listOf("ssc", "cgl", "gd", "chsl"), "Official site")
val pRrb = Portal("Railway (RRB)", "https://www.rrbapply.gov.in", listOf("rrb", "railway job", "group d", "ntpc"), "Official site")
val pBpsc = Portal("BPSC (Bihar)", "https://bpsc.bih.nic.in", listOf("bpsc"), "Official site")
val pCsbc = Portal("Bihar Police (CSBC)", "https://csbc.bihar.gov.in", listOf("bihar police", "csbc", "sipahi"), "Official site")
val pUpPolice = Portal("UP Police (UPPBPB)", "https://uppbpb.gov.in", listOf("up police", "uppbpb"), "Official site")
val pNta = Portal("NTA (NEET, JEE, CUET)", "https://nta.ac.in", listOf("nta", "neet", "jee", "cuet"), "Official site")
val pEmpNews = Portal("Employment News", "https://employmentnews.gov.in", listOf("employment news"), "Official site")
val pPib = Portal("PIB (sarkari ghoshna)", "https://pib.gov.in", listOf("pib"), "Official site")
val pMyScheme = Portal("myScheme", "https://www.myscheme.gov.in", listOf("myscheme", "yojana", "scheme"), "Sab yojana ek jagah")
val pIndiaGov = Portal("India.gov.in", "https://www.india.gov.in", listOf("india.gov"), "National portal")
val pBseb = Portal("Bihar Board (BSEB)", "https://biharboardonline.bihar.gov.in", listOf("bseb", "bihar board"), "Official site")
val pUpBoard = Portal("UP Board (UPMSP)", "https://upmsp.edu.in", listOf("up board", "upmsp"), "Official site")
val pCbse = Portal("CBSE Result", "https://results.cbse.nic.in", listOf("cbse"), "Official site")

val categories = listOf(
    Category("IRCTC & Ticket", "Train, Bus, Flight, PNR", "I", 0xFF1E88E5, listOf(
        pIrctc,
        Portal("Indian Railways", "https://indianrailways.gov.in", listOf("indian railways")),
        Portal("PNR / Train status (NTES)", "https://enquiry.indianrail.gov.in", listOf("pnr", "train status", "running status"))
    )),
    Category("Jobs & Exams", "Govt & Private Jobs", "J", 0xFF8E24AA, listOf(
        pNcs, pUpsc, pSsc, pRrb, pBpsc, pCsbc, pUpPolice, pNta, pEmpNews
    )),
    Category("Admit Card", "All Admit Cards", "A", 0xFFE53935, listOf(
        Portal("SSC Admit Card", "https://ssc.gov.in", listOf("ssc admit"), "Official site"),
        Portal("UPSC Admit Card", "https://upsc.gov.in", listOf("upsc admit"), "Official site"),
        Portal("RRB Admit Card", "https://www.rrbapply.gov.in", listOf("rrb admit"), "Official site"),
        Portal("Bihar Police Admit Card", "https://csbc.bihar.gov.in", listOf("csbc admit"), "Official site"),
        Portal("UP Police Admit Card", "https://uppbpb.gov.in", listOf("uppbpb admit"), "Official site"),
        Portal("NTA Admit Card", "https://nta.ac.in", listOf("nta admit"), "Official site")
    )),
    Category("Results", "All Results & Merit", "R", 0xFF43A047, listOf(
        Portal("SSC Result", "https://ssc.gov.in", listOf("ssc result"), "Official site"),
        Portal("UPSC Result", "https://upsc.gov.in", listOf("upsc result"), "Official site"),
        pBseb, pUpBoard, pCbse,
        Portal("NTA Result", "https://nta.ac.in", listOf("nta result"), "Official site")
    )),
    Category("Documents & Identity", "PAN, DL, Passport", "D", 0xFF1565C0, listOf(
        pAadhaar, pPan, pVoter, pPassport, pDl, pRation, pBirthCert, pDigi
    )),
    Category("Land & Property", "Khasra, Rasid, Bhumi", "L", 0xFFEF6C00, listOf(
        Portal("Bihar Bhumi (Jamabandi, Khasra, Rasid)", "https://biharbhumi.bihar.gov.in", listOf("bhumi", "jamabandi", "khasra", "lagaan", "dakhil kharij"), "Bihar"),
        Portal("UP Bhulekh", "https://upbhulekh.gov.in", listOf("bhulekh", "khatauni"), "Uttar Pradesh"),
        Portal("Jharbhoomi (Jharkhand)", "https://jharbhoomi.nic.in", listOf("jharbhoomi"), "Jharkhand")
    )),
    Category("Government Loan", "Loan & Credit Services", "G", 0xFF2E7D32, listOf(
        Portal("PM Mudra Yojana", "https://www.mudra.org.in", listOf("mudra"), "Chhote vyapar ka loan"),
        Portal("Jan Samarth", "https://www.jansamarth.in", listOf("jan samarth"), "Sarkari loan ek jagah"),
        Portal("PMEGP (rozgar loan)", "https://www.kviconline.gov.in/pmegpeportal", listOf("pmegp"), "Rozgar yojana"),
        Portal("PM SVANidhi", "https://pmsvanidhi.mohua.gov.in", listOf("svanidhi"), "Thele-patri wale"),
        Portal("Stand-Up India", "https://www.standupmitra.in", listOf("stand up", "standup"), "Mahila / SC-ST udyami")
    )),
    Category("Scholarship", "Scholarship & Fee", "S", 0xFFD81B60, listOf(
        Portal("National Scholarship Portal", "https://scholarships.gov.in", listOf("scholarship", "nsp", "chhatravritti"), "Central"),
        Portal("Bihar Post-Matric Scholarship", "https://pmsonline.bihar.gov.in", listOf("post matric", "bihar scholarship"), "Bihar"),
        Portal("Bihar Student Credit Card", "https://www.7nishchay-yuvaupmission.bihar.gov.in", listOf("student credit card", "bscc"), "Bihar")
    )),
    Category("Yojana & Benefits", "Sarkari Yojana", "Y", 0xFFF9A825, listOf(
        pMyScheme,
        Portal("PM-KISAN", "https://pmkisan.gov.in", listOf("pm kisan", "kisan samman"), "Kisan"),
        Portal("Ayushman Bharat (PMJAY)", "https://pmjay.gov.in", listOf("ayushman", "pmjay"), "Swasthya bima"),
        Portal("Ujjwala (PMUY)", "https://www.pmuy.gov.in", listOf("ujjwala", "gas"), "Gas connection"),
        Portal("e-Shram", "https://eshram.gov.in", listOf("eshram", "e-shram", "shramik"), "Asangathit mazdoor")
    )),
    Category("Insurance", "Life, Health, Vehicle", "I", 0xFF5E35B1, listOf(
        Portal("Jan Suraksha (PMJJBY / PMSBY)", "https://jansuraksha.gov.in", listOf("jeevan jyoti", "suraksha bima", "pmjjby", "pmsby", "insurance"), "Bahut kam premium"),
        Portal("Ayushman Bharat (PMJAY)", "https://pmjay.gov.in", listOf("health insurance"), "Swasthya bima"),
        Portal("LIC of India", "https://licindia.in", listOf("lic"), "Life insurance"),
        Portal("IRDAI (bima niyamak)", "https://irdai.gov.in", listOf("irdai"), "Shikayat aur jaankari")
    )),
    Category("Rasid & Payment", "Online Rasid, Bill", "R", 0xFF00897B, listOf(
        Portal("Bhumi Lagaan Rasid (Bihar)", "https://biharbhumi.bihar.gov.in", listOf("lagaan", "rasid", "land rent"), "Bihar"),
        Portal("e-Challan (traffic)", "https://echallan.parivahan.gov.in", listOf("challan", "echallan"), "Gaadi ka challan"),
        Portal("Bijli bill - SBPDCL (South Bihar)", "https://sbpdcl.co.in", listOf("bijli", "electricity", "sbpdcl"), "Bihar"),
        Portal("Bijli bill - NBPDCL (North Bihar)", "https://nbpdcl.co.in", listOf("nbpdcl"), "Bihar"),
        Portal("Income Tax payment", "https://www.incometax.gov.in", listOf("tax payment"), "e-Pay Tax")
    )),
    Category("More Services", "All Online Services", "M", 0xFF3949AB, listOf(
        pUmang, pDigi, pNcs,
        Portal("e-Shram", "https://eshram.gov.in", listOf("eshram"), "Asangathit mazdoor"),
        Portal("India Post", "https://www.indiapost.gov.in", listOf("post office", "india post"), "Dak seva"),
        Portal("CSC (Jan Seva Kendra)", "https://csc.gov.in", listOf("csc", "jan seva"), "Digital seva"),
        pIndiaGov
    )),
    Category("Padhai Ghar", "Exam Prep & Study", "P", 0xFF6A1B9A, listOf(
        Portal("SWAYAM (free online course)", "https://swayam.gov.in", listOf("swayam", "free course"), "Sarkari free course"),
        Portal("DIKSHA", "https://diksha.gov.in", listOf("diksha"), "School ki padhai"),
        Portal("NCERT", "https://ncert.nic.in", listOf("ncert", "textbook"), "Kitabein"),
        Portal("NPTEL", "https://nptel.ac.in", listOf("nptel"), "IIT/IISc course")
    ))
)

// sarkari-ai (website) ki verified official list se (85 portals)
val govtPortals = listOf(
    Portal("SSC (Staff Selection Commission)", "https://ssc.gov.in", listOf("ssc", "ssc (staff selection commission)", "staff selection commission"), "Central"),
    Portal("Railway Recruitment Board (RRB)", "https://www.rrbapply.gov.in", listOf("railway recruitment board (rrb)", "railway rrb", "rrb"), "Central"),
    Portal("Central Selection Board of Constable, Bihar", "https://csbc.bihar.gov.in", listOf("bihar csbc", "central selection board of constable, bihar"), "Bihar"),
    Portal("UP Police Recruitment & Promotion Board", "https://uppbpb.gov.in", listOf("up police", "up police recruitment & promotion board"), "Uttar Pradesh"),
    Portal("AP State Level Police Recruitment Board", "https://slprb.ap.gov.in", listOf("ap police", "ap state level police recruitment board"), "Andhra Pradesh"),
    Portal("State Level Police Recruitment Board, Assam", "https://slprbassam.in", listOf("assam police", "state level police recruitment board, assam"), "Assam"),
    Portal("Maharashtra Police Recruitment", "https://www.mahapolice.gov.in/police-recru.php", listOf("maharashtra police", "maharashtra police recruitment"), "Maharashtra"),
    Portal("Rajasthan Recruitment Portal", "https://www.recruitment.rajasthan.gov.in", listOf("rajasthan recruitment", "rajasthan recruitment portal"), "Rajasthan"),
    Portal("UP Public Service Commission (UPPSC)", "https://uppsc.up.nic.in", listOf("up public service commission (uppsc)", "uppsc"), "Uttar Pradesh"),
    Portal("IBPS (Bank exams)", "https://www.ibps.in", listOf("bank exams", "ibps", "ibps (bank exams)"), "Central"),
    Portal("UPSC (Civil Services)", "https://upsconline.gov.in", listOf("civil services", "upsc", "upsc (civil services)"), "Central"),
    Portal("ISRO (Indian Space Research Organisation)", "https://www.isro.gov.in", listOf("indian space research organisation", "isro", "isro (indian space research organisation)"), "Central"),
    Portal("DRDO Recruitment (RAC)", "https://rac.gov.in", listOf("drdo", "drdo recruitment (rac)", "rac"), "Central"),
    Portal("ESIC (Employees' State Insurance Corporation)", "https://esic.gov.in", listOf("employees' state insurance corporation", "esic", "esic (employees' state insurance corporation)"), "Central"),
    Portal("AIIMS Common Recruitment Examination", "https://aiimsexams.ac.in", listOf("aiims", "aiims common recruitment examination"), "Central"),
    Portal("Tamil Nadu Uniformed Services Recruitment Board (TNUSRB)", "https://www.tnusrb.tn.gov.in", listOf("tamil nadu uniformed services recruitment board (tnusrb)", "tn usrb", "tnusrb"), "Tamil Nadu"),
    Portal("Karnataka State Police (KSP)", "https://ksp.karnataka.gov.in", listOf("karnataka ksp", "karnataka state police (ksp)", "ksp"), "Karnataka"),
    Portal("Gujarat Police Recruitment Board (GPRB)", "https://gprb.gujarat.gov.in", listOf("gprb", "gujarat gprb", "gujarat police recruitment board (gprb)"), "Gujarat"),
    Portal("Telangana Police Recruitment Board (TGPRB)", "https://www.tgprb.in", listOf("telangana police recruitment board (tgprb)", "telangana tgprb", "tgprb"), "Telangana"),
    Portal("Madhya Pradesh Police", "https://mppolice.gov.in", listOf("madhya pradesh police", "mp police"), "Madhya Pradesh"),
    Portal("Kerala Police", "https://www.keralapolice.gov.in", listOf("kerala police"), "Kerala"),
    Portal("Punjab Police", "https://www.punjabpolice.gov.in", listOf("punjab police"), "Punjab"),
    Portal("West Bengal Police Recruitment Board (WBPRB)", "https://prb.wb.gov.in", listOf("wb prb", "wbprb", "west bengal police recruitment board (wbprb)"), "West Bengal"),
    Portal("Haryana Staff Selection Commission (HSSC)", "https://hssc.gov.in", listOf("haryana hssc", "haryana staff selection commission (hssc)", "hssc"), "Haryana"),
    Portal("Odisha Police", "https://police.odisha.gov.in", listOf("odisha police"), "Odisha"),
    Portal("Chhattisgarh Police", "https://www.cgpolice.gov.in", listOf("chhattisgarh police"), "Chhattisgarh"),
    Portal("Jharkhand Police", "https://www.jhpolice.gov.in", listOf("jharkhand police"), "Jharkhand"),
    Portal("Himachal Pradesh Police (via HPPSC)", "https://www.hppsc.hp.gov.in", listOf("himachal pradesh police (via hppsc)", "hp police", "via hppsc"), "Himachal Pradesh"),
    Portal("Uttarakhand Police", "https://uttarakhandpolice.uk.gov.in", listOf("uttarakhand police"), "Uttarakhand"),
    Portal("Jammu & Kashmir Police", "https://www.jkpolice.gov.in", listOf("jammu & kashmir police", "jk police"), "Jammu & Kashmir"),
    Portal("Delhi Police", "https://delhipolice.gov.in", listOf("delhi police"), "Delhi"),
    Portal("Goa Police", "https://www.goapolice.gov.in", listOf("goa police"), "Goa"),
    Portal("Andaman & Nicobar Police", "https://police.andaman.gov.in", listOf("an police", "andaman & nicobar police"), "Andaman & Nicobar Islands"),
    Portal("Arunachal Pradesh Police", "https://arunpol.nic.in", listOf("arunachal police", "arunachal pradesh police"), "Arunachal Pradesh"),
    Portal("Chandigarh Police", "https://chandigarhpolice.nic.in", listOf("chandigarh police"), "Chandigarh"),
    Portal("Manipur Police", "https://manipurpolice.org", listOf("manipur police"), "Manipur"),
    Portal("Mizoram Police", "https://police.mizoram.gov.in", listOf("mizoram police"), "Mizoram"),
    Portal("Nagaland Police", "https://www.nagapol.gov.in", listOf("nagaland police"), "Nagaland"),
    Portal("Sikkim Police", "https://sikkimpolice.nic.in", listOf("sikkim police"), "Sikkim"),
    Portal("Tripura Police", "https://tripurapolice.gov.in", listOf("tripura police"), "Tripura"),
    Portal("Puducherry Police", "https://police.py.gov.in", listOf("puducherry police"), "Puducherry"),
    Portal("Join Indian Army", "https://joinindianarmy.nic.in", listOf("join indian army"), "Central"),
    Portal("Join Indian Navy", "https://www.joinindiannavy.gov.in", listOf("join indian navy"), "Central"),
    Portal("Indian Air Force Recruitment", "https://indianairforce.nic.in", listOf("indian air force", "indian air force recruitment"), "Central"),
    Portal("Border Security Force (BSF) Recruitment", "https://rectt.bsf.gov.in", listOf("border security force (bsf) recruitment", "bsf"), "Central"),
    Portal("Central Reserve Police Force (CRPF)", "https://rect.crpf.gov.in", listOf("central reserve police force (crpf)", "crpf"), "Central"),
    Portal("Central Industrial Security Force (CISF) Recruitment", "https://cisfrectt.cisf.gov.in", listOf("central industrial security force (cisf) recruitment", "cisf"), "Central"),
    Portal("Indo-Tibetan Border Police (ITBP) Recruitment", "https://recruitment.itbpolice.nic.in", listOf("indo-tibetan border police (itbp) recruitment", "itbp"), "Central"),
    Portal("Sashastra Seema Bal (SSB) Recruitment", "https://recruitment.ssb.gov.in", listOf("sashastra seema bal (ssb) recruitment", "ssb"), "Central"),
    Portal("CTET (Central Teacher Eligibility Test)", "https://ctet.nic.in", listOf("central teacher eligibility test", "ctet", "ctet (central teacher eligibility test)"), "Central"),
    Portal("National Testing Agency (NTA)", "https://nta.ac.in", listOf("national testing agency (nta)", "nta"), "Central"),
    Portal("Kendriya Vidyalaya Sangathan (KVS)", "https://kvsangathan.nic.in", listOf("kendriya vidyalaya sangathan (kvs)", "kvs"), "Central"),
    Portal("Navodaya Vidyalaya Samiti (NVS)", "https://navodaya.gov.in", listOf("navodaya vidyalaya samiti (nvs)", "nvs"), "Central"),
    Portal("Delhi Subordinate Services Selection Board (DSSSB)", "https://dsssb.delhi.gov.in", listOf("delhi subordinate services selection board (dsssb)", "dsssb"), "Delhi"),
    Portal("RBI Recruitment (Reserve Bank of India)", "https://opportunities.rbi.org.in", listOf("rbi recruitment", "rbi recruitment (reserve bank of india)", "reserve bank of india"), "Central"),
    Portal("EPFO (Employees' Provident Fund Organisation)", "https://www.epfindia.gov.in", listOf("employees' provident fund organisation", "epfo", "epfo (employees' provident fund organisation)"), "Central"),
    Portal("Department of Posts (India Post) Recruitment", "https://www.indiapost.gov.in", listOf("department of posts (india post) recruitment", "india post"), "Central"),
    Portal("LIC (Life Insurance Corporation) Recruitment", "https://licindia.in", listOf("lic", "lic (life insurance corporation) recruitment", "life insurance corporation"), "Central"),
    Portal("Madhya Pradesh Public Service Commission (MPPSC)", "https://mppsc.mp.gov.in", listOf("madhya pradesh public service commission (mppsc)", "mppsc"), "Madhya Pradesh"),
    Portal("Rajasthan Public Service Commission (RPSC)", "https://rpsc.rajasthan.gov.in", listOf("rajasthan public service commission (rpsc)", "rpsc"), "Rajasthan"),
    Portal("Tamil Nadu Public Service Commission (TNPSC)", "https://www.tnpsc.gov.in", listOf("tamil nadu public service commission (tnpsc)", "tnpsc"), "Tamil Nadu"),
    Portal("Telangana State Public Service Commission (TSPSC)", "https://www.tspsc.gov.in", listOf("telangana state public service commission (tspsc)", "tspsc"), "Telangana"),
    Portal("Gujarat Public Service Commission (GPSC)", "https://gpsc.gujarat.gov.in", listOf("gpsc", "gujarat public service commission (gpsc)"), "Gujarat"),
    Portal("Odisha Public Service Commission (OPSC)", "https://www.opsc.gov.in", listOf("odisha public service commission (opsc)", "opsc"), "Odisha"),
    Portal("Jharkhand Public Service Commission (JPSC)", "https://www.jpsc.gov.in", listOf("jharkhand public service commission (jpsc)", "jpsc"), "Jharkhand"),
    Portal("Maharashtra Public Service Commission (MPSC)", "https://mpsc.gov.in", listOf("maharashtra public service commission (mpsc)", "mpsc", "mpsc maharashtra"), "Maharashtra"),
    Portal("Bihar Public Service Commission (BPSC)", "https://bpsc.bih.nic.in", listOf("bihar public service commission (bpsc)", "bpsc"), "Bihar"),
    Portal("Andhra Pradesh Public Service Commission (APPSC)", "https://psc.ap.gov.in", listOf("andhra pradesh public service commission (appsc)", "appsc"), "Andhra Pradesh"),
    Portal("West Bengal Public Service Commission (WBPSC)", "https://psc.wb.gov.in", listOf("wbpsc", "west bengal public service commission (wbpsc)"), "West Bengal"),
    Portal("Haryana Public Service Commission (HPSC)", "https://hpsc.gov.in", listOf("haryana public service commission (hpsc)", "hpsc"), "Haryana"),
    Portal("Jammu & Kashmir Public Service Commission (JKPSC)", "https://jkpsc.nic.in", listOf("jammu & kashmir public service commission (jkpsc)", "jkpsc"), "Jammu & Kashmir"),
    Portal("Chhattisgarh Public Service Commission (CGPSC)", "https://psc.cg.gov.in", listOf("cgpsc", "chhattisgarh public service commission (cgpsc)"), "Chhattisgarh"),
    Portal("Kerala Public Service Commission", "https://www.keralapsc.gov.in", listOf("kerala public service commission", "keralapsc"), "Kerala"),
    Portal("Uttarakhand Public Service Commission (UKPSC)", "https://psc.uk.gov.in", listOf("ukpsc", "uttarakhand public service commission (ukpsc)"), "Uttarakhand"),
    Portal("Punjab Public Service Commission (PPSC)", "https://ppsc.gov.in", listOf("ppsc", "punjab public service commission (ppsc)"), "Punjab"),
    Portal("Karnataka Public Service Commission (KPSC)", "https://kpsc.kar.nic.in", listOf("karnataka public service commission (kpsc)", "kpsc"), "Karnataka"),
    Portal("Assam Public Service Commission (APSC)", "https://apsc.nic.in", listOf("apsc", "assam public service commission (apsc)"), "Assam"),
    Portal("Goa Public Service Commission (GPSC)", "https://gpsc.goa.gov.in", listOf("goa psc", "goa public service commission (gpsc)", "gpsc"), "Goa"),
    Portal("Manipur Public Service Commission (MPSC)", "https://mpscmanipur.gov.in", listOf("manipur psc", "manipur public service commission (mpsc)", "mpsc"), "Manipur"),
    Portal("Meghalaya Public Service Commission (MPSC)", "https://mpsc.nic.in", listOf("meghalaya psc", "meghalaya public service commission (mpsc)", "mpsc"), "Meghalaya"),
    Portal("Mizoram Public Service Commission (MPSC)", "https://mpsc.mizoram.gov.in", listOf("mizoram psc", "mizoram public service commission (mpsc)", "mpsc"), "Mizoram"),
    Portal("Nagaland Public Service Commission (NPSC)", "https://npsc.nagaland.gov.in", listOf("nagaland psc", "nagaland public service commission (npsc)", "npsc"), "Nagaland"),
    Portal("Sikkim Public Service Commission (SPSC)", "https://spscskm.gov.in", listOf("sikkim psc", "sikkim public service commission (spsc)", "spsc"), "Sikkim"),
    Portal("Tripura Public Service Commission (TPSC)", "https://tpsc.nic.in", listOf("tpsc", "tripura psc", "tripura public service commission (tpsc)"), "Tripura"),
    Portal("Arunachal Pradesh Public Service Commission (APPSC)", "https://appsc.gov.in", listOf("appsc", "arunachal pradesh public service commission (appsc)", "arunachal psc"), "Arunachal Pradesh")
)

val stateRecruit: List<Portal> = govtPortals.filter { it.note != "Central" } + listOf(
    Portal("BSSC (Bihar SSC)", "https://bssc.bihar.gov.in", listOf("bssc"), "Bihar"),
    Portal("BPSSC (Bihar Police SC)", "https://bpssc.bihar.gov.in", listOf("bpssc"), "Bihar"),
    Portal("UPSSSC", "https://upsssc.gov.in", listOf("upsssc", "pet"), "Uttar Pradesh"),
    Portal("JSSC", "https://www.jssc.nic.in", listOf("jssc"), "Jharkhand"),
    Portal("RSMSSB", "https://rsmssb.rajasthan.gov.in", listOf("rsmssb"), "Rajasthan"),
    Portal("MP ESB (Vyapam)", "https://esb.mp.gov.in", listOf("vyapam", "mpesb"), "Madhya Pradesh"),
    Portal("OJAS Gujarat", "https://ojas.gujarat.gov.in", listOf("ojas", "gsssb"), "Gujarat"),
    Portal("OSSC (Odisha)", "https://ossc.gov.in", listOf("ossc"), "Odisha"),
    Portal("WBSSC", "https://www.wbssc.gov.in", listOf("wbssc"), "West Bengal"),
    Portal("JKSSB", "https://www.jkssb.nic.in", listOf("jkssb"), "Jammu & Kashmir")
)

val centralJobs: List<Portal> = listOf(pRrb, pSsc, pUpsc, pNta, pNcs, pEmpNews) +
    govtPortals.filter { it.note == "Central" } + listOf(
    Portal("SBI Careers", "https://sbi.co.in/web/careers", listOf("sbi"), "Central"),
    Portal("India Post GDS", "https://indiapostgdsonline.gov.in", listOf("gds", "dak sevak", "post office job"), "Central"),
    Portal("Agniveer Vayu (Air Force)", "https://agnipathvayu.cdac.in", listOf("agniveer", "vayu"), "Central"),
    Portal("Indian Coast Guard", "https://joinindiancoastguard.cdac.in", listOf("coast guard"), "Central"),
    Portal("FCI", "https://fci.gov.in", listOf("fci"), "Central")
)

val allJobs: List<Portal> = (centralJobs + stateRecruit).distinctBy { it.url }

// (naam, official site) - admit card aur result ke liye
val examSites = listOf(
    "SSC" to "https://ssc.gov.in", "UPSC" to "https://upsc.gov.in",
    "RRB (Railway)" to "https://www.rrbapply.gov.in", "NTA" to "https://nta.ac.in",
    "IBPS" to "https://www.ibps.in", "Bihar Police (CSBC)" to "https://csbc.bihar.gov.in",
    "UP Police (UPPBPB)" to "https://uppbpb.gov.in", "BPSC" to "https://www.bpsc.bihar.gov.in",
    "BSSC" to "https://bssc.bihar.gov.in", "UPPSC" to "https://uppsc.up.nic.in",
    "UPSSSC" to "https://upsssc.gov.in", "JSSC" to "https://www.jssc.nic.in",
    "HSSC" to "https://hssc.gov.in", "RSMSSB" to "https://rsmssb.rajasthan.gov.in",
    "MP ESB" to "https://esb.mp.gov.in", "Delhi Police" to "https://www.delhipolice.gov.in",
    "India Post GDS" to "https://indiapostgdsonline.gov.in", "AIIMS" to "https://www.aiimsexams.ac.in"
)
val allAdmit: List<Portal> = examSites.map { (n, u) -> Portal("$n Admit Card", u, listOf("$n admit"), "Official site") }
val allResults: List<Portal> = examSites.map { (n, u) -> Portal("$n Result", u, listOf("$n result"), "Official site") } + listOf(
    pBseb, pUpBoard, pCbse,
    Portal("National Result Portal", "https://results.gov.in", listOf("result"), "Sab board / university"),
    Portal("MP Board", "https://mpbse.nic.in", listOf("mp board"), "Official site"),
    Portal("Rajasthan Board", "https://rajeduboard.rajasthan.gov.in", listOf("rajasthan board"), "Official site")
)
val extraDocPortals = listOf(
    Portal("UIDAI (Aadhaar)", "https://uidai.gov.in", listOf("uidai"), "Aadhaar update / download"),
    Portal("NSDL e-PAN", "https://www.onlineservices.nsdl.com", listOf("nsdl", "e-pan", "epan"), "PAN apply / e-PAN"),
    Portal("NFSA (Ration card)", "https://nfsa.gov.in", listOf("nfsa", "ration"), "Rashtriya"),
    Portal("EPF Member Portal (UAN)", "https://unifiedportal-mem.epfindia.gov.in", listOf("uan", "pf balance", "pf withdrawal"), "Balance / KYC / Withdrawal"),
    Portal("Income Tax e-Filing Portal", "https://eportal.incometax.gov.in", listOf("itr", "refund"), "ITR / Refund")
)

val allUpdates: List<Portal> = listOf(
    pEmpNews, pPib, pMyScheme, pIndiaGov,
    Portal("MyGov", "https://www.mygov.in", listOf("mygov"), "Sarkari ghoshna aur sujhav"),
    Portal("Rojgar Mela / NCS", "https://www.ncs.gov.in", listOf("rojgar mela"), "Official site")
)

// Category tile ke neeche ka button (screenshot jaisa)
val ctaMap = mapOf(
    "IRCTC & Ticket" to "Book Now", "Jobs & Exams" to "View Jobs", "Admit Card" to "View All",
    "Results" to "View Results", "Documents & Identity" to "Explore", "Land & Property" to "View",
    "Government Loan" to "Apply Now", "Scholarship" to "Apply Now", "Yojana & Benefits" to "View All",
    "Insurance" to "View Plans", "Rasid & Payment" to "Pay Now", "More Services" to "Explore",
    "Padhai Ghar" to "Start"
)

val popular = listOf(
    pAadhaar, pPan, pIrctc, pVoter, pPassport, pDl, pRation,
    pIncomeCert, pCasteCert, pResidenceCert, pBirthCert, pEpf, pGst, pItr, pNcs, pUmang, pDigi
)

val allPortals: List<Portal> =
    (popular + categories.flatMap { it.links } + allJobs + allAdmit + allResults + allUpdates + extraDocPortals + listJobs + listAdmit + listResults + listUpdates)
        .distinctBy { it.name }
