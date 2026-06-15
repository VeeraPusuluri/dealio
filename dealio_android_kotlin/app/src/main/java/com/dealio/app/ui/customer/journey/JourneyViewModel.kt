package com.dealio.app.ui.customer.journey

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.CustomerDeal
import com.dealio.app.ui.customer.CustomerViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class JourneyState(
    val loading: Boolean = true,
    val error: String? = null,
    val deals: List<CustomerDeal> = emptyList(),
)

class JourneyViewModel(app: Application) : CustomerViewModel(app) {

    private val _state = MutableStateFlow(JourneyState())
    val state: StateFlow<JourneyState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getMyDeals()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, deals = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}
