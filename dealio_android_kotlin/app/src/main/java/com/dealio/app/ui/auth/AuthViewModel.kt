package com.dealio.app.ui.auth

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.AuthRepository
import com.dealio.app.data.TokenStore
import com.dealio.app.data.api.ApiClient
import com.dealio.app.data.api.AuthUser
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AuthStep { DETAILS, OTP }

data class AuthUiState(
    val step: AuthStep = AuthStep.DETAILS,
    val loading: Boolean = false,
    val error: String? = null,
    val maskedPhone: String? = null,
    val demoCode: String? = null,
    val resendSecondsLeft: Int = 0,
    /** Non-null once OTP verification succeeded — the screen navigates away. */
    val loggedInUser: AuthUser? = null,
)

/**
 * Drives both the login and signup flows: send OTP → verify OTP.
 * Each screen gets its own instance (scoped to its nav back-stack entry).
 */
class AuthViewModel(app: Application) : AndroidViewModel(app) {

    private val repository = AuthRepository(ApiClient.authApi, TokenStore(app))

    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    private var countdownJob: Job? = null

    fun sendOtp(isSignup: Boolean, phone: String, countryCode: String) {
        if (phone.isBlank()) {
            _state.update { it.copy(error = "Enter your phone number") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            when (val result = repository.sendOtp(isSignup, phone.trim(), countryCode.trim())) {
                is ApiResult.Success -> {
                    _state.update {
                        it.copy(
                            loading = false,
                            step = AuthStep.OTP,
                            maskedPhone = result.data.maskedPhone,
                            demoCode = result.data.demoCode,
                        )
                    }
                    startResendCountdown()
                }
                is ApiResult.Error -> _state.update {
                    it.copy(loading = false, error = result.message)
                }
            }
        }
    }

    fun verifyLogin(phone: String, otp: String) {
        verify { repository.verifyLogin(phone.trim(), otp.trim()) }
    }

    fun verifySignup(phone: String, otp: String, fullName: String, role: String, referralCode: String) {
        if (fullName.isBlank()) {
            _state.update { it.copy(error = "Enter your full name") }
            return
        }
        verify {
            repository.verifySignup(phone.trim(), otp.trim(), fullName.trim(), role, referralCode.trim())
        }
    }

    private fun verify(block: suspend () -> ApiResult<com.dealio.app.data.api.AuthData>) {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            when (val result = block()) {
                is ApiResult.Success -> _state.update {
                    it.copy(loading = false, loggedInUser = result.data.user)
                }
                is ApiResult.Error -> _state.update {
                    it.copy(loading = false, error = result.message)
                }
            }
        }
    }

    fun backToDetails() {
        countdownJob?.cancel()
        _state.update {
            it.copy(step = AuthStep.DETAILS, error = null, demoCode = null, resendSecondsLeft = 0)
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private fun startResendCountdown(seconds: Int = 30) {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            _state.update { it.copy(resendSecondsLeft = seconds) }
            repeat(seconds) {
                delay(1_000)
                _state.update { s -> s.copy(resendSecondsLeft = (s.resendSecondsLeft - 1).coerceAtLeast(0)) }
            }
        }
    }
}
