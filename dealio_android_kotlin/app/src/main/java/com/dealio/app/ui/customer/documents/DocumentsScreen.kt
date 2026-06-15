package com.dealio.app.ui.customer.documents

import android.app.Application
import android.content.Intent
import androidx.core.net.toUri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.FolderOff
import androidx.compose.material.icons.outlined.OpenInNew
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.DealDocument
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatDate
import com.dealio.app.ui.builder.resolveUrl
import com.dealio.app.ui.customer.CustomerViewModel
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DocItem(val projectName: String, val doc: DealDocument)

data class DocumentsState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<DocItem> = emptyList(),
)

class DocumentsViewModel(app: Application) : CustomerViewModel(app) {
    private val _state = MutableStateFlow(DocumentsState())
    val state: StateFlow<DocumentsState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getMyDeals()) {
                is ApiResult.Success -> {
                    val docs = r.data.flatMap { d -> d.dealDocuments.map { DocItem(d.projectName, it) } }
                    _state.update { it.copy(loading = false, items = docs) }
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@Composable
fun DocumentsScreen(nav: NavController, vm: DocumentsViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val context = LocalContext.current

    SubScreenScaffold("Documents", nav) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = vm::load, modifier = Modifier.padding(inner))
            state.items.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.FolderOff, "No documents yet", "Quotes, agreements and allotment letters shared by builders show up here.")
            }
            else -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.items.size) { i ->
                    val item = state.items[i]
                    Row(
                        Modifier.fillMaxWidth()
                            .background(Color.White, RoundedCornerShape(14.dp))
                            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                            .clickable {
                                resolveUrl(item.doc.fileUrl)?.let { url ->
                                    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, url.toUri())) }
                                }
                            }
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(Modifier.size(40.dp).background(Teal.copy(alpha = 0.12f), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                            Icon(Icons.Outlined.Description, null, tint = Teal, modifier = Modifier.size(20.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(item.doc.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                            Text("${item.doc.docType} · ${item.projectName}", color = TextSecondary, fontSize = 12.sp, maxLines = 1)
                            Text(formatDate(item.doc.createdAt), color = TextSecondary, fontSize = 11.sp)
                        }
                        Icon(Icons.Outlined.OpenInNew, null, tint = TextSecondary, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}
