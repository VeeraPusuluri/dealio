package com.dealio.app.ui.builder

import com.dealio.app.BuildConfig
import com.dealio.app.data.api.Project
import kotlin.math.abs
import kotlin.math.roundToLong

/** Price range works across both endpoints (priceMin/Max for detail, priceFrom/To for the list). */
fun Project.priceLow(): Double? = priceMin ?: priceFrom
fun Project.priceHigh(): Double? = priceMax ?: priceTo

/**
 * Resolves a backend image path to a URL the emulator can actually reach.
 *
 * The backend stores absolute upload URLs using whatever Host header it saw at
 * upload time — typically `127.0.0.1:8090` or `localhost:8090` when a project's
 * image was added from the web app. From an Android emulator those hosts point at
 * the emulator itself (and aren't in the cleartext allow-list), so the image fails
 * to load. We rewrite them to the API origin (10.0.2.2 in debug). Relative paths
 * ("/uploads/..") are prefixed with the same origin.
 */
fun resolveUrl(path: String?): String? {
    if (path.isNullOrBlank()) return null
    val origin = BuildConfig.API_BASE_URL.removeSuffix("api/").removeSuffix("/") // e.g. http://10.0.2.2:8090
    val emuHost = origin.substringAfter("://").substringBefore(":").substringBefore("/")
    return if (path.startsWith("http://") || path.startsWith("https://")) {
        path.replace("://127.0.0.1", "://$emuHost")
            .replace("://localhost", "://$emuHost")
    } else {
        "$origin/" + path.removePrefix("/")
    }
}

/** Indian-style short currency: ₹1.2 Cr, ₹45 L, ₹90,000. */
fun formatINRShort(value: Double?): String {
    val v = value ?: 0.0
    if (v == 0.0) return "₹0"
    val sign = if (v < 0) "-" else ""
    val a = abs(v)
    return when {
        a >= 1_00_00_000 -> "$sign₹${trim(a / 1_00_00_000)} Cr"
        a >= 1_00_000 -> "$sign₹${trim(a / 1_00_000)} L"
        a >= 1_000 -> "$sign₹${trim(a / 1_000)} K"
        else -> "$sign₹${a.roundToLong()}"
    }
}

private fun trim(d: Double): String {
    val r = (d * 100).roundToLong() / 100.0
    return if (r % 1.0 == 0.0) r.toLong().toString() else r.toString()
}

/** Full grouped rupees: ₹1,25,00,000. */
fun formatINR(value: Double?): String {
    val v = (value ?: 0.0).roundToLong()
    val s = abs(v).toString()
    if (s.length <= 3) return "${if (v < 0) "-" else ""}₹$s"
    val last3 = s.takeLast(3)
    val rest = s.dropLast(3)
    val grouped = rest.reversed().chunked(2).joinToString(",").reversed()
    return "${if (v < 0) "-" else ""}₹$grouped,$last3"
}

/** YYYY-MM-DD or ISO → "12 Jun 2026". Falls back to the raw string. */
fun formatDate(raw: String?): String {
    if (raw.isNullOrBlank()) return "—"
    val date = raw.take(10)
    val parts = date.split("-")
    if (parts.size != 3) return raw
    val (y, m, d) = parts
    val mi = m.toIntOrNull()?.minus(1) ?: return raw
    val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    if (mi !in months.indices) return raw
    return "${d.toIntOrNull() ?: d} ${months[mi]} $y"
}

fun initialsOf(name: String?): String {
    val parts = (name ?: "").trim().split(" ").filter { it.isNotBlank() }
    if (parts.isEmpty()) return "B"
    return parts.take(2).joinToString("") { it.first().uppercase() }
}

fun titleCase(s: String?): String =
    (s ?: "").lowercase().split("_", " ").filter { it.isNotBlank() }
        .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
