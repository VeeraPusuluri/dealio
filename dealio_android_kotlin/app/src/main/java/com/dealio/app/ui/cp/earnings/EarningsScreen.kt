package com.dealio.app.ui.cp.earnings

import android.app.Application
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.CpCommission
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.RefreshOnResume
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.builder.formatINR
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.cp.CpViewModel
import com.dealio.app.ui.theme.NavyDeep
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Orange
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EarningsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<CpCommission> = emptyList(),
) {
    val released get() = items.filter { it.commissionStatus.equals("Released", true) }.sumOf { it.commissionAmount }
    val pending get() = items.filter { !it.commissionStatus.equals("Released", true) }.sumOf { it.commissionAmount }
}

class EarningsViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(EarningsState())
    val state: StateFlow<EarningsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getCommissions()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@Composable
fun EarningsScreen(nav: NavController, vm: EarningsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume { vm.load(silent = true) }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Earnings")
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() })
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Row(
                        Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Brush.linearGradient(listOf(NavyDeep, NavyMid)), RoundedCornerShape(18.dp)).padding(18.dp),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("Released", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                            Text(formatINRShort(state.released), color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(Modifier.weight(1f)) {
                            Text("Pending", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                            Text(formatINRShort(state.pending), color = Orange, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                if (state.items.isEmpty()) {
                    item { EmptyState(Icons.Outlined.Payments, "No commissions yet", "Earn when your referred deals close.") }
                } else {
                    items(state.items.size) { i -> CommissionCard(state.items[i]) }
                }
            }
        }
    }
}

@Composable
private fun CommissionCard(c: CpCommission) {
    DealioCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(c.projectName, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(c.customerName, color = TextSecondary, fontSize = 12.sp)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(formatINR(c.commissionAmount), color = Teal, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(2.dp))
                StatusChip(c.commissionStatus ?: "Pending")
            }
        }
    }
}
