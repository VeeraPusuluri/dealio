package com.dealio.app.ui.cp.overview

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Contacts
import androidx.compose.material.icons.outlined.CurrencyRupee
import androidx.compose.material.icons.outlined.EventRepeat
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.RefreshOnResume
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatTile
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.initialsOf
import com.dealio.app.ui.cp.CpLeadCard
import com.dealio.app.ui.cp.CpRoutes
import com.dealio.app.ui.cp.QuickActionTile
import com.dealio.app.ui.theme.NavyDeep
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Orange
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun CpOverviewScreen(nav: NavController, vm: CpOverviewViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume { vm.load(silent = true) }

    Column(Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(NavyDeep, NavyMid)))) {
            Column(Modifier.systemBarsPadding().padding(horizontal = 20.dp, vertical = 18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(46.dp).background(Teal, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
                        androidx.compose.material3.Text(initialsOf(state.name), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        androidx.compose.material3.Text("Welcome back", color = Teal, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        androidx.compose.material3.Text(state.name.substringBefore(' '), color = Color.White, fontSize = 21.sp, fontWeight = FontWeight.Bold)
                    }
                    Box(
                        Modifier.size(40.dp).background(Color.White.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                            .clickable { nav.navigate(CpRoutes.NOTIFICATIONS) },
                        contentAlignment = Alignment.Center,
                    ) { Icon(Icons.Outlined.Notifications, "Notifications", tint = Color.White, modifier = Modifier.size(20.dp)) }
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    Modifier.background(Color.White.copy(alpha = 0.12f), RoundedCornerShape(10.dp)).padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Outlined.WorkspacePremium, null, tint = Orange, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    androidx.compose.material3.Text("${state.tier} Partner", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() })
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatTile("Earned", formatINRShort(state.totalEarnings), Icons.Outlined.CurrencyRupee, StatusColors.Green, Modifier.weight(1f))
                        StatTile("Pending", formatINRShort(state.pendingCommission), Icons.Outlined.CurrencyRupee, Orange, Modifier.weight(1f))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatTile("Deals", state.totalDeals.toString(), Icons.Outlined.Apartment, Teal, Modifier.weight(1f))
                        StatTile("Leads", state.leadsCount.toString(), Icons.Outlined.Groups, Teal, Modifier.weight(1f))
                    }
                }

                // Due today
                val dueCount = state.due.meetings.size + state.due.followUps.size + state.due.callbacks.size
                item {
                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.EventRepeat, null, tint = Orange, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            androidx.compose.material3.Text("Due today", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            androidx.compose.material3.Text("$dueCount", color = Orange, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                        if (dueCount == 0) {
                            Spacer(Modifier.height(6.dp))
                            androidx.compose.material3.Text("Nothing due today — you're all caught up!", color = TextSecondary, fontSize = 12.sp)
                        } else {
                            state.due.meetings.forEach { m ->
                                Spacer(Modifier.height(8.dp))
                                DueRow("${m.customerName} · ${m.projectName}", "Visit ${m.time ?: ""}".trim())
                            }
                            state.due.followUps.forEach { f ->
                                Spacer(Modifier.height(8.dp))
                                DueRow("${f.customerName} · ${f.projectName}", f.reason)
                            }
                            state.due.callbacks.forEach { c ->
                                Spacer(Modifier.height(8.dp))
                                DueRow("${c.customerName} · ${c.projectName}", "Callback ${c.time ?: ""}".trim())
                            }
                        }
                    }
                }

                item { SectionLabel("Quick actions", Modifier.padding(top = 4.dp)) }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuickActionTile("Browse projects", Icons.Outlined.Apartment, Modifier.weight(1f)) { nav.navigate(CpRoutes.PROJECTS) }
                        QuickActionTile("Contacts", Icons.Outlined.Contacts, Modifier.weight(1f)) { nav.navigate(CpRoutes.CONTACTS) }
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        QuickActionTile("Follow-ups", Icons.Outlined.EventRepeat, Modifier.weight(1f)) { nav.navigate(CpRoutes.FOLLOWUPS) }
                        QuickActionTile("Meetings", Icons.Outlined.CalendarMonth, Modifier.weight(1f)) { nav.navigate(CpRoutes.MEETINGS) }
                    }
                }

                item {
                    Row(
                        Modifier.fillMaxWidth().padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically,
                    ) {
                        SectionLabel("Recent leads")
                        androidx.compose.material3.Text("View all", color = Teal, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.clickable { nav.navigate(CpRoutes.LEADS) })
                    }
                }
                if (state.recentLeads.isEmpty()) {
                    item { androidx.compose.material3.Text("No leads yet. Browse projects to add one.", color = TextSecondary, fontSize = 13.sp) }
                } else {
                    items(state.recentLeads.size) { i ->
                        CpLeadCard(state.recentLeads[i]) { nav.navigate(CpRoutes.dealDetail(state.recentLeads[i].id)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun DueRow(title: String, subtitle: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(6.dp).background(Orange, RoundedCornerShape(3.dp)))
        Spacer(Modifier.width(8.dp))
        Column {
            androidx.compose.material3.Text(title, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            if (subtitle.isNotBlank()) androidx.compose.material3.Text(subtitle, color = TextSecondary, fontSize = 11.sp)
        }
    }
}
