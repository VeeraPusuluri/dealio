package com.dealio.app.ui.cp.projects

import android.app.Application
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.cp.CpRoutes
import com.dealio.app.ui.cp.CpViewModel
import com.dealio.app.ui.customer.CustomerProjectCard
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CpProjectsState(
    val loading: Boolean = true,
    val error: String? = null,
    val all: List<Project> = emptyList(),
    val query: String = "",
) {
    val filtered: List<Project> get() = if (query.isBlank()) all else all.filter {
        it.name.contains(query, true) || (it.city ?: "").contains(query, true) || (it.locality ?: "").contains(query, true)
    }
}

class CpProjectsViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(CpProjectsState())
    val state: StateFlow<CpProjectsState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getProjects()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, all = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun setQuery(q: String) = _state.update { it.copy(query = q) }
}

@Composable
fun CpProjectsScreen(nav: NavController, vm: CpProjectsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize()) {
        TabHeader("Projects", subtitle = "Share & refer to earn")
        OutlinedTextField(
            value = state.query, onValueChange = vm::setQuery,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Search projects…") },
            leadingIcon = { Icon(Icons.Outlined.Search, null, tint = TextSecondary) },
            singleLine = true, shape = RoundedCornerShape(14.dp), colors = dealioFieldColors(),
        )
        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, onRetry = vm::load)
            state.filtered.isEmpty() -> EmptyState(Icons.Outlined.Apartment, "No projects", "Try a different search.")
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                items(state.filtered.size) { i ->
                    CustomerProjectCard(state.filtered[i]) { nav.navigate(CpRoutes.projectDetail(state.filtered[i].id)) }
                }
            }
        }
    }
}
