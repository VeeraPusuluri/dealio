package com.dealio.app.ui.customer.project

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

data class ProjectDetailState(
    val loading: Boolean = true,
    val error: String? = null,
    val project: Project? = null,
    val working: Boolean = false,
    val message: String? = null,
)

class ProjectDetailViewModel(app: Application) : CustomerViewModel(app) {

    private val _state = MutableStateFlow(ProjectDetailState())
    val state: StateFlow<ProjectDetailState> = _state.asStateFlow()

    fun load(id: Long) {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getProject(id)) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, project = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }

    fun bookVisit(date: String, time: String, type: String, notes: String, onDone: () -> Unit) {
        val p = _state.value.project ?: return
        val builderId = p.builderId ?: return
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = repo.bookMeeting(builderId, p.id, date, time, type, notes.ifBlank { null }, null)
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "Visit requested! The builder will confirm shortly.") }
            if (r is ApiResult.Success) onDone()
        }
    }

    fun shortlist(unitId: String, details: Map<String, String?>) {
        val p = _state.value.project ?: return
        val builderId = p.builderId ?: return
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = repo.shortlistUnit(builderId, p.id, null, unitId, details)
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "Saved to your shortlist!") }
        }
    }

    fun requestPricing(unitId: String, details: Map<String, String?>, note: String?) {
        val p = _state.value.project ?: return
        val builderId = p.builderId ?: return
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = repo.requestPricing(builderId, p.id, unitId, details, note)
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "Pricing request sent to the builder.") }
        }
    }
}
