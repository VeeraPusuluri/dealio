package com.dealio.app.ui.customer.saved

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
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.api.Shortlist
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.RefreshOnResume
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.TabHeader
import com.dealio.app.ui.builder.titleCase
import com.dealio.app.ui.customer.CustomerRoutes
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun SavedScreen(nav: NavController, vm: SavedViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    RefreshOnResume { vm.load(silent = true) }
    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.clearMessage() } }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = { TabHeader("Saved homes", subtitle = "${state.items.size} shortlisted") },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = { vm.load() }, modifier = Modifier.padding(inner))
            state.items.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.Bookmark, "Nothing saved yet", "Shortlist a configuration from any project to compare later.")
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = inner.calculateTopPadding() + 8.dp, bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(state.items.size) { i ->
                    SavedCard(state.items[i], onOpen = { nav.navigate(CustomerRoutes.projectDetail(state.items[i].projectId)) }, onPricing = { vm.requestPricing(state.items[i]) })
                }
            }
        }
    }
}

@Composable
private fun SavedCard(s: Shortlist, onOpen: () -> Unit, onPricing: () -> Unit) {
    DealioCard(Modifier.clickable { onOpen() }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(s.projectName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Text(
                    listOfNotNull(s.unitDetails?.bhkType ?: s.unitId, s.projectCity.ifBlank { null }).joinToString(" · "),
                    color = TextSecondary, fontSize = 12.sp,
                )
            }
            StatusChip(titleCase(s.status))
        }
        if (!s.builderNote.isNullOrBlank()) {
            Spacer(Modifier.height(8.dp))
            Text("Builder: ${s.builderNote}", color = TextSecondary, fontSize = 12.sp)
        }
        Spacer(Modifier.height(10.dp))
        Button(
            onClick = onPricing,
            modifier = Modifier.fillMaxWidth().height(42.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Navy),
        ) { Text("Request pricing", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold) }
    }
}
