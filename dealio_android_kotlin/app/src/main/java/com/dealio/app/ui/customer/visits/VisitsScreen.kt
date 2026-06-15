package com.dealio.app.ui.customer.visits

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
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
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.RefreshOnResume
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.theme.Orange
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun VisitsScreen(nav: NavController, vm: VisitsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    RefreshOnResume { vm.load(silent = true) }
    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.clearMessage() } }

    Scaffold(
        containerColor = androidx.compose.material3.MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = { TabHeader("Site visits", subtitle = "${state.meetings.size} scheduled") },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() }, modifier = Modifier.padding(inner))
            state.meetings.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.CalendarMonth, "No visits yet", "Book a site visit from any project to see it here.")
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = inner.calculateTopPadding() + 8.dp, bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.meetings.size) { i -> VisitCard(state.meetings[i], onRate = { r -> vm.rate(state.meetings[i].id, r) }) }
            }
        }
    }
}

@Composable
private fun VisitCard(m: Meeting, onRate: (Int) -> Unit) {
    DealioCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(m.projectName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                if (!m.meetingType.isNullOrBlank()) Text(m.meetingType!!, color = TextSecondary, fontSize = 12.sp)
            }
            StatusChip(m.status)
        }
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.CalendarMonth, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(5.dp))
            Text(formatDate(m.confirmedDate ?: m.preferredDate), color = TextPrimary, fontSize = 13.sp)
            Spacer(Modifier.width(14.dp))
            Icon(Icons.Outlined.Schedule, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(5.dp))
            Text(m.confirmedTime ?: m.preferredTime, color = TextPrimary, fontSize = 13.sp)
        }
        if (!m.cpName.isNullOrBlank()) {
            Spacer(Modifier.height(4.dp))
            Text("Arranged by ${m.cpName}", color = TextSecondary, fontSize = 12.sp)
        }
        if (!m.notes.isNullOrBlank()) {
            Spacer(Modifier.height(6.dp))
            Text(m.notes!!, color = TextSecondary, fontSize = 12.sp)
        }

        if (m.status.equals("Completed", true)) {
            Spacer(Modifier.height(12.dp))
            Text("Rate your visit", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(6.dp))
            Row {
                (1..5).forEach { star ->
                    val filled = (m.customerRating ?: 0) >= star
                    Icon(
                        if (filled) Icons.Filled.Star else Icons.Outlined.StarBorder,
                        "Rate $star",
                        tint = if (filled) Orange else TextSecondary,
                        modifier = Modifier.size(28.dp).padding(end = 4.dp).clickable { onRate(star) },
                    )
                }
            }
        }
    }
}
