package com.dealio.app.ui.builder.commissions

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CurrencyRupee
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
import com.dealio.app.data.api.Commission
import com.dealio.app.ui.builder.BuilderViewModel
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CommissionsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<Commission> = emptyList(),
    val working: Boolean = false,
) {
    val pending get() = items.filter { it.status.equals("Pending", true) }.sumOf { it.amount }
    val released get() = items.filter { it.status.equals("Released", true) }.sumOf { it.amount }
}

class CommissionsViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(CommissionsState())
    val state: StateFlow<CommissionsState> = _state.asStateFlow()
    init { load() }
    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getCommissions()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
    fun release(c: Commission) {
        val id = c.id.toLongOrNull() ?: return
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            repo.releaseCommission(id)
            load()
            _state.update { it.copy(working = false) }
        }
    }
}

@Composable
fun CommissionsScreen(nav: NavController, vm: CommissionsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold("Commissions", nav) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, vm::load, Modifier.padding(pad))
            else -> LazyColumn(
                Modifier.fillMaxSize().padding(pad),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Tile("Pending payout", formatINRShort(state.pending), StatusColors.Amber, Modifier.weight(1f))
                        Tile("Released", formatINRShort(state.released), StatusColors.Green, Modifier.weight(1f))
                    }
                }
                if (state.items.isEmpty()) {
                    item { EmptyState(Icons.Outlined.CurrencyRupee, "No commissions yet", "Commission payouts appear after deals are booked.") }
                } else {
                    items(state.items.size) { i -> CommissionCard(state.items[i], state.working) { vm.release(state.items[i]) } }
                }
            }
        }
    }
}

@Composable
private fun Tile(label: String, value: String, accent: Color, modifier: Modifier) {
    Column(modifier.background(Color.White, RoundedCornerShape(16.dp)).border(1.dp, CardBorder, RoundedCornerShape(16.dp)).padding(14.dp)) {
        Text(value, color = accent, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text(label.uppercase(), color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
    }
}

@Composable
private fun CommissionCard(c: Commission, working: Boolean, onRelease: () -> Unit) {
    DealioCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(c.customerName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(c.projectName, color = TextSecondary, fontSize = 12.sp)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(formatINRShort(c.amount), color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Text("${c.commissionPercent}% of ${formatINRShort(c.saleValue)}", color = TextSecondary, fontSize = 11.sp)
            }
        }
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            StatusChip(c.status)
            Spacer(Modifier.weight(1f))
            if (!c.status.equals("Released", true)) {
                Box(
                    Modifier.background(StatusColors.Green, RoundedCornerShape(10.dp))
                        .clickable(enabled = !working) { onRelease() }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                ) { Text("Release", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
            }
        }
    }
}
