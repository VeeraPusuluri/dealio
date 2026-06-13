package com.dealio.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

/**
 * Auth endpoints of the Dealio backend (under /api/auth).
 * All responses use the `{ ok, message, data }` envelope.
 */
interface AuthApi {

    @POST("auth/login/phone/send-otp")
    suspend fun sendLoginOtp(@Body body: SendOtpRequest): Response<ApiEnvelope<SendOtpData>>

    @POST("auth/login/phone/verify-otp")
    suspend fun verifyLoginOtp(@Body body: VerifyLoginRequest): Response<ApiEnvelope<AuthData>>

    @POST("auth/signup/phone/send-otp")
    suspend fun sendSignupOtp(@Body body: SendOtpRequest): Response<ApiEnvelope<SendOtpData>>

    @POST("auth/signup/phone/verify-otp")
    suspend fun verifySignupOtp(@Body body: VerifySignupRequest): Response<ApiEnvelope<AuthData>>
}

// ── Requests ─────────────────────────────────────────────────────────────────

data class SendOtpRequest(
    val phone: String,
    val countryCode: String? = null,
)

data class VerifyLoginRequest(
    val phone: String,
    val otp: String,
)

data class VerifySignupRequest(
    val phone: String,
    val otp: String,
    val fullName: String,
    val role: String,
    val referralCode: String? = null,
)

// ── Responses ────────────────────────────────────────────────────────────────

data class ApiEnvelope<T>(
    val ok: Boolean,
    val message: String? = null,
    val data: T? = null,
)

data class SendOtpData(
    val message: String? = null,
    val maskedPhone: String? = null,
    /** Echoed by the backend only outside production — handy on the emulator. */
    val demoCode: String? = null,
)

data class AuthData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: AuthUser,
)

data class AuthUser(
    val id: Long,
    val fullName: String?,
    val phone: String,
    val role: String,
    val email: String? = null,
)
