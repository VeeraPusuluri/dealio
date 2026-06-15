package com.dealio.app.ui.builder.projects

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.builder.titleCase
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Orange
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

private val statusFilters = listOf("All", "Active", "Pre Launch", "Launched", "Under Construction", "Ready To Move")

@Composable
fun ProjectsScreen(nav: NavController, vm: ProjectsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    com.dealio.app.ui.builder.RefreshOnResume { vm.load(silent = true) }

    Column(Modifier.fillMaxSize()) {
        TabHeader(
            title = "Projects",
            subtitle = "${state.all.size} total",
            trailing = {
                Row(
                    Modifier
                        .background(Teal, RoundedCornerShape(12.dp))
                        .clickable { nav.navigate(BuilderRoutes.projectForm()) }
                        .padding(horizontal = 14.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Filled.Add, null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("New", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            },
        )

        OutlinedTextField(
            value = state.query,
            onValueChange = vm::setQuery,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Search projects…") },
            leadingIcon = { Icon(Icons.Outlined.Search, null, tint = TextSecondary) },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            colors = dealioFieldColors(),
        )

        Row(
            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            statusFilters.forEach { f ->
                val selected = state.statusFilter == f
                Box(
                    Modifier
                        .background(if (selected) NavyMid else Color.White, RoundedCornerShape(10.dp))
                        .border(1.dp, if (selected) NavyMid else CardBorder, RoundedCornerShape(10.dp))
                        .clickable { vm.setStatusFilter(f) }
                        .padding(horizontal = 12.dp, vertical = 7.dp),
                ) {
                    Text(f, color = if (selected) Color.White else TextSecondary, fontSize = 12.sp,
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal)
                }
            }
        }

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, onRetry = vm::load)
            state.filtered.isEmpty() -> EmptyState(
                Icons.Outlined.Apartment, "No projects yet",
                "Tap New to create your first project listing.",
            )
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                items(state.filtered.size) { i ->
                    ProjectCard(state.filtered[i]) { nav.navigate(BuilderRoutes.projectDetail(state.filtered[i].id)) }
                }
            }
        }
    }
}

@Composable
fun ProjectCard(p: Project, onClick: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .clip(RoundedCornerShape(18.dp))
            .clickable { onClick() },
    ) {
        Box(Modifier.fillMaxWidth().height(140.dp).background(Brush.linearGradient(listOf(NavyMid, Teal)))) {
            val url = resolveUrl(p.imageUrl ?: p.coverUrl)
            if (url != null) {
                AsyncImage(model = url, contentDescription = p.name, contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize())
            } else {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.Apartment, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(48.dp))
                }
            }
            Box(Modifier.padding(10.dp)) { StatusChip(titleCase(p.status ?: "Active")) }
            if (p.featured) {
                Row(
                    Modifier.align(Alignment.TopEnd).padding(10.dp)
                        .background(Orange, RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Outlined.Star, null, tint = Color.White, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("Featured", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        Column(Modifier.padding(14.dp)) {
            Text(p.name, color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 1)
            Spacer(Modifier.height(3.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.LocationOn, null, tint = TextSecondary, modifier = Modifier.size(13.dp))
                Spacer(Modifier.width(3.dp))
                Text(
                    listOfNotNull(p.locality, p.city).joinToString(", ").ifBlank { "—" },
                    color = TextSecondary, fontSize = 12.sp, maxLines = 1,
                )
            }
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                MetricColumn("Price", if ((p.priceMin ?: 0.0) > 0) "${formatINRShort(p.priceMin)}+" else "—")
                MetricColumn("Available", "${p.availableUnits ?: 0}/${p.totalUnits ?: 0}")
                MetricColumn("Config", p.configurations?.joinToString(", ")?.ifBlank { "—" } ?: "—")
            }
        }
    }
}

@Composable
private fun MetricColumn(label: String, value: String) {
    Column {
        Text(label.uppercase(), color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
        Spacer(Modifier.height(2.dp))
        Text(value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}
