package com.dealio.app.ui.cp.profile

import android.app.Application
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.PendingActions
import androidx.compose.material.icons.outlined.WorkspacePremium
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import com.dealio.app.data.api.CpInfo
import com.dealio.app.data.api.CpProfile
import com.dealio.app.data.api.CpProfileUpdateRequest
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusColors
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.initialsOf
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

data class CpProfileState(
    val loading: Boolean = true,
    val error: String? = null,
    val profile: CpProfile? = null,
    val message: String? = null,
)

class CpProfileViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(CpProfileState())
    val state: StateFlow<CpProfileState> = _state.asStateFlow()

    init { load() }

    fun load(silent: Boolean = false) {
        if (!silent) _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getProfile()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, profile = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun save(city: String, bio: String, rera: String) {
        viewModelScope.launch {
            val r = repo.updateProfile(CpProfileUpdateRequest(city = city.ifBlank { null }, bio = bio.ifBlank { null }, reraNumber = rera.ifBlank { null }))
            _state.update { it.copy(message = (r as? ApiResult.Error)?.message ?: "Profile updated") }
            if (r is ApiResult.Success) load(silent = true)
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}

@Composable
fun CpProfileScreen(nav: NavController, vm: CpProfileViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var showEdit by remember { mutableStateOf(false) }
    LaunchedEffect(state.message) { state.message?.let { vm.clearMessage() } }

    SubScreenScaffold("Profile", nav) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() }, modifier = Modifier.padding(inner))
            else -> {
                val p = state.profile
                val cp = p?.cp
                Column(
                    Modifier.fillMaxSize().padding(inner).verticalScroll(rememberScrollState()).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(52.dp).background(Teal, RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) {
                                Text(initialsOf(p?.fullName), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            }
                            Spacer(Modifier.width(14.dp))
                            Column(Modifier.weight(1f)) {
                                Text(p?.fullName ?: "Partner", color = TextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                                Text(p?.phone ?: "", color = TextSecondary, fontSize = 13.sp)
                            }
                            Row(
                                Modifier.background(Orange.copy(alpha = 0.12f), RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(Icons.Outlined.WorkspacePremium, null, tint = Orange, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(3.dp))
                                Text(cp?.tier ?: "Silver", color = Orange, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatBox("Total earned", formatINRShort(cp?.totalEarnings ?: 0.0), Modifier.weight(1f))
                        StatBox("Total deals", (cp?.totalDeals ?: 0).toString(), Modifier.weight(1f))
                    }

                    DealioCard {
                        SectionLabel("Verification")
                        Spacer(Modifier.height(10.dp))
                        VerifyRow("Phone", cp?.phoneVerified == true)
                        VerifyRow("Aadhaar", cp?.aadhaarVerified == true)
                        VerifyRow("PAN", cp?.panVerified == true)
                        VerifyRow("RERA", cp?.reraVerified == true)
                    }

                    DealioCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            SectionLabel("Details", Modifier.weight(1f))
                            Text("Edit", color = Teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(4.dp).background(Teal.copy(alpha = 0.10f), RoundedCornerShape(8.dp)).padding(horizontal = 10.dp, vertical = 5.dp)
                                    .let { it }
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        InfoRow("City", cp?.city)
                        InfoRow("RERA number", cp?.reraNumber)
                        InfoRow("Email", p?.email)
                        if (!cp?.bio.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(cp!!.bio!!, color = TextSecondary, fontSize = 12.sp)
                        }
                    }

                    Button(
                        onClick = { showEdit = true },
                        modifier = Modifier.fillMaxWidth().height(48.dp), shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Teal),
                    ) { Text("Edit profile", color = Color.White, fontWeight = FontWeight.SemiBold) }
                }

                if (showEdit) {
                    EditDialog(cp, onDismiss = { showEdit = false }) { city, bio, rera -> vm.save(city, bio, rera); showEdit = false }
                }
            }
        }
    }
}

@Composable
private fun StatBox(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier.background(Color.White, RoundedCornerShape(14.dp))
            .padding(14.dp),
    ) {
        Text(value, color = TextPrimary, fontSize = 19.sp, fontWeight = FontWeight.Bold)
        Text(label, color = TextSecondary, fontSize = 12.sp)
    }
}

@Composable
private fun VerifyRow(label: String, verified: Boolean) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(
            if (verified) Icons.Outlined.CheckCircle else Icons.Outlined.PendingActions,
            null, tint = if (verified) StatusColors.Green else Orange, modifier = Modifier.size(18.dp),
        )
        Spacer(Modifier.width(8.dp))
        Text(label, color = TextPrimary, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(if (verified) "Verified" else "Pending", color = if (verified) StatusColors.Green else Orange, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun EditDialog(cp: CpInfo?, onDismiss: () -> Unit, onSave: (String, String, String) -> Unit) {
    var city by remember { mutableStateOf(cp?.city ?: "") }
    var bio by remember { mutableStateOf(cp?.bio ?: "") }
    var rera by remember { mutableStateOf(cp?.reraNumber ?: "") }
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = { TextButton(onClick = { onSave(city, bio, rera) }) { Text("Save", color = Teal, fontWeight = FontWeight.SemiBold) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        title = { Text("Edit profile", fontWeight = FontWeight.Bold, color = TextPrimary) },
        text = {
            Column {
                OutlinedTextField(value = city, onValueChange = { city = it }, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), label = { Text("City") }, singleLine = true, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors())
                OutlinedTextField(value = rera, onValueChange = { rera = it }, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), label = { Text("RERA number") }, singleLine = true, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors())
                OutlinedTextField(value = bio, onValueChange = { bio = it }, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), label = { Text("Bio") }, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(), minLines = 2)
            }
        },
    )
}
