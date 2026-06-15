package com.dealio.app.ui.cp.projects

import android.app.Application
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Project
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.InfoRow
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.priceHigh
import com.dealio.app.ui.builder.priceLow
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.builder.titleCase
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.cp.CpViewModel
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CpProjectDetailState(
    val loading: Boolean = true,
    val error: String? = null,
    val project: Project? = null,
    val working: Boolean = false,
    val message: String? = null,
    val shareUrl: String? = null,
)

class CpProjectDetailViewModel(app: Application) : CpViewModel(app) {
    private val _state = MutableStateFlow(CpProjectDetailState())
    val state: StateFlow<CpProjectDetailState> = _state.asStateFlow()

    fun load(id: Long) {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getProject(id)) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, project = r.data) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun share() {
        val id = _state.value.project?.id ?: return
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            when (val r = repo.getShareLink(id)) {
                is ApiResult.Success -> _state.update { it.copy(working = false, shareUrl = r.data.url) }
                is ApiResult.Error -> _state.update { it.copy(working = false, message = r.message) }
            }
        }
    }

    fun addLead(name: String, phone: String, email: String) {
        val id = _state.value.project?.id ?: return
        _state.update { it.copy(working = true) }
        viewModelScope.launch {
            val r = repo.createLead(id, name, phone, email)
            _state.update { it.copy(working = false, message = (r as? ApiResult.Error)?.message ?: "Lead added — find it under Leads.") }
        }
    }

    fun clearShareUrl() = _state.update { it.copy(shareUrl = null) }
    fun clearMessage() = _state.update { it.copy(message = null) }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun CpProjectDetailScreen(nav: NavController, projectId: Long, vm: CpProjectDetailViewModel = viewModel()) {
    LaunchedEffect(projectId) { vm.load(projectId) }
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val context = LocalContext.current
    var showAddLead by remember { mutableStateOf(false) }

    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.clearMessage() } }
    LaunchedEffect(state.shareUrl) {
        state.shareUrl?.let { url ->
            val p = state.project
            val text = "Check out ${p?.name ?: "this project"} on Dealio: $url"
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, text)
            }
            runCatching { context.startActivity(Intent.createChooser(send, "Share project")) }
            vm.clearShareUrl()
        }
    }

    val p = state.project
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text(p?.name ?: "Project", fontWeight = FontWeight.Bold, fontSize = 18.sp, maxLines = 1) },
                navigationIcon = { IconButton(onClick = { nav.navigateUp() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Navy) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White, titleContentColor = Navy),
            )
        },
        bottomBar = {
            if (p != null) {
                Row(
                    Modifier.fillMaxWidth().background(Color.White).padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    OutlinedButton(
                        onClick = { vm.share() }, enabled = !state.working,
                        modifier = Modifier.weight(1f).height(50.dp), shape = RoundedCornerShape(14.dp),
                    ) {
                        Icon(Icons.Outlined.Share, null, tint = Navy, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp)); Text("Share link", color = Navy, fontWeight = FontWeight.SemiBold)
                    }
                    Button(
                        onClick = { showAddLead = true },
                        modifier = Modifier.weight(1.2f).height(50.dp), shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Teal),
                    ) {
                        Icon(Icons.Outlined.PersonAdd, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp)); Text("Add lead", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load(projectId) }, modifier = Modifier.padding(inner))
            p != null -> LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(inner),
                    contentPadding = PaddingValues(bottom = 16.dp),
                ) {
                    item {
                        Box(Modifier.fillMaxWidth().height(180.dp).background(Brush.linearGradient(listOf(NavyMid, Teal)))) {
                            val url = resolveUrl(p.imageUrl ?: p.coverUrl)
                            if (url != null) AsyncImage(model = url, contentDescription = p.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                            else Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Icon(Icons.Outlined.Apartment, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(48.dp))
                            }
                        }
                    }
                    item {
                        Column(Modifier.padding(16.dp)) {
                            val lo = p.priceLow(); val hi = p.priceHigh()
                            val price = when {
                                (lo ?: 0.0) > 0 && (hi ?: 0.0) > 0 && hi != lo -> "${formatINRShort(lo)} – ${formatINRShort(hi)}"
                                (lo ?: 0.0) > 0 -> "${formatINRShort(lo)}+"
                                else -> "Price on request"
                            }
                            Text(price, color = Teal, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.LocationOn, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(listOfNotNull(p.locality, p.city).joinToString(", ").ifBlank { "—" }, color = TextSecondary, fontSize = 13.sp)
                            }
                            if (!p.commissionValue?.toString().isNullOrBlank() && (p.commissionValue ?: 0.0) > 0) {
                                Spacer(Modifier.height(10.dp))
                                Text(
                                    "Earn ${p.commissionValue}% commission",
                                    color = Navy, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.background(Teal.copy(alpha = 0.10f), RoundedCornerShape(8.dp)).padding(horizontal = 10.dp, vertical = 6.dp),
                                )
                            }
                        }
                    }
                    if (!p.description.isNullOrBlank()) {
                        item {
                            Column(Modifier.padding(horizontal = 16.dp)) {
                                SectionLabel("About"); Spacer(Modifier.height(8.dp))
                                Text(p.description!!, color = TextSecondary, fontSize = 13.sp, lineHeight = 20.sp)
                                Spacer(Modifier.height(12.dp))
                            }
                        }
                    }
                    item {
                        Column(Modifier.padding(16.dp)) {
                            SectionLabel("Details"); Spacer(Modifier.height(8.dp))
                            InfoRow("Configurations", p.configurations?.joinToString(", "))
                            InfoRow("Status", p.status?.let { titleCase(it) })
                            InfoRow("Possession", p.possessionDate)
                            InfoRow("RERA", p.reraNumber)
                        }
                    }
                    if (!p.amenities.isNullOrEmpty()) {
                        item {
                            Column(Modifier.padding(horizontal = 16.dp)) {
                                SectionLabel("Amenities"); Spacer(Modifier.height(8.dp))
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    p.amenities!!.forEach { a ->
                                        Text(a, color = Navy, fontSize = 12.sp, modifier = Modifier.background(Teal.copy(alpha = 0.08f), RoundedCornerShape(8.dp)).padding(horizontal = 10.dp, vertical = 6.dp))
                                    }
                                }
                            }
                        }
                    }
                }
        }
    }

    if (showAddLead && p != null) {
        AddLeadDialog(working = state.working, onDismiss = { showAddLead = false }) { name, phone, email ->
            vm.addLead(name, phone, email); showAddLead = false
        }
    }
}

@Composable
private fun AddLeadDialog(working: Boolean, onDismiss: () -> Unit, onConfirm: (name: String, phone: String, email: String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = { onConfirm(name, phone, email) }, enabled = !working && phone.length >= 6) {
                Text("Add lead", color = Teal, fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        title = { Text("Add a lead", fontWeight = FontWeight.Bold, color = TextPrimary) },
        text = {
            Column {
                OutlinedTextField(value = name, onValueChange = { name = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Customer name") }, singleLine = true, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = phone, onValueChange = { phone = it.filter(Char::isDigit) }, modifier = Modifier.fillMaxWidth(), label = { Text("Phone") }, singleLine = true, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = email, onValueChange = { email = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Email (optional)") }, singleLine = true, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors())
            }
        },
    )
}
