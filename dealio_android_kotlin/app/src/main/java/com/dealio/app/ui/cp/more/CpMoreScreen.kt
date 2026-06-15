package com.dealio.app.ui.cp.more

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Contacts
import androidx.compose.material.icons.outlined.EventRepeat
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
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
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.cp.CpRoutes
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.ErrorRed
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary

@Composable
fun CpMoreScreen(nav: NavController, onLogout: () -> Unit) {
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { TabHeader("More") },
    ) { inner ->
        Column(
            Modifier.fillMaxSize().padding(inner).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row("Contacts", Icons.Outlined.Contacts) { nav.navigate(CpRoutes.CONTACTS) }
            Row("Follow-ups", Icons.Outlined.EventRepeat) { nav.navigate(CpRoutes.FOLLOWUPS) }
            Row("Call logs", Icons.Outlined.Phone) { nav.navigate(CpRoutes.CALLLOGS) }
            Row("Meetings", Icons.Outlined.CalendarMonth) { nav.navigate(CpRoutes.MEETINGS) }
            Row("Profile & verification", Icons.Outlined.Person) { nav.navigate(CpRoutes.PROFILE) }
            Row("Notifications", Icons.Outlined.Notifications) { nav.navigate(CpRoutes.NOTIFICATIONS) }

            Spacer(Modifier.height(6.dp))
            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed.copy(alpha = 0.1f), contentColor = ErrorRed),
            ) {
                Icon(Icons.AutoMirrored.Outlined.Logout, null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Log out", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun Row(label: String, icon: ImageVector, onClick: () -> Unit) {
    androidx.compose.foundation.layout.Row(
        Modifier.fillMaxWidth()
            .background(Color.White, RoundedCornerShape(14.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = Teal, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(12.dp))
        Text(label, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
        Icon(Icons.Outlined.ChevronRight, null, tint = com.dealio.app.ui.theme.TextSecondary, modifier = Modifier.size(20.dp))
    }
}
