package com.dealio.app.ui.cp.leads

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.RefreshOnResume
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.cp.CpLeadCard
import com.dealio.app.ui.cp.CpRoutes
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun LeadsScreen(nav: NavController, vm: LeadsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume { vm.load(silent = true) }

    Column(Modifier.fillMaxSize()) {
        TabHeader("My leads", subtitle = "${state.all.size} total")

        Row(
            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            state.statuses.forEach { st ->
                val sel = state.statusFilter == st
                Text(
                    st,
                    color = if (sel) Color.White else TextSecondary,
                    fontSize = 12.sp,
                    fontWeight = if (sel) FontWeight.SemiBold else FontWeight.Normal,
                    modifier = Modifier
                        .background(if (sel) NavyMid else Color.White, RoundedCornerShape(10.dp))
                        .border(1.dp, if (sel) NavyMid else CardBorder, RoundedCornerShape(10.dp))
                        .clickable { vm.setFilter(st) }
                        .padding(horizontal = 12.dp, vertical = 7.dp),
                )
            }
        }

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() })
            state.filtered.isEmpty() -> EmptyState(Icons.Outlined.Groups, "No leads here", "Add leads from the Projects tab to start earning commissions.")
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.filtered.size) { i ->
                    CpLeadCard(state.filtered[i]) { nav.navigate(CpRoutes.dealDetail(state.filtered[i].id)) }
                }
            }
        }
    }
}
