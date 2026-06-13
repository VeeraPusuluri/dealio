package com.dealio.app.data.api

import com.google.gson.annotations.SerializedName

// ─── Builder bootstrap ───────────────────────────────────────────────────────

data class EnsureBuilderRequest(
    val name: String?,
    val email: String,
    val phone: String?,
    val userId: Long?,
)

data class EnsureBuilderData(val builderId: Long)

// ─── Project ─────────────────────────────────────────────────────────────────

/**
 * Project as returned by the backend (toProjectDto). Only fields the app renders
 * are declared; Gson ignores everything else. Flexible JSON columns are typed
 * to the shapes the wizard writes.
 */
data class Project(
    val id: Long = 0,
    val builderId: Long? = null,
    val name: String = "",
    val city: String? = null,
    val locality: String? = null,
    val pincode: String? = null,
    val landmark: String? = null,
    val address: String? = null,
    val description: String? = null,
    val projectType: String? = null,
    val status: String? = null,
    val configurations: List<String>? = null,
    val amenities: List<String>? = null,
    val nearbyHighlights: List<String>? = null,
    val totalUnits: Int? = null,
    val availableUnits: Int? = null,
    val bookedUnits: Int? = null,
    val soldUnits: Int? = null,
    val reraNumber: String? = null,
    val reraExpiry: String? = null,
    val reraState: String? = null,
    val priceMin: Double? = null,
    val priceMax: Double? = null,
    val pricePerSqftFrom: Double? = null,
    val pricePerSqftTo: Double? = null,
    val maintenanceCharges: Double? = null,
    val floorRiseCharges: Double? = null,
    val commissionStructure: String? = null,
    val commissionValue: Double? = null,
    val cpIncentive: String? = null,
    val possessionDate: String? = null,
    val featured: Boolean = false,
    val closingSoon: Boolean = false,
    val published: Boolean = true,
    val imageUrl: String? = null,
    val videoUrl: String? = null,
    val googleMapsLink: String? = null,
    val landArea: String? = null,
    val buildingPermitNumber: String? = null,
    val clubhouseAreaSqft: Int? = null,
    val towers: Int? = null,
    val floorsPerTower: Int? = null,
    val specifications: Specifications? = null,
    val paymentPlans: List<PaymentPlan>? = null,
    val locationAdvantages: List<LocationAdvantage>? = null,
    val builderName: String? = null,
    val builderAbout: String? = null,
    val builderYearEstablished: Int? = null,
    val builderDeliveredProjects: Int? = null,
    val builderWebsite: String? = null,
    val createdAt: String? = null,
)

data class Specifications(
    val structure: String? = null,
    val flooring: String? = null,
    val doors: String? = null,
    val windows: String? = null,
    val electrical: String? = null,
    val plumbing: String? = null,
    val kitchen: String? = null,
    val bathrooms: String? = null,
    val painting: String? = null,
)

data class PaymentPlan(val name: String? = null, val description: String? = null)

data class LocationAdvantage(
    val category: String? = null,
    val name: String? = null,
    val distanceKm: String? = null,
    val driveMinutes: String? = null,
)

/** Create / update payload. Null fields are omitted by Gson (matching the web's `undefined`). */
data class ProjectPayload(
    val name: String,
    val city: String? = null,
    val locality: String? = null,
    val address: String? = null,
    val location: String? = null,
    val pincode: String? = null,
    val landmark: String? = null,
    val description: String? = null,
    val status: String? = null,
    val projectType: String? = null,
    val configurations: List<String>? = null,
    val bhkTypes: List<String>? = null,
    val amenities: List<String>? = null,
    val nearbyHighlights: List<String>? = null,
    val totalUnits: Int? = null,
    val availableUnits: Int? = null,
    val bookedUnits: Int? = null,
    val soldUnits: Int? = null,
    val towers: Int? = null,
    val floorsPerTower: Int? = null,
    val reraNumber: String? = null,
    val reraId: String? = null,
    val reraExpiry: String? = null,
    val reraState: String? = null,
    val priceMin: Double? = null,
    val priceMax: Double? = null,
    val pricePerSqftMin: Double? = null,
    val pricePerSqftMax: Double? = null,
    val maintenanceCharges: Double? = null,
    val floorRiseCharges: Double? = null,
    val commissionStructure: String? = null,
    val commissionValue: Double? = null,
    val commissionPercent: Double? = null,
    val cpIncentive: String? = null,
    val possessionDate: String? = null,
    val featured: Boolean? = null,
    val closingSoon: Boolean? = null,
    val videoUrl: String? = null,
    val virtualTourUrl: String? = null,
    val googleMapsLink: String? = null,
    val landArea: String? = null,
    val buildingPermitNumber: String? = null,
    val clubhouseAreaSqft: Int? = null,
    val specifications: Specifications? = null,
    val paymentPlans: List<PaymentPlan>? = null,
    val locationAdvantages: List<LocationAdvantage>? = null,
    val builderName: String? = null,
    val builderAbout: String? = null,
    val builderYearEstablished: Int? = null,
    val builderDeliveredProjects: Int? = null,
    val builderWebsite: String? = null,
)

// ─── Leads / Deals ───────────────────────────────────────────────────────────

data class Lead(
    val id: String = "",
    val customerName: String = "",
    val phone: String = "",
    val email: String = "",
    val projectName: String = "",
    val cpId: String = "",
    val cpName: String = "",
    val budget: Double = 0.0,
    val stage: String = "New Lead",
    val notes: String = "",
    val createdAt: String = "",
    val dealValue: Double = 0.0,
)

data class DealSummary(
    val id: Long = 0,
    val status: String = "",
    val dealValue: Double? = null,
    val createdAt: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val projectName: String = "",
    val cpId: Long? = null,
    val cpName: String? = null,
    val isNRI: Boolean = false,
    val commissionStatus: String? = null,
)

data class DealDetail(
    val id: Long = 0,
    val status: String = "",
    val dealValue: Double? = null,
    val isNRI: Boolean = false,
    val commissionStatus: String? = null,
    val cpAgreed: Boolean = false,
    val customerConfirmed: Boolean = false,
    val createdAt: String = "",
    val updatedAt: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val projectName: String = "",
    val cpName: String? = null,
    val cpPhone: String? = null,
    val cpTier: String? = null,
    val commissionPercent: Double? = null,
    val commissionAmount: Double? = null,
    val messages: List<DealMessage> = emptyList(),
    val dealDocuments: List<DealDocument> = emptyList(),
    val paymentSchedule: List<PaymentInstallment>? = null,
)

data class DealMessage(
    val id: Long = 0,
    val senderId: Long = 0,
    val senderName: String = "",
    val senderRole: String = "",
    val message: String = "",
    val createdAt: String = "",
)

data class DealDocument(
    val id: Long = 0,
    val name: String = "",
    val docType: String = "",
    val fileUrl: String? = null,
    val uploadedByRole: String = "builder",
    val sharedWithCp: Boolean = false,
    val sharedWithCustomer: Boolean = false,
    val createdAt: String = "",
)

data class PaymentInstallment(
    val installment: String = "",
    val amount: Double = 0.0,
    val dueDate: String = "",
    val status: String = "Pending",
)

// ─── Meetings ────────────────────────────────────────────────────────────────

data class Meeting(
    val id: Long = 0,
    val projectId: Long? = null,
    val customerId: Long? = null,
    val cpId: Long? = null,
    val customerName: String = "",
    val customerPhone: String = "",
    val preferredDate: String = "",
    val preferredTime: String = "",
    val meetingType: String? = null,
    val notes: String? = null,
    val builderNotes: String? = null,
    val cpNotes: String? = null,
    val cpRating: Int? = null,
    val customerRating: Int? = null,
    val confirmedDate: String? = null,
    val confirmedTime: String? = null,
    val status: String = "Pending",
    val createdAt: String = "",
    val projectName: String = "",
    val cpName: String? = null,
)

// ─── Commissions ─────────────────────────────────────────────────────────────

data class Commission(
    val id: String = "",
    val projectId: String = "",
    val projectName: String = "",
    val customerName: String = "",
    val saleValue: Double = 0.0,
    val commissionPercent: Double = 0.0,
    val amount: Double = 0.0,
    val status: String = "Pending",
    val releasedDate: String? = null,
)

// ─── Shortlists ──────────────────────────────────────────────────────────────

data class Shortlist(
    val id: Long = 0,
    val customerId: Long = 0,
    val projectId: Long = 0,
    val cpId: Long? = null,
    val unitId: String = "",
    val unitDetails: UnitDetails? = null,
    val status: String = "Pending",
    val builderNote: String? = null,
    val createdAt: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val projectName: String = "",
)

data class UnitDetails(
    val unitNumber: String? = null,
    val tower: String? = null,
    val floor: String? = null,
    val bhkType: String? = null,
    val carpetArea: String? = null,
    val price: String? = null,
    val facing: String? = null,
    val status: String? = null,
)

// ─── Broadcasts ──────────────────────────────────────────────────────────────

data class Broadcast(
    val id: Long = 0,
    val projectId: Long? = null,
    val projectName: String? = null,
    val message: String = "",
    val audience: String = "All CPs",
    val audienceFilter: String? = null,
    val delivered: Int = 0,
    val createdAt: String = "",
)

data class BroadcastRequest(
    val message: String,
    val audience: String,
    val audienceFilter: String? = null,
    val projectId: Long? = null,
    val projectName: String? = null,
)

// ─── Loans ───────────────────────────────────────────────────────────────────

data class Loan(
    val id: Long = 0,
    val dealId: Long = 0,
    val projectId: Long? = null,
    val projectName: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val employmentType: String? = null,
    val loanAmount: Double = 0.0,
    val propertyValue: Double = 0.0,
    val tenureMonths: Int? = null,
    val bank: String? = null,
    val interestRate: Double? = null,
    val emi: Double? = null,
    val officerName: String? = null,
    val cpName: String? = null,
    val status: String = "Applied",
    val submittedAt: String = "",
)

// ─── Notifications ───────────────────────────────────────────────────────────

data class BuilderNotification(
    val id: Long = 0,
    val title: String = "",
    val message: String = "",
    val type: String = "info",
    val link: String? = null,
    val read: Boolean = false,
    val createdAt: String = "",
)

// ─── Documents ───────────────────────────────────────────────────────────────

data class ProjectDocument(
    val id: Long = 0,
    val name: String = "",
    val url: String = "",
    val docType: String = "",
    val createdAt: String = "",
)

// ─── Simple request bodies ───────────────────────────────────────────────────

data class StageRequest(val stage: String)
data class StatusRequest(val status: String)
data class MeetingUpdateRequest(
    val status: String,
    val notes: String? = null,
    val confirmedDate: String? = null,
    val confirmedTime: String? = null,
)
data class MessageRequest(val message: String)
data class ShortlistResponseRequest(val status: String, val builderNote: String? = null)
