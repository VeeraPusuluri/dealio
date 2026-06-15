package com.dealio.app.ui.builder.pipeline

/** Ordered display stages, mirroring the web BuilderLeads kanban. */
val LEAD_STAGES = listOf(
    "New Lead", "Profile Created", "Meeting Requested", "Meeting Confirmed", "Meeting Done",
    "Negotiation", "Agreement", "Pending Booking", "Booked", "Closed",
)

/** Backend value/enum → display label. */
private val STAGE_MAP = mapOf(
    "NEW_LEAD" to "New Lead",
    "PROFILE_CREATED" to "Profile Created", "Profile Created" to "Profile Created",
    "MEETING_REQUESTED" to "Meeting Requested",
    "MEETING_CONFIRMED" to "Meeting Confirmed",
    "MEETING_DONE" to "Meeting Done",
    "NEGOTIATION" to "Negotiation", "Negotiation" to "Negotiation",
    "AGREEMENT" to "Agreement", "Agreement" to "Agreement",
    "PENDING_BOOKING" to "Pending Booking", "Pending Booking" to "Pending Booking",
    "BOOKED" to "Booked", "Booked" to "Booked",
    "CLOSED" to "Closed", "Closed" to "Closed",
    "Loan Application Created" to "Closed", "Loan Sanctioned" to "Closed",
    "Loan Disbursed" to "Closed", "Registration Done" to "Closed", "Possession Given" to "Closed",
)

/** Display label → backend enum/value expected by updateLeadStage. */
private val STAGE_ENUM = mapOf(
    "New Lead" to "NEW_LEAD",
    "Profile Created" to "Profile Created",
    "Meeting Requested" to "MEETING_REQUESTED",
    "Meeting Confirmed" to "MEETING_CONFIRMED",
    "Meeting Done" to "MEETING_DONE",
    "Negotiation" to "NEGOTIATION",
    "Agreement" to "Agreement",
    "Pending Booking" to "Pending Booking",
    "Booked" to "BOOKED",
    "Closed" to "CLOSED",
)

/** Allowed forward transitions from each stage. */
val NEXT_STAGES = mapOf(
    "New Lead" to listOf("Profile Created", "Meeting Requested", "Negotiation", "Closed"),
    "Profile Created" to listOf("Meeting Requested", "Negotiation", "Closed"),
    "Meeting Requested" to listOf("Meeting Confirmed", "Meeting Done", "Negotiation", "Closed"),
    "Meeting Confirmed" to listOf("Meeting Done", "Negotiation", "Closed"),
    "Meeting Done" to listOf("Negotiation", "Agreement", "Booked", "Closed"),
    "Negotiation" to listOf("Agreement", "Booked", "Closed"),
    "Agreement" to listOf("Pending Booking", "Booked", "Closed"),
    "Pending Booking" to listOf("Booked", "Closed"),
    "Booked" to listOf("Closed"),
    "Closed" to emptyList(),
)

fun stageLabel(raw: String): String = STAGE_MAP[raw] ?: raw
fun stageEnum(label: String): String = STAGE_ENUM[label] ?: label
