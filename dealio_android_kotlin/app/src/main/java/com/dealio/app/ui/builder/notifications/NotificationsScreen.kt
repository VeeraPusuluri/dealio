package com.dealio.app.ui.builder.notifications

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.NotificationsNone
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
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.BuilderNotification
import com.dealio.app.ui.builder.BuilderViewModel
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<BuilderNotification> = emptyList(),
)

class NotificationsViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(NotificationsState())
    val state: StateFlow<NotificationsState> = _state.asStateFlow()
    init { load() }
    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getNotifications()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
    fun markAllRead() {
        viewModelScope.launch {
            repo.markAllNotificationsRead()
            _state.update { s -> s.copy(items = s.items.map { it.copy(read = true) }) }
        }
    }
}

@Composable
fun NotificationsScreen(nav: NavController, vm: NotificationsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold(
        "Notifications", nav,
        actions = {
            if (state.items.any { !it.read }) {
                Text("Mark all read", color = Teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(end = 14.dp).clickable { vm.markAllRead() })
            }
        },
    ) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, vm::load, Modifier.padding(pad))
            state.items.isEmpty() -> EmptyState(Icons.Outlined.NotificationsNone, "All caught up", "You have no notifications.", Modifier.padding(pad))
            else -> LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.items.size) { i ->
                    val n = state.items[i]
                    DealioCard {
                        Row {
                            if (!n.read) {
                                Box(Modifier.size(8.dp).padding(top = 5.dp).background(Teal, RoundedCornerShape(4.dp)))
                                Spacer(Modifier.size(8.dp))
                            }
                            Column(Modifier.weight(1f)) {
                                Text(n.title, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                Spacer(Modifier.size(2.dp))
                                Text(n.message, color = TextSecondary, fontSize = 13.sp)
                                Spacer(Modifier.size(4.dp))
                                Text(formatDate(n.createdAt), color = TextSecondary, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
