package com.dealio.app.ui.builder.shortlists

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Shortlist
import com.dealio.app.ui.builder.BuilderViewModel
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ShortlistsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<Shortlist> = emptyList(),
    val working: Boolean = false,
)

class ShortlistsViewModel(app: Application) : BuilderViewModel(app) {
    private val _state = MutableStateFlow(ShortlistsState())
    val state: StateFlow<ShortlistsState> = _state.asStateFlow()
    init { load() }
    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getShortlists()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
    fun respond(s: Shortlist, status: String, note: String?) {
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            repo.respondToShortlist(s.id, status, note)
            load()
            _state.update { it.copy(working = false) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShortlistsScreen(nav: NavController, vm: ShortlistsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var sheet by remember { mutableStateOf<Shortlist?>(null) }
    val sheetState = rememberModalBottomSheetState()

    SubScreenScaffold("Shortlists", nav) { pad ->
        when {
            state.loading -> LoadingState(Modifier.padding(pad))
            state.error != null -> ErrorState(state.error!!, vm::load, Modifier.padding(pad))
            state.items.isEmpty() -> EmptyState(Icons.Outlined.FavoriteBorder, "No shortlists", "Units customers shortlist appear here for your response.", Modifier.padding(pad))
            else -> LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.items.size) { i ->
                    val s = state.items[i]
                    DealioCard(Modifier.clickable { if (s.status.equals("Pending", true)) sheet = s }) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(s.customerName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                                Text(s.projectName, color = TextSecondary, fontSize = 12.sp)
                            }
                            StatusChip(s.status)
                        }
                        Spacer(Modifier.height(8.dp))
                        InfoRow("Unit", s.unitDetails?.unitNumber ?: s.unitId)
                        InfoRow("Type", s.unitDetails?.bhkType)
                        InfoRow("Floor", s.unitDetails?.floor)
                        InfoRow("Price", s.unitDetails?.price)
                        if (!s.builderNote.isNullOrBlank()) InfoRow("Your note", s.builderNote)
                        if (s.status.equals("Pending", true)) {
                            Spacer(Modifier.height(6.dp))
                            Text("Tap to respond", color = StatusColors.Amber, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }

    if (sheet != null) {
        val s = sheet!!
        var note by remember { mutableStateOf("") }
        ModalBottomSheet(onDismissRequest = { sheet = null }, sheetState = sheetState, containerColor = Color.White) {
            Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp)) {
                Text("Respond to ${s.customerName}", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text("${s.unitDetails?.unitNumber ?: s.unitId} · ${s.projectName}", color = TextSecondary, fontSize = 13.sp)
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(
                    value = note, onValueChange = { note = it }, modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Optional note (for suggest alternative)") }, minLines = 2,
                    shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(),
                )
                Spacer(Modifier.height(12.dp))
                Box(
                    Modifier.fillMaxWidth().height(46.dp).background(StatusColors.Green, RoundedCornerShape(12.dp))
                        .clickable(enabled = !state.working) { vm.respond(s, "Accepted", note.ifBlank { null }); sheet = null },
                    contentAlignment = Alignment.Center,
                ) { Text("Accept unit", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp) }
                Spacer(Modifier.height(8.dp))
                Box(
                    Modifier.fillMaxWidth().height(46.dp).border(1.dp, StatusColors.Purple, RoundedCornerShape(12.dp))
                        .clickable(enabled = !state.working) { vm.respond(s, "SuggestOther", note.ifBlank { "Let me suggest a better-suited unit." }); sheet = null },
                    contentAlignment = Alignment.Center,
                ) { Text("Suggest alternative", color = StatusColors.Purple, fontWeight = FontWeight.SemiBold, fontSize = 14.sp) }
            }
        }
    }
}
