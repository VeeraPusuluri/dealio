package com.dealio.app.ui.builder.deals

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.DealDetail
import com.dealio.app.ui.builder.BuilderViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** Forward status flow for a deal, mirroring the web BuilderDealsPage STAGES. */
val DEAL_STAGES = listOf("Meeting Done", "Negotiation", "Agreement", "Pending Booking", "Booked", "Closed")

data class DealDetailState(
    val loading: Boolean = true,
    val error: String? = null,
    val deal: DealDetail? = null,
    val sending: Boolean = false,
    val working: Boolean = false,
    val toast: String? = null,
)

class DealDetailViewModel(app: Application) : BuilderViewModel(app) {

    private val _state = MutableStateFlow(DealDetailState())
    val state: StateFlow<DealDetailState> = _state.asStateFlow()

    private var dealId: Long = 0

    fun load(id: Long) {
        dealId = id
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getDeal(id)) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, deal = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun refresh() = load(dealId)

    fun updateStatus(status: String) {
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            when (val r = repo.updateDealStatus(dealId, status)) {
                is ApiResult.Success -> { _state.update { it.copy(working = false, toast = "Moved to $status") }; load(dealId) }
                is ApiResult.Error -> _state.update { it.copy(working = false, toast = r.message) }
            }
        }
    }

    fun markSold() {
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            when (val r = repo.markDealSold(dealId)) {
                is ApiResult.Success -> { _state.update { it.copy(working = false, toast = "Unit marked sold") }; load(dealId) }
                is ApiResult.Error -> _state.update { it.copy(working = false, toast = r.message) }
            }
        }
    }

    fun sendMessage(text: String) {
        if (text.isBlank()) return
        _state.update { it.copy(sending = true) }
        viewModelScope.launch {
            when (val r = repo.sendDealMessage(dealId, text.trim())) {
                is ApiResult.Success -> { _state.update { it.copy(sending = false) }; load(dealId) }
                is ApiResult.Error -> _state.update { it.copy(sending = false, toast = r.message) }
            }
        }
    }

    fun clearToast() = _state.update { it.copy(toast = null) }
}
