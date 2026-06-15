package com.dealio.app.ui.customer.visits

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Meeting
import com.dealio.app.ui.customer.CustomerViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class VisitsState(
    val loading: Boolean = true,
    val error: String? = null,
    val meetings: List<Meeting> = emptyList(),
    val message: String? = null,
)

class VisitsViewModel(app: Application) : CustomerViewModel(app) {

    private val _state = MutableStateFlow(VisitsState())
    val state: StateFlow<VisitsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getMyMeetings()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, meetings = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun rate(id: Long, rating: Int) {
        viewModelScope.launch {
            val r = repo.rateMeeting(id, rating)
            _state.update { it.copy(message = (r as? ApiResult.Error)?.message ?: "Thanks for rating your visit!") }
            if (r is ApiResult.Success) load(silent = true)
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}
