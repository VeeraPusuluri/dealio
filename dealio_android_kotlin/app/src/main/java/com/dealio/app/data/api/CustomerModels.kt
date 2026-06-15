package com.dealio.app.data.api

// ─── Customer-facing deal (My Journey) ───────────────────────────────────────

data class CustomerDeal(
    val dealId: Long = 0,
    val projectId: Long = 0,
    val projectName: String = "Unknown Project",
    val dealStatus: String = "",
    val dealValue: Double? = null,
    val customerConfirmed: Boolean = false,
    val cpAgreed: Boolean = false,
    val createdAt: String = "",
    val loanCaseId: Long? = null,
    val loanAmount: Double? = null,
    val loanStatus: String? = null,
    val tenureMonths: Int? = null,
    val interestRate: Double? = null,
    val dealDocuments: List<DealDocument> = emptyList(),
    val messages: List<DealMessage> = emptyList(),
)

// ─── Available channel partner (for booking) ─────────────────────────────────

data class AvailableCP(
    val id: Long = 0,
    val userId: Long? = null,
    val fullName: String = "",
    val city: String? = null,
    val tier: String? = null,
)

// ─── Request bodies ──────────────────────────────────────────────────────────

data class BookMeetingRequest(
    val builderId: Long,
    val projectId: Long?,
    val customerName: String,
    val customerPhone: String,
    val preferredDate: String,
    val preferredTime: String,
    val meetingType: String? = null,
    val notes: String? = null,
    val cpUserId: Long? = null,
)

data class ShortlistRequest(
    val customerPhone: String,
    val builderId: Long,
    val projectId: Long,
    val cpId: Long? = null,
    val unitId: String,
    val unitDetails: Map<String, String?>,
)

data class PricingRequest(
    val builderId: Long,
    val projectId: Long,
    val customerPhone: String,
    val unitId: String,
    val unitDetails: Map<String, String?>,
    val note: String? = null,
)

data class LoanApplicationRequest(
    val builderId: Long? = null,
    val projectId: Long? = null,
    val customerName: String? = null,
    val customerPhone: String,
    val customerEmail: String? = null,
    val loanAmount: Double,
    val propertyValue: Double,
    val employmentType: String? = null,
    val tenureMonths: Int,
)

data class RateRequest(val rating: Int)
data class PhoneRequest(val phone: String)
data class CustomerMessageRequest(val phone: String, val recipientRole: String, val message: String)
data class PreferredCityRequest(val city: String?)
data class ProfileUpdateRequest(val email: String?)
