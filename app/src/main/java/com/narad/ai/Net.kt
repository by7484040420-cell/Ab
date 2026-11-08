package com.narad.ai

import okhttp3.Dns
import okhttp3.OkHttpClient
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.URL
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit

/**
 * Pehle phone ka apna DNS try karta hai. Agar "Unable to resolve host" aaye to
 * Cloudflare / Google ke DNS-over-HTTPS se address nikal ke connect karta hai.
 * (DoH seedha IP 1.1.1.1 / 8.8.8.8 par jaata hai, isliye phone ke DNS par depend nahi.)
 */
object SmartDns : Dns {
    private val cache = HashMap<String, Pair<Long, List<InetAddress>>>()

    override fun lookup(hostname: String): List<InetAddress> {
        try {
            val r = Dns.SYSTEM.lookup(hostname)
            if (r.isNotEmpty()) return r
        } catch (e: UnknownHostException) { /* neeche DoH try karenge */ }

        synchronized(cache) {
            cache[hostname]?.let { (t, l) -> if (System.currentTimeMillis() - t < 5 * 60_000) return l }
        }
        val servers = listOf(
            "https://1.1.1.1/dns-query?name=%s&type=%s",
            "https://8.8.8.8/resolve?name=%s&type=%s"
        )
        for (tpl in servers) {
            val out = ArrayList<InetAddress>()
            for (type in listOf("A", "AAAA")) {
                try {
                    val c = URL(String.format(tpl, hostname, type)).openConnection() as HttpURLConnection
                    c.connectTimeout = 5000
                    c.readTimeout = 5000
                    c.setRequestProperty("Accept", "application/dns-json")
                    if (c.responseCode == 200) {
                        val arr = JSONObject(c.inputStream.bufferedReader().use { it.readText() }).optJSONArray("Answer")
                        if (arr != null) {
                            for (i in 0 until arr.length()) {
                                val a = arr.getJSONObject(i)
                                val t = a.optInt("type")
                                if (t == 1 || t == 28) {
                                    val ip = InetAddress.getByName(a.getString("data")) // IP literal, DNS nahi lagta
                                    out.add(InetAddress.getByAddress(hostname, ip.address))
                                }
                            }
                        }
                    }
                    c.disconnect()
                } catch (e: Exception) { /* agla try */ }
            }
            if (out.isNotEmpty()) {
                // IPv4 pehle
                val sorted = out.sortedBy { if (it.address.size == 4) 0 else 1 }
                synchronized(cache) { cache[hostname] = Pair(System.currentTimeMillis(), sorted) }
                return sorted
            }
        }
        throw UnknownHostException("$hostname (phone DNS aur DoH dono fail)")
    }
}

object Net {
    val client: OkHttpClient = OkHttpClient.Builder()
        .dns(SmartDns)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(40, TimeUnit.SECONDS)
        .build()
}
