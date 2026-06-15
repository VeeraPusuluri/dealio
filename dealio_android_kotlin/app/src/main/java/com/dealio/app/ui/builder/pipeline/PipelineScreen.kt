package com.dealio.app.ui.builder.pipeline

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Call
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PipelineScreen(nav: NavController, vm: PipelineViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var sheetRow by remember { mutableStateOf<LeadRow?>(null) }
    val sheetState = rememberModalBottomSheetState()
    com.dealio.app.ui.builder.RefreshOnResume { vm.load(silent = true) }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Pipeline", "${state.total} leads across ${LEAD_STAGES.size} stages")

        // Stage tabs
        Row(
            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            LEAD_STAGES.forEach { stage ->
                val selected = state.selectedStage == stage
                val count = state.counts[stage] ?: 0
                Row(
                    Modifier
                        .background(if (selected) NavyMid else Color.White, RoundedCornerShape(10.dp))
                        .border(1.dp, if (selected) NavyMid else CardBorder, RoundedCornerShape(10.dp))
                        .clickable { vm.selectStage(stage) }
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(stage, color = if (selected) Color.White else TextSecondary, fontSize = 12.sp,
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal)
                    Spacer(Modifier.width(6.dp))
                    Box(
                        Modifier.background(if (selected) Color.White.copy(alpha = 0.22f) else Teal.copy(alpha = 0.12f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 1.dp),
                    ) { Text("$count", color = if (selected) Color.White else Teal, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                }
            }
        }

        when {
            state.loading -> LoadingState()
            state.error != null -> ErrorState(state.error!!, vm::load)
            state.visible.isEmpty() -> EmptyState(Icons.Outlined.Groups, "No leads in ${state.selectedStage}", "Leads in this stage will appear here.")
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.visible.size) { i ->
                    val row = state.visible[i]
                    LeadCard(row) { sheetRow = row }
                }
            }
        }
    }

    if (sheetRow != null) {
        val row = sheetRow!!
        ModalBottomSheet(onDismissRequest = { sheetRow = null }, sheetState = sheetState, containerColor = Color.White) {
            Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp)) {
                Text(row.lead.customerName, color = TextPrimary, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(2.dp))
                StatusChip(row.stage)
                Spacer(Modifier.height(14.dp))
                InfoRow("Project", row.lead.projectName.ifBlank { "—" })
                InfoRow("Phone", row.lead.phone.ifBlank { "—" })
                InfoRow("Email", row.lead.email.ifBlank { "—" })
                InfoRow("Budget", if (row.lead.budget > 0) formatINRShort(row.lead.budget) else "—")
                InfoRow("Channel partner", row.lead.cpName.ifBlank { "Direct" })

                if (row.lead.phone.isNotBlank()) {
                    Spacer(Modifier.height(10.dp))
                    Row(
                        Modifier.fillMaxWidth().height(46.dp)
                            .border(1.dp, Teal, RoundedCornerShape(12.dp))
                            .clickable {
                                context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${row.lead.phone}")))
                            },
                        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Outlined.Call, null, tint = Teal, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Call ${row.lead.customerName.substringBefore(' ')}", color = Teal, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                }

                val next = NEXT_STAGES[row.stage] ?: emptyList()
                if (next.isNotEmpty() && row.id > 0) {
                    Spacer(Modifier.height(18.dp))
                    Text("MOVE TO", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    Spacer(Modifier.height(8.dp))
                    next.forEach { ns ->
                        Row(
                            Modifier.fillMaxWidth().padding(vertical = 4.dp)
                                .background(NavyMid.copy(alpha = 0.06f), RoundedCornerShape(12.dp))
                                .clickable { vm.moveStage(row, ns); sheetRow = null }
                                .padding(horizontal = 14.dp, vertical = 13.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(ns, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                            Icon(Icons.Outlined.ArrowForward, null, tint = Teal, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LeadCard(row: LeadRow, onClick: () -> Unit) {
    DealioCard(Modifier.clickable { onClick() }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(row.lead.customerName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(row.lead.projectName.ifBlank { "—" }, color = TextSecondary, fontSize = 12.sp)
            }
            if (row.lead.budget > 0) {
                Text(formatINRShort(row.lead.budget), color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            StatusChip(row.stage)
            Spacer(Modifier.width(8.dp))
            Text(if (row.lead.cpName.isBlank()) "Direct" else "via ${row.lead.cpName}", color = TextSecondary, fontSize = 11.sp)
        }
    }
}
