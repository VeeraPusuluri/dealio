package com.dealio.app.data

import com.dealio.app.data.api.ApiEnvelope
import com.dealio.app.data.api.AuthApi
import com.dealio.app.data.api.AuthData
import com.dealio.app.data.api.SendOtpData
import com.dealio.app.data.api.SendOtpRequest
import com.dealio.app.data.api.VerifyLoginRequest
import com.dealio.app.data.api.VerifySignupRequest
import com.google.gson.Gson
import retrofit2.Response
import java.io.IOException

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val message: String) : ApiResult<Nothing>()
}

class AuthRepository(
    private val api: AuthApi,
    private val tokenStore: TokenStore,
) {
    private val gson = Gson()

    suspend fun sendOtp(isSignup: Boolean, phone: String, countryCode: String): ApiResult<SendOtpData> =
        call {
            val body = SendOtpRequest(phone = phone, countryCode = countryCode)
            if (isSignup) api.sendSignupOtp(body) else api.sendLoginOtp(body)
        }

    suspend fun verifyLogin(phone: String, otp: String): ApiResult<AuthData> =
        call { api.verifyLoginOtp(VerifyLoginRequest(phone = phone, otp = otp)) }
            .also { if (it is ApiResult.Success) tokenStore.save(it.data) }

    suspend fun verifySignup(
        phone: String,
        otp: String,
        fullName: String,
        role: String,
        referralCode: String?,
    ): ApiResult<AuthData> =
        call {
            api.verifySignupOtp(
                VerifySignupRequest(
                    phone = phone,
                    otp = otp,
                    fullName = fullName,
                    role = role,
                    referralCode = referralCode?.takeIf { it.isNotBlank() },
                )
            )
        }.also { if (it is ApiResult.Success) tokenStore.save(it.data) }

    /** Unwraps the `{ ok, message, data }` envelope and normalizes failures. */
    private suspend fun <T> call(block: suspend () -> Response<ApiEnvelope<T>>): ApiResult<T> {
        return try {
            val response = block()
            val envelope = if (response.isSuccessful) {
                response.body()
            } else {
                // Error responses carry the envelope too: { ok: false, message }
                response.errorBody()?.string()?.let { raw ->
                    runCatching { gson.fromJson(raw, ApiEnvelope::class.java) }.getOrNull()
                }?.let { ApiEnvelope<T>(ok = it.ok, message = it.message) }
            }
            when {
                envelope == null -> ApiResult.Error("Unexpected server response (HTTP ${response.code()})")
                !envelope.ok -> ApiResult.Error(envelope.message ?: "Request failed")
                envelope.data == null -> ApiResult.Error(envelope.message ?: "Empty response from server")
                else -> ApiResult.Success(envelope.data)
            }
        } catch (e: IOException) {
            ApiResult.Error("Can't reach the Dealio server. Check your connection and try again.")
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Something went wrong")
        }
    }
}
