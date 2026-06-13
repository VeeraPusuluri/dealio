package com.dealio.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.dealio.app.ui.auth.AuthStep
import com.dealio.app.ui.auth.AuthViewModel
import com.dealio.app.ui.components.DealioButton
import com.dealio.app.ui.components.DealioLogo
import com.dealio.app.ui.components.DemoCodeHint
import com.dealio.app.ui.components.ErrorText
import com.dealio.app.ui.components.OtpInput
import com.dealio.app.ui.components.PhoneField
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

@Composable
fun LoginScreen(
    onLoggedIn: () -> Unit,
    onGoToSignup: () -> Unit,
    viewModel: AuthViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsState()

    var countryCode by remember { mutableStateOf("+91") }
    var phone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }

    LaunchedEffect(state.loggedInUser) {
        if (state.loggedInUser != null) onLoggedIn()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
    ) {
        Spacer(Modifier.height(28.dp))
        DealioLogo()
        Spacer(Modifier.height(40.dp))

        if (state.step == AuthStep.DETAILS) {
            Text("Welcome back", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            Text(
                "Sign in with your phone number to continue.",
                style = MaterialTheme.typography.bodyLarge,
                color = TextSecondary,
            )
            Spacer(Modifier.height(32.dp))

            PhoneField(
                countryCode = countryCode,
                onCountryCodeChange = { countryCode = it; viewModel.clearError() },
                phone = phone,
                onPhoneChange = { phone = it; viewModel.clearError() },
                enabled = !state.loading,
            )
            Spacer(Modifier.height(24.dp))
            DealioButton(
                text = "Send code",
                loading = state.loading,
                enabled = phone.length >= 6,
                onClick = { viewModel.sendOtp(isSignup = false, phone = phone, countryCode = countryCode) },
            )
            ErrorText(state.error)
        } else {
            Text("Enter the code", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            Text(
                "We sent a 6-digit code to ${state.maskedPhone ?: "your phone"}.",
                style = MaterialTheme.typography.bodyLarge,
                color = TextSecondary,
            )
            Spacer(Modifier.height(32.dp))

            OtpInput(
                value = otp,
                onValueChange = { otp = it; viewModel.clearError() },
                enabled = !state.loading,
            )
            DemoCodeHint(state.demoCode) { otp = it }
            Spacer(Modifier.height(24.dp))
            DealioButton(
                text = "Verify & sign in",
                loading = state.loading,
                enabled = otp.length == 6,
                onClick = { viewModel.verifyLogin(phone = phone, otp = otp) },
            )
            ErrorText(state.error)
            Spacer(Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = { otp = ""; viewModel.backToDetails() }) {
                    Text("Change number", color = TextSecondary)
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
                        viewModel.sendOtp(isSignup = false, phone = phone, countryCode = countryCode)
                    }) {
                        Text("Resend code", color = Teal, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        Spacer(Modifier.height(40.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("New to Dealio?", color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
            TextButton(onClick = onGoToSignup) {
                Text("Create an account", color = Teal, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
