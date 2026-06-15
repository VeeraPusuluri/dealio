package com.dealio.app.ui.cp.leads

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.CpLead
import com.dealio.app.ui.cp.CpViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LeadsState(
    val loading: Boolean = true,
    val error: String? = null,
    val all: List<CpLead> = emptyList(),
    val statusFilter: String = "All",
) {
    val statuses: List<String> get() = listOf("All") + all.map { it.status }.distinct()
    val filtered: List<CpLead> get() = if (statusFilter == "All") all else all.filter { it.status == statusFilter }
}

class LeadsViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(LeadsState())
    val state: StateFlow<LeadsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getLeads()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, all = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun setFilter(f: String) = _state.update { it.copy(statusFilter = f) }
}
