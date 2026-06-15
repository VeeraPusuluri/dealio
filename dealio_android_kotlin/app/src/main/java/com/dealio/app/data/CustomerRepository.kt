package com.dealio.app.data

import android.content.Context
import com.dealio.app.data.api.ApiClient
import com.dealio.app.data.api.ApiEnvelope
import com.dealio.app.data.api.AvailableCP
import com.dealio.app.data.api.BookMeetingRequest
import com.dealio.app.data.api.BuilderNotification
import com.dealio.app.data.api.CustomerApi
import com.dealio.app.data.api.CustomerDeal
import com.dealio.app.data.api.CustomerMessageRequest
import com.dealio.app.data.api.LoanApplicationRequest
import com.dealio.app.data.api.Meeting
import com.dealio.app.data.api.PhoneRequest
import com.dealio.app.data.api.PreferredCityRequest
import com.dealio.app.data.api.PricingRequest
import com.dealio.app.data.api.Project
import com.dealio.app.data.api.ProfileUpdateRequest
import com.dealio.app.data.api.RateRequest
import com.dealio.app.data.api.Shortlist
import com.dealio.app.data.api.ShortlistRequest
import com.google.gson.Gson
import retrofit2.Response
import java.io.IOException

/**
 * Single entry point for the consumer portal. Portal endpoints are keyed by the
 * signed-in customer's phone, which we read from [TokenStore].
 */
class CustomerRepository(context: Context) {

    private val api: CustomerApi = ApiClient.customerApi
    private val tokenStore = TokenStore(context)
    private val gson = Gson()

    val currentUser get() = tokenStore.user()
    val phone: String get() = tokenStore.user()?.phone ?: ""
    val name: String get() = tokenStore.user()?.fullName ?: "Customer"

    // ── Discovery ─────────────────────────────────────────────────────────────
    suspend fun getCities(): ApiResult<List<String>> = call { api.getCities() }

    suspend fun getProjects(city: String?): ApiResult<List<Project>> =
        call { api.getProjects(city) }

    suspend fun getProject(id: Long): ApiResult<Project> = call { api.getProject(id) }

    suspend fun getAvailableCPs(): ApiResult<List<AvailableCP>> = call { api.getAvailableCPs() }

    // ── Profile / notifications ─────────────────────────────────────────────
    suspend fun setPreferredCity(city: String?): ApiResult<Any> =
        call { api.setPreferredCity(PreferredCityRequest(city)) }

    suspend fun updateProfile(email: String?): ApiResult<Any> =
        call { api.updateProfile(ProfileUpdateRequest(email)) }

    suspend fun getNotifications(): ApiResult<List<BuilderNotification>> =
        call { api.getNotifications() }

    suspend fun markAllNotificationsRead(): ApiResult<Any> =
        call { api.markAllNotificationsRead() }

    // ── Meetings ──────────────────────────────────────────────────────────────
    suspend fun getMyMeetings(): ApiResult<List<Meeting>> = call { api.getMyMeetings(phone) }

    suspend fun getBookedSlots(builderId: Long, date: String): ApiResult<List<String>> =
        call { api.getBookedSlots(builderId, date) }

    suspend fun bookMeeting(
        builderId: Long,
        projectId: Long?,
        date: String,
        time: String,
        type: String?,
        notes: String?,
        cpUserId: Long?,
    ): ApiResult<Any> = call {
        api.bookMeeting(
            BookMeetingRequest(
                builderId = builderId,
                projectId = projectId,
                customerName = name,
                customerPhone = phone,
                preferredDate = date,
                preferredTime = time,
                meetingType = type,
                notes = notes,
                cpUserId = cpUserId,
            ),
        )
    }

    suspend fun rateMeeting(id: Long, rating: Int): ApiResult<Any> =
        call { api.rateMeeting(id, RateRequest(rating)) }

    // ── Deals ───────────────────────────────────────────────────────────────
    suspend fun getMyDeals(): ApiResult<List<CustomerDeal>> = call { api.getMyDeals(phone) }

    suspend fun confirmDeal(dealId: Long): ApiResult<Any> =
        call { api.confirmDeal(dealId, PhoneRequest(phone)) }

    suspend fun acceptNegotiation(dealId: Long): ApiResult<Any> =
        call { api.acceptNegotiation(dealId, PhoneRequest(phone)) }

    suspend fun sendDealMessage(dealId: Long, recipientRole: String, message: String): ApiResult<Any> =
        call { api.sendDealMessage(dealId, CustomerMessageRequest(phone, recipientRole, message)) }

    // ── Shortlists ────────────────────────────────────────────────────────────
    suspend fun getMyShortlists(): ApiResult<List<Shortlist>> = call { api.getMyShortlists(phone) }

    suspend fun shortlistUnit(
        builderId: Long,
        projectId: Long,
        cpId: Long?,
        unitId: String,
        details: Map<String, String?>,
    ): ApiResult<Any> = call {
        api.shortlistUnit(ShortlistRequest(phone, builderId, projectId, cpId, unitId, details))
    }

    suspend fun requestPricing(
        builderId: Long,
        projectId: Long,
        unitId: String,
        details: Map<String, String?>,
        note: String?,
    ): ApiResult<Any> = call {
        api.requestPricing(PricingRequest(builderId, projectId, phone, unitId, details, note))
    }

    // ── Home loan ─────────────────────────────────────────────────────────────
    suspend fun submitLoanApplication(
        builderId: Long?,
        projectId: Long?,
        loanAmount: Double,
        propertyValue: Double,
        employmentType: String?,
        tenureMonths: Int,
        email: String?,
    ): ApiResult<Any> = call {
        api.submitLoanApplication(
            LoanApplicationRequest(
                builderId = builderId,
                projectId = projectId,
                customerName = name,
                customerPhone = phone,
                customerEmail = email,
                loanAmount = loanAmount,
                propertyValue = propertyValue,
                employmentType = employmentType,
                tenureMonths = tenureMonths,
            ),
        )
    }

    // ── Helper ──────────────────────────────────────────────────────────────
    private suspend fun <T> call(block: suspend () -> Response<ApiEnvelope<T>>): ApiResult<T> {
        return try {
            val response = block()
            val envelope = if (response.isSuccessful) {
                response.body()
            } else {
                response.errorBody()?.string()?.let { raw ->
                    runCatching { gson.fromJson(raw, ApiEnvelope::class.java) }.getOrNull()
                }?.let { ApiEnvelope<T>(ok = it.ok, message = it.message) }
            }
            when {
                envelope == null -> ApiResult.Error("Unexpected server response (HTTP ${response.code()})")
                !envelope.ok -> ApiResult.Error(envelope.message ?: "Request failed")
                envelope.data == null ->
                    @Suppress("UNCHECKED_CAST")
                    ApiResult.Success(Unit as T)
                else -> ApiResult.Success(envelope.data)
            }
        } catch (e: IOException) {
            ApiResult.Error("Can't reach the Dealio server. Check your connection and try again.")
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Something went wrong")
        }
    }
}
