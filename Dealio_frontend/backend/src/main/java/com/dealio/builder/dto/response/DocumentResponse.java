package com.dealio.builder.dto.response;

import com.dealio.builder.enums.DocumentStatus;
import com.dealio.builder.enums.DocumentType;

import java.time.LocalDateTime;

public record DocumentResponse(
        Long id,
        Long projectId,
        String projectName,
        Long builderId,
        String name,
        DocumentType documentType,
        DocumentStatus status,
        String fileUrl,
        String fileSize,
        LocalDateTime uploadedAt
) {}
