package com.dealio.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dealio.app.ui.theme.NavyDeep
import com.dealio.app.ui.theme.NavyMid
import com.dealio.app.ui.theme.NavyPrimary
import com.dealio.app.ui.theme.TealBright

/**
 * Branded shell for the auth screens: a navy gradient hero carrying the Dealio
 * mark, a headline/subtitle and soft decorative orbs, flowing into a white form
 * area below. The [content] slot holds the step-specific fields and actions.
 */
@Composable
fun AuthScaffold(
    headline: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Box(Modifier.fillMaxSize().background(Color.White)) {
        Column(
            Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState()),
        ) {
            // ── Brand hero ──
            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(bottomStart = 34.dp, bottomEnd = 34.dp))
                    .background(Brush.verticalGradient(listOf(NavyDeep, NavyMid, NavyPrimary))),
            ) {
                // Decorative orbs (clipped by the hero's rounded rect)
                Box(
                    Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 56.dp, y = (-44).dp)
                        .size(176.dp)
                        .background(TealBright.copy(alpha = 0.10f), CircleShape),
                )
                Box(
                    Modifier
                        .align(Alignment.CenterEnd)
                        .offset(x = 90.dp, y = 30.dp)
                        .size(150.dp)
                        .background(TealBright.copy(alpha = 0.07f), CircleShape),
                )
                Box(
                    Modifier
                        .align(Alignment.BottomStart)
                        .offset(x = (-40).dp, y = 30.dp)
                        .size(150.dp)
                        .background(Color.White.copy(alpha = 0.04f), CircleShape),
                )

                Column(
                    Modifier
                        .systemBarsPadding()
                        .padding(start = 26.dp, end = 26.dp, top = 26.dp, bottom = 40.dp),
                ) {
                    DealioLogo(onDark = true)
                    Spacer(Modifier.height(40.dp))
                    Text(
                        headline,
                        color = Color.White,
                        fontSize = 30.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.5).sp,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        subtitle,
                        color = Color.White.copy(alpha = 0.78f),
                        fontSize = 15.sp,
                        lineHeight = 21.sp,
                    )
                }
            }

            // ── Form area ──
            Spacer(Modifier.height(28.dp))
            Column(Modifier.fillMaxWidth().padding(horizontal = 26.dp), content = content)
            Spacer(Modifier.height(28.dp))
        }
    }
}
