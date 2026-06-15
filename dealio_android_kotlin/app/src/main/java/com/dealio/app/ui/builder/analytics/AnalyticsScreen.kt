package com.dealio.app.ui.builder.analytics

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.CurrencyRupee
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.TrendingUp
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
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatTile
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.statusColorPair
import com.dealio.app.ui.theme.Orange
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AnalyticsState(
    val loading: Boolean = true,
    val error: String? = null,
    val projects: Int = 0,
    val leads: Int = 0,
    val deals: Int = 0,
    val booked: Int = 0,
    val revenue: Double = 0.0,
    val avgDeal: Double = 0.0,
    val byStatus: List<Pair<String, Int>> = emptyList(),
) {
    val conversion: Int get() = if (leads > 0) (booked * 100 / leads) else 0
}

class AnalyticsViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(AnalyticsState())
    val state: StateFlow<AnalyticsState> = _state.asStateFlow()
    init { load() }
    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val p = repo.getProjects(); val l = repo.getLeads(); val d = repo.getDeals()
            if (p is ApiResult.Error) { _state.update { it.copy(loading = false, error = p.message) }; return@launch }
            val projects = (p as? ApiResult.Success)?.data ?: emptyList()
            val leads = (l as? ApiResult.Success)?.data ?: emptyList()
            val deals = (d as? ApiResult.Success)?.data ?: emptyList()
            val booked = deals.filter { it.status.lowercase() in listOf("booked", "closed") }
            val revenue = booked.sumOf { it.dealValue ?: 0.0 }
            _state.update {
                it.copy(
                    loading = false, projects = projects.size, leads = leads.size, deals = deals.size,
                    booked = booked.size, revenue = revenue,
                    avgDeal = if (booked.isNotEmpty()) revenue / booked.size else 0.0,
                    byStatus = deals.groupingBy { dd -> dd.status }.eachCount().toList().sortedByDescending { it.second },
                )
            }
        }
    }
}

@Composable
fun AnalyticsScreen(nav: NavController, vm: AnalyticsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold("Analytics", nav) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, vm::load, Modifier.padding(pad))
            else -> Column(
                Modifier.fillMaxSize().padding(pad).verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatTile("Projects", state.projects.toString(), Icons.Outlined.Apartment, Teal, Modifier.weight(1f))
                    StatTile("Total leads", state.leads.toString(), Icons.Outlined.Groups, Orange, Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatTile("Conversion", "${state.conversion}%", Icons.Outlined.TrendingUp, StatusColors.Green, Modifier.weight(1f))
                    StatTile("Avg deal", formatINRShort(state.avgDeal), Icons.Outlined.CurrencyRupee, Teal, Modifier.weight(1f))
                }
                StatTile("Revenue booked", formatINRShort(state.revenue), Icons.Outlined.CurrencyRupee, StatusColors.Green, Modifier.fillMaxWidth())

                DealioCard {
                    SectionLabel("Deals by stage")
                    Spacer(Modifier.height(10.dp))
                    val max = (state.byStatus.maxOfOrNull { it.second } ?: 1).coerceAtLeast(1)
                    if (state.byStatus.isEmpty()) {
                        Text("No deals yet.", color = TextSecondary, fontSize = 13.sp)
                    } else {
                        state.byStatus.forEach { (status, count) ->
                            val (fg, _) = statusColorPair(status)
                            Column(Modifier.padding(vertical = 5.dp)) {
                                Row {
                                    Text(status, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                                    Text("$count", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(Modifier.height(4.dp))
                                Box(Modifier.fillMaxWidth().height(8.dp).background(Color(0xFFEDF1F7), RoundedCornerShape(4.dp))) {
                                    Box(Modifier.fillMaxWidth(count.toFloat() / max).height(8.dp).background(fg, RoundedCornerShape(4.dp)))
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(20.dp))
            }
        }
    }
}
