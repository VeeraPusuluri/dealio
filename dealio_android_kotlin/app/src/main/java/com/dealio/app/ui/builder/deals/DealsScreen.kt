package com.dealio.app.ui.builder.deals

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Handshake
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.api.DealSummary
import com.dealio.app.ui.builder.BuilderRoutes
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun DealsScreen(nav: NavController, vm: DealsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    com.dealio.app.ui.builder.RefreshOnResume { vm.load(silent = true) }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Deals", "${state.all.size} total")

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, vm::load)
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        SummaryTile("In negotiation", state.negotiation.toString(), StatusColors.Amber, Modifier.weight(1f))
                        SummaryTile("Booked / closed", state.bookedClosed.toString(), StatusColors.Green, Modifier.weight(1f))
                    }
                }
                item {
                    SummaryTile("Revenue booked", formatINRShort(state.totalValue), StatusColors.Green, Modifier.fillMaxWidth())
                }
                item {
                    Row(
                        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        state.filters.forEach { f ->
                            val sel = state.filter == f
                            Box(
                                Modifier
                                    .background(if (sel) NavyMid else Color.White, RoundedCornerShape(10.dp))
                                    .border(1.dp, if (sel) NavyMid else CardBorder, RoundedCornerShape(10.dp))
                                    .clickable { vm.setFilter(f) }
                                    .padding(horizontal = 12.dp, vertical = 7.dp),
                            ) {
                                Text(f, color = if (sel) Color.White else TextSecondary, fontSize = 12.sp,
                                    fontWeight = if (sel) FontWeight.SemiBold else FontWeight.Normal)
                            }
                        }
                    }
                }

                if (state.visible.isEmpty()) {
                    item { EmptyState(Icons.Outlined.Handshake, "No deals", "Deals from your leads will show up here.") }
                } else {
                    items(state.visible.size) { i ->
                        DealCard(state.visible[i]) { nav.navigate(BuilderRoutes.dealDetail(state.visible[i].id)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryTile(label: String, value: String, accent: Color, modifier: Modifier = Modifier) {
    Column(
        modifier
            .background(Color.White, RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .padding(14.dp),
    ) {
        Text(value, color = accent, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text(label.uppercase(), color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
    }
}

@Composable
private fun DealCard(d: DealSummary, onClick: () -> Unit) {
    DealioCard(Modifier.clickable { onClick() }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(d.customerName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    if (d.isNRI) {
                        Spacer(Modifier.width(6.dp))
                        Box(Modifier.background(StatusColors.PurpleBg, RoundedCornerShape(6.dp)).padding(horizontal = 6.dp, vertical = 1.dp)) {
                            Text("NRI", color = StatusColors.Purple, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Text(d.projectName, color = TextSecondary, fontSize = 12.sp)
                if (!d.cpName.isNullOrBlank()) Text("via ${d.cpName}", color = TextSecondary, fontSize = 11.sp)
            }
            Column(horizontalAlignment = Alignment.End) {
                StatusChip(d.status)
                if ((d.dealValue ?: 0.0) > 0) {
                    Spacer(Modifier.height(6.dp))
                    Text(formatINRShort(d.dealValue), color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
