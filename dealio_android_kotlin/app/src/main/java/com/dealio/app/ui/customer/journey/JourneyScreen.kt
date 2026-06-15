package com.dealio.app.ui.customer.journey

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Timeline
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.api.CustomerDeal
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.RefreshOnResume
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.customer.CustomerRoutes
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun JourneyScreen(nav: NavController, vm: JourneyViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume { vm.load(silent = true) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { TabHeader("My journey", subtitle = "${state.deals.size} active deals") },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() }, modifier = Modifier.padding(inner))
            state.deals.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.Timeline, "No deals yet", "When you book a visit or shortlist a home, your journey shows up here.")
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = inner.calculateTopPadding() + 8.dp, bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.deals.size) { i ->
                    DealCard(state.deals[i]) { nav.navigate(CustomerRoutes.dealDetail(state.deals[i].dealId)) }
                }
            }
        }
    }
}

@Composable
private fun DealCard(d: CustomerDeal, onClick: () -> Unit) {
    DealioCard(Modifier.clickable { onClick() }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(d.projectName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                if ((d.dealValue ?: 0.0) > 0) Text(formatINRShort(d.dealValue), color = Teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
            StatusChip(d.dealStatus)
        }
        if (d.loanCaseId != null) {
            Spacer(Modifier.height(10.dp))
            Row(
                Modifier.fillMaxWidth().background(StatusColors.BlueBg, RoundedCornerShape(10.dp)).padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Outlined.AccountBalance, null, tint = StatusColors.Blue, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    "Home loan • ${formatINRShort(d.loanAmount)} • ${d.loanStatus ?: "Applied"}",
                    color = StatusColors.Blue, fontSize = 12.sp, fontWeight = FontWeight.Medium,
                )
            }
        }
        if (d.messages.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text("${d.messages.size} message${if (d.messages.size != 1) "s" else ""} · tap to open", color = TextSecondary, fontSize = 12.sp)
        }
    }
}
