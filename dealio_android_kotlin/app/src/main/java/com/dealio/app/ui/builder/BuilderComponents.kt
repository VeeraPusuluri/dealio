package com.dealio.app.ui.builder

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

// ─── Status palette ──────────────────────────────────────────────────────────
object StatusColors {
    val Green = Color(0xFF059669)
    val GreenBg = Color(0xFFE8F6F1)
    val Amber = Color(0xFFD97706)
    val AmberBg = Color(0xFFFDF3E7)
    val Blue = Color(0xFF2563EB)
    val BlueBg = Color(0xFFEAF0FE)
    val Grey = Color(0xFF64748B)
    val GreyBg = Color(0xFFF1F4F8)
    val Red = Color(0xFFDC2626)
    val RedBg = Color(0xFFFCEBEB)
    val Purple = Color(0xFF7C3AED)
    val PurpleBg = Color(0xFFF1ECFD)
}

/** Maps a deal/lead/meeting status string to a (fg, bg) chip colour pair. */
fun statusColorPair(status: String): Pair<Color, Color> {
    val s = status.lowercase()
    return when {
        s.contains("booked") || s.contains("closed") || s.contains("confirmed") ||
            s.contains("completed") || s.contains("released") || s.contains("sanctioned") ||
            s.contains("accepted") || s.contains("disbursed") ->
            StatusColors.Green to StatusColors.GreenBg
        s.contains("negotiation") || s.contains("pending") || s.contains("review") ||
            s.contains("processing") || s.contains("rescheduled") || s.contains("requested") ->
            StatusColors.Amber to StatusColors.AmberBg
        s.contains("agreement") || s.contains("meeting") || s.contains("profile") ->
            StatusColors.Blue to StatusColors.BlueBg
        s.contains("reject") || s.contains("cancel") || s.contains("lost") ->
            StatusColors.Red to StatusColors.RedBg
        s.contains("suggest") ->
            StatusColors.Purple to StatusColors.PurpleBg
        else -> StatusColors.Grey to StatusColors.GreyBg
    }
}

@Composable
fun StatusChip(text: String, modifier: Modifier = Modifier) {
    val (fg, bg) = statusColorPair(text)
    Box(
        modifier = modifier
            .background(bg, RoundedCornerShape(8.dp))
            .padding(horizontal = 9.dp, vertical = 4.dp),
    ) {
        Text(text, color = fg, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

@Composable
fun DealioCard(
    modifier: Modifier = Modifier,
    content: @Composable Column.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
        content = content,
    )
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text.uppercase(),
        modifier = modifier,
        color = TextSecondary,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.sp,
    )
}

@Composable
fun StatTile(
    label: String,
    value: String,
    icon: ImageVector,
    accent: Color = Teal,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .background(Color.White, RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(accent.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, null, tint = accent, modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.height(10.dp))
        Text(value, color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(label, color = TextSecondary, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize().padding(48.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = Teal, strokeWidth = 2.5.dp, modifier = Modifier.size(28.dp))
    }
}

@Composable
fun ErrorState(message: String, onRetry: () -> Unit, modifier: Modifier = Modifier) {
    Column(
        modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(message, color = TextSecondary, textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyMedium)
        TextButton(onClick = onRetry) { Text("Try again", color = Teal, fontWeight = FontWeight.SemiBold) }
    }
}

@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier.fillMaxWidth().padding(vertical = 56.dp, horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier.size(56.dp).background(Teal.copy(alpha = 0.10f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center,
        ) { Icon(icon, null, tint = Teal, modifier = Modifier.size(26.dp)) }
        Spacer(Modifier.height(14.dp))
        Text(title, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        if (subtitle != null) {
            Spacer(Modifier.height(4.dp))
            Text(subtitle, color = TextSecondary, fontSize = 13.sp, textAlign = TextAlign.Center)
        }
    }
}

/** Label/value row used across detail screens. */
@Composable
fun InfoRow(label: String, value: String?, modifier: Modifier = Modifier) {
    if (value.isNullOrBlank()) return
    Row(
        modifier = modifier.fillMaxWidth().padding(vertical = 5.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top,
    ) {
        Text(label, color = TextSecondary, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(
            value,
            color = TextPrimary,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.End,
            modifier = Modifier.weight(1.4f),
        )
    }
}

val ScreenPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp)
