package com.dealio.app.data

import android.content.Context
import androidx.core.content.edit

/** Caches the resolved builderId, mirroring the web app's `dealio_builder_id`. */
class BuilderStore(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences("dealio_builder", Context.MODE_PRIVATE)

    var builderId: Long?
        get() = prefs.getLong(KEY_BUILDER_ID, -1L).takeIf { it > 0 }
        set(value) {
            prefs.edit {
                if (value == null) remove(KEY_BUILDER_ID) else putLong(KEY_BUILDER_ID, value)
            }
        }

    fun clear() = prefs.edit { clear() }

    private companion object {
        const val KEY_BUILDER_ID = "builder_id"
    }
}
