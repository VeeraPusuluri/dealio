package com.dealio.app.ui.customer.journey

import android.content.Intent
import androidx.core.net.toUri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.api.CustomerDeal
import com.dealio.app.data.api.DealMessage
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.formatINR
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DealDetailScreen(nav: NavController, dealId: Long, vm: DealDetailViewModel = viewModel()) {
    LaunchedEffect(dealId) { vm.load(dealId) }
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val context = LocalContext.current
    var draft by remember { mutableStateOf("") }

    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.clearMessage() } }

    val d = state.deal
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text(d?.projectName ?: "Deal", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = { nav.navigateUp() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Navy) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = androidx.compose.ui.graphics.Color.White, titleContentColor = Navy),
            )
        },
        bottomBar = {
            if (d != null) {
                Row(
                    Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Color.White)
                        .padding(horizontal = 12.dp, vertical = 8.dp).imePadding(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedTextField(
                        value = draft,
                        onValueChange = { draft = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Message the builder…") },
                        shape = RoundedCornerShape(22.dp),
                        colors = dealioFieldColors(),
                        maxLines = 4,
                    )
                    Spacer(Modifier.width(8.dp))
                    IconButton(
                        onClick = { vm.sendMessage(draft); draft = "" },
                        enabled = draft.isNotBlank() && !state.sending,
                        modifier = Modifier.size(48.dp).background(Teal, RoundedCornerShape(24.dp)),
                    ) {
                        if (state.sending) CircularProgressIndicator(Modifier.size(20.dp), color = androidx.compose.ui.graphics.Color.White, strokeWidth = 2.dp)
                        else Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = androidx.compose.ui.graphics.Color.White, modifier = Modifier.size(20.dp))
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
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StatusChip(d.dealStatus)
                        Spacer(Modifier.width(8.dp))
                        if (d.customerConfirmed) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.CheckCircle, null, tint = StatusColors.Green, modifier = Modifier.size(15.dp))
                                Spacer(Modifier.width(3.dp))
                                Text("Confirmed by you", color = StatusColors.Green, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }

                // Actions
                item { DealActions(d, working = state.working, onAccept = vm::acceptNegotiation, onConfirm = vm::confirm) }

                // Loan info
                if (d.loanCaseId != null) {
                    item {
                        Column(
                            Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Color.White, RoundedCornerShape(16.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp)).padding(14.dp),
                        ) {
                            SectionLabel("Home loan")
                            Spacer(Modifier.height(8.dp))
                            InfoRow("Amount", d.loanAmount?.let { formatINR(it) })
                            InfoRow("Status", d.loanStatus)
                            InfoRow("Tenure", d.tenureMonths?.let { "${it / 12} years" })
                            InfoRow("Interest", d.interestRate?.let { "$it%" })
                        }
                    }
                }

                // Documents
                if (d.dealDocuments.isNotEmpty()) {
                    item { SectionLabel("Documents") }
                    items(d.dealDocuments.size) { i ->
                        val doc = d.dealDocuments[i]
                        Row(
                            Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Color.White, RoundedCornerShape(12.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                                .clickable {
                                    resolveUrl(doc.fileUrl)?.let { url ->
                                        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, url.toUri())) }
                                    }
                                }
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Outlined.Description, null, tint = Teal, modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(doc.name, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                                Text(doc.docType, color = TextSecondary, fontSize = 11.sp)
                            }
                        }
                    }
                }

                // Conversation
                item { SectionLabel("Conversation") }
                if (d.messages.isEmpty()) {
                    item { Text("No messages yet. Say hello to the builder!", color = TextSecondary, fontSize = 13.sp) }
                } else {
                    items(d.messages.size) { i -> MessageBubble(d.messages[i]) }
                }
            }
        }
    }
}

@Composable
private fun DealActions(d: CustomerDeal, working: Boolean, onAccept: () -> Unit, onConfirm: () -> Unit) {
    val status = d.dealStatus.lowercase()
    val showAccept = status.contains("negotiation") && !d.customerConfirmed
    val showConfirm = !d.customerConfirmed && !showAccept &&
        (status.contains("agreement") || status.contains("pending booking") || status.contains("booked"))

    if (showAccept) {
        Button(
            onClick = onAccept, enabled = !working,
            modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Teal),
        ) { Text("Accept negotiated price", color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold) }
    } else if (showConfirm) {
        Button(
            onClick = onConfirm, enabled = !working,
            modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Teal),
        ) { Text("Confirm deal", color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun MessageBubble(m: DealMessage) {
    val mine = m.senderRole.equals("customer", true)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start) {
        Column(
            Modifier
                .background(
                    if (mine) Teal else androidx.compose.ui.graphics.Color.White,
                    RoundedCornerShape(topStart = 14.dp, topEnd = 14.dp, bottomStart = if (mine) 14.dp else 2.dp, bottomEnd = if (mine) 2.dp else 14.dp),
                )
                .border(if (mine) 0.dp else 1.dp, if (mine) Teal else CardBorder, RoundedCornerShape(14.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            if (!mine) Text(m.senderName, color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            Text(m.message, color = if (mine) androidx.compose.ui.graphics.Color.White else TextPrimary, fontSize = 13.sp)
        }
    }
}
