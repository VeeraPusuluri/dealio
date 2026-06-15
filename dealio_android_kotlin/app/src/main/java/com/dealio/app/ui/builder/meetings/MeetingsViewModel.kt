package com.dealio.app.ui.builder.meetings

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Meeting
import com.dealio.app.data.api.MeetingUpdateRequest
import com.dealio.app.ui.builder.BuilderViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MeetingsState(
    val loading: Boolean = true,
    val error: String? = null,
    val all: List<Meeting> = emptyList(),
    val filter: String = "All",
    val working: Boolean = false,
    val toast: String? = null,
) {
    val filters = listOf("All", "Pending", "Confirmed", "Completed")
    val visible: List<Meeting> get() = if (filter == "All") all else all.filter { it.status.equals(filter, true) }
    val pending get() = all.count { it.status.equals("Pending", true) }
    val confirmed get() = all.count { it.status.equals("Confirmed", true) }
    val completed get() = all.count { it.status.equals("Completed", true) }
}

class MeetingsViewModel(app: Application) : BuilderViewModel(app) {

    private val _state = MutableStateFlow(MeetingsState())
    val state: StateFlow<MeetingsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getMeetings()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, all = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun setFilter(f: String) = _state.update { it.copy(filter = f) }

    fun updateStatus(m: Meeting, status: String) {
        _state.update { it.copy(working = true) }
        val body = if (status == "Confirmed")
            MeetingUpdateRequest(status, confirmedDate = m.preferredDate, confirmedTime = m.preferredTime)
        else MeetingUpdateRequest(status)
        viewModelScope.launch {
            when (val r = repo.updateMeeting(m.id, body)) {
                is ApiResult.Success -> { _state.update { it.copy(working = false, toast = "Meeting $status") }; load() }
                is ApiResult.Error -> _state.update { it.copy(working = false, toast = r.message) }
            }
        }
    }

    fun clearToast() = _state.update { it.copy(toast = null) }
}
