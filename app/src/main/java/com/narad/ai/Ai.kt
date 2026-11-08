package com.narad.ai

import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import org.json.JSONArray
import org.json.JSONObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class AiConfig(private val sp: SharedPreferences) {
    var key: String
        get() = sp.getString("key", "")?.ifBlank { BuildConfig.AI_KEY } ?: BuildConfig.AI_KEY
        set(v) { sp.edit().putString("key", v).apply() }
    var base: String
        get() = sp.getString("base", "https://generativelanguage.googleapis.com/v1beta/openai/") ?: ""
        set(v) { sp.edit().putString("base", v).apply() }
    var model: String
        get() {
            // Purane install me saved gemini-2.5-flash ko naye supported model par migrate karo.
            val saved = sp.getString("model", null)
            return if (saved.isNullOrBlank() || saved == "gemini-2.5-flash") {
                "gemini-3.8-flash".also {
                    sp.edit().putString("model", it).apply()
                }
            } else {
                saved
            }
        }
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
                val target = cfg.base.trim().trimEnd('/') + "/chat/completions"
                val httpUrl = target.toHttpUrlOrNull()
                if (httpUrl == null) {
                    err = "Base URL galat likha hai: " + cfg.base + " . AI Settings me 'Gemini (free)' button dabao."
                } else {
                    val msgs = JSONArray()
                    msgs.put(JSONObject().put("role", "system").put("content", systemPrompt()))
                    for ((r, c) in history) {
                        msgs.put(JSONObject().put("role", r).put("content", c))
                    }
                    val body = JSONObject()
                        .put("model", cfg.model)
                        .put("messages", msgs)
                        .put("temperature", 0.3)
                    val req = Request.Builder()
                        .url(httpUrl)
                        .header("Authorization", "Bearer " + cfg.key.trim())
                        .post(body.toString().toRequestBody("application/json".toMediaType()))
                        .build()
                    try {
                        Net.client.newCall(req).execute().use { resp ->
                            val code = resp.code
                            val text = resp.body?.string() ?: ""
                            if (code in 200..299) {
                                out = JSONObject(text).getJSONArray("choices").getJSONObject(0)
                                    .getJSONObject("message").getString("content")
                            } else {
                                err = when (code) {
                                    401, 403 -> "API key galat ya band hai (Error " + code + "). AI Settings me nayi key daalo."
                                    404 -> "Model naam ya Base URL galat hai (Error 404). AI Settings me 'Gemini (free)' button dabao."
                                    429 -> "Free limit khatam ho gayi (Error 429). Thodi der baad try karo ya Groq use karo."
                                    else -> "Error " + code + ": " + text.take(200)
                                }
                            }
                        }
                    } catch (e: java.net.UnknownHostException) {
                        err = "Server nahi mila: " + httpUrl.host + " (phone DNS aur backup DNS dono fail). " +
                            "Agar ye naam galat likha hai to AI Settings me 'Gemini (free)' dabao. " +
                            "Sahi hai to Settings > Apps > Narad AI > Mobile data & Wi-Fi me internet allow karo, VPN band karo."
                    }
                }
            } catch (e: java.net.UnknownHostException) {
                // DNS fail: host ka address nahi mila. Ye app ka bug nahi, phone ke DNS ka masla hai.
                err = "DNS dikkat: phone ye server nahi dhoondh pa raha (" + (e.message ?: "") + "). " +
                    "Settings > Network > Private DNS ko 'dns.google' par set karo ya Off/Automatic karke dekho. " +
                    "VPN ya Data Saver band karo. AI Settings me Base URL sahi hai ya nahi check karo."
            } catch (e: java.net.SocketTimeoutException) {
                err = "Net slow hai ya server jawab nahi de raha. Thodi der baad dobara try karo."
            } catch (e: Exception) {
                err = "Net ya AI me dikkat: " + (e.message ?: "unknown")
            }
            main.post { onResult(out, err) }
        }.start()
    }
}
