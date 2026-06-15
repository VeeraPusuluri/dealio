package com.dealio.app.ui.builder.deals

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

data class DealsState(
    val loading: Boolean = true,
    val error: String? = null,
    val all: List<DealSummary> = emptyList(),
    val filter: String = "All",
) {
    val filters = listOf("All", "Negotiation", "Agreement", "Pending Booking", "Booked", "Closed")
    val visible: List<DealSummary>
        get() = if (filter == "All") all else all.filter { it.status.equals(filter, true) }
    val negotiation get() = all.count { it.status.equals("Negotiation", true) }
    val bookedClosed get() = all.count { it.status.lowercase() in listOf("booked", "closed") }
    val totalValue get() = all.filter { it.status.lowercase() in listOf("booked", "closed") }.sumOf { it.dealValue ?: 0.0 }
}

class DealsViewModel(app: Application) : BuilderViewModel(app) {

    private val _state = MutableStateFlow(DealsState())
    val state: StateFlow<DealsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getDeals()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, all = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun setFilter(f: String) = _state.update { it.copy(filter = f) }
}
