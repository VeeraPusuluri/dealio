package com.dealio.app.ui.builder.projects

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.AddPhotoAlternate
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.dealio.app.ui.builder.ChipMultiSelect
import com.dealio.app.ui.builder.ChipSingleSelect
import com.dealio.app.ui.builder.DateField
import com.dealio.app.ui.builder.FieldRow
import com.dealio.app.ui.builder.FormSectionCard
import com.dealio.app.ui.builder.LabeledField
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.SwitchRow
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.ErrorRed
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

private val bhkOptions = listOf("Studio", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "Penthouse")
private val statusOptions = listOf("Pre-Launch", "Launched", "Under Construction", "Ready to Move")
private val projectTypes = listOf("Apartment", "Villa", "Plot", "Commercial", "Mixed Use")
private val cityOptions = listOf("Hyderabad", "Bengaluru", "Mumbai", "Pune", "Delhi NCR", "Chennai")
private val nearbyOptions = listOf("Metro Station", "Airport", "IT Park", "Hospital", "School", "Mall", "Highway")
private val amenityOptions = listOf(
    "Swimming Pool", "Gym", "Clubhouse", "Children's Play Area", "Jogging Track", "Tennis Court",
    "Basketball Court", "Indoor Games", "Party Hall", "Co-working Space", "EV Charging", "Solar Power",
    "Rainwater Harvesting", "24hr Security", "CCTV", "Power Backup", "Intercom", "Vastu Compliant",
    "Gated Community", "Visitor Parking", "Landscaped Gardens", "Senior Citizen Area",
)
private val advCategories = listOf("Corporate", "Education", "Healthcare", "Transit", "Retail", "Leisure")

@Composable
fun ProjectFormScreen(nav: NavController, projectId: Long?, vm: ProjectFormViewModel = viewModel()) {
    val context = LocalContext.current
    LaunchedEffect(projectId) { if (projectId != null) vm.loadForEdit(projectId) }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) vm.update { copy(imageUri = uri) }
    }

    val form = vm.form
    val isEdit = projectId != null

    SubScreenScaffold(
        title = if (isEdit) "Edit project" else "New project",
        nav = nav,
        actions = {
            if (vm.submitting) {
                CircularProgressIndicator(Modifier.padding(end = 16.dp).size(20.dp), color = Teal, strokeWidth = 2.dp)
            } else {
                Text(
                    "Save", color = Teal, fontWeight = FontWeight.Bold, fontSize = 15.sp,
                    modifier = Modifier.padding(end = 16.dp).clickable { submit(vm, context, nav) },
                )
            }
        },
    ) { pad ->
        if (vm.loading) {
            LoadingState(Modifier.padding(pad))
            return@SubScreenScaffold
        }
        Column(
            Modifier.fillMaxSize().padding(pad).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // Hero image
            Box(
                Modifier.fillMaxWidth().height(170.dp)
                    .background(Color.White, RoundedCornerShape(18.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
                    .clickable { picker.launch("image/*") },
                contentAlignment = Alignment.Center,
            ) {
                val preview = form.imageUri ?: resolveUrl(form.existingImageUrl)
                if (preview != null) {
                    AsyncImage(preview, "Cover", Modifier.fillMaxSize().clip(RoundedCornerShape(18.dp)), contentScale = ContentScale.Crop)
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Outlined.AddPhotoAlternate, null, tint = Teal, modifier = Modifier.size(34.dp))
                        Spacer(Modifier.height(6.dp))
                        Text("Add hero image", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }

            // 1 — Identity
            FormSectionCard("Identity", "Name, type & RERA") {
                LabeledField("Project name", form.name, { v -> vm.update { copy(name = v) } }, required = true, placeholder = "e.g. Skyline Residences")
                LabeledField("Developer / company", form.builderName, { v -> vm.update { copy(builderName = v) } }, placeholder = "Your company name")
                FieldLabel("Project type")
                ChipSingleSelect(projectTypes, form.projectType) { v -> vm.update { copy(projectType = v) } }
                Spacer(Modifier.height(12.dp))
                FieldLabel("Configurations", required = true)
                ChipMultiSelect(bhkOptions, form.configurations) { opt -> vm.update { copy(configurations = configurations.toggle(opt)) } }
                Spacer(Modifier.height(12.dp))
                FieldRow(
                    { LabeledField("Total units", form.totalUnits, { v -> vm.update { copy(totalUnits = v.digits()) } }, required = true, keyboardType = KeyboardType.Number) },
                    { LabeledField("Towers", form.towers, { v -> vm.update { copy(towers = v.digits()) } }, keyboardType = KeyboardType.Number) },
                )
                LabeledField("Floors per tower", form.floorsPerTower, { v -> vm.update { copy(floorsPerTower = v.digits()) } }, keyboardType = KeyboardType.Number)
                FieldLabel("Status")
                ChipSingleSelect(statusOptions, form.status) { v -> vm.update { copy(status = v) } }
                Spacer(Modifier.height(12.dp))
                LabeledField("RERA number", form.reraNumber, { v -> vm.update { copy(reraNumber = v) } }, required = true, placeholder = "P02400012345")
                DateField("RERA expiry", form.reraExpiry) { v -> vm.update { copy(reraExpiry = v) } }
                FieldRow(
                    { LabeledField("RERA state", form.reraState, { v -> vm.update { copy(reraState = v) } }) },
                    { LabeledField("Land area", form.landArea, { v -> vm.update { copy(landArea = v) } }, placeholder = "5 acres") },
                )
                LabeledField("Building permit no.", form.buildingPermitNumber, { v -> vm.update { copy(buildingPermitNumber = v) } })
                LabeledField("Description", form.description, { v -> vm.update { copy(description = v) } }, singleLine = false, minLines = 3)
            }

            // 2 — Location
            FormSectionCard("Location") {
                LabeledField("Address", form.address, { v -> vm.update { copy(address = v) } }, required = true, singleLine = false, minLines = 2)
                FieldLabel("City")
                ChipSingleSelect(cityOptions, form.city) { v -> vm.update { copy(city = v) } }
                Spacer(Modifier.height(12.dp))
                FieldRow(
                    { LabeledField("Locality", form.locality, { v -> vm.update { copy(locality = v) } }, required = true) },
                    { LabeledField("Pincode", form.pincode, { v -> vm.update { copy(pincode = v.digits().take(6)) } }, required = true, keyboardType = KeyboardType.Number) },
                )
                LabeledField("Landmark", form.landmark, { v -> vm.update { copy(landmark = v) } })
                LabeledField("Google Maps link", form.googleMapsLink, { v -> vm.update { copy(googleMapsLink = v) } }, keyboardType = KeyboardType.Uri)
                FieldLabel("Nearby highlights")
                ChipMultiSelect(nearbyOptions, form.nearbyHighlights) { opt -> vm.update { copy(nearbyHighlights = nearbyHighlights.toggle(opt)) } }
            }

            // 3 — Pricing
            FormSectionCard("Pricing & commission") {
                FieldRow(
                    { LabeledField("Price from (₹)", form.priceFrom, { v -> vm.update { copy(priceFrom = v.digits()) } }, required = true, keyboardType = KeyboardType.Number) },
                    { LabeledField("Price to (₹)", form.priceTo, { v -> vm.update { copy(priceTo = v.digits()) } }, required = true, keyboardType = KeyboardType.Number) },
                )
                FieldRow(
                    { LabeledField("₹/sq.ft from", form.pricePerSqftFrom, { v -> vm.update { copy(pricePerSqftFrom = v.digits()) } }, keyboardType = KeyboardType.Number) },
                    { LabeledField("₹/sq.ft to", form.pricePerSqftTo, { v -> vm.update { copy(pricePerSqftTo = v.digits()) } }, keyboardType = KeyboardType.Number) },
                )
                FieldRow(
                    { LabeledField("Maintenance (₹)", form.maintenance, { v -> vm.update { copy(maintenance = v.digits()) } }, keyboardType = KeyboardType.Number) },
                    { LabeledField("Floor rise (₹)", form.floorRise, { v -> vm.update { copy(floorRise = v.digits()) } }, keyboardType = KeyboardType.Number) },
                )
                FieldRow(
                    { LabeledField("CP commission %", form.commissionPercent, { v -> vm.update { copy(commissionPercent = v) } }, keyboardType = KeyboardType.Decimal) },
                    { LabeledField("CP incentive", form.cpIncentive, { v -> vm.update { copy(cpIncentive = v) } }) },
                )
                DateField("Possession date", form.possessionDate, required = true) { v -> vm.update { copy(possessionDate = v) } }
                SwitchRow("Closing soon", "Show an urgency badge", form.closingSoon) { v -> vm.update { copy(closingSoon = v) } }
                SwitchRow("Featured", "Highlight on the marketplace", form.featured) { v -> vm.update { copy(featured = v) } }
            }

            // 4 — Amenities
            FormSectionCard("Amenities") {
                ChipMultiSelect(amenityOptions, form.amenities) { opt -> vm.update { copy(amenities = amenities.toggle(opt)) } }
                Spacer(Modifier.height(12.dp))
                LabeledField("Clubhouse area (sq.ft)", form.clubhouseAreaSqft, { v -> vm.update { copy(clubhouseAreaSqft = v.digits()) } }, keyboardType = KeyboardType.Number)
            }

            // 5 — Specifications
            FormSectionCard("Construction specifications") {
                FieldRow(
                    { LabeledField("Structure", form.specStructure, { v -> vm.update { copy(specStructure = v) } }) },
                    { LabeledField("Flooring", form.specFlooring, { v -> vm.update { copy(specFlooring = v) } }) },
                )
                FieldRow(
                    { LabeledField("Doors", form.specDoors, { v -> vm.update { copy(specDoors = v) } }) },
                    { LabeledField("Windows", form.specWindows, { v -> vm.update { copy(specWindows = v) } }) },
                )
                FieldRow(
                    { LabeledField("Electrical", form.specElectrical, { v -> vm.update { copy(specElectrical = v) } }) },
                    { LabeledField("Plumbing", form.specPlumbing, { v -> vm.update { copy(specPlumbing = v) } }) },
                )
                FieldRow(
                    { LabeledField("Kitchen", form.specKitchen, { v -> vm.update { copy(specKitchen = v) } }) },
                    { LabeledField("Bathrooms", form.specBathrooms, { v -> vm.update { copy(specBathrooms = v) } }) },
                )
                LabeledField("Painting", form.specPainting, { v -> vm.update { copy(specPainting = v) } })
            }

            // 6 — Payment plans
            FormSectionCard("Payment plans") {
                form.paymentPlans.forEachIndexed { i, plan ->
                    Row(verticalAlignment = Alignment.Top) {
                        Column(Modifier.weight(1f)) {
                            LabeledField("Plan name", plan.name, { v -> vm.update { copy(paymentPlans = paymentPlans.replace(i) { it.copy(name = v) }) } }, placeholder = "20:80")
                            LabeledField("Description", plan.description, { v -> vm.update { copy(paymentPlans = paymentPlans.replace(i) { it.copy(description = v) }) } })
                        }
                        if (form.paymentPlans.size > 1) {
                            Icon(Icons.Outlined.Close, "Remove", tint = ErrorRed,
                                modifier = Modifier.padding(top = 24.dp, start = 6.dp).size(20.dp)
                                    .clickable { vm.update { copy(paymentPlans = paymentPlans.removeIndex(i)) } })
                        }
                    }
                }
                AddRowButton("Add payment plan") { vm.update { copy(paymentPlans = paymentPlans + PaymentPlanInput()) } }
            }

            // 7 — Location advantages
            FormSectionCard("Location advantages") {
                form.locationAdvantages.forEachIndexed { i, adv ->
                    Column {
                        Row {
                            Text("Advantage ${i + 1}", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            if (form.locationAdvantages.size > 1) {
                                Icon(Icons.Outlined.Close, "Remove", tint = ErrorRed, modifier = Modifier.size(18.dp)
                                    .clickable { vm.update { copy(locationAdvantages = locationAdvantages.removeIndex(i)) } })
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        ChipSingleSelect(advCategories, adv.category) { v -> vm.update { copy(locationAdvantages = locationAdvantages.replace(i) { it.copy(category = v) }) } }
                        Spacer(Modifier.height(10.dp))
                        LabeledField("Name", adv.name, { v -> vm.update { copy(locationAdvantages = locationAdvantages.replace(i) { it.copy(name = v) }) } }, placeholder = "HITEC City")
                        FieldRow(
                            { LabeledField("Distance (km)", adv.distanceKm, { v -> vm.update { copy(locationAdvantages = locationAdvantages.replace(i) { it.copy(distanceKm = v) }) } }, keyboardType = KeyboardType.Decimal) },
                            { LabeledField("Drive (min)", adv.driveMinutes, { v -> vm.update { copy(locationAdvantages = locationAdvantages.replace(i) { it.copy(driveMinutes = v.digits()) }) } }, keyboardType = KeyboardType.Number) },
                        )
                    }
                }
                AddRowButton("Add location advantage") { vm.update { copy(locationAdvantages = locationAdvantages + LocationAdvInput()) } }
            }

            // 8 — Developer profile
            FormSectionCard("Developer profile") {
                FieldRow(
                    { LabeledField("Year established", form.builderYearEstablished, { v -> vm.update { copy(builderYearEstablished = v.digits().take(4)) } }, keyboardType = KeyboardType.Number) },
                    { LabeledField("Projects delivered", form.builderDeliveredProjects, { v -> vm.update { copy(builderDeliveredProjects = v.digits()) } }, keyboardType = KeyboardType.Number) },
                )
                LabeledField("Website", form.builderWebsite, { v -> vm.update { copy(builderWebsite = v) } }, keyboardType = KeyboardType.Uri)
                LabeledField("About", form.builderAbout, { v -> vm.update { copy(builderAbout = v) } }, singleLine = false, minLines = 3)
            }

            // 9 — Media
            FormSectionCard("Media") {
                LabeledField("Walkthrough video URL", form.videoUrl, { v -> vm.update { copy(videoUrl = v) } }, keyboardType = KeyboardType.Uri)
                LabeledField("Virtual tour URL", form.virtualTourUrl, { v -> vm.update { copy(virtualTourUrl = v) } }, keyboardType = KeyboardType.Uri)
            }

            vm.error?.let { Text(it, color = ErrorRed, fontSize = 13.sp, fontWeight = FontWeight.Medium) }

            Box(
                Modifier.fillMaxWidth().height(52.dp)
                    .background(if (vm.submitting) Teal.copy(alpha = 0.6f) else Navy, RoundedCornerShape(14.dp))
                    .clickable(enabled = !vm.submitting) { submit(vm, context, nav) },
                contentAlignment = Alignment.Center,
            ) {
                if (vm.submitting) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.5.dp)
                else Text(if (isEdit) "Save changes" else "Create project", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

private fun submit(vm: ProjectFormViewModel, context: android.content.Context, nav: NavController) {
    vm.save(
        onImageBytes = { uri ->
            try {
                val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return@save null
                val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
                val ext = mime.substringAfter("/").ifBlank { "jpg" }
                Triple(bytes, "project.$ext", mime)
            } catch (e: Exception) { null }
        },
        onDone = { id ->
            nav.navigate(com.dealio.app.ui.builder.BuilderRoutes.projectDetail(id)) {
                popUpTo(com.dealio.app.ui.builder.BuilderRoutes.PROJECTS)
            }
        },
    )
}

@Composable
private fun FieldLabel(text: String, required: Boolean = false) {
    Row(Modifier.padding(bottom = 6.dp)) {
        Text(text, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        if (required) Text(" *", color = ErrorRed, fontSize = 12.sp)
    }
}

@Composable
private fun AddRowButton(text: String, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(top = 4.dp)
            .border(1.dp, Teal.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
            .clickable { onClick() }.padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Filled.Add, null, tint = Teal, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(text, color = Teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ── small list helpers ──
private fun List<String>.toggle(item: String) = if (contains(item)) this - item else this + item
private fun String.digits() = filter { it.isDigit() }
private fun <T> List<T>.replace(index: Int, block: (T) -> T): List<T> =
    mapIndexed { i, t -> if (i == index) block(t) else t }
private fun <T> List<T>.removeIndex(index: Int): List<T> = filterIndexed { i, _ -> i != index }
