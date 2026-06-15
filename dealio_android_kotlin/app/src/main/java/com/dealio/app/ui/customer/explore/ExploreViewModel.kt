package com.dealio.app.ui.customer.explore

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Project
import com.dealio.app.ui.customer.CustomerViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ExploreState(
    val loading: Boolean = true,
    val error: String? = null,
    val cities: List<String> = emptyList(),
    val selectedCity: String? = null,
    val query: String = "",
    val all: List<Project> = emptyList(),
    val name: String = "Customer",
) {
    val featured: List<Project> get() = all.filter { it.featured }
    val filtered: List<Project>
        get() = all.filter { p ->
            (selectedCity == null || (p.city ?: "").equals(selectedCity, true)) &&
                (query.isBlank() ||
                    p.name.contains(query, true) ||
                    (p.locality ?: "").contains(query, true) ||
                    (p.city ?: "").contains(query, true))
        }
}

class ExploreViewModel(app: Application) : CustomerViewModel(app) {

    private val _state = MutableStateFlow(ExploreState(name = repo.name))
    val state: StateFlow<ExploreState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val projects = repo.getProjects(null)
            val cities = repo.getCities()
            when (projects) {
                is ApiResult.Success -> _state.update {
                    it.copy(
                        loading = false,
                        all = projects.data,
                        cities = (cities as? ApiResult.Success)?.data ?: emptyList(),
                        name = repo.name,
                    )
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = projects.message) }
            }
        }
    }

    fun setCity(city: String?) = _state.update { it.copy(selectedCity = city) }
    fun setQuery(q: String) = _state.update { it.copy(query = q) }
}
