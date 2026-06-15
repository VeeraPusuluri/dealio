package com.dealio.app.ui.cp.leads

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dealio.app.ui.builder.SectionLabel
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

private val outcomes = listOf("Connected", "No answer", "Busy", "Interested", "Not interested", "Callback")

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FollowUpDialog(working: Boolean, onDismiss: () -> Unit, onConfirm: (date: String, time: String?, reason: String) -> Unit) {
    val dates = remember { (0..13).map { LocalDate.now().plusDays(it.toLong()) } }
    var date by remember { mutableStateOf(dates.first()) }
    var reason by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = { onConfirm(date.toString(), null, reason.ifBlank { "Follow up" }) }, enabled = !working) {
                Text("Schedule", color = Teal, fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        title = { Text("Schedule follow-up", fontWeight = FontWeight.Bold, color = TextPrimary) },
        text = {
            Column {
                SectionLabel("Date")
                Spacer(Modifier.height(8.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    dates.take(8).forEach { d ->
                        Chip("${d.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault())} ${d.dayOfMonth}", d == date) { date = d }
                    }
                }
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = reason, onValueChange = { reason = it }, modifier = Modifier.fillMaxWidth(),
                    label = { Text("Reason") }, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(),
                )
            }
        },
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CallLogDialog(working: Boolean, onDismiss: () -> Unit, onConfirm: (outcome: String, duration: String, notes: String?) -> Unit) {
    var outcome by remember { mutableStateOf(outcomes.first()) }
    var duration by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = { onConfirm(outcome, duration.ifBlank { "0m" }, notes.ifBlank { null }) }, enabled = !working) {
                Text("Save", color = Teal, fontWeight = FontWeight.SemiBold)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        title = { Text("Log a call", fontWeight = FontWeight.Bold, color = TextPrimary) },
        text = {
            Column {
                SectionLabel("Outcome")
                Spacer(Modifier.height(8.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    outcomes.forEach { o -> Chip(o, o == outcome) { outcome = o } }
                }
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = duration, onValueChange = { duration = it }, modifier = Modifier.fillMaxWidth(),
                    label = { Text("Duration (e.g. 5m)") }, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(),
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = notes, onValueChange = { notes = it }, modifier = Modifier.fillMaxWidth(),
                    label = { Text("Notes (optional)") }, shape = RoundedCornerShape(12.dp), colors = dealioFieldColors(),
                )
            }
        },
    )
}

@Composable
private fun Chip(label: String, selected: Boolean, onClick: () -> Unit) {
    Text(
        label,
        color = if (selected) Color.White else TextSecondary,
        fontSize = 12.sp,
        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        modifier = Modifier
            .background(if (selected) Teal else Color.White, RoundedCornerShape(10.dp))
            .border(1.dp, if (selected) Teal else CardBorder, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}
