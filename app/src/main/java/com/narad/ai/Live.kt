package com.narad.ai

import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// NaradSearch (GitHub) ki jobs.json se asli, taaza bharti / admit card / result.
// Date nikal chuki entry yahan bhi hat jati hai (internet na ho tab bhi).
object Live {
    private val main = Handler(Looper.getMainLooper())
    private var started = false

    var byKind by mutableStateOf<Map<String, List<Portal>>>(emptyMap())
        private set
    var updated by mutableStateOf("")
        private set

    private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    private fun ddmmyyyy(iso: String) = if (iso.length == 10) iso.substring(8, 10) + "/" + iso.substring(5, 7) + "/" + iso.substring(0, 4) else iso

    private fun parse(json: String): Pair<Map<String, List<Portal>>, String> {
        val root = JSONObject(json)
        val arr = root.optJSONArray("items") ?: return Pair(emptyMap(), "")
        val t = today()
        val limit = 3L * 24 * 3600 * 1000
        val out = HashMap<String, MutableList<Portal>>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val url = o.optString("url")
            val title = o.optString("title")
            if (title.isBlank() || !(url.startsWith("https://") || url.startsWith("http://"))) continue
            val last = o.optString("last_date", "")
            if (last.length == 10 && last < t) continue // date nikal gayi - hata do
            val kind = o.optString("kind", "job")
            val parts = mutableListOf<String>()
            val first = o.optString("first_seen", "")
            val fresh = try {
                first.length == 10 && System.currentTimeMillis() - (SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(first)?.time ?: 0L) <= limit
            } catch (e: Exception) { false }
            parts.add(o.optString("source", "Official"))
            if (last.length == 10) parts.add("Last date: " + ddmmyyyy(last))
            if (o.optInt("vacancies", 0) > 0) parts.add(o.optInt("vacancies").toString() + " post")
            val posts = o.optString("posts", "")
            if (posts.isNotBlank() && posts != "null") parts.add(posts)
            val note = (if (fresh) "🆕 " else "") + parts.joinToString(" · ")
            out.getOrPut(kind) { mutableListOf() }.add(Portal(title, url, listOf(o.optString("source", "").lowercase()), note))
        }
        return Pair(out, root.optString("updated", ""))
    }

    private fun apply(json: String): Boolean = try {
        val (m, up) = parse(json)
        byKind = m
        updated = up
        true
    } catch (e: Exception) { false }

    /** Pehle saved copy turant dikhao, phir internet se naya laao. */
    fun start(ctx: Context) {
        if (started) return
        started = true
        val sp = ctx.applicationContext.getSharedPreferences("narad_live", Context.MODE_PRIVATE)
        sp.getString("json", null)?.let { apply(it) }
        val url = BuildConfig.JOBS_URL
        if (url.isBlank()) return
        Thread {
            try {
                val req = okhttp3.Request.Builder().url(url).header("Cache-Control", "no-cache").build()
                Net.client.newCall(req).execute().use { r ->
                    if (r.code == 200) {
                        val txt = r.body?.string() ?: ""
                        if (txt.length < 8_000_000) {
                            main.post {
                                if (apply(txt)) sp.edit().putString("json", txt).apply()
                            }
                        }
                    }
                }
            } catch (e: Exception) { /* internet nahi - purani copy chalti rahegi */ }
        }.start()
    }

    fun portals(kind: String?): List<Portal> =
        if (kind == null) byKind.values.flatten() else (byKind[kind] ?: emptyList())

    /** AI chat ko batane ke liye: abhi chal rahi bhartiyan. */
    fun forPrompt(max: Int): String =
        (byKind["job"] ?: emptyList()).take(max).joinToString("; ") { it.name + " [" + it.note.removePrefix("🆕 ") + "]" }
}
