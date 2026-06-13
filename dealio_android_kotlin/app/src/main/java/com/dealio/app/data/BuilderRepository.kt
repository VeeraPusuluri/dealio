package com.dealio.app.data

import android.content.Context
import com.dealio.app.data.api.ApiClient
import com.dealio.app.data.api.ApiEnvelope
import com.dealio.app.data.api.Broadcast
import com.dealio.app.data.api.BroadcastRequest
import com.dealio.app.data.api.BuilderApi
import com.dealio.app.data.api.BuilderNotification
import com.dealio.app.data.api.Commission
import com.dealio.app.data.api.DealDetail
import com.dealio.app.data.api.DealSummary
import com.dealio.app.data.api.EnsureBuilderRequest
import com.dealio.app.data.api.Lead
import com.dealio.app.data.api.Loan
import com.dealio.app.data.api.Meeting
import com.dealio.app.data.api.MeetingUpdateRequest
import com.dealio.app.data.api.MessageRequest
import com.dealio.app.data.api.Project
import com.dealio.app.data.api.ProjectDocument
import com.dealio.app.data.api.ProjectPayload
import com.dealio.app.data.api.Shortlist
import com.dealio.app.data.api.ShortlistResponseRequest
import com.dealio.app.data.api.StageRequest
import com.dealio.app.data.api.StatusRequest
import com.google.gson.Gson
import retrofit2.Response
import java.io.IOException

/**
 * Single entry point for all builder data. Resolves and caches the builderId
 * (via /builder/ensure) the same way the web app does, then proxies the
 * authed endpoints and normalizes failures into [ApiResult].
 */
class BuilderRepository(context: Context) {

    private val api: BuilderApi = ApiClient.builderApi
    private val tokenStore = TokenStore(context)
    private val builderStore = BuilderStore(context)
    private val gson = Gson()

    val currentUser get() = tokenStore.user()

    /** Cached builderId, resolving it via /builder/ensure on first use. */
    suspend fun builderId(): ApiResult<Long> {
        builderStore.builderId?.let { return ApiResult.Success(it) }
        val user = tokenStore.user() ?: return ApiResult.Error("Please sign in again")
        val email = user.email?.takeIf { it.isNotBlank() } ?: "uid${user.id}@dealio.builder"
        return when (val r = call {
            api.ensureBuilder(EnsureBuilderRequest(user.fullName, email, user.phone, user.id))
        }) {
            is ApiResult.Success -> {
                builderStore.builderId = r.data.builderId
                ApiResult.Success(r.data.builderId)
            }
            is ApiResult.Error -> ApiResult.Error(r.message)
        }
    }

    // ── Projects ────────────────────────────────────────────────────────────
    suspend fun getProjects(): ApiResult<List<Project>> =
        withBuilder { bid -> call { api.getProjects(bid) } }

    suspend fun getProject(projectId: Long): ApiResult<Project> =
        withBuilder { bid -> call { api.getProject(bid, projectId) } }

    suspend fun createProject(payload: ProjectPayload): ApiResult<Project> =
        withBuilder { bid -> call { api.createProject(bid, payload) } }

    suspend fun updateProject(projectId: Long, payload: ProjectPayload): ApiResult<Project> =
        withBuilder { bid -> call { api.updateProject(bid, projectId, payload) } }

    suspend fun getDocuments(projectId: Long): ApiResult<List<ProjectDocument>> =
        withBuilder { bid -> call { api.getDocuments(bid, projectId) } }

    // ── Leads ───────────────────────────────────────────────────────────────
    suspend fun getLeads(): ApiResult<List<Lead>> =
        withBuilder { bid -> call { api.getLeads(bid) } }

    suspend fun updateLeadStage(leadId: Long, stage: String): ApiResult<Any> =
        withBuilder { bid -> call { api.updateLeadStage(bid, leadId, StageRequest(stage)) } }

    // ── Deals ───────────────────────────────────────────────────────────────
    suspend fun getDeals(): ApiResult<List<DealSummary>> =
        withBuilder { bid -> call { api.getDeals(bid) } }

    suspend fun getDeal(dealId: Long): ApiResult<DealDetail> =
        withBuilder { bid -> call { api.getDeal(bid, dealId) } }

    suspend fun updateDealStatus(dealId: Long, status: String): ApiResult<Any> =
        withBuilder { bid -> call { api.updateDealStatus(bid, dealId, StatusRequest(status)) } }

    suspend fun sendDealMessage(dealId: Long, message: String): ApiResult<Any> =
        withBuilder { bid -> call { api.sendDealMessage(bid, dealId, MessageRequest(message)) } }

    suspend fun markDealSold(dealId: Long): ApiResult<Any> =
        withBuilder { bid -> call { api.markDealSold(bid, dealId) } }

    // ── Meetings ────────────────────────────────────────────────────────────
    suspend fun getMeetings(): ApiResult<List<Meeting>> =
        withBuilder { bid -> call { api.getMeetings(bid) } }

    suspend fun updateMeeting(meetingId: Long, body: MeetingUpdateRequest): ApiResult<Any> =
        withBuilder { bid -> call { api.updateMeeting(bid, meetingId, body) } }

    // ── Commissions ─────────────────────────────────────────────────────────
    suspend fun getCommissions(): ApiResult<List<Commission>> =
        withBuilder { bid -> call { api.getCommissions(bid) } }

    suspend fun releaseCommission(dealId: Long): ApiResult<Any> =
        withBuilder { bid -> call { api.releaseCommission(bid, dealId) } }

    // ── Shortlists ──────────────────────────────────────────────────────────
    suspend fun getShortlists(): ApiResult<List<Shortlist>> =
        withBuilder { bid -> call { api.getShortlists(bid) } }

    suspend fun respondToShortlist(id: Long, status: String, note: String?): ApiResult<Any> =
        withBuilder { bid -> call { api.respondToShortlist(bid, id, ShortlistResponseRequest(status, note)) } }

    // ── Broadcasts ──────────────────────────────────────────────────────────
    suspend fun getBroadcasts(): ApiResult<List<Broadcast>> =
        withBuilder { bid -> call { api.getBroadcasts(bid) } }

    suspend fun sendBroadcast(body: BroadcastRequest): ApiResult<Broadcast> =
        withBuilder { bid -> call { api.sendBroadcast(bid, body) } }

    // ── Loans ───────────────────────────────────────────────────────────────
    suspend fun getLoans(): ApiResult<List<Loan>> =
        withBuilder { bid -> call { api.getLoans(bid) } }

    // ── Notifications ───────────────────────────────────────────────────────
    suspend fun getNotifications(): ApiResult<List<BuilderNotification>> =
        call { api.getNotifications() }

    suspend fun markAllNotificationsRead(): ApiResult<Any> =
        call { api.markAllNotificationsRead() }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private suspend fun <T> withBuilder(block: suspend (Long) -> ApiResult<T>): ApiResult<T> =
        when (val b = builderId()) {
            is ApiResult.Success -> block(b.data)
            is ApiResult.Error -> ApiResult.Error(b.message)
        }

    /** Unwraps the `{ ok, message, data }` envelope and normalizes failures. */
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
                    ApiResult.Success(Unit as T) // mutations return no data
                else -> ApiResult.Success(envelope.data)
            }
        } catch (e: IOException) {
            ApiResult.Error("Can't reach the Dealio server. Check your connection and try again.")
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Something went wrong")
        }
    }
}
