package com.dealio.app.ui.builder.broadcast

import android.app.Application
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Campaign
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Broadcast
import com.dealio.app.data.api.BroadcastRequest
import com.dealio.app.ui.builder.BuilderViewModel
import com.dealio.app.ui.builder.ChipSingleSelect
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private val audiences = listOf("All CPs", "Verified CPs", "Premium CPs", "All Customers")

data class BroadcastState(
    val loading: Boolean = true,
    val history: List<Broadcast> = emptyList(),
    val sending: Boolean = false,
    val toast: String? = null,
)

class BroadcastViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(BroadcastState())
    val state: StateFlow<BroadcastState> = _state.asStateFlow()
    init { load() }
    fun load() {
        viewModelScope.launch {
            when (val r = repo.getBroadcasts()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, history = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, toast = r.message) }
            }
        }
    }
    fun send(message: String, audience: String, onSent: () -> Unit) {
        if (message.isBlank()) { _state.update { it.copy(toast = "Enter a message") }; return }
        _state.update { it.copy(sending = true) }
        viewModelScope.launch {
            when (val r = repo.sendBroadcast(BroadcastRequest(message.trim(), audience))) {
                is ApiResult.Success -> { _state.update { it.copy(sending = false, toast = "Broadcast sent") }; load(); onSent() }
                is ApiResult.Error -> _state.update { it.copy(sending = false, toast = r.message) }
            }
        }
    }
    fun clearToast() = _state.update { it.copy(toast = null) }
}

@Composable
fun BroadcastScreen(nav: NavController, vm: BroadcastViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var message by remember { mutableStateOf("") }
    var audience by remember { mutableStateOf(audiences.first()) }

    SubScreenScaffold("Broadcast", nav) { pad ->
        Column(
            Modifier.fillMaxSize().padding(pad).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            DealioCard {
                SectionLabel("New broadcast")
                Spacer(Modifier.height(10.dp))
                Text("Audience", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(6.dp))
                ChipSingleSelect(audiences, audience) { audience = it }
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = message, onValueChange = { message = it },
                    modifier = Modifier.fillMaxWidth(), minLines = 3,
                    placeholder = { Text("Write your announcement…") },
                    shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(),
                )
                Spacer(Modifier.height(12.dp))
                Box(
                    Modifier.fillMaxWidth().height(48.dp)
                        .background(if (state.sending) Teal.copy(alpha = 0.6f) else Navy, RoundedCornerShape(12.dp))
                        .clickable(enabled = !state.sending) { vm.send(message, audience) { message = "" } },
                    contentAlignment = Alignment.Center,
                ) {
                    if (state.sending) CircularProgressIndicator(Modifier.height(20.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text("Send broadcast", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                }
                state.toast?.let { Spacer(Modifier.height(8.dp)); Text(it, color = Teal, fontSize = 12.sp) }
            }

            SectionLabel("Recent broadcasts")
            if (state.history.isEmpty()) {
                Text("No broadcasts sent yet.", color = TextSecondary, fontSize = 13.sp)
            } else {
                state.history.forEach { b ->
                    DealioCard {
                        Row {
                            Text(b.audience, color = Teal, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            Text("${b.delivered} sent", color = TextSecondary, fontSize = 11.sp)
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(b.message, color = TextPrimary, fontSize = 13.sp)
                        Spacer(Modifier.height(4.dp))
                        Text(formatDate(b.createdAt), color = TextSecondary, fontSize = 11.sp)
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}
