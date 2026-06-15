package com.dealio.app.ui.builder.units

import android.app.Application
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Grid4x4
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
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.BuilderRoutes
import com.dealio.app.ui.builder.BuilderViewModel
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class UnitsState(val loading: Boolean = true, val error: String? = null, val projects: List<Project> = emptyList())

class UnitsViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(UnitsState())
    val state: StateFlow<UnitsState> = _state.asStateFlow()
    init { load() }
    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getProjects()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, projects = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@Composable
fun UnitMatrixScreen(nav: NavController, vm: UnitsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold("Inventory", nav) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, vm::load, Modifier.padding(pad))
            state.projects.isEmpty() -> EmptyState(Icons.Outlined.Grid4x4, "No inventory", "Create a project to manage its unit inventory.", Modifier.padding(pad))
            else -> LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.projects.size) { i ->
                    val p = state.projects[i]
                    InventoryCard(p) { nav.navigate(BuilderRoutes.projectDetail(p.id)) }
                }
            }
        }
    }
}

@Composable
private fun InventoryCard(p: Project, onClick: () -> Unit) {
    val total = (p.totalUnits ?: 0).coerceAtLeast(1)
    val available = p.availableUnits ?: 0
    val booked = p.bookedUnits ?: 0
    val sold = p.soldUnits ?: 0
    DealioCard(Modifier.clickable { onClick() }) {
        Text(p.name, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        Text(p.configurations?.joinToString(", ")?.ifBlank { "—" } ?: "—", color = TextSecondary, fontSize = 12.sp)
        Spacer(Modifier.height(10.dp))
        // Stacked bar
        Row(Modifier.fillMaxWidth().height(10.dp)) {
            if (sold > 0) Box(Modifier.weight(sold.toFloat()).fillMaxWidth().height(10.dp).background(StatusColors.Green, RoundedCornerShape(2.dp)))
            if (booked > 0) Box(Modifier.weight(booked.toFloat()).fillMaxWidth().height(10.dp).background(StatusColors.Amber, RoundedCornerShape(2.dp)))
            val avail = (p.totalUnits ?: 0) - sold - booked
            if (avail > 0) Box(Modifier.weight(avail.toFloat()).fillMaxWidth().height(10.dp).background(Color(0xFFE3E9F1), RoundedCornerShape(2.dp)))
        }
        Spacer(Modifier.height(10.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            LegendItem("Total", total.toString(), TextPrimary)
            LegendItem("Available", available.toString(), TextSecondary)
            LegendItem("Booked", booked.toString(), StatusColors.Amber)
            LegendItem("Sold", sold.toString(), StatusColors.Green)
        }
    }
}

@Composable
private fun LegendItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = color, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        Text(label.uppercase(), color = TextSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
    }
}
