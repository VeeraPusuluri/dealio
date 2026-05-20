package com.dealio.builder.service;

import com.dealio.builder.dto.request.CreateDocumentRequest;
import com.dealio.builder.dto.response.DocumentResponse;
import com.dealio.builder.entity.Document;
import com.dealio.builder.entity.Project;
import com.dealio.builder.enums.DocumentStatus;
import com.dealio.builder.enums.DocumentType;
import com.dealio.builder.exception.ResourceNotFoundException;
import com.dealio.builder.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectService projectService;
    private final BuilderService builderService;

    @Transactional
    public DocumentResponse uploadDocument(CreateDocumentRequest request) {
        Project project = projectService.getProjectEntityById(request.projectId());
        var builder = builderService.getBuilderEntityById(request.builderId());

        Document document = Document.builder()
                .project(project)
                .builder(builder)
                .name(request.name())
                .documentType(request.documentType())
                .status(DocumentStatus.PENDING)
                .fileUrl(request.fileUrl())
                .fileSize(request.fileSize())
                .build();

        Document saved = documentRepository.save(document);
        log.info("Uploaded document with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByProject(Long projectId) {
        return documentRepository.findByProjectId(projectId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByBuilder(Long builderId, Long projectId, DocumentType documentType) {
        return documentRepository.findByBuilderIdWithFilters(builderId, projectId, documentType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(Long id) {
        if (!documentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }
        documentRepository.deleteById(id);
        log.info("Deleted document with id: {}", id);
    }

    private DocumentResponse toResponse(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getProject().getId(),
                document.getProject().getName(),
                document.getBuilder().getId(),
                document.getName(),
                document.getDocumentType(),
                document.getStatus(),
                document.getFileUrl(),
                document.getFileSize(),
                document.getUploadedAt()
        );
    }
}
