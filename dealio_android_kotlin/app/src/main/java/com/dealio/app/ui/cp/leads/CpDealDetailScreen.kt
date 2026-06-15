package com.dealio.app.ui.cp.leads

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.outlined.EventRepeat
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.api.CpDealDetail
import com.dealio.app.data.api.DealMessage
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.formatINR
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CpDealDetailScreen(nav: NavController, dealId: Long, vm: CpDealDetailViewModel = viewModel()) {
    LaunchedEffect(dealId) { vm.load(dealId) }
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var draft by remember { mutableStateOf("") }
    var showFollowUp by remember { mutableStateOf(false) }
    var showCallLog by remember { mutableStateOf(false) }

    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.clearMessage() } }

    val d = state.deal
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text(d?.projectName ?: "Lead", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = { IconButton(onClick = { nav.navigateUp() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Navy) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White, titleContentColor = Navy),
            )
        },
        bottomBar = {
            if (d != null) {
                Row(
                    Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 12.dp, vertical = 8.dp).imePadding(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedTextField(
                        value = draft, onValueChange = { draft = it }, modifier = Modifier.weight(1f),
                        placeholder = { Text("Message the builder…") }, shape = RoundedCornerShape(22.dp),
                        colors = dealioFieldColors(), maxLines = 4,
                    )
                    Spacer(Modifier.width(8.dp))
                    IconButton(
                        onClick = { vm.sendMessage(draft); draft = "" },
                        enabled = draft.isNotBlank() && !state.sending,
                        modifier = Modifier.size(48.dp).background(Teal, RoundedCornerShape(24.dp)),
                    ) {
                        if (state.sending) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                        else Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                }
            }
        },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load(dealId) }, modifier = Modifier.padding(inner))
            d != null -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Column(
                        Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(16.dp))
                            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)).padding(14.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(d.customerName, color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            StatusChip(d.status)
                        }
                        Spacer(Modifier.height(8.dp))
                        InfoRow("Customer phone", d.customerPhone)
                        InfoRow("Deal value", d.dealValue?.let { formatINR(it) })
                        InfoRow("Your commission", d.commissionAmount?.let { "${formatINR(it)} (${d.commissionPercent ?: 0.0}%)" })
                        InfoRow("Commission status", d.commissionStatus)
                        Spacer(Modifier.height(6.dp))
                        Row {
                            AgreedPill("You", d.cpAgreed)
                            Spacer(Modifier.width(8.dp))
                            AgreedPill("Customer", d.customerConfirmed)
                        }
                    }
                }

                if (!d.cpAgreed) {
                    item {
                        Button(
                            onClick = vm::agree, enabled = !state.working,
                            modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Teal),
                        ) { Text("Agree to this deal", color = Color.White, fontWeight = FontWeight.Bold) }
                    }
                }

                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(onClick = { showFollowUp = true }, modifier = Modifier.weight(1f).height(46.dp), shape = RoundedCornerShape(12.dp)) {
                            Icon(Icons.Outlined.EventRepeat, null, tint = Navy, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp)); Text("Follow-up", color = Navy, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                        OutlinedButton(onClick = { showCallLog = true }, modifier = Modifier.weight(1f).height(46.dp), shape = RoundedCornerShape(12.dp)) {
                            Icon(Icons.Outlined.Phone, null, tint = Navy, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp)); Text("Log call", color = Navy, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                item { SectionLabel("Conversation") }
                if (d.messages.isEmpty()) {
                    item { Text("No messages yet.", color = TextSecondary, fontSize = 13.sp) }
                } else {
                    items(d.messages.size) { i -> MessageBubble(d.messages[i]) }
                }
            }
        }
    }

    if (showFollowUp && d != null) {
        FollowUpDialog(working = state.working, onDismiss = { showFollowUp = false }) { date, time, reason ->
            vm.addFollowUp(date, time, reason); showFollowUp = false
        }
    }
    if (showCallLog && d != null) {
        CallLogDialog(working = state.working, onDismiss = { showCallLog = false }) { outcome, duration, notes ->
            vm.logCall(outcome, duration, notes, null, null); showCallLog = false
        }
    }
}

@Composable
private fun AgreedPill(who: String, agreed: Boolean) {
    val (fg, bg) = if (agreed) StatusColors.Green to StatusColors.GreenBg else StatusColors.Grey to StatusColors.GreyBg
    Text(
        "$who: ${if (agreed) "Agreed" else "Pending"}",
        color = fg, fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
        modifier = Modifier.background(bg, RoundedCornerShape(8.dp)).padding(horizontal = 9.dp, vertical = 4.dp),
    )
}

@Composable
private fun MessageBubble(m: DealMessage) {
    val mine = m.senderRole.equals("cp", true)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start) {
        Column(
            Modifier.background(if (mine) Teal else Color.White, RoundedCornerShape(14.dp))
                .border(if (mine) 0.dp else 1.dp, if (mine) Teal else CardBorder, RoundedCornerShape(14.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            if (!mine) Text(m.senderName, color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            Text(m.message, color = if (mine) Color.White else TextPrimary, fontSize = 13.sp)
        }
    }
}
