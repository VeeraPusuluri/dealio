package com.dealio.app.ui.customer.loan

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.builder.SubScreenScaffold
import com.dealio.app.ui.builder.formatINR
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary

private val employmentTypes = listOf("Salaried", "Self-employed", "Business", "Professional")
private val tenureOptions = listOf(10, 15, 20, 25, 30)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LoanApplyScreen(nav: NavController, projectId: Long?, builderId: Long?, vm: LoanViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var loanAmount by remember { mutableStateOf("") }
    var propertyValue by remember { mutableStateOf("") }
    var employment by remember { mutableStateOf(employmentTypes.first()) }
    var tenure by remember { mutableStateOf(20) }

    LaunchedEffect(state.done) { if (state.done) nav.navigateUp() }

    SubScreenScaffold("Apply for home loan", nav) { inner ->
        Column(
            Modifier.padding(inner).verticalScroll(rememberScrollState()).imePadding().padding(16.dp),
        ) {
            Text("Tell us a few details and a loan officer will get in touch with the best offers.", color = TextSecondary, fontSize = 13.sp)
            Spacer(Modifier.height(20.dp))

            SectionLabel("Loan amount required")
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = loanAmount,
                onValueChange = { loanAmount = it.filter(Char::isDigit) },
                modifier = Modifier.fillMaxWidth(),
                prefix = { Text("₹ ") },
                placeholder = { Text("50,00,000") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = dealioFieldColors(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            )
            if (loanAmount.isNotBlank()) Text(formatINR(loanAmount.toDoubleOrNull() ?: 0.0), color = Teal, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 4.dp))
            Spacer(Modifier.height(18.dp))

            SectionLabel("Property value")
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = propertyValue,
                onValueChange = { propertyValue = it.filter(Char::isDigit) },
                modifier = Modifier.fillMaxWidth(),
                prefix = { Text("₹ ") },
                placeholder = { Text("65,00,000") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = dealioFieldColors(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            )
            Spacer(Modifier.height(18.dp))

            SectionLabel("Employment type")
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                employmentTypes.forEach { Pill(it, it == employment) { employment = it } }
            }
            Spacer(Modifier.height(18.dp))

            SectionLabel("Tenure")
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                tenureOptions.forEach { Pill("$it yrs", it == tenure) { tenure = it } }
            }
            Spacer(Modifier.height(28.dp))

            Button(
                onClick = {
                    val amt = loanAmount.toDoubleOrNull() ?: 0.0
                    val pv = propertyValue.toDoubleOrNull() ?: amt
                    vm.submit(builderId, projectId, amt, pv, employment, tenure)
                },
                enabled = (loanAmount.toDoubleOrNull() ?: 0.0) > 0 && !state.submitting,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Teal),
            ) {
                if (state.submitting) CircularProgressIndicator(Modifier.height(22.dp), color = Color.White, strokeWidth = 2.5.dp)
                else Text("Submit application", color = Color.White, fontWeight = FontWeight.Bold)
            }
            state.message?.let {
                Spacer(Modifier.height(12.dp))
                Text(it, color = TextSecondary, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun Pill(label: String, selected: Boolean, onClick: () -> Unit) {
    Text(
        label,
        color = if (selected) Color.White else TextSecondary,
        fontSize = 13.sp,
        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        modifier = Modifier
            .background(if (selected) Teal else Color.White, RoundedCornerShape(10.dp))
            .border(1.dp, if (selected) Teal else CardBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 9.dp),
    )
}
