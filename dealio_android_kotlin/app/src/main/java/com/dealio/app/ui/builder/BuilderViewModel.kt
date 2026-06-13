package com.dealio.app.ui.builder

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.dealio.app.data.BuilderRepository

/** Base for builder screen view-models; exposes a shared repository instance. */
abstract class BuilderViewModel(app: Application) : AndroidViewModel(app) {
    protected val repo = BuilderRepository(app)
}

/** Generic loading/error/data envelope used by the simpler list screens. */
data class UiState<T>(
    val loading: Boolean = true,
    val error: String? = null,
    val data: T? = null,
)
