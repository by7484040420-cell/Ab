package com.narad.ai

import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.URLUtil
import android.net.http.SslError
import android.webkit.SslErrorHandler
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import kotlinx.coroutines.delay
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar
import android.util.Patterns

// ---------- Screens ----------

sealed class Screen {
    object Home : Screen()
    data class Links(val title: String, val links: List<Portal>) : Screen()
    data class Work(val portal: Portal) : Screen()
    object Chat : Screen()
    object Settings : Screen()
}

const val DESKTOP_UA =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

val NAVY = Color(0xFF0B1B3F)

// Chat me bheja gaya document: file ki copy nahi banti, sirf link (Uri) yaad rehta hai; bahar nikalte hi saaf
class Doc(val uri: Uri, val name: String, val mime: String, val size: Long, val kind: String = "")

val DOC_KINDS = listOf("photo" to "Photo", "signature" to "Signature", "aadhaar" to "Aadhaar copy", "pan" to "PAN copy", "certificate" to "Marksheet / Certificate", "other" to "Dusra")
fun kindLabel(k: String) = DOC_KINDS.firstOrNull { it.first == k }?.second ?: k

fun docMatches(d: Doc, accept: List<String>): Boolean {
    val toks = accept.flatMap { it.split(",") }.map { it.trim().lowercase() }.filter { it.isNotEmpty() }
    if (toks.isEmpty()) return true
    val ext = d.name.substringAfterLast('.', "").lowercase()
    return toks.any { t ->
        when {
            t == "*/*" -> true
            t.endsWith("/*") -> d.mime.lowercase().startsWith(t.dropLast(1))
            t.startsWith(".") -> ext == t.drop(1) || (t == ".jpg" && ext == "jpeg") || (t == ".jpeg" && ext == "jpg")
            else -> d.mime.lowercase() == t
        }
    }
}

class Bridge(
    private val onStatus: (String) -> Unit,
    private val onReport: (String) -> Unit,
    private val onNeeds: (String) -> Unit,
    private val onSave: (String, String, String, String) -> Unit
) {
    @JavascriptInterface
    fun saveBlob(b64: String, mime: String, name: String, token: String) {
        onSave(b64, mime, name, token)
    }

    @JavascriptInterface
    fun needs(json: String) {
        onNeeds(json)
    }

    @JavascriptInterface
    fun status(msg: String) {
        onStatus(msg)
    }

    @JavascriptInterface
    fun report(json: String) {
        onReport(json)
    }
}

val INDIA_STATES = listOf(
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
)

// ---------- Details ki jaanch: galat cheez form tak jaye hi nahi ----------
fun validateFields(f: Map<String, String>): Pair<JSONObject, List<String>> {
    val out = JSONObject()
    val errs = mutableListOf<String>()
    fun v(k: String) = (f[k] ?: "").trim().replace(Regex("\\s+"), " ")

    val nameRe = Regex("^[\\p{L}\\p{M} .'-]{2,60}$")
    for ((k, lbl) in listOf("naam" to "Naam", "pita" to "Pita ka naam", "mata" to "Mata ka naam")) {
        val s = v(k)
        if (s.isEmpty()) continue
        if (nameRe.matches(s)) out.put(k, s) else errs.add(lbl + ": sirf akshar likhein (number ya sign nahi).")
    }

    val j = v("janm")
    if (j.isNotEmpty()) {
        val a = Regex("^(\\d{1,2})[/.\\- ](\\d{1,2})[/.\\- ](\\d{4})$").matchEntire(j)
        val b = Regex("^(\\d{4})-(\\d{1,2})-(\\d{1,2})$").matchEntire(j)
        var d = 0; var mo = 0; var y = 0
        if (a != null) { d = a.groupValues[1].toInt(); mo = a.groupValues[2].toInt(); y = a.groupValues[3].toInt() }
        else if (b != null) { y = b.groupValues[1].toInt(); mo = b.groupValues[2].toInt(); d = b.groupValues[3].toInt() }
        val leap = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
        val dim = intArrayOf(31, if (leap) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
        val c = Calendar.getInstance()
        val today = c.get(Calendar.YEAR) * 10000 + (c.get(Calendar.MONTH) + 1) * 100 + c.get(Calendar.DAY_OF_MONTH)
        val valid = (a != null || b != null) && y >= 1900 && mo in 1..12 && d in 1..dim[mo - 1] && (y * 10000 + mo * 100 + d) < today
        if (valid) out.put("janm", String.format("%04d-%02d-%02d", y, mo, d))
        else errs.add("Janm tithi DD/MM/YYYY me likhein, jaise 15/08/1998 (sahi tareekh, aaj se pehle ki).")
    }

    var mob = v("mobile").replace(Regex("[\\s-]"), "")
    if (mob.isNotEmpty()) {
        if (mob.startsWith("+91")) mob = mob.drop(3)
        else if (mob.startsWith("91") && mob.length == 12) mob = mob.drop(2)
        else if (mob.startsWith("0") && mob.length == 11) mob = mob.drop(1)
        if (Regex("^[6-9]\\d{9}$").matches(mob)) out.put("mobile", mob) else errs.add("Mobile: 10 ank ka sahi number likhein (6-9 se shuru).")
    }

    val em = v("email").lowercase()
    if (em.isNotEmpty()) {
        if (Patterns.EMAIL_ADDRESS.matcher(em).matches()) out.put("email", em) else errs.add("Email sahi nahi lag raha (jaise naam@gmail.com).")
    }

    val pin = v("pincode")
    if (pin.isNotEmpty()) {
        if (Regex("^[1-9]\\d{5}$").matches(pin)) out.put("pincode", pin) else errs.add("Pincode 6 ank ka hona chahiye.")
    }

    val addr = (f["pata"] ?: "").trim().replace(Regex("\\s*\\n\\s*"), ", ").replace(Regex("\\s+"), " ")
    if (addr.isNotEmpty()) {
        if (addr.length in 5..200 && addr.any { it.isLetterOrDigit() }) out.put("pata", addr) else errs.add("Pata bahut chhota ya galat hai.")
    }

    val g = v("gender")
    if (g in setOf("male", "female", "other")) out.put("gender", g)

    val st = v("rajya")
    if (st.isNotEmpty()) {
        fun n(s: String) = s.lowercase().replace("&", "and").replace(Regex("[^a-z ]"), "").replace(Regex("\\s+"), " ").trim()
        val alias = mapOf("orissa" to "odisha", "uttaranchal" to "uttarakhand", "nct of delhi" to "delhi", "pondicherry" to "puducherry")
        val key = alias[n(st)] ?: n(st)
        val hit = INDIA_STATES.firstOrNull { n(it) == key }
        if (hit != null) out.put("rajya", hit) else errs.add("Rajya ka naam sahi likhein (jaise Bihar, Uttar Pradesh).")
    }
    val dist = v("jila")
    if (dist.isNotEmpty()) {
        if (Regex("^[\\p{L}\\p{M} .'-]{2,40}$").matches(dist)) out.put("jila", dist) else errs.add("Jila: sirf akshar likhein.")
        if (st.isEmpty()) errs.add("Jila ke saath Rajya bhi likhein.")
    }
    val cat = v("category")
    if (cat in setOf("general", "obc", "sc", "st", "ews")) out.put("category", cat)
    val mar = v("marital")
    if (mar in setOf("single", "married")) out.put("marital", mar)
    return Pair(out, errs)
}

fun niceKey(k: String) = when (k) {
    "naam" -> "Naam"; "pita" -> "Pita ka naam"; "mata" -> "Mata ka naam"; "janm" -> "Janm tithi"
    "mobile" -> "Mobile"; "email" -> "Email"; "pata" -> "Pata"; "pincode" -> "Pincode"
    "gender" -> "Gender"; "rajya" -> "Rajya"; "jila" -> "Jila"; "category" -> "Category"; "marital" -> "Vaivahik sthiti"
    "baaki" -> "Baaki"; "otp" -> "CAPTCHA/OTP"; "declare" -> "Declaration"; "tick" -> "Tick box"; "guide" -> "Guide"; else -> "AI"
}

fun niceVal(k: String, v: String): String = when {
    k == "janm" && v.length == 10 -> v.substring(8, 10) + "/" + v.substring(5, 7) + "/" + v.substring(0, 4)
    k == "gender" -> when (v) { "male" -> "Purush"; "female" -> "Mahila"; else -> "Anya" }
    k == "marital" -> if (v == "single") "Avivahit" else "Vivahit"
    k == "category" -> v.uppercase()
    else -> v
}

// Kaam ke baad sab saaf: cache, cookies, session, form data
fun wipe(wv: WebView?) {
    wv?.apply {
        clearCache(true)
        clearHistory()
        clearFormData()
    }
    val cm = CookieManager.getInstance()
    cm.removeAllCookies(null)
    cm.flush()
    WebStorage.getInstance().deleteAllData()
}

// ---------- Activity ----------

class MainActivity : ComponentActivity() {
    private var fileCb: ValueCallback<Array<Uri>>? = null

    private val picker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        fileCb?.onReceiveValue(if (uri != null) arrayOf(uri) else null)
        fileCb = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Screenshot / screen recording band (documents ki suraksha)
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
        val cfg = AiConfig(getSharedPreferences("narad_cfg", MODE_PRIVATE))

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    val stack = remember { mutableStateListOf<Screen>(Screen.Home) }
                    val screen = stack.last()
                    fun push(s: Screen) { stack.add(s) }
                    fun pop() { if (stack.size > 1) stack.removeAt(stack.size - 1) }

                    BackHandler(enabled = stack.size > 1 && screen !is Screen.Work) { pop() }

                    when (screen) {
                        is Screen.Home -> HomeScreen(
                            onOpen = { push(Screen.Work(it)) },
                            onLinks = { t, l -> push(Screen.Links(t, l)) },
                            onChat = { push(Screen.Chat) },
                            onSettings = { push(Screen.Settings) }
                        )
                        is Screen.Links -> LinksScreen(
                            title = screen.title,
                            links = screen.links,
                            onOpen = { push(Screen.Work(it)) },
                            onBack = { pop() }
                        )
                        is Screen.Work -> WorkScreen(
                            portal = screen.portal,
                            onExit = { pop() },
                            onPickFile = { cb ->
                                fileCb?.onReceiveValue(null)
                                fileCb = cb
                                picker.launch("*/*")
                            }
                        )
                        is Screen.Chat -> ChatScreen(
                            cfg = cfg,
                            onOpen = { push(Screen.Work(it)) },
                            onSettings = { push(Screen.Settings) },
                            onBack = { pop() }
                        )
                        is Screen.Settings -> SettingsScreen(cfg = cfg, onBack = { pop() })
                    }
                }
            }
        }
    }
}

// ---------- Home ----------

@Composable
fun HomeScreen(
    onOpen: (Portal) -> Unit,
    onLinks: (String, List<Portal>) -> Unit,
    onChat: () -> Unit,
    onSettings: () -> Unit
) {
    var search by remember { mutableStateOf("") }
    val homeCtx = LocalContext.current
    LaunchedEffect(Unit) { Live.start(homeCtx) }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F7FB))
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .background(NAVY)
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier
                    .size(34.dp)
                    .background(Color(0xFFE53935), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) { Text("N", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp) }
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
                Text("NARAD AI", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text("Sab Kuchh, Ek Jagah", color = Color(0xFFB0BEC5), fontSize = 10.sp)
            }
            TextButton(onClick = onSettings) { Text("⚙", color = Color.White, fontSize = 22.sp) }
        }

        OutlinedTextField(
            value = search,
            onValueChange = { search = it },
            placeholder = { Text("Job, Admit Card, Result, PAN, DL…", fontSize = 13.sp) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp)
        )

        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 8.dp)
        ) {
            val q = search.trim()
            if (q.isNotEmpty()) {
                val urlLike = Regex("^(https?://)?[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+(/\\S*)?$").matches(q)
                val openAny = if (urlLike) listOf(Portal("Kholo: " + q, "https://" + q.removePrefix("https://").removePrefix("http://"), emptyList(), "Koi bhi website")) else emptyList()
                val hits = openAny + (Live.portals(null) + allPortals).filter { p ->
                    p.name.contains(q, true) || p.keys.any { k -> k.contains(q, true) }
                }
                Text("Nateeje", fontWeight = FontWeight.Bold)
                if (hits.isEmpty()) Text("Kuch nahi mila. AI se poochhiye 👇", fontSize = 12.sp)
                for (p in hits.take(12)) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                            .clickable { onOpen(p) },
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(Modifier.padding(10.dp)) {
                            Text(p.name, fontWeight = FontWeight.Medium)
                            Text(Uri.parse(p.url).host ?: "", fontSize = 11.sp, color = Color(0xFF777777))
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
            }

            // 13 category
            for (row in categories.chunked(3)) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(vertical = 3.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    for (c in row) {
                        CategoryTile(c, Modifier.weight(1f)) {
                            if (c.links.size == 1) onOpen(c.links[0]) else onLinks(c.name, c.links)
                        }
                    }
                    repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
                }
            }

            Spacer(Modifier.height(6.dp))
            Row(
                Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(10.dp))
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "QUICK",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    modifier = Modifier.background(Color(0xFFE53935), RoundedCornerShape(6.dp)).padding(horizontal = 8.dp, vertical = 3.dp)
                )
                Row(Modifier.horizontalScroll(rememberScrollState()).padding(start = 8.dp)) {
                    for (p in listOf(pRrb, pSsc, pCsbc, pUpPolice, pUpsc, pNta, pNcs)) {
                        Text(
                            "• " + p.name,
                            fontSize = 12.sp,
                            modifier = Modifier.clickable { onOpen(p) }.padding(end = 14.dp)
                        )
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onLinks("Verified State Recruitment Portals (" + stateRecruit.size + ")", stateRecruit) },
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("🏛 Verified State Recruitment Portals", fontWeight = FontWeight.Medium, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    Text("Dekho →", color = Color(0xFF1E88E5), fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(8.dp))
            val liveJobs = Live.portals("job")
            val liveAdmit = Live.portals("admit")
            val liveRes = Live.portals("result")
            val boxes = listOf(
                Triple("🔥 Latest Jobs", if (liveJobs.isNotEmpty()) liveJobs.take(4) else listJobs, if (liveJobs.isNotEmpty()) liveJobs else allJobs),
                Triple("🎓 Admit Cards", if (liveAdmit.isNotEmpty()) liveAdmit.take(4) else listAdmit, if (liveAdmit.isNotEmpty()) liveAdmit else allAdmit),
                Triple("📊 Results", if (liveRes.isNotEmpty()) liveRes.take(4) else listResults, if (liveRes.isNotEmpty()) liveRes else allResults),
                Triple("📢 Important Updates", listUpdates, allUpdates)
            )
            for (pair in boxes.chunked(2)) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(vertical = 3.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    for ((title, list, all) in pair) {
                        SectionCard(title, list, Modifier.weight(1f), onOpen) {
                            onLinks(title.drop(2).trim() + " (" + all.size + ")", all)
                        }
                    }
                }
            }
            Spacer(Modifier.height(4.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onLinks("Sabhi Portals (A-Z)", allPortals.sortedBy { it.name }) },
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("📚 Sabhi Sarkari Portals (" + allPortals.size + ")", fontWeight = FontWeight.Medium, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    Text("Dekho →", color = Color(0xFF1E88E5), fontSize = 12.sp)
                }
            }
            Text(
                "Naye vacancy, tareekh aur result ke liye official site khol kar dekhein.",
                fontSize = 11.sp,
                color = Color(0xFF777777),
                modifier = Modifier.padding(vertical = 4.dp)
            )

            // AI banner
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .clickable { onChat() },
                colors = CardDefaults.cardColors(containerColor = NAVY)
            ) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Narad AI Assistant", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("Aapka personal sarkari sahayak", color = Color(0xFFB0BEC5), fontSize = 12.sp)
                        Text("AI se form bharo • Document madad • Job match", color = Color(0xFFFFD54F), fontSize = 11.sp)
                    }
                    Button(
                        onClick = onChat,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = NAVY)
                    ) { Text("AI se Poochho →", fontSize = 12.sp) }
                }
            }

            Text("लोकप्रिय सेवाएँ", fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.padding(vertical = 6.dp))
            for (row in popular.chunked(3)) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(vertical = 3.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    for (p in row) {
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .height(52.dp)
                                .clickable { onOpen(p) },
                            colors = CardDefaults.cardColors(containerColor = Color.White)
                        ) {
                            Box(Modifier.fillMaxSize().padding(4.dp), contentAlignment = Alignment.Center) {
                                Text(p.name, fontSize = 11.sp, maxLines = 2)
                            }
                        }
                    }
                    repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
                }
            }

            Spacer(Modifier.height(10.dp))
            Row(
                Modifier
                    .fillMaxWidth()
                    .background(NAVY, RoundedCornerShape(10.dp))
                    .padding(10.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("🔒 Secure", color = Color.White, fontSize = 11.sp)
                Text("✔ Sirf asli sarkari links", color = Color.White, fontSize = 11.sp)
                Text("🗑 Data save nahi", color = Color.White, fontSize = 11.sp)
            }
            Text(
                "Narad AI ek independent platform hai, kisi sarkari vibhag ka official portal nahi.",
                fontSize = 11.sp,
                color = Color(0xFF777777),
                modifier = Modifier.padding(vertical = 10.dp)
            )
        }
    }
}

@Composable
fun CategoryTile(c: Category, modifier: Modifier, onClick: () -> Unit) {
    Card(
        modifier = modifier.clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(Modifier.padding(8.dp)) {
            Box(
                Modifier
                    .size(28.dp)
                    .background(Color(c.color).copy(alpha = 0.15f), RoundedCornerShape(6.dp)),
                contentAlignment = Alignment.Center
            ) { Text(c.tag, color = Color(c.color), fontWeight = FontWeight.Bold) }
            Spacer(Modifier.height(6.dp))
            Text(c.name, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 2)
            Text(c.sub, fontSize = 10.sp, color = Color(0xFF777777), maxLines = 2)
            Spacer(Modifier.height(2.dp))
            Text((ctaMap[c.name] ?: "Dekhein") + " →", fontSize = 11.sp, color = Color(c.color))
        }
    }
}

@Composable
fun SectionCard(
    title: String,
    items: List<Portal>,
    modifier: Modifier,
    onOpen: (Portal) -> Unit,
    onAll: () -> Unit
) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(8.dp)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Spacer(Modifier.height(4.dp))
            for (p in items) {
                Column(
                    Modifier
                        .fillMaxWidth()
                        .clickable { onOpen(p) }
                        .padding(vertical = 4.dp)
                ) {
                    Text(p.name, fontSize = 12.sp, fontWeight = FontWeight.Medium, maxLines = 2)
                    Text(p.note.ifEmpty { "Official site" }, fontSize = 10.sp, color = Color(0xFF777777))
                }
            }
            Text(
                "View All →",
                fontSize = 12.sp,
                color = Color(0xFFE53935),
                modifier = Modifier
                    .clickable { onAll() }
                    .padding(top = 4.dp)
            )
        }
    }
}

// ---------- Links list ----------

@Composable
fun LinksScreen(title: String, links: List<Portal>, onOpen: (Portal) -> Unit, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().background(Color(0xFFF5F7FB))) {
        Row(
            Modifier.fillMaxWidth().background(NAVY).padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) { Text("←", color = Color.White, fontSize = 20.sp) }
            Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        LazyColumn(Modifier.weight(1f).padding(8.dp)) {
            items(links) { p ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clickable { onOpen(p) },
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(p.name, fontWeight = FontWeight.SemiBold)
                            if (p.note.isNotEmpty()) Text(p.note, fontSize = 11.sp, color = Color(0xFF555555))
                            Text(Uri.parse(p.url).host ?: "", fontSize = 11.sp, color = Color(0xFF2E7D32))
                        }
                        Text("Kholo →", color = Color(0xFF1E88E5), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// ---------- AI chat ----------

data class Msg(val role: String, val text: String)

private val openRe = Regex("\\[OPEN:([^\\]]+)\\]")

private fun findPortal(text: String): Portal? {
    val m = openRe.find(text) ?: return null
    val n = m.groupValues[1].trim()
    return allPortals.firstOrNull { it.name.equals(n, true) }
        ?: allPortals.firstOrNull { it.name.contains(n, true) }
}

@Composable
fun ChatScreen(cfg: AiConfig, onOpen: (Portal) -> Unit, onSettings: () -> Unit, onBack: () -> Unit) {
    val msgs = remember {
        mutableStateListOf(
            Msg("assistant", "Namaste! Mai Narad AI hoon. Bataiye kaun sa sarkari kaam karna hai? (Yahan Aadhaar number, OTP ya password mat likhein.)")
        )
    }
    var input by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(msgs.size) {
        listState.animateScrollToItem(maxOf(0, msgs.size - 1))
    }

    fun send() {
        val t = input.trim()
        if (t.isEmpty() || busy) return
        if (cfg.key.isBlank()) {
            msgs.add(Msg("assistant", "Pehle ⚙ Settings me free AI key daalein."))
            return
        }
        msgs.add(Msg("user", t))
        input = ""
        busy = true
        val hist = msgs.drop(1).takeLast(10).map { it.role to it.text }
        Ai.chat(cfg, hist) { out, err ->
            busy = false
            msgs.add(Msg("assistant", out ?: ("Dikkat: " + err)))
        }
    }

    Column(Modifier.fillMaxSize().background(Color(0xFFF5F7FB))) {
        Row(
            Modifier.fillMaxWidth().background(NAVY).padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) { Text("←", color = Color.White, fontSize = 20.sp) }
            Text("Narad AI Assistant", color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            TextButton(onClick = onSettings) { Text("⚙", color = Color.White, fontSize = 20.sp) }
        }

        LazyColumn(Modifier.weight(1f).padding(8.dp), state = listState) {
            items(msgs) { m ->
                val mine = m.role == "user"
                val portal = if (mine) null else findPortal(m.text)
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 3.dp),
                    horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start
                ) {
                    Column(
                        Modifier
                            .background(
                                if (mine) Color(0xFFDCEBFF) else Color.White,
                                RoundedCornerShape(10.dp)
                            )
                            .padding(10.dp)
                    ) {
                        Text(openRe.replace(m.text, "").trim(), fontSize = 14.sp)
                        if (portal != null) {
                            Spacer(Modifier.height(6.dp))
                            Button(onClick = { onOpen(portal) }) { Text("Kholo: " + portal.name, fontSize = 12.sp) }
                        }
                    }
                }
            }
        }
        if (busy) Text("Narad AI soch raha hai…", fontSize = 12.sp, modifier = Modifier.padding(horizontal = 12.dp))

        Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                placeholder = { Text("Jaise: passport online karna hai") },
                modifier = Modifier.weight(1f),
                maxLines = 3
            )
            Spacer(Modifier.width(6.dp))
            Button(onClick = { send() }) { Text("Bhejo") }
        }
    }
}

// ---------- Settings (free AI API) ----------

@Composable
fun SettingsScreen(cfg: AiConfig, onBack: () -> Unit) {
    var key by remember { mutableStateOf(cfg.key) }
    var base by remember { mutableStateOf(cfg.base) }
    var model by remember { mutableStateOf(cfg.model) }
    var saved by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().background(Color(0xFFF5F7FB))) {
        Row(
            Modifier.fillMaxWidth().background(NAVY).padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) { Text("←", color = Color.White, fontSize = 20.sp) }
            Text("AI Settings", color = Color.White, fontWeight = FontWeight.Bold)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(12.dp)) {
            Text(
                "Testing ke liye free API. Key sirf is phone me save hoti hai. Asli app me key server par rakhni chahiye, app me nahi.",
                fontSize = 12.sp
            )
            Spacer(Modifier.height(8.dp))
            Text("Free key kahan se:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
            Text("Gemini: aistudio.google.com/apikey", fontSize = 12.sp)
            Text("Groq: console.groq.com/keys", fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                OutlinedButton(onClick = {
                    base = "https://generativelanguage.googleapis.com/v1beta/openai/"
                    model = "gemini-2.5-flash"
                }) { Text("Gemini (free)", fontSize = 12.sp) }
                OutlinedButton(onClick = {
                    base = "https://api.groq.com/openai/v1"
                    model = "openai/gpt-oss-120b"
                }) { Text("Groq (free)", fontSize = 12.sp) }
            }
            Spacer(Modifier.height(8.dp))

            OutlinedTextField(
                value = key,
                onValueChange = { key = it },
                label = { Text("API key") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = base,
                onValueChange = { base = it },
                label = { Text("Base URL") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = model,
                onValueChange = { model = it },
                label = { Text("Model naam") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(8.dp))
            Button(onClick = {
                cfg.key = key.trim()
                cfg.base = base.trim()
                cfg.model = model.trim()
                saved = true
            }, modifier = Modifier.fillMaxWidth()) { Text("Save") }
            if (saved) Text("Save ho gaya ✓", color = Color(0xFF2E7D32), modifier = Modifier.padding(top = 6.dp))

            Spacer(Modifier.height(10.dp))
            Text(
                "Dhyan: free API me aapki chat Google/Groq ke paas jaati hai aur wo use sudhar ke liye istemal kar sakte hain. Isliye chat me kabhi Aadhaar number, OTP, password ya bank detail na likhein. Model ka naam kabhi band ho jaye to yahan badal dein.",
                fontSize = 11.sp,
                color = Color(0xFFB00020)
            )
        }
    }
}

// ---------- Work screen (AI + portal) ----------


// ---------- Work screen: laptop jaisi puri website + side me AI ----------

const val DESKTOP_W = 1200

/** Website ko laptop jaisi chaudi (1200px) layout me dikhao aur screen me fit karo. */
fun viewportJs(widthDp: Float): String {
    val sc = widthDp / DESKTOP_W
    val s = String.format(Locale.US, "%.4f", sc)
    val mn = String.format(Locale.US, "%.4f", sc * 0.9f)
    return "(function(){function ap(){var m=document.querySelector('meta[name=viewport]');" +
        "var c='width=" + DESKTOP_W + ", initial-scale=" + s + ", minimum-scale=" + mn + ", maximum-scale=5, user-scalable=yes';" +
        "if(!m){if(!document.head)return;m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}" +
        "if(m.getAttribute('content')!==c)m.setAttribute('content',c);}" +
        "ap();window.__naradVpApply=ap;" +
        "if(!window.__naradVp){window.__naradVp=true;new MutationObserver(function(){window.__naradVpApply();})" +
        ".observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['content']});}})()"
}

@Composable
fun ChoiceRow(title: String, options: List<Pair<String, String>>, selected: String, onPick: (String) -> Unit) {
    Text(title, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        for ((v, l) in options) {
            val sel = selected == v
            OutlinedButton(
                onClick = { onPick(if (sel) "" else v) },
                colors = if (sel) ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFFDCEBFF)) else ButtonDefaults.outlinedButtonColors()
            ) { Text(l, fontSize = 11.sp) }
        }
    }
}

val CHOICE_SETS = listOf(
    Triple("gender", "Gender", listOf("male" to "Purush", "female" to "Mahila", "other" to "Anya")),
    Triple("category", "Category", listOf("general" to "General", "obc" to "OBC", "sc" to "SC", "st" to "ST", "ews" to "EWS")),
    Triple("marital", "Vaivahik sthiti", listOf("single" to "Avivahit", "married" to "Vivahit"))
)

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WorkScreen(portal: Portal, onExit: () -> Unit, onPickFile: (ValueCallback<Array<Uri>>) -> Unit) {
    val main = remember { Handler(Looper.getMainLooper()) }
    val alive = remember { booleanArrayOf(true) }
    val log = remember { mutableStateListOf<String>() }
    var netSlow by remember { mutableStateOf(false) }
    var paused by remember { mutableStateOf(false) }
    var speed by remember { mutableStateOf(60) }
    val svc = remember { svcFor(portal) }
    val startUrl = remember { svc?.direct?.takeIf { it.isNotBlank() } ?: portal.url }
    var currentUrl by remember { mutableStateOf(startUrl) }
    var urlText by remember { mutableStateOf(startUrl) }
    var webView by remember { mutableStateOf<WebView?>(null) }
    var webWpx by remember { mutableStateOf(0) }
    val density = LocalDensity.current.density

    // AI panel: details lene ke liye khulta hai, kaam shuru hote hi chhup jata hai,
    // website kuch naya maange to turant wapas aata hai
    var panelOpen by remember { mutableStateOf(true) }
    var lastDownload by remember { mutableStateOf<Saver.Saved?>(null) }
    var blobToken by remember { mutableStateOf("") }
    var retries by remember { mutableStateOf(0) }
    var stopped by remember { mutableStateOf(false) }      // user ne AI ko roka: ab AI khud nahi khulega
    var offeredSig by remember { mutableStateOf("") }
    var showAll by remember { mutableStateOf(true) }
    var needs by remember { mutableStateOf(listOf<JSONObject>()) }
    var lastNeedsSig by remember { mutableStateOf("") }
    val extra = remember { mutableStateMapOf<String, String>() }
    // Jo details user confirm kar chuka hai - agle pages par AI inhi se bharta hai
    var autoData by remember { mutableStateOf<JSONObject?>(null) }

    // Chat: AI ek ek karke poochhta hai, user chat me jawab deta hai
    val chat = remember { mutableStateListOf<Pair<String, String>>() }   // "ai" ya "me"
    var chatInput by remember { mutableStateOf("") }
    var lastAsked by remember { mutableStateOf("") }
    val chatState = rememberLazyListState()
    var split by remember { mutableStateOf(0.45f) }          // AI panel ki chaudai (screen ka hissa)
    val chatFiles = remember { mutableStateMapOf<Int, Saver.Saved>() }     // chat message number -> save hui file (receipt etc.)
    val docs = remember { mutableStateListOf<Doc>() }                      // chat me bheje document
    var pendingChooser by remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }
    var chooserAccept by remember { mutableStateOf(listOf<String>()) }
    var hasLogin by remember { mutableStateOf(false) }
    var hasReg by remember { mutableStateOf(false) }
    var humanNow by remember { mutableStateOf(false) }
    var wantKinds by remember { mutableStateOf(listOf<String>()) }       // page ko kaun se document chahiye
    var branchDone by remember { mutableStateOf(svc?.ask.isNullOrBlank()) }
    var authState by remember { mutableStateOf(0) }                        // 0 poochha nahi, 1 poochh liya, 2 tay
    var askedDocSig by remember { mutableStateOf("") }
    var humanShown by remember { mutableStateOf("") }

    // Bharti (job) link: pehle AI jaankari deta hai + details leta hai (phase 0),
    // phir seedha apply-form khulta hai, baaki page chhupa (phase 1). Baaki portal purane tarah (phase 2).
    // Ab har link par yahi flow: pehle AI (poori screen), phir sirf form
    var phase by remember { mutableStateOf(0) }
    var briefStarted by remember { mutableStateOf(false) }
    var formOnly by remember { mutableStateOf(true) }

    // Details sirf is screen ki memory me; bahar nikalte hi delete
    val fields = remember {
        mutableStateMapOf(
            "naam" to "", "pita" to "", "mata" to "", "janm" to "",
            "mobile" to "", "email" to "", "pata" to "", "pincode" to "", "gender" to "",
            "rajya" to "", "jila" to "", "category" to "", "marital" to ""
        )
    }
    val labels = listOf(
        "naam" to "Apna naam",
        "pita" to "Pita ka naam",
        "mata" to "Mata ka naam",
        "janm" to "Janm tithi (DD/MM/YYYY)",
        "mobile" to "Mobile number",
        "email" to "Email",
        "pata" to "Pata",
        "pincode" to "Pincode",
        "rajya" to "Rajya (jaise Bihar)",
        "jila" to "Jila"
    )

    fun say(m: String) {
        main.post {
            log.add(m)
            if (log.size > 40) log.removeAt(0)
        }
    }

    val ctx = LocalContext.current
    val landscape = LocalConfiguration.current.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
    val fillJs = remember { ctx.assets.open("fill.js").bufferedReader().use { it.readText() } }
    val briefJs = remember { ctx.assets.open("brief.js").bufferedReader().use { it.readText() } }
    val formOnlyJs = remember { ctx.assets.open("formonly.js").bufferedReader().use { it.readText() } }
    var formErrors by remember { mutableStateOf(listOf<String>()) }
    var pending by remember { mutableStateOf<JSONObject?>(null) }
    var declare by remember { mutableStateOf(false) }
    var reportJson by remember { mutableStateOf("") }

    // ---- Download: Aadhaar PDF, certificate, receipt - jo bhi website de ----
    fun finishDownload(r: Result<Saver.Saved>) {
        main.post {
            r.onSuccess { s ->
                lastDownload = s
                say("Download ho gaya: " + s.name)
                val sbm = StringBuilder("✔ Save ho gayi: " + s.name + "\nFiles > Downloads > NaradAI")
                if ((Uri.parse(currentUrl).host ?: "").contains("uidai") && s.mime.contains("pdf")) {
                    sbm.append("\nPDF password: naam ke 4 akshar (CAPITAL) + janm ka saal")
                }
                chat.add("ai" to sbm.toString())
                chatFiles[chat.size - 1] = s
            }.onFailure { e ->
                val msg = e.message ?: ""
                say(
                    if (msg == "html") "Website ne file seedha nahi di. Download button dobara dabayein ya website ka download page kholein."
                    else "Download nahi ho paya: " + msg.take(80)
                )
            }
        }
    }

    fun startDownload(url: String, ua: String?, cd: String?, mime: String?) {
        val ref = currentUrl
        val appCtx = ctx.applicationContext
        say("Download shuru ho raha hai…")
        when {
            url.startsWith("blob:") -> {
                val tok = java.util.UUID.randomUUID().toString()
                blobToken = tok
                val nm = URLUtil.guessFileName(url, cd, mime)
                val js = "(function(u,n,k){try{var x=new XMLHttpRequest();x.open('GET',u,true);x.responseType='blob';" +
                    "x.onload=function(){var r=new FileReader();r.onloadend=function(){var s=String(r.result||'');" +
                    "window.NaradBridge.saveBlob(s.substring(s.indexOf(',')+1),(x.response&&x.response.type)||'',n,k)};r.readAsDataURL(x.response)};" +
                    "x.onerror=function(){window.NaradBridge.status('Download nahi ho paya')};x.send()}" +
                    "catch(e){window.NaradBridge.status('Download nahi ho paya')}})(" +
                    JSONObject.quote(url) + "," + JSONObject.quote(nm) + "," + JSONObject.quote(tok) + ")"
                webView?.evaluateJavascript(js, null)
            }
            url.startsWith("data:") -> Thread {
                finishDownload(runCatching { Saver.saveDataUrl(appCtx, url, URLUtil.guessFileName("", cd, mime)) })
            }.start()
            url.startsWith("https://") -> Thread {
                finishDownload(runCatching { Saver.fetch(appCtx, url, ua, ref, cd, mime) })
            }.start()
            else -> say("Ye download link app me nahi chalega.")
        }
    }

    fun onBlobSaved(b64: String, mime: String, name: String, token: String) {
        // Sirf wahi blob jo humne khud maangi thi, ek hi baar
        if (token.isEmpty() || token != blobToken || b64.length > 85_000_000) return
        blobToken = ""
        val appCtx = ctx.applicationContext
        Thread { finishDownload(runCatching { Saver.saveBase64(appCtx, b64, mime, name) }) }.start()
    }

    fun inject(data: JSONObject) {
        webView?.evaluateJavascript(
            fillJs.replace("__SPEED__", speed.toString()).replace("__DATA__", data.toString()),
            null
        )
    }

    fun applyViewport(v: WebView?) {
        if (v == null || webWpx <= 0) return
        v.evaluateJavascript(viewportJs(webWpx / density), null)
    }

    // Website ne kuch aisa maanga jo AI ke paas nahi: panel wapas khulta hai
    fun handleNeeds(j: String) {
        if (stopped) return
        val arr = try { JSONArray(j) } catch (e: Exception) { JSONArray() }
        val list = (0 until arr.length()).map { arr.getJSONObject(it) }
        needs = list
        val sig = list.joinToString("|") { it.optString("key") + it.optString("id") }
        if (list.isNotEmpty() && sig != lastNeedsSig) {
            showAll = false
            panelOpen = true
            say("AI ko aapse kuch poochhna hai")
        }
        lastNeedsSig = sig
    }

    fun startFill() {
        if (phase != 0 && !isAllowed(currentUrl)) {
            say("AI sirf sarkari site par bharta hai. Yahan aap khud bharein.")
            return
        }
        val (data, errs) = validateFields(fields)
        formErrors = errs
        if (errs.isNotEmpty()) {
            say("Details me galti hai. Pehle theek karein.")
            return
        }
        if (data.length() == 0) {
            say("Pehle apni details bharein.")
            return
        }
        if (declare) data.put("__declare", true)
        pending = data
    }

    // Website ke naye sawaalon ke jawab bhejna
    fun sendNeeds() {
        if (!isAllowed(currentUrl)) {
            say("AI sirf sarkari site par bharta hai. Yahan aap khud bharein.")
            return
        }
        val (data, errs) = validateFields(fields)
        val ex = JSONObject()
        val exErrs = mutableListOf<String>()
        for (n in needs) {
            val id = n.optString("id")
            if (id.isBlank()) continue
            var v = (extra[id] ?: "").trim().replace(Regex("[\\u0000-\\u001F]"), " ")
            if (v.isEmpty()) continue
            if (v.length > 120) v = v.substring(0, 120)
            if (n.optString("kind") == "date") {
                val (d, e) = validateFields(mapOf("janm" to v))
                if (e.isNotEmpty() || !d.has("janm")) { exErrs.add(n.optString("label") + ": DD/MM/YYYY me likhein."); continue }
                v = d.getString("janm")
            }
            ex.put(id, v)
        }
        formErrors = errs + exErrs
        if (formErrors.isNotEmpty()) {
            say("Details me galti hai. Pehle theek karein.")
            return
        }
        if (data.length() == 0 && ex.length() == 0) {
            say("Pehle jawab dein.")
            return
        }
        if (declare) data.put("__declare", true)
        if (ex.length() > 0) data.put("__extra", ex)
        pending = data
    }

    fun runFill(data: JSONObject) {
        paused = false
        reportJson = ""
        formErrors = emptyList()
        // Agle pages ke liye sirf pakki details yaad rakho (extra jawab us page ke the)
        val keep = JSONObject(data.toString())
        keep.remove("__extra")
        autoData = keep
        extra.clear()
        panelOpen = false              // kaam shuru: AI chhup jao, puri website dikhao
        chat.add("ai" to "Form bhar raha hoon…")
        inject(data)
    }

    fun go() {
        var u = urlText.trim()
        if (u.startsWith("http://")) u = "https://" + u.removePrefix("http://")
        else if (!u.startsWith("https://")) u = "https://" + u
        if (!Regex("^https://[^\\s/]+\\.[^\\s/]+.*$").matches(u)) {
            say("Sahi website address likhein.")
            return
        }
        webView?.loadUrl(u)
    }

    // ---------- Chat ----------
    fun unanswered(n: JSONObject): Boolean =
        if (n.optString("kind") == "known") (fields[n.optString("key")] ?: "").isBlank()
        else (extra[n.optString("id")] ?: "").isBlank()

    fun missingNeeds(): List<JSONObject> = needs.filter { unanswered(it) }

    // Page par jo box zaroori (*) lage wahi 'zaroori'; baaki optional (AI andaza nahi lagata, page ke hisaab se)
    fun isReq(n: JSONObject): Boolean = n.optBoolean("req", true)
    fun missingRequired(): List<JSONObject> = needs.filter { unanswered(it) && isReq(it) }

    fun needLabel(n: JSONObject): String {
        if (n.optString("kind") == "known") {
            return when (n.optString("key")) {
                "naam" -> "Aapka naam"
                "pita" -> "Pita ka naam"
                "mata" -> "Mata ka naam"
                "janm" -> "Janm tithi"
                "mobile" -> "Mobile number"
                "email" -> "Email"
                "pata" -> "Pata"
                "pincode" -> "Pincode"
                "rajya" -> "Rajya"
                "jila" -> "Jila"
                "gender" -> "Gender"
                "category" -> "Category"
                "marital" -> "Vaivahik sthiti"
                else -> n.optString("label")
            }
        }
        return n.optString("label")
    }

    fun optsOf(n: JSONObject): List<Pair<String, String>> {
        if (n.optString("kind") == "known") {
            return CHOICE_SETS.firstOrNull { it.first == n.optString("key") }?.third ?: emptyList()
        }
        if (n.optString("kind") == "select") {
            val a = n.optJSONArray("options") ?: JSONArray()
            return (0 until a.length()).map { a.getString(it) to a.getString(it) }
        }
        return emptyList()
    }

    fun templateLine(n: JSONObject): String {
        val hint = when (if (n.optString("kind") == "known") n.optString("key") else "") {
            "janm" -> " (DD/MM/YYYY)"
            "gender" -> " (purush/mahila)"
            "marital" -> " (avivahit/vivahit)"
            "category" -> " (general/obc/sc/st/ews)"
            else -> ""
        }
        return needLabel(n) + hint + (if (isReq(n)) "" else " (optional)") + ": "
    }

    fun template(list: List<JSONObject>): String = list.joinToString("\n") { templateLine(it) }

    fun pickChoice(opts: List<Pair<String, String>>, text: String): String? {
        val t = text.trim().lowercase()
        if (t.isEmpty()) return null
        val alias = mapOf(
            "m" to "male", "man" to "male", "ladka" to "male", "f" to "female", "woman" to "female", "ladki" to "female",
            "unmarried" to "single", "shadishuda" to "married", "shaadishuda" to "married", "gen" to "general", "ur" to "general"
        )
        val al = alias[t]
        for ((v, l) in opts) {
            if (t == v.lowercase() || t == l.lowercase()) return v
            if (al != null && al == v.lowercase()) return v
        }
        if (t.length >= 3) {
            val hit = opts.firstOrNull { it.second.lowercase().contains(t) }
            if (hit != null) return hit.first
        }
        return null
    }

    // Jawab sahi ho to save karo aur null do; galat ho to galti ka message do
    fun tryAnswer(q: JSONObject, raw: String): String? {
        val t = raw.trim().replace(Regex("[\\u0000-\\u001F]"), " ")
        if (t.isEmpty()) return "Khali hai."
        val kind = q.optString("kind")
        if (kind == "known") {
            val key = q.optString("key")
            val set = CHOICE_SETS.firstOrNull { it.first == key }
            if (set != null) {
                val v = pickChoice(set.third, t) ?: return "samajh nahi aaya (" + set.third.joinToString("/") { it.second } + " me se likhiye)"
                fields[key] = v
                return null
            }
            val m = mutableMapOf(key to t)
            if (key == "jila") m["rajya"] = fields["rajya"] ?: ""
            val (d, errs) = validateFields(m)
            if (errs.isNotEmpty()) return errs.first()
            if (!d.has(key)) return "samajh nahi aaya, dobara likhiye"
            fields[key] = t
            return null
        }
        val id = q.optString("id")
        when (kind) {
            "date" -> {
                val (d, errs) = validateFields(mapOf("janm" to t))
                if (errs.isNotEmpty() || !d.has("janm")) return "DD/MM/YYYY me likhiye, jaise 15/08/1998"
                extra[id] = t
            }
            "select" -> {
                val v = pickChoice(optsOf(q), t) ?: return "samajh nahi aaya, option me se chuniye"
                extra[id] = v
            }
            else -> extra[id] = if (t.length > 120) t.substring(0, 120) else t
        }
        return null
    }

    fun norm(x: String): String = x.replace(Regex("\\(.*?\\)"), " ").lowercase()
        .replace(Regex("[^a-z ]"), " ").replace(Regex("\\s+"), " ").trim()

    fun aliasesOf(n: JSONObject): List<String> {
        val own = norm(n.optString("label"))
        if (n.optString("kind") != "known") return listOf(own)
        val a = when (n.optString("key")) {
            "naam" -> listOf("naam", "name", "apna naam", "aapka naam", "full name", "poora naam", "pura naam", "my name")
            "pita" -> listOf("pita", "pita ka naam", "pitaji", "pitaji ka naam", "father", "father name", "fathers name", "father s name")
            "mata" -> listOf("mata", "mata ka naam", "mataji", "mataji ka naam", "mother", "mother name", "mothers name", "mother s name")
            "janm" -> listOf("janm", "janm tithi", "janam tithi", "dob", "date of birth", "birth date")
            "mobile" -> listOf("mobile", "mobile number", "mobile no", "phone", "phone number", "number")
            "email" -> listOf("email", "email id", "mail", "e mail")
            "pata" -> listOf("pata", "address", "pura pata", "poora pata")
            "pincode" -> listOf("pincode", "pin code", "pin")
            "rajya" -> listOf("rajya", "state")
            "jila" -> listOf("jila", "zila", "district")
            "gender" -> listOf("gender", "ling")
            "category" -> listOf("category", "varg")
            "marital" -> listOf("vaivahik sthiti", "vaivahik", "marital status", "marital")
            else -> emptyList()
        }
        return a + own
    }

    // Ek message me kai details: "label: value" line se; mobile/email/DOB/pincode bina label ke bhi pakad leta hai
    fun parseBulk(text: String, list: List<JSONObject>): Map<Int, String> {
        val out = mutableMapOf<Int, String>()
        for (line in text.split("\n")) {
            val ix = line.indexOfFirst { it == ':' || it == '=' }
            if (ix <= 0) continue
            val lab = norm(line.substring(0, ix))
            val v = line.substring(ix + 1).trim()
            if (lab.isEmpty() || v.isEmpty()) continue
            val hit = list.indexOfFirst { n -> aliasesOf(n).any { it == lab } }
            if (hit >= 0 && !out.containsKey(hit)) out[hit] = v
        }
        fun idxOfKey(k: String) = list.indexOfFirst { it.optString("kind") == "known" && it.optString("key") == k }
        var rest = text
        val mi = idxOfKey("mobile")
        if (mi >= 0 && !out.containsKey(mi)) {
            val m = Regex("(?<!\\d)(?:\\+?91[\\s-]?)?[6-9]\\d{9}(?!\\d)").find(rest)
            if (m != null) { out[mi] = m.value; rest = rest.replace(m.value, " ") }
        }
        val ei = idxOfKey("email")
        if (ei >= 0 && !out.containsKey(ei)) {
            val m = Regex("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}").find(rest)
            if (m != null) out[ei] = m.value
        }
        val di = idxOfKey("janm")
        if (di >= 0 && !out.containsKey(di)) {
            val m = Regex("(?<!\\d)\\d{1,2}[/.\\-]\\d{1,2}[/.\\-]\\d{4}(?!\\d)").find(rest)
            if (m != null) out[di] = m.value
        }
        val pi = idxOfKey("pincode")
        if (pi >= 0 && !out.containsKey(pi)) {
            val m = Regex("(?<!\\d)[1-9]\\d{5}(?!\\d)").find(rest)
            if (m != null) out[pi] = m.value
        }
        return out
    }

    // Jawab lene ke baad AI batata hai: kya mila, kya galat, kya reh gaya
    fun replyAfter(errs: List<Pair<String, String>>) {
        val miss = missingRequired()
        val errLabels = errs.map { it.first }.toSet()
        val sb = StringBuilder()
        if (errs.isNotEmpty()) {
            sb.append("Galti:")
            for ((l, m) in errs) sb.append("\n❌ " + l + ": " + m)
        }
        val left = miss.filter { needLabel(it) !in errLabels }
        if (left.isNotEmpty()) {
            if (sb.isNotEmpty()) sb.append("\n\n")
            sb.append("Ye bhi bhejiye:")
            for (n in left) sb.append("\n• " + needLabel(n))
        }
        if (miss.isEmpty()) {
            sb.append("Sab mil gaya. Confirm kijiye.")
        } else if (chatInput.isBlank()) {
            chatInput = template(miss)
        }
        chat.add("ai" to sb.toString())
    }

    fun sendChat(raw: String) {
        val t = raw.trim()
        if (t.isEmpty()) return
        chat.add("me" to t)
        if ((!branchDone && svc != null) || authState == 1) { chat.add("ai" to "Pehle neeche se chuniye."); return }
        val miss = missingNeeds()
        val reqLeft = miss.filter { isReq(it) }
        if (miss.isNotEmpty()) {
            val found = parseBulk(t, miss).toMutableMap()
            // Sirf ek zaroori cheez baaki ho aur label na likha ho: poora text hi uska jawab hai
            if (found.isEmpty() && miss.size == 1 && reqLeft.size == 1 && !t.contains("\n")) found[0] = t
            if (found.isEmpty() && reqLeft.isNotEmpty()) {
                chat.add("ai" to "Samajh nahi aaya. Aise bhejiye:\n" + template(reqLeft))
                if (chatInput.isBlank()) chatInput = template(reqLeft)
                return
            }
            if (found.isNotEmpty()) {
                val errs = mutableListOf<Pair<String, String>>()
                for ((i, v) in found) {
                    val e = tryAnswer(miss[i], v)
                    if (e != null) errs.add(needLabel(miss[i]) to e)
                }
                replyAfter(errs)
                return
            }
        }
        if (pending != null) {
            chat.add("ai" to "Pehle confirm kijiye.")
            return
        }
        if (phase == 0) {
            startFill()
            return
        }
        if (!isAllowed(currentUrl)) {
            chat.add("ai" to "Ye sarkari site nahi hai. Yahan AI nahi bharega.")
            return
        }
        stopped = false
        lastNeedsSig = ""
        chat.add("ai" to "Theek hai, page dekh raha hoon…")
        inject(autoData ?: JSONObject().put("__scan", true))
    }

    // ---------- Document bhejna (chat se) ----------
    var pendingDoc by remember { mutableStateOf<Doc?>(null) }       // abhi kind chunna baaki
    var autoUpload by remember { mutableStateOf(true) }
    var uploadBusy by remember { mutableStateOf(false) }
    val uploadedOn = remember { mutableStateListOf<String>() }
    val uploadJs = remember { ctx.assets.open("upload.js").bufferedReader().use { it.readText() } }

    val attachPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        if (uri != null) {
            val cr = ctx.contentResolver
            var nm = "document"
            var sz = -1L
            try {
                cr.query(uri, null, null, null, null)?.use { c ->
                    if (c.moveToFirst()) {
                        val ni = c.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        val si = c.getColumnIndex(android.provider.OpenableColumns.SIZE)
                        if (ni >= 0) nm = c.getString(ni) ?: nm
                        if (si >= 0 && !c.isNull(si)) sz = c.getLong(si)
                    }
                }
            } catch (e: Exception) { }
            val mime = cr.getType(uri) ?: ""
            when {
                !(mime.startsWith("image/") || mime == "application/pdf") ->
                    chat.add("ai" to "Sirf photo ya PDF chalega.")
                sz > 20L * 1024 * 1024 ->
                    chat.add("ai" to "File 20 MB se badi hai.")
                else -> {
                    val want = wantKinds.filter { k -> docs.none { it.kind == k } }
                    chat.add("me" to "📎 " + nm)
                    if (want.size == 1) {
                        docs.add(Doc(uri, nm, mime, sz, want[0]))
                        chat.add("ai" to "Theek hai. " + kindLabel(want[0]) + " daal dunga.")
                    } else {
                        pendingDoc = Doc(uri, nm, mime, sz)
                        chat.add("ai" to "Ye kaun sa document hai?")
                    }
                }
            }
        }
    }

    fun sendDoc(d: Doc) {
        val cb = pendingChooser ?: return
        pendingChooser = null
        cb.onReceiveValue(arrayOf(d.uri))
        chat.add("ai" to "📤 " + d.name + " daal di.")
    }

    fun cancelChooser() {
        pendingChooser?.onReceiveValue(null)
        pendingChooser = null
        chat.add("ai" to "Theek hai, file nahi bheji.")
    }

    fun galleryChooser() {
        val cb = pendingChooser ?: return
        pendingChooser = null
        onPickFile(cb)
    }

    // Receipt agar page par dikhti hai (download nahi hoti): page ko PDF bana kar phone me save karo
    fun savePagePdf() {
        val w = webView ?: return
        try {
            val pm = ctx.getSystemService(android.content.Context.PRINT_SERVICE) as android.print.PrintManager
            val nm = "NaradAI_receipt"
            pm.print(nm, w.createPrintDocumentAdapter(nm), android.print.PrintAttributes.Builder().build())
            chat.add("ai" to "Print box me 'PDF save' chuniye.")
        } catch (e: Exception) {
            chat.add("ai" to "PDF nahi bana.")
        }
    }

    // ---------- Document apne-aap upload ----------
    fun uploadScript(d: Doc, probe: Boolean): String =
        uploadJs.replace("__KIND__", JSONObject.quote(d.kind))
            .replace("__MIME__", JSONObject.quote(d.mime))
            .replace("__PROBE__", probe.toString())
            .replace("__NAME__", JSONObject.quote(d.name))

    fun runUpload(script: String, cb: (String) -> Unit) {
        webView?.evaluateJavascript(script) { r ->
            cb(try { (org.json.JSONTokener(r ?: "").nextValue() as? String) ?: "" } catch (e: Exception) { "" })
        }
    }

    fun uploadOne(d: Doc) {
        val key = d.name + "|" + d.kind + "|" + currentUrl
        if (key in uploadedOn || uploadBusy) return
        uploadBusy = true
        runUpload(uploadScript(d, true)) { pr ->
            if (pr != "found") { uploadBusy = false; return@runUpload }
            uploadedOn.add(key)
            if (d.size > 5L * 1024 * 1024 || d.size < 0) {
                uploadBusy = false
                chat.add("ai" to "📎 " + d.name + " 5 MB se badi hai. Chhoti bhejiye.")
                return@runUpload
            }
            val appCtx = ctx.applicationContext
            Thread {
                val b64 = try {
                    appCtx.contentResolver.openInputStream(d.uri)?.use { android.util.Base64.encodeToString(it.readBytes(), android.util.Base64.NO_WRAP) }
                } catch (e: Exception) { null }
                main.post {
                    if (b64 == null) {
                        uploadBusy = false
                        chat.add("ai" to "📎 " + d.name + " padh nahi paya. Dobara bhejiye.")
                    } else {
                        webView?.evaluateJavascript("window.__nb=''", null)
                        for (c in b64.chunked(300_000)) webView?.evaluateJavascript("window.__nb+='" + c + "'", null)
                        runUpload(uploadScript(d, false)) { r ->
                            uploadBusy = false
                            if (r.startsWith("ok:")) {
                                chat.add("ai" to "📤 " + kindLabel(d.kind) + " daal diya.")
                            } else {
                                chat.add("ai" to "📎 " + d.name + " upload nahi hua. Khud kar lein.")
                            }
                        }
                    }
                }
            }.start()
        }
    }

    fun autoUploadAll() {
        if (!autoUpload || docs.isEmpty() || pendingDoc != null || pendingChooser != null || !isAllowed(currentUrl)) return
        for (d in docs.toList()) {
            if (d.kind == "other" || d.kind.isEmpty()) continue
            uploadOne(d)
        }
    }

    LaunchedEffect(Unit) {
        while (true) {
            delay(3000)
            autoUploadAll()
        }
    }

    // ---------- Pehle ek sawaal (jaise IRCTC account hai ya nahi) ----------
    var pwCount by remember { mutableStateOf(0) }
    var pwInput by remember { mutableStateOf("") }
    val secretJs = remember { ctx.assets.open("secret.js").bufferedReader().use { it.readText() } }

    fun clickWithRetry(txts: List<String>, n: Int) {
        val arr = JSONArray()
        for (x in txts) arr.put(x.lowercase())
        val js = "(function(){var T=" + arr.toString() + ";var els=[].slice.call(document.querySelectorAll('a,button,span,li'));for(var i=0;i<els.length;i++){var e=els[i];var x=(e.innerText||'').trim().toLowerCase();if(T.indexOf(x)>=0){var r=e.getBoundingClientRect();if(r.width>0&&r.height>0){e.click();return 'ok';}}}return 'none';})()"
        webView?.evaluateJavascript(js) { r ->
            if ((r ?: "").contains("ok")) {
                main.postDelayed({ lastNeedsSig = ""; inject(autoData ?: JSONObject().put("__scan", true)) }, 1800)
            } else if (n > 0) {
                main.postDelayed({ clickWithRetry(txts, n - 1) }, 2000)
            }
        }
    }

    fun chooseBranch(yes: Boolean) {
        val sv = svc ?: return
        branchDone = true
        chat.add("me" to (if (yes) sv.yesLabel else sv.noLabel))
        val u = if (yes) sv.yesUrl else sv.noUrl
        if (u.isNotBlank()) webView?.loadUrl(u)
        chat.add("ai" to (if (yes) sv.yesSay else sv.noSay))
        val c = if (yes) sv.yesClick else sv.noClick
        if (c.isNotBlank()) main.postDelayed({ clickWithRetry(listOf(c), 4) }, if (u.isNotBlank()) 3500L else 800L)
    }

    // Password: alag masked box. Chat me ya AI ko nahi jata, kahin save nahi hota, sirf site ke box me jata hai
    val pageJs = remember { ctx.assets.open("page.js").bufferedReader().use { it.readText() } }
    fun probePassword() {
        if (!isAllowed(currentUrl)) { pwCount = 0; wantKinds = emptyList(); return }
        runUpload(pageJs) { r ->
            try {
                val o = JSONObject(r)
                pwCount = o.optInt("pw", 0)
                hasLogin = o.optBoolean("login", false)
                hasReg = o.optBoolean("reg", false)
                humanNow = o.optBoolean("human", false)
                val fa = o.optJSONArray("files") ?: JSONArray()
                wantKinds = (0 until fa.length()).map { fa.getString(it) }
            } catch (e: Exception) { }
        }
    }

    // Kisi bhi site par: login ya registration ho to pehle poochho (Haan / Nahi / Zaroorat nahi)
    fun chooseAuth(which: Int) {
        authState = 2
        chat.add("me" to (if (which == 0) "Haan hai" else if (which == 1) "Nahi hai" else "Zaroorat nahi"))
        if (which == 2) { chat.add("ai" to "Theek hai."); return }
        if (which == 0) {
            chat.add("ai" to "Theek hai. Login ke liye jo chahiye wo bataunga.")
            if (pwCount == 0) clickWithRetry(listOf("login", "log in", "sign in", "user login", "citizen login"), 4)
        } else {
            chat.add("ai" to "Theek hai, account banate hain. Jo chahiye wo bataunga.")
            clickWithRetry(listOf("register", "sign up", "new user", "create account", "new registration", "registration", "user registration"), 4)
        }
    }

    fun putPassword() {
        val v = pwInput
        pwInput = ""
        if (v.isEmpty() || !isAllowed(currentUrl)) return
        runUpload(secretJs.replace("__PROBE__", "false").replace("__VALUE__", JSONObject.quote(v))) { r ->
            chat.add("ai" to (if (r.startsWith("ok:") && r != "ok:0") "🔑 Password daal diya." else "Password ka box nahi mila."))
        }
    }

    LaunchedEffect(Unit) {
        while (true) {
            delay(3000)
            probePassword()
        }
    }
    LaunchedEffect(pwCount, hasLogin, hasReg, branchDone, needs.size) {
        delay(2500)
        if (authState == 0 && branchDone && svc?.ask.isNullOrBlank() && isAllowed(currentUrl) &&
            needs.isEmpty() && (pwCount > 0 || hasLogin || hasReg)) {
            authState = 1
            chat.add("ai" to "Is site par login / registration hai.\nAapka account hai?")
            panelOpen = true
        }
    }
    LaunchedEffect(wantKinds) {
        val need = wantKinds.filter { k -> docs.none { it.kind == k } }
        val sig = need.joinToString(",")
        if (need.isNotEmpty() && sig != askedDocSig && branchDone) {
            askedDocSig = sig
            chat.add("ai" to "Is page ko ye document chahiye:\n" + need.joinToString("\n") { "• " + kindLabel(it) } + "\nNeeche 📎 se bhejiye.")
            panelOpen = true
        }
    }
    LaunchedEffect(humanNow) {
        delay(1500)
        if (humanNow && humanShown != currentUrl && missingRequired().isEmpty() && isAllowed(currentUrl)) {
            humanShown = currentUrl
            chat.add("ai" to "🔒 Captcha / OTP aap bharein.")
            panelOpen = true
        }
    }
    LaunchedEffect(pwCount > 0) {
        if (pwCount > 0) {
            chat.add("ai" to "Password ka box mila.\nNeeche masked box me likhiye.\nYe sirf site me jayega, save nahi hoga.")
            panelOpen = true
        }
    }

    // Is page par jo likha hai (umar, height, documents, fees, chhoot) AI padhkar batata hai
    val aiCfg = remember { AiConfig(ctx.getSharedPreferences("narad_cfg", android.content.Context.MODE_PRIVATE)) }
    fun parseBrief(r: String?): Pair<String, List<Pair<String, String>>> {
        return try {
            val str = (org.json.JSONTokener(r ?: "").nextValue() as? String) ?: ""
            val o = JSONObject(str)
            val a = o.optJSONArray("links") ?: JSONArray()
            Pair(o.optString("text"), (0 until a.length()).map { i -> a.getJSONObject(i).let { x -> x.optString("t") to x.optString("u") } })
        } catch (e: Exception) { Pair("", emptyList()) }
    }

    // Phase 0: notification padhkar AI batata hai (date, fees, documents), phir zaroori details maangta hai
    fun startBrief() {
        if (briefStarted) return
        briefStarted = true
        needs = listOf(
            "naam" to true, "pita" to true, "mata" to true, "janm" to true, "gender" to true,
            "category" to true, "mobile" to true, "email" to true, "rajya" to true, "jila" to true,
            "pincode" to false, "pata" to false
        ).map { (k, r) -> JSONObject().put("key", k).put("kind", "known").put("label", k).put("req", r) }
        fun askDetails() {
            val req = needs.filter { isReq(it) }
            val opt = needs.filter { !isReq(it) }
            val sb = StringBuilder("Form bharne ke liye ye details chahiye:\n\nZaroori:")
            for (n in req) sb.append("\n• " + needLabel(n))
            sb.append("\n\nOptional:")
            for (n in opt) sb.append("\n• " + needLabel(n))
            sb.append("\n\nSab ek saath bhej dijiye. Sab milte hi main seedha form khol dunga.")
            chat.add("ai" to sb.toString())
            if (chatInput.isBlank()) chatInput = template(req + opt)
        }
        if (portal.note.isNotBlank()) chat.add("ai" to portal.name + "\n" + portal.note.removePrefix("🆕 "))
        // Details ka sawaal turant: AI / net na chale tab bhi form ka kaam ruke nahi
        askDetails()
        say("Page padh raha hoon…")
        webView?.evaluateJavascript(briefJs) { r ->
            val (txt, _) = parseBrief(r)
            if (txt.isBlank()) {
                chat.add("ai" to "Page ka text nahi mila (page abhi khul raha ho sakta hai). Jaankari official site par dekhein.")
            } else {
                say("AI jaankari nikal raha hai…")
                val prompt = "Neeche ek bharti (naukri) page ka text hai. Sirf is bharti (" + portal.name + ") ke baare me, sirf wahi batao jo text me likha ho: " +
                    "post ka naam, kul vacancy, form shuru aur aakhri tareekh, fees (category wise), umar seema, yogyata, " +
                    "form ke liye kaun se documents (photo, sign, certificate) lagenge. " +
                    "Jo cheez text me na ho uske aage 'page me nahi mila, official site dekhein' likho. Andaza bilkul mat lagao. " +
                    "Hinglish me chhote bullet me likho, har bullet 1 line, bina ** # ya emoji ke.\n\nPage text:\n" + txt
                Ai.chat(aiCfg, listOf("user" to prompt)) { out, err ->
                    val clean = (out ?: "").replace(Regex("\\[OPEN:[^\\]]*\\]"), "").trim()
                    chat.add("ai" to (
                        if (clean.isNotEmpty()) "Jaankari:\n" + clean
                        else "AI se jaankari nahi mili: " + (err ?: "jawab khali") + "\n(AI key / internet check karein. Details aap upar wale sawaal ke hisaab se bhej sakte hain.)"
                    ))
                    say(if (clean.isNotEmpty()) "Jaankari taiyar" else "AI chalu nahi hua")
                }
            }
        }
    }

    // Phase 0 -> 1: details mil gayi. Apply-form ka link dhoondho, seedha kholo, baaki page chhupao
    fun beginForm(data: JSONObject) {
        val keep = JSONObject(data.toString())
        keep.remove("__extra")
        autoData = keep
        needs = emptyList()
        lastNeedsSig = ""
        lastAsked = ""
        offeredSig = ""
        extra.clear()
        chat.clear()
        chat.add("ai" to "Form khol raha hoon. Jo naya maangega wahi aapse poochhunga.")
        phase = 1
        panelOpen = false
        stopped = false
        webView?.evaluateJavascript(briefJs) { r ->
            val links = parseBrief(r).second
            val pick = links.firstOrNull { isAllowed(it.second) } ?: links.firstOrNull()
            if (pick != null) {
                say("Apply form khul raha hai…")
                webView?.loadUrl(pick.second)
            } else {
                say("Direct form link nahi mila, isi page par dhoondh raha hoon")
                webView?.evaluateJavascript(formOnlyJs, null)
                if (isAllowed(currentUrl)) inject(keep)
            }
        }
    }

    LaunchedEffect(Unit) {
        // Page dheere khule to bhi AI jaankari shuru kare
        delay(4000)
        if (phase == 0 && !briefStarted) startBrief()
    }

    fun askPageInfo() {
        if (fields.values.any { it.isNotBlank() } || extra.values.any { it.isNotBlank() }) {
            chat.add("ai" to "Details bhar chuki hain, isliye page AI ko nahi bheja.")
            return
        }
        if (!isAllowed(currentUrl)) {
            chat.add("ai" to "Ye sarkari site nahi hai.")
            return
        }
        chat.add("ai" to "Page padh raha hoon…")
        webView?.evaluateJavascript("(function(){return document.body?document.body.innerText.slice(0,6000):''})()") { r ->
            val txt = try { (org.json.JSONTokener(r ?: "").nextValue() as? String) ?: "" } catch (e: Exception) { "" }
            if (txt.isBlank()) {
                chat.add("ai" to "Page ka text nahi mila.")
            } else {
                val prompt = "Neeche ek sarkari website page ka text hai. Sirf wahi batao jo is text me likha hai: " +
                    "kaun apply kar sakta hai (umar, height, yogyata), kaun se documents lagenge, kitni fees, kya chhoot, aakhri tareekh. " +
                    "Jo cheez text me na ho uske aage 'page me nahi mila, official site dekhein' likho. Andaza bilkul mat lagao. " +
                    "Hinglish me chhote bullet me likho, har bullet 1 line, bina ** ya #.\n\nPage text:\n" + txt
                Ai.chat(aiCfg, listOf("user" to prompt)) { out, err ->
                    val clean = (out ?: "").replace(Regex("\\[OPEN:[^\\]]*\\]"), "").trim()
                    chat.add("ai" to (if (clean.isNotEmpty()) clean else (err ?: "AI se jawab nahi mila.")))
                }
            }
        }
    }

    // Naya form dikha: AI poori list ek saath batata hai aur format bhi bhar deta hai
    val needSig = needs.joinToString("|") { it.optString("key") + it.optString("id") }
    LaunchedEffect(needSig) {
        if (phase == 0 || needSig.isEmpty() || needSig == lastAsked) return@LaunchedEffect
        val m = missingRequired()
        val opt = missingNeeds().filter { !isReq(it) }
        if (m.isEmpty() && opt.isEmpty()) return@LaunchedEffect
        lastAsked = needSig
        val sb = StringBuilder("Is form ke liye:")
        if (m.isNotEmpty()) {
            sb.append("\n\nZaroori:")
            for (n in m) sb.append("\n• " + needLabel(n))
        } else {
            sb.append("\n\nZaroori kuch nahi.")
        }
        if (opt.isNotEmpty()) {
            sb.append("\n\nOptional:")
            for (n in opt) sb.append("\n• " + needLabel(n))
        }
        if (m.isNotEmpty()) sb.append("\n\nSab ek saath bhej dijiye.")
        chat.add("ai" to sb.toString())
        if (chatInput.isBlank() && (m.isNotEmpty() || opt.isNotEmpty())) chatInput = template(m + opt)
    }
    LaunchedEffect(Unit) {
        if (phase != 0) chat.add("ai" to "Namaste! Form main khud bharunga.\nPehle jo chahiye wo bataunga.")
        val si = svc?.info ?: ""
        if (si.isNotBlank()) chat.add("ai" to si + "\n\nFees site par dekh lein.")
        val ak = svc?.ask ?: ""
        if (ak.isNotBlank()) chat.add("ai" to ak)
    }
    LaunchedEffect(Unit) {
        // Phone seedha hi rahe: AI aur website left-right bantenge, phone ghumega nahi
        (ctx as? Activity)?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }
    LaunchedEffect(chat.size) {
        if (chat.isNotEmpty()) chatState.animateScrollToItem(chat.size - 1)
    }
    LaunchedEffect(formErrors) {
        for (er in formErrors) chat.add("ai" to "❌ " + er)
    }
    LaunchedEffect(pending != null) {
        if (pending != null) chat.add("ai" to "Details dekhiye, phir 'Haan, bharo'.")
    }
    LaunchedEffect(reportJson) {
        if (reportJson.isEmpty()) return@LaunchedEffect
        val arr = try { JSONArray(reportJson) } catch (e: Exception) { JSONArray() }
        val rows = (0 until arr.length()).map { arr.getJSONObject(it) }
        val okN = rows.count { it.optString("st") == "ok" }
        val rest = rows.filter { it.optString("st") != "ok" }
        val needHuman = rows.any { it.optString("k") == "otp" }
        val sb = StringBuilder("Bhar diya. ✔ " + okN)
        val rest2 = rest.filter { it.optString("k") != "otp" }
        if (rest2.isNotEmpty()) {
            sb.append("\n\nDekhein:")
            for (r in rest2.take(6)) sb.append("\n• " + r.optString("msg"))
        }
        sb.append(if (needHuman) "\n\n🔒 Captcha / OTP aap bharein." else "\n\nSubmit aap karein.")
        chat.add("ai" to sb.toString())
        if (needHuman) { humanShown = currentUrl; panelOpen = true }
    }

    BackHandler {
        val w = webView
        if (w != null && w.canGoBack()) w.goBack() else onExit()
    }

    DisposableEffect(Unit) {
        onDispose {
            (ctx as? Activity)?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            alive[0] = false
            main.removeCallbacksAndMessages(null)
            pendingChooser?.onReceiveValue(null)
            pendingChooser = null
            docs.clear()
            wipe(webView)
            webView?.destroy()
        }
    }

    // Panel khulne / band hone par website dobara screen me fit ho
    LaunchedEffect(webWpx, webView) { applyViewport(webView) }

    // Website ko jo jo chahiye wo sab AI ke paas aa gaya: 2 second baad khud confirm dikhao
    // (button dabane ki zaroorat nahi). Jab tak user type kar raha hai tab tak ruka rehta hai.
    val autoSig = fields.entries.sortedBy { it.key }.joinToString("|") { it.key + "=" + it.value } + "#" +
        extra.entries.sortedBy { it.key }.joinToString("|") { it.key + "=" + it.value } + "#" +
        needs.joinToString("|") { it.optString("key") + it.optString("id") }
    LaunchedEffect(autoSig) {
        if (!panelOpen || stopped || pending != null || needs.isEmpty() || autoSig == offeredSig) return@LaunchedEffect
        delay(2000)
        val ready = needs.all { n ->
            !isReq(n) || (
                if (n.optString("kind") == "known") (fields[n.optString("key")] ?: "").isNotBlank()
                else (extra[n.optString("id")] ?: "").isNotBlank())
        }
        if (ready && (phase == 0 || isAllowed(currentUrl))) {
            offeredSig = autoSig
            if (needs.any { it.optString("kind") != "known" }) sendNeeds() else startFill()
        }
    }

    val pd = pending
    if (pd != null) {
        AlertDialog(
            onDismissRequest = { pending = null },
            title = { Text("Ye details sahi hain?") },
            text = {
                Column(Modifier.verticalScroll(rememberScrollState())) {
                    Text("Ek baar dhyan se padhein. Galat bharne se form galat jayega.", fontSize = 12.sp)
                    Spacer(Modifier.height(6.dp))
                    for (key in pd.keys()) {
                        if (key.startsWith("__")) continue
                        Text(niceKey(key) + ": " + niceVal(key, pd.optString(key)), fontSize = 14.sp, modifier = Modifier.padding(vertical = 2.dp))
                    }
                    val ex = pd.optJSONObject("__extra")
                    if (ex != null) {
                        for (n in needs) {
                            val v = ex.optString(n.optString("id"), "")
                            if (v.isNotEmpty()) Text(n.optString("label") + ": " + v, fontSize = 14.sp, modifier = Modifier.padding(vertical = 2.dp))
                        }
                    }
                    if (pd.optBoolean("__declare")) {
                        Text("⚠ Declaration box AI aapki ijazat se tick karega.", fontSize = 12.sp, color = Color(0xFFB00020), modifier = Modifier.padding(top = 6.dp))
                    }
                }
            },
            confirmButton = {
                Button(onClick = { pending = null; if (phase == 0) beginForm(pd) else runFill(pd) }) {
                    Text(if (phase == 0) "Haan, form kholo" else "Haan, bharo")
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    pending = null
                    for (n in needs) {
                        if (n.optString("kind") == "known") fields[n.optString("key")] = "" else extra[n.optString("id")] = ""
                    }
                    offeredSig = ""
                    chat.add("ai" to "Sahi details dobara bhejiye.")
                    chatInput = template(needs)
                }) { Text("Badlo") }
            }
        )
    }

    Column(Modifier.fillMaxSize().background(Color.White)) {
        Row(
            Modifier
                .fillMaxWidth()
                .background(NAVY)
                .padding(horizontal = 8.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onExit) { Text("←", color = Color.White, fontSize = 20.sp) }
            Column(Modifier.weight(1f)) {
                Text(portal.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1)
                Text(log.lastOrNull() ?: "Taiyar", color = Color(0xFFFFD54F), fontSize = 12.sp, maxLines = 1)
            }
            // AI aur website ka hissa badlo: AI chhota / barabar / bada
            TextButton(onClick = { split = if (split < 0.4f) 0.5f else if (split < 0.55f) 0.65f else 0.35f }) {
                Text("↔", color = Color.White, fontSize = 18.sp)
            }
            TextButton(onClick = { if (!panelOpen) stopped = false; panelOpen = !panelOpen }) {
                Text(if (panelOpen) "✕ AI" else "🤖 AI", color = Color.White, fontSize = 14.sp)
            }
        }

        // Address bar: sirf purane (non-job) portal me; job form me user ke saamne sirf form
        if (phase == 2) Row(
            Modifier
                .fillMaxWidth()
                .background(Color(0xFFE8EAF0))
                .padding(horizontal = 6.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BasicTextField(
                value = urlText,
                onValueChange = { urlText = it },
                singleLine = true,
                textStyle = TextStyle(fontSize = 12.sp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = { go() }),
                modifier = Modifier
                    .weight(1f)
                    .background(Color.White, RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 7.dp)
            )
            TextButton(onClick = { go() }) { Text("Go", fontSize = 13.sp) }
        }
        val official = isAllowed(currentUrl)
        val host = Uri.parse(currentUrl).host ?: ""
        if (phase != 0) Text(
            if (official) "🔒 " + host else "⚠ Ye sarkari site nahi hai: " + host + " (AI yahan nahi bharega, dhyan rakhein)",
            modifier = Modifier
                .fillMaxWidth()
                .background(if (official) Color(0xFFE8F5E9) else Color(0xFFFFEBEE))
                .padding(horizontal = 8.dp, vertical = 3.dp),
            fontSize = 11.sp,
            maxLines = 2
        )

        if (netSlow) {
            Text(
                "Net slow hai, AI intezaar kar raha hai…",
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFFFF3CD))
                    .padding(6.dp),
                fontSize = 12.sp
            )
        }

        lastDownload?.let { d ->
            Column(Modifier.fillMaxWidth().background(Color(0xFFE8F5E9)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("✅ " + d.name + " (" + d.where + ")", fontSize = 11.sp, modifier = Modifier.weight(1f), maxLines = 2)
                    TextButton(onClick = { Saver.open(ctx, d) }) { Text(if (d.uri != null) "Kholo" else "Kahan?", fontSize = 12.sp) }
                    TextButton(onClick = { lastDownload = null }) { Text("✕", fontSize = 12.sp) }
                }
                if ((Uri.parse(currentUrl).host ?: "").contains("uidai") && d.mime.contains("pdf")) {
                    Text(
                        "Aadhaar PDF ka password: naam ke pehle 4 akshar (CAPITAL) + janm ka saal, jaise RAHU1998",
                        fontSize = 11.sp, color = Color(0xFF1B5E20), modifier = Modifier.padding(bottom = 3.dp)
                    )
                }
            }
        }

        BoxWithConstraints(Modifier.weight(1f).fillMaxWidth()) {
            val side = true                          // hamesha left-right: left me AI, right me poori website
            val panelW = if (panelOpen) maxWidth * split else 0.dp
            val panelH = 0.dp

            // Website hamesha puri laptop jaisi; panel khule to bachi jagah me fit
            AndroidView(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = if (phase == 2) panelW else 0.dp, bottom = panelH)
                    .onSizeChanged { sz -> webWpx = sz.width },
                factory = { c ->
                    WebView(c).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.useWideViewPort = true
                        settings.loadWithOverviewMode = true
                        settings.setSupportZoom(true)
                        settings.builtInZoomControls = true
                        settings.displayZoomControls = false
                        settings.userAgentString = DESKTOP_UA
                        settings.allowFileAccess = false
                        settings.javaScriptCanOpenWindowsAutomatically = false
                        // Login / SSO (jaise DigiLocker, payment gateway) ke liye zaroori
                        CookieManager.getInstance().setAcceptCookie(true)
                        CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
                        setDownloadListener { dUrl, dUa, dCd, dMime, _ -> main.post { startDownload(dUrl, dUa, dCd, dMime) } }

                        addJavascriptInterface(
                            Bridge(
                                { m -> say(m) },
                                { r -> main.post { reportJson = r } },
                                { n -> main.post { handleNeeds(n) } },
                                { b, mt, nm, tk -> main.post { onBlobSaved(b, mt, nm, tk) } }
                            ),
                            "NaradBridge"
                        )

                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(
                                view: WebView,
                                request: WebResourceRequest
                            ): Boolean {
                                // Sirf https; payment gateway ke liye non-sarkari https bhi khulta hai
                                // (upar address bar me chetavani dikhti hai)
                                return if (request.url.scheme == "https") {
                                    false
                                } else {
                                    say("Ye link app me nahi khulega.")
                                    true
                                }
                            }

                            override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                                if (url != null) { currentUrl = url; urlText = url }
                                applyViewport(view)
                            }

                            override fun onPageFinished(view: WebView, url: String?) {
                                if (url != null) { currentUrl = url; urlText = url }
                                netSlow = false
                                retries = 0
                                applyViewport(view)
                                main.postDelayed({ if (alive[0]) applyViewport(view) }, 700)
                                // Naya page: sarkari site par AI khud dekhe ki kya chahiye / kya bhar sakta hai
                                main.postDelayed({
                                    if (!alive[0] || stopped || phase == 0 || !isAllowed(currentUrl)) return@postDelayed
                                    val d = autoData ?: JSONObject().put("__scan", true)
                                    inject(d)
                                }, 1400)
                                if (phase == 0 && !briefStarted) main.postDelayed({ if (alive[0]) startBrief() }, 1300)
                                if (phase == 1) {
                                    for (ms in longArrayOf(1700L, 4500L)) {
                                        main.postDelayed({
                                            if (alive[0] && phase == 1 && formOnly) view.evaluateJavascript(formOnlyJs, null)
                                        }, ms)
                                    }
                                }
                            }

                            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
                                handler.cancel()
                                say("Is website ka security certificate sahi nahi hai, isliye nahi khola.")
                            }

                            override fun onReceivedError(
                                view: WebView,
                                request: WebResourceRequest,
                                error: WebResourceError
                            ) {
                                if (request.isForMainFrame) {
                                    netSlow = true
                                    if (retries < 5) {
                                        retries++
                                        main.postDelayed({
                                            if (alive[0]) view.reload()
                                        }, 5000)
                                    } else {
                                        say("Website khul nahi rahi. Internet ya address check karein.")
                                    }
                                }
                            }
                        }

                        webChromeClient = object : WebChromeClient() {
                            override fun onShowFileChooser(
                                webView: WebView?,
                                filePathCallback: ValueCallback<Array<Uri>>,
                                fileChooserParams: WebChromeClient.FileChooserParams?
                            ): Boolean {
                                pendingChooser?.onReceiveValue(null)
                                pendingChooser = null
                                if (docs.isEmpty() || !isAllowed(currentUrl)) {
                                    onPickFile(filePathCallback)
                                    return true
                                }
                                chooserAccept = fileChooserParams?.acceptTypes?.toList() ?: emptyList()
                                pendingChooser = filePathCallback
                                panelOpen = true
                                chat.add("ai" to "Website file maang rahi hai. Kaun si bhejun?")
                                return true
                            }
                        }

                        loadUrl(startUrl)
                    }.also { webView = it }
                }
            )

            if (panelOpen) {
                Column(
                    Modifier
                        .align(if (phase == 1) Alignment.TopCenter else Alignment.CenterStart)
                        .then(
                            when (phase) {
                                0 -> Modifier.fillMaxSize()   // AI poori screen: website piche chhupi
                                1 -> Modifier.fillMaxWidth().height(maxHeight * 0.6f)
                                    .shadow(12.dp, RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp))   // upar se popup
                                else -> Modifier.width(panelW).fillMaxHeight()
                            }
                        )
                        .background(Color(0xFFF5F7FB))
                        .padding(8.dp)
                ) {
                    Text("🤖 Narad AI", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Row(Modifier.horizontalScroll(rememberScrollState())) {
                        TextButton(onClick = { askPageInfo() }, contentPadding = PaddingValues(horizontal = 6.dp)) { Text("ℹ Jaankari", fontSize = 10.sp) }
                        TextButton(onClick = { savePagePdf() }, contentPadding = PaddingValues(horizontal = 6.dp)) { Text("🧾 PDF", fontSize = 10.sp) }
                        TextButton(onClick = { speed = if (speed == 60) 25 else if (speed == 25) 110 else 60 }, contentPadding = PaddingValues(horizontal = 6.dp)) {
                            Text("Speed: " + (if (speed == 25) "Tez" else if (speed == 110) "Dheere" else "Normal"), fontSize = 10.sp)
                        }
                    }

                    LazyColumn(
                        state = chatState,
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(chat.size) { i ->
                            val (who, msg) = chat[i]
                            val me = who == "me"
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = if (me) Arrangement.End else Arrangement.Start
                            ) {
                                Column(
                                    Modifier
                                        .background(if (me) Color(0xFFDCEBFF) else Color.White, RoundedCornerShape(12.dp))
                                        .padding(6.dp)
                                ) {
                                    for (ln in msg.split("\n")) {
                                        if (ln.isEmpty()) Spacer(Modifier.height(4.dp))
                                        else Text(
                                            ln,
                                            fontSize = 11.sp,
                                            lineHeight = 14.sp,
                                            fontWeight = if (!me && ln.endsWith(":")) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                    val cf = chatFiles[i]
                                    if (cf != null) {
                                        Button(onClick = { Saver.open(ctx, cf) }, modifier = Modifier.padding(top = 4.dp)) {
                                            Text("📄 Kholo", fontSize = 12.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Option wale sawaal (gender, category...) par tap karke bhi jawab de sakte ho
                    val chipNeed = missingRequired().firstOrNull { optsOf(it).isNotEmpty() }
                    if (chipNeed != null) {
                        Text(needLabel(chipNeed) + " chuniye:", fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                        Row(
                            Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            for ((_, l) in optsOf(chipNeed)) {
                                OutlinedButton(onClick = {
                                    chat.add("me" to l)
                                    val e = tryAnswer(chipNeed, l)
                                    replyAfter(if (e == null) emptyList() else listOf(needLabel(chipNeed) to e))
                                }) { Text(l, fontSize = 12.sp) }
                            }
                        }
                    }

                    if (!branchDone && svc != null) {
                        Row(
                            Modifier.horizontalScroll(rememberScrollState()).padding(top = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Button(onClick = { chooseBranch(true) }) { Text(svc.yesLabel, fontSize = 12.sp) }
                            OutlinedButton(onClick = { chooseBranch(false) }) { Text(svc.noLabel, fontSize = 12.sp) }
                        }
                    }
                    if (authState == 1) {
                        Row(
                            Modifier.horizontalScroll(rememberScrollState()).padding(top = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Button(onClick = { chooseAuth(0) }) { Text("Haan hai", fontSize = 12.sp) }
                            OutlinedButton(onClick = { chooseAuth(1) }) { Text("Nahi hai", fontSize = 12.sp) }
                            TextButton(onClick = { chooseAuth(2) }) { Text("Zaroorat nahi", fontSize = 12.sp) }
                        }
                    }
                    if (pwCount > 0) {
                        Text("🔑 Password", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                        OutlinedTextField(
                            value = pwInput,
                            onValueChange = { pwInput = it },
                            singleLine = true,
                            visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(onClick = { putPassword() }, modifier = Modifier.fillMaxWidth()) { Text("Site me daalo", fontSize = 12.sp) }
                    }
                    val pd0 = pendingDoc
                    if (pd0 != null) {
                        Text("📎 " + pd0.name + " kya hai?", fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                        Row(
                            Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            for ((kk, kl) in DOC_KINDS) {
                                OutlinedButton(onClick = {
                                    docs.add(Doc(pd0.uri, pd0.name, pd0.mime, pd0.size, kk))
                                    pendingDoc = null
                                    chat.add("me" to kl)
                                    chat.add("ai" to if (kk == "other") "Theek hai. Poochhkar daalunga." else "Theek hai. " + kl + " maangega to daal dunga.")
                                }) { Text(kl, fontSize = 12.sp) }
                            }
                        }
                    }
                    if (pendingChooser != null) {
                        val okDocs = docs.filter { docMatches(it, chooserAccept) }
                        Text(
                            if (okDocs.isEmpty()) "Website ko jis type ki file chahiye wo aapke bheje document me nahi hai." else "Kaun si file bhejun?",
                            fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp)
                        )
                        Row(
                            Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            for (d in okDocs) {
                                OutlinedButton(onClick = { sendDoc(d) }) { Text(d.name.take(22), fontSize = 12.sp) }
                            }
                            OutlinedButton(onClick = { galleryChooser() }) { Text("Phone se chuno", fontSize = 12.sp) }
                            TextButton(onClick = { cancelChooser() }) { Text("Rahne do", fontSize = 12.sp) }
                        }
                    }
                    if (docs.isNotEmpty()) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("📎 " + docs.size + " document bheje hain", fontSize = 11.sp, modifier = Modifier.weight(1f))
                            TextButton(onClick = { docs.clear(); chat.add("ai" to "Document hata diye.") }) { Text("Hatao", fontSize = 11.sp) }
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                        Switch(checked = autoUpload, onCheckedChange = { autoUpload = it })
                        Spacer(Modifier.width(6.dp))
                        Text("Document khud upload", fontSize = 10.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                        Switch(checked = declare, onCheckedChange = { declare = it })
                        Spacer(Modifier.width(6.dp))
                        Text("Declaration tick karo", fontSize = 10.sp)
                    }

                    OutlinedTextField(
                        value = chatInput,
                        onValueChange = { chatInput = it },
                        placeholder = { Text("Yahan likhiye…", fontSize = 11.sp) },
                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp),
                        singleLine = false,
                        maxLines = 4,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text, imeAction = ImeAction.Default),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(Modifier.fillMaxWidth().padding(top = 2.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedButton(
                            onClick = { attachPicker.launch(arrayOf("image/*", "application/pdf")) },
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(horizontal = 4.dp)
                        ) { Text("📎", fontSize = 14.sp) }
                        Button(
                            onClick = { val tx = chatInput; chatInput = ""; sendChat(tx) },
                            modifier = Modifier.weight(2f),
                            contentPadding = PaddingValues(horizontal = 4.dp)
                        ) { Text("Bhejo ➤", fontSize = 13.sp) }
                    }
                }
            } else {
                // Panel chhupa hai: neeche chhoti si patti (status, ruko, band, AI wapas)
                Row(
                    Modifier
                        .align(Alignment.BottomCenter)
                        .padding(8.dp)
                        .background(Color(0xE60B1B3F), RoundedCornerShape(24.dp))
                        .padding(horizontal = 12.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        log.lastOrNull() ?: "AI taiyar",
                        color = Color.White,
                        fontSize = 11.sp,
                        maxLines = 1,
                        modifier = Modifier.widthIn(max = 180.dp)
                    )
                    TextButton(onClick = {
                        paused = !paused
                        webView?.evaluateJavascript("window.__narad=window.__narad||{};window.__narad.paused=" + paused, null)
                        say(if (paused) "AI roka gaya (pause)" else "AI aage badh raha hai")
                    }) { Text(if (paused) "▶" else "⏸", color = Color.White) }
                    TextButton(onClick = {
                        webView?.evaluateJavascript("window.__narad=window.__narad||{};window.__narad.stop=true;window.__narad.paused=false", null)
                        paused = false
                        autoData = null
                        stopped = true
                        say("AI ruk gaya. Ab aap khud bharein.")
                    }) { Text("⏹", color = Color.White) }
                    if (phase == 1) {
                        TextButton(onClick = {
                            formOnly = !formOnly
                            webView?.evaluateJavascript(
                                if (formOnly) "window.__nkOff=false;" + formOnlyJs else "window.__nkRestore&&window.__nkRestore()", null
                            )
                        }) { Text(if (formOnly) "📄" else "📝", color = Color.White) }
                    }
                    TextButton(onClick = { stopped = false; panelOpen = true }) { Text("🤖", color = Color.White) }
                }
            }
        }
    }
}
