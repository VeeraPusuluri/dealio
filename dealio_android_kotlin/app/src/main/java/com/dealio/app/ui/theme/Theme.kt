package com.dealio.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Navy,
    onPrimary = Color.White,
    primaryContainer = NavyMid,
    onPrimaryContainer = Color.White,
    secondary = Teal,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFD9F4F8),
    onSecondaryContainer = TealDeep,
    tertiary = Orange,
    onTertiary = Color.White,
    background = Mist,
    onBackground = TextPrimary,
    surface = Color.White,
    onSurface = TextPrimary,
    surfaceVariant = Color(0xFFEDF1F7),
    onSurfaceVariant = TextSecondary,
    outline = CardBorder,
    error = ErrorRed,
    onError = Color.White,
)

@Composable
fun DealioTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = DealioTypography,
        content = content,
    )
}
