package com.dealio.app.ui.builder.deals

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.Call
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.dealio.app.data.api.DealDetail
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun DealDetailScreen(nav: NavController, dealId: Long, vm: DealDetailViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    LaunchedEffect(dealId) { vm.load(dealId) }

    SubScreenScaffold(title = state.deal?.customerName ?: "Deal", nav = nav) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, { vm.load(dealId) }, Modifier.padding(pad))
            state.deal != null -> {
                val d = state.deal!!
                var message by remember { mutableStateOf("") }
                Column(
                    Modifier.fillMaxSize().padding(pad).verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    // Header
                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(d.customerName, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                Text(d.projectName, color = TextSecondary, fontSize = 13.sp)
                            }
                            StatusChip(d.status)
                        }
                        if ((d.dealValue ?: 0.0) > 0) {
                            Spacer(Modifier.height(8.dp))
                            Text("Deal value ${formatINRShort(d.dealValue)}", color = Teal, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Status flow
                    DealioCard {
                        SectionLabel("Stage")
                        Spacer(Modifier.height(8.dp))
                        StageStepper(d.status)
                        val idx = DEAL_STAGES.indexOfFirst { it.equals(d.status, true) }
                        val next = if (idx in 0 until DEAL_STAGES.lastIndex) DEAL_STAGES[idx + 1] else null
                        if (next != null) {
                            Spacer(Modifier.height(12.dp))
                            ActionButton("Advance to $next", Navy, enabled = !state.working) { vm.updateStatus(next) }
                        }
                        if (d.status.equals("Pending Booking", true) || d.status.equals("Booked", true)) {
                            Spacer(Modifier.height(8.dp))
                            ActionButton("Mark unit SOLD", StatusColors.Green, enabled = !state.working) { vm.markSold() }
                        }
                    }

                    // Parties
                    DealioCard {
                        SectionLabel("Parties")
                        Spacer(Modifier.height(8.dp))
                        InfoRow("Customer", d.customerName)
                        InfoRow("Phone", d.customerPhone.ifBlank { "—" })
                        InfoRow("Channel partner", d.cpName ?: "Direct")
                        InfoRow("CP phone", d.cpPhone)
                        InfoRow("CP tier", d.cpTier)
                        if (d.customerPhone.isNotBlank()) {
                            Spacer(Modifier.height(8.dp))
                            Row(
                                Modifier.fillMaxWidth().height(44.dp).border(1.dp, Teal, RoundedCornerShape(12.dp))
                                    .clickable { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${d.customerPhone}"))) },
                                horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(Icons.Outlined.Call, null, tint = Teal, modifier = Modifier.size(17.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Call customer", color = Teal, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            }
                        }
                    }

                    // Commission
                    DealioCard {
                        SectionLabel("Commission")
                        Spacer(Modifier.height(8.dp))
                        InfoRow("Rate", d.commissionPercent?.let { "$it%" })
                        InfoRow("Amount", d.commissionAmount?.let { formatINRShort(it) })
                        InfoRow("Status", d.commissionStatus)
                        InfoRow("CP agreed", if (d.cpAgreed) "Yes" else "No")
                        InfoRow("Customer confirmed", if (d.customerConfirmed) "Yes" else "No")
                    }

                    // Payment schedule
                    if (!d.paymentSchedule.isNullOrEmpty()) {
                        DealioCard {
                            SectionLabel("Payment schedule")
                            Spacer(Modifier.height(8.dp))
                            d.paymentSchedule!!.forEach { p ->
                                Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text(p.installment, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                        Text(com.dealio.app.ui.builder.formatDate(p.dueDate), color = TextSecondary, fontSize = 11.sp)
                                    }
                                    Text(formatINRShort(p.amount), color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    Spacer(Modifier.width(8.dp))
                                    StatusChip(p.status)
                                }
                            }
                        }
                    }

                    // Documents
                    DealioCard {
                        SectionLabel("Documents (${d.dealDocuments.size})")
                        Spacer(Modifier.height(8.dp))
                        if (d.dealDocuments.isEmpty()) {
                            Text("No documents shared yet.", color = TextSecondary, fontSize = 13.sp)
                        } else {
                            d.dealDocuments.forEach { doc ->
                                Row(Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Outlined.Description, null, tint = Teal, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(doc.name.ifBlank { doc.docType }, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                        Text(doc.docType, color = TextSecondary, fontSize = 11.sp)
                                    }
                                    if (doc.sharedWithCustomer) StatusChip("Customer")
                                    if (doc.sharedWithCp) { Spacer(Modifier.width(4.dp)); StatusChip("CP") }
                                }
                            }
                        }
                    }

                    // Messages
                    DealioCard {
                        SectionLabel("Conversation")
                        Spacer(Modifier.height(8.dp))
                        if (d.messages.isEmpty()) {
                            Text("No messages yet. Start the conversation below.", color = TextSecondary, fontSize = 13.sp)
                        } else {
                            d.messages.forEach { m ->
                                val mine = m.senderRole.equals("builder", true)
                                Column(
                                    Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                    horizontalAlignment = if (mine) Alignment.End else Alignment.Start,
                                ) {
                                    Text("${m.senderName} · ${m.senderRole}", color = TextSecondary, fontSize = 10.sp)
                                    Spacer(Modifier.height(2.dp))
                                    Box(
                                        Modifier
                                            .background(if (mine) Teal.copy(alpha = 0.14f) else CardBorder.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                            .padding(horizontal = 12.dp, vertical = 8.dp),
                                    ) { Text(m.message, color = TextPrimary, fontSize = 13.sp) }
                                }
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = message, onValueChange = { message = it },
                                modifier = Modifier.weight(1f), placeholder = { Text("Message…") },
                                singleLine = true, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(),
                            )
                            Spacer(Modifier.width(8.dp))
                            Box(
                                Modifier.size(48.dp).background(Navy, RoundedCornerShape(12.dp))
                                    .clickable(enabled = !state.sending && message.isNotBlank()) { vm.sendMessage(message); message = "" },
                                contentAlignment = Alignment.Center,
                            ) { Icon(Icons.AutoMirrored.Outlined.Send, "Send", tint = Color.White, modifier = Modifier.size(20.dp)) }
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
private fun StageStepper(status: String) {
    val currentIdx = DEAL_STAGES.indexOfFirst { it.equals(status, true) }
    Column {
        DEAL_STAGES.forEachIndexed { i, stage ->
            val done = currentIdx >= 0 && i <= currentIdx
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
                Box(
                    Modifier.size(18.dp).background(if (done) Teal else CardBorder, RoundedCornerShape(9.dp)),
                    contentAlignment = Alignment.Center,
                ) { Text("${i + 1}", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold) }
                Spacer(Modifier.width(10.dp))
                Text(stage, color = if (done) TextPrimary else TextSecondary, fontSize = 13.sp,
                    fontWeight = if (i == currentIdx) FontWeight.Bold else FontWeight.Normal)
            }
        }
    }
}

@Composable
private fun ActionButton(text: String, color: Color, enabled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier.fillMaxWidth().height(46.dp)
            .background(if (enabled) color else color.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center,
    ) { Text(text, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp) }
}
