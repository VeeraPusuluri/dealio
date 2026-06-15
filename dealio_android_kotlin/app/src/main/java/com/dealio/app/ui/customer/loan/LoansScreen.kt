package com.dealio.app.ui.customer.loan

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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import com.dealio.app.data.api.CustomerDeal
import com.dealio.app.ui.builder.ErrorState
import com.dealio.app.ui.builder.LoadingState
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.StatusChip
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINR
import com.dealio.app.ui.builder.formatINRShort
import com.dealio.app.ui.customer.CustomerRoutes
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
import kotlin.math.pow
import kotlin.math.roundToLong

data class LoansState(
    val loading: Boolean = true,
    val error: String? = null,
    val loans: List<CustomerDeal> = emptyList(),
)

class LoansViewModel(app: Application) : CustomerViewModel(app) {
    private val _state = MutableStateFlow(LoansState())
    val state: StateFlow<LoansState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getMyDeals()) {
                is ApiResult.Success -> _state.update { it.copy(loading = false, loans = r.data.filter { d -> d.loanCaseId != null }) }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@Composable
fun LoansScreen(nav: NavController, vm: LoansViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    SubScreenScaffold(
        "Home loans", nav,
        actions = {
            Row(
                Modifier.padding(end = 8.dp).background(Teal, RoundedCornerShape(10.dp))
                    .clickable { nav.navigate(CustomerRoutes.loanApply()) }
                    .padding(horizontal = 12.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Outlined.Add, null, tint = Color.White, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(4.dp))
                Text("Apply", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        },
    ) { inner ->
        when {
            state.loading -> LoadingState(Modifier.padding(inner))
            state.error != null -> ErrorState(state.error!!, onRetry = vm::load, modifier = Modifier.padding(inner))
            else -> LazyColumn(
                modifier = Modifier.padding(inner),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                item { EmiCalculator() }

                item { SectionLabel("Your applications", Modifier.padding(top = 4.dp)) }
                if (state.loans.isEmpty()) {
                    item {
                        Column(
                            Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(16.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp)).padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Icon(Icons.Outlined.AccountBalance, null, tint = TextSecondary, modifier = Modifier.size(28.dp))
                            Spacer(Modifier.height(8.dp))
                            Text("No loan applications yet", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            Text("Tap Apply to get matched with the best home-loan offers.", color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                } else {
                    items(state.loans.size) { i -> LoanCard(state.loans[i]) }
                }
            }
        }
    }
}

private val loanStages = listOf("Applied", "Under Review", "Sanctioned", "Disbursed")

@Composable
private fun LoanCard(d: CustomerDeal) {
    val current = loanStages.indexOfFirst { it.equals(d.loanStatus, true) }
    Column(
        Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)).padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(d.projectName, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Text(formatINRShort(d.loanAmount), color = Teal, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
            StatusChip(d.loanStatus ?: "Applied")
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            loanStages.forEachIndexed { idx, _ ->
                Box(
                    Modifier.weight(1f).height(5.dp)
                        .background(if (idx <= current) Teal else CardBorder, RoundedCornerShape(3.dp)),
                )
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            loanStages.forEach { Text(it, color = TextSecondary, fontSize = 9.sp) }
        }
        if (d.interestRate != null || d.tenureMonths != null) {
            Spacer(Modifier.height(8.dp))
            Text(
                listOfNotNull(d.interestRate?.let { "$it% p.a." }, d.tenureMonths?.let { "${it / 12} yr tenure" }).joinToString(" · "),
                color = TextSecondary, fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun EmiCalculator() {
    var amount by remember { mutableFloatStateOf(50_00_000f) }
    var rate by remember { mutableFloatStateOf(8.5f) }
    var years by remember { mutableFloatStateOf(20f) }

    val r = rate / 12f / 100f
    val n = years * 12f
    val emi = if (r > 0) (amount * r * (1 + r).pow(n) / ((1 + r).pow(n) - 1)) else amount / n
    val total = emi * n
    val interest = total - amount

    Column(
        Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)).padding(16.dp),
    ) {
        SectionLabel("EMI calculator")
        Spacer(Modifier.height(12.dp))
        Box(Modifier.fillMaxWidth().background(Teal.copy(alpha = 0.08f), RoundedCornerShape(12.dp)).padding(14.dp)) {
            Column {
                Text("Monthly EMI", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Text(formatINR(emi.toDouble()), color = Teal, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(12.dp))
        SliderRow("Loan amount", formatINRShort(amount.toDouble()), amount, 5_00_000f..5_00_00_000f) { amount = it }
        SliderRow("Interest rate", "${(rate * 10).roundToLong() / 10.0}%", rate, 6f..12f) { rate = it }
        SliderRow("Tenure", "${years.toInt()} yrs", years, 5f..30f) { years = it }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Total interest", color = TextSecondary, fontSize = 12.sp)
            Text(formatINRShort(interest.toDouble()), color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Total payable", color = TextSecondary, fontSize = 12.sp)
            Text(formatINRShort(total.toDouble()), color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun SliderRow(label: String, value: String, current: Float, range: ClosedFloatingPointRange<Float>, onChange: (Float) -> Unit) {
    Column(Modifier.padding(vertical = 2.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, color = TextSecondary, fontSize = 12.sp)
            Text(value, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
        Slider(
            value = current, onValueChange = onChange, valueRange = range,
            colors = SliderDefaults.colors(thumbColor = Teal, activeTrackColor = Teal),
        )
    }
}
