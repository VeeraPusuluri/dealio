package com.dealio.app.data.api

// ─── Leads (deals referred by this CP) ───────────────────────────────────────

data class CpLead(
    val id: Long = 0,
    val projectId: Long = 0,
    val projectName: String = "Unknown",
    val builderId: Long? = null,
    val customerName: String = "Unknown",
    val customerPhone: String = "",
    val customerEmail: String? = null,
    val dealValue: Double? = null,
    val status: String = "",
    val commissionStatus: String = "Pending",
    val commissionPercent: Double? = null,
    val estimatedCommission: Double? = null,
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class CpDealDetail(
    val id: Long = 0,
    val status: String = "",
    val dealValue: Double? = null,
    val commissionStatus: String? = null,
    val cpAgreed: Boolean = false,
    val customerConfirmed: Boolean = false,
    val createdAt: String = "",
    val updatedAt: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val projectName: String = "",
    val cpTier: String? = null,
    val commissionPercent: Double? = null,
    val commissionAmount: Double? = null,
    val messages: List<DealMessage> = emptyList(),
    val dealDocuments: List<DealDocument> = emptyList(),
)

// ─── Commissions ─────────────────────────────────────────────────────────────

data class CpCommission(
    val id: Long = 0,
    val status: String = "",
    val dealValue: Double? = null,
    val commissionStatus: String? = null,
    val commissionPercent: Double = 0.0,
    val commissionAmount: Double = 0.0,
    val commissionReleasedAt: String? = null,
    val customerName: String = "Unknown",
    val projectName: String = "Unknown",
    val projectCity: String = "",
    val cpTier: String? = null,
)

// ─── Profile ─────────────────────────────────────────────────────────────────

data class CpProfile(
    val id: Long = 0,
    val fullName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val cp: CpInfo? = null,
)

data class CpInfo(
    val city: String? = null,
    val bio: String? = null,
    val reraNumber: String? = null,
    val tier: String = "Silver",
    val totalDeals: Int = 0,
    val dealsThisMonth: Int = 0,
    val totalEarnings: Double = 0.0,
    val pendingCommission: Double = 0.0,
    val influencerScore: Int = 0,
    val joinedDate: String? = null,
    val phoneVerified: Boolean = false,
    val aadhaarVerified: Boolean = false,
    val panVerified: Boolean = false,
    val reraVerified: Boolean = false,
    val aadhaarUrl: String? = null,
    val panUrl: String? = null,
    val reraUrl: String? = null,
)

// ─── Contacts (CRM) ──────────────────────────────────────────────────────────

data class CpContact(
    val id: Long = 0,
    val name: String = "",
    val phone: String = "",
    val email: String? = null,
    val notes: String? = null,
    val tags: String? = null,
    val bhkPreference: String? = null,
    val createdAt: String = "",
)

data class CpContactPayload(
    val name: String,
    val phone: String,
    val email: String? = null,
    val notes: String? = null,
    val tags: String? = null,
    val bhkPreference: String? = null,
)

// ─── Follow-ups / call logs / due today ─────────────────────────────────────

data class CpFollowUp(
    val id: String = "",
    val customerName: String = "Unknown",
    val projectName: String = "Unknown",
    val reason: String = "",
    val dueDate: String = "",
    val dueTime: String? = null,
    val done: Boolean = false,
)

data class CpCallLog(
    val id: String = "",
    val customerName: String = "Unknown",
    val projectName: String = "Unknown",
    val outcome: String = "",
    val duration: String = "",
    val notes: String? = null,
    val nextFollowUp: String? = null,
    val nextFollowUpTime: String? = null,
    val createdAt: String? = null,
)

data class DueMeeting(
    val id: String = "",
    val customerName: String = "",
    val projectName: String = "",
    val time: String? = null,
    val status: String = "",
)

data class CpDueToday(
    val meetings: List<DueMeeting> = emptyList(),
    val followUps: List<CpFollowUp> = emptyList(),
    val callbacks: List<DueMeeting> = emptyList(),
)

// ─── Share link ──────────────────────────────────────────────────────────────

data class ShareLinkResponse(
    val token: String = "",
    val url: String = "",
    val clickCount: Int = 0,
)

// ─── Request bodies ──────────────────────────────────────────────────────────

data class CreateCpLeadRequest(
    val projectId: Long,
    val customerName: String,
    val customerPhone: String,
    val customerEmail: String? = null,
    val stage: String = "NEW_LEAD",
)

data class CreateFollowUpRequest(val dealId: Long, val dueDate: String, val dueTime: String? = null, val reason: String)
data class CreateCallLogRequest(
    val dealId: Long,
    val outcome: String,
    val duration: String,
    val notes: String? = null,
    val nextFollowUp: String? = null,
    val nextFollowUpTime: String? = null,
)
data class MeetingNoteRequest(val notes: String, val cpRating: Int? = null)
data class CpMessageRequest(val message: String)
data class CpProfileUpdateRequest(
    val fullName: String? = null,
    val email: String? = null,
    val city: String? = null,
    val bio: String? = null,
    val reraNumber: String? = null,
)
