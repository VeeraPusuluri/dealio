package com.dealio.app.ui.cp

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.SpaceDashboard
import androidx.compose.material.icons.outlined.Apartment
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Payments
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
import com.dealio.app.ui.cp.calllogs.CallLogsScreen
import com.dealio.app.ui.cp.contacts.ContactsScreen
import com.dealio.app.ui.cp.earnings.EarningsScreen
import com.dealio.app.ui.cp.followups.FollowUpsScreen
import com.dealio.app.ui.cp.leads.CpDealDetailScreen
import com.dealio.app.ui.cp.leads.LeadsScreen
import com.dealio.app.ui.cp.meetings.CpMeetingsScreen
import com.dealio.app.ui.cp.more.CpMoreScreen
import com.dealio.app.ui.cp.notifications.CpNotificationsScreen
import com.dealio.app.ui.cp.overview.CpOverviewScreen
import com.dealio.app.ui.cp.profile.CpProfileScreen
import com.dealio.app.ui.cp.projects.CpProjectDetailScreen
import com.dealio.app.ui.cp.projects.CpProjectsScreen
import com.dealio.app.ui.theme.Navy
import com.dealio.app.ui.theme.Teal
import com.dealio.app.ui.theme.TextSecondary

object CpRoutes {
    const val HOME = "cp_home"
    const val LEADS = "cp_leads"
    const val PROJECTS = "cp_projects"
    const val EARNINGS = "cp_earnings"
    const val MORE = "cp_more"

    const val DEAL_DETAIL = "cp_deal_detail"
    const val PROJECT_DETAIL = "cp_project_detail"
    const val CONTACTS = "cp_contacts"
    const val FOLLOWUPS = "cp_followups"
    const val CALLLOGS = "cp_calllogs"
    const val MEETINGS = "cp_meetings"
    const val PROFILE = "cp_profile"
    const val NOTIFICATIONS = "cp_notifications"

    fun dealDetail(id: Long) = "$DEAL_DETAIL/$id"
    fun projectDetail(id: Long) = "$PROJECT_DETAIL/$id"
}

private data class CpTab(val route: String, val label: String, val selectedIcon: ImageVector, val icon: ImageVector)

private val tabs = listOf(
    CpTab(CpRoutes.HOME, "Home", Icons.Filled.SpaceDashboard, Icons.Outlined.SpaceDashboard),
    CpTab(CpRoutes.LEADS, "Leads", Icons.Outlined.Groups, Icons.Outlined.Groups),
    CpTab(CpRoutes.PROJECTS, "Projects", Icons.Outlined.Apartment, Icons.Outlined.Apartment),
    CpTab(CpRoutes.EARNINGS, "Earnings", Icons.Outlined.Payments, Icons.Outlined.Payments),
    CpTab(CpRoutes.MORE, "More", Icons.Filled.GridView, Icons.Outlined.GridView),
)

/** The channel-partner app shell: bottom navigation + nested route host. */
@Composable
fun CpRoot(onLogout: () -> Unit) {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val showBottomBar = tabs.any { it.route == currentRoute }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = Color.White, tonalElevation = 0.dp) {
                    val hierarchy = backStack?.destination?.hierarchy
                    tabs.forEach { tab ->
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
    ) { inner ->
        NavHost(
            navController = nav,
            startDestination = CpRoutes.HOME,
            modifier = Modifier.fillMaxSize().padding(inner),
        ) {
            composable(CpRoutes.HOME) { CpOverviewScreen(nav) }
            composable(CpRoutes.LEADS) { LeadsScreen(nav) }
            composable(CpRoutes.PROJECTS) { CpProjectsScreen(nav) }
            composable(CpRoutes.EARNINGS) { EarningsScreen(nav) }
            composable(CpRoutes.MORE) { CpMoreScreen(nav, onLogout) }

            composable(
                "${CpRoutes.DEAL_DETAIL}/{id}",
                arguments = listOf(navArgument("id") { type = NavType.LongType }),
            ) { e -> CpDealDetailScreen(nav, e.arguments?.getLong("id") ?: 0) }

            composable(
                "${CpRoutes.PROJECT_DETAIL}/{id}",
                arguments = listOf(navArgument("id") { type = NavType.LongType }),
            ) { e -> CpProjectDetailScreen(nav, e.arguments?.getLong("id") ?: 0) }

            composable(CpRoutes.CONTACTS) { ContactsScreen(nav) }
            composable(CpRoutes.FOLLOWUPS) { FollowUpsScreen(nav) }
            composable(CpRoutes.CALLLOGS) { CallLogsScreen(nav) }
            composable(CpRoutes.MEETINGS) { CpMeetingsScreen(nav) }
            composable(CpRoutes.PROFILE) { CpProfileScreen(nav) }
            composable(CpRoutes.NOTIFICATIONS) { CpNotificationsScreen(nav) }
        }
    }
}
