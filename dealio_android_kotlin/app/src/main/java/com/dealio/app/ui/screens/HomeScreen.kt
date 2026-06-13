package com.dealio.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dealio.app.data.TokenStore
import com.dealio.app.ui.components.DealioLogo
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyDeep
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

private val roleLabels = mapOf(
    "CUSTOMER" to "Customer",
    "CP" to "Channel Partner",
    "BUILDER" to "Builder",
    "BANK" to "Bank",
    "VENDOR" to "Vendor",
    "ADMIN" to "Admin",
    "NRI" to "NRI",
    "LANDOWNER" to "Landowner",
)

/** Minimal landing screen after auth — the full app comes later. */
@Composable
fun HomeScreen(onLogout: () -> Unit) {
    val context = LocalContext.current
    val tokenStore = remember { TokenStore(context) }
    val user = tokenStore.user()

    Column(modifier = Modifier.fillMaxSize()) {
        // Navy header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(NavyDeep, NavyMid))),
        ) {
            Column(
                modifier = Modifier
                    .systemBarsPadding()
                    .padding(horizontal = 24.dp, vertical = 20.dp),
            ) {
                DealioLogo(onDark = true)
                Spacer(Modifier.height(28.dp))
                Text(
                    "Welcome${user?.fullName?.let { ", ${it.substringBefore(' ')}" } ?: ""} 👋",
                    color = Color.White,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    "You're signed in to Dealio.",
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodyLarge,
                )
                Spacer(Modifier.height(24.dp))
            }
        }

        Column(modifier = Modifier.padding(24.dp)) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    InfoRow("Name", user?.fullName ?: "—")
                    HorizontalDivider(Modifier.padding(vertical = 12.dp), color = CardBorder)
                    InfoRow("Role", roleLabels[user?.role] ?: user?.role ?: "—", highlight = true)
                    HorizontalDivider(Modifier.padding(vertical = 12.dp), color = CardBorder)
                    InfoRow("Phone", user?.phone ?: "—")
                    if (!user?.email.isNullOrBlank()) {
                        HorizontalDivider(Modifier.padding(vertical = 12.dp), color = CardBorder)
                        InfoRow("Email", user?.email ?: "—")
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Text(
                "Projects, leads, deals and more are on the way to the mobile app.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
            )
            Spacer(Modifier.height(28.dp))

            OutlinedButton(
                onClick = {
                    tokenStore.clear()
                    onLogout()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp),
            ) {
                Text("Log out", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String, highlight: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        Text(
            value,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = if (highlight) Teal else MaterialTheme.colorScheme.onSurface,
        )
    }
}
