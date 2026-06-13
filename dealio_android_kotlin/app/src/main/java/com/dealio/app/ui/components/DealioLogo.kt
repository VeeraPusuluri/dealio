package com.dealio.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.TextUnit
import com.dealio.app.R
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.NavyDeep
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TealBright

/** The squared D-mark on its navy gradient tile, same as the web logo. */
@Composable
fun DealioMark(size: Dp, cornerRadius: Dp = size / 4) {
    Box(
        modifier = Modifier
            .size(size)
            .background(
                brush = Brush.linearGradient(listOf(NavyDeep, Color(0xFF0E2542), NavyMid)),
                shape = RoundedCornerShape(cornerRadius),
            )
            .border(
                width = 1.5.dp,
                color = TealBright.copy(alpha = 0.25f),
                shape = RoundedCornerShape(cornerRadius),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_dealio_mark),
            contentDescription = "Dealio",
            modifier = Modifier.size(size * 0.55f),
        )
    }
}

private fun wordmark(onDark: Boolean): AnnotatedString = buildAnnotatedString {
    withStyle(SpanStyle(color = if (onDark) Color.White else Navy)) { append("Deal") }
    withStyle(SpanStyle(color = if (onDark) TealBright else Teal)) { append("io") }
}

/** Mark + "Dealio" wordmark, horizontally. */
@Composable
fun DealioLogo(
    markSize: Dp = 36.dp,
    fontSize: TextUnit = 20.sp,
    onDark: Boolean = false,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        DealioMark(size = markSize)
        Box(Modifier.width(markSize / 3))
        Text(
            text = wordmark(onDark),
            fontSize = fontSize,
            fontWeight = FontWeight.Bold,
            letterSpacing = (-0.5).sp,
        )
    }
}
