package com.narad.ai

/**
 * Har service ka seedha form link aur chat me dikhne wali chhoti jaankari.
 * Key = Portal ka naam (Data.kt me jo naam hai wahi).
 * direct khali ho to portal ka normal link khulta hai.
 */
data class Svc(
    val direct: String = "",
    val info: String = "",
    // Pehle ek sawaal (Haan / Nahi). Jawab ke hisaab se link kholna aur page ka button dabana
    val ask: String = "",
    val yesLabel: String = "Haan",
    val noLabel: String = "Nahi",
    val yesUrl: String = "",
    val noUrl: String = "",
    val yesClick: String = "",
    val noClick: String = "",
    val yesSay: String = "",
    val noSay: String = ""
)

private fun rtps(title: String) =
    title + ":\n" +
    "• Site: serviceonline.bihar.gov.in\n" +
    "• Samay: aam taur par 7 se 21 din\n" +
    "• Fees: portal par jo dikhe wahi sahi\n" +
    "• Chahiye: photo, pehchaan aur pate ka praman, mobile"

val SERVICE_EXTRA: Map<String, Svc> = mapOf(
    "PAN Card" to Svc(
        direct = "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan",
        info = "PAN (Instant e-PAN):\n" +
            "• Fees: ₹0\n" +
            "• Kaun: 18+, jiska PAN nahi bana\n" +
            "• Chahiye: Aadhaar aur usse linked mobile, email\n" +
            "• Card ya nabalig ke liye NSDL / UTIITSL"
    ),
    "Voter ID" to Svc(
        info = "Naya Voter ID (Form 6):\n" +
            "• Fees: koi nahi\n" +
            "• Kaun: 18+ Bharatiya\n" +
            "• Chahiye: photo, age proof, pate ka praman, mobile"
    ),
    "IRCTC" to Svc(
        ask = "IRCTC account hai?",
        yesLabel = "Haan hai",
        noLabel = "Nahi hai",
        yesClick = "login",
        noClick = "register",
        yesSay = "Theek hai. Login ke liye jo chahiye wo bataunga.",
        noSay = "Theek hai, account banate hain. Jo chahiye wo bataunga."
    ),
    "Income Certificate" to Svc(info = rtps("Aay Praman Patra (Bihar)")),
    "Caste Certificate" to Svc(info = rtps("Jaati Praman Patra (Bihar)")),
    "Residence Certificate" to Svc(info = rtps("Awasiya Praman Patra (Bihar)"))
)

fun svcFor(p: Portal): Svc? = SERVICE_EXTRA[p.name]
