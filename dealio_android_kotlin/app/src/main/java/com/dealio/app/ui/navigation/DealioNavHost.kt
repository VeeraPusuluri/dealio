package com.dealio.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.dealio.app.data.BuilderStore
import com.dealio.app.data.TokenStore
import com.dealio.app.ui.builder.BuilderRoot
import com.dealio.app.ui.screens.HomeScreen
import com.dealio.app.ui.screens.LoginScreen
import com.dealio.app.ui.screens.SignupScreen
import com.dealio.app.ui.screens.SplashScreen

object Routes {
    const val SPLASH = "splash"
    const val LOGIN = "login"
    const val SIGNUP = "signup"
    const val HOME = "home"
}

@Composable
fun DealioNavHost() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val tokenStore = remember { TokenStore(context) }

    NavHost(navController = navController, startDestination = Routes.SPLASH) {

        composable(Routes.SPLASH) {
            SplashScreen(
                onFinished = {
                    val next = if (tokenStore.isLoggedIn) Routes.HOME else Routes.LOGIN
                    navController.navigate(next) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.LOGIN) {
            LoginScreen(
                onLoggedIn = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onGoToSignup = {
                    navController.navigate(Routes.SIGNUP) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.SIGNUP) {
            SignupScreen(
                onSignedUp = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onGoToLogin = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.SIGNUP) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.HOME) {
            val logout: () -> Unit = {
                tokenStore.clear()
                BuilderStore(context).clear()
                navController.navigate(Routes.LOGIN) {
                    popUpTo(0) { inclusive = true }
                }
            }
            // Builders get the full bottom-nav app; other roles see the placeholder for now.
            if (tokenStore.user()?.role.equals("BUILDER", ignoreCase = true)) {
                BuilderRoot(onLogout = logout)
            } else {
                HomeScreen(onLogout = logout)
            }
        }
    }
}
