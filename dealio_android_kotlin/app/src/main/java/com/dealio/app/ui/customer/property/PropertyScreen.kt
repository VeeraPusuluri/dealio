package com.dealio.app.ui.customer.property

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
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material3.Icon
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
import com.dealio.app.data.api.CustomerDeal
import com.dealio.app.data.api.Shortlist
import com.dealio.app.ui.builder.DealioCard
import com.dealio.app.ui.builder.EmptyState
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.builder.titleCase
import com.dealio.app.ui.customer.CustomerRoutes
import com.dealio.app.ui.customer.CustomerViewModel
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private val OWNED = listOf("booked", "closed", "possession", "registration", "disbursed", "sold")

data class PropertyState(
    val loading: Boolean = true,
    val error: String? = null,
    val owned: List<CustomerDeal> = emptyList(),
    val active: List<CustomerDeal> = emptyList(),
    val shortlists: List<Shortlist> = emptyList(),
)

class PropertyViewModel(app: Application) : CustomerViewModel(app) {
    private val _state = MutableStateFlow(PropertyState())
    val state: StateFlow<PropertyState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            val deals = repo.getMyDeals()
            val shortlists = repo.getMyShortlists()
            when (deals) {
                is ApiResult.Success -> {
                    val owned = deals.data.filter { d -> OWNED.any { d.dealStatus.lowercase().contains(it) } }
                    val active = deals.data.filterNot { d -> OWNED.any { d.dealStatus.lowercase().contains(it) } }
                    _state.update {
                        it.copy(
                            loading = false, owned = owned, active = active,
                            shortlists = (shortlists as? ApiResult.Success)?.data ?: emptyList(),
                        )
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = deals.message) }
            }
        }
    }
}

@Composable
fun PropertyScreen(nav: NavController, vm: PropertyViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold("My properties", nav) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = vm::load, modifier = Modifier.padding(inner))
            state.owned.isEmpty() && state.active.isEmpty() && state.shortlists.isEmpty() -> Box(Modifier.padding(inner)) {
                EmptyState(Icons.Outlined.Home, "No properties yet", "Booked homes, active deals and shortlists will appear here.")
            }
            else -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (state.owned.isNotEmpty()) {
                    item { SectionLabel("Booked & owned") }
                    items(state.owned.size) { i -> DealRow(state.owned[i]) { nav.navigate(CustomerRoutes.dealDetail(state.owned[i].dealId)) } }
                }
                if (state.active.isNotEmpty()) {
                    item { SectionLabel("Active deals", Modifier.padding(top = 6.dp)) }
                    items(state.active.size) { i -> DealRow(state.active[i]) { nav.navigate(CustomerRoutes.dealDetail(state.active[i].dealId)) } }
                }
                if (state.shortlists.isNotEmpty()) {
                    item { SectionLabel("Shortlisted units", Modifier.padding(top = 6.dp)) }
                    items(state.shortlists.size) { i ->
                        val s = state.shortlists[i]
                        DealioCard(Modifier.clickable { nav.navigate(CustomerRoutes.projectDetail(s.projectId)) }) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(Modifier.size(38.dp).background(Teal.copy(alpha = 0.12f), RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Outlined.Bookmark, null, tint = Teal, modifier = Modifier.size(18.dp))
                                }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(s.projectName, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                    Text(s.unitDetails?.bhkType ?: s.unitId, color = TextSecondary, fontSize = 12.sp)
                                }
                                StatusChip(titleCase(s.status))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DealRow(d: CustomerDeal, onClick: () -> Unit) {
    DealioCard(Modifier.clickable { onClick() }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(38.dp).background(Teal.copy(alpha = 0.12f), RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                Icon(Icons.Outlined.Home, null, tint = Teal, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(d.projectName, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                if ((d.dealValue ?: 0.0) > 0) Text(formatINRShort(d.dealValue), color = Teal, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
            StatusChip(d.dealStatus)
        }
    }
}
