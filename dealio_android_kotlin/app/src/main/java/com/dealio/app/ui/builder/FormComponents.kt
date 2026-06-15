package com.dealio.app.ui.builder

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextPrimary
import com.dealio.app.ui.theme.TextSecondary
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/** A titled white card used to group form fields. */
@Composable
fun FormSectionCard(title: String, subtitle: String? = null, content: @Composable ColumnScope.() -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .padding(16.dp),
    ) {
        Text(title, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        if (subtitle != null) Text(subtitle, color = TextSecondary, fontSize = 12.sp)
        Spacer(Modifier.height(12.dp))
        content()
    }
}

@Composable
fun LabeledField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    required: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
) {
    Column(modifier.fillMaxWidth().padding(bottom = 12.dp)) {
        Row {
            Text(label, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            if (required) Text(" *", color = com.dealio.app.ui.theme.ErrorRed, fontSize = 12.sp)
        }
        Spacer(Modifier.height(5.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { if (placeholder.isNotBlank()) Text(placeholder, fontSize = 13.sp) },
            singleLine = singleLine,
            minLines = minLines,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            shape = RoundedCornerShape(12.dp),
            colors = dealioFieldColors(),
        )
    }
}

/** Two fields side by side. */
@Composable
fun FieldRow(left: @Composable () -> Unit, right: @Composable () -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(Modifier.weight(1f)) { left() }
        Box(Modifier.weight(1f)) { right() }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ChipMultiSelect(options: List<String>, selected: List<String>, onToggle: (String) -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        options.forEach { opt ->
            val isOn = selected.contains(opt)
            Row(
                Modifier
                    .background(if (isOn) Teal.copy(alpha = 0.12f) else Color.White, RoundedCornerShape(10.dp))
                    .border(1.dp, if (isOn) Teal else CardBorder, RoundedCornerShape(10.dp))
                    .clickable { onToggle(opt) }
                    .padding(horizontal = 11.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (isOn) {
                    Icon(Icons.Filled.Check, null, tint = Teal, modifier = Modifier.size(13.dp))
                    Spacer(Modifier.size(4.dp))
                }
                Text(opt, color = if (isOn) Teal else TextSecondary, fontSize = 12.sp,
                    fontWeight = if (isOn) FontWeight.SemiBold else FontWeight.Normal)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ChipSingleSelect(options: List<String>, selected: String, onSelect: (String) -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        options.forEach { opt ->
            val isOn = selected == opt
            Box(
                Modifier
                    .background(if (isOn) NavyMid else Color.White, RoundedCornerShape(10.dp))
                    .border(1.dp, if (isOn) NavyMid else CardBorder, RoundedCornerShape(10.dp))
                    .clickable { onSelect(opt) }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            ) {
                Text(opt, color = if (isOn) Color.White else TextSecondary, fontSize = 12.sp,
                    fontWeight = if (isOn) FontWeight.SemiBold else FontWeight.Normal)
            }
        }
    }
}

@Composable
fun SwitchRow(label: String, sublabel: String? = null, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(label, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            if (sublabel != null) Text(sublabel, color = TextSecondary, fontSize = 11.sp)
        }
        Switch(
            checked = checked, onCheckedChange = onChange,
            colors = SwitchDefaults.colors(checkedTrackColor = Teal, checkedThumbColor = Color.White),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateField(label: String, value: String, required: Boolean = false, onChange: (String) -> Unit) {
    var show by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
        Row {
            Text(label, color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            if (required) Text(" *", color = com.dealio.app.ui.theme.ErrorRed, fontSize = 12.sp)
        }
        Spacer(Modifier.height(5.dp))
        Row(
            Modifier
                .fillMaxWidth()
                .height(52.dp)
                .background(Color.White, RoundedCornerShape(12.dp))
                .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                .clickable { show = true }
                .padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (value.isBlank()) "Select date" else formatDate(value),
                color = if (value.isBlank()) TextSecondary else TextPrimary, fontSize = 14.sp,
                modifier = Modifier.weight(1f),
            )
            Icon(Icons.Outlined.CalendarMonth, null, tint = TextSecondary, modifier = Modifier.size(18.dp))
        }
    }
    if (show) {
        val pickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { show = false },
            confirmButton = {
                TextButton(onClick = {
                    pickerState.selectedDateMillis?.let { millis ->
                        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
                        onChange(fmt.format(Date(millis)))
                    }
                    show = false
                }) { Text("OK", color = Teal, fontWeight = FontWeight.SemiBold) }
            },
            dismissButton = { TextButton(onClick = { show = false }) { Text("Cancel", color = TextSecondary) } },
        ) { DatePicker(state = pickerState) }
    }
}
