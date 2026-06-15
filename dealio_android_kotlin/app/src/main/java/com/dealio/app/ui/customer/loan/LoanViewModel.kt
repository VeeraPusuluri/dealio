package com.dealio.app.ui.customer.loan

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.ui.customer.CustomerViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoanState(
    val submitting: Boolean = false,
    val message: String? = null,
    val done: Boolean = false,
)

class LoanViewModel(app: Application) : CustomerViewModel(app) {

    private val _state = MutableStateFlow(LoanState())
    val state: StateFlow<LoanState> = _state.asStateFlow()

    val customerEmail: String? get() = repo.currentUser?.email

    fun submit(
        builderId: Long?,
        projectId: Long?,
        loanAmount: Double,
        propertyValue: Double,
        employmentType: String,
        tenureYears: Int,
    ) {
        _state.update { it.copy(submitting = true, message = null) }
        viewModelScope.launch {
            val r = repo.submitLoanApplication(
                builderId = builderId,
                projectId = projectId,
                loanAmount = loanAmount,
                propertyValue = propertyValue,
                employmentType = employmentType,
                tenureMonths = tenureYears * 12,
                email = repo.currentUser?.email,
            )
            when (r) {
                is ApiResult.Success -> _state.update { it.copy(submitting = false, done = true, message = "Loan application submitted! A loan officer will reach out.") }
                is ApiResult.Error -> _state.update { it.copy(submitting = false, message = r.message) }
            }
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}
