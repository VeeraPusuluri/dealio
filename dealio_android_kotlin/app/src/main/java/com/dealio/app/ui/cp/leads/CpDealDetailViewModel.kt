package com.dealio.app.ui.cp.leads

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.CpDealDetail
import com.dealio.app.ui.cp.CpViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CpDealDetailState(
    val loading: Boolean = true,
    val error: String? = null,
    val deal: CpDealDetail? = null,
    val working: Boolean = false,
    val sending: Boolean = false,
    val message: String? = null,
)

class CpDealDetailViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(CpDealDetailState())
    val state: StateFlow<CpDealDetailState> = _state.asStateFlow()
    private var dealId = 0L

    fun load(id: Long, silent: Boolean = false) {
        dealId = id
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getDeal(id)) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, deal = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun agree() {
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = repo.agreeDeal(dealId)
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "You've agreed to this deal.") }
            if (r is ApiResult.Success) load(dealId, silent = true)
        }
    }

    fun sendMessage(text: String) {
        if (text.isBlank()) return
        _state.update { it.copy(sending = true) }
        viewModelScope.launch {
            val r = repo.sendDealMessage(dealId, text.trim())
            _state.update { it.copy(sending = false, message = (r as? ApiResult.Error)?.message) }
            if (r is ApiResult.Success) load(dealId, silent = true)
        }
    }

    fun addFollowUp(dueDate: String, dueTime: String?, reason: String) {
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = repo.createFollowUp(dealId, dueDate, dueTime, reason)
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "Follow-up scheduled.") }
        }
    }

    fun logCall(outcome: String, duration: String, notes: String?, nextDate: String?, nextTime: String?) {
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = repo.createCallLog(dealId, outcome, duration, notes, nextDate, nextTime)
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "Call logged.") }
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}
