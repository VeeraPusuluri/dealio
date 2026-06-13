package com.dealio.app.ui.builder

import kotlin.math.abs
import kotlin.math.roundToLong

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
