package com.dealio.app.data

import android.content.Context
import androidx.core.content.edit
import com.dealio.app.data.api.AuthData
import com.dealio.app.data.api.AuthUser

/**
 * Persists the JWT pair and the signed-in user, mirroring the web app's
 * `dealio_access_token` / `dealio_refresh_token` localStorage keys.
 */
class TokenStore(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences("dealio_auth", Context.MODE_PRIVATE)

    val isLoggedIn: Boolean
        get() = prefs.getString(KEY_ACCESS_TOKEN, null) != null

    /** Raw JWT access token, used to authorize builder/customer API calls. */
    val accessToken: String?
        get() = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun save(auth: AuthData) {
        prefs.edit {
            putString(KEY_ACCESS_TOKEN, auth.accessToken)
            putString(KEY_REFRESH_TOKEN, auth.refreshToken)
            putLong(KEY_USER_ID, auth.user.id)
            putString(KEY_FULL_NAME, auth.user.fullName)
            putString(KEY_PHONE, auth.user.phone)
            putString(KEY_ROLE, auth.user.role)
            putString(KEY_EMAIL, auth.user.email)
        }
    }

    fun user(): AuthUser? {
        if (!isLoggedIn) return null
        return AuthUser(
            id = prefs.getLong(KEY_USER_ID, -1),
            fullName = prefs.getString(KEY_FULL_NAME, null),
            phone = prefs.getString(KEY_PHONE, "") ?: "",
            role = prefs.getString(KEY_ROLE, "CUSTOMER") ?: "CUSTOMER",
            email = prefs.getString(KEY_EMAIL, null),
        )
    }

    fun clear() {
        prefs.edit { clear() }
    }

    private companion object {
        const val KEY_ACCESS_TOKEN = "access_token"
        const val KEY_REFRESH_TOKEN = "refresh_token"
        const val KEY_USER_ID = "user_id"
        const val KEY_FULL_NAME = "full_name"
        const val KEY_PHONE = "phone"
        const val KEY_ROLE = "role"
        const val KEY_EMAIL = "email"
    }
}
