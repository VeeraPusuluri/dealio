package com.dealio.app.ui.cp.followups

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.EventRepeat
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.CpFollowUp
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.cp.CpViewModel
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FollowUpsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<CpFollowUp> = emptyList(),
    val message: String? = null,
)

class FollowUpsViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(FollowUpsState())
    val state: StateFlow<FollowUpsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getFollowUps()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun markDone(id: String) {
        val numeric = id.toLongOrNull() ?: return
        viewModelScope.launch {
            val r = repo.markFollowUpDone(numeric)
            _state.update { it.copy(message = (r as? ApiResult.Error)?.message ?: "Marked done") }
            if (r is ApiResult.Success) load(silent = true)
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}

@Composable
fun FollowUpsScreen(nav: NavController, vm: FollowUpsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(state.message) { state.message?.let { vm.clearMessage() } }

    SubScreenScaffold("Follow-ups", nav) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() }, modifier = Modifier.padding(inner))
            state.items.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.EventRepeat, "No follow-ups", "Schedule follow-ups from any lead.")
            }
            else -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.items.size) { i ->
                    val f = state.items[i]
                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                if (f.done) Icons.Outlined.CheckCircle else Icons.Outlined.RadioButtonUnchecked,
                                "Toggle",
                                tint = if (f.done) StatusColors.Green else TextSecondary,
                                modifier = Modifier.size(24.dp).clickable(enabled = !f.done) { vm.markDone(f.id) },
                            )
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text("${f.customerName} · ${f.projectName}", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                Text(f.reason, color = TextSecondary, fontSize = 12.sp)
                            }
                            Text(
                                "${formatDate(f.dueDate)}${f.dueTime?.let { " · $it" } ?: ""}",
                                color = TextSecondary, fontSize = 11.sp,
                            )
                        }
                    }
                }
            }
        }
    }
}
