package com.dealio.app.ui.builder.projects

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.BuilderViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProjectsState(
    val loading: Boolean = true,
    val error: String? = null,
    val all: List<Project> = emptyList(),
    val query: String = "",
    val statusFilter: String = "All",
) {
    val filtered: List<Project>
        get() = all.filter { p ->
            (statusFilter == "All" || (p.status ?: "").equals(statusFilter.replace(" ", "_"), true) ||
                (p.status ?: "").contains(statusFilter.replace(" ", ""), true)) &&
                (query.isBlank() ||
                    p.name.contains(query, true) ||
                    (p.city ?: "").contains(query, true) ||
                    (p.locality ?: "").contains(query, true))
        }
}

class ProjectsViewModel(app: Application) : BuilderViewModel(app) {

    private val _state = MutableStateFlow(ProjectsState())
    val state: StateFlow<ProjectsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getProjects()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, all = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun setQuery(q: String) = _state.update { it.copy(query = q) }
    fun setStatusFilter(f: String) = _state.update { it.copy(statusFilter = f) }
}
