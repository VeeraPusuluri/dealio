package com.dealio.app.ui.cp.notifications

import android.app.Application
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.BuilderNotification
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.cp.CpViewModel
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CpNotifState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<BuilderNotification> = emptyList(),
)

class CpNotificationsViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(CpNotifState())
    val state: StateFlow<CpNotifState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getNotifications()) {
                is ApiResult.Success -> {
                    _state.update { it.copy(loading = false, items = r.data) }
                    repo.markAllNotificationsRead()
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@Composable
fun CpNotificationsScreen(nav: NavController, vm: CpNotificationsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold("Notifications", nav) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = vm::load, modifier = Modifier.padding(inner))
            state.items.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.NotificationsNone, "You're all caught up", "Lead and deal updates will appear here.")
            }
            else -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.items.size) { i ->
                    val n = state.items[i]
                    DealioCard {
                        Text(n.title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(3.dp))
                        Text(n.message, color = TextSecondary, fontSize = 13.sp)
                        Spacer(Modifier.height(6.dp))
                        Text(formatDate(n.createdAt), color = TextSecondary, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
