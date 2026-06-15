package com.dealio.app.ui.builder.overview

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.DealSummary
import com.dealio.app.ui.builder.BuilderViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OverviewState(
    val loading: Boolean = true,
    val error: String? = null,
    val projects: Int = 0,
    val leads: Int = 0,
    val deals: Int = 0,
    val booked: Int = 0,
    val revenue: Double = 0.0,
    val recentDeals: List<DealSummary> = emptyList(),
    val builderName: String? = null,
)

class OverviewViewModel(app: Application) : BuilderViewModel(app) {

    private val _state = MutableStateFlow(OverviewState())
    val state: StateFlow<OverviewState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val name = repo.currentUser?.fullName
            val projects = repo.getProjects()
            val leads = repo.getLeads()
            val deals = repo.getDeals()

            val firstError = listOf(projects, leads, deals)
                .filterIsInstance<ApiResult.Error>().firstOrNull()
            if (firstError != null && projects is ApiResult.Error) {
                _state.update { it.copy(loading = false, error = firstError.message, builderName = name) }
                return@launch
            }

            val projectList = (projects as? ApiResult.Success)?.data ?: emptyList()
            val leadList = (leads as? ApiResult.Success)?.data ?: emptyList()
            val dealList = (deals as? ApiResult.Success)?.data ?: emptyList()
            val booked = dealList.filter { it.status.lowercase() in listOf("booked", "closed") }
            _state.update {
                it.copy(
                    loading = false,
                    error = null,
                    projects = projectList.size,
                    leads = leadList.size,
                    deals = dealList.size,
                    booked = booked.size,
                    revenue = booked.sumOf { d -> d.dealValue ?: 0.0 },
                    recentDeals = dealList.take(6),
                    builderName = name,
                )
            }
        }
    }
}
