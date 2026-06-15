package com.dealio.app.ui.cp

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.dealio.app.data.CpRepository

/** Base for channel-partner screen view-models; exposes a shared repository. */
abstract class CpViewModel(app: Application) : AndroidViewModel(app) {
    protected val repo = CpRepository(app)
}
