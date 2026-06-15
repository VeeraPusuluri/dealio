package com.dealio.app.ui.customer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.dealio.app.data.CustomerRepository

/** Base for customer screen view-models; exposes a shared repository instance. */
abstract class CustomerViewModel(app: Application) : AndroidViewModel(app) {
    protected val repo = CustomerRepository(app)
}
