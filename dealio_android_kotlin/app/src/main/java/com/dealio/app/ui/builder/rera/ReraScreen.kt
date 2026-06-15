package com.dealio.app.ui.builder.rera

import android.app.Application
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Gavel
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.BuilderViewModel
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.temporal.ChronoUnit

data class ReraState(val loading: Boolean = true, val error: String? = null, val projects: List<Project> = emptyList())

class ReraViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(ReraState())
    val state: StateFlow<ReraState> = _state.asStateFlow()
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

private fun complianceLabel(expiry: String?, reraNumber: String?): String {
    if (reraNumber.isNullOrBlank()) return "Missing"
    if (expiry.isNullOrBlank()) return "No expiry"
    return try {
        val d = LocalDate.parse(expiry.take(10))
        val days = ChronoUnit.DAYS.between(LocalDate.now(), d)
        when {
            days < 0 -> "Expired"
            days <= 90 -> "Expiring soon"
            else -> "Valid"
        }
    } catch (e: Exception) { "Valid" }
}

@Composable
fun ReraScreen(nav: NavController, vm: ReraViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    com.dealio.app.ui.builder.SubScreenScaffold("RERA Compliance", nav) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, vm::load, Modifier.padding(pad))
            state.projects.isEmpty() -> EmptyState(Icons.Outlined.Gavel, "No projects", "Add projects to track their RERA compliance.", Modifier.padding(pad))
            else -> LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.projects.size) { i ->
                    val p = state.projects[i]
                    val label = complianceLabel(p.reraExpiry, p.reraNumber)
                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(p.name, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                                Text(p.reraNumber ?: "No RERA number", color = TextSecondary, fontSize = 12.sp)
                            }
                            StatusChip(label)
                        }
                        Spacer(Modifier.height(8.dp))
                        InfoRow("Expiry", formatDate(p.reraExpiry))
                        InfoRow("State", p.reraState)
                        InfoRow("Building permit", p.buildingPermitNumber)
                    }
                }
            }
        }
    }
}
