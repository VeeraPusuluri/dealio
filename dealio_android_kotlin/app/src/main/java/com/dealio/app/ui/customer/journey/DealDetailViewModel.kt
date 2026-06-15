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

data class DealDetailState(
    val loading: Boolean = true,
    val error: String? = null,
    val deal: CustomerDeal? = null,
    val working: Boolean = false,
    val sending: Boolean = false,
    val message: String? = null,
)

class DealDetailViewModel(app: Application) : CustomerViewModel(app) {

    private val _state = MutableStateFlow(DealDetailState())
    val state: StateFlow<DealDetailState> = _state.asStateFlow()

    private var dealId: Long = 0

    fun load(id: Long, silent: Boolean = false) {
        dealId = id
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getMyDeals()) {
                is ApiResult.Success -> {
                    val deal = r.data.firstOrNull { it.dealId == id }
                    if (deal == null) _state.update { it.copy(loading = false, error = "Deal not found") }
                    else _state.update { it.copy(loading = false, deal = deal) }
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun confirm() = act { repo.confirmDeal(dealId) }
    fun acceptNegotiation() = act { repo.acceptNegotiation(dealId) }

    private fun act(block: suspend () -> ApiResult<Any>) {
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = block()
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "Done!") }
            if (r is ApiResult.Success) load(dealId, silent = true)
        }
    }

    fun sendMessage(text: String) {
        if (text.isBlank()) return
        _state.update { it.copy(sending = true) }
        viewModelScope.launch {
            val r = repo.sendDealMessage(dealId, "builder", text.trim())
            _state.update { it.copy(sending = false, message = (r as? ApiResult.Error)?.message) }
            if (r is ApiResult.Success) load(dealId, silent = true)
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}
