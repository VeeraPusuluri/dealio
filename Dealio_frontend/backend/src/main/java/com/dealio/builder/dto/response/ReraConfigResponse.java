package com.dealio.builder.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReraConfigResponse(
        Long id,
        Long projectId,
        String projectName,
        String reraNumber,
        String reraState,
        LocalDate reraExpiry,
        String portalUrl,
        long daysToExpiry,
        boolean expiringSoon,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
