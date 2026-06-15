package com.dealio.app.ui.builder.projects

import android.app.Application
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.LocationAdvantage
import com.dealio.app.data.api.PaymentPlan
import com.dealio.app.data.api.Project
import com.dealio.app.data.api.ProjectPayload
import com.dealio.app.data.api.Specifications
import com.dealio.app.ui.builder.BuilderViewModel
import kotlinx.coroutines.launch

data class PaymentPlanInput(val name: String = "", val description: String = "")
data class LocationAdvInput(
    val category: String = "Corporate",
    val name: String = "",
    val distanceKm: String = "",
    val driveMinutes: String = "",
)

/** Editable mirror of the web AddProjectWizard — every field the API accepts. */
data class ProjectForm(
    // Identity
    val name: String = "",
    val builderName: String = "",
    val projectType: String = "Apartment",
    val configurations: List<String> = listOf("3BHK"),
    val totalUnits: String = "",
    val towers: String = "",
    val floorsPerTower: String = "",
    val status: String = "Under Construction",
    val reraNumber: String = "",
    val reraExpiry: String = "",
    val reraState: String = "",
    val landArea: String = "",
    val buildingPermitNumber: String = "",
    val description: String = "",
    // Location
    val address: String = "",
    val city: String = "Hyderabad",
    val locality: String = "",
    val pincode: String = "",
    val landmark: String = "",
    val googleMapsLink: String = "",
    val nearbyHighlights: List<String> = emptyList(),
    // Pricing
    val priceFrom: String = "",
    val priceTo: String = "",
    val pricePerSqftFrom: String = "",
    val pricePerSqftTo: String = "",
    val maintenance: String = "",
    val floorRise: String = "",
    val commissionPercent: String = "2.5",
    val cpIncentive: String = "",
    val possessionDate: String = "",
    val closingSoon: Boolean = false,
    val featured: Boolean = false,
    // Amenities & specs
    val amenities: List<String> = listOf("Swimming Pool", "Gym", "Clubhouse"),
    val clubhouseAreaSqft: String = "",
    val specStructure: String = "",
    val specFlooring: String = "",
    val specDoors: String = "",
    val specWindows: String = "",
    val specElectrical: String = "",
    val specPlumbing: String = "",
    val specKitchen: String = "",
    val specBathrooms: String = "",
    val specPainting: String = "",
    // Plans
    val paymentPlans: List<PaymentPlanInput> = listOf(PaymentPlanInput("20:80", "20% on booking, 80% on possession")),
    val locationAdvantages: List<LocationAdvInput> = listOf(LocationAdvInput()),
    // Developer
    val builderAbout: String = "",
    val builderYearEstablished: String = "",
    val builderDeliveredProjects: String = "",
    val builderWebsite: String = "",
    // Media
    val videoUrl: String = "",
    val virtualTourUrl: String = "",
    val imageUri: Uri? = null,
    val existingImageUrl: String? = null,
)

class ProjectFormViewModel(app: Application) : BuilderViewModel(app) {

    var form by mutableStateOf(ProjectForm())
        private set
    var editingId: Long? = null
        private set
    var loading by mutableStateOf(false)
        private set
    var submitting by mutableStateOf(false)
        private set
    var error by mutableStateOf<String?>(null)
    var savedProjectId by mutableStateOf<Long?>(null)
        private set

    fun update(block: ProjectForm.() -> ProjectForm) { form = form.block() }

    fun loadForEdit(projectId: Long) {
        if (editingId == projectId) return
        editingId = projectId
        loading = true
        viewModelScope.launch {
            when (val r = repo.getProject(projectId)) {
                is ApiResult.Success -> { form = r.data.toForm(); loading = false }
                is ApiResult.Error -> { error = r.message; loading = false }
            }
        }
    }

    private fun statusEnum(s: String) = when (s) {
        "Pre-Launch" -> "PRE_LAUNCH"
        "Launched" -> "LAUNCHED"
        "Under Construction" -> "UNDER_CONSTRUCTION"
        "Ready to Move" -> "READY_TO_MOVE"
        else -> "PRE_LAUNCH"
    }

    private fun ProjectForm.toPayload(): ProjectPayload {
        val specs = Specifications(
            structure = specStructure.ifBlank { null }, flooring = specFlooring.ifBlank { null },
            doors = specDoors.ifBlank { null }, windows = specWindows.ifBlank { null },
            electrical = specElectrical.ifBlank { null }, plumbing = specPlumbing.ifBlank { null },
            kitchen = specKitchen.ifBlank { null }, bathrooms = specBathrooms.ifBlank { null },
            painting = specPainting.ifBlank { null },
        )
        val hasSpecs = listOf(specStructure, specFlooring, specDoors, specWindows, specElectrical,
            specPlumbing, specKitchen, specBathrooms, specPainting).any { it.isNotBlank() }
        val plans = paymentPlans.filter { it.name.isNotBlank() }.map { PaymentPlan(it.name, it.description) }
        val locs = locationAdvantages.filter { it.name.isNotBlank() }
            .map { LocationAdvantage(it.category, it.name, it.distanceKm.ifBlank { null }, it.driveMinutes.ifBlank { null }) }
        val pct = commissionPercent.toDoubleOrNull()
        return ProjectPayload(
            name = name.trim(),
            city = city.ifBlank { null },
            locality = locality.ifBlank { null },
            address = address.ifBlank { null },
            location = address.ifBlank { locality.ifBlank { city } },
            pincode = pincode.ifBlank { null },
            landmark = landmark.ifBlank { null },
            description = description.ifBlank { null },
            status = statusEnum(status),
            projectType = projectType.uppercase().replace(" ", "_"),
            configurations = configurations.ifEmpty { null },
            bhkTypes = configurations.ifEmpty { null },
            amenities = amenities.ifEmpty { null },
            nearbyHighlights = nearbyHighlights.ifEmpty { null },
            totalUnits = totalUnits.toIntOrNull(),
            towers = towers.toIntOrNull(),
            floorsPerTower = floorsPerTower.toIntOrNull(),
            reraNumber = reraNumber.ifBlank { null },
            reraId = reraNumber.ifBlank { null },
            reraExpiry = reraExpiry.ifBlank { null },
            reraState = reraState.ifBlank { null },
            priceMin = priceFrom.toDoubleOrNull(),
            priceMax = priceTo.toDoubleOrNull(),
            pricePerSqftMin = pricePerSqftFrom.toDoubleOrNull(),
            pricePerSqftMax = pricePerSqftTo.toDoubleOrNull(),
            maintenanceCharges = maintenance.toDoubleOrNull(),
            floorRiseCharges = floorRise.toDoubleOrNull(),
            commissionStructure = "FLAT",
            commissionValue = pct,
            commissionPercent = pct,
            cpIncentive = cpIncentive.ifBlank { null },
            possessionDate = possessionDate.ifBlank { null },
            featured = featured,
            closingSoon = closingSoon,
            videoUrl = videoUrl.ifBlank { null },
            virtualTourUrl = virtualTourUrl.ifBlank { null },
            googleMapsLink = googleMapsLink.ifBlank { null },
            landArea = landArea.ifBlank { null },
            buildingPermitNumber = buildingPermitNumber.ifBlank { null },
            clubhouseAreaSqft = clubhouseAreaSqft.toIntOrNull(),
            specifications = if (hasSpecs) specs else null,
            paymentPlans = plans.ifEmpty { null },
            locationAdvantages = locs.ifEmpty { null },
            builderName = builderName.ifBlank { null },
            builderAbout = builderAbout.ifBlank { null },
            builderYearEstablished = builderYearEstablished.toIntOrNull(),
            builderDeliveredProjects = builderDeliveredProjects.toIntOrNull(),
            builderWebsite = builderWebsite.ifBlank { null },
        )
    }

    /** Returns null on success (and sets [savedProjectId]); a message on validation/API failure. */
    fun save(onImageBytes: (Uri) -> Triple<ByteArray, String, String>?, onDone: (Long) -> Unit) {
        val v = validate() ; if (v != null) { error = v; return }
        submitting = true; error = null
        viewModelScope.launch {
            val payload = form.toPayload()
            val id = editingId
            val result = if (id != null) repo.updateProject(id, payload).map { id }
            else repo.createProject(payload).map { it.id }

            when (result) {
                is ApiResult.Success -> {
                    val projectId = result.data
                    form.imageUri?.let { uri ->
                        onImageBytes(uri)?.let { (bytes, fileName, mime) ->
                            repo.uploadProjectImage(projectId, bytes, fileName, mime)
                        }
                    }
                    submitting = false
                    savedProjectId = projectId
                    onDone(projectId)
                }
                is ApiResult.Error -> { submitting = false; error = result.message }
            }
        }
    }

    private fun validate(): String? = when {
        form.name.isBlank() -> "Project name is required"
        form.configurations.isEmpty() -> "Select at least one configuration"
        (form.totalUnits.toIntOrNull() ?: 0) <= 0 -> "Total units is required"
        form.reraNumber.isBlank() -> "RERA number is required"
        form.address.isBlank() -> "Address is required"
        form.locality.isBlank() -> "Locality is required"
        form.pincode.length != 6 -> "Pincode must be 6 digits"
        (form.priceFrom.toDoubleOrNull() ?: 0.0) <= 0 -> "Starting price is required"
        (form.priceTo.toDoubleOrNull() ?: 0.0) <= 0 -> "Ending price is required"
        form.possessionDate.isBlank() -> "Possession date is required"
        else -> null
    }

    private fun <A, B> ApiResult<A>.map(f: (A) -> B): ApiResult<B> = when (this) {
        is ApiResult.Success -> ApiResult.Success(f(data))
        is ApiResult.Error -> this
    }
}

private fun Project.toForm() = ProjectForm(
    name = name,
    builderName = builderName ?: "",
    projectType = (projectType ?: "APARTMENT").lowercase().split("_").joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } },
    configurations = configurations ?: emptyList(),
    totalUnits = totalUnits?.toString() ?: "",
    towers = towers?.toString() ?: "",
    floorsPerTower = floorsPerTower?.toString() ?: "",
    status = when (status?.uppercase()) {
        "PRE_LAUNCH" -> "Pre-Launch"; "LAUNCHED" -> "Launched"
        "READY_TO_MOVE" -> "Ready to Move"; else -> "Under Construction"
    },
    reraNumber = reraNumber ?: "",
    reraExpiry = reraExpiry ?: "",
    reraState = reraState ?: "",
    landArea = landArea ?: "",
    buildingPermitNumber = buildingPermitNumber ?: "",
    description = description ?: "",
    address = address ?: "",
    city = city ?: "Hyderabad",
    locality = locality ?: "",
    pincode = pincode ?: "",
    landmark = landmark ?: "",
    googleMapsLink = googleMapsLink ?: "",
    nearbyHighlights = nearbyHighlights ?: emptyList(),
    priceFrom = priceMin?.let { if (it % 1.0 == 0.0) it.toLong().toString() else it.toString() } ?: "",
    priceTo = priceMax?.let { if (it % 1.0 == 0.0) it.toLong().toString() else it.toString() } ?: "",
    pricePerSqftFrom = pricePerSqftFrom?.let { it.toLong().toString() } ?: "",
    pricePerSqftTo = pricePerSqftTo?.let { it.toLong().toString() } ?: "",
    maintenance = maintenanceCharges?.let { it.toLong().toString() } ?: "",
    floorRise = floorRiseCharges?.let { it.toLong().toString() } ?: "",
    commissionPercent = commissionValue?.toString() ?: "2.5",
    cpIncentive = cpIncentive ?: "",
    possessionDate = possessionDate ?: "",
    closingSoon = closingSoon,
    featured = featured,
    amenities = amenities ?: emptyList(),
    clubhouseAreaSqft = clubhouseAreaSqft?.toString() ?: "",
    specStructure = specifications?.structure ?: "",
    specFlooring = specifications?.flooring ?: "",
    specDoors = specifications?.doors ?: "",
    specWindows = specifications?.windows ?: "",
    specElectrical = specifications?.electrical ?: "",
    specPlumbing = specifications?.plumbing ?: "",
    specKitchen = specifications?.kitchen ?: "",
    specBathrooms = specifications?.bathrooms ?: "",
    specPainting = specifications?.painting ?: "",
    paymentPlans = paymentPlans?.map { PaymentPlanInput(it.name ?: "", it.description ?: "") }
        ?.ifEmpty { listOf(PaymentPlanInput()) } ?: listOf(PaymentPlanInput()),
    locationAdvantages = locationAdvantages?.map {
        LocationAdvInput(it.category ?: "Corporate", it.name ?: "", it.distanceKm ?: "", it.driveMinutes ?: "")
    }?.ifEmpty { listOf(LocationAdvInput()) } ?: listOf(LocationAdvInput()),
    builderAbout = builderAbout ?: "",
    builderYearEstablished = builderYearEstablished?.toString() ?: "",
    builderDeliveredProjects = builderDeliveredProjects?.toString() ?: "",
    builderWebsite = builderWebsite ?: "",
    videoUrl = videoUrl ?: "",
    virtualTourUrl = "",
    existingImageUrl = imageUrl ?: coverUrl,
)
