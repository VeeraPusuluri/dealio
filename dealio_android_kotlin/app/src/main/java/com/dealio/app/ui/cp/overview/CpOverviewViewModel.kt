package com.dealio.app.ui.cp.overview

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.CpDueToday
import com.dealio.app.data.api.CpLead
import com.dealio.app.ui.cp.CpViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CpOverviewState(
    val loading: Boolean = true,
    val error: String? = null,
    val name: String = "Partner",
    val tier: String = "Silver",
    val totalEarnings: Double = 0.0,
    val pendingCommission: Double = 0.0,
    val totalDeals: Int = 0,
    val leadsCount: Int = 0,
    val recentLeads: List<CpLead> = emptyList(),
    val due: CpDueToday = CpDueToday(),
)

class CpOverviewViewModel(app: Application) : CpViewModel(app) {

    private val _state = MutableStateFlow(CpOverviewState(name = repo.name))
    val state: StateFlow<CpOverviewState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val profile = repo.getProfile()
            val leads = repo.getLeads()
            val due = repo.getDueToday()

            if (leads is ApiResult.Error && profile is ApiResult.Error) {
                _state.update { it.copy(loading = false, error = leads.message) }
                return@launch
            }
            val cp = (profile as? ApiResult.Success)?.data?.cp
            val leadList = (leads as? ApiResult.Success)?.data ?: emptyList()
            _state.update {
                it.copy(
                    loading = false, error = null,
                    name = (profile as? ApiResult.Success)?.data?.fullName ?: repo.name,
                    tier = cp?.tier ?: "Silver",
                    totalEarnings = cp?.totalEarnings ?: 0.0,
                    pendingCommission = cp?.pendingCommission ?: 0.0,
                    totalDeals = cp?.totalDeals ?: leadList.size,
                    leadsCount = leadList.size,
                    recentLeads = leadList.take(5),
                    due = (due as? ApiResult.Success)?.data ?: CpDueToday(),
                )
            }
        }
    }
}
