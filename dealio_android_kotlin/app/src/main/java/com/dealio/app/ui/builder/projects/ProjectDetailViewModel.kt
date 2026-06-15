package com.dealio.app.ui.builder.projects

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.dealio.app.data.ApiResult
import com.dealio.app.data.api.Project
import com.dealio.app.data.api.ProjectDocument
import com.dealio.app.ui.builder.BuilderViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProjectDetailState(
    val loading: Boolean = true,
    val error: String? = null,
    val project: Project? = null,
    val documents: List<ProjectDocument> = emptyList(),
)

class ProjectDetailViewModel(app: Application) : BuilderViewModel(app) {

    private val _state = MutableStateFlow(ProjectDetailState())
    val state: StateFlow<ProjectDetailState> = _state.asStateFlow()

    fun load(projectId: Long) {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            when (val r = repo.getProject(projectId)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(loading = false, project = r.data) }
                    when (val docs = repo.getDocuments(projectId)) {
                        is ApiResult.Success -> _state.update { it.copy(documents = docs.data) }
                        is ApiResult.Error -> {}
                    }
                }
                is ApiResult.Error -> _state.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}
