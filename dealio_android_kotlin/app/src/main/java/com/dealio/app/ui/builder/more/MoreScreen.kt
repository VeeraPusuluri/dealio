package com.dealio.app.ui.builder.more

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Campaign
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.CurrencyRupee
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Gavel
import androidx.compose.material.icons.outlined.Grid4x4
import androidx.compose.material.icons.outlined.Insights
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.dealio.app.ui.builder.BuilderRoutes
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.ErrorRed
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

private data class MoreItem(val label: String, val icon: ImageVector, val route: String)

private val moreItems = listOf(
    MoreItem("Site Visits", Icons.Outlined.CalendarMonth, BuilderRoutes.MEETINGS),
    MoreItem("Inventory", Icons.Outlined.Grid4x4, BuilderRoutes.UNITS),
    MoreItem("Commissions", Icons.Outlined.CurrencyRupee, BuilderRoutes.COMMISSIONS),
    MoreItem("Broadcast", Icons.Outlined.Campaign, BuilderRoutes.BROADCAST),
    MoreItem("CP Performance", Icons.Outlined.Insights, BuilderRoutes.CP_PERFORMANCE),
    MoreItem("Analytics", Icons.Outlined.Analytics, BuilderRoutes.ANALYTICS),
    MoreItem("Loan Cases", Icons.Outlined.CreditCard, BuilderRoutes.LOANS),
    MoreItem("RERA Compliance", Icons.Outlined.Gavel, BuilderRoutes.RERA),
    MoreItem("Shortlists", Icons.Outlined.FavoriteBorder, BuilderRoutes.SHORTLISTS),
    MoreItem("Notifications", Icons.Outlined.Notifications, BuilderRoutes.NOTIFICATIONS),
    MoreItem("Settings", Icons.Outlined.Settings, BuilderRoutes.SETTINGS),
)

@Composable
fun MoreScreen(nav: NavController, onLogout: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        TabHeader("More", "Tools & settings")
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            moreItems.chunked(2).forEach { rowItems ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    rowItems.forEach { item ->
                        FeatureTile(item, Modifier.weight(1f)) { nav.navigate(item.route) }
                    }
                    if (rowItems.size == 1) Spacer(Modifier.weight(1f))
                }
            }

            Spacer(Modifier.height(8.dp))
            Row(
                Modifier.fillMaxWidth().height(52.dp)
                    .border(1.dp, ErrorRed.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                    .clickable { onLogout() },
                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.AutoMirrored.Outlined.Logout, null, tint = ErrorRed, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("Sign out", color = ErrorRed, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun FeatureTile(item: MoreItem, modifier: Modifier, onClick: () -> Unit) {
    Column(
        modifier
            .background(Color.White, RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(16.dp),
    ) {
        Box(
            Modifier.size(40.dp).background(Teal.copy(alpha = 0.12f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) { Icon(item.icon, null, tint = Teal, modifier = Modifier.size(21.dp)) }
        Spacer(Modifier.height(10.dp))
        Text(item.label, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        Text("Open", color = TextSecondary, fontSize = 11.sp)
    }
}
