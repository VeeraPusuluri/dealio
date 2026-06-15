package com.dealio.app.ui.cp.meetings

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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.dealio.app.data.api.Meeting
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.cp.CpViewModel
import com.dealio.app.ui.theme.Orange
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CpMeetingsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<Meeting> = emptyList(),
    val message: String? = null,
)

class CpMeetingsViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(CpMeetingsState())
    val state: StateFlow<CpMeetingsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getMeetings()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun saveNote(meetingId: Long, notes: String, rating: Int?) {
        viewModelScope.launch {
            val r = repo.addMeetingNote(meetingId, notes, rating)
            _state.update { it.copy(message = (r as? ApiResult.Error)?.message ?: "Note saved") }
            if (r is ApiResult.Success) load(silent = true)
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}

@Composable
fun CpMeetingsScreen(nav: NavController, vm: CpMeetingsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var noteTarget by remember { mutableStateOf<Meeting?>(null) }
    LaunchedEffect(state.message) { state.message?.let { vm.clearMessage() } }

    SubScreenScaffold("Meetings", nav) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() }, modifier = Modifier.padding(inner))
            state.items.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.CalendarMonth, "No meetings", "Meetings you arrange will appear here.")
            }
            else -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.items.size) { i ->
                    val m = state.items[i]
                    DealioCard(Modifier.clickable { noteTarget = m }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(m.customerName, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Text(m.projectName, color = TextSecondary, fontSize = 12.sp)
                            }
                            StatusChip(m.status)
                        }
                        Spacer(Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.CalendarMonth, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(formatDate(m.confirmedDate ?: m.preferredDate), color = TextPrimary, fontSize = 13.sp)
                            Spacer(Modifier.width(14.dp))
                            Icon(Icons.Outlined.Schedule, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(m.confirmedTime ?: m.preferredTime, color = TextPrimary, fontSize = 13.sp)
                        }
                        if (!m.cpNotes.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text("Your note: ${m.cpNotes}", color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }

    noteTarget?.let { m ->
        MeetingNoteDialog(m, onDismiss = { noteTarget = null }) { notes, rating ->
            vm.saveNote(m.id, notes, rating); noteTarget = null
        }
    }
}

@Composable
private fun MeetingNoteDialog(m: Meeting, onDismiss: () -> Unit, onSave: (String, Int?) -> Unit) {
    var notes by remember { mutableStateOf(m.cpNotes ?: "") }
    var rating by remember { mutableIntStateOf(m.cpRating ?: 0) }
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = { TextButton(onClick = { onSave(notes.trim(), rating.takeIf { it > 0 }) }) { Text("Save", color = Teal, fontWeight = FontWeight.SemiBold) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        title = { Text("Meeting note", fontWeight = FontWeight.Bold, color = TextPrimary) },
        text = {
            Column {
                Text("Rate this visit", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(6.dp))
                Row {
                    (1..5).forEach { s ->
                        Icon(
                            if (rating >= s) Icons.Filled.Star else Icons.Outlined.StarBorder, "Rate $s",
                            tint = if (rating >= s) Orange else TextSecondary,
                            modifier = Modifier.size(28.dp).padding(end = 4.dp).clickable { rating = s },
                        )
                    }
                }
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(value = notes, onValueChange = { notes = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Notes") }, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(), minLines = 2)
            }
        },
    )
}
