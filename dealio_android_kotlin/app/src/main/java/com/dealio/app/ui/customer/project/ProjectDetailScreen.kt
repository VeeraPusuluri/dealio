package com.dealio.app.ui.customer.project

import android.content.Intent
import androidx.core.net.toUri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChildFriendly
import androidx.compose.material.icons.outlined.Deck
import androidx.compose.material.icons.outlined.Elevator
import androidx.compose.material.icons.outlined.EvStation
import androidx.compose.material.icons.outlined.FitnessCenter
import androidx.compose.material.icons.outlined.LocalFireDepartment
import androidx.compose.material.icons.outlined.LocalParking
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.Park
import androidx.compose.material.icons.outlined.Place
import androidx.compose.material.icons.outlined.PlayCircle
import androidx.compose.material.icons.outlined.Pool
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material.icons.outlined.SportsBasketball
import androidx.compose.material.icons.outlined.SportsTennis
import androidx.compose.material.icons.outlined.Videocam
import androidx.compose.material.icons.outlined.WaterDrop
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material.icons.outlined.Wifi
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.formatINR
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.priceHigh
import com.dealio.app.ui.builder.priceLow
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.builder.titleCase
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.customer.CustomerRoutes
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

private val timeSlots = listOf("10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM")
private val visitTypes = listOf("Site Visit", "Virtual Tour", "Office Meeting")

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ProjectDetailScreen(nav: NavController, projectId: Long, vm: ProjectDetailViewModel = viewModel()) {
    LaunchedEffect(projectId) { vm.load(projectId) }
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showBooking by remember { mutableStateOf(false) }

    LaunchedEffect(state.message) {
        state.message?.let { snackbar.showSnackbar(it); vm.clearMessage() }
    }

    val p = state.project
    Scaffold(
        containerColor = Color.White,
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            if (p != null) {
                Row(
                    Modifier.fillMaxWidth().background(Color.White).border(1.dp, CardBorder, RoundedCornerShape(0.dp))
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    OutlinedButton(
                        onClick = { nav.navigate(CustomerRoutes.loanApply(p.id, p.builderId)) },
                        modifier = Modifier.weight(1f).height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) { Text("Apply loan", color = Navy, fontWeight = FontWeight.SemiBold) }
                    Button(
                        onClick = { showBooking = true },
                        modifier = Modifier.weight(1.3f).height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Teal),
                    ) { Text("Book a visit", color = Color.White, fontWeight = FontWeight.Bold) }
                }
            }
        },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load(projectId) }, modifier = Modifier.padding(inner))
            p != null -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = inner.calculateBottomPadding() + 16.dp),
            ) {
                item { HeroHeader(p) { nav.navigateUp() } }
                item {
                    Column(Modifier.padding(16.dp)) {
                        Text("Starting price", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                        Spacer(Modifier.height(2.dp))
                        Text(priceText(p), color = Teal, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        if ((p.pricePerSqftFrom ?: 0.0) > 0) {
                            Text("₹${p.pricePerSqftFrom!!.toLong()}/sq.ft onwards", color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }

                // Quick facts
                item {
                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Fact("Config", p.configurations?.firstOrNull() ?: "—", Modifier.weight(1f))
                        Fact("Towers", p.towers?.toString() ?: "—", Modifier.weight(1f))
                        Fact("Possession", p.possessionDate?.take(7) ?: "—", Modifier.weight(1f))
                    }
                }

                // Availability
                if ((p.totalUnits ?: 0) > 0) {
                    item { Box(Modifier.padding(top = 12.dp)) { AvailabilityBar(p) } }
                }

                // Video / Maps quick actions
                if (!p.videoUrl.isNullOrBlank() || !p.googleMapsLink.isNullOrBlank()) {
                    item { LinkButtons(p) }
                }

                // Nearby highlights
                if (!p.nearbyHighlights.isNullOrEmpty()) {
                    item {
                        Section("Nearby") {
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                p.nearbyHighlights!!.forEach { n ->
                                    Row(
                                        Modifier.background(Color.White, RoundedCornerShape(8.dp))
                                            .border(1.dp, CardBorder, RoundedCornerShape(8.dp))
                                            .padding(horizontal = 10.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Icon(Icons.Outlined.Place, null, tint = Teal, modifier = Modifier.size(13.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text(n, color = TextPrimary, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                }

                if (!p.description.isNullOrBlank()) {
                    item { Section("About this project") { Text(p.description!!, color = TextSecondary, fontSize = 13.sp, lineHeight = 20.sp) } }
                }

                // Configurations with actions
                if (!p.configurations.isNullOrEmpty()) {
                    item {
                        Section("Configurations") {
                            p.configurations!!.forEach { cfg ->
                                ConfigRow(
                                    cfg = cfg,
                                    working = state.working,
                                    onShortlist = {
                                        vm.shortlist(cfg, mapOf("bhkType" to cfg, "price" to priceText(p)))
                                    },
                                    onPricing = {
                                        vm.requestPricing(cfg, mapOf("bhkType" to cfg), "Please share pricing for $cfg")
                                    },
                                )
                                Spacer(Modifier.height(8.dp))
                            }
                        }
                    }
                }

                if (!p.amenities.isNullOrEmpty()) {
                    item {
                        Section("Amenities") {
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                p.amenities!!.forEach { a ->
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier
                                            .background(Teal.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                                            .padding(horizontal = 10.dp, vertical = 7.dp),
                                    ) {
                                        Icon(amenityIcon(a), null, tint = Teal, modifier = Modifier.size(15.dp))
                                        Spacer(Modifier.width(6.dp))
                                        Text(a, color = Navy, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                    }
                                }
                            }
                        }
                    }
                }

                val specs = p.specifications
                if (specs != null) {
                    item {
                        Section("Specifications") {
                            InfoRow("Structure", specs.structure)
                            InfoRow("Flooring", specs.flooring)
                            InfoRow("Kitchen", specs.kitchen)
                            InfoRow("Bathrooms", specs.bathrooms)
                            InfoRow("Doors & windows", listOfNotNull(specs.doors, specs.windows).joinToString(" / ").ifBlank { null })
                            InfoRow("Painting", specs.painting)
                        }
                    }
                }

                if (!p.paymentPlans.isNullOrEmpty()) {
                    item {
                        Section("Payment plans") {
                            p.paymentPlans!!.forEach { plan ->
                                Column(Modifier.padding(vertical = 4.dp)) {
                                    Text(plan.name ?: "Plan", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    if (!plan.description.isNullOrBlank()) Text(plan.description!!, color = TextSecondary, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }

                if (!p.locationAdvantages.isNullOrEmpty()) {
                    item {
                        Section("Location advantages") {
                            p.locationAdvantages!!.forEach { la ->
                                InfoRow(
                                    listOfNotNull(la.name, la.category?.let { "($it)" }).joinToString(" "),
                                    listOfNotNull(la.distanceKm?.let { "$it km" }, la.driveMinutes?.let { "$it min" }).joinToString(" · ").ifBlank { "—" },
                                )
                            }
                        }
                    }
                }

                // Builder + RERA
                item {
                    Section("Developer") {
                        InfoRow("Builder", p.builderName)
                        InfoRow("Established", p.builderYearEstablished?.toString())
                        InfoRow("Delivered projects", p.builderDeliveredProjects?.toString())
                        InfoRow("RERA", p.reraNumber)
                        InfoRow("RERA expiry", p.reraExpiry)
                        if (!p.status.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            StatusChip(titleCase(p.status))
                        }
                    }
                }
            }
        }
    }

    if (showBooking && p != null) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(onDismissRequest = { showBooking = false }, sheetState = sheetState, containerColor = Color.White) {
            BookingSheet(working = state.working) { date, time, type, notes ->
                vm.bookVisit(date, time, type, notes) { showBooking = false }
            }
        }
    }

}

private fun priceText(p: Project): String {
    val lo = p.priceLow(); val hi = p.priceHigh()
    return when {
        (lo ?: 0.0) > 0 && (hi ?: 0.0) > 0 && hi != lo -> "${formatINRShort(lo)} – ${formatINRShort(hi)}"
        (lo ?: 0.0) > 0 -> "${formatINR(lo)} onwards"
        else -> "Price on request"
    }
}

@Composable
private fun HeroHeader(p: Project, onBack: () -> Unit) {
    Box(Modifier.fillMaxWidth().height(270.dp).background(Brush.linearGradient(listOf(NavyMid, Teal)))) {
        val url = resolveUrl(p.imageUrl ?: p.coverUrl)
        if (url != null) {
            AsyncImage(model = url, contentDescription = p.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
        } else {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.Apartment, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(56.dp))
            }
        }
        // Bottom scrim for legible overlay text
        Box(
            Modifier.matchParentSize().background(
                Brush.verticalGradient(listOf(Color.Transparent, Color.Transparent, Color.Black.copy(alpha = 0.65f))),
            ),
        )
        IconButton(
            onClick = onBack,
            modifier = Modifier.padding(8.dp).background(Color.Black.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
        ) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White) }

        Column(Modifier.align(Alignment.BottomStart).padding(16.dp)) {
            if (!p.status.isNullOrBlank()) {
                Text(
                    titleCase(p.status),
                    color = Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.background(Teal, RoundedCornerShape(8.dp)).padding(horizontal = 9.dp, vertical = 4.dp),
                )
                Spacer(Modifier.height(8.dp))
            }
            Text(p.name, color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.LocationOn, null, tint = Color.White.copy(alpha = 0.85f), modifier = Modifier.size(14.dp))
                Spacer(Modifier.width(4.dp))
                Text(
                    listOfNotNull(p.locality, p.city).joinToString(", ").ifBlank { "—" },
                    color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp,
                )
            }
        }
    }
}

@Composable
private fun AvailabilityBar(p: Project) {
    val total = (p.totalUnits ?: 0).coerceAtLeast(1)
    val available = (p.availableUnits ?: 0).coerceIn(0, total)
    val sold = (p.soldUnits ?: 0).coerceIn(0, total)
    val booked = (p.bookedUnits ?: 0).coerceIn(0, total)
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Availability", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
            Text("$available of ${p.totalUnits} available", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth().height(10.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            if (available > 0) Box(Modifier.weight(available.toFloat()).fillMaxHeight().background(Teal, RoundedCornerShape(3.dp)))
            if (booked > 0) Box(Modifier.weight(booked.toFloat()).fillMaxHeight().background(StatusColors.Amber, RoundedCornerShape(3.dp)))
            if (sold > 0) Box(Modifier.weight(sold.toFloat()).fillMaxHeight().background(TextSecondary, RoundedCornerShape(3.dp)))
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Legend(Teal, "Available $available")
            Legend(StatusColors.Amber, "Booked $booked")
            Legend(TextSecondary, "Sold $sold")
        }
    }
}

@Composable
private fun Legend(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(9.dp).background(color, RoundedCornerShape(3.dp)))
        Spacer(Modifier.width(4.dp))
        Text(label, color = TextSecondary, fontSize = 11.sp)
    }
}

@Composable
private fun LinkButtons(p: Project) {
    val context = LocalContext.current
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        if (!p.videoUrl.isNullOrBlank()) {
            LinkButton("Watch video", Icons.Outlined.PlayCircle, Modifier.weight(1f)) {
                runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, p.videoUrl!!.toUri())) }
            }
        }
        if (!p.googleMapsLink.isNullOrBlank()) {
            LinkButton("View on map", Icons.Outlined.Map, Modifier.weight(1f)) {
                runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, p.googleMapsLink!!.toUri())) }
            }
        }
    }
}

@Composable
private fun LinkButton(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier, onClick: () -> Unit) {
    Row(
        modifier
            .background(Teal.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = Teal, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(6.dp))
        Text(label, color = Teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

private fun amenityIcon(name: String): ImageVector {
    val n = name.lowercase()
    return when {
        "pool" in n || "swim" in n -> Icons.Outlined.Pool
        "gym" in n || "fitness" in n -> Icons.Outlined.FitnessCenter
        "child" in n || "kid" in n || "play" in n -> Icons.Outlined.ChildFriendly
        "cctv" in n || "camera" in n -> Icons.Outlined.Videocam
        "security" in n || "guard" in n || "gated" in n || "intercom" in n -> Icons.Outlined.Security
        "power" in n || "backup" in n || "electric" in n -> Icons.Outlined.Bolt
        "parking" in n -> Icons.Outlined.LocalParking
        "park" in n || "garden" in n || "landscap" in n || "jogging" in n || "green" in n -> Icons.Outlined.Park
        "lift" in n || "elevator" in n -> Icons.Outlined.Elevator
        "wifi" in n || "internet" in n || "co-work" in n || "cowork" in n -> Icons.Outlined.Wifi
        "water" in n || "rain" in n -> Icons.Outlined.WaterDrop
        "ev" in n || "charg" in n -> Icons.Outlined.EvStation
        "tennis" in n -> Icons.Outlined.SportsTennis
        "basket" in n || "court" in n || "sport" in n -> Icons.Outlined.SportsBasketball
        "fire" in n -> Icons.Outlined.LocalFireDepartment
        "spa" in n || "yoga" in n || "senior" in n -> Icons.Outlined.Spa
        "solar" in n -> Icons.Outlined.WbSunny
        "club" in n || "lounge" in n || "party" in n || "hall" in n || "indoor" in n -> Icons.Outlined.Deck
        else -> Icons.Outlined.CheckCircle
    }
}

@Composable
private fun Fact(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier
            .background(Color.White, RoundedCornerShape(12.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
            .padding(12.dp),
    ) {
        Text(label.uppercase(), color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
        Spacer(Modifier.height(3.dp))
        Text(value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(16.dp)) {
        SectionLabel(title)
        Spacer(Modifier.height(10.dp))
        content()
    }
    Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(1.dp).background(CardBorder))
}

@Composable
private fun ConfigRow(cfg: String, working: Boolean, onShortlist: () -> Unit, onPricing: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().background(Teal.copy(alpha = 0.05f), RoundedCornerShape(12.dp)).padding(12.dp),
    ) {
        Text(cfg, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onShortlist, enabled = !working, modifier = Modifier.weight(1f).height(40.dp), shape = RoundedCornerShape(10.dp)) {
                Text("Shortlist", color = Navy, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
            Button(onClick = onPricing, enabled = !working, modifier = Modifier.weight(1f).height(40.dp), shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Navy)) {
                Text("Get price", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun BookingSheet(working: Boolean, onConfirm: (date: String, time: String, type: String, notes: String) -> Unit) {
    val dates = remember { (0..13).map { LocalDate.now().plusDays(it.toLong()) } }
    var selectedDate by remember { mutableStateOf(dates.first()) }
    var selectedTime by remember { mutableStateOf(timeSlots.first()) }
    var selectedType by remember { mutableStateOf(visitTypes.first()) }
    var notes by remember { mutableStateOf("") }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(20.dp)) {
        Text("Book a site visit", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))

        SectionLabel("Date")
        Spacer(Modifier.height(8.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            dates.forEach { d ->
                val sel = d == selectedDate
                val label = "${d.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault())} ${d.dayOfMonth}"
                Chip(label, sel) { selectedDate = d }
            }
        }
        Spacer(Modifier.height(16.dp))

        SectionLabel("Time")
        Spacer(Modifier.height(8.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            timeSlots.forEach { t -> Chip(t, t == selectedTime) { selectedTime = t } }
        }
        Spacer(Modifier.height(16.dp))

        SectionLabel("Type")
        Spacer(Modifier.height(8.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            visitTypes.forEach { t -> Chip(t, t == selectedType) { selectedType = t } }
        }
        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Notes (optional)") },
            shape = RoundedCornerShape(12.dp),
            colors = dealioFieldColors(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
            minLines = 2,
        )
        Spacer(Modifier.height(20.dp))

        Button(
            onClick = {
                onConfirm(selectedDate.toString(), selectedTime, selectedType, notes)
            },
            enabled = !working,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Teal),
        ) {
            if (working) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.5.dp)
            else {
                Icon(Icons.Outlined.CheckCircle, null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Request visit", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun Chip(label: String, selected: Boolean, onClick: () -> Unit) {
    Text(
        label,
        color = if (selected) Color.White else TextSecondary,
        fontSize = 12.sp,
        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        modifier = Modifier
            .background(if (selected) Teal else Color.White, RoundedCornerShape(10.dp))
            .border(1.dp, if (selected) Teal else CardBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}
