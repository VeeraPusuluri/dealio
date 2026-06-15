package com.dealio.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * Channel-partner endpoints under "cp/...". Most are keyed by the signed-in
 * user's id (cpUserId). Project discovery reuses the public "builder/projects".
 */
interface CpApi {

    // ── Project discovery (public marketplace) ────────────────────────────────
    @GET("builder/projects")
    suspend fun getPublicProjects(): Response<ApiEnvelope<List<Project>>>

    @GET("customer/projects/{id}")
    suspend fun getProject(@Path("id") id: Long): Response<ApiEnvelope<Project>>

    @POST("cp/{cpUserId}/projects/{projectId}/share-link")
    suspend fun getShareLink(
        @Path("cpUserId") cpUserId: Long,
        @Path("projectId") projectId: Long,
    ): Response<ApiEnvelope<ShareLinkResponse>>

    // ── Leads ─────────────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/leads")
    suspend fun getLeads(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<List<CpLead>>>

    @POST("cp/{cpUserId}/leads")
    suspend fun createLead(@Path("cpUserId") cpUserId: Long, @Body body: CreateCpLeadRequest): Response<ApiEnvelope<Any>>

    // ── Deal detail ──────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/deals/{dealId}")
    suspend fun getDeal(@Path("cpUserId") cpUserId: Long, @Path("dealId") dealId: Long): Response<ApiEnvelope<CpDealDetail>>

    @PATCH("cp/{cpUserId}/deals/{dealId}/agree")
    suspend fun agreeDeal(@Path("cpUserId") cpUserId: Long, @Path("dealId") dealId: Long): Response<ApiEnvelope<Any>>

    @POST("cp/{cpUserId}/deals/{dealId}/messages")
    suspend fun sendDealMessage(@Path("cpUserId") cpUserId: Long, @Path("dealId") dealId: Long, @Body body: CpMessageRequest): Response<ApiEnvelope<Any>>

    // ── Commissions ───────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/commissions")
    suspend fun getCommissions(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<List<CpCommission>>>

    // ── Contacts ──────────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/contacts")
    suspend fun getContacts(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<List<CpContact>>>

    @POST("cp/{cpUserId}/contacts")
    suspend fun addContact(@Path("cpUserId") cpUserId: Long, @Body body: CpContactPayload): Response<ApiEnvelope<Any>>

    @PATCH("cp/{cpUserId}/contacts/{contactId}")
    suspend fun updateContact(@Path("cpUserId") cpUserId: Long, @Path("contactId") contactId: Long, @Body body: CpContactPayload): Response<ApiEnvelope<Any>>

    @DELETE("cp/{cpUserId}/contacts/{contactId}")
    suspend fun deleteContact(@Path("cpUserId") cpUserId: Long, @Path("contactId") contactId: Long): Response<ApiEnvelope<Any>>

    // ── Meetings ──────────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/meetings")
    suspend fun getMeetings(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<List<Meeting>>>

    @PATCH("cp/{cpUserId}/meetings/{meetingId}/notes")
    suspend fun addMeetingNote(@Path("cpUserId") cpUserId: Long, @Path("meetingId") meetingId: Long, @Body body: MeetingNoteRequest): Response<ApiEnvelope<Any>>

    // ── Due today ──────────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/due-today")
    suspend fun getDueToday(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<CpDueToday>>

    // ── Follow-ups ─────────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/follow-ups")
    suspend fun getFollowUps(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<List<CpFollowUp>>>

    @POST("cp/{cpUserId}/follow-ups")
    suspend fun createFollowUp(@Path("cpUserId") cpUserId: Long, @Body body: CreateFollowUpRequest): Response<ApiEnvelope<Any>>

    @PATCH("cp/{cpUserId}/follow-ups/{id}/done")
    suspend fun markFollowUpDone(@Path("cpUserId") cpUserId: Long, @Path("id") id: Long): Response<ApiEnvelope<Any>>

    // ── Call logs ──────────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/call-logs")
    suspend fun getCallLogs(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<List<CpCallLog>>>

    @POST("cp/{cpUserId}/call-logs")
    suspend fun createCallLog(@Path("cpUserId") cpUserId: Long, @Body body: CreateCallLogRequest): Response<ApiEnvelope<Any>>

    // ── Profile ──────────────────────────────────────────────────────────────
    @GET("cp/{cpUserId}/profile")
    suspend fun getProfile(@Path("cpUserId") cpUserId: Long): Response<ApiEnvelope<CpProfile>>

    @PATCH("cp/{cpUserId}/profile")
    suspend fun updateProfile(@Path("cpUserId") cpUserId: Long, @Body body: CpProfileUpdateRequest): Response<ApiEnvelope<Any>>

    // ── Notifications ──────────────────────────────────────────────────────────
    @GET("cp/notifications")
    suspend fun getNotifications(): Response<ApiEnvelope<List<BuilderNotification>>>

    @PATCH("cp/notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiEnvelope<Any>>
}
