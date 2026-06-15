package com.dealio.app.ui.cp.contacts

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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.Contacts
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.CpContact
import com.dealio.app.data.api.CpContactPayload
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.cp.CpViewModel
import com.dealio.app.ui.theme.ErrorRed
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ContactsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<CpContact> = emptyList(),
    val message: String? = null,
)

class ContactsViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(ContactsState())
    val state: StateFlow<ContactsState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getContacts()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, items = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun save(existing: CpContact?, p: CpContactPayload) {
        viewModelScope.launch {
            val r = if (existing == null) repo.addContact(p) else repo.updateContact(existing.id, p)
            _state.update { it.copy(message = (r as? ApiResult.Error)?.message ?: "Saved") }
            if (r is ApiResult.Success) load(silent = true)
        }
    }

    fun delete(id: Long) {
        viewModelScope.launch {
            val r = repo.deleteContact(id)
            _state.update { it.copy(message = (r as? ApiResult.Error)?.message ?: "Contact deleted") }
            if (r is ApiResult.Success) load(silent = true)
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}

@Composable
fun ContactsScreen(nav: NavController, vm: ContactsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var editing by remember { mutableStateOf<CpContact?>(null) }
    var showDialog by remember { mutableStateOf(false) }

    SubScreenScaffold(
        "Contacts", nav,
        actions = {
            Row(
                Modifier.padding(end = 8.dp).background(Teal, RoundedCornerShape(10.dp))
                    .clickable { editing = null; showDialog = true }
                    .padding(horizontal = 12.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Filled.Add, null, tint = Color.White, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(4.dp))
                Text("Add", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() }, modifier = Modifier.padding(inner))
            state.items.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.Contacts, "No contacts yet", "Build your client book — tap Add.")
            }
            else -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.items.size) { i ->
                    val c = state.items[i]
                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(c.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                Text(c.phone, color = TextSecondary, fontSize = 12.sp)
                                if (!c.bhkPreference.isNullOrBlank() || !c.tags.isNullOrBlank()) {
                                    Text(listOfNotNull(c.bhkPreference, c.tags).joinToString(" · "), color = Teal, fontSize = 11.sp)
                                }
                            }
                            Icon(Icons.Outlined.Edit, "Edit", tint = TextSecondary, modifier = Modifier.size(20.dp).clickable { editing = c; showDialog = true })
                            Spacer(Modifier.width(14.dp))
                            Icon(Icons.Outlined.Delete, "Delete", tint = ErrorRed, modifier = Modifier.size(20.dp).clickable { vm.delete(c.id) })
                        }
                        if (!c.notes.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(c.notes!!, color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        ContactDialog(editing, onDismiss = { showDialog = false }) { p ->
            vm.save(editing, p); showDialog = false
        }
    }
    LaunchedEffect(state.message) { state.message?.let { vm.clearMessage() } }
}

@Composable
private fun ContactDialog(existing: CpContact?, onDismiss: () -> Unit, onSave: (CpContactPayload) -> Unit) {
    var name by remember { mutableStateOf(existing?.name ?: "") }
    var phone by remember { mutableStateOf(existing?.phone ?: "") }
    var email by remember { mutableStateOf(existing?.email ?: "") }
    var bhk by remember { mutableStateOf(existing?.bhkPreference ?: "") }
    var tags by remember { mutableStateOf(existing?.tags ?: "") }
    var notes by remember { mutableStateOf(existing?.notes ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(CpContactPayload(name.trim(), phone.trim(), email.ifBlank { null }, notes.ifBlank { null }, tags.ifBlank { null }, bhk.ifBlank { null }))
                },
                enabled = name.isNotBlank() && phone.length >= 6,
            ) { Text(if (existing == null) "Add" else "Save", color = Teal, fontWeight = FontWeight.SemiBold) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        title = { Text(if (existing == null) "New contact" else "Edit contact", fontWeight = FontWeight.Bold, color = TextPrimary) },
        text = {
            Column {
                Field("Name", name) { name = it }
                Field("Phone", phone) { phone = it.filter(Char::isDigit) }
                Field("Email", email) { email = it }
                Field("BHK preference", bhk) { bhk = it }
                Field("Tags (comma separated)", tags) { tags = it }
                Field("Notes", notes) { notes = it }
            }
        },
    )
}

@Composable
private fun Field(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value, onValueChange = onChange, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        label = { Text(label) }, singleLine = true, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(),
    )
}
