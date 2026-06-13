package com.dealio.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

/** Country code + phone number entry, like the web login. */
@Composable
fun PhoneField(
    countryCode: String,
    onCountryCodeChange: (String) -> Unit,
    phone: String,
    onPhoneChange: (String) -> Unit,
    enabled: Boolean = true,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        OutlinedTextField(
            value = countryCode,
            onValueChange = { new ->
                if (new.length <= 5 && new.all { it.isDigit() || it == '+' }) onCountryCodeChange(new)
            },
            modifier = Modifier.width(92.dp),
            enabled = enabled,
            singleLine = true,
            label = { Text("Code") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            shape = RoundedCornerShape(14.dp),
            colors = dealioFieldColors(),
        )
        OutlinedTextField(
            value = phone,
            onValueChange = { new ->
                if (new.length <= 15 && new.all { it.isDigit() }) onPhoneChange(new)
            },
            modifier = Modifier.weight(1f),
            enabled = enabled,
            singleLine = true,
            label = { Text("Phone number") },
            placeholder = { Text("9876543210") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            shape = RoundedCornerShape(14.dp),
            colors = dealioFieldColors(),
        )
    }
}

@Composable
fun dealioFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Teal,
    focusedLabelColor = Teal,
    cursorColor = Teal,
    unfocusedBorderColor = CardBorder,
)

/** Six-box OTP input. The real text field sits invisible on top of the boxes. */
@Composable
fun OtpInput(
    value: String,
    onValueChange: (String) -> Unit,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
) {
    BasicTextField(
        value = value,
        onValueChange = { new ->
            if (new.length <= 6 && new.all { it.isDigit() }) onValueChange(new)
        },
        enabled = enabled,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        modifier = modifier,
        decorationBox = { innerTextField ->
            Box {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    repeat(6) { index ->
                        val char = value.getOrNull(index)?.toString() ?: ""
                        val isActive = enabled && value.length == index
                        Box(
                            modifier = Modifier
                                .width(46.dp)
                                .height(56.dp)
                                .background(Color.White, RoundedCornerShape(12.dp))
                                .border(
                                    width = if (isActive) 2.dp else 1.dp,
                                    color = if (isActive) Teal else CardBorder,
                                    shape = RoundedCornerShape(12.dp),
                                ),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = char,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = Navy,
                            )
                        }
                    }
                }
                // Invisible editable layer over the boxes — taps focus it
                Box(Modifier.matchParentSize().alpha(0f)) { innerTextField() }
            }
        },
    )
}

/** Full-width navy primary button with a loading spinner state. */
@Composable
fun DealioButton(
    text: String,
    onClick: () -> Unit,
    loading: Boolean = false,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Navy,
            contentColor = Color.White,
            disabledContainerColor = Navy.copy(alpha = 0.4f),
            disabledContentColor = Color.White.copy(alpha = 0.8f),
        ),
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                color = Color.White,
                strokeWidth = 2.5.dp,
            )
        } else {
            Text(text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

/** Error banner shown under the form. */
@Composable
fun ErrorText(message: String?) {
    if (!message.isNullOrBlank()) {
        Text(
            text = message,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
        )
    }
}

/** Dev-only helper chip: the backend echoes the OTP outside production. */
@Composable
fun DemoCodeHint(demoCode: String?, onFill: (String) -> Unit) {
    if (demoCode.isNullOrBlank()) return
    Box(
        modifier = Modifier
            .padding(top = 12.dp)
            .background(Teal.copy(alpha = 0.10f), RoundedCornerShape(10.dp))
            .border(1.dp, Teal.copy(alpha = 0.35f), RoundedCornerShape(10.dp))
            .clickable { onFill(demoCode) }
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text(
            text = "Dev code: $demoCode — tap to fill",
            color = TextSecondary,
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}
