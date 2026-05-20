package com.dealio.builder.dto.response;

import java.time.LocalDateTime;

public record CallLogResponse(
        Long id,
        Long leadId,
        String customerName,
        String callerName,
        String outcome,
        String notes,
        LocalDateTime createdAt
) {}
