package com.narad.ai

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.CookieManager
import android.webkit.URLUtil
import android.widget.Toast
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL

/** Website se aayi file (Aadhaar PDF, certificate, receipt...) Downloads/NaradAI me rakhna. */
object Saver {
    const val MAX_BYTES = 60L * 1024 * 1024

    class Saved(val uri: Uri?, val name: String, val mime: String, val where: String)

    fun cleanName(n: String): String {
        var s = n.replace(Regex("[\\\\/:*?\"<>|\\u0000-\\u001F]"), "_").trim().trim('.')
        if (s.isEmpty()) s = "document"
        if (s.length > 80) {
            val dot = s.lastIndexOf('.')
            s = if (dot > 0 && s.length - dot <= 8) s.take(70) + s.substring(dot) else s.take(80)
        }
        return s
    }

    /** Android 10+ par permission nahi chahiye. Purane phone me app ke apne folder me. */
    fun save(ctx: Context, name: String, mime: String, write: (OutputStream) -> Unit): Saved {
        val fname = cleanName(name)
        val type = if (mime.isBlank()) "application/octet-stream" else mime
        if (Build.VERSION.SDK_INT >= 29) {
            val cv = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, fname)
                put(MediaStore.Downloads.MIME_TYPE, type)
                put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/NaradAI")
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val res = ctx.contentResolver
            val uri = res.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv) ?: throw IOException("File nahi ban payi")
            try {
                val os = res.openOutputStream(uri) ?: throw IOException("File nahi khul payi")
                os.use { write(it) }
                val done = ContentValues().apply { put(MediaStore.Downloads.IS_PENDING, 0) }
                res.update(uri, done, null, null)
            } catch (e: Exception) {
                try { res.delete(uri, null, null) } catch (x: Exception) { }
                throw e
            }
            return Saved(uri, fname, type, "Downloads/NaradAI")
        }
        val base = ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: ctx.filesDir
        val dir = File(base, "NaradAI").apply { mkdirs() }
        var f = File(dir, fname)
        var i = 1
        while (f.exists()) {
            val dot = fname.lastIndexOf('.')
            f = File(dir, if (dot > 0) fname.substring(0, dot) + " (" + i + ")" + fname.substring(dot) else fname + " (" + i + ")")
            i++
        }
        try {
            FileOutputStream(f).use { write(it) }
        } catch (e: Exception) {
            f.delete()
            throw e
        }
        return Saved(null, f.name, type, "Android/data/com.narad.ai/files/Download/NaradAI")
    }

    fun saveBase64(ctx: Context, b64: String, mime: String, name: String): Saved {
        val bytes = Base64.decode(b64, Base64.DEFAULT)
        if (bytes.size > MAX_BYTES) throw IOException("File bahut badi hai")
        val n = if (name.isBlank()) URLUtil.guessFileName("", null, mime) else name
        return save(ctx, n, mime) { it.write(bytes) }
    }

    /** data:...;base64,... link. */
    fun saveDataUrl(ctx: Context, url: String, name: String): Saved {
        val comma = url.indexOf(',')
        if (comma < 0 || !url.startsWith("data:")) throw IOException("Ye link samajh nahi aaya")
        val head = url.substring(5, comma)
        val mime = head.substringBefore(';').ifBlank { "application/octet-stream" }
        if (!head.contains(";base64")) throw IOException("Ye data link app nahi khol sakta")
        return saveBase64(ctx, url.substring(comma + 1), mime, name)
    }

    /** https link se file. Cookie har link ke apne domain ki hi jati hai; redirect haath se, sirf https. */
    fun fetch(ctx: Context, startUrl: String, ua: String?, referer: String?, disp: String?, declaredMime: String?): Saved {
        var url = startUrl
        var hops = 0
        while (true) {
            if (!url.startsWith("https://")) throw IOException("Sirf https download hota hai")
            val c = URL(url).openConnection() as HttpURLConnection
            c.instanceFollowRedirects = false
            c.connectTimeout = 20000
            c.readTimeout = 60000
            if (!ua.isNullOrBlank()) c.setRequestProperty("User-Agent", ua)
            if (!referer.isNullOrBlank()) c.setRequestProperty("Referer", referer)
            val ck = CookieManager.getInstance().getCookie(url)
            if (!ck.isNullOrBlank()) c.setRequestProperty("Cookie", ck)
            val code = c.responseCode
            if (code in 300..399) {
                val loc = c.getHeaderField("Location") ?: throw IOException("Redirect adhura")
                c.disconnect()
                if (++hops > 5) throw IOException("Bahut redirect")
                url = URL(URL(url), loc).toString()
                continue
            }
            if (code !in 200..299) { c.disconnect(); throw IOException("Server ne " + code + " diya") }
            val ct = (c.contentType ?: declaredMime ?: "").substringBefore(';').trim().lowercase()
            val declared = (declaredMime ?: "").substringBefore(';').trim().lowercase()
            // File maangi thi, par page (HTML) mila: website seedha download nahi de rahi
            if (ct == "text/html" && declared != "text/html") { c.disconnect(); throw IOException("html") }
            val cd = c.getHeaderField("Content-Disposition") ?: disp
            val name = URLUtil.guessFileName(url, cd, ct.ifBlank { declaredMime })
            return try {
                save(ctx, name, ct.ifBlank { declaredMime ?: "" }) { out ->
                    var total = 0L
                    c.inputStream.use { inp ->
                        val buf = ByteArray(16384)
                        while (true) {
                            val n = inp.read(buf)
                            if (n < 0) break
                            total += n
                            if (total > MAX_BYTES) throw IOException("File bahut badi hai")
                            out.write(buf, 0, n)
                        }
                    }
                }
            } finally {
                c.disconnect()
            }
        }
    }

    fun open(ctx: Context, s: Saved) {
        val u = s.uri
        if (u == null) {
            Toast.makeText(ctx, "File yahan hai: " + s.where, Toast.LENGTH_LONG).show()
            return
        }
        try {
            ctx.startActivity(
                Intent(Intent.ACTION_VIEW).setDataAndType(u, s.mime)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: Exception) {
            Toast.makeText(ctx, "Is file ko kholne wala app nahi mila. Files / Downloads me dekhein.", Toast.LENGTH_LONG).show()
        }
    }
}
