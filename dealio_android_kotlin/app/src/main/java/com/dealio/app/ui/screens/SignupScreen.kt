package com.dealio.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.dealio.app.ui.auth.AuthStep
import com.dealio.app.ui.auth.AuthViewModel
import com.dealio.app.ui.components.AuthScaffold
import com.dealio.app.ui.components.DealioButton
import com.dealio.app.ui.components.DemoCodeHint
import com.dealio.app.ui.components.ErrorText
import com.dealio.app.ui.components.OtpInput
import com.dealio.app.ui.components.PhoneField
import com.dealio.app.ui.components.dealioFieldColors
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

/** Same self-service roles the web signup offers (Signup.tsx). */
private val signupRoles = listOf(
    "CUSTOMER" to "Customer",
    "CP" to "Channel Partner",
    "BUILDER" to "Builder",
    "BANK" to "Bank",
    "NRI" to "NRI",
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SignupScreen(
    onSignedUp: () -> Unit,
    onGoToLogin: () -> Unit,
    viewModel: AuthViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsState()

    var fullName by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("CUSTOMER") }
    var countryCode by remember { mutableStateOf("+91") }
    var phone by remember { mutableStateOf("") }
    var referralCode by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }

    LaunchedEffect(state.loggedInUser) {
        if (state.loggedInUser != null) onSignedUp()
    }

    val onDetails = state.step == AuthStep.DETAILS
    AuthScaffold(
        headline = if (onDetails) "Create your account" else "Verify your phone",
        subtitle = if (onDetails) "Join Dealio — free forever, for every role."
        else "We sent a 6-digit code to ${state.maskedPhone ?: "your phone"}.",
    ) {
        if (onDetails) {
            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it; viewModel.clearError() },
                modifier = Modifier.fillMaxWidth(),
                enabled = !state.loading,
                singleLine = true,
                label = { Text("Full name") },
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                shape = RoundedCornerShape(14.dp),
                colors = dealioFieldColors(),
            )
            Spacer(Modifier.height(20.dp))

            Text(
                "I am a…",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                signupRoles.forEach { (value, label) ->
                    FilterChip(
                        selected = role == value,
                        onClick = { role = value },
                        enabled = !state.loading,
                        label = { Text(label) },
                        shape = RoundedCornerShape(10.dp),
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Navy,
                            selectedLabelColor = Color.White,
                        ),
                    )
                }
            }
            Spacer(Modifier.height(20.dp))

            PhoneField(
                countryCode = countryCode,
                onCountryCodeChange = { countryCode = it; viewModel.clearError() },
                phone = phone,
                onPhoneChange = { phone = it; viewModel.clearError() },
                enabled = !state.loading,
            )
            Spacer(Modifier.height(20.dp))

            OutlinedTextField(
                value = referralCode,
                onValueChange = { referralCode = it.uppercase(); viewModel.clearError() },
                modifier = Modifier.fillMaxWidth(),
                enabled = !state.loading,
                singleLine = true,
                label = { Text("Referral code (optional)") },
                placeholder = { Text("CP-JOHN-42") },
                shape = RoundedCornerShape(14.dp),
                colors = dealioFieldColors(),
            )
            Spacer(Modifier.height(28.dp))

            DealioButton(
                text = "Send code",
                loading = state.loading,
                enabled = phone.length >= 6 && fullName.isNotBlank(),
                onClick = { viewModel.sendOtp(isSignup = true, phone = phone, countryCode = countryCode) },
            )
            ErrorText(state.error)
        } else {
            OtpInput(
                value = otp,
                onValueChange = { otp = it; viewModel.clearError() },
                enabled = !state.loading,
            )
            DemoCodeHint(state.demoCode) { otp = it }
            Spacer(Modifier.height(24.dp))
            DealioButton(
                text = "Verify & create account",
                loading = state.loading,
                enabled = otp.length == 6,
                onClick = {
                    viewModel.verifySignup(
                        phone = phone,
                        otp = otp,
                        fullName = fullName,
                        role = role,
                        referralCode = referralCode,
                    )
                },
            )
            ErrorText(state.error)
            Spacer(Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = { otp = ""; viewModel.backToDetails() }) {
                    Text("Edit details", color = TextSecondary)
                }
                if (state.resendSecondsLeft > 0) {
                    Text(
                        "Resend in ${state.resendSecondsLeft}s",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                    )
                } else {
                    TextButton(onClick = {
                        otp = ""
                        viewModel.sendOtp(isSignup = true, phone = phone, countryCode = countryCode)
                    }) {
                        Text("Resend code", color = Teal, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        Spacer(Modifier.height(28.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Already have an account?", color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
            TextButton(onClick = onGoToLogin) {
                Text("Sign in", color = Teal, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
