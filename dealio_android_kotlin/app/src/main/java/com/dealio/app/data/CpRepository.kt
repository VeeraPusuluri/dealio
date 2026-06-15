package com.dealio.app.data

import android.content.Context
import com.dealio.app.data.api.ApiClient
import com.dealio.app.data.api.ApiEnvelope
import com.dealio.app.data.api.BuilderNotification
import com.dealio.app.data.api.CpApi
import com.dealio.app.data.api.CpCommission
import com.dealio.app.data.api.CpContact
import com.dealio.app.data.api.CpContactPayload
import com.dealio.app.data.api.CpDealDetail
import com.dealio.app.data.api.CpDueToday
import com.dealio.app.data.api.CpFollowUp
import com.dealio.app.data.api.CpCallLog
import com.dealio.app.data.api.CpLead
import com.dealio.app.data.api.CpMessageRequest
import com.dealio.app.data.api.CpProfile
import com.dealio.app.data.api.CpProfileUpdateRequest
import com.dealio.app.data.api.CreateCallLogRequest
import com.dealio.app.data.api.CreateCpLeadRequest
import com.dealio.app.data.api.CreateFollowUpRequest
import com.dealio.app.data.api.Meeting
import com.dealio.app.data.api.MeetingNoteRequest
import com.dealio.app.data.api.Project
import com.dealio.app.data.api.ShareLinkResponse
import com.google.gson.Gson
import retrofit2.Response
import java.io.IOException

/**
 * Single entry point for the channel-partner portal. CP endpoints are keyed by
 * the signed-in user's id (cpUserId), read from [TokenStore].
 */
class CpRepository(context: Context) {

    private val api: CpApi = ApiClient.cpApi
    private val tokenStore = TokenStore(context)
    private val gson = Gson()

    val currentUser get() = tokenStore.user()
    private val cpUserId: Long get() = tokenStore.user()?.id ?: -1L
    val name: String get() = tokenStore.user()?.fullName ?: "Partner"

    // ── Projects ──────────────────────────────────────────────────────────────
    suspend fun getProjects(): ApiResult<List<Project>> = call { api.getPublicProjects() }
    suspend fun getProject(id: Long): ApiResult<Project> = call { api.getProject(id) }
    suspend fun getShareLink(projectId: Long): ApiResult<ShareLinkResponse> = call { api.getShareLink(cpUserId, projectId) }

    // ── Leads ─────────────────────────────────────────────────────────────────
    suspend fun getLeads(): ApiResult<List<CpLead>> = call { api.getLeads(cpUserId) }
    suspend fun createLead(projectId: Long, name: String, phone: String, email: String?): ApiResult<Any> =
        call { api.createLead(cpUserId, CreateCpLeadRequest(projectId, name, phone, email?.ifBlank { null })) }

    // ── Deal ──────────────────────────────────────────────────────────────────
    suspend fun getDeal(dealId: Long): ApiResult<CpDealDetail> = call { api.getDeal(cpUserId, dealId) }
    suspend fun agreeDeal(dealId: Long): ApiResult<Any> = call { api.agreeDeal(cpUserId, dealId) }
    suspend fun sendDealMessage(dealId: Long, message: String): ApiResult<Any> =
        call { api.sendDealMessage(cpUserId, dealId, CpMessageRequest(message)) }

    // ── Commissions ───────────────────────────────────────────────────────────
    suspend fun getCommissions(): ApiResult<List<CpCommission>> = call { api.getCommissions(cpUserId) }

    // ── Contacts ──────────────────────────────────────────────────────────────
    suspend fun getContacts(): ApiResult<List<CpContact>> = call { api.getContacts(cpUserId) }
    suspend fun addContact(p: CpContactPayload): ApiResult<Any> = call { api.addContact(cpUserId, p) }
    suspend fun updateContact(id: Long, p: CpContactPayload): ApiResult<Any> = call { api.updateContact(cpUserId, id, p) }
    suspend fun deleteContact(id: Long): ApiResult<Any> = call { api.deleteContact(cpUserId, id) }

    // ── Meetings ──────────────────────────────────────────────────────────────
    suspend fun getMeetings(): ApiResult<List<Meeting>> = call { api.getMeetings(cpUserId) }
    suspend fun addMeetingNote(meetingId: Long, notes: String, rating: Int?): ApiResult<Any> =
        call { api.addMeetingNote(cpUserId, meetingId, MeetingNoteRequest(notes, rating)) }

    // ── Due today ──────────────────────────────────────────────────────────────
    suspend fun getDueToday(): ApiResult<CpDueToday> = call { api.getDueToday(cpUserId) }

    // ── Follow-ups ─────────────────────────────────────────────────────────────
    suspend fun getFollowUps(): ApiResult<List<CpFollowUp>> = call { api.getFollowUps(cpUserId) }
    suspend fun createFollowUp(dealId: Long, dueDate: String, dueTime: String?, reason: String): ApiResult<Any> =
        call { api.createFollowUp(cpUserId, CreateFollowUpRequest(dealId, dueDate, dueTime, reason)) }
    suspend fun markFollowUpDone(id: Long): ApiResult<Any> = call { api.markFollowUpDone(cpUserId, id) }

    // ── Call logs ──────────────────────────────────────────────────────────────
    suspend fun getCallLogs(): ApiResult<List<CpCallLog>> = call { api.getCallLogs(cpUserId) }
    suspend fun createCallLog(dealId: Long, outcome: String, duration: String, notes: String?, nextFollowUp: String?, nextFollowUpTime: String?): ApiResult<Any> =
        call { api.createCallLog(cpUserId, CreateCallLogRequest(dealId, outcome, duration, notes, nextFollowUp, nextFollowUpTime)) }

    // ── Profile ──────────────────────────────────────────────────────────────
    suspend fun getProfile(): ApiResult<CpProfile> = call { api.getProfile(cpUserId) }
    suspend fun updateProfile(body: CpProfileUpdateRequest): ApiResult<Any> = call { api.updateProfile(cpUserId, body) }

    // ── Notifications ──────────────────────────────────────────────────────────
    suspend fun getNotifications(): ApiResult<List<BuilderNotification>> = call { api.getNotifications() }
    suspend fun markAllNotificationsRead(): ApiResult<Any> = call { api.markAllNotificationsRead() }

    // ── Helper ──────────────────────────────────────────────────────────────
    private suspend fun <T> call(block: suspend () -> Response<ApiEnvelope<T>>): ApiResult<T> {
        return try {
            val response = block()
            val envelope = if (response.isSuccessful) response.body()
            else response.errorBody()?.string()?.let { raw ->
                runCatching { gson.fromJson(raw, ApiEnvelope::class.java) }.getOrNull()
            }?.let { ApiEnvelope<T>(ok = it.ok, message = it.message) }
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
