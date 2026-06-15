package com.dealio.app.data.api

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path

/**
 * Builder endpoints of the Dealio backend (under /api/builder).
 * All responses use the `{ ok, message, data }` envelope unwrapped via [ApiEnvelope].
 */
interface BuilderApi {

    @POST("builder/ensure")
    suspend fun ensureBuilder(@Body body: EnsureBuilderRequest): Response<ApiEnvelope<EnsureBuilderData>>

    // ── Projects ──────────────────────────────────────────────────────────────
    @GET("builder/{builderId}/projects")
    suspend fun getProjects(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<Project>>>

    @GET("builder/{builderId}/projects/{projectId}")
    suspend fun getProject(
        @Path("builderId") builderId: Long,
        @Path("projectId") projectId: Long,
    ): Response<ApiEnvelope<Project>>

    @POST("builder/{builderId}/projects")
    suspend fun createProject(
        @Path("builderId") builderId: Long,
        @Body body: ProjectPayload,
    ): Response<ApiEnvelope<Project>>

    @PATCH("builder/{builderId}/projects/{projectId}")
    suspend fun updateProject(
        @Path("builderId") builderId: Long,
        @Path("projectId") projectId: Long,
        @Body body: ProjectPayload,
    ): Response<ApiEnvelope<Project>>

    /** Partial update with an arbitrary field set (e.g. just the cover image). */
    @PATCH("builder/{builderId}/projects/{projectId}")
    suspend fun patchProject(
        @Path("builderId") builderId: Long,
        @Path("projectId") projectId: Long,
        @Body body: Map<String, @JvmSuppressWildcards Any?>,
    ): Response<ApiEnvelope<Project>>

    @GET("builder/{builderId}/projects/{projectId}/documents")
    suspend fun getDocuments(
        @Path("builderId") builderId: Long,
        @Path("projectId") projectId: Long,
    ): Response<ApiEnvelope<List<ProjectDocument>>>

    @Multipart
    @POST("builder/{builderId}/projects/{projectId}/image")
    suspend fun uploadProjectImage(
        @Path("builderId") builderId: Long,
        @Path("projectId") projectId: Long,
        @Part file: MultipartBody.Part,
    ): Response<ApiEnvelope<String>>

    // ── Leads ─────────────────────────────────────────────────────────────────
    @GET("builder/{builderId}/leads")
    suspend fun getLeads(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<Lead>>>

    @PATCH("builder/{builderId}/leads/{leadId}/stage")
    suspend fun updateLeadStage(
        @Path("builderId") builderId: Long,
        @Path("leadId") leadId: Long,
        @Body body: StageRequest,
    ): Response<ApiEnvelope<Any>>

    // ── Deals ─────────────────────────────────────────────────────────────────
    @GET("builder/{builderId}/deals")
    suspend fun getDeals(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<DealSummary>>>

    @GET("builder/{builderId}/deals/{dealId}")
    suspend fun getDeal(
        @Path("builderId") builderId: Long,
        @Path("dealId") dealId: Long,
    ): Response<ApiEnvelope<DealDetail>>

    @PATCH("builder/{builderId}/deals/{dealId}/status")
    suspend fun updateDealStatus(
        @Path("builderId") builderId: Long,
        @Path("dealId") dealId: Long,
        @Body body: StatusRequest,
    ): Response<ApiEnvelope<Any>>

    @POST("builder/{builderId}/deals/{dealId}/messages")
    suspend fun sendDealMessage(
        @Path("builderId") builderId: Long,
        @Path("dealId") dealId: Long,
        @Body body: MessageRequest,
    ): Response<ApiEnvelope<Any>>

    @PATCH("builder/{builderId}/deals/{dealId}/mark-sold")
    suspend fun markDealSold(
        @Path("builderId") builderId: Long,
        @Path("dealId") dealId: Long,
    ): Response<ApiEnvelope<Any>>

    // ── Meetings ──────────────────────────────────────────────────────────────
    @GET("builder/{builderId}/meetings")
    suspend fun getMeetings(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<Meeting>>>

    @PATCH("builder/{builderId}/meetings/{meetingId}")
    suspend fun updateMeeting(
        @Path("builderId") builderId: Long,
        @Path("meetingId") meetingId: Long,
        @Body body: MeetingUpdateRequest,
    ): Response<ApiEnvelope<Any>>

    // ── Commissions ───────────────────────────────────────────────────────────
    @GET("builder/{builderId}/commissions")
    suspend fun getCommissions(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<Commission>>>

    @PATCH("builder/{builderId}/commissions/{dealId}/release")
    suspend fun releaseCommission(
        @Path("builderId") builderId: Long,
        @Path("dealId") dealId: Long,
    ): Response<ApiEnvelope<Any>>

    // ── Shortlists ────────────────────────────────────────────────────────────
    @GET("builder/{builderId}/shortlists")
    suspend fun getShortlists(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<Shortlist>>>

    @PATCH("builder/{builderId}/shortlists/{id}")
    suspend fun respondToShortlist(
        @Path("builderId") builderId: Long,
        @Path("id") id: Long,
        @Body body: ShortlistResponseRequest,
    ): Response<ApiEnvelope<Any>>

    // ── Broadcasts ────────────────────────────────────────────────────────────
    @GET("builder/{builderId}/broadcasts")
    suspend fun getBroadcasts(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<Broadcast>>>

    @POST("builder/{builderId}/broadcasts")
    suspend fun sendBroadcast(
        @Path("builderId") builderId: Long,
        @Body body: BroadcastRequest,
    ): Response<ApiEnvelope<Broadcast>>

    // ── Loans ─────────────────────────────────────────────────────────────────
    @GET("builder/{builderId}/loans")
    suspend fun getLoans(@Path("builderId") builderId: Long): Response<ApiEnvelope<List<Loan>>>

    // ── Notifications ─────────────────────────────────────────────────────────
    @GET("builder/notifications")
    suspend fun getNotifications(): Response<ApiEnvelope<List<BuilderNotification>>>

    @PATCH("builder/notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiEnvelope<Any>>
}
