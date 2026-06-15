package com.dealio.app.ui.builder.meetings

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.api.Meeting
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeetingsScreen(nav: NavController, vm: MeetingsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var sheet by remember { mutableStateOf<Meeting?>(null) }
    val sheetState = rememberModalBottomSheetState()
    com.dealio.app.ui.builder.RefreshOnResume { vm.load(silent = true) }

    com.dealio.app.ui.builder.SubScreenScaffold("Site visits", nav) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                state.filters.forEach { f ->
                    val sel = state.filter == f
                    Box(
                        Modifier.weight(1f)
                            .background(if (sel) NavyMid else Color.White, RoundedCornerShape(10.dp))
                            .border(1.dp, if (sel) NavyMid else CardBorder, RoundedCornerShape(10.dp))
                            .clickable { vm.setFilter(f) }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(f, color = if (sel) Color.White else TextSecondary, fontSize = 12.sp,
                            fontWeight = if (sel) FontWeight.SemiBold else FontWeight.Normal)
                    }
                }
            }

            when {
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error!!, vm::load)
                state.visible.isEmpty() -> EmptyState(Icons.Outlined.CalendarMonth, "No ${state.filter.lowercase()} site visits", "Visit requests from customers appear here.")
                else -> LazyColumn(
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(state.visible.size) { i -> MeetingCard(state.visible[i]) { sheet = state.visible[i] } }
                }
            }
        }
    }

    if (sheet != null) {
        val m = sheet!!
        ModalBottomSheet(onDismissRequest = { sheet = null }, sheetState = sheetState, containerColor = Color.White) {
            Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp)) {
                Text(m.customerName, color = TextPrimary, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                StatusChip(m.status)
                Spacer(Modifier.height(12.dp))
                InfoRow("Project", m.projectName)
                InfoRow("Requested", "${formatDate(m.preferredDate)} · ${m.preferredTime}")
                InfoRow("Confirmed", m.confirmedDate?.let { "${formatDate(it)} · ${m.confirmedTime ?: ""}" })
                InfoRow("Type", m.meetingType)
                InfoRow("Phone", m.customerPhone)
                InfoRow("Channel partner", m.cpName ?: "Direct")
                InfoRow("Notes", m.notes)

                Spacer(Modifier.height(16.dp))
                val actions = when (m.status.lowercase()) {
                    "pending" -> listOf("Confirmed" to NavyMid, "Rescheduled" to com.dealio.app.ui.theme.Orange, "Cancelled" to com.dealio.app.ui.theme.ErrorRed)
                    "confirmed", "rescheduled" -> listOf("Completed" to StatusColors.Green, "Cancelled" to com.dealio.app.ui.theme.ErrorRed)
                    else -> emptyList()
                }
                actions.forEach { (label, color) ->
                    Box(
                        Modifier.fillMaxWidth().height(46.dp).padding(vertical = 3.dp)
                            .background(color, RoundedCornerShape(12.dp))
                            .clickable(enabled = !state.working) { vm.updateStatus(m, label); sheet = null },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            when (label) { "Confirmed" -> "Confirm visit"; "Completed" -> "Mark completed"; "Rescheduled" -> "Mark rescheduled"; else -> "Cancel request" },
                            color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MeetingCard(m: Meeting, onClick: () -> Unit) {
    DealioCard(Modifier.clickable { onClick() }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(m.customerName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(m.projectName, color = TextSecondary, fontSize = 12.sp)
            }
            StatusChip(m.status)
        }
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Schedule, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(5.dp))
            Text("${formatDate(m.confirmedDate ?: m.preferredDate)} · ${m.confirmedTime ?: m.preferredTime}",
                color = TextSecondary, fontSize = 12.sp)
            if (!m.meetingType.isNullOrBlank()) {
                Spacer(Modifier.width(8.dp))
                Text("· ${m.meetingType}", color = TextSecondary, fontSize = 12.sp)
            }
        }
    }
}
