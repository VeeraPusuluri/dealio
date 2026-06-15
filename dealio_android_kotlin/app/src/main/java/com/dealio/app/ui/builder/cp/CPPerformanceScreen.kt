package com.dealio.app.ui.builder.cp

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Insights
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
import com.dealio.app.ui.builder.BuilderViewModel
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CPStat(val name: String, val deals: Int, val booked: Int, val value: Double)

data class CPPerfState(val loading: Boolean = true, val error: String? = null, val stats: List<CPStat> = emptyList())

class CPPerformanceViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(CPPerfState())
    val state: StateFlow<CPPerfState> = _state.asStateFlow()
    init { load() }
    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getDeals()) {
                is ApiResult.Success -> {
                    val stats = r.data.filter { !it.cpName.isNullOrBlank() }
                        .groupBy { it.cpName!! }
                        .map { (name, deals) ->
                            CPStat(
                                name = name,
                                deals = deals.size,
                                booked = deals.count { it.status.lowercase() in listOf("booked", "closed") },
                                value = deals.filter { it.status.lowercase() in listOf("booked", "closed") }.sumOf { it.dealValue ?: 0.0 },
                            )
                        }
                        .sortedByDescending { it.value }
                    _state.update { it.copy(loading = false, stats = stats) }
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@Composable
fun CPPerformanceScreen(nav: NavController, vm: CPPerformanceViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold("CP Performance", nav) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, vm::load, Modifier.padding(pad))
            state.stats.isEmpty() -> EmptyState(Icons.Outlined.Insights, "No CP activity yet", "Once channel partners bring deals, their performance shows here.", Modifier.padding(pad))
            else -> LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.stats.size) { i ->
                    val cp = state.stats[i]
                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(34.dp).background(Teal.copy(alpha = 0.14f), RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                                Text("#${i + 1}", color = Teal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.size(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(cp.name, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                                Text("${cp.deals} deals · ${cp.booked} booked", color = TextSecondary, fontSize = 12.sp)
                            }
                            Text(formatINRShort(cp.value), color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
