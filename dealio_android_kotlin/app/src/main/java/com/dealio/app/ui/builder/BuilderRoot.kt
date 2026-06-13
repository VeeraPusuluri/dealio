package com.dealio.app.ui.builder

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Handshake
import androidx.compose.material.icons.filled.SpaceDashboard
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Handshake
import androidx.compose.material.icons.outlined.SpaceDashboard
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.dealio.app.ui.builder.analytics.AnalyticsScreen
import com.dealio.app.ui.builder.broadcast.BroadcastScreen
import com.dealio.app.ui.builder.commissions.CommissionsScreen
import com.dealio.app.ui.builder.cp.CPPerformanceScreen
import com.dealio.app.ui.builder.deals.DealDetailScreen
import com.dealio.app.ui.builder.deals.DealsScreen
import com.dealio.app.ui.builder.loans.LoansScreen
import com.dealio.app.ui.builder.meetings.MeetingsScreen
import com.dealio.app.ui.builder.more.MoreScreen
import com.dealio.app.ui.builder.notifications.NotificationsScreen
import com.dealio.app.ui.builder.overview.OverviewScreen
import com.dealio.app.ui.builder.pipeline.PipelineScreen
import com.dealio.app.ui.builder.projects.ProjectDetailScreen
import com.dealio.app.ui.builder.projects.ProjectFormScreen
import com.dealio.app.ui.builder.projects.ProjectsScreen
import com.dealio.app.ui.builder.rera.ReraScreen
import com.dealio.app.ui.builder.settings.BuilderSettingsScreen
import com.dealio.app.ui.builder.shortlists.ShortlistsScreen
import com.dealio.app.ui.builder.units.UnitMatrixScreen
import com.dealio.app.ui.theme.CardBorder
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

object BuilderRoutes {
    const val HOME = "home"
    const val PROJECTS = "projects"
    const val PIPELINE = "pipeline"
    const val DEALS = "deals"
    const val MORE = "more"

    const val PROJECT_DETAIL = "project_detail"
    const val PROJECT_FORM = "project_form"
    const val DEAL_DETAIL = "deal_detail"
    const val MEETINGS = "meetings"
    const val UNITS = "units"
    const val COMMISSIONS = "commissions"
    const val BROADCAST = "broadcast"
    const val CP_PERFORMANCE = "cp_performance"
    const val ANALYTICS = "analytics"
    const val LOANS = "loans"
    const val RERA = "rera"
    const val SHORTLISTS = "shortlists"
    const val NOTIFICATIONS = "notifications"
    const val SETTINGS = "settings"

    fun projectDetail(id: Long) = "$PROJECT_DETAIL/$id"
    fun dealDetail(id: Long) = "$DEAL_DETAIL/$id"
    fun projectForm(id: Long? = null) = if (id == null) PROJECT_FORM else "$PROJECT_FORM?id=$id"
}

private data class BottomTab(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val icon: ImageVector,
)

private val bottomTabs = listOf(
    BottomTab(BuilderRoutes.HOME, "Home", Icons.Filled.SpaceDashboard, Icons.Outlined.SpaceDashboard),
    BottomTab(BuilderRoutes.PROJECTS, "Projects", Icons.Outlined.Apartment, Icons.Outlined.Apartment),
    BottomTab(BuilderRoutes.PIPELINE, "Pipeline", Icons.Outlined.Groups, Icons.Outlined.Groups),
    BottomTab(BuilderRoutes.DEALS, "Deals", Icons.Filled.Handshake, Icons.Outlined.Handshake),
    BottomTab(BuilderRoutes.MORE, "More", Icons.Filled.GridView, Icons.Outlined.GridView),
)

/** The builder app shell: bottom navigation + nested route host. */
@Composable
fun BuilderRoot(onLogout: () -> Unit) {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val showBottomBar = bottomTabs.any { it.route == currentRoute }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = Color.White, tonalElevation = 0.dp) {
                    val hierarchy = backStack?.destination?.hierarchy
                    bottomTabs.forEach { tab ->
                        val selected = hierarchy?.any { it.route == tab.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(if (selected) tab.selectedIcon else tab.icon, tab.label) },
                            label = { Text(tab.label, fontSize = 11.sp, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Teal,
                                selectedTextColor = Navy,
                                unselectedIconColor = TextSecondary,
                                unselectedTextColor = TextSecondary,
                                indicatorColor = Teal.copy(alpha = 0.12f),
                            ),
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = nav,
            startDestination = BuilderRoutes.HOME,
            modifier = Modifier.fillMaxSize().padding(innerPadding),
        ) {
            composable(BuilderRoutes.HOME) { OverviewScreen(nav) }
            composable(BuilderRoutes.PROJECTS) { ProjectsScreen(nav) }
            composable(BuilderRoutes.PIPELINE) { PipelineScreen(nav) }
            composable(BuilderRoutes.DEALS) { DealsScreen(nav) }
            composable(BuilderRoutes.MORE) { MoreScreen(nav, onLogout) }

            composable(
                "${BuilderRoutes.PROJECT_DETAIL}/{id}",
                arguments = listOf(navArgument("id") { type = NavType.LongType }),
            ) { entry -> ProjectDetailScreen(nav, entry.arguments?.getLong("id") ?: 0) }

            composable(
                "${BuilderRoutes.PROJECT_FORM}?id={id}",
                arguments = listOf(navArgument("id") { type = NavType.LongType; defaultValue = -1L }),
            ) { entry ->
                val id = entry.arguments?.getLong("id") ?: -1L
                ProjectFormScreen(nav, if (id > 0) id else null)
            }

            composable(
                "${BuilderRoutes.DEAL_DETAIL}/{id}",
                arguments = listOf(navArgument("id") { type = NavType.LongType }),
            ) { entry -> DealDetailScreen(nav, entry.arguments?.getLong("id") ?: 0) }

            composable(BuilderRoutes.MEETINGS) { MeetingsScreen(nav) }
            composable(BuilderRoutes.UNITS) { UnitMatrixScreen(nav) }
            composable(BuilderRoutes.COMMISSIONS) { CommissionsScreen(nav) }
            composable(BuilderRoutes.BROADCAST) { BroadcastScreen(nav) }
            composable(BuilderRoutes.CP_PERFORMANCE) { CPPerformanceScreen(nav) }
            composable(BuilderRoutes.ANALYTICS) { AnalyticsScreen(nav) }
            composable(BuilderRoutes.LOANS) { LoansScreen(nav) }
            composable(BuilderRoutes.RERA) { ReraScreen(nav) }
            composable(BuilderRoutes.SHORTLISTS) { ShortlistsScreen(nav) }
            composable(BuilderRoutes.NOTIFICATIONS) { NotificationsScreen(nav) }
            composable(BuilderRoutes.SETTINGS) { BuilderSettingsScreen(nav, onLogout) }
        }
    }
}
