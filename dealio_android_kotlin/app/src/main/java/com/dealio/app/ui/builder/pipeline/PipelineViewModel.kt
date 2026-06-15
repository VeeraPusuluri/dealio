package com.dealio.app.ui.builder.pipeline

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Lead
import com.dealio.app.ui.builder.BuilderViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** A lead row with its raw id and resolved display stage. */
data class LeadRow(val id: Long, val lead: Lead, val stage: String)

data class PipelineState(
    val loading: Boolean = true,
    val error: String? = null,
    val rows: List<LeadRow> = emptyList(),
    val selectedStage: String = LEAD_STAGES.first(),
    val updating: Boolean = false,
    val toast: String? = null,
) {
    val counts: Map<String, Int> get() = rows.groupingBy { it.stage }.eachCount()
    val visible: List<LeadRow> get() = rows.filter { it.stage == selectedStage }
    val total: Int get() = rows.size
}

class PipelineViewModel(app: Application) : BuilderViewModel(app) {

    private val _state = MutableStateFlow(PipelineState())
    val state: StateFlow<PipelineState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getLeads()) {
                is ApiResult.Success -> {
                    val rows = r.data.map { l ->
                        LeadRow(l.id.toLongOrNull() ?: 0, l, stageLabel(l.stage))
                    }
                    _state.update { it.copy(loading = false, rows = rows) }
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun selectStage(stage: String) = _state.update { it.copy(selectedStage = stage) }

    fun moveStage(row: LeadRow, toStage: String) {
        _state.update { it.copy(updating = true) }
        viewModelScope.launch {
            when (val r = repo.updateLeadStage(row.id, stageEnum(toStage))) {
                is ApiResult.Success -> {
                    _state.update { s ->
                        s.copy(
                            updating = false,
                            toast = "Moved to $toStage",
                            rows = s.rows.map { if (it.id == row.id) it.copy(stage = toStage) else it },
                        )
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(updating = false, toast = r.message) }
            }
        }
    }

    fun clearToast() = _state.update { it.copy(toast = null) }
}
