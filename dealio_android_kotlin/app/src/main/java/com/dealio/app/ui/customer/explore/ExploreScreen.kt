package com.dealio.app.ui.customer.explore

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
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.LocationCity
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.RefreshOnResume
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.customer.CustomerProjectCard
import com.dealio.app.ui.customer.CustomerRoutes
import com.dealio.app.ui.customer.FeaturedCard
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyDeep
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun ExploreScreen(nav: NavController, vm: ExploreViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume { vm.load(silent = true) }

    Column(Modifier.fillMaxSize()) {
        // ── Navy hero with search ──
        Box(Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(NavyDeep, NavyMid)))) {
            Column(Modifier.systemBarsPadding().padding(horizontal = 20.dp, vertical = 16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Hi ${state.name.substringBefore(' ')} 👋", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("Find your next home", color = Teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Box(
                        Modifier.size(40.dp)
                            .background(Color.White.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                            .clickable { nav.navigate(CustomerRoutes.NOTIFICATIONS) },
                        contentAlignment = Alignment.Center,
                    ) { Icon(Icons.Outlined.Notifications, "Notifications", tint = Color.White, modifier = Modifier.size(20.dp)) }
                }
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(
                    value = state.query,
                    onValueChange = vm::setQuery,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search projects, localities…") },
                    leadingIcon = { Icon(Icons.Outlined.Search, null) },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedBorderColor = Color.Transparent,
                        unfocusedBorderColor = Color.Transparent,
                        focusedLeadingIconColor = TextSecondary,
                        unfocusedLeadingIconColor = TextSecondary,
                        cursorColor = Teal,
                    ),
                )
            }
        }

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() })
            else -> LazyColumn(
                contentPadding = PaddingValues(bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                // City chips
                item {
                    Row(
                        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        CityChip("All", state.selectedCity == null) { vm.setCity(null) }
                        state.cities.forEach { c -> CityChip(c, state.selectedCity == c) { vm.setCity(c) } }
                    }
                }

                // Featured carousel
                if (state.featured.isNotEmpty() && state.query.isBlank()) {
                    item { SectionLabel("Featured", Modifier.padding(horizontal = 16.dp)) }
                    item {
                        Row(
                            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            state.featured.forEach { p ->
                                FeaturedCard(p) { nav.navigate(CustomerRoutes.projectDetail(p.id)) }
                            }
                        }
                    }
                }

                item {
                    SectionLabel(
                        if (state.selectedCity != null) "Homes in ${state.selectedCity}" else "All homes",
                        Modifier.padding(horizontal = 16.dp, vertical = 2.dp),
                    )
                }

                if (state.filtered.isEmpty()) {
                    item {
                        EmptyState(Icons.Outlined.Apartment, "No homes found", "Try a different city or search term.")
                    }
                } else {
                    items(state.filtered.size) { i ->
                        Box(Modifier.padding(horizontal = 16.dp)) {
                            CustomerProjectCard(state.filtered[i]) { nav.navigate(CustomerRoutes.projectDetail(state.filtered[i].id)) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CityChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Row(
        Modifier
            .background(if (selected) Teal else Color.White, RoundedCornerShape(10.dp))
            .border(1.dp, if (selected) Teal else CardBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (label != "All") {
            Icon(Icons.Outlined.LocationCity, null, tint = if (selected) Color.White else TextSecondary, modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(4.dp))
        }
        Text(label, color = if (selected) Color.White else TextSecondary, fontSize = 12.sp, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal)
    }
}
