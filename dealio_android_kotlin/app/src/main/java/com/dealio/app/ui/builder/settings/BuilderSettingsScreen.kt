package com.dealio.app.ui.builder.settings

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.dealio.app.data.TokenStore
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.initialsOf
import com.dealio.app.ui.theme.ErrorRed
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun BuilderSettingsScreen(nav: NavController, onLogout: () -> Unit) {
    val context = LocalContext.current
    val user = remember { TokenStore(context).user() }

    SubScreenScaffold("Settings", nav) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // Profile card
            DealioCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(56.dp).background(Teal, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center,
                    ) { Text(initialsOf(user?.fullName), color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold) }
                    Spacer(Modifier.size(14.dp))
                    Column {
                        Text(user?.fullName ?: "Builder", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        Text("Builder account", color = Teal, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            DealioCard {
                SectionLabel("Account")
                Spacer(Modifier.size(8.dp))
                InfoRow("Name", user?.fullName ?: "—")
                InfoRow("Phone", user?.phone ?: "—")
                InfoRow("Email", user?.email ?: "—")
                InfoRow("Role", "Builder")
            }

            DealioCard {
                SectionLabel("About")
                Spacer(Modifier.size(8.dp))
                InfoRow("App", "Dealio for Builders")
                InfoRow("Version", "1.0")
            }

            Spacer(Modifier.size(4.dp))
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
        }
    }
}
