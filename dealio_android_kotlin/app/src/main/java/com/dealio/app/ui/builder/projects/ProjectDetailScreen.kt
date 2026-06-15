package com.dealio.app.ui.builder.projects

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
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
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.BuilderRoutes
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.builder.titleCase
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun ProjectDetailScreen(nav: NavController, projectId: Long, vm: ProjectDetailViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(projectId) { vm.load(projectId) }

    com.dealio.app.ui.builder.SubScreenScaffold(
        title = state.project?.name ?: "Project",
        nav = nav,
        actions = {
            if (state.project != null) {
                Icon(
                    Icons.Outlined.Edit, "Edit", tint = Teal,
                    modifier = Modifier
                        .padding(end = 12.dp)
                        .size(22.dp)
                        .clickable { nav.navigate(BuilderRoutes.projectForm(projectId)) },
                )
            }
        },
    ) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, { vm.load(projectId) }, Modifier.padding(pad))
            state.project != null -> ProjectDetailBody(state.project!!, state.documents.size, Modifier.padding(pad))
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ProjectDetailBody(p: Project, docCount: Int, modifier: Modifier) {
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        // Hero
        Box(Modifier.fillMaxWidth().height(190.dp).background(Brush.linearGradient(listOf(NavyMid, Teal)))) {
            val url = resolveUrl(p.imageUrl ?: p.coverUrl)
            if (url != null) {
                AsyncImage(url, p.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            } else {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.Apartment, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(56.dp))
                }
            }
            Box(Modifier.align(Alignment.BottomStart).padding(12.dp)) { StatusChip(titleCase(p.status ?: "Active")) }
        }

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(p.name, color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(
                listOfNotNull(p.address, p.locality, p.city, p.pincode).joinToString(", ").ifBlank { "—" },
                color = TextSecondary, fontSize = 13.sp,
            )
            if (!p.description.isNullOrBlank()) {
                Text(p.description!!, color = TextSecondary, fontSize = 13.sp)
            }

            // Key metrics
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Metric("Price from", if ((p.priceMin ?: 0.0) > 0) formatINRShort(p.priceMin) else "—", Modifier.weight(1f))
                Metric("Price to", if ((p.priceMax ?: 0.0) > 0) formatINRShort(p.priceMax) else "—", Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Metric("Total units", "${p.totalUnits ?: 0}", Modifier.weight(1f))
                Metric("Available", "${p.availableUnits ?: 0}", Modifier.weight(1f))
                Metric("Sold", "${p.soldUnits ?: 0}", Modifier.weight(1f))
            }

            // Overview
            DealioCard {
                SectionLabel("Overview")
                Spacer(Modifier.height(8.dp))
                InfoRow("Type", titleCase(p.projectType))
                InfoRow("Possession", com.dealio.app.ui.builder.formatDate(p.possessionDate))
                InfoRow("Towers", p.towers?.toString())
                InfoRow("Floors / tower", p.floorsPerTower?.toString())
                InfoRow("Land area", p.landArea)
                InfoRow("Clubhouse", p.clubhouseAreaSqft?.let { "$it sq.ft" })
                InfoRow("Price / sq.ft", if ((p.pricePerSqftFrom ?: 0.0) > 0) "${formatINRShort(p.pricePerSqftFrom)} – ${formatINRShort(p.pricePerSqftTo)}" else null)
                InfoRow("Maintenance", p.maintenanceCharges?.let { formatINRShort(it) })
            }

            // Configurations
            if (!p.configurations.isNullOrEmpty()) {
                DealioCard {
                    SectionLabel("Configurations")
                    Spacer(Modifier.height(8.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        p.configurations!!.forEach { ChipTag(it) }
                    }
                }
            }

            // Amenities
            if (!p.amenities.isNullOrEmpty()) {
                DealioCard {
                    SectionLabel("Amenities")
                    Spacer(Modifier.height(8.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        p.amenities!!.forEach { ChipTag(it) }
                    }
                }
            }

            // Nearby
            if (!p.nearbyHighlights.isNullOrEmpty()) {
                DealioCard {
                    SectionLabel("Nearby highlights")
                    Spacer(Modifier.height(8.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        p.nearbyHighlights!!.forEach { ChipTag(it) }
                    }
                }
            }

            // Specifications
            p.specifications?.let { s ->
                val rows = listOf(
                    "Structure" to s.structure, "Flooring" to s.flooring, "Doors" to s.doors,
                    "Windows" to s.windows, "Electrical" to s.electrical, "Plumbing" to s.plumbing,
                    "Kitchen" to s.kitchen, "Bathrooms" to s.bathrooms, "Painting" to s.painting,
                ).filter { !it.second.isNullOrBlank() }
                if (rows.isNotEmpty()) DealioCard {
                    SectionLabel("Specifications")
                    Spacer(Modifier.height(8.dp))
                    rows.forEach { InfoRow(it.first, it.second) }
                }
            }

            // Payment plans
            if (!p.paymentPlans.isNullOrEmpty()) {
                DealioCard {
                    SectionLabel("Payment plans")
                    Spacer(Modifier.height(8.dp))
                    p.paymentPlans!!.forEach {
                        Text(it.name ?: "", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        if (!it.description.isNullOrBlank()) Text(it.description!!, color = TextSecondary, fontSize = 12.sp)
                        Spacer(Modifier.height(6.dp))
                    }
                }
            }

            // Location advantages
            if (!p.locationAdvantages.isNullOrEmpty()) {
                DealioCard {
                    SectionLabel("Location advantages")
                    Spacer(Modifier.height(8.dp))
                    p.locationAdvantages!!.filter { !it.name.isNullOrBlank() }.forEach {
                        InfoRow(it.name ?: "", listOfNotNull(it.distanceKm?.let { d -> "$d km" }, it.driveMinutes?.let { m -> "$m min" }).joinToString(" · "))
                    }
                }
            }

            // RERA & commission
            DealioCard {
                SectionLabel("Compliance & commission")
                Spacer(Modifier.height(8.dp))
                InfoRow("RERA number", p.reraNumber)
                InfoRow("RERA expiry", com.dealio.app.ui.builder.formatDate(p.reraExpiry))
                InfoRow("RERA state", p.reraState)
                InfoRow("Building permit", p.buildingPermitNumber)
                InfoRow("Commission", p.commissionValue?.let { "$it%" })
                InfoRow("CP incentive", p.cpIncentive)
                InfoRow("Documents", "$docCount file(s)")
            }

            // Builder profile
            if (!p.builderName.isNullOrBlank() || !p.builderAbout.isNullOrBlank()) {
                DealioCard {
                    SectionLabel("Developer")
                    Spacer(Modifier.height(8.dp))
                    InfoRow("Company", p.builderName)
                    InfoRow("Established", p.builderYearEstablished?.toString())
                    InfoRow("Delivered", p.builderDeliveredProjects?.let { "$it projects" })
                    InfoRow("Website", p.builderWebsite)
                    if (!p.builderAbout.isNullOrBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Text(p.builderAbout!!, color = TextSecondary, fontSize = 12.sp)
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun Metric(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier
            .background(Color.White, RoundedCornerShape(14.dp))
            .padding(14.dp),
    ) {
        Text(value, color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        Text(label.uppercase(), color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
    }
}

@Composable
private fun ChipTag(text: String) {
    Box(
        Modifier
            .background(Teal.copy(alpha = 0.10f), RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) { Text(text, color = Teal, fontSize = 12.sp, fontWeight = FontWeight.Medium) }
}
