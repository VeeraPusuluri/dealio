package com.dealio.app.ui.customer

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.priceHigh
import com.dealio.app.ui.builder.priceLow
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.builder.titleCase
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Orange
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

private fun priceRange(p: Project): String {
    val lo = p.priceLow()
    val hi = p.priceHigh()
    return when {
        (lo ?: 0.0) > 0 && (hi ?: 0.0) > 0 && hi != lo -> "${formatINRShort(lo)} – ${formatINRShort(hi)}"
        (lo ?: 0.0) > 0 -> "${formatINRShort(lo)}+"
        else -> "Price on request"
    }
}

@Composable
private fun HeroImage(p: Project, modifier: Modifier) {
    Box(modifier.background(Brush.linearGradient(listOf(NavyMid, Teal)))) {
        val url = resolveUrl(p.imageUrl ?: p.coverUrl)
        if (url != null) {
            AsyncImage(model = url, contentDescription = p.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
        } else {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.Apartment, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(44.dp))
            }
        }
        if (p.featured) {
            Row(
                Modifier.align(Alignment.TopStart).padding(10.dp)
                    .background(Orange, RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Filled.Star, null, tint = Color.White, modifier = Modifier.size(11.dp))
                Spacer(Modifier.width(3.dp))
                Text("Featured", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

/** Full-width browse card. */
@Composable
fun CustomerProjectCard(p: Project, onClick: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(20.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(20.dp))
            .clip(RoundedCornerShape(20.dp))
            .clickable { onClick() },
    ) {
        HeroImage(p, Modifier.fillMaxWidth().height(160.dp))
        Column(Modifier.padding(14.dp)) {
            Text(p.name, color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(3.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.LocationOn, null, tint = TextSecondary, modifier = Modifier.size(13.dp))
                Spacer(Modifier.width(3.dp))
                Text(
                    listOfNotNull(p.locality, p.city).joinToString(", ").ifBlank { "—" },
                    color = TextSecondary, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.height(10.dp))
            Text(priceRange(p), color = Teal, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            val configs = p.configurations?.takeIf { it.isNotEmpty() }?.joinToString(" · ")
            if (configs != null) {
                Spacer(Modifier.height(6.dp))
                Text(configs, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (!p.possessionDate.isNullOrBlank() || !p.status.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    listOfNotNull(p.status?.let { titleCase(it) }, p.possessionDate?.let { "Possession $it" }).joinToString(" · "),
                    color = TextSecondary, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

/** Compact card for the featured carousel. */
@Composable
fun FeaturedCard(p: Project, onClick: () -> Unit) {
    Column(
        Modifier
            .width(220.dp)
            .background(Color.White, RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .clip(RoundedCornerShape(18.dp))
            .clickable { onClick() },
    ) {
        HeroImage(p, Modifier.fillMaxWidth().height(120.dp))
        Column(Modifier.padding(12.dp)) {
            Text(p.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(p.city ?: "—", color = TextSecondary, fontSize = 11.sp, maxLines = 1)
            Spacer(Modifier.height(6.dp))
            Text(priceRange(p), color = Teal, fontSize = 13.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        }
    }
}
