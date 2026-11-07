package com.narad.ai

import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class AiConfig(private val sp: SharedPreferences) {
    var key: String
        get() = sp.getString("key", "")?.ifBlank { BuildConfig.AI_KEY } ?: BuildConfig.AI_KEY
        set(v) { sp.edit().putString("key", v).apply() }
    var base: String
        get() = sp.getString("base", "https://generativelanguage.googleapis.com/v1beta/openai/") ?: ""
        set(v) { sp.edit().putString("base", v).apply() }
    var model: String
        get() = sp.getString("model", "gemini-2.5-flash") ?: ""
        set(v) { sp.edit().putString("model", v).apply() }
}

// OpenAI-compatible chat API (Gemini free, Groq free, OpenRouter free sab chalte hain)
object Ai {
    private val main = Handler(Looper.getMainLooper())

    private fun systemPrompt(): String {
        val names = allPortals.joinToString(", ") { it.name }
        val live = Live.forPrompt(15)
        return "Tum Narad AI ho, ek madadgaar jo sarkari online kaam (form, certificate, naukri, yojana) me madad karta hai. " +
            "Hinglish me bahut chhota jawab do (2-3 line), simple shabd, sahi spelling, bina ** # ya emoji ke. " +
            "Form bharna, document upload aur download app khud karta hai, isliye user ko 'box me click karo', 'upload karo', 'neeche dekho' jaise steps kabhi mat likho. Sirf batao kya jaankari ya document chahiye. " +
            "Kabhi OTP, password, Aadhaar number ya bank detail mat maango. " +
            "Agar pakka pata na ho (fees, aakhri tareekh, rules) to kaho ki official site par check karein, andaza mat lagao. " +
            "Agar user koi seva kholna chahta hai to jawab ke aakhir me ek tag likho: [OPEN:<seva ka naam>], " +
            "naam in me se hi ek ho: " + names + ". Ek baar me sirf ek tag." +
            (if (live.isNotEmpty()) " Abhi chal rahi bhartiyan (sirf jaankari ke liye, inke liye OPEN tag mat likho, aur kehna ki date official notification se check karein): " + live + "." else "")
    }

    fun chat(cfg: AiConfig, history: List<Pair<String, String>>, onResult: (String?, String?) -> Unit) {
        Thread {
            var out: String? = null
            var err: String? = null
            try {
                val url = URL(cfg.base.trimEnd('/') + "/chat/completions")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.connectTimeout = 15000
                conn.readTimeout = 40000
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer " + cfg.key)
                conn.doOutput = true

                val msgs = JSONArray()
                msgs.put(JSONObject().put("role", "system").put("content", systemPrompt()))
                for ((r, c) in history) {
                    msgs.put(JSONObject().put("role", r).put("content", c))
                }
                val body = JSONObject()
                    .put("model", cfg.model)
                    .put("messages", msgs)
                    .put("temperature", 0.3)
                conn.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }

                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val text = stream?.bufferedReader()?.use { it.readText() } ?: ""
                if (code in 200..299) {
                    out = JSONObject(text).getJSONArray("choices").getJSONObject(0)
                        .getJSONObject("message").getString("content")
                } else {
                    err = "Error " + code + ": " + text.take(200)
                }
            } catch (e: Exception) {
                err = "Net ya AI me dikkat: " + (e.message ?: "unknown")
            }
            main.post { onResult(out, err) }
        }.start()
    }
}
