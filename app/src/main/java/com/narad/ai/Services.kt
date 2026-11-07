package com.narad.ai

/**
 * Har service ka seedha form link aur chat me dikhne wali jaankari.
 * Key = Portal ka naam (Data.kt me jo naam hai wahi).
 * direct khali ho to portal ka normal link khulta hai.
 * Jaankari badalni ho to yahin badlein. Fees badalti rehti hain, isliye har card me
 * "site par jo dikhe wahi sahi" likha hai.
 */
data class Svc(val direct: String = "", val info: String = "")

private const val RTPS_NOTE =
    "• Kahan: serviceonline.bihar.gov.in (RTPS)\n" +
    "• Samay: RTPS me tay samay seema hoti hai (aam taur par 7 se 21 din)\n" +
    "• Fees: alag-alag jagah alag likhi hai (kam fees), isliye portal par jo fees dikhe wahi sahi maniye. " +
    "Cyber cafe ka paisa sarkari fees nahi hota\n" +
    "• Chahiye: passport size photo, pehchaan aur pate ka praman (jaise Aadhaar), mobile number (OTP ke liye). " +
    "Baaki documents form khulne par jo maange, wo AI chat me bata dega\n" +
    "• Der ho to RTPS me appeal ka adhikar hai"

val SERVICE_EXTRA: Map<String, Svc> = mapOf(
    "PAN Card" to Svc(
        direct = "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan",
        info = "📋 Naya PAN (Instant e-PAN)\n" +
            "• Fees: ₹0 (muft)\n" +
            "• Kaun: 18+ vyakti jiska abhi tak PAN nahi bana, jiske paas Aadhaar ho aur Aadhaar se mobile linked ho\n" +
            "• Chahiye: Aadhaar number, Aadhaar se linked mobile (OTP aayega), email\n" +
            "• Dhyan: Aadhaar me naam, janm tithi ya gender galat ho to ye raasta nahi chalega\n" +
            "• Plastic/physical card, nabalig ya firm ke liye NSDL (Protean) ya UTIITSL se apply hota hai. " +
            "Wahan e-PAN ke ₹72 aur card ke ₹107 ke aas-paas likha milta hai, par apply karte waqt site par jo dikhe wahi sahi"
    ),
    "Voter ID" to Svc(
        info = "📋 Naya Voter ID (Form 6)\n" +
            "• Fees: koi fees nahi\n" +
            "• Kaun: 18 saal ya usse upar ka Bharatiya naagrik\n" +
            "• Chahiye: passport size photo, age proof (jaise janm praman patra ya 10vi ki marksheet), pate ka praman, mobile number (OTP)\n" +
            "• 18 se 21 saal walon ke liye age proof zaroori hai"
    ),
    "Income Certificate" to Svc(info = "📋 Aay Praman Patra (Bihar)\n" + RTPS_NOTE),
    "Caste Certificate" to Svc(info = "📋 Jaati Praman Patra (Bihar)\n" + RTPS_NOTE),
    "Residence Certificate" to Svc(info = "📋 Awasiya Praman Patra (Bihar)\n" + RTPS_NOTE)
)

fun svcFor(p: Portal): Svc? = SERVICE_EXTRA[p.name]
