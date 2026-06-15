package com.dealio.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Customer-facing endpoints: discovery under "customer/..." and the customer
 * portal under "portal/customer/..." (plus a couple of "builder/customer/..."
 * routes). Portal calls are keyed by the signed-in customer's phone number.
 */
interface CustomerApi {

    // ── Discovery ───────────────────────────────────────────────────────────
    @GET("customer/cities")
    suspend fun getCities(): Response<ApiEnvelope<List<String>>>

    @GET("customer/projects")
    suspend fun getProjects(@Query("city") city: String? = null): Response<ApiEnvelope<List<Project>>>

    @GET("customer/projects/{id}")
    suspend fun getProject(@Path("id") id: Long): Response<ApiEnvelope<Project>>

    @GET("customer/cps")
    suspend fun getAvailableCPs(): Response<ApiEnvelope<List<AvailableCP>>>

    // ── Profile / notifications ───────────────────────────────────────────────
    @PATCH("customer/preferred-city")
    suspend fun setPreferredCity(@Body body: PreferredCityRequest): Response<ApiEnvelope<Any>>

    @PATCH("customer/profile")
    suspend fun updateProfile(@Body body: ProfileUpdateRequest): Response<ApiEnvelope<Any>>

    @GET("customer/notifications")
    suspend fun getNotifications(): Response<ApiEnvelope<List<BuilderNotification>>>

    @PATCH("customer/notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiEnvelope<Any>>

    // ── Meetings / site visits ────────────────────────────────────────────────
    @GET("portal/customer/meetings")
    suspend fun getMyMeetings(@Query("phone") phone: String): Response<ApiEnvelope<List<Meeting>>>

    @GET("portal/customer/booked-slots")
    suspend fun getBookedSlots(
        @Query("builderId") builderId: Long,
        @Query("date") date: String,
    ): Response<ApiEnvelope<List<String>>>

    @POST("portal/customer/meetings")
    suspend fun bookMeeting(@Body body: BookMeetingRequest): Response<ApiEnvelope<Any>>

    @PATCH("portal/customer/meetings/{id}/rating")
    suspend fun rateMeeting(@Path("id") id: Long, @Body body: RateRequest): Response<ApiEnvelope<Any>>

    // ── Deals (My Journey) ──────────────────────────────────────────────────
    @GET("portal/customer/deals")
    suspend fun getMyDeals(@Query("phone") phone: String): Response<ApiEnvelope<List<CustomerDeal>>>

    @PATCH("builder/customer/deals/{dealId}/confirm")
    suspend fun confirmDeal(@Path("dealId") dealId: Long, @Body body: PhoneRequest): Response<ApiEnvelope<Any>>

    @PATCH("portal/customer/deals/{dealId}/accept-negotiation")
    suspend fun acceptNegotiation(@Path("dealId") dealId: Long, @Body body: PhoneRequest): Response<ApiEnvelope<Any>>

    @POST("portal/customer/deals/{dealId}/messages")
    suspend fun sendDealMessage(@Path("dealId") dealId: Long, @Body body: CustomerMessageRequest): Response<ApiEnvelope<Any>>

    // ── Shortlists ────────────────────────────────────────────────────────────
    @GET("portal/customer/shortlist")
    suspend fun getMyShortlists(@Query("phone") phone: String): Response<ApiEnvelope<List<Shortlist>>>

    @POST("portal/customer/shortlist")
    suspend fun shortlistUnit(@Body body: ShortlistRequest): Response<ApiEnvelope<Any>>

    @POST("portal/customer/pricing-requests")
    suspend fun requestPricing(@Body body: PricingRequest): Response<ApiEnvelope<Any>>

    // ── Home loan ─────────────────────────────────────────────────────────────
    @POST("portal/customer/applications")
    suspend fun submitLoanApplication(@Body body: LoanApplicationRequest): Response<ApiEnvelope<Any>>
}
